import { useTranslation } from '../context/LocaleContext'
import { translateTicketType, translateKioskName } from '../i18n/mappers'
import { groupSeatLabels } from '../utils/bookingPresentation'
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
  onCancel?: () => void
  canCancel?: boolean
}

export default function BookingTicket({
  bookingRef,
  data,
  totalLabel,
  onCancel,
  canCancel = true,
}: BookingTicketProps) {
  const { t, locale } = useTranslation()
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
        <p className="fv-ticket__label">{t('ticket.reference')}</p>
        <div className="fv-ticket__codebox">
          <span className="fv-ticket__ref">{bookingRef}</span>
          <button
            type="button"
            className={`fv-ticket__copy ${copied ? 'fv-ticket__copy--done' : ''}`}
            onClick={copy}
            aria-label={t('ticket.copyReference')}
            aria-live="polite"
          >
            <i className={`bi ${copied ? 'bi-check-lg' : 'bi-copy'}`} aria-hidden="true" />
            {copied ? t('ticket.copied') : t('ticket.copy')}
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
                  {formatDateLong(toCinemaIsoDate(data.startsAt), locale)} · {formatTime(data.startsAt, locale)}–
                  {formatTime(data.endsAt, locale)}
                </p>
              </div>
            </div>

            <div className="fv-ticket__seats">
              {groupSeatLabels(data.seats, locale).map(line => (
                <p key={line}>{line}</p>
              ))}
            </div>

            <div className="fv-ticket__prices">
              {data.tickets.map(ticket => (
                <div key={ticket.label} className="fv-ticket__row">
                  <span>
                    {ticket.quantity}× {translateTicketType(ticket.label, locale)}
                  </span>
                  <span>{formatSek(ticket.quantity * ticket.price, locale)}</span>
                </div>
              ))}
              {data.kiosk.map(k => (
                <div key={k.name} className="fv-ticket__row">
                  <span>
                    {k.quantity}× {translateKioskName(k.name, locale)}
                  </span>
                  <span>{formatSek(k.quantity * k.price, locale)}</span>
                </div>
              ))}
              <div className="fv-ticket__row fv-ticket__row--total">
                <span>{totalLabel ?? t('ticket.payAtBoxOffice')}</span>
                <span>{formatSek(data.total, locale)}</span>
              </div>
            </div>

            <div className="fv-ticket__qr">
              <p>{t('ticket.showAtBoxOffice')}</p>
              <div className="fv-ticket__qrbox">
                <QRCodeSVG value={data.bookingRef} size={96} title={t('ticket.qrTitle')} />
              </div>
              <span>{data.bookingRef}</span>
            </div>

            <button type="button" className="fv-ticket__btn" onClick={() => window.print()}>
              {t('ticket.print')}
            </button>

            {onCancel ? (
              <>
                <button type="button" className="btn btn-danger fv-ticket__cancel" onClick={onCancel}
                  disabled={!canCancel} aria-describedby={!canCancel ? 'ticket-cancel-deadline' : undefined}>
                  {t('ticket.cancel')}
                </button>
                {!canCancel && <p id="ticket-cancel-deadline" className="small text-secondary" role="status">
                  {t('cancellation.deadline')}
                </p>}
              </>
            ) : (
              <Link
                className="btn btn-danger fv-ticket__cancel"
                to="/avboka"
                state={{ bookingRef: data.bookingRef, email: data.email }}
              >
                {t('ticket.cancel')}
              </Link>
            )}
          </div>
        </>
      ) : (
        <div className="fv-ticket__body">
          <p>{t('ticket.missingDetails')}</p>
        </div>
      )}
    </>
  )
}

