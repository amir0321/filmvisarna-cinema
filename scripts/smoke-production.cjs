const assert = require('node:assert/strict');

const base = process.argv[2] || 'http://localhost:3000';
let currentUrl;
function get(route, options = {}) {
  currentUrl = new URL(route, base);
  return fetch(currentUrl, { signal: AbortSignal.timeout(20_000), ...options });
}

async function check() {
  for (const route of ['/', '/filmer', '/salonger', '/en/movies']) {
    const response = await get(route, { headers: { Accept: 'text/html' } });
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type'), /text\/html/);
    const html = await response.text();
    assert.match(html, /id="root"/);
    if (route === '/') {
      const assets = [...html.matchAll(/(?:src|href)="(\/[^"\s]+)"/g)].map(match => match[1]);
      for (const asset of assets) {
        const file = await get(asset);
        assert.equal(file.status, 200, asset);
        assert.doesNotMatch(file.headers.get('content-type') || '', /text\/html/, asset);
        assert.ok((await file.arrayBuffer()).byteLength > 0, asset);
      }
    }
  }
  for (const route of ['/api/health', '/api/movies', '/api/screenings', '/api/cinemas']) {
    const response = await get(route);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type'), /application\/json/);
    await response.json();
  }
  for (const route of ['/api/not-found', '/assets/not-found.js', '/uploads/not-found.webp']) {
    const response = await get(route);
    assert.equal(response.status, 404, route);
    assert.doesNotMatch(await response.text(), /id="root"/);
  }
  for (const name of ['hall-large', 'hall-small']) {
    const response = await get(`/images/${name}.webp`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /image\/webp/);
    assert.ok((await response.arrayBuffer()).byteLength > 0, name);
  }
  console.log(`OK: HTML, direct links, built assets, API, JSON 404 and local images at ${base}`);
}

check().catch(error => {
  console.error(`FAIL ${currentUrl}: ${error.message}`);
  if (error.cause) console.error(error.cause);
  process.exitCode = 1;
});
