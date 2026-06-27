/**
 * Phase 1 automated verification (checks #2 static, #3, #4).
 * Check #1 (terminal probe) requires Extension Development Host — see README.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  initCaptureStore,
  closeCaptureStore,
  recordTrace,
  sanitizeTrace
} = require('../packages/skill-core/dist/index');
const { getTrace } = require('../packages/skill-core/dist/capture/db');

const RAW = 'sk-test1234567890abcdef';
let passed = 0;
let failed = 0;

function check(name, ok, detail) {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  console.log('\n=== Phase 1 Verification (automated) ===\n');

  console.log('Check #3: secret redaction in commandsRun');
  const sanitized = sanitizeTrace({
    id: 'live-1',
    timestamp: Date.now(),
    filesChanged: [],
    commandsRun: [{ cmd: `export FAKE_KEY=${RAW}`, exitCode: 0 }],
    errorSeen: [],
    successSignal: true
  });
  check('raw secret absent from sanitized output', !JSON.stringify(sanitized).includes(RAW));
  check('redaction marker in cmd', sanitized.commandsRun[0].cmd.includes('[REDACTED'));

  const dbPath = path.join(os.tmpdir(), `phase1-verify-${Date.now()}.db`);
  await initCaptureStore({ dbPath });

  recordTrace({
    id: 'live-2',
    timestamp: Date.now(),
    filesChanged: [],
    commandsRun: [{ cmd: `export FAKE_KEY=${RAW}`, exitCode: 0 }],
    errorSeen: [],
    successSignal: true
  });
  const storedCmd = getTrace('live-2');
  check('SQLite has no raw secret', storedCmd && !JSON.stringify(storedCmd).includes(RAW));
  check('SQLite cmd is redacted', storedCmd && storedCmd.commandsRun[0].cmd.includes('[REDACTED'));

  console.log('\nCheck #4: .env skip (no entry, not redacted)');
  recordTrace({
    id: 'live-3',
    timestamp: Date.now(),
    filesChanged: [
      { path: '.env', ext: 'env', diffSummary: `API_KEY=${RAW}` },
      { path: 'src/app.ts', ext: 'ts', diffSummary: 'normal change' }
    ],
    commandsRun: [],
    errorSeen: [],
    successSignal: true
  });
  const storedEnv = getTrace('live-3');
  check('.env absent from filesChanged', storedEnv && !storedEnv.filesChanged.some((f) => f.path === '.env'));
  check('src/app.ts still recorded', storedEnv && storedEnv.filesChanged.some((f) => f.path === 'src/app.ts'));
  check('raw .env secret absent from SQLite', storedEnv && !JSON.stringify(storedEnv).includes(RAW));

  closeCaptureStore();
  try {
    fs.unlinkSync(dbPath);
  } catch {
    /* ignore */
  }

  console.log('\nCheck #2: consent gate (static audit of extension.ts)');
  const extSrc = fs.readFileSync(
    path.join(__dirname, '../packages/adapter-vscode/src/extension.ts'),
    'utf8'
  );
  const initCallIdx = extSrc.indexOf('await initCaptureStore({ dbPath })');
  const fileListenerCallIdx = extSrc.indexOf('registerFileSaveListener(context');
  const grantedReturnIdx = extSrc.indexOf('if (!granted)');
  check('ensureConsent runs before initCaptureStore call', grantedReturnIdx < initCallIdx && initCallIdx !== -1);
  check('early return before registerFileSaveListener call', grantedReturnIdx < fileListenerCallIdx && fileListenerCallIdx !== -1);
  check('!granted path returns before any listener registration', extSrc.includes('if (!granted) {\n    return;\n  }'));
  check(
    'Not now persists false — no capture on reload',
    fs.readFileSync(path.join(__dirname, '../packages/adapter-vscode/src/consent.ts'), 'utf8').includes('update(CONSENT_KEY, false)')
  );

  console.log('\nCheck #1: terminal probe — MANUAL (Extension Development Host)');
  console.log('  Cmd+Shift+P → Debug: Start Debugging → Run Extension');
  console.log('  Output → AI Skill Terminal Probe → run echo hello');

  console.log(`\n=== Automated: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
