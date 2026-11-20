import apiClient from './client'
import type { CinemaDetail, CinemaOverview } from '../types/cinema'

export function getCinemas(signal?: AbortSignal): Promise<CinemaOverview[]> {
  return apiClient.get<CinemaOverview[]>('/cinemas', { signal })
}

export function getCinemaById(id: number, signal?: AbortSignal): Promise<CinemaDetail> {
  return apiClient.get<CinemaDetail>(`/cinemas/${id}`, { signal })
}
export interface WheelchairSeatInput {
  row: string
  number: number
}

// Rows and seatsPerRow can only be set when creating (backend rule)
export interface CreateCinemaInput {
  name: string
  format?: string | null
  tech?: string | null
  rows: number
  seatsPerRow: number | number[]
}

export interface UpdateCinemaInput {
  name?: string
  format?: string | null
  tech?: string | null
  wheelchairSeats?: WheelchairSeatInput[]
}

export function createCinema(input: CreateCinemaInput): Promise<CinemaDetail> {
  return apiClient.post<CinemaDetail>('/cinemas', input)
}

export function updateCinema(id: number, input: UpdateCinemaInput): Promise<CinemaDetail> {
  return apiClient.put<CinemaDetail>(`/cinemas/${id}`, input)
}

export function deleteCinema(id: number): Promise<void> {
  return apiClient.delete<void>(`/cinemas/${id}`)
}
