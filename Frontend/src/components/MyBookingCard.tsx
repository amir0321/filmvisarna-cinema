import type { Booking } from "../types/booking";

export interface MyBookingCardProps {
  booking: Booking;
}

export default function MyBookingCard({ booking }: MyBookingCardProps) {
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
      </div>
    </article>
  );
}
