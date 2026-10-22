import { query } from "../utils/dbHelpers";
import { HttpError } from "../utils/httpErorr";

export interface Movie {
  id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  age_rating: string | null;
  poster_url: string | null;
  release_date: string | null;
  genres: string[];
}

export interface CreateMovieInput {
  title: string;
  description?: string;
  duration_minutes: number;
  age_rating?: string;
  poster_url?: string;
  release_date?: string;
  genres?: string[];
}

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
