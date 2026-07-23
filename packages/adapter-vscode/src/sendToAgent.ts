import * as vscode from 'vscode';
import { SavedPattern } from '@ai-skill/skill-core';

const LOOP_LABELS: Record<SavedPattern['loopType'], string> = {
  TYPE_ERROR_LOOP: 'type error',
  TEST_FIX_LOOP: 'test failure',
  API_SCHEMA_LOOP: 'API/schema error'
};

function log(message: string): void {
  vscode.window.createOutputChannel('Reflex').appendLine(`[use-in-agent] ${message}`);
}

/** Build a short prompt the coding agent can act on from a saved pattern. */
export function formatPatternPrompt(pattern: SavedPattern): string {
  const files =
    pattern.filesInvolved.length > 0 ? pattern.filesInvolved.join(', ') : '(unknown)';
  return [
    'Reflex learned pattern — reuse this fix for the current problem.',
    '',
    `Problem type: ${LOOP_LABELS[pattern.loopType]}`,
    `Files involved: ${files}`,
    `Fix summary: ${pattern.fixSummary}`,
    '',
    'Apply this approach rather than rediscovering it from scratch.'
  ].join('\n');
}

function isCursorHost(): boolean {
  return /cursor/i.test(vscode.env.appName);
}

async function tryExecute(command: string, ...args: unknown[]): Promise<boolean> {
  try {
    await vscode.commands.executeCommand(command, ...args);
    return true;
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Put the pattern into the active agent chat when the host allows it.
 * VS Code: workbench.action.chat.open with query.
 * Cursor: open composer + paste (chat.open often no-ops the query here).
 * Last resort: leave text on the clipboard and tell the user to paste.
 */
export async function sendPatternToAgent(pattern: SavedPattern): Promise<void> {
  const prompt = formatPatternPrompt(pattern);
  const forceClipboard = vscode.workspace
    .getConfiguration('reflex')
    .get<boolean>('forceClipboardAgentFallback', false);

  if (forceClipboard) {
    await vscode.env.clipboard.writeText(prompt);
    log('forced clipboard fallback (reflex.forceClipboardAgentFallback)');
    void vscode.window.showInformationMessage(
      'Reflex pattern copied. Paste it into Agent chat (Ctrl/Cmd+V).'
    );
    return;
  }

  // On Cursor, chat.open may resolve without inserting the query — prefer composer paste.
  if (!isCursorHost()) {
    if (await tryExecute('workbench.action.chat.open', { query: prompt, isPartialQuery: true })) {
      log('inserted via workbench.action.chat.open ({ query })');
      return;
    }
    if (await tryExecute('workbench.action.chat.open', prompt)) {
      log('inserted via workbench.action.chat.open (string)');
      return;
    }
    log('workbench.action.chat.open unavailable');
  } else {
    log('Cursor host — skipping workbench.action.chat.open, trying composer paste');
  }

  const previousClipboard = await vscode.env.clipboard.readText();
  await vscode.env.clipboard.writeText(prompt);

  const cursorOpenCommands = [
    'composer.newAgentChat',
    'composer.createNewComposerTab',
    'aichat.newchataction'
  ];

  for (const openCmd of cursorOpenCommands) {
    if (!(await tryExecute(openCmd))) {
      log(`open failed: ${openCmd}`);
      continue;
    }
    log(`opened with ${openCmd}`);
    await delay(300);
    if (await tryExecute('editor.action.clipboardPasteAction')) {
      log('pasted into focused input');
      await vscode.env.clipboard.writeText(previousClipboard);
      return;
    }
    log('paste command failed after open');
  }

  // Prompt remains on clipboard for manual paste.
  log('falling back to clipboard-only');
  void vscode.window.showInformationMessage(
    'Reflex pattern copied. Paste it into Agent chat (Ctrl/Cmd+V).'
  );
}
