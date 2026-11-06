import type { Seat } from './seat'

export interface CinemaOverview {
  id: number
  name: string
  total_seats: number
  format: string | null
  tech: string | null
  screen_size: string | null
  opened_year: number | null
}

export interface CinemaDetail extends CinemaOverview {
  seats: Seat[]
}