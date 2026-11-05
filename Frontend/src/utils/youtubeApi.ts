export interface YouTubePlayer {
  mute(): void
  playVideo(): void
  getPlayerState(): number
  getCurrentTime(): number
  destroy(): void
}

interface PlayerEvent { target: YouTubePlayer }

interface PlayerOptions {
  events: {
    onReady: (event: PlayerEvent) => void
    onStateChange: (event: PlayerEvent & { data: number }) => void
    onError: () => void
    onAutoplayBlocked: () => void
  }
}

interface YouTubeApi {
  Player: new (iframe: HTMLIFrameElement, options: PlayerOptions) => YouTubePlayer
}

type YouTubeWindow = Window & {
  YT?: YouTubeApi
  onYouTubeIframeAPIReady?: () => void
}

let apiPromise: Promise<YouTubeApi> | null = null

// Share the API script across carousel slides and React Strict Mode remounts.
export function loadYouTubeApi(): Promise<YouTubeApi> {
  const youtubeWindow = window as YouTubeWindow
  if (youtubeWindow.YT?.Player) return Promise.resolve(youtubeWindow.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const previousReady = youtubeWindow.onYouTubeIframeAPIReady
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]')
    const script = existing ?? document.createElement('script')
    const timeout = window.setTimeout(fail, 20_000)

    function cleanup() {
      window.clearTimeout(timeout)
      script.removeEventListener('error', fail)
      if (youtubeWindow.onYouTubeIframeAPIReady === ready) {
        youtubeWindow.onYouTubeIframeAPIReady = previousReady
      }
    }

    function fail() {
      cleanup()
      if (!existing) script.remove()
      reject(new Error('YouTube player API unavailable'))
    }

    function ready() {
      const api = youtubeWindow.YT
      if (!api?.Player) { fail(); return }
      cleanup()
      resolve(api)
      previousReady?.()
    }

    youtubeWindow.onYouTubeIframeAPIReady = ready
    script.addEventListener('error', fail, { once: true })
    if (!existing) {
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.head.append(script)
    }
  }).catch((error: unknown) => {
    apiPromise = null
    throw error
  })

  return apiPromise
}
