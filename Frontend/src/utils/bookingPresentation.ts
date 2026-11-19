import { translate } from '../i18n/index.ts'
import { translateApiError, translateApiMessage } from '../i18n/mappers.ts'
import { readLocale, type Locale } from './locale.ts'

export { translateApiError, translateApiMessage }

// Confirmation storage and cancellation responses keep their original seat labels.
// Localize only for display so an existing confirmation works in either language.
const seatPattern = /^(?:Rad|Row) (\S+), (?:Stol|stol|plats|Seat|seat) (\d+)$/

export function translateSeatLabel(value: string, locale: Locale = readLocale()): string {
  const match = seatPattern.exec(value)
  if (match) return translate(locale, 'seatMap.seat', { row: match[1], seat: match[2] })
  const id = /^Plats-ID (\d+)$/.exec(value)
  return id ? translate(locale, 'seatMap.seatId', { id: id[1] }) : value
}

export function groupSeatLabels(seats: readonly string[], locale: Locale = readLocale()): string[] {
  const rows = new Map<string, string[]>()
  const unknown: string[] = []
  for (const value of seats) {
    const match = seatPattern.exec(value)
    if (!match) { unknown.push(value); continue }
    rows.set(match[1], [...(rows.get(match[1]) ?? []), match[2]])
  }
  return [...rows].map(([row, numbers]) => translate(locale, 'seatMap.groupedSeats', { row, seats: numbers.join(', ') })).concat(unknown)
}
