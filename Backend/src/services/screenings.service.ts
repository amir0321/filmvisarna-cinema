import { PoolClient } from "pg";
import { config } from "../config.js";
import { query, withTransaction } from "../utils/dbHelpers.js";
import { HttpError } from "../utils/httpErorr.js";
import {
  CreateScreeningInput,
  ScreeningFilters,
  ScreeningOverview,
  ScreeningSeatsResult,
  ScreeningSeatStatus,
  UpdateScreeningInput,
} from "../interfaces/types.js";

const AGE_LIMIT = `CASE WHEN m.age_rating ~ '^[0-9]+$' THEN m.age_rating::int ELSE 0 END`;

// --- Helper Functions ---

function validateScreeningStartsAt(startsAt: Date) {
  if (startsAt.getTime() <= Date.now()) {
    throw new HttpError(400, "startsAt must be in the future");
  }
}

async function assertCinemaExists(client: PoolClient, cinemaId: number, forUpdate = false) {
  const res = await client.query(
    `SELECT id FROM cinema WHERE id = $1 ${forUpdate ? "FOR UPDATE" : ""}`,
    [cinemaId],
  );
  if (res.rowCount === 0) throw new HttpError(404, "Cinema not found");
}

async function getMovieDuration(client: PoolClient, movieId: number): Promise<number> {
  const movie = await client.query<{ duration_minutes: number }>(
    "SELECT duration_minutes FROM movie WHERE id = $1",
    [movieId],
  );
  if (movie.rowCount === 0) throw new HttpError(404, "Movie not found");
  return movie.rows[0].duration_minutes;
}

async function assertNoScreeningOverlap(
  client: PoolClient,
  cinemaId: number,
  startsAt: Date,
  durationMinutes: number,
  excludeScreeningId?: number,
) {
  const buffer = config.screeningBufferMinutes;
  const clash = await client.query(
    `SELECT 1 FROM screening_times st
     WHERE st.cinema_id = $1
       AND ($5::int IS NULL OR st.id <> $5)
       AND st.starts_at < $2::timestamptz + ($3::int + $4::int) * interval '1 minute'
       AND st.ends_at + $4::int * interval '1 minute' > $2::timestamptz
     LIMIT 1`,
    [cinemaId, startsAt.toISOString(), durationMinutes, buffer, excludeScreeningId ?? null],
  );
  if (clash.rowCount && clash.rowCount > 0) {
    throw new HttpError(
      409,
      `That time overlaps another screening in this cinema (including a ${buffer} minute buffer)`,
    );
  }
}

async function assertNoActiveBookings(
  executor: { query: (text: string, params: unknown[]) => Promise<{ rowCount: number | null }> },
  screeningId: number,
  errorMessage: string,
) {
  const res = await executor.query(
    "SELECT 1 FROM booking WHERE screening_id = $1 AND status = 'confirmed' LIMIT 1",
    [screeningId],
  );
  if (res.rowCount && res.rowCount > 0) {
    throw new HttpError(409, errorMessage);
  }
}

async function getScreeningOverviewById(client: PoolClient, id: number): Promise<ScreeningOverview> {
  const res = await client.query<ScreeningOverview>(
    `SELECT st.id, st.starts_at AS "startsAt", st.ends_at AS "endsAt",
            m.id AS "movieId", m.title AS "movieTitle", m.poster_url AS "posterUrl",
            c.id AS "cinemaId", c.name AS "cinema"
     FROM screening_times st
     JOIN movie m ON m.id = st.movie_id
     JOIN cinema c ON c.id = st.cinema_id
     WHERE st.id = $1`,
    [id],
  );
  return res.rows[0];
}

// --- Exported Service Functions ---

/**
 * List upcoming screenings matching filters (date, movie, cinema, age)
 */
