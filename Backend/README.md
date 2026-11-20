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
| `DB_SSL` | Enable TLS for PostgreSQL connections (`true`/`false`) | auto-enabled for non-localhost `DATABASE_URL` |
| `DB_SSL_REJECT_UNAUTHORIZED` | Verify PostgreSQL TLS certificate chain (`true`/`false`) | `true` in `production`, `false` in dev/test |
| `DB_SSL_CA` | Optional custom CA certificate (PEM) for PostgreSQL TLS verification | *(optional)* |
| `JWT_SECRET` | Secret key used to sign JWTs (min 32 chars) | `your_jwt_secret_key_that_is_at_least_32_characters_long` |
| `JWT_EXPIRES_IN` | Session expiration time | `8h` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |
| `TIMEZONE` | Timezone for screenings and email dates | `Europe/Stockholm` |
| `SCREENING_BUFFER_MINUTES` | Cleaning buffer required between screenings | `20` |
| `CANCELLATION_DEADLINE_HOURS` | Minimum hours before screening to allow cancellation | `2` |
| `EMAIL_HOST` | SMTP server host for Nodemailer | *(optional)* |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username | *(optional)* |
| `EMAIL_PASS` | SMTP password | *(optional)* |
| `EMAIL_FROM` | Sender address allowed by your SMTP provider | defaults to `EMAIL_USER` |
| `FRONTEND_URL` | Trusted public frontend origin used in auth email links; HTTPS required in production | `http://localhost:5173` |
| `NODE_ENV` | Environment (`development`, `test`, `production`) | `development` |
| `TMDB_API_KEY` | Optional server-side TMDB v3 API key for admin movie import | empty (external search returns 503) |
| `TMDB_API_BASE_URL` | Trusted upstream API base URL; HTTP(S), no credentials/query/fragment | `https://api.themoviedb.org/3` |

---

## Scripts

```bash
# Start backend in development mode with tsx hot-reloading
npm run dev

# Compile TypeScript to dist/
npm run build

# Run production server from compiled dist/
npm run start

# Add demo movies, screenings and bookings without clearing existing bookings
npm run seed:demo

# Verify demo scenarios and public poster/backdrop URLs
npm run seed:check
npm run seed:check -- --api # Also verify the running local public API
npm run seed:images

# Reset cinema data and rebuild the entire seed dataset (destructive)
npm run seed

# Create or promote an admin account
npm run create-admin -- admin@example.com MyPassword123

# Run the critical auth integration suite (requires AUTH_TEST_DATABASE_URL)
npm test
```

---

## Demo data for manual testing

Run `npm run seed:demo` from `Backend/` with the development database configured in `.env`. The transaction keeps existing bookings, references and passwords. Matching seed movies receive corrected metadata and images. Demo seeding is disabled in production.

Apply `npm run migrate:metadata` from the repository root or `Backend/` once before deploying this version to an existing database. This additive, repeatable migration adds movie metadata and extends the cinema overview; it does not change existing films, screenings, seats or bookings.

Use `npm run seed:refresh` before each live demo (also available from the repository root), or schedule it daily on a dedicated **development/demo database**. It uses the same transaction and advisory lock as `seed:demo`, rolling relative premiere dates and topping up the 28-day programme around existing bookings. Old history remains available; IDs, references and passwords are preserved. It sends no emails and remains disabled when `NODE_ENV=production`. No cron job is installed automatically.

Upgrading the former rectangular layouts removes only seats without ticket history and inserts missing seats. If a seat being removed has any ticket history, the whole seed rolls back with an explicit error; resolve that booking before refreshing. Existing booked seats are never silently reassigned.

The cinema has exactly **two auditoriums**: **Stora Salongen** (A–H: `[8,9,10,10,10,10,12,12]`, 81 seats) and **Lilla Salongen** (A–F: `[6,8,9,10,10,12]`, 55 seats). Never add extra cinemas to demonstrate pagination.

- **Programme:** 16 current movies and 4 upcoming retrospective premieres, with release dates relative to the seed run. The rolling window is 28 Stockholm calendar days (today −4 through today +23): four evening screenings per day, 112 in a fresh database. Each auditorium starts around 17:00 and 21:00, with varied minute offsets and at least 20 minutes for cleaning. Already booked showings are retained. The programme rotates movies across days; twelve movies do not play on the same day in just two auditoriums.
- **Pagination:** Home uses 8 movies per page; `/filmer` uses 10. Select **I helgen** and **Alla** on home to exercise pagination when the remaining weekend programme exceeds eight movies. A single day can legitimately fit on one page, particularly late in the day or on Sunday. Page controls stay hidden for one-page results.
- **Three seats remaining:** The next seeded **Dune: Part Two** scenario in **Stora Salongen** leaves **D4 and D5** together and **H9** farther away. The seeder prints its actual date, time and `/boka/:id` link.
- **Sold out:** A seeded **Interstellar** screening in **Stora Salongen** has all 81 seats booked. Direct navigation to it must show a clear sold-out state and an alternative-showtimes link, without ticket, seat, kiosk or checkout controls.
- **My bookings:** `admin@filmvisarna.se`, `medlem@filmvisarna.se` and `testuser1@example.com` have at least 6 upcoming and 6 historical bookings (including cancellations), exercising 5-card pagination in both tabs. Upcoming entries mix paid/unpaid bookings; confirmed personal bookings include popcorn. Existing passwords are retained. New accounts use `SEED_USER_PASSWORD`, defaulting to `Password123!`.
- **Media:** Seed movies have trailers, posters and landscape images. `npm run seed:images` checks all distinct public image URLs. Film cards try the alternate artwork on loading failure, then show a title fallback.
- **Cast:** All 46 seed actors have static portrait links, TMDB person IDs, short Swedish biographies and per-film characters/billing order. `src/seeds/actorProfiles.ts` records the Wikipedia/Wikidata person sources and a TMDB portrait for Kensington Tallman. Wikimedia file pages linked from those person pages provide photo credits and licenses. Seeding requires no TMDB key or network requests, reuses existing people and fills missing photos/biographies without replacing profiles already edited by admins.

The four new repertoire films are **Past Lives**, **Aftersun**, **Perfect Days** and **Världens värsta människa**. Credits, runtimes and synopses were checked against [A24: Past Lives](https://a24films.com/films/past-lives), [A24: Aftersun](https://a24films.com/films/aftersun), [NEON: Perfect Days](https://www.neonrated.com/film/perfect-days) and [NEON: The Worst Person in the World](https://www.neonrated.com/film/the-worst-person-in-the-world). Distributor labels explicitly identify the US distributor. Swedish subtitles are demo programme choices; unknown Swedish age classifications and IMDb ratings are left empty. Their images use trailer thumbnails, and their short original example reviews are attributed to **Filmvisarna (demo)**, not to external critics. Their cast profiles are not seeded. `Call me by your name` was excluded as requested.

The additive seed can be repeated without duplicating movies, cinemas or matching screenings/bookings. It preserves interactions on existing bookings and sends no emails. Bookings use `FV-XXXXX` references and at most 10 tickets each. `seed:check` verifies the exact row layouts and capacities, all 28 days with at least three shows per day and more than 84 shows, four films with metadata/reviews and at least 12 movies across the upcoming programme, the exact three free seats, the sold-out screening, booking pagination, no overlapping screenings and correct seat-to-cinema mapping. Add `-- --api` to verify the running local API too. Booking one of the three free seats intentionally changes the exact-seat check.

When upgrading the former four-test-cinema seed, booked showings are moved to non-overlapping times in Stora Salongen with their screening IDs, booking references and row/seat labels preserved. The obsolete test cinemas and unbooked seed showings are removed; the two-cinema programme is rebuilt around preserved bookings. Changed dates/times are printed by the script. The whole migration rolls back if any booking or seat cannot be preserved.

`npm run seed` remains a destructive full reset and also creates these scenarios. Prefer `seed:demo` for existing development data.

---

## Database & Schema

All SQL migrations and initialization scripts are located in `Backend/sql/`:
- `00_drop.sql`: Drops existing tables and views.
- `01_schema.sql`: Table definitions and primary/foreign key constraints.
- `02_views.sql`: Convenience views (`screening_times`, `cinema_overview`, `booking_totals`).
- `03_security.sql`: Row-level security settings.
- `04_seed.sql`: Initial seed data for cinemas, movies, and kiosk menu items.

---

## Cast profiles and image uploads

Before starting this API against an existing database, run from `Backend/`:

```bash
npm run migrate:cast
```

The additive migration adds profile fields to `person` and credit fields to `movie_person`, preserves all existing rows and can be repeated. New databases receive these fields through `01_schema.sql`.

`GET /api/persons?search=...` is public and returns `{ success: true, data: [{ id, name, photo_url, bio, tmdb_id }] }`, limited to 50 people ordered by name and ID. Search matches names without case sensitivity. Admins can use `POST /api/persons` with `{ name, photo_url?, bio?, tmdb_id? }` and `PUT /api/persons/:id` with any subset of these fields. Creation reuses profiles by TMDB ID or `lower(trim(name))` and updates supplied profile fields. Editing a profile to collide with a different existing person returns 409; it does not merge records or move credits between people. Omitted profile fields are preserved; nullable fields can be cleared with `null`.

Movie creation and updates accept `cast_members` alongside `genres`:

```json
{
  "cast_members": [
    { "person_id": 12, "character_name": "Lead", "billing_order": 0 },
    { "name": "New Actor", "photo_url": "/uploads/actor.webp", "bio": "Biography", "tmdb_id": 123, "billing_order": 1 }
  ]
}
```

Reference an existing person by `person_id`, or supply a name to create/reuse a profile. Supplied profile fields also update that shared person. If `billing_order` is omitted, the array index is used. Film metadata, genres, profiles and credits are saved in one transaction. Omitted `genres`/`cast_members` on update are preserved; an empty array clears those links. Removing an actor preserves the person record and any director credits or credits for other movies. Duplicate references to the same person in one cast return 400.

Every movie response includes `actors: string[]` for existing clients and `cast_members: [{ person_id, name, photo_url, bio, character_name, tmdb_id, billing_order }]`, both ordered by billing order and name. `active_screenings_count` counts future screenings (`starts_at > now()`); `total_screenings_count` includes past screenings too.

`photo_url`, `poster_url` and `landscape_image_url` accept HTTP(S) URLs without credentials or filenames under `/uploads/` without `..`. `trailer_url` requires an HTTP(S) URL without credentials. All these URL fields are limited to 2048 characters.

Admin-only `POST /api/upload` accepts one file in the multipart field `image`: JPEG (`.jpg`/`.jpeg`), PNG, WebP or GIF, with matching MIME type, extension and magic-byte signature, up to 5 MB. Invalid image content is deleted from disk before returning 400. Larger files return 400 with `{ success: false, error: "Bildfilen är för stor. Maximal filstorlek är 5 MB." }`. Uploaded assets are served with `Content-Security-Policy: default-src 'none'; sandbox` and `X-Content-Type-Options: nosniff`. All writes require the session cookie and CSRF header described below.

Run the cast/movie/upload integration tests against a dedicated test database:

```bash
CAST_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/filmvisarna_cast_test npm run test:cast
```

The suite creates and removes an isolated schema and its uploaded test files. It also accepts the existing `AUTH_TEST_DATABASE_URL` used by CI. Without either test database variable, it is skipped.

## TMDB movie import

Set the optional v3 API key in `Backend/.env` and restart the backend:

```dotenv
TMDB_API_KEY=
TMDB_API_BASE_URL=https://api.themoviedb.org/3
```

Use a real key as the value of `TMDB_API_KEY`. It stays on the server. The default base URL is the official API; only override it for a trusted upstream, such as the local fake server used by integration tests. Requests time out after eight seconds, reject redirects and never log or return upstream error bodies, URLs or API credentials. Setup follows [TMDB authentication](https://developer.themoviedb.org/docs/authentication-application) and [append-to-response](https://developer.themoviedb.org/docs/append-to-response).

Both endpoints require an admin session and return `{ success: true, data: ... }`:

| Endpoint | Result |
| --- | --- |
| `GET /api/movies/external/search?query=...` | Query must contain 2–120 trimmed characters. Up to eight suggestions with `tmdbId`, `title`, `originalTitle`, numeric/null `releaseYear`, `posterUrl` and `overview`. |
| `GET /api/movies/external/:tmdbId` | Import preview with `tmdbId`, `title`, `originalTitle`, `description`, `duration_minutes`, `age_rating`, `release_date`, `imdb_rating`, `director`, `genres`, `poster_url`, `landscape_image_url`, `trailer_url` and `cast_members`. |

The detail preview prioritizes Swedish descriptions, with an English overview fallback. Certifications prefer Swedish theatrical releases, then other Swedish releases, then US certification; US labels are retained for admin review. The legacy `imdb_rating` field receives TMDB's `vote_average`, not a separate IMDb score. Missing runtime is returned as `null` and must be filled before saving. Only YouTube trailers with valid eleven-character video IDs are linked.

Up to eight unique actors are returned in billing order with `tmdb_id`, `name`, `character_name`, `photo_url`, `billing_order` and `bio`. A nonempty local biography is reused; other biographies are fetched concurrently, preferring Swedish translation, then English translation, then the primary English biography. An unavailable/invalid individual biography becomes `null`; a person-level rate limit still returns 429. All consumed upstream fields are validated with Zod. Text is trimmed and stripped of controls, HTML tags and script bodies; external image URLs are constructed only from validated filenames on `image.tmdb.org`.

These GET requests only preview data. After review, send the movie fields and `cast_members` to the existing `POST /api/movies` or `PUT /api/movies/:id` endpoint to save atomically. No preview request creates movies or people. Missing configuration returns 503; upstream rate limits return 429; other movie/search upstream failures, invalid JSON/schema and timeouts return 502 with generic Swedish messages.

The cast integration suite tests these endpoints with a local fake TMDB server and a dummy key, including authorization, validation, sanitization, language fallback, local biography reuse, parallel requests, redirect/timeout handling and safe error responses. It makes no live TMDB API requests and needs no real API key.

## Cookie sessions and CSRF protection

Login and registration set a host-only `HttpOnly; SameSite=Lax; Path=/` cookie. In production the cookie also uses `Secure` and the `__Host-` prefix, so HTTPS is required. Serve the SPA and `/api` from the same origin (Vite already proxies `/api` locally); cross-site hosting is not supported by this cookie policy. Session credentials never appear in JSON or browser storage. `GET /api/auth/me` returns `{ user, expiresAt }`, where `expiresAt` is milliseconds since Unix epoch.

Each JWT has a random ID and a SHA-256 hash stored in PostgreSQL's `auth_session`. Every protected request checks its signature, expiry, database session, current user role and `auth_version`. `POST /api/auth/logout` deletes only the current session before clearing the cookie, is idempotent and remains available when login throttling is exhausted. A copied cookie stops working after logout, across API workers and restarts. If revocation fails, the endpoint fails and the UI offers a retry. Password changes and resets continue to invalidate all sessions through `auth_version`.

All API writes (`POST`, `PUT`, `PATCH`, `DELETE`) require `X-CSRF-Protection: 1`, including login, logout, guest requests and uploads. Browser requests must also have an allowed `Origin` (`FRONTEND_URL` or an explicit `CORS_ORIGIN` entry). Wildcards and non-origin entries are rejected at startup. The custom header forces browser CORS preflight; requests without Origin are permitted only with this header for CLI clients. CORS allows credentials only for the configured origins. `GET` and `HEAD` must remain read-only.

The default lifetime is now eight hours. Existing `.env`/deployment values for `JWT_EXPIRES_IN` still override the default; change them explicitly if currently set to `7d`. Expired session rows are pruned when a new session is created. Run `npm run migrate:auth` before starting the new API. Deploy frontend and backend together: old bearer tokens are no longer accepted and users must sign in again. The frontend removes the old `localStorage.token` on startup and synchronizes session changes across tabs without transmitting credentials.

These controls follow the [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) and [CSRF custom-header guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#employing-custom-request-headers-for-ajaxapi). HttpOnly limits token theft through JavaScript; XSS prevention remains necessary because injected scripts can still make requests as the user.

## Password recovery and email verification

Before starting the updated API against an **existing database**, run this additive migration from `Backend/`:

```bash
npm run migrate:auth
```

This uses the database configured in `.env`, adds `app_user.auth_version` and creates `auth_action_token`, `auth_rate_limit` and `auth_session`. It does not delete accounts or bookings and can be repeated. New installations get the same definitions from `01_schema.sql` and `03_security.sql`. Do not run `00_drop.sql` to upgrade an existing database.

Configure `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` and an allowed `EMAIL_FROM` for real delivery, plus `FRONTEND_URL` pointing to the deployed SPA. SMTP on port 587 must support STARTTLS; port 465 uses TLS immediately. Auth emails never use the existing Ethereal fallback. Without SMTP, registration still creates the account and returns `verificationEmailSent: false`; mail request endpoints return 503. Password recovery acknowledges unknown and known accounts identically before background delivery. Delivery failures are logged without the recipient, token, link or SMTP message content.

| Endpoint | Request | Behavior |
| --- | --- | --- |
| `POST /api/auth/forgot-password` | `{ email }` | Neutral 200 response, reset link by email for existing accounts |
| `POST /api/auth/reset-password` | `{ token, password }` | Consumes a valid reset token, changes password, revokes existing JWT sessions |
| `POST /api/auth/resend-verification` | Session cookie | Sends another verification link for the signed-in account |
| `POST /api/auth/verify-email` | `{ token }` | Confirms ownership of the email; a session cookie alone cannot verify it |

Registration sends a verification email automatically. Verification does not block existing booking or login behavior; the frontend shows a notice with a resend action until the address is verified. Resetting a password requires signing in again and does not automatically log the user in. New passwords are validated at 8–72 characters and at most 72 UTF-8 bytes, including on the server.

Links contain 32 random bytes in a URL **fragment**, which the SPA removes from browser history after reading. Only SHA-256 token hashes are stored. Reset links expire in 30 minutes; verification links in 24 hours. New links invalidate older links for the same purpose. Consumption and password updates happen atomically, including under parallel requests. Verification and reset tokens cannot be used interchangeably. POST auth requests (except logout) are limited to 30 per IP per 15 minutes, and mail requests to 3 per account and purpose per 15 minutes, in PostgreSQL across workers. Do not enable a broad `trust proxy`: explicitly configure trusted proxy addresses before deploying behind one; otherwise rate limiting uses the direct peer IP. Periodically remove expired token records and rate buckets older than one day.

The recovery controls follow the [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

### Auth regression tests

Use a dedicated test database, never the application's database:

```bash
AUTH_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/filmvisarna_auth_test npm run test:auth
```

The tests create and remove a randomly named schema in that database. They never fall back to `DATABASE_URL` or `.env` for the test connection. Without `AUTH_TEST_DATABASE_URL`, the integration suite is explicitly skipped. GitHub CI supplies a separate PostgreSQL service and runs `npm test` for the complete backend suite.

Coverage includes the additive migration and existing account data, registration and login, mandatory JWT expiration, password validation, mail-delivery failures, expired/replaced/single-use links, concurrent token consumption, rate limits, cookie flags, database session expiry, CSRF rejection, copied-cookie rejection after logout, independent sessions and session revocation after password reset or change. Session JWTs without a valid future `exp` are rejected with 401; users with older tokens lacking expiration must log in again. Email delivery is captured in memory; the tests send no real messages. Verify the deployed SMTP credentials and `FRONTEND_URL` separately before release.

## HTTP Status Codes Overview

| Status Code | Meaning | Description |
| :--- | :--- | :--- |
| **`200 OK`** | Lyckades | Förfrågan lyckades och data returnerades |
| **`201 Created`** | Skapad | Ny resurs skapades (konto, film, visning, bokning) |
| **`400 Bad Request`** | Felaktig indata | Valideringsfel, saknade fält eller ogiltigt format |
| **`401 Unauthorized`** | Inte inloggad | Saknar token eller så är den ogiltig/utgången |
| **`403 Forbidden`** | Saknar behörighet | Inloggad men saknar admin-rättigheter |
| **`404 Not Found`** | Hittades inte | Resursen (film, visning, bokning) finns inte |
| **`409 Conflict`** | Krock i databas | Platsen är upptagen, mejlen finns redan, eller visningar överlappar |
| **`500 Server Error`** | Serverfel | Oväntat fel i servern eller databasen |

---

## Endpoint Error Reference

Standard felmeddelande i JSON:
```json
{
  "success": false,
  "error": "Beskrivning av felet",
  "details": ["Eventuella fältfel från Zod-validering"]
}
```

### 🔐 Autentisering (`/api/auth`)

#### `POST /api/auth/register`
- **Åtkomst:** Publik (alla)
- **`201 Created`**: Kontot skapat. Sätter en HttpOnly-cookie och returnerar `{ user, expiresAt, verificationEmailSent }`.
- **`400 Bad Request`**: Ogiltig e-postadress eller lösenord (< 8 eller > 72 tecken).
- **`409 Conflict`**: E-postadressen är redan registrerad.
- **`500 Server Error`**: Databas- eller serverfel.

#### `POST /api/auth/login`
- **Åtkomst:** Publik (alla)
- **`200 OK`**: Inloggningen lyckades. Sätter en HttpOnly-cookie och returnerar `{ user, expiresAt }`.
- **`400 Bad Request`**: Saknar e-post eller lösenord.
- **`401 Unauthorized`**: Fel e-postadress eller lösenord.
- **`500 Server Error`**: Internt serverfel.

#### `GET /api/auth/me`
- **Åtkomst:** Inloggad användare
- **`200 OK`**: `{ user, expiresAt }` med profiluppgifter och sessionens utgångstid.
- **`401 Unauthorized`**: Saknar giltig sessionscookie eller sessionen har spärrats.

#### `POST /api/auth/logout`
- **Åtkomst:** Sessionscookie och `X-CSRF-Protection: 1`. Även anrop utan session accepteras.
- **`200 OK`**: Sessionen har spärrats på servern och cookien rensats.
- **`403 Forbidden`**: CSRF-kontrollen misslyckades.
- **`500 Server Error`**: Sessionen kunde inte spärras. Cookien behålls för ett nytt försök.

---

### 🎬 Filmer (`/api/movies`)

#### `GET /api/movies`
- **Åtkomst:** Publik (alla)
- **`200 OK`**: Returnerar lista med alla filmer och genrer.

#### `GET /api/movies/:id`
- **Åtkomst:** Publik (alla)
- **`200 OK`**: Returnerar detaljer för en specifik film.
- **`400 Bad Request`**: Ogiltigt film-ID (måste vara ett positivt heltal).
- **`404 Not Found`**: Filmen hittades inte.

#### `POST /api/movies`
- **Åtkomst:** Admin
- **`201 Created`**: Filmen skapad.
- **`400 Bad Request`**: Valideringsfel (tom titel, längd ≤ 0, ogiltig URL eller datum).
- **`401 Unauthorized`**: Inte inloggad.
- **`403 Forbidden`**: Inte admin (`role !== 'admin'`).

#### `PUT /api/movies/:id`
- **Åtkomst:** Admin
- **`200 OK`**: Filmen uppdaterad.
- **`400 Bad Request`**: Ogiltigt film-ID eller valideringsfel.
- **`401 Unauthorized`**: Inte inloggad.
- **`403 Forbidden`**: Inte admin.
- **`404 Not Found`**: Filmen hittades inte.

#### `DELETE /api/movies/:id`
- **Åtkomst:** Admin
- **`200 OK`**: Filmen borttagen.
- **`401 Unauthorized`**: Inte inloggad.
- **`403 Forbidden`**: Inte admin.
- **`404 Not Found`**: Filmen hittades inte.
- **`409 Conflict`**: Kan inte ta bort filmen eftersom den har schemalagda visningar.

---

### 🏛️ Salonger (`/api/cinemas`)

#### `GET /api/cinemas`
- **Åtkomst:** Publik (alla)
- **`200 OK`**: Returnerar alla salonger med ID, namn och totalt antal stolar.

#### `GET /api/cinemas/:id`
- **Åtkomst:** Publik (alla)
- **`200 OK`**: Returnerar salong med fullständig lista av stolar (rad & stolnummer).
- **`400 Bad Request`**: Ogiltigt salongs-ID.
- **`404 Not Found`**: Salongen hittades inte.

#### `POST /api/cinemas`
- **Åtkomst:** Admin
- **`201 Created`**: Salongen skapad och stolar automatiskt genererade (rader och stolar per rad).
- **`400 Bad Request`**: Valideringsfel (namn saknas, rader < 1 eller > 26, stolar per rad < 1 eller > 50).
- **`401 Unauthorized`**: Inte inloggad.
- **`403 Forbidden`**: Inte admin.
- **`409 Conflict`**: En salong med det namnet finns redan.

#### `PUT /api/cinemas/:id`
- **Åtkomst:** Admin
- **`200 OK`**: Salongsnamnet uppdaterat.
- **`400 Bad Request`**: Ogiltigt ID eller tomt namn.
- **`401 Unauthorized`**: Inte inloggad.
- **`403 Forbidden`**: Inte admin.
- **`404 Not Found`**: Salongen hittades inte.
- **`409 Conflict`**: Namnet är upptaget av en annan salong.

#### `DELETE /api/cinemas/:id`
- **Åtkomst:** Admin
- **`200 OK`**: Salongen och dess stolar borttagna.
- **`401 Unauthorized`**: Inte inloggad.
- **`403 Forbidden`**: Inte admin.
- **`404 Not Found`**: Salongen hittades inte.
- **`409 Conflict`**: Kan inte ta bort salongen eftersom den har schemalagda visningar.

---

### 🎟️ Visningar & Platser (`/api/screenings`)

#### `GET /api/screenings`
- **Åtkomst:** Publik (alla)
- **`200 OK`**: Returnerar kommande visningar baserat på filter.
- **`400 Bad Request`**: Felaktiga parametrar (t.ex. både `when` och `date` samtidigt).

#### `GET /api/screenings/today`
- **Åtkomst:** Publik (alla)
- **`200 OK`**: Returnerar dagens kvarvarande visningar.
- **`400 Bad Request`**: Ogiltiga filterparametrar.

#### `GET /api/screenings/:id/seats`
- **Åtkomst:** Publik (alla)
- **`200 OK`**: Returnerar stolskarta (`available` / `booked`).
- **`400 Bad Request`**: Ogiltigt visnings-ID.
- **`404 Not Found`**: Visningen hittades inte.

#### `POST /api/screenings`
- **Åtkomst:** Admin
- **`201 Created`**: Visningen schemalagd.
- **`400 Bad Request`**: Starttiden är i dåtid eller har ogiltigt datumformat.
- **`401 Unauthorized`**: Inte inloggad.
- **`403 Forbidden`**: Inte admin.
- **`404 Not Found`**: Salong eller film existerar inte.
- **`409 Conflict`**: Visningen krockar med en annan visning i salongen (inkl. 20 min städbuffert).

#### `PUT /api/screenings/:id`
- **Åtkomst:** Admin
- **`200 OK`**: Visningen uppdaterad.
- **`400 Bad Request`**: Ogiltigt ID, ogiltigt format eller starttid i dåtid.
- **`401 Unauthorized`**: Inte inloggad.
- **`403 Forbidden`**: Inte admin.
- **`404 Not Found`**: Visning, salong eller film hittades inte.
- **`409 Conflict`**: Tidsöverlappning med annan visning i salongen, eller försöker byta salong/tid när det redan finns bokningar.

#### `DELETE /api/screenings/:id`
- **Åtkomst:** Admin
- **`200 OK`**: Visningen borttagen.
- **`401 Unauthorized`**: Inte inloggad.
- **`403 Forbidden`**: Inte admin.
- **`404 Not Found`**: Visningen hittades inte.
- **`409 Conflict`**: Kan inte ta bort visningen eftersom den har aktiva bokningar.


---

### 🍿 Kiosk & Meny (`/api/kiosk` & `/api/menu`)

#### `GET /api/kiosk`
- **Åtkomst:** Publik (alla)
- **`200 OK`**: Returnerar aktiva kioskvaror och menyer.

#### `GET /api/kiosk/:id`
- **Åtkomst:** Publik (alla)
- **`200 OK`**: Returnerar enskild vara med menyinnehåll.
- **`400 Bad Request`**: Ogiltigt ID-format.
- **`404 Not Found`**: Kioskvaran hittades inte eller är slutsåld.

#### `GET /api/menu`
- **Åtkomst:** Publik (alla) – stödjer `?all=true` för Admin
- **`200 OK`**: Returnerar tillgängliga mat/dryck/combos med `contents`.

#### `GET /api/menu/:id`
- **Åtkomst:** Publik (alla)
- **`200 OK`**: Returnerar enskild menyartikel med dess innehåll.
- **`400 Bad Request`**: Ogiltigt ID-format.
- **`404 Not Found`**: Artikeln hittades inte eller är inaktiv.

#### `GET /api/admin/menu-items`
- **Åtkomst:** Admin (`requireAdmin`)
- **`200 OK`**: Returnerar alla menyartiklar inklusive dolda/slut i lager.
- **`401 Unauthorized`**: Inte inloggad.
- **`403 Forbidden`**: Inte administratör.

#### `POST /api/admin/menu-items` (även tillgänglig via `POST /api/menu`)
- **Åtkomst:** Admin (`requireAdmin`)
- **`201 Created`**: Skapar en ny menyartikel eller combo med ingående artiklar.
- **`400 Bad Request`**: Valideringsfel (combo saknar artiklar, vanlig vara har innehåll, ogiltig artikel-referens).
- **`401 Unauthorized`**: Inte inloggad.
- **`403 Forbidden`**: Inte administratör.
- **`409 Conflict`**: En menyartikel med detta namn finns redan.

#### `PATCH /api/admin/menu-items/:id` (även tillgänglig via `PATCH /api/menu/:id`)
- **Åtkomst:** Admin (`requireAdmin`)
- **`200 OK`**: Uppdaterar namn, beskrivning, pris eller lagerstatus (`isAvailable`).
- **`400 Bad Request`**: Skickade inga fält att uppdatera eller ogiltigt värde.
- **`401 Unauthorized`**: Inte inloggad.
- **`403 Forbidden`**: Inte administratör.
- **`404 Not Found`**: Menyartikeln hittades inte.
- **`409 Conflict`**: Namnet är upptaget av en annan artikel.

---

### 📋 Bokningar (`/api/bookings`)

#### `POST /api/bookings`
- **Åtkomst:** Inloggad användare med verifierad e-post. Gästen använder det separata förfrågningsflödet nedan.
- **Header:** `Idempotency-Key: <UUID>`. Återanvänd samma nyckel vid återförsök av samma payload.
- **`201 Created`**: Bokningen genomförd (`bookingRef`, `totalPrice`, bekräftelsemejl skickas).
- **`400 Bad Request`**: Ogiltig nyckel, färre än 1 eller fler än 10 biljetter, dubblett av stol, eller slutsåld kioskvara.
- **`403 Forbidden`**: E-postadressen är inte verifierad eller en gäst försöker boka direkt.
- **`409 Conflict`**: Platser upptagna, aktiv bokningskvot uppnådd eller en nyckel återanvänds med ändrat innehåll.
- **`429 Too Many Requests`**: För många försök; svaret innehåller `Retry-After`.

#### Gästförfrågan och e-postbekräftelse

- `POST /api/bookings/guest/request`: samma bokningspayload, obligatorisk e-post och `Idempotency-Key` (UUID). Returnerar `202` efter lyckat mejlutskick. Skapar endast en kortlivad `guest_booking_intent`; inga bokningar eller biljetter skapas och inga platser reserveras.
- `POST /api/bookings/guest/preview`: `{ token }`. Visar den aktuella förfrågans sammanfattning utan att konsumera länken eller skapa en bokning.
- `POST /api/bookings/guest/confirm`: `{ token, seatIds?: number[] }`. Skapar högst en bokning efter uttrycklig bekräftelse och kontrollerar åter ledighet och kvoter. `seatIds` kan användas för andra platser till samma visning; antal och biljettkategorier är bundna till förfrågan. Identiska återförsök ger samma bokning, inte en ny.
- Token är slumpmässiga, hashade i databasen och giltiga i högst 10 minuter. Ogiltiga/utgångna länkar ger `400`, plats-/kvotkonflikter `409`, för många försök `429` och otillgänglig e-post `503`. Inga riktiga bokningar skapas när mejlutskick misslyckas.
- Länken ligger i ett URL-fragment och ska avlägsnas ur historiken av SPA:n. Token får inte användas som konto- eller adminautentisering. Gästförfrågningar blandas aldrig in i vanliga adminbokningar eller statistik.

### Driftsättning av bokningsskydd

Kör `npm run migrate:bookings` i en befintlig databas före den nya applikationsversionen. Migreringen är additiv och kan upprepas; den raderar inte bokningar, platser eller lösenord. Nya installationer har samma tabeller och index i `01_schema.sql` och RLS i `03_security.sql`.

SMTP enligt avsnittet om autentiseringsmejl krävs för gästbekräftelse. Ingen Ethereal-fallback används för verifieringslänkar. Befintliga overifierade konton måste verifieras för nya medlemsbokningar; äldre bokningar behålls. Kvoter kan därför blockera nya bokningar för ett konto som redan ligger över gränsen, inklusive demokonton.

Standardvärden och framtida adminkrav finns i [design/booking-security.md](../design/booking-security.md). Konfiguration: `BOOKING_ATTEMPTS_PER_15_MIN=3`, `BOOKING_IP_ATTEMPTS_PER_15_MIN=30`, `BOOKING_GLOBAL_ATTEMPTS_PER_15_MIN=300`, `BOOKING_MAX_SEATS_PER_SCREENING=10`, `BOOKING_MAX_UNPAID_BOOKINGS=3`, `BOOKING_MAX_UNPAID_SEATS=20`, `BOOKING_EMAILS_PER_15_MIN=3`, `BOOKING_EMAIL_COOLDOWN_SECONDS=60`, `BOOKING_GLOBAL_EMAILS_PER_15_MIN=60`, `BOOKING_GUEST_LINK_MINUTES=10`.

`TRUST_PROXY` är tom som standard: klientens `X-Forwarded-For` används då inte. Bakom en proxy anger driften endast betrodda IP-adresser/CIDR eller explicita Express-proxyintervall, separerade med komma. Sätt inte en generell `true` eller ett obegränsat proxyintervall.

Servern städar utgångna förfrågningar och begränsningsposter vid start och varje minut. `npm run cleanup:bookings` kan också köras schemalagt. Utgångskontroll görs alltid vid anrop, oberoende av städningen.

Obetalda bokningar visas som `reserved` tills en timme före filmstart. Därefter blir de `expired` och platserna släpps. Nya obetalda nätreservationer stoppas vid samma gräns. Betalda bokningar behåller sina platser även vid sen ankomst. Sen betalning i kassan kräver en ny ledighetskontroll och kan göras före filmens sluttid: `PATCH /api/bookings/:id/pay` återtar de ursprungliga platserna om de är lediga, eller tar emot `seatIds` med lika många andra lediga platser. Samma stöd finns i den generella admin-PATCH-rutten med `isPaid: true`. Incheckning kräver betalning. All platstilldelning och betalning sker atomärt; konflikter ger 409 utan betalning eller poäng.

Kör `npm run migrate:bookings` före start med denna version. Migreringen lägger till `ticket.is_active`, behåller historiska biljettuppgifter och säkrar med ett unikt index att en stol bara kan ha en aktiv biljett per visning. API och platskartor kontrollerar tidsgränsen även om städjobbet inte körts. Serverns befintliga minutjobb släpper reservationerna i databasen. Obetalda utgångna bokningar behålls till sju dagar efter filmens sluttid och raderas sedan med biljetter och kioskbeställningar via befintliga kaskadregler. Betalda och avbokade bokningar behålls. Idempotensnyckeln följer bokningen tills den rensas.

Bokningsskyddets integrationstester ingår i `npm test` med `AUTH_TEST_DATABASE_URL` och körs i ett eget slumpmässigt schema. De skickar inga riktiga mejl och använder aldrig applikationens databas som reserv. Adminfunktioner för flaggning och avbokning är enbart dokumenterade framtida krav i denna ändring.

Kundavbokning använder betalstatus: betalda bokningar har två timmars avbokningsgräns; obetalda reservationer kan avbokas fram tills stolarna släpps en timme före start. Vid själva frisläppningstidpunkten kan de inte längre avbokas.

### Automatiska uteblivandevarningar och reservationsspärrar

`npm run migrate:bookings` inkluderar `20261116_booking_warnings.sql`. Den skapar `booking_warning_policy`, `booking_warning` och `booking_reservation_block` med RLS. `activated_at` sätts en gång vid införande och bevaras vid omkörning. Både bokning och filmens sluttid måste vara efter aktivering; äldre demo-/historikbokningar får inga retroaktiva varningar.

Efter filmens slut får en fortfarande obetald, ej avbokad bokning exakt en varning. Betalning och varningsregistrering använder bokningsradens transaktionslås. En varning per bokning säkras av `source_booking_id` och kan inte försvinna när bokningen rensas. Tre nya, giltiga varningar inom 90 dagar ger en beständig 30-dagarsspärr. De tre används sedan inte igen för att återstarta spärren; nya uteblivanden krävs. Utgångna och rättade varningar räknas inte. Gäst-/medlemsbokningar delar normaliserad e-post och kontokoppling.

Spärren kontrolleras före medlemsbokning, gästförfrågan och gästbekräftelse samt i reservationens transaktion. `403` nekar nya obetalda reservationer utan att röja varningshistorik eller spärrens exakta sluttid i offentliga formulär. Sessionsinloggning, avbokning och betalning av befintliga bokningar påverkas inte. Nya betalda kassaköp ska tillåtas när deras admin-API byggs.

- `GET /api/bookings/reservation-status` kräver session och använder dess konto/e-post. Svaret innehåller `warningCount`, `warningLimit: 3`, `windowDays: 90`, `blockDays: 30`, `blockedUntil` samt de senaste 90 dagarnas giltiga varningar med `id`, `bookingRef`, `screeningEndedAt`, `recordedAt` och `usedForBlock`. Räknaren visar nya varningar i aktuell omgång; redan förbrukade varningar finns endast i historiken. Under aktiv spärr visas tre av tre.
- `POST /api/bookings/guest/preview` innehåller samma struktur i `reservationStatus` först efter att gästlänken verifierats. En gammal länk kringgår inte spärrkontrollen vid bekräftelse.
- `cleanupBookingProtection` registrerar uteblivanden före bokningarnas sjudagarsrensning. Serverns minutjobb och `npm run cleanup:bookings` levererar dessutom mejlkön. Varningar beräknas också vid status- och reservationskontroller, så skyddet beror inte på att minutjobbet hunnit köras.
- Mejlen är tvåspråkiga och använder befintliga `EMAIL_*`-inställningar utan Ethereal-fallback. Saknad SMTP lämnar mejlet i kö. Fel ger återförsök efter 15 minuter; högst tio mejl behandlas per körning. Radlås hindrar samtidiga arbetare från att skicka samma köpost och ett stabilt `Message-ID` används. SMTP ger ingen absolut exakt-en-gång-garanti om processen kraschar efter lyckad leverans men före databasens kvittens; själva varningen/spärren dubbleras aldrig av mejlåterförsök.

**Kvar för adminarbetet:** En liten varningssektion i kundens detaljvy/modal i Admin/Bokningar, rättelse-/hävnings-API, obligatorisk motivering, omräkning och administrativ granskningslogg. Ingen separat varningssida, route eller navigationsflik ska byggas. Databasfälten `revoked_at` och `revocation_reason` är förberedda, men ingen sådan adminfunktion är exponerad. Se [Admin/Bokningar – varningar och reservationsspärr](../design/pages/admin-bokningar.md#uteblivna-besök-varningar-och-reservationsspärr--automatik-och-framtida-adminhantering).

#### `GET /api/bookings/me`
- **Åtkomst:** Inloggad användare
- **`200 OK`**: Lista med den inloggades bokningar.
- **`401 Unauthorized`**: Inte inloggad.

#### `GET /api/bookings/lookup?reference=...`
- **Åtkomst:** Admin
- **`200 OK`**: Fullständiga detaljer för bokningsreferensen.
- **`400 Bad Request`**: Saknar referens i anropet.
- **`401 Unauthorized`**: Inte inloggad.
- **`403 Forbidden`**: Inte admin.
- **`404 Not Found`**: Bokningsreferensen hittades inte.

#### `POST /api/bookings/cancel-preview`
- **Åtkomst:** Publik via `/avboka`. Skicka `{ "bookingRef": "FV-ABCDE", "email": "kund@example.se" }` i JSON-body med `X-CSRF-Protection: 1`. GET och token-body stöds inte längre; gamla avbokningslänkar visar formuläret.
- **`200 OK`**: Hämtar film, salong, stolar och bokningsnr till bekräftelsemodalen.
- **`400 Bad Request`**: Ogiltiga fält, redan avbokad, släppt obetald reservation eller mindre än 2 timmar kvar till start för en betald bokning. Bokningsstatus kontrolleras först när referens och e-post matchar.
- **`403 Forbidden`**: CSRF-skyddet nekar anropet.
- **`404 Not Found`**: Både saknad referens och fel e-post ger exakt `Vi hittade ingen bokning som matchar angivet bokningsnummer och e-postadress.`
- **`429 Too Many Requests`**: Global/IP-gräns eller fem försök per normaliserad bokningsreferens/e-post under 15 minuter. Referens- och e-postgränserna delas med bekräftelserutten och gäller även vid IP-byte. Svaret innehåller `Retry-After: 900`.

#### `POST /api/bookings/cancel-by-token`
- **Åtkomst:** Publik med samma body, CSRF-skydd och försöksgränser som `cancel-preview`. Ruttnamnet behålls, men ingen token används.
- **`200 OK`**: Bokningen avbokad och stolarna frigjorda.
- **`400` / `403` / `404` / `429`**: Samma villkor som för förhandsgranskningen. Identitet, status och tidsgräns verifieras igen med bokningsraden låst i en transaktion. Betalda medlemsbokningars lojalitetspoäng dras av atomärt tillsammans med att biljetter raderas och bokningen markeras avbokad.

#### `DELETE /api/bookings/:id`
- **Åtkomst:** Inloggad användare
- **`200 OK`**: Bokningen avbokad och stolarna frigjorda.
- **`400 Bad Request`**: Ogiltigt ID, redan avbokad, släppt obetald reservation eller mindre än 2 timmar kvar till start för en betald bokning.
- **`401 Unauthorized`**: Inte inloggad.
- **`404 Not Found`**: Bokningen hittades inte eller tillhör en annan användare.

#### `PATCH /api/bookings/:id/pay`
- **Åtkomst:** Admin (`requireAdmin`)
- **Beskrivning:** Registrerar betalning som redan tagits emot i kassan (`is_paid = true`, `status = 'confirmed'`, första `paid_at` bevaras). Anropet tar inte betalt via en betaltjänst och checkar inte in kunden.
- **Body:** Valfri `{ "seatIds": [41, 42] }` för andra platser på en obetald bokning. Utan `seatIds` används de ursprungliga platserna. Antal och biljettkategorier behålls; stolarna måste vara olika och tillhöra rätt salong. Backend matchar listan mot befintliga biljetter i stigande `seat_id`-ordning.
- **Sen kund:** Från en timme före filmstart är obetalda reservationer släppta. Betalning kan registreras före filmens sluttid endast om samtliga önskade platser kan tilldelas atomärt. Samma genomförda betalningsanrop med samma platser kan upprepas utan nya poäng. En redan betald bokning kan inte byta platser genom denna åtgärd.
- **Lojalitetspoäng:** Om bokningen tillhör en registrerad medlem (`user_id IS NOT NULL`) tilldelas medlemmen automatiskt 1 lojalitetspoäng per krona (1 SEK = 1 poäng baserat på `totalPrice`). Idempotent: om bokningen redan är betald delas inga dubbla poäng ut (`pointsAwarded: 0`). Gästbokningar ger 0 poäng till användarkonton.
- **`200 OK`**: `{ success: true, message: "Bokningen har markerats som betald.", booking, pointsAwarded: number }`
- **`400 Bad Request`**: Avbokad bokning eller ogiltigt platsval.
- **`409 Conflict`**: Platser upptagna eller filmen har slutat; ingen betalning eller poängtilldelning genomförs.
- **`401 Unauthorized`**: Inte inloggad.
- **`403 Forbidden`**: Inte admin.
- **`404 Not Found`**: Bokningen hittades inte.

#### `PATCH /api/bookings/:id/checkin`
- **Åtkomst:** Admin (`requireAdmin`)
- **Beskrivning:** Checkar in kunden (`is_checked_in = true`, `checked_in_at = now()`). Kräver betald bokning; registrerar inte betalning. För uttrycklig kombinerad betalning och incheckning används `PATCH /api/bookings/:id` med `{ "isPaid": true, "isCheckedIn": true }` och vid behov `seatIds`.
- **`200 OK`**: `{ success: true, message: "Bokningen har checkats in.", booking }`
- **`400 Bad Request`**: Bokningen är avbokad.
- **`409 Conflict`**: Bokningen är obetald eller den obetalda bokningens film har slutat.
- **`401 Unauthorized`**: Inte inloggad.
- **`403 Forbidden`**: Inte admin.
- **`404 Not Found`**: Bokningen hittades inte.




## Network performance

- Text and JSON responses of at least 1 KiB (plus streamed text) negotiate Brotli or gzip using `node:zlib`. Encodings respect client quality values; `Vary: Accept-Encoding` separates representations. Images, ranges, HEAD and `no-transform` pass through.
- Content-addressed `/uploads/media-<hash>.webp` files use `Cache-Control: public, max-age=604800, immutable`. Other uploads retain their existing cache policy.
- `GET /api/movies?compact=true` returns card/hero fields without cast biographies, gallery images or reviews. Omitting `compact` preserves the full legacy list. Movie detail includes `production_countries`, `production_year`, `distributor`, `language` (stored as `audio_language`), `subtitles`, `images`, `youtube_trailers` and `reviews: [{ source, quote, stars, max }]`.
- `GET /api/cinemas?includeSeats=true` includes all seat maps in one database query and HTTP request. Both numeric `seatsPerRow` plus `rows` and array layouts (with optional matching `rows`) are accepted. API layouts are derived from seats so they cannot drift from actual capacity.
- The frontend caches only public movie/cinema/screening data in memory, deduplicates requests and shows stale data during revalidation. Movies/cinemas are fresh for 60 seconds; screening availability for 10 seconds. Focus/visibility revalidates stale entries; successful mutations invalidate public data. Account, booking, dashboard and individual screening-seat requests are not shared through this cache; booking still validates seats on the server.
- Only the active hero image mounts. Background YouTube waits five seconds and is disabled on `saveData`, slow-2g/2g/3g and reduced motion. Manual trailer playback remains available. Unknown connection types use the delay.
- Movie routes and vendor bundles are split. Google Fonts load as a print stylesheet and an external CSP-compatible script enables the loaded sheet; fallback fonts render immediately.

Validation: `npm run build`, `npm test` (set `AUTH_TEST_DATABASE_URL` to enable PostgreSQL integration tests), `npm run seed:demo`, `npm run seed:check` in Backend; `npm run lint`, `npm test`, `npm run build` in Frontend. Use an isolated database for tests and seed verification. For browser timing comparisons, select Fast 4G / 3G in DevTools, disable the browser cache for cold loads, and inspect transferred bytes and requests; do not treat local build sizes as measured mobile loading times.

### Intermittent connection failures

The PostgreSQL pool handles idle-client errors and logs only their error code. Network partitions can otherwise emit an unhandled pool error (see [node-postgres pooling](https://node-postgres.com/features/pooling)). New database connections and waits for a pool slot time out after five seconds; TCP keepalive is enabled. This does not establish the cause of any particular production reset: compare the error timestamp with PM2 restarts, Node logs and Caddy logs.

The frontend retries a failed GET once after 200 ms only when fetch or response-body reading reports a network `TypeError`. Writes, HTTP errors, malformed JSON, cancelled requests and requests from a previous session are not retried. An interrupted successful response is surfaced as an error rather than being cached as null. `smoke` now prints the failing URL and underlying cause, and limits each request to 20 seconds.

TMDB poster images expose responsive width candidates, following [TMDB image URL sizes](https://developer.themoviedb.org/docs/image-basics). Film cards supply their rendered slot width; uploads and non-TMDB media retain their original URLs. This reduces oversized downloads when a smaller candidate fits the screen. Production still needs image localization if the database contains external artwork URLs; deploy code and applying the schema migration alone do not rewrite existing media or cinema seat data.
