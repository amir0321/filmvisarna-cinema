import { createHash, randomBytes } from 'node:crypto';
import type pg from 'pg';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { config } from '../config.js';
import { HttpError } from '../utils/httpErorr.js';
import { isAuthEmailConfigured, sendAuthEmail } from './emailService.js';

export type AuthAction = 'reset_password' | 'verify_email';
export interface AuthEmail {
  email: string;
  purpose: AuthAction;
  url: string;
  expiresInMinutes: number;
}

export const hashAuthToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const validAuthToken = (token: string) => /^[a-f0-9]{64}$/.test(token);

export function createAuthActionService(dependencies: {
  db: pg.Pool;
  sendEmail: (email: AuthEmail) => Promise<void>;
  canSendEmail: () => boolean;
  frontendUrl: string;
}) {
  const { db, sendEmail, canSendEmail, frontendUrl } = dependencies;

  async function limit(key: string, maximum: number, seconds = 900): Promise<boolean> {
    // Database-backed buckets apply across workers; no e-mail addresses or IPs are stored.
    const result = await db.query<{ attempts: number }>(`
      INSERT INTO auth_rate_limit (key_hash, window_start, attempts) VALUES ($1, clock_timestamp(), 1)
      ON CONFLICT (key_hash) DO UPDATE SET
        attempts = CASE WHEN auth_rate_limit.window_start <= clock_timestamp() - make_interval(secs => $2)
          THEN 1 ELSE auth_rate_limit.attempts + 1 END,
        window_start = CASE WHEN auth_rate_limit.window_start <= clock_timestamp() - make_interval(secs => $2)
          THEN clock_timestamp() ELSE auth_rate_limit.window_start END
      RETURNING attempts`, [hashAuthToken(key), seconds]);
    return result.rows[0].attempts <= maximum;
  }

  async function clearLimit(key: string): Promise<void> {
    await db.query('DELETE FROM auth_rate_limit WHERE key_hash = $1', [hashAuthToken(key)]);
  }

  function assertEmailConfigured() {
    if (!canSendEmail()) throw new HttpError(503, 'E-posttjänsten är tillfälligt otillgänglig. Försök igen senare.');
  }

  async function sendLink(email: string, purpose: AuthAction): Promise<boolean> {
    assertEmailConfigured();
    const normalizedEmail = email.trim().toLowerCase();
    if (purpose === 'verify_email' && !await limit(`${purpose}:cooldown:${normalizedEmail}`, 1, 60)) return false;
    if (!await limit(`${purpose}:email:${normalizedEmail}`, 3)) return false;
    const token = randomBytes(32).toString('hex');
    const tokenHash = hashAuthToken(token);
    const minutes = purpose === 'reset_password' ? 30 : 24 * 60;
    // New requests replace earlier links. Serialize issuance and consumption on the user row.
    const client = await db.connect();
    let userId: number | undefined;
    try {
      await client.query('BEGIN');
      const { rows } = await client.query<{ id: number; is_verified: boolean }>(
        'SELECT id, is_verified FROM app_user WHERE email = $1 FOR UPDATE', [normalizedEmail]);
      userId = rows[0]?.id;
      if (userId && (purpose !== 'verify_email' || !rows[0].is_verified)) {
        await client.query(`INSERT INTO auth_action_token (user_id, purpose, token_hash, expires_at)
          VALUES ($1, $2, $3, clock_timestamp() + make_interval(mins => $4))
          ON CONFLICT (user_id, purpose) DO UPDATE SET token_hash = EXCLUDED.token_hash, expires_at = EXCLUDED.expires_at`,
        [userId, purpose, tokenHash, minutes]);
      } else userId = undefined;
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
    if (!userId) return false;
    const url = new URL(purpose === 'reset_password' ? '/reset-password' : '/verify-email', frontendUrl);
    // Fragments stay out of HTTP access logs and Referer headers.
    url.hash = new URLSearchParams({ token }).toString();
    try {
      await sendEmail({ email: normalizedEmail, purpose, url: url.href, expiresInMinutes: minutes });
      return true;
    } catch {
      await db.query('DELETE FROM auth_action_token WHERE token_hash = $1', [tokenHash]);
      // Do not log credentials, recipients, links or SMTP errors containing message content.
      console.error(`[Auth] ${purpose} email delivery failed`);
      throw new HttpError(503, 'Mejlet kunde inte skickas just nu. Försök igen senare.');
    }
  }

  async function consume(token: string, purpose: AuthAction, passwordHash?: string): Promise<string> {
    const invalidLink = () => new HttpError(400, 'Länken är ogiltig, har redan använts eller har gått ut. Begär en ny länk.');
    if (!validAuthToken(token)) throw invalidLink();
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query<{ user_id: number }>(
        'SELECT user_id FROM auth_action_token WHERE token_hash = $1 AND purpose = $2', [hashAuthToken(token), purpose]);
      if (!rows[0]) throw invalidLink();
      // All token operations lock in the same order, avoiding reset/resend deadlocks.
      const user = await client.query<{ email: string }>('SELECT email FROM app_user WHERE id = $1 FOR UPDATE', [rows[0].user_id]);
      const consumed = await client.query(`DELETE FROM auth_action_token
        WHERE token_hash = $1 AND purpose = $2 AND expires_at > clock_timestamp() RETURNING user_id`, [hashAuthToken(token), purpose]);
      if (!consumed.rowCount || !user.rows[0]) throw invalidLink();
      if (purpose === 'reset_password') {
        await client.query('UPDATE app_user SET password_hash = $1, auth_version = auth_version + 1 WHERE id = $2', [passwordHash, rows[0].user_id]);
      } else {
        await client.query('UPDATE app_user SET is_verified = true WHERE id = $1', [rows[0].user_id]);
      }
      await client.query('COMMIT');
      return user.rows[0].email;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  return {
    limit, clearLimit, assertEmailConfigured, sendLink,
    verifyEmail: (token: string) => consume(token, 'verify_email'),
    async resetPassword(token: string, newPassword: string) {
      // Check syntax before the expensive hash; consumption still validates expiry atomically.
      if (!validAuthToken(token)) throw new HttpError(400, 'Länken är ogiltig. Begär en ny länk.');
      return consume(token, 'reset_password', await bcrypt.hash(newPassword, 12));
    },
  };
}

export const authActionService = createAuthActionService({
  db: pool, sendEmail: sendAuthEmail, canSendEmail: isAuthEmailConfigured, frontendUrl: config.frontendUrl,
});
