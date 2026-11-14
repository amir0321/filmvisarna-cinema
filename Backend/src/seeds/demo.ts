import type { PoolClient } from 'pg';
import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { todayIn } from '../utils/dates.js';
import { getSeedMovies, seedDateOffset } from './movieData.js';
import { BOOKING_REF_ALPHABET } from '../utils/bookingRef.js';
import { savePerson } from '../services/persons.service.js';

const DEMO_EMAILS = ['admin@filmvisarna.se', 'medlem@filmvisarna.se', 'testuser1@example.com'];
const SHOW_TIMES = ['10:00:00', '14:00:00', '18:00:00'];
const FREE_SEATS = ['D4', 'D5', 'H9'];

interface DemoScreening { id: number; cinemaId: number; date: string; title: string }

export async function seedMovies(client: PoolClient, today: string) {
  const result = [];
  for (const movie of getSeedMovies(today)) {
    const existing = await client.query<{ id: number }>('SELECT id FROM movie WHERE title = $1 ORDER BY id LIMIT 1', [movie.title]);
    const values = [movie.title, movie.duration_minutes, movie.age_rating, movie.director, movie.imdb_rating,
      movie.description, movie.trailer_url, movie.poster_url, movie.landscape_image_url, movie.release_date];
    let id = existing.rows[0]?.id;
    if (id) {
      await client.query(`UPDATE movie SET title=$1, duration_minutes=$2, age_rating=$3, director=$4,
        imdb_rating=$5, description=$6, trailer_url=$7, poster_url=$8, landscape_image_url=$9, release_date=$10 WHERE id=$11`, [...values, id]);
    } else {
      const inserted = await client.query<{ id: number }>(`INSERT INTO movie
        (title,duration_minutes,age_rating,director,imdb_rating,description,trailer_url,poster_url,landscape_image_url,release_date)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, values);
      id = inserted.rows[0].id;
    }
    for (const name of movie.genres) {
      const genre = await client.query<{ id: number }>(`INSERT INTO genre (name) VALUES ($1)
        ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id`, [name]);
      await client.query('INSERT INTO movie_genre VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, genre.rows[0].id]);
    }
    const director = await savePerson(client, { name: movie.director });
    await client.query(`INSERT INTO movie_person (movie_id,person_id,role)
      VALUES ($1,$2,'director') ON CONFLICT DO NOTHING`, [id,director.id]);
    for (const member of movie.cast_members) {
      const person = await savePerson(client, { name: member.name, tmdb_id: member.tmdb_id });
      // Enrich legacy seed people while preserving profiles already edited by admins.
      await client.query(`UPDATE person SET photo_url=COALESCE(NULLIF(trim(photo_url),''),$2),
        bio=COALESCE(NULLIF(trim(bio),''),$3) WHERE id=$1`, [person.id,member.photo_url,member.bio]);
      await client.query(`INSERT INTO movie_person (movie_id,person_id,role,character_name,billing_order)
        VALUES ($1,$2,'actor',$3,$4) ON CONFLICT (movie_id,person_id,role)
        DO UPDATE SET character_name=EXCLUDED.character_name,billing_order=EXCLUDED.billing_order`,
        [id,person.id,member.character_name,member.billing_order]);
    }
    result.push({ ...movie, id });
  }
  return result;
}

async function seedCinemas(client: PoolClient) {
  const ids: number[] = [];
  for (const [index, name] of ['Stora Salongen', 'Lilla Salongen'].entries()) {
    const { rows } = await client.query<{ id: number }>(`INSERT INTO cinema (name,format,tech,screen_size,opened_year)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
      [name, index === 0 ? '4K Dolby Atmos' : '2D Intimt', index === 0 ? 'Laser 4K, Dolby Atmos 7.1' : '2K Digital, Dolby 5.1', index === 0 ? '18×8 m' : '10×4,5 m', index === 0 ? 1987 : 2019]);
    const id = rows[0].id;
    await client.query(`INSERT INTO seat (cinema_id,row_label,seat_number,seat_type)
      SELECT $1,chr(65+r),s,CASE WHEN r=0 AND s IN (1,$3::int) THEN 'wheelchair' ELSE 'regular' END
      FROM generate_series(0,$2::int-1) r CROSS JOIN generate_series(1,$3::int) s
      ON CONFLICT (cinema_id,row_label,seat_number) DO NOTHING`, [id, index === 0 ? 8 : 5, index === 0 ? 10 : 8]);
    await client.query("UPDATE seat SET seat_type='wheelchair' WHERE cinema_id=$1 AND row_label='A' AND seat_number IN (1,$2)", [id, index === 0 ? 10 : 8]);
    ids.push(id);
  }
  return ids;
}

async function removeLegacyTestCinemas(client: PoolClient, largeCinemaId: number, today: string) {
  const legacy = await client.query<{ id: number }>("SELECT id FROM cinema WHERE name ~ '^Testsalong [1-4]$' FOR UPDATE");
  if (!legacy.rows.length) return;
  const legacyIds = legacy.rows.map((row) => row.id);
  // Rebuild only unbooked seed showings. Every booking, including cancellations, is preserved.
  await client.query(`DELETE FROM screening s USING movie m,cinema c WHERE s.movie_id=m.id AND s.cinema_id=c.id
    AND c.name IN ('Stora Salongen','Lilla Salongen') AND m.title=ANY($1::text[])
    AND NOT EXISTS (SELECT 1 FROM booking b WHERE b.screening_id=s.id)`, [getSeedMovies(today).map((movie) => movie.title)]);
  const booked = await client.query<{ id: number; movie_id: number; title: string; duration_minutes: number; date: string; future: boolean }>(`SELECT s.id,s.movie_id,m.title,m.duration_minutes,
    to_char(s.starts_at AT TIME ZONE 'Europe/Stockholm','YYYY-MM-DD') AS date,s.starts_at>now() AS future
    FROM screening s JOIN movie m ON m.id=s.movie_id WHERE s.cinema_id=ANY($1::int[])
    AND EXISTS (SELECT 1 FROM booking b WHERE b.screening_id=s.id) ORDER BY s.starts_at,s.id FOR UPDATE OF s`, [legacyIds]);
  for (const showing of booked.rows) {
    let moved = false;
    for (let offset = 0; offset < 60 && !moved; offset++) {
      const date = seedDateOffset(showing.date, showing.future ? offset : -offset);
      for (const time of ['18:00:00','10:00:00','14:00:00']) {
        const free = await client.query(`SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM screening_times st WHERE st.cinema_id=$1
          AND st.starts_at < (($2::timestamp AT TIME ZONE 'Europe/Stockholm') + ($3+20)*interval '1 minute')
          AND st.ends_at+interval '20 minutes'>($2::timestamp AT TIME ZONE 'Europe/Stockholm'))
          AND (($2::timestamp AT TIME ZONE 'Europe/Stockholm')>now())=$4`, [largeCinemaId, `${date} ${time}`, showing.duration_minutes, showing.future]);
        if (!free.rows.length) continue;
        const before = await client.query<{ count: number }>('SELECT count(*)::int AS count FROM ticket WHERE screening_id=$1', [showing.id]);
        const remapped = await client.query(`UPDATE ticket t SET seat_id=target.id FROM seat old JOIN seat target
          ON target.cinema_id=$2 AND target.row_label=old.row_label AND target.seat_number=old.seat_number
          WHERE t.seat_id=old.id AND t.screening_id=$1`, [showing.id, largeCinemaId]);
        if (remapped.rowCount !== before.rows[0].count) throw new Error('Cannot preserve all seats while moving a legacy screening');
        await client.query("UPDATE screening SET cinema_id=$2,starts_at=$3::timestamp AT TIME ZONE 'Europe/Stockholm' WHERE id=$1", [showing.id, largeCinemaId, `${date} ${time}`]);
        console.log(`Preserved screening ${showing.id}: ${showing.title}, Stora Salongen, ${date} ${time}`);
        moved = true;
        break;
      }
    }
    if (!moved) throw new Error('No safe slot found for a booked legacy screening; no changes were saved');
  }
  await client.query('DELETE FROM screening s WHERE cinema_id=ANY($1::int[]) AND NOT EXISTS (SELECT 1 FROM booking b WHERE b.screening_id=s.id)', [legacyIds]);
  await client.query('DELETE FROM cinema WHERE id=ANY($1::int[])', [legacyIds]);
  console.log('Removed the four legacy test cinemas. All bookings and their references were preserved.');
}

async function ensureScreening(client: PoolClient, movie: { id: number; title: string; duration_minutes: number }, cinemaId: number, date: string, time: string, skipConflict = false): Promise<DemoScreening | null> {
  const timestamp = `${date} ${time}`;
  // Never create a screening that overlaps an existing screening, including cleaning time.
  const { rows } = await client.query<{ id: number; movie_id: number }>(`SELECT id,movie_id FROM screening_times
    WHERE cinema_id=$1 AND starts_at < (($2::timestamp AT TIME ZONE 'Europe/Stockholm') + ($3+20)*interval '1 minute')
      AND ends_at + interval '20 minutes' > ($2::timestamp AT TIME ZONE 'Europe/Stockholm')`, [cinemaId, timestamp, movie.duration_minutes]);
  if (rows.length) {
    if (rows.length !== 1 || rows[0].movie_id !== movie.id) {
      if (skipConflict) return null;
      throw new Error(`Demo schedule conflict: ${movie.title}, ${date}, cinema ${cinemaId}`);
    }
    return { id: rows[0].id, cinemaId, date, title: movie.title };
  }
  const inserted = await client.query<{ id: number }>(`INSERT INTO screening (movie_id,cinema_id,starts_at)
    VALUES ($1,$2,$3::timestamp AT TIME ZONE 'Europe/Stockholm') RETURNING id`, [movie.id, cinemaId, timestamp]);
  return { id: inserted.rows[0].id, cinemaId, date, title: movie.title };
}

async function addBooking(client: PoolClient, screening: DemoScreening, reference: string, seatIds: number[], priceGroupId: number, options: { userId?: number; paid?: boolean; cancelled?: boolean; past?: boolean } = {}) {
  const hash = createHash('sha256').update(reference).digest();
  reference = `FV-${Array.from(hash.subarray(0, 5), (byte) => BOOKING_REF_ALPHABET[byte % BOOKING_REF_ALPHABET.length]).join('')}`;
  const existing = await client.query<{ screening_id: number; user_id: number | null }>('SELECT screening_id,user_id FROM booking WHERE booking_reference=$1', [reference]);
  if (existing.rows.length) {
    if (existing.rows[0].screening_id !== screening.id || existing.rows[0].user_id !== (options.userId ?? null)) {
      throw new Error('Demo booking reference collision; no data has been changed');
    }
    return;
  }
  if (seatIds.length > 10) throw new Error('Demo bookings must respect the ten-ticket limit');
  const inserted = await client.query<{ id: number }>(`INSERT INTO booking
    (screening_id,user_id,guest_email,guest_name,booking_reference,status,is_paid,paid_at,is_checked_in,checked_in_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,CASE WHEN $7 THEN now() END,$8,CASE WHEN $8 THEN now() END) RETURNING id`,
  [screening.id, options.userId ?? null, options.userId ? null : 'seed-crowd@example.test',
    options.userId ? null : 'Testpublik', reference, options.cancelled ? 'cancelled' : 'confirmed',
    options.paid ?? false, Boolean(options.past && !options.cancelled)]);
  if (!options.cancelled && seatIds.length) {
    await client.query(`INSERT INTO ticket (screening_id,seat_id,booking_id,price_group_id)
      SELECT $1,id,$2,$3 FROM unnest($4::int[]) id`, [screening.id, inserted.rows[0].id, priceGroupId, seatIds]);
  }
  if (options.userId && !options.cancelled) {
    await client.query(`INSERT INTO booking_item (booking_id,menu_item_id,quantity)
      SELECT $1,id,1 FROM menu_item WHERE name='Mellanpopcorn' AND is_available ON CONFLICT DO NOTHING`, [inserted.rows[0].id]);
  }
}

async function fillScreening(client: PoolClient, screening: DemoScreening, priceGroupId: number, leaveThree: boolean) {
  const seats = await client.query<{ id: number; label: string }>(`SELECT s.id,s.row_label || s.seat_number AS label FROM seat s
    WHERE s.cinema_id=$1 AND NOT EXISTS (SELECT 1 FROM ticket t WHERE t.screening_id=$2 AND t.seat_id=s.id)
    ORDER BY s.row_label,s.seat_number`, [screening.cinemaId, screening.id]);
  const reserve = seats.rows.filter((seat) => !leaveThree || !FREE_SEATS.includes(seat.label));
  for (let index = 0; index < reserve.length; index += 10) {
    const firstSeat = reserve[index].id;
    await addBooking(client, screening, `FV-DEMO-CROWD-${screening.id}-${firstSeat}`,
      reserve.slice(index, index + 10).map((seat) => seat.id), priceGroupId, { paid: true });
  }
}

export async function seedDemoData() {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo data is only allowed outside production');
  const today = todayIn('Europe/Stockholm');
  const tomorrow = seedDateOffset(today, 1);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('filmvisarna-demo-seed'))");
    const movies = await seedMovies(client, today);
    const cinemas = await seedCinemas(client);
    await removeLegacyTestCinemas(client, cinemas[0], today);
    const price = await client.query<{ id: number }>(`INSERT INTO price_group (name,price) VALUES ('adult',140)
      ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id`);
    await client.query("INSERT INTO price_group (name,price) VALUES ('child',80),('elder',120) ON CONFLICT (name) DO NOTHING");
    await client.query(`INSERT INTO menu_item (name,description,category,price) VALUES ('Mellanpopcorn','Nypoppade popcorn','food',45)
      ON CONFLICT (name) DO NOTHING`);
    const priceId = price.rows[0].id;
    const nowShowing = movies.filter((movie) => movie.release_date <= today);
    for (let offset = 0; offset < 14; offset++) {
      const date = seedDateOffset(today, offset);
      const existing = await client.query<{ title: string }>(`SELECT m.title FROM screening s JOIN movie m ON m.id=s.movie_id
        WHERE s.cinema_id=ANY($1::int[]) AND (s.starts_at AT TIME ZONE 'Europe/Stockholm')::date=$2::date`, [cinemas,date]);
      const used = new Set(existing.rows.map((row) => row.title));
      const half = Math.floor(Date.parse(`${date}T12:00:00Z`) / 86400000) % 2;
      const ordered = [...nowShowing.slice(half*6), ...nowShowing.slice(0,half*6)];
      for (const cinemaId of cinemas) {
        for (const time of SHOW_TIMES) {
          const movie = ordered.find((movie) => !used.has(movie.title));
          if (!movie) continue;
          const showing = await ensureScreening(client,movie,cinemaId,date,time,true);
          if (showing) used.add(movie.title);
        }
      }
    }
    const scenario = async (title: string) => {
      const { rows } = await client.query<DemoScreening>(`SELECT s.id,s.cinema_id AS "cinemaId",
        to_char(s.starts_at AT TIME ZONE 'Europe/Stockholm','YYYY-MM-DD') AS date,m.title
        FROM screening s JOIN movie m ON m.id=s.movie_id WHERE s.cinema_id=$1 AND m.title=$2
        AND (s.starts_at AT TIME ZONE 'Europe/Stockholm')::date >= $3::date
        AND NOT EXISTS (SELECT 1 FROM booking b WHERE b.screening_id=s.id AND b.status='confirmed' AND COALESCE(b.guest_email,'') NOT LIKE '%crowd%@example.test') ORDER BY EXISTS (SELECT 1 FROM booking b WHERE b.screening_id=s.id AND b.guest_email LIKE '%crowd%@example.test') DESC,s.starts_at LIMIT 1`, [cinemas[0],title,tomorrow]);
      if (!rows[0]) throw new Error(`Missing scenario: ${title}`);
      return rows[0];
    };
    const nearFull = await scenario('Dune: Part Two');
    const soldOut = await scenario('Interstellar');
    await fillScreening(client,nearFull,priceId,true);
    await fillScreening(client,soldOut,priceId,false);

    const hash = await bcrypt.hash(process.env.SEED_USER_PASSWORD || 'Password123!',12);
    const userIds: number[] = [];
    for (const [index,email] of DEMO_EMAILS.entries()) {
      const { rows } = await client.query<{ id: number }>(`INSERT INTO app_user (email,password_hash,first_name,last_name,role)
        VALUES ($1,$2,$3,'Demo',$4) ON CONFLICT (email) DO UPDATE SET email=EXCLUDED.email RETURNING id`,
        [email,hash,['Ameer','Anna','Test'][index],index===0?'admin':'user']);
      userIds.push(rows[0].id);
    }
    const upcoming = await client.query<DemoScreening>(`SELECT s.id,s.cinema_id AS "cinemaId",
      to_char(s.starts_at AT TIME ZONE 'Europe/Stockholm','YYYY-MM-DD') AS date,m.title FROM screening s JOIN movie m ON m.id=s.movie_id
      WHERE s.starts_at>now()+interval '1 day' AND m.title='Inception' AND s.cinema_id=ANY($1::int[])
      ORDER BY EXISTS (SELECT 1 FROM booking b WHERE b.screening_id=s.id AND b.user_id=ANY($2::int[])) DESC,s.starts_at LIMIT 6`, [cinemas,userIds]);
    const history = await client.query<DemoScreening>(`SELECT s.id,s.cinema_id AS "cinemaId",
      to_char(s.starts_at AT TIME ZONE 'Europe/Stockholm','YYYY-MM-DD') AS date,m.title FROM screening s JOIN movie m ON m.id=s.movie_id
      WHERE s.starts_at<now() AND s.cinema_id=ANY($1::int[]) AND EXISTS (SELECT 1 FROM booking b WHERE b.screening_id=s.id AND b.user_id=ANY($2::int[]))
      ORDER BY s.starts_at DESC LIMIT 6`, [cinemas,userIds]);
    for (let index=history.rows.length; index<6; index++) {
      const showing = await ensureScreening(client,nowShowing[index],cinemas[0],seedDateOffset(today,-index-1),'18:00:00');
      if (showing) history.rows.push(showing);
    }
    if (upcoming.rows.length<6 || history.rows.length<6) throw new Error('Not enough fixtures for booking pagination');
    for (const [userIndex,userId] of userIds.entries()) {
      for (const [past,shows] of [[false,upcoming.rows],[true,history.rows]] as const) {
        for (const [index,show] of shows.entries()) {
          const seats = await client.query<{ id: number }>(`SELECT s.id FROM seat s WHERE s.cinema_id=$1 AND row_label='C' AND seat_number BETWEEN $2 AND $3`,
            [show.cinemaId,userIndex*2+1,userIndex*2+2]);
          await addBooking(client,show,`FV-DEMO-${show.id}-U${userId}`,seats.rows.map((seat)=>seat.id),priceId,
            {userId,paid:past || index%2===0,past,cancelled:past && index>=4});
        }
      }
    }
    const details = await client.query<{ id: number; title: string; cinema: string; startsAt: Date }>(`SELECT s.id,m.title,c.name AS cinema,s.starts_at AS "startsAt"
      FROM screening s JOIN movie m ON m.id=s.movie_id JOIN cinema c ON c.id=s.cinema_id WHERE s.id=ANY($1::int[])`, [[nearFull.id,soldOut.id]]);
    await client.query('COMMIT');
    console.log(`Demo ready: ${movies.length} movies (${nowShowing.length} now showing), only Stora Salongen (80 seats) and Lilla Salongen (40 seats), 14 days.`);
    details.rows.forEach((show)=>console.log(`${show.title}: ${show.cinema}, ${show.startsAt.toLocaleString('sv-SE',{timeZone:'Europe/Stockholm'})}, /boka/${show.id}`));
    console.log('Dune free seats: D4, D5, H9. Interstellar: sold out. Use the weekend filter for repertoire pagination.');
    console.log('Demo accounts retain passwords and have at least 6 upcoming and 6 historical bookings. No emails are sent.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
