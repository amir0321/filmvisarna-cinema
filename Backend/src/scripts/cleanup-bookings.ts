import { pool } from '../db.js';
import { cleanupBookingProtection } from '../services/bookingLimits.service.js';

void cleanupBookingProtection().finally(() => pool.end()).catch(() => {
  console.error('Booking protection cleanup failed.');
  process.exitCode = 1;
});
