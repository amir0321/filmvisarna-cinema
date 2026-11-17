import { pool } from '../db.js';
import { cleanupBookingProtection } from '../services/bookingLimits.service.js';
import { deliverBookingWarningEmails } from '../services/bookingWarnings.service.js';

void cleanupBookingProtection().then(() => deliverBookingWarningEmails()).finally(() => pool.end()).catch(() => {
  console.error('Booking protection cleanup failed.');
  process.exitCode = 1;
});
