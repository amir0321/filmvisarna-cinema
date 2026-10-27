import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import SeatMap from '../components/SeatMap'
import type { SeatsResponse } from '../types/screeningSeat'

function isSeatsResponse(v: unknown): v is SeatsResponse {
  return typeof v === 'object' && v !== null && 'seats' in v && Array.isArray(v.seats)
}

export default function ScreeningDetail() {
  const { id: idParam } = useParams()
  const id = idParam ? Number(idParam) : NaN
  const navigate = useNavigate()
  const [data, setData] = useState<SeatsResponse | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

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

  return (
    <section>
      <Link to="/">← Till startsidan</Link>
      <h1>Välj stolar</h1>
      {notice && <p role="alert">{notice}</p>}
      <SeatMap seats={data.seats} selectedIds={selectedIds} onToggle={toggle} />
      <p>Valda stolar: {selectedIds.length}</p>
      <button
        disabled={selectedIds.length === 0}
        onClick={() => navigate(`/booking/${id}?seats=${selectedIds.join(',')}`)}
      >
        Fortsätt
      </button>
    </section>
  )
}