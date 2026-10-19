import { Request, Response } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { dateRange } from "../utils/dates.js";
import { parseId } from "../utils/httpErorr.js";
import {
  createScreening,
  deleteScreening,
  getScreeningSeats,
  listUpcomingScreenings,
  updateScreening,
} from "../services/screenings.service.js";

const optionalInt = (min: number, max = 1_000_000) =>
  z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().int().min(min).max(max).optional(),
  );

const filtersSchema = z.object({
  movieId: optionalInt(1),
  cinemaId: optionalInt(1),
  age: optionalInt(0, 120),
});

const listQuerySchema = filtersSchema
  .extend({
    when: z.enum(["today", "tomorrow", "weekend"]).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
      .optional(),
  })
  .refine((q) => !(q.when && q.date), {
    message: 'Use either "when" or "date", not both',
    path: ["when"],
  });

const createScreeningBody = z.object({
  movieId: z.number().int().positive(),
  cinemaId: z.number().int().positive(),
  startsAt: z.string().datetime({ offset: true }),
});

const updateScreeningBody = z.object({
  movieId: z.number().int().positive().optional(),
  cinemaId: z.number().int().positive().optional(),
  startsAt: z.string().datetime({ offset: true }).optional(),
});

export async function getScreenings(req: Request, res: Response) {
  const q = listQuerySchema.parse(req.query);
  const range = q.when
    ? dateRange(q.when, config.timezone)
    : q.date
      ? { from: q.date, to: q.date }
      : {};

  const screenings = await listUpcomingScreenings({
    ...range,
    movieId: q.movieId,
    cinemaId: q.cinemaId,
    age: q.age,
  });

  res.json(screenings);
}

export async function getTodayScreenings(req: Request, res: Response) {
  const q = filtersSchema.parse(req.query);
  const screenings = await listUpcomingScreenings({
    ...dateRange("today", config.timezone),
    ...q,
  });

  res.json(screenings);
}

export async function getSeats(req: Request, res: Response) {
  const screeningId = parseId(req.params.id, "screening ID");
  const result = await getScreeningSeats(screeningId);
  res.json(result);
}

export async function postScreening(req: Request, res: Response) {
  const body = createScreeningBody.parse(req.body);
  const screening = await createScreening(body);
  res.status(201).json(screening);
}

export async function putScreening(req: Request, res: Response) {
  const id = parseId(req.params.id, "screening ID");
  const body = updateScreeningBody.parse(req.body);
  const updated = await updateScreening(id, body);
  res.json({ success: true, data: updated });
}

export async function deleteScreeningHandler(req: Request, res: Response) {
  const id = parseId(req.params.id, "screening ID");
  await deleteScreening(id);
  res.json({ success: true, message: "Visningen har tagits bort" });
}
