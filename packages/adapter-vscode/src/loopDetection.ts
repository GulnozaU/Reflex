import * as vscode from 'vscode';
import { getLastTraces, detectAllLoops } from '@ai-skill/skill-core';
import { maybePromptForPatternSave } from './approvalPrompt';

const TRACE_WINDOW = 10;

function logLoopMatch(channel: vscode.OutputChannel, match: Parameters<typeof maybePromptForPatternSave>[0]): void {
  channel.appendLine(
    `[loop-detect] ${match.loopType} files=${match.filesInvolved.join(',')} ` +
      `minutes=${match.minutesElapsed.toFixed(1)} error="${match.errorSnippet.slice(0, 80)}"`
  );
}

export function runLoopDetection(
  channel: vscode.OutputChannel,
  trigger: 'command' | 'error' | 'file' = 'command'
): void {
  const traces = getLastTraces(TRACE_WINDOW);
  const matches = detectAllLoops(traces);

  for (const match of matches) {
    logLoopMatch(channel, match);
    void maybePromptForPatternSave(match, channel);
  }

  if (matches.length === 0 && trigger === 'command' && traces.length > 0) {
    const last = traces[traces.length - 1];
    const lastCmd = last.commandsRun.at(-1);
    if (lastCmd && /\b(test|jest|vitest|pytest)\b/i.test(lastCmd.cmd) && lastCmd.exitCode === 0) {
      channel.appendLine(
        `[loop-detect] no match after test pass (traces=${traces.length} files=${last.filesChanged.length} cmds=${last.commandsRun.length})`
      );
    }
  }
}
