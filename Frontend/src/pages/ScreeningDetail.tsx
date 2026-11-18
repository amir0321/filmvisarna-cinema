import { translateTicketType, translateKioskName, translateApiError, translateApiMessage } from '../i18n/mappers'
import { formatDateLong, formatTime, toCinemaIsoDate } from '../utils/date'
import { useTranslation } from '../context/LocaleContext'
import { sv } from '../i18n/sv'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import SeatMap from '../components/SeatMap'
import type { SeatsResponse } from '../types/screeningSeat'
import QuantityPicker from '../components/QuantityPicker'
import { TICKET_TYPES, type TicketType } from '../constants/prices'
import { formatSek } from '../utils/price'
import { useScreenings } from '../hooks/useScreenings'
import { getScreeningSeats } from '../api/screeningSeats'
import StepIndicator from '../components/StepIndicator'
import { getMovieUrl } from '../utils/links'
import { pickBestSeats } from '../utils/seats'
import { ApiError } from '../api/client'
import { createBooking, requestGuestBooking } from '../api/bookings'
import { getPriceGroups } from '../api/priceGroups'
import { getKioskItems } from '../api/kiosk'
import type { KioskItem } from '../types/kiosk'
import { saveCreatedBooking } from '../utils/createdBooking'
import { validateEmail } from '../utils/authValidation'
import { useAuth, getUserDisplayName } from '../hooks/useAuth'
import { useBookings } from '../hooks/useBookings'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import { limitTicketCounts } from '../utils/bookingAvailability'
import ReservationWarningNotice from '../components/ReservationWarningNotice'

export const hideFromNav = true

