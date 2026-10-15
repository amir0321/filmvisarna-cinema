import { Request, Response } from "express";
import { z } from "zod";
import {
  createBooking,
  getBookingByReference,
  getUserBookings,
} from "../services/bookings.service.js";

const createBookingSchema = z.object({
  screeningId: z.number().int().positive("Ogiltigt visnings-id."),
  email: z.string().trim().email("Ogiltig e-postadress.").optional(),
  guestName: z.string().trim().min(1).max(100).optional(),
  tickets: z
    .array(
      z.object({
        seatId: z.number().int().positive("Ogiltig stol."),
        priceGroupId: z.number().int().positive("Ogiltig biljettyp."),
      }),
    )
    .min(1, "Välj mellan 1 och 10 stolar.")
    .max(10, "Välj mellan 1 och 10 stolar.")
    .refine(
      (tickets) =>
        new Set(tickets.map((t) => t.seatId)).size === tickets.length,
      { message: "Samma stol kan inte väljas två gånger." },
    ),
  items: z
    .array(
      z.object({
        itemId: z.number().int().positive("Ogiltig kioskprodukt."),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .refine(
      (items) => new Set(items.map((i) => i.itemId)).size === items.length,
      { message: "Samma produkt kan inte väljas två gånger." },
    )
    .optional(),
});

const lookupBookingSchema = z.object({
  reference: z.string().trim().min(1).max(50),
});


export async function getMyBookings(req: Request, res: Response) {
  const bookings = await getUserBookings(req.user!.id);
  res.json(bookings);
}

export async function lookupBooking(req: Request, res: Response) {
  const { reference } = lookupBookingSchema.parse(req.query);
  const booking = await getBookingByReference(reference);
  res.json(booking);
}

export async function postBooking(req: Request, res: Response) {
  const body = createBookingSchema.parse(req.body);
  const email = req.user?.email ?? body.email;

  if (!email) {
    res.status(400).json({ error: "E-postadress krävs för gästbokning." });
    return;
  }

  const result = await createBooking(
    { ...body, email },
    req.user?.id,
  );

  res.status(201).json(result);
}
