import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pool } from '../db.js';

async function migrate() {
  try {
    for (const name of ['20261102_auth_actions.sql', '20261111_auth_sessions.sql']) {
      await pool.query(await readFile(resolve(process.cwd(), 'sql/migrations', name), 'utf8'));
    }
    console.log('Auth migration applied successfully.');
  } finally { await pool.end(); }
}

void migrate().catch(() => {
  console.error('Auth migration failed. Check database access and migration permissions.');
  process.exitCode = 1;
});
