import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import SeatMap from '../components/SeatMap'
import type { SeatsResponse } from '../types'

function isSeatsResponse(v: unknown): v is SeatsResponse {
  return typeof v === 'object' && v !== null && 'seats' in v && Array.isArray(v.seats)
}

export default function ScreeningDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<SeatsResponse | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
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

  if (!id) return <p>Invalid showing <Link to="/">Home</Link></p>
  if (error) return <p>Cannot find the seats: {error} <Link to="/">Home</Link></p>
  if (!data) return <p>Loading...</p>

  const toggle = (seatId: number) =>
    setSelectedIds(cur => (cur.includes(seatId) ? cur.filter(x => x !== seatId) : [...cur, seatId]))

  return (
    <section>
      <h1>Select Seat</h1>
      <SeatMap seats={data.seats} selectedIds={selectedIds} onToggle={toggle} />
      <p>Selected Seats: {selectedIds.length}</p>
      <button
        disabled={selectedIds.length === 0}
        onClick={() => navigate('/booking', { state: { screeningId: id, seatIds: selectedIds } })}
      >
        Fortsätt
      </button>
    </section>
  )
}