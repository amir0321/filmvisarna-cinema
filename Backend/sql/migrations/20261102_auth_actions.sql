BEGIN;

ALTER TABLE app_user ADD COLUMN IF NOT EXISTS auth_version integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS auth_action_token (
  user_id integer NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('reset_password', 'verify_email')),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, purpose)
);

CREATE TABLE IF NOT EXISTS auth_rate_limit (
  key_hash text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts > 0)
);
CREATE INDEX IF NOT EXISTS auth_rate_limit_window_idx ON auth_rate_limit(window_start);

ALTER TABLE auth_action_token ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_rate_limit ENABLE ROW LEVEL SECURITY;

COMMIT;
