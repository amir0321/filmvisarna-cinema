import { useCallback } from 'react'
import apiClient from '../api/client'
import type { Screening } from '../types'
import { useFetch, type UseFetchResult } from './useFetch'

export function useScreenings(movieId: number | string | undefined): UseFetchResult<Screening[]> {
  const fetchScreenings = useCallback(
    (signal: AbortSignal) => {
      if (!movieId) {
        return Promise.reject(new Error('Ingen film-ID angavs'))
      }
      return apiClient.get<Screening[]>('/screenings', {
        signal,
        params: { movieId },
      })
    },
    [movieId]
  )
  return useFetch<Screening[]>(fetchScreenings, {
    immediate: Boolean(movieId),
    deps: [movieId],
  })
}