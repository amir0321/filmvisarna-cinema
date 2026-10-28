import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import QuantityPicker from '../components/QuantityPicker'
import { TICKET_TYPES, type TicketType } from '../constants/prices'
import { formatSek, sumLines } from '../utils/price'
import type { KioskItem } from '../types/kiosk'
import apiClient, {ApiError} from '../api/client'
import {getPriceGroups} from '../api/priceGroups'
import {getKioskItems} from '../api/kiosk'

export const hideFromNav = true

export default function Booking() {
    const { screeningId: idParam } = useParams()
  const [searchParams] = useSearchParams()

  const screeningId = Number(idParam)
  const seatIds = (searchParams.get('seats') ?? '')
    .split(',')
    .map(Number)
    .filter(n => Number.isInteger(n) && n > 0)

  const booking =
    Number.isInteger(screeningId) && screeningId > 0 && seatIds.length > 0
      ? { screeningId, seatIds }
      : null

    const countFromUrl = (key: string) => {
    const n = Number(searchParams.get(key))
    return Number.isInteger(n) && n > 0 ? n : 0
  }
  const counts: Record<TicketType, number> = {
    adult: countFromUrl('adult'),
    senior: countFromUrl('senior'),
    child: countFromUrl('child'),
  }
  const [kiosk, setKiosk] = useState<KioskItem[]>([])
  const [kioskQty, setKioskQty] = useState<Record<number, number>>({})
  const [kioskError, setKioskError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const [groupIds, setGroupIds] = useState<Record<string, number>>({})

   useEffect(() => {
    getKioskItems()
      .then(items => setKiosk(items.filter(i => i.is_available)))
      .catch(() => setKioskError('Kunde inte hämta kiosken.'))
  }, [])

    useEffect(() => {
    getPriceGroups()
      .then(groups => setGroupIds(Object.fromEntries(groups.map(g => [g.name, g.id]))))
      .catch(() => setMessage('Kunde inte hämta biljettyper.'))
  }, [])

  if (!booking) {
    return <p>Ingen bokning vald. <Link to="/">Till startsidan</Link></p>
  }

  const seatCount = booking.seatIds.length
  const ticketCount = counts.adult + counts.senior + counts.child
  const ticketsDone = ticketCount === seatCount
  const backUrl = `/screeningdetail/${booking.screeningId}?seats=${seatIds.join(',')}&adult=${counts.adult}&senior=${counts.senior}&child=${counts.child}`

  const ticketTotal = sumLines(
    TICKET_TYPES.map(t => ({ price: t.price, quantity: counts[t.type] })),
  )
  const kioskTotal = sumLines(
    kiosk.map(i => ({ price: i.price, quantity: kioskQty[i.id] ?? 0 })),
  )
    const kioskCount = Object.values(kioskQty).reduce((sum, n) => sum + n, 0)

    async function handleConfirm() {
    if (!booking) return
    setMessage(null)

        const dbName = { adult: 'adult', senior: 'elder', child: 'child' } as const
    const perSeat = TICKET_TYPES.flatMap(t =>
      Array<number>(counts[t.type]).fill(groupIds[dbName[t.type]]),
    )
    const tickets = booking.seatIds.map((seatId, i) => ({ seatId, priceGroupId: perSeat[i] }))
    const items = kiosk
      .filter(i => (kioskQty[i.id] ?? 0) > 0)
      .map(i => ({ itemId: i.id, quantity: kioskQty[i.id] }))

    try {
      const created = await apiClient.post<{ bookingRef: string }>('/bookings', {
        screeningId: booking.screeningId,
        guestName: name.trim(),
        email,
        tickets,
        items,
      })
      setReference(created.bookingRef)
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Något gick fel. Försök igen.')
    }
  }
  return (
    <section>
      <Link to="/">Till startsidan</Link>
      <Link to={backUrl}>← Ändra stolar och biljetter</Link>
      <h1>Din bokning</h1>
      <p>Valda stolar: {seatCount}</p>

        <div className="fv-card">
        <h2>Biljetter</h2>
        {TICKET_TYPES.filter(t => counts[t.type] > 0).map(t => (
          <p key={t.type}>
            {counts[t.type]} × {t.label} ({formatSek(t.price)})
          </p>
        ))}
        {!ticketsDone && (
          <p>
            Välj biljettyper för alla {seatCount} stolar på stolsidan.{' '}
            <Link to={`/screeningdetail/${booking.screeningId}`}>Till stolsidan</Link>
          </p>
        )}
      </div>

       <details className="fv-card">
        <summary>
          Bio-Kiosken (valfritt){kioskCount > 0 ? ` – ${kioskCount} valda` : ''}
        </summary>
        {kioskError && <p>{kioskError}</p>}
        {kiosk.map(i => (
          <QuantityPicker
            key={i.id}
            label={`${i.name} (${formatSek(i.price)})`}
            value={kioskQty[i.id] ?? 0}
            max={20}
            onChange={next => setKioskQty(q => ({ ...q, [i.id]: next }))}
          />
        ))}
      </details>

      <h2>Totalt: {formatSek(ticketTotal + kioskTotal)}</h2>
         <div className="fv-checkout">
        <label className="fv-checkout__field">
          Namn
          <input
            type="text"
            placeholder="Förnamn Efternamn"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </label>

        <label className="fv-checkout__field">
          E-post för bokningsbekräftelse
          <input
            type="email"
            placeholder="din@epost.se"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </label>
        {message && <p role="alert">{message}</p>}
        {reference && <p>Bokningen är bekräftad. Bokningsnummer: <strong>{reference}</strong></p>}

        <button
          className="fv-checkout__btn"
          onClick={handleConfirm}
          disabled={Object.keys(groupIds).length === 0 || !ticketsDone || email.trim() === '' || reference !== null}
        >
          Bekräfta bokning
        </button>
      </div>
    </section>
  )
}