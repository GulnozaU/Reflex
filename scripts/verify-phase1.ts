/**
 * Phase 1 live verification script (runs outside VS Code).
 * Checks sanitize + SQLite persistence for checks #3 and #4.
 * Run: npx tsx scripts/verify-phase1.ts
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  initCaptureStore,
  closeCaptureStore,
  recordTrace,
  sanitizeTrace
} from '../packages/skill-core/src/index';
import { getTrace } from '../packages/skill-core/src/capture/db';
import { TraceRecord } from '../packages/skill-core/src/types';

const RAW_SECRET = 'sk-test1234567890abcdef';
const dbPath = path.join(os.tmpdir(), `phase1-verify-${Date.now()}.db`);

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail?: string): void {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('\n=== Phase 1 Verification ===\n');

// ── Check #3: live secret redaction in terminal command ──
console.log('Check #3: secret redaction in commandsRun (live simulation)');
const cmdWithSecret = `export FAKE_KEY=${RAW_SECRET}`;
const sanitized = sanitizeTrace({
  id: 'live-1',
  timestamp: Date.now(),
  filesChanged: [],
  commandsRun: [{ cmd: cmdWithSecret, exitCode: 0 }],
  errorSeen: [],
  successSignal: true
});
check('raw secret absent from sanitized cmd', !JSON.stringify(sanitized).includes(RAW_SECRET));
check('redaction marker present', sanitized.commandsRun[0].cmd.includes('[REDACTED'));

initCaptureStore({ dbPath });
recordTrace({
  id: 'live-2',
  timestamp: Date.now(),
  filesChanged: [],
  commandsRun: [{ cmd: cmdWithSecret, exitCode: 0 }],
  errorSeen: [],
  successSignal: true
});
const storedCmd = getTrace('live-2');
check(
  'SQLite row has no raw secret',
  storedCmd !== null && !JSON.stringify(storedCmd).includes(RAW_SECRET)
);
check(
  'SQLite row has redacted cmd',
  storedCmd !== null && storedCmd.commandsRun[0].cmd.includes('[REDACTED')
);

// ── Check #4: .env skip (no entry at all, not redacted) ──
console.log('\nCheck #4: .env file skip (no diff recorded at all)');
recordTrace({
  id: 'live-3',
  timestamp: Date.now(),
  filesChanged: [
    { path: '.env', ext: 'env', diffSummary: `API_KEY=${RAW_SECRET}` },
    { path: 'src/app.ts', ext: 'ts', diffSummary: 'normal change' }
  ],
  commandsRun: [],
  errorSeen: [],
  successSignal: true
});
const storedEnv = getTrace('live-3');
check('.env file absent from filesChanged', storedEnv !== null && !storedEnv.filesChanged.some((f) => f.path === '.env'));
check('allowed file still recorded', storedEnv !== null && storedEnv.filesChanged.some((f) => f.path === 'src/app.ts'));
check('no .env redacted entry (not even [REDACTED])', storedEnv !== null && storedEnv.filesChanged.every((f) => !f.path.includes('.env')));
check('raw secret from .env absent from SQLite', storedEnv !== null && !JSON.stringify(storedEnv).includes(RAW_SECRET));

closeCaptureStore();
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

// ── Check #2: consent gate (static code audit) ──
console.log('\nCheck #2: consent gate (static audit of extension.ts)');
const extSrc = fs.readFileSync(
  path.join(__dirname, '../packages/adapter-vscode/src/extension.ts'),
  'utf8'
);
const consentBeforeListeners =
  extSrc.indexOf('ensureConsent') < extSrc.indexOf('registerFileSaveListener') &&
  extSrc.includes('if (!granted) {\n    return;\n  }');
const initAfterConsent =
  extSrc.indexOf('initCaptureStore') > extSrc.indexOf('if (!granted)');
check('early return before initCaptureStore', initAfterConsent);
check('registerFileSaveListener only after consent check', consentBeforeListeners);
check('no listeners registered on !granted path (single return)', (extSrc.match(/registerFileSaveListener/g) || []).length === 1);

console.log('\nCheck #1: terminal probe (requires F5 in Cursor — cannot run headless)');
console.log('  MANUAL  Open Output → AI Skill Terminal Probe after F5');
console.log('  MANUAL  Run: echo hello');
console.log('  MANUAL  Expect: [probe] cmd="echo hello" exitCode=0');
console.log('  MANUAL  If NOT available → STOP before Phase 2');

console.log(`\n=== Results: ${passed} passed, ${failed} failed (automated) ===\n`);
process.exit(failed > 0 ? 1 : 0);
