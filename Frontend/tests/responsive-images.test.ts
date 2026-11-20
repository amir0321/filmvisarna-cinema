import assert from 'node:assert/strict'
import { test } from 'node:test'
import { tmdbPosterSrcSet } from '../src/utils/responsiveImages.ts'

test('TMDB posters offer smaller width candidates without requesting sizes larger than the original', () => {
  const candidates = tmdbPosterSrcSet('https://image.tmdb.org/t/p/w780/photo.jpg')!
  assert.ok(candidates.includes('/w342/photo.jpg 342w'))
  assert.ok(candidates.includes('/w780/photo.jpg 780w'))
  const smaller = tmdbPosterSrcSet('https://image.tmdb.org/t/p/w500/photo.jpg')!
  assert.ok(smaller.includes('/w500/photo.jpg 500w'))
  assert.ok(!smaller.includes('/w780/'))
})

test('local uploads, YouTube frames and unrelated URLs keep their original image source', () => {
  for (const source of [null, undefined, '/uploads/media-123.webp',
    'https://i.ytimg.com/vi/video/maxresdefault.jpg',
    'https://other.example/t/p/w780/photo.jpg',
    'https://image.tmdb.org/t/p/w1280/landscape.jpg',
    'https://image.tmdb.org/t/p/w780/photo.jpg?custom=true',
    'https://image.tmdb.org/t/p/w780/photo.svg']) assert.equal(tmdbPosterSrcSet(source), undefined)
})
