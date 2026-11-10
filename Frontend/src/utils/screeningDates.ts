import type { Screening } from '../types/screening'
import { toCinemaIsoDate } from './date.ts'

export function getScreeningDates(screenings: readonly Screening[], minDate: string, maxDate: string, now = Date.now()): string[] {
  const dates = new Set<string>()
  for (const screening of screenings) {
    const startsAt = Date.parse(screening.startsAt)
    if (!Number.isFinite(startsAt) || startsAt <= now) continue
    const date = toCinemaIsoDate(screening.startsAt)
    if (date >= minDate && date <= maxDate) dates.add(date)
  }
  return [...dates].sort()
}

export function getAvailableCalendarDate(dates: readonly string[], target: string, direction: 1 | -1 = 1): string | undefined {
  return direction === 1
    ? dates.find(date => date >= target)
    : dates.findLast(date => date <= target)
}
