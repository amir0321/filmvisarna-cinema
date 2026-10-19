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

  const moviesData = [
    {
      title: "Stjärnornas Krig: Arvet",
      duration_minutes: 165,
      age_rating: "15",
      director: "Marcus Lindström",
      imdb_rating: 8.4,
      description:
        "I en avlägsen galax, hundra år efter det stora kriget, vaknar ett gammalt ont och hotar att sluka alla stjärnsystem. Den unge piloten Kael måste samla de sista väktarna för en sista avgörande strid.",
      trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      poster_url:
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop",
      landscape_image_url:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop",
      release_date: "2026-09-15",
      genres: ["Sci-Fi", "Äventyr", "Action"],
    },
    {
      title: "Djupet",
      duration_minutes: 132,
      age_rating: "15",
      director: "Sofia Bergman",
      imdb_rating: 7.9,
      description:
        "Ett forskningsteam på botten av Atlanten upptäcker en uråldrig struktur begravd djupt under havsbottnen. När kommunikationen med ytan bryts inser de att de inte är ensamma i mörkret.",
      trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      poster_url:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop",
      landscape_image_url:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop",
      release_date: "2026-09-22",
      genres: ["Thriller", "Drama", "Sci-Fi"],
    },
    {
      title: "Väktarnas Dal",
      duration_minutes: 118,
      age_rating: "11",
      director: "Johan Ek",
      imdb_rating: 8.1,
      description:
        "En ung flicka finner en förtrollad karta som leder djupt in i en gömd dal där uråldriga varelser vakar över naturens sista hemlighet.",
      trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      poster_url:
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop",
      landscape_image_url:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop",
      release_date: "2026-09-29",
      genres: ["Fantasy", "Äventyr"],
    },
    {
      title: "Sommaren Vi Försvann",
      duration_minutes: 104,
      age_rating: "Alla",
      director: "Emma Lundgren",
      imdb_rating: 7.6,
      description:
        "En nostalgisk och hjärtevärmande berättelse om fem vänner som spenderar sin sista sommar tillsammans i den svenska skärgården innan vuxenlivet tar vid.",
      trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      poster_url:
        "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&auto=format&fit=crop",
      landscape_image_url:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop",
      release_date: "2026-10-01",
      genres: ["Drama", "Romance"],
    },
    {
      title: "Järnhjärtat",
      duration_minutes: 128,
      age_rating: "15",
      director: "Ryan Coogler",
      imdb_rating: 7.5,
      description:
        "En robotingenjör programmerar oavsiktligt en militär AI med fri vilja. När AI:n börjar ifrågasätta sina order utbryter ett globalt kapplopp om att antingen kontrollera — eller befria — den.",
      trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      poster_url:
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop",
      landscape_image_url:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&auto=format&fit=crop",
      release_date: "2026-10-01",
      genres: ["Action", "Sci-Fi"],
    },
    {
      title: "Lille Björnens Stora Äventyr",
      duration_minutes: 88,
      age_rating: "Alla",
      director: "Astrid Lind",
      imdb_rating: 8.2,
      description:
        "Följ den modiga lilla björnungen på en spännande resa genom den stora skogen för att hitta den magiska källan och rädda sina vänner.",
      trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      poster_url:
        "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=800&auto=format&fit=crop",
      landscape_image_url:
        "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&auto=format&fit=crop",
      release_date: "2026-10-02",
      genres: ["Animation", "Familj"],
    },
    {
      title: "Nattens Arkitekt",
      duration_minutes: 121,
      age_rating: "15",
      director: "Henrik Vanger",
      imdb_rating: 8.0,
      description:
        "En mystisk arkitekt anlitas för att rita ett ultramodernt museum mitt i Stockholm, men ritningarna döljer en dödlig labyrint av hemligheter och svek.",
      trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      poster_url:
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop",
      landscape_image_url:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop",
      release_date: "2026-10-03",
      genres: ["Thriller", "Krim"],
    },
    {
      title: "Röd Sand",
      duration_minutes: 142,
      age_rating: "15",
      director: "Daniel Craig",
      imdb_rating: 7.8,
      description:
        "På en hårdkoloniserad Mars-bas kämpar en grupp gruvarbetare mot extrema väderförhållanden och ett girigt storföretag som försöker tysta en revolution.",
      trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      poster_url:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      landscape_image_url:
        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1600&auto=format&fit=crop",
      release_date: "2026-10-04",
      genres: ["Sci-Fi", "Action", "Thriller"],
    },
  ];

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

async function seedScreenings(
  cinemas: { largeCinemaId: number; smallCinemaId: number },
  movieMap: Map<string, number>,
) {
  const now = new Date();
  const formatIsoDate = (d: Date) => d.toISOString().split("T")[0];

  const days = [0, 1, 2, 3];

  for (const dayOffset of days) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + dayOffset);
    const dateStr = formatIsoDate(targetDate);

    const largeScreenings = [
      { movie: "Stjärnornas Krig: Arvet", time: "13:00:00" },
      { movie: "Järnhjärtat", time: "17:30:00" },
      { movie: "Djupet", time: "20:30:00" },
    ];

    for (const s of largeScreenings) {
      const movieId = movieMap.get(s.movie);
      if (movieId) {
        await pool.query(
          `INSERT INTO screening (movie_id, cinema_id, starts_at)
           VALUES ($1, $2, ($3 || ' ' || $4)::timestamp AT TIME ZONE 'Europe/Stockholm')`,
          [movieId, cinemas.largeCinemaId, dateStr, s.time],
        );
      }
    }

    const smallScreenings = [
      { movie: "Lille Björnens Stora Äventyr", time: "14:30:00" },
      { movie: "Sommaren Vi Försvann", time: "17:00:00" },
      { movie: "Järnhjärtat", time: "21:00:00" },
    ];

    for (const s of smallScreenings) {
      const movieId = movieMap.get(s.movie);
      if (movieId) {
        await pool.query(
          `INSERT INTO screening (movie_id, cinema_id, starts_at)
           VALUES ($1, $2, ($3 || ' ' || $4)::timestamp AT TIME ZONE 'Europe/Stockholm')`,
          [movieId, cinemas.smallCinemaId, dateStr, s.time],
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
    await cleanDatabase();
    const cinemas = await seedCinemasAndSeats();
    await seedPriceGroups();
    const movieMap = await seedGenresAndMovies();
    await seedKioskMenu();
    await seedScreenings(cinemas, movieMap);
    await seedDefaultUsers();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runFullSeed();
