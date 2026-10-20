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
  imdb_rating: number | null
  release_date: string | null
  genres: string[]
}

export interface MovieFilters {
  genre?: string
  search?: string
  age?: number
}
