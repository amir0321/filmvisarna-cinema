import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { uploadImage } from '../src/api/movies.ts'
import { isSafeImageUrl, validateImageFile } from '../src/utils/imageValidation.ts'

const originalFetch = globalThis.fetch
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
let requests: { url: string; config?: RequestInit }[]
let responseBody: unknown

beforeEach(() => {
  requests = []
  responseBody = { success: true, data: { id: 1 } }
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    location: { origin: 'https://cinema.example' }, dispatchEvent: () => true,
  } })
  globalThis.fetch = async (url, config) => {
    requests.push({ url: String(url), config })
    return Response.json(responseBody)
  }
})

afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
  else Reflect.deleteProperty(globalThis, 'window')
})

test('safe image URLs permit HTTP(S) and local uploads while rejecting credentials, traversal and active content', () => {
  for (const value of ['https://image.tmdb.org/t/p/w500/photo.jpg', 'http://example.test/image.webp', '/uploads/123-abc.png']) {
    assert.equal(isSafeImageUrl(value), true, value)
  }
  for (const value of [
    undefined, null, 123, '', 'javascript:alert(1)', 'data:image/svg+xml,<svg/>', 'blob:https://example.test/1',
    '//evil.test/a.png', 'ftp://example.test/a.png', '/other/a.png', '/uploads/../secret', '/uploads/image..png',
    '/uploads/%2e%2e/secret', 'https://user@example.test/a.png', 'https://:password@example.test/a.png',
    'https://example.test/\nimage.png', 'https://example.test\\evil.test/image.png', `https://example.test/${'a'.repeat(2048)}`,
  ]) assert.equal(isSafeImageUrl(value), false, String(value))
})

test('image file validation accepts the four allowed MIME types up to exactly 5 MB', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/gif']) {
    assert.equal(validateImageFile(new File(['image'], 'image', { type })), undefined)
  }
  assert.equal(validateImageFile(new File([new Uint8Array(5 * 1024 * 1024)], 'image.png', { type: 'image/png' })), undefined)
  assert.equal(validateImageFile(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })),
    'Bildfilen är för stor. Maximal filstorlek är 5 MB.')
  for (const type of ['image/svg+xml', 'text/html', 'application/octet-stream', '']) {
    assert.match(validateImageFile(new File(['content'], 'fake.png', { type }))!, /Endast bildfiler/)
  }
})

test('image upload returns its URL and sends multipart data with CSRF protection and the browser boundary', async () => {
  responseBody = { success: true, url: '/uploads/photo.png', filename: 'photo.png' }
  const signal = new AbortController().signal
  const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'photo.png', { type: 'image/png' })
  assert.equal(await uploadImage(file, signal), '/uploads/photo.png')
  const { url, config } = requests[0]
  assert.equal(url, '/api/upload')
  assert.equal(config?.method, 'POST')
  assert.equal(config?.signal, signal)
  assert.equal(config?.credentials, 'same-origin')
  assert.ok(config?.body instanceof FormData)
  assert.equal(config.body.get('image'), file)
  const headers = new Headers(config.headers)
  assert.equal(headers.get('X-CSRF-Protection'), '1')
  assert.equal(headers.has('Content-Type'), false)
})

test('invalid uploads fail before a request and unsafe returned image URLs are rejected', async () => {
  await assert.rejects(uploadImage(new File(['<svg/>'], 'image.svg', { type: 'image/svg+xml' })), { status: 400 })
  assert.equal(requests.length, 0)
  const image = new File(['image'], 'image.png', { type: 'image/png' })
  for (const url of ['javascript:alert(1)', '/uploads/../secret', undefined]) {
    responseBody = { success: true, url }
    await assert.rejects(uploadImage(image), { status: 502 })
  }
})
