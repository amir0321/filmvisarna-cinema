import assert from 'node:assert/strict';
import { pool } from '../db.js';
import { getSeedMovies, seedDateOffset } from '../seeds/movieData.js';
import { todayIn } from '../utils/dates.js';

async function verifyPublicApi(screeningId: number) {
  const base = `http://127.0.0.1:${process.env.PORT || 3000}/api`;
  const date = seedDateOffset(todayIn('Europe/Stockholm'), 1);
  const responses = await Promise.all([
    fetch(`${base}/movies`), fetch(`${base}/screenings?date=${date}`),
    fetch(`${base}/screenings/${screeningId}/seats`), fetch(`${base}/cinemas`),
  ]);
  for (const response of responses) assert.equal(response.status, 200);
  const { data: movies } = await responses[0].json() as { data: { id: number }[] };
  const shows = await responses[1].json() as { movieId: number }[];
  const seats = await responses[2].json() as { seats: { row_label: string; seat_number: number; status: string }[] };
  const cinemaBody = await responses[3].json();
  const cinemas = Array.isArray(cinemaBody) ? cinemaBody : cinemaBody.data;
  assert.ok(movies.length >= 16);
  assert.ok(shows.length > 0);
  assert.equal(cinemas.length, 2);
  const free = seats.seats.filter((seat) => seat.status === 'available')
    .map((seat) => `${seat.row_label}${seat.seat_number}`).sort();
  assert.deepEqual(free, ['D4', 'D5', 'H9']);
  console.log('Public API verified: movies, repertoire, two cinemas and exactly three available seats.');
}

async function verify() {
  try {
    const titles = getSeedMovies().map((movie) => movie.title);
    const catalogue = await pool.query<{ title: string; count: number }>(`SELECT title,count(*)::int AS count
      FROM movie WHERE title=ANY($1::text[]) GROUP BY title`, [titles]);
    assert.equal(catalogue.rows.length, titles.length);
    assert.ok(catalogue.rows.every((movie) => movie.count === 1), 'Repeated seeding must not duplicate movies');
    const cinemas = await pool.query<{ name: string; total_seats: number }>('SELECT name,total_seats FROM cinema_overview ORDER BY total_seats DESC');
    assert.deepEqual(cinemas.rows, [{name:'Stora Salongen',total_seats:80},{name:'Lilla Salongen',total_seats:40}]);
    const repertoire = await pool.query<{ movies: number }>(`SELECT count(DISTINCT st.movie_id)::int AS movies
      FROM screening_times st WHERE st.starts_at>now()`);
    assert.ok(repertoire.rows[0].movies >= 12, 'The upcoming programme must include twelve different movies');
    const scenarios = await pool.query<{ id: number; title: string; cinema: string; starts_at: Date; free: string[] }>(`SELECT DISTINCT ON (m.title) st.id,m.title,c.name AS cinema,st.starts_at,
      ARRAY(SELECT s.row_label || s.seat_number FROM seat s WHERE s.cinema_id=st.cinema_id
        AND NOT EXISTS (SELECT 1 FROM ticket t JOIN booking b ON b.id=t.booking_id
          WHERE t.screening_id=st.id AND t.seat_id=s.id AND b.status='confirmed')
        ORDER BY s.row_label,s.seat_number) AS free
      FROM screening_times st JOIN movie m ON m.id=st.movie_id JOIN cinema c ON c.id=st.cinema_id
      WHERE st.starts_at>now() AND m.title IN ('Dune: Part Two','Interstellar')
        AND EXISTS (SELECT 1 FROM booking b WHERE b.screening_id=st.id AND b.guest_email='seed-crowd@example.test')
      ORDER BY m.title,st.starts_at`);
    assert.deepEqual(scenarios.rows.find((row) => row.title === 'Dune: Part Two')?.free, ['D4', 'D5', 'H9']);
    assert.deepEqual(scenarios.rows.find((row) => row.title === 'Interstellar')?.free, []);
    const overlaps = await pool.query(`SELECT a.id,b.id FROM screening_times a JOIN screening_times b
      ON a.cinema_id=b.cinema_id AND a.id<b.id
      WHERE a.starts_at < b.ends_at + interval '20 minutes' AND b.starts_at < a.ends_at + interval '20 minutes'`);
    assert.equal(overlaps.rowCount, 0, 'Screenings must not overlap, including the cleaning buffer');
    const wrongSeats = await pool.query(`SELECT t.booking_id FROM ticket t JOIN seat s ON s.id=t.seat_id
      JOIN screening st ON st.id=t.screening_id WHERE s.cinema_id<>st.cinema_id`);
    assert.equal(wrongSeats.rowCount,0,'Moved tickets must use seats in their actual cinema');
    const bookings = await pool.query<{ email: string; upcoming: number; history: number }>(`SELECT u.email,
      count(*) FILTER (WHERE b.status='confirmed' AND st.starts_at>now())::int AS upcoming,
      count(*) FILTER (WHERE b.status='cancelled' OR st.starts_at<=now())::int AS history
      FROM app_user u JOIN booking b ON b.user_id=u.id JOIN screening_times st ON st.id=b.screening_id
      WHERE u.email=ANY($1::text[]) GROUP BY u.email`,
      [['admin@filmvisarna.se','medlem@filmvisarna.se','testuser1@example.com']]);
    assert.equal(bookings.rows.length,3);
    for (const user of bookings.rows) assert.ok(user.upcoming>=6 && user.history>=6);
    console.log(JSON.stringify({seededMovies:catalogue.rows.length,programmeMovies:repertoire.rows[0].movies,
      cinemas:cinemas.rows,scenarios:scenarios.rows,overlaps:overlaps.rowCount,invalidTicketSeats:wrongSeats.rowCount,bookings:bookings.rows},null,2));
    if (process.argv.includes('--api')) await verifyPublicApi(scenarios.rows.find((row)=>row.title==='Dune: Part Two')!.id);
  } finally {
    await pool.end();
  }
}

verify().catch((error)=>{console.error(error);process.exitCode=1;});
