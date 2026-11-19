import { useState, type FormEvent } from 'react'
import { useTranslation } from '../../context/LocaleContext'
import { ApiError } from '../../api/client'
import { getAdminBookings, checkInBooking, lookupBookingByReference } from '../../api/adminBookings'
import type { Booking } from '../../types/booking'

const REFERENCE = /^FV-[A-Z0-9]{5}$/

interface QuickCheckInProps {
  onCheckedIn?: () => void
}

export default function QuickCheckIn({ onCheckedIn }: QuickCheckInProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [message, setMessage] = useState<string | null>(null)

    async function checkInFound(found: Booking) {
    setBooking(found)
    if (found.isCheckedIn) return setMessage(t('admin.bookings.checkin.already'))
    if (found.status === 'cancelled') return setMessage(t('admin.bookings.checkin.cancelled'))
    if (!found.isPaid) return setMessage(t('admin.bookings.checkin.payFirst'))
    const result = await checkInBooking(found.id)
    setBooking(result.booking)
      onCheckedIn?.()
    setMessage(t('admin.bookings.checkin.done', { ref: result.booking.bookingRef }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = query.trim()
    if (!value || busy) return
    setBusy(true)
    setBooking(null)
    setMessage(null)
    try {
      if (REFERENCE.test(value.toUpperCase())) {
       await checkInFound(await lookupBookingByReference(value.toUpperCase()))
      } else {
        const found = await getAdminBookings({ search: value })
        if (found.length === 0) setMessage(t('admin.bookings.checkin.notFound'))
        else if (found.length > 1) setMessage(t('admin.bookings.checkin.many'))
        else await checkInFound(found[0])
      }
    } catch (err) {
      const notFound = err instanceof ApiError && err.status === 404
      setMessage(t(notFound ? 'admin.bookings.checkin.notFound' : 'admin.bookings.checkin.error'))
    } finally {
      setBusy(false)
    }
  }

  const statusKey = booking
    ? booking.status === 'confirmed'
      ? 'paid'
      : booking.status
    : null

  return (
    <section className="fv-checkin" aria-labelledby="fv-checkin-title">
      <h2 id="fv-checkin-title" className="fv-checkin__title">{t('admin.bookings.checkin.title')}</h2>
      <form className="fv-checkin__form" onSubmit={handleSubmit}>
        <div className="fv-checkin__field">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('admin.bookings.checkin.placeholder')}
            aria-label={t('admin.bookings.checkin.title')}
          />
        </div>
        <button type="submit" className="btn btn-danger fv-checkin__button" disabled={busy}>
          <i className="bi bi-check-lg" aria-hidden="true" /> {t('admin.bookings.checkin.button')}
        </button>
      </form>

      <div role="status" aria-live="polite">
        {message && <p className="fv-checkin__message">{message}</p>}
        {booking && statusKey && (
          <div className="fv-checkin__result">
            <strong>{booking.bookingRef}</strong>
            <span>{booking.email}</span>
            <span>{booking.movieTitle}</span>
            <span>{t(`admin.bookings.status.${statusKey}`)}</span>
            {booking.isCheckedIn && <span>{t('admin.bookings.status.checkedIn')}</span>}
          </div>
        )}
      </div>
    </section>
  )
}