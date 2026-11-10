import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getMe } from '../api/auth'
import { AUTH_TOKEN_KEY, AUTH_UNAUTHORIZED_EVENT, clearAuthToken, getAuthToken, setAuthToken } from '../api/client'
import { AuthContext } from '../hooks/useAuth'
import type { AuthResponse, User } from '../types/user'
import { getAuthRole, getRoleLabel, getTokenExpiresAt, isTokenValid } from '../utils/authSession'

interface AuthProviderProps {
  children: ReactNode
  onUnauthorized: () => void
}

interface Session {
  token: string | null
  user: User | null
  loading: boolean
  verificationDeliveryFailed: boolean
}

const EMPTY_SESSION: Session = { token: null, user: null, loading: false, verificationDeliveryFailed: false }

export function AuthProvider({ children, onUnauthorized }: AuthProviderProps) {
  const [session, setSessionState] = useState<Session>(() => {
    const token = getAuthToken()
    return { ...EMPTY_SESSION, token, loading: Boolean(token) }
  })
  const activeToken = useRef<string | null>(null)
  const request = useRef<AbortController | null>(null)

  const logout = useCallback(() => {
    request.current?.abort()
    activeToken.current = null
    clearAuthToken()
    setSessionState(EMPTY_SESSION)
  }, [])

  const expireSession = useCallback(() => {
    logout()
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
  }, [logout])

  const loadUser = useCallback(async (token: string) => {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    activeToken.current = token
    try {
      const user = await getMe(controller.signal)
      if (controller.signal.aborted || getAuthToken() !== token) return
      if (!isTokenValid(token)) {
        expireSession()
        return
      }
      setSessionState(previous => ({ ...previous, token, user }))
    } finally {
      if (!controller.signal.aborted && getAuthToken() === token) {
        setSessionState(previous => ({ ...previous, loading: false }))
      }
    }
  }, [expireSession])

  const restoreSession = useCallback(async (token: string | null) => {
    if (token === null) {
      logout()
      return
    }
    if (!isTokenValid(token)) {
      expireSession()
      return
    }
    setSessionState(previous => ({
      ...EMPTY_SESSION,
      token,
      user: previous.token === token ? previous.user : null,
      verificationDeliveryFailed: previous.token === token && previous.verificationDeliveryFailed,
      loading: true,
    }))
    await loadUser(token)
  }, [expireSession, loadUser, logout])

  const refreshUser = useCallback(() => restoreSession(getAuthToken()), [restoreSession])

  const syncSession = useCallback(() => {
    const token = getAuthToken()
    if (token !== null && !isTokenValid(token)) {
      expireSession()
    } else if (token !== activeToken.current) {
      void restoreSession(token).catch(() => {
        // API authentication failures dispatch the global session event.
      })
    }
  }, [expireSession, restoreSession])

  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
      onUnauthorized()
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea && event.storageArea !== window.localStorage) return
      if (event.key === AUTH_TOKEN_KEY || event.key === null) syncSession()
    }
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    window.addEventListener('focus', syncSession)
    document.addEventListener('visibilitychange', syncSession)
    window.addEventListener('storage', handleStorage)
    const token = getAuthToken()
    if (token !== null && isTokenValid(token)) {
      // Initial state already represents a pending restoration.
      void loadUser(token).catch(() => {
        // Leave the visitor unauthenticated if the profile cannot be restored.
      })
    } else if (token !== null) {
      clearAuthToken()
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
    }
    return () => {
      request.current?.abort()
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
      window.removeEventListener('focus', syncSession)
      document.removeEventListener('visibilitychange', syncSession)
      window.removeEventListener('storage', handleStorage)
    }
  }, [loadUser, logout, onUnauthorized, syncSession])

  useEffect(() => {
    const token = session.token
    if (!token) return
    let timer: number
    const checkExpiry = () => {
      syncSession()
      if (getAuthToken() !== token) return
      const expiresAt = getTokenExpiresAt(token)
      if (expiresAt === null || expiresAt <= Date.now()) return
      // setTimeout overflows above a signed 32-bit delay. Recheck longer sessions.
      timer = window.setTimeout(checkExpiry, Math.min(expiresAt - Date.now(), 2_147_483_647))
    }
    checkExpiry()
    return () => window.clearTimeout(timer)
  }, [session.token, syncSession])

  const setSession = useCallback((response: AuthResponse) => {
    request.current?.abort()
    if (!isTokenValid(response.token)) {
      expireSession()
      return
    }
    setAuthToken(response.token)
    activeToken.current = response.token
    setSessionState({
      token: response.token,
      user: response.user,
      verificationDeliveryFailed: response.verificationEmailSent === false,
      loading: false,
    })
  }, [expireSession])

  const role = getAuthRole(session.user, session.token)
  const value = useMemo(() => ({
    ...session,
    role,
    roleLabel: getRoleLabel(role),
    isAuthenticated: role !== 'guest',
    isAdmin: role === 'admin',
    logout,
    refreshUser,
    setSession,
  }), [session, role, logout, refreshUser, setSession])
  return <AuthContext value={value}>{children}</AuthContext>
}

export default AuthProvider
