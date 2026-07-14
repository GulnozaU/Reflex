#!/usr/bin/env bash
# End-to-end Reflex smoke test — isolated Cursor profile, user-like file edits.
# Does not touch your real Cursor settings.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CURSOR_BIN="${CURSOR_BIN:-/Applications/Cursor.app/Contents/Resources/app/bin/cursor}"
VSIX="${VSIX:-$ROOT/packages/adapter-vscode/reflex-0.1.5.vsix}"
PROFILE="${PROFILE:-/tmp/reflex-e2e-user}"
WORK="${WORK:-/tmp/reflex-e2e-user-ws}"
LOG="${LOG:-/tmp/reflex-e2e-test.log}"

: > "$LOG"
log() { echo "$@" | tee -a "$LOG"; }

if [[ ! -x "$CURSOR_BIN" ]]; then
  log "Cursor CLI not found at $CURSOR_BIN"
  exit 1
fi
if [[ ! -f "$VSIX" ]]; then
  log "Missing VSIX: $VSIX (run: cd packages/adapter-vscode && npm run package)"
  exit 1
fi

log "=== Reflex E2E user simulation $(date) ==="
log "vsix=$VSIX"
log "profile=$PROFILE"

pkill -f "user-data-dir=$PROFILE" 2>/dev/null || true
sleep 1
rm -rf "$PROFILE" "$WORK"
mkdir -p "$WORK/src"
printf '%s\n' 'export const x = 1;' > "$WORK/src/app.ts"

log ""
log "[1] Install extension into isolated profile…"
"$CURSOR_BIN" --user-data-dir "$PROFILE" --extensions-dir "$PROFILE/extensions" \
  --install-extension "$VSIX" --force >>"$LOG" 2>&1
log "✔ Installed"

log ""
log "[2] Launch Cursor (auto-enable for headless E2E)…"
export REFLEX_AUTO_ENABLE=1
"$CURSOR_BIN" --user-data-dir "$PROFILE" --extensions-dir "$PROFILE/extensions" \
  --suppress-popups-on-startup "$WORK" >>"$LOG" 2>&1 &
BPID=$!
sleep 16

REFLEX_LOG="$(find "$PROFILE/logs" -name '*Reflex*' 2>/dev/null | head -1 || true)"
if [[ -z "$REFLEX_LOG" ]] || ! grep -q 'Ready — capturing locally' "$REFLEX_LOG"; then
  log "FAIL: extension did not reach Ready"
  [[ -n "$REFLEX_LOG" ]] && cat "$REFLEX_LOG" | tee -a "$LOG"
  kill "$BPID" 2>/dev/null || true
  pkill -f "user-data-dir=$PROFILE" 2>/dev/null || true
  exit 1
fi
log "✔ Ready — capturing locally"

STORAGE="$PROFILE/User/globalStorage/reflex.reflex/traces.db"
if [[ ! -f "$STORAGE" ]]; then
  log "FAIL: traces.db not created at $STORAGE"
  kill "$BPID" 2>/dev/null || true
  pkill -f "user-data-dir=$PROFILE" 2>/dev/null || true
  exit 1
fi
log "✔ traces.db created"

log ""
log "[3] Edit files like a user…"
printf '%s\n' 'export const x = 2;' > "$WORK/src/app.ts"
sleep 1
printf '%s\n' 'export const x = 42;' > "$WORK/src/app.ts"
sleep 1
printf '%s\n' 'export function hello() { return 1 }' > "$WORK/src/hello.ts"
sleep 5

COUNT="$(python3 - <<PY
import sqlite3
c = sqlite3.connect("$STORAGE")
print(c.execute("select count(*) from traces").fetchone()[0])
PY
)"
log "trace_count=$COUNT"
if [[ "$COUNT" -lt 1 ]]; then
  log "FAIL: expected file-change traces"
  cat "$REFLEX_LOG" | tee -a "$LOG"
  kill "$BPID" 2>/dev/null || true
  pkill -f "user-data-dir=$PROFILE" 2>/dev/null || true
  exit 1
fi
log "✔ Captured file changes"

grep -E '\[capture\]|Ready|ERROR' "$REFLEX_LOG" | tee -a "$LOG" || true

kill "$BPID" 2>/dev/null || true
pkill -f "user-data-dir=$PROFILE" 2>/dev/null || true

log ""
log "=== PASS: user-path E2E ==="
