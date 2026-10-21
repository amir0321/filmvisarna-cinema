// All screening times are shown in the cinema's local time zone,
// regardless of where the visitor's device is.
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

// Calendar dates (YYYY-MM-DD) are parsed as UTC noon, so format them in UTC to avoid day shifts
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

function parseIsoDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00Z`)
}

function stripDots(value: string): string {
  return value.replace(/\./g, '')
}

// Today's date at the cinema as YYYY-MM-DD.
export function todayIsoDate(): string {
  return isoDateFormatter.format(new Date())
}

// Calendar date at the cinema for a timestamp: "2026-10-21T22:30:00Z" -> "2026-10-22"
export function toCinemaIsoDate(isoDateTime: string): string {
  return isoDateFormatter.format(new Date(isoDateTime))
}

const dayMonthFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'short',
})

// Day label for showtimes: "Idag 21 okt", "Imorgon 22 okt" or "lör 24 okt"
export function formatShowtimeDayLabel(isoDate: string): string {
  const today = todayIsoDate()
  const dayMonth = stripDots(dayMonthFormatter.format(parseIsoDate(isoDate)))
  if (isoDate === today) return `Idag ${dayMonth}`
  if (isoDate === addDaysToIsoDate(today, 1)) return `Imorgon ${dayMonth}`
  return formatDateShort(isoDate)
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

// "2026-10-21T18:00:00Z" -> "20:00"
export function formatTime(isoDateTime: string): string {
  return timeFormatter.format(new Date(isoDateTime))
}

// "2026-10-28" -> "onsdag 28 oktober"
export function formatDateLong(isoDate: string): string {
  return dateLongFormatter.format(parseIsoDate(isoDate))
}

// "2026-10-28" -> "ons 28 okt"
export function formatDateShort(isoDate: string): string {
  return stripDots(dateShortFormatter.format(parseIsoDate(isoDate)))
}

const monthYearFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
})

// "2026-10-28" -> "oktober 2026"
export function formatMonthYear(isoDate: string): string {
  return monthYearFormatter.format(parseIsoDate(isoDate))
}

// "2026-10-28" -> "2026-10-01"
export function startOfMonthIsoDate(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`
}

export function daysInMonth(isoDate: string): number {
  const date = parseIsoDate(startOfMonthIsoDate(isoDate))
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
}

// Moves by whole months, clamping the day (31 jan + 1 month -> 28/29 feb)
export function addMonthsToIsoDate(isoDate: string, months: number): string {
  const date = parseIsoDate(isoDate)
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 12))
  const targetIso = target.toISOString().slice(0, 10)
  const day = Math.min(date.getUTCDate(), daysInMonth(targetIso))
  return `${targetIso.slice(0, 8)}${String(day).padStart(2, '0')}`
}

// Monday = 0 ... Sunday = 6 (Swedish weeks start on Monday)
export function weekdayIndex(isoDate: string): number {
  return (parseIsoDate(isoDate).getUTCDay() + 6) % 7
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
