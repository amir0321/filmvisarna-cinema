import apiClient from './client'
import type { User } from '../types/user'

export async function getMe(): Promise<User> {
  const response = await apiClient.get<User | { user: User }>('/auth/me')
  if (response && typeof response === 'object' && 'user' in response) {
    return response.user
  }
  return response as User
}
