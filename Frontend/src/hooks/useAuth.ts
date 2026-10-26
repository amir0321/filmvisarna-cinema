import { createContext, use } from 'react'
import type { User } from '../types/user'

export interface AuthContextValue {
  user: User | null
  loading: boolean
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const context = use(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function getUserInitials(user: User | null): string {
  if (!user) return 'G'
  const first = user.firstName?.trim()?.[0] ?? ''
  const last = user.lastName?.trim()?.[0] ?? ''
  const combined = `${first}${last}`.toUpperCase()
  if (combined) return combined
  return (user.email?.trim()?.[0] ?? 'A').toUpperCase()
}

export function getUserDisplayName(user: User | null): string {
  if (!user) return 'Gäst'
  const fullName = [user.firstName?.trim(), user.lastName?.trim()].filter(Boolean).join(' ')
  if (fullName) return fullName
  return user.email
}
