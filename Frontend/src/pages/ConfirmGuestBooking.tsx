import { translateKioskName, translateApiError } from '../i18n/mappers'
import { useTranslation } from '../context/LocaleContext'
import { sv } from '../i18n/sv'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import AuthActionCard from '../components/auth/AuthActionCard'
import SeatMap from '../components/SeatMap'
import { ApiError } from '../api/client'
import { confirmGuestBooking, previewGuestBooking } from '../api/bookings'
import { getScreeningSeats } from '../api/screeningSeats'
import { useAuthActionToken } from '../hooks/useAuthActionToken'
import type { GuestBookingPreview } from '../types/booking'
import type { SeatsResponse } from '../types/screeningSeat'
import { formatDateLong, formatTime, toCinemaIsoDate } from '../utils/date'
import { formatSek } from '../utils/price'
import { saveCreatedBooking } from '../utils/createdBooking'
import ReservationWarningNotice from '../components/ReservationWarningNotice'

export default function ConfirmGuestBooking() {
  const { t, locale } = useTranslation()
  const token = useAuthActionToken()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<GuestBookingPreview | null>(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [seats, setSeats] = useState<SeatsResponse | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [currentTime, setCurrentTime] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const reservationBlocked = Boolean(preview?.reservationStatus.blockedUntil && Date.parse(preview.reservationStatus.blockedUntil) > currentTime)
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    // Previewing a link never confirms a booking or consumes its token.
    previewGuestBooking(token, controller.signal).then(result => {
      if (controller.signal.aborted) return
      setPreview(result)
      setSelectedIds(result.tickets.map(ticket => ticket.seatId))
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setError(error instanceof ApiError ? error.message : sv['guest.previewError'])
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, revision])

  async function confirm() {
    if (!preview || reservationBlocked || request.current || selectedIds.length !== preview.tickets.length) return
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    setError('')
    try {
      const created = await confirmGuestBooking(token, selectedIds, controller.signal)
      if (controller.signal.aborted) return
      saveCreatedBooking(created, preview.screening.posterUrl)
      void navigate(`/bekraftelse/${created.bookingRef}`, { replace: true })
    } catch (error) {
      if (controller.signal.aborted) return
      setError(error instanceof ApiError ? error.message : sv['guest.confirmError'])
      if (error instanceof ApiError && error.status === 409) {
        try {
          const updated = await getScreeningSeats(preview.screening.id)
          if (controller.signal.aborted) return
          setSeats(updated)
          setSelectedIds(current => current.filter(id => updated.seats.some(seat => seat.id === id && seat.status === 'available')))
        } catch { /* Keep the original error and allow another confirmation attempt. */ }
      }
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(false) }
    }
  }

  return <AuthActionCard title={t('guest.title')} description={t('guest.description')}>
    {!token ? <p className="fv-auth-error" role="alert">{t('guest.missingLink')}</p>
      : loading ? <p role="status">{t('guest.loading')}</p>
        : <>
          {error && <p className="fv-auth-error" role="alert">{translateApiError(error, locale)}</p>}
          {!preview && <button type="button" className="fv-auth-submit" onClick={() => {
            setError(''); setLoading(true); setRevision(value => value + 1)
          }}>{t('common.retry')}</button>}
          {preview && <>
            <ReservationWarningNotice status={preview.reservationStatus} currentTime={currentTime} />
            <h2 className="h5">{preview.screening.movieTitle}</h2>
            <p>{preview.screening.cinema} · {t('common.dateTime', { date: formatDateLong(toCinemaIsoDate(preview.screening.startsAt), locale), time: formatTime(preview.screening.startsAt, locale) })}</p>
            <p>{t(preview.tickets.length === 1 ? 'booking.ticketCountOne' : 'booking.ticketCountMany', { count: preview.tickets.length })} · {formatSek(preview.totalPrice, locale)}</p>
            <p>{preview.email}</p>
            {!seats && <p>{preview.tickets.map(ticket => t('seatMap.seat', { row: ticket.row, seat: ticket.number })).join(' · ')}</p>}
            {preview.items.length > 0 && <ul>{preview.items.map(item => <li key={item.itemId}>{item.quantity} × {translateKioskName(item.name, locale)}</li>)}</ul>}
            <p>{t('guest.expires', { time: formatTime(preview.expiresAt, locale) })}</p>
            <p className="small text-secondary">{t('reservationWarnings.bookingNotice')}</p>
            {seats && <div>
              <p>{t('guest.chooseSeats', { count: preview.tickets.length })}</p>
              <SeatMap seats={seats.seats} selectedIds={selectedIds} onToggle={id => {
                if (pending || !seats.seats.some(seat => seat.id === id && seat.status === 'available')) return
                setSelectedIds(current => current.includes(id) ? current.filter(value => value !== id)
                  : [...current.slice(0, preview.tickets.length - 1), id])
              }} />
            </div>}
            <button type="button" className="fv-auth-submit" disabled={reservationBlocked || pending || selectedIds.length !== preview.tickets.length} onClick={() => void confirm()}>
              {pending ? t('guest.confirming') : t('guest.confirm')}
            </button>
          </>}
        </>}
    <p className="fv-auth-footer"><Link to="/filmer">{t('guest.backToMovies')}</Link></p>
  </AuthActionCard>
}
