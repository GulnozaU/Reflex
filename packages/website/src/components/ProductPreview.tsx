'use client';

import { useEffect, useReducer, useRef } from 'react';
import { StatusIndicator } from './StatusIndicator';
import { trackEvent } from '@/lib/analytics';

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
  'scanning traces.db (session #47)…',
  'comparing last 10 traces…',
  'TEST_FIX_LOOP — same file, fail→fix→pass',
  'pattern shape match: quiz-scoring.ts',
  'replay history: 7 helped / 1 dismissed'
];

const APPLY_MS = 180;

type Phase =
  | 'typing-agent'
  | 'typing-fix'
  | 'analyzing'
  | 'detected'
  | 'popup'
  | 'applied'
  | 'dismissed'
  | 'stats';

type PopupChoice = 'use' | 'dismiss' | null;

interface DemoState {
  cycle: number;
  phase: Phase;
  agentDone: AgentLine[];
  agentPartial: string;
  agentLineIdx: number;
  analysisIdx: number;
  showPopup: boolean;
  popupChoice: PopupChoice;
  replayLines: string[];
}

type Action =
  | { type: 'TICK_CHAR'; char: string }
  | { type: 'FINISH_LINE'; line: AgentLine }
  | { type: 'SET_PHASE'; phase: Phase }
  | { type: 'ADVANCE_ANALYSIS' }
  | { type: 'SHOW_POPUP' }
  | { type: 'USE_PATTERN' }
  | { type: 'DISMISS_PATTERN' }
  | { type: 'ADD_REPLAY_LINE'; line: string }
  | { type: 'RESET_CYCLE' };

