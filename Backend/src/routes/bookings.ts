import { Router } from "express";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  deleteBooking,
  getMyBookings,
  lookupBooking,
  postBooking,
} from "../controllers/bookings.controller.js";

export const bookingsRouter = Router();

bookingsRouter.get("/me", requireAuth, getMyBookings);

bookingsRouter.get("/lookup", requireAdmin, lookupBooking);

bookingsRouter.post("/", optionalAuth, postBooking);

bookingsRouter.delete("/:id", requireAuth, deleteBooking);
