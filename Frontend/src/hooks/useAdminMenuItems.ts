import { useCallback } from 'react'
import { getAdminMenuItems } from '../api/kiosk'
import type { AdminMenuItem } from '../types'
import { useFetch, type UseFetchResult } from './useFetch'

export function useAdminMenuItems(): UseFetchResult<AdminMenuItem[]> {
  const fetchItems = useCallback((signal: AbortSignal) => getAdminMenuItems(signal), [])
  return useFetch<AdminMenuItem[]>(fetchItems)
}

