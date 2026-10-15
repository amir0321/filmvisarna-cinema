# Filmvisarna Cinema - Backend

Node.js + Express 5 + TypeScript + PostgreSQL API for the Filmvisarna cinema project.

---

## Architecture

The backend follows a clean, modular 3-tier architecture:
- **Routes (`src/routes/`):** Define HTTP endpoints and attach auth/role middleware.
- **Controllers (`src/controllers/`):** Parse and validate incoming requests using Zod schemas, handle HTTP status codes, and call services.
- **Services (`src/services/`):** Encapsulate all business logic, database queries, atomic transactions, and external services (e.g. email confirmations).
- **Middleware (`src/middleware/`):** JWT verification (`requireAuth`, `optionalAuth`) and role authorization (`requireAdmin`).

---

## Configuration (`.env`)

Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | HTTP port for Express server | `3000` |
| `DATABASE_URL` | Full PostgreSQL connection string | `postgresql://user:pass@host:5432/filmvisarna` |
| `JWT_SECRET` | Secret key used to sign JWTs (min 32 chars) | `your_jwt_secret_key_that_is_at_least_32_characters_long` |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |
| `TIMEZONE` | Timezone for screenings and email dates | `Europe/Stockholm` |
| `SCREENING_BUFFER_MINUTES` | Cleaning buffer required between screenings | `20` |
| `CANCELLATION_DEADLINE_HOURS` | Minimum hours before screening to allow cancellation | `2` |
| `EMAIL_HOST` | SMTP server host for Nodemailer | *(optional)* |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username | *(optional)* |
| `EMAIL_PASS` | SMTP password | *(optional)* |

---

## Scripts

```bash
# Start backend in development mode with tsx hot-reloading
npm run dev

# Compile TypeScript to dist/
npm run build

# Run production server from compiled dist/
npm run start

# Seed database with cinemas, seats and movies
npm run seed

# Create or promote an admin account
npm run create-admin -- admin@example.com MyPassword123

# Run unit tests
node --import tsx --test src/tests/*.test.ts
```

---

## Database & Schema

All SQL migrations and initialization scripts are located in `Backend/sql/`:
- `00_drop.sql`: Drops existing tables and views.
- `01_schema.sql`: Table definitions and primary/foreign key constraints.
- `02_views.sql`: Convenience views (`screening_times`, `cinema_overview`, `booking_totals`).
- `03_security.sql`: Row-level security settings.
- `04_seed.sql`: Initial seed data for cinemas, movies, and kiosk menu items.

---

## API Summary

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Movies:** `GET /api/movies`, `GET /api/movies/:id`, `POST /api/movies` (Admin)
- **Screenings:** `GET /api/screenings`, `GET /api/screenings/today`, `GET /api/screenings/:id/seats`, `POST /api/screenings` (Admin)
- **Bookings:** `POST /api/bookings`, `GET /api/bookings/me`, `GET /api/bookings/lookup` (Admin), `DELETE /api/bookings/:id`
- **Kiosk:** `GET /api/kiosk`, `GET /api/kiosk/:id`
- **Health:** `GET /api/health`

For the complete API documentation and Postman requests, refer to the root [README.md](../README.md).
