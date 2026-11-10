BEGIN;

ALTER TABLE booking ADD COLUMN IF NOT EXISTS identity_email text;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS request_key uuid;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS request_hash text;
UPDATE booking b SET identity_email = lower(trim(COALESCE(b.guest_email, u.email)))
FROM app_user u WHERE b.user_id = u.id AND b.identity_email IS NULL;
UPDATE booking SET identity_email = lower(trim(guest_email))
WHERE identity_email IS NULL AND guest_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS booking_identity_idx ON booking(identity_email);
CREATE UNIQUE INDEX IF NOT EXISTS booking_request_idx ON booking(identity_email, request_key);

CREATE TABLE IF NOT EXISTS booking_rate_limit (
  key_hash text PRIMARY KEY,
  attempts timestamptz[] NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS booking_rate_expiry_idx ON booking_rate_limit(expires_at);

CREATE TABLE IF NOT EXISTS guest_booking_intent (
  email text PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  request_key uuid NOT NULL,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  sent_at timestamptz,
  booking_id integer REFERENCES booking(id) ON DELETE CASCADE
);
ALTER TABLE guest_booking_intent ADD COLUMN IF NOT EXISTS sent_at timestamptz;
CREATE INDEX IF NOT EXISTS guest_booking_expiry_idx ON guest_booking_intent(expires_at);
ALTER TABLE booking_rate_limit ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_booking_intent ENABLE ROW LEVEL SECURITY;

COMMIT;
