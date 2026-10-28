import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  cancellationService,
  mapCancelErrorToState,
  type CancelPageState,
} from '../api/cancellations'
import { ApiError } from '../api/client'
import { CancelBookingModal } from '../components/CancelBookingModal'
import { EmptyState } from '../components/EmptyState'
import { Poster } from '../components/Poster'
import { capitalize, formatDateLong, formatTime, toCinemaIsoDate } from '../utils/date'
import type { CancelPreviewResult } from '../types/booking'

function formatScreeningDateTime(startsAt?: string): {
  date: string
  time: string
} {
  if (!startsAt) return { date: '', time: '' }
  try {
    const isoDate = toCinemaIsoDate(startsAt)
    return {
      date: capitalize(formatDateLong(isoDate)),
      time: formatTime(startsAt),
    }
  } catch {
    return { date: startsAt, time: '' }
  }
}

export default function CancelBooking() {
  const navigate = useNavigate()
  const { token: routeToken } = useParams<{ token?: string }>()
  const [searchParams] = useSearchParams()
  const token = (routeToken || searchParams.get('token') || '').trim()

  const [state, setState] = useState<CancelPageState>(() =>
    token ? 'loading' : 'invalid_token',
  )
  const [booking, setBooking] = useState<CancelPreviewResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(true)

  useEffect(() => {
    if (!token) return

    let isMounted = true

    cancellationService
      .getCancelPreview(token)
      .then((preview) => {
        if (!isMounted) return
        setBooking(preview)
        setState('confirm')
        setIsModalOpen(true)
      })
      .catch((err) => {
        if (!isMounted) return
        const nextState = mapCancelErrorToState(err)
        setState(nextState)
        if (err instanceof ApiError) {
          setErrorMessage(err.message)
        } else if (err instanceof Error) {
          setErrorMessage(err.message)
        } else {
          setErrorMessage('Ett oväntat fel uppstod.')
        }
      })

    return () => {
      isMounted = false
    }
  }, [token])

  const handleRetry = () => {
    if (!token) {
      setState('invalid_token')
      return
    }

    setState('loading')
    setErrorMessage(null)
    setActionError(null)

    cancellationService
      .getCancelPreview(token)
      .then((preview) => {
        setBooking(preview)
        setState('confirm')
        setIsModalOpen(true)
      })
      .catch((err) => {
        const nextState = mapCancelErrorToState(err)
        setState(nextState)
        if (err instanceof ApiError) {
          setErrorMessage(err.message)
        } else if (err instanceof Error) {
          setErrorMessage(err.message)
        } else {
          setErrorMessage('Ett oväntat fel uppstod.')
        }
      })
  }

  const handleConfirmCancel = async () => {
    if (!token) return

    setState('cancelling')
    setActionError(null)

    try {
      await cancellationService.cancelByToken(token)
      setState('success')
      setIsModalOpen(false)
    } catch (err) {
      const mapped = mapCancelErrorToState(err)
      if (mapped !== 'error') {
        setState(mapped)
        setIsModalOpen(false)
      } else {
        setState('confirm')
        setActionError(
          err instanceof ApiError
            ? err.message
            : 'Ett fel inträffade vid avbokningen. Försök igen.',
        )
      }
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const { date: formattedDate, time: formattedTime } = formatScreeningDateTime(
    booking?.screeningStartsAt,
  )

  return (
    <div className="fv-cancel-page">
      {/* 1. Loading State */}
      {state === 'loading' && (
        <div className="fv-cancel-receipt-card text-center p-5">
          <div className="spinner-border text-danger mb-3" role="status">
            <span className="visually-hidden">Laddar...</span>
          </div>
          <h1 className="h4 fw-bold text-light mb-2">Hämtar bokningsinformation...</h1>
          <p className="text-secondary small mb-0">
            Vänligen vänta medan vi kontrollerar din avbokningslänk.
          </p>
        </div>
      )}

      {/* 2. Success State */}
      {state === 'success' && (
        <div className="fv-cancel-receipt-card p-4 p-md-5 text-center">
          <div className="fv-cancel-success-icon" aria-hidden="true">
            <i className="bi bi-check-circle-fill" />
          </div>

          <h1 className="h3 fw-bold text-light mb-2">Bokningen är avbokad</h1>
          <p className="text-secondary mb-4">
            Din bokning med referens{' '}
            <strong className="text-light font-monospace">
              {booking?.bookingRef}
            </strong>{' '}
            har nu avbokats och dina platser har släppts. En bekräftelse har
            skickats till din e-postadress.
          </p>

          {booking ? (
            <div
              className="fv-cancel-booking-card p-3 rounded-3 text-start mb-4 border mx-auto"
              style={{ maxWidth: '440px' }}
            >
              <div className="fw-bold text-light mb-1">{booking.movieTitle}</div>
              <div className="text-secondary small mb-1">
                <i className="bi bi-calendar3 me-2" aria-hidden="true" />
                {formattedDate} {formattedTime ? `kl. ${formattedTime}` : ''}
              </div>
              <div className="text-secondary small mb-2">
                <i className="bi bi-geo-alt me-2" aria-hidden="true" />
                {booking.cinemaName}
              </div>
              {booking.seats?.length ? (
                <div className="d-flex flex-wrap gap-1 mt-2">
                  {booking.seats.map((seat, i) => (
                    <span
                      key={i}
                      className="badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-50 fw-normal"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="d-flex justify-content-center">
            <Link to="/" className="btn btn-danger px-4 py-2 fw-semibold">
              Tillbaka till startsidan
            </Link>
          </div>
        </div>
      )}

      {/* 3. Confirm / Modal Active State */}
      {(state === 'confirm' || state === 'cancelling') && booking && (
        <>
          <CancelBookingModal
            isOpen={isModalOpen}
            booking={booking}
            isSubmitting={state === 'cancelling'}
            error={actionError}
            onConfirm={handleConfirmCancel}
            onClose={handleModalClose}
          />

          <div className="fv-cancel-receipt-card p-4 p-md-5">
            <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-secondary border-opacity-25">
              <div>
                <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-50 px-2 py-1 mb-2">
                  Bokningsdetaljer
                </span>
                <h1 className="h4 fw-bold text-light mb-0">Din biobokning</h1>
              </div>
              <div className="text-end">
                <span className="text-secondary small d-block">Referens</span>
                <span className="font-monospace fw-bold text-light">
                  {booking.bookingRef}
                </span>
              </div>
            </div>

            <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
              {booking.posterUrl ? (
                <div
                  className="rounded overflow-hidden flex-shrink-0"
                  style={{ width: '80px', height: '120px' }}
                >
                  <Poster
                    src={booking.posterUrl}
                    alt={booking.movieTitle}
                    aspectRatio="2/3"
                    className="w-100 h-100"
                  />
                </div>
              ) : null}

              <div className="flex-grow-1">
                <h2 className="h5 fw-bold text-light mb-2">{booking.movieTitle}</h2>
                <div className="text-secondary small mb-1">
                  <i className="bi bi-calendar3 me-2" aria-hidden="true" />
                  {formattedDate} {formattedTime ? `kl. ${formattedTime}` : ''}
                </div>
                <div className="text-secondary small mb-2">
                  <i className="bi bi-geo-alt me-2" aria-hidden="true" />
                  {booking.cinemaName}
                </div>

                {booking.seats?.length ? (
                  <div className="mt-2">
                    <span className="text-secondary small me-2">Platser:</span>
                    <div className="d-inline-flex flex-wrap gap-1 mt-1">
                      {booking.seats.map((seat, idx) => (
                        <span
                          key={idx}
                          className="badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-50 fw-normal"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {!isModalOpen ? (
              <div className="alert alert-secondary bg-dark-subtle border-secondary border-opacity-25 p-3 rounded-3 mb-4">
                <div className="d-flex align-items-center gap-2 text-light fw-medium mb-1">
                  <i className="bi bi-info-circle text-info" aria-hidden="true" />
                  <span>Bokningen behölls</span>
                </div>
                <p className="text-secondary small mb-0">
                  Du stängde avbokningsdialogen. Din bokning är fortfarande
                  gällande. Vill du fortfarande avboka kan du öppna dialogen
                  igen nedan.
                </p>
              </div>
            ) : null}

            <div className="d-flex flex-column flex-sm-row justify-content-between gap-2 pt-2 border-top border-secondary border-opacity-25">
              <button
                type="button"
                className="btn btn-outline-secondary px-4 py-2"
                onClick={() => navigate('/')}
              >
                Gå till startsidan
              </button>

              <button
                type="button"
                className="btn btn-danger px-4 py-2 fw-semibold"
                onClick={() => setIsModalOpen(true)}
              >
                Öppna avbokningsdialog
              </button>
            </div>
          </div>
        </>
      )}

      {/* 4. Error State: Invalid Token */}
      {state === 'invalid_token' && (
        <EmptyState
          variant="error"
          icon="bi-link-45deg"
          title="Ogiltig avbokningslänk"
          description="Länken eller koden för avbokning är ogiltig eller saknas. Kontrollera att du använde hela länken från ditt bekräftelsemejl."
          actionLabel="Till startsidan"
          actionTo="/"
        />
      )}

      {/* 5. Error State: Expired (Screening already passed) */}
      {state === 'expired' && (
        <EmptyState
          variant="warning"
          icon="bi-calendar-x"
          title="Visningen har redan varit"
          description="Det går inte längre att avboka denna visning eftersom föreställningens datum och starttid redan har passerats."
          actionLabel="Se repertoaren"
          actionTo="/movies"
        />
      )}

      {/* 6. Error State: Too Late (< 2 hours before screening) */}
      {state === 'too_late' && (
        <EmptyState
          variant="warning"
          icon="bi-hourglass-bottom"
          title="För sent att avboka online"
          description="Avbokning via webben måste ske senast 2 timmar innan visningen startar. Eftersom det nu är mindre än två timmar kvar kan bokningen inte avbokas digitalt. Vänligen kontakta personalen på biografen om du har frågor."
          actionLabel="Till startsidan"
          actionTo="/"
        />
      )}

      {/* 7. Error State: Already Cancelled */}
      {state === 'already_cancelled' && (
        <EmptyState
          variant="info"
          icon="bi-check2-circle"
          title="Redan avbokad"
          description="Denna bokning har redan blivit avbokad tidigare. Platserna är frigjorda och du behöver inte göra något mer."
          actionLabel="Till startsidan"
          actionTo="/"
        />
      )}

      {/* 8. Technical / Server Error */}
      {state === 'error' && (
        <EmptyState
          variant="error"
          icon="bi-exclamation-triangle"
          title="Något gick fel"
          description={
            errorMessage ||
            'Ett tekniskt fel inträffade vid hämtning av bokningen. Vänligen kontrollera din anslutning och försök igen.'
          }
        >
          <div className="d-flex flex-wrap gap-2 justify-content-center mt-2 mb-3">
            <button
              type="button"
              className="btn btn-outline-danger px-4"
              onClick={handleRetry}
            >
              Försök igen
            </button>
            <Link to="/" className="btn btn-secondary px-4">
              Till startsidan
            </Link>
          </div>
        </EmptyState>
      )}
    </div>
  )
}
