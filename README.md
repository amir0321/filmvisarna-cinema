# Filmvisarna Cinema

A modern cinema booking application built with React, TypeScript, Express, and SQLite.

---

## Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **Bundler & Dev Server:** Vite
- **Styling:** Bootstrap 5 + Sass (SCSS)
- **Routing:** React Router (file-based dynamic routing via `import.meta.glob`)

### Backend
- **Runtime & Language:** Node.js (ES Modules) + TypeScript
- **Framework:** Express 5
- **Database:** SQLite with `better-sqlite3` (WAL mode enabled)
- **Runner:** `tsx` for hot-reload development

---

## Project Structure

```text
filmvisarna-cinema/
├── Backend/
│   ├── src/
│   │   ├── db.ts             # SQLite database setup & table initialization
│   │   └── server.ts         # Express server & API routes
│   ├── cinema.db             # SQLite database file (gitignored)
│   ├── package.json
│   └── tsconfig.json
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── header.tsx    # Header & navigation bar
│   │   ├── pages/            # File-based pages
│   │   │   ├── Home.tsx      # Home page (/)
│   │   │   └── Movies.tsx    # Movies list (/movies)
│   │   ├── App.tsx           # Main application shell with Header & Outlet
│   │   ├── index.scss        # Global Sass & Bootstrap import
│   │   ├── main.tsx          # React entry point with RouterProvider
│   │   └── routes.tsx        # Dynamic route generator
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts        # Vite configuration with SCSS & API proxy
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### 1. Backend Setup
```bash
cd Backend
npm install
npm run dev
```
The backend server runs on `http://localhost:3000`.

### 2. Frontend Setup
In a new terminal window:
```bash
cd Frontend
npm install
npm run dev
```
The frontend dev server runs on `http://localhost:5173`.  
Vite automatically proxies `/api` requests to the backend (`http://localhost:3000`).

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/movies` | Get all movies from the database |

---

## How to Add New Pages (Frontend)

Pages in `Frontend/src/pages/` are automatically discovered by `routes.tsx`:

Create a new file in `Frontend/src/pages/`, for example `Bookings.tsx`:

```tsx
export const navTitle = 'Bookings'
export const navOrder = 3

export default function Bookings() {
  return <div>Bookings Page</div>
}
```

- **`navTitle`:** Sets the label displayed in the navigation bar.
- **`navOrder`:** Sets the order in the navigation bar.
- **`hideFromNav: true`:** Hides the page from the public navigation bar (e.g. for admin or detail pages).
- Files containing `detail` in the filename (e.g. `MovieDetail.tsx`) automatically receive the `:id` route parameter and are excluded from the main menu.

---

## Available Scripts

### Backend
- `npm run dev` – Starts the backend with tsx in watch mode.
- `npm run build` – Compiles TypeScript to `dist/`.
- `npm run start` – Runs the compiled server from `dist/server.js`.

### Frontend
- `npm run dev` – Starts the Vite development server.
- `npm run build` – Builds production bundle using `tsc` and `vite build`.
- `npm run preview` – Locally preview production build.
