import * as vscode from 'vscode';
import {
  TraceRecord,
  detectPartialMatchStart,
  findRelevantPattern,
  recordOutcome,
  SavedPattern
} from '@ai-skill/skill-core';

const shownPatternIds = new Set<string>();
let statusBarItem: vscode.StatusBarItem | null = null;
let activePattern: SavedPattern | null = null;

function disposeStatusBar(): void {
  statusBarItem?.dispose();
  statusBarItem = null;
  activePattern = null;
}

async function showPatternDetail(pattern: SavedPattern): Promise<void> {
  const choice = await vscode.window.showInformationMessage(
    pattern.fixSummary,
    'Helped',
    "Didn't help",
    'Dismiss'
  );

  const thumbsUp = choice === 'Helped' ? true : choice === "Didn't help" ? false : null;
  recordOutcome(pattern.id, {
    wasShown: true,
    userClickedView: true,
    thumbsUp
  });
}

function showPatternStatusBar(pattern: SavedPattern): void {
  disposeStatusBar();
  activePattern = pattern;
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = '$(lightbulb) Pattern available: fixed this before';
  statusBarItem.tooltip = 'Click to view saved fix';
  statusBarItem.command = 'aiSkillEvolution.viewPattern';
  statusBarItem.show();

  recordOutcome(pattern.id, {
    wasShown: true,
    userClickedView: false,
    thumbsUp: null
  });
}

export function registerPatternReplay(context: vscode.ExtensionContext): void {
  context.subscriptions.push({ dispose: disposeStatusBar });

  context.subscriptions.push(
    vscode.commands.registerCommand('aiSkillEvolution.viewPattern', () => {
      if (activePattern) {
        void showPatternDetail(activePattern);
      }
    })
  );
}

export function runPartialPatternReplay(
  latestTrace: TraceRecord,
  trigger: 'command' | 'error' | 'file'
): void {
  if (trigger === 'file') {
    return;
  }

  const partial = detectPartialMatchStart(latestTrace);
  if (!partial) {
    return;
  }

  const pattern = findRelevantPattern(partial);
  if (!pattern) {
    return;
  }

  if (shownPatternIds.has(pattern.id)) {
    return;
  }

  shownPatternIds.add(pattern.id);
  showPatternStatusBar(pattern);
}
