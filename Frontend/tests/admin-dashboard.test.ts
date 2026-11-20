import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getDashboardProgramme, getProjectionFormat, getScreeningOccupancy } from '../src/utils/adminDashboard.ts'
import type { Screening } from '../src/types/screening.ts'
import type { CinemaOverview } from '../src/types/cinema.ts'

function screening(id: number, startsAt: string, endsAt: string, bookedSeats = 0): Screening {
  return { id, startsAt, endsAt, bookedSeats, movieId: id, movieTitle: `Film ${id}`, cinemaId: 1, cinema: 'Stora Salongen', totalSeats: 80 }
}
const cinema: CinemaOverview = { id: 1, name: 'Stora Salongen', total_seats: 80, format: '4K Dolby Atmos', tech: null, screen_size: null, opened_year: null }

test('dashboard totals include the whole day while the running order excludes ended shows and sorts by start', () => {
  const items = [
    screening(5, '2026-11-20T18:00:00Z', '2026-11-20T20:00:00Z', 10),
    screening(3, '2026-11-19T19:00:00Z', '2026-11-19T21:00:00Z', 20),
    screening(1, '2026-11-19T13:00:00Z', '2026-11-19T15:00:00Z', 30),
    screening(2, '2026-11-19T17:00:00Z', '2026-11-19T19:00:00Z', 40),
    screening(4, '2026-11-19T21:00:00Z', '2026-11-19T23:00:00Z', 50),
  ]
  const result = getDashboardProgramme(items, Date.parse('2026-11-19T18:00:00Z'))
  assert.equal(result.today, '2026-11-19')
  assert.equal(result.todayScreenings.length, 4)
  assert.equal(result.bookedToday, 140)
  assert.equal(result.upcomingCount, 3)
  assert.equal(result.programmeDays, 2)
  assert.deepEqual(result.next.map(item => item.id), [2, 3, 4, 5])
  assert.equal(result.activeMovieIds.has(1), false)
  assert.equal(result.activeMovieIds.has(2), true)
  assert.deepEqual(items.map(item => item.id), [5, 3, 1, 2, 4])
})

test('dashboard respects Stockholm midnight and daylight saving changes', () => {
  for (const [now, start, date] of [
    ['2026-11-19T23:30:00Z', '2026-11-19T23:00:00Z', '2026-11-20'],
    ['2026-06-19T22:30:00Z', '2026-06-19T22:00:00Z', '2026-06-20'],
    ['2026-10-25T01:30:00Z', '2026-10-25T00:00:00Z', '2026-10-25'],
  ]) {
    const result = getDashboardProgramme([screening(1, start, now)], Date.parse(now))
    assert.equal(result.today, date)
    assert.equal(result.todayScreenings.length, 1)
    assert.equal(result.next.length, 0)
  }
})

test('dashboard counts distinct dates and active films, limits the running order, and handles empty data', () => {
  const now = Date.parse('2026-11-19T10:00:00Z')
  const items = Array.from({ length: 7 }, (_, id) => ({ ...screening(id, '2026-11-19T18:00:00Z', '2026-11-19T20:00:00Z'), movieId: 1 }))
  const result = getDashboardProgramme(items, now)
  assert.equal(result.next.length, 5)
  assert.equal(result.activeMovieIds.size, 1)
  assert.equal(result.programmeDays, 1)
  assert.equal(getDashboardProgramme([], now).bookedToday, 0)
  assert.deepEqual(getDashboardProgramme([], now).next, [])
})

test('occupancy warns only above 80%, falls back to actual capacity, and handles unknown or full auditoriums', () => {
  const show = screening(1, '2026-11-19T18:00:00Z', '2026-11-19T20:00:00Z', 64)
  assert.equal(getScreeningOccupancy(show).isBusy, false)
  assert.equal(getScreeningOccupancy({ ...show, bookedSeats: 65 }).isBusy, true)
  assert.equal(getScreeningOccupancy({ ...show, totalSeats: undefined }, cinema).total, 80)
  assert.equal(getScreeningOccupancy({ ...show, totalSeats: 0 }).percent, 0)
  assert.equal(getScreeningOccupancy({ ...show, bookedSeats: 100 }).percent, 100)
  assert.equal(getScreeningOccupancy({ ...show, bookedSeats: undefined }).booked, 0)
})

test('projection labels distinguish 3D from 4K technology and default to 2D', () => {
  assert.equal(getProjectionFormat(cinema), '2D')
  assert.equal(getProjectionFormat({ ...cinema, format: '4K 3D' }), '3D')
  assert.equal(getProjectionFormat(undefined), '2D')
})
