import { useCallback } from 'react'
import apiClient from '../api/client'
import type { Screening, ScreeningFilters } from '../types'
import { useFetch, type UseFetchResult } from './useFetch'

export function useScreenings(filters?: ScreeningFilters, scope: 'public' | 'dashboard' = 'public'): UseFetchResult<Screening[]> {
  const fetchScreenings = useCallback(
    (signal: AbortSignal) => {
      return apiClient.get<Screening[]>(scope === 'dashboard' ? '/screenings/dashboard' : '/screenings', {
        signal,
        params: filters as Record<string, string | number | undefined>,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters?.when, filters?.date, filters?.age, filters?.movieId, filters?.cinemaId, scope],
  )

  return useFetch<Screening[]>(fetchScreenings, {
    deps: [filters?.when, filters?.date, filters?.age, filters?.movieId, filters?.cinemaId, scope],
  })
}
