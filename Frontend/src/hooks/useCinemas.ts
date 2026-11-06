import { useCallback } from 'react'
import { getCinemaById, getCinemas } from '../api/cinemas'
import type { CinemaDetail } from '../types/cinema'
import { useFetch, type UseFetchResult } from './useFetch'

export function useCinemas(): UseFetchResult<CinemaDetail[]> {
  const load = useCallback(async (signal: AbortSignal) => {
    const list = await getCinemas(signal)
    return Promise.all(list.map((c) => getCinemaById(c.id, signal)))
  }, [])

  return useFetch<CinemaDetail[]>(load)
}