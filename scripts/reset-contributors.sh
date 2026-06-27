#!/usr/bin/env bash
# Squash all history into one commit so GitHub rebuilds the Contributors graph
# without cursoragent (from an old Co-authored-by push that GitHub still caches).
#
# WARNING: Rewrites main history. Only run on a solo repo when you are OK losing
# individual commit history.
#
# Usage:
#   bash scripts/reset-contributors.sh
#   git push --force-with-lease origin main

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Note: uncommitted changes will be included in the squashed commit."
  git status -sb
  echo ""
fi

echo "This will replace all commit history with a single commit."
echo "Remote: $(git remote get-url origin)"
read -r -p "Continue? [y/N] " ans
[[ "${ans:-}" =~ ^[Yy]$ ]] || exit 0

CURRENT_BRANCH="$(git branch --show-current)"
git checkout --orphan reflex-clean-main
git add -A
git -c core.hooksPath=.githooks commit -m "$(cat <<'EOF'
Reflex v0.1.0

Local-first workflow memory for AI coding sessions.
EOF
)"
git branch -D "$CURRENT_BRANCH" 2>/dev/null || true
git branch -m "$CURRENT_BRANCH"

echo ""
echo "Done. History is now one commit with no Cursor co-author."
echo ""
echo "Push with (note the space before main):"
echo "  git push --force-with-lease origin main"
echo ""
echo "Also disable future attribution in Cursor:"
echo "  Settings → Agents → Attribution → turn OFF Commit Attribution"
