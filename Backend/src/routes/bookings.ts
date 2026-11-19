import { Router, type RequestHandler } from "express";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  deleteBooking,
  getBookings,
  getCancelPreview,
  getMyBookings,
  getMyReservationStatus,
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
// Attached per route so the limit matches exactly the same paths as the handlers
// (Express routing is case-insensitive and ignores trailing slashes).
const limitPublicBookingRequest: RequestHandler = async (req, res, next) => {
  // Separate global and IP buckets; forwarded headers are trusted only by explicit app configuration.
  try {
    await consumeBookingLimit(pool, 'requests:global', config.bookingLimits.globalAttempts);
    await consumeBookingLimit(pool, `ip:${req.ip ?? req.socket.remoteAddress}`, config.bookingLimits.ipAttempts);
    next();
  } catch (error) {
    res.setHeader('Retry-After', '900');
    throw error;
  }
};

bookingsRouter.get("/", requireAdmin, getBookings);

bookingsRouter.get("/me", requireAuth, getMyBookings);
bookingsRouter.get('/reservation-status', requireAuth, getMyReservationStatus);

bookingsRouter.get("/lookup", requireAdmin, lookupBooking);

bookingsRouter.post("/cancel-preview", limitPublicBookingRequest, getCancelPreview);

bookingsRouter.post("/cancel-by-token", limitPublicBookingRequest, postCancelByToken);

bookingsRouter.post('/guest/request', limitPublicBookingRequest, handlers.requestGuestBooking);
bookingsRouter.post('/guest/preview', limitPublicBookingRequest, handlers.previewGuestBooking);
bookingsRouter.post('/guest/confirm', limitPublicBookingRequest, handlers.confirmGuestBooking);
bookingsRouter.post("/", limitPublicBookingRequest, optionalAuth, handlers.postBooking);

bookingsRouter.patch("/:id", requireAdmin, patchBooking);

bookingsRouter.patch("/:id/pay", requireAdmin, patchBookingPay);

bookingsRouter.patch("/:id/checkin", requireAdmin, patchBookingCheckin);

bookingsRouter.delete("/:id", requireAuth, deleteBooking);

return bookingsRouter;
}

export const bookingsRouter = createBookingsRouter();

