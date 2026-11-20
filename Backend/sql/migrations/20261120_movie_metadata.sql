BEGIN;
ALTER TABLE movie
  ADD COLUMN IF NOT EXISTS production_countries text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS production_year int CHECK (production_year BETWEEN 1888 AND 2100),
  ADD COLUMN IF NOT EXISTS distributor text,
  ADD COLUMN IF NOT EXISTS audio_language text,
  ADD COLUMN IF NOT EXISTS subtitles text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS youtube_trailers text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reviews jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(reviews) = 'array');
CREATE OR REPLACE VIEW cinema_overview WITH (security_invoker = true) AS
SELECT c.id, c.name, COUNT(s.id)::int AS total_seats, c.format, c.tech, c.screen_size, c.opened_year,
       COALESCE((SELECT array_agg(row_count ORDER BY row_label)
         FROM (SELECT row_label, count(*)::int AS row_count FROM seat
           WHERE cinema_id=c.id GROUP BY row_label) layout), '{}'::int[]) AS seats_per_row
FROM cinema c
LEFT JOIN seat s ON s.cinema_id = c.id
GROUP BY c.id, c.name, c.format, c.tech, c.screen_size, c.opened_year;

-- The catalogue JSON uses language; the storage column remains explicit.
CREATE OR REPLACE VIEW movie_catalogue WITH (security_invoker = true) AS
SELECT movie.*, audio_language AS language FROM movie;

COMMIT;
