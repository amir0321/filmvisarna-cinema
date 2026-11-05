const PLAYING = 1

// Require real media progress as well as elapsed time; iframe load is not playback readiness.
export function createPlaybackVisibilityTracker(requiredSeconds = 3) {
  let mediaStart: number | null = null
  let clockStart = 0
  let previousTime = 0
  let lastProgress = 0

  return {
    update(state: number, currentTime: number, now: number): boolean {
      if (state !== PLAYING || !Number.isFinite(currentTime)) {
        mediaStart = null
        return false
      }
      if (mediaStart === null || currentTime < previousTime || now - lastProgress > 1_000) {
        mediaStart = currentTime
        clockStart = now
        lastProgress = now
      }
      if (currentTime > previousTime) lastProgress = now
      previousTime = currentTime
      return now - clockStart >= requiredSeconds * 1_000 && currentTime - mediaStart >= requiredSeconds
    },
  }
}
