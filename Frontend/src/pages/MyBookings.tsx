import { translateApiError } from '../i18n/mappers'
import { useTranslation } from '../context/LocaleContext'
import { sv } from '../i18n/sv'
import { useState } from "react";
import type { Booking } from "../types/booking";
import { Tabs } from "../components/Tabs";
import { EmptyState } from "../components/EmptyState";
import MyBookingCard from "../components/MyBookingCard";
import { useAuth, getUserInitials, getUserDisplayName } from "../hooks/useAuth";
import MemberCancelBookingModal from "../components/MemberCancelBookingModal";
import MyTicketModal from "../components/MyTicketModal";
import { useMovies } from "../hooks/useMovies";
import { canCancelBooking, getBookingState } from "../utils/bookings";
import { useBookings } from "../hooks/useBookings";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";
import ReservationWarningNotice from '../components/ReservationWarningNotice';

export default function MyBookings() {
  const { t, locale } = useTranslation()
  const { user, isAuthenticated, role, loading } = useAuth();
  const { data: movies } = useMovies();

  const [activeTab, setActiveTab] = useState<string>("active");
  const { bookings, loading: bookingsLoading, error: bookingsError, currentTime, reservationStatus, reservationStatusError } = useBookings();
  const [feedback, setFeedback] = useState("");
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [bookingToView, setBookingToView] = useState<Booking | null>(null);
  const viewedBooking = bookings.find(booking => booking.id === bookingToView?.id) ?? null;

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
    setBookingToView(null);
    setBookingToCancel(booking);
  };

  const currentBookings = bookings.filter((booking) => ['upcoming', 'ongoing'].includes(getBookingState(booking, currentTime)));
  const historyBookings = bookings.filter(
    (booking) => !['upcoming', 'ongoing'].includes(getBookingState(booking, currentTime)),
  );
  const currentPagination = usePagination(currentBookings, 5);
  const historyPagination = usePagination(historyBookings, 5);

  return (
    <div className="fv-my-bookings py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">{t('member.title')}</h1>
          <p className="text-secondary mb-0">
            {t('member.intro')}
          </p>
        </div>
      </div>

      <p role="status" className={feedback ? 'text-secondary mb-3' : 'visually-hidden'}>{translateApiError(feedback, locale)}</p>

      {!isAuthenticated ? (
        <EmptyState
          icon="bi-person-lock"
          title={t('member.loginToBookings')}
          description={t('member.loginDescription')}
          actionLabel={t('member.exploreMovies')}
          actionTo="/filmer"
        />
      ) : loading ? (
        <p className="text-secondary" role="status">
          {t('member.loadingProfile')}
        </p>
      ) : !user ? (
        <p className="text-secondary" role="alert">
          {t('member.profileError')}
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
                <h2 className="h5 fw-bold text-body mb-1">
                  {getUserDisplayName(user)}
                </h2>

                <p className="fv-my-bookings__email mb-2">
                  {user.email}
                </p>

                <span
                  className="fv-my-bookings__role badge rounded-pill"
                >
                  {t(role === 'admin' ? 'member.admin' : role === 'guest' ? 'nav.guest' : 'member.member')}
                </span>
              </div>
            </div>
          </div>

          <ReservationWarningNotice status={reservationStatus} error={reservationStatusError} currentTime={currentTime} />
          <Tabs value={activeTab} onChange={setActiveTab} variant="segmented">
            <div className="mb-4">
              <Tabs.List ariaLabel={t('member.tabs')}>
                <Tabs.Trigger value="active">{t('member.upcoming')}</Tabs.Trigger>
                <Tabs.Trigger value="history">{t('member.history')}</Tabs.Trigger>
              </Tabs.List>
            </div>

            {bookingsLoading ? (
              <p className="text-secondary" role="status">
                {t('member.loadingBookings')}
              </p>
            ) : bookingsError ? (
              <p className="text-danger" role="alert">
                {t('member.bookingsError', { error: translateApiError(bookingsError, locale) })}
              </p>
            ) : (
              <>
                <Tabs.Panel value="active">
                  {currentBookings.length === 0 ? (
                    <EmptyState
                      icon="bi-film"
                      title={t('member.noUpcoming')}
                      description={t('member.noUpcomingDescription')}
                      actionLabel={t('member.seeProgramme')}
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
                        ariaLabel={t('member.upcomingPagination')}
                      />
                    </div>
                  )}
                </Tabs.Panel>

                <Tabs.Panel value="history">
                  {historyBookings.length === 0 ? (
                    <EmptyState
                      icon="bi-clock-history"
                      title={t('member.noHistory')}
                      description={t('member.noHistoryDescription')}
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
                        ariaLabel={t('member.historyPagination')}
                      />
                    </div>
                  )}
                </Tabs.Panel>
              </>
            )}
          </Tabs>
        </>
      )}

      {bookingToCancel && <MemberCancelBookingModal
        key={bookingToCancel.id}
        booking={bookingToCancel}
        posterUrl={getPosterUrl(bookingToCancel)}
        onClose={() => setBookingToCancel(null)}
        onCancelled={() => {
          setBookingToCancel(null);
          setFeedback(sv['member.cancelledFeedback']);
        }}
      />}

      <MyTicketModal
        isOpen={bookingToView !== null}
        booking={viewedBooking}
        posterUrl={viewedBooking ? getPosterUrl(viewedBooking) : null}
        onClose={handleCloseTicket}
        onCancel={handleOpenCancel}
        canCancel={viewedBooking ? canCancelBooking(viewedBooking, currentTime) : false}
        currentTime={currentTime}
      />
    </div>
  );
}
