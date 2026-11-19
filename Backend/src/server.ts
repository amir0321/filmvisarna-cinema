import { existsSync } from 'node:fs';
import path from 'node:path';
import { app } from './app.js';
import { config } from './config.js';
import { initDb, pool } from './db.js';
import { cleanupBookingProtection } from './services/bookingLimits.service.js';
import { deliverBookingWarningEmails } from './services/bookingWarnings.service.js';
import { startScreeningScheduler } from './scheduler.js';
import { frontendDistFolder } from './paths.js';

let cleaning = false;
const cleanup = async () => {
  if (cleaning) return;
  cleaning = true;
  try { await cleanupBookingProtection(); await deliverBookingWarningEmails(); }
  catch { console.error('[Booking] Cleanup failed'); }
  finally { cleaning = false; }
};

async function start() {
  if (config.nodeEnv === 'production' && !existsSync(path.join(frontendDistFolder, 'index.html'))) {
    throw new Error('Frontend build is missing. Run npm run build from the repository root.');
  }
  let databaseOnline = true;
  try { await initDb(); }
  catch {
    databaseOnline = false;
    if (config.nodeEnv === 'production') throw new Error('Database unavailable; production server was not started.');
  }
  const cleanupTimer = setInterval(() => { void cleanup(); }, 60_000);
  cleanupTimer.unref();
  let stopScheduler = () => {};
  const server = app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}${databaseOnline ? '' : ' (Database offline)'}`);
    if (databaseOnline) {
      void cleanup();
      if (config.screeningsRefillEnabled) stopScheduler = startScreeningScheduler();
    }
  });
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    stopScheduler();
    clearInterval(cleanupTimer);
    const deadline = setTimeout(() => process.exit(1), 10_000);
    deadline.unref();
    server.close(() => {
      void pool.end().finally(() => clearTimeout(deadline));
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

void start().catch(error => {
  console.error(error instanceof Error ? error.message : 'Server startup failed');
  process.exitCode = 1;
  void pool.end();
});
