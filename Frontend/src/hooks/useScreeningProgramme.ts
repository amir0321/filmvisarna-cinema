import { useEffect, useState } from 'react'
import type { Screening } from '../types/screening'
import { addDaysToIsoDate, todayIsoDate } from '../utils/date'
import { MAX_DATE_FILTER_DAYS_AHEAD } from '../utils/movieFilters'
import { getRemainingScreenings, getScreeningDates } from '../utils/screeningDates'
import { useScreenings } from './useScreenings'

export interface ScreeningProgramme {
  screenings: Screening[]
  dates: string[]
  availableDates: ReadonlySet<string>
  today: string
  maxDate: string
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useScreeningProgramme(): ScreeningProgramme {
  const { data, loading, error, refetch } = useScreenings()
  const [now, setNow] = useState(() => Date.now())
  const today = todayIsoDate(now)
  const maxDate = addDaysToIsoDate(today, MAX_DATE_FILTER_DAYS_AHEAD)

  useEffect(() => {
    const updateClock = () => setNow(Date.now())
    const nextStart = (data ?? []).reduce((next, screening) => {
      const start = Date.parse(screening.startsAt)
      return start > now ? Math.min(next, start) : next
    }, Infinity)
    // Re-evaluate at the next screening start, and periodically for midnight/clock changes.
    const timer = window.setTimeout(updateClock, Math.max(0, Math.min(nextStart - Date.now() + 1, 60_000)))
    window.addEventListener('focus', updateClock)
    document.addEventListener('visibilitychange', updateClock)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', updateClock)
      document.removeEventListener('visibilitychange', updateClock)
    }
  }, [data, now])

  const screenings = getRemainingScreenings(data ?? [], today, maxDate, now)
  const dates = getScreeningDates(screenings, today, maxDate, now)
  return { screenings, dates, availableDates: new Set(dates), today, maxDate, loading, error, refetch }
}
