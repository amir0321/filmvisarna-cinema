import { pool } from '../db.js';
import { localizeImage } from '../services/localMedia.service.js';

export async function localizeMedia(dryRun = false) {
  const fields = [
    { table: 'movie', column: 'poster_url', width: 600 },
    { table: 'movie', column: 'landscape_image_url', width: 1600 },
    { table: 'person', column: 'photo_url', width: 400 },
    { table: 'menu_item', column: 'image_url', width: 600 },
  ] as const;
  let updated = 0;
  let failed = 0;
  for (const { table, column, width } of fields) {
    // Identifiers above are fixed in source, never supplied by users.
    const { rows } = await pool.query<{ id: number; source: string }>(
      `SELECT id, ${column} AS source FROM ${table} WHERE ${column} ~* '^https?://' ORDER BY id`,
    );
    console.log(`${table}.${column}: ${rows.length} externa bilder${dryRun ? ' (förhandskontroll)' : ''}`);
    if (dryRun) continue;
    for (const row of rows) {
      try {
        const local = await localizeImage(row.source, width);
        const result = await pool.query(
          `UPDATE ${table} SET ${column}=$1 WHERE id=$2 AND ${column}=$3`, [local, row.id, row.source],
        );
        updated += result.rowCount ?? 0;
      } catch {
        failed++;
        console.error(`Kunde inte flytta ${table}.${column}, id=${row.id}. Originaladressen behålls. Kontrollera källan eller ladda upp bilden manuellt.`);
      }
    }
  }
  return { updated, failed };
}

if (require.main === module) {
  localizeMedia(process.argv.includes('--dry-run'))
    .then(({ updated, failed }) => {
      console.log(`${updated} bilder flyttade, ${failed} misslyckade.`);
      if (failed) process.exitCode = 1;
    })
    .catch(() => { console.error('Bildflytt misslyckades. Kontrollera databasen och migreringarna.'); process.exitCode = 1; })
    .finally(() => pool.end());
}
