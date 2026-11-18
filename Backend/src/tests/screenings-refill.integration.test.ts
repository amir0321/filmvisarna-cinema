import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';

const databaseUrl = process.env.AUTH_TEST_DATABASE_URL;
describe('screening refill with PostgreSQL', { skip: !databaseUrl }, () => {
  let db: pg.Pool;
  let admin: pg.Pool;
  let refill: (db: Pick<pg.Pool, 'connect'>) => Promise<number>;
  const schema = `refill_test_${randomUUID().replaceAll('-', '')}`;
  before(async () => {
    admin = new pg.Pool({ connectionString: databaseUrl });
    await admin.query(`CREATE SCHEMA "${schema}"`);
    const url = new URL(databaseUrl!);
    url.searchParams.set('options', `-c search_path=${schema}`);
    process.env.DATABASE_URL = url.href;
    process.env.DB_SSL = 'false';
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'isolated-screening-refill-test-secret';
    ({ pool: db } = await import('../db.js'));
    ({ refillScreenings: refill } = await import('../scripts/add-screenings.js'));
    for (const file of ['01_schema.sql', '02_views.sql']) {
      await db.query(await readFile(resolve('sql', file), 'utf8'));
    }
  });
  beforeEach(async () => {
    await db.query('TRUNCATE cinema, movie RESTART IDENTITY CASCADE');
    await db.query(`INSERT INTO cinema (name) VALUES ('Large'), ('Small'), ('No seats');
      INSERT INTO seat (cinema_id,row_label,seat_number) VALUES (1,'A',1),(2,'A',1);
      INSERT INTO movie (title,duration_minutes,release_date) VALUES
        ('Released',100,current_date-1),('Long movie',197,NULL),('Future',90,current_date+40)`);
  });
  after(async () => {
    await db?.end();
    await admin?.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin?.end();
  });

  test('fills a 21 day horizon, respects release dates, seats and cleaning gaps, and is idempotent', async () => {
    assert.ok(await refill(db) > 100);
    assert.equal(await refill(db), 0);
    const counts = (await db.query(`SELECT count(*) FILTER (WHERE cinema_id=3 OR movie_id=3 OR starts_at<=now())::int AS invalid,
      max((starts_at AT TIME ZONE 'Europe/Stockholm')::date) - (now() AT TIME ZONE 'Europe/Stockholm')::date AS horizon FROM screening`)).rows[0];
    assert.equal(counts.invalid, 0);
    assert.equal(counts.horizon, 20);
    const overlap = await db.query(`SELECT a.id FROM screening_times a JOIN screening_times b
      ON a.cinema_id=b.cinema_id AND a.id<b.id
      WHERE a.starts_at < b.ends_at + interval '20 minutes' AND b.starts_at < a.ends_at + interval '20 minutes'`);
    assert.equal(overlap.rowCount, 0);
  });

  test('concurrent runs do not duplicate screenings', async () => {
    const added = await Promise.all([refill(db), refill(db)]);
    assert.ok(added.some(value => value > 0));
    const count = Number((await db.query('SELECT count(*) FROM screening')).rows[0].count);
    assert.equal(added.reduce((a, b) => a + b), count);
    assert.equal(await refill(db), 0);
  });

  test('preserves a manually scheduled showing and its booking', async () => {
    const showing = (await db.query(`INSERT INTO screening (movie_id,cinema_id,starts_at)
      VALUES (2,1,((now() AT TIME ZONE 'Europe/Stockholm')::date + 1 + time '15:00') AT TIME ZONE 'Europe/Stockholm') RETURNING id`)).rows[0];
    await db.query(`INSERT INTO booking (screening_id,guest_email,booking_reference) VALUES ($1,'test@example.test','FV-TEST1')`, [showing.id]);
    await refill(db);
    assert.equal((await db.query('SELECT id FROM screening WHERE id=$1', [showing.id])).rowCount, 1);
    assert.equal((await db.query("SELECT id FROM booking WHERE booking_reference='FV-TEST1'")).rowCount, 1);
    const conflict = await db.query(`SELECT other.id FROM screening_times other JOIN screening_times manual
      ON other.cinema_id=manual.cinema_id AND other.id<>manual.id WHERE manual.id=$1
      AND other.starts_at < manual.ends_at + interval '20 minutes'
      AND other.ends_at + interval '20 minutes' > manual.starts_at`, [showing.id]);
    assert.equal(conflict.rowCount, 0);
  });

  test('empty film catalogue does nothing', async () => {
    await db.query('DELETE FROM movie');
    assert.equal(await refill(db), 0);
  });
});
