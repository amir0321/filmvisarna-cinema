import { z } from "zod";
import { config } from "../config.js";
import { query } from "../utils/dbHelpers.js";
import { HttpError } from "../utils/httpErorr.js";

// All external text is returned as plain text. Remove script bodies as well as tags.
function sanitize(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?(?:<\/script\s*>|$)/gi, "")
    .replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim();
}

const text = (max: number) => z.string().max(100000).transform(value => sanitize(value).slice(0, max));
const optionalText = (max: number) => text(max).nullish().transform(value => value ?? "");
const idSchema = z.number().int().positive().max(2147483647);
const imagePath = z.string().max(2048).nullish();
const dateSchema = z.union([z.iso.date(), z.literal("")]).nullish().transform(value => value || null);
const movieSummarySchema = z.object({
  id: idSchema,
  title: text(300).pipe(z.string().min(1)),
  original_title: text(300),
  overview: optionalText(2000),
  release_date: dateSchema,
  poster_path: imagePath,
});
const searchSchema = z.object({ results: z.array(movieSummarySchema).max(100) });
const castSchema = z.object({
  id: idSchema,
  name: text(200).pipe(z.string().min(1)),
  character: optionalText(300),
  profile_path: imagePath,
  order: z.number().int().min(0).max(2147483647),
});
const movieDetailsSchema = movieSummarySchema.extend({
  runtime: z.number().int().min(0).max(1440).nullish(),
  vote_average: z.number().min(0).max(10).nullish(),
  backdrop_path: imagePath,
  genres: z.array(z.object({ name: text(100).pipe(z.string().min(1)) })).max(100),
  credits: z.object({
    cast: z.array(castSchema).max(1000),
    crew: z.array(z.object({ name: text(200), job: text(100) })).max(1000),
  }),
  videos: z.object({ results: z.array(z.object({
    key: z.string().max(200), site: text(50), type: text(50),
    official: z.boolean().optional().default(false),
    iso_639_1: z.string().max(10).optional(),
  })).max(1000) }),
  release_dates: z.object({ results: z.array(z.object({
    iso_3166_1: z.string().regex(/^[A-Z]{2}$/),
    release_dates: z.array(z.object({
      certification: optionalText(10), type: z.number().int().min(1).max(6),
    })).max(100),
  })).max(300) }),
});
const personSchema = z.object({
  id: idSchema,
  biography: optionalText(10000),
  translations: z.object({ translations: z.array(z.object({
    iso_639_1: z.string().max(10),
    data: z.object({ biography: optionalText(10000) }),
  })).max(300) }),
});

function upstreamError(): HttpError {
  return new HttpError(502, "Kunde inte hämta filmdata från externt API.");
}

async function tmdbRequest<T>(path: string, schema: z.ZodType<T>, params: Record<string, string> = {}): Promise<T> {
  if (!config.tmdbApiKey) {
    throw new HttpError(503, "Extern filmsökning är inte konfigurerad på servern.");
  }
  try {
    const url = new URL(`${config.tmdbApiBaseUrl.replace(/\/$/, "")}${path}`);
    url.search = new URLSearchParams({ ...params, api_key: config.tmdbApiKey }).toString();
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000), redirect: "error", headers: { Accept: "application/json" },
    });
    if (response.status === 429) {
      throw new HttpError(429, "För många anrop mot film-API:et. Vänta en stund och försök igen.");
    }
    if (!response.ok) throw upstreamError();
    return schema.parse(await response.json());
  } catch (error) {
    // Never expose or log the upstream URL, response body, Zod issues or fetch error:
    // any of these may contain the API key or other untrusted external content.
    if (error instanceof HttpError) throw error;
    throw upstreamError();
  }
}

