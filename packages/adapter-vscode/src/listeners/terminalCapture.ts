import * as vscode from 'vscode';

type ShellExecutionEndEvent = {
  terminal: vscode.Terminal;
  execution?: { commandLine?: { value: string } };
  exitCode?: number;
};

type ShellIntegrationChangeEvent = {
  terminal: vscode.Terminal;
};

/** Cursor/VS Code window-level terminal APIs (newer than @types/vscode 1.85) */
type TerminalWindowApi = typeof vscode.window & {
  onDidEndTerminalShellExecution?: (
    listener: (event: ShellExecutionEndEvent) => void
  ) => vscode.Disposable;
  onDidChangeTerminalShellIntegration?: (
    listener: (event: ShellIntegrationChangeEvent) => void
  ) => vscode.Disposable;
};

export interface TerminalCaptureHandle {
  mode: 'window-api' | 'shell-integration-api' | 'unavailable';
}

/**
 * Register terminal command capture. Prefers window.onDidEndTerminalShellExecution
 * (official VS Code API), falls back to per-terminal shellIntegration hook.
 */
export function registerTerminalCapture(
  context: vscode.ExtensionContext,
  channel: vscode.OutputChannel,
  onCommand: (cmd: string, exitCode: number) => void
): TerminalCaptureHandle {
  const win = vscode.window as TerminalWindowApi;

  if (win.onDidEndTerminalShellExecution) {
    channel.appendLine('[probe] window.onDidEndTerminalShellExecution — AVAILABLE');
    context.subscriptions.push(
      win.onDidEndTerminalShellExecution((event) => {
        const cmd = event.execution?.commandLine?.value ?? '(unknown command)';
        const exitCode = event.exitCode ?? -1;
        const name = event.terminal.name || '(unnamed)';
        channel.appendLine(`[probe] terminal="${name}" cmd="${cmd}" exitCode=${exitCode}`);
        onCommand(cmd, exitCode);
      })
    );

    if (win.onDidChangeTerminalShellIntegration) {
      context.subscriptions.push(
        win.onDidChangeTerminalShellIntegration((event) => {
          channel.appendLine(
            `[probe] shell integration ready on terminal "${event.terminal.name || '(unnamed)'}"`
          );
        })
      );
    }

    channel.appendLine('[probe] Open a NEW terminal, then run: echo hello');
    return { mode: 'window-api' };
  }

  channel.appendLine('[probe] window.onDidEndTerminalShellExecution — NOT available');
  channel.appendLine('[probe] Trying per-terminal shellIntegration fallback...');

  let hooked = false;
  const hookTerminal = (terminal: vscode.Terminal): void => {
    const integration = terminal.shellIntegration as
      | {
          onDidEndTerminalShellExecution?: (
            listener: (event: Omit<ShellExecutionEndEvent, 'terminal'>) => void
          ) => vscode.Disposable;
        }
      | undefined;

    const onEnd = integration?.onDidEndTerminalShellExecution;
    if (!onEnd) {
      channel.appendLine(
        `[probe] terminal "${terminal.name || '(unnamed)'}": shellIntegration hook NOT available`
      );
      return;
    }

    hooked = true;
    channel.appendLine(
      `[probe] terminal "${terminal.name || '(unnamed)'}": shellIntegration hook AVAILABLE`
    );
    const sub = onEnd((event) => {
      const cmd = event.execution?.commandLine?.value ?? '(unknown command)';
      const exitCode = event.exitCode ?? -1;
      channel.appendLine(`[probe] cmd="${cmd}" exitCode=${exitCode}`);
      onCommand(cmd, exitCode);
    });
    context.subscriptions.push(sub);
  };

  for (const t of vscode.window.terminals) {
    hookTerminal(t);
  }
  context.subscriptions.push(vscode.window.onDidOpenTerminal(hookTerminal));

  if (!hooked) {
    channel.appendLine('');
    channel.appendLine('[probe] Terminal capture UNAVAILABLE in this Cursor build.');
    channel.appendLine('[probe] Try: Settings → search "shell integration" → enable');
    channel.appendLine('[probe]      terminal.integrated.shellIntegration.enabled = true');
    channel.appendLine('[probe] Then close all terminals, reload window, open a NEW terminal.');
    channel.appendLine('[probe] File-save capture still works without terminal API.');
    return { mode: 'unavailable' };
  }

  return { mode: 'shell-integration-api' };
}
