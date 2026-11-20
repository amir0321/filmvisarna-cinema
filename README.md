# Filmvisarna Cinema

A modern full-stack cinema booking application built with React, TypeScript, Express 5, and PostgreSQL.

For a single Node server serving both the API and built frontend, run `npm run setup`, `npm run build` and `npm start` from the repository root. See [Gå live: build, images, screening refill and VPS deployment](deploy/README.md) for configuration and the team checklist.

---

## Målgruppsbeskrivning

Filmvisarna är en mindre lokal biograf i Småstad. Eftersom biografen riktar sig till invånarna på orten är målgruppen bred och består av allt från ungdomar och vuxna till barnfamiljer och pensionärer. Gemensamt för besökarna är att de snabbt vill kunna se vilka filmer som går, kolla en trailer och boka platser utan krångel.

Vi har anpassat gränssnittet efter målgruppen på följande sätt:

- **Barnfamiljer:** Det går att filtrera visningar direkt på åldersgräns (barntillåten, 7, 11 och 15 år) och datum på startsidan och filmsidan. På så sätt slipper föräldrar klicka sig in på filmer som barnen ändå inte får se. Barnbiljetter (80 kr) väljs direkt i bokningssteget.
- **Äldre besökare och pensionärer:** Tydlig typografi, hög kontrast (både mörkt och ljust tema finns) och ett rakt bokningsflöde där pensionärspris (120 kr) är tydligt utskrivet. Man behöver inte heller betala online med kort eller BankID, utan bokar sina platser på webben och betalar på plats i kassan med sitt bokningsnummer.
- **Sällskap och vanliga biobesökare:** Salongskartan markerar automatiskt bästa lediga sammanhängande platser utifrån hur många biljetter man valt, men det är enkelt att klicka om man vill sitta på en annan rad. Rullstolsplatser är tydligt markerade i stolskartan.
- **Mobil- och datoranvändare:** Många kollar visningstider i mobilen. Därför är hela sajten responsiv med anpassad bottenmeny och tydliga knappar på mindre skärmar, samtidigt som man får bra överblick på vanlig datorskärm.
- **Både gäster och återkommande besökare:** Den som bara vill boka snabbt kan boka som gäst med sin e-postadress och få bokningsbekräftelse på mejl. Den som går på bio ofta kan skapa konto för att samla sina bokningar, se historik och avboka direkt under *Mina bokningar*.

---

## Tidsplan och arbetssätt

Projektet har drivits agilt i sprintar med fokusområdena från kursens lektionsplanering. Vi har haft dagliga standups när vi arbetat tillsammans, estimerat kort med planning poker, parprogrammerat vid klurigare delar och avslutat sprinterna med demo för produktägaren samt retrospektiv.

Under den första planeringen i början av projektet använde vi **Trello** för att strukturera backloggen och våra första tasks. Inför de två följande planeringarna och resten av utvecklingen flyttade vi över planeringen till **GitHub Projects**, eftersom det var smidigare att ha sprinttavlan på samma ställe som våra feature-branches och pull requests.

| Sprint / fas | Fokusområde | Vad som gjordes |
| :--- | :--- | :--- |
| **Sprint 1** | UX, wireframes & prototyp | Genomgång av user stories och konkurrenter (Filmstaden, Kino). Första planeringen i Trello. Framtagning av målgruppsbeskrivning, wireframes och klickbar prototyp i Figma för både mobil och desktop som godkändes av produktägaren. |
| **Sprint 2** | Backend & databas | Planeringen flyttades till GitHub Projects. Databasschema i PostgreSQL (Supabase), tabeller, vyer och seed-data för salonger, stolar, filmer och visningar. REST-API i Node.js/Express med TypeScript samt Postman-tester. |
| **Sprint 3** | MVP (Frontend + Backend) | Grundstruktur i React med TypeScript, Bootstrap och Sass. Koppling mot API:et för startsidan, filmsidan, filmdetaljer med trailer, datum-/åldersfilter och första versionen av bokningsflödet med stolskarta. |
| **Sprint 4** | Färdig produkt & konton | Inloggning, registrering, *Mina bokningar*, avbokning (både via konto och för gäster), mejlutskick med bokningsnummer, cookie-ruta enligt GDPR samt responsiva justeringar. |
| **Sprint 5** | Buggfix, admin & finslipning | Admin-gränssnitt (bokningar/kassa, visningsschema, filmer, salonger och kiosk), ljust/mörkt tema, språkstöd (svenska/engelska), extra bokningsskydd, tester och sista buggfixar inför inlämning. |

---

## Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **Bundler & Dev Server:** Vite
- **Styling:** Bootstrap 5 + Sass (SCSS)
- **Routing:** React Router (file-based dynamic routing via `import.meta.glob`)

### Backend
- **Runtime & Language:** Node.js + TypeScript
- **Framework:** Express 5
- **Database:** PostgreSQL with connection pooling (`pg`)
- **Security:** Helmet, CORS, bcrypt (12 rounds), JWT (HS256)
- **Validation:** Zod for all query params and request bodies
- **Transactions:** Native PostgreSQL transaction support for seat reservation and booking safety
- **Email Service:** Nodemailer HTML email confirmations
- **Runner:** `tsx` for fast development with hot-reloading

---

## Project Structure

```text
filmvisarna-cinema/
├── Backend/
│   ├── sql/                      # PostgreSQL schema, views, security, seed scripts
│   │   ├── 00_drop.sql
│   │   ├── 01_schema.sql         # Core database schema & constraints
│   │   ├── 02_views.sql          # Screening times & booking total views
│   │   ├── 03_security.sql       # Row level security definitions
│   │   └── 04_seed.sql           # Initial seed data (movies, cinemas, kiosk items)
│   ├── src/
│   │   ├── controllers/          # Request handling & input validation (Zod)
│   │   │   ├── bookings.controller.ts
│   │   │   └── kiosk.controller.ts
│   │   ├── middleware/           # Auth & Role verification (requireAuth, requireAdmin)
│   │   │   └── auth.ts
│   │   ├── routes/               # Express route endpoints
│   │   │   ├── auth.ts
│   │   │   ├── bookings.ts
│   │   │   ├── kiosk.routes.ts
│   │   │   ├── movies.ts
│   │   │   └── screenings.ts
│   │   ├── services/             # Business logic & database operations
│   │   │   ├── bookings.service.ts
│   │   │   ├── emailService.ts
│   │   │   ├── kiosk.service.ts
│   │   │   └── movies.service.ts
│   │   ├── templates/            # HTML email confirmation templates
│   │   ├── tests/                # Automated unit tests
│   │   ├── utils/                # Date ranges, unique booking references, error classes
│   │   ├── app.ts                # Express app setup & error handling
│   │   ├── config.ts             # Central typed configuration & env validation
│   │   ├── db.ts                 # PostgreSQL pool connection
│   │   ├── seed.ts               # Programmatic database seeder
│   │   └── server.ts             # Server entry point
│   ├── .env.example              # Template for environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── Frontend/
│   ├── src/
│   │   ├── components/           # UI Components (Header, etc.)
│   │   ├── pages/                # File-based pages (Home, Movies, etc.)
│   │   ├── App.tsx               # Main application shell
│   │   ├── index.scss            # Global Sass & Bootstrap styling
│   │   ├── main.tsx              # React entry point
│   │   └── routes.tsx            # Dynamic route generator
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts            # Vite config with API proxy (/api -> :3000)
│
├── postman/                      # Complete Postman Collection
│   └── collections/              # Requests for Auth, Bookings, Kiosk, Movies, Screenings
├── docker-compose.yml            # Local PostgreSQL service
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm
- Docker (optional for local DB, or use cloud PostgreSQL like Supabase / Neon)

---

### 1. Database Setup

Choose one of the following options:

#### Option A: Local Docker (Offline development)
```bash
docker compose up -d
```
Starts PostgreSQL on `localhost:5432` with username `postgres`, password `postgrespassword`, and database `filmvisarna`.

#### Option B: Cloud PostgreSQL (Recommended for team collaboration)
Configure `DATABASE_URL` in `Backend/.env` to point to your Supabase or Neon instance:
```env
DATABASE_URL=postgresql://user:password@host:5432/filmvisarna?sslmode=require
```

---

### 2. Backend Setup

```bash
cd Backend
npm install
cp .env.example .env    # Configure your DATABASE_URL and JWT_SECRET
npm run dev
```

The backend server runs on `http://localhost:3000`.

#### Useful Backend Commands:
- `npm run dev`: Start development server with hot-reload (`tsx watch`).
- `npm run build`: Compile TypeScript to `dist/`.
- `npm run start`: Run compiled server from `dist/server.js`.
- `npm run seed`: Run database seeder for cinemas, seats, and movies.
- `npm run create-admin -- <email> <password>`: Create an admin user or promote an existing account.
- `node --import tsx --test src/tests/*.test.ts`: Run the unit test suite.

---

### 3. Frontend Setup

In a new terminal window:
```bash
cd Frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.  
Vite automatically proxies all `/api` requests to `http://localhost:3000`.

---

## API Endpoints

