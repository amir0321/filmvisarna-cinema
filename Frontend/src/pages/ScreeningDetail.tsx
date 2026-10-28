import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import SeatMap from '../components/SeatMap'
import type { SeatsResponse } from '../types/screeningSeat'
import QuantityPicker from '../components/QuantityPicker'
import { TICKET_TYPES, type TicketType } from '../constants/prices'
import { formatSek } from '../utils/price'
import {useScreenings} from '../hooks/useScreenings'

function isSeatsResponse(v: unknown): v is SeatsResponse {
  return typeof v === 'object' && v !== null && 'seats' in v && Array.isArray(v.seats)
}

export default function ScreeningDetail() {
  const { id: idParam } = useParams()
  const id = idParam ? Number(idParam) : NaN
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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
  const [counts, setCounts] = useState<Record<TicketType, number>>({
    adult: countFromUrl('adult'),
    senior: countFromUrl('senior'),
    child: countFromUrl('child'),
  })
    const { data: screenings } = useScreenings()
  // 1. Load the seats once when the page opens
  useEffect(() => {
    if (Number.isNaN(id)) return
    fetch(`/api/screenings/${id}/seats`)
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`)
        return res.json()
      })
      .then((body: unknown) => {
        if (!isSeatsResponse(body)) throw new Error('Oväntat svar')
        setData(body)
      })
      .catch(err => setError(String(err)))
  }, [id])

  // 2. Refresh every 5 seconds and drop seats that someone else booked
  useEffect(() => {
    if (Number.isNaN(id)) return
    const timer = setInterval(() => {
      fetch(`/api/screenings/${id}/seats`)
        .then(res => (res.ok ? res.json() : null))
        .then((body: unknown) => {
          if (!body || !isSeatsResponse(body)) return
          setData(body)

          const taken = new Set(
            body.seats.filter(s => s.status !== 'available').map(s => s.id),
          )
          setSelectedIds(cur => {
            const stillFree = cur.filter(seatId => !taken.has(seatId))
            if (stillFree.length < cur.length) {
              setNotice('En stol du valt har just blivit bokad. Välj en annan stol.')
            }
            return stillFree
          })
        })
        .catch(() => undefined)
    }, 5000)
    return () => clearInterval(timer)
  }, [id])

  if (Number.isNaN(id)) {
    return <p>Ogiltig visning. <Link to="/">Till startsidan</Link></p>
  }
  if (error) {
    return <p>Kunde inte hämta stolarna. Försök igen senare. <Link to="/">Till startsidan</Link></p>
  }
  if (!data) return <p>Laddar...</p>

  const toggle = (seatId: number) => {
    setNotice(null)
    setSelectedIds(cur =>
      cur.includes(seatId) ? cur.filter(x => x !== seatId) : [...cur, seatId],
    )
  }
    const ticketCount = counts.adult + counts.senior + counts.child
    const ticketTotal = TICKET_TYPES.reduce((sum, t) => sum + counts[t.type] * t.price, 0)

      const selectedLabels = data.seats
    .filter(s => selectedIds.includes(s.id))
    .map(s => `${s.row_label}${s.seat_number}`)
    .sort()
    .join(', ')

      const screening = screenings?.find(s => s.id === id)
  const when = screening
    ? new Date(screening.startsAt).toLocaleString('sv-SE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Stockholm',
      })
    : ''

    return (
    <section>
      <Link to="/">← Till startsidan</Link>
      <h1>Välj stolar</h1>
            {screening && (
        <p>
          <strong>{screening.movieTitle}</strong> · {screening.cinema} · {when}
        </p>
      )}
      {notice && <p role="alert">{notice}</p>}
      <SeatMap seats={data.seats} selectedIds={selectedIds} onToggle={toggle} />
            <p>
        Valda stolar ({selectedIds.length}): {selectedLabels || 'inga ännu'}
      </p>

      <h2>Biljetter</h2>
      {TICKET_TYPES.map(t => (
        <QuantityPicker
          key={t.type}
          label={`${t.label} (${t.price} kr)`}
          value={counts[t.type]}
          max={8}
          onChange={n => setCounts(c => ({ ...c, [t.type]: n }))}
        />
      ))}
      <p>
        Biljetter: {ticketCount} av {selectedIds.length} stolar · Totalt {formatSek(ticketTotal)}
      </p>

      <button
        disabled={selectedIds.length === 0 || ticketCount !== selectedIds.length}
        onClick={() =>
          navigate(
            `/booking/${id}?seats=${selectedIds.join(',')}&adult=${counts.adult}&senior=${counts.senior}&child=${counts.child}`,
          )
        }
      >
        Fortsätt
      </button>
    </section>
  )
}