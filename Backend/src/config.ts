import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.url().default('http://localhost:5173').refine(value => {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/';
  }, 'must be an HTTP(S) origin without credentials, a path, query or fragment'),
  PORT: z.coerce.number().int().default(3000),
  JWT_SECRET: z.string().min(32, "must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  CORS_ORIGIN: z.string().default("http://localhost:5173").refine(value => value.split(',').every(origin => {
    try { return new URL(origin.trim()).origin === origin.trim() && ['http:', 'https:'].includes(new URL(origin.trim()).protocol); }
    catch { return false; }
  }), 'must contain explicit HTTP(S) origins without wildcards or paths'),
  TIMEZONE: z.string().default("Europe/Stockholm"),
  SCREENING_BUFFER_MINUTES: z.coerce.number().int().min(0).default(20),
  CANCELLATION_DEADLINE_HOURS: z.coerce.number().int().min(0).default(2),
  BOOKING_ATTEMPTS_PER_15_MIN: z.coerce.number().int().positive().default(3),
  BOOKING_IP_ATTEMPTS_PER_15_MIN: z.coerce.number().int().positive().default(30),
  BOOKING_GLOBAL_ATTEMPTS_PER_15_MIN: z.coerce.number().int().positive().default(300),
  BOOKING_MAX_SEATS_PER_SCREENING: z.coerce.number().int().min(1).max(10).default(10),
  BOOKING_MAX_UNPAID_BOOKINGS: z.coerce.number().int().positive().default(3),
  BOOKING_MAX_UNPAID_SEATS: z.coerce.number().int().positive().default(20),
  BOOKING_EMAILS_PER_15_MIN: z.coerce.number().int().positive().default(3),
  BOOKING_EMAIL_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  BOOKING_GLOBAL_EMAILS_PER_15_MIN: z.coerce.number().int().positive().default(60),
  BOOKING_GUEST_LINK_MINUTES: z.coerce.number().int().min(1).max(10).default(10),
  TRUST_PROXY: z.string().default(''),
  TMDB_API_KEY: z.string().trim().optional().default(''),
  TMDB_API_BASE_URL: z.string().url().optional().default('https://api.themoviedb.org/3').refine(value => {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  }, 'must be an HTTP(S) URL without credentials, query or fragment'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables (see .env.example):");
  for (const issue of parsed.error.issues) {
    console.error(` - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}
const env = parsed.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  frontendUrl: env.FRONTEND_URL,
  port: env.PORT,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  corsOrigin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
  timezone: env.TIMEZONE,
  screeningBufferMinutes: env.SCREENING_BUFFER_MINUTES,
  cancellationDeadlineHours: env.CANCELLATION_DEADLINE_HOURS,
  bookingLimits: {
    attempts: env.BOOKING_ATTEMPTS_PER_15_MIN,
    ipAttempts: env.BOOKING_IP_ATTEMPTS_PER_15_MIN,
    globalAttempts: env.BOOKING_GLOBAL_ATTEMPTS_PER_15_MIN,
    seatsPerScreening: env.BOOKING_MAX_SEATS_PER_SCREENING,
    unpaidBookings: env.BOOKING_MAX_UNPAID_BOOKINGS,
    unpaidSeats: env.BOOKING_MAX_UNPAID_SEATS,
    emails: env.BOOKING_EMAILS_PER_15_MIN,
    emailCooldownSeconds: env.BOOKING_EMAIL_COOLDOWN_SECONDS,
    globalEmails: env.BOOKING_GLOBAL_EMAILS_PER_15_MIN,
    guestLinkMinutes: env.BOOKING_GUEST_LINK_MINUTES,
  },
  trustProxy: env.TRUST_PROXY.split(',').map(value => value.trim()).filter(Boolean),
  tmdbApiKey: env.TMDB_API_KEY,
  tmdbApiBaseUrl: env.TMDB_API_BASE_URL,
};

if (env.NODE_ENV === 'production' && !env.FRONTEND_URL.startsWith('https://')) {
  throw new Error('FRONTEND_URL must use HTTPS in production');
}
