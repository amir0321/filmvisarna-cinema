import { createHash } from 'node:crypto';

export const normalizeBookingEmail = (email: string) => email.trim().toLowerCase();
export const hashBookingValue = (value: string) => createHash('sha256').update(value).digest('hex');
