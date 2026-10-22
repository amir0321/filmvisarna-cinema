DROP VIEW IF EXISTS booking_totals, screening_times, cinema_overview;
DROP TABLE IF EXISTS
  booking_item, combo_item, menu_item,
  ticket, booking, price_group,
  screening, seat, cinema,
  movie_person, person, movie_genre, genre, movie,
  app_user
CASCADE;
DROP FUNCTION IF EXISTS check_combo_item() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
