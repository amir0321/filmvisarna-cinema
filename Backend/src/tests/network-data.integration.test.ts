import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Server } from 'node:http';
import pg from 'pg';

const databaseUrl = process.env.AUTH_TEST_DATABASE_URL;
describe('network payloads and cinema data with PostgreSQL', { skip: !databaseUrl }, () => {
  let db: pg.Pool;
  let admin: pg.Pool;
  let server: Server;
  let base: string;
  let cinemas: typeof import('../services/cinemas.service.js');
  let movies: typeof import('../services/movies.service.js');
  const schema = `network_test_${randomUUID().replaceAll('-','')}`;
  before(async () => {
    admin = new pg.Pool({ connectionString: databaseUrl });
    await admin.query(`CREATE SCHEMA "${schema}"`);
    const url = new URL(databaseUrl!);
    url.searchParams.set('options',`-c search_path=${schema}`);
    process.env.DATABASE_URL=url.href;
    process.env.DB_SSL='false';
    process.env.NODE_ENV='test';
    process.env.JWT_SECRET='isolated-network-data-integration-test-secret';
    ({ pool: db } = await import('../db.js'));
    for (const name of ['01_schema.sql','02_views.sql']) await db.query(await readFile(resolve('sql',name),'utf8'));
    cinemas = await import('../services/cinemas.service.js');
    movies = await import('../services/movies.service.js');
    const { app } = await import('../app.js');
    server = await new Promise<Server>(done => { const value=app.listen(0,'127.0.0.1',()=>done(value)); });
    base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  });
  beforeEach(async () => { await db.query('TRUNCATE cinema,movie,app_user,genre,person,price_group,menu_item RESTART IDENTITY CASCADE'); });
  after(async () => {
    if (server) await new Promise<void>(done => server.close(()=>done()));
    await db?.end();
    await admin?.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin?.end();
  });
  test('metadata migration is additive and repeatable on a legacy movie', async () => {
    await db.query(`DROP VIEW movie_catalogue;
      ALTER TABLE movie DROP COLUMN production_countries,DROP COLUMN production_year,DROP COLUMN distributor,
        DROP COLUMN audio_language,DROP COLUMN subtitles,DROP COLUMN images,DROP COLUMN youtube_trailers,DROP COLUMN reviews;
      INSERT INTO movie(title,duration_minutes,poster_url) VALUES ('Legacy',90,'/uploads/legacy.webp')`);
    const migration=await readFile(resolve('sql/migrations/20261120_movie_metadata.sql'),'utf8');
    await db.query(migration);
    await db.query(migration);
    const row=(await db.query('SELECT * FROM movie_catalogue')).rows[0];
    assert.equal(row.poster_url,'/uploads/legacy.webp');
    assert.deepEqual(row.reviews,[]);
    assert.deepEqual(row.production_countries,[]);
    assert.equal(row.language,null);
  });
  test('cinemas accept variable and rectangular layouts and include all seats in a single response', async () => {
    const large=await cinemas.createCinema({ name:'Large', seatsPerRow:[8,9,10,10,10,10,12,12] });
    const small=await cinemas.createCinema({ name:'Small', rows:6, seatsPerRow:[6,8,9,10,10,12] });
    assert.equal(large.seats.length,81);
    assert.equal(small.seats.length,55);
    assert.deepEqual(large.seatsPerRow,[8,9,10,10,10,10,12,12]);
    const rectangular=await cinemas.createCinema({ name:'Legacy', rows:2, seatsPerRow:3 });
    assert.equal(rectangular.seats.length,6);
    const { data }=await (await fetch(base+'/cinemas?includeSeats=true')).json();
    assert.deepEqual(data.map((row: { seats: unknown[] })=>row.seats.length),[81,55,6]);
    const overview=await (await fetch(base+'/cinemas')).json();
    assert.equal(overview.data[0].seats,undefined);
    assert.equal((await fetch(base+'/cinemas?includeSeats=invalid')).status,400);
  });
  test('cinema resizing preserves retained seat IDs and refuses removal of ticket history', async () => {
    const cinema=await cinemas.createCinema({ name:'History', rows:2, seatsPerRow:3 });
    const movie=await movies.createMovie({ title:'Film',duration_minutes:90 });
    await db.query(`INSERT INTO screening(movie_id,cinema_id,starts_at) VALUES ($1,$2,now()+interval '2 days')`,[movie.id,cinema.id]);
    await db.query("INSERT INTO price_group(name,price) VALUES ('adult',140)");
    await db.query("INSERT INTO booking(screening_id,guest_email,booking_reference) VALUES (1,'demo@example.test','FV-DEMO1')");
    const booked=cinema.seats.find(seat=>seat.row==='B' && seat.number===3)!;
    await db.query('INSERT INTO ticket(screening_id,seat_id,booking_id,price_group_id) VALUES (1,$1,1,1)',[booked.id]);
    const grown=await cinemas.updateCinema(cinema.id,{ seatsPerRow:[4,4] });
    assert.ok(grown.seats.some(seat=>seat.id===booked.id));
    await assert.rejects(cinemas.updateCinema(cinema.id,{ seatsPerRow:[4,2] }),{ status:409 });
    assert.equal((await cinemas.getCinemaById(cinema.id)).seats.length,8);
  });
  test('movie detail round-trips metadata and compact lists omit bulky detail while preserving legacy lists', async () => {
    const movie=await movies.createMovie({ title:'Metadata', duration_minutes:100,
      production_countries:['SE'],production_year:2023,language:'sv',subtitles:['en'],distributor:'Demo',
      images:['/uploads/still.webp'],youtube_trailers:['https://www.youtube.com/watch?v=demo'],
      reviews:[{ source:'Demo',quote:'Review',stars:4,max:5 }],cast_members:[{ name:'Actor',bio:'Long biography. '.repeat(100) }] });
    assert.equal(movie.language,'sv');
    assert.deepEqual(movie.reviews,[{ source:'Demo',quote:'Review',stars:4,max:5 }]);
    assert.equal((await movies.updateMovie(movie.id,{ title:'Edited' })).language,'sv');
    const compact=await (await fetch(base+'/movies?compact=true')).json();
    assert.equal(compact.data[0].cast_members,undefined);
    assert.equal(compact.data[0].reviews,undefined);
    const full=await (await fetch(base+'/movies')).json();
    assert.equal(full.data[0].cast_members.length,1);
    const detail=await (await fetch(base+`/movies/${movie.id}`)).json();
    assert.equal(detail.data.language,'sv');
    assert.ok(JSON.stringify(compact).length<JSON.stringify(full).length/2);
  });
  test('demo refresh is repeatable and builds a 28-day programme with correct capacities and buffers', async () => {
    const { seedDemoData }=await import('../seeds/demo.js');
    await seedDemoData();
    const before=(await db.query('SELECT count(*)::int AS count FROM screening')).rows[0].count;
    await seedDemoData();
    assert.equal((await db.query('SELECT count(*)::int AS count FROM screening')).rows[0].count,before);
    assert.equal(before,112);
    const daily=(await db.query(`SELECT count(*)::int AS count FROM screening WHERE extract(hour FROM starts_at AT TIME ZONE 'Europe/Stockholm')>=17 GROUP BY (starts_at AT TIME ZONE 'Europe/Stockholm')::date`)).rows;
    assert.equal(daily.length,28);
    assert.ok(daily.every(day=>day.count>=3));
    assert.equal((await db.query(`SELECT a.id FROM screening_times a JOIN screening_times b ON a.cinema_id=b.cinema_id AND a.id<b.id
      WHERE a.starts_at<b.ends_at+interval '20 minutes' AND b.starts_at<a.ends_at+interval '20 minutes'`)).rowCount,0);
  });
});
