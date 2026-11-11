import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Server } from 'node:http';
import express, { type NextFunction, type Request, type Response } from 'express';
import pg from 'pg';
import { ZodError } from 'zod';
import type { GuestBookingEmail } from '../services/guestBookings.service.js';

const databaseUrl = process.env.AUTH_TEST_DATABASE_URL;
interface ResponseBody {
  error?: string;
  bookingRef?: string;
  totalPrice?: number;
  email?: string;
  booking?: { id: number; status: string; email: string };
  tickets?: { seatId: number; priceGroupId: number }[];
}

describe('booking protection with PostgreSQL', { skip: !databaseUrl }, () => {
  let db: pg.Pool;
  let admin: pg.Pool;
  let server: Server;
  let app: express.Express;
  let baseUrl: string;
  let signToken: (id: number, version?: number) => string;
  let cleanup: () => Promise<void>;
  let hashValue: (value: string) => string;
  let mailConfigured = true;
  let mailFails = false;
  const messages: GuestBookingEmail[] = [];
  const notifications: number[] = [];
  const schema = `booking_test_${randomUUID().replaceAll('-', '')}`;

  before(async () => {
    admin = new pg.Pool({ connectionString: databaseUrl });
    await admin.query(`CREATE SCHEMA "${schema}"`);
    const isolatedUrl = new URL(databaseUrl!);
    isolatedUrl.searchParams.set('options', `-c search_path=${schema}`);
    process.env.DATABASE_URL = isolatedUrl.href;
    process.env.DB_SSL = 'false';
    process.env.JWT_SECRET = 'isolated-booking-integration-test-secret';
    process.env.NODE_ENV = 'test';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    ({ pool: db } = await import('../db.js'));
    for (const file of ['01_schema.sql', '02_views.sql', '03_security.sql']) {
      await db.query(await readFile(resolve('sql', file), 'utf8'));
    }
    ({ signToken } = await import('../middleware/auth.js'));
    const { createBookingService } = await import('../services/bookings.service.js');
    const { createGuestBookingService } = await import('../services/guestBookings.service.js');
    const { createBookingsRouter } = await import('../routes/bookings.js');
    const { cleanupBookingProtection, hashBookingValue } = await import('../services/bookingLimits.service.js');
    hashValue = hashBookingValue;
    cleanup = () => cleanupBookingProtection(db);
    const book = createBookingService({ db, notify: async id => { notifications.push(id); } });
    const guests = createGuestBookingService({ db, book, canSendEmail: () => mailConfigured, sendEmail: async message => {
      if (mailFails) throw new Error('Simulated mail failure');
      messages.push(message);
    } });
    app = express();
    app.set('trust proxy', 'loopback');
    app.use(express.json({ limit: '100kb' }));
    app.use('/api/bookings', createBookingsRouter(book, guests));
    app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const status = error instanceof ZodError ? 400 : Number((error as { status?: number }).status) || 500;
      if (status === 429) res.setHeader('Retry-After', '900');
      res.status(status).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    });
    server = await new Promise<Server>(resolveServer => {
      const listening = app.listen(0, '127.0.0.1', () => resolveServer(listening));
    });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    baseUrl = `http://127.0.0.1:${address.port}/api/bookings`;
  });

  beforeEach(async () => {
    await db.query('TRUNCATE app_user, cinema, movie, price_group, menu_item, booking_rate_limit, guest_booking_intent RESTART IDENTITY CASCADE');
    await db.query(`INSERT INTO app_user(email, password_hash, is_verified) VALUES
      ('anna@example.test', 'test-hash', true), ('bob@example.test', 'test-hash', true), ('unverified@example.test', 'test-hash', false)`);
    await db.query("INSERT INTO cinema(name) VALUES ('Test room')");
    await db.query("INSERT INTO seat(cinema_id, row_label, seat_number) SELECT 1, chr(65 + i/10), i%10 + 1 FROM generate_series(0,79) i");
    await db.query("INSERT INTO movie(title, duration_minutes) VALUES ('Test movie', 100)");
    await db.query("INSERT INTO screening(movie_id, cinema_id, starts_at) SELECT 1, 1, '2099-07-01T18:00:00Z'::timestamptz + i * interval '1 day' FROM generate_series(0,7) i");
    await db.query("INSERT INTO price_group(name, price) VALUES ('adult', 140), ('child', 80)");
    await db.query("INSERT INTO menu_item(name, price, category) VALUES ('Popcorn', 40, 'food')");
    messages.length = 0;
    notifications.length = 0;
    mailConfigured = true;
    mailFails = false;
    app.set('trust proxy', 'loopback');
  });

  after(async () => {
    if (server) await new Promise<void>((resolveServer, reject) => server.close(error => error ? reject(error) : resolveServer()));
    await db?.end();
    if (admin) { await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await admin.end(); }
  });

  function payload(seatIds = [1], screeningId = 1, email = 'anna@example.test') {
    return { screeningId, email, guestName: 'Anna', tickets: seatIds.map(seatId => ({ seatId, priceGroupId: 1 })), items: [] };
  }
  async function request(path: string, body: unknown, options: { user?: number; key?: string; ip?: string; method?: string } = {}) {
    const response = await fetch(baseUrl + path, { method: options.method ?? 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': options.key ?? randomUUID(),
        'X-Forwarded-For': options.ip ?? '192.0.2.1', ...(options.user ? { Authorization: `Bearer ${signToken(options.user)}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15_000) });
    return { status: response.status, body: await response.json() as ResponseBody, headers: response.headers };
  }
  function latestToken(): string {
    const token = new URLSearchParams(new URL(messages.at(-1)!.url).hash.slice(1)).get('token');
    assert.match(token!, /^[a-f0-9]{64}$/);
    return token!;
  }
  async function seedBooking(seatIds: number[], screeningId = 1, options: { paid?: boolean; cancelled?: boolean; guest?: boolean; user?: number } = {}) {
    const { rows: [booking] } = await db.query<{ id: number }>(`INSERT INTO booking(screening_id,user_id,guest_email,booking_reference,is_paid,status)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, [screeningId, options.guest ? null : options.user ?? 1,
      options.guest ? ' ANNA@EXAMPLE.TEST ' : null, randomUUID(), options.paid ?? false, options.cancelled ? 'cancelled' : 'confirmed']);
    if (!options.cancelled) for (const seat of seatIds) await db.query('INSERT INTO ticket VALUES ($1,$2,$3,1)', [screeningId, seat, booking.id]);
    return booking.id;
  }

  test('migration is additive, repeatable and backfills existing guest/member identities', async () => {
    const member = await seedBooking([1]);
    const guest = await seedBooking([2], 1, { guest: true });
    const migration = await readFile(resolve('sql/migrations/20261110_booking_protection.sql'), 'utf8');
    await db.query(migration); await db.query(migration);
    const result = await db.query('SELECT identity_email FROM booking WHERE id = ANY($1::int[])', [[member, guest]]);
    assert.deepEqual(result.rows.map(row => row.identity_email), ['anna@example.test', 'anna@example.test']);
    assert.equal(Number((await db.query('SELECT count(*) FROM ticket')).rows[0].count), 2);
  });

  test('unverified members and direct guest requests cannot create bookings', async () => {
    assert.equal((await request('/', { ...payload(), role: 'admin', isVerified: true }, { user: 3 })).status, 403);
    assert.equal((await request('/', payload())).status, 403);
    assert.equal(Number((await db.query('SELECT count(*) FROM booking')).rows[0].count), 0);
  });

  test('client email cannot replace the authenticated member identity', async () => {
    const result = await request('/', payload(), { user: 2 });
    assert.equal(result.status, 201);
    assert.equal(result.body.booking?.email, 'bob@example.test');
    assert.equal((await request('/', payload([2]), { user: 1, key: '' })).status, 400);
  });

  test('member retries are idempotent and changed payloads cannot reuse the request key', async () => {
    const key = randomUUID();
    const [first, second] = await Promise.all([request('/', payload(), { user: 1, key }), request('/', payload(), { user: 1, key })]);
    assert.equal(first.status, 201); assert.equal(second.status, 201);
    assert.equal(first.body.bookingRef, second.body.bookingRef);
    assert.equal(first.body.totalPrice, 140);
    assert.equal(notifications.length, 1);
    assert.equal((await request('/', payload([2]), { user: 1, key })).status, 409);
    assert.equal(Number((await db.query('SELECT count(*) FROM booking')).rows[0].count), 1);
  });

  test('identity rate limits survive IP rotation and include failed booking attempts', async () => {
    for (let i = 0; i < 3; i++) assert.equal((await request('/', payload([999]), { user: 1, ip: `192.0.2.${i + 1}` })).status, 400);
    const blocked = await request('/', payload(), { user: 1, ip: '198.51.100.9' });
    assert.equal(blocked.status, 429); assert.ok(blocked.headers.get('Retry-After'));
    assert.equal((await request('/', payload([2]), { user: 2, ip: '198.51.100.9' })).status, 201);
  });

  test('independent IP limits apply across identities and forged forwarded headers do not bypass them', async () => {
    app.set('trust proxy', false);
    for (let i = 0; i < 30; i++) assert.equal((await request('/guest/preview', { token: 'invalid' }, { ip: `192.0.2.${i + 1}` })).status, 400);
    assert.equal((await request('/guest/preview', { token: 'invalid' }, { ip: '198.51.100.1' })).status, 429);
  });

  test('concurrent bookings cannot exceed ten combined seats at one screening', async () => {
    await seedBooking([1, 2, 3, 4, 5, 6], 1, { paid: true });
    const results = await Promise.all([request('/', payload([7, 8, 9]), { user: 1 }), request('/', payload([10, 11, 12]), { user: 1 })]);
    assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
    assert.equal(Number((await db.query('SELECT count(*) FROM ticket')).rows[0].count), 9);
  });

  test('different identities cannot book the same seat concurrently', async () => {
    const results = await Promise.all([request('/', payload(), { user: 1 }), request('/', payload(), { user: 2 })]);
    assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
    assert.equal(Number((await db.query('SELECT count(*) FROM ticket')).rows[0].count), 1);
  });

  test('guest and member bookings share one normalized identity quota', async () => {
    await seedBooking([1, 2, 3, 4, 5, 6, 7, 8], 1, { guest: true });
    assert.equal((await request('/', payload([9, 10, 11]), { user: 1 })).status, 409);
    assert.equal((await request('/guest/request', payload([9, 10, 11], 1, 'Anna@Example.Test'))).status, 202);
    assert.equal((await request('/guest/confirm', { token: latestToken() }, { ip: '198.51.100.1' })).status, 409);
  });

  test('active unpaid booking and seat caps exclude paid, cancelled and past bookings', async () => {
    await seedBooking([1], 1); await seedBooking([1], 2); await seedBooking([1], 3);
    assert.equal((await request('/', payload([1], 4), { user: 1 })).status, 409);
    await db.query('UPDATE booking SET is_paid = true WHERE screening_id = 1');
    await db.query("UPDATE screening SET starts_at = now() - interval '1 day' WHERE id = 2");
    await seedBooking([], 5, { cancelled: true });
    assert.equal((await request('/', payload([1], 4), { user: 1 })).status, 201);
  });

  test('twenty unpaid seats cannot be exceeded across different screenings', async () => {
    await seedBooking([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1);
    await seedBooking([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2);
    assert.equal((await request('/', payload([1], 3), { user: 1 })).status, 409);
  });

  test('guest request and preview reserve no seats and never enter the normal booking list', async () => {
    const input = payload();
    const key = randomUUID();
    assert.equal((await request('/guest/request', input, { key })).status, 202);
    assert.equal((await request('/guest/request', input, { key: key.toUpperCase() })).status, 202);
    assert.equal(messages.length, 1);
    const token = latestToken();
    assert.equal((await request('/guest/preview', { token })).status, 200);
    assert.equal(Number((await db.query('SELECT count(*) FROM booking')).rows[0].count), 0);
    assert.equal(Number((await db.query('SELECT count(*) FROM ticket')).rows[0].count), 0);
    assert.equal((await request('/', undefined, { user: 1, method: 'GET' })).status, 403);
    const stored = (await db.query('SELECT token_hash FROM guest_booking_intent')).rows[0].token_hash;
    assert.notEqual(stored, token);
    assert.equal((await request('/guest/request', payload([2]))).status, 429);
    assert.equal((await request('/guest/confirm', { token })).status, 201);
    const retry = await request('/guest/confirm', { token });
    assert.equal(retry.status, 201);
    assert.equal(Number((await db.query('SELECT count(*) FROM booking')).rows[0].count), 1);
    assert.equal(notifications.length, 1);
  });

  test('guest confirmation is single-use even when submitted concurrently', async () => {
    await request('/guest/request', payload());
    const token = latestToken();
    const results = await Promise.all([request('/guest/confirm', { token }), request('/guest/confirm', { token })]);
    assert.deepEqual(results.map(result => result.status), [201, 201]);
    assert.equal(results[0].body.bookingRef, results[1].body.bookingRef);
    assert.equal(Number((await db.query('SELECT count(*) FROM ticket')).rows[0].count), 1);
    assert.equal(notifications.length, 1);
  });

  test('guest preview and reselection retain each seat ticket category in request order', async () => {
    const input = { ...payload([9, 1]), tickets: [{ seatId: 9, priceGroupId: 2 }, { seatId: 1, priceGroupId: 1 }] };
    assert.equal((await request('/guest/request', input)).status, 202);
    const token = latestToken();
    const preview = await request('/guest/preview', { token });
    assert.deepEqual(preview.body.tickets?.map(ticket => [ticket.seatId, ticket.priceGroupId]), [[9, 2], [1, 1]]);
    assert.equal((await request('/guest/confirm', { token, seatIds: [2, 2] })).status, 400);
    const confirmed = await request('/guest/confirm', { token, seatIds: [10, 2] });
    assert.equal(confirmed.status, 201);
    assert.equal(confirmed.body.totalPrice, 220);
    const { rows } = await db.query('SELECT seat_id, price_group_id FROM ticket ORDER BY seat_id');
    assert.deepEqual(rows, [{ seat_id: 2, price_group_id: 1 }, { seat_id: 10, price_group_id: 2 }]);
  });

  test('guest mail cooldown and rolling mail quota persist independently of request expiry', async () => {
    await request('/guest/request', payload());
    await db.query("UPDATE guest_booking_intent SET expires_at = now() - interval '1 second'");
    assert.equal((await request('/guest/request', payload([2]))).status, 429);
    for (let i = 0; i < 2; i++) {
      await db.query(`UPDATE booking_rate_limit SET attempts = ARRAY(SELECT value - interval '61 seconds' FROM unnest(attempts) value)
        WHERE key_hash = $1`, [hashValue('mail:anna@example.test')]);
      assert.equal((await request('/guest/request', payload([i + 2]))).status, 202);
      await db.query("UPDATE guest_booking_intent SET expires_at = now() - interval '1 second'");
    }
    await db.query(`UPDATE booking_rate_limit SET attempts = ARRAY(SELECT value - interval '61 seconds' FROM unnest(attempts) value)
      WHERE key_hash = $1`, [hashValue('mail:anna@example.test')]);
    assert.equal((await request('/guest/request', payload([4]))).status, 429);
    assert.equal(messages.length, 3);
  });

  test('global request guard bounds new IP buckets before allocating per-address records', async () => {
    await db.query(`INSERT INTO booking_rate_limit(key_hash, attempts, expires_at)
      VALUES ($1, array_fill(clock_timestamp(), ARRAY[300]), now() + interval '15 minutes')`, [hashValue('requests:global')]);
    assert.equal((await request('/guest/request', payload(), { ip: '198.51.100.8' })).status, 429);
    assert.equal(Number((await db.query('SELECT count(*) FROM booking_rate_limit')).rows[0].count), 1);
    assert.equal(Number((await db.query('SELECT count(*) FROM guest_booking_intent')).rows[0].count), 0);
  });

  test('expired and wrong-purpose links cannot book seats and cleanup retains real bookings', async () => {
    await seedBooking([2]);
    await request('/guest/request', payload());
    const token = latestToken();
    await db.query("UPDATE guest_booking_intent SET expires_at = now() - interval '1 second'");
    assert.equal((await request('/guest/confirm', { token })).status, 400);
    assert.equal((await request('/guest/confirm', { token: 'a'.repeat(64) })).status, 400);
    await db.query("UPDATE booking_rate_limit SET expires_at = now() - interval '1 second'");
    await cleanup();
    assert.equal(Number((await db.query('SELECT count(*) FROM guest_booking_intent')).rows[0].count), 0);
    assert.equal(Number((await db.query('SELECT count(*) FROM booking_rate_limit')).rows[0].count), 0);
    assert.equal(Number((await db.query('SELECT count(*) FROM booking')).rows[0].count), 1);
  });

  test('seat conflicts do not consume the guest token and other seats can be selected', async () => {
    await request('/guest/request', payload());
    const token = latestToken();
    await seedBooking([1], 1, { user: 2 });
    assert.equal((await request('/guest/confirm', { token })).status, 409);
    assert.equal((await request('/guest/confirm', { token, seatIds: [2] })).status, 201);
    assert.equal((await request('/guest/confirm', { token, seatIds: [3] })).status, 409);
    assert.equal(Number((await db.query('SELECT count(*) FROM booking')).rows[0].count), 2);
  });

  test('mail outages fail safely without bookings, held seats or orphaned intents', async () => {
    mailConfigured = false;
    assert.equal((await request('/guest/request', payload())).status, 503);
    mailConfigured = true; mailFails = true;
    assert.equal((await request('/guest/request', payload())).status, 503);
    assert.equal(Number((await db.query('SELECT count(*) FROM guest_booking_intent')).rows[0].count), 0);
    assert.equal(Number((await db.query('SELECT count(*) FROM booking')).rows[0].count), 0);
  });
});
