import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const useSsl =
  process.env.DB_SSL === "true" ||
  (Boolean(process.env.DATABASE_URL) &&
    !process.env.DATABASE_URL?.includes("localhost") &&
    !process.env.DATABASE_URL?.includes("127.0.0.1"));

export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgrespassword",
        database: process.env.DB_NAME || "filmvisarna",
        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      },
);

export async function initDb() {
  try {
    const client = await pool.connect();
    console.log("🐘 PostgreSQL connected successfully!");
    client.release();
  } catch (error) {
    console.error("Failed to connect to PostgreSQL database:", error);
    console.warn(
      "Tip: Check your .env file or make sure your database is running.\n" +
        "   If using Docker, run: docker compose up -d",
    );
    throw error;
  }
}

export default pool;
