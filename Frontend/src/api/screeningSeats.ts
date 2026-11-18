import apiClient from './client'
import type { SeatsResponse } from '../types/screeningSeat'

export function getScreeningSeats(screeningId: number): Promise<SeatsResponse> {
  return apiClient.get<SeatsResponse>(`/screenings/${screeningId}/seats`)
}