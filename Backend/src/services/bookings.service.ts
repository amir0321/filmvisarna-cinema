import { config } from "../config.js";
import { pool } from "../db.js";
import { HttpError } from "../utils/httpErorr.js";
import { generateUniqueBookingRef } from "../utils/bookingRef.js";
import { sendConfirmationForBooking } from "./bookingNotification.service.js";
import { generateCancellationJwt } from "./cancellations.service.js";
import type pg from 'pg';
import { consumeBookingLimit, hashBookingValue, normalizeBookingEmail } from './bookingLimits.service.js';
import { releaseExpiredReservations } from './reservationExpiry.service.js';
import { assertReservationAllowed, getReservationWarningStatus, RESERVATION_BLOCKED_MESSAGE } from './bookingWarnings.service.js';

import {
  BookingFilters,
  CreateBookingInput,
  CreateBookingResult,
  ItemInput,
  TicketInput,
  UpdateBookingInput,
  UpdateBookingStatusResult,
} from "../interfaces/types.js";

// Re-export cancellation services and types for backward compatibility
export {
  cancelBooking,
  cancelBookingByToken,
  getBookingCancelPreview,
  generateCancellationJwt,
  verifyCancellationJwt,
  validateCancellationDeadline,
} from "./cancellations.service.js";

export type {
  BookingFilters,
  TicketInput,
  ItemInput,
  CreateBookingInput,
  CreateBookingResult,
  UpdateBookingInput,
  UpdateBookingStatusResult,
};

// DB status tracks held seats. API status also distinguishes unpaid reservations
// and expiry 15 minutes before start, independently of the cleanup schedule.
const BOOKING_STATUS_SQL = `CASE
  WHEN b.status = 'confirmed' AND NOT b.is_paid THEN
    CASE WHEN st.starts_at <= statement_timestamp() + interval '15 minutes' THEN 'expired' ELSE 'reserved' END
  ELSE b.status::text END`;

// SQL för att hämta kompletta bokningsdetaljer med film, salong, biljetter och kioskvaror
const BOOKING_DETAILS_QUERY = `
  SELECT b.id, b.booking_reference AS "reference", ${BOOKING_STATUS_SQL} AS status,
         b.is_paid AS "isPaid",
         b.paid_at AS "paidAt",
         b.is_checked_in AS "isCheckedIn",
         b.checked_in_at AS "checkedInAt",
         b.created_at AS "createdAt",
         b.guest_name AS "guestName", b.guest_email AS "guestEmail",
         COALESCE(b.guest_email, u.email) AS "email",
         COALESCE(b.guest_name, NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), '')) AS "customerName",
         json_build_object('id', st.id, 'startsAt', st.starts_at, 'endsAt', st.ends_at,
                           'movieTitle', m.title, 'cinema', c.name) AS screening,
         COALESCE((SELECT json_agg(json_build_object(
                     'seatId', s.id, 'row', s.row_label, 'number', s.seat_number,
                     'priceGroup', pg.name, 'price', pg.price)
                   ORDER BY s.row_label, s.seat_number)
                   FROM ticket t
                   JOIN seat s ON s.id = t.seat_id
                   JOIN price_group pg ON pg.id = t.price_group_id
                   WHERE t.booking_id = b.id), '[]'::json) AS tickets,
         COALESCE((SELECT json_agg(json_build_object(
                     'menuItemId', mi.id, 'name', mi.name,
                     'quantity', bi.quantity, 'unitPrice', mi.price)
                   ORDER BY mi.name)
                   FROM booking_item bi
                   JOIN menu_item mi ON mi.id = bi.menu_item_id
                   WHERE bi.booking_id = b.id), '[]'::json) AS items,
         bt.ticket_total AS "ticketTotal",
         bt.item_total   AS "itemTotal",
         bt.total_price  AS "totalPrice"
  FROM booking b
  LEFT JOIN app_user u ON u.id = b.user_id
  JOIN screening_times st ON st.id = b.screening_id
  JOIN movie m   ON m.id = st.movie_id
  JOIN cinema c  ON c.id = st.cinema_id
  JOIN booking_totals bt ON bt.booking_id = b.id
`;

