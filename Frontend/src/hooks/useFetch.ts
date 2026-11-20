import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchCached, readCache, subscribeCache, writeCache } from '../utils/dataCache'

export interface UseFetchOptions {
  immediate?: boolean
  deps?: unknown[]
  cacheKey?: string
  staleTime?: number
}
export interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  setData: React.Dispatch<React.SetStateAction<T | null>>
}
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Ett fel uppstod vid hämtning av data.'

export function useFetch<T>(fetcher: (signal: AbortSignal) => Promise<T>, options: UseFetchOptions = {}): UseFetchResult<T> {
  const { immediate = true, deps = [], cacheKey, staleTime = 60_000 } = options
  const identity = cacheKey ?? JSON.stringify(deps)
  const [snapshot, setSnapshot] = useState<{ identity: string; data: T | null; loading: boolean; error: string | null }>(
    () => ({ identity, data: cacheKey ? readCache<T>(cacheKey) ?? null : null, loading: immediate, error: null }),
  )
  const fetcherRef = useRef(fetcher)
  const runRef = useRef<(force: boolean) => Promise<void>>(async () => {})
  useEffect(() => { fetcherRef.current = fetcher })

  useEffect(() => {
    let active = true
    let revision = 0
    const controller = new AbortController()
    async function run(force: boolean) {
      const request = ++revision
      try {
        // Shared requests own their signal; unmounting one consumer must not abort the others.
        const currentFetcher = fetcherRef.current
        const result = cacheKey
          ? await fetchCached(cacheKey, () => currentFetcher(new AbortController().signal), staleTime, force)
          : await currentFetcher(controller.signal)
        if (active && request === revision) setSnapshot({ identity, data: cacheKey ? readCache<T>(cacheKey) ?? result : result, loading: false, error: null })
      } catch (error) {
        if (active && request === revision) setSnapshot(previous => ({
          identity, data: cacheKey ? readCache<T>(cacheKey) ?? null : previous.identity === identity ? previous.data : null,
          loading: false, error: errorMessage(error),
        }))
      }
    }
    runRef.current = run
    const unsubscribe = cacheKey ? subscribeCache(cacheKey, invalidated => {
      if (invalidated) { if (immediate) void run(true) }
      else if (active) setSnapshot({ identity, data: readCache<T>(cacheKey) ?? null, loading: false, error: null })
    }) : undefined
    const refresh = () => { if (immediate && document.visibilityState !== 'hidden') void run(false) }
    if (immediate) void run(false)
    if (cacheKey) {
      window.addEventListener('focus', refresh)
      document.addEventListener('visibilitychange', refresh)
    }
    return () => {
      active = false
      controller.abort()
      unsubscribe?.()
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, immediate, staleTime, ...deps])

  const refetch = useCallback(() => runRef.current(true), [])
  const data = snapshot.identity === identity ? snapshot.data : cacheKey ? readCache<T>(cacheKey) ?? null : null
  const setData = useCallback<React.Dispatch<React.SetStateAction<T | null>>>(action => {
    if (cacheKey) {
      const old = readCache<T>(cacheKey) ?? null
      const next = typeof action === 'function' ? (action as (value: T | null) => T | null)(old) : action
      writeCache(cacheKey, next)
      return
    }
    setSnapshot(previous => {
      const old = previous.identity === identity ? previous.data : null
      const next = typeof action === 'function' ? (action as (value: T | null) => T | null)(old) : action
      return { identity, data: next, loading: false, error: null }
    })
  }, [cacheKey, identity])
  return { data, loading: immediate && data === null && (snapshot.identity !== identity || snapshot.loading),
    error: snapshot.identity === identity ? snapshot.error : null, refetch, setData }
}
export default useFetch
