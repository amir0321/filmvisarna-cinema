import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readAgeFilter, readDate, readHomeDateFilter, setAgeFilter, setDateFilter } from '../src/utils/movieFilters.ts'

const today = '2026-11-04'

test('home date presets and calendar dates survive URL round trips', () => {
  for (const when of ['today', 'tomorrow', 'weekend'] as const) {
    const filter = { kind: 'preset', when } as const
    assert.deepEqual(readHomeDateFilter(setDateFilter(new URLSearchParams(), filter), today), filter)
  }
  const custom = { kind: 'date', date: '2026-11-15' } as const
  assert.deepEqual(readHomeDateFilter(setDateFilter(new URLSearchParams('when=tomorrow'), custom), today), custom)
})

test('invalid, impossible, stale and out-of-range dates fall back safely', () => {
  for (const date of ['bad', '2026-11-31', '2026-11-03', '2027-02-01']) {
    const params = new URLSearchParams({ date })
    assert.equal(readDate(params, today, 60), null)
    assert.deepEqual(readHomeDateFilter(params, today), { kind: 'preset', when: 'today' })
  }
  assert.equal(readDate(new URLSearchParams('date=2026-11-07'), today, 3), '2026-11-07')
  assert.equal(readDate(new URLSearchParams('date=2026-11-08'), today, 3), null)
})

test('filter updates preserve unrelated parameters and remove conflicting date modes', () => {
  const initial = new URLSearchParams('sok=1&date=2026-11-05&age=11')
  const next = setDateFilter(initial, { kind: 'preset', when: 'weekend' })
  assert.equal(next.get('sok'), '1')
  assert.equal(next.get('age'), '11')
  assert.equal(next.get('when'), 'weekend')
  assert.equal(next.has('date'), false)
  assert.equal(initial.get('date'), '2026-11-05')
})

test('age filters include zero, clear to all and reject malformed values', () => {
  for (const age of [0, 7, 11, 15, null]) {
    assert.equal(readAgeFilter(setAgeFilter(new URLSearchParams('when=tomorrow'), age)), age)
  }
  for (const age of ['', '-1', '18', '7abc', 'all']) assert.equal(readAgeFilter(new URLSearchParams({ age })), null)
})
