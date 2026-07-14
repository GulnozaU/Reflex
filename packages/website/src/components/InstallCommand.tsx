'use client';

import { CopyButton } from './CopyButton';
import {
  DEV_CLI_COMMAND,
  DOCS_URL,
  INSTALL_NOTE,
  PRIMARY_INSTALL_COMMAND,
  WRONG_CLI_WARNING
} from '@/lib/install';

interface InstallCommandProps {
  compact?: boolean;
  showDevInstall?: boolean;
}

export function InstallCommand({ compact = false, showDevInstall = !compact }: InstallCommandProps) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <code className="panel flex-1 overflow-x-auto px-4 py-3 font-mono text-sm text-foreground">
          {PRIMARY_INSTALL_COMMAND}
        </code>
        <CopyButton text={PRIMARY_INSTALL_COMMAND} label="Copy" />
      </div>

      <p className="text-xs leading-relaxed text-muted">{INSTALL_NOTE}</p>

      <p className="rounded-md border border-line bg-surface px-3 py-2 text-xs text-muted">
        {WRONG_CLI_WARNING}
      </p>

      {showDevInstall && (
        <details className="text-xs text-muted">
          <summary className="cursor-pointer hover:text-foreground">Developing from the repo</summary>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <code className="panel flex-1 overflow-x-auto px-3 py-2 font-mono text-[11px] text-foreground">
              {DEV_CLI_COMMAND}
            </code>
            <CopyButton text={DEV_CLI_COMMAND} label="Copy" className="!py-2 text-xs" />
          </div>
        </details>
      )}

      <p className="text-xs text-muted">
        The CLI detects Cursor or VS Code, installs Reflex, verifies it, and can restart your editor.{' '}
        <a href={DOCS_URL} className="text-sage underline-offset-2 hover:underline">
          Install docs
        </a>
      </p>
    </div>
  );
}