const initial: DemoState = {
  cycle: 0,
  phase: 'typing-agent',
  agentDone: [],
  agentPartial: '',
  agentLineIdx: 0,
  analysisIdx: 0,
  showPopup: false,
  popupChoice: null,
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
    case 'SHOW_POPUP':
      return { ...state, showPopup: true, phase: 'popup' };
    case 'USE_PATTERN':
      return {
        ...state,
        showPopup: false,
        popupChoice: 'use',
        phase: 'applied',
        replayLines: [
          `[replay] applying saved fix…`,
          `[replay] applied in ${(APPLY_MS / 1000).toFixed(1)}s`,
          `[replay] ~0.3 min saved vs rediscovering fix`
        ],
        agentDone: [
          ...state.agentDone,
          { text: 'Applying saved pattern: restore 0–100 multiplier', role: 'agent' },
          { text: '$ npm test', role: 'terminal' },
          { text: 'PASS  12 tests', role: 'terminal' }
        ]
      };
    case 'DISMISS_PATTERN':
      return {
        ...state,
        showPopup: false,
        popupChoice: 'dismiss',
        phase: 'dismissed',
        replayLines: [
          '[replay] pattern dismissed',
          '[replay] continuing without saved fix',
          '[capture] agent re-debugging from scratch…'
        ]
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
  if (role === 'user') return 'text-bronze';
  if (role === 'agent') return 'text-foreground';
  return 'text-muted';
}

interface ProductPreviewProps {
  variant?: 'hero' | 'section';
}

export function ProductPreview({ variant = 'section' }: ProductPreviewProps) {
  const compact = variant === 'hero';
  const [state, dispatch] = useReducer(reducer, initial);
  const popupTracked = useRef(false);

  function handleUsePattern() {
    trackEvent('demo_pattern_used');
    dispatch({ type: 'USE_PATTERN' });
  }

  function handleDismiss() {
    trackEvent('demo_pattern_dismissed');
    dispatch({ type: 'DISMISS_PATTERN' });
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
        schedule(() => dispatch({ type: 'SET_PHASE', phase: 'detected' }), 400);
      }
    } else if (state.phase === 'detected') {
      schedule(() => {
        dispatch({ type: 'SHOW_POPUP' });
        if (!popupTracked.current) {
          popupTracked.current = true;
          trackEvent('demo_popup_shown');
        }
      }, 500);
    } else if (state.phase === 'applied') {
      schedule(() => dispatch({ type: 'SET_PHASE', phase: 'stats' }), 1800);
    } else if (state.phase === 'dismissed') {
      schedule(() => {
        trackEvent('demo_cycle_completed', { cycle: state.cycle + 1, choice: 'dismiss' });
        popupTracked.current = false;
        dispatch({ type: 'RESET_CYCLE' });
      }, 2400);
    } else if (state.phase === 'stats') {
      schedule(() => {
        trackEvent('demo_cycle_completed', { cycle: state.cycle + 1, choice: 'use' });
        popupTracked.current = false;
        dispatch({ type: 'RESET_CYCLE' });
      }, 2800);
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
    state.phase === 'detected' ||
    state.phase === 'popup' ||
    state.phase === 'applied' ||
    state.phase === 'dismissed' ||
    state.phase === 'stats';

  const statusLabel =
    state.phase === 'popup'
      ? 'awaiting choice'
      : state.phase === 'applied'
        ? 'pattern applied'
        : state.phase === 'dismissed'
          ? 'pattern dismissed'
          : analyzing
            ? 'analyzing'
            : 'capturing';

  return (
    <div
      className={`panel relative overflow-hidden ${compact ? 'mx-auto max-w-5xl' : 'max-w-5xl'}`}
      role="region"
      aria-label="Reflex interactive demo"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-sm bg-line" />
            <span className="h-2 w-2 rounded-sm bg-line" />
            <span className="h-2 w-2 rounded-sm bg-line" />
          </div>
          <span className="truncate font-mono text-xs text-muted">cursor agent + reflex</span>
        </div>
        <StatusIndicator
          label={statusLabel}
          active={state.phase !== 'dismissed'}
        />
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="border-b border-line p-4 lg:border-b-0 lg:border-r">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted">cursor agent</p>
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
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted">reflex analysis</p>
          <div className="min-h-[11rem] space-y-1.5 font-mono text-[11px] leading-relaxed sm:text-xs">
            {analyzing &&
              visibleAnalysis.map((step, i) => (
                <div
                  key={`${state.cycle}-a-${i}`}
                  className={i === visibleAnalysis.length - 1 && !state.replayLines.length ? 'text-sage' : 'text-muted'}
                >
                  [{i === 0 ? 'capture' : 'detect'}] {step}
                </div>
              ))}
            {(state.phase === 'detected' || state.phase === 'popup') && (
              <div className="text-bronze">[loop-detect] TEST_FIX_LOOP · quiz-scoring.ts</div>
            )}
            {state.replayLines.map((line, i) => (
              <div
                key={`${state.cycle}-r-${i}`}
                className={
                  state.popupChoice === 'use'
                    ? 'text-sage'
                    : state.popupChoice === 'dismiss'
                      ? 'text-muted'
                      : 'text-muted'
                }
              >
                {line}
              </div>
            ))}
            {state.phase === 'stats' && state.popupChoice === 'use' && (
              <div className="mt-3 space-y-2 border-t border-line pt-3">
                <div className="rounded border border-sage/30 bg-card px-3 py-2">
                  <p className="text-[10px] text-muted">pattern · TEST_FIX_LOOP</p>
                  <p className="mt-1 text-sage">applied in {(APPLY_MS / 1000).toFixed(1)}s</p>
                  <p className="text-sage">success rate: 88.9% (8/9 replays helped)</p>
                  <p className="text-muted">0.3 min saved this session</p>
                </div>
              </div>
            )}
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
          {state.popupChoice === 'use'
            ? 'pattern replayed · quiz-scoring.ts'
            : state.popupChoice === 'dismiss'
              ? 'pattern available · not applied'
              : state.showPopup
                ? 'TEST_FIX_LOOP saved · replay ready'
                : 'listening for repeatable workflows…'}
        </p>
      </div>

      {state.showPopup && (
        <div className="absolute inset-x-4 bottom-14 animate-fade-up rounded-md border border-line bg-card p-4 shadow-lg sm:inset-x-auto sm:right-4 sm:max-w-sm">
          <p className="font-mono text-[10px] uppercase tracking-wider text-bronze">pattern replay</p>
          <p className="mt-2 text-sm font-medium text-foreground">
            You fixed this before — use saved pattern?
          </p>
          <p className="mt-1 text-xs text-muted">+ restored score multiplier to 0–100</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleUsePattern}
              className="rounded border border-sage/50 bg-surface px-3 py-1.5 font-mono text-[11px] text-sage transition hover:border-sage hover:bg-sage/10"
            >
              Use pattern
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
            state.popupChoice === 'use'
              ? 'text-sage'
              : state.popupChoice === 'dismiss'
                ? 'text-muted'
                : state.showPopup
                  ? 'text-bronze'
                  : 'text-muted'
          }
        >
          {state.popupChoice === 'use'
            ? `pattern applied in ${(APPLY_MS / 1000).toFixed(1)}s`
            : state.popupChoice === 'dismiss'
              ? 'pattern dismissed — not applied'
              : state.showPopup
                ? 'status bar → Pattern available'
                : 'recording session…'}
        </span>
        <span className="text-muted">traces.db · local</span>
      </div>
    </div>
  );
}
