import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'

export interface UseFetchOptions {
  immediate?: boolean
  deps?: unknown[]
}

export interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  setData: React.Dispatch<React.SetStateAction<T | null>>
}

export function useFetch<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: UseFetchOptions = {},
): UseFetchResult<T> {
  const { immediate = true, deps = [] } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(immediate)
  const [error, setError] = useState<string | null>(null)

  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    if (!immediate) {
      return
    }

    let isCancelled = false
    const controller = new AbortController()

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (!isCancelled && !controller.signal.aborted) {
          setData(result)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!isCancelled && !controller.signal.aborted) {
          const message =
            err instanceof ApiError || err instanceof Error
              ? err.message
              : 'Ett fel uppstod vid hämtning av data.'
          setError(message)
          setLoading(false)
        }
      })

    return () => {
      isCancelled = true
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps])

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const controller = new AbortController()

    try {
      const result = await fetcherRef.current(controller.signal)
      setData(result)
      setLoading(false)
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Ett fel uppstod vid hämtning av data.'
      setError(message)
      setLoading(false)
    }
  }, [])

  return {
    data,
    loading,
    error,
    refetch,
    setData,
  }
}

export default useFetch
