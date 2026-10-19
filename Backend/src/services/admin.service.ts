import { pool } from "../db.js";
import { config } from "../config.js";
import { AdminStatsResult } from "../interfaces/types.js";

export async function getAdminStats(): Promise<AdminStatsResult> {
  const tz = config.timezone;

  const bookingStats = await pool.query(`
    SELECT
      COUNT(*)::int AS total_bookings,
      COUNT(*) FILTER (WHERE b.status = 'confirmed' AND NOT b.is_paid)::int AS waiting_bookings,
      COUNT(*) FILTER (WHERE b.status = 'confirmed' AND b.is_paid)::int AS paid_bookings,
      COALESCE(SUM(bt.total_price) FILTER (WHERE b.status = 'confirmed'), 0)::float AS expected_revenue,
      COALESCE(SUM(bt.total_price) FILTER (WHERE b.status = 'confirmed' AND b.is_paid), 0)::float AS paid_revenue
    FROM booking b
    JOIN booking_totals bt ON bt.booking_id = b.id
    JOIN screening s ON s.id = b.screening_id
    WHERE (s.starts_at AT TIME ZONE '${tz}')::date = (now() AT TIME ZONE '${tz}')::date
  `);

  const bs = bookingStats.rows[0];

  const seatStats = await pool.query(`
    SELECT
      COALESCE(SUM(total_seats), 0)::int AS total_seats_today,
      COALESCE(SUM(booked_seats), 0)::int AS booked_seats_today
    FROM (
      SELECT
        s.id,
        (SELECT COUNT(*)::int FROM seat st WHERE st.cinema_id = s.cinema_id) AS total_seats,
        (SELECT COUNT(*)::int
         FROM ticket tk
         JOIN booking bk ON bk.id = tk.booking_id
         WHERE tk.screening_id = s.id AND bk.status = 'confirmed') AS booked_seats
      FROM screening s
      WHERE (s.starts_at AT TIME ZONE '${tz}')::date = (now() AT TIME ZONE '${tz}')::date
    ) sub
  `);

  const ss = seatStats.rows[0];
  const totalSeats = ss.total_seats_today || 0;
  const bookedSeats = ss.booked_seats_today || 0;
  const occupancy = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

  return {
    bookingsToday: bs.total_bookings || 0,
    bookingsWaiting: bs.waiting_bookings || 0,
    bookingsPaid: bs.paid_bookings || 0,
    expectedRevenue: bs.expected_revenue || 0,
    paidRevenue: bs.paid_revenue || 0,
    totalSeatsToday: totalSeats,
    bookedSeatsToday: bookedSeats,
    occupancyRatePercent: occupancy,
  };
}
