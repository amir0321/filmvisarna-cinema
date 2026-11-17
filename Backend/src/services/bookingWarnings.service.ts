import type pg from 'pg';
import { pool } from '../db.js';
import { normalizeBookingEmail } from '../utils/bookingIdentity.js';
import { HttpError } from '../utils/httpErorr.js';
import { isAuthEmailConfigured, sendBookingWarningEmail } from './emailService.js';

export interface ReservationWarningStatus {
  warningCount: number;
  warningLimit: number;
  windowDays: number;
  blockDays: number;
  blockedUntil: string | null;
  warnings: { id: number; bookingRef: string; screeningEndedAt: string; recordedAt: string; usedForBlock: boolean }[];
}

export interface BookingWarningEmail {
  id: number;
  email: string;
  bookingRef: string;
  warningCount: number;
  blockedUntil: string | null;
}

const WINDOW_DAYS = 90;
const BLOCK_DAYS = 30;
const WARNING_LIMIT = 3;
export const RESERVATION_BLOCKED_MESSAGE = 'Du kan inte göra nya obetalda reservationer just nu. Du kan fortfarande betala befintliga bokningar eller köpa lediga platser i kassan.';

async function lockIdentity(client: pg.PoolClient, email: string, userId?: number | null): Promise<number | null> {
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`booking-identity:${email}`]);
  const { rows: [account] } = await client.query<{ id: number }>(
    'SELECT id FROM app_user WHERE ($1::int IS NOT NULL AND id = $1) OR ($1::int IS NULL AND lower(trim(email)) = $2) LIMIT 1', [userId ?? null, email]);
  const accountId = account?.id ?? userId ?? null;
  if (accountId !== null) {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`booking-warning-user:${accountId}`]);
  }
  return accountId;
}

async function recordNoShows(client: pg.PoolClient, email: string, userId: number | null): Promise<void> {
  // Lock the same booking row as payment/cancellation, then recheck its state.
  // Both creation and film end must be after activation: no retroactive strikes.
  const { rows: due } = await client.query<{
    id: number; reference: string; email: string; user_id: number | null; ends_at: Date;
  }>(`SELECT b.id, b.booking_reference AS reference,
      lower(trim(COALESCE(b.identity_email, b.guest_email, u.email))) AS email,
      b.user_id, st.ends_at
    FROM booking b JOIN screening_times st ON st.id = b.screening_id
    LEFT JOIN app_user u ON u.id = b.user_id CROSS JOIN booking_warning_policy p
    WHERE p.id AND b.created_at >= p.activated_at AND st.ends_at >= p.activated_at
      AND st.ends_at <= clock_timestamp() AND NOT b.is_paid AND b.status <> 'cancelled'
      AND st.ends_at > clock_timestamp() - interval '90 days'
      AND (lower(trim(COALESCE(b.identity_email, b.guest_email, u.email))) = $1 OR b.user_id = $2)
      AND NOT EXISTS (SELECT 1 FROM booking_warning w WHERE w.source_booking_id = b.id)
    ORDER BY st.ends_at, b.id FOR UPDATE OF b`, [email, userId]);

  for (const booking of due) {
    const { rows: [warning] } = await client.query<{ id: number }>(`INSERT INTO booking_warning
      (source_booking_id, booking_reference, identity_email, user_id, screening_ended_at)
      VALUES ($1, $2, $3, $4, $5) ON CONFLICT (source_booking_id) DO NOTHING RETURNING id`,
    [booking.id, booking.reference, booking.email, booking.user_id ?? userId, booking.ends_at]);
    if (!warning) continue;
    const { rows: eligible } = await client.query<{ id: number }>(`SELECT id FROM booking_warning
      WHERE (identity_email = $1 OR user_id = $2) AND revoked_at IS NULL AND block_id IS NULL
        AND screening_ended_at > clock_timestamp() - interval '90 days'
      ORDER BY screening_ended_at, id`, [email, userId]);
    const active = await client.query(`SELECT id FROM booking_reservation_block
      WHERE (identity_email = $1 OR user_id = $2) AND revoked_at IS NULL AND expires_at > clock_timestamp()`, [email, userId]);
    let blockedUntil: Date | null = null;
    if (eligible.length >= WARNING_LIMIT && !active.rowCount) {
      const { rows: [block] } = await client.query<{ id: number; expires_at: Date }>(`INSERT INTO booking_reservation_block
        (identity_email, user_id, starts_at, expires_at)
        VALUES ($1, $2, clock_timestamp(), clock_timestamp() + interval '30 days') RETURNING id, expires_at`, [email, userId]);
      blockedUntil = block.expires_at;
      // Consume this group. Expiry of a block must not re-trigger the same three strikes.
      await client.query('UPDATE booking_warning SET block_id = $1 WHERE id = ANY($2::int[])',
        [block.id, eligible.slice(0, WARNING_LIMIT).map(row => row.id)]);
    }
    await client.query('UPDATE booking_warning SET notification_count = $2, notification_blocked_until = $3 WHERE id = $1',
      [warning.id, Math.min(eligible.length, WARNING_LIMIT), blockedUntil]);
  }
}

