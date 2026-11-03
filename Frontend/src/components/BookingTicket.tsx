import { useState } from 'react'
import { Link } from 'react-router'
import { QRCodeSVG } from 'qrcode.react'
import type { ConfirmationData } from '../types/confirmation'
import { formatDateLong, formatTime, toCinemaIsoDate } from '../utils/date'
import { formatSek } from '../utils/price'

interface BookingTicketProps {
  bookingRef: string
  data: ConfirmationData | null
  totalLabel?: string
}

// "Rad E, Stol 1" + "Rad E, Stol 2" → "Rad E: Stol 1, 2"
function groupSeats(seats: string[]): string[] {
  const rows = new Map<string, string[]>()
  for (const s of seats) {
    const m = s.match(/^Rad (\S+), Stol (\d+)$/)
    if (!m) continue
    rows.set(m[1], [...(rows.get(m[1]) ?? []), m[2]])
  }
  return [...rows.entries()].map(([row, nums]) => `Rad ${row}: Stol ${nums.join(', ')}`)
}

export default function BookingTicket({
  bookingRef,
  data,
  totalLabel = 'Att betala i kassan',
}: BookingTicketProps) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard
      .writeText(bookingRef)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => undefined)
  }

  return (
    <>
      <div className="fv-ticket__code">
        <p className="fv-ticket__label">Bokningskod</p>
        <div className="fv-ticket__codebox">
          <span className="fv-ticket__ref">{bookingRef}</span>
          <button
            type="button"
            className={`fv-ticket__copy ${copied ? 'fv-ticket__copy--done' : ''}`}
            onClick={copy}
          >
            <i className={`bi ${copied ? 'bi-check-lg' : 'bi-copy'}`} aria-hidden="true" />
            {copied ? 'Kopierat' : 'Kopiera'}
          </button>
        </div>
      </div>

      {data ? (
        <>
          <div className="fv-ticket__divider" aria-hidden="true" />
          <div className="fv-ticket__body">
            <div className="fv-ticket__movie">
              {data.posterUrl && <img src={data.posterUrl} alt={data.movieTitle} />}
              <div>
                <h2>{data.movieTitle}</h2>
                <p>{data.cinema}</p>
                <p className="fv-ticket__time">
                  {formatDateLong(toCinemaIsoDate(data.startsAt))} · {formatTime(data.startsAt)}–
                  {formatTime(data.endsAt)}
                </p>
              </div>
            </div>

            <div className="fv-ticket__seats">
              {groupSeats(data.seats).map(line => (
                <p key={line}>{line}</p>
              ))}
            </div>

            <div className="fv-ticket__prices">
              {data.tickets.map(t => (
                <div key={t.label} className="fv-ticket__row">
                  <span>
                    {t.quantity}× {t.label}
                  </span>
                  <span>{formatSek(t.quantity * t.price)}</span>
                </div>
              ))}
              {data.kiosk.map(k => (
                <div key={k.name} className="fv-ticket__row">
                  <span>
                    {k.quantity}× {k.name}
                  </span>
                  <span>{formatSek(k.quantity * k.price)}</span>
                </div>
              ))}
              <div className="fv-ticket__row fv-ticket__row--total">
                <span>{totalLabel}</span>
                <span>{formatSek(data.total)}</span>
              </div>
            </div>

            <div className="fv-ticket__qr">
              <p>Visa upp vid kassan</p>
              <div className="fv-ticket__qrbox">
                <QRCodeSVG value={data.bookingRef} size={96} title="QR-kod med bokningsreferens" />
              </div>
              <span>{data.bookingRef}</span>
            </div>

            <button type="button" className="fv-ticket__btn" onClick={() => window.print()}>
              Skriv ut / Spara som PDF
            </button>

            {data.cancelToken && (
              <Link
                className="fv-ticket__cancel"
                to={`/avboka?token=${encodeURIComponent(data.cancelToken)}`}
              >
                Avboka biljett
              </Link>
            )}
          </div>
        </>
      ) : (
        <div className="fv-ticket__body">
          <p>Bokningsdetaljerna finns inte kvar i den här webbläsaren. Kolla din e-post.</p>
        </div>
      )}
    </>
  )
}

