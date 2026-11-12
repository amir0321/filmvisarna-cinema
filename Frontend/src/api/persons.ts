import apiClient from './client.ts'
import type { PersonProfile } from '../types/movie.ts'

export type PersonPayload = Pick<PersonProfile, 'name'> & Partial<Pick<PersonProfile, 'photo_url' | 'bio' | 'tmdb_id'>>

export function searchPersons(search = '', signal?: AbortSignal): Promise<PersonProfile[]> {
  return apiClient.get('/persons', { params: { search: search.trim() }, signal })
}

export function createPerson(payload: PersonPayload, signal?: AbortSignal): Promise<PersonProfile> {
  return apiClient.post('/persons', payload, { signal })
}

export function updatePerson(id: number, payload: Partial<PersonPayload>, signal?: AbortSignal): Promise<PersonProfile> {
  return apiClient.put(`/persons/${encodeURIComponent(id)}`, payload, { signal })
}