### 🩺 System
| Method | Endpoint | Access | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | `200`, `500` | Health check and server status |

### 🔐 Authentication
| Method | Endpoint | Access | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | `201`, `400`, `409`, `500` | Register account (sets HttpOnly session cookie; returns user and expiry) |
| `POST` | `/api/auth/login` | Public | `200`, `400`, `401`, `500` | Login (sets HttpOnly session cookie; returns user and expiry) |
| `POST` | `/api/auth/logout` | Session cookie | `200`, `403`, `500` | Revoke current server session and clear its cookie; requires CSRF header |
| `GET` | `/api/auth/me` | Logged In | `200`, `401`, `500` | Get profile of authenticated user (name, email, phone, points, isVerified) |
| `PUT` | `/api/auth/me` | Logged In | `200`, `400`, `401`, `500` | Update profile (name, phone) |
| `POST` | `/api/auth/change-password` | Logged In | `200`, `400`, `401`, `500` | Change password (`currentPassword`, `newPassword`) |
| `POST` | `/api/auth/verify-email` | Logged In | `200`, `401`, `500` | Mark email verified for current user |

### 🎬 Movies
| Method | Endpoint | Access | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/movies` | Public | `200`, `500` | Fetch movies with genres, director, IMDb rating, trailer and landscape image (filters: `genre`, `search`, `age`) |
| `GET` | `/api/movies/:id` | Public | `200`, `400`, `404`, `500` | Fetch single movie details by ID with extended fields |
| `POST` | `/api/movies` | Admin | `201`, `400`, `401`, `403`, `500` | Create movie (`title`, `genres`, `duration`, `director`, `imdb_rating`, `trailer_url`, `landscape_image_url`, etc.) |
| `PUT` | `/api/movies/:id` | Admin | `200`, `400`, `401`, `403`, `404`, `500` | Update movie details, genres, director, ratings, trailer & images |
| `DELETE` | `/api/movies/:id` | Admin | `200`, `401`, `403`, `404`, `409`, `500` | Delete movie (prevented if scheduled screenings exist) |

### 🏛️ Cinemas
| Method | Endpoint | Access | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/cinemas` | Public | `200`, `500` | List all cinema halls with total seat counts, format, tech, screen size and opened year |
| `GET` | `/api/cinemas/:id` | Public | `200`, `400`, `404`, `500` | Fetch cinema hall details with complete seat list and seat types (regular/wheelchair) |
| `POST` | `/api/cinemas` | Admin | `201`, `400`, `401`, `403`, `409`, `500` | Create cinema hall with tech specs and auto-generate seat grid |
| `PUT` | `/api/cinemas/:id` | Admin | `200`, `400`, `401`, `403`, `404`, `409`, `500` | Update cinema hall name, tech specs and wheelchair seat configuration |
| `DELETE` | `/api/cinemas/:id` | Admin | `200`, `401`, `403`, `404`, `409`, `500` | Delete cinema hall and its seats (prevented if screenings exist) |

### 🎟️ Screenings & Seats
| Method | Endpoint | Access | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/screenings` | Public | `200`, `400`, `500` | List upcoming screenings with seat occupancy (`totalSeats`, `bookedSeats`, `availableSeats`) |
| `GET` | `/api/screenings/today` | Public | `200`, `400`, `500` | List today's upcoming screenings (optional `age` filter) |
| `GET` | `/api/screenings/:id/seats` | Public | `200`, `400`, `404`, `500` | Get seat availability map (`booked`/`available`, `seatType`: `regular`/`wheelchair`) |
| `POST` | `/api/screenings` | Admin | `201`, `400`, `401`, `403`, `404`, `409`, `500` | Schedule a screening with automatic overlap & cleaning buffer validation |
| `PUT` | `/api/screenings/:id` | Admin | `200`, `400`, `401`, `403`, `404`, `409`, `500` | Update screening time/cinema (with overlap check, prevented if bookings exist) |
| `DELETE` | `/api/screenings/:id` | Admin | `200`, `401`, `403`, `404`, `409`, `500` | Delete screening (prevented if active bookings exist) |

### 🏷️ Ticket Types & Pricing
| Method | Endpoint | Access | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/price-groups` | Public | `200`, `500` | Fetch all ticket categories and prices (Vuxen, Barn, Pensionär) |


