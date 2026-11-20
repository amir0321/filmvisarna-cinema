import { useCallback } from 'react'
import apiClient from '../api/client'
import type { CinemaDetail } from '../types/cinema'
import { useFetch, type UseFetchResult } from './useFetch'

export function useCinemas(): UseFetchResult<CinemaDetail[]> {
  const load = useCallback((signal: AbortSignal) => apiClient.get<CinemaDetail[]>('/cinemas', {
    signal, params: { includeSeats: true },
  }), [])
  return useFetch<CinemaDetail[]>(load, { cacheKey: 'cinemas:seats' })
}