function tmdbImage(path: string | null | undefined, size: "w185" | "w500" | "w1280"): string | null {
  return path && /^\/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$/i.test(path)
    ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export async function searchTmdbMovies(search: string) {
  const result = await tmdbRequest("/search/movie", searchSchema, {
    query: search, language: "sv-SE", include_adult: "false", page: "1",
  });
  return result.results.slice(0, 8).map(movie => ({
    tmdbId: movie.id, title: movie.title, originalTitle: movie.original_title,
    releaseYear: movie.release_date ? Number(movie.release_date.slice(0, 4)) : null,
    posterUrl: tmdbImage(movie.poster_path, "w500"), overview: movie.overview,
  }));
}

async function getPersonBio(personId: number): Promise<string | null> {
  const person = await tmdbRequest(`/person/${personId}`, personSchema, { append_to_response: "translations" });
  if (person.id !== personId) throw upstreamError();
  const translations = person.translations.translations;
  return translations.find(item => item.iso_639_1 === "sv" && item.data.biography)?.data.biography
    || translations.find(item => item.iso_639_1 === "en" && item.data.biography)?.data.biography
    || person.biography || null;
}

export async function getTmdbMovieDetails(tmdbId: number) {
  const params = {
    language: "sv-SE", append_to_response: "credits,videos,release_dates", include_video_language: "sv,en,null",
  };
  const movie = await tmdbRequest(`/movie/${tmdbId}`, movieDetailsSchema, params);
  if (movie.id !== tmdbId) throw upstreamError();
  let description = movie.overview;
  if (!description) {
    const english = await tmdbRequest(`/movie/${tmdbId}`, movieSummarySchema, { language: "en-US" });
    if (english.id !== tmdbId) throw upstreamError();
    description = english.overview;
  }

  const cast = [...movie.credits.cast].sort((a, b) => a.order - b.order)
    .filter((actor, index, all) => all.findIndex(other => other.id === actor.id) === index).slice(0, 8);
  const existing = cast.length ? await query<{ tmdb_id: number; bio: string }>(
    "SELECT tmdb_id, bio FROM person WHERE tmdb_id = ANY($1::int[]) AND bio IS NOT NULL AND trim(bio) <> ''",
    [cast.map(actor => actor.id)],
  ) : [];
  const bios = new Map(existing.map(person => [person.tmdb_id, sanitize(person.bio).slice(0, 10000)]));
  const biographies = await Promise.allSettled(cast.map(actor => bios.get(actor.id) || getPersonBio(actor.id)));
  for (const result of biographies) {
    if (result.status === "rejected" && result.reason instanceof HttpError && result.reason.status === 429) {
      throw result.reason;
    }
  }

  const certification = (country: string) => movie.release_dates.results
    .filter(result => result.iso_3166_1 === country).flatMap(result => result.release_dates)
    .filter(release => release.certification)
    .sort((a, b) => (a.type === 3 ? -1 : 0) - (b.type === 3 ? -1 : 0))[0]?.certification;
  const trailer = movie.videos.results
    .filter(video => video.site === "YouTube" && video.type === "Trailer" && /^[A-Za-z0-9_-]{11}$/.test(video.key))
    .sort((a, b) => Number(b.official) - Number(a.official)
      || Number(b.iso_639_1 === "sv") - Number(a.iso_639_1 === "sv"))[0];

  return {
    tmdbId: movie.id, title: movie.title, originalTitle: movie.original_title,
    description: description || null,
    duration_minutes: movie.runtime || null,
    age_rating: certification("SE") || certification("US") || null,
    release_date: movie.release_date,
    imdb_rating: movie.vote_average ?? null,
    director: movie.credits.crew.find(person => person.job === "Director")?.name || null,
    genres: [...new Set(movie.genres.map(genre => genre.name))].slice(0, 10),
    poster_url: tmdbImage(movie.poster_path, "w500"),
    landscape_image_url: tmdbImage(movie.backdrop_path, "w1280"),
    trailer_url: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
    cast_members: cast.map((actor, index) => ({
      tmdb_id: actor.id, name: actor.name, character_name: actor.character || null,
      photo_url: tmdbImage(actor.profile_path, "w185"), billing_order: actor.order,
      bio: biographies[index].status === "fulfilled" ? biographies[index].value : null,
    })),
  };
}
