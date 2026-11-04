import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getYouTubeBackgroundUrl } from '../src/utils/movie.ts'

test('background playback enables the player API with the embedding page origin', () => {
  const embed = getYouTubeBackgroundUrl('https://www.youtube.com/watch?v=tFMo3UJ4B4g', 'http://localhost:5173')
  assert.ok(embed)
  const url = new URL(embed)
  assert.equal(url.hostname, 'www.youtube-nocookie.com')
  assert.equal(url.pathname, '/embed/tFMo3UJ4B4g')
  assert.equal(url.searchParams.get('enablejsapi'), '1')
  assert.equal(url.searchParams.get('origin'), 'http://localhost:5173')
  assert.equal(url.searchParams.get('mute'), '1')
  assert.equal(url.searchParams.get('controls'), '0')
  assert.equal(url.searchParams.get('playlist'), 'tFMo3UJ4B4g')
})
