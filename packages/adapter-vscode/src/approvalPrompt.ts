import * as vscode from 'vscode';
import {
  LoopMatch,
  getRepeatCount,
  getTotalLoopMinutes,
  recordLoopOccurrence,
  savePattern,
  extractFixSummary,
  getLastTraces,
  hasRecordedOccurrence,
  computeApprovalStats,
  occurrenceMatchKey,
  buildApprovalMessage
} from '@ai-skill/skill-core';

const handledMatches = new Set<string>();
const pendingMatches = new Set<string>();

export { buildApprovalMessage, formatMinutes } from '@ai-skill/skill-core';

export async function maybePromptForPatternSave(
  match: LoopMatch,
  channel: vscode.OutputChannel
): Promise<void> {
  const key = occurrenceMatchKey(match);
  if (handledMatches.has(key) || pendingMatches.has(key)) {
    return;
  }

  if (hasRecordedOccurrence(match)) {
    handledMatches.add(key);
    return;
  }

  const priorCount = getRepeatCount(match.loopType, match.filesInvolved);
  const priorMinutes = getTotalLoopMinutes(match.loopType, match.filesInvolved);
  const stats = computeApprovalStats(priorCount, priorMinutes, match);

  if (!stats.shouldPrompt) {
    recordLoopOccurrence(match);
    handledMatches.add(key);
    return;
  }

  pendingMatches.add(key);
  const message = buildApprovalMessage(match, stats.occurrenceCount, stats.totalMinutesSpent);

  channel.appendLine(`[loop-prompt] ${message}`);

  const choice = await vscode.window.showInformationMessage(message, 'Save', 'Ignore');
  pendingMatches.delete(key);
  handledMatches.add(key);

  if (choice === 'Save') {
    try {
      const traces = getLastTraces(10);
      const fixSummary = extractFixSummary(traces, match);
      savePattern(match, fixSummary);
      channel.appendLine(`[loop-prompt] Saved pattern for ${match.loopType}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      channel.appendLine(`[loop-prompt] Failed to save pattern: ${msg}`);
      vscode.window.showErrorMessage(`Could not save pattern: ${msg}`);
    }
  }

  recordLoopOccurrence(match);
}
