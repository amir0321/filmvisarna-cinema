import { getSeedMovies } from "./seeds/movieData.js";
import { seedDemoData } from "./seeds/demo.js";
import { pool } from "./db.js";
import bcrypt from "bcryptjs";

async function cleanDatabase() {
  await pool.query(`
    TRUNCATE TABLE
      booking_item,
      ticket,
      booking,
      screening,
      seat,
      combo_item,
      menu_item,
      movie_person,
      person,
      movie_genre,
      movie,
      genre,
      price_group,
      cinema
    RESTART IDENTITY CASCADE;
  `);
}

async function seedCinemasAndSeats() {
  const resLarge = await pool.query<{ id: number }>(`
    INSERT INTO cinema (name, format, tech, screen_size, opened_year)
    VALUES ('Stora Salongen', '4K Dolby Atmos', 'Laser 4K, Dolby Atmos 7.1, Induktionsslinga', '18×8 m', 1987)
    RETURNING id;
  `);
  const largeCinemaId = resLarge.rows[0].id;

  for (let r = 0; r < 8; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    for (let s = 1; s <= 10; s++) {
      await pool.query(
        `INSERT INTO seat (cinema_id, row_label, seat_number) VALUES ($1, $2, $3)`,
        [largeCinemaId, rowLabel, s],
      );
    }
  }

  const resSmall = await pool.query<{ id: number }>(`
    INSERT INTO cinema (name, format, tech, screen_size, opened_year)
    VALUES ('Lilla Salongen', '2D Intimt', '2K Digital, Dolby 5.1, Rullstolsanpassad', '10×4,5 m', 2019)
    RETURNING id;
  `);
  const smallCinemaId = resSmall.rows[0].id;

  for (let r = 0; r < 5; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    for (let s = 1; s <= 8; s++) {
      await pool.query(
        `INSERT INTO seat (cinema_id, row_label, seat_number) VALUES ($1, $2, $3)`,
        [smallCinemaId, rowLabel, s],
      );
    }
  }

  return { largeCinemaId, smallCinemaId };
}

async function seedPriceGroups() {
  await pool.query(`
    INSERT INTO price_group (name, price) VALUES
      ('child', 80.00),
      ('adult', 140.00),
      ('elder', 120.00);
  `);
}

