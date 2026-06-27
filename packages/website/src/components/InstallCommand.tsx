'use client';

import { useState } from 'react';
import { CopyButton } from './CopyButton';
import {
  DEV_CLI_COMMANDS,
  DOCS_URL,
  INSTALL_OPTIONS,
  WRONG_CLI_WARNING,
  type InstallEditor
} from '@/lib/install';
import { trackEvent } from '@/lib/analytics';

interface InstallCommandProps {
  compact?: boolean;
  showDevInstall?: boolean;
}

export function InstallCommand({ compact = false, showDevInstall = !compact }: InstallCommandProps) {
  const [editor, setEditor] = useState<InstallEditor>('cursor');
  const active = INSTALL_OPTIONS.find((o) => o.id === editor) ?? INSTALL_OPTIONS[0];

  function selectTab(id: InstallEditor) {
    setEditor(id);
    trackEvent('install_tab_selected', { editor: id });
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex gap-1 rounded-md border border-line bg-surface p-1">
        {INSTALL_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => selectTab(opt.id)}
            className={`flex-1 rounded px-3 py-1.5 font-mono text-xs transition-colors ${
              editor === opt.id ? 'bg-card text-foreground' : 'text-muted hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <code className="panel flex-1 overflow-x-auto px-4 py-3 font-mono text-sm text-foreground">
          {active.command}
        </code>
        <CopyButton
          text={active.command}
          label="Copy"
          onCopy={() => trackEvent('install_command_copied', { editor: active.id })}
        />
      </div>

      <p className="text-xs leading-relaxed text-muted">{active.note}</p>

      <p className="rounded-md border border-line bg-surface px-3 py-2 text-xs text-muted">
        {WRONG_CLI_WARNING}
      </p>

      {showDevInstall && (
        <details className="text-xs text-muted">
          <summary className="cursor-pointer hover:text-foreground">
            Developing locally (before npm publish)
          </summary>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <code className="panel flex-1 overflow-x-auto px-3 py-2 font-mono text-[11px] text-foreground">
              {DEV_CLI_COMMANDS[editor]}
            </code>
            <CopyButton
              text={DEV_CLI_COMMANDS[editor]}
              label="Copy"
              className="!py-2 text-xs"
              onCopy={() => trackEvent('install_command_copied', { editor: `${active.id}_dev` })}
            />
          </div>
        </details>
      )}

      <p className="text-xs text-muted">
        The CLI downloads the extension and installs it into your editor.{' '}
        <a href={DOCS_URL} className="text-bronze underline-offset-2 hover:underline">
          Install docs
        </a>
      </p>
    </div>
  );
}
