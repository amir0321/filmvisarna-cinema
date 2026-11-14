import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { notifyBookingsChanged, subscribeToBookingChanges } from '../src/utils/bookingUpdates.ts'

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
let windowEvents: EventTarget
let documentEvents: EventTarget & { visibilityState: string }

beforeEach(() => {
  windowEvents = new EventTarget()
  documentEvents = Object.assign(new EventTarget(), { visibilityState: 'visible' })
  Object.defineProperty(globalThis, 'window', { configurable: true, value: windowEvents })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: documentEvents })
})
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
  else Reflect.deleteProperty(globalThis, 'window')
  if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument)
  else Reflect.deleteProperty(globalThis, 'document')
})

test('public cancellation refreshes cached bookings in the same window and other tabs', { timeout: 2000 }, async () => {
  let updates = 0
  const unsubscribe = subscribeToBookingChanges(() => { updates++ })
  const otherTab = new BroadcastChannel('fv:bookings')
  try {
    const received = new Promise<{ type: string; source: string }>(resolve => { otherTab.onmessage = event => resolve(event.data) })
    notifyBookingsChanged()
    assert.equal(updates, 1)
    const message = await received
    assert.equal(message.type, 'changed')
    assert.deepEqual(Object.keys(message).sort(), ['source', 'type'])
    assert.equal(updates, 1)
    const remoteRefresh = new Promise<void>(resolve => {
      const check = subscribeToBookingChanges(() => { check(); resolve() })
    })
    otherTab.postMessage({ type: 'changed', source: 'other-tab' })
    await remoteRefresh
    assert.equal(updates, 2)
  } finally {
    unsubscribe()
    otherTab.close()
  }
})

test('returning to a visible tab refreshes bookings and unmount removes listeners', () => {
  let updates = 0
  const unsubscribe = subscribeToBookingChanges(() => { updates++ })
  try {
    documentEvents.visibilityState = 'hidden'
    documentEvents.dispatchEvent(new Event('visibilitychange'))
    windowEvents.dispatchEvent(new Event('focus'))
    assert.equal(updates, 0)
    documentEvents.visibilityState = 'visible'
    documentEvents.dispatchEvent(new Event('visibilitychange'))
    windowEvents.dispatchEvent(new Event('focus'))
    assert.equal(updates, 2)
  } finally { unsubscribe() }
  notifyBookingsChanged()
  windowEvents.dispatchEvent(new Event('focus'))
  documentEvents.dispatchEvent(new Event('visibilitychange'))
  assert.equal(updates, 2)
})
