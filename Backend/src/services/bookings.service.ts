import { config } from "../config.js";
import { pool } from "../db.js";
import { HttpError } from "../utils/httpErorr.js";
import { generateUniqueBookingRef } from "../utils/bookingRef.js";
import { sendConfirmationForBooking } from "./bookingNotification.service.js";
import { generateCancellationJwt } from "./cancellations.service.js";

import {
  BookingFilters,
  CreateBookingInput,
  CreateBookingResult,
  ItemInput,
  TicketInput,
  UpdateBookingInput,
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
};

// SQL för att hämta kompletta bokningsdetaljer med film, salong, biljetter och kioskvaror
const BOOKING_DETAILS_QUERY = `
  SELECT b.id, b.booking_reference AS "reference", b.status,
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
    (err as { constraint?: string }).constraint === "ticket_pkey"
  );
}

async function fetchBookings(where: string, params: unknown[]) {
  const { rows } = await pool.query(
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
    conditions.push(`b.status = $${params.length}`);
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
) {
  const { isPaid, isCheckedIn } = input;
  if (isPaid === undefined && isCheckedIn === undefined) {
    throw new HttpError(400, "Minst ett fält (isPaid eller isCheckedIn) måste anges.");
  }

  const existing = await pool.query(
    "SELECT id, status, is_paid, is_checked_in FROM booking WHERE id = $1",
    [bookingId],
  );
  if (existing.rowCount === 0) {
    throw new HttpError(404, "Bokningen hittades inte.");
  }

  const updates: string[] = [];
  const params: unknown[] = [bookingId];

  if (isPaid !== undefined) {
    params.push(isPaid);
    updates.push(`is_paid = $${params.length}`);
    if (isPaid) {
      updates.push(`paid_at = now()`);
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

  await pool.query(
    `UPDATE booking SET ${updates.join(", ")} WHERE id = $1`,
    params,
  );

  const updatedRows = await fetchBookings("b.id = $1", [bookingId]);
  return updatedRows[0];
}

export async function getUserBookings(userId: number) {
  return fetchBookings("b.user_id = $1", [userId]);
}

export async function getBookingByReference(reference: string) {
  const rows = await fetchBookings("upper(b.booking_reference) = upper($1)", [
    reference,
  ]);
  if (rows.length === 0) {
    throw new HttpError(404, "No booking found with that reference");
  }
  return rows[0];
}

export async function createBooking(
  input: CreateBookingInput,
  userId?: number | null,
): Promise<CreateBookingResult> {
  const { screeningId, email, guestName, tickets, items = [] } = input;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // The screening must exist and not have started
    const screening = await client.query(
      "SELECT cinema_id, starts_at FROM screening WHERE id = $1",
      [screeningId],
    );
    if (screening.rowCount === 0) {
      throw new HttpError(404, "Visningen finns inte.");
    }
    if (new Date(screening.rows[0].starts_at) <= new Date()) {
      throw new HttpError(409, "Visningen har redan startat.");
    }

    // Prices from price_group
    const priceGroupIds = [...new Set(tickets.map((t) => t.priceGroupId))];
    const groups = await client.query(
      "SELECT id, price FROM price_group WHERE id = ANY($1::int[])",
      [priceGroupIds],
    );
    if (groups.rowCount !== priceGroupIds.length) {
      throw new HttpError(400, "Ogiltig biljettyp.");
    }
    const priceOfGroup = new Map<number, number>(
      groups.rows.map((g: { id: number; price: string }) => [
        g.id,
        Number(g.price),
      ]),
    );

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
    const bookingRef = await generateUniqueBookingRef(async (candidateRef) => {
      const existing = await client.query(
        "SELECT 1 FROM booking WHERE booking_reference = $1",
        [candidateRef],
      );
      return existing.rowCount !== null && existing.rowCount > 0;
    });

    const finalUserId = userId ?? null;
    const finalGuestEmail = userId ? null : email;

    const booking = await client.query(
      `INSERT INTO booking (screening_id, user_id, guest_email, guest_name, booking_reference)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [screeningId, finalUserId, finalGuestEmail, guestName ?? null, bookingRef],
    );
    const bookingId: number = booking.rows[0].id;

    // Create tickets (marks seats as taken)
    let total = 0;
    for (const t of tickets) {
      const price = priceOfGroup.get(t.priceGroupId)!;
      await client.query(
        `INSERT INTO ticket (screening_id, seat_id, booking_id, price_group_id)
         VALUES ($1, $2, $3, $4)`,
        [screeningId, t.seatId, bookingId, t.priceGroupId],
      );
      total += price;
    }

    // Optional kiosk items
    if (items.length > 0) {
      const itemIds = items.map((i) => i.itemId);
      const found = await client.query(
        "SELECT id, price FROM menu_item WHERE id = ANY($1::int[]) AND is_available",
        [itemIds],
      );
      if (found.rowCount !== itemIds.length) {
        throw new HttpError(400, "Ogiltiga eller slutsålda kioskprodukter.");
      }
      const priceOfItem = new Map<number, number>(
        found.rows.map((i: { id: number; price: string }) => [
          i.id,
          Number(i.price),
        ]),
      );
      for (const i of items) {
        const price = priceOfItem.get(i.itemId)!;
        await client.query(
          `INSERT INTO booking_item (booking_id, menu_item_id, quantity)
           VALUES ($1, $2, $3)`,
          [bookingId, i.itemId, i.quantity],
        );
        total += price * i.quantity;
      }
    }

    const cancelToken = generateCancellationJwt(bookingRef, email);

    await client.query("COMMIT");

    sendConfirmationForBooking(bookingId, bookingRef, email).catch((err) =>
      console.error("Confirmation email failed:", err),
    );

    const created = await fetchBookings("b.id = $1", [bookingId]);

    return {
      bookingRef,
      totalPrice: total,
      booking: created[0] ?? null,
      cancelToken,
    };
  } catch (err) {
    await client.query("ROLLBACK");

    if (err instanceof HttpError) throw err;
    if (isSeatTaken(err)) {
      throw new HttpError(
        409,
        "En eller flera stolar är redan bokade. Välj andra stolar.",
      );
    }
    console.error("createBooking failed:", err);
    throw new HttpError(500, "Kunde inte skapa bokningen.");
  } finally {
    client.release();
  }
}
