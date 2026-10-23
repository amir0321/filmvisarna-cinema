import { useCallback, useEffect, useRef, useState } from 'react'

export function useInlineFeedback(
  durationMs = 2000,
): [boolean, () => void] {
  const [active, setActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trigger = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setActive(true)
    timerRef.current = setTimeout(() => {
      setActive(false)
      timerRef.current = null
    }, durationMs)
  }, [durationMs])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return [active, trigger]
}

export default useInlineFeedback
