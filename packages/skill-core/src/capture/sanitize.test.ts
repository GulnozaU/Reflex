import { describe, it, expect } from 'vitest';
import { sanitizeTrace } from './sanitize';
import { shouldSkipFile, redactString } from './constants';
import { TraceRecord } from '../types';

function baseTrace(overrides: Partial<TraceRecord> = {}): TraceRecord {
  return {
    id: 'trace-1',
    timestamp: Date.now(),
    filesChanged: [],
    commandsRun: [],
    errorSeen: [],
    successSignal: true,
    ...overrides
  };
}

describe('shouldSkipFile', () => {
  it('skips .env files entirely', () => {
    expect(shouldSkipFile('.env')).toBe(true);
    expect(shouldSkipFile('project/.env.local')).toBe(true);
    expect(shouldSkipFile('src/config/.env.production')).toBe(true);
  });

  it('skips .pem and .key files', () => {
    expect(shouldSkipFile('certs/server.pem')).toBe(true);
    expect(shouldSkipFile('private/id_rsa.key')).toBe(true);
  });

  it('skips credentials* and secrets* files', () => {
    expect(shouldSkipFile('config/credentials.json')).toBe(true);
    expect(shouldSkipFile('secrets/api-keys.yaml')).toBe(true);
  });

  it('does not skip normal source files', () => {
    expect(shouldSkipFile('src/index.ts')).toBe(false);
    expect(shouldSkipFile('package.json')).toBe(false);
  });
});

describe('redactString', () => {
  it('redacts OpenAI-style API keys', () => {
    const input = 'const key = "sk-abcdefghijklmnopqrstuvwxyz1234567890"';
    expect(redactString(input)).toContain('[REDACTED_API_KEY]');
    expect(redactString(input)).not.toContain('sk-abc');
  });

  it('redacts api_key= style assignments', () => {
    const input = 'API_KEY=supersecretvalue123';
    const out = redactString(input);
    expect(out).not.toContain('supersecretvalue123');
    expect(out).toContain('[REDACTED]');
  });

  it('redacts Bearer tokens', () => {
    const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const out = redactString(input);
    expect(out).toContain('Bearer [REDACTED]');
    expect(out).not.toContain('eyJhbGci');
  });

  it('redacts AWS access key ids', () => {
    const input = 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE';
    const out = redactString(input);
    expect(out).toContain('[REDACTED_AWS_KEY]');
    expect(out).not.toContain('AKIAIOSFODNN7EXAMPLE');
  });

  it('redacts private key blocks', () => {
    const input = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890abcdef
-----END RSA PRIVATE KEY-----`;
    const out = redactString(input);
    expect(out).toBe('[REDACTED_PRIVATE_KEY_BLOCK]');
    expect(out).not.toContain('MIIEpAIB');
  });

  it('redacts GitHub tokens', () => {
    const input = 'token=ghp_1234567890abcdefghijklmnopqrstuvwxyz';
    const out = redactString(input);
    expect(out).toContain('[REDACTED_GITHUB_TOKEN]');
  });
});

describe('sanitizeTrace', () => {
  it('drops .env file entries entirely — not even redacted', () => {
    const trace = baseTrace({
      filesChanged: [
        { path: 'src/index.ts', ext: 'ts', diffSummary: 'added export' },
        { path: '.env', ext: 'env', diffSummary: 'API_KEY=supersecret123' }
      ]
    });
    const out = sanitizeTrace(trace);
    expect(out.filesChanged).toHaveLength(1);
    expect(out.filesChanged[0].path).toBe('src/index.ts');
    expect(JSON.stringify(out)).not.toContain('supersecret123');
  });

  it('redacts secrets in diffSummary of allowed files', () => {
    const trace = baseTrace({
      filesChanged: [
        {
          path: 'src/config.ts',
          ext: 'ts',
          diffSummary: 'const key = "sk-abcdefghijklmnopqrstuvwxyz1234567890"'
        }
      ]
    });
    const out = sanitizeTrace(trace);
    expect(out.filesChanged[0].diffSummary).toContain('[REDACTED_API_KEY]');
    expect(out.filesChanged[0].diffSummary).not.toContain('sk-abc');
  });

  it('redacts secrets in commandsRun', () => {
    const trace = baseTrace({
      commandsRun: [{ cmd: 'curl -H "Authorization: Bearer secret-token-xyz"', exitCode: 0 }]
    });
    const out = sanitizeTrace(trace);
    expect(out.commandsRun[0].cmd).toContain('Bearer [REDACTED]');
    expect(out.commandsRun[0].cmd).not.toContain('secret-token-xyz');
  });

  it('redacts secrets in errorSeen', () => {
    const trace = baseTrace({
      errorSeen: ['Invalid API key: sk-abcdefghijklmnopqrstuvwxyz1234567890']
    });
    const out = sanitizeTrace(trace);
    expect(out.errorSeen[0]).toContain('[REDACTED_API_KEY]');
    expect(out.errorSeen[0]).not.toContain('sk-abc');
  });

  it('preserves non-sensitive fields', () => {
    const trace = baseTrace({
      id: 'abc-123',
      timestamp: 12345,
      successSignal: false,
      filesChanged: [{ path: 'README.md', ext: 'md', diffSummary: 'updated docs' }]
    });
    const out = sanitizeTrace(trace);
    expect(out.id).toBe('abc-123');
    expect(out.timestamp).toBe(12345);
    expect(out.successSignal).toBe(false);
    expect(out.filesChanged[0].diffSummary).toBe('updated docs');
  });
});
