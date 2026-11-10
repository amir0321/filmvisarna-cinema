import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getSafeRedirectPath, isAuthPath } from '../src/utils/links.ts'
import { validateAuth, validateNewPassword } from '../src/utils/authValidation.ts'
import { getAuthRole, getRoleLabel, getTokenExpiresAt, isTokenValid } from '../src/utils/authSession.ts'
import { getPostLoginPath, getProtectedRouteAccess } from '../src/utils/routeAccess.ts'
import type { User } from '../src/types/user.ts'

function jwt(payload: unknown, header: unknown = { alg: 'HS256', typ: 'JWT' }): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode(header)}.${encode(payload)}.c2lnbmF0dXJl`
}

test('JWT expiry uses seconds and expires exactly at exp, including fractional seconds', () => {
  const token = jwt({ exp: 1_800_000_000.5, name: 'Åsa 🎬' })
  assert.equal(getTokenExpiresAt(token), 1_800_000_000_500)
  assert.equal(isTokenValid(token, 1_800_000_000_499), true)
  assert.equal(isTokenValid(token, 1_800_000_000_500), false)
  assert.equal(isTokenValid(token, 1_800_000_000_501), false)
})

test('invalid JWTs and absent or invalid exp claims cannot restore a session', () => {
  for (const token of [null, '', 'invalid', 'a.b.c', jwt(null), jwt([]), jwt({}),
    jwt({ exp: '1800000000' }), jwt({ exp: 0 }), jwt({ exp: -1 }),
    jwt({ exp: null }), jwt({ exp: 1e308 }), jwt({ exp: 1_800_000_000 }, { alg: 'none' }),
    jwt({ exp: 1_800_000_000 }, null), jwt({ exp: 1_800_000_000 }) + '.extra',
    jwt({ exp: 1_800_000_000 }).replace(/\.[^.]+$/, '.a'),
    'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOkluZmluaXR5fQ.c2ln']) {
    assert.equal(getTokenExpiresAt(token), null, String(token))
    assert.equal(isTokenValid(token, 0), false, String(token))
  }
  assert.equal(isTokenValid(jwt({ exp: 1 }), 1001), false)
})

test('session roles and Swedish labels require both a token and a user', () => {
  const user: User = { id: 1, email: 'anna@example.test', role: 'user' }
  const admin: User = { ...user, role: 'admin' }
  const token = jwt({ exp: 1_800_000_000 })
  for (const [account, sessionToken, role, label] of [
    [null, null, 'guest', 'Gäst'], [null, token, 'guest', 'Gäst'],
    [user, null, 'guest', 'Gäst'], [admin, null, 'guest', 'Gäst'],
    [user, token, 'user', 'Medlem'], [admin, token, 'admin', 'Admin'],
  ] as const) {
    assert.equal(getAuthRole(account, sessionToken), role)
    assert.equal(getRoleLabel(getAuthRole(account, sessionToken)), label)
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
