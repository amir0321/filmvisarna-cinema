import assert from 'node:assert/strict'
import { test } from 'node:test'
import { groupSeatLabels, translateApiError, translateSeatLabel } from '../src/utils/bookingPresentation.ts'

test('stored seat labels render in either language without changing confirmation data', () => {
  const seats = ['Rad E, Stol 1', 'Rad E, Stol 2', 'Rad F, stol 3', 'Rad G, plats 4', 'Custom seat']
  const original = [...seats]
  assert.deepEqual(groupSeatLabels(seats, 'en'), ['Row E: Seat 1, 2', 'Row F: Seat 3', 'Row G: Seat 4', 'Custom seat'])
  assert.deepEqual(groupSeatLabels(seats, 'sv'), ['Rad E: Stol 1, 2', 'Rad F: Stol 3', 'Rad G: Stol 4', 'Custom seat'])
  assert.deepEqual(seats, original)
  assert.equal(translateSeatLabel('Row E, Seat 1', 'sv'), 'Rad E, Stol 1')
  assert.equal(translateSeatLabel('Rad E, plats 1', 'en'), 'Row E, Seat 1')
  assert.equal(translateSeatLabel('Plats-ID 42', 'en'), 'Seat ID 42')
  assert.equal(translateSeatLabel('Custom seat', 'en'), 'Custom seat')
  assert.equal(
    translateApiError('Du kan inte göra nya obetalda reservationer just nu. Du kan fortfarande betala befintliga bokningar eller köpa lediga platser i kassan.', 'en'),
    'You cannot make new unpaid reservations right now. You can still pay existing bookings or buy available seats at the box office.',
  )
  assert.equal(
    translateApiError('Kan inte avboka mindre än 2 timmar innan visningen startar.', 'en'),
    'Cannot cancel less than 2 hours before the screening starts.',
  )
})
