import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canCancelBooking } from '../src/utils/bookings.ts'

const now = Date.parse('2026-11-03T18:00:00+01:00')

test('cancellation is allowed exactly two hours before the screening', () => {
  const booking = {
    status: 'confirmed' as const,
    isPaid: true,
    screeningStartsAt: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
  }
  assert.equal(canCancelBooking(booking, now), true)
  assert.equal(canCancelBooking(booking, now - 1), true)
  assert.equal(canCancelBooking(booking, now + 1), false)
  assert.equal(canCancelBooking({ ...booking, status: 'reserved' }, now), true)
  assert.equal(canCancelBooking({ ...booking, status: 'expired' }, now), false)
})

test('cancelled bookings cannot be cancelled again', () => {
  assert.equal(canCancelBooking({ status: 'cancelled', isPaid: false, screeningStartsAt: '2099-01-01T18:00:00Z' }, now), false)
})

test('started screenings and missing or invalid dates cannot be cancelled', () => {
  for (const screeningStartsAt of [new Date(now).toISOString(), '2020-01-01T18:00:00Z', 'invalid', undefined]) {
    assert.equal(canCancelBooking({ status: 'confirmed', isPaid: false, screeningStartsAt }, now), false)
  }
})

test('unpaid reservations can be cancelled until seats release one hour before start', () => {
  const booking = { status: 'reserved' as const, isPaid: false, screeningStartsAt: new Date(now + 60 * 60_000).toISOString() }
  assert.equal(canCancelBooking(booking, now - 1), true)
  assert.equal(canCancelBooking(booking, now), false)
  assert.equal(canCancelBooking(booking, now + 1), false)
})
