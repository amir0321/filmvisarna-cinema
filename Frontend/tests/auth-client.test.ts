import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { cancelByToken, getCancelPreview } from '../src/api/cancellations.ts'
import { advanceSessionRevision, ApiError, apiClient, AUTH_UNAUTHORIZED_EVENT } from '../src/api/client.ts'
import { BOOKINGS_CHANGED_EVENT } from '../src/utils/bookingUpdates.ts'

const originalFetch = globalThis.fetch
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
let unauthorizedEvents = 0
let bookingUpdates = 0
let lastUrl = ''
let lastRequest: RequestInit | undefined

beforeEach(() => {
  unauthorizedEvents = 0
  bookingUpdates = 0
  lastUrl = ''
  lastRequest = undefined
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    location: { origin: 'https://cinema.example' },
    dispatchEvent: (event: Event) => {
      if (event.type === AUTH_UNAUTHORIZED_EVENT) unauthorizedEvents++
      if (event.type === BOOKINGS_CHANGED_EVENT) bookingUpdates++
    },
  } })
  globalThis.fetch = async (url, options) => {
    lastUrl = String(url)
    lastRequest = options
    return Response.json({ success: true })
  }
})
afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
  else Reflect.deleteProperty(globalThis, 'window')
})

test('mutations send cookies and the CSRF header without exposing any bearer token', async () => {
  await apiClient.post('/auth/login', { email: 'anna@example.test', password: 'example' })
  assert.equal(lastRequest?.credentials, 'same-origin')
  const headers = new Headers(lastRequest?.headers)
  assert.equal(headers.get('X-CSRF-Protection'), '1')
  assert.equal(headers.has('Authorization'), false)
  assert.equal(headers.get('Content-Type'), 'application/json')
})

test('cancellation preview and confirmation send reference and email in POST bodies without URL parameters or cookies', async () => {
  const credentials = { bookingRef: 'FV-A1B2C', email: 'anna@example.test' }
  await getCancelPreview(credentials)
  assert.equal(lastUrl, '/api/bookings/cancel-preview')
  assert.equal(lastRequest?.method, 'POST')
  assert.equal(lastRequest?.credentials, 'omit')
  assert.equal(lastRequest?.body, JSON.stringify(credentials))
  assert.equal(new Headers(lastRequest?.headers).get('X-CSRF-Protection'), '1')
  assert.equal(bookingUpdates, 0)

  await cancelByToken(credentials)
  assert.equal(lastUrl, '/api/bookings/cancel-by-token')
  assert.equal(lastRequest?.method, 'POST')
  assert.equal(lastRequest?.credentials, 'omit')
  assert.equal(lastRequest?.body, JSON.stringify(credentials))
  assert.equal(new Headers(lastRequest?.headers).get('X-CSRF-Protection'), '1')
  assert.equal(bookingUpdates, 1)
})

test('failed public cancellation does not invalidate the member booking cache', async () => {
  globalThis.fetch = async () => Response.json({ error: 'För många försök.' }, { status: 429 })
  await assert.rejects(cancelByToken({ bookingRef: 'FV-A1B2C', email: 'anna@example.test' }), { status: 429 })
  assert.equal(bookingUpdates, 0)
})

test('protected failures expire the UI but initial restoration and password validation do not', async () => {
  globalThis.fetch = async () => Response.json({ error: 'Unauthorized' }, { status: 401 })
  await assert.rejects(apiClient.get('/bookings/me'), ApiError)
  assert.equal(unauthorizedEvents, 1)
  await assert.rejects(apiClient.get('/auth/me', { ignoreUnauthorized: true }), ApiError)
  await assert.rejects(apiClient.post('/auth/login', {}), ApiError)
  await assert.rejects(apiClient.post('/auth/change-password', {}), ApiError)
  await assert.rejects(apiClient.post('/auth/logout', {}, { ignoreUnauthorized: true }), ApiError)
  assert.equal(unauthorizedEvents, 1)
})

