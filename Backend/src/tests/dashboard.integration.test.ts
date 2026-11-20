import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Server } from 'node:http';
import express, { type NextFunction, type Request, type Response } from 'express';
import pg from 'pg';

const databaseUrl = process.env.AUTH_TEST_DATABASE_URL;
describe('admin dashboard screenings with PostgreSQL', { skip: !databaseUrl }, () => {
  const schema = `dashboard_test_${randomUUID().replaceAll('-', '')}`;
  let admin: pg.Pool;
  let db: pg.Pool;
  let server: Server;
  let baseUrl: string;
  let adminCookie: string;
  let memberCookie: string;

  before(async () => {
    admin = new pg.Pool({ connectionString: databaseUrl });
    await admin.query(`CREATE SCHEMA "${schema}"`);
    const isolatedUrl = new URL(databaseUrl!);
    isolatedUrl.searchParams.set('options', `-c search_path=${schema}`);
    process.env.DATABASE_URL = isolatedUrl.href;
    process.env.DB_SSL = 'false';
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'isolated-dashboard-integration-secret';
    process.env.TIMEZONE = 'Europe/Stockholm';
    ({ pool: db } = await import('../db.js'));
    for (const file of ['01_schema.sql', '02_views.sql']) {
      await db.query(await readFile(resolve('sql', file), 'utf8'));
    }
    await db.query(`INSERT INTO cinema (name) VALUES ('Stora Salongen');
      INSERT INTO seat (cinema_id,row_label,seat_number) VALUES (1,'A',1),(1,'A',2);
      INSERT INTO movie (title,duration_minutes) VALUES ('Dashboard film',100);
      INSERT INTO app_user (email,password_hash,role) VALUES
        ('admin@example.test','test-hash','admin'),('member@example.test','test-hash','user');
      INSERT INTO screening (movie_id,cinema_id,starts_at) VALUES
        (1,1,(((now() AT TIME ZONE 'Europe/Stockholm')::date - 1) + time '12:00') AT TIME ZONE 'Europe/Stockholm'),
        (1,1,((now() AT TIME ZONE 'Europe/Stockholm')::date + time '00:00') AT TIME ZONE 'Europe/Stockholm'),
        (1,1,(((now() AT TIME ZONE 'Europe/Stockholm')::date + 1) + time '12:00') AT TIME ZONE 'Europe/Stockholm');
      INSERT INTO price_group (name,price) VALUES ('adult',100);
      INSERT INTO booking (screening_id,guest_email,booking_reference,is_paid) VALUES
        (2,'paid@example.test','FV-PAID1',true),(2,'expired@example.test','FV-OLD01',false);
      INSERT INTO ticket (booking_id,screening_id,seat_id,price_group_id)
        VALUES (1,2,1,1),(2,2,2,1)`);
    const { createSession, sessionCookieName } = await import('../services/sessions.service.js');
    adminCookie = `${sessionCookieName}=${(await createSession(1)).token}`;
    memberCookie = `${sessionCookieName}=${(await createSession(2)).token}`;
    const { screeningsRouter } = await import('../routes/screenings.js');
    const app = express();
    app.use('/screenings', screeningsRouter);
    app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status ?? 500).json({ error: err.message });
    });
    server = await new Promise<Server>(resolveServer => {
      const listener = app.listen(0, '127.0.0.1', () => resolveServer(listener));
    });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });
  after(async () => {
    if (server) await new Promise<void>((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
    await db?.end();
    await admin?.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin?.end();
  });

  test('dashboard rejects visitors and ordinary members', async () => {
    assert.equal((await fetch(baseUrl + '/screenings/dashboard')).status, 401);
    assert.equal((await fetch(baseUrl + '/screenings/dashboard', { headers: { Cookie: memberCookie } })).status, 403);
  });
  test('admin gets started shows from today and future shows, excluding yesterday and released unpaid seats', async () => {
    const response = await fetch(baseUrl + '/screenings/dashboard', { headers: { Cookie: adminCookie } });
    assert.equal(response.status, 200);
    const shows = await response.json() as { id: number; bookedSeats: number; totalSeats: number }[];
    assert.deepEqual(shows.map(show => show.id), [2, 3]);
    assert.equal(shows[0].bookedSeats, 1);
    assert.equal(shows[0].totalSeats, 2);
  });
  test('public listings still return future screenings only', async () => {
    const response = await fetch(baseUrl + '/screenings');
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json() as { id: number }[]).map(show => show.id), [3]);
  });
});
