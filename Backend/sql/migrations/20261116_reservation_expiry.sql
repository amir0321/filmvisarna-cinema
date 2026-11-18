BEGIN;

-- Keep released ticket details for the customer's history without holding seats.
ALTER TABLE booking DROP CONSTRAINT IF EXISTS booking_status_check;
ALTER TABLE booking ADD CONSTRAINT booking_status_check CHECK (status IN ('confirmed', 'cancelled', 'expired'));
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE ticket DROP CONSTRAINT IF EXISTS ticket_pkey;
ALTER TABLE ticket ADD CONSTRAINT ticket_pkey PRIMARY KEY (screening_id, seat_id, booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS ticket_active_seat_idx ON ticket (screening_id, seat_id) WHERE is_active;

COMMIT;
