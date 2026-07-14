import * as vscode from 'vscode';
import * as path from 'path';
import { initCaptureStore, closeCaptureStore, initPatternStore } from '@ai-skill/skill-core';
import {
  getConsentState,
  promptConsentModal,
  promptConsentToast,
  resetConsent,
  setConsent
} from './consent';
import { TraceBuilder } from './traceBuilder';
import { registerFileCapture } from './listeners/fileCapture';
import { registerTerminalListener } from './listeners/onTerminalOutput';
import { registerPatternReplay } from './patternReplay';
import { registerTerminalProbe } from './listeners/terminalProbe';

const OUTPUT_CHANNEL_NAME = 'Reflex';

let runtimeStarted = false;
let statusBar: vscode.StatusBarItem | null = null;
let probeChannel: vscode.OutputChannel | null = null;

function updateStatusBar(enabled: boolean): void {
  if (!statusBar) return;
  if (enabled) {
    statusBar.text = '$(pulse) Reflex';
    statusBar.tooltip = 'Reflex is capturing workflows locally. Click for activity.';
    statusBar.backgroundColor = undefined;
  } else {
    statusBar.text = '$(circle-slash) Reflex: click to enable';
    statusBar.tooltip = 'Reflex is installed but not capturing yet. Click to enable.';
    statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  }
  statusBar.show();
}

async function startRuntime(
  context: vscode.ExtensionContext,
  channel: vscode.OutputChannel
): Promise<boolean> {
  if (runtimeStarted) {
    return true;
  }

  try {
    const dbPath = path.join(context.globalStorageUri.fsPath, 'traces.db');
    const sqlJsDistDir = path.join(context.extensionPath, 'vendor', 'sql.js', 'dist');
    await initCaptureStore({ dbPath, sqlJsDistDir });
    channel.appendLine('[reflex] Ready — capturing locally.');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    channel.appendLine(`[reflex] ERROR: Failed to start: ${msg}`);
    vscode.window.showErrorMessage(`Reflex failed to start: ${msg}`);
    return false;
  }

  context.subscriptions.push({ dispose: () => closeCaptureStore() });

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (workspaceRoot) {
    initPatternStore({ workspaceRoot });
    channel.appendLine('[reflex] Pattern memory ready for this project.');
  } else {
    channel.appendLine('[reflex] Open a folder to save reusable patterns.');
  }

  registerPatternReplay(context);
  registerTerminalProbe(context, channel);

  const builder = new TraceBuilder();
  builder.setOutputChannel(channel);
  registerFileCapture(context, builder, channel);
  registerTerminalListener(context, builder, channel);

  runtimeStarted = true;
  updateStatusBar(true);
  return true;
}

async function enableFromUi(context: vscode.ExtensionContext, useModal = false): Promise<void> {
  const channel = probeChannel!;
  const enabled = useModal ? await promptConsentModal() : await promptConsentToast();
  if (!enabled) {
    await setConsent(context, false);
    updateStatusBar(false);
    channel.appendLine('[reflex] Waiting — click “Reflex” in the status bar to enable.');
    return;
  }

  await setConsent(context, true);
  const ok = await startRuntime(context, channel);
  if (ok) {
    vscode.window.showInformationMessage('Reflex is on. Keep coding — it runs in the background.');
  }
}

function isRuntimeActive(context: vscode.ExtensionContext): boolean {
  return runtimeStarted && getConsentState(context) === 'granted';
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  probeChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  context.subscriptions.push(probeChannel);

  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
  statusBar.command = 'reflex.statusBarClick';
  context.subscriptions.push(statusBar);
  updateStatusBar(false);

  context.subscriptions.push(
    vscode.commands.registerCommand('aiSkillEvolution.showProbe', () => {
      probeChannel?.show(true);
    }),
    vscode.commands.registerCommand('reflex.showActivity', () => {
      probeChannel?.show(true);
    }),
    vscode.commands.registerCommand('aiSkillEvolution.resetConsent', async () => {
      await resetConsent(context);
      runtimeStarted = false;
      updateStatusBar(false);
      await enableFromUi(context, true);
    }),
    vscode.commands.registerCommand('reflex.enable', async () => {
      await enableFromUi(context, false);
    }),
    vscode.commands.registerCommand('reflex.statusBarClick', async () => {
      if (isRuntimeActive(context)) {
        probeChannel?.show(true);
        return;
      }
      await enableFromUi(context, false);
    }),
    vscode.commands.registerCommand('aiSkillEvolution.probeTerminal', () => {
      probeChannel?.show(true);
    })
  );

  const state = getConsentState(context);
  // Isolated E2E / CI: launch Cursor with REFLEX_AUTO_ENABLE=1 to skip the enable UI.
  const autoEnable = process.env.REFLEX_AUTO_ENABLE === '1';

  // Already enabled (or auto) — start immediately.
  if (autoEnable || state === 'granted') {
    if (autoEnable && state !== 'granted') {
      await setConsent(context, true);
    }
    const ok = await startRuntime(context, probeChannel);
    if (ok) {
      updateStatusBar(true);
    }
    return;
  }

  // First run: prompt WITHOUT blocking activation (status bar is already visible).
  if (state === 'unknown') {
    probeChannel.appendLine('[reflex] Waiting for Enable…');
    void enableFromUi(context, true);
    return;
  }

  // Previously declined — soft reminder, status bar remains the path back in.
  probeChannel.appendLine('[reflex] Waiting — click “Reflex” in the status bar to enable.');
  void vscode.window
    .showInformationMessage('Reflex is installed. Enable it to start learning from your workflows.', 'Enable', 'Later')
    .then(async (choice) => {
      if (choice === 'Enable') {
        await setConsent(context, true);
        const ok = await startRuntime(context, probeChannel!);
        if (ok) {
          vscode.window.showInformationMessage('Reflex is on. Keep coding — it runs in the background.');
        }
      }
    });
}

export function deactivate(): void {
  closeCaptureStore();
  runtimeStarted = false;
}
