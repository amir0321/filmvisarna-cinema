import { useCallback } from 'react'
import apiClient from '../api/client'
import type { CinemaSummary } from '../types'
import { useFetch, type UseFetchResult } from './useFetch'

export function useCinemas(): UseFetchResult<CinemaSummary[]> {
  const fetchCinemas = useCallback(
    (signal: AbortSignal) => apiClient.get<CinemaSummary[]>('/cinemas', { signal }),
    [],
  )
  return useFetch<CinemaSummary[]>(fetchCinemas)
}
