import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const useSsl =
  process.env.DB_SSL === 'true' ||
  (Boolean(process.env.DATABASE_URL) &&
    !process.env.DATABASE_URL?.includes('localhost') &&
    !process.env.DATABASE_URL?.includes('127.0.0.1'))

export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    }
    : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgrespassword',
      database: process.env.DB_NAME || 'filmvisarna',
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    }
)

export async function initDb() {
  try {
    const client = await pool.connect()
    console.log('🐘 PostgreSQL connected successfully!')

    await client.query(`
      CREATE TABLE IF NOT EXISTS movies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        genre VARCHAR(100),
        duration INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    const checkCount = await client.query('SELECT COUNT(*) FROM movies')
    if (parseInt(checkCount.rows[0].count, 10) === 0) {
      console.log('Seeding initial movie data...')
      await client.query(`
        INSERT INTO movies (title, genre, duration) VALUES
        ('Inception', 'Sci-Fi / Action', 148),
        ('Interstellar', 'Sci-Fi / Adventure', 169),
        ('Dune: Part Two', 'Sci-Fi / Adventure', 166),
        ('The Dark Knight', 'Action / Crime', 152);
      `)
      console.log('Initial movies seeded!')
    }
    await client.query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS age_rating VARCHAR(10)`)
         // --- Booking tables (for POST /api/bookings) ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS cinema (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      );
      CREATE TABLE IF NOT EXISTS seat (
        id SERIAL PRIMARY KEY,
        cinema_id INTEGER NOT NULL REFERENCES cinema(id),
        row_label VARCHAR(2) NOT NULL,
        seat_number INTEGER NOT NULL,
        UNIQUE (cinema_id, row_label, seat_number)
      );
      CREATE TABLE IF NOT EXISTS screening (
        id SERIAL PRIMARY KEY,
        movie_id INTEGER NOT NULL REFERENCES movies(id),
        cinema_id INTEGER NOT NULL REFERENCES cinema(id),
        starts_at TIMESTAMPTZ NOT NULL
      );
      CREATE TABLE IF NOT EXISTS price_group (
        id SERIAL PRIMARY KEY,
        name VARCHAR(20) NOT NULL,
        price INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS item (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        category VARCHAR(50),
        price INTEGER NOT NULL,
        is_combo BOOLEAN NOT NULL DEFAULT false,
        is_available BOOLEAN NOT NULL DEFAULT true
      );
      CREATE TABLE IF NOT EXISTS booking (
        id SERIAL PRIMARY KEY,
        screening_id INTEGER NOT NULL REFERENCES screening(id),
        user_id INTEGER,
        booking_ref VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
          CHECK (status IN ('confirmed', 'cancelled')),
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS ticket (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES booking(id),
        screening_id INTEGER NOT NULL REFERENCES screening(id),
        seat_id INTEGER NOT NULL REFERENCES seat(id),
        price_group_id INTEGER NOT NULL REFERENCES price_group(id),
        price_paid INTEGER NOT NULL,
        cancelled_at TIMESTAMPTZ
      );
      CREATE UNIQUE INDEX IF NOT EXISTS ticket_one_active_seat
        ON ticket (screening_id, seat_id) WHERE cancelled_at IS NULL;

      CREATE TABLE IF NOT EXISTS booking_item (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES booking(id),
        item_id INTEGER NOT NULL REFERENCES item(id),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price_paid INTEGER NOT NULL
      );
    `)

    // Ticket prices from the brief: child 80, adult 140, senior 120
    const priceCount = await client.query('SELECT COUNT(*) FROM price_group')
    if (parseInt(priceCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO price_group (name, price) VALUES
        ('child', 80), ('adult', 140), ('elder', 120);
      `)
    }

    client.release()
    //client.release()
  } catch (error) {
    console.error('Failed to connect to PostgreSQL database:', error)
    console.warn(
      'Tip: Check your .env file or make sure your database is running.\n' +
      '   If using Docker, run: docker compose up -d'
    )
    throw error
  }
}

export default pool