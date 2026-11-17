import { translate } from '../i18n/index.ts'
import { readLocale, type Locale } from './locale.ts'
import type { ExternalMovieDetails, Movie, MovieCastInput, MovieFormPayload } from '../types/movie.ts'
import { isSafeImageUrl } from './imageValidation.ts'

export interface MovieFormValues {
  title: string
  description: string
  duration_minutes: string
  age_rating: string
  poster_url: string
  landscape_image_url: string
  trailer_url: string
  director: string
  imdb_rating: string
  release_date: string
  genres: string
  cast_members: MovieCastInput[]
}

export function initialMovieValues(movie: Movie | ExternalMovieDetails | null): MovieFormValues {
  return {
    title: movie?.title ?? '', description: movie?.description ?? '',
    duration_minutes: movie?.duration_minutes?.toString() ?? '', age_rating: movie?.age_rating ?? '',
    poster_url: movie?.poster_url ?? '', landscape_image_url: movie?.landscape_image_url ?? '',
    trailer_url: movie?.trailer_url ?? '', director: movie?.director ?? '',
    imdb_rating: movie?.imdb_rating?.toString() ?? '', release_date: movie?.release_date?.slice(0, 10) ?? '',
    genres: movie?.genres.join(', ') ?? '',
    cast_members: movie?.cast_members?.map(member => ({ ...member }))
      ?? (movie && 'actors' in movie ? movie.actors?.map((name, index) => ({ name, billing_order: index })) : undefined) ?? [],
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return value.length <= 2048 && /^https?:\/\//i.test(value)
      && ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
  } catch { return false }
}

// Returns the first actionable error; the backend still validates the entire request.
export function validateMovieValues(values: MovieFormValues, locale: Locale = readLocale()): string | null {
  if (!values.title.trim() || values.title.trim().length > 300) return translate(locale, 'validation.movie.title')
  const duration = Number(values.duration_minutes)
  if (!Number.isInteger(duration) || duration <= 0 || duration > 2147483647) return translate(locale, 'validation.movie.duration')
  if (values.description.trim().length > 2000) return translate(locale, 'validation.movie.description')
  if (values.director.trim().length > 200) return translate(locale, 'validation.movie.director')
  if (values.age_rating.trim().length > 10) return translate(locale, 'validation.movie.age')
  if (values.imdb_rating.trim() && (!Number.isFinite(Number(values.imdb_rating)) || Number(values.imdb_rating) < 0 || Number(values.imdb_rating) > 10)) {
    return translate(locale, 'validation.movie.rating')
  }
  for (const [key, url] of [['validation.movie.poster', values.poster_url], ['validation.movie.landscape', values.landscape_image_url]] as const) {
    if (url.trim() && !isSafeImageUrl(url)) return translate(locale, key)
  }
  if (values.trailer_url.trim() && !isHttpUrl(values.trailer_url.trim())) return translate(locale, 'validation.movie.trailer')
  if (values.release_date) {
    const date = new Date(`${values.release_date}T12:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.release_date) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== values.release_date) {
      return translate(locale, 'validation.movie.date')
    }
  }
  const genres = values.genres.split(',').map(genre => genre.trim()).filter(Boolean)
  if (new Set(genres).size > 10 || genres.some(genre => genre.length > 100)) return translate(locale, 'validation.movie.genres')
  if (values.cast_members.length > 100) return translate(locale, 'validation.movie.cast')
  return null
}

export function moviePayload(values: MovieFormValues): MovieFormPayload {
  const nullable = (value: string) => value.trim() || null
  return {
    title: values.title.trim(), description: nullable(values.description), duration_minutes: Number(values.duration_minutes),
    age_rating: nullable(values.age_rating), poster_url: nullable(values.poster_url),
    landscape_image_url: nullable(values.landscape_image_url), trailer_url: nullable(values.trailer_url),
    director: nullable(values.director), imdb_rating: values.imdb_rating.trim() ? Number(values.imdb_rating) : null,
    release_date: values.release_date || null,
    genres: [...new Set(values.genres.split(',').map(genre => genre.trim()).filter(Boolean))],
    cast_members: values.cast_members.map(member => ({ ...member })),
  }
}
