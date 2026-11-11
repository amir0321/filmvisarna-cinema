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
  createBookingHandlers,
  postCancelByToken,
} from "../controllers/bookings.controller.js";
import { consumeBookingLimit } from '../services/bookingLimits.service.js';
import { config } from '../config.js';
import { pool } from '../db.js';

export function createBookingsRouter(...dependencies: Parameters<typeof createBookingHandlers>) {
  const bookingsRouter = Router();
  const handlers = createBookingHandlers(...dependencies);

  bookingsRouter.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});
bookingsRouter.use(async (req, res, next) => {
  if (req.method !== 'POST' || !['/', '/guest/request', '/guest/preview', '/guest/confirm'].includes(req.path)) return next();
  // Separate global and IP buckets; forwarded headers are trusted only by explicit app configuration.
  try {
    await consumeBookingLimit(pool, 'requests:global', config.bookingLimits.globalAttempts);
    await consumeBookingLimit(pool, `ip:${req.ip ?? req.socket.remoteAddress}`, config.bookingLimits.ipAttempts);
    next();
  } catch (error) {
    res.setHeader('Retry-After', '900');
    throw error;
  }
});

bookingsRouter.get("/", requireAdmin, getBookings);

bookingsRouter.get("/me", requireAuth, getMyBookings);

bookingsRouter.get("/lookup", requireAdmin, lookupBooking);

bookingsRouter.get("/cancel-preview", getCancelPreview);

bookingsRouter.post("/cancel-by-token", postCancelByToken);

bookingsRouter.post('/guest/request', handlers.requestGuestBooking);
bookingsRouter.post('/guest/preview', handlers.previewGuestBooking);
bookingsRouter.post('/guest/confirm', handlers.confirmGuestBooking);
bookingsRouter.post("/", optionalAuth, handlers.postBooking);

bookingsRouter.patch("/:id", requireAdmin, patchBooking);

bookingsRouter.patch("/:id/pay", requireAdmin, patchBookingPay);

bookingsRouter.patch("/:id/checkin", requireAdmin, patchBookingCheckin);

bookingsRouter.delete("/:id", requireAuth, deleteBooking);

return bookingsRouter;
}

export const bookingsRouter = createBookingsRouter();

