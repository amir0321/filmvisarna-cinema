import { useCallback, useState } from 'react'
import { useTranslation } from '../../context/LocaleContext'
import { getScreeningSeats } from '../../api/screeningSeats'
import { useFetch } from '../../hooks/useFetch'
import { Modal } from '../Modal'
import SeatMap from '../SeatMap'
import type { Booking } from '../../types/booking'
import type { SeatsResponse } from '../../types/screeningSeat'

interface ReseatModalProps {
  booking: Booking
  paying: boolean
  error: string | null
  // Returns true when the payment went through
  onConfirm: (seatIds: number[]) => Promise<boolean>
  onClose: () => void
}

export default function ReseatModal({ booking, paying, error, onConfirm, onClose }: ReseatModalProps) {
  const { t } = useTranslation()
  const needed = booking.tickets.length

  const fetchSeats = useCallback(() => getScreeningSeats(booking.screeningId), [booking.screeningId])
  const { data, loading, error: loadError, refetch } = useFetch<SeatsResponse>(fetchSeats)

  // null = the admin has not touched the map yet
  const [picked, setPicked] = useState<number[] | null>(null)

  const seats = data?.seats ?? []
  const freeIds = new Set(seats.filter((seat) => seat.status === 'available').map((seat) => seat.id))
  // Start with the booking's old seats that are still free
  const selected =
    picked ?? booking.tickets.map((ticket) => ticket.seatId).filter((id) => freeIds.has(id))

  const toggle = (seatId: number) => {
    if (selected.includes(seatId)) setPicked(selected.filter((id) => id !== seatId))
    else if (selected.length < needed) setPicked([...selected, seatId])
  }

  async function submit() {
    const ok = await onConfirm(selected)
    if (!ok) {
      // Seats may have changed again: start over with fresh data
      setPicked(null)
      refetch()
    }
  }

  return (
    <Modal
      isOpen
      onClose={paying ? () => {} : onClose}
      size="lg"
      title={t('admin.bookings.reseat.title')}
      id="reseat-modal"
    >
      <Modal.Body>
        <p>{t('admin.bookings.reseat.description', { ref: booking.bookingRef, count: needed })}</p>

        {loading && !data && <p role="status">{t('admin.bookings.reseat.loading')}</p>}
        {loadError && <p role="alert">{t('admin.bookings.reseat.loadError')}</p>}
        {data && <SeatMap seats={seats} selectedIds={selected} onToggle={toggle} />}

        <p className="fv-side__muted" role="status">
          {t('admin.bookings.reseat.selected', { selected: selected.length, count: needed })}
        </p>
        {error && (
          <div className="alert alert-danger py-2 px-3 small mb-0" role="alert">
            {error}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary-outline" onClick={onClose} disabled={paying}>
          {t('admin.bookings.reseat.cancel')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={paying || selected.length !== needed}
          onClick={submit}
        >
          {t('admin.bookings.reseat.confirm')}
        </button>
      </Modal.Footer>
    </Modal>
  )
}