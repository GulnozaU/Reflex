import * as vscode from 'vscode';
import { TraceBuilder } from '../traceBuilder';
import { registerTerminalCapture } from './terminalCapture';

export function registerTerminalListener(
  context: vscode.ExtensionContext,
  builder: TraceBuilder,
  channel?: vscode.OutputChannel
): void {
  registerTerminalCapture(context, channel ?? vscode.window.createOutputChannel('AI Skill'), (cmd, exitCode) => {
    builder.addCommand(cmd, exitCode);
  });
}
