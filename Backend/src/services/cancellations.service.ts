import jwt from "jsonwebtoken";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { pool } from "../db.js";
import { config } from "../config.js";
import { HttpError } from "../utils/httpErorr.js";
import { consumeBookingLimit, hashBookingValue, normalizeBookingEmail } from "./bookingLimits.service.js";
import {
  CancelBookingResult,
  CancellationJwtPayload,
  CancelPreviewResult,
} from "../interfaces/types.js";

export const cancellationCredentialsSchema = z.object({
  bookingRef: z.string().trim().toUpperCase().regex(/^FV-[A-Z0-9]{5}$/, "Ange ett bokningsnummer i formatet FV-XXXXX."),
  email: z.string().trim().email("Ange en giltig e-postadress.").max(200).transform(normalizeBookingEmail),
});
export type CancellationCredentials = z.infer<typeof cancellationCredentialsSchema>;

async function limitCancellationAttempts(input: CancellationCredentials) {
  // Shared by preview and confirmation, independent of IP and booking existence.
  await consumeBookingLimit(pool, `cancel-ref:${input.bookingRef}`, 5, 900);
  await consumeBookingLimit(pool, `cancel-email:${input.email}`, 5, 900);
}

function verifyBookingEmail(bookingEmail: string | undefined, suppliedEmail: string, exists: boolean) {
  // Hash even for missing bookings, and compare fixed-length digests in constant time.
  const matches = timingSafeEqual(
    Buffer.from(hashBookingValue(bookingEmail ?? ""), "hex"),
    Buffer.from(hashBookingValue(suppliedEmail), "hex"),
  );
  if (!exists || !matches) {
    throw new HttpError(404, "Vi hittade ingen bokning som matchar angivet bokningsnummer och e-postadress.");
  }
}

export function generateCancellationJwt(bookingRef: string, email: string): string {
  return jwt.sign(
    { bookingRef, email, action: "cancel_booking" },
    config.jwtSecret,
    { algorithm: "HS256", expiresIn: "14d" },
  );
}

export function verifyCancellationJwt(token: string): CancellationJwtPayload {
  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ["HS256"],
    }) as Partial<CancellationJwtPayload> | string;
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      decoded.action !== "cancel_booking" ||
      typeof decoded.bookingRef !== "string" ||
      !decoded.bookingRef ||
      typeof decoded.email !== "string" ||
      !decoded.email
    ) {
      throw new HttpError(400, "Ogiltig avbokningslänk.");
    }
    return decoded as CancellationJwtPayload;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(400, "Ogiltig eller utgången avbokningslänk.");
  }
}

