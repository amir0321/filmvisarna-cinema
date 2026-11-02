import type { Booking } from "../types/booking";
import { Poster } from "./Poster";

export interface MyBookingCardProps {
  booking: Booking;
  posterUrl?: string | null;
}

export default function MyBookingCard({
  booking,
  posterUrl,
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
    <article
      className="card mb-3 overflow-hidden"
      style={{
        backgroundColor: "#161F30",
        borderRadius: 16,
        border: "1px solid rgba(255, 255, 255, 0.08)",
        color: "#F8FAFC",
      }}
    >
      <div
        className="d-flex justify-content-between align-items-center gap-2 px-3 py-2"
        style={{
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          color: "#10B981",
        }}
      >
        <span className="fw-semibold small">
          {status === "confirmed"
            ? "Kommande föreställning"
            : "Tidigare bokning"}
        </span>

        <span className="small fw-semibold">{bookingRef}</span>
      </div>
      <div className="card-body">
        <div className="d-flex gap-3 align-items-start mb-3">
          <div
            className="flex-shrink-0 overflow-hidden rounded"
            style={{ width: 56, height: 84 }}
          >
            <Poster
              src={posterUrl}
              alt={movieTitle ?? "Filmposter"}
              title={movieTitle ?? "Film"}
              aspectRatio="2/3"
              className="w-100 h-100"
            />
          </div>

          <div className="flex-grow-1">
            <h3 className="h5 fw-bold mb-1">{movieTitle ?? "Okänd film"}</h3>
            <p className="text-secondary small mb-0">
              {cinemaHall} · {showtime}
            </p>
          </div>
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
