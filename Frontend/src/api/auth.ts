import apiClient, { ApiError } from './client'
import type { AuthResponse, User } from '../types/user'

export function getMe(signal?: AbortSignal): Promise<AuthResponse> {
  return apiClient.get('/auth/me', { signal, ignoreUnauthorized: true })
}

export function logoutSession(): Promise<{ success: boolean }> {
  return apiClient.post('/auth/logout', {}, { ignoreUnauthorized: true })
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

export interface UpdateProfilePayload {
  firstName: string
  lastName: string
  phone: string | null
}

export interface UpdateProfileResponse {
  success: boolean
  message: string
  user: User
}

export function updateProfile(
  payload: UpdateProfilePayload,
): Promise<UpdateProfileResponse> {
  return apiClient.put('/auth/me', payload)
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  success: boolean
  message: string
}

export function changePassword(
  payload: ChangePasswordPayload,
): Promise<ChangePasswordResponse> {
  return apiClient.post('/auth/change-password', payload)
}

