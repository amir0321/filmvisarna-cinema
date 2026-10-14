import { pool } from "./db.js";

// Mock data for cinema halls
const cinemas = [{ name: "Stora Salongen" }, { name: "Lilla Salongen" }];

// Generate seats for a cinema hall
function generateSeats(
  cinemaId: number,
  rowCount: number,
  seatsPerRow: number,
) {
  const seats = [];

  for (let row = 0; row < rowCount; row++) {
    const rowLabel = String.fromCharCode(65 + row);

    for (let seatNumber = 1; seatNumber <= seatsPerRow; seatNumber++) {
      seats.push({
        cinema_id: cinemaId,
        row_label: rowLabel,
        seat_number: seatNumber,
      });
    }
  }

  return seats;
}

// Test seat generation without inserting data
const largeCinemaSeats = generateSeats(1, 10, 8);
const smallCinemaSeats = generateSeats(2, 5, 8);

console.log("Large cinema seats:", largeCinemaSeats.length);
console.log("Small cinema seats:", smallCinemaSeats.length);
console.log("Total seats:", largeCinemaSeats.length + smallCinemaSeats.length);

// Find or create a cinema and return its ID
async function getOrCreateCinema(name: string): Promise<number> {
  const result = await pool.query(
    `INSERT INTO cinema (name)
     VALUES ($1)
     ON CONFLICT (name)
     DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name],
  );

  return result.rows[0].id;
}
// Insert seats without creating duplicates
async function insertSeats(cinemaId: number, rowCount: number) {
  const seats = generateSeats(cinemaId, rowCount, 8);

  for (const seat of seats) {
    await pool.query(
      `INSERT INTO seat (cinema_id, row_label, seat_number)
       VALUES ($1, $2, $3)
       ON CONFLICT (cinema_id, row_label, seat_number)
       DO NOTHING`,
      [seat.cinema_id, seat.row_label, seat.seat_number],
    );
  }
}

// Seed cinema halls and their seats
async function seedCinemasAndSeats() {
  const largeCinemaId = await getOrCreateCinema("Stora Salongen");
  await insertSeats(largeCinemaId, 10);

  const smallCinemaId = await getOrCreateCinema("Lilla Salongen");
  await insertSeats(smallCinemaId, 5);

  console.log("Cinema halls and seats seeded successfully.");
}

// Mock data for movies
const movies = [
  { title: "Stjärnornas Krig: Arvet", duration: 165, age_rating: "15" },
  { title: "Djupet", duration: 132, age_rating: "15" },
  { title: "Väktarnas Dal", duration: 118, age_rating: "11" },
  { title: "Sommaren Vi Försvann", duration: 104, age_rating: "Alla" },
  { title: "Järnhjärtat", duration: 128, age_rating: "15" },
  {
    title: "Lille Björnens Stora Äventyr",
    duration: 88,
    age_rating: "Alla",
  },
  { title: "Nattens Arkitekt", duration: 121, age_rating: "15" },
  { title: "Röd Sand", duration: 142, age_rating: "15" },
];

// Insert movies without creating duplicates
async function seedMovies() {
  for (const movie of movies) {
    const existingMovie = await pool.query(
      "SELECT id FROM movies WHERE title = $1",
      [movie.title],
    );

    if (existingMovie.rows.length === 0) {
      await pool.query(
        `INSERT INTO movies (title, duration, age_rating)
         VALUES ($1, $2, $3)`,
        [movie.title, movie.duration, movie.age_rating],
      );
    }
  }

  console.log("Movies seeded successfully.");
}

// Mock data for cinema kiosk menu
const menuItems = [
  {
    name: "Klassikern",
    description: "Mellanpopcorn & 50cl Läsk",
    category: "food",
    price: 79,
    is_combo: true,
  },
  {
    name: "Stora Biomyset",
    description: "Stor Popcorn & 2x Läsk + Godispåse",
    category: "food",
    price: 129,
    is_combo: true,
  },
  {
    name: "Kaffepaket",
    description: "Kaffe/Te & Nybakad Kaka",
    category: "food",
    price: 49,
    is_combo: true,
  },
];

// Insert or update cinema kiosk menu items
async function seedMenuItems() {
  for (const item of menuItems) {
    await pool.query(
      `INSERT INTO item
       (name, description, category, price, is_combo)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (name)
       DO UPDATE SET
         description = EXCLUDED.description,
         category = EXCLUDED.category,
         price = EXCLUDED.price,
         is_combo = EXCLUDED.is_combo`,
      [item.name, item.description, item.category, item.price, item.is_combo],
    );
  }

  console.log("Cinema kiosk menu items seeded successfully.");
}

async function seedScreenings() {
  const count = await pool.query('SELECT COUNT(*) FROM screening')
  if (Number(count.rows[0].count) > 0) return

  const movieIds = (await pool.query('SELECT id FROM movies ORDER BY id')).rows.map(r => r.id)
  const cinemaIds = (await pool.query('SELECT id FROM cinema ORDER BY id')).rows.map(r => r.id)

  let n = 0
  for (let day = 1; day <= 8; day++) {
    for (const cinemaId of cinemaIds) {
      for (const time of ['16:00', '19:00']) {
        await pool.query(
          `INSERT INTO screening (movie_id, cinema_id, starts_at)
           VALUES ($1, $2, (current_date + $3::int) + $4::time)`,
          [movieIds[n % movieIds.length], cinemaId, day, time])
        n++
      }
    }
  }
  console.log('Screenings seeded successfully');
}


// Run all seed functions
async function runSeed() {
  try {
    await seedCinemasAndSeats();
    await seedMovies();
    await seedMenuItems();
    await seedScreenings();

    console.log("All seed operations completed successfully.");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  }
}
// Start the seed process
runSeed()
  .catch((error) => {
    console.error("Seed process failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
