# Reflex coding session — Use in Agent

Engineering notes from an AI coding-agent session that designed and implemented a small vertical slice: give a matched Reflex pattern back to the AI coding workflow.

## Goal

Close the Reflex loop with an AI coding agent:

1. Agent/user workflows are observed.
2. A repeated successful fix is approved and saved.
3. Later, a similar failure is recognized.
4. The learned pattern is returned to the **agent** interaction — not only shown to the human.

Constraint: stay on the existing architecture; no new storage or detection system; don’t fake the demo with a Markdown file the agent might ignore.

## Existing capture → detect → save → replay

Inspected before implementing.

- **Packages:** `skill-core` owns capture, loop detection, pattern store, and replay matching. `adapter-vscode` is thin VS Code/Cursor wiring.
- **Capture:** file edits + terminal commands → sanitized traces in `traces.db`.
- **Detect / save:** completed fail→edit→pass loops (`TYPE_ERROR_LOOP`, `TEST_FIX_LOOP`, `API_SCHEMA_LOOP`). After enough repeats, Save/Ignore; on Save → `.local-patterns/patterns.json`.
- **Replay (before this work):** on partial match start (`detectPartialMatchStart` + `findRelevantPattern` by loop type + file-extension shape), status bar **Pattern available** → toast with `fixSummary` and Helped / Didn't help / Dismiss.

Replay was human-only. The agent never received the pattern.

## Closing the agent loop — question and API limits

Question raised: does exporting memory (e.g. writing a file and hoping an agent reads it) actually close the loop?

Checked what VS Code/Cursor extensions can do:

- No public API to inject text into Cursor Agent chat the way VS Code Copilot’s `workbench.action.chat.open` can take a query.
- Cursor plugins/skills are closer to static guidance the agent may use — not a matched-pattern handoff.
- VS Code Language Model Tools can expose tools to Copilot Agent; Cursor Agent support was unclear and out of scope for a small slice.

**Choice:** user-triggered **Use in Agent** on the existing matched-pattern path. Explicit click; uses already-matched `SavedPattern`; strongest real fallback when direct injection isn’t available.

## Implementation

Branch: `cursor/use-in-agent-replay-ab2b`  
PR: https://github.com/GulnozaU/Reflex/pull/1

### Files

| File | Change |
|------|--------|
| `packages/adapter-vscode/src/patternReplay.ts` | Add **Use in Agent** to the pattern toast; register `reflex.useInAgent` |
| `packages/adapter-vscode/src/sendToAgent.ts` | Format prompt; host insert + clipboard fallback |
| `packages/adapter-vscode/package.json` | Contribute commands; add `reflex.forceClipboardAgentFallback` |

No skill-core or storage changes.

### Behavior

When a saved pattern already matches and the status bar is shown:

1. Click status bar → toast includes **Use in Agent**.
2. Formats `loopType`, `filesInvolved`, `fixSummary` into a short agent prompt.
3. Inserts into agent chat by host:
   - **VS Code:** `workbench.action.chat.open` with query / `isPartialQuery`.
   - **Cursor:** composer open (`composer.newAgentChat` and fallbacks) + clipboard paste.
4. If insert fails: leave prompt on clipboard + toast to paste.
5. Command palette: **Reflex: Use Matched Pattern in Agent** when `activePattern` is set.

## Bug: Cursor “success” without insert

First `sendToAgent` tried `workbench.action.chat.open` first. On Cursor that command can **resolve without throwing** and **without putting the query in Agent**, so we returned early and never ran composer + paste.

**Fix:** detect Cursor via `vscode.env.appName`; skip `workbench.action.chat.open` on Cursor; use composer + paste. Also log each step to the Reflex output channel as `[use-in-agent] …`, and add setting `reflex.forceClipboardAgentFallback` to force the clipboard-only path for fallback testing.

## Testing and packaging that actually happened

Done in this session:

- Inspected architecture and APIs; designed the slice before coding.
- Implemented on the branch; webpack build of the adapter succeeded; skill-core unit tests passed (45).
- Reviewed the diff; found and fixed the Cursor false-success path; pushed follow-up commit.
- Clarified distribution: `@reflex1abs/cli` downloads a hosted VSIX; extension changes don’t require an npm republish. For branch testing, use a local VSIX:

```bash
npm install
npm run build:core
npm run package:extension
npx @reflex1abs/cli install --local packages/adapter-vscode/reflex-0.1.5.vsix --editor cursor
```

**Not done in this session:** packaging the VSIX in this environment for the user, installing into a live Cursor UI, or running an end-to-end match → Use in Agent → composer insert test. Those remain for local manual verification.

## Still to verify manually

1. Seed `.local-patterns/patterns.json`, touch a matching extension file, fail a test/build command with shell integration → status bar appears.
2. **Use in Agent** → prompt appears in Cursor Agent (check Reflex output for `opened with` / `pasted`).
3. Enable `reflex.forceClipboardAgentFallback` → clipboard toast path.
4. Watch for paste landing in the wrong focused input if composer focus is slow (~300ms delay).

Match caveat (pre-existing): partial match shape uses file extensions on the current session trace; a failing test alone with no prior `.ts` (etc.) file change may not match a seeded `…:ts` pattern.
