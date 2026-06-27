'use client';

import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  onCopy?: () => void;
}

export function CopyButton({ text, label = 'Copy', className = '', onCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied to clipboard' : `Copy ${label}`}
      className={`panel-interactive shrink-0 rounded-md border px-4 py-3 text-sm font-medium transition-colors duration-200 sm:py-2.5 ${
        copied
          ? 'border-sage/40 bg-surface text-sage'
          : 'border-line bg-card text-muted hover:text-foreground'
      } ${className}`}
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
