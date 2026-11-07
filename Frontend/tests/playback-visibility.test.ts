import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPlaybackVisibilityTracker } from '../src/utils/playbackVisibility.ts'

function play(tracker: ReturnType<typeof createPlaybackVisibilityTracker>, mediaStart = 12, clockStart = 0) {
  let visible = false
  for (let step = 0; step <= 15; step++) {
    visible = tracker.update(1, mediaStart + step / 5, clockStart + step * 200)
    if (step < 15) assert.equal(visible, false)
  }
  return visible
}

test('the player stays hidden during loading and appears only after three seconds of real playback', () => {
  const tracker = createPlaybackVisibilityTracker()
  for (const state of [-1, 0, 2, 3, 5]) assert.equal(tracker.update(state, 12, 60_000), false)
  assert.equal(play(tracker, 12, 60_200), true)
})

test('buffering and pause hide an already visible player and restart the warm-up', () => {
  for (const state of [2, 3, 0]) {
    const tracker = createPlaybackVisibilityTracker()
    assert.equal(play(tracker), true)
    assert.equal(tracker.update(state, 15, 3_200), false)
    assert.equal(play(tracker, 15, 3_400), true)
  }
})

test('frozen playback and backwards seeks cannot expose the startup overlay', () => {
  const frozen = createPlaybackVisibilityTracker()
  for (let now = 0; now <= 20_000; now += 200) assert.equal(frozen.update(1, 12, now), false)
  const seeking = createPlaybackVisibilityTracker()
  assert.equal(play(seeking), true)
  assert.equal(seeking.update(1, 12, 3_200), false)
  assert.equal(play(seeking, 12, 3_200), true)
})
