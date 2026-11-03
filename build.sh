#!/usr/bin/env bash
# Packages only the extension's own files into dist/do-it-<version>.zip
# (ready for the Chrome Web Store, Edge Add-ons, or sharing for "Load unpacked").
set -euo pipefail
cd "$(dirname "$0")"

FILES=(manifest.json index.html app.js background.js sync.js update.js telemetry.js icons)
VERSION=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' manifest.json)
OUT="dist/do-it-$VERSION.zip"

for f in app.js background.js sync.js update.js telemetry.js; do node --check "$f"; done

mkdir -p dist
rm -f "$OUT"
zip -qr -X "$OUT" "${FILES[@]}" -x '*.DS_Store'
echo "Built $OUT"
unzip -l "$OUT"
