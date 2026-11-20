import { Request, Response } from "express";
import { z } from "zod";
import { parseId } from "../utils/httpErorr.js";
import { httpUrlSchema, imageUrlSchema } from "../utils/imageUrl.js";
import { castMemberBody } from "./persons.controller.js";
import { getTmdbMovieDetails, searchTmdbMovies } from "../services/tmdb.service.js";
import {
  createMovie,
  deleteMovie,
  getAllMovies,
  getMovieById,
  updateMovie,
} from "../services/movies.service.js";

const metadataBody = {
  production_countries: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  production_year: z.number().int().min(1888).max(2100).nullable().optional(),
  distributor: z.string().trim().max(200).nullable().optional(),
  language: z.string().trim().max(200).nullable().optional(),
  subtitles: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  images: z.array(imageUrlSchema).max(30).optional(),
  youtube_trailers: z.array(httpUrlSchema).max(10).optional(),
  reviews: z.array(z.object({
    source: z.string().trim().min(1).max(200),
    quote: z.string().trim().min(1).max(2000),
    stars: z.number().min(0), max: z.number().positive().max(100),
  }).refine(review => review.stars <= review.max, 'Betyget får inte överstiga skalan.')).max(30).optional(),
};

export const createMovieBody = z.object({
  ...metadataBody,
  title: z
    .string()
    .trim()
    .min(1, "Titel krävs och får inte vara tom.")
    .max(300, "Titel får max vara 300 tecken."),

  description: z.string().trim().max(2000).optional().nullable(),

  duration_minutes: z
    .number()
    .int("Speltid (minuter) måste vara ett heltal.")
    .positive("Speltid (minuter) måste vara ett positivt tal."),

  age_rating: z.string().trim().max(10).optional().nullable(),

  poster_url: imageUrlSchema.optional().nullable(),

  landscape_image_url: imageUrlSchema.optional().nullable(),

  trailer_url: httpUrlSchema.optional().nullable(),

  director: z
    .string()
    .trim()
    .max(200, "Regissör får max vara 200 tecken.")
    .optional()
    .nullable(),

  imdb_rating: z
    .coerce
    .number()
    .min(0, "IMDb-betyg måste vara minst 0.")
    .max(10, "IMDb-betyg kan max vara 10.")
    .optional()
    .nullable(),

  release_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Premiärdatum måste ha formatet ÅÅÅÅ-MM-DD.")
    .optional()
    .nullable(),

  genres: z
    .array(z.string().trim().min(1).max(100))
    .max(10, "Max 10 genrer per film.")
    .optional(),
  cast_members: z.array(castMemberBody).max(100).optional(),
});

export const updateMovieBody = z.object({
  ...metadataBody,
  title: z
    .string()
    .trim()
    .min(1, "Titel får inte vara tom.")
    .max(300, "Titel får max vara 300 tecken.")
    .optional(),

  description: z.string().trim().max(2000).optional().nullable(),

  duration_minutes: z
    .number()
    .int("Speltid (minuter) måste vara ett heltal.")
    .positive("Speltid (minuter) måste vara ett positivt tal.")
    .optional(),

  age_rating: z.string().trim().max(10).optional().nullable(),

  poster_url: imageUrlSchema.optional().nullable(),

  landscape_image_url: imageUrlSchema.optional().nullable(),

  trailer_url: httpUrlSchema.optional().nullable(),

  director: z
    .string()
    .trim()
    .max(200, "Regissör får max vara 200 tecken.")
    .optional()
    .nullable(),

  imdb_rating: z
    .coerce
    .number()
    .min(0, "IMDb-betyg måste vara minst 0.")
    .max(10, "IMDb-betyg kan max vara 10.")
    .optional()
    .nullable(),

  release_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Premiärdatum måste ha formatet ÅÅÅÅ-MM-DD.")
    .optional()
    .nullable(),

  genres: z
    .array(z.string().trim().min(1).max(100))
    .max(10, "Max 10 genrer per film.")
    .optional(),
  cast_members: z.array(castMemberBody).max(100).optional(),
});

export const listMoviesQuerySchema = z.object({
  compact: z.enum(["true", "false"]).optional().transform(value => value === "true"),
  genre: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  age: z.coerce.number().int().min(0).max(120).optional(),
});

export async function getMovies(req: Request, res: Response) {
  const query = listMoviesQuerySchema.parse(req.query);
  const movies = await getAllMovies(query);
  res.json({ success: true, data: movies });
}

const externalSearchQuery = z.object({ query: z.string().trim().min(2).max(120) });

export async function searchExternalMovies(req: Request, res: Response) {
  const { query } = externalSearchQuery.parse(req.query);
  res.json({ success: true, data: await searchTmdbMovies(query) });
}

export async function getExternalMovie(req: Request, res: Response) {
  const tmdbId = parseId(req.params.tmdbId, "TMDB-ID");
  res.json({ success: true, data: await getTmdbMovieDetails(tmdbId) });
}

export async function getMovie(req: Request, res: Response) {
  const id = parseId(req.params.id, "film-ID");
  const movie = await getMovieById(id);
  res.json({ success: true, data: movie });
}

export async function postMovie(req: Request, res: Response) {
  const body = createMovieBody.parse(req.body);
  const movie = await createMovie(body);
  res.status(201).json({ success: true, data: movie });
}

export async function putMovie(req: Request, res: Response) {
  const id = parseId(req.params.id, "film-ID");
  const body = updateMovieBody.parse(req.body);
  const movie = await updateMovie(id, body);
  res.json({ success: true, data: movie });
}

export async function deleteMovieHandler(req: Request, res: Response) {
  const id = parseId(req.params.id, "film-ID");
  await deleteMovie(id);
  res.json({ success: true, message: "Filmen har tagits bort." });
}
