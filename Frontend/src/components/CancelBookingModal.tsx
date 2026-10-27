import React from 'react'
import { Modal } from './Modal'
import { Poster } from './Poster'
import { capitalize, formatDateLong, formatTime, toCinemaIsoDate } from '../utils/date'
import type { CancelBookingDetails } from '../types/booking'

export interface CancelBookingModalProps {
  isOpen: boolean
  booking: CancelBookingDetails | null
  isSubmitting?: boolean
  error?: string | null
  onConfirm: () => void | Promise<void>
  onClose: () => void
  confirmLabel?: string
  cancelLabel?: string
}

export function CancelBookingModal({
  isOpen,
  booking,
  isSubmitting = false,
  error = null,
  onConfirm,
  onClose,
  confirmLabel = 'Bekräfta avbokning',
  cancelLabel = 'Behåll bokning',
}: CancelBookingModalProps) {
  if (!isOpen || !booking) {
    return null
  }

  // Format date and time
  let formattedDate: string
  let formattedTime = ''
  try {
    const isoDate = toCinemaIsoDate(booking.screeningStartsAt)
    formattedDate = capitalize(formatDateLong(isoDate))
    formattedTime = formatTime(booking.screeningStartsAt)
  } catch {
    formattedDate = booking.screeningStartsAt
  }

  const handleConfirmClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (isSubmitting) return
    await onConfirm()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      size="md"
      className="fv-cancel-booking-modal"
      id="cancel-booking-modal"
    >
      <div className="p-4 p-md-4">
        {/* Warning Icon & Heading */}
        <div className="d-flex align-items-center gap-3 mb-3">
          <div
            className="fv-cancel-modal-icon-badge flex-shrink-0"
            aria-hidden="true"
          >
            <i className="bi bi-exclamation-triangle-fill text-danger fs-4" />
          </div>
          <div>
            <h2 id="cancel-booking-modal-title" className="h5 fw-bold mb-1 text-light">
              Är du säker på att du vill avboka?
            </h2>
            <p className="text-secondary small mb-0">
              Denna åtgärd kan inte ångras och dina reserverade platser släpps fria.
            </p>
          </div>
        </div>

        {/* Booking Details Card */}
        <div className="fv-cancel-booking-card p-3 rounded-3 mb-3 border">
          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-25">
            <span className="text-secondary small">Bokningsnummer</span>
            <span className="font-monospace fw-bold text-light letter-spacing-1">
              {booking.bookingRef}
            </span>
          </div>

          <div className="d-flex gap-3 align-items-start mt-2">
            {booking.posterUrl ? (
              <div
                className="flex-shrink-0 rounded overflow-hidden"
                style={{ width: '56px', height: '84px' }}
              >
                <Poster
                  src={booking.posterUrl}
                  alt={booking.movieTitle}
                  aspectRatio="2/3"
                  className="w-100 h-100"
                />
              </div>
            ) : null}

            <div className="flex-grow-1 min-w-0">
              <h3 className="h6 fw-bold text-light mb-1 text-truncate">
                {booking.movieTitle}
              </h3>

              <div className="text-secondary small mb-1 d-flex align-items-center gap-2">
                <i className="bi bi-calendar3" aria-hidden="true" />
                <span>
                  {formattedDate} {formattedTime ? `· kl. ${formattedTime}` : ''}
                </span>
              </div>

              <div className="text-secondary small mb-2 d-flex align-items-center gap-2">
                <i className="bi bi-geo-alt" aria-hidden="true" />
                <span>{booking.cinemaName}</span>
              </div>

              {booking.seats && booking.seats.length > 0 ? (
                <div className="mt-2">
                  <div className="text-secondary extra-small mb-1">Valda platser:</div>
                  <div className="d-flex flex-wrap gap-1">
                    {booking.seats.map((seat, index) => (
                      <span
                        key={index}
                        className="badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-50 fw-normal px-2 py-1"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Error notification if submit failed */}
        {error ? (
          <div
            className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small mb-3"
            role="alert"
          >
            <i className="bi bi-exclamation-octagon flex-shrink-0" aria-hidden="true" />
            <div>{error}</div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="d-flex flex-column-reverse flex-sm-row justify-content-end gap-2 pt-2">
          <button
            type="button"
            className="btn btn-outline-secondary px-4 py-2"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-danger px-4 py-2 d-inline-flex align-items-center justify-content-center gap-2 fw-semibold"
            onClick={handleConfirmClick}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                />
                <span>Avbokar...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default CancelBookingModal