function isSeatTaken(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505" &&
    "constraint" in err &&
    ['ticket_pkey', 'ticket_active_seat_idx'].includes((err as { constraint: string }).constraint)
  );
}

async function fetchBookings(where: string, params: unknown[], db: pg.Pool = pool) {
  const { rows } = await db.query(
    `${BOOKING_DETAILS_QUERY} WHERE ${where} ORDER BY st.starts_at DESC`,
    params,
  );
  return rows;
}

export async function listAllBookings(filters: BookingFilters = {}) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.screeningId !== undefined) {
    params.push(filters.screeningId);
    conditions.push(`b.screening_id = $${params.length}`);
  }

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`(${BOOKING_STATUS_SQL}) = $${params.length}`);
  }

  if (filters.isPaid !== undefined) {
    params.push(filters.isPaid);
    conditions.push(`b.is_paid = $${params.length}`);
  }

  if (filters.from) {
    params.push(filters.from);
    conditions.push(`(st.starts_at AT TIME ZONE '${config.timezone}')::date >= $${params.length}::date`);
  }

  if (filters.to) {
    params.push(filters.to);
    conditions.push(`(st.starts_at AT TIME ZONE '${config.timezone}')::date <= $${params.length}::date`);
  }

  if (filters.search) {
    params.push(`%${filters.search.trim()}%`);
    const p = `$${params.length}`;
    conditions.push(`(
      b.booking_reference ILIKE ${p}
      OR b.guest_name ILIKE ${p}
      OR b.guest_email ILIKE ${p}
      OR u.email ILIKE ${p}
      OR u.first_name ILIKE ${p}
      OR u.last_name ILIKE ${p}
      OR m.title ILIKE ${p}
    )`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `${BOOKING_DETAILS_QUERY} ${whereClause} ORDER BY b.created_at DESC`,
    params,
  );
  return rows;
}

