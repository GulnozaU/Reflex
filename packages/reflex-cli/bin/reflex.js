#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');

const GITHUB_REPO = 'GulnozaU/Reflex';
const SITE_URL = 'https://reflex-virid.vercel.app';
const VERSION = '0.1.0';
const VSIX_NAME = `reflex-${VERSION}.vsix`;
/** Hosted on the website — GitHub Releases often rejects .vsix uploads after publish. */
const DEFAULT_RELEASE_URL = `${SITE_URL}/${VSIX_NAME}`;
const GITHUB_RELEASE_URL = `https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/${VSIX_NAME}`;

const EDITORS = {
  cursor: {
    label: 'Cursor',
    darwin: '/Applications/Cursor.app/Contents/Resources/app/bin/cursor',
    commands: ['cursor']
  },
  vscode: {
    label: 'VS Code',
    darwin: '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
    commands: ['code']
  }
};

function printHelp() {
  console.log(`reflex v${VERSION} — install the Reflex editor extension

Usage:
  reflex install --editor <cursor|vscode>
  reflex setup claude          Install for Cursor + Claude workflow setup
  reflex install --local <path>  Install a local .vsix file

Options:
  --editor, -e     Target editor: cursor or vscode
  --local, -l      Path to a .vsix file (skips download)
  --url            Override VSIX download URL (default: latest release)
  --help, -h       Show help

Examples:
  npx @reflex1abs/cli install --editor cursor
  npx @reflex1abs/cli install --editor vscode
  npx @reflex1abs/cli setup claude
`);
}

function parseArgs(argv) {
  const args = {
    command: null,
    target: null,
    editor: null,
    local: null,
    url: process.env.REFLEX_VSIX_URL || DEFAULT_RELEASE_URL,
    help: false
  };
  const rest = [...argv];

  if (rest.length === 0 || rest[0] === '--help' || rest[0] === '-h') {
    args.help = true;
    return args;
  }

  args.command = rest.shift();

  if (args.command === 'setup' && rest[0] && !rest[0].startsWith('-')) {
    args.target = rest.shift();
  }

  while (rest.length > 0) {
    const token = rest.shift();
    if (token === '--help' || token === '-h') {
      args.help = true;
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
    `${spec.label} CLI not found. On macOS, install ${spec.label} or add its bin directory to PATH.`
  );
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
  process.stderr.write(`Downloading ${VSIX_NAME}…\n`);
  await downloadFile(url, tmp);
  return tmp;
}

function installVsix(editorKey, vsixPath) {
  const bin = resolveEditorBinary(editorKey);
  const spec = EDITORS[editorKey];

  process.stderr.write(`Installing into ${spec.label}…\n`);
  const result = spawnSync(bin, ['--install-extension', vsixPath], { stdio: 'inherit' });

  if (result.status !== 0) {
    throw new Error(`Install failed for ${spec.label}.`);
  }

  console.log(`\nReflex installed in ${spec.label}. Reload the editor window.`);
}

function setupClaude() {
  console.log(`
Reflex + Claude setup
─────────────────────
Reflex is an editor extension — it runs inside Cursor (or VS Code), not inside Claude Code CLI.

1. Installing Reflex into Cursor…
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.command) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  try {
    if (args.command === 'install') {
      if (!args.editor) {
        throw new Error('Missing --editor. Use cursor or vscode.');
      }
      const vsix = await ensureVsix(args.local, args.url);
      installVsix(args.editor, vsix);
      return;
    }

    if (args.command === 'setup') {
      if (args.target !== 'claude') {
        throw new Error('Unknown setup target. Use: reflex setup claude');
      }
      setupClaude();
      const vsix = await ensureVsix(args.local, args.url);
      installVsix('cursor', vsix);
      console.log(`
Next steps for Claude:
  1. Open Cursor and reload the window
  2. Open your project folder
  3. Use Claude in the agent panel as usual — Reflex captures sessions locally
  4. Accept the consent prompt on first run

Reflex does not install into Claude Code terminal CLI.
`);
      return;
    }

    throw new Error(`Unknown command "${args.command}". Run reflex --help.`);
  } catch (err) {
    console.error(`error: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

main();
