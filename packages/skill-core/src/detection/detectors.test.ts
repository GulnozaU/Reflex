import { describe, expect, it } from 'vitest';
import { TraceRecord } from '../types';
import {
  detectTypeErrorLoop,
  detectTestFixLoop,
  detectApiSchemaLoop
} from './detectors';

const T0 = 1_700_000_000_000;
const MIN = 60_000;

function trace(
  id: string,
  offsetMin: number,
  partial: Partial<TraceRecord> & Pick<TraceRecord, 'commandsRun' | 'filesChanged' | 'errorSeen'>
): TraceRecord {
  return {
    id,
    timestamp: T0 + offsetMin * MIN,
    commandsRun: partial.commandsRun,
    filesChanged: partial.filesChanged,
    errorSeen: partial.errorSeen,
    successSignal: partial.successSignal ?? partial.commandsRun.every((c) => c.exitCode === 0)
  };
}

/** Cumulative snapshots as emitted by the adapter after each flush. */
function cumulative(...steps: Array<Omit<TraceRecord, 'id' | 'timestamp' | 'successSignal'>>): TraceRecord[] {
  const cmds: TraceRecord['commandsRun'] = [];
  const files: TraceRecord['filesChanged'] = [];
  const errors: string[] = [];
  return steps.map((step, i) => {
    cmds.push(...step.commandsRun);
    files.push(...step.filesChanged);
    errors.push(...step.errorSeen);
    return trace(`t${i + 1}`, i, {
      commandsRun: [...cmds],
      filesChanged: [...files],
      errorSeen: [...errors],
      successSignal: cmds.every((c) => c.exitCode === 0) && errors.length === 0
    });
  });
}

describe('detectTypeErrorLoop', () => {
  it('positive: tsc/build fail with TS error → save same file → build succeeds', () => {
    const traces = cumulative(
      {
        commandsRun: [{ cmd: 'npm run build', exitCode: 1 }],
        filesChanged: [],
        errorSeen: ['TS2339: Property "foo" does not exist on type "Auth"']
      },
      {
        commandsRun: [],
        filesChanged: [{ path: 'src/auth.ts', ext: 'ts', diffSummary: '+ foo: string' }],
        errorSeen: []
      },
      {
        commandsRun: [{ cmd: 'npm run build', exitCode: 0 }],
        filesChanged: [],
        errorSeen: []
      }
    );

    const match = detectTypeErrorLoop(traces);

    expect(match).not.toBeNull();
    expect(match!.loopType).toBe('TYPE_ERROR_LOOP');
    expect(match!.filesInvolved).toEqual(['src/auth.ts']);
    expect(match!.errorSnippet).toMatch(/TS2339/);
    expect(match!.traceIds).toEqual(['t1', 't2', 't3']);
    expect(match!.minutesElapsed).toBe(1);
  });

  it('negative: build fails with TS error but no successful re-run', () => {
    const traces = cumulative(
      {
        commandsRun: [{ cmd: 'npm run build', exitCode: 1 }],
        filesChanged: [],
        errorSeen: ['TS2322: Type string is not assignable to type number']
      },
      {
        commandsRun: [],
        filesChanged: [{ path: 'src/auth.ts', ext: 'ts', diffSummary: 'attempt fix' }],
        errorSeen: []
      },
      {
        commandsRun: [{ cmd: 'npm run build', exitCode: 1 }],
        filesChanged: [],
        errorSeen: ['TS2322: still broken']
      }
    );

    expect(detectTypeErrorLoop(traces)).toBeNull();
  });
});

describe('detectTestFixLoop', () => {
  it('positive: jest fail → save production file → same jest passes', () => {
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

    const match = detectTestFixLoop(traces);

    expect(match).not.toBeNull();
    expect(match!.loopType).toBe('TEST_FIX_LOOP');
    expect(match!.filesInvolved).toEqual(['src/auth.ts']);
    expect(match!.traceIds).toEqual(['t1', 't2', 't3']);
    expect(match!.minutesElapsed).toBe(1);
  });

  it('negative: jest fail → save only a test file → jest still fails', () => {
    const traces = cumulative(
      {
        commandsRun: [{ cmd: 'npx vitest run', exitCode: 1 }],
        filesChanged: [],
        errorSeen: ['AssertionError']
      },
      {
        commandsRun: [],
        filesChanged: [{ path: 'src/auth.test.ts', ext: 'ts', diffSummary: 'tweak expectation' }],
        errorSeen: []
      },
      {
        commandsRun: [{ cmd: 'npx vitest run', exitCode: 1 }],
        filesChanged: [],
        errorSeen: ['still failing']
      }
    );

    expect(detectTestFixLoop(traces)).toBeNull();
  });
});

