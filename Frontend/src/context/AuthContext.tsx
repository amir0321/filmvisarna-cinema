import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMe } from '../api/auth'
import { AUTH_UNAUTHORIZED_EVENT, clearAuthToken, getAuthToken, setAuthToken } from '../api/client'
import { AuthContext } from '../hooks/useAuth'
import type { AuthResponse, User } from '../types/user'

interface AuthProviderProps {
  children: ReactNode
  onUnauthorized: () => void
}

export function AuthProvider({ children, onUnauthorized }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => Boolean(getAuthToken()))
  const [verificationDeliveryFailed, setVerificationDeliveryFailed] = useState(false)

  const refreshUser = useCallback(async () => {
    const token = getAuthToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const currentUser = await getMe()
      if (getAuthToken() === token) setUser(currentUser)
    } finally {
      if (getAuthToken() === token) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const token = getAuthToken()
    if (token) {
      getMe(controller.signal).then(currentUser => {
        if (!controller.signal.aborted && getAuthToken() === token) setUser(currentUser)
      }).catch(() => {
        // Authentication failures are handled by the global session event.
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    }
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
      setVerificationDeliveryFailed(false)
      setLoading(false)
      onUnauthorized()
    }
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [onUnauthorized])

  const setSession = useCallback((response: AuthResponse) => {
    setAuthToken(response.token)
    setUser(response.user)
    setVerificationDeliveryFailed(response.verificationEmailSent === false)
    setLoading(false)
  }, [])

  const logout = useCallback(() => {
    clearAuthToken()
    setUser(null)
    setVerificationDeliveryFailed(false)
    setLoading(false)
  }, [])

  const value = useMemo(() => ({ user, loading, verificationDeliveryFailed, logout, refreshUser, setSession }),
    [user, loading, verificationDeliveryFailed, logout, refreshUser, setSession])
  return <AuthContext value={value}>{children}</AuthContext>
}

export default AuthProvider
