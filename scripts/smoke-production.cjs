const assert = require('node:assert/strict');

const base = process.argv[2] || 'http://localhost:3000';

async function check() {
  for (const route of ['/', '/filmer', '/salonger', '/en/movies']) {
    const response = await fetch(new URL(route, base), { headers: { Accept: 'text/html' } });
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type'), /text\/html/);
    const html = await response.text();
    assert.match(html, /id="root"/);
    if (route === '/') {
      const assets = [...html.matchAll(/(?:src|href)="(\/[^"\s]+)"/g)].map(match => match[1]);
      for (const asset of assets) {
        const file = await fetch(new URL(asset, base));
        assert.equal(file.status, 200, asset);
        assert.doesNotMatch(file.headers.get('content-type') || '', /text\/html/, asset);
      }
    }
  }
  for (const route of ['/api/health', '/api/movies', '/api/screenings', '/api/cinemas']) {
    const response = await fetch(new URL(route, base));
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type'), /application\/json/);
    await response.json();
  }
  for (const route of ['/api/not-found', '/assets/not-found.js', '/uploads/not-found.webp']) {
    const response = await fetch(new URL(route, base));
    assert.equal(response.status, 404, route);
    assert.doesNotMatch(await response.text(), /id="root"/);
  }
  for (const name of ['hall-large', 'hall-small']) {
    const response = await fetch(new URL(`/images/${name}.webp`, base));
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /image\/webp/);
  }
  console.log(`OK: HTML, direct links, built assets, API, JSON 404 and local images at ${base}`);
}

check().catch(error => { console.error(error.message); process.exitCode = 1; });
