import { addDaysToIsoDate } from './date.ts'

export const MAX_DATE_FILTER_DAYS_AHEAD = 60

export type DateFilter =
  | { kind: 'preset'; when: 'today' | 'tomorrow' | 'weekend' }
  | { kind: 'date'; date: string }

export type AgeFilter = number | null

export function readAgeFilter(params: URLSearchParams): AgeFilter {
  const age = params.get('age')
  return age !== null && ['0', '7', '11', '15'].includes(age) ? Number(age) : null
}

export function readDate(params: URLSearchParams, today: string, daysAhead: number): string | null {
  const date = params.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const parsed = new Date(`${date}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return null
  return date >= today && date <= addDaysToIsoDate(today, daysAhead) ? date : null
}

export function readMovieDateFilter(params: URLSearchParams, today: string, dates: readonly string[]): string {
  return readDate(params, today, MAX_DATE_FILTER_DAYS_AHEAD) ?? dates[0] ?? today
}

export function readHomeDateFilter(params: URLSearchParams, today: string, dates: readonly string[] = []): DateFilter {
  const date = readDate(params, today, MAX_DATE_FILTER_DAYS_AHEAD)
  if (date) return { kind: 'date', date }
  const when = params.get('when')
  if (when === 'today' || when === 'tomorrow' || when === 'weekend') return { kind: 'preset', when }
  const first = dates[0]
  if (!first || first === today) return { kind: 'preset', when: 'today' }
  if (first === addDaysToIsoDate(today, 1)) return { kind: 'preset', when: 'tomorrow' }
  return { kind: 'date', date: first }
}

export function getDateFilterRange(filter: DateFilter, today: string): { from: string; to: string } {
  if (filter.kind === 'date') return { from: filter.date, to: filter.date }
  if (filter.when === 'today') return { from: today, to: today }
  if (filter.when === 'tomorrow') {
    const tomorrow = addDaysToIsoDate(today, 1)
    return { from: tomorrow, to: tomorrow }
  }
  // Match the API: the coming Saturday/Sunday, or the current weekend on Sunday.
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay()
  const saturday = addDaysToIsoDate(today, weekday === 0 ? -1 : 6 - weekday)
  return { from: saturday, to: addDaysToIsoDate(saturday, 1) }
}

export function hasDateFilterScreenings(filter: DateFilter, today: string, dates: readonly string[]): boolean {
  const { from, to } = getDateFilterRange(filter, today)
  return dates.some(date => date >= from && date <= to)
}

export function setDateFilter(params: URLSearchParams, filter: DateFilter): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete('when')
  next.delete('date')
  if (filter.kind === 'date') next.set('date', filter.date)
  else next.set('when', filter.when)
  return next
}

export function setAgeFilter(params: URLSearchParams, age: AgeFilter): URLSearchParams {
  const next = new URLSearchParams(params)
  if (age === null) next.delete('age')
  else next.set('age', String(age))
  return next
}
