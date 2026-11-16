import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canCancelBooking } from '../src/utils/bookings.ts'
import { ApiError } from '../src/api/client.ts'
import { cancelErrorMessages, mapCancelErrorToState } from '../src/api/cancellations.ts'

const now = Date.parse('2026-11-03T18:00:00+01:00')

test('cancellation is allowed exactly two hours before the screening', () => {
  const booking = {
    status: 'confirmed' as const,
    screeningStartsAt: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
  }
  assert.equal(canCancelBooking(booking, now), true)
  assert.equal(canCancelBooking(booking, now - 1), true)
  assert.equal(canCancelBooking(booking, now + 1), false)
})

test('cancelled bookings cannot be cancelled again', () => {
  assert.equal(canCancelBooking({ status: 'cancelled', screeningStartsAt: '2099-01-01T18:00:00Z' }, now), false)
})

test('started screenings and missing or invalid dates cannot be cancelled', () => {
  for (const screeningStartsAt of [new Date(now).toISOString(), '2020-01-01T18:00:00Z', 'invalid', undefined]) {
    assert.equal(canCancelBooking({ status: 'confirmed', screeningStartsAt }, now), false)
  }
})

test('public cancellation maps missing bookings and mismatched identities to the same Swedish feedback', () => {
  for (const message of ['Bokningen kunde inte hittas.', 'E-postadressen matchar inte bokningen.']) {
    const state = mapCancelErrorToState(new ApiError(404, message))
    assert.equal(state, 'not_found')
    assert.equal(cancelErrorMessages[state], 'Vi hittade ingen bokning som matchar angivet bokningsnummer och e-postadress.')
  }
})

test('rate limiting, cancellation deadlines and previous cancellations have distinct actionable feedback', () => {
  const cases = [
    [429, 'För många försök.', 'rate_limited', /15 minuter/],
    [400, 'Kan inte avboka mindre än 2 timmar innan visningen startar.', 'too_late', /2 timmar/],
    [400, 'Kan inte avboka en visning som redan har startat.', 'expired', /startat eller passerat/],
    [400, 'Bokningen är redan avbokad.', 'already_cancelled', /redan avbokad/],
    [400, 'Valideringsfel', 'invalid_input', /FV-XXXXX/],
    [503, 'Unavailable', 'error', /försök igen/],
  ] as const
  for (const [status, message, expected, feedback] of cases) {
    const state = mapCancelErrorToState(new ApiError(status, message))
    assert.equal(state, expected)
    assert.match(cancelErrorMessages[state]!, feedback)
  }
  assert.equal(mapCancelErrorToState(new TypeError('Failed to fetch')), 'error')
})
