import { query, withTransaction } from "../utils/dbHelpers.js";
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

export async function getAllCinemas(): Promise<CinemaOverview[]> {
  return query<CinemaOverview>(
    "SELECT id, name, total_seats FROM cinema_overview ORDER BY id ASC",
  );
}

export async function getCinemaById(id: number): Promise<CinemaDetail> {
  const rows = await query<CinemaDetail>(
    `SELECT c.id, c.name, COUNT(s.id)::int AS total_seats,
            COALESCE(
              json_agg(
                json_build_object('id', s.id, 'row', s.row_label, 'number', s.seat_number)
                ORDER BY s.row_label, s.seat_number
              ) FILTER (WHERE s.id IS NOT NULL),
              '[]'::json
            ) AS seats
     FROM cinema c
     LEFT JOIN seat s ON s.cinema_id = c.id
     WHERE c.id = $1
     GROUP BY c.id, c.name`,
    [id],
  );

  if (!rows[0]) {
    throw new HttpError(404, "Salongen hittades inte");
  }

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
      "INSERT INTO cinema (name) VALUES ($1) RETURNING id, name",
      [input.name.trim()],
    );
    const cinemaId = created[0].id;

    // Generate seats using PostgreSQL series
    await client.query(
      `INSERT INTO seat (cinema_id, row_label, seat_number)
       SELECT $1, chr(64 + r), n
       FROM generate_series(1, $2::int) r, generate_series(1, $3::int) n`,
      [cinemaId, input.rows, input.seatsPerRow],
    );

    const detail = await client.query<CinemaDetail>(
      `SELECT c.id, c.name, COUNT(s.id)::int AS total_seats,
              COALESCE(
                json_agg(
                  json_build_object('id', s.id, 'row', s.row_label, 'number', s.seat_number)
                  ORDER BY s.row_label, s.seat_number
                ) FILTER (WHERE s.id IS NOT NULL),
                '[]'::json
              ) AS seats
       FROM cinema c
       LEFT JOIN seat s ON s.cinema_id = c.id
       WHERE c.id = $1
       GROUP BY c.id, c.name`,
      [cinemaId],
    );

    return detail.rows[0];
  });
}

export async function updateCinema(
  id: number,
  input: UpdateCinemaInput,
): Promise<CinemaDetail> {
  await getCinemaById(id);

  const existing = await query(
    "SELECT 1 FROM cinema WHERE lower(name) = lower($1) AND id <> $2",
    [input.name.trim(), id],
  );
  if (existing.length > 0) {
    throw new HttpError(409, "En salong med det namnet finns redan.");
  }

  await query("UPDATE cinema SET name = $1 WHERE id = $2", [
    input.name.trim(),
    id,
  ]);

  return getCinemaById(id);
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
