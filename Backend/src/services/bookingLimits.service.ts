import { createHash } from 'node:crypto';
import type pg from 'pg';
import { pool } from '../db.js';
import { HttpError } from '../utils/httpErorr.js';

export const normalizeBookingEmail = (email: string) => email.trim().toLowerCase();
export const hashBookingValue = (value: string) => createHash('sha256').update(value).digest('hex');

export async function consumeBookingLimit(db: pg.Pool, key: string, maximum: number, seconds = 900, cooldownSeconds = 0): Promise<void> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const hash = hashBookingValue(key);
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`booking-rate:${hash}`]);
    const { rows: [clock] } = await client.query<{ now: Date }>('SELECT clock_timestamp() AS now');
    const { rows: [bucket] } = await client.query<{ attempts: Date[] }>('SELECT attempts FROM booking_rate_limit WHERE key_hash = $1', [hash]);
    const now = clock.now.getTime();
    const attempts = (bucket?.attempts ?? []).filter(value => value.getTime() > now - seconds * 1000);
    const last = attempts.at(-1)?.getTime();
    if (attempts.length >= maximum || (last !== undefined && now - last < cooldownSeconds * 1000)) {
      throw new HttpError(429, 'För många försök. Vänta en stund och försök igen.');
    }
    attempts.push(clock.now);
    await client.query(`INSERT INTO booking_rate_limit(key_hash, attempts, expires_at) VALUES ($1, $2, $3)
      ON CONFLICT (key_hash) DO UPDATE SET attempts = EXCLUDED.attempts, expires_at = EXCLUDED.expires_at`,
    [hash, attempts, new Date(now + seconds * 1000)]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

export async function cleanupBookingProtection(db: pg.Pool = pool): Promise<void> {
  await db.query('DELETE FROM guest_booking_intent WHERE expires_at <= clock_timestamp()');
  await db.query('DELETE FROM booking_rate_limit WHERE expires_at <= clock_timestamp()');
}
