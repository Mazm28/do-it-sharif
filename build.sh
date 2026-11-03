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

# Firefox: background runs as a script list instead of a service worker, and needs an add-on ID
FF_OUT="dist/do-it-$VERSION-firefox.zip"
FF_DIR=$(mktemp -d)
trap 'rm -rf "$FF_DIR"' EXIT
cp -r "${FILES[@]}" "$FF_DIR"
node -e '
const fs = require("fs"), path = process.argv[1] + "/manifest.json";
const m = JSON.parse(fs.readFileSync(path, "utf8"));
m.background = { scripts: ["sync.js", "update.js", "telemetry.js", "background.js"] };
m.browser_specific_settings = { gecko: {
  id: "do-it-sharif@mazm28.github.io",
  strict_min_version: "140.0",
  // The anonymous daily usage count (telemetry.js); users can untick it when installing
  data_collection_permissions: { required: ["none"], optional: ["technicalAndInteraction"] },
} };
fs.writeFileSync(path, JSON.stringify(m, null, 2) + "\n");
' "$FF_DIR"
rm -f "$FF_OUT"
(cd "$FF_DIR" && zip -qr -X - .) > "$FF_OUT"
echo "Built $FF_OUT"
