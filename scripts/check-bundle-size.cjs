const { readdirSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { gzipSync } = require('node:zlib');

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? files(filename) : [filename];
  });
}

const total = files(path.resolve(__dirname, '../Frontend/dist'))
  .filter(filename => /\.(js|css)$/.test(filename))
  .reduce((bytes, filename) => bytes + gzipSync(readFileSync(filename)).length, 0);
console.log(`Frontend JS + CSS (gzip): ${(total / 1000).toFixed(2)} kB / 500 kB`);
if (total >= 500_000) {
  console.error('Frontend exceeds the 500 kB gzip budget. Inspect dependencies and embedded data.');
  process.exitCode = 1;
}
