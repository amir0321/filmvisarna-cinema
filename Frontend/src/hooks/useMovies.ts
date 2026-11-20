import { useCallback } from 'react'
import apiClient from '../api/client'
import type { Movie, MovieFilters } from '../types'
import { useFetch, type UseFetchResult } from './useFetch'

export function useMovies(filters?: MovieFilters, compact = true): UseFetchResult<Movie[]> {
  const fetchMovies = useCallback(
    (signal: AbortSignal) => {
      return apiClient.get<Movie[]>('/movies', {
        signal,
        params: { ...filters, compact },
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters?.genre, filters?.search, filters?.age, compact],
  )

  return useFetch<Movie[]>(fetchMovies, {
    cacheKey: JSON.stringify(["movies", filters?.genre, filters?.search, filters?.age, compact]),
    deps: [filters?.genre, filters?.search, filters?.age, compact],
  })
}

export function useMovie(id: number | string | undefined): UseFetchResult<Movie> {
  const fetchMovie = useCallback(
    (signal: AbortSignal) => {
      if (!id) {
        return Promise.reject(new Error('Inget film-ID angavs'))
      }
      return apiClient.get<Movie>(`/movies/${id}`, { signal })
    },
    [id],
  )

  return useFetch<Movie>(fetchMovie, {
    immediate: Boolean(id),
    cacheKey: `movie:${id}`,
    deps: [id],
  })
}
