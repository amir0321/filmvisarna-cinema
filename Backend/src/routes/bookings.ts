import { Router } from "express";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  deleteBooking,
  getCancelPreview,
  getMyBookings,
  lookupBooking,
  postBooking,
  postCancelByToken,
} from "../controllers/bookings.controller.js";

export const bookingsRouter = Router();

bookingsRouter.get("/me", requireAuth, getMyBookings);

bookingsRouter.get("/lookup", requireAdmin, lookupBooking);

bookingsRouter.get("/cancel-preview", getCancelPreview);

bookingsRouter.post("/cancel-by-token", postCancelByToken);

bookingsRouter.post("/", optionalAuth, postBooking);

bookingsRouter.delete("/:id", requireAuth, deleteBooking);

