import apiClient, { ApiError } from './client.ts'
import { notifyBookingsChanged } from '../utils/bookingUpdates.ts'
import type {
  CancelBookingResponse,
  CancelPreviewResult,
} from '../types/booking.ts'

export type CancelErrorState =
  | 'not_found'
  | 'invalid_input'
  | 'rate_limited'
  | 'expired'
  | 'too_late'
  | 'released'
  | 'already_cancelled'
  | 'error'

export type CancelPageState = 'idle' | 'loading' | 'confirm' | 'cancelling' | 'success' | CancelErrorState

export function mapCancelErrorToState(err: unknown): CancelErrorState {
  if (err instanceof ApiError) {
    if (err.status === 429) return 'rate_limited'
    if (err.status === 404) return 'not_found'
    const msg = (err.message || '').toLowerCase()

    if (msg.includes('redan avbokad')) {
      return 'already_cancelled'
    }
    if (msg.includes('reservationen har redan släppts')) return 'released'
    if (msg.includes('redan har startat') || msg.includes('passerats')) {
      return 'expired'
    }
    if (msg.includes('mindre än') || msg.includes('timmar innan')) {
      return 'too_late'
    }
    if (
      msg.includes('ogiltig') ||
      msg.includes('hittades inte') ||
      msg.includes('kunde inte hittas') ||
      msg.includes('valideringsfel')
    ) {
      return 'invalid_input'
    }
    return 'error'
  }
  return 'error'
}

export interface CancellationCredentials {
  bookingRef: string
  email: string
}

export const cancelErrorMessages: Record<CancelErrorState, string> = {
  not_found: 'Vi hittade ingen bokning som matchar angivet bokningsnummer och e-postadress.',
  invalid_input: 'Kontrollera bokningsnumret (FV-XXXXX) och ange en giltig e-postadress.',
  rate_limited: 'För många försök. Vänta 15 minuter och försök igen.',
  expired: 'Visningen har redan startat eller passerat och kan inte avbokas.',
  too_late: 'Det är mindre än 2 timmar kvar till visningen. Det går inte längre att avboka online.',
  released: 'Reservationen har redan släppts och kan inte avbokas.',
  already_cancelled: 'Bokningen är redan avbokad. Du behöver inte göra något mer.',
  error: 'Bokningen kunde inte hanteras just nu. Kontrollera din anslutning och försök igen.',
}

export async function getCancelPreview(credentials: CancellationCredentials): Promise<CancelPreviewResult> {
  return apiClient.post<CancelPreviewResult>(
    '/bookings/cancel-preview',
    credentials,
    { credentials: 'omit' },
  )
}

export async function cancelByToken(credentials: CancellationCredentials): Promise<CancelBookingResponse> {
  const result = await apiClient.post<CancelBookingResponse>(
    '/bookings/cancel-by-token',
    credentials,
    { credentials: 'omit' },
  )
  notifyBookingsChanged()
  return result
}

export const cancellationService = {
  getCancelPreview,
  cancelByToken,
  mapCancelErrorToState,
}

export default cancellationService
