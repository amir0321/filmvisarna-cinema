import type { ScreeningSeatStatus } from './seat'

export interface SeatsResponse {
  screeningId: number
  seats: ScreeningSeatStatus[]
}