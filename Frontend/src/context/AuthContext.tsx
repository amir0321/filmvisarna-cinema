import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMe } from '../api/auth'
import { clearAuthToken, getAuthToken } from '../api/client'
import { AuthContext } from '../hooks/useAuth'
import type { User } from '../types/user'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(() => Boolean(getAuthToken()))

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
      setUser(currentUser)
    } catch {
      clearAuthToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      return
    }

    let isCancelled = false

    getMe()
      .then((currentUser) => {
        if (!isCancelled) {
          setUser(currentUser)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          clearAuthToken()
          setUser(null)
          setLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const logout = useCallback(() => {
    clearAuthToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      logout,
      refreshUser,
    }),
    [user, loading, logout, refreshUser],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export default AuthProvider
