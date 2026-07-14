'use client';

import { useEffect, useReducer } from 'react';
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
  'reading traces.db…',
  'comparing last 10 traces…',
  'TEST_FIX_LOOP — same file, fail→fix→pass',
  'partial match: quiz-scoring.ts'
];

const FIX_SUMMARY = 'Restored score multiplier to 0–100 range in quiz-scoring.ts';

type Phase =
  | 'typing-agent'
  | 'typing-fix'
  | 'analyzing'
  | 'statusbar'
  | 'dialog'
  | 'feedback'
  | 'idle';

type FeedbackChoice = 'helped' | 'dismiss' | null;

interface DemoState {
  cycle: number;
  phase: Phase;
  agentDone: AgentLine[];
  agentPartial: string;
  agentLineIdx: number;
  analysisIdx: number;
  feedback: FeedbackChoice;
  replayLines: string[];
}

type Action =
  | { type: 'TICK_CHAR'; char: string }
  | { type: 'FINISH_LINE'; line: AgentLine }
  | { type: 'SET_PHASE'; phase: Phase }
  | { type: 'ADVANCE_ANALYSIS' }
  | { type: 'SET_FEEDBACK'; feedback: FeedbackChoice }
  | { type: 'ADD_REPLAY_LINE'; line: string }
  | { type: 'RESET_CYCLE' };

const initial: DemoState = {
  cycle: 0,
  phase: 'typing-agent',
  agentDone: [],
  agentPartial: '',
  agentLineIdx: 0,
  analysisIdx: 0,
  feedback: null,
  replayLines: []
};

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'TICK_CHAR':
      return { ...state, agentPartial: state.agentPartial + action.char };
    case 'FINISH_LINE':
      return {
        ...state,
        agentDone: [...state.agentDone, action.line],
        agentPartial: '',
        agentLineIdx: state.agentLineIdx + 1
      };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'ADVANCE_ANALYSIS':
      return { ...state, analysisIdx: state.analysisIdx + 1 };
    case 'SET_FEEDBACK':
      return {
        ...state,
        feedback: action.feedback,
        phase: 'feedback',
        replayLines:
          action.feedback === 'helped'
            ? ['[replay] fix summary viewed', '[outcome] Helped recorded locally']
            : ['[replay] fix summary dismissed', '[outcome] Dismiss recorded locally']
      };
    case 'ADD_REPLAY_LINE':
      return { ...state, replayLines: [...state.replayLines, action.line] };
    case 'RESET_CYCLE':
      return { ...initial, cycle: state.cycle + 1 };
    default:
      return state;
  }
}

function roleColor(role: AgentLine['role']) {
  if (role === 'user') return 'text-accent';
  if (role === 'agent') return 'text-foreground';
  return 'text-muted';
}

interface ProductPreviewProps {
  variant?: 'hero' | 'section';
}

