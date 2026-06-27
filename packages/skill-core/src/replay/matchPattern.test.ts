import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initPatternStore, savePattern, patternShapeKey } from '../storage/patternStore';
import { findRelevantPattern } from './matchPattern';

describe('findRelevantPattern', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'replay-'));
    initPatternStore({ workspaceRoot: tmpDir });
    savePattern(
      {
        loopType: 'TYPE_ERROR_LOOP',
        traceIds: ['a', 'b', 'c'],
        filesInvolved: ['src/auth.ts'],
        errorSnippet: 'TS2339',
        minutesElapsed: 1
      },
      '+ foo: string'
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reuses patternStore.patternShapeKey for lookup', () => {
    const shape = patternShapeKey('TYPE_ERROR_LOOP', ['src/auth.ts']);
    expect(shape).toBe('TYPE_ERROR_LOOP:ts');

    const found = findRelevantPattern({
      loopType: 'TYPE_ERROR_LOOP',
      filesInvolved: ['src/user.ts']
    });

    expect(found).not.toBeNull();
    expect(found!.fixSummary).toBe('+ foo: string');
  });

  it('returns null when loopType matches but file shape differs', () => {
    expect(
      findRelevantPattern({
        loopType: 'TYPE_ERROR_LOOP',
        filesInvolved: ['src/styles.css']
      })
    ).toBeNull();
  });
});
