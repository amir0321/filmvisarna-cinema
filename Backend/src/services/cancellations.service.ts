import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { config } from "../config.js";
import { HttpError } from "../utils/httpErorr.js";
import {
  CancelBookingResult,
  CancellationJwtPayload,
  CancelPreviewResult,
} from "../interfaces/types.js";

export function generateCancellationJwt(bookingRef: string, email: string): string {
  return jwt.sign(
    { bookingRef, email, action: "cancel_booking" },
    config.jwtSecret,
    { expiresIn: "14d" },
  );
}

export function verifyCancellationJwt(token: string): CancellationJwtPayload {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as CancellationJwtPayload;
    if (
      decoded.action !== "cancel_booking" ||
      !decoded.bookingRef ||
      !decoded.email
    ) {
      throw new HttpError(400, "Ogiltig avbokningslänk.");
    }
    return decoded;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(400, "Ogiltig eller utgången avbokningslänk.");
  }
}

export function validateCancellationDeadline(
  screeningStartsAt: Date | string,
  now: Date | number = Date.now(),
  deadlineHours = config.cancellationDeadlineHours ?? 2,
): void {
  const startsAt = new Date(screeningStartsAt).getTime();
  const currentTime = typeof now === "number" ? now : now.getTime();

  if (startsAt <= currentTime) {
    throw new HttpError(
      400,
      "Cannot cancel a booking for a screening that has already started",
    );
  }

  const deadlineMs = deadlineHours * 60 * 60 * 1000;
  if (startsAt - currentTime < deadlineMs) {
    throw new HttpError(
      400,
      `Cannot cancel a booking less than ${deadlineHours} hours before screening starts`,
    );
  }
}

export async function cancelBooking(
  bookingId: number,
  userId: number,
): Promise<CancelBookingResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT b.id, b.booking_reference AS "reference", b.status, s.starts_at
       FROM booking b
       JOIN screening s ON s.id = b.screening_id
       WHERE b.id = $1 AND b.user_id = $2
       FOR UPDATE OF b`,
      [bookingId, userId],
    );

    if (rows.length === 0) {
      throw new HttpError(404, "Booking not found");
    }

    const booking = rows[0];

    if (booking.status === "cancelled") {
      throw new HttpError(400, "Booking is already cancelled");
    }

    validateCancellationDeadline(booking.starts_at);

    // Free seats
    await client.query("DELETE FROM ticket WHERE booking_id = $1", [bookingId]);

    const updated = await client.query(
      `UPDATE booking
       SET status = 'cancelled'
       WHERE id = $1
       RETURNING id, booking_reference AS "reference", status`,
      [bookingId],
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getBookingCancelPreview(
  token: string,
): Promise<CancelPreviewResult> {
  const payload = verifyCancellationJwt(token);

  const { rows } = await pool.query(
    `SELECT b.id, b.booking_reference, b.status, b.guest_email, u.email AS user_email,
            m.title, m.poster_url, c.name AS cinema_name, st.starts_at
     FROM booking b
     JOIN screening st ON st.id = b.screening_id
     JOIN movie m ON m.id = st.movie_id
     JOIN cinema c ON c.id = st.cinema_id
     LEFT JOIN app_user u ON u.id = b.user_id
     WHERE b.booking_reference = $1`,
    [payload.bookingRef],
  );

  if (rows.length === 0) {
    throw new HttpError(404, "Bokningen kunde inte hittas.");
  }

  const booking = rows[0];
  const bookingEmail = booking.guest_email || booking.user_email;
  if (bookingEmail?.toLowerCase() !== payload.email.toLowerCase()) {
    throw new HttpError(403, "E-postadressen matchar inte bokningen.");
  }

  if (booking.status === "cancelled") {
    throw new HttpError(400, "Denna bokning är redan avbokad.");
  }

  validateCancellationDeadline(booking.starts_at);

  const seatRows = await pool.query(
    `SELECT s.row_label, s.seat_number
     FROM ticket t
     JOIN seat s ON s.id = t.seat_id
     WHERE t.booking_id = $1
     ORDER BY s.row_label, s.seat_number`,
    [booking.id],
  );

  return {
    bookingRef: booking.booking_reference,
    movieTitle: booking.title,
    posterUrl: booking.poster_url,
    cinemaName: booking.cinema_name,
    screeningStartsAt: booking.starts_at,
    seats: seatRows.rows.map(
      (s: { row_label: string; seat_number: number }) =>
        `Rad ${s.row_label}, Stol ${s.seat_number}`,
    ),
    status: booking.status,
    canCancel: true,
  };
}

export async function cancelBookingByToken(
  token: string,
): Promise<CancelBookingResult> {
  const payload = verifyCancellationJwt(token);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT b.id, b.booking_reference AS "reference", b.status, b.guest_email,
              u.email AS user_email, s.starts_at
       FROM booking b
       JOIN screening s ON s.id = b.screening_id
       LEFT JOIN app_user u ON u.id = b.user_id
       WHERE b.booking_reference = $1
       FOR UPDATE OF b`,
      [payload.bookingRef],
    );

    if (rows.length === 0) {
      throw new HttpError(404, "Bokningen kunde inte hittas.");
    }

    const booking = rows[0];
    const bookingEmail = booking.guest_email || booking.user_email;
    if (bookingEmail?.toLowerCase() !== payload.email.toLowerCase()) {
      throw new HttpError(403, "E-postadressen matchar inte bokningen.");
    }

    if (booking.status === "cancelled") {
      throw new HttpError(400, "Bokningen är redan avbokad.");
    }

    validateCancellationDeadline(booking.starts_at);

    // Free seats
    await client.query("DELETE FROM ticket WHERE booking_id = $1", [booking.id]);

    const updated = await client.query(
      `UPDATE booking
       SET status = 'cancelled'
       WHERE id = $1
       RETURNING id, booking_reference AS "reference", status`,
      [booking.id],
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