### 🍿 Kiosk & Concessions
| Method | Endpoint | Access | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/kiosk` | Public | `200`, `500` | Get active menu items & combos (filters: `category=food\|drink`, `is_combo`) |
| `GET` | `/api/kiosk/:id` | Public | `200`, `400`, `404`, `500` | Get single kiosk item with combo breakdown |
| `GET` | `/api/menu` | Public | `200`, `500` | Get available food, drinks, and combos with contents (`?all=true` for admin) |
| `GET` | `/api/menu/:id` | Public | `200`, `400`, `404`, `500` | Get single menu item with contents breakdown |
| `GET` | `/api/admin/menu-items` | Admin | `200`, `401`, `403`, `500` | List all menu items including unavailable / hidden |
| `POST` | `/api/admin/menu-items` | Admin | `201`, `400`, `401`, `403`, `409`, `500` | Create menu item or combo with contents (also at `POST /api/menu`) |
| `PATCH` | `/api/admin/menu-items/:id` | Admin | `200`, `400`, `401`, `403`, `404`, `409`, `500` | Update price, name, description or availability (also at `PATCH /api/menu/:id`) |

### 📋 Bookings
| Method | Endpoint | Access | Status Codes | Description |
| `GET` | `/api/bookings` | Admin | `200`, `400`, `401`, `403`, `500` | List all bookings with optional filters (`screeningId`, `status`, `search`, `from`, `to`, `isPaid`) |
| `POST` | `/api/bookings` | Guest / Member | `201`, `400`, `409`, `500` | Book seats & kiosk items (atomic transaction, auto reference `FV-XXXXX`, email) |
| `GET` | `/api/bookings/me` | Logged In | `200`, `401`, `500` | View authenticated user's booking history |
| `GET` | `/api/bookings/lookup?reference=...` | Admin | `200`, `400`, `401`, `403`, `404`, `500` | Look up any booking by booking reference code |
| `GET` | `/api/bookings/cancel-preview?token=...` | Public (Signed link) | `200`, `400`, `403`, `404`, `500` | Preview booking details before guest cancellation (Figma modal) |
| `POST` | `/api/bookings/cancel-by-token` | Public (Signed link) | `200`, `400`, `403`, `404`, `500` | Cancel booking using email JWT link (enforces ≥ 2h deadline & releases seats) |
| `PATCH` | `/api/bookings/:id` | Admin | `200`, `400`, `401`, `403`, `404`, `500` | Update booking payment / check-in status (`isPaid`, `isCheckedIn`) |
| `PATCH` | `/api/bookings/:id/pay` | Admin | `200`, `400`, `401`, `403`, `404`, `500` | Convenience: Mark booking as paid |
| `PATCH` | `/api/bookings/:id/checkin` | Admin | `200`, `400`, `401`, `403`, `404`, `500` | Convenience: Check in booking |
| `DELETE` | `/api/bookings/:id` | Logged In | `200`, `400`, `401`, `404`, `500` | Cancel booking (enforces ≥ 2h deadline before screening & releases seats) |

### 📊 Admin Analytics & Dashboard
| Method | Endpoint | Access | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin | `200`, `401`, `403`, `500` | Dashboard overview: today's bookings, expected/paid revenue, seat occupancy rate |

### 📁 Uploads & Media
| Method | Endpoint | Access | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/upload` | Admin | `201`, `400`, `401`, `403`, `500` | Multipart image upload for movie posters, landscapes and kiosk items (saved to `/uploads`) |

### ✉️ Contact & Support
| Method | Endpoint | Access | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/contact` | Public | `200`, `400`, `500` | Send contact/support message (`name`, `email`, `subject`, `message`) |


---

## Postman API Collection

A complete Postman collection is included under [`postman/collections/`](./postman/collections/).

It includes preconfigured requests for all endpoints with environment variable support:
Sign in with the account needed for the requests; Postman stores the HttpOnly session cookie in its cookie jar. Protected requests use that cookie, and writes include `X-CSRF-Protection: 1`. Sign out before switching accounts. Session credentials are no longer stored in globals.

Before upgrading an existing database, run `cd Backend` and `npm run migrate:auth`. Deploy frontend and backend together; existing users must sign in again. See [cookie sessions and deployment settings](Backend/README.md#cookie-sessions-and-csrf-protection).

---

## Frontend Navigation & Pages

Pages inside `Frontend/src/pages/` are automatically discovered by `routes.tsx`:

Create a new file in `Frontend/src/pages/`, for example `About.tsx`:
```tsx
export const navTitle = 'About Us'
export const navOrder = 4

export default function About() {
  return <div>About Filmvisarna</div>
}
```

- **`navTitle`:** Sets the label displayed in the navigation bar.
- **`navOrder`:** Sets the display order in the navigation bar.
- **`hideFromNav: true`:** Hides the page from navigation (e.g. for detail or admin views).
- Files containing `detail` in the filename (e.g. `MovieDetail.tsx`) automatically receive the `:id` route parameter.
