#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npm run package:extension

VSIX="$(ls -1 "$ROOT"/packages/adapter-vscode/reflex-*.vsix | tail -1)"
BASENAME="$(basename "$VSIX")"

cp "$VSIX" "$ROOT/packages/website/public/$BASENAME"

echo ""
echo "Built: $VSIX"
echo "Copied to: packages/website/public/$BASENAME"
echo ""
echo "Install for users (after you deploy the website):"
echo "  npx @reflex1abs/cli install --editor cursor"
echo ""
echo "Download URL: https://reflex-virid.vercel.app/$BASENAME"
echo ""
echo "GitHub Releases often blocks .vsix uploads on published releases."
echo "Either deploy the website (recommended) or run:"
echo "  export GITHUB_TOKEN=ghp_... && bash scripts/publish-github-release.sh v0.1.0 \"$VSIX\""
