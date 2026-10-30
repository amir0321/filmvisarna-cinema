import { useEffect, useState } from "react";
import { getAuthToken } from "../api/client";
import { getMyBookings } from "../api/bookings";
import type { Booking } from "../types/booking";
import { Tabs } from "../components/Tabs";
import { EmptyState } from "../components/EmptyState";
import MyBookingCard from "../components/MyBookingCard";
import { useAuth, getUserInitials, getUserDisplayName } from "../hooks/useAuth";

function isCurrentBooking(booking: Booking): boolean {
  if (booking.status !== "confirmed" || !booking.screeningStartsAt) {
    return false;
  }

  const startTime = new Date(booking.screeningStartsAt).getTime();

  return Number.isFinite(startTime) && startTime >= Date.now();
}

export default function MyBookings() {
  const token = getAuthToken();
  const { user, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<string>("active");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
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

  const currentBookings = bookings.filter(isCurrentBooking);
  const historyBookings = bookings.filter(
    (booking) => !isCurrentBooking(booking),
  );

  return (
    <div className="py-4">
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
          actionTo="/movies"
        />
      ) : loading ? (
        <p className="text-secondary" role="status">
          Laddar profil...
        </p>
      ) : !user ? (
        <p className="text-secondary" role="alert">
          Kunde inte hämta profilinformationen.
        </p>
      ) : (
        <>
          <div className="card mb-4">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                style={{
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                }}
                aria-label="Profilavatar"
              >
                {getUserInitials(user)}
              </div>

              <div>
                <h2 className="h5 fw-bold mb-1">{getUserDisplayName(user)}</h2>

                <p className="text-secondary mb-1">{user.email}</p>

                <span className="badge bg-secondary">
                  {user.role === "admin" ? "Administratör" : "Medlem"}
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
                Laddar bokningar...
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
                      actionTo="/movies"
                    />
                  ) : (
                    <div>
                      {currentBookings.map((booking) => (
                        <MyBookingCard key={booking.id} booking={booking} />
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
                        <MyBookingCard key={booking.id} booking={booking} />
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
