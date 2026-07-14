#!/usr/bin/env node
'use strict';

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const readline = require('readline');

/** Keep in sync with packages/skill-core/src/product.ts */
const PRODUCT_DEFINITION = 'Local-first workflow memory layer for coding agents and IDEs';
const INSTALL_TARGETS = 'Cursor and VS Code';
const COMPATIBLE_ASSISTANTS =
  'Claude Code, Codex, Cursor Agent, Copilot, and other assistants used inside those editors';

const SITE_URL = 'https://reflex-virid.vercel.app';
const VERSION = '0.1.0';
const CLI_VERSION = '0.1.7';
const VSIX_NAME = `reflex-${VERSION}.vsix`;
const EXTENSION_ID = 'reflex.reflex';
/** Hosted on static site — GitHub Releases often rejects .vsix uploads after publish. */
const DEFAULT_RELEASE_URL = `${SITE_URL}/${VSIX_NAME}`;

const EDITORS = {
  cursor: {
    label: 'Cursor',
    darwinApp: 'Cursor',
    darwinPath: '/Applications/Cursor.app',
    darwin: '/Applications/Cursor.app/Contents/Resources/app/bin/cursor',
    commands: ['cursor'],
    processPatterns: {
      darwin: ['Cursor'],
      linux: ['cursor'],
      win32: ['Cursor.exe', 'Cursor']
    }
  },
  vscode: {
    label: 'VS Code',
    darwinApp: 'Visual Studio Code',
    darwinPath: '/Applications/Visual Studio Code.app',
    darwin: '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
    commands: ['code'],
    processPatterns: {
      darwin: ['Code', 'Visual Studio Code'],
      linux: ['code'],
      win32: ['Code.exe', 'Code']
    }
  }
};

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = {
  reset: useColor ? '\x1b[0m' : '',
  bold: useColor ? '\x1b[1m' : '',
  dim: useColor ? '\x1b[2m' : '',
  green: useColor ? '\x1b[32m' : '',
  yellow: useColor ? '\x1b[33m' : '',
  red: useColor ? '\x1b[31m' : '',
  cyan: useColor ? '\x1b[36m' : '',
  gray: useColor ? '\x1b[90m' : ''
};

function icon(ok) {
  if (ok === true) return `${c.green}✔${c.reset}`;
  if (ok === false) return `${c.red}✖${c.reset}`;
  return `${c.cyan}›${c.reset}`;
}

function clearLine() {
  if (process.stderr.isTTY) {
    process.stderr.write('\r\x1b[K');
  }
}

function step(label) {
  process.stderr.write(`  ${icon(null)} ${label}`);
}

function finishStep(message) {
  clearLine();
  process.stderr.write(`  ${icon(true)} ${message}\n`);
}

function failStep(message) {
  clearLine();
  process.stderr.write(`  ${icon(false)} ${message}\n`);
}

function blank() {
  console.log('');
}

function printHelp() {
  console.log(`${c.bold}reflex${c.reset} ${c.dim}v${CLI_VERSION}${c.reset} — ${PRODUCT_DEFINITION}

${c.dim}Installs into${c.reset} ${INSTALL_TARGETS}.
${c.dim}Works with${c.reset} ${COMPATIBLE_ASSISTANTS}.

${c.bold}Usage${c.reset}
  npx @reflex1abs/cli                 Detect editor and install (recommended)
  reflex install [--editor cursor|vscode]
  reflex install --local <path>       Install a local .vsix file

${c.bold}Options${c.reset}
  --editor, -e     Target editor: cursor or vscode (auto-detected when omitted)
  --local, -l      Path to a .vsix file (skips download)
  --url            Override VSIX download URL
  --yes, -y        Skip restart confirmation prompts
  --help, -h       Show help
`);
}

function parseArgs(argv) {
  const args = {
    command: null,
    editor: null,
    local: null,
    url: process.env.REFLEX_VSIX_URL || DEFAULT_RELEASE_URL,
    yes: false,
    help: false
  };
  const rest = [...argv];

  if (rest.length === 0) {
    args.command = 'install';
    return args;
  }

  if (rest[0] === '--help' || rest[0] === '-h') {
    args.help = true;
    return args;
  }

  args.command = rest.shift();

  while (rest.length > 0) {
    const token = rest.shift();
    if (token === '--help' || token === '-h') {
      args.help = true;
    } else if (token === '--yes' || token === '-y') {
      args.yes = true;
    } else if (token === '--editor' || token === '-e') {
      args.editor = rest.shift();
    } else if (token === '--local' || token === '-l') {
      args.local = rest.shift();
    } else if (token === '--url') {
      args.url = rest.shift();
    } else if (!args.editor && (token === 'cursor' || token === 'vscode')) {
      args.editor = token;
    } else if (!args.local && token.endsWith('.vsix')) {
      args.local = token;
    }
  }

  return args;
}

