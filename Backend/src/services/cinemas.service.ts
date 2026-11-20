import { pool } from "../db.js";
import { query, withTransaction, type Queryable } from "../utils/dbHelpers.js";
import { HttpError } from "../utils/httpErorr.js";

import {
  SeatInfo,
  CinemaOverview,
  CinemaDetail,
  CreateCinemaInput,
  UpdateCinemaInput,
} from "../interfaces/types.js";
export type {
  SeatInfo,
  CinemaOverview,
  CinemaDetail,
  CreateCinemaInput,
  UpdateCinemaInput,
};

export async function getAllCinemas(includeSeats = false): Promise<CinemaOverview[]> {
  if (!includeSeats) return query<CinemaOverview>(
    'SELECT *, seats_per_row AS "seatsPerRow" FROM cinema_overview ORDER BY id');
  return query<CinemaDetail>(`${CINEMA_DETAIL_SELECT} GROUP BY c.id ORDER BY c.id`);
}

const CINEMA_DETAIL_SELECT = `SELECT c.id,c.name,c.format,c.tech,c.screen_size,c.opened_year,
  count(s.id)::int AS total_seats,
  COALESCE((SELECT array_agg(row_count ORDER BY row_label) FROM
    (SELECT row_label,count(*)::int AS row_count FROM seat WHERE cinema_id=c.id GROUP BY row_label) layout), '{}') AS "seatsPerRow",
  COALESCE(json_agg(json_build_object('id',s.id,'row',s.row_label,'number',s.seat_number,
    'seatType',s.seat_type,'isWheelchair',s.seat_type='wheelchair')
    ORDER BY s.row_label,s.seat_number) FILTER (WHERE s.id IS NOT NULL),'[]') AS seats
  FROM cinema c LEFT JOIN seat s ON s.cinema_id=c.id`;

function layout(rows: number | undefined, seatsPerRow: number | number[]): number[] {
  const counts = Array.isArray(seatsPerRow) ? seatsPerRow : Array.from({ length: rows ?? 0 }, () => seatsPerRow);
  if (!counts.length || (rows !== undefined && rows !== counts.length)) {
    throw new HttpError(400, 'Antalet rader måste motsvara seatsPerRow.');
  }
  return counts;
}
const INSERT_SEATS = `INSERT INTO seat (cinema_id,row_label,seat_number,seat_type)
  SELECT $1,chr(64+r::int),n,CASE WHEN r=1 AND n<=2 THEN 'wheelchair' ELSE 'regular' END
  FROM unnest($2::int[]) WITH ORDINALITY AS row_sizes(count,r)
  CROSS JOIN LATERAL generate_series(1,count) n`;

export async function getCinemaById(id: number, db: Queryable = pool): Promise<CinemaDetail> {
  const { rows } = await db.query<CinemaDetail>(`${CINEMA_DETAIL_SELECT} WHERE c.id=$1 GROUP BY c.id`, [id]);
  if (!rows[0]) throw new HttpError(404, 'Salongen hittades inte.');
  return rows[0];
}

export async function createCinema(
  input: CreateCinemaInput,
): Promise<CinemaDetail> {
  const existing = await query("SELECT 1 FROM cinema WHERE lower(name) = lower($1)", [
    input.name.trim(),
  ]);
  if (existing.length > 0) {
    throw new HttpError(409, "En salong med det namnet finns redan.");
  }

  return withTransaction(async (client) => {
    const { rows: created } = await client.query<{ id: number; name: string }>(
      `INSERT INTO cinema (name, format, tech, screen_size, opened_year)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name`,
      [
        input.name.trim(),
        input.format ?? null,
        input.tech ?? null,
        input.screen_size ?? null,
        input.opened_year ?? null,
      ],
    );
    const cinemaId = created[0].id;

    await client.query(INSERT_SEATS, [cinemaId, layout(input.rows, input.seatsPerRow)]);
    return getCinemaById(cinemaId, client);
  });
}

export async function updateCinema(
  id: number,
  input: UpdateCinemaInput,
): Promise<CinemaDetail> {
  const existing = await getCinemaById(id);

  if (input.name && input.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
    const nameClash = await query(
      "SELECT 1 FROM cinema WHERE lower(name) = lower($1) AND id <> $2",
      [input.name.trim(), id],
    );
    if (nameClash.length > 0) {
      throw new HttpError(409, "En salong med det namnet finns redan.");
    }
  }

  const name = input.name !== undefined ? input.name.trim() : existing.name;
  const format = input.format !== undefined ? input.format : existing.format;
  const tech = input.tech !== undefined ? input.tech : existing.tech;
  const screen_size = input.screen_size !== undefined ? input.screen_size : existing.screen_size;
  const opened_year = input.opened_year !== undefined ? input.opened_year : existing.opened_year;

  return withTransaction(async (client) => {
    await client.query(
      `UPDATE cinema
       SET name = $1, format = $2, tech = $3, screen_size = $4, opened_year = $5
       WHERE id = $6`,
      [name, format, tech, screen_size, opened_year, id],
    );

    // Reconcile the row layout without recreating retained seats.
    if (input.seatsPerRow !== undefined) {
      // Preserve IDs and historical ticket references for seats retained in the new layout.
      await client.query('SELECT id FROM cinema WHERE id=$1 FOR UPDATE', [id]);
      const counts = layout(input.rows, input.seatsPerRow);
      const removed = await client.query(`SELECT s.id FROM seat s WHERE cinema_id=$1
        AND (ascii(row_label)-64 > cardinality($2::int[])
          OR seat_number > ($2::int[])[ascii(row_label)-64])
        AND EXISTS (SELECT 1 FROM ticket t WHERE t.seat_id=s.id)`, [id,counts]);
      if (removed.rowCount) throw new HttpError(409, 'Kan inte ta bort stolar med bokningshistorik.');
      await client.query(`DELETE FROM seat WHERE cinema_id=$1 AND
        (ascii(row_label)-64 > cardinality($2::int[]) OR seat_number > ($2::int[])[ascii(row_label)-64])`, [id,counts]);
      await client.query(INSERT_SEATS + ' ON CONFLICT (cinema_id,row_label,seat_number) DO NOTHING', [id,counts]);
    }

    // If specific wheelchairSeats are designated
    if (input.wheelchairSeats !== undefined) {
      await client.query("UPDATE seat SET seat_type = 'regular' WHERE cinema_id = $1", [id]);
      for (const ws of input.wheelchairSeats) {
        await client.query(
          "UPDATE seat SET seat_type = 'wheelchair' WHERE cinema_id = $1 AND row_label = $2 AND seat_number = $3",
          [id, ws.row, ws.number],
        );
      }
    }

    return getCinemaById(id, client);
  });
}

export async function deleteCinema(id: number): Promise<void> {
  await getCinemaById(id);

  const hasScreenings = await query(
    "SELECT 1 FROM screening WHERE cinema_id = $1 LIMIT 1",
    [id],
  );
  if (hasScreenings.length > 0) {
    throw new HttpError(
      409,
      "Kan inte ta bort salongen eftersom den har schemalagda visningar.",
    );
  }

  await query("DELETE FROM cinema WHERE id = $1", [id]);
}