export async function listUpcomingScreenings(
  filters: ScreeningFilters,
): Promise<ScreeningOverview[]> {
  return query<ScreeningOverview>(
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
      filters.movieId ?? null,
      filters.cinemaId ?? null,
      filters.from ?? null,
      filters.to ?? null,
      config.timezone,
      filters.age ?? null,
    ],
  );
}

/**
 * Get seats for a screening with real-time booked / available status
 */
export async function getScreeningSeats(
  screeningId: number,
): Promise<ScreeningSeatsResult> {
  const screening = await query<{ id: number }>(
    "SELECT id FROM screening WHERE id = $1",
    [screeningId],
  );

  if (screening.length === 0) {
    throw new HttpError(404, "Screening not found");
  }

  const seats = await query<ScreeningSeatStatus>(
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

  return { screeningId, seats };
}

/**
 * Schedule a new screening with cinema lock & overlap check
 */
export async function createScreening(
  input: CreateScreeningInput,
): Promise<ScreeningOverview> {
  const startsAt = new Date(input.startsAt);
  validateScreeningStartsAt(startsAt);

  return withTransaction(async (client) => {
    await assertCinemaExists(client, input.cinemaId, true);
    const duration = await getMovieDuration(client, input.movieId);
    await assertNoScreeningOverlap(client, input.cinemaId, startsAt, duration);

    const { rows } = await client.query<{ id: number }>(
      "INSERT INTO screening (movie_id, cinema_id, starts_at) VALUES ($1, $2, $3) RETURNING id",
      [input.movieId, input.cinemaId, startsAt.toISOString()],
    );

    return getScreeningOverviewById(client, rows[0].id);
  });
}

/**
 * Update an existing screening (time, movie, cinema) with conflict and overlap checks
 */
export async function updateScreening(
  id: number,
  input: UpdateScreeningInput,
): Promise<ScreeningOverview> {
  return withTransaction(async (client) => {
    const current = await client.query<{
      id: number;
      movie_id: number;
      cinema_id: number;
      starts_at: string;
    }>(
      "SELECT id, movie_id, cinema_id, starts_at FROM screening WHERE id = $1 FOR UPDATE",
      [id],
    );
    if (current.rowCount === 0) throw new HttpError(404, "Screening not found");

    const cur = current.rows[0];
    const movieId = input.movieId ?? cur.movie_id;
    const cinemaId = input.cinemaId ?? cur.cinema_id;
    const startsAt = input.startsAt
      ? new Date(input.startsAt)
      : new Date(cur.starts_at);

    if (
      cinemaId !== cur.cinema_id ||
      (input.startsAt && startsAt.getTime() !== new Date(cur.starts_at).getTime())
    ) {
      await assertNoActiveBookings(
        client,
        id,
        "Kan inte ändra salong eller tid för en visning som har bekräftade bokningar.",
      );
    }

    if (input.startsAt) {
      validateScreeningStartsAt(startsAt);
    }

    await assertCinemaExists(client, cinemaId);
    const duration = await getMovieDuration(client, movieId);
    await assertNoScreeningOverlap(client, cinemaId, startsAt, duration, id);

    await client.query(
      "UPDATE screening SET movie_id = $1, cinema_id = $2, starts_at = $3 WHERE id = $4",
      [movieId, cinemaId, startsAt.toISOString(), id],
    );

    return getScreeningOverviewById(client, id);
  });
}

/**
 * Delete a screening if it has no active bookings
 */
export async function deleteScreening(id: number): Promise<void> {
  const existing = await query("SELECT id FROM screening WHERE id = $1", [id]);
  if (existing.length === 0) {
    throw new HttpError(404, "Screening not found");
  }

  const clientProxy = {
    query: async (text: string, params: unknown[]) => {
      const rows = await query(text, params);
      return { rowCount: rows.length };
    },
  };

  await assertNoActiveBookings(
    clientProxy,
    id,
    "Kan inte ta bort visningen eftersom den har aktiva bokningar.",
  );

  await query("DELETE FROM screening WHERE id = $1", [id]);
}
