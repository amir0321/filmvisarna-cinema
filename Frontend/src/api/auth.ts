import apiClient, { ApiError } from './client'
import type { AuthResponse, User } from '../types/user'

export async function getMe(signal?: AbortSignal): Promise<User> {
  const response = await apiClient.get<User | { user: User }>('/auth/me', { signal })
  if (response && typeof response === 'object' && 'user' in response) {
    return response.user
  }
  return response as User
}

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload extends LoginPayload { firstName: string; lastName: string; phone?: string }
export type AuthField = 'email' | 'password' | 'firstName' | 'lastName'
export type AuthFieldErrors = Partial<Record<AuthField, string>>

export function login(payload: LoginPayload, signal?: AbortSignal): Promise<AuthResponse> {
  return apiClient.post('/auth/login', payload, { signal })
}

export function register(payload: RegisterPayload, signal?: AbortSignal): Promise<AuthResponse> {
  return apiClient.post('/auth/register', payload, { signal })
}

interface AuthActionResponse { success: boolean; message: string }
export interface AuthLinkResponse extends AuthActionResponse { email: string }

export function forgotPassword(email: string, signal?: AbortSignal): Promise<AuthActionResponse> {
  return apiClient.post('/auth/forgot-password', { email }, { signal })
}

export function resetPassword(token: string, password: string, signal?: AbortSignal): Promise<AuthLinkResponse> {
  return apiClient.post('/auth/reset-password', { token, password }, { signal })
}

export function verifyEmail(token: string, signal?: AbortSignal): Promise<AuthLinkResponse> {
  return apiClient.post('/auth/verify-email', { token }, { signal })
}

export function resendVerification(signal?: AbortSignal): Promise<AuthActionResponse> {
  return apiClient.post('/auth/resend-verification', {}, { signal })
}

export function extractAuthFieldErrors(error: unknown): AuthFieldErrors {
  const errors: AuthFieldErrors = {}
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== 'object' ||
      !('details' in error.data) || !Array.isArray(error.data.details)) return errors
  for (const detail of error.data.details) {
    if (typeof detail !== 'string') continue
    const match = /^(email|password|firstName|lastName):\s*(.+)$/.exec(detail)
    if (!match) continue
    const field = match[1] as AuthField
    // Zod's default messages can be English; keep form feedback in Swedish.
    errors[field] = /^(Too |Invalid |Required|Expected )/.test(match[2])
      ? {
          email: 'Ange en giltig e-postadress med högst 200 tecken.',
          password: 'Kontrollera lösenordets längd (högst 72 tecken).',
          firstName: 'Ange ett förnamn med högst 100 tecken.',
          lastName: 'Ange ett efternamn med högst 100 tecken.',
        }[field]
      : match[2]
  }
  return errors
}
