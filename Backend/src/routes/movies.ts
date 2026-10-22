import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth";
import { parseId } from "../utils/httpErorr";
import { getAllMovies, getMovieById, createMovie } from "../services/movies.service";

export const moviesRouter = Router();

const createMovieBody = z.object({
  title: z
    .string()
    .trim()
    .min(1, "title krävs och får inte vara tom")
    .max(300, "title får max vara 300 tecken"),

  description: z.string().trim().max(2000).optional(),

  duration_minutes: z
    .number()
    .int("duration_minutes måste vara ett heltal")
    .positive("duration_minutes måste vara ett positivt tal"),

  age_rating: z.string().trim().max(10).optional(),

  poster_url: z
    .string()
    .url("poster_url måste vara en giltig URL")
    .optional(),

  release_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "release_date måste ha formatet ÅÅÅÅ-MM-DD")
    .optional(),

  genres: z
    .array(z.string().trim().min(1).max(100))
    .max(10, "Max 10 genres per film")
    .optional(),
});

moviesRouter.get("/", async (_req, res) => {
  const movies = await getAllMovies();
  res.json({ success: true, data: movies });
});

moviesRouter.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  const movie = await getMovieById(id);
  res.json({ success: true, data: movie });
});

moviesRouter.post("/", requireAdmin, async (req, res) => {
  const body = createMovieBody.parse(req.body);
  const movie = await createMovie(body);
  res.status(201).json({ success: true, data: movie });
});
