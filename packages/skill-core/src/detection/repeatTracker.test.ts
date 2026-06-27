import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initCaptureStore, closeCaptureStore } from '../capture/db';
import { LoopMatch } from './types';
import {
  recordLoopOccurrence,
  hasRecordedOccurrence,
  getRepeatCount
} from './repeatTracker';
import { occurrenceMatchKey } from './approvalStats';

describe('repeatTracker dedup', () => {
  let dbPath: string;

  beforeEach(async () => {
    dbPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'loop-')), 'traces.db');
    await initCaptureStore({ dbPath });
  });

  afterEach(() => {
    closeCaptureStore();
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  });

  const matchA: LoopMatch = {
    loopType: 'TYPE_ERROR_LOOP',
    traceIds: ['t1', 't2', 't3'],
    filesInvolved: ['src/auth.ts'],
    errorSnippet: 'TS2339',
    minutesElapsed: 1.0
  };

  const matchB: LoopMatch = {
    ...matchA,
    traceIds: ['t10', 't11', 't12'],
    minutesElapsed: 1.5
  };

  it('hasRecordedOccurrence is true only for the exact traceIds set', () => {
    expect(hasRecordedOccurrence(matchA)).toBe(false);
    recordLoopOccurrence(matchA);
    expect(hasRecordedOccurrence(matchA)).toBe(true);
    expect(hasRecordedOccurrence(matchB)).toBe(false);
  });

  it('new traceIds increment repeat count for the same file shape', () => {
    for (const ids of [
      ['t1', 't2', 't3'],
      ['t4', 't5', 't6'],
      ['t7', 't8', 't9']
    ]) {
      recordLoopOccurrence({ ...matchA, traceIds: ids });
    }
    expect(getRepeatCount(matchA.loopType, matchA.filesInvolved)).toBe(3);

    recordLoopOccurrence(matchB);
    expect(getRepeatCount(matchB.loopType, matchB.filesInvolved)).toBe(4);
    expect(hasRecordedOccurrence(matchB)).toBe(true);
  });

  it('occurrenceMatchKey differs when traceIds differ', () => {
    expect(occurrenceMatchKey(matchA)).not.toBe(occurrenceMatchKey(matchB));
  });
});