export function ProductPreview({ variant = 'section' }: ProductPreviewProps) {
  const compact = variant === 'hero';
  const [state, dispatch] = useReducer(reducer, initial);

  function handleHelped() {
    dispatch({ type: 'SET_FEEDBACK', feedback: 'helped' });
  }

  function handleDismiss() {
    dispatch({ type: 'SET_FEEDBACK', feedback: 'dismiss' });
  }

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const schedule = (fn: () => void, ms: number) => {
      timeoutId = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const typeLines = (from: number, to: number, nextPhase: Phase) => {
      let lineIdx = from;
      let charIdx = 0;

      const step = () => {
        if (cancelled) return;
        const line = AGENT_SCRIPT[lineIdx];
        if (!line) {
          dispatch({ type: 'SET_PHASE', phase: nextPhase });
          return;
        }
        if (charIdx < line.text.length) {
          dispatch({ type: 'TICK_CHAR', char: line.text[charIdx] });
          charIdx += 1;
          schedule(step, 12 + Math.random() * 14);
          return;
        }
        dispatch({ type: 'FINISH_LINE', line });
        lineIdx += 1;
        charIdx = 0;
        if (lineIdx >= to) {
          schedule(() => dispatch({ type: 'SET_PHASE', phase: nextPhase }), 400);
          return;
        }
        schedule(step, 280);
      };

      schedule(step, 300);
    };

    if (state.phase === 'typing-agent') {
      typeLines(0, 5, 'typing-fix');
    } else if (state.phase === 'typing-fix') {
      typeLines(5, AGENT_SCRIPT.length, 'analyzing');
    } else if (state.phase === 'analyzing') {
      if (state.analysisIdx < ANALYSIS_STEPS.length) {
        schedule(() => dispatch({ type: 'ADVANCE_ANALYSIS' }), 650);
      } else {
        schedule(() => dispatch({ type: 'SET_PHASE', phase: 'statusbar' }), 400);
      }
    } else if (state.phase === 'statusbar') {
      schedule(() => dispatch({ type: 'SET_PHASE', phase: 'dialog' }), 1200);
    } else if (state.phase === 'feedback') {
      schedule(() => dispatch({ type: 'RESET_CYCLE' }), 2200);
    }

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [state.phase, state.analysisIdx, state.cycle]);

  const currentLine = AGENT_SCRIPT[state.agentLineIdx];
  const visibleAnalysis = ANALYSIS_STEPS.slice(0, state.analysisIdx);
  const analyzing =
    state.phase === 'analyzing' ||
    state.phase === 'statusbar' ||
    state.phase === 'dialog' ||
    state.phase === 'feedback';

  const statusLabel =
    state.phase === 'dialog'
      ? 'replay prompt'
      : state.phase === 'feedback'
        ? 'outcome recorded'
        : state.phase === 'statusbar'
          ? 'pattern available'
          : analyzing
            ? 'analyzing'
            : 'capturing';

  return (
    <div
      className={`panel relative overflow-hidden ${compact ? 'mx-auto max-w-5xl' : 'max-w-5xl'}`}
      role="region"
      aria-label="Reflex illustrative demo"
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
        <StatusIndicator label={statusLabel} active={state.phase !== 'feedback'} />
      </div>

      <p className="border-b border-line bg-surface px-4 py-2 font-mono text-[10px] text-muted">
        Illustrative demo — replay shows saved fix summaries; Reflex does not auto-apply code.
      </p>

      <div className="grid lg:grid-cols-2">
        <div className="border-b border-line p-4 lg:border-b-0 lg:border-r">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted">coding session</p>
          <div className="min-h-[11rem] space-y-1.5 font-mono text-[11px] leading-relaxed sm:text-xs">
            {state.agentDone.map((line, i) => (
              <div key={`${state.cycle}-${i}`} className={roleColor(line.role)}>
                {line.role === 'user' && '› '}
                {line.role === 'agent' && '◦ '}
                {line.text}
              </div>
            ))}
            {state.agentPartial && currentLine && (
              <div className={roleColor(currentLine.role)}>
                {currentLine.role === 'user' && '› '}
                {currentLine.role === 'agent' && '◦ '}
                {state.agentPartial}
                <span className="terminal-cursor text-foreground">▋</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-b border-line bg-surface p-4 lg:border-b-0">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted">reflex (skill-core)</p>
          <div className="min-h-[11rem] space-y-1.5 font-mono text-[11px] leading-relaxed sm:text-xs">
            {analyzing &&
              visibleAnalysis.map((step, i) => (
                <div
                  key={`${state.cycle}-a-${i}`}
                  className={i === visibleAnalysis.length - 1 && !state.replayLines.length ? 'text-sage' : 'text-muted'}
                >
                  [{i < 2 ? 'capture' : 'detect'}] {step}
                </div>
              ))}
            {(state.phase === 'statusbar' || state.phase === 'dialog' || state.phase === 'feedback') && (
              <div className="text-accent">[loop-detect] TEST_FIX_LOOP · quiz-scoring.ts</div>
            )}
            {state.replayLines.map((line, i) => (
              <div key={`${state.cycle}-r-${i}`} className="text-muted">
                {line}
              </div>
            ))}
            {!analyzing && state.agentDone.length === 0 && !state.agentPartial && (
              <div className="text-muted">awaiting session traces…</div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-line bg-surface px-4 py-3">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">
          .local-patterns/patterns.json
        </p>
        <p className="font-mono text-[11px] text-muted">
          {state.feedback === 'helped'
            ? 'outcome recorded · Helped'
            : state.feedback === 'dismiss'
              ? 'outcome recorded · Dismiss'
              : state.phase === 'dialog' || state.phase === 'statusbar'
                ? 'TEST_FIX_LOOP saved · replay ready'
                : 'listening for repeatable workflows…'}
        </p>
      </div>

      {state.phase === 'dialog' && (
        <div className="absolute inset-x-4 bottom-14 animate-fade-up rounded-md border border-line bg-card p-4 sm:inset-x-auto sm:right-4 sm:max-w-sm">
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent">saved fix summary</p>
          <p className="mt-2 text-sm font-medium text-foreground">{FIX_SUMMARY}</p>
          <p className="mt-1 text-xs text-muted">Same flow as the extension: view summary, then record feedback.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleHelped}
              className="rounded border border-sage/50 bg-surface px-3 py-1.5 font-mono text-[11px] text-sage transition hover:border-sage hover:bg-sage/10"
            >
              Helped
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded border border-line px-3 py-1.5 font-mono text-[11px] text-muted transition hover:border-muted hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-line bg-surface px-4 py-2 font-mono text-[11px]">
        <span
          className={
            state.phase === 'statusbar' || state.phase === 'dialog'
              ? 'text-sage'
              : state.feedback
                ? 'text-muted'
                : 'text-muted'
          }
        >
          {state.phase === 'statusbar' || state.phase === 'dialog'
            ? 'status bar → Pattern available: fixed this before'
            : state.feedback === 'helped'
              ? 'fix summary viewed · Helped'
              : state.feedback === 'dismiss'
                ? 'fix summary dismissed'
                : 'recording session…'}
        </span>
        <span className="text-muted">traces.db · local</span>
      </div>
    </div>
  );
}
