import type { Booking } from '../types/booking'

export function getBookingState(
  booking: Pick<Booking, 'status' | 'screeningStartsAt' | 'screeningEndsAt' | 'isPaid'>,
  now = Date.now(),
): 'upcoming' | 'ongoing' | 'past' | 'cancelled' | 'expired' | 'unknown' {
  if (booking.status === 'cancelled') return 'cancelled'
  if (booking.status === 'expired') return 'expired'

  const startsAt = new Date(booking.screeningStartsAt ?? '').getTime()
  if (!Number.isFinite(startsAt)) return 'unknown'
  if (!booking.isPaid && startsAt - now <= 60 * 60_000) return 'expired'
  if (startsAt > now) return 'upcoming'

  const endsAt = new Date(booking.screeningEndsAt ?? '').getTime()
  if (!Number.isFinite(endsAt) || endsAt <= startsAt) return 'unknown'
  if (endsAt > now) return 'ongoing'
  return booking.isPaid ? 'past' : 'expired'
}

export function canCancelBooking(
  booking: Pick<Booking, 'status' | 'screeningStartsAt' | 'isPaid'>,
  now = Date.now(),
): boolean {
  if (booking.status !== 'confirmed' && booking.status !== 'reserved') return false
  const remaining = new Date(booking.screeningStartsAt ?? '').getTime() - now
  return booking.isPaid ? remaining >= 2 * 60 * 60 * 1000 : remaining > 60 * 60_000
}