export async function updateBookingStatus(
  bookingId: number,
  input: UpdateBookingInput,
): Promise<UpdateBookingStatusResult> {
  const { isPaid, isCheckedIn, seatIds } = input;
  if (isPaid === undefined && isCheckedIn === undefined) {
    throw new HttpError(400, "Minst ett fält (isPaid eller isCheckedIn) måste anges.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT b.id, b.status, b.is_paid, b.is_checked_in, b.user_id, b.screening_id,
              COALESCE((SELECT total_price FROM booking_totals WHERE booking_id = b.id), 0) AS total_price
       FROM booking b
       WHERE b.id = $1
       FOR UPDATE`,
      [bookingId],
    );
    if (existing.rowCount === 0) {
      throw new HttpError(404, "Bokningen hittades inte.");
    }

    const current = existing.rows[0];
    if (current.status === "cancelled") {
      throw new HttpError(400, "Kan inte uppdatera en avbokad bokning.");
    }
    // Check the deadline after acquiring the booking lock, including after a wait
    // for another cashier. Late payments must reacquire available seats.
    if (!current.is_paid) {
      const { rows: [screening] } = await client.query(
        'SELECT ends_at <= clock_timestamp() AS ended FROM screening_times WHERE id = $1',
        [current.screening_id],
      );
      if (screening.ended) {
        throw new HttpError(409, "Bokningen har gått ut eftersom den inte betalades före filmens sluttid.");
      }
    }
    if (isCheckedIn && !(isPaid ?? current.is_paid)) {
      throw new HttpError(409, "Bokningen måste vara betald före incheckning.");
    }
    if (isPaid === false && current.is_checked_in && isCheckedIn !== false) {
      throw new HttpError(409, "Ta bort incheckningen innan betalningen återställs.");
    }
    if (seatIds && isPaid !== true) {
      throw new HttpError(400, 'Platsbyte kräver en obetald bokning och betalning.');
    }
    if (seatIds && current.is_paid) {
      const { rows: assigned } = await client.query<{ seat_id: number }>(
        'SELECT seat_id FROM ticket WHERE booking_id = $1', [bookingId]);
      const requested = new Set(seatIds);
      if (requested.size !== seatIds.length || assigned.length !== seatIds.length || assigned.some(ticket => !requested.has(ticket.seat_id))) {
        throw new HttpError(400, 'Platsbyte kräver en obetald bokning och betalning.');
      }
    }
    if (isPaid === true && !current.is_paid) {
      await releaseExpiredReservations(client, current.screening_id);
      if (seatIds) {
        const { rows: tickets } = await client.query<{ price_group_id: number }>(
          'SELECT price_group_id FROM ticket WHERE booking_id = $1 ORDER BY seat_id', [bookingId]);
        if (seatIds.length !== tickets.length || new Set(seatIds).size !== seatIds.length) {
          throw new HttpError(400, 'Välj lika många olika platser som biljetter.');
        }
        const valid = await client.query(`SELECT id FROM seat WHERE id = ANY($1::int[])
          AND cinema_id = (SELECT cinema_id FROM screening WHERE id = $2)`, [seatIds, current.screening_id]);
        if (valid.rowCount !== seatIds.length) throw new HttpError(400, 'Ogiltiga stolar för visningen.');
        await client.query('DELETE FROM ticket WHERE booking_id = $1', [bookingId]);
        for (const [index, seatId] of seatIds.entries()) {
          await client.query('INSERT INTO ticket(screening_id, seat_id, booking_id, price_group_id) VALUES ($1, $2, $3, $4)',
            [current.screening_id, seatId, bookingId, tickets[index].price_group_id]);
        }
      } else {
        await client.query('UPDATE ticket SET is_active = true WHERE booking_id = $1', [bookingId]);
      }
    }
    let pointsAwarded = 0;

    if (isPaid !== undefined) {
      if (isPaid && !current.is_paid) {
        // Transitioning from unpaid to paid
        if (current.user_id) {
          // 1 SEK = 1 point based on total booking price
          pointsAwarded = Math.round(Number(current.total_price) || 0);
          if (pointsAwarded > 0) {
            await client.query(
              "UPDATE app_user SET points = points + $1 WHERE id = $2",
              [pointsAwarded, current.user_id],
            );
          }
        }
      } else if (!isPaid && current.is_paid) {
        // Reversing payment: deduct previously awarded points
        if (current.user_id) {
          const pointsToDeduct = Math.round(Number(current.total_price) || 0);
          if (pointsToDeduct > 0) {
            await client.query(
              "UPDATE app_user SET points = GREATEST(0, points - $1) WHERE id = $2",
              [pointsToDeduct, current.user_id],
            );
          }
        }
      }
    }

    const updates: string[] = [];
    const params: unknown[] = [bookingId];

    if (isPaid !== undefined) {
      params.push(isPaid);
      updates.push(`is_paid = $${params.length}`);
      if (isPaid) {
        updates.push("status = 'confirmed'");
        updates.push(`paid_at = COALESCE(paid_at, clock_timestamp())`);
      } else {
        updates.push(`paid_at = null`);
      }
    }

    if (isCheckedIn !== undefined) {
      params.push(isCheckedIn);
      updates.push(`is_checked_in = $${params.length}`);
      if (isCheckedIn) {
        updates.push(`checked_in_at = now()`);
      } else {
        updates.push(`checked_in_at = null`);
      }
    }

    const paymentDeadline = isPaid === true && !current.is_paid
      ? 'AND EXISTS (SELECT 1 FROM screening_times st WHERE st.id = booking.screening_id AND st.ends_at > clock_timestamp())'
      : '';
    const updated = await client.query(
      `UPDATE booking SET ${updates.join(", ")} WHERE id = $1 ${paymentDeadline}`,
      params,
    );
    if (updated.rowCount === 0) {
      // A points/account lock may have held up payment past the deadline.
      // Roll back both payment and any awarded points.
      throw new HttpError(409, "Bokningen har gått ut eftersom den inte betalades före filmens sluttid.");
    }
    await releaseExpiredReservations(client, current.screening_id);

    await client.query("COMMIT");

    const updatedRows = await fetchBookings("b.id = $1", [bookingId]);
    return {
      booking: updatedRows[0],
      pointsAwarded,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    if (isSeatTaken(error)) throw new HttpError(409, 'Platserna är inte längre lediga. Välj andra platser i kassan.');
    throw error;
  } finally {
    client.release();
  }
}

export async function getUserBookings(userId: number) {
  return fetchBookings("b.user_id = $1", [userId]);
}

export async function getBookingByReference(reference: string) {
  const rows = await fetchBookings("upper(b.booking_reference) = upper($1)", [
    reference,
  ]);
  if (rows.length === 0) {
    throw new HttpError(404, "Ingen bokning hittades med den referensen.");
  }
  return rows[0];
}

export interface BookingRequestOptions {
  requestKey: string;
  guestToken?: string;
}

export function bookingFingerprint(input: CreateBookingInput): string {
  return hashBookingValue(JSON.stringify({
    screeningId: input.screeningId, email: normalizeBookingEmail(input.email), guestName: input.guestName?.trim() || null,
    tickets: input.tickets.map(({ seatId, priceGroupId }) => ({ seatId, priceGroupId })).sort((a, b) => a.seatId - b.seatId),
    items: (input.items ?? []).map(({ itemId, quantity }) => ({ itemId, quantity })).sort((a, b) => a.itemId - b.itemId),
  }));
}

async function bookingResult(db: pg.Pool, bookingId: number, email: string): Promise<CreateBookingResult> {
  const [booking] = await fetchBookings('b.id = $1', [bookingId], db);
  return { bookingRef: booking.reference, totalPrice: Number(booking.totalPrice), booking,
    cancelToken: generateCancellationJwt(booking.reference, email) };
}

export function createBookingService(dependencies: {
  db: pg.Pool;
  notify: typeof sendConfirmationForBooking;
} = { db: pool, notify: sendConfirmationForBooking }) {
  const { db, notify } = dependencies;
  return async function book(
    input: CreateBookingInput,
    userId: number | null | undefined,
    options: BookingRequestOptions,
  ): Promise<CreateBookingResult> {
    const { screeningId, guestName, tickets, items = [] } = input;
    let email = normalizeBookingEmail(input.email);
    if (userId) {
      const { rows: [account] } = await db.query<{ email: string; isVerified: boolean }>(
        'SELECT email, is_verified AS "isVerified" FROM app_user WHERE id = $1', [userId]);
      if (!account?.isVerified) throw new HttpError(403, 'Verifiera din e-postadress innan du bokar biljetter.');
      email = normalizeBookingEmail(account.email);
    } else {
      if (!options.guestToken || !/^[a-f0-9]{64}$/.test(options.guestToken)) {
        throw new HttpError(403, 'Bekräfta gästbokningen via länken i ditt e-postmeddelande.');
      }
      const { rows: [intent] } = await db.query<{ email: string; screeningId: number; requestKey: string }>(
        `SELECT email, (payload->>'screeningId')::int AS "screeningId", request_key AS "requestKey"
         FROM guest_booking_intent WHERE token_hash = $1 AND expires_at > clock_timestamp()`, [hashBookingValue(options.guestToken)]);
      if (!intent || intent.email !== email || intent.screeningId !== screeningId || intent.requestKey !== options.requestKey) {
        throw new HttpError(400, 'Bekräftelselänken är ogiltig eller har gått ut. Begär en ny länk.');
      }
    }
    const fingerprint = bookingFingerprint({ ...input, email });
    const existingRequest = async (executor: pg.Pool | pg.PoolClient) => {
      const { rows: [existing] } = await executor.query<{ id: number; requestHash: string }>(
        'SELECT id, request_hash AS "requestHash" FROM booking WHERE identity_email = $1 AND request_key = $2', [email, options.requestKey]);
      if (existing && existing.requestHash !== fingerprint) throw new HttpError(409, 'Bokningsförsöket har redan använts för ett annat innehåll. Försök igen med ett nytt val.');
      return existing;
  };
  const previous = await existingRequest(db);
  if (previous) return bookingResult(db, previous.id, email);
  // Commit any newly due warnings independently of a failed booking attempt.
  const warningStatus = await getReservationWarningStatus(email, userId, db);
  if (warningStatus.blockedUntil) throw new HttpError(403, RESERVATION_BLOCKED_MESSAGE);
  // Persist attempt counters independently, including failed booking attempts.
  await consumeBookingLimit(db, `identity:${email}`, config.bookingLimits.attempts);

  const client = await db.connect();
  let bookingId: number;
  let bookingRef: string;
  try {
    await client.query("BEGIN");
    // Account and guest bookings serialize on the same verified email, even across servers/IPs.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`booking-identity:${email}`]);
    if (!userId) {
      const intent = await client.query(`SELECT email FROM guest_booking_intent
        WHERE token_hash = $1 AND expires_at > clock_timestamp() FOR UPDATE`, [hashBookingValue(options.guestToken!)]);
      if (!intent.rowCount) throw new HttpError(400, 'Bekräftelselänken är ogiltig eller har gått ut. Begär en ny länk.');
    }
    const duplicate = await existingRequest(client);
    if (duplicate) {
      await client.query('COMMIT');
      return bookingResult(db, duplicate.id, email);
    }
    await assertReservationAllowed(client, email, userId);
    const { rows: [usage] } = await client.query<{ bookings: string; unpaidSeats: string; screeningSeats: string }>(`
      SELECT count(DISTINCT b.id) FILTER (WHERE NOT b.is_paid) AS bookings,
        count(t.seat_id) FILTER (WHERE NOT b.is_paid) AS "unpaidSeats",
        count(t.seat_id) FILTER (WHERE b.screening_id = $3) AS "screeningSeats"
      FROM booking b JOIN screening_times s ON s.id = b.screening_id
      LEFT JOIN app_user u ON u.id = b.user_id LEFT JOIN ticket t ON t.booking_id = b.id
      WHERE b.status = 'confirmed' AND s.ends_at > clock_timestamp()
        AND (b.is_paid OR s.starts_at > clock_timestamp() + interval '15 minutes')
        AND (COALESCE(b.identity_email, lower(trim(COALESCE(b.guest_email, u.email)))) = $1 OR b.user_id = $2)`,
    [email, userId ?? null, screeningId]);
    if (Number(usage.screeningSeats) + tickets.length > config.bookingLimits.seatsPerScreening) {
      throw new HttpError(409, `Du kan boka högst ${config.bookingLimits.seatsPerScreening} platser sammanlagt till samma visning.`);
    }
    if (Number(usage.bookings) >= config.bookingLimits.unpaidBookings || Number(usage.unpaidSeats) + tickets.length > config.bookingLimits.unpaidSeats) {
      throw new HttpError(409, `Du kan ha högst ${config.bookingLimits.unpaidBookings} aktiva obetalda bokningar och ${config.bookingLimits.unpaidSeats} obetalda platser. Betala eller avboka en befintlig bokning först.`);
    }

    // The screening must exist and not have started. FOR SHARE blocks a concurrent
    // cinema/time change (updateScreening uses FOR UPDATE) until this booking commits.
    const screening = await client.query(
      "SELECT cinema_id, starts_at FROM screening WHERE id = $1 FOR SHARE",
      [screeningId],
    );
    if (screening.rowCount === 0) {
      throw new HttpError(404, "Visningen finns inte.");
    }
    if (new Date(screening.rows[0].starts_at) <= new Date()) {
      throw new HttpError(409, "Visningen har redan startat.");
    }
    if (new Date(screening.rows[0].starts_at).getTime() <= Date.now() + 15 * 60_000) {
      throw new HttpError(409, 'Nätreservationen har stängt. Köp lediga platser i biografens kassa.');
    }

    // Prices from price_group
    const priceGroupIds = [...new Set(tickets.map((t) => t.priceGroupId))];
    const groups = await client.query(
      "SELECT id FROM price_group WHERE id = ANY($1::int[])",
      [priceGroupIds],
    );
    if (groups.rowCount !== priceGroupIds.length) {
      throw new HttpError(400, "Ogiltig biljettyp.");
    }

    // Seats must belong to this screening's cinema
    const seatIds = tickets.map((t) => t.seatId);
    const seats = await client.query(
      "SELECT id FROM seat WHERE id = ANY($1::int[]) AND cinema_id = $2",
      [seatIds, screening.rows[0].cinema_id],
    );
    if (seats.rowCount !== seatIds.length) {
      throw new HttpError(400, "Ogiltiga stolar för visningen.");
    }

    // Generate unique booking reference with bookingRef utility (e.g. FV-ABC12)
    bookingRef = await generateUniqueBookingRef(async (candidateRef) => {
      const existing = await client.query(
        "SELECT 1 FROM booking WHERE booking_reference = $1",
        [candidateRef],
      );
      return existing.rowCount !== null && existing.rowCount > 0;
    });

    const finalUserId = userId ?? null;
    const finalGuestEmail = userId ? null : email;

    const booking = await client.query(
      `INSERT INTO booking (screening_id, user_id, guest_email, guest_name, booking_reference, identity_email, request_key, request_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [screeningId, finalUserId, finalGuestEmail, guestName ?? null, bookingRef, email, options.requestKey, fingerprint],
    );
    bookingId = booking.rows[0].id;

    // Create tickets (marks seats as taken)
    for (const t of tickets) {
      await client.query(
        `INSERT INTO ticket (screening_id, seat_id, booking_id, price_group_id)
         VALUES ($1, $2, $3, $4)`,
        [screeningId, t.seatId, bookingId, t.priceGroupId],
      );
    }

    // Optional kiosk items
    if (items.length > 0) {
      const itemIds = items.map((i) => i.itemId);
      const found = await client.query(
        "SELECT id FROM menu_item WHERE id = ANY($1::int[]) AND is_available",
        [itemIds],
      );
      if (found.rowCount !== itemIds.length) {
        throw new HttpError(400, "Ogiltiga eller slutsålda kioskprodukter.");
      }
      for (const i of items) {
        await client.query(
          `INSERT INTO booking_item (booking_id, menu_item_id, quantity)
           VALUES ($1, $2, $3)`,
          [bookingId, i.itemId, i.quantity],
        );
      }
    }

    const stillOpen = await client.query(`SELECT 1 FROM screening WHERE id = $1
      AND starts_at > clock_timestamp() + interval '15 minutes'`, [screeningId]);
    if (!stillOpen.rowCount) throw new HttpError(409, 'Nätreservationen har stängt. Köp lediga platser i biografens kassa.');
    if (!userId) {
      await client.query('UPDATE guest_booking_intent SET booking_id = $1, payload = $2 WHERE token_hash = $3',
        [bookingId, { ...input, email }, hashBookingValue(options.guestToken!)]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");

    if (err instanceof HttpError) throw err;
    if (isSeatTaken(err)) {
      throw new HttpError(
        409,
        "En eller flera stolar är redan bokade. Välj andra stolar.",
      );
    }
    console.error('[Booking] Creation failed');
    throw new HttpError(500, "Kunde inte skapa bokningen.");
  } finally {
    client.release();
  }
  void notify(bookingId, bookingRef, email).catch(() => console.error('[Booking] Confirmation delivery failed'));
  return bookingResult(db, bookingId, email);
  };
}

export const createBooking = createBookingService();
