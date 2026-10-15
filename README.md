# Filmvisarna Cinema

A modern full-stack cinema booking application built with React, TypeScript, Express 5, and PostgreSQL.

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
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Health check and server status |

### 🔐 Authentication
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register user account (returns JWT token + user info) |
| `POST` | `/api/auth/login` | Public | Login with email & password (returns JWT token) |
| `GET` | `/api/auth/me` | Logged In | Get profile of authenticated user |

### 🎬 Movies
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/movies` | Public | Fetch all movies with associated genres |
| `GET` | `/api/movies/:id` | Public | Fetch single movie details by ID |
| `POST` | `/api/movies` | Admin | Create a new movie with genres |

### 🎟️ Screenings & Seats
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/screenings` | Public | List upcoming screenings (filters: `when`, `date`, `movieId`, `cinemaId`, `age`) |
| `GET` | `/api/screenings/today` | Public | List today's upcoming screenings (optional `age` filter) |
| `GET` | `/api/screenings/:id/seats` | Public | Get real-time seat availability map (`booked` / `available`) |
| `POST` | `/api/screenings` | Admin | Schedule a screening with automatic overlap & cleaning buffer validation |

### 🍿 Kiosk & Concessions
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/kiosk` | Public | Get active menu items & combos (filters: `category=food\|drink`, `is_combo`) |
| `GET` | `/api/kiosk/:id` | Public | Get single kiosk item with combo breakdown |

### 📋 Bookings
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Guest / Member | Book seats & kiosk items (atomic transaction, auto reference `FV-XXXXX`, email) |
| `GET` | `/api/bookings/me` | Logged In | View authenticated user's booking history |
| `GET` | `/api/bookings/lookup?reference=...` | Admin | Look up any booking by booking reference code |
| `DELETE` | `/api/bookings/:id` | Logged In | Cancel booking (enforces ≥ 2h deadline before screening & releases seats) |

---

## Postman API Collection

A complete Postman collection is included under [`postman/collections/`](./postman/collections/).

It includes preconfigured requests for all endpoints with environment variable support:
- `{{user_token}}`: User Bearer JWT token
- `{{admin_token}}`: Administrator Bearer JWT token

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
