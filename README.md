# Reflex

Local-first workflow memory layer for coding agents and IDEs.

**Website:** [https://reflex-virid.vercel.app](https://reflex-virid.vercel.app)

Captures file edits and terminal output, detects repeated debugging loops with rule-based matching, and surfaces saved fix summaries. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system definition.

## Architecture

```
packages/skill-core/       — capture, detection, storage, replay (single source of truth)
packages/adapter-vscode/   — thin VS Code/Cursor wiring (events + UI only)
packages/reflex-cli/       — unified install entry point
packages/website/          — marketing site
```

**Install targets:** Cursor and VS Code (VS Code–compatible editors).

**Compatible assistants:** Claude Code, Codex, Cursor Agent, Copilot, and others used inside those editors — observed via the same file + terminal capture path. No separate Claude Code or Codex adapters.

## Install

```bash
npx @reflex1abs/cli
```

Detects Cursor or VS Code, downloads the extension, installs it, verifies the install, and can restart your editor. Click **Enable** on the one-time consent prompt. No Reflex account or API key required.

From the repo during development:

```bash
npm install
npm run reflex
```

## Local-first (one definition)

- All session data stored on-device only
- No code, terminal output, or file contents sent to a Reflex server
- No accounts required for core functionality
- Pattern detection runs locally in skill-core — no model calls
- Same local data format everywhere: `traces.db` + `.local-patterns/`

## What it does today

### Capture

- File saves and edits (including agent-applied changes)
- Terminal commands and exit codes (when shell integration is available)
- Secrets redacted before SQLite storage; `.env` and credential paths skipped

### Detection

- Rule-based loop matching via `detectAllLoops()` in skill-core
- Test-fix loops, type-error cycles, API/schema failures

### Save

- After you approve, patterns written to `.local-patterns/patterns.json`

### Replay

- Status bar hint when a similar situation starts
- Prompt to view saved fix summary (Helped / Didn't help / Dismiss) — not auto-apply

## Development

### Run tests

```bash
npm install
npm run test:sanitize
npm test
```

### Run extension locally

```bash
npm run build:core
npm run build:adapter
```

Press **F5** → consent dialog → Enable → save files / run terminal commands.

### Build website

```bash
npm run build:website
```

## Clarity test

| Question | Answer |
|----------|--------|
| What does Reflex store? | Sanitized file edits, terminal commands, error snippets |
| Where does data live? | `traces.db` + `.local-patterns/` |
| What runs locally? | Capture, detection, patterns, replay (skill-core) |
| What is shared? | One extension adapter + one data format |

## License

MIT — see [LICENSE](LICENSE).

## Git hooks (optional)

```bash
git config core.hooksPath .githooks
```

Also turn off **Cursor Settings → Agents → Attribution → Commit Attribution**.
