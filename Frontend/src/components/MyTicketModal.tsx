import type { Booking } from "../types/booking";
import { Modal } from "./Modal";
import { QRCodeSVG } from "qrcode.react";

interface MyTicketModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
}

export default function MyTicketModal({
  isOpen,
  booking,
  onClose,
}: MyTicketModalProps) {
  if (!isOpen || !booking) {
    return null;
  }

  const showtime = booking.screeningStartsAt
    ? new Date(booking.screeningStartsAt).toLocaleString("sv-SE")
    : "Tid ej angiven";

  const seats = booking.tickets.map((ticket) =>
    ticket.row && ticket.seatNumber != null
      ? `Rad ${ticket.row}, plats ${ticket.seatNumber}`
      : `Plats-ID ${ticket.seatId}`,
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Din biljett" size="md">
      <div className="p-4">
        <h3 className="h5 fw-bold mb-3">
          {booking.movieTitle ?? "Okänd film"}
        </h3>

        <p>
          <strong>Bokningsnummer:</strong> {booking.bookingRef}
        </p>
        <div className="text-center my-4">
          <div className="d-inline-block bg-white p-3 rounded">
            <QRCodeSVG value={booking.bookingRef} size={180} level="M" />
          </div>
          <p className="text-secondary small mt-2">
            Bokningsreferens: {booking.bookingRef}
          </p>
        </div>
        <p>
          <strong>Biograf:</strong> {booking.cinemaName ?? "Ej angiven"}
        </p>

        <p>
          <strong>Föreställning:</strong> {showtime}
        </p>

        <p>
          <strong>Platser:</strong> {seats.join(", ") || "Ej angivna"}
        </p>

        <p>
          <strong>Totalt pris:</strong> {booking.totalPrice} kr
        </p>

        <button
          type="button"
          className="btn btn-outline-secondary mt-3"
          onClick={onClose}
        >
          Stäng
        </button>
      </div>
    </Modal>
  );
}
