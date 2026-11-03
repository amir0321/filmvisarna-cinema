import type { Booking } from '../types/booking'

export function getBookingState(
  booking: Pick<Booking, 'status' | 'screeningStartsAt'>,
  now = Date.now(),
): 'upcoming' | 'past' | 'cancelled' | 'unknown' {
  if (booking.status === 'cancelled') return 'cancelled'

  const startsAt = new Date(booking.screeningStartsAt ?? '').getTime()
  if (!Number.isFinite(startsAt)) return 'unknown'

  return startsAt > now ? 'upcoming' : 'past'
}

export function canCancelBooking(
  booking: Pick<Booking, 'status' | 'screeningStartsAt'>,
  now = Date.now(),
): boolean {
  return getBookingState(booking, now) === 'upcoming'
    && new Date(booking.screeningStartsAt ?? '').getTime() - now >= 2 * 60 * 60 * 1000
}
