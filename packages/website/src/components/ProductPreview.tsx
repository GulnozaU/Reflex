import { StatusIndicator } from './StatusIndicator';

interface AgentLine {
  text: string;
  role: 'user' | 'agent' | 'terminal';
}

const AGENT_SCRIPT: AgentLine[] = [
  { text: 'Fix quiz-scoring.ts — tests failing on multiplier', role: 'user' },
  { text: 'Reading src/lib/quiz-scoring.ts…', role: 'agent' },
  { text: 'Applying fix: restore 0–100 score multiplier', role: 'agent' },
  { text: '$ npm test', role: 'terminal' },
  { text: 'FAIL  quiz-scoring › score multiplier', role: 'terminal' },
  { text: 'Adjusting multiplier logic in quiz-scoring.ts', role: 'agent' },
  { text: '$ npm test', role: 'terminal' },
  { text: 'PASS  12 tests', role: 'terminal' }
];

const ANALYSIS_STEPS = [
  { tag: 'capture', text: 'reading traces.db…' },
  { tag: 'capture', text: 'comparing last 10 traces…' },
  { tag: 'detect', text: 'TEST_FIX_LOOP — same file, fail→fix→pass' },
  { tag: 'detect', text: 'partial match: quiz-scoring.ts' }
];

const FIX_SUMMARY = 'Restored score multiplier to 0–100 range in quiz-scoring.ts';

function roleColor(role: AgentLine['role']) {
  if (role === 'user') return 'text-accent';
  if (role === 'agent') return 'text-foreground';
  return 'text-muted';
}

interface ProductPreviewProps {
  variant?: 'hero' | 'section';
}

/** Static product illustration — not interactive. */
export function ProductPreview({ variant = 'section' }: ProductPreviewProps) {
  const compact = variant === 'hero';

  return (
    <div
      className={`panel relative overflow-hidden ${compact ? 'mx-auto max-w-5xl' : 'max-w-5xl'}`}
      role="img"
      aria-label="Demo: Reflex detects a repeated TEST_FIX_LOOP and surfaces a saved fix summary"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-sm bg-line" />
            <span className="h-2 w-2 rounded-sm bg-line" />
            <span className="h-2 w-2 rounded-sm bg-line" />
          </div>
          <span className="truncate font-mono text-xs text-muted">editor + assistant · reflex</span>
        </div>
        <StatusIndicator label="replay prompt" />
      </div>

      <p className="border-b border-line bg-surface px-4 py-2 font-mono text-[10px] text-muted">
        Demo — what Reflex shows after a familiar loop; it does not auto-apply code.
      </p>

      <div className="grid lg:grid-cols-2">
        <div className="border-b border-line p-4 lg:border-b-0 lg:border-r">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted">coding session</p>
          <div className="space-y-1.5 font-mono text-[11px] leading-relaxed sm:text-xs">
            {AGENT_SCRIPT.map((line, i) => (
              <div key={i} className={roleColor(line.role)}>
                {line.role === 'user' && '› '}
                {line.role === 'agent' && '◦ '}
                {line.text}
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-line bg-surface p-4 lg:border-b-0">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted">reflex</p>
          <div className="space-y-1.5 font-mono text-[11px] leading-relaxed sm:text-xs">
            {ANALYSIS_STEPS.map((step, i) => (
              <div key={i} className={i === ANALYSIS_STEPS.length - 1 ? 'text-sage' : 'text-muted'}>
                [{step.tag}] {step.text}
              </div>
            ))}
            <div className="text-accent">[loop-detect] TEST_FIX_LOOP · quiz-scoring.ts</div>
            <div className="text-muted">[replay] fix summary viewed</div>
          </div>
        </div>
      </div>

      <div className="border-t border-line bg-surface px-4 py-3">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">
          .local-patterns/patterns.json
        </p>
        <p className="font-mono text-[11px] text-muted">TEST_FIX_LOOP saved · replay ready</p>
      </div>

      <div className="pointer-events-none absolute inset-x-4 bottom-14 rounded-md border border-line bg-card p-4 sm:inset-x-auto sm:right-4 sm:max-w-sm">
        <p className="font-mono text-[10px] uppercase tracking-wider text-accent">saved fix summary</p>
        <p className="mt-2 text-sm font-medium text-foreground">{FIX_SUMMARY}</p>
        <p className="mt-1 text-xs text-muted">View the summary, then record whether it helped.</p>
        <div className="mt-3 flex flex-wrap gap-2" aria-hidden="true">
          <span className="rounded border border-sage/50 bg-surface px-3 py-1.5 font-mono text-[11px] text-sage">
            Helped
          </span>
          <span className="rounded border border-line px-3 py-1.5 font-mono text-[11px] text-muted">
            Dismiss
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line bg-surface px-4 py-2 font-mono text-[11px]">
        <span className="text-sage">status bar → Pattern available: fixed this before</span>
        <span className="text-muted">traces.db · local</span>
      </div>
    </div>
  );
}
