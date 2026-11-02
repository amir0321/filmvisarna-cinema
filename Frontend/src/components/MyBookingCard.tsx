import type { Booking } from "../types/booking";

export interface MyBookingCardProps {
  booking: Booking;
  onViewTicket?: (booking: Booking) => void;
  onCancel?: (booking: Booking) => void;
  currentTime: number;
}

export default function MyBookingCard({
  booking,
  onViewTicket,
  onCancel,
  currentTime,
}: MyBookingCardProps) {
  const {
    bookingRef,
    movieTitle,
    cinemaName,
    screeningStartsAt,
    tickets,
    totalPrice,
    status,
    items,
  } = booking;

  const hasKioskPreorder = (items?.length ?? 0) > 0;
  const bookingNumber = bookingRef;
  const cinemaHall = cinemaName ?? "Salong ej angiven";

  const showtime = screeningStartsAt
    ? new Date(screeningStartsAt).toLocaleString("sv-SE")
    : "Tid ej angiven";

  const seats = tickets.map((ticket) => {
    if (ticket.row && ticket.seatNumber != null) {
      return `Rad ${ticket.row}, plats ${ticket.seatNumber}`;
    }

    return `Plats-ID ${ticket.seatId}`;
  });
  const isConfirmed = status === "confirmed";

  const startsAt = screeningStartsAt
    ? new Date(screeningStartsAt).getTime()
    : NaN;

  const canCancel =
    isConfirmed &&
    currentTime > 0 &&
    Number.isFinite(startsAt) &&
    startsAt - currentTime >= 2 * 60 * 60 * 1000;
  return (
    <article className="card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h3 className="h5 fw-bold mb-1">{movieTitle}</h3>
            <p className="text-secondary mb-0">
              Bokningsnummer: {bookingNumber}
            </p>
          </div>

          <span className="badge bg-secondary">{status}</span>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <p className="text-secondary mb-1">Salong</p>
            <p className="fw-semibold mb-0">{cinemaHall}</p>
          </div>

          <div className="col-md-6">
            <p className="text-secondary mb-1">Föreställning</p>
            <p className="fw-semibold mb-0">{showtime}</p>
          </div>

          <div className="col-md-6">
            <p className="text-secondary mb-1">Platser</p>
            <p className="fw-semibold mb-0">{seats.join(", ")}</p>
          </div>

          <div className="col-md-6">
            <p className="text-secondary mb-1">Totalt pris</p>
            <p className="fw-semibold mb-0">{totalPrice} kr</p>
          </div>
        </div>

        {hasKioskPreorder && (
          <span className="badge bg-info text-dark">
            Kioskförbeställning ingår
          </span>
        )}
        <div className="d-flex flex-wrap gap-2 mt-3">
          {isConfirmed && (
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={() => onViewTicket?.(booking)}
              disabled={!onViewTicket}
            >
              Visa biljett
            </button>
          )}

          {isConfirmed && (
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => onCancel?.(booking)}
              disabled={!canCancel || !onCancel}
              title={
                !canCancel
                  ? "Avbokning måste ske minst två timmar före visningen."
                  : undefined
              }
            >
              Avboka
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