async function seedGenresAndMovies() {
  const genreNames = [
    "Action",
    "Sci-Fi",
    "Äventyr",
    "Drama",
    "Thriller",
    "Fantasy",
    "Romance",
    "Animation",
    "Familj",
    "Krim",
  ];

  const genreMap = new Map<string, number>();
  for (const name of genreNames) {
    const res = await pool.query<{ id: number }>(
      `INSERT INTO genre (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [name],
    );
    genreMap.set(name, res.rows[0].id);
  }

  const moviesData = getSeedMovies();

  const personMap = new Map<string, number>();
  async function getOrCreatePerson(name: string): Promise<number> {
    let id = personMap.get(name);
    if (!id) {
      const res = await pool.query<{ id: number }>(
        `INSERT INTO person (name) VALUES ($1) RETURNING id`,
        [name],
      );
      id = res.rows[0].id;
      personMap.set(name, id);
    }
    return id;
  }

  const movieMap = new Map<string, number>();
  for (const m of moviesData) {
    const res = await pool.query<{ id: number }>(
      `INSERT INTO movie (title, duration_minutes, age_rating, director, imdb_rating, description, trailer_url, poster_url, landscape_image_url, release_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        m.title,
        m.duration_minutes,
        m.age_rating,
        m.director,
        m.imdb_rating,
        m.description,
        m.trailer_url,
        m.poster_url,
        m.landscape_image_url,
        m.release_date,
      ],
    );
    const movieId = res.rows[0].id;
    movieMap.set(m.title, movieId);

    for (const g of m.genres) {
      const genreId = genreMap.get(g);
      if (genreId) {
        await pool.query(
          `INSERT INTO movie_genre (movie_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [movieId, genreId],
        );
      }
    }

    const directorId = await getOrCreatePerson(m.director);
    await pool.query(
      `INSERT INTO movie_person (movie_id, person_id, role) VALUES ($1, $2, 'director') ON CONFLICT DO NOTHING`,
      [movieId, directorId],
    );

    for (const actor of m.actors) {
      const actorId = await getOrCreatePerson(actor);
      await pool.query(
        `INSERT INTO movie_person (movie_id, person_id, role) VALUES ($1, $2, 'actor') ON CONFLICT DO NOTHING`,
        [movieId, actorId],
      );
    }
  }

  return movieMap;
}

async function seedKioskMenu() {
  const baseItems = [
    { name: "Mellanpopcorn", desc: "Varma nypoppade mellanpopcorn", cat: "food", price: 45, avail: true },
    { name: "Stor Popcorn", desc: "Nypoppade stora popcorn", cat: "food", price: 55, avail: true },
    { name: "Liten Popcorn", desc: "Perfekt portion för barn", cat: "food", price: 35, avail: true },
    { name: "Cola 50cl", desc: "Iskall Coca-Cola 50cl", cat: "drink", price: 35, avail: true },
    { name: "Fanta 50cl", desc: "Iskall Fanta Orange 50cl", cat: "drink", price: 35, avail: true },
    { name: "Vatten 50cl", desc: "Stilla källvatten 50cl", cat: "drink", price: 25, avail: false },
    { name: "Godispåse", desc: "Blandat biogodis 150g", cat: "food", price: 40, avail: true },
    { name: "Kaffe / Te", desc: "Nybryggt kaffe eller ekologiskt te", cat: "drink", price: 30, avail: true },
    { name: "Nybakad Kaka", desc: "Chokladkaka eller kanelbulle", cat: "food", price: 25, avail: true },
  ];

  const itemMap = new Map<string, number>();
  for (const item of baseItems) {
    const res = await pool.query<{ id: number }>(
      `INSERT INTO menu_item (name, description, category, price, is_combo, is_available)
       VALUES ($1, $2, $3, $4, false, $5)
       RETURNING id`,
      [item.name, item.desc, item.cat, item.price, item.avail],
    );
    itemMap.set(item.name, res.rows[0].id);
  }

  const combos = [
    {
      name: "Klassikern",
      desc: "Mellanpopcorn & 50cl Läsk",
      cat: "food",
      price: 79,
      parts: [
        { name: "Mellanpopcorn", qty: 1 },
        { name: "Cola 50cl", qty: 1 },
      ],
    },
    {
      name: "Stora Biomyset",
      desc: "Stor Popcorn & 2× Läsk + Godispåse",
      cat: "food",
      price: 129,
      parts: [
        { name: "Stor Popcorn", qty: 1 },
        { name: "Cola 50cl", qty: 2 },
        { name: "Godispåse", qty: 1 },
      ],
    },
    {
      name: "Kaffepaket",
      desc: "Kaffe/Te & Nybakad Kaka",
      cat: "food",
      price: 49,
      parts: [
        { name: "Kaffe / Te", qty: 1 },
        { name: "Nybakad Kaka", qty: 1 },
      ],
    },
  ];

  for (const combo of combos) {
    const res = await pool.query<{ id: number }>(
      `INSERT INTO menu_item (name, description, category, price, is_combo, is_available)
       VALUES ($1, $2, $3, $4, true, true)
       RETURNING id`,
      [combo.name, combo.desc, combo.cat, combo.price],
    );
    const comboId = res.rows[0].id;

    for (const part of combo.parts) {
      const partId = itemMap.get(part.name);
      if (partId) {
        await pool.query(
          `INSERT INTO combo_item (combo_id, item_id, quantity) VALUES ($1, $2, $3)`,
          [comboId, partId, part.qty],
        );
      }
    }
  }
}

async function seedDefaultUsers() {
  const defaultPassword = process.env.SEED_USER_PASSWORD || "Password123!";
  const hash = await bcrypt.hash(defaultPassword, 12);

  const users = [
    {
      email: "admin@filmvisarna.se",
      firstName: "Ameer",
      lastName: "Admin",
      role: "admin",
    },
    {
      email: "medlem@filmvisarna.se",
      firstName: "Anna",
      lastName: "Medlemsson",
      role: "user",
    },
    {
      email: "testuser1@example.com",
      firstName: "Test",
      lastName: "User",
      role: "user",
    },
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO app_user (email, password_hash, first_name, last_name, role)
       VALUES (lower($1), $2, $3, $4, $5)
       ON CONFLICT (email)
       DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         role = EXCLUDED.role`,
      [u.email, hash, u.firstName, u.lastName, u.role],
    );
  }
}

async function runFullSeed() {
  try {
    if (process.env.NODE_ENV === 'production') throw new Error('Demo seeding is disabled in production');
    if (process.argv.includes("--demo")) {
      await seedDemoData();
      return;
    }
    await cleanDatabase();
    await seedCinemasAndSeats();
    await seedPriceGroups();
    await seedGenresAndMovies();
    await seedKioskMenu();
    await seedDefaultUsers();
    await seedDemoData();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runFullSeed();
