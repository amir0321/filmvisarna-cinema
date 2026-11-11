import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pool } from '../db.js';

async function migrate() {
  try {
    await pool.query(await readFile(resolve('sql/migrations/20261110_booking_protection.sql'), 'utf8'));
    console.log('Booking protection migration applied successfully.');
  } finally { await pool.end(); }
}
void migrate().catch(() => {
  console.error('Booking protection migration failed. Check database access and migration permissions.');
  process.exitCode = 1;
});
