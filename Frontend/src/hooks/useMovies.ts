import { useCallback } from 'react'
import apiClient from '../api/client'
import type { Movie, MovieFilters } from '../types'
import { useFetch, type UseFetchResult } from './useFetch'

export function useMovies(filters?: MovieFilters): UseFetchResult<Movie[]> {
  const fetchMovies = useCallback(
    (signal: AbortSignal) => {
      return apiClient.get<Movie[]>('/movies', {
        signal,
        params: filters as Record<string, string | number | undefined>,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters?.genre, filters?.search, filters?.age],
  )

  return useFetch<Movie[]>(fetchMovies, {
    deps: [filters?.genre, filters?.search, filters?.age],
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
    deps: [id],
  })
}
