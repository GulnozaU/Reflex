import { randomUUID } from 'crypto';
import * as vscode from 'vscode';
import { TraceRecord } from '@ai-skill/skill-core';
import { recordTrace } from '@ai-skill/skill-core';
import { runLoopDetection } from './loopDetection';
import { runPartialPatternReplay } from './patternReplay';
import { getModifiedProductionFiles, isTestCommand } from './gitCapture';

/**
 * Assembles TraceRecord snapshots from adapter events and flushes via skill-core.
 * No detection logic — accumulation + recordTrace only.
 */
export class TraceBuilder {
  private readonly sessionId = randomUUID();
  private filesChanged: TraceRecord['filesChanged'] = [];
  private commandsRun: TraceRecord['commandsRun'] = [];
  private errorSeen: TraceRecord['errorSeen'] = [];
  private successSignal = true;
  private outputChannel: vscode.OutputChannel | null = null;
  private beforeCommandHook: (() => void) | null = null;

  setOutputChannel(channel: vscode.OutputChannel): void {
    this.outputChannel = channel;
  }

  /** Flush pending file edits before recording a terminal command (preserves loop order). */
  setBeforeCommandHook(hook: () => void): void {
    this.beforeCommandHook = hook;
  }

  addFileChange(path: string, diffSummary: string): void {
    this.pushFileChange(path, diffSummary);
    this.flush('file');
  }

  private pushFileChange(path: string, diffSummary: string): void {
    const ext = path.includes('.') ? (path.split('.').pop() ?? '') : '';
    this.filesChanged.push({ path, ext, diffSummary });
  }

  addCommand(cmd: string, exitCode: number): void {
    const trimmed = cmd.trim();
    if (!trimmed) {
      return;
    }

    this.beforeCommandHook?.();

    const lastCmd = [...this.commandsRun].reverse().find((c) => c.cmd.trim().length > 0);
    const isPass = exitCode === 0 && isTestCommand(trimmed);
    const lastWasFail = lastCmd !== undefined && lastCmd.exitCode !== 0 && isTestCommand(lastCmd.cmd);

    if (isPass && lastWasFail) {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (root) {
        const gitFiles = getModifiedProductionFiles(root);
        if (gitFiles.length > 0) {
          this.outputChannel?.appendLine(`[capture] git detected: ${gitFiles.join(', ')}`);
        }
        for (const filePath of gitFiles) {
          this.pushFileChange(filePath, 'modified (git diff)');
        }
        if (gitFiles.length > 0) {
          this.flush('file');
        }
      }
    }

    this.commandsRun.push({ cmd: trimmed, exitCode });
    if (exitCode !== 0) {
      this.successSignal = false;
    }
    this.flush('command');
  }

  addError(message: string): void {
    this.errorSeen.push(message);
    this.successSignal = false;
    this.flush('error');
  }

  build(): TraceRecord {
    return {
      id: `${this.sessionId}-${Date.now()}`,
      timestamp: Date.now(),
      filesChanged: [...this.filesChanged],
      commandsRun: [...this.commandsRun],
      errorSeen: [...this.errorSeen],
      successSignal: this.successSignal
    };
  }

  flush(trigger: 'command' | 'error' | 'file' = 'file'): void {
    const trace = this.build();
    if (
      trace.filesChanged.length === 0 &&
      trace.commandsRun.length === 0 &&
      trace.errorSeen.length === 0
    ) {
      return;
    }
    recordTrace(trace);
    runPartialPatternReplay(trace, trigger);
    if (this.outputChannel) {
      runLoopDetection(this.outputChannel, trigger);
    }
  }
}
