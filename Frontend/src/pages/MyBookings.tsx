import { useEffect, useState } from "react";
import { getAuthToken } from "../api/client";
import { getMyBookings } from "../api/bookings";
import type { Booking } from "../types/booking";
import { Tabs } from "../components/Tabs";
import { EmptyState } from "../components/EmptyState";
import MyBookingCard from "../components/MyBookingCard";
import { useAuth, getUserInitials, getUserDisplayName } from "../hooks/useAuth";
import { useMovies } from "../hooks/useMovies";
import { getBookingState } from "../utils/bookings";

export default function MyBookings() {
  const token = getAuthToken();
  const { user, loading } = useAuth();
  const { data: movies } = useMovies();

  const [activeTab, setActiveTab] = useState<string>("active");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || loading || !user) {
      return;
    }

    let cancelled = false;

    async function loadBookings() {
      setBookingsLoading(true);
      setBookingsError(null);

      try {
        const data = await getMyBookings();

        if (!cancelled) {
          setBookings(data);
        }
      } catch (error) {
        if (!cancelled) {
          setBookingsError(
            error instanceof Error
              ? error.message
              : "Kunde inte hämta bokningarna.",
          );
        }
      } finally {
        if (!cancelled) {
          setBookingsLoading(false);
        }
      }
    }

    void loadBookings();

    return () => {
      cancelled = true;
    };
  }, [token, loading, user]);

  const currentBookings = bookings.filter((booking) => getBookingState(booking) === "upcoming");
  const historyBookings = bookings.filter(
    (booking) => getBookingState(booking) !== "upcoming",
  );

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
                  {user.role === "admin" ? "Administratör" : "Gästmedlem"}
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
                      {currentBookings.map((booking) => (
                        <MyBookingCard
                          key={booking.id}
                          booking={booking}
                          posterUrl={
                            movies?.find(
                              (movie) =>
                                movie.title.trim().toLowerCase() ===
                                booking.movieTitle?.trim().toLowerCase(),
                            )?.poster_url ?? null
                          }
                        />
                      ))}
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
                      {historyBookings.map((booking) => (
                        <MyBookingCard
                          key={booking.id}
                          booking={booking}
                          posterUrl={
                            movies?.find(
                              (movie) =>
                                movie.title.trim().toLowerCase() ===
                                booking.movieTitle?.trim().toLowerCase(),
                            )?.poster_url ?? null
                          }
                        />
                      ))}
                    </div>
                  )}
                </Tabs.Panel>
              </>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
}
