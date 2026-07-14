import { CLARITY, LOCAL_FIRST_POINTS } from '@/lib/product';

const items = [
  { label: 'What Reflex stores', detail: CLARITY.whatReflexStores },
  { label: 'Where data lives', detail: CLARITY.whereDataLives },
  { label: 'What runs locally', detail: CLARITY.whatRunsLocally },
  { label: 'Shared across editors', detail: CLARITY.whatIsSharedAcrossEditors },
  { label: 'Accounts', detail: 'Not required for core functionality' },
  {
    label: 'Distribution',
    detail: 'Unified CLI (npx @reflex1abs/cli) downloads the extension from static hosting'
  }
];

export function WhatRunsLocally() {
  return (
    <section
      id="local-runtime"
      className="section-padding border-y border-line bg-surface py-16 sm:py-20"
      aria-labelledby="local-runtime-heading"
    >
      <div className="section-max max-w-3xl">
        <h2
          id="local-runtime-heading"
          className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          What runs locally
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Local-first means one thing everywhere: on-device storage, local detection, no Reflex
          account, same data format for every capture path.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-muted">
          {LOCAL_FIRST_POINTS.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="text-sage" aria-hidden="true">
                ·
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li key={item.label} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="shrink-0 font-mono text-xs text-sage sm:w-44">{item.label}</span>
              <span className="text-sm text-muted">{item.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
