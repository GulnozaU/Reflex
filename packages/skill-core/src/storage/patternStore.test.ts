import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LoopMatch } from '../detection/types';
import { TraceRecord } from '../types';
import {
  initPatternStore,
  savePattern,
  getPattern,
  listPatterns,
  extractFixSummary,
  recordOutcome
} from './patternStore';

describe('patternStore', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'patterns-'));
    initPatternStore({ workspaceRoot: tmpDir });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const match: LoopMatch = {
    loopType: 'TYPE_ERROR_LOOP',
    traceIds: ['t1', 't2'],
    filesInvolved: ['src/auth.ts'],
    errorSnippet: 'TS2339',
    minutesElapsed: 2.5
  };

  it('creates .local-patterns/patterns.json on first save', () => {
    savePattern(match, 'added foo property');
    const filePath = path.join(tmpDir, '.local-patterns', 'patterns.json');
    expect(fs.existsSync(filePath)).toBe(true);
    const patterns = listPatterns();
    expect(patterns).toHaveLength(1);
    expect(patterns[0].fixSummary).toBe('added foo property');
    expect(patterns[0].occurrenceCount).toBe(1);
    expect(patterns[0].totalMinutesSpent).toBe(2.5);
    expect(patterns[0].thumbsUp).toBeNull();
  });

  it('increments occurrenceCount for same loopType + file shape', () => {
    savePattern(match, 'first fix');
    savePattern({ ...match, minutesElapsed: 1.5 }, 'second fix');
    const patterns = listPatterns();
    expect(patterns).toHaveLength(1);
    expect(patterns[0].occurrenceCount).toBe(2);
    expect(patterns[0].totalMinutesSpent).toBe(4);
    expect(patterns[0].fixSummary).toBe('second fix');
  });

  it('getPattern returns by id', () => {
    savePattern(match, 'fix');
    const id = listPatterns()[0].id;
    expect(getPattern(id)?.loopType).toBe('TYPE_ERROR_LOOP');
    expect(getPattern('missing')).toBeNull();
  });

  it('extractFixSummary pulls diffSummary from matching trace files', () => {
    const traces: TraceRecord[] = [
      {
        id: 't2',
        timestamp: Date.now(),
        filesChanged: [{ path: 'src/auth.ts', ext: 'ts', diffSummary: '+ foo: string' }],
        commandsRun: [],
        errorSeen: [],
        successSignal: true
      }
    ];
    expect(extractFixSummary(traces, match)).toBe('+ foo: string');
  });

  it('recordOutcome appends to outcomes.jsonl', () => {
    savePattern(match, 'fix');
    const id = listPatterns()[0].id;
    recordOutcome(id, { wasShown: true, userClickedView: true, thumbsUp: true });
    const outcomesPath = path.join(tmpDir, '.local-patterns', 'outcomes.jsonl');
    expect(fs.existsSync(outcomesPath)).toBe(true);
    const line = fs.readFileSync(outcomesPath, 'utf8').trim();
    expect(JSON.parse(line)).toMatchObject({
      patternId: id,
      wasShown: true,
      userClickedView: true,
      thumbsUp: true
    });
  });
});
