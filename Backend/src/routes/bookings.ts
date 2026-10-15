import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { Queryable } from "../utils/dbHelpers";
import { HttpError } from "../utils/httpErorr";
import { pool } from "../db";
import z from "zod";

export const bookingsRouter = Router();

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

// GET /api/bookings/lookup?reference=CIN-ABC123
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

/**
 * DELETE /api/bookings/:id
 * Cancel a booking owned by the authenticated user.
 */
bookingsRouter.delete("/:id", requireAuth, async (req, res) => {
  const bookingId = Number(req.params.id);

  if (!Number.isSafeInteger(bookingId) || bookingId <= 0) {
    throw new HttpError(400, "Invalid booking ID");
  }

  const { rows } = await pool.query(
    `UPDATE booking
     SET status = 'cancelled'
     WHERE id = $1
       AND user_id = $2
       AND status = 'confirmed'
     RETURNING id, booking_reference AS "reference", status`,
    [bookingId, req.user!.id],
  );

  if (rows.length === 0) {
    throw new HttpError(
      404,
      "Booking not found or already cancelled",
    );
  }

  res.json({
    success: true,
    message: "Booking cancelled successfully",
    booking: rows[0],
  });
});