export type AgeRatingVariant = 'success' | 'warning' | 'danger'

// "2h 45m"
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

// "2 timmar 45 minuter", for screen readers
export function formatDurationLong(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'timme' : 'timmar'}`)
  if (rest > 0) parts.push(`${rest} ${rest === 1 ? 'minut' : 'minuter'}`)
  return parts.join(' ')
}

function getAgeLimit(ageRating: string | null): number {
  const limit = Number.parseInt(ageRating ?? '', 10)
  return Number.isNaN(limit) ? 0 : limit
}

// "15" -> "15 år", "0" or null -> "Barntillåten"
export function formatAgeRating(ageRating: string | null): string {
  const limit = getAgeLimit(ageRating)
  return limit === 0 ? 'Barntillåten' : `${limit} år`
}

export function getAgeRatingVariant(ageRating: string | null): AgeRatingVariant {
  const limit = getAgeLimit(ageRating)
  if (limit === 0) return 'success'
  if (limit <= 11) return 'warning'
  return 'danger'
}

// Turns a YouTube link into an embed link, or returns null if it isn't a YouTube link
export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const videoId =
      parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v')

    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : null
  } catch {
    return null
  }
}
