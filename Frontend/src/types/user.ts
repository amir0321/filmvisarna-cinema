export type UserRole = 'user' | 'admin'

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
}
