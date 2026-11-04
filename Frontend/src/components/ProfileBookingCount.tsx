import { useEffect, useState } from "react";
import { getMyBookings } from "../api/bookings";

export default function ProfileBookingCount() {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getMyBookings(controller.signal)
      .then((bookings) => {
        if (!controller.signal.aborted) {
          setCount(bookings.length);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(true);
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="text-center">
      <strong className="fs-4">{error ? "–" : (count ?? "…")}</strong>
      <p className="small text-secondary mb-0">Bokningar</p>
    </div>
  );
}
