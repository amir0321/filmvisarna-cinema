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
  warningCount?: number;
  blockedUntil?: string | null;
  reservationStatus?: { warningCount: number; blockedUntil: string | null };
  error?: string;
  bookingRef?: string;
  totalPrice?: number;
  email?: string;
  booking?: { id: number; status: string; email: string };
  tickets?: { seatId: number; priceGroupId: number }[];
  seats?: string[];
  canCancel?: boolean;
}

describe('booking protection with PostgreSQL', { skip: !databaseUrl }, () => {
  let db: pg.Pool;
  let admin: pg.Pool;
  let server: Server;
  let app: express.Express;
  let baseUrl: string;
  let createSession: (id: number, version?: number) => Promise<{ token: string; expiresAt: number }>;
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
    ({ createSession } = await import('../services/sessions.service.js'));
    const { createBookingService } = await import('../services/bookings.service.js');
    const { createGuestBookingService } = await import('../services/guestBookings.service.js');
    const { createBookingsRouter } = await import('../routes/bookings.js');
    const { cleanupBookingProtection, hashBookingValue } = await import('../services/bookingLimits.service.js');
    hashValue = hashBookingValue;
    cleanup = () => cleanupBookingProtection(db);
    const book = createBookingService({ db, notify: async id => { notifications.push(id); } });
    const guests = createGuestBookingService({
      db, book, canSendEmail: () => mailConfigured, sendEmail: async message => {
        if (mailFails) throw new Error('Simulated mail failure');
        messages.push(message);
      }
    });
    app = express();
    app.set('trust proxy', 'loopback');
    app.use(express.json({ limit: '100kb' }));
    const { csrfProtection } = await import('../middleware/csrf.js');
    app.use('/api', csrfProtection);
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
    await db.query('UPDATE booking_warning_policy SET activated_at = clock_timestamp()');
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
    const response = await fetch(baseUrl + path, {
      method: options.method ?? 'POST',
      headers: {
        'Content-Type': 'application/json', 'X-CSRF-Protection': '1', 'Idempotency-Key': options.key ?? randomUUID(),
        'X-Forwarded-For': options.ip ?? '192.0.2.1', ...(options.user ? { Cookie: `filmvisarna_session=${(await createSession(options.user)).token}` } : {})
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15_000)
    });
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

  async function seedCancellation(options: Parameters<typeof seedBooking>[2] = {}, seat = 1, screening = 1) {
    const id = await seedBooking([seat], screening, options);
    const bookingRef = `FV-${String(id).padStart(5, '0')}`;
    await db.query('UPDATE booking SET booking_reference = $1 WHERE id = $2', [bookingRef, id]);
    return { id, bookingRef, email: 'anna@example.test' };
  }

  async function activateWarnings() {
    await db.query("UPDATE booking_warning_policy SET activated_at = clock_timestamp() - interval '180 days'");
  }

  async function seedNoShow(screeningId: number, options: Parameters<typeof seedBooking>[2] = {}) {
    const id = await seedBooking([screeningId], screeningId, options);
    await db.query("UPDATE screening SET starts_at = clock_timestamp() - interval '101 minutes' WHERE id = $1", [screeningId]);
    return id;
  }

  test('warnings are recorded once after film end, excluding paid, cancelled, ongoing and pre-activation bookings', async () => {
    const { processBookingWarnings, getReservationWarningStatus } = await import('../services/bookingWarnings.service.js');
    await activateWarnings();
    const unpaid = await seedNoShow(1);
    await seedNoShow(2, { paid: true });
    await seedNoShow(3, { cancelled: true });
    await seedBooking([4], 4);
    await db.query("UPDATE screening SET starts_at = clock_timestamp() - interval '5 minutes' WHERE id = 4");
    const legacy = await seedNoShow(5);
    await db.query("UPDATE booking SET created_at = clock_timestamp() - interval '181 days' WHERE id = $1", [legacy]);
    await Promise.all([processBookingWarnings(db), processBookingWarnings(db), getReservationWarningStatus(' ANNA@EXAMPLE.TEST ', 1, db)]);
    const status = await getReservationWarningStatus('anna@example.test', 1, db);
    assert.equal(status.warningCount, 1);
    assert.equal(status.blockedUntil, null);
    assert.deepEqual((await db.query('SELECT source_booking_id FROM booking_warning')).rows, [{ source_booking_id: unpaid }]);
  });

  test('three warnings share guest/member identity and block new reservations, including existing guest links, while payment stays available', async () => {
    const { getReservationWarningStatus, deliverBookingWarningEmails } = await import('../services/bookingWarnings.service.js');
    const { updateBookingStatus } = await import('../services/bookings.service.js');
    await activateWarnings();
    await request('/guest/request', payload([8], 8));
    const token = latestToken();
    const payable = await seedBooking([9], 8);
    await seedNoShow(1);
    await seedNoShow(2, { guest: true });
    await seedNoShow(3);
    const status = await getReservationWarningStatus(' ANNA@EXAMPLE.TEST ', 1, db);
    assert.equal(status.warningCount, 3);
    assert.ok(status.blockedUntil);
    assert.ok(Math.abs(Date.parse(status.blockedUntil) - Date.now() - 30 * 86400_000) < 10_000);
    assert.equal((await request('/', payload([10], 8), { user: 1 })).status, 403);
    const deniedGuest = await request('/guest/request', payload([10], 8));
    assert.equal(deniedGuest.status, 403);
    assert.equal(deniedGuest.body.blockedUntil, undefined);
    assert.equal((await request('/guest/preview', { token })).body.reservationStatus?.blockedUntil, status.blockedUntil);
    assert.equal((await request('/guest/confirm', { token })).status, 403);
    assert.equal((await request('/reservation-status', undefined, { user: 1, method: 'GET' })).body.warningCount, 3);
    assert.equal((await request('/reservation-status', undefined, { user: 2, method: 'GET' })).body.warningCount, 0);
    assert.equal((await request('/reservation-status', undefined, { method: 'GET' })).status, 401);
    assert.equal((await updateBookingStatus(payable, { isPaid: true })).booking.isPaid, true);
    const sent: { warningCount: number; blockedUntil: string | null }[] = [];
    await deliverBookingWarningEmails({ db, canSendEmail: () => true, sendEmail: async message => { sent.push(message); } });
    assert.deepEqual(sent.map(message => message.warningCount), [1, 2, 3]);
    assert.equal(sent.filter(message => message.blockedUntil !== null).length, 1);
  });

  test('blocks expire after thirty days, old or revoked warnings do not count, and consumed warnings cannot restart a block', async () => {
    const { getReservationWarningStatus, processBookingWarnings } = await import('../services/bookingWarnings.service.js');
    await activateWarnings();
    await db.query(`INSERT INTO booking_warning(source_booking_id, booking_reference, identity_email, user_id, screening_ended_at)
      VALUES (999998, 'FV-OLD00', 'anna@example.test', 1, clock_timestamp() - interval '91 days'),
             (999999, 'FV-REV00', 'anna@example.test', 1, clock_timestamp() - interval '1 day')`);
    await db.query("UPDATE booking_warning SET revoked_at = clock_timestamp(), revocation_reason = 'Test correction' WHERE source_booking_id = 999999");
    await seedNoShow(1); await seedNoShow(2); await seedNoShow(3);
    const blocked = await getReservationWarningStatus('anna@example.test', 1, db);
    assert.equal(blocked.warningCount, 3);
    assert.equal(blocked.warnings.length, 3);
    await processBookingWarnings(db);
    assert.equal((await getReservationWarningStatus('anna@example.test', 1, db)).blockedUntil, blocked.blockedUntil);
    await db.query("UPDATE booking_reservation_block SET starts_at = clock_timestamp() - interval '31 days', expires_at = clock_timestamp() - interval '1 second'");
    const expired = await getReservationWarningStatus('anna@example.test', 1, db);
    assert.equal(expired.blockedUntil, null);
    assert.equal(expired.warningCount, 0);
    assert.equal((await request('/', payload([8], 8), { user: 1 })).status, 201);
    await seedNoShow(4); await seedNoShow(5); await seedNoShow(6);
    assert.ok((await getReservationWarningStatus('anna@example.test', 1, db)).blockedUntil);
    assert.equal(Number((await db.query('SELECT count(*) FROM booking_reservation_block')).rows[0].count), 2);
  });

  test('warning history and active blocks survive seven-day booking cleanup', async () => {
    const { getReservationWarningStatus } = await import('../services/bookingWarnings.service.js');
    await activateWarnings();
    const ids = await Promise.all([seedNoShow(1), seedNoShow(2, { guest: true }), seedNoShow(3)]);
    await db.query("UPDATE screening SET starts_at = clock_timestamp() - interval '8 days' WHERE id = ANY($1::int[])", [[1, 2, 3]]);
    await cleanup(); await cleanup();
    assert.equal(Number((await db.query('SELECT count(*) FROM booking WHERE id = ANY($1::int[])', [ids])).rows[0].count), 0);
    const status = await getReservationWarningStatus('anna@example.test', 1, db);
    assert.equal(status.warningCount, 3);
    assert.equal(status.warnings.length, 3);
    assert.ok(status.blockedUntil);
  });

  test('warning mail retries safely and concurrent delivery workers do not send the same pending message together', async () => {
    const { processBookingWarnings, deliverBookingWarningEmails } = await import('../services/bookingWarnings.service.js');
    await activateWarnings(); await seedNoShow(1); await processBookingWarnings(db);
    let attempts = 0;
    await deliverBookingWarningEmails({ db, canSendEmail: () => false, sendEmail: async () => { attempts++; } });
    assert.equal(attempts, 0);
    await deliverBookingWarningEmails({ db, canSendEmail: () => true, sendEmail: async () => { attempts++; throw new Error('SMTP unavailable'); } });
    const pending = (await db.query('SELECT email_sent_at, email_attempts, email_next_attempt_at > clock_timestamp() AS deferred FROM booking_warning')).rows[0];
    assert.deepEqual(pending, { email_sent_at: null, email_attempts: 1, deferred: true });
    await db.query("UPDATE booking_warning SET email_next_attempt_at = clock_timestamp() - interval '1 second'");
    const sent: number[] = [];
    const deliver = () => deliverBookingWarningEmails({ db, canSendEmail: () => true, sendEmail: async message => { sent.push(message.id); } });
    await Promise.all([deliver(), deliver()]); await deliver(); await processBookingWarnings(db); await deliver();
    assert.equal(sent.length, 1);
    assert.equal(Number((await db.query('SELECT count(*) FROM booking_warning')).rows[0].count), 1);
    assert.equal((await db.query('SELECT email_attempts FROM booking_warning')).rows[0].email_attempts, 2);
  });

  test('public cancellation requires POST and CSRF protection on both routes', async () => {
    const input = await seedCancellation();
    assert.equal((await fetch(`${baseUrl}/cancel-preview?bookingRef=${input.bookingRef}&email=${input.email}`)).status, 404);
    for (const path of ['/cancel-preview', '/cancel-by-token']) {
      const rejectedHeaders: Record<string, string>[] = [{}, { 'X-CSRF-Protection': '1', Origin: 'https://evil.example' }];
      for (const headers of rejectedHeaders) {
        const result = await fetch(baseUrl + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(input) });
        assert.equal(result.status, 403);
      }
      for (const body of [{ token: 'old-link' }, { bookingRef: 'FV-BAD', email: input.email }, { bookingRef: input.bookingRef, email: 'invalid' }]) {
        assert.equal((await request(path, body)).status, 400);
      }
    }
    assert.equal(Number((await db.query('SELECT count(*) FROM ticket')).rows[0].count), 1);
  });

  test('public preview normalizes reference/email and supports legacy guest and member emails', async () => {
    for (const guest of [false, true]) {
      const input = await seedCancellation({ guest }, guest ? 2 : 1);
      const preview = await request('/cancel-preview', { bookingRef: ` ${input.bookingRef.toLowerCase()} `, email: ' ANNA@EXAMPLE.TEST ' });
      assert.equal(preview.status, 200);
      assert.equal(preview.body.bookingRef, input.bookingRef);
      assert.equal(preview.body.canCancel, true);
      assert.equal(preview.body.seats?.length, 1);
    }
  });

  test('stored booking identity takes precedence over a subsequently changed member email', async () => {
    const input = await seedCancellation();
    await db.query('UPDATE booking SET identity_email = $1 WHERE id = $2', [input.email, input.id]);
    await db.query("UPDATE app_user SET email = 'new@example.test' WHERE id = 1");
    for (const path of ['/cancel-preview', '/cancel-by-token']) {
      assert.equal((await request(path, { ...input, email: 'new@example.test' })).status, 404);
      assert.equal((await request(path, input)).status, 200);
    }
  });

  for (const status of ['confirmed', 'cancelled', 'too_late', 'started']) {
    test(`public cancellation does not reveal existence or ${status} status with the wrong email`, async () => {
      const input = await seedCancellation({ cancelled: status === 'cancelled' });
      if (status === 'too_late' || status === 'started') {
        await db.query(`UPDATE screening SET starts_at = now() + ($1 * interval '1 hour') WHERE id = 1`, [status === 'too_late' ? 1 : -1]);
      }
      for (const path of ['/cancel-preview', '/cancel-by-token']) {
        const missing = await request(path, { bookingRef: 'FV-ZZZZZ', email: 'wrong@example.test' });
        const mismatch = await request(path, { ...input, email: 'wrong@example.test' });
        assert.equal(missing.status, 404);
        assert.equal(mismatch.status, 404);
        assert.deepEqual(missing.body, mismatch.body);
        assert.equal(missing.body.error, 'Vi hittade ingen bokning som matchar angivet bokningsnummer och e-postadress.');
      }
      assert.equal((await db.query('SELECT status FROM booking WHERE id = $1', [input.id])).rows[0].status, status === 'cancelled' ? 'cancelled' : 'confirmed');
    });
  }

  for (const [status, hours, message] of [['cancelled', 4, /redan avbokad/], ['too_late', 1, /mindre än 2 timmar/], ['started', -1, /redan har startat/]] as const) {
    test(`matched public cancellation rejects ${status} without deleting tickets or deducting points`, async () => {
      const input = await seedCancellation({ cancelled: status === 'cancelled', paid: true });
      await db.query('UPDATE app_user SET points = 500 WHERE id = 1');
      await db.query(`UPDATE screening SET starts_at = now() + ($1 * interval '1 hour') WHERE id = 1`, [hours]);
      for (const path of ['/cancel-preview', '/cancel-by-token']) {
        const result = await request(path, input);
        assert.equal(result.status, 400);
        assert.match(result.body.error!, message);
      }
      assert.equal(Number((await db.query('SELECT count(*) FROM ticket')).rows[0].count), status === 'cancelled' ? 0 : 1);
      assert.equal((await db.query('SELECT points FROM app_user WHERE id = 1')).rows[0].points, 500);
    });
  }

  test('reference limit is normalized, shared across both routes and survives IP/email rotation', async () => {
    const input = await seedCancellation();
    for (let i = 0; i < 5; i++) {
      assert.equal((await request(i % 2 ? '/cancel-by-token' : '/cancel-preview', { bookingRef: ` ${input.bookingRef.toLowerCase()} `, email: `wrong${i}@example.test` }, { ip: `192.0.2.${i + 1}` })).status, 404);
    }
    const blocked = await request('/cancel-by-token', input, { ip: '198.51.100.9' });
    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers.get('Retry-After'), '900');
    // Only attempts inside the rolling window count.
    await db.query(`UPDATE booking_rate_limit SET attempts = ARRAY(SELECT value - interval '16 minutes' FROM unnest(attempts) value)`);
    assert.equal((await request('/cancel-preview', input)).status, 200);
  });

  test('email limit is normalized and survives reference and IP rotation', async () => {
    for (let i = 0; i < 5; i++) {
      assert.equal((await request(i % 2 ? '/cancel-by-token' : '/cancel-preview', { bookingRef: `FV-0000${i}`, email: ' ANNA@EXAMPLE.TEST ' }, { ip: `192.0.2.${i + 1}` })).status, 404);
    }
    assert.equal((await request('/cancel-preview', { bookingRef: 'FV-AAAAA', email: 'anna@example.test' }, { ip: '198.51.100.9' })).status, 429);
  });

  test('public cancellation routes enforce global and IP limits including path variants', async () => {
    const paths = ['/Cancel-Preview/', '/CANCEL-BY-TOKEN'];
    for (const [key, maximum] of [['requests:global', 300], ['ip:192.0.2.1', 30]] as const) {
      await db.query('TRUNCATE booking_rate_limit');
      await db.query(`INSERT INTO booking_rate_limit(key_hash, attempts, expires_at)
        VALUES ($1, array_fill(clock_timestamp(), ARRAY[$2::int]), now() + interval '15 minutes')`, [hashValue(key), maximum]);
      for (const path of paths) assert.equal((await request(path, { bookingRef: 'FV-AAAAA', email: 'anna@example.test' })).status, 429);
    }
  });

  test('concurrent public cancellation locks the booking and deducts loyalty points only once', async () => {
    const input = await seedCancellation({ paid: true });
    await db.query('UPDATE app_user SET points = 500 WHERE id = 1');
    await db.query('INSERT INTO booking_item(booking_id, menu_item_id, quantity) VALUES ($1, 1, 1)', [input.id]);
    const results = await Promise.all([request('/cancel-by-token', input), request('/cancel-by-token', input)]);
    assert.deepEqual(results.map(result => result.status).sort(), [200, 400]);
    assert.equal((await db.query('SELECT points FROM app_user WHERE id = 1')).rows[0].points, 320);
    assert.equal(Number((await db.query('SELECT count(*) FROM ticket')).rows[0].count), 0);
    assert.deepEqual((await db.query('SELECT status, is_paid, paid_at FROM booking WHERE id = $1', [input.id])).rows[0], { status: 'cancelled', is_paid: false, paid_at: null });
  });

  test('a guest can confirm public cancellation without changing member points', async () => {
    const input = await seedCancellation({ guest: true, paid: true });
    await db.query('UPDATE app_user SET points = 500 WHERE id = 1');
    assert.equal((await request('/cancel-preview', input)).status, 200);
    assert.equal((await request('/cancel-by-token', input)).status, 200);
    assert.equal(Number((await db.query('SELECT count(*) FROM ticket')).rows[0].count), 0);
    assert.equal((await db.query('SELECT points FROM app_user WHERE id = 1')).rows[0].points, 500);
  });

  test('unpaid member and guest reservations can be cancelled within two hours, until the one-hour release deadline', async () => {
    const guest = await seedCancellation({ guest: true }, 1, 1);
    const member = await seedCancellation({ user: 1 }, 2, 1);
    await db.query("UPDATE screening SET starts_at = clock_timestamp() + interval '90 minutes' WHERE id = 1");
    assert.equal((await request('/cancel-preview', guest)).status, 200);
    assert.equal((await request('/cancel-by-token', guest)).status, 200);
    assert.equal((await request(`/${member.id}`, {}, { user: 1, method: 'DELETE' })).status, 200);
    const released = await seedCancellation({}, 3, 2);
    await db.query("UPDATE screening SET starts_at = clock_timestamp() + interval '1 hour' WHERE id = 2");
    assert.equal((await request('/cancel-preview', released)).status, 400);
    assert.equal((await request(`/${released.id}`, {}, { user: 1, method: 'DELETE' })).status, 400);
    assert.equal(Number((await db.query("SELECT count(*) FROM booking WHERE status = 'cancelled'")).rows[0].count), 2);
    assert.equal(Number((await db.query('SELECT count(*) FROM ticket WHERE booking_id = $1', [released.id])).rows[0].count), 1);
  });

  test('migration is additive, repeatable and backfills existing guest/member identities', async () => {
    const member = await seedBooking([1]);
    const guest = await seedBooking([2], 1, { guest: true });
    const migration = await readFile(resolve('sql/migrations/20261110_booking_protection.sql'), 'utf8');
    await db.query(migration); await db.query(migration);
    // Exercise the reservation migration against the previous ticket key.
    await db.query('DROP INDEX ticket_active_seat_idx');
    await db.query('ALTER TABLE ticket DROP CONSTRAINT ticket_pkey');
    await db.query('ALTER TABLE ticket DROP COLUMN is_active');
    await db.query('ALTER TABLE ticket ADD CONSTRAINT ticket_pkey PRIMARY KEY(screening_id, seat_id)');
    const reservationMigration = await readFile(resolve('sql/migrations/20261116_reservation_expiry.sql'), 'utf8');
    await db.query(reservationMigration); await db.query(reservationMigration);
    const activatedAt = (await db.query('SELECT activated_at FROM booking_warning_policy')).rows[0].activated_at;
    const warningMigration = await readFile(resolve('sql/migrations/20261116_booking_warnings.sql'), 'utf8');
    await db.query(warningMigration); await db.query(warningMigration);
    assert.equal((await db.query('SELECT activated_at FROM booking_warning_policy')).rows[0].activated_at.getTime(), activatedAt.getTime());
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

  test('case and trailing-slash path variants cannot bypass the public IP limit', async () => {
    app.set('trust proxy', false);
    const variants = ['/guest/preview/', '/Guest/Preview', '/GUEST/PREVIEW/'];
    for (let i = 0; i < 30; i++) assert.equal((await request(variants[i % variants.length], { token: 'invalid' })).status, 400);
    for (const path of [...variants, '/guest/request/', '/Guest/Confirm/']) {
      assert.equal((await request(path, { token: 'invalid' })).status, 429);
    }
  });

  test('a booking blocks a concurrent cinema change and never takes seats from the previous cinema', async () => {
    await db.query("INSERT INTO cinema(name) VALUES ('Second room')");
    await db.query("INSERT INTO seat(cinema_id, row_label, seat_number) SELECT 2, 'A', n FROM generate_series(1,10) n");
    const mover = await db.connect();
    try {
      await mover.query('BEGIN');
      await mover.query('SELECT id FROM screening WHERE id = 1 FOR UPDATE');
      const pending = request('/', payload([1]), { user: 1 });
      const deadline = Date.now() + 10_000;
      while (
        Number(
          (
            await db.query(
              `SELECT count(*) FROM pg_stat_activity
               WHERE datname = current_database()
                 AND wait_event_type = 'Lock'
                 AND query LIKE '%FROM screening WHERE id = $1 FOR SHARE%'`,
            )
          ).rows[0].count,
        ) === 0
      ) {
        assert.ok(Date.now() < deadline, 'booking never waited for the screening lock');
        await new Promise(resolveWait => setTimeout(resolveWait, 25));
      }
      await mover.query('UPDATE screening SET cinema_id = 2 WHERE id = 1');
      await mover.query('COMMIT');
      assert.equal((await pending).status, 400);
    } finally {
      mover.release();
    }
    assert.equal(Number((await db.query('SELECT count(*) FROM ticket')).rows[0].count), 0);
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

  test('marking a confirmed member booking as paid awards loyalty points (1 SEK = 1 point) idempotently', async () => {
    const { updateBookingStatus, cancelBooking } = await import('../services/bookings.service.js');
    const bookingId = await seedBooking([1, 2], 1, { user: 1, paid: false });
    await db.query('INSERT INTO booking_item(booking_id, menu_item_id, quantity) VALUES ($1, 1, 1)', [bookingId]);

    const initialUser = (await db.query<{ points: number }>('SELECT points FROM app_user WHERE id = 1')).rows[0];
    assert.equal(initialUser.points, 0);

    // 2 adult tickets (280) + 1 Popcorn (40) = 320
    const result1 = await updateBookingStatus(bookingId, { isPaid: true });
    assert.equal(result1.pointsAwarded, 320);
    assert.equal(result1.booking.isPaid, true);

    const updatedUser = (await db.query<{ points: number }>('SELECT points FROM app_user WHERE id = 1')).rows[0];
    assert.equal(updatedUser.points, 320);

    // Call again (idempotent: already paid, pointsAwarded = 0, user points remain 320)
    const result2 = await updateBookingStatus(bookingId, { isPaid: true });
    assert.equal(result2.pointsAwarded, 0);

    const unchangedUser = (await db.query<{ points: number }>('SELECT points FROM app_user WHERE id = 1')).rows[0];
    assert.equal(unchangedUser.points, 320);

    // Reversing payment: deducts points
    const resultReverse = await updateBookingStatus(bookingId, { isPaid: false });
    assert.equal(resultReverse.booking.isPaid, false);
    const reversedUser = (await db.query<{ points: number }>('SELECT points FROM app_user WHERE id = 1')).rows[0];
    assert.equal(reversedUser.points, 0);

    // Pay again, then cancel the booking -> points are deducted and cancelled booking cannot be paid again
    await updateBookingStatus(bookingId, { isPaid: true });
    assert.equal((await db.query<{ points: number }>('SELECT points FROM app_user WHERE id = 1')).rows[0].points, 320);

    await cancelBooking(bookingId, 1);
    assert.equal((await db.query<{ points: number }>('SELECT points FROM app_user WHERE id = 1')).rows[0].points, 0);
    await assert.rejects(() => updateBookingStatus(bookingId, { isPaid: true }), { status: 400 });
  });

  test('marking a guest booking as paid does not change user points', async () => {
    const { updateBookingStatus } = await import('../services/bookings.service.js');
    const guestBookingId = await seedBooking([3, 4], 1, { guest: true, paid: false });

    const result = await updateBookingStatus(guestBookingId, { isPaid: true });
    assert.equal(result.pointsAwarded, 0);
    assert.equal(result.booking.isPaid, true);

    const user = (await db.query<{ points: number }>('SELECT points FROM app_user WHERE id = 1')).rows[0];
    assert.equal(user.points, 0);
  });

  test('late arrivals can pay during the film; unpaid reservations expire at film end and cannot be revived', async () => {
    const { updateBookingStatus, getUserBookings, listAllBookings, getBookingByReference } = await import('../services/bookings.service.js');
    const unpaidId = await seedBooking([1], 1, { user: 1 });
    const paidId = await seedBooking([2], 1, { user: 1 });
    await db.query("UPDATE screening SET starts_at = clock_timestamp() - interval '1 second' WHERE id = 1");
    assert.equal((await getUserBookings(1)).find(booking => booking.id === unpaidId)!.status, 'expired');
    assert.equal((await listAllBookings({ status: 'reserved' })).length, 0);
    assert.equal((await listAllBookings({ status: 'confirmed' })).length, 0);
    await assert.rejects(() => updateBookingStatus(unpaidId, { isCheckedIn: true }), { status: 409 });
    const latePayment = await updateBookingStatus(paidId, { isPaid: true, isCheckedIn: true });
    assert.equal(latePayment.booking.status, 'confirmed');
    assert.equal(latePayment.pointsAwarded, 140);
    await assert.rejects(() => updateBookingStatus(paidId, { isPaid: false }), { status: 409 });
    await db.query("UPDATE screening SET starts_at = clock_timestamp() - interval '101 minutes' WHERE id = 1");

    const bookings = await getUserBookings(1);
    const expired = bookings.find(booking => booking.id === unpaidId)!;
    assert.equal(expired.status, 'expired');
    assert.equal((await getBookingByReference(expired.reference)).status, 'expired');
    assert.equal(bookings.find(booking => booking.id === paidId)!.status, 'confirmed');
    assert.deepEqual((await listAllBookings({ status: 'confirmed' })).map(booking => booking.id), [paidId]);
    assert.deepEqual((await listAllBookings({ status: 'expired' })).map(booking => booking.id), [unpaidId]);
    for (const input of [{ isPaid: true }, { isCheckedIn: true }, { isPaid: true, isCheckedIn: true }]) {
      await assert.rejects(() => updateBookingStatus(unpaidId, input), { status: 409 });
    }
    const unchanged = (await db.query('SELECT is_paid, paid_at, is_checked_in FROM booking WHERE id = $1', [unpaidId])).rows[0];
    assert.deepEqual(unchanged, { is_paid: false, paid_at: null, is_checked_in: false });
    assert.equal((await updateBookingStatus(paidId, { isCheckedIn: true })).booking.isCheckedIn, true);
  });

  test('unpaid seats release one hour before start without cleanup; late payment must acquire available seats', async () => {
    const { getScreeningSeats, listUpcomingScreenings } = await import('../services/screenings.service.js');
    const { updateBookingStatus, getUserBookings } = await import('../services/bookings.service.js');
    const id = await seedBooking([1, 2], 1, { user: 1 });
    const paid = await seedBooking([3], 1, { user: 2, paid: true });
    await db.query("UPDATE screening SET starts_at = clock_timestamp() + interval '61 minutes' WHERE id = 1");
    assert.equal((await getScreeningSeats(1)).seats.filter(seat => seat.status === 'booked').length, 3);
    await db.query("UPDATE screening SET starts_at = clock_timestamp() + interval '1 hour' WHERE id = 1");
    assert.equal((await getScreeningSeats(1)).seats.filter(seat => seat.status === 'booked').length, 1);
    assert.equal((await listUpcomingScreenings({})).find(screening => screening.id === 1)!.bookedSeats, 1);
    assert.equal((await getUserBookings(1)).find(booking => booking.id === id)!.status, 'expired');
    assert.equal((await request('/', payload([4]), { user: 1 })).status, 409);
    assert.equal((await request('/guest/request', payload([4]))).status, 409);
    assert.equal(messages.length, 0);
    await cleanup(); await cleanup();
    const historical = (await getUserBookings(1)).find(booking => booking.id === id)!;
    assert.equal(historical.tickets.length, 2);
    assert.equal(Number(historical.totalPrice), 280);
    assert.deepEqual((await db.query('SELECT is_active FROM ticket WHERE booking_id = $1', [id])).rows, [{ is_active: false }, { is_active: false }]);
    const replacement = await seedBooking([1], 1, { user: 2, paid: true });
    await assert.rejects(() => updateBookingStatus(id, { isPaid: true }), { status: 409 });
    assert.equal((await db.query('SELECT points FROM app_user WHERE id = 1')).rows[0].points, 0);
    assert.equal((await db.query('SELECT is_paid FROM booking WHERE id = $1', [id])).rows[0].is_paid, false);
    const result = await updateBookingStatus(id, { isPaid: true, seatIds: [4, 5] });
    assert.equal(result.booking.status, 'confirmed');
    assert.equal(result.pointsAwarded, 280);
    assert.deepEqual(result.booking.tickets.map((ticket: { seatId: number }) => ticket.seatId), [4, 5]);
    const retry = await updateBookingStatus(id, { isPaid: true, seatIds: [4, 5] });
    assert.equal(retry.pointsAwarded, 0);
    assert.equal(retry.booking.status, 'confirmed');
    assert.equal((await getScreeningSeats(1)).seats.filter(seat => seat.status === 'booked').length, 4);
    for (const bookingId of [paid, replacement]) {
      assert.equal((await db.query('SELECT is_active FROM ticket WHERE booking_id = $1', [bookingId])).rows[0].is_active, true);
    }
  });

  test('concurrent late payments cannot claim the same released seat', async () => {
    const { updateBookingStatus } = await import('../services/bookings.service.js');
    const first = await seedBooking([1], 1, { user: 1 });
    await db.query("UPDATE screening SET starts_at = clock_timestamp() + interval '10 minutes' WHERE id = 1");
    await cleanup();
    const second = await seedBooking([1], 1, { user: 2 });
    await cleanup();
    const results = await Promise.allSettled([updateBookingStatus(first, { isPaid: true }), updateBookingStatus(second, { isPaid: true })]);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    const rejected = results.find(result => result.status === 'rejected');
    assert.ok(rejected?.status === 'rejected');
    assert.equal(rejected.reason.status, 409);
    assert.equal(Number((await db.query('SELECT count(*) FROM ticket WHERE screening_id = 1 AND seat_id = 1 AND is_active')).rows[0].count), 1);
    assert.equal(Number((await db.query('SELECT sum(points) FROM app_user')).rows[0].sum), 140);
  });

  test('cleanup deletes only unpaid reservations seven days after film end, including their tickets and kiosk lines', async () => {
    const expiredId = await seedBooking([1], 1);
    const paidId = await seedBooking([2], 1, { paid: true });
    const cancelledId = await seedBooking([], 1, { cancelled: true });
    const recentId = await seedBooking([3], 2);
    const ongoingId = await seedBooking([4], 3);
    const futureId = await seedBooking([5], 4);
    const guestId = await seedBooking([6], 1, { guest: true });
    for (const id of [expiredId, paidId, guestId]) {
      await db.query('INSERT INTO booking_item(booking_id, menu_item_id, quantity) VALUES ($1, 1, 1)', [id]);
    }
    // Film duration is 100 minutes. The recent film started over seven days
    // ago but ended less than seven days ago, so it must still be retained.
    await db.query("UPDATE screening SET starts_at = clock_timestamp() - interval '7 days 101 minutes' WHERE id = 1");
    await db.query("UPDATE screening SET starts_at = clock_timestamp() - interval '7 days 1 minute' WHERE id = 2");
    await db.query("UPDATE screening SET starts_at = clock_timestamp() - interval '1 minute' WHERE id = 3");
    await cleanup();
    await cleanup();
    assert.deepEqual((await db.query('SELECT id FROM booking ORDER BY id')).rows.map(row => row.id), [paidId, cancelledId, recentId, ongoingId, futureId].sort((a, b) => a - b));
    assert.equal(Number((await db.query('SELECT count(*) FROM ticket WHERE booking_id = ANY($1)', [[expiredId, guestId]])).rows[0].count), 0);
    assert.deepEqual((await db.query('SELECT booking_id FROM booking_item')).rows, [{ booking_id: paidId }]);
    assert.equal(Number((await db.query('SELECT count(*) FROM ticket WHERE booking_id = $1', [paidId])).rows[0].count), 1);
  });
});
