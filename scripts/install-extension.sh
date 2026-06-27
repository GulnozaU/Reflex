#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npm run package:extension
npm run reflex -- install --local "packages/adapter-vscode/reflex-0.1.0.vsix" --editor cursor
