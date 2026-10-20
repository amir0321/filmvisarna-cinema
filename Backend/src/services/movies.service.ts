import { query } from "../utils/dbHelpers";
import { HttpError } from "../utils/httpErorr";

import { Movie, CreateMovieInput, UpdateMovieInput } from "../interfaces/types.js";
export type { Movie, CreateMovieInput, UpdateMovieInput };

const MOVIE_SELECT = `
  SELECT
    m.id,
    m.title,
    m.description,
    m.duration_minutes,
    m.age_rating,
    m.poster_url,
    m.landscape_image_url,
    m.trailer_url,
    COALESCE(m.director, (
      SELECT p.name
      FROM movie_person mp
      JOIN person p ON p.id = mp.person_id
      WHERE mp.movie_id = m.id AND mp.role = 'director'
      LIMIT 1
    )) AS director,
    m.imdb_rating::float AS imdb_rating,
    m.release_date,
    COALESCE(
      array_agg(g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL),
      '{}'
    ) AS genres
  FROM movie m
  LEFT JOIN movie_genre mg ON mg.movie_id = m.id
  LEFT JOIN genre g        ON g.id        = mg.genre_id
`;

export interface MovieFilters {
  genre?: string;
  search?: string;
  age?: number;
}

export async function getAllMovies(filters: MovieFilters = {}): Promise<Movie[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.genre) {
    params.push(filters.genre.trim());
    conditions.push(`EXISTS (
      SELECT 1 FROM movie_genre mg2
      JOIN genre g2 ON g2.id = mg2.genre_id
      WHERE mg2.movie_id = m.id AND lower(g2.name) = lower($${params.length})
    )`);
  }

  if (filters.search) {
    params.push(`%${filters.search.trim()}%`);
    const p = `$${params.length}`;
    conditions.push(`(
      m.title ILIKE ${p}
      OR m.description ILIKE ${p}
      OR m.director ILIKE ${p}
    )`);
  }

  if (filters.age !== undefined) {
    params.push(filters.age);
    conditions.push(`(CASE WHEN m.age_rating ~ '^[0-9]+$' THEN m.age_rating::int ELSE 0 END) <= $${params.length}::int`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return query<Movie>(`${MOVIE_SELECT} ${whereClause} GROUP BY m.id ORDER BY m.title`, params);
}

export async function getMovieById(id: number): Promise<Movie> {
  const rows = await query<Movie>(
    `${MOVIE_SELECT} WHERE m.id = $1 GROUP BY m.id`,
    [id],
  );
  if (!rows[0]) throw new HttpError(404, "Filmen hittades inte.");
  return rows[0];
}

export async function createMovie(input: CreateMovieInput): Promise<Movie> {
  const [newMovie] = await query<{ id: number }>(
    `INSERT INTO movie (
       title, description, duration_minutes, age_rating, poster_url,
       landscape_image_url, trailer_url, director, imdb_rating, release_date
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      input.title,
      input.description ?? null,
      input.duration_minutes,
      input.age_rating ?? null,
      input.poster_url ?? null,
      input.landscape_image_url ?? null,
      input.trailer_url ?? null,
      input.director ?? null,
      input.imdb_rating ?? null,
      input.release_date ?? null,
    ],
  );

  if (input.genres?.length) {
    for (const genreName of input.genres) {
      const [genre] = await query<{ id: number }>(
        `INSERT INTO genre (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [genreName.trim()],
      );
      await query(
        `INSERT INTO movie_genre (movie_id, genre_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [newMovie.id, genre.id],
      );
    }
  }

  return getMovieById(newMovie.id);
}

export async function updateMovie(
  id: number,
  input: UpdateMovieInput,
): Promise<Movie> {
  const existing = await getMovieById(id);

  const title = input.title ?? existing.title;
  const description =
    input.description !== undefined ? input.description : existing.description;
  const duration_minutes = input.duration_minutes ?? existing.duration_minutes;
  const age_rating =
    input.age_rating !== undefined ? input.age_rating : existing.age_rating;
  const poster_url =
    input.poster_url !== undefined ? input.poster_url : existing.poster_url;
  const landscape_image_url =
    input.landscape_image_url !== undefined
      ? input.landscape_image_url
      : existing.landscape_image_url;
  const trailer_url =
    input.trailer_url !== undefined ? input.trailer_url : existing.trailer_url;
  const director =
    input.director !== undefined ? input.director : existing.director;
  const imdb_rating =
    input.imdb_rating !== undefined ? input.imdb_rating : existing.imdb_rating;
  const release_date =
    input.release_date !== undefined ? input.release_date : existing.release_date;

  await query(
    `UPDATE movie
     SET title = $1, description = $2, duration_minutes = $3, age_rating = $4, poster_url = $5,
         landscape_image_url = $6, trailer_url = $7, director = $8, imdb_rating = $9, release_date = $10
     WHERE id = $11`,
    [
      title,
      description,
      duration_minutes,
      age_rating,
      poster_url,
      landscape_image_url,
      trailer_url,
      director,
      imdb_rating,
      release_date,
      id,
    ],
  );

  if (input.genres !== undefined) {
    await query("DELETE FROM movie_genre WHERE movie_id = $1", [id]);
    for (const genreName of input.genres) {
      const [genre] = await query<{ id: number }>(
        `INSERT INTO genre (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [genreName.trim()],
      );
      await query(
        `INSERT INTO movie_genre (movie_id, genre_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [id, genre.id],
      );
    }
  }

  return getMovieById(id);
}

export async function deleteMovie(id: number): Promise<void> {
  await getMovieById(id);

  const hasScreenings = await query(
    "SELECT 1 FROM screening WHERE movie_id = $1 LIMIT 1",
    [id],
  );
  if (hasScreenings.length > 0) {
    throw new HttpError(
      409,
      "Kan inte ta bort filmen eftersom den har schemalagda visningar.",
    );
  }

  await query("DELETE FROM movie WHERE id = $1", [id]);
}

