BEGIN;
CREATE TABLE IF NOT EXISTS auth_session (
  token_hash text PRIMARY KEY,
  user_id integer NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_session_expires_idx ON auth_session(expires_at);
CREATE INDEX IF NOT EXISTS auth_session_user_idx ON auth_session(user_id);
ALTER TABLE auth_session ENABLE ROW LEVEL SECURITY;
COMMIT;