function askYesNo(question, defaultYes = true) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      resolve(defaultYes);
      return;
    }

    const hint = defaultYes ? 'Y/n' : 'y/N';
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${question} ${c.dim}(${hint})${c.reset} `, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === '') {
        resolve(defaultYes);
        return;
      }
      resolve(trimmed === 'y' || trimmed === 'yes');
    });
  });
}

function isEditorAvailable(editorKey) {
  const spec = EDITORS[editorKey];
  if (!spec) return false;

  if (process.platform === 'darwin' && fs.existsSync(spec.darwin)) {
    return true;
  }

  for (const cmd of spec.commands) {
    const found = spawnSync('which', [cmd], { encoding: 'utf8' });
    if (found.status === 0) {
      return true;
    }
  }

  return false;
}

function listAvailableEditors() {
  return Object.keys(EDITORS).filter(isEditorAvailable);
}

function resolveEditorBinary(editorKey) {
  const spec = EDITORS[editorKey];
  if (!spec) {
    throw new Error(`Unknown editor "${editorKey}". Use cursor or vscode.`);
  }

  if (process.platform === 'darwin' && fs.existsSync(spec.darwin)) {
    return spec.darwin;
  }

  for (const cmd of spec.commands) {
    const found = spawnSync('which', [cmd], { encoding: 'utf8' });
    if (found.status === 0) {
      return found.stdout.trim();
    }
  }

  throw new Error(
    `${spec.label} CLI not found. Install ${spec.label} or add its CLI to your PATH, then run again.`
  );
}

function promptEditorChoice(available) {
  return new Promise((resolve, reject) => {
    if (available.length === 0) {
      reject(
        new Error(
          `No editor found. Reflex installs into ${INSTALL_TARGETS}.\n` +
            `Install Cursor or VS Code, then run: npx @reflex1abs/cli`
        )
      );
      return;
    }

    if (available.length === 1) {
      resolve(available[0]);
      return;
    }

    if (!process.stdin.isTTY) {
      reject(
        new Error(
          `Multiple editors found (${available.map((k) => EDITORS[k].label).join(', ')}). ` +
            `Pass --editor cursor or --editor vscode.`
        )
      );
      return;
    }

    console.log(`${c.bold}Multiple editors detected${c.reset}\n`);
    available.forEach((key, index) => {
      console.log(`  ${c.cyan}${index + 1}${c.reset}. ${EDITORS[key].label}`);
    });
    blank();

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`Choose editor ${c.dim}[1]${c.reset}: `, (answer) => {
      rl.close();
      const trimmed = answer.trim();
      const index = trimmed === '' ? 0 : Number.parseInt(trimmed, 10) - 1;
      if (Number.isNaN(index) || index < 0 || index >= available.length) {
        reject(new Error('Invalid choice. Pass --editor cursor or --editor vscode.'));
        return;
      }
      resolve(available[index]);
    });
  });
}

async function resolveEditor(editorArg) {
  if (editorArg) {
    if (!EDITORS[editorArg]) {
      throw new Error(`Unknown editor "${editorArg}". Use cursor or vscode.`);
    }
    if (!isEditorAvailable(editorArg)) {
      throw new Error(
        `${EDITORS[editorArg].label} was not found. Install it, or pass --editor for the editor you have.`
      );
    }
    return editorArg;
  }

  const available = listAvailableEditors();
  if (available.length === 1) {
    return available[0];
  }

  return promptEditorChoice(available);
}

function isEditorRunning(editorKey) {
  const spec = EDITORS[editorKey];
  const patterns = spec.processPatterns[process.platform] || spec.processPatterns.linux;

  if (process.platform === 'darwin') {
    const result = spawnSync('pgrep', ['-x', patterns[0]], { encoding: 'utf8' });
    if (result.status === 0 && result.stdout.trim()) {
      return true;
    }
    // Cursor sometimes registers as "Cursor Helper"; Code as "Code Helper"
    const broad = spawnSync('pgrep', ['-lf', spec.darwinApp], { encoding: 'utf8' });
    if (broad.status === 0 && broad.stdout.trim()) {
      return true;
    }
    return false;
  }

  if (process.platform === 'win32') {
    for (const name of patterns) {
      const result = spawnSync('tasklist', ['/FI', `IMAGENAME eq ${name}`], { encoding: 'utf8' });
      if (result.status === 0 && result.stdout && result.stdout.toLowerCase().includes(name.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  // Linux: match process command line
  const result = spawnSync('pgrep', ['-af', patterns[0]], { encoding: 'utf8' });
  return result.status === 0 && Boolean(result.stdout.trim());
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** True when this CLI is running inside Cursor/VS Code's integrated terminal. */
function isRunningInsideHostEditor(editorKey) {
  const termProgram = (process.env.TERM_PROGRAM || '').toLowerCase();
  const hasVscodeEnv = Boolean(process.env.VSCODE_PID || process.env.VSCODE_INJECTION);
  if (!hasVscodeEnv && termProgram !== 'vscode' && termProgram !== 'cursor') {
    return false;
  }
  // Cursor sets these; VS Code typically does not.
  const looksLikeCursor = Boolean(
    process.env.CURSOR_TRACE_ID ||
      process.env.CURSOR_AGENT ||
      process.env.CURSOR_SESSION_ID
  );
  if (editorKey === 'cursor') {
    return looksLikeCursor || hasVscodeEnv || termProgram === 'vscode' || termProgram === 'cursor';
  }
  if (editorKey === 'vscode') {
    return !looksLikeCursor && (hasVscodeEnv || termProgram === 'vscode');
  }
  return hasVscodeEnv;
}

/**
 * Schedule editor relaunch so it survives this process dying
 * (e.g. when install runs inside Cursor's terminal and we quit Cursor).
 */
function scheduleDetachedRelaunch(editorKey) {
  const spec = EDITORS[editorKey];
  const scriptPath = path.join(os.tmpdir(), `reflex-relaunch-${process.pid}.sh`);

  let body;
  if (process.platform === 'darwin') {
    body = `#!/bin/sh
