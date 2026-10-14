import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { query, withTransaction } from "../utils/dbHelpers.js";
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
  from?: Date;
  to?: Date;
  movieId?: number;
  cinemaId?: number;
  age?: number;
}

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
