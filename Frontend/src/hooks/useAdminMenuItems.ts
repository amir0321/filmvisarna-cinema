import { useCallback } from 'react'
import apiClient from '../api/client'
import type { AdminMenuItem } from '../types'
import { useFetch, type UseFetchResult } from './useFetch'

export function useAdminMenuItems(): UseFetchResult<AdminMenuItem[]> {
  const fetchItems = useCallback(
    (signal: AbortSignal) => apiClient.get<AdminMenuItem[]>('/admin/menu-items', { signal }),
    [],
  )
  return useFetch<AdminMenuItem[]>(fetchItems)
}
