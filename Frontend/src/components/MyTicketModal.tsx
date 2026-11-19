import { useTranslation } from '../context/LocaleContext'
import type { Translator } from '../i18n'
import type { Booking } from "../types/booking";
import type { ConfirmationData } from "../types/confirmation";
import { Modal } from "./Modal";
import BookingTicket from "./BookingTicket";
import { getBookingState } from '../utils/bookings';

interface MyTicketModalProps {
  isOpen: boolean;
  booking: Booking | null;
  posterUrl?: string | null;
  onClose: () => void;
  onCancel: (booking: Booking) => void;
  canCancel: boolean;
  currentTime: number;
}

function toTicketData(
  booking: Booking,
  posterUrl: string | null,
  t: Translator,
): ConfirmationData | null {
  const startsAt = booking.screeningStartsAt;
  if (!startsAt || !Number.isFinite(new Date(startsAt).getTime())) return null;

  const ticketLines = new Map<string, { label: string; quantity: number; price: number }>();
  for (const ticket of booking.tickets) {
    const label = ticket.type ?? 'ticket';
    const line = ticketLines.get(label);
    if (line) line.quantity += 1;
    else ticketLines.set(label, { label, quantity: 1, price: ticket.price ?? 0 });
  }

  const tickets = [...ticketLines.values()];
  const kiosk = (booking.items ?? []).map((item) => ({
    name: item.name ?? 'Kioskvara',
    quantity: item.quantity,
    price: item.price ?? 0,
  }));

  return {
    bookingRef: booking.bookingRef,
    movieTitle: booking.movieTitle ?? t('ticket.unknownMovie'),
    posterUrl,
    cinema: booking.cinemaName ?? t('ticket.unknownAuditorium'),
    startsAt,
    endsAt: booking.screeningEndsAt ?? startsAt,
    seats: booking.tickets
      .filter((ticket) => ticket.row && ticket.seatNumber != null)
      .map((ticket) => `Rad ${ticket.row}, Stol ${ticket.seatNumber}`),
    tickets,
    kiosk,
    ticketTotal: tickets.reduce((sum, t) => sum + t.quantity * t.price, 0),
    kioskTotal: kiosk.reduce((sum, k) => sum + k.quantity * k.price, 0),
    total: booking.totalPrice,
    email: booking.email,
  };
}

export default function MyTicketModal({
  isOpen,
  booking,
  posterUrl = null,
  onClose,
  onCancel,
  canCancel,
  currentTime,
}: MyTicketModalProps) {
  const { t } = useTranslation()
  if (!isOpen || !booking) {
    return null;
  }
  const state = getBookingState(booking, currentTime);
  const invalid = state === 'expired' || state === 'cancelled';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t(!booking.isPaid && !invalid ? 'member.reserved' : 'ticket.title')} size="md">
      <Modal.Body className="fv-my-ticket">
        <p className="small text-secondary" role="status">
          {t(state === 'cancelled' ? 'member.cancelledFeedback' : state === 'expired' ? 'member.expiredNote' : booking.isPaid ? 'member.paidNote' : 'member.unpaidNote')}
        </p>
        {!invalid && <div className="fv-ticket fv-ticket--embedded">
          <BookingTicket
            bookingRef={booking.bookingRef}
            data={toTicketData(booking, posterUrl, t)}
            totalLabel={booking.isPaid ? t('ticket.paid') : t('ticket.payAtBoxOffice')}
            onCancel={() => onCancel(booking)}
            canCancel={canCancel}
          />
        </div>}

        <button
          type="button"
          className="btn btn-secondary-outline w-100 mt-3"
          onClick={onClose}
        >
          {t('ticket.close')}
        </button>
      </Modal.Body>
    </Modal>
  );
}
