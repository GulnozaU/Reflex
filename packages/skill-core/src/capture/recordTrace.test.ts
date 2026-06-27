import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  initCaptureStore,
  closeCaptureStore,
  recordTrace,
  sanitizeTrace
} from '../index';
import { getTrace } from './db';
import { TraceRecord } from '../types';

describe('recordTrace', () => {
  let dbPath: string;

  beforeEach(async () => {
    dbPath = path.join(os.tmpdir(), `ai-skill-test-${Date.now()}.db`);
    await initCaptureStore({ dbPath });
  });

  afterEach(() => {
    closeCaptureStore();
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  it('persists sanitized trace — secrets never reach SQLite', () => {
    const trace: TraceRecord = {
      id: 't-1',
      timestamp: 1000,
      filesChanged: [
        { path: '.env', ext: 'env', diffSummary: 'API_KEY=supersecret' },
        { path: 'src/a.ts', ext: 'ts', diffSummary: 'key=sk-abcdefghijklmnopqrstuvwxyz1234567890' }
      ],
      commandsRun: [{ cmd: 'echo Bearer abc123token', exitCode: 0 }],
      errorSeen: [],
      successSignal: true
    };

    recordTrace(trace);
    const stored = getTrace('t-1')!;

    expect(stored.filesChanged).toHaveLength(1);
    expect(stored.filesChanged[0].path).toBe('src/a.ts');
    expect(stored.filesChanged[0].diffSummary).toContain('[REDACTED_API_KEY]');
    expect(stored.commandsRun[0].cmd).toContain('Bearer [REDACTED]');
    expect(JSON.stringify(stored)).not.toContain('supersecret');
    expect(JSON.stringify(stored)).not.toContain('abc123token');
  });

  it('throws if store not initialized', () => {
    closeCaptureStore();
    expect(() =>
      recordTrace({
        id: 'x',
        timestamp: 1,
        filesChanged: [],
        commandsRun: [],
        errorSeen: [],
        successSignal: false
      })
    ).toThrow(/not initialized/i);
  });
});

describe('sanitizeTrace export', () => {
  it('is usable standalone before recordTrace', () => {
    const out = sanitizeTrace({
      id: '1',
      timestamp: 1,
      filesChanged: [{ path: 'secrets/keys.yaml', ext: 'yaml', diffSummary: 'token=ghp_1234567890abcdefghijklmnopqrstuvwxyz' }],
      commandsRun: [],
      errorSeen: [],
      successSignal: true
    });
    expect(out.filesChanged).toHaveLength(0);
  });
});
