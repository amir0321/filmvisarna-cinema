import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pool } from '../db.js';
async function migrate() {
  try {
    await pool.query(await readFile(resolve('sql/migrations/20261120_movie_metadata.sql'), 'utf8'));
    console.log('Movie metadata and cinema layout migration applied.');
  } finally { await pool.end(); }
}
void migrate().catch(() => {
  console.error('Metadata migration failed. Check database access and migration permissions.');
  process.exitCode = 1;
});
