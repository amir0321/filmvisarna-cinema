import { createHash, randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { pool } from '../db';

export const sessionCookieName = config.nodeEnv === 'production'
  ? '__Host-filmvisarna_session' : 'filmvisarna_session';
const cookieOptions = { httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'lax' as const, path: '/' };

export function getSessionToken(req: Request): string | undefined {
  const cookies = (req.headers.cookie ?? '').split(';').map(value => value.trim());
  const matches = cookies.filter(value => value.startsWith(`${sessionCookieName}=`));
  // Ambiguous cookies must never select a different session depending on the parser.
  if (matches.length !== 1) return undefined;
  const value = matches[0]!.slice(sessionCookieName.length + 1);
  return value || undefined;
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: number, authVersion = 0) {
  const token = jwt.sign({ version: authVersion }, config.jwtSecret, {
    subject: String(userId), jwtid: randomUUID(),
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'], algorithm: 'HS256',
  });
  const expiresAt = (jwt.decode(token) as jwt.JwtPayload).exp! * 1000;
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) throw new Error('Invalid session lifetime');
  await pool.query('DELETE FROM auth_session WHERE expires_at <= now()');
  await pool.query('INSERT INTO auth_session (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [hashSessionToken(token), userId, new Date(expiresAt)]);
  return { token, expiresAt };
}

export function setSessionCookie(res: Response, session: { token: string; expiresAt: number }) {
  res.cookie(sessionCookieName, session.token, { ...cookieOptions, expires: new Date(session.expiresAt) });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(sessionCookieName, cookieOptions);
}

export async function revokeSession(req: Request) {
  const token = getSessionToken(req);
  if (token) await pool.query('DELETE FROM auth_session WHERE token_hash = $1', [hashSessionToken(token)]);
}
