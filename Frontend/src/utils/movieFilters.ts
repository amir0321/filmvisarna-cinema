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

export function readHomeDateFilter(params: URLSearchParams, today: string): DateFilter {
  const date = readDate(params, today, MAX_DATE_FILTER_DAYS_AHEAD)
  if (date) return { kind: 'date', date }
  const when = params.get('when')
  return { kind: 'preset', when: when === 'tomorrow' || when === 'weekend' ? when : 'today' }
}

export function setDateFilter(params: URLSearchParams, filter: DateFilter): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete('when')
  next.delete('date')
  if (filter.kind === 'date') next.set('date', filter.date)
  else if (filter.when !== 'today') next.set('when', filter.when)
  return next
}

export function setAgeFilter(params: URLSearchParams, age: AgeFilter): URLSearchParams {
  const next = new URLSearchParams(params)
  if (age === null) next.delete('age')
  else next.set('age', String(age))
  return next
}
