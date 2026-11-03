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
