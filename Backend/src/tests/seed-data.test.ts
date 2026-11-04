import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getSeedMovies, seedDateOffset } from '../seeds/movieData.js';

test('demo repertoire exercises both film pagination sizes and stays current across years', () => {
  for (const today of ['2026-11-04', '2027-01-01']) {
    const movies = getSeedMovies(today);
    assert.equal(new Set(movies.map((movie) => movie.title)).size, movies.length);
    assert.equal(movies.filter((movie) => movie.release_date <= today).length, 12);
    assert.equal(movies.filter((movie) => movie.release_date > today).length, 4);
    assert.ok(movies.every((movie) => movie.duration_minutes + 20 <= 240), 'Four-hour slots must allow the cleaning buffer');
  }
});

test('seed calendar arithmetic crosses DST, leap day and year boundaries without shifting the day', () => {
  assert.equal(seedDateOffset('2026-10-24', 1), '2026-10-25');
  assert.equal(seedDateOffset('2028-02-28', 1), '2028-02-29');
  assert.equal(seedDateOffset('2026-12-31', 1), '2027-01-01');
});
