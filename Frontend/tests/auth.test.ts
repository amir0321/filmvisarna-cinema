import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getSafeRedirectPath, isAuthPath } from '../src/utils/links.ts'
import { validateAuth, validateNewPassword } from '../src/utils/authValidation.ts'
import { getAuthRole, getRoleLabel } from '../src/utils/authSession.ts'
import { getPostLoginPath, getProtectedRouteAccess } from '../src/utils/routeAccess.ts'
import type { User } from '../src/types/user.ts'

test('session roles use the server-verified user without exposing a token', () => {
  const user: User = { id: 1, email: 'anna@example.test', role: 'user' }
  const admin: User = { ...user, role: 'admin' }
  for (const [account, role, label] of [
    [null, 'guest', 'Gäst'], [user, 'user', 'Medlem'], [admin, 'admin', 'Admin'],
  ] as const) {
    assert.equal(getAuthRole(account), role)
    assert.equal(getRoleLabel(getAuthRole(account)), label)
  }
})

test('route protection waits for session restoration before any redirect or access', () => {
  for (const role of ['guest', 'user', 'admin'] as const) {
    assert.deepEqual(getProtectedRouteAccess({ loading: true, role, path: '/admin/filmer', requireAdmin: true }), { status: 'loading' })
  }
})

test('protected routes preserve the requested query and hash through login', () => {
  for (const path of ['/mina-bokningar?tab=history#biljett', '/profil?tab=sakerhet#losenord', '/admin/filmer?edit=42#formular']) {
    const access = getProtectedRouteAccess({ loading: false, role: 'guest', path })
    assert.equal(access.status, 'redirect')
    if (access.status !== 'redirect') return
    const redirect = new URL(access.to, 'https://filmvisarna.invalid')
    assert.equal(redirect.pathname, '/logga-in')
    assert.equal(redirect.searchParams.get('redirect'), path)
    assert.equal(getPostLoginPath(redirect.searchParams.get('redirect'), 'admin'), path)
  }
  const unsafe = getProtectedRouteAccess({ loading: false, role: 'guest', path: '//example.test' })
  assert.deepEqual(unsafe, { status: 'redirect', to: '/logga-in?redirect=%2F' })
})

test('members can access their pages while only admins can access the admin layout', () => {
  for (const path of ['/mina-bokningar', '/profil']) {
    for (const role of ['user', 'admin'] as const) {
      assert.deepEqual(getProtectedRouteAccess({ loading: false, role, path }), { status: 'allowed' })
    }
  }
  for (const path of ['/admin', '/admin/bokningar', '/admin/filmer', '/admin/visningar', '/admin/salonger']) {
    assert.deepEqual(getProtectedRouteAccess({ loading: false, role: 'user', path, requireAdmin: true }), { status: 'redirect', to: '/' })
    assert.deepEqual(getProtectedRouteAccess({ loading: false, role: 'admin', path, requireAdmin: true }), { status: 'allowed' })
  }
})

test('non-admin login redirects home for admin destinations, including encoded paths', () => {
  for (const path of ['/admin', '/admin?tab=1#top', '/admin/filmer?edit=42#formular', '/%61dmin/filmer', '/%2561dmin/filmer', '/filmer/../admin/filmer']) {
    assert.equal(getPostLoginPath(path, 'user'), '/')
    assert.equal(getPostLoginPath(path, 'admin'), path)
  }
  assert.equal(getPostLoginPath('/mina-bokningar?tab=history#biljett', 'user'), '/mina-bokningar?tab=history#biljett')
  assert.equal(getPostLoginPath('/administration', 'user'), '/administration')
  assert.equal(getPostLoginPath('https://example.test', 'admin'), '/')
  assert.equal(getPostLoginPath('/logga-in?redirect=%2Fadmin', 'admin'), '/')
})

test('redirect preserves the booking path, query and fragment', () => {
  const destination = '/boka/42?seats=1%2C2#sammanfattning'
  assert.equal(getSafeRedirectPath(destination), destination)
  assert.equal(getSafeRedirectPath('/mina-bokningar'), '/mina-bokningar')
})

test('Swedish and English auth paths cannot become redirect loops', () => {
  for (const path of ['/login', '/logga-in', '/register', '/registrera', '/skapa-konto', '/reset-password', '/verify-email', '/bekrafta-gastbokning']) {
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
