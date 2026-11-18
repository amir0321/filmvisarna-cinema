import type { BookingCreatedResult } from '../types/booking'
import { saveConfirmation } from './confirmationStorage'

export function saveCreatedBooking(result: BookingCreatedResult, posterUrl: string | null = null): void {
  const booking = result.booking
  const labels: Record<string, string> = { adult: 'Vuxen', child: 'Barn', elder: 'Pensionär' }
  const groups = new Map<string, { label: string; quantity: number; price: number }>()
  for (const ticket of booking.tickets) {
    const key = ticket.type ?? 'adult'
    const group = groups.get(key) ?? { label: labels[key] ?? key, quantity: 0, price: ticket.price ?? 0 }
    group.quantity += 1
    groups.set(key, group)
  }
  const tickets = [...groups.values()]
  const kiosk = (booking.items ?? []).map(item => ({ name: item.name ?? '', quantity: item.quantity, price: item.price ?? 0 }))
  saveConfirmation({
    bookingRef: result.bookingRef, movieTitle: booking.movieTitle ?? '', posterUrl,
    cinema: booking.cinemaName ?? '', startsAt: booking.screeningStartsAt ?? '', endsAt: booking.screeningEndsAt ?? '',
    seats: booking.tickets.map(ticket => `Rad ${ticket.row}, Stol ${ticket.seatNumber}`), tickets, kiosk,
    ticketTotal: tickets.reduce((total, ticket) => total + ticket.quantity * ticket.price, 0),
    kioskTotal: kiosk.reduce((total, item) => total + item.quantity * item.price, 0),
    total: booking.totalPrice, email: booking.email, cancelToken: result.cancelToken,
  })
}
