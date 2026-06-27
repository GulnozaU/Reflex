import * as vscode from 'vscode';
import * as path from 'path';
import { initCaptureStore, closeCaptureStore, initPatternStore } from '@ai-skill/skill-core';
import { ensureConsent, resetConsent } from './consent';
import { TraceBuilder } from './traceBuilder';
import { registerFileCapture } from './listeners/fileCapture';
import { registerTerminalListener } from './listeners/onTerminalOutput';
import { registerPatternReplay } from './patternReplay';
import { registerTerminalProbe } from './listeners/terminalProbe';

const PROBE_CHANNEL_NAME = 'AI Skill Terminal Probe';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // Create output channel immediately so it always appears in the dropdown
  const probeChannel = vscode.window.createOutputChannel(PROBE_CHANNEL_NAME);
  context.subscriptions.push(probeChannel);

  context.subscriptions.push(
    vscode.commands.registerCommand('aiSkillEvolution.showProbe', () => {
      probeChannel.show(true);
    }),
    vscode.commands.registerCommand('aiSkillEvolution.resetConsent', async () => {
      await resetConsent(context);
      vscode.window.showInformationMessage(
        'AI Skill consent reset. Reload the window (Cmd+Shift+P → Developer: Reload Window) to see the consent dialog again.'
      );
    })
  );

  const granted = await ensureConsent(context);
  if (!granted) {
    probeChannel.appendLine('[ai-skill] Capture disabled — click Enable on the consent dialog to start.');
    probeChannel.appendLine('[ai-skill] Previously declined? Run command: AI Skill: Reset Consent');
    probeChannel.show(true);
    return;
  }

  probeChannel.appendLine('[ai-skill] Consent granted. Initializing...');
  probeChannel.show(true);

  try {
    const dbPath = path.join(context.globalStorageUri.fsPath, 'traces.db');
    await initCaptureStore({ dbPath });
    probeChannel.appendLine(`[ai-skill] Database ready at ${dbPath}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    probeChannel.appendLine(`[ai-skill] ERROR: Failed to init database: ${msg}`);
    probeChannel.show(true);
    vscode.window.showErrorMessage(`AI Skill Evolution failed to start: ${msg}`);
    return;
  }

  context.subscriptions.push({ dispose: () => closeCaptureStore() });

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (workspaceRoot) {
    initPatternStore({ workspaceRoot });
    probeChannel.appendLine(`[ai-skill] Pattern store ready at ${workspaceRoot}/.local-patterns/`);
  } else {
    probeChannel.appendLine('[ai-skill] No workspace folder — pattern save disabled.');
  }

  registerPatternReplay(context);
  registerTerminalProbe(context, probeChannel);

  const builder = new TraceBuilder();
  builder.setOutputChannel(probeChannel);
  registerFileCapture(context, builder, probeChannel);
  registerTerminalListener(context, builder, probeChannel);

  context.subscriptions.push(
    vscode.commands.registerCommand('aiSkillEvolution.probeTerminal', () => {
      probeChannel.show(true);
      vscode.window.showInformationMessage(
        'Check Output → AI Skill Terminal Probe. Run a command in the integrated terminal.'
      );
    })
  );

  vscode.window.showInformationMessage(
    'AI Skill Evolution is active. Output → AI Skill Terminal Probe is open.'
  );
}

export function deactivate(): void {
  closeCaptureStore();
}
