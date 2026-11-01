import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import SeatMap from '../components/SeatMap'
import type { SeatsResponse } from '../types/screeningSeat'
import QuantityPicker from '../components/QuantityPicker'
import { TICKET_TYPES, type TicketType } from '../constants/prices'
import { formatSek } from '../utils/price'
import {useScreenings} from '../hooks/useScreenings'
import {getScreeningSeats} from '../api/screeningSeats'
import StepIndicator from '../components/StepIndicator'
import { getMovieUrl } from '../utils/links'
import { pickBestSeats } from '../utils/seats'

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
    getScreeningSeats(id)
      .then(setData)
      .catch(err => setError(String(err)))
  }, [id])

  // 2. Refresh every 5 seconds and drop seats that someone else booked
  useEffect(() => {
    if (Number.isNaN(id)) return
    const timer = setInterval(() => {
      getScreeningSeats(id)
        .then(body => {
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
    setSelectedIds(cur => {
      if (cur.includes(seatId)) return cur.filter(x => x !== seatId)
      if (cur.length < ticketCount) return [...cur, seatId]
      if (ticketCount === 0) return cur
      return [...cur.slice(0, -1), seatId]
    })
  }

  const changeCount = (type: TicketType, n: number) => {
    const next = { ...counts, [type]: n }
    setCounts(next)
    setSelectedIds(pickBestSeats(data.seats, next.adult + next.senior + next.child))
  }
    const ticketCount = counts.adult + counts.senior + counts.child
    const ticketTotal = TICKET_TYPES.reduce((sum, t) => sum + counts[t.type] * t.price, 0)

      const selectedLabels = data.seats
    .filter(s => selectedIds.includes(s.id))
    .sort((a, b) => a.row_label.localeCompare(b.row_label) || a.seat_number - b.seat_number)
    .map(s => `Rad ${s.row_label}, Stol ${s.seat_number}`)
    .join(' · ')

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
      const endTime = screening
    ? new Date(screening.endsAt).toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Stockholm',
      })
    : ''
  const seatsLeft = ticketCount - selectedIds.length
  const ctaLabel =
    ticketCount === 0
      ? 'Välj biljetter'
      : seatsLeft > 0
        ? `Välj ${seatsLeft} ${seatsLeft === 1 ? 'plats' : 'platser'} till`
        : seatsLeft < 0
          ? 'Fler platser än biljetter'
          : 'Slutför bokning'

         return (
    <section>
      <div className="fv-booking__top">
        <Link
          to={screening ? getMovieUrl(screening.movieId) : '/'}
          className="fv-booking__back"
        >
          ‹ {screening ? screening.movieTitle : 'Tillbaka'}
        </Link>
        <StepIndicator current={ticketCount === 0 ? 1 : 2} />
      </div>

      {screening && (
        <div className="fv-movie-mini">
          {screening.posterUrl && (
            <img className="fv-movie-mini__poster" src={screening.posterUrl} alt="" />
          )}
          <div>
            <h1 className="fv-movie-mini__title">{screening.movieTitle}</h1>
            <p className="fv-movie-mini__meta">
              {screening.cinema} · {when}–{endTime}
            </p>
          </div>
        </div>
      )}

      {notice && <p role="alert">{notice}</p>}

      <div className="fv-booking__grid">
        <div>
          <div className="fv-card">
            <h2>1. Välj biljetter</h2>
            <p>Välj antal biljetter per kategori</p>
            {TICKET_TYPES.map(t => (
              <QuantityPicker
                key={t.type}
                label={`${t.label} (${t.price} kr)`}
                value={counts[t.type]}
                max={10 - (ticketCount - counts[t.type])}
                onChange={n => changeCount(t.type, n)}
              />
            ))}
            {ticketCount > 0 && (
              <p>
                Totalt: {formatSek(ticketTotal)} för {ticketCount}{' '}
                {ticketCount === 1 ? 'biljett' : 'biljetter'}
              </p>
            )}
          </div>

          {ticketCount > 0 && (
            <div className="fv-card">
              <h2>2. Välj platser</h2>
              <p>Klicka på en stol för att välja den</p>
              <SeatMap seats={data.seats} selectedIds={selectedIds} onToggle={toggle} />
            </div>
          )}
        </div>

          <aside className="fv-booking__aside">
          <div className="fv-card">
            <h2>Din bokning</h2>

            {selectedIds.length > 0 && (
              <div className="fv-selected">
                <span>{screening?.cinema}</span>
                <strong>{selectedLabels}</strong>
              </div>
            )}

            {ticketCount > 0 && (
              <div className="fv-summary">
                {TICKET_TYPES.filter(t => counts[t.type] > 0).map(t => (
                  <div key={t.type} className="fv-summary__row">
                    <span>
                      {counts[t.type]}× {t.label}
                    </span>
                    <span>{formatSek(counts[t.type] * t.price)}</span>
                  </div>
                ))}
                <div className="fv-summary__row fv-summary__row--total">
                  <span>Totalt</span>
                  <span>{formatSek(ticketTotal)}</span>
                </div>
              </div>
            )}

            <p className="fv-notice">
              Ingen onlinebetalning krävs. Biljetterna betalas och hämtas ut i kassan
              senast 15 minuter innan föreställningen börjar.
            </p>
            <button
              className="fv-checkout__btn"
              disabled={ticketCount === 0 || seatsLeft !== 0}
              onClick={() =>
                navigate(
                  `/booking/${id}?seats=${selectedIds.join(',')}&adult=${counts.adult}&senior=${counts.senior}&child=${counts.child}`,
                )
              }
            >
              {ctaLabel}
            </button>
          </div>
        </aside>
      </div>
    </section>
  )
}