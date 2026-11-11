import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { advanceSessionRevision, ApiError, apiClient, AUTH_UNAUTHORIZED_EVENT } from '../src/api/client.ts'

const originalFetch = globalThis.fetch
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
let unauthorizedEvents = 0
let lastRequest: RequestInit | undefined

beforeEach(() => {
  unauthorizedEvents = 0
  lastRequest = undefined
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    location: { origin: 'https://cinema.example' },
    dispatchEvent: (event: Event) => { if (event.type === AUTH_UNAUTHORIZED_EVENT) unauthorizedEvents++ },
  } })
  globalThis.fetch = async (_url, options) => {
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

test('multipart uploads carry CSRF protection without overriding their boundary', async () => {
  await apiClient.post('/upload', new FormData())
  const headers = new Headers(lastRequest?.headers)
  assert.equal(headers.get('X-CSRF-Protection'), '1')
  assert.equal(headers.has('Content-Type'), false)
})

test('guest writes can explicitly omit the shared session cookie', async () => {
  await apiClient.post('/bookings/guest/confirm', { token: 'link' }, { credentials: 'omit' })
  assert.equal(lastRequest?.credentials, 'omit')
  assert.equal(new Headers(lastRequest?.headers).get('X-CSRF-Protection'), '1')
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
