export type AgeRatingVariant = 'success' | 'warning' | 'danger'

// Formats a runtime in minutes as "2h 45m" (matches the design).
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

// Spoken version of the runtime for screen readers, e.g. "2 timmar 45 minuter".
export function formatDurationLong(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'timme' : 'timmar'}`)
  if (rest > 0) parts.push(`${rest} ${rest === 1 ? 'minut' : 'minuter'}`)
  return parts.join(' ')
}

function parseAgeLimit(ageRating: string | null): number | null {
  if (!ageRating) return null
  const value = Number.parseInt(ageRating, 10)
  return Number.isNaN(value) ? null : value
}

// Converts the backend age rating ("15", "7", "0", null) into a UI label.
export function formatAgeRating(ageRating: string | null): string {
  const limit = parseAgeLimit(ageRating)
  return limit === null || limit === 0 ? 'Barntillåten' : `${limit} år`
}

// Badge colour per age limit, using the design system's status colours
export function getAgeRatingVariant(ageRating: string | null): AgeRatingVariant {
  const limit = parseAgeLimit(ageRating)
  if (limit === null || limit === 0) return 'success'
  if (limit <= 11) return 'warning'
  return 'danger'
}

// Turns a YouTube watch/short/embed URL into an embeddable URL, or null if unsupported.
export function getYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    let videoId: string | null = null

    if (host === 'youtu.be') {
      videoId = parsed.pathname.slice(1)
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      videoId = parsed.pathname.startsWith('/embed/')
        ? parsed.pathname.split('/')[2]
        : parsed.searchParams.get('v')
    }

    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : null
  } catch {
    return null
  }
}
