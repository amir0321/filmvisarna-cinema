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
    m.release_date,
    COALESCE(
      array_agg(g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL),
      '{}'
    ) AS genres
  FROM movie m
  LEFT JOIN movie_genre mg ON mg.movie_id = m.id
  LEFT JOIN genre g        ON g.id        = mg.genre_id
`;

export async function getAllMovies(): Promise<Movie[]> {
  return query<Movie>(`${MOVIE_SELECT} GROUP BY m.id ORDER BY m.title`);
}

export async function getMovieById(id: number): Promise<Movie> {
  const rows = await query<Movie>(
    `${MOVIE_SELECT} WHERE m.id = $1 GROUP BY m.id`,
    [id],
  );
  if (!rows[0]) throw new HttpError(404, "Filmen hittades inte");
  return rows[0];
}

export async function createMovie(input: CreateMovieInput): Promise<Movie> {
  const [newMovie] = await query<{ id: number }>(
    `INSERT INTO movie (title, description, duration_minutes, age_rating, poster_url, release_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      input.title,
      input.description ?? null,
      input.duration_minutes,
      input.age_rating ?? null,
      input.poster_url ?? null,
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
  const release_date =
    input.release_date !== undefined ? input.release_date : existing.release_date;

  await query(
    `UPDATE movie
     SET title = $1, description = $2, duration_minutes = $3, age_rating = $4, poster_url = $5, release_date = $6
     WHERE id = $7`,
    [title, description, duration_minutes, age_rating, poster_url, release_date, id],
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

