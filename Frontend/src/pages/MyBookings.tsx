import { useState } from "react";
import type { Booking } from "../types/booking";
import { Tabs } from "../components/Tabs";
import { EmptyState } from "../components/EmptyState";
import MyBookingCard from "../components/MyBookingCard";
import { useAuth, getUserInitials, getUserDisplayName } from "../hooks/useAuth";
import { CancelBookingModal } from "../components/CancelBookingModal";
import MyTicketModal from "../components/MyTicketModal";
import { useMovies } from "../hooks/useMovies";
import { canCancelBooking, getBookingState } from "../utils/bookings";
import { useBookings } from "../hooks/useBookings";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";

export default function MyBookings() {
  const { user, token, roleLabel, loading } = useAuth();
  const { data: movies } = useMovies();

  const [activeTab, setActiveTab] = useState<string>("active");
  const { bookings, loading: bookingsLoading, error: bookingsError, currentTime, cancelBooking } = useBookings();
  const [feedback, setFeedback] = useState("");
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [bookingToView, setBookingToView] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const getPosterUrl = (booking: Booking) =>
    movies?.find(
      (movie) => movie.title.trim().toLowerCase() === booking.movieTitle?.trim().toLowerCase(),
    )?.poster_url ?? null;

  const handleViewTicket = (booking: Booking) => {
    setBookingToView(booking);
  };

  const handleCloseTicket = () => {
    setBookingToView(null);
  };
  const handleOpenCancel = (booking: Booking) => {
    setBookingToCancel(booking);
    setCancelError(null);
  };
  const handleCloseCancel = () => {
    if (isCancelling) return;

    setBookingToCancel(null);
    setCancelError(null);
  };
  const handleConfirmCancel = async () => {
    if (!bookingToCancel || isCancelling) return;

    if (!canCancelBooking(bookingToCancel)) {
      setCancelError("Avbokning måste ske minst två timmar före visningen.");
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      await cancelBooking(bookingToCancel.id);
      setFeedback("Bokningen har avbokats och dina platser har släppts fria.");

      setBookingToCancel(null);
    } catch (error) {
      setCancelError(
        error instanceof Error ? error.message : "Kunde inte avboka bokningen.",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const currentBookings = bookings.filter((booking) => getBookingState(booking, currentTime) === "upcoming");
  const historyBookings = bookings.filter(
    (booking) => getBookingState(booking, currentTime) !== "upcoming",
  );
  const currentPagination = usePagination(currentBookings, 5);
  const historyPagination = usePagination(historyBookings, 5);

  return (
    <div className="fv-my-bookings py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Mina bokningar</h1>
          <p className="text-secondary mb-0">
            Här ser du alla dina kommande och tidigare biobokningar.
          </p>
        </div>
      </div>

      <p role="status" className="text-secondary">{feedback}</p>

      {!token ? (
        <EmptyState
          icon="bi-person-lock"
          title="Logga in för att se dina bokningar"
          description="Som medlem samlas alla dina bokningar här automatiskt. Har du bokat som gäst hittar du din bokningsbekräftelse i ditt e-postmeddelande."
          actionLabel="Utforska filmer"
          actionTo="/filmer"
        />
      ) : loading ? (
        <p className="text-secondary" role="status">
          Laddar profil…
        </p>
      ) : !user ? (
        <p className="text-secondary" role="alert">
          Kunde inte hämta profilinformationen.
        </p>
      ) : (
        <>
          <div className="fv-my-bookings__profile">
            <div className="d-flex align-items-center gap-3">
              <div
                className="fv-my-bookings__avatar"
                aria-hidden="true"
              >
                {getUserInitials(user)}
              </div>

              <div className="fv-my-bookings__profile-text">
                <h2 className="h5 fw-bold text-light mb-1">
                  {getUserDisplayName(user)}
                </h2>

                <p className="fv-my-bookings__email mb-2">
                  {user.email}
                </p>

                <span
                  className="fv-my-bookings__role badge rounded-pill"
                >
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onChange={setActiveTab} variant="segmented">
            <div className="mb-4">
              <Tabs.List ariaLabel="Välj bokningsflik">
                <Tabs.Trigger value="active">Aktuella bokningar</Tabs.Trigger>
                <Tabs.Trigger value="history">Bokningshistorik</Tabs.Trigger>
              </Tabs.List>
            </div>

            {bookingsLoading ? (
              <p className="text-secondary" role="status">
                Laddar bokningar…
              </p>
            ) : bookingsError ? (
              <p className="text-danger" role="alert">
                Kunde inte hämta bokningarna: {bookingsError}
              </p>
            ) : (
              <>
                <Tabs.Panel value="active">
                  {currentBookings.length === 0 ? (
                    <EmptyState
                      icon="bi-film"
                      title="Inga aktuella bokningar"
                      description="Dina bokningar visas här när du har bokat biljetter."
                      actionLabel="Se repertoaren"
                      actionTo="/filmer"
                    />
                  ) : (
                    <div>
                      {currentPagination.pageItems.map((booking) => (
                        <MyBookingCard
                          key={booking.id}
                          booking={booking}
                          currentTime={currentTime}
                          onViewTicket={handleViewTicket}
                          onCancel={handleOpenCancel}
                          posterUrl={getPosterUrl(booking)}
                        />
                      ))}
                      <Pagination
                        page={currentPagination.page}
                        totalPages={currentPagination.totalPages}
                        onPageChange={currentPagination.setPage}
                        ariaLabel="Sidnumrering för aktuella bokningar"
                      />
                    </div>
                  )}
                </Tabs.Panel>

                <Tabs.Panel value="history">
                  {historyBookings.length === 0 ? (
                    <EmptyState
                      icon="bi-clock-history"
                      title="Ingen bokningshistorik ännu"
                      description="Tidigare biobesök kommer att visas här efter att visningen ägt rum."
                    />
                  ) : (
                    <div>
                      {historyPagination.pageItems.map((booking) => (
                        <MyBookingCard
                          key={booking.id}
                          booking={booking}
                          currentTime={currentTime}
                          onViewTicket={handleViewTicket}
                          posterUrl={getPosterUrl(booking)}
                        />
                      ))}
                      <Pagination
                        page={historyPagination.page}
                        totalPages={historyPagination.totalPages}
                        onPageChange={historyPagination.setPage}
                        ariaLabel="Sidnumrering för bokningshistorik"
                      />
                    </div>
                  )}
                </Tabs.Panel>
              </>
            )}
          </Tabs>
        </>
      )}

      <CancelBookingModal
        isOpen={bookingToCancel !== null}
        booking={
          bookingToCancel
            ? {
                bookingRef: bookingToCancel.bookingRef,
                movieTitle: bookingToCancel.movieTitle ?? "Okänd film",
                cinemaName: bookingToCancel.cinemaName ?? "Okänd biograf",
                screeningStartsAt: bookingToCancel.screeningStartsAt ?? "",
                posterUrl: getPosterUrl(bookingToCancel),
                seats: bookingToCancel.tickets.map((ticket) =>
                  ticket.row && ticket.seatNumber != null
                    ? `Rad ${ticket.row}, plats ${ticket.seatNumber}`
                    : `Plats-ID ${ticket.seatId}`,
                ),
              }
            : null
        }
        canCancel={bookingToCancel ? canCancelBooking(bookingToCancel, currentTime) : false}
        isSubmitting={isCancelling}
        error={cancelError}
        onConfirm={handleConfirmCancel}
        onClose={handleCloseCancel}
      />

      <MyTicketModal
        isOpen={bookingToView !== null}
        booking={bookingToView}
        posterUrl={bookingToView ? getPosterUrl(bookingToView) : null}
        onClose={handleCloseTicket}
      />
    </div>
  );
}
