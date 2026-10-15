import { Router } from "express";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth.js";
import { Queryable } from "../utils/dbHelpers.js";
import { HttpError } from "../utils/httpErorr.js";
import { pool } from "../db.js";
import { generateUniqueBookingRef } from "../utils/bookingRef.js";
import { sendBookingConfirmation } from "../services/emailService.js";
import { config } from "../config.js";
import z from "zod";

export const bookingsRouter = Router();

interface TicketInput {
  seatId: number;
  priceGroupId: number;
}

interface ItemInput {
  itemId: number;
  quantity: number;
}

const isId = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

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

async function fetchBookings(db: Queryable, where: string, params: unknown[]) {
  const { rows } = await db.query(
    `SELECT b.id, b.booking_reference AS "reference", b.status,
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
     WHERE ${where}
     ORDER BY st.starts_at DESC`,
    params,
  );
  return rows;
}

// GET /api/bookings/me (all bookings for the authenticated user)
bookingsRouter.get("/me", requireAuth, async (req, res) => {
  res.json(await fetchBookings(pool, "b.user_id = $1", [req.user!.id]));
});

// GET /api/bookings/lookup?reference=FV-ABC12
// Admin only: staff check a ticket at the door. Finds guest and logged-in bookings alike.
bookingsRouter.get("/lookup", requireAdmin, async (req, res) => {
  const { reference } = z
    .object({ reference: z.string().trim().min(1).max(50) })
    .parse(req.query);

  const rows = await fetchBookings(
    pool,
    "upper(b.booking_reference) = upper($1)",
    [reference],
  );
  if (rows.length === 0)
    throw new HttpError(404, "No booking found with that reference");
  res.json(rows[0]);
});

// POST /api/bookings (create a new booking)
bookingsRouter.post("/", optionalAuth, async (req, res) => {
  const body = req.body ?? {};
  const screeningId: unknown = body.screeningId;
  const rawEmail: unknown = req.user?.email ?? body.email;
  const guestName: string | null = body.guestName ?? null;
  const rawTickets: unknown = body.tickets;
  const rawItems: unknown = body.items ?? [];

  if (!isId(screeningId)) {
    res.status(400).json({ error: "Ogiltigt visnings-id." });
    return;
  }
  if (typeof rawEmail !== "string" || !rawEmail.includes("@")) {
    res.status(400).json({ error: "Ogiltig e-postadress." });
    return;
  }
  const email = rawEmail.trim().toLowerCase();

  if (
    !Array.isArray(rawTickets) ||
    rawTickets.length < 1 ||
    rawTickets.length > 10
  ) {
    res.status(400).json({ error: "Välj mellan 1 och 10 stolar." });
    return;
  }
  if (!Array.isArray(rawItems)) {
    res.status(400).json({ error: "Ogiltiga kioskprodukter." });
    return;
  }

  const tickets: TicketInput[] = [];
  for (const t of rawTickets) {
    if (!isId(t?.seatId) || !isId(t?.priceGroupId)) {
      res.status(400).json({ error: "Ogiltig stol eller biljettyp." });
      return;
    }
    tickets.push({ seatId: t.seatId, priceGroupId: t.priceGroupId });
  }
  if (new Set(tickets.map((t) => t.seatId)).size !== tickets.length) {
    res.status(400).json({ error: "Samma stol två gånger." });
    return;
  }

  const items: ItemInput[] = [];
  for (const i of rawItems) {
    if (
      !isId(i?.itemId) ||
      !Number.isInteger(i?.quantity) ||
      i.quantity < 1 ||
      i.quantity > 20
    ) {
      res.status(400).json({ error: "Ogiltig kioskprodukt." });
      return;
    }
    items.push({ itemId: i.itemId, quantity: i.quantity });
  }
  if (new Set(items.map((i) => i.itemId)).size !== items.length) {
    res.status(400).json({ error: "Samma produkt två gånger." });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // The screening must exist and not have started
    const screening = await client.query(
      "SELECT cinema_id, starts_at FROM screening WHERE id = $1",
      [screeningId],
    );
    if (screening.rowCount === 0)
      throw new HttpError(404, "Visningen finns inte.");
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

    const userId = req.user?.id ?? null;
    const guestEmail = req.user ? null : email;

    const booking = await client.query(
      `INSERT INTO booking (screening_id, user_id, guest_email, guest_name, booking_reference)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [screeningId, userId, guestEmail, guestName, bookingRef],
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
    res.status(201).json({ bookingRef, totalPrice: total });

    sendConfirmationFor(bookingId, bookingRef, email).catch((err) =>
      console.error("Confirmation email failed:", err),
    );
  } catch (err) {
    await client.query("ROLLBACK");

    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    if (isSeatTaken(err)) {
      res.status(409).json({
        error: "En eller flera stolar är redan bokade. Välj andra stolar.",
      });
      return;
    }
    console.error("POST /api/bookings failed", err);
    res.status(500).json({ error: "Kunde inte skapa bokningen." });
  } finally {
    client.release();
  }
});