test('late unauthorized responses from an earlier session cannot expire a new login', async () => {
  let resolveResponse!: (response: Response) => void
  globalThis.fetch = () => new Promise<Response>(resolve => { resolveResponse = resolve })
  const pending = apiClient.get('/bookings/me')
  advanceSessionRevision()
  resolveResponse(Response.json({ error: 'Expired' }, { status: 401 }))
  await assert.rejects(pending, ApiError)
  assert.equal(unauthorizedEvents, 0)
})

test('failed logout is returned to the UI and does not report successful sign-out', async () => {
  globalThis.fetch = async () => { throw new TypeError('Network unavailable') }
  await assert.rejects(apiClient.post('/auth/logout', {}, { ignoreUnauthorized: true }), /Network unavailable/)
  assert.equal(unauthorizedEvents, 0)
})

test('a read retries one connection reset and returns the successful response', async () => {
  let calls = 0
  globalThis.fetch = async (_url, options) => {
    assert.equal(options?.method, 'GET')
    if (++calls === 1) throw new TypeError('Failed to fetch')
    return Response.json({ success: true, data: [1, 2] })
  }
  assert.deepEqual(await apiClient.get('/screenings'), [1, 2])
  assert.equal(calls, 2)
})

test('a disconnected response body retries a read instead of reporting successful null data', async () => {
  let calls = 0
  globalThis.fetch = async () => {
    if (++calls > 1) return Response.json({ success: true, data: [3] })
    return new Response(new ReadableStream({
      start(controller) { controller.error(new TypeError('Connection reset while reading')) },
    }), { headers: { 'Content-Type': 'application/json' } })
  }
  assert.deepEqual(await apiClient.get('/screenings'), [3])
  assert.equal(calls, 2)
})

test('persistent read failures stop after two attempts without expiring the session', async () => {
  let calls = 0
  globalThis.fetch = async () => { calls++; throw new TypeError('Failed to fetch') }
  await assert.rejects(apiClient.get('/bookings/reservation-status'), /Failed to fetch/)
  assert.equal(calls, 2)
  assert.equal(unauthorizedEvents, 0)
})

test('HTTP errors and invalid JSON are not retried', async () => {
  for (const status of [401, 403, 429, 500, 503]) {
    let calls = 0
    globalThis.fetch = async () => { calls++; return Response.json({ error: 'Rejected' }, { status }) }
    await assert.rejects(apiClient.get('/screenings'), { status })
    assert.equal(calls, 1)
  }
  let calls = 0
  globalThis.fetch = async () => {
    calls++
    return new Response('{invalid JSON', { headers: { 'Content-Type': 'application/json' } })
  }
  await assert.rejects(apiClient.get('/movies'), SyntaxError)
  assert.equal(calls, 1)
})

test('writes are never replayed after a connection or response-body failure', async () => {
  for (const method of ['post', 'put', 'patch', 'delete'] as const) {
    let calls = 0
    globalThis.fetch = async () => { calls++; throw new TypeError('Failed to fetch') }
    await assert.rejects(apiClient[method]('/bookings/1'), /Failed to fetch/)
    assert.equal(calls, 1)
  }
  let calls = 0
  globalThis.fetch = async () => {
    calls++
    return new Response(new ReadableStream({ start(controller) { controller.error(new TypeError('Lost response')) } }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
  await assert.rejects(apiClient.post('/bookings', {}), /Lost response/)
  assert.equal(calls, 1)
})

test('cancelling a read or changing sessions during retry delay prevents another request', async () => {
  let calls = 0
  globalThis.fetch = async () => { calls++; throw new TypeError('Failed to fetch') }
  const controller = new AbortController()
  const pending = apiClient.get('/screenings', { signal: controller.signal })
  const cancelled = assert.rejects(pending, { name: 'AbortError' })
  await new Promise(resolve => setTimeout(resolve, 5))
  controller.abort()
  await cancelled
  assert.equal(calls, 1)

  calls = 0
  const previous = apiClient.get('/bookings/reservation-status')
  const expired = assert.rejects(previous, /Failed to fetch/)
  await new Promise(resolve => setTimeout(resolve, 5))
  advanceSessionRevision()
  await expired
  assert.equal(calls, 1)
})
