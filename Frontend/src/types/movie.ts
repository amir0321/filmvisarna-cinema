export interface PersonProfile {
  id: number
  name: string
  photo_url: string | null
  bio: string | null
  tmdb_id: number | null
}

export interface MovieCastMember extends Omit<PersonProfile, 'id'> {
  person_id: number
  character_name: string | null
  billing_order: number
}

// New people require a name; existing people can be referenced by their ID.
export type MovieCastInput = Partial<Pick<PersonProfile, 'photo_url' | 'bio' | 'tmdb_id'>> & {
  character_name?: string | null
  billing_order?: number
} & ({ person_id: number; name?: string } | { person_id?: never; name: string })

export interface MovieFormPayload {
  title: string
  duration_minutes: number
  description?: string | null
  age_rating?: string | null
  poster_url?: string | null
  landscape_image_url?: string | null
  trailer_url?: string | null
  director?: string | null
  imdb_rating?: number | null
  release_date?: string | null
  genres?: string[]
  cast_members?: MovieCastInput[]
}

export interface ExternalMovieSuggestion {
  tmdbId: number
  title: string
  originalTitle: string
  releaseYear: number | null
  posterUrl: string | null
  overview: string
}

export interface ExternalMovieDetails extends Omit<Movie,
  'id' | 'duration' | 'duration_minutes' | 'actors' | 'cast_members' | 'active_screenings_count' | 'total_screenings_count'
> {
  tmdbId: number
  originalTitle: string
  duration_minutes: number | null
  cast_members: Omit<MovieCastMember, 'person_id'>[]
}

export interface Movie {
  id: number
  title: string
  description: string | null
  duration_minutes: number
  duration?: number | null
  age_rating: string | null
  poster_url: string | null
  landscape_image_url: string | null
  trailer_url: string | null
  director: string | null
  actors?: string[]
  cast_members?: MovieCastMember[]
  active_screenings_count?: number
  total_screenings_count?: number
  imdb_rating: number | null
  release_date: string | null
  genres: string[]
}

export interface MovieFilters {
  genre?: string
  search?: string
  age?: number
}
