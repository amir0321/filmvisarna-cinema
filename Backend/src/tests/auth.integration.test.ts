import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Server } from 'node:http';
import express, { type NextFunction, type Request, type Response } from 'express';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';
import type { AuthEmail } from '../services/authActions.service.js';

// Never fall back to DATABASE_URL/.env: integration tests require a dedicated database.
const databaseUrl = process.env.AUTH_TEST_DATABASE_URL;
const password = 'AuthTestPassword123!';
interface ApiBody {
  token: string;
  user: { id: number; email: string; isVerified: boolean };
  verificationEmailSent: boolean;
  error: string;
  message: string;
}

describe('auth API with PostgreSQL', { skip: !databaseUrl }, () => {
  let pool: pg.Pool;
  let admin: pg.Pool;
  let server: Server;
  let baseUrl: string;
  const schema = `auth_test_${randomUUID().replaceAll('-', '')}`;
  const messages: AuthEmail[] = [];
  const deliveries: Promise<unknown>[] = [];
  let smtpConfigured = true;
  let deliveryFails = false;
  let signToken: (id: number, version?: number) => string;

  before(async () => {
    admin = new pg.Pool({ connectionString: databaseUrl });
    await admin.query(`CREATE SCHEMA "${schema}"`);
    const isolatedUrl = new URL(databaseUrl!);
    isolatedUrl.searchParams.set('options', `-c search_path=${schema}`);
    process.env.DATABASE_URL = isolatedUrl.href;
    process.env.DB_SSL = 'false';
    process.env.JWT_SECRET = 'isolated-auth-integration-test-secret-only';
    process.env.NODE_ENV = 'test';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    ({ pool } = await import('../db.js'));
    ({ signToken } = await import('../middleware/auth.js'));
    // Start from the pre-PR account table to exercise the additive migration.
    await pool.query(`CREATE TABLE app_user (
      id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      email text NOT NULL UNIQUE, password_hash text NOT NULL,
      first_name text, last_name text, phone text,
      is_verified boolean NOT NULL DEFAULT false, points integer NOT NULL DEFAULT 0,
      role text NOT NULL DEFAULT 'user', created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await pool.query("INSERT INTO app_user (email, password_hash, first_name) VALUES ('legacy@example.test', 'unchanged-hash', 'Legacy')");
    const migration = await readFile(resolve('sql/migrations/20261102_auth_actions.sql'), 'utf8');
    await pool.query(migration);
    await pool.query(migration); // Existing databases can safely run it again.
    const legacy = (await pool.query('SELECT email, password_hash, first_name, auth_version FROM app_user')).rows[0];
    assert.deepEqual(legacy, { email: 'legacy@example.test', password_hash: 'unchanged-hash', first_name: 'Legacy', auth_version: 0 });
    const { createAuthActionService } = await import('../services/authActions.service.js');
    const { createAuthRouter } = await import('../routes/auth.js');
    const service = createAuthActionService({
      db: pool,
      frontendUrl: 'http://localhost:5173',
      canSendEmail: () => smtpConfigured,
      sendEmail: async (message) => {
        if (deliveryFails) throw new Error('Simulated mail transport failure');
        messages.push(message);
      },
    });
    const actions = {
      ...service,
      sendLink: (...args: Parameters<typeof service.sendLink>) => {
        const delivery = service.sendLink(...args);
        deliveries.push(delivery.catch(() => undefined));
        return delivery;
      },
    };
    const app = express();
    app.use(express.json());
    app.use('/api/auth', createAuthRouter(actions));
    app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const status = error instanceof ZodError ? 400 : Number((error as { status?: number }).status) || 500;
      res.status(status).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    });
    server = await new Promise<Server>((resolveServer) => {
      const listening = app.listen(0, '127.0.0.1', () => resolveServer(listening));
    });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    baseUrl = `http://127.0.0.1:${address.port}/api/auth`;
  });

  beforeEach(async () => {
    await Promise.all(deliveries.splice(0));
    await pool.query('TRUNCATE app_user, auth_rate_limit RESTART IDENTITY CASCADE');
    messages.length = 0;
    smtpConfigured = true;
    deliveryFails = false;
  });

  after(async () => {
    await Promise.all(deliveries);
    if (server) await new Promise<void>((resolveServer, reject) => server.close(error => error ? reject(error) : resolveServer()));
    await pool?.end();
    if (admin) {
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await admin.end();
    }
  });

  async function request(path: string, body?: unknown, token?: string) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    return { status: response.status, body: await response.json() as ApiBody, headers: response.headers };
  }

  async function register(email = 'anna@example.test') {
    const result = await request('/register', { email, password, firstName: 'Anna', lastName: 'Lind' });
    assert.equal(result.status, 201);
    return result.body;
  }

  function tokenFor(purpose: AuthEmail['purpose']) {
    const message = [...messages].reverse().find(message => message.purpose === purpose);
    assert.ok(message);
    const token = new URLSearchParams(new URL(message.url).hash.slice(1)).get('token');
    assert.match(token!, /^[a-f0-9]{64}$/);
    return token!;
  }

  test('registers an account, hashes its password and issues an authenticated session', async () => {
    const registered = await register('Anna@Example.Test');
    assert.equal(registered.user.email, 'anna@example.test');
    assert.equal(registered.user.isVerified, false);
    assert.equal(registered.verificationEmailSent, true);
    const { rows: [stored] } = await pool.query('SELECT password_hash FROM app_user');
    assert.notEqual(stored.password_hash, password);
    assert.equal(await bcrypt.compare(password, stored.password_hash), true);
    assert.equal((await request('/me', undefined, registered.token)).status, 200);
    assert.equal((await request('/me')).status, 401);
    assert.equal((await request('/register', { email: 'anna@example.test', password })).status, 409);
  });

  test('handles wrong credentials uniformly and validates passwords in UTF-8 bytes', async () => {
    await register();
    const wrong = await request('/login', { email: 'anna@example.test', password: 'incorrect' });
    const unknown = await request('/login', { email: 'unknown@example.test', password: 'incorrect' });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.body.error, unknown.body.error);
    assert.equal((await request('/login', { email: 'anna@example.test', password })).status, 200);
    assert.equal((await request('/register', { email: 'other@example.test', password: 'å'.repeat(37) })).status, 400);
  });

  test('stores only token hashes and verifies an email exactly once', async () => {
    await register();
    const token = tokenFor('verify_email');
    const { rows: [stored] } = await pool.query('SELECT token_hash FROM auth_action_token');
    assert.notEqual(stored.token_hash, token);
    assert.equal((await request('/verify-email', { token })).status, 200);
    assert.equal((await pool.query('SELECT is_verified FROM app_user')).rows[0].is_verified, true);
    assert.equal((await request('/verify-email', { token })).status, 400);
  });

  test('neutral recovery responses do not disclose whether an account exists', async () => {
    await register();
    const known = await request('/forgot-password', { email: 'anna@example.test' });
    const unknown = await request('/forgot-password', { email: 'unknown@example.test' });
    await Promise.all(deliveries);
    assert.equal(known.status, 200);
    assert.equal(unknown.status, 200);
    assert.deepEqual(known.body, unknown.body);
    assert.equal(messages.filter(message => message.purpose === 'reset_password').length, 1);
  });

  test('reset changes the password, rejects replay and revokes existing sessions', async () => {
    const registered = await register();
    await request('/forgot-password', { email: 'anna@example.test' });
    await Promise.all(deliveries);
    const token = tokenFor('reset_password');
    assert.equal((await request('/verify-email', { token })).status, 400);
    assert.equal((await request('/reset-password', { token, password: 'NewPassword123!' })).status, 200);
    assert.equal((await request('/reset-password', { token, password: 'AnotherPassword123!' })).status, 400);
    assert.equal((await request('/me', undefined, registered.token)).status, 401);
    assert.equal((await request('/login', { email: 'anna@example.test', password })).status, 401);
    assert.equal((await request('/login', { email: 'anna@example.test', password: 'NewPassword123!' })).status, 200);
  });

  test('expired and wrong-purpose tokens cannot change account state', async () => {
    const registered = await register();
    const verificationToken = tokenFor('verify_email');
    assert.equal((await request('/reset-password', { token: verificationToken, password: 'NewPassword123!' })).status, 400);
    await request('/forgot-password', { email: 'anna@example.test' });
    await Promise.all(deliveries);
    const resetToken = tokenFor('reset_password');
    await pool.query("UPDATE auth_action_token SET expires_at = now() - interval '1 second'");
    assert.equal((await request('/verify-email', { token: verificationToken })).status, 400);
    assert.equal((await request('/reset-password', { token: resetToken, password: 'NewPassword123!' })).status, 400);
    assert.equal((await request('/me', undefined, registered.token)).status, 200);
    assert.equal((await pool.query('SELECT is_verified, auth_version FROM app_user')).rows[0].is_verified, false);
  });

  test('resending invalidates the old link and enforces the mail rate limit', async () => {
    const registered = await register();
    const old = tokenFor('verify_email');
    assert.equal((await request('/resend-verification', {}, registered.token)).status, 200);
    assert.notEqual(tokenFor('verify_email'), old);
    assert.equal((await request('/verify-email', { token: old })).status, 400);
    assert.equal((await request('/resend-verification', {}, registered.token)).status, 200);
    assert.equal((await request('/resend-verification', {}, registered.token)).status, 429);
    assert.equal((await request('/verify-email', { token: tokenFor('verify_email') })).status, 200);
  });

  test('parallel requests consume a token only once', async () => {
    await register();
    const token = tokenFor('verify_email');
    const results = await Promise.all([request('/verify-email', { token }), request('/verify-email', { token })]);
    assert.deepEqual(results.map(result => result.status).sort(), [200, 400]);
  });

  test('parallel password resets cannot use the same token twice', async () => {
    await register();
    await request('/forgot-password', { email: 'anna@example.test' });
    await Promise.all(deliveries);
    const token = tokenFor('reset_password');
    const results = await Promise.all([
      request('/reset-password', { token, password: 'FirstPassword123!' }),
      request('/reset-password', { token, password: 'SecondPassword123!' }),
    ]);
    assert.deepEqual(results.map(result => result.status).sort(), [200, 400]);
    assert.equal((await pool.query('SELECT auth_version FROM app_user')).rows[0].auth_version, 1);
  });

  test('delivery failure preserves the account and removes undelivered tokens', async () => {
    deliveryFails = true;
    const registered = await register();
    assert.equal(registered.verificationEmailSent, false);
    assert.equal(Number((await pool.query('SELECT count(*) FROM auth_action_token')).rows[0].count), 0);
    deliveryFails = false;
    assert.equal((await request('/resend-verification', {}, registered.token)).status, 200);
    assert.equal(messages.length, 1);
    smtpConfigured = false;
    assert.equal((await request('/forgot-password', { email: 'anna@example.test' })).status, 503);
    const noSmtp = await register('no-smtp@example.test');
    assert.equal(noSmtp.verificationEmailSent, false);
  });

  test('login throttling resets after success but blocks repeated failures', async () => {
    await register();
    for (let i = 0; i < 5; i++) assert.equal((await request('/login', { email: 'anna@example.test', password: 'incorrect' })).status, 401);
    assert.equal((await request('/login', { email: 'anna@example.test', password })).status, 200);
    for (let i = 0; i < 10; i++) assert.equal((await request('/login', { email: 'anna@example.test', password: 'incorrect' })).status, 401);
    const limited = await request('/login', { email: 'anna@example.test', password });
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get('retry-after'), '900');
  });

  test('the shared IP limit blocks the thirty-first auth request', async () => {
    for (let i = 0; i < 30; i++) assert.equal((await request('/verify-email', { token: 'invalid' })).status, 400);
    const limited = await request('/verify-email', { token: 'invalid' });
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get('retry-after'), '900');
  });

  test('password change revokes the old session and outstanding reset links', async () => {
    const registered = await register();
    const legacySession = jwt.sign({}, process.env.JWT_SECRET!, { subject: String(registered.user.id), algorithm: 'HS256' });
    assert.equal((await request('/me', undefined, legacySession)).status, 200);
    await request('/forgot-password', { email: 'anna@example.test' });
    await Promise.all(deliveries);
    const token = tokenFor('reset_password');
    assert.equal((await request('/change-password', { currentPassword: password, newPassword: 'ChangedPassword123!' }, registered.token)).status, 200);
    assert.equal((await request('/me', undefined, registered.token)).status, 401);
    assert.equal((await request('/me', undefined, legacySession)).status, 401);
    assert.equal((await request('/reset-password', { token, password })).status, 400);
    const newSession = await request('/login', { email: 'anna@example.test', password: 'ChangedPassword123!' });
    assert.equal(newSession.status, 200);
    assert.equal((await request('/me', undefined, newSession.body.token)).status, 200);
    assert.equal((await request('/me', undefined, signToken(registered.user.id, 0))).status, 401);
  });
});
