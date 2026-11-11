import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getMe, logoutSession } from '../api/auth'
import { advanceSessionRevision, ApiError, AUTH_UNAUTHORIZED_EVENT } from '../api/client'
import { AuthContext } from '../hooks/useAuth'
import type { AuthResponse, User } from '../types/user'
import { getAuthRole, getRoleLabel } from '../utils/authSession'

interface AuthProviderProps {
  children: ReactNode
  onUnauthorized: () => void
}
interface Session {
  user: User | null
  expiresAt: number | null
  loading: boolean
  verificationDeliveryFailed: boolean
}
const EMPTY_SESSION: Session = { user: null, expiresAt: null, loading: false, verificationDeliveryFailed: false }

export function AuthProvider({ children, onUnauthorized }: AuthProviderProps) {
  const [session, setSessionState] = useState<Session>({ ...EMPTY_SESSION, loading: true })
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const request = useRef<AbortController | null>(null)
  const logoutRequest = useRef<Promise<void> | null>(null)
  const authenticated = useRef(false)
  const channel = useRef<BroadcastChannel | null>(null)

  const clearSession = useCallback(() => {
    request.current?.abort()
    authenticated.current = false
    advanceSessionRevision()
    setSessionState(EMPTY_SESSION)
  }, [])

  const refreshUser = useCallback(async () => {
    if (logoutRequest.current) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    try {
      const response = await getMe(controller.signal)
      if (controller.signal.aborted) return
      authenticated.current = true
      setSessionState(previous => ({ ...previous, ...response, loading: false }))
    } catch (error) {
      if (controller.signal.aborted) return
      if (error instanceof ApiError && error.status === 401) {
        const wasAuthenticated = authenticated.current
        clearSession()
        if (wasAuthenticated) onUnauthorized()
      } else {
        setSessionState(previous => ({ ...previous, loading: false }))
        throw error
      }
    }
  }, [clearSession, onUnauthorized])

  const logout = useCallback((): Promise<void> => {
    if (logoutRequest.current) return logoutRequest.current
    request.current?.abort()
    setLoggingOut(true)
    setLogoutError(null)
    const pending = (async () => {
      try {
        await logoutSession()
        clearSession()
        channel.current?.postMessage('changed')
      } catch (error) {
        setLogoutError('Kunde inte logga ut. Kontrollera anslutningen och försök igen.')
        throw error
      } finally {
        logoutRequest.current = null
        setLoggingOut(false)
      }
    })()
    logoutRequest.current = pending
    return pending
  }, [clearSession])

  useEffect(() => {
    // Remove legacy credentials once; sessions are now held only in HttpOnly cookies.
    try { localStorage.removeItem('token') } catch { /* Storage may be disabled. */ }
    const syncSession = () => {
      if (document.visibilityState !== 'hidden') void refreshUser().catch(() => {})
    }
    const handleUnauthorized = () => { clearSession(); onUnauthorized() }
    if (typeof BroadcastChannel !== 'undefined') {
      const currentChannel = new BroadcastChannel('fv:session')
      channel.current = currentChannel
      currentChannel.onmessage = () => {
        // Ignore late responses issued before another tab changed the shared cookie.
        advanceSessionRevision()
        syncSession()
      }
    }
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    window.addEventListener('focus', syncSession)
    document.addEventListener('visibilitychange', syncSession)
    const initialSync = window.setTimeout(syncSession, 0)
    return () => {
      window.clearTimeout(initialSync)
      request.current?.abort()
      channel.current?.close()
      channel.current = null
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
      window.removeEventListener('focus', syncSession)
      document.removeEventListener('visibilitychange', syncSession)
    }
  }, [clearSession, onUnauthorized, refreshUser])

  useEffect(() => {
    if (session.expiresAt === null) return
    let timer: number
    const checkExpiry = () => {
      const remaining = session.expiresAt! - Date.now()
      if (remaining <= 0) { clearSession(); onUnauthorized(); return }
      timer = window.setTimeout(checkExpiry, Math.min(remaining, 2_147_483_647))
    }
    checkExpiry()
    return () => window.clearTimeout(timer)
  }, [session.expiresAt, clearSession, onUnauthorized])

  const setSession = useCallback((response: AuthResponse) => {
    request.current?.abort()
    advanceSessionRevision()
    authenticated.current = true
    setLogoutError(null)
    setSessionState({ ...response, verificationDeliveryFailed: response.verificationEmailSent === false, loading: false })
    channel.current?.postMessage('changed')
  }, [])

  const role = getAuthRole(session.user)
  const value = useMemo(() => ({
    ...session, role, roleLabel: getRoleLabel(role), isAuthenticated: role !== 'guest', isAdmin: role === 'admin',
    logout, loggingOut, logoutError, refreshUser, setSession,
  }), [session, role, logout, loggingOut, logoutError, refreshUser, setSession])
  return <AuthContext value={value}>{children}</AuthContext>
}
export default AuthProvider
