import * as vscode from 'vscode';
import { TraceBuilder } from '../traceBuilder';

const DEBOUNCE_MS = 400;

const SKIP_PATH_PARTS = ['node_modules', '.git', '.local-patterns', 'dist', '.next'];

interface PendingChange {
  summary: string;
  label: string;
  timer: ReturnType<typeof setTimeout>;
}

function isTrackedFile(relativePath: string): boolean {
  if (relativePath.startsWith('..')) {
    return false;
  }
  return !SKIP_PATH_PARTS.some((part) => relativePath.split('/').includes(part));
}

function extFromPath(filePath: string): string {
  return filePath.includes('.') ? (filePath.split('.').pop() ?? '') : '';
}

/**
 * Captures file changes from saves, editor edits (agent apply), and disk writes.
 * Flushes pending edits before terminal commands so fail → edit → pass order is preserved.
 */
export function registerFileCapture(
  context: vscode.ExtensionContext,
  builder: TraceBuilder,
  channel?: vscode.OutputChannel
): void {
  const pending = new Map<string, PendingChange>();

  const flushPending = (): void => {
    if (pending.size > 0) {
      channel?.appendLine(`[capture] flushing ${pending.size} pending file change(s) before command`);
    }
    for (const [relativePath, entry] of pending) {
      clearTimeout(entry.timer);
      channel?.appendLine(`[capture] ${entry.label}: ${relativePath}`);
      builder.addFileChange(relativePath, entry.summary);
    }
    pending.clear();
  };

  builder.setBeforeCommandHook(flushPending);

  const recordImmediate = (relativePath: string, summary: string, label: string): void => {
    if (!isTrackedFile(relativePath)) {
      return;
    }
    const existing = pending.get(relativePath);
    if (existing) {
      clearTimeout(existing.timer);
      pending.delete(relativePath);
    }
    channel?.appendLine(`[capture] ${label}: ${relativePath}`);
    builder.addFileChange(relativePath, summary);
  };

  const scheduleChange = (relativePath: string, summary: string, label: string): void => {
    if (!isTrackedFile(relativePath)) {
      return;
    }
    const existing = pending.get(relativePath);
    if (existing) {
      clearTimeout(existing.timer);
    }
    const timer = setTimeout(() => {
      pending.delete(relativePath);
      channel?.appendLine(`[capture] ${label}: ${relativePath}`);
      builder.addFileChange(relativePath, summary);
    }, DEBOUNCE_MS);
    pending.set(relativePath, { summary, label, timer });
  };

  const relativePathFromUri = (uri: vscode.Uri): string | null => {
    if (uri.scheme !== 'file') {
      return null;
    }
    const relativePath = vscode.workspace.asRelativePath(uri);
    return isTrackedFile(relativePath) ? relativePath : null;
  };

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      const relativePath = relativePathFromUri(doc.uri);
      if (!relativePath) {
        return;
      }
      recordImmediate(relativePath, `saved ${doc.lineCount} line(s)`, 'file saved');
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const relativePath = relativePathFromUri(event.document.uri);
      if (!relativePath) {
        return;
      }
      scheduleChange(relativePath, `edited ${extFromPath(relativePath)} file`, 'file edited');
    })
  );

  const watchPattern = '**/*.{ts,tsx,js,jsx,mjs,cjs,json}';
  const watcher = vscode.workspace.createFileSystemWatcher(watchPattern);
  const onDiskChange = (uri: vscode.Uri): void => {
    const relativePath = relativePathFromUri(uri);
    if (!relativePath) {
      return;
    }
    scheduleChange(relativePath, `changed on disk (${extFromPath(relativePath)})`, 'file changed');
  };
  watcher.onDidChange(onDiskChange, null, context.subscriptions);
  watcher.onDidCreate(onDiskChange, null, context.subscriptions);
  context.subscriptions.push(watcher);

  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '(no workspace)';
  channel?.appendLine(`[capture] file listeners active for ${root}`);

  context.subscriptions.push({
    dispose: () => {
      for (const entry of pending.values()) {
        clearTimeout(entry.timer);
      }
      pending.clear();
    }
  });
}
