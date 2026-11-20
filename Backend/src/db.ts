import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const useSsl =
  process.env.DB_SSL === "true" ||
  (Boolean(process.env.DATABASE_URL) &&
    !process.env.DATABASE_URL?.includes("localhost") &&
    !process.env.DATABASE_URL?.includes("127.0.0.1"));

const rejectUnauthorized =
  process.env.DB_SSL_REJECT_UNAUTHORIZED !== undefined
    ? process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false"
    : process.env.NODE_ENV === "production";

const sslConfig = useSsl
  ? {
      rejectUnauthorized,
      ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : {}),
    }
  : undefined;

export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: sslConfig,
        connectionTimeoutMillis: 5000,
        keepAlive: true,
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgrespassword",
        database: process.env.DB_NAME || "filmvisarna",
        ssl: sslConfig,
        connectionTimeoutMillis: 5000,
        keepAlive: true,
      },
);

// pg emits errors for disconnected idle clients outside any request promise.
// Handle them so a transient database disconnect cannot crash the HTTP process.
pool.on('error', (error: Error & { code?: string }) => {
  console.error('[Database] Idle connection failed', { code: error.code ?? 'UNKNOWN' });
});

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
