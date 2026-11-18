import assert from 'node:assert/strict'
import { test } from 'node:test'
import { limitTicketCounts } from '../src/utils/bookingAvailability.ts'

test('sold-out screenings cannot retain ticket counts from a URL or previous availability', () => {
  assert.deepEqual(limitTicketCounts({ adult: 3, senior: 2, child: 1 }, 0), { adult: 0, senior: 0, child: 0 })
})

test('all ticket categories share the actual seat limit', () => {
  assert.deepEqual(limitTicketCounts({ adult: 2, senior: 2, child: 2 }, 3), { adult: 2, senior: 1, child: 0 })
  assert.deepEqual(limitTicketCounts({ adult: 2, senior: 1, child: 0 }, 1), { adult: 1, senior: 0, child: 0 })
})

test('the ten-ticket limit still applies to screenings with many free seats', () => {
  assert.deepEqual(limitTicketCounts({ adult: 8, senior: 3, child: 1 }, 80), { adult: 8, senior: 2, child: 0 })
})
