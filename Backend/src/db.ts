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

    client.release()
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