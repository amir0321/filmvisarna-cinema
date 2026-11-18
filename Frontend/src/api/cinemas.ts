import apiClient from './client'
import type { CinemaDetail, CinemaOverview } from '../types/cinema'

export function getCinemas(signal?: AbortSignal): Promise<CinemaOverview[]> {
  return apiClient.get<CinemaOverview[]>('/cinemas', { signal })
}

export function getCinemaById(id: number, signal?: AbortSignal): Promise<CinemaDetail> {
  return apiClient.get<CinemaDetail>(`/cinemas/${id}`, { signal })
}