sleep 2
/usr/bin/open -a "${spec.darwinApp}"
rm -f "$0"
`;
  } else if (process.platform === 'win32') {
    const batPath = path.join(os.tmpdir(), `reflex-relaunch-${process.pid}.cmd`);
    fs.writeFileSync(
      batPath,
      `@echo off\r\ntimeout /t 2 /nobreak >nul\r\nstart "" "${spec.commands[0]}"\r\ndel "%~f0"\r\n`
    );
    spawn('cmd.exe', ['/c', batPath], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
    return true;
  } else {
    const bin = (() => {
      try {
        return resolveEditorBinary(editorKey);
      } catch {
        return spec.commands[0];
      }
    })();
    body = `#!/bin/sh
sleep 2
nohup "${bin}" >/dev/null 2>&1 &
rm -f "$0"
`;
  }

  fs.writeFileSync(scriptPath, body, { mode: 0o755 });

  // New session + detached so SIGHUP from the dying editor terminal cannot kill us.
  const child = spawn('/bin/sh', [scriptPath], {
    detached: true,
    stdio: 'ignore',
    cwd: '/',
    env: { PATH: '/usr/bin:/bin:/usr/sbin:/sbin' }
  });
  child.unref();
  return true;
}

async function quitEditor(editorKey) {
  const spec = EDITORS[editorKey];

  if (process.platform === 'darwin') {
    // Non-blocking quit request — do not wait long if we're inside that editor.
    spawn('osascript', ['-e', `tell application "${spec.darwinApp}" to quit`], {
      detached: true,
      stdio: 'ignore'
    }).unref();
    return true;
  }

  if (process.platform === 'win32') {
    const names = spec.processPatterns.win32;
    for (const name of names) {
      spawn('taskkill', ['/IM', name], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
    }
    return true;
  }

  spawn('pkill', ['-f', spec.processPatterns.linux[0]], { detached: true, stdio: 'ignore' }).unref();
  return true;
}

function launchEditor(editorKey) {
  const spec = EDITORS[editorKey];

  if (process.platform === 'darwin' && fs.existsSync(spec.darwinPath)) {
    spawn('open', ['-a', spec.darwinApp], { detached: true, stdio: 'ignore' }).unref();
    return true;
  }

  if (process.platform === 'win32') {
    try {
      spawn('cmd', ['/c', 'start', '', spec.commands[0]], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      }).unref();
      return true;
    } catch {
      return false;
    }
  }

  try {
    const bin = resolveEditorBinary(editorKey);
    spawn(bin, [], { detached: true, stdio: 'ignore' }).unref();
    return true;
  } catch {
    return false;
  }
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    const request = (currentUrl) => {
      https
        .get(currentUrl, (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            request(res.headers.location);
            return;
          }

          if (res.statusCode !== 200) {
            reject(new Error(`Download failed (${res.statusCode}): ${currentUrl}`));
            return;
          }

          res.pipe(file);
          file.on('finish', () => file.close(() => resolve(dest)));
        })
        .on('error', reject);
    };

    file.on('error', reject);
    request(url);
  });
}

async function ensureVsix(localPath, url) {
  if (localPath) {
    const abs = path.resolve(localPath);
    if (!fs.existsSync(abs)) {
      throw new Error(`VSIX not found: ${abs}`);
    }
    return abs;
  }

  const tmp = path.join(os.tmpdir(), VSIX_NAME);
  await downloadFile(url, tmp);
  return tmp;
}

function listInstalledExtensions(editorKey) {
  const bin = resolveEditorBinary(editorKey);
  const result = spawnSync(bin, ['--list-extensions'], { encoding: 'utf8' });
  if (result.status !== 0) {
    return null;
  }
  return (result.stdout || '')
    .split('\n')
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean);
}

function verifyExtensionInstalled(editorKey) {
  const extensions = listInstalledExtensions(editorKey);
  if (!extensions) {
    return { ok: false, reason: 'list' };
  }

  const id = EXTENSION_ID.toLowerCase();
  const found = extensions.includes(id) || extensions.some((ext) => ext.endsWith('.reflex') || ext === 'reflex');
  return { ok: found, reason: found ? 'ok' : 'missing', extensions };
}

function installVsix(editorKey, vsixPath) {
  const bin = resolveEditorBinary(editorKey);
  const result = spawnSync(bin, ['--install-extension', vsixPath, '--force'], {
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    const hint =
      `Could not install into ${EDITORS[editorKey].label}.\n\n` +
      `Try:\n` +
      `  • Make sure ${EDITORS[editorKey].label} is installed and its CLI is on PATH\n` +
      `  • Run: ${EDITORS[editorKey].commands[0]} --install-extension ${vsixPath}\n` +
      (detail ? `\nDetails: ${detail}` : '');
    throw new Error(hint);
  }
}

function printSuccessManual(editorLabel) {
  blank();
  console.log(`  ${icon(true)} ${c.bold}Reflex installed successfully.${c.reset}`);
  blank();
  console.log(`  ${c.bold}Almost done.${c.reset}`);
  blank();
  console.log(`  Close and reopen ${editorLabel} once.`);
  console.log(`  Click ${c.bold}Enable${c.reset} when prompted — or click ${c.bold}Reflex${c.reset} in the bottom status bar.`);
  blank();
  console.log(`  ${c.dim}That's it. Keep coding — Reflex runs in the background.${c.reset}`);
  blank();
}

