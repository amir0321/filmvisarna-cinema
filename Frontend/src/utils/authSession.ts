import type { AuthRole, RoleLabel, User } from '../types/user'

function decodeJwtPart(part: string): unknown {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
  const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0))
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
}

// Only checks format and expiry. The API verifies the JWT signature and permissions.
export function getTokenExpiresAt(token: string | null): number | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part) || part.length % 4 === 1)) return null
  try {
    const header = decodeJwtPart(parts[0])
    if (!header || typeof header !== 'object' || !('alg' in header) ||
        typeof header.alg !== 'string' || !header.alg || header.alg.toLowerCase() === 'none') return null
    const payload = decodeJwtPart(parts[1])
    if (!payload || typeof payload !== 'object' || !('exp' in payload) ||
        typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return null
    const expiresAt = payload.exp * 1000
    return Number.isFinite(expiresAt) && expiresAt > 0 ? expiresAt : null
  } catch {
    return null
  }
}

export function isTokenValid(token: string | null, now = Date.now()): boolean {
  const expiresAt = getTokenExpiresAt(token)
  return expiresAt !== null && expiresAt > now
}

export function getAuthRole(user: User | null, token: string | null): AuthRole {
  if (!user || !token) return 'guest'
  return user.role === 'admin' ? 'admin' : 'user'
}

export function getRoleLabel(role: AuthRole): RoleLabel {
  const labels: Record<AuthRole, RoleLabel> = { guest: 'Gäst', user: 'Medlem', admin: 'Admin' }
  return labels[role]
}
