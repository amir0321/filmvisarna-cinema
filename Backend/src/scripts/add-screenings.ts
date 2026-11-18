import type { Pool } from 'pg';
import { config } from '../config.js';
import { pool } from '../db.js';

/** Fill gaps in the next three weeks without touching existing screenings/bookings. */
export async function refillScreenings(db: Pick<Pool, 'connect'> = pool): Promise<number> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    // Also protects against another CLI/pm2 process doing the same work.
    const lock = await client.query<{ acquired: boolean }>(
      "SELECT pg_try_advisory_xact_lock(hashtext('filmvisarna:refill-screenings')) AS acquired",
    );
    if (!lock.rows[0].acquired) {
      await client.query('COMMIT');
      return 0;
    }
    // Share the cinema row locks used by the admin's screening creation.
    const cinemas = await client.query<{ id: number }>(
      `SELECT c.id FROM cinema c WHERE EXISTS (SELECT 1 FROM seat s WHERE s.cinema_id=c.id)
       ORDER BY c.id FOR UPDATE OF c`,
    );
    const movies = await client.query<{ id: number; duration_minutes: number; release_date: string | null }>(
      'SELECT id, duration_minutes, release_date::text FROM movie ORDER BY id',
    );
    const slots = await client.query<{ starts_at: Date; local_date: string; day: number; slot: number }>(
      `SELECT ((now() AT TIME ZONE $1)::date + d.day + t.time) AT TIME ZONE $1 AS starts_at,
              ((now() AT TIME ZONE $1)::date + d.day)::text AS local_date, d.day, t.slot
       FROM generate_series(0, $2::int - 1) d(day)
       CROSS JOIN (VALUES (0, time '12:00'), (1, time '16:00'), (2, time '20:00')) t(slot, time)
       WHERE ((now() AT TIME ZONE $1)::date + d.day + t.time) AT TIME ZONE $1 > now()
       ORDER BY d.day, t.slot`,
      [config.timezone, config.screeningsRefillDays],
    );
    let added = 0;
    for (const [cinemaIndex, cinema] of cinemas.rows.entries()) {
      for (const slot of slots.rows) {
        const eligible = movies.rows.filter(movie => !movie.release_date || movie.release_date <= slot.local_date);
        if (!eligible.length) continue;
        const offset = (slot.day * 3 + slot.slot + cinemaIndex) % eligible.length;
        for (let index = 0; index < eligible.length; index++) {
          const movie = eligible[(offset + index) % eligible.length];
          const inserted = await client.query(
            `INSERT INTO screening (movie_id, cinema_id, starts_at)
             SELECT $1, $2, $3::timestamptz
             WHERE NOT EXISTS (
               SELECT 1 FROM screening_times st WHERE st.cinema_id=$2
                 AND st.starts_at < $3::timestamptz + ($4::int + $5::int) * interval '1 minute'
                 AND st.ends_at + $5::int * interval '1 minute' > $3::timestamptz
             ) ON CONFLICT (cinema_id, starts_at) DO NOTHING`,
            [movie.id, cinema.id, slot.starts_at, movie.duration_minutes, config.screeningBufferMinutes],
          );
          if (inserted.rowCount) {
            added += inserted.rowCount;
            break;
          }
          // An occupied start cannot fit any other movie either.
          const occupied = await client.query(
            `SELECT 1 FROM screening_times WHERE cinema_id=$1
             AND starts_at <= $2::timestamptz AND ends_at + $3::int * interval '1 minute' > $2::timestamptz`,
            [cinema.id, slot.starts_at, config.screeningBufferMinutes],
          );
          if (occupied.rowCount) break;
        }
      }
    }
    await client.query('COMMIT');
    return added;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  refillScreenings()
    .then(added => console.log(`Lade till ${added} visningar`))
    .catch(() => { console.error('Påfyllning misslyckades. Kontrollera databas och migreringar.'); process.exitCode = 1; })
    .finally(() => pool.end());
}
