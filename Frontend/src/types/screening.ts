export interface Screening {
  id: number
  startsAt: string
  endsAt: string
  movieId: number
  movieTitle: string
  posterUrl?: string | null
  ageRating?: string | null
  ageLimit?: number
  cinemaId: number
  cinema: string
  totalSeats?: number
  bookedSeats?: number
  availableSeats?: number
}

export type ScreeningWhen = 'today' | 'tomorrow' | 'weekend'

// Matches the query params of GET /api/screenings. Use either `when` or `date`, not both.
export interface ScreeningFilters {
  when?: ScreeningWhen
  date?: string // YYYY-MM-DD
  movieId?: number
  cinemaId?: number
  age?: number
}
