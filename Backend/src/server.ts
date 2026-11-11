import dotenv from "dotenv";
import { app } from "./app.js";
import { config } from "./config.js";
import { initDb } from "./db.js";
import { cleanupBookingProtection } from './services/bookingLimits.service.js';

dotenv.config();

const PORT = config.port;

initDb()
  .then(() => {
    const cleanup = () => void cleanupBookingProtection().catch(() => console.error('[Booking] Cleanup failed'));
    cleanup();
    setInterval(cleanup, 60_000).unref();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(() => {
    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT} (Database offline)`,
      );
    });
  });
