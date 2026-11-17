import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useBookings } from '../hooks/useBookings'
import { canCancelBooking, getBookingState } from '../utils/bookings'
import MemberCancelBookingModal from '../components/MemberCancelBookingModal'
import { useTranslation } from '../context/LocaleContext'
import { Link, useParams } from 'react-router'
import BookingTicket from '../components/BookingTicket'
import { loadConfirmation } from '../utils/confirmationStorage'

export default function BookingConfirmation() {
  const { t } = useTranslation()
  const { kod } = useParams()
  const { user, loading: authLoading } = useAuth()
  const { bookings, loading: bookingsLoading, currentTime } = useBookings()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelledReference, setCancelledReference] = useState<string | null>(null)
  const ownedBooking = user ? bookings.find(booking => booking.bookingRef === kod) : undefined
  const resolvingOwnership = authLoading || Boolean(user && bookingsLoading)
  const isCancelled = cancelledReference === kod || ownedBooking?.status === 'cancelled'
  const isExpired = ownedBooking ? getBookingState(ownedBooking, currentTime) === 'expired' : false
  const data = kod ? loadConfirmation(kod) : null

  return (
    <section className="fv-ticket">
      <div className="fv-ticket__top">
        <div className="fv-ticket__check" aria-hidden="true">
          <i className={`bi ${isExpired ? 'bi-clock' : 'bi-check-lg'}`} />
        </div>
        <h1>{t(isCancelled ? 'cancellation.successTitle' : isExpired ? 'member.expired' : 'confirmation.thanks')}</h1>
        {isCancelled || isExpired ? <p role="status">{t(isCancelled ? 'member.cancelledFeedback' : 'member.expiredNote')}</p> : <p>
          {t('confirmation.emailPrefix')} <strong>{data?.email || t('confirmation.yourEmail')}</strong>
        </p>}
      </div>

      {!isCancelled && !isExpired && (resolvingOwnership ? <p role="status">{t('booking.wait')}</p> : <>
      {ownedBooking && <p className="small text-secondary px-3" role="status">
        {t(ownedBooking.isPaid ? 'member.paidNote' : 'member.unpaidNote')}
      </p>}
      <BookingTicket
        bookingRef={kod ?? ''}
        data={data}
        totalLabel={ownedBooking?.isPaid ? t('ticket.paid') : undefined}
        onCancel={ownedBooking ? () => setCancelOpen(true) : undefined}
        canCancel={ownedBooking ? canCancelBooking(ownedBooking, currentTime) : true}
      /></>)}
      {cancelOpen && ownedBooking && <MemberCancelBookingModal
        key={ownedBooking.id}
        booking={ownedBooking}
        posterUrl={data?.posterUrl}
        onClose={() => setCancelOpen(false)}
        onCancelled={() => {
          setCancelOpen(false)
          setCancelledReference(ownedBooking.bookingRef)
        }}
      />}

      <div className="fv-ticket__footer">
        <Link to="/" className="fv-ticket__home">
          {t('notFound.backHome')}
        </Link>
      </div>
    </section>
  )
}
