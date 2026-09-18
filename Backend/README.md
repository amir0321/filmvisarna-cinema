# Filmvisarna Cinema - Backend

Node.js + Express 5 + TypeScript + SQLite API for the Filmvisarna cinema project.

## Scripts

- `npm run dev`: Start backend server with `tsx` in watch mode
- `npm run build`: Compile TypeScript to `dist/`
- `npm run start`: Run production build with Node from `dist/server.js`

## API Endpoints

- `GET /api/health`: Health check endpoint
- `GET /api/movies`: Fetch all movies from the SQLite database

## Database

- Uses SQLite via `better-sqlite3` with WAL mode enabled for optimal performance.
- Database file `cinema.db` is stored locally and ignored by Git.

For full project documentation, see the root [README.md](../README.md).
