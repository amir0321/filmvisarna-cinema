import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().default(3000),
  JWT_SECRET: z.string().min(32, "must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  TIMEZONE: z.string().default("Europe/Stockholm"),
  SCREENING_BUFFER_MINUTES: z.coerce.number().int().min(0).default(20),
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
  port: env.PORT,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  corsOrigin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
  timezone: env.TIMEZONE,
  screeningBufferMinutes: env.SCREENING_BUFFER_MINUTES,
};
