import type { Booking } from "../types/booking";
import { Modal } from "./Modal";
import { QRCodeSVG } from "qrcode.react";
import { CINEMA_TIME_ZONE } from "../utils/date";
import { formatSek } from "../utils/price";

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

  const startsAt = new Date(booking.screeningStartsAt ?? '');
  const showtime = Number.isFinite(startsAt.getTime())
    ? startsAt.toLocaleString("sv-SE", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: CINEMA_TIME_ZONE,
      })
    : "Tid ej angiven";

  const seats = booking.tickets.map((ticket) =>
    ticket.row && ticket.seatNumber != null
      ? `Rad ${ticket.row}, plats ${ticket.seatNumber}`
      : `Plats-ID ${ticket.seatId}`,
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Din biljett" size="md">
      <Modal.Body className="fv-my-ticket p-3 p-sm-4">
        <div
          className="overflow-hidden"
          style={{
            backgroundColor: "#161F30",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            color: "#F8FAFC",
          }}
        >
          {/* Ticket header */}
          <div
            className="p-3 p-sm-4"
            style={{
              borderTop: "4px solid #E50914",
            }}
          >
            <div className="d-flex justify-content-between align-items-center gap-2 mb-4">
              <span
                className="fw-bold"
                style={{
                  letterSpacing: 2,
                  fontSize: 14,
                }}
              >
                FILMVISARNA
                <span style={{ color: "#E50914" }}> ●</span>
              </span>
              <span className="small fw-semibold" style={{ color: "#94A3B8" }}>
                BIOBILJETT
              </span>
            </div>

            <h3 className="h4 fw-bold mb-2">
              {booking.movieTitle ?? "Okänd film"}
            </h3>

            <p className="mb-4" style={{ color: "#94A3B8" }}>
              <i className="bi bi-calendar3 me-2" aria-hidden="true" />
              {showtime}
            </p>

            <div className="row g-3">
              <div className="col-6">
                <p className="small mb-1" style={{ color: "#94A3B8" }}>
                  BIOGRAF
                </p>
                <p className="fw-semibold mb-0">
                  {booking.cinemaName ?? "Ej angiven"}
                </p>
              </div>

              <div className="col-6">
                <p className="small mb-1" style={{ color: "#94A3B8" }}>
                  TOTALPRIS
                </p>
                <p className="fw-semibold mb-0">{formatSek(booking.totalPrice)}</p>
              </div>

              <div className="col-12">
                <p className="small mb-1" style={{ color: "#94A3B8" }}>
                  PLATSER
                </p>
                <div className="d-flex flex-wrap gap-2">
                  {seats.length > 0 ? (
                    seats.map((seat, index) => (
                      <span
                        key={index}
                        className="badge rounded-pill"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          padding: "8px 12px",
                          color: "#F8FAFC",
                        }}
                      >
                        {seat}
                      </span>
                    ))
                  ) : (
                    <span>Ej angivna</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ticket perforation */}
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: 12,
                height: 24,
                backgroundColor: "#0B101B",
                borderRadius: "0 12px 12px 0",
              }}
            />
            <div
              className="flex-grow-1"
              style={{
                borderTop: "2px dashed rgba(255,255,255,0.25)",
              }}
            />
            <div
              style={{
                width: 12,
                height: 24,
                backgroundColor: "#0B101B",
                borderRadius: "12px 0 0 12px",
              }}
            />
          </div>

          {/* QR code */}
          <div className="px-3 pb-4 pt-3 text-center">
            <div
              className="d-inline-block bg-white rounded-3 p-3"
              aria-label="QR-kod med bokningsreferens"
            >
              <QRCodeSVG value={booking.bookingRef} size={180} level="M" title="QR-kod med bokningsreferens" />
            </div>

            <p className="small mt-3 mb-2" style={{ color: "#94A3B8" }}>
              Visa QR-koden vid incheckning
            </p>

            <p className="fw-bold mb-0" style={{ letterSpacing: 1 }}>
              {booking.bookingRef}
            </p>
          </div>
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
