import type { Booking } from "../types/booking";
import { Poster } from "./Poster";
import { canCancelBooking, getBookingState } from "../utils/bookings";

export interface MyBookingCardProps {
  booking: Booking;
  onViewTicket?: (booking: Booking) => void;
  onCancel?: (booking: Booking) => void;
  currentTime: number;
  posterUrl?: string | null;
}

export default function MyBookingCard({
  booking,
  onViewTicket,
  onCancel,
  currentTime,
  posterUrl,
}: MyBookingCardProps) {
  const {
    bookingRef,
    movieTitle,
    cinemaName,
    screeningStartsAt,
    tickets,
    totalPrice,
    items,
  } = booking;

  const hasKioskPreorder = (items?.length ?? 0) > 0;

  const cinemaHall = cinemaName ?? "Salong ej angiven";

  const startsAt = new Date(screeningStartsAt ?? '');
  const showtime = Number.isFinite(startsAt.getTime())
    ? new Intl.DateTimeFormat("sv-SE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Stockholm",
      }).format(startsAt)
    : "Tid ej angiven";
  const bookingState = getBookingState(booking, currentTime);
  const statusLabel = {
    upcoming: "Kommande föreställning",
    past: "Tidigare föreställning",
    cancelled: "Avbokad",
    unknown: "Tid ej angiven",
  }[bookingState];
  const formattedPrice = new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
  }).format(totalPrice);

  const seats = tickets.map((ticket) => {
    if (ticket.row && ticket.seatNumber != null) {
      return `Rad ${ticket.row}, plats ${ticket.seatNumber}`;
    }

    return `Plats-ID ${ticket.seatId}`;
  });
  const canCancel = canCancelBooking(booking, currentTime);
  const deadlineId = `booking-${booking.id}-cancel-deadline`;
  return (
    <article className={`fv-my-booking-card card mb-3 overflow-hidden fv-my-booking-card--${bookingState}`}>
      <div className="fv-my-booking-card__status d-flex flex-wrap justify-content-between align-items-center gap-2 px-3 py-2">
        <span className="fw-semibold small">
          {statusLabel}
        </span>

        <span className="small fw-semibold">{bookingRef}</span>
      </div>
      <div className="fv-my-booking-card__body">
        <div className="d-flex gap-3 align-items-start mb-3">
          <div
            className="fv-my-booking-card__poster flex-shrink-0 overflow-hidden rounded"
          >
            <Poster
              src={posterUrl}
              alt={movieTitle ?? "Filmposter"}
              title={movieTitle ?? "Film"}
              aspectRatio="2/3"
              className="w-100 h-100"
            />
          </div>

          <div className="fv-my-booking-card__details flex-grow-1">
            <h3 className="h5 fw-bold mb-1">{movieTitle ?? "Okänd film"}</h3>
            <p className="text-secondary small mb-0">
              {cinemaHall} · {showtime}
            </p>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <p className="text-secondary mb-1">Platser</p>
            <p className="fw-semibold mb-0">{seats.join(", ") || "Inga platser registrerade"}</p>
          </div>

          <div className="col-md-6">
            <p className="text-secondary mb-1">Totalt pris</p>
            <p className="fw-semibold mb-0">{formattedPrice}</p>
          </div>
        </div>

        {hasKioskPreorder && (
          <span className="fv-my-booking-card__kiosk badge">
            Kioskförbeställning ingår
          </span>
        )}
        <div className="d-flex flex-wrap gap-2 mt-3">
          {booking.status === "confirmed" && onViewTicket && (
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={() => onViewTicket?.(booking)}
              disabled={!onViewTicket}
            >
              Visa biljett
            </button>
          )}

          {bookingState === "upcoming" && onCancel && (
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => onCancel?.(booking)}
              disabled={!canCancel || !onCancel}
              aria-describedby={!canCancel ? deadlineId : undefined}
            >
              Avboka
            </button>
          )}
        </div>
        {bookingState === "upcoming" && onCancel && !canCancel && (
          <p id={deadlineId} className="small text-secondary mt-2 mb-0">
            Avbokning måste ske minst två timmar före visningen.
          </p>
        )}
      </div>
    </article>
  );
}
