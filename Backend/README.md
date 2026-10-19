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
- **`201 Created`**: Kontot skapat. Returnerar JWT-token och användaruppgifter.
- **`400 Bad Request`**: Ogiltig e-postadress eller lösenord (< 8 eller > 72 tecken).
- **`409 Conflict`**: E-postadressen är redan registrerad.
- **`500 Server Error`**: Databas- eller serverfel.

#### `POST /api/auth/login`
- **Åtkomst:** Publik (alla)
- **`200 OK`**: Inloggningen lyckades. Returnerar JWT-token.
- **`400 Bad Request`**: Saknar e-post eller lösenord.
- **`401 Unauthorized`**: Fel e-postadress eller lösenord.
- **`500 Server Error`**: Internt serverfel.

#### `GET /api/auth/me`
- **Åtkomst:** Inloggad användare
- **`200 OK`**: Profiluppgifter för den inloggade användaren.
- **`401 Unauthorized`**: Saknar eller ogiltig Bearer-token.

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
- **Åtkomst:** Gäst eller Inloggad
- **`201 Created`**: Bokningen genomförd (`bookingRef`, `totalPrice`, bekräftelsemejl skickas).
- **`400 Bad Request`**: Saknar e-post för gäst, färre än 1 eller fler än 10 biljetter, dubblett av stol, eller slutsåld kioskvara.
- **`409 Conflict`**: En eller flera stolar är redan bokade av någon annan.

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

#### `GET /api/bookings/cancel-preview?token=...`
- **Åtkomst:** Publik (via länk i bekräftelsemejl)
- **`200 OK`**: Hämtar film, salong, stolar och bokningsnr till bekräftelsemodalen.
- **`400 Bad Request`**: Ogiltig/utgången länk, redan avbokad, eller mindre än 2 timmar kvar till start.
- **`403 Forbidden`**: E-postadressen matchar inte bokningen.
- **`404 Not Found`**: Bokningen hittades inte.

#### `POST /api/bookings/cancel-by-token`
- **Åtkomst:** Publik (via länk i bekräftelsemejl)
- **`200 OK`**: Bokningen avbokad och stolarna frigjorda.
- **`400 Bad Request`**: Ogiltig/utgången länk, redan avbokad, eller mindre än 2 timmar kvar till start.
- **`403 Forbidden`**: E-postadressen matchar inte bokningen.
- **`404 Not Found`**: Bokningen hittades inte.

#### `DELETE /api/bookings/:id`
- **Åtkomst:** Inloggad användare
- **`200 OK`**: Bokningen avbokad och stolarna frigjorda.
- **`400 Bad Request`**: Ogiltigt ID, redan avbokad, eller mindre än 2 timmar kvar till start.
- **`401 Unauthorized`**: Inte inloggad.
- **`404 Not Found`**: Bokningen hittades inte eller tillhör en annan användare.


