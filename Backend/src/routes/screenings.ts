import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { query, withTransaction } from "../utils/dbHelpers.js";
import { dateRange } from "../utils/dates.js";
import { HttpError, parseId } from "../utils/httpErorr";
import { requireAdmin } from "../middleware/auth.js";

export const screeningsRouter = Router();

const AGE_LIMIT = `CASE WHEN m.age_rating ~ '^[0-9]+$' THEN m.age_rating::int ELSE 0 END`;

const optionalInt = (min: number, max = 1_000_000) =>
  z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().int().min(min).max(max).optional(),
  );

const filters = z.object({
  movieId: optionalInt(1),
  cinemaId: optionalInt(1),
  age: optionalInt(0, 120),
});

const listQuery = filters
  .extend({
    when: z.enum(["today", "tomorrow", "weekend"]).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
      .optional(),
  })
  .refine((q) => !(q.when && q.date), {
    message: 'Use either "when" or "date", not both',
    path: ["when"],
  });

interface ScreeningFilters {
  from?: string;
  to?: string;
  movieId?: number;
  cinemaId?: number;
  age?: number;
}

/** Upcoming screenings only */
async function listScreenings(f: ScreeningFilters) {
  return query(
    `SELECT st.id, st.starts_at AS "startsAt", st.ends_at AS "endsAt",
            m.id AS "movieId", m.title AS "movieTitle", m.poster_url AS "posterUrl",
            m.age_rating AS "ageRating", (${AGE_LIMIT}) AS "ageLimit",
            c.id AS "cinemaId", c.name AS "cinema"
     FROM screening_times st
     JOIN movie m  ON m.id = st.movie_id
     JOIN cinema c ON c.id = st.cinema_id
     WHERE st.starts_at > now()
       AND ($1::int  IS NULL OR st.movie_id  = $1)
       AND ($2::int  IS NULL OR st.cinema_id = $2)
       AND ($3::date IS NULL OR (st.starts_at AT TIME ZONE $5)::date >= $3::date)
       AND ($4::date IS NULL OR (st.starts_at AT TIME ZONE $5)::date <= $4::date)
       AND ($6::int  IS NULL OR (${AGE_LIMIT}) <= $6)
     ORDER BY st.starts_at`,
    [
      f.movieId ?? null,
      f.cinemaId ?? null,
      f.from ?? null,
      f.to ?? null,
      config.timezone,
      f.age ?? null,
    ],
  );
}

// GET /api/screenings?when=today|tomorrow|weekend&movieId=...&cinemaId=...&age=...
screeningsRouter.get("/", async (req, res) => {
  const q = listQuery.parse(req.query);
  const range = q.when
    ? dateRange(q.when, config.timezone)
    : q.date
      ? { from: q.date, to: q.date }
      : {};
  res.json(
    await listScreenings({
      ...range,
      movieId: q.movieId,
      cinemaId: q.cinemaId,
      age: q.age,
    }),
  );
});

// GET /api/screenings/today?age=11   (only today's screenings that have not started yet)
screeningsRouter.get("/today", async (req, res) => {
  const q = filters.parse(req.query);
  res.json(
    await listScreenings({ ...dateRange("today", config.timezone), ...q }),
  );
});

// POST /api/admin/screenings   (pick movie, cinema and start time)
const createScreeningBody = z.object({
  movieId: z.number().int().positive(),
  cinemaId: z.number().int().positive(),
  startsAt: z.string().datetime({ offset: true }),
});

screeningsRouter.post("/", requireAdmin, async (req, res) => {
  const body = createScreeningBody.parse(req.body);
  const startsAt = new Date(body.startsAt);
  if (startsAt.getTime() <= Date.now())
    throw new HttpError(400, "startsAt must be in the future");

  const screening = await withTransaction(async (client) => {
    // Lock the cinema row so two admins cannot book the same room at the same time
    const cinema = await client.query(
      "SELECT id FROM cinema WHERE id = $1 FOR UPDATE",
      [body.cinemaId],
    );
    if (cinema.rowCount === 0) throw new HttpError(404, "Cinema not found");

    const movie = await client.query<{ duration_minutes: number }>(
      "SELECT duration_minutes FROM movie WHERE id = $1",
      [body.movieId],
    );
    if (movie.rowCount === 0) throw new HttpError(404, "Movie not found");

    // Overlap check: the new run (start to start + duration) plus the cleaning buffer
    // must not touch any existing screening in the same cinema.
    const clash = await client.query(
      `SELECT 1 FROM screening_times st
       WHERE st.cinema_id = $1
         AND st.starts_at < $2::timestamptz + ($3::int + $4::int) * interval '1 minute'
         AND st.ends_at + $4::int * interval '1 minute' > $2::timestamptz
       LIMIT 1`,
      [
        body.cinemaId,
        startsAt.toISOString(),
        movie.rows[0].duration_minutes,
        config.screeningBufferMinutes,
      ],
    );
    if (clash.rowCount && clash.rowCount > 0) {
      throw new HttpError(
        409,
        `That time overlaps another screening in this cinema (including a ${config.screeningBufferMinutes} minute buffer)`,
      );
    }

    const { rows } = await client.query<{ id: number }>(
      "INSERT INTO screening (movie_id, cinema_id, starts_at) VALUES ($1, $2, $3) RETURNING id",
      [body.movieId, body.cinemaId, startsAt.toISOString()],
    );

    const created = await client.query(
      `SELECT st.id, st.starts_at AS "startsAt", st.ends_at AS "endsAt",
              m.title AS "movieTitle", c.name AS "cinema"
       FROM screening_times st
       JOIN movie m ON m.id = st.movie_id
       JOIN cinema c ON c.id = st.cinema_id
       WHERE st.id = $1`,
      [rows[0].id],
    );
    return created.rows[0];
  });

  res.status(201).json(screening);
});

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
