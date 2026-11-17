import type pg from 'pg';
import { pool } from '../db.js';

// One statement releases reservations and their seat locks atomically. It can
// run in the cleanup job or inside a cashier transaction before reallocating seats.
export async function releaseExpiredReservations(db: pg.Pool | pg.PoolClient = pool, screeningId?: number): Promise<void> {
  await db.query(`WITH due AS (
    SELECT b.id FROM booking b JOIN screening st ON st.id = b.screening_id
    WHERE b.status = 'confirmed' AND NOT b.is_paid
      AND st.starts_at <= statement_timestamp() + interval '15 minutes'
      AND ($1::int IS NULL OR b.screening_id = $1)
    ORDER BY b.id FOR UPDATE OF b SKIP LOCKED
  ), expired AS (
    UPDATE booking b SET status = 'expired' FROM due WHERE b.id = due.id RETURNING b.id
  )
  UPDATE ticket t SET is_active = false FROM expired WHERE t.booking_id = expired.id`, [screeningId ?? null]);
}
