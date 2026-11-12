BEGIN;

ALTER TABLE person
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS tmdb_id int;

CREATE UNIQUE INDEX IF NOT EXISTS person_tmdb_id_key ON person (tmdb_id);

ALTER TABLE movie_person
  ADD COLUMN IF NOT EXISTS character_name text,
  ADD COLUMN IF NOT EXISTS billing_order int NOT NULL DEFAULT 0;

COMMIT;
