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
export function validateMovieValues(values: MovieFormValues): string | null {
  if (!values.title.trim() || values.title.trim().length > 300) return 'Ange en filmtitel med högst 300 tecken.'
  const duration = Number(values.duration_minutes)
  if (!Number.isInteger(duration) || duration <= 0 || duration > 2147483647) return 'Ange speltiden som ett positivt heltal i minuter.'
  if (values.description.trim().length > 2000) return 'Beskrivningen får vara högst 2 000 tecken.'
  if (values.director.trim().length > 200) return 'Regissörens namn får vara högst 200 tecken.'
  if (values.age_rating.trim().length > 10) return 'Åldersgränsen får vara högst 10 tecken.'
  if (values.imdb_rating.trim() && (!Number.isFinite(Number(values.imdb_rating)) || Number(values.imdb_rating) < 0 || Number(values.imdb_rating) > 10)) {
    return 'Ange ett betyg mellan 0 och 10.'
  }
  for (const [label, url] of [['Affischen', values.poster_url], ['Den breda bilden', values.landscape_image_url]]) {
    if (url.trim() && !isSafeImageUrl(url)) return `${label} måste ha en giltig HTTP(S)-URL eller en sökväg under /uploads/.`
  }
  if (values.trailer_url.trim() && !isHttpUrl(values.trailer_url.trim())) return 'Trailern måste ha en giltig HTTP(S)-URL utan inloggningsuppgifter.'
  if (values.release_date) {
    const date = new Date(`${values.release_date}T12:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.release_date) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== values.release_date) {
      return 'Ange ett giltigt premiärdatum.'
    }
  }
  const genres = values.genres.split(',').map(genre => genre.trim()).filter(Boolean)
  if (new Set(genres).size > 10 || genres.some(genre => genre.length > 100)) return 'Ange högst 10 genrer med högst 100 tecken per genre.'
  if (values.cast_members.length > 100) return 'Rollistan får innehålla högst 100 skådespelare.'
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
