# Filmvisarna Cinema - Backend

Node.js + Express 5 + TypeScript + PostgreSQL API for the Filmvisarna cinema project.

## Scripts

- `npm run dev`: Start backend server with `tsx` in watch mode
- `npm run build`: Compile TypeScript to `dist/`
- `npm run start`: Run production build with Node from `dist/server.js`

## Database (PostgreSQL)

The backend connects to PostgreSQL using connection pooling via `pg` (`node-postgres`).

### Configuration (.env)

Create a `.env` file in `Backend/` (copied from `.env.example`):

```bash
cp .env.example .env
```

You can configure the database either with a single connection URL or individual connection parameters:

```env
# Option 1: Connection URL (supports local Docker or shared cloud instances like Neon / Supabase)
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/filmvisarna

# Option 2: Individual variables
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgrespassword
DB_NAME=filmvisarna
```

When the backend starts up, it automatically creates required tables (`movies`) and seeds initial sample movies if the table is empty.

## API Endpoints

- `GET /api/health`: Health check endpoint
- `GET /api/movies`: Fetch all movies from PostgreSQL

For full project documentation, see the root [README.md](../README.md).
