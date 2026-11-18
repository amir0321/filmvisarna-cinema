import { getSeedMovies } from '../seeds/movieData.js';

async function verify() {
  const urls = [...new Set(getSeedMovies().flatMap((movie) => [movie.poster_url, movie.landscape_image_url]))];
  const results = await Promise.all(urls.map(async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15_000) });
      const valid = response.ok && response.headers.get('content-type')?.startsWith('image/');
      return { url, status: response.status, valid };
    } catch {
      return { url, status: 'unreachable', valid: false };
    }
  }));
  const failures = results.filter((result) => !result.valid);
  failures.forEach((result) => console.error(`${result.status} ${result.url}`));
  console.log(`${results.length - failures.length}/${results.length} seed images available`);
  if (failures.length) process.exitCode = 1;
}

void verify();
