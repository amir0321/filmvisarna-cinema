import { Request, Response } from "express";
import { z } from "zod";
import {
  cancelBooking,
  cancelBookingByToken,
  createBooking,
  getBookingByReference,
  getBookingCancelPreview,
  getUserBookings,
  listAllBookings,
  updateBookingStatus,
} from "../services/bookings.service.js";
import { parseId } from "../utils/httpErorr.js";

export const listBookingsQuerySchema = z.object({
  screeningId: z.coerce.number().int().positive().optional(),
  status: z.enum(["confirmed", "cancelled"]).optional(),
  isPaid: z
    .preprocess((v) => {
      if (v === "true" || v === true) return true;
      if (v === "false" || v === false) return false;
      return v;
    }, z.boolean().optional()),
  search: z.string().trim().min(1).max(100).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format: ÅÅÅÅ-MM-DD")
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format: ÅÅÅÅ-MM-DD")
    .optional(),
});

export const updateBookingSchema = z
  .object({
    isPaid: z.boolean().optional(),
    isCheckedIn: z.boolean().optional(),
  })
  .refine(
    (data) => data.isPaid !== undefined || data.isCheckedIn !== undefined,
    { message: "Minst ett fält (isPaid eller isCheckedIn) måste anges." },
  );

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

const cancelTokenSchema = z.object({
  token: z.string().trim().min(1, "Token krävs."),
});

export async function getBookings(req: Request, res: Response) {
  const query = listBookingsQuerySchema.parse(req.query);
  const bookings = await listAllBookings(query);
  res.json(bookings);
}

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

export async function deleteBooking(req: Request, res: Response): Promise<void> {
  const bookingId = parseId(req.params.id, "boknings-ID");
  const booking = await cancelBooking(bookingId, req.user!.id);
  res.json({
    success: true,
    message: "Bokningen har avbokats.",
    booking,
  });
}

export async function getCancelPreview(req: Request, res: Response) {
  const { token } = cancelTokenSchema.parse(req.query);
  const preview = await getBookingCancelPreview(token);
  res.json(preview);
}

export async function postCancelByToken(req: Request, res: Response) {
  const { token } = cancelTokenSchema.parse(req.body);
  const booking = await cancelBookingByToken(token);
  res.json({
    success: true,
    message: "Bokningen har avbokats.",
    booking,
  });
}

export async function patchBooking(req: Request, res: Response) {
  const id = parseId(req.params.id, "boknings-ID");
  const body = updateBookingSchema.parse(req.body);
  const booking = await updateBookingStatus(id, body);
  res.json({
    success: true,
    message: "Bokningen har uppdaterats.",
    booking,
  });
}

export async function patchBookingPay(req: Request, res: Response) {
  const id = parseId(req.params.id, "boknings-ID");
  const booking = await updateBookingStatus(id, { isPaid: true });
  res.json({
    success: true,
    message: "Bokningen har markerats som betald.",
    booking,
  });
}

export async function patchBookingCheckin(req: Request, res: Response) {
  const id = parseId(req.params.id, "boknings-ID");
  const booking = await updateBookingStatus(id, { isCheckedIn: true });
  res.json({
    success: true,
    message: "Bokningen har checkats in.",
    booking,
  });
}


