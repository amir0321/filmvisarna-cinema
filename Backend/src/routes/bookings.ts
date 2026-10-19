import { Router } from "express";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  deleteBooking,
  getBookings,
  getCancelPreview,
  getMyBookings,
  lookupBooking,
  patchBooking,
  patchBookingCheckin,
  patchBookingPay,
  postBooking,
  postCancelByToken,
} from "../controllers/bookings.controller.js";

export const bookingsRouter = Router();

bookingsRouter.get("/", requireAdmin, getBookings);

bookingsRouter.get("/me", requireAuth, getMyBookings);

bookingsRouter.get("/lookup", requireAdmin, lookupBooking);

bookingsRouter.get("/cancel-preview", getCancelPreview);

bookingsRouter.post("/cancel-by-token", postCancelByToken);

bookingsRouter.post("/", optionalAuth, postBooking);

bookingsRouter.patch("/:id", requireAdmin, patchBooking);

bookingsRouter.patch("/:id/pay", requireAdmin, patchBookingPay);

bookingsRouter.patch("/:id/checkin", requireAdmin, patchBookingCheckin);

bookingsRouter.delete("/:id", requireAuth, deleteBooking);

