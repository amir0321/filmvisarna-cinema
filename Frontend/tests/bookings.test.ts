import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getBookingState } from '../src/utils/bookings.ts'

const now = Date.parse('2026-11-03T18:00:00+01:00')

test('only confirmed future screenings are upcoming', () => {
  assert.equal(getBookingState({ status: 'confirmed', screeningStartsAt: '2026-11-03T19:00:00+01:00' }, now), 'upcoming')
  assert.equal(getBookingState({ status: 'confirmed', screeningStartsAt: '2026-11-03T16:00:00Z' }, now), 'past')
  assert.equal(getBookingState({ status: 'confirmed', screeningStartsAt: new Date(now).toISOString() }, now), 'past')
})

test('cancelled bookings keep their status regardless of screening time', () => {
  for (const screeningStartsAt of ['2026-11-04T18:00:00Z', '2026-11-02T18:00:00Z', undefined]) {
    assert.equal(getBookingState({ status: 'cancelled', screeningStartsAt }, now), 'cancelled')
  }
})

test('missing or invalid dates are never described as upcoming or past', () => {
  for (const screeningStartsAt of [undefined, '', 'invalid']) {
    assert.equal(getBookingState({ status: 'confirmed', screeningStartsAt }, now), 'unknown')
  }
})