function printSuccessRestarted(editorLabel) {
  blank();
  console.log(`  ${icon(true)} ${c.bold}Reflex installed successfully.${c.reset}`);
  blank();
  console.log(`  ${editorLabel} is restarting.`);
  console.log(`  Click ${c.bold}Enable${c.reset} when prompted — or click ${c.bold}Reflex${c.reset} in the bottom status bar.`);
  blank();
  console.log(`  ${c.dim}That's it. Keep coding — Reflex runs in the background.${c.reset}`);
  blank();
}

function printSuccessOpened(editorLabel) {
  blank();
  console.log(`  ${icon(true)} ${c.bold}Reflex installed successfully.${c.reset}`);
  blank();
  console.log(`  Opening ${editorLabel}…`);
  console.log(`  Click ${c.bold}Enable${c.reset} when prompted — or click ${c.bold}Reflex${c.reset} in the bottom status bar.`);
  blank();
  console.log(`  ${c.dim}That's it. Keep coding — Reflex runs in the background.${c.reset}`);
  blank();
}

async function finishOnboarding(editorKey, { yes }) {
  const spec = EDITORS[editorKey];
  const running = isEditorRunning(editorKey);

  if (running) {
    blank();
    const inside = isRunningInsideHostEditor(editorKey);
    const question = inside
      ? `${spec.label} is currently running (this terminal is inside it). Restart it now to finish installing Reflex?`
      : `${spec.label} is currently running. Restart it now to finish installing Reflex?`;

    const shouldRestart = yes || (await askYesNo(question, true));

    if (shouldRestart) {
      // Schedule reopen FIRST — if this CLI is running inside the editor,
      // quitting the app kills this process before a post-quit launch can run.
      scheduleDetachedRelaunch(editorKey);

      blank();
      console.log(`  ${icon(true)} ${c.bold}Reflex installed successfully.${c.reset}`);
      blank();
      if (inside) {
        console.log(`  ${spec.label} will close and reopen in a couple of seconds.`);
        console.log(`  ${c.dim}(This terminal will close — that is expected.)${c.reset}`);
      } else {
        console.log(`  ${spec.label} is restarting.`);
      }
      console.log(`  Click ${c.bold}Enable${c.reset} when prompted — or click ${c.bold}Reflex${c.reset} in the bottom status bar.`);
      blank();
      console.log(`  ${c.dim}That's it. Keep coding — Reflex runs in the background.${c.reset}`);
      blank();

      // Let the success message flush, then quit the editor.
      await sleep(400);
      await quitEditor(editorKey);

      // If we survive (ran from an external terminal), wait briefly for reopen.
      await sleep(2500);
      return;
    }

    printSuccessManual(spec.label);
    return;
  }

  // Editor not running — open it if we can
  if (process.stdin.isTTY) {
    const shouldOpen =
      yes || (await askYesNo(`Open ${spec.label} now to finish setup?`, true));
    if (shouldOpen) {
      step(`Opening ${spec.label}…`);
      const launched = launchEditor(editorKey);
      if (launched) {
        finishStep(`Opening ${spec.label}`);
        printSuccessOpened(spec.label);
        return;
      }
      failStep(`Could not open ${spec.label} automatically`);
    }
  }

  printSuccessManual(spec.label);
}