export function validateCancellationDeadline(
  screeningStartsAt: Date | string,
  now: Date | number = Date.now(),
  deadlineHours = config.cancellationDeadlineHours ?? 2,
  isPaid = true,
): void {
  const startsAt = new Date(screeningStartsAt).getTime();
  const currentTime = typeof now === "number" ? now : now.getTime();

  if (!isPaid) {
    if (startsAt - currentTime <= 15 * 60_000) {
      throw new HttpError(400, 'Reservationen har redan släppts och kan inte avbokas.');
    }
    return;
  }

  if (startsAt <= currentTime) {
    throw new HttpError(
      400,
      "Kan inte avboka en visning som redan har startat.",
    );
  }

  const deadlineMs = deadlineHours * 60 * 60 * 1000;
  if (startsAt - currentTime < deadlineMs) {
    throw new HttpError(
      400,
      `Kan inte avboka mindre än ${deadlineHours} timmar innan visningen startar.`,
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
      `SELECT b.id, b.booking_reference AS "reference", b.status, b.is_paid, b.user_id,
              COALESCE((SELECT total_price FROM booking_totals WHERE booking_id = b.id), 0) AS total_price,
              s.starts_at
       FROM booking b
       JOIN screening s ON s.id = b.screening_id
       WHERE b.id = $1 AND b.user_id = $2
       FOR UPDATE OF b`,
      [bookingId, userId],
    );

    if (rows.length === 0) {
      throw new HttpError(404, "Bokningen hittades inte.");
    }

    const booking = rows[0];

    if (booking.status === "cancelled") {
      throw new HttpError(400, "Bokningen är redan avbokad.");
    }

    validateCancellationDeadline(booking.starts_at, Date.now(), undefined, booking.is_paid);

    if (booking.is_paid && booking.user_id) {
      const pointsToDeduct = Math.round(Number(booking.total_price) || 0);
      if (pointsToDeduct > 0) {
        await client.query(
          "UPDATE app_user SET points = GREATEST(0, points - $1) WHERE id = $2",
          [pointsToDeduct, booking.user_id],
        );
      }
    }

    // Free seats
    await client.query("DELETE FROM ticket WHERE booking_id = $1", [bookingId]);

    const updated = await client.query(
      `UPDATE booking
       SET status = 'cancelled', is_paid = false, paid_at = null
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
  input: CancellationCredentials,
): Promise<CancelPreviewResult> {
  const credentials = cancellationCredentialsSchema.parse(input);
  await limitCancellationAttempts(credentials);

  const { rows } = await pool.query(
    `SELECT b.id, b.booking_reference, b.status, b.is_paid,
            COALESCE(b.identity_email, lower(trim(COALESCE(b.guest_email, u.email)))) AS booking_email,
            m.title, m.poster_url, c.name AS cinema_name, st.starts_at
     FROM booking b
     JOIN screening st ON st.id = b.screening_id
     JOIN movie m ON m.id = st.movie_id
     JOIN cinema c ON c.id = st.cinema_id
     LEFT JOIN app_user u ON u.id = b.user_id
     WHERE b.booking_reference = $1`,
    [credentials.bookingRef],
  );

  const booking = rows[0];
  verifyBookingEmail(booking?.booking_email, credentials.email, rows.length > 0);

  if (booking.status === "cancelled") {
    throw new HttpError(400, "Denna bokning är redan avbokad.");
  }

  validateCancellationDeadline(booking.starts_at, Date.now(), undefined, booking.is_paid);

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
  input: CancellationCredentials,
): Promise<CancelBookingResult> {
  const credentials = cancellationCredentialsSchema.parse(input);
  await limitCancellationAttempts(credentials);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT b.id, b.booking_reference AS "reference", b.status, b.is_paid, b.user_id,
              COALESCE((SELECT total_price FROM booking_totals WHERE booking_id = b.id), 0) AS total_price,
              COALESCE(b.identity_email, lower(trim(COALESCE(b.guest_email, u.email)))) AS booking_email,
              s.starts_at
       FROM booking b
       JOIN screening s ON s.id = b.screening_id
       LEFT JOIN app_user u ON u.id = b.user_id
       WHERE b.booking_reference = $1
       FOR UPDATE OF b`,
      [credentials.bookingRef],
    );

    const booking = rows[0];
    verifyBookingEmail(booking?.booking_email, credentials.email, rows.length > 0);

    if (booking.status === "cancelled") {
      throw new HttpError(400, "Bokningen är redan avbokad.");
    }

    validateCancellationDeadline(booking.starts_at, Date.now(), undefined, booking.is_paid);

    if (booking.is_paid && booking.user_id) {
      const pointsToDeduct = Math.round(Number(booking.total_price) || 0);
      if (pointsToDeduct > 0) {
        await client.query(
          "UPDATE app_user SET points = GREATEST(0, points - $1) WHERE id = $2",
          [pointsToDeduct, booking.user_id],
        );
      }
    }

    // Free seats
    await client.query("DELETE FROM ticket WHERE booking_id = $1", [booking.id]);

    const updated = await client.query(
      `UPDATE booking
       SET status = 'cancelled', is_paid = false, paid_at = null
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
