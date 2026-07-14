'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Stage sql.js into vendor/ (not ignored by .vscodeignore).
 * webpack leaves `require('sql.js')` external as ../vendor/sql.js;
 * initCaptureStore gets sqlJsDistDir from extensionPath.
 */
function main() {
  const extensionRoot = path.resolve(__dirname, '..');
  const dest = path.join(extensionRoot, 'vendor', 'sql.js');

  let src;
  try {
    src = path.dirname(
      require.resolve('sql.js/package.json', {
        paths: [extensionRoot, path.join(extensionRoot, '..', '..')]
      })
    );
  } catch {
    src = path.join(extensionRoot, '..', '..', 'node_modules', 'sql.js');
  }

  if (!fs.existsSync(src)) {
    throw new Error(`sql.js not found (looked for ${src}). Run npm install from repo root.`);
  }

  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`staged sql.js -> ${dest}`);
}

main();