async function runInstall(args) {
  blank();
  console.log(`  ${c.bold}Reflex${c.reset} ${c.dim}v${CLI_VERSION}${c.reset}`);
  console.log(`  ${c.dim}${PRODUCT_DEFINITION}${c.reset}`);
  blank();

  // 1. Detect editor
  step('Detecting editor…');
  let editor;
  let spec;
  try {
    const available = args.editor ? null : listAvailableEditors();
    if (!args.editor && available && available.length > 1) {
      clearLine();
      process.stderr.write(`  ${icon(null)} Multiple editors found\n`);
    }
    editor = await resolveEditor(args.editor);
    spec = EDITORS[editor];
    finishStep(`Detected ${spec.label}`);
  } catch (err) {
    failStep('Could not detect editor');
    throw err;
  }

  // 2. Download
  step(args.local ? 'Using local VSIX…' : 'Downloading Reflex…');
  let vsix;
  try {
    vsix = await ensureVsix(args.local, args.url);
    finishStep(args.local ? `Using ${path.basename(vsix)}` : `Downloaded ${VSIX_NAME}`);
  } catch (err) {
    failStep('Download failed');
    throw err;
  }

  // 3. Install
  step(`Installing extension into ${spec.label}…`);
  try {
    installVsix(editor, vsix);
    finishStep(`Installed into ${spec.label}`);
  } catch (err) {
    failStep('Installation failed');
    throw err;
  }

  // 4. Verify
  step('Verifying installation…');
  const verified = verifyExtensionInstalled(editor);
  if (!verified.ok) {
    failStep('Could not verify installation');
    throw new Error(
      `Reflex was not found in ${spec.label} after install.\n\n` +
        `Try again:\n` +
        `  npx @reflex1abs/cli --editor ${editor}\n\n` +
        `Or install manually:\n` +
        `  ${spec.commands[0]} --install-extension ${vsix}`
    );
  }
  finishStep(`Verified ${EXTENSION_ID}`);

  step('Done.');
  finishStep('Done');

  await finishOnboarding(editor, { yes: args.yes });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  try {
    if (args.command === 'install') {
      await runInstall(args);
      return;
    }

    throw new Error(`Unknown command "${args.command}". Run: npx @reflex1abs/cli --help`);
  } catch (err) {
    if (typeof clearLine === 'function') {
      clearLine();
    }
    blank();
    console.error(`  ${icon(false)} ${c.bold}error${c.reset}  ${err instanceof Error ? err.message : err}`);
    blank();
    process.exit(1);
  }
}

main();
