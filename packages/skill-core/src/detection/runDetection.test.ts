import { describe, expect, it } from 'vitest';
import { TraceRecord } from '../types';
import { detectAllLoops } from './runDetection';
import { detectTestFixLoop } from './detectors';

const T0 = 1_700_000_000_000;
const MIN = 60_000;

function cumulative(...steps: Array<Omit<TraceRecord, 'id' | 'timestamp' | 'successSignal'>>): TraceRecord[] {
  const cmds: TraceRecord['commandsRun'] = [];
  const files: TraceRecord['filesChanged'] = [];
  const errs: string[] = [];
  return steps.map((step, i) => {
    cmds.push(...step.commandsRun);
    files.push(...step.filesChanged);
    errs.push(...step.errorSeen);
    return {
      id: `t${i + 1}`,
      timestamp: T0 + i * MIN,
      commandsRun: [...cmds],
      filesChanged: [...files],
      errorSeen: [...errs],
      successSignal: cmds.every((c) => c.exitCode === 0)
    };
  });
}

describe('detectAllLoops', () => {
  it('aggregates detector results the same as calling detectTestFixLoop directly', () => {
    const traces = cumulative(
      {
        commandsRun: [{ cmd: 'npm test -- auth.test.ts', exitCode: 1 }],
        filesChanged: [],
        errorSeen: ['Expected true to be false']
      },
      {
        commandsRun: [],
        filesChanged: [{ path: 'src/auth.ts', ext: 'ts', diffSummary: 'fix handler' }],
        errorSeen: []
      },
      {
        commandsRun: [{ cmd: 'npm test -- auth.test.ts', exitCode: 0 }],
        filesChanged: [],
        errorSeen: []
      }
    );

    const direct = detectTestFixLoop(traces);
    const matches = detectAllLoops(traces);
    expect(direct).not.toBeNull();
    expect(matches.some((m) => m.loopType === direct!.loopType)).toBe(true);
  });

  it('returns empty array when no loops match', () => {
    const traces: TraceRecord[] = [
      {
        id: '1',
        timestamp: 1,
        commandsRun: [{ cmd: 'echo hi', exitCode: 0 }],
        filesChanged: [],
        errorSeen: [],
        successSignal: true
      }
    ];
    expect(detectAllLoops(traces)).toEqual([]);
  });
});
