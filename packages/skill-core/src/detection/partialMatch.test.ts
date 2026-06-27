import { describe, expect, it } from 'vitest';
import { TraceRecord } from '../types';
import {
  detectTypeErrorStart,
  detectTestFixStart,
  detectApiSchemaStart
} from './partialMatch';

function trace(partial: Partial<TraceRecord> & Pick<TraceRecord, 'commandsRun' | 'errorSeen'>): TraceRecord {
  return {
    id: 't1',
    timestamp: Date.now(),
    filesChanged: partial.filesChanged ?? [],
    commandsRun: partial.commandsRun,
    errorSeen: partial.errorSeen,
    successSignal: partial.successSignal ?? false
  };
}

describe('partialMatch (single trace only)', () => {
  it('detectTypeErrorStart fires on failed build with TS error', () => {
    const latest = trace({
      commandsRun: [{ cmd: 'npm run build', exitCode: 1 }],
      errorSeen: ['TS2339: Property "foo" does not exist'],
      filesChanged: [{ path: 'src/auth.ts', ext: 'ts', diffSummary: '' }]
    });

    expect(detectTypeErrorStart(latest)).toEqual({
      loopType: 'TYPE_ERROR_LOOP',
      errorSnippet: 'TS2339: Property "foo" does not exist',
      filesInvolved: ['src/auth.ts']
    });
  });

  it('detectTypeErrorStart does not fire when last command succeeded', () => {
    const latest = trace({
      commandsRun: [
        { cmd: 'npm run build', exitCode: 1 },
        { cmd: 'npm run build', exitCode: 0 }
      ],
      errorSeen: ['TS2339: old']
    });

    expect(detectTypeErrorStart(latest)).toBeNull();
  });

  it('detectTestFixStart fires on failed jest without requiring a fix', () => {
    const latest = trace({
      commandsRun: [{ cmd: 'npm test -- auth', exitCode: 1 }],
      errorSeen: ['Expected true to be false']
    });

    expect(detectTestFixStart(latest)).toEqual({
      loopType: 'TEST_FIX_LOOP',
      errorSnippet: 'Expected true to be false',
      filesInvolved: []
    });
  });

  it('detectApiSchemaStart fires on schema validation error alone', () => {
    const latest = trace({
      commandsRun: [{ cmd: 'npm run dev', exitCode: 1 }],
      errorSeen: ['validation error: missing field "email"']
    });

    expect(detectApiSchemaStart(latest)).toEqual({
      loopType: 'API_SCHEMA_LOOP',
      errorSnippet: 'validation error: missing field "email"',
      filesInvolved: []
    });
  });
});
