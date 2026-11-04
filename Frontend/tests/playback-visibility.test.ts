import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPlaybackVisibilityTracker } from '../src/utils/playbackVisibility.ts'

function play(tracker: ReturnType<typeof createPlaybackVisibilityTracker>, mediaStart = 12, clockStart = 0) {
  let visible = false
  for (let step = 0; step <= 25; step++) {
    visible = tracker.update(1, mediaStart + step / 5, clockStart + step * 200)
    if (step < 25) assert.equal(visible, false)
  }
  return visible
}

test('iframe loading and buffering never reveal the player, regardless of elapsed time', () => {
  const tracker = createPlaybackVisibilityTracker()
  for (const state of [-1, 0, 2, 3, 5]) assert.equal(tracker.update(state, 12, 60_000), false)
})

test('the player appears only after five seconds of actual continuous playback', () => {
  assert.equal(play(createPlaybackVisibilityTracker()), true)
})

test('buffering and pause hide an already visible player and restart the warm-up', () => {
  for (const state of [2, 3, 0]) {
    const tracker = createPlaybackVisibilityTracker()
    assert.equal(play(tracker), true)
    assert.equal(tracker.update(state, 17, 5_200), false)
    assert.equal(play(tracker, 17, 5_400), true)
  }
})

test('a frozen media clock cannot reveal a player even if its state says playing', () => {
  const tracker = createPlaybackVisibilityTracker()
  for (let now = 0; now <= 20_000; now += 200) assert.equal(tracker.update(1, 12, now), false)
})

test('seeking backwards or looping requires another clean playback warm-up', () => {
  const tracker = createPlaybackVisibilityTracker()
  assert.equal(play(tracker), true)
  assert.equal(tracker.update(1, 12, 5_200), false)
  assert.equal(play(tracker, 12, 5_200), true)
})
