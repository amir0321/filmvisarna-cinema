import { translate } from '../i18n/index.ts'
import { getIntlLocale, readLocale, type Locale } from './locale.ts'

export const CINEMA_TIME_ZONE = 'Europe/Stockholm'

const isoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CINEMA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function createFormatters(locale: Locale) {
  const intlLocale = getIntlLocale(locale)
  const date = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(intlLocale, { timeZone: 'UTC', ...options })
  return {
    time: new Intl.DateTimeFormat(intlLocale, { timeZone: CINEMA_TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false }),
    long: date({ weekday: 'long', day: 'numeric', month: 'long' }),
    short: date({ weekday: 'short', day: 'numeric', month: 'short' }),
    dayMonth: date({ day: 'numeric', month: 'short' }),
    weekday: date({ weekday: 'long' }),
    monthYear: date({ month: 'long', year: 'numeric' }),
  }
}

const formatters = { sv: createFormatters('sv'), en: createFormatters('en') }

function parseIsoDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00Z`)
}

function removeDots(value: string): string {
  return value.replace(/\./g, '')
}

export function todayIsoDate(now = Date.now()): string {
  return isoDateFormatter.format(now)
}

export function toCinemaIsoDate(isoDateTime: string): string {
  return isoDateFormatter.format(new Date(isoDateTime))
}

const offsetFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CINEMA_TIME_ZONE,
  timeZoneName: 'longOffset',
})

export function toCinemaDateTime(isoDate: string, time: string): string {
  const parts = offsetFormatter.formatToParts(new Date(`${isoDate}T${time}:00Z`))
  const offset = parts.find((part) => part.type === 'timeZoneName')?.value.replace('GMT', '') || '+00:00'
  return `${isoDate}T${time}:00${offset}`
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function formatTime(isoDateTime: string, locale: Locale = readLocale()): string {
  return formatters[locale].time.format(new Date(isoDateTime))
}

export function formatDateLong(isoDate: string, locale: Locale = readLocale()): string {
  return formatters[locale].long.format(parseIsoDate(isoDate))
}

export function formatDateShort(isoDate: string, locale: Locale = readLocale()): string {
  return removeDots(formatters[locale].short.format(parseIsoDate(isoDate)))
}

export function formatShowtimeDayLabel(isoDate: string, locale: Locale = readLocale()): string {
  const today = todayIsoDate()
  const dayMonth = removeDots(formatters[locale].dayMonth.format(parseIsoDate(isoDate)))
  if (isoDate === today) return `${translate(locale, 'date.today')} ${dayMonth}`
  if (isoDate === addDaysToIsoDate(today, 1)) return `${translate(locale, 'date.tomorrow')} ${dayMonth}`
  return formatDateShort(isoDate, locale)
}

export function formatDayChipLabel(isoDate: string, locale: Locale = readLocale()): string {
  const today = todayIsoDate()
  const dayMonth = removeDots(formatters[locale].dayMonth.format(parseIsoDate(isoDate)))
  if (isoDate === today) return `${translate(locale, 'date.today')} (${dayMonth})`
  if (isoDate === addDaysToIsoDate(today, 1)) return `${translate(locale, 'date.tomorrow')} (${dayMonth})`
  return `${capitalize(formatters[locale].weekday.format(parseIsoDate(isoDate)))} (${dayMonth})`
}

export function formatMonthYear(isoDate: string, locale: Locale = readLocale()): string {
  return formatters[locale].monthYear.format(parseIsoDate(isoDate))
}

export function startOfMonthIsoDate(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`
}

export function daysInMonth(isoDate: string): number {
  const date = parseIsoDate(isoDate)
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
}

export function addMonthsToIsoDate(isoDate: string, months: number): string {
  const date = parseIsoDate(isoDate)
  const firstOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 12))
  const monthIso = firstOfMonth.toISOString().slice(0, 10)
  const day = Math.min(date.getUTCDate(), daysInMonth(monthIso))
  return `${monthIso.slice(0, 8)}${String(day).padStart(2, '0')}`
}

export function weekdayIndex(isoDate: string): number {
  return (parseIsoDate(isoDate).getUTCDay() + 6) % 7
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
