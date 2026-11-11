DROP VIEW IF EXISTS booking_totals, screening_times, cinema_overview;
DROP TABLE IF EXISTS
  booking_item, combo_item, menu_item,
  guest_booking_intent, booking_rate_limit, ticket, booking, price_group,
  screening, seat, cinema,
  movie_person, person, movie_genre, genre, movie,
  auth_session, auth_action_token, auth_rate_limit, app_user
CASCADE;
DROP FUNCTION IF EXISTS check_combo_item() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
