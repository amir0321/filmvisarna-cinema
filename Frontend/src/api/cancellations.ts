import apiClient, { ApiError } from './client.ts'
import type {
  CancelBookingResponse,
  CancelPreviewResult,
} from '../types/booking.ts'

export type CancelPageState =
  | 'loading'
  | 'confirm'
  | 'cancelling'
  | 'success'
  | 'invalid_token'
  | 'expired'
  | 'too_late'
  | 'already_cancelled'
  | 'error'

export function mapCancelErrorToState(err: unknown): CancelPageState {
  if (err instanceof ApiError) {
    const msg = (err.message || '').toLowerCase()

    if (msg.includes('redan avbokad')) {
      return 'already_cancelled'
    }
    if (msg.includes('redan har startat') || msg.includes('passerats')) {
      return 'expired'
    }
    if (msg.includes('mindre än') || msg.includes('timmar innan')) {
      return 'too_late'
    }
    if (
      err.status === 404 ||
      err.status === 403 ||
      msg.includes('ogiltig') ||
      msg.includes('hittades inte') ||
      msg.includes('kunde inte hittas') ||
      msg.includes('token krävs')
    ) {
      return 'invalid_token'
    }
    return 'error'
  }
  return 'error'
}

export async function getCancelPreview(token: string): Promise<CancelPreviewResult> {
  return apiClient.post<CancelPreviewResult>(
    '/bookings/cancel-preview',
    { token },
    { credentials: 'omit' },
  )
}

export async function cancelByToken(token: string): Promise<CancelBookingResponse> {
  return apiClient.post<CancelBookingResponse>(
    '/bookings/cancel-by-token',
    { token },
    { credentials: 'omit' },
  )
}

export const cancellationService = {
  getCancelPreview,
  cancelByToken,
  mapCancelErrorToState,
}

export default cancellationService
