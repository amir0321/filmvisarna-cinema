import { Router } from "express";
import { query } from "../utils/dbHelpers";

export const screeningsRouter = Router();
// Get seats for a specific screening
screeningsRouter.get("/:id/seats", async (req, res) => {
  const screeningId = Number(req.params.id);

  if (!Number.isSafeInteger(screeningId) || screeningId <= 0) {
    res.status(400).json({ error: "Invalid screening ID" });
    return;
  }

  const screening = await query("SELECT id FROM screening WHERE id = $1", [
    screeningId,
  ]);

  if (screening.length === 0) {
    res.status(404).json({ error: "Screening not found" });
    return;
  }

  const seats = await query(
    `SELECT
     s.id,
     s.row_label,
     s.seat_number,
     CASE
       WHEN EXISTS (
         SELECT 1
         FROM ticket t
         JOIN booking b
           ON b.id = t.booking_id
          AND b.screening_id = t.screening_id
         WHERE t.screening_id = sc.id
           AND t.seat_id = s.id
           AND b.status = 'confirmed'
       )
       THEN 'booked'
       ELSE 'available'
     END AS status
   FROM screening sc
   JOIN seat s ON s.cinema_id = sc.cinema_id
   WHERE sc.id = $1
   ORDER BY s.row_label, s.seat_number`,
    [screeningId],
  );

  res.json({ screeningId, seats });
});
