// Show all times in Swedish time, no matter where the visitor is
export const CINEMA_TIME_ZONE = 'Europe/Stockholm'

const isoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CINEMA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const timeFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: CINEMA_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
})

// Plain dates (YYYY-MM-DD) are parsed as UTC, so these format in UTC too
const dateLongFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const dateShortFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

const dayMonthFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'short',
})

const weekdayLongFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'UTC',
  weekday: 'long',
})

const monthYearFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
})

function parseIsoDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00Z`)
}

function removeDots(value: string): string {
  return value.replace(/\./g, '')
}

export function todayIsoDate(): string {
  return isoDateFormatter.format(new Date())
}

export function toCinemaIsoDate(isoDateTime: string): string {
  return isoDateFormatter.format(new Date(isoDateTime))
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

// "20:00"
export function formatTime(isoDateTime: string): string {
  return timeFormatter.format(new Date(isoDateTime))
}

// "onsdag 28 oktober"
export function formatDateLong(isoDate: string): string {
  return dateLongFormatter.format(parseIsoDate(isoDate))
}

// "ons 28 okt"
export function formatDateShort(isoDate: string): string {
  return removeDots(dateShortFormatter.format(parseIsoDate(isoDate)))
}

// "Idag 21 okt", "Imorgon 22 okt" or "lör 24 okt"
export function formatShowtimeDayLabel(isoDate: string): string {
  const today = todayIsoDate()
  const dayMonth = removeDots(dayMonthFormatter.format(parseIsoDate(isoDate)))
  if (isoDate === today) return `Idag ${dayMonth}`
  if (isoDate === addDaysToIsoDate(today, 1)) return `Imorgon ${dayMonth}`
  return formatDateShort(isoDate)
}

export function formatDayChipLabel(isoDate: string): string {
  const today = todayIsoDate()
  const dayMonth = removeDots(dayMonthFormatter.format(parseIsoDate(isoDate)))
  if (isoDate === today) return `Idag (${dayMonth})`
  if (isoDate === addDaysToIsoDate(today, 1)) return `Imorgon (${dayMonth})`
  return `${capitalize(weekdayLongFormatter.format(parseIsoDate(isoDate)))} (${dayMonth})`
}

// "oktober 2026"
export function formatMonthYear(isoDate: string): string {
  return monthYearFormatter.format(parseIsoDate(isoDate))
}

export function startOfMonthIsoDate(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`
}

export function daysInMonth(isoDate: string): number {
  const date = parseIsoDate(isoDate)
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
}

// Keeps the day within the new month, e.g. 31 jan + 1 month = 28 feb
export function addMonthsToIsoDate(isoDate: string, months: number): string {
  const date = parseIsoDate(isoDate)
  const firstOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 12))
  const monthIso = firstOfMonth.toISOString().slice(0, 10)
  const day = Math.min(date.getUTCDate(), daysInMonth(monthIso))
  return `${monthIso.slice(0, 8)}${String(day).padStart(2, '0')}`
}

// Monday = 0, Sunday = 6
export function weekdayIndex(isoDate: string): number {
  return (parseIsoDate(isoDate).getUTCDay() + 6) % 7
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
