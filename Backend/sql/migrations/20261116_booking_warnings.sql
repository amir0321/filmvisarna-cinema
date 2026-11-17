BEGIN;

CREATE TABLE IF NOT EXISTS booking_warning_policy (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  activated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO booking_warning_policy(id) VALUES (true) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS booking_reservation_block (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_email text NOT NULL,
  user_id int REFERENCES app_user(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revocation_reason text,
  CHECK (expires_at > starts_at)
);
CREATE INDEX IF NOT EXISTS booking_block_email_idx ON booking_reservation_block(identity_email, expires_at);
CREATE INDEX IF NOT EXISTS booking_block_user_idx ON booking_reservation_block(user_id, expires_at);

CREATE TABLE IF NOT EXISTS booking_warning (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Deliberately no booking FK: warnings survive seven-day booking cleanup.
  source_booking_id int NOT NULL UNIQUE,
  booking_reference text NOT NULL,
  identity_email text NOT NULL,
  user_id int REFERENCES app_user(id) ON DELETE SET NULL,
  screening_ended_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  block_id int REFERENCES booking_reservation_block(id),
  revoked_at timestamptz,
  revocation_reason text,
  notification_count int NOT NULL DEFAULT 1,
  notification_blocked_until timestamptz,
  email_sent_at timestamptz,
  email_next_attempt_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  email_attempts int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS booking_warning_email_idx ON booking_warning(identity_email, screening_ended_at);
CREATE INDEX IF NOT EXISTS booking_warning_user_idx ON booking_warning(user_id, screening_ended_at);
CREATE INDEX IF NOT EXISTS booking_warning_delivery_idx ON booking_warning(email_next_attempt_at) WHERE email_sent_at IS NULL AND revoked_at IS NULL;

ALTER TABLE booking_warning_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reservation_block ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_warning ENABLE ROW LEVEL SECURITY;

COMMIT;
