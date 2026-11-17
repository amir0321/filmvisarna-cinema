import { useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useBookings } from '../hooks/useBookings'
import { useTranslation } from '../context/LocaleContext'
import { sv } from '../i18n/sv'
import type { Booking } from '../types/booking'
import { canCancelBooking } from '../utils/bookings'
import { removeConfirmation } from '../utils/confirmationStorage'
import CancelBookingModal from './CancelBookingModal'

interface MemberCancelBookingModalProps {
  booking: Booking
  posterUrl?: string | null
  onClose: () => void
  onCancelled: () => void
}

export default function MemberCancelBookingModal({ booking, posterUrl, onClose, onCancelled }: MemberCancelBookingModalProps) {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const { bookings, currentTime, cancelBooking } = useBookings()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pending = useRef(false)
  const ownedBooking = !loading && user
    ? bookings.find(item => item.id === booking.id && item.bookingRef === booking.bookingRef)
    : undefined

  async function confirm() {
    if (pending.current || !ownedBooking) return
    if (!canCancelBooking(ownedBooking)) {
      setError(sv['cancellation.deadline'])
      return
    }
    pending.current = true
    setIsSubmitting(true)
    setError(null)
    try {
      await cancelBooking(ownedBooking.id)
      removeConfirmation(ownedBooking.bookingRef)
      onCancelled()
    } catch (error) {
      setError(error instanceof Error ? error.message : sv['member.cancelError'])
    } finally {
      pending.current = false
      setIsSubmitting(false)
    }
  }

  if (!ownedBooking) return null

  return <CancelBookingModal isOpen booking={{
    bookingRef: ownedBooking.bookingRef,
    movieTitle: ownedBooking.movieTitle ?? t('ticket.unknownMovie'),
    cinemaName: ownedBooking.cinemaName ?? t('ticket.unknownCinema'),
    screeningStartsAt: ownedBooking.screeningStartsAt ?? '',
    posterUrl,
    seats: ownedBooking.tickets.map(ticket => ticket.row && ticket.seatNumber != null
      ? t('seatMap.seat', { row: ticket.row, seat: ticket.seatNumber })
      : t('seatMap.seatId', { id: ticket.seatId })),
  }} canCancel={canCancelBooking(ownedBooking, currentTime)} isSubmitting={isSubmitting} error={error}
    onConfirm={confirm} onClose={() => { if (!pending.current) onClose() }} />
}
