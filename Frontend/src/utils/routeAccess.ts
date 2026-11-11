import type { AuthRole } from '../types/user'
import { getSafeRedirectPath } from './links.ts'

export type RouteAccess =
  | { status: 'loading' | 'allowed' }
  | { status: 'redirect'; to: string }

export function getProtectedRouteAccess({ loading, role, path, requireAdmin = false }: {
  loading: boolean
  role: AuthRole
  path: string
  requireAdmin?: boolean
}): RouteAccess {
  if (loading) return { status: 'loading' }
  if (role === 'guest') {
    return { status: 'redirect', to: `/logga-in?redirect=${encodeURIComponent(getSafeRedirectPath(path))}` }
  }
  if (requireAdmin && role !== 'admin') return { status: 'redirect', to: '/' }
  return { status: 'allowed' }
}

export function getPostLoginPath(target: string | null, role: AuthRole): string {
  const path = getSafeRedirectPath(target)
  // Check normalized, decoded paths too, using the same limit as getSafeRedirectPath.
  let decoded = path
  for (let i = 0; i < 5; i++) {
    const pathname = new URL(decoded, 'https://filmvisarna.invalid').pathname
    if (role !== 'admin' && /^\/admin(?:\/|$)/i.test(pathname)) return '/'
    const next = decodeURIComponent(decoded)
    if (next === decoded) break
    decoded = next
  }
  return path
}