export default function ScreeningDetail() {
  const { t, locale } = useTranslation()
  const { id: idParam } = useParams()
  const id = idParam ? Number(idParam) : NaN
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const [pending, setPending] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const [guestMessage, setGuestMessage] = useState('')
  const request = useRef<AbortController | null>(null)
  const submission = useRef<{ payload: string; key: string } | null>(null)
  useEffect(() => () => request.current?.abort(), [])
  const { refresh: refreshBookings, reservationStatus } = useBookings()
  const reservationBlocked = Boolean(reservationStatus?.blockedUntil && Date.parse(reservationStatus.blockedUntil) > currentTime)
  const [data, setData] = useState<SeatsResponse | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    (searchParams.get('seats') ?? '')
      .split(',')
      .map(Number)
      .filter(n => Number.isInteger(n) && n > 0),
  )
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const countFromUrl = (key: string) => {
    const n = Number(searchParams.get(key))
    return Number.isInteger(n) && n > 0 ? n : 0
  }
  const [requestedCounts, setCounts] = useState<Record<TicketType, number>>({
    adult: countFromUrl('adult'),
    senior: countFromUrl('senior'),
    child: countFromUrl('child'),
  })
  const availableSeats = data?.seats.filter(seat => seat.status === 'available').length ?? 0
  const counts = limitTicketCounts(requestedCounts, availableSeats)
  const isSoldOut = data !== null && availableSeats === 0
  const ticketLimit = Math.min(10, availableSeats)
  const { data: screenings } = useScreenings()
  const [nameInput, setName] = useState<string | null>(null)
  const [emailInput, setEmail] = useState<string | null>(null)
  const name = nameInput ?? (user ? getUserDisplayName(user) : '')
  const email = emailInput ?? (user?.email ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const [groupIds, setGroupIds] = useState<Record<string, number>>({})

  useEffect(() => {
    getPriceGroups()
      .then(groups => setGroupIds(Object.fromEntries(groups.map(g => [g.name, g.id]))))
      .catch(() => setMessage(sv['booking.ticketTypesError']))
  }, [])
  const [kiosk, setKiosk] = useState<KioskItem[]>([])
  const [kioskQty, setKioskQty] = useState<Record<number, number>>({})
  const [kioskError, setKioskError] = useState<string | null>(null)
  const [kioskOpen, setKioskOpen] = useState(false)

  useEffect(() => {
    getKioskItems()
      .then(items => setKiosk(items.filter(i => i.is_available)))
      .catch(() => setKioskError(sv['booking.kioskError']))
  }, [])

  const retrySeats = () => {
    if (Number.isNaN(id)) return
    setError(null)
    setData(null)
    getScreeningSeats(id)
      .then(setData)
      .catch(err => setError(String(err)))
  }

  // 1. Load the seats once when the page opens
  useEffect(() => {
    if (Number.isNaN(id)) return
    let active = true
    getScreeningSeats(id)
      .then(body => { if (active) setData(body) })
      .catch(err => { if (active) setError(String(err)) })
    return () => { active = false }
  }, [id])

  // 2. Refresh every 5 seconds and drop seats that someone else booked
  useEffect(() => {
    if (Number.isNaN(id)) return
    let active = true
    const timer = setInterval(() => {
      getScreeningSeats(id)
        .then(body => {
          if (!active) return
          setData(body)

          const taken = new Set(
            body.seats.filter(s => s.status !== 'available').map(s => s.id),
          )
          setSelectedIds(cur => {
            const stillFree = cur.filter(seatId => !taken.has(seatId))
            if (stillFree.length < cur.length) {
              setNotice(sv['booking.seatTaken'])
            }
            return stillFree
          })
        })
        .catch(() => undefined)
    }, 5000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [id])

  if (Number.isNaN(id) || id <= 0) {
    return (
      <div className="py-5">
        <EmptyState
          variant="warning"
          title={t('booking.invalidTitle')}
          description={t('booking.invalidDescription')}
          actionLabel={t('common.home')}
          actionTo="/"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-5">
        <EmptyState
          variant="error"
          title={t('booking.seatsErrorTitle')}
          description={t('booking.seatsErrorDescription')}
          actionLabel={t('common.retry')}
          onAction={retrySeats}
        />
      </div>
    )
  }

  if (!data || data.screeningId !== id) {
    return (
      <section className="fv-booking" role="status" aria-busy="true">
        <span className="visually-hidden">{t('booking.loading')}</span>
        <div className="fv-booking__top">
          <Skeleton variant="text" width="140px" height="20px" />
          <Skeleton variant="pill" width="280px" height="28px" />
        </div>
        <div className="fv-movie-mini">
          <Skeleton variant="rect" width="48px" height="72px" />
          <div className="flex-grow-1">
            <Skeleton variant="text" width="220px" height="20px" className="mb-2" />
            <Skeleton variant="text" width="180px" height="16px" />
          </div>
        </div>
        <div className="fv-booking__grid">
          <div>
            <div className="fv-card fv-booking__card">
              <Skeleton variant="text" width="180px" height="24px" className="mb-3" />
              <Skeleton variant="rect" width="100%" height="140px" />
            </div>
          </div>
          <aside className="fv-booking__aside">
            <div className="fv-card fv-booking__card">
              <Skeleton variant="text" width="140px" height="22px" className="mb-3" />
              <Skeleton variant="rect" width="100%" height="160px" />
            </div>
          </aside>
        </div>
      </section>
    )
  }

  const toggle = (seatId: number) => {
    if (isSoldOut || !data.seats.some(seat => seat.id === seatId && seat.status === 'available')) return
    setNotice(null)
    setSelectedIds(cur => {
      if (cur.includes(seatId)) return cur.filter(x => x !== seatId)
      if (cur.length < ticketCount) return [...cur, seatId]
      if (ticketCount === 0) return cur
      return [...cur.slice(0, -1), seatId]
    })
  }

  const changeCount = (type: TicketType, n: number) => {
    const next = limitTicketCounts({ ...counts, [type]: n }, availableSeats)
    setCounts(next)
    setSelectedIds(pickBestSeats(data.seats, next.adult + next.senior + next.child))
  }

  async function handleConfirm() {
    if (reservationsClosed || reservationBlocked) return
    if (request.current || authLoading || (user && !user.isVerified)) return
    if (isSoldOut || ticketCount === 0 || ticketCount > ticketLimit ||
      selectedIds.length !== ticketCount || selectedIds.some(seatId => !data?.seats.some(seat => seat.id === seatId && seat.status === 'available'))) return
    setMessage(null)
    setGuestMessage('')
    const emailError = validateEmail(email, locale)
    if (emailError) { setMessage(emailError); return }

    const dbName = { adult: 'adult', senior: 'elder', child: 'child' } as const
    const perSeat = TICKET_TYPES.flatMap(ticket =>
      Array<number>(counts[ticket.type]).fill(groupIds[dbName[ticket.type]]),
    )
    const tickets = selectedIds.map((seatId, i) => ({ seatId, priceGroupId: perSeat[i] }))
    const items = kiosk
      .filter(i => (kioskQty[i.id] ?? 0) > 0)
      .map(i => ({ itemId: i.id, quantity: kioskQty[i.id] }))
    const payload = { screeningId: id, guestName: name.trim(), email: email.trim(), tickets, items }
    const fingerprint = JSON.stringify({ ...payload, userId: user?.id ?? null })
    if (submission.current?.payload !== fingerprint) submission.current = { payload: fingerprint, key: crypto.randomUUID() }
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    try {
      if (!user) {
        const response = await requestGuestBooking(payload, submission.current.key, controller.signal)
        if (!controller.signal.aborted) setGuestMessage(response.message)
        return
      }
      const created = await createBooking(payload, submission.current.key, controller.signal)
      if (controller.signal.aborted) return
      refreshBookings()
      saveCreatedBooking(created, screening?.posterUrl ?? null)
      setReference(created.bookingRef)
      navigate(`/bekraftelse/${created.bookingRef}`)
    } catch (err) {
      if (!controller.signal.aborted) setMessage(err instanceof ApiError ? err.message : sv['booking.genericError'])
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(false) }
    }
  }

  const ticketCount = counts.adult + counts.senior + counts.child
  const ticketTotal = TICKET_TYPES.reduce((sum, ticket) => sum + counts[ticket.type] * ticket.price, 0)
  const kioskCount = Object.values(kioskQty).reduce((sum, n) => sum + n, 0)
  const kioskTotal = kiosk.reduce((sum, i) => sum + i.price * (kioskQty[i.id] ?? 0), 0)
  const selectedLabels = data.seats
    .filter(s => selectedIds.includes(s.id))
    .sort((a, b) => a.row_label.localeCompare(b.row_label) || a.seat_number - b.seat_number)
    .map(s => t('seatMap.seat', { row: s.row_label, seat: s.seat_number }))
    .join(' · ')

  const screening = screenings?.find(s => s.id === id)
  const reservationsClosed = Boolean(screening && new Date(screening.startsAt).getTime() - currentTime <= 60 * 60_000)
  const when = screening
    ? t('common.dateTime', { date: formatDateLong(toCinemaIsoDate(screening.startsAt), locale), time: formatTime(screening.startsAt, locale) })
    : ''
  const endTime = screening ? formatTime(screening.endsAt, locale) : ''
  const seatsLeft = ticketCount - selectedIds.length
  const ctaLabel =
    ticketCount === 0
      ? t('booking.chooseTickets')
      : seatsLeft > 0
        ? t(seatsLeft === 1 ? 'booking.chooseMoreOne' : 'booking.chooseMoreMany', { count: seatsLeft })
        : seatsLeft < 0
          ? t('booking.tooManySeats')
          : user ? t('booking.complete') : t('booking.sendEmail')

  return (
    <section className="fv-booking">
      <div className="fv-booking__top">
        <Link
          to={screening ? getMovieUrl(screening.movieId) : '/'}
          className="fv-booking__back"
        >
          ‹ {screening ? screening.movieTitle : t('common.back')}
        </Link>
        <StepIndicator current={ticketCount === 0 ? 1 : 2} />
      </div>

      {screening && (
        <div className="fv-movie-mini">
          {screening.posterUrl && (
            <img
              className="fv-movie-mini__poster"
              src={screening.posterUrl}
              alt={screening.movieTitle}
            />
          )}
          <div>
            <h1 className="fv-movie-mini__title">{screening.movieTitle}</h1>
            <p className="fv-movie-mini__meta">
              {screening.cinema} · {when}–{endTime}
            </p>
          </div>
        </div>
      )}

      {notice && (
        <p className="fv-booking__alert" role="alert">
          {translateApiError(notice, locale)}
        </p>
      )}

      {isSoldOut ? (
        <EmptyState
          icon="bi-ticket-perforated"
          title={t('booking.soldOutTitle')}
          description={t('booking.soldOutDescription')}
          actionLabel={t('booking.otherScreenings')}
          actionTo={screening ? getMovieUrl(screening.movieId) : '/filmer'}
        />
      ) : (
        <div className="fv-booking__grid">
          <div>
            <div className="fv-card fv-booking__card">
              <h2>{t('booking.stepTickets')}</h2>
              <p className="fv-card__subtitle" role="status">
                {availableSeats <= 10
                  ? t('booking.availability', { available: t(availableSeats === 1 ? 'booking.seatsLeftOne' : 'screening.seatsLeft', { count: availableSeats }), limit: t(ticketLimit === 1 ? 'booking.ticketCountOne' : 'booking.ticketCountMany', { count: ticketLimit }) })
                  : t('booking.ticketCategories')}
              </p>
              {TICKET_TYPES.map(ticket => (
                <QuantityPicker
                  key={ticket.type}
                  label={`${translateTicketType(ticket.label, locale)} (${formatSek(ticket.price, locale)})`}
                  value={counts[ticket.type]}
                  max={ticketLimit - (ticketCount - counts[ticket.type])}
                  onChange={n => changeCount(ticket.type, n)}
                />
              ))}
              {ticketCount > 0 && (
                <div className="fv-ticket-summary">
                  <span>
                    {t('booking.ticketSummary', { price: formatSek(ticketTotal, locale), tickets: t(ticketCount === 1 ? 'booking.ticketCountOne' : 'booking.ticketCountMany', { count: ticketCount }) })}
                  </span>
                  <i className="bi bi-check-circle-fill" aria-hidden="true" />
                </div>
              )}
            </div>

            {ticketCount > 0 && (
              <div className="fv-card fv-booking__card fv-booking__seat-card">
                <h2>{t('booking.stepSeats')}</h2>
                <p className="fv-card__subtitle">
                  {t('booking.bestSeats')}
                </p>
                <SeatMap seats={data.seats} selectedIds={selectedIds} onToggle={toggle} />
              </div>
            )}

            {ticketCount > 0 && (
              <div className="fv-card fv-booking__card fv-kiosk">
                <button
                  type="button"
                  className="fv-kiosk__header"
                  onClick={() => setKioskOpen(o => !o)}
                  aria-expanded={kioskOpen}
                  aria-controls="fv-kiosk-items"
                >
                  <span className="fv-kiosk__icon fv-kiosk__emoji" aria-hidden="true">🍿</span>
                  <span className="fv-kiosk__text">
                    <strong>{t('booking.kioskHeading')}</strong>
                    <small>
                      {kioskCount > 0
                        ? t('booking.kioskSelected', { count: kioskCount })
                        : t('booking.kioskBrowse')}
                    </small>
                  </span>
                  <i
                    className={`fv-kiosk__chevron bi ${kioskOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}
                    aria-hidden="true"
                  />
                </button>

                <div id="fv-kiosk-items" className="fv-kiosk__items" hidden={!kioskOpen}>
                  {kioskError && <p role="alert">{translateApiError(kioskError, locale)}</p>}
                  {kiosk.map(i => (
                    <QuantityPicker
                      key={i.id}
                      label={`${translateKioskName(i.name, locale)} (${formatSek(i.price, locale)})`}
                      value={kioskQty[i.id] ?? 0}
                      max={20}
                      onChange={next => setKioskQty(q => ({ ...q, [i.id]: next }))}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="fv-booking__aside">
            <div className="fv-card fv-booking__card">
              <h2>{t('booking.yourBooking')}</h2>

              <div role="status" aria-live="polite" aria-atomic="true">
                <p className="visually-hidden">{t('booking.selectionStatus', { selected: selectedIds.length, total: ticketCount })}</p>
                {selectedIds.length > 0 && (
                  <div className="fv-selected">
                    <span>{screening?.cinema}</span>
                    <strong>{selectedLabels}</strong>
                  </div>
                )}
              </div>

              {ticketCount > 0 && (
                <div className="fv-summary">
                  {TICKET_TYPES.filter(ticket => counts[ticket.type] > 0).map(ticket => (
                    <div key={ticket.type} className="fv-summary__row">
                      <span>
                        {counts[ticket.type]}× {translateTicketType(ticket.label, locale)}
                      </span>
                      <span>{formatSek(counts[ticket.type] * ticket.price, locale)}</span>
                    </div>
                  ))}
                  {kioskCount > 0 && (
                    <div className="fv-summary__row">
                      <span>{kioskCount}× {t('booking.kiosk')}</span>
                      <span>{formatSek(kioskTotal, locale)}</span>
                    </div>
                  )}
                  <div className="fv-summary__row fv-summary__row--total" role="status" aria-live="polite" aria-atomic="true">
                    <span>{t('booking.total')}</span>
                    <span>{formatSek(ticketTotal + kioskTotal, locale)}</span>
                  </div>
                </div>
              )}

              <p className="fv-notice">
                {t('booking.paymentNotice')}
              </p>
              <p className="small text-secondary">{t('reservationWarnings.bookingNotice')}</p>

              {ticketCount > 0 && seatsLeft === 0 && (
                <div className="fv-checkout">
                  <label className="fv-checkout__field" htmlFor="guest-name">
                    {t('form.name')}
                    <input
                      type="text"
                      id="guest-name"
                      name="guestName"
                      autoComplete="name"
                      required
                      placeholder={t('form.fullNamePlaceholder')}
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </label>
                  <label className="fv-checkout__field" htmlFor="guest-email">
                    {t('form.email')}
                    <input
                      type="email"
                      id="guest-email"
                      name="email"
                      autoComplete="email"
                      required
                      placeholder={t('form.emailPlaceholder')}
                      value={email}
                      readOnly={Boolean(user)}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </label>
                </div>
              )}

              {message && (
                <p className="fv-booking__error" role="alert">
                  {translateApiError(message, locale)}
                </p>
              )}
              {!user && <p className="fv-notice">{t('booking.guestNotice')}</p>}
              {guestMessage && <p role="status" className="text-success">{translateApiMessage(guestMessage, locale)}</p>}
              {user && !user.isVerified && <div role="status" className="fv-notice">
                <p>{t('booking.verifyNotice')}</p>
                <button type="button" className="btn btn-secondary-outline btn-sm" disabled={pending}
                  onClick={async () => {
                    setPending(true)
                    try { await refreshUser() } catch { setMessage(sv['booking.verificationError']) }
                    finally { setPending(false) }
                  }}>{t('booking.verifiedButton')}</button>
              </div>}
              {reference && (
                <p>
                  {t('booking.confirmedPrefix')} <strong>{reference}</strong>
                </p>
              )}

              <button
                className="fv-checkout__btn"
                onClick={handleConfirm}
                disabled={
                  reservationBlocked || reservationsClosed || ticketCount === 0 ||
                  seatsLeft !== 0 ||
                  name.trim() === '' ||
                  email.trim() === '' ||
                  Object.keys(groupIds).length === 0 ||
                  reference !== null
                  || pending || authLoading || Boolean(user && !user.isVerified)
                }
              >
                {pending ? t('booking.wait') : ctaLabel}
              </button>
              {reservationsClosed && <p className="small text-secondary mt-2" role="status">{t('booking.reservationsClosed')}</p>}
              <ReservationWarningNotice status={reservationStatus} currentTime={currentTime} />
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}
