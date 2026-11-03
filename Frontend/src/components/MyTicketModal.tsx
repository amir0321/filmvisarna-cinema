import type { Booking } from "../types/booking";
import type { ConfirmationData } from "../types/confirmation";
import { Modal } from "./Modal";
import BookingTicket from "./BookingTicket";

interface MyTicketModalProps {
  isOpen: boolean;
  booking: Booking | null;
  posterUrl?: string | null;
  onClose: () => void;
}

function toTicketData(
  booking: Booking,
  posterUrl: string | null,
): ConfirmationData | null {
  const startsAt = booking.screeningStartsAt;
  if (!startsAt || !Number.isFinite(new Date(startsAt).getTime())) return null;

  const ticketLines = new Map<string, { label: string; quantity: number; price: number }>();
  for (const ticket of booking.tickets) {
    const label = ticket.type ?? "Biljett";
    const line = ticketLines.get(label);
    if (line) line.quantity += 1;
    else ticketLines.set(label, { label, quantity: 1, price: ticket.price ?? 0 });
  }

  const tickets = [...ticketLines.values()];
  const kiosk = (booking.items ?? []).map((item) => ({
    name: item.name ?? "Kioskvara",
    quantity: item.quantity,
    price: item.price ?? 0,
  }));

  return {
    bookingRef: booking.bookingRef,
    movieTitle: booking.movieTitle ?? "Okänd film",
    posterUrl,
    cinema: booking.cinemaName ?? "Okänd salong",
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
}: MyTicketModalProps) {
  if (!isOpen || !booking) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Din biljett" size="md">
      <Modal.Body className="fv-my-ticket">
        <div className="fv-ticket fv-ticket--embedded">
          <BookingTicket
            bookingRef={booking.bookingRef}
            data={toTicketData(booking, posterUrl)}
            totalLabel={booking.isPaid ? "Betalt" : "Att betala i kassan"}
          />
        </div>

        <button
          type="button"
          className="btn btn-outline-light w-100 mt-3"
          onClick={onClose}
        >
          Stäng biljett
        </button>
      </Modal.Body>
    </Modal>
  );
}
