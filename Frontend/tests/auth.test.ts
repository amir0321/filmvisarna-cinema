import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getSafeRedirectPath, isAuthPath } from '../src/utils/links.ts'
import { validateAuth, validateNewPassword } from '../src/utils/authValidation.ts'

test('redirect preserves the booking path, query and fragment', () => {
  const destination = '/boka/42?seats=1%2C2#sammanfattning'
  assert.equal(getSafeRedirectPath(destination), destination)
  assert.equal(getSafeRedirectPath('/mina-bokningar'), '/mina-bokningar')
})

test('Swedish and English auth paths cannot become redirect loops', () => {
  for (const path of ['/login', '/logga-in', '/register', '/registrera', '/skapa-konto', '/reset-password', '/verify-email']) {
    assert.equal(isAuthPath(path), true)
    assert.equal(getSafeRedirectPath(`${path}?redirect=%2Fmina-bokningar`), '/')
    assert.equal(getSafeRedirectPath(path.replace(/i/g, '%69')), '/')
  }
  assert.equal(isAuthPath('/filmer'), false)
})

test('external, encoded and malformed redirect targets are rejected', () => {
  for (const path of ['https://example.test', '//example.test', '/\\example.test', '/%2fexample.test', '/%252fexample.test', '/%0aexample.test', '/%zz', ' /mina-bokningar']) {
    assert.equal(getSafeRedirectPath(path), '/')
  }
  assert.equal(getSafeRedirectPath(null, '/mina-bokningar'), '/mina-bokningar')
  assert.equal(getSafeRedirectPath(null, 'https://example.test'), '/')
})

test('registration requires names, valid email and a password within the bcrypt byte limit', () => {
  assert.deepEqual(validateAuth({ firstName: 'Anna', lastName: 'Lind', email: 'anna@example.test', password: 'TestPassword123!' }, true), {})
  const errors = validateAuth({ firstName: '', lastName: ' ', email: 'invalid', password: 'short' }, true)
  for (const field of ['firstName', 'lastName', 'email', 'password'] as const) assert.ok(errors[field])
  assert.equal(validateNewPassword('å'.repeat(36)), undefined)
  assert.ok(validateNewPassword('å'.repeat(37)))
})

test('login accepts an existing password without imposing registration rules', () => {
  assert.deepEqual(validateAuth({ firstName: '', lastName: '', email: 'anna@example.test', password: 'legacy' }, false), {})
  assert.ok(validateAuth({ firstName: '', lastName: '', email: 'anna@example.test', password: '' }, false).password)
})
