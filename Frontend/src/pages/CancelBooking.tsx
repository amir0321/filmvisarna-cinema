import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  cancellationService,
  cancelErrorMessages,
  mapCancelErrorToState,
  type CancellationCredentials,
  type CancelPageState,
} from '../api/cancellations'
import { CancelBookingModal } from '../components/CancelBookingModal'
import { Poster } from '../components/Poster'
import { useAuth } from '../hooks/useAuth'
import { capitalize, formatDateLong, formatTime, toCinemaIsoDate } from '../utils/date'
import type { CancelPreviewResult } from '../types/booking'

export default function CancelBooking() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bookingRef, setBookingRef] = useState(() =>
    typeof location.state?.bookingRef === 'string' ? location.state.bookingRef : '',
  )
  const [email, setEmail] = useState(() =>
    typeof location.state?.email === 'string' ? location.state.email : '',
  )
  const [state, setState] = useState<CancelPageState>('idle')
  const [booking, setBooking] = useState<CancelPreviewResult | null>(null)
  const [credentials, setCredentials] = useState<CancellationCredentials | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const pending = useRef(false)
  const feedback = useRef<HTMLDivElement>(null)

  // Old links lead to the form; no credentials are read from or kept in the URL.
  useEffect(() => {
    if (location.hash || location.search || location.pathname !== '/avboka') {
      void navigate('/avboka', { replace: true })
    }
  }, [location.hash, location.search, location.pathname, navigate])

  useEffect(() => {
    if (errorMessage || state === 'success') feedback.current?.focus()
  }, [errorMessage, state])

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    pending.current = true
    setState('loading')
    setErrorMessage(null)
    setActionError(null)
    setBooking(null)
    setCredentials(null)
    const input = { bookingRef: bookingRef.trim().toUpperCase(), email: email.trim().toLowerCase() }
    try {
      const preview = await cancellationService.getCancelPreview(input)
      setBooking(preview)
      setCredentials(input)
      setState('confirm')
      setIsModalOpen(true)
    } catch (error) {
      const nextState = mapCancelErrorToState(error)
      setState(nextState)
      setErrorMessage(cancelErrorMessages[nextState])
    } finally {
      pending.current = false
    }
  }

  async function handleConfirm() {
    if (!credentials || pending.current) return
    pending.current = true
    setState('cancelling')
    setActionError(null)
    try {
      await cancellationService.cancelByToken(credentials)
      setIsModalOpen(false)
      setCredentials(null)
      setState('success')
    } catch (error) {
      const nextState = mapCancelErrorToState(error)
      setActionError(cancelErrorMessages[nextState])
      setState('confirm')
    } finally {
      pending.current = false
    }
  }

  const busy = state === 'loading' || state === 'cancelling'
  const showingBooking = booking && (state === 'confirm' || state === 'cancelling')

  return (
    <div className="container fv-cancel-page">
      <h1 className="h3 fw-bold text-body mb-3">Avboka bokning</h1>
      <p className="text-secondary mb-4">
        Ange bokningsnumret från din bekräftelse och e-postadressen som användes vid bokningen.
        Du kan avboka senast 2 timmar före visningen.
      </p>

      {state === 'success' ? (
        <div ref={feedback} tabIndex={-1} role="status" className="fv-cancel-receipt-card p-4">
          <div className="fv-cancel-success-icon" aria-hidden="true"><i className="bi bi-check-lg" /></div>
          <h2 className="h4 text-body">Bokningen är avbokad</h2>
          <p>Bokning <span className="fv-cancel-ref-badge">{booking?.bookingRef}</span> har avbokats och dina platser har släppts fria.</p>
          <Link to="/" className="btn btn-secondary-outline">Till startsidan</Link>
        </div>
      ) : showingBooking ? (
        <section className="fv-cancel-receipt-card p-4" aria-labelledby="cancel-details-title">
          <h2 id="cancel-details-title" className="h4 text-body">Din biobokning</h2>
          <p><span className="fv-cancel-ref-badge">{booking.bookingRef}</span></p>
          <div className="d-flex gap-3 mb-4">
            {booking.posterUrl ? (
              <div className="fv-cancel-receipt-poster flex-shrink-0">
                <Poster src={booking.posterUrl} alt={booking.movieTitle} aspectRatio="2/3" />
              </div>
            ) : null}
            <div>
              <h3 className="h5 text-body">{booking.movieTitle}</h3>
              <p className="mb-1">{capitalize(formatDateLong(toCinemaIsoDate(booking.screeningStartsAt)))} kl. {formatTime(booking.screeningStartsAt)}</p>
              <p className="mb-1">{booking.cinemaName}</p>
              <p className="mb-0">{booking.seats.join(' · ')}</p>
            </div>
          </div>
          {!isModalOpen ? <p role="status">Din bokning finns kvar. Öppna dialogen om du vill avboka.</p> : null}
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-danger" onClick={() => setIsModalOpen(true)} disabled={busy}>
              Öppna avbokningsdialog
            </button>
            <button type="button" className="btn btn-secondary-outline" disabled={busy} onClick={() => {
              setBooking(null)
              setCredentials(null)
              setActionError(null)
              setState('idle')
            }}>Sök annan bokning</button>
          </div>
        </section>
      ) : (
        <form className="fv-cancel-form fv-cancel-receipt-card p-4 p-md-5" onSubmit={handleLookup} aria-busy={busy}>
          <div className="mb-4">
            <label htmlFor="cancel-booking-ref" className="form-label">Bokningsnummer</label>
            <input id="cancel-booking-ref" name="bookingRef" className="form-control fv-cancel-form__reference"
              value={bookingRef} onChange={event => setBookingRef(event.target.value)}
              placeholder="FV-XXXXX" autoCapitalize="characters" autoComplete="off" spellCheck={false}
              aria-describedby="cancel-ref-help" required pattern="\s*[Ff][Vv]-[A-Za-z0-9]{5}\s*" disabled={busy} />
            <p id="cancel-ref-help" className="form-text text-secondary">Du hittar bokningsnumret i ditt bekräftelsemejl, till exempel FV-A1B2C.</p>
          </div>
          <div className="mb-4">
            <label htmlFor="cancel-email" className="form-label">E-postadress</label>
            <input id="cancel-email" name="email" type="email" className="form-control" value={email}
              onChange={event => setEmail(event.target.value)} autoComplete="email" maxLength={200} required disabled={busy} />
          </div>
          {errorMessage ? (
            <div ref={feedback} tabIndex={-1} role="alert" className="alert alert-danger">{errorMessage}</div>
          ) : null}
          <button type="submit" className="btn btn-danger w-100" disabled={busy}>
            {state === 'loading' ? 'Hämtar bokning…' : 'Hämta bokning'}
          </button>
          {state === 'loading' ? <p role="status" className="mt-3 mb-0">Hämtar din bokning, vänta en stund.</p> : null}
        </form>
      )}

      {user ? <p className="small text-secondary mt-4 mb-0">Som medlem kan du även hantera dina bokningar under <Link to="/mina-bokningar">Mina bokningar</Link>.</p> : null}

      <CancelBookingModal isOpen={isModalOpen} booking={booking} isSubmitting={state === 'cancelling'}
        canCancel={booking?.canCancel ?? false} error={actionError} onConfirm={handleConfirm} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
