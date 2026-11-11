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

export default function ConfirmGuestBooking() {
  const token = useAuthActionToken()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<GuestBookingPreview | null>(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [seats, setSeats] = useState<SeatsResponse | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
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
      if (!controller.signal.aborted) setError(error instanceof ApiError ? error.message : 'Kunde inte hämta bokningen. Försök igen.')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, revision])

  async function confirm() {
    if (!preview || request.current || selectedIds.length !== preview.tickets.length) return
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
      setError(error instanceof ApiError ? error.message : 'Kunde inte bekräfta bokningen. Försök igen.')
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

  return <AuthActionCard title="Bekräfta din gästbokning" description="Kontrollera ditt val och bekräfta bokningen. Du betalar i biografens kassa.">
    {!token ? <p className="fv-auth-error" role="alert">Bekräftelselänken saknas eller är ogiltig. Gör en ny bokningsförfrågan.</p>
      : loading ? <p role="status">Hämtar din bokningsförfrågan...</p>
        : <>
          {error && <p className="fv-auth-error" role="alert">{error}</p>}
          {!preview && <button type="button" className="fv-auth-submit" onClick={() => {
            setError(''); setLoading(true); setRevision(value => value + 1)
          }}>Försök igen</button>}
          {preview && <>
            <h2 className="h5">{preview.screening.movieTitle}</h2>
            <p>{preview.screening.cinema} · {formatDateLong(toCinemaIsoDate(preview.screening.startsAt))} kl. {formatTime(preview.screening.startsAt)}</p>
            <p>{preview.tickets.length} {preview.tickets.length === 1 ? 'biljett' : 'biljetter'} · {formatSek(preview.totalPrice)}</p>
            <p>{preview.email}</p>
            {!seats && <p>{preview.tickets.map(ticket => `Rad ${ticket.row}, stol ${ticket.number}`).join(' · ')}</p>}
            {preview.items.length > 0 && <ul>{preview.items.map(item => <li key={item.itemId}>{item.quantity} × {item.name}</li>)}</ul>}
            <p>Platserna reserveras först när bokningen bekräftas. Länken gäller till kl. {formatTime(preview.expiresAt)}.</p>
            {seats && <div>
              <p>Kontrollera och välj {preview.tickets.length} lediga platser.</p>
              <SeatMap seats={seats.seats} selectedIds={selectedIds} onToggle={id => {
                if (pending || !seats.seats.some(seat => seat.id === id && seat.status === 'available')) return
                setSelectedIds(current => current.includes(id) ? current.filter(value => value !== id)
                  : [...current.slice(0, preview.tickets.length - 1), id])
              }} />
            </div>}
            <button type="button" className="fv-auth-submit" disabled={pending || selectedIds.length !== preview.tickets.length} onClick={() => void confirm()}>
              {pending ? 'Bekräftar...' : 'Bekräfta bokning'}
            </button>
          </>}
        </>}
    <p className="fv-auth-footer"><Link to="/filmer">Till filmer och visningstider</Link></p>
  </AuthActionCard>
}
