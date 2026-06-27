#!/usr/bin/env bash
# Upload reflex VSIX to GitHub Releases (draft → attach → publish).
# GitHub "immutable releases" block adding assets AFTER a release is published.
#
# Usage:
#   export GITHUB_TOKEN=ghp_...   # repo scope, or `gh auth token` if gh is installed
#   bash scripts/publish-github-release.sh [tag] [path-to.vsix]
#
# Example:
#   bash scripts/publish-github-release.sh v0.1.0 packages/adapter-vscode/reflex-0.1.0.vsix

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TAG="${1:-v0.1.0}"
VSIX="${2:-$ROOT/packages/adapter-vscode/reflex-0.1.0.vsix}"
REPO="GulnozaU/Reflex"
ASSET_NAME="$(basename "$VSIX")"

if [[ ! -f "$VSIX" ]]; then
  echo "VSIX not found: $VSIX"
  echo "Run: npm run package:extension"
  exit 1
fi

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  if command -v gh >/dev/null 2>&1; then
    GITHUB_TOKEN="$(gh auth token)"
  else
    echo "Set GITHUB_TOKEN (Personal Access Token with repo scope)."
    echo "Create one: https://github.com/settings/tokens"
    exit 1
  fi
fi

API="https://api.github.com/repos/${REPO}/releases"
AUTH=(-H "Authorization: Bearer ${GITHUB_TOKEN}" -H "Accept: application/vnd.github+json")

echo "Checking for existing release ${TAG}..."
EXISTING="$(curl -sS "${AUTH[@]}" "${API}/tags/${TAG}" || true)"
RELEASE_ID="$(echo "$EXISTING" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || true)"

if [[ -n "$RELEASE_ID" && "$RELEASE_ID" != "None" ]]; then
  echo "Release ${TAG} already exists (id=${RELEASE_ID})."
  echo "If upload failed before, delete the release on GitHub and re-run this script."
  UPLOAD_URL="$(echo "$EXISTING" | python3 -c "import sys,json; print(json.load(sys.stdin)['upload_url'].split('{')[0])")"
else
  echo "Creating draft release ${TAG}..."
  CREATE="$(curl -sS "${AUTH[@]}" -X POST "$API" \
    -d "{\"tag_name\":\"${TAG}\",\"name\":\"${TAG}\",\"body\":\"Reflex editor extension\",\"draft\":true}")"
  RELEASE_ID="$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")"
  UPLOAD_URL="$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin)['upload_url'].split('{')[0])")"
  echo "Draft release id=${RELEASE_ID}"
fi

echo "Uploading ${ASSET_NAME}..."
curl -sS "${AUTH[@]}" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @"$VSIX" \
  "${UPLOAD_URL}?name=${ASSET_NAME}" >/dev/null

echo "Publishing release..."
curl -sS "${AUTH[@]}" -X PATCH "${API}/${RELEASE_ID}" -d '{"draft":false}' >/dev/null

echo ""
echo "Done."
echo "  Release: https://github.com/${REPO}/releases/tag/${TAG}"
echo "  Asset:   https://github.com/${REPO}/releases/download/${TAG}/${ASSET_NAME}"
echo ""
echo "Also copy the VSIX to the website for the CLI default URL:"
echo "  cp \"$VSIX\" packages/website/public/${ASSET_NAME}"
