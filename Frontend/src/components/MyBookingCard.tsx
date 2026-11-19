import { useTranslation } from '../context/LocaleContext'
import type { Booking } from "../types/booking";
import { Poster } from "./Poster";
import { canCancelBooking, getBookingState } from "../utils/bookings";
import { getIntlLocale } from '../utils/locale';
import { formatSek } from '../utils/price';

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
  const { t, locale } = useTranslation()
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

  const cinemaHall = cinemaName ?? t('member.cinemaUnspecified');

  const startsAt = new Date(screeningStartsAt ?? '');
  const showtime = Number.isFinite(startsAt.getTime())
    ? new Intl.DateTimeFormat(getIntlLocale(locale), {
        dateStyle: "medium",
        timeStyle: "short",
        hour12: false,
        timeZone: "Europe/Stockholm",
      }).format(startsAt)
    : t('member.timeUnspecified');
  const bookingState = getBookingState(booking, currentTime);
  const statusLabel = {
    upcoming: t('member.upcomingScreening'),
    ongoing: t('member.ongoingScreening'),
    past: t('member.pastScreening'),
    cancelled: t('member.cancelled'),
    expired: t('member.expired'),
    unknown: t('member.timeUnspecified'),
  }[bookingState];
  const formattedPrice = formatSek(totalPrice, locale);

  const seats = tickets.map((ticket) => {
    if (ticket.row && ticket.seatNumber != null) {
      return t('seatMap.seat', { row: ticket.row, seat: ticket.seatNumber });
    }

    return t('seatMap.seatId', { id: ticket.seatId });
  });
  const canCancel = canCancelBooking(booking, currentTime);
  const deadlineId = `booking-${booking.id}-cancel-deadline`;
  return (
    <article className={`fv-my-booking-card card mb-3 overflow-hidden fv-my-booking-card--${bookingState}`}>
      <div className="fv-my-booking-card__status d-flex flex-wrap justify-content-between align-items-center gap-2 px-3 py-2">
        <span className="fw-semibold small">
          {(bookingState === 'upcoming' || bookingState === 'ongoing') && !booking.isPaid ? t('member.reserved') : statusLabel}
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
              alt={movieTitle ?? t('member.poster')}
              title={movieTitle ?? t('member.film')}
              aspectRatio="2/3"
              className="w-100 h-100"
            />
          </div>

          <div className="fv-my-booking-card__details flex-grow-1">
            <h3 className="h5 fw-bold mb-1">{movieTitle ?? t('ticket.unknownMovie')}</h3>
            <p className="text-secondary small mb-0">
              {cinemaHall} · {showtime}
            </p>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <p className="text-secondary mb-1">{t('member.seats')}</p>
            <p className="fw-semibold mb-0">{seats.join(", ") || t('member.noSeats')}</p>
          </div>

          <div className="col-md-6">
            <p className="text-secondary mb-1">{t('member.totalPrice')}</p>
            <p className="fw-semibold mb-0">{formattedPrice}</p>
          </div>
        </div>

        {bookingState !== 'cancelled' && (
          <p className="small text-secondary mb-3">
            {t(bookingState === 'expired' ? 'member.expiredNote' : booking.isPaid ? 'member.paidNote' : 'member.unpaidNote')}
          </p>
        )}

        {hasKioskPreorder && (
          <span className="fv-my-booking-card__kiosk badge">
            {t('member.kioskIncluded')}
          </span>
        )}
        <div className="d-flex flex-wrap gap-2 mt-3">
          {(booking.status === 'confirmed' || booking.status === 'reserved') && bookingState !== 'expired' && onViewTicket && (
            <button
              type="button"
              className="btn btn-secondary-outline"
              onClick={() => onViewTicket?.(booking)}
              aria-label={t('member.viewTicketAria', { title: movieTitle ?? t('ticket.unknownMovie'), reference: bookingRef })}
              disabled={!onViewTicket}
            >
              {t('member.viewTicket')}
            </button>
          )}

          {bookingState === "upcoming" && onCancel && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => onCancel?.(booking)}
              aria-label={t('member.cancelAria', { title: movieTitle ?? t('ticket.unknownMovie'), reference: bookingRef })}
              disabled={!canCancel || !onCancel}
              aria-describedby={!canCancel ? deadlineId : undefined}
            >
              {t('member.cancel')}
            </button>
          )}
        </div>
        {bookingState === "upcoming" && onCancel && !canCancel && (
          <p id={deadlineId} className="small text-secondary mt-2 mb-0">
            {t('cancellation.deadline')}
          </p>
        )}
      </div>
    </article>
  );
}
