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
    "SELECT id, name, total_seats, format, tech, screen_size, opened_year FROM cinema_overview ORDER BY id ASC",
  );
}

export async function getCinemaById(id: number): Promise<CinemaDetail> {
  const rows = await query<CinemaDetail>(
    `SELECT c.id, c.name, c.format, c.tech, c.screen_size, c.opened_year,
            COUNT(s.id)::int AS total_seats,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', s.id,
                  'row', s.row_label,
                  'number', s.seat_number,
                  'seatType', s.seat_type,
                  'isWheelchair', (s.seat_type = 'wheelchair')
                )
                ORDER BY s.row_label, s.seat_number
              ) FILTER (WHERE s.id IS NOT NULL),
              '[]'::json
            ) AS seats
     FROM cinema c
     LEFT JOIN seat s ON s.cinema_id = c.id
     WHERE c.id = $1
     GROUP BY c.id, c.name, c.format, c.tech, c.screen_size, c.opened_year`,
    [id],
  );

  if (!rows[0]) {
    throw new HttpError(404, "Salongen hittades inte.");
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

    // Generate seats using PostgreSQL series
    await client.query(
      `INSERT INTO seat (cinema_id, row_label, seat_number, seat_type)
       SELECT $1, chr(64 + r), n,
              CASE WHEN r = 1 AND n <= 2 THEN 'wheelchair' ELSE 'regular' END
       FROM generate_series(1, $2::int) r, generate_series(1, $3::int) n`,
      [cinemaId, input.rows, input.seatsPerRow],
    );

    return getCinemaById(cinemaId);
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

    // If rows and seatsPerRow are given, re-generate grid if no active bookings exist
    if (input.rows !== undefined && input.seatsPerRow !== undefined) {
      const activeBookings = await client.query(
        `SELECT 1 FROM booking b
         JOIN screening s ON s.id = b.screening_id
         WHERE s.cinema_id = $1 AND b.status = 'confirmed'
         LIMIT 1`,
        [id],
      );
      if (activeBookings.rowCount && activeBookings.rowCount > 0) {
        throw new HttpError(409, "Kan inte ändra rader/stolar eftersom det finns aktiva bokningar i salongen.");
      }

      await client.query("DELETE FROM seat WHERE cinema_id = $1", [id]);
      await client.query(
        `INSERT INTO seat (cinema_id, row_label, seat_number, seat_type)
         SELECT $1, chr(64 + r), n,
                CASE WHEN r = 1 AND n <= 2 THEN 'wheelchair' ELSE 'regular' END
         FROM generate_series(1, $2::int) r, generate_series(1, $3::int) n`,
        [id, input.rows, input.seatsPerRow],
      );
    }

    // If specific wheelchairSeats are designated
    if (input.wheelchairSeats && input.wheelchairSeats.length > 0) {
      await client.query("UPDATE seat SET seat_type = 'regular' WHERE cinema_id = $1", [id]);
      for (const ws of input.wheelchairSeats) {
        await client.query(
          "UPDATE seat SET seat_type = 'wheelchair' WHERE cinema_id = $1 AND row_label = $2 AND seat_number = $3",
          [id, ws.row, ws.number],
        );
      }
    }

    return getCinemaById(id);
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
