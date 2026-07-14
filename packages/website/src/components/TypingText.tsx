'use client';

import { useEffect, useState } from 'react';

interface TypingTextProps {
  text: string;
  className?: string;
  speedMs?: number;
}

export function TypingText({ text, className = '', speedMs = 42 }: TypingTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    setDisplayed('');
    setDone(false);
    let index = 0;

    const interval = window.setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(interval);
        setDone(true);
      }
    }, speedMs);

    return () => window.clearInterval(interval);
  }, [text, speedMs]);

  return (
    <span className={className}>
      {displayed}
      {!done && <span className="terminal-cursor text-muted">▋</span>}
    </span>
  );
}
