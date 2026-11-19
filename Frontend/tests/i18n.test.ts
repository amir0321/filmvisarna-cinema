import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addDaysToIsoDate, formatDateLong, formatDateShort, formatDayChipLabel, formatMonthYear, formatShowtimeDayLabel, formatTime, todayIsoDate, toCinemaIsoDate } from '../src/utils/date.ts'

test('localized date labels retain Stockholm cinema dates and 24-hour times', () => {
  assert.equal(formatDateLong('2026-11-16', 'sv'), 'måndag 16 november')
  assert.equal(formatDateLong('2026-11-16', 'en'), 'Monday 16 November')
  assert.match(formatDateShort('2026-11-16', 'en'), /^Mon,? 16 Nov$/)
  assert.equal(formatMonthYear('2026-11-16', 'en'), 'November 2026')
  for (const locale of ['sv', 'en'] as const) {
    assert.equal(formatTime('2026-11-16T23:30:00Z', locale), '00:30')
    assert.equal(formatTime('2026-06-16T23:30:00Z', locale), '01:30')
  }
  assert.equal(toCinemaIsoDate('2026-11-16T23:30:00Z'), '2026-11-17')
  const today = todayIsoDate()
  assert.match(formatShowtimeDayLabel(today, 'en'), /^Today /)
  assert.match(formatDayChipLabel(addDaysToIsoDate(today, 1), 'en'), /^Tomorrow \(/)
  assert.match(formatShowtimeDayLabel(today, 'sv'), /^Idag /)
})
