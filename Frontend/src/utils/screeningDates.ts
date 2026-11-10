import type { Screening } from '../types/screening'
import { toCinemaIsoDate } from './date.ts'

export function getRemainingScreenings(screenings: readonly Screening[], minDate: string, maxDate: string, now: number): Screening[] {
  return screenings.filter(screening => {
    const startsAt = Date.parse(screening.startsAt)
    if (!Number.isFinite(startsAt) || startsAt <= now) return false
    const date = toCinemaIsoDate(screening.startsAt)
    return date >= minDate && date <= maxDate
  })
}

export function getScreeningDates(screenings: readonly Screening[], minDate: string, maxDate: string, now = Date.now()): string[] {
  const dates = new Set<string>()
  for (const screening of getRemainingScreenings(screenings, minDate, maxDate, now)) {
    const date = toCinemaIsoDate(screening.startsAt)
    dates.add(date)
  }
  return [...dates].sort()
}

export function getAvailableCalendarDate(dates: readonly string[], target: string, direction: 1 | -1 = 1): string | undefined {
  return direction === 1
    ? dates.find(date => date >= target)
    : dates.findLast(date => date <= target)
}
