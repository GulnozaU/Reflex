import * as vscode from 'vscode';
import { registerTerminalCapture } from './terminalCapture';

export function registerTerminalProbe(
  context: vscode.ExtensionContext,
  channel: vscode.OutputChannel
): void {
  const config = vscode.workspace.getConfiguration('aiSkillEvolution');
  const enabled = config.get<boolean>('logTerminalProbe', true);

  if (!enabled) {
    channel.appendLine('[probe] Terminal probe logging disabled in settings.');
    return;
  }

  registerTerminalCapture(context, channel, () => {
    /* probe only logs via channel in registerTerminalCapture */
  });
}
