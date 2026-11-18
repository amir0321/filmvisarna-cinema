import { Request, Response } from "express";
import { z } from "zod";
import {
  createCinema,
  deleteCinema,
  getAllCinemas,
  getCinemaById,
  updateCinema,
} from "../services/cinemas.service.js";
import { parseId } from "../utils/httpErorr.js";

export const createCinemaSchema = z.object({
  name: z.string().trim().min(1, "Namn krävs").max(100),
  format: z.string().trim().max(100).optional().nullable(),
  tech: z.string().trim().max(200).optional().nullable(),
  screen_size: z.string().trim().max(50).optional().nullable(),
  opened_year: z.coerce.number().int().min(1890).max(2100).optional().nullable(),
  rows: z.number().int().min(1, "Minst 1 rad krävs").max(26, "Max 26 rader (A-Z)"),
  seatsPerRow: z
    .number()
    .int()
    .min(1, "Minst 1 stol per rad krävs")
    .max(50, "Max 50 stolar per rad"),
});

export const updateCinemaSchema = z.object({
  name: z.string().trim().min(1, "Namn får inte vara tomt").max(100).optional(),
  format: z.string().trim().max(100).optional().nullable(),
  tech: z.string().trim().max(200).optional().nullable(),
  screen_size: z.string().trim().max(50).optional().nullable(),
  opened_year: z.coerce.number().int().min(1890).max(2100).optional().nullable(),
  rows: z.number().int().min(1, "Minst 1 rad krävs").max(26).optional(),
  seatsPerRow: z.number().int().min(1, "Minst 1 stol krävs").max(50).optional(),
  wheelchairSeats: z
    .array(
      z.object({
        row: z.string().trim().min(1).max(2),
        number: z.number().int().positive(),
      }),
    )
    .optional(),
});

export async function getCinemas(_req: Request, res: Response) {
  const cinemas = await getAllCinemas();
  res.json({ success: true, data: cinemas });
}

export async function getCinema(req: Request, res: Response) {
  const id = parseId(req.params.id, "salongs-ID");
  const cinema = await getCinemaById(id);
  res.json({ success: true, data: cinema });
}

export async function postCinema(req: Request, res: Response) {
  const body = createCinemaSchema.parse(req.body);
  const cinema = await createCinema(body);
  res.status(201).json({ success: true, data: cinema });
}

export async function putCinema(req: Request, res: Response) {
  const id = parseId(req.params.id, "salongs-ID");
  const body = updateCinemaSchema.parse(req.body);
  const cinema = await updateCinema(id, body);
  res.json({ success: true, data: cinema });
}

export async function deleteCinemaHandler(req: Request, res: Response) {
  const id = parseId(req.params.id, "salongs-ID");
  await deleteCinema(id);
  res.json({ success: true, message: "Salongen har tagits bort." });
}