describe('detectApiSchemaLoop', () => {
  it('positive: schema validation error → fix api route json → error cleared on re-run', () => {
    const traces = cumulative(
      {
        commandsRun: [{ cmd: 'npm run dev', exitCode: 1 }],
        filesChanged: [],
        errorSeen: ['validation error: missing field "email" in request body']
      },
      {
        commandsRun: [],
        filesChanged: [{ path: 'src/api/users.schema.json', ext: 'json', diffSummary: '+ email' }],
        errorSeen: []
      },
      {
        commandsRun: [{ cmd: 'curl localhost:3000/api/users', exitCode: 0 }],
        filesChanged: [],
        errorSeen: []
      }
    );

    const match = detectApiSchemaLoop(traces);

    expect(match).not.toBeNull();
    expect(match!.loopType).toBe('API_SCHEMA_LOOP');
    expect(match!.filesInvolved).toEqual(['src/api/users.schema.json']);
    expect(match!.errorSnippet).toMatch(/validation error/i);
    expect(match!.traceIds).toEqual(['t1', 't2', 't3']);
    expect(match!.minutesElapsed).toBe(1);
  });

  it('negative: 404 error → unrelated file save → error still present', () => {
    const traces = cumulative(
      {
        commandsRun: [{ cmd: 'npm run dev', exitCode: 1 }],
        filesChanged: [],
        errorSeen: ['404 Not Found: GET /api/users']
      },
      {
        commandsRun: [],
        filesChanged: [{ path: 'src/styles.css', ext: 'css', diffSummary: 'cosmetic' }],
        errorSeen: []
      },
      {
        commandsRun: [{ cmd: 'npm run dev', exitCode: 1 }],
        filesChanged: [],
        errorSeen: ['404 Not Found: GET /api/users']
      }
    );

    expect(detectApiSchemaLoop(traces)).toBeNull();
  });
  it('matches when the same src file is edited twice (break then fix)', () => {
    const traces = cumulative(
      {
        commandsRun: [],
        filesChanged: [{ path: 'src/lib/quiz-scoring.ts', ext: 'ts', diffSummary: 'break' }],
        errorSeen: []
      },
      {
        commandsRun: [{ cmd: 'npm test', exitCode: 1 }],
        filesChanged: [],
        errorSeen: []
      },
      {
        commandsRun: [],
        filesChanged: [{ path: 'src/lib/quiz-scoring.ts', ext: 'ts', diffSummary: 'fix' }],
        errorSeen: []
      },
      {
        commandsRun: [{ cmd: 'npm test', exitCode: 0 }],
        filesChanged: [],
        errorSeen: []
      }
    );

    const match = detectTestFixLoop(traces);
    expect(match).not.toBeNull();
    expect(match!.filesInvolved).toEqual(['src/lib/quiz-scoring.ts']);
  });
});

describe('detector window edge cases', () => {
  it('returns the most recent complete loop when an older one is still in the window', () => {
    const traces = cumulative(
      {
        commandsRun: [{ cmd: 'npm run build', exitCode: 1 }],
        filesChanged: [],
        errorSeen: ['TS1111: old error']
      },
      {
        commandsRun: [],
        filesChanged: [{ path: 'src/auth.ts', ext: 'ts', diffSummary: 'first fix' }],
        errorSeen: []
      },
      {
        commandsRun: [{ cmd: 'npm run build', exitCode: 0 }],
        filesChanged: [],
        errorSeen: []
      },
      {
        commandsRun: [{ cmd: 'echo filler', exitCode: 0 }],
        filesChanged: [],
        errorSeen: []
      },
      {
        commandsRun: [{ cmd: 'npm run build', exitCode: 1 }],
        filesChanged: [],
        errorSeen: ['TS2222: new error']
      },
      {
        commandsRun: [],
        filesChanged: [{ path: 'src/auth.ts', ext: 'ts', diffSummary: 'second fix' }],
        errorSeen: []
      },
      {
        commandsRun: [{ cmd: 'npm run build', exitCode: 0 }],
        filesChanged: [],
        errorSeen: []
      }
    );

    const match = detectTypeErrorLoop(traces);

    expect(match).not.toBeNull();
    expect(match!.traceIds).toEqual(['t5', 't6', 't7']);
    expect(match!.errorSnippet).toMatch(/TS2222/);
  });
});
