-- Sprint 4 review: Friday 13 November 2026 (Europe/Stockholm).
-- Use existing screenings, seats, films and prices. No mail is dispatched.
-- Friday fixtures plus Sunday fixtures that remain upcoming all day Friday.
-- Repeatable: only currently unoccupied seats are filled. Existing bookings,
-- accounts, verification flags and the normal booking flow are preserved.
BEGIN;
SET LOCAL statement_timeout = '20s';
SELECT pg_advisory_xact_lock(hashtext('filmvisarna-demo-seed'));

DO $demo$
DECLARE
  showing record;
  target_free text[];
  available_ids int[];
  batch_ids int[];
  adult_id int;
  new_booking_id int;
  reference text;
  crowd_email text;
  offset_index int;
  actual_free int;
  scenario_count int := 0;
BEGIN
  SELECT id INTO STRICT adult_id FROM price_group WHERE name = 'adult';
  FOR showing IN
    SELECT s.id, s.cinema_id, m.title, s.starts_at
    FROM screening s
    JOIN movie m ON m.id = s.movie_id
    JOIN cinema c ON c.id = s.cinema_id
    WHERE c.name = 'Stora Salongen'
      AND (s.starts_at AT TIME ZONE 'Europe/Stockholm')::date
        IN (DATE '2026-11-13', DATE '2026-11-15')
      AND ((m.title = 'Dune: Part Two'
            AND (s.starts_at AT TIME ZONE 'Europe/Stockholm')::time = TIME '10:00')
        OR (m.title = 'Interstellar'
            AND (s.starts_at AT TIME ZONE 'Europe/Stockholm')::time = TIME '14:00'))
    ORDER BY s.starts_at
    FOR UPDATE OF s
  LOOP
    scenario_count := scenario_count + 1;
    target_free := CASE WHEN showing.title = 'Dune: Part Two'
      THEN ARRAY['D4', 'D5', 'H9'] ELSE ARRAY[]::text[] END;

    IF (SELECT count(*) FROM seat WHERE cinema_id = showing.cinema_id) <> 80 THEN
      RAISE EXCEPTION 'Expected the existing 80-seat Stora Salongen';
    END IF;
    IF (SELECT count(*) FROM seat se
        WHERE se.cinema_id = showing.cinema_id
          AND se.row_label || se.seat_number = ANY(target_free)
          AND NOT EXISTS (SELECT 1 FROM ticket t
            WHERE t.screening_id = showing.id AND t.seat_id = se.id))
        <> cardinality(target_free) THEN
      RAISE EXCEPTION 'Demo seats already occupied in screening %. Existing bookings were preserved.', showing.id;
    END IF;

    SELECT coalesce(array_agg(se.id ORDER BY se.row_label, se.seat_number), ARRAY[]::int[])
      INTO available_ids
    FROM seat se
    WHERE se.cinema_id = showing.cinema_id
      AND NOT (se.row_label || se.seat_number = ANY(target_free))
      AND NOT EXISTS (SELECT 1 FROM ticket t
        WHERE t.screening_id = showing.id AND t.seat_id = se.id);

    offset_index := 1;
    WHILE offset_index <= cardinality(available_ids) LOOP
      batch_ids := available_ids[offset_index:offset_index + 9];
      -- A separate fictional audience identity for each group of <=10 seats.
      crowd_email := 'sprint4-crowd-' || showing.id || '-' || batch_ids[1] || '@example.test';
      LOOP
        reference := 'FV-' || translate(upper(substr(md5(gen_random_uuid()::text), 1, 5)), '01', '23');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM booking WHERE booking_reference = reference);
      END LOOP;
      INSERT INTO booking (screening_id, guest_name, guest_email, identity_email,
        booking_reference, status, is_paid, paid_at)
      VALUES (showing.id, 'Demopublik sprint 4', crowd_email, crowd_email,
        reference, 'confirmed', true, now())
      RETURNING id INTO new_booking_id;

      INSERT INTO ticket (screening_id, seat_id, booking_id, price_group_id)
      SELECT showing.id, seat_id, new_booking_id, adult_id FROM unnest(batch_ids) AS seat_id;
      offset_index := offset_index + 10;
    END LOOP;

    SELECT count(*) INTO actual_free FROM seat se
    WHERE se.cinema_id = showing.cinema_id
      AND NOT EXISTS (SELECT 1 FROM ticket t JOIN booking b ON b.id = t.booking_id
        WHERE t.screening_id = showing.id AND t.seat_id = se.id AND b.status = 'confirmed');
    IF actual_free <> cardinality(target_free) THEN
      RAISE EXCEPTION 'Incorrect availability in screening %. Entire preparation rolled back.', showing.id;
    END IF;
  END LOOP;
  IF scenario_count <> 4 THEN
    RAISE EXCEPTION 'Expected four existing demo screenings, found %. No preparation saved.', scenario_count;
  END IF;
END
$demo$;
COMMIT;

-- Also show the untouched Inception screenings for the complete booking demo.
SELECT s.id AS screening_id, m.title,
  to_char(s.starts_at AT TIME ZONE 'Europe/Stockholm', 'YYYY-MM-DD HH24:MI') AS stockholm_time,
  c.name AS cinema,
  (SELECT count(*) FROM seat WHERE cinema_id = c.id) AS total_seats,
  (SELECT count(*) FROM ticket t JOIN booking b ON b.id = t.booking_id
    WHERE t.screening_id = s.id AND b.status = 'confirmed') AS booked_seats,
  (SELECT count(*) FROM seat se WHERE se.cinema_id = c.id
    AND NOT EXISTS (SELECT 1 FROM ticket t JOIN booking b ON b.id = t.booking_id
      WHERE t.screening_id = s.id AND t.seat_id = se.id AND b.status = 'confirmed')) AS free_seats
FROM screening s JOIN movie m ON m.id = s.movie_id JOIN cinema c ON c.id = s.cinema_id
WHERE c.name = 'Stora Salongen'
  AND (s.starts_at AT TIME ZONE 'Europe/Stockholm')::date
    IN (DATE '2026-11-13', DATE '2026-11-15')
  AND m.title IN ('Dune: Part Two', 'Interstellar', 'Inception')
ORDER BY s.starts_at;