async function readStatus(client: pg.PoolClient, email: string, userId: number | null): Promise<ReservationWarningStatus> {
  const { rows: [block] } = await client.query<{ expires_at: Date }>(`SELECT expires_at FROM booking_reservation_block
    WHERE (identity_email = $1 OR user_id = $2) AND revoked_at IS NULL AND expires_at > clock_timestamp()
    ORDER BY expires_at DESC LIMIT 1`, [email, userId]);
  const { rows: warnings } = await client.query<{
    id: number; booking_reference: string; screening_ended_at: Date; recorded_at: Date; block_id: number | null;
  }>(`SELECT id, booking_reference, screening_ended_at, recorded_at, block_id FROM booking_warning
    WHERE (identity_email = $1 OR user_id = $2) AND revoked_at IS NULL
      AND screening_ended_at > clock_timestamp() - interval '90 days'
    ORDER BY screening_ended_at DESC, id DESC`, [email, userId]);
  return {
    warningCount: block ? WARNING_LIMIT : warnings.filter(warning => warning.block_id === null).length,
    warningLimit: WARNING_LIMIT, windowDays: WINDOW_DAYS, blockDays: BLOCK_DAYS,
    blockedUntil: block?.expires_at.toISOString() ?? null,
    warnings: warnings.map(warning => ({ id: warning.id, bookingRef: warning.booking_reference,
      screeningEndedAt: warning.screening_ended_at.toISOString(), recordedAt: warning.recorded_at.toISOString(), usedForBlock: warning.block_id !== null })),
  };
}

export async function getReservationWarningStatus(emailInput: string, userId?: number | null, db: pg.Pool = pool): Promise<ReservationWarningStatus> {
  const email = normalizeBookingEmail(emailInput);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const accountId = await lockIdentity(client, email, userId);
    await recordNoShows(client, email, accountId);
    const result = await readStatus(client, email, accountId);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

// Call inside the reservation transaction as well, so a background worker
// cannot activate a block between a preliminary status read and seat allocation.
export async function assertReservationAllowed(client: pg.PoolClient, emailInput: string, userId?: number | null): Promise<void> {
  const email = normalizeBookingEmail(emailInput);
  const accountId = await lockIdentity(client, email, userId);
  const status = await readStatus(client, email, accountId);
  if (status.blockedUntil) throw new HttpError(403, RESERVATION_BLOCKED_MESSAGE);
}

export async function processBookingWarnings(db: pg.Pool = pool): Promise<void> {
  const { rows: identities } = await db.query<{ email: string; user_id: number | null }>(`SELECT DISTINCT
    lower(trim(COALESCE(b.identity_email, b.guest_email, u.email))) AS email, b.user_id
    FROM booking b JOIN screening_times st ON st.id = b.screening_id
    LEFT JOIN app_user u ON u.id = b.user_id CROSS JOIN booking_warning_policy p
    WHERE p.id AND b.created_at >= p.activated_at AND st.ends_at >= p.activated_at
      AND st.ends_at <= clock_timestamp() AND NOT b.is_paid AND b.status <> 'cancelled'
      AND st.ends_at > clock_timestamp() - interval '90 days'
      AND NOT EXISTS (SELECT 1 FROM booking_warning w WHERE w.source_booking_id = b.id)
    ORDER BY email`);
  for (const identity of identities) await getReservationWarningStatus(identity.email, identity.user_id, db);
}

export async function deliverBookingWarningEmails({ db = pool, sendEmail = sendBookingWarningEmail,
  canSendEmail = isAuthEmailConfigured }: {
    db?: pg.Pool; sendEmail?: (message: BookingWarningEmail) => Promise<void>; canSendEmail?: () => boolean;
  } = {}): Promise<void> {
  if (!canSendEmail()) return; // Keep the outbox pending until SMTP is configured.
  for (let i = 0; i < 10; i++) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const { rows: [warning] } = await client.query<{
        id: number; identity_email: string; booking_reference: string; notification_count: number; notification_blocked_until: Date | null;
      }>(`SELECT id, identity_email, booking_reference, notification_count, notification_blocked_until FROM booking_warning
        WHERE email_sent_at IS NULL AND revoked_at IS NULL AND email_next_attempt_at <= clock_timestamp()
        ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED`);
      if (!warning) { await client.query('COMMIT'); return; }
      try {
        await sendEmail({ id: warning.id, email: warning.identity_email, bookingRef: warning.booking_reference,
          warningCount: warning.notification_count, blockedUntil: warning.notification_blocked_until?.toISOString() ?? null });
        await client.query('UPDATE booking_warning SET email_sent_at = clock_timestamp(), email_attempts = email_attempts + 1 WHERE id = $1', [warning.id]);
      } catch {
        await client.query(`UPDATE booking_warning SET email_attempts = email_attempts + 1,
          email_next_attempt_at = clock_timestamp() + interval '15 minutes' WHERE id = $1`, [warning.id]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }
}
