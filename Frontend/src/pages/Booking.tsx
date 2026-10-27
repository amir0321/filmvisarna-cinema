import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import QuantityPicker from '../components/QuantityPicker'
import { TICKET_TYPES, type TicketType } from '../constants/prices'
import { formatSek, sumLines } from '../utils/price'
import type { KioskItem } from '../types/kisok.ts'

export const hideFromNav = true

interface BookingState {
  screeningId: number
  seatIds: number[]
}

// A type guard checks the data at runtime instead of using "as"
function isBookingState(v: unknown): v is BookingState {
  return (
    typeof v === 'object' && v !== null &&
    'screeningId' in v && typeof v.screeningId === 'number' &&
    'seatIds' in v && Array.isArray(v.seatIds)
  )
}

export default function Booking() {
  const location = useLocation()
  console.log('state:', location.state)
  const booking = isBookingState(location.state) ? location.state : null

  const [counts, setCounts] = useState<Record<TicketType, number>>({ adult: 0, senior: 0, child: 0 })
  const [kiosk, setKiosk] = useState<KioskItem[]>([])
  const [kioskQty, setKioskQty] = useState<Record<number, number>>({})
  const [kioskError, setKioskError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/kiosk')
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`)
        return res.json()
      })
      .then((body: { data: KioskItem[] }) => setKiosk(body.data.filter(i => i.is_available)))
      .catch(err => setKioskError(String(err)))
  }, [])

  if (!booking) {
    return <p>No booking selected <Link to="/">Home</Link></p>
  }

  const seatCount = booking.seatIds.length
  const ticketCount = counts.adult + counts.senior + counts.child
  const ticketsDone = ticketCount === seatCount

  const ticketTotal = sumLines(
    TICKET_TYPES.map(t => ({ price: t.price, quantity: counts[t.type] })),
  )
  const kioskTotal = sumLines(
    kiosk.map(i => ({ price: i.price, quantity: kioskQty[i.id] ?? 0 })),
  )

  return (
    <section>
      <Link to="/">Home</Link>
      <h1>Your Booking</h1>
      <p>Selected Seats: {seatCount}</p>

      <h2>Tickets</h2>
      {TICKET_TYPES.map(t => (
        <QuantityPicker
          key={t.type}
          label={`${t.label} (${formatSek(t.price)})`}
          value={counts[t.type]}
          max={seatCount - (ticketCount - counts[t.type])}
          onChange={next => setCounts(c => ({ ...c, [t.type]: next }))}
        />
      ))}
      {!ticketsDone && <p>Select ticket type for all {seatCount} seats ({ticketCount}/{seatCount}).</p>}

      <h2>Kiosk</h2>
      {kioskError && <p>Cannot find the kisok: {kioskError}</p>}
      {kiosk.map(i => (
        <QuantityPicker
          key={i.id}
          label={`${i.name} (${formatSek(i.price)})`}
          value={kioskQty[i.id] ?? 0}
          max={20}
          onChange={next => setKioskQty(q => ({ ...q, [i.id]: next }))}
        />
      ))}

      <h2>Totalt: {formatSek(ticketTotal + kioskTotal)}</h2>

      <button disabled={!ticketsDone}>confirm booking</button>
    </section>
  )
}