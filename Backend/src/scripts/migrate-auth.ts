import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pool } from '../db.js';

async function migrate() {
  try {
    const sql = await readFile(resolve(process.cwd(), 'sql/migrations/20261102_auth_actions.sql'), 'utf8');
    await pool.query(sql);
    console.log('Auth migration applied successfully.');
  } finally { await pool.end(); }
}

void migrate().catch(() => {
  console.error('Auth migration failed. Check database access and migration permissions.');
  process.exitCode = 1;
});
