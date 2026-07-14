# Reflex Architecture

Reflex is a **local-first workflow memory layer for coding agents and IDEs**.

It is **not** an AI model, cloud service, code generator, or agent framework.

It **is**:

- a local event capture system
- a pattern detection engine
- a reusable workflow memory system

## Packages

```
packages/skill-core/       — all capture, detection, storage, replay logic
packages/adapter-vscode/   — thin VS Code/Cursor wiring (events + UI only)
packages/reflex-cli/       — unified install entry point (distribution only)
packages/website/          — marketing site
```

## Adapters (current)

| Surface | Implementation | Role |
|---------|----------------|------|
| **Cursor** | Same VS Code extension (`.vsix`) | Capture + UI |
| **VS Code** | Same VS Code extension (`.vsix`) | Capture + UI |
| **Claude Code, Codex, etc.** | No separate adapter | Observed via file + terminal capture when used **inside** Cursor or VS Code |

There is **one** extension adapter. The CLI installs it into VS Code–compatible editors only.

```bash
npx @reflex1abs/cli
```

The CLI detects Cursor or VS Code, downloads the extension from static hosting, and installs it. It does not branch into different products per assistant.

## Local-first (one definition)

- All session data is stored **on-device only**
- No code, terminal output, or file contents are sent to a Reflex server
- No user accounts are required for core functionality
- Pattern detection runs locally in **skill-core** (rule-based, no model calls)
- All capture paths write to the **same local data format**

### Data locations

| Data | Location |
|------|----------|
| Session traces | `traces.db` — SQLite in editor global storage |
| Saved patterns | `.local-patterns/patterns.json` — JSON in your project |
| Outcomes (optional) | `.local-patterns/outcomes.jsonl` |

## skill-core responsibilities

- Sanitize and record traces
- Loop detection (`detectAllLoops`)
- Pattern save/load
- Replay matching

Adapters must **not** duplicate detection logic. They forward events, call skill-core, and render UI (consent, save prompt, status bar replay).

## Clarity test

A new developer should be able to answer:

| Question | Answer |
|----------|--------|
| **What does Reflex store?** | Sanitized file-edit metadata, terminal commands, exit codes, error snippets |
| **Where does data live?** | `traces.db` (editor storage) + `.local-patterns/` (project) |
| **What runs locally?** | Capture, sanitization, detection, pattern storage, replay matching |
| **What is shared across IDEs?** | One extension + one skill-core format — assistants are not separate backends |

## Not included

- Reflex backend or cloud sync
- User accounts or auth
- Standalone Claude Code CLI or Codex adapters
- Auto-apply of saved fixes (replay surfaces summaries; you decide)
