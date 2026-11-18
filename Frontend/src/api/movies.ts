import apiClient, { ApiError } from './client.ts'
import type { ExternalMovieDetails, ExternalMovieSuggestion, Movie, MovieFormPayload } from '../types/movie.ts'
import { isSafeImageUrl, validateImageFile } from '../utils/imageValidation.ts'

export function createMovie(payload: MovieFormPayload, signal?: AbortSignal): Promise<Movie> {
  return apiClient.post<Movie>('/movies', payload, { signal })
}

export function updateMovie(id: number, payload: Partial<MovieFormPayload>, signal?: AbortSignal): Promise<Movie> {
  return apiClient.put<Movie>(`/movies/${encodeURIComponent(id)}`, payload, { signal })
}

export function deleteMovie(id: number, signal?: AbortSignal): Promise<{ success: boolean; message: string }> {
  return apiClient.delete(`/movies/${encodeURIComponent(id)}`, { signal })
}

// apiClient sets the CSRF header and lets the browser set the multipart boundary.
export async function uploadImage(file: File, signal?: AbortSignal): Promise<string> {
  const error = validateImageFile(file)
  if (error) throw new ApiError(400, error)
  const body = new FormData()
  body.set('image', file)
  const response = await apiClient.post<{ url: string }>('/upload', body, { signal })
  if (!isSafeImageUrl(response?.url)) {
    throw new ApiError(502, 'Servern returnerade en ogiltig bild-URL.')
  }
  return response.url
}

export function searchExternalMovies(query: string, signal?: AbortSignal): Promise<ExternalMovieSuggestion[]> {
  return apiClient.get('/movies/external/search', { params: { query: query.trim() }, signal })
}

export function fetchExternalMovieDetails(tmdbId: number, signal?: AbortSignal): Promise<ExternalMovieDetails> {
  return apiClient.get(`/movies/external/${encodeURIComponent(tmdbId)}`, { signal })
}
