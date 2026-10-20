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

export interface ScreeningFilters {
  from?: string
  to?: string
  movieId?: number
  cinemaId?: number
  age?: number
}
