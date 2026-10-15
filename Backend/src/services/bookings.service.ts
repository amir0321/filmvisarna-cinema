import { pool } from "../db.js";
import { config } from "../config.js";
import { HttpError } from "../utils/httpErorr.js";
import { generateUniqueBookingRef } from "../utils/bookingRef.js";
import { sendBookingConfirmation } from "./emailService.js";

export interface TicketInput {
  seatId: number;
  priceGroupId: number;
}

export interface ItemInput {
  itemId: number;
  quantity: number;
}

export interface CreateBookingInput {
  screeningId: number;
  email: string;
  guestName?: string | null;
  tickets: TicketInput[];
  items?: ItemInput[];
}

export interface CreateBookingResult {
  bookingRef: string;
  totalPrice: number;
}

// SQL för att hämta kompletta bokningsdetaljer med film, salong, biljetter och kioskvaror
const BOOKING_DETAILS_QUERY = `
  SELECT b.id, b.booking_reference AS "reference", b.status,
         b.created_at AS "createdAt",
         b.guest_name AS "guestName", b.guest_email AS "guestEmail",
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

async function sendConfirmationFor(
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
  });
}

async function fetchBookings(where: string, params: unknown[]) {
  const { rows } = await pool.query(
    `${BOOKING_DETAILS_QUERY} WHERE ${where} ORDER BY st.starts_at DESC`,
    params,
  );
  return rows;
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

    await client.query("COMMIT");

    sendConfirmationFor(bookingId, bookingRef, email).catch((err) =>
      console.error("Confirmation email failed:", err),
    );

    return { bookingRef, totalPrice: total };
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

export interface CancelBookingResult {
  id: number;
  reference: string;
  status: string;
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

    if (new Date(booking.starts_at) <= new Date()) {
      throw new HttpError(
        400,
        "Cannot cancel a booking for a screening that has already started",
      );
    }

    // Free the seats so they become available to book again
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

