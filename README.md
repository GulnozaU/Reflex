# Reflex

Local-first VS Code/Cursor/Claude extension that captures coding session traces to detect repeated workflows.

## Architecture

```
packages/skill-core/      — all logic (no vscode imports)
packages/adapter-vscode/  — thin VS Code wiring only
```

## Phase 1: Capture

### Run tests (sanitize first — always)

```bash
npm install
npm run test:sanitize   # 15 tests — secret redaction patterns
npm test                # all skill-core tests (18)
```

### Run extension

```bash
npm run build:core
npm run build:adapter
```

Press **F5** → consent dialog → Enable → save files / run terminal commands.

Check **Output → AI Skill Terminal Probe** for terminal API confirmation.

## What Phase 1 does

- Sanitizes traces before SQLite storage (API keys, tokens, AWS, private keys, skip .env/.pem/etc.)
- Records file saves and terminal commands locally
- Nothing leaves your machine
- No detection, no skill generation yet (Phase 2+)

## License

MIT — see [LICENSE](LICENSE).

## Git hooks (optional)

To stop Cursor from being added as a co-author on commits (which shows up on GitHub Contributors):

```bash
git config core.hooksPath .githooks
```

Also turn off **Cursor Settings → Agents → Attribution → Commit Attribution**.

If `cursoragent` still appears on GitHub after cleaning history, run:

```bash
bash scripts/reset-contributors.sh
git push --force-with-lease origin main
```

That squashes history into one commit so GitHub rebuilds the Contributors graph.
