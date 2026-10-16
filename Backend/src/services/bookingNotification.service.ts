import { pool } from "../db.js";
import { config } from "../config.js";
import { generateCancellationJwt } from "./cancellations.service.js";
import { sendBookingConfirmation } from "./emailService.js";

/**
 * Loads booking, seats, and kiosk items from DB and dispatches the confirmation email
 */
export async function sendConfirmationForBooking(
  bookingId: number,
  bookingRef: string,
  email: string,
): Promise<void> {
  const info = await pool.query(
    `SELECT m.title, m.poster_url, c.name AS cinema, st.starts_at
     FROM booking b
     JOIN screening st ON st.id = b.screening_id
     JOIN movie m ON m.id = st.movie_id
     JOIN cinema c ON c.id = st.cinema_id
     WHERE b.id = $1`,
    [bookingId],
  );
  if (info.rowCount === 0) return;

  const seats = await pool.query(
    `SELECT s.row_label, s.seat_number
     FROM ticket t JOIN seat s ON s.id = t.seat_id
     WHERE t.booking_id = $1
     ORDER BY s.row_label, s.seat_number`,
    [bookingId],
  );
  const tickets = await pool.query(
    `SELECT pg.name, pg.price, count(*)::int AS quantity
     FROM ticket t JOIN price_group pg ON pg.id = t.price_group_id
     WHERE t.booking_id = $1
     GROUP BY pg.name, pg.price`,
    [bookingId],
  );
  const kiosk = await pool.query(
    `SELECT mi.name, mi.price, bi.quantity
     FROM booking_item bi JOIN menu_item mi ON mi.id = bi.menu_item_id
     WHERE bi.booking_id = $1`,
    [bookingId],
  );

  const row = info.rows[0];
  const startsAt = new Date(row.starts_at);
  const timeZone = config.timezone || "Europe/Stockholm";

  const cancelToken = generateCancellationJwt(bookingRef, email);
  const frontendUrl =
    process.env.FRONTEND_URL || config.corsOrigin[0] || "http://localhost:5173";
  const cancelUrl = `${frontendUrl}/cancel?token=${encodeURIComponent(cancelToken)}`;

  console.log(`[Booking] Cancellation token for ${bookingRef}: ${cancelToken}`);
  console.log(`[Booking] Cancellation URL: ${cancelUrl}`);

  await sendBookingConfirmation({
    email,
    bookingRef,
    movieTitle: row.title,
    screeningDate: startsAt.toLocaleDateString("sv-SE", {
      dateStyle: "long",
      timeZone,
    }),
    screeningTime: startsAt.toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }),
    cinemaName: row.cinema,
    seats: seats.rows.map(
      (s: { row_label: string; seat_number: number }) =>
        `${s.row_label}${s.seat_number}`,
    ),
    tickets: tickets.rows.map(
      (t: { name: string; price: string | number; quantity: number }) => ({
        type: t.name,
        quantity: t.quantity,
        price: Number(t.price),
      }),
    ),
    kioskItems: kiosk.rows.map(
      (k: { name: string; price: string | number; quantity: number }) => ({
        name: k.name,
        quantity: k.quantity,
        price: Number(k.price),
      }),
    ),
    posterUrl: row.poster_url ?? undefined,
    cancelUrl,
  });
}
