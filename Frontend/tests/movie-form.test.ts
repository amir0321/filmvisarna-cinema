import assert from 'node:assert/strict'
import { test } from 'node:test'
import { initialMovieValues, moviePayload, validateMovieValues } from '../src/utils/movieForm.ts'
import type { ExternalMovieDetails, Movie } from '../src/types/movie.ts'

const movie: Movie = {
  id: 7, title: 'En film', description: 'Beskrivning', duration_minutes: 120, age_rating: '11',
  poster_url: '/uploads/poster.png', landscape_image_url: 'https://example.test/wide.jpg',
  trailer_url: 'https://www.youtube.com/watch?v=abcdefghijk', director: 'Regissör', imdb_rating: 0,
  release_date: '2024-02-29', genres: ['Drama', 'Action'], actors: ['Actor'],
  cast_members: [{ person_id: 12, name: 'Actor', tmdb_id: 123, bio: 'Biografi', photo_url: '/uploads/actor.png', character_name: 'Hero', billing_order: 2 }],
}

test('editing a movie preserves zero ratings, all profile fields and the existing film cast', () => {
  const values = initialMovieValues(movie)
  assert.equal(validateMovieValues(values), null)
  const payload = moviePayload(values)
  assert.equal(payload.imdb_rating, 0)
  assert.equal(payload.duration_minutes, 120)
  assert.equal(payload.release_date, '2024-02-29')
  assert.deepEqual(payload.cast_members, movie.cast_members)
  assert.notEqual(payload.cast_members, movie.cast_members)
  assert.notEqual(payload.cast_members![0], movie.cast_members![0])
  assert.equal('id' in payload, false)
})

test('TMDB previews retain actor identities, photos, bios and characters before saving', () => {
  const imported: ExternalMovieDetails = {
    ...movie, tmdbId: 42, originalTitle: 'Original title', duration_minutes: null,
    cast_members: [{ name: 'Imported actor', tmdb_id: 234, photo_url: 'https://image.tmdb.org/t/p/w185/photo.jpg', bio: 'Svensk biografi', character_name: 'Lead', billing_order: 0 }],
  }
  const values = initialMovieValues(imported)
  assert.equal(values.duration_minutes, '')
  assert.match(validateMovieValues(values)!, /speltiden/)
  values.duration_minutes = '130'
  assert.equal(validateMovieValues(values), null)
  assert.deepEqual(moviePayload(values).cast_members, imported.cast_members)
})

test('legacy actor names remain in the payload when detailed cast data is absent', () => {
  const values = initialMovieValues({ ...movie, cast_members: undefined, actors: ['First', 'Second'] })
  assert.deepEqual(moviePayload(values).cast_members, [{ name: 'First', billing_order: 0 }, { name: 'Second', billing_order: 1 }])
})

test('empty optional fields clear stored values and genres are trimmed and deduplicated', () => {
  const values = { ...initialMovieValues(null), title: '  Ny film  ', duration_minutes: '90', genres: ' Drama, Action, Drama, , ' }
  assert.equal(validateMovieValues(values), null)
  const payload = moviePayload(values)
  assert.equal(payload.title, 'Ny film')
  assert.deepEqual(payload.genres, ['Drama', 'Action'])
  assert.deepEqual(payload.cast_members, [])
  for (const field of ['description', 'age_rating', 'poster_url', 'landscape_image_url', 'trailer_url', 'director', 'release_date', 'imdb_rating'] as const) {
    assert.equal(payload[field], null, field)
  }
})

test('form validation rejects invalid durations, ratings and calendar dates', () => {
  for (const duration of ['', '0', '-1', '1.5', 'Infinity', '2147483648']) {
    assert.match(validateMovieValues({ ...initialMovieValues(movie), duration_minutes: duration })!, /speltiden/)
  }
  for (const rating of ['-1', '10.1', 'NaN', 'Infinity']) {
    assert.match(validateMovieValues({ ...initialMovieValues(movie), imdb_rating: rating })!, /betyg/)
  }
  for (const date of ['2023-02-29', '2026-02-30', 'not-a-date']) {
    assert.match(validateMovieValues({ ...initialMovieValues(movie), release_date: date })!, /premiärdatum/)
  }
})

test('unsafe poster, landscape and trailer links cannot pass form validation', () => {
  for (const field of ['poster_url', 'landscape_image_url', 'trailer_url'] as const) {
    for (const url of ['javascript:alert(1)', 'data:text/html,<script/>', 'https://user:secret@example.test/image', '//evil.test/image', '/uploads/../secret', `https://example.test/${'a'.repeat(2048)}`]) {
      assert.notEqual(validateMovieValues({ ...initialMovieValues(movie), [field]: url }), null, `${field}: ${url.slice(0, 60)}`)
    }
  }
  assert.notEqual(validateMovieValues({ ...initialMovieValues(movie), trailer_url: '/uploads/trailer.mp4' }), null)
})

test('form validation enforces backend text, genre and cast limits', () => {
  const values = initialMovieValues(movie)
  for (const invalid of [
    { title: ' ' }, { title: 'a'.repeat(301) }, { description: 'a'.repeat(2001) },
    { director: 'a'.repeat(201) }, { age_rating: 'a'.repeat(11) },
    { genres: 'a'.repeat(101) }, { genres: Array.from({ length: 11 }, (_, i) => `Genre ${i}`).join(',') },
    { cast_members: Array.from({ length: 101 }, () => ({ name: 'Actor' })) },
  ]) assert.notEqual(validateMovieValues({ ...values, ...invalid }), null)
})
