import { Request, Response } from "express";
import { z } from "zod";
import { parseId } from "../utils/httpErorr.js";
import {
  createMovie,
  deleteMovie,
  getAllMovies,
  getMovieById,
  updateMovie,
} from "../services/movies.service.js";

export const createMovieBody = z.object({
  title: z
    .string()
    .trim()
    .min(1, "title krävs och får inte vara tom")
    .max(300, "title får max vara 300 tecken"),

  description: z.string().trim().max(2000).optional().nullable(),

  duration_minutes: z
    .number()
    .int("duration_minutes måste vara ett heltal")
    .positive("duration_minutes måste vara ett positivt tal"),

  age_rating: z.string().trim().max(10).optional().nullable(),

  poster_url: z
    .string()
    .url("poster_url måste vara en giltig URL")
    .optional()
    .nullable(),

  landscape_image_url: z
    .string()
    .url("landscape_image_url måste vara en giltig URL")
    .optional()
    .nullable(),

  trailer_url: z
    .string()
    .url("trailer_url måste vara en giltig URL")
    .optional()
    .nullable(),

  director: z
    .string()
    .trim()
    .max(200, "director får max vara 200 tecken")
    .optional()
    .nullable(),

  imdb_rating: z
    .coerce
    .number()
    .min(0, "imdb_rating måste vara minst 0")
    .max(10, "imdb_rating kan max vara 10")
    .optional()
    .nullable(),

  release_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "release_date måste ha formatet ÅÅÅÅ-MM-DD")
    .optional()
    .nullable(),

  genres: z
    .array(z.string().trim().min(1).max(100))
    .max(10, "Max 10 genres per film")
    .optional(),
});

export const updateMovieBody = z.object({
  title: z
    .string()
    .trim()
    .min(1, "title får inte vara tom")
    .max(300, "title får max vara 300 tecken")
    .optional(),

  description: z.string().trim().max(2000).optional().nullable(),

  duration_minutes: z
    .number()
    .int("duration_minutes måste vara ett heltal")
    .positive("duration_minutes måste vara ett positivt tal")
    .optional(),

  age_rating: z.string().trim().max(10).optional().nullable(),

  poster_url: z
    .string()
    .url("poster_url måste vara en giltig URL")
    .optional()
    .nullable(),

  landscape_image_url: z
    .string()
    .url("landscape_image_url måste vara en giltig URL")
    .optional()
    .nullable(),

  trailer_url: z
    .string()
    .url("trailer_url måste vara en giltig URL")
    .optional()
    .nullable(),

  director: z
    .string()
    .trim()
    .max(200, "director får max vara 200 tecken")
    .optional()
    .nullable(),

  imdb_rating: z
    .coerce
    .number()
    .min(0, "imdb_rating måste vara minst 0")
    .max(10, "imdb_rating kan max vara 10")
    .optional()
    .nullable(),

  release_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "release_date måste ha formatet ÅÅÅÅ-MM-DD")
    .optional()
    .nullable(),

  genres: z
    .array(z.string().trim().min(1).max(100))
    .max(10, "Max 10 genres per film")
    .optional(),
});

export const listMoviesQuerySchema = z.object({
  genre: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  age: z.coerce.number().int().min(0).max(120).optional(),
});

export async function getMovies(req: Request, res: Response) {
  const query = listMoviesQuerySchema.parse(req.query);
  const movies = await getAllMovies(query);
  res.json({ success: true, data: movies });
}

export async function getMovie(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const movie = await getMovieById(id);
  res.json({ success: true, data: movie });
}

export async function postMovie(req: Request, res: Response) {
  const body = createMovieBody.parse(req.body);
  const movie = await createMovie(body);
  res.status(201).json({ success: true, data: movie });
}

export async function putMovie(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const body = updateMovieBody.parse(req.body);
  const movie = await updateMovie(id, body);
  res.json({ success: true, data: movie });
}

export async function deleteMovieHandler(req: Request, res: Response) {
  const id = parseId(req.params.id);
  await deleteMovie(id);
  res.json({ success: true, message: "Filmen har tagits bort" });
}
