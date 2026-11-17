import dotenv from "dotenv";
import { app } from "./app.js";
import { config } from "./config.js";
import { initDb } from "./db.js";
import { cleanupBookingProtection } from './services/bookingLimits.service.js';
import { deliverBookingWarningEmails } from './services/bookingWarnings.service.js';

dotenv.config();

const PORT = config.port;
let cleaning = false;
const cleanup = async () => {
  if (cleaning) return;
  cleaning = true;
  try { await cleanupBookingProtection(); await deliverBookingWarningEmails(); }
  catch { console.error('[Booking] Cleanup failed'); }
  finally { cleaning = false; }
};
setInterval(cleanup, 60_000).unref();

initDb()
  .then(() => {
    cleanup();
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
