import { Router } from "express";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  deleteBooking,
  getMyBookings,
  lookupBooking,
  postBooking,
} from "../controllers/bookings.controller.js";

export const bookingsRouter = Router();

// Hämta inloggad användares bokningar
bookingsRouter.get("/me", requireAuth, getMyBookings);

// Slå upp bokning via referenskod (Admin/Personal)
bookingsRouter.get("/lookup", requireAdmin, lookupBooking);

// Skapa ny bokning (Gäst eller Medlem)
bookingsRouter.post("/", optionalAuth, postBooking);

// Avboka en bokning (Inloggad medlem)
bookingsRouter.delete("/:id", requireAuth, deleteBooking);
