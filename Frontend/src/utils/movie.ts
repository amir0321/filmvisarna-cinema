import { translate } from '../i18n/index.ts'
import { readLocale, type Locale } from './locale.ts'

export type AgeRatingVariant = 'success' | 'warning' | 'danger'

// "2h 45m"
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

// "2 timmar 45 minuter"
export function formatDurationLong(minutes: number, locale: Locale = readLocale()): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  const parts: string[] = []
  if (hours > 0) parts.push(translate(locale, hours === 1 ? 'movie.hourOne' : 'movie.hourMany', { count: hours }))
  if (rest > 0) parts.push(translate(locale, rest === 1 ? 'movie.minuteOne' : 'movie.minuteMany', { count: rest }))
  return parts.join(' ')
}

export function getAgeLimit(ageRating: string | null): number {
  const limit = Number.parseInt(ageRating ?? '', 10)
  return Number.isNaN(limit) ? 0 : limit
}

// "15" -> "15 år", "0" or null -> "Barntillåten"
export function formatAgeRating(ageRating: string | null, locale: Locale = readLocale()): string {
  const limit = getAgeLimit(ageRating)
  return limit === 0 ? translate(locale, 'movie.allAges') : translate(locale, 'movie.age', { age: limit })
}

export function getAgeRatingVariant(ageRating: string | null): AgeRatingVariant {
  const limit = getAgeLimit(ageRating)
  if (limit === 0) return 'success'
  if (limit <= 11) return 'warning'
  return 'danger'
}

function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v')
  } catch {
    return null
  }
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url)
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : null
}

// Muted, looping and without controls, for use behind other content
export function getYouTubeBackgroundUrl(url: string, origin?: string): string | null {
  const videoId = getYouTubeVideoId(url)
  if (!videoId) return null
  const params = new URLSearchParams({
    autoplay: '1',
    enablejsapi: '1',
    mute: '1',
    loop: '1',
    playlist: videoId,
    controls: '0',
    playsinline: '1',
    rel: '0',
    disablekb: '1',
    iv_load_policy: '3',
    fs: '0',
    start: '12',
  })
  if (origin) params.set('origin', origin)
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`
}
