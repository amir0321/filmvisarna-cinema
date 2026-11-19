import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getBookingState } from '../src/utils/bookings.ts'

const now = Date.parse('2026-11-03T18:00:00+01:00')

test('future reservations are upcoming and paid bookings become past only when the film ends', () => {
  const booking = { status: 'confirmed' as const, isPaid: true, screeningStartsAt: new Date(now - 60_000).toISOString(), screeningEndsAt: new Date(now).toISOString() }
  assert.equal(getBookingState({ ...booking, status: 'reserved', isPaid: false, screeningStartsAt: new Date(now + 61 * 60_000).toISOString(), screeningEndsAt: new Date(now + 120 * 60_000).toISOString() }, now), 'upcoming')
  assert.equal(getBookingState(booking, now - 60_000), 'ongoing')
  assert.equal(getBookingState(booking, now - 1), 'ongoing')
  assert.equal(getBookingState(booking, now), 'past')
})

test('unpaid reservations are released exactly one hour before start, while paid seats remain held', () => {
  const booking = { status: 'reserved' as const, isPaid: false, screeningStartsAt: new Date(now).toISOString(), screeningEndsAt: new Date(now + 60_000).toISOString() }
  assert.equal(getBookingState(booking, now - 60 * 60_000 - 1), 'upcoming')
  assert.equal(getBookingState(booking, now - 60 * 60_000), 'expired')
  assert.equal(getBookingState(booking, now), 'expired')
  assert.equal(getBookingState({ ...booking, status: 'confirmed', isPaid: true }, now - 60 * 60_000), 'upcoming')
  assert.equal(getBookingState({ ...booking, status: 'confirmed', isPaid: true }, now), 'ongoing')
  assert.equal(getBookingState(booking, now + 60_001), 'expired')
  assert.equal(getBookingState({ ...booking, status: 'expired' }, now - 1), 'expired')
})

test('cancelled bookings keep their status regardless of screening time', () => {
  for (const screeningStartsAt of ['2026-11-04T18:00:00Z', '2026-11-02T18:00:00Z', undefined]) {
    assert.equal(getBookingState({ status: 'cancelled', isPaid: false, screeningStartsAt }, now), 'cancelled')
  }
})

test('missing or invalid dates are never described as upcoming or past', () => {
  for (const screeningStartsAt of [undefined, '', 'invalid']) {
    assert.equal(getBookingState({ status: 'confirmed', isPaid: false, screeningStartsAt }, now), 'unknown')
  }
  for (const screeningEndsAt of [undefined, '', 'invalid', new Date(now - 60_000).toISOString()]) {
    assert.equal(getBookingState({ status: 'confirmed', isPaid: true, screeningStartsAt: new Date(now).toISOString(), screeningEndsAt }, now), 'unknown')
  }
})
