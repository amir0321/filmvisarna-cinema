export type UserRole = 'user' | 'admin'
export type AuthRole = 'guest' | UserRole
export type RoleLabel = 'Gäst' | 'Medlem' | 'Admin'

export interface User {
  id: number
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  isVerified?: boolean
  points?: number
  role: UserRole
}

export interface AuthResponse {
  token: string
  user: User
  verificationEmailSent?: boolean
}
