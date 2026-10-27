import { useFetch, type UseFetchResult } from './useFetch'

export function useScreenings(filters?: ScreeningFilters): UseFetchResult<Screening[]> {
  const fetchScreenings = useCallback(
    (signal: AbortSignal) => {
      return apiClient.get<Screening[]>('/screenings', {
        signal,
        params: filters as Record<string, string | number | undefined>,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters?.when, filters?.date, filters?.age, filters?.movieId, filters?.cinemaId],
  )

  return useFetch<Screening[]>(fetchScreenings, {
    deps: [filters?.when, filters?.date, filters?.age, filters?.movieId, filters?.cinemaId],
  })
}