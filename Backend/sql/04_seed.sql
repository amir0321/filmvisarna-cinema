INSERT INTO cinema (name) VALUES ('Cinema 1'), ('Cinema 2');

INSERT INTO seat (cinema_id, row_label, seat_number)
SELECT (SELECT id FROM cinema WHERE name = 'Cinema 1'), chr(64 + r), n
FROM generate_series(1, 6) r, generate_series(1, 8) n;

INSERT INTO seat (cinema_id, row_label, seat_number)
SELECT (SELECT id FROM cinema WHERE name = 'Cinema 2'), chr(64 + r), n
FROM generate_series(1, 5) r, generate_series(1, 6) n;

INSERT INTO price_group (name, price) VALUES ('child', 80), ('adult', 120), ('elder', 100);

INSERT INTO genre (name) VALUES
  ('Drama'), ('Sci-Fi'), ('Thriller'), ('Comedy'), ('Animation'), ('Family');

INSERT INTO movie (title, description, duration_minutes, age_rating, release_date) VALUES
  ('The Last Reel', 'An aging projectionist fights to keep a small-town cinema open.', 118, '11', '2026-08-14'),
  ('Orbit Seven', 'A crew on a deep-space station discovers they are not alone.', 132, '15', '2026-09-04'),
  ('Laughing Matter', 'Two rival stand-up comedians are forced to share a tour bus.', 96, '7', '2026-09-18'),
  ('Moonlight Bakery', 'A shy baker learns that her sourdough starter can talk.', 88, 'All', '2026-09-25');

INSERT INTO movie_genre (movie_id, genre_id)
SELECT m.id, g.id
FROM (VALUES
  ('The Last Reel', 'Drama'),
  ('Orbit Seven', 'Sci-Fi'), ('Orbit Seven', 'Thriller'),
  ('Laughing Matter', 'Comedy'),
  ('Moonlight Bakery', 'Animation'), ('Moonlight Bakery', 'Family'), ('Moonlight Bakery', 'Comedy')
) v (title, genre)
JOIN movie m ON m.title = v.title
JOIN genre g ON g.name = v.genre;

INSERT INTO person (name) VALUES
  ('Elin Berg'), ('Oskar Holm'), ('Sara Nystrom'), ('Karl Dahl'), ('Ida Strand'), ('Jonas Falk');

INSERT INTO movie_person (movie_id, person_id, role)
SELECT m.id, p.id, v.role
FROM (VALUES
  ('The Last Reel',    'Elin Berg',    'director'),
  ('The Last Reel',    'Karl Dahl',    'actor'),
  ('The Last Reel',    'Ida Strand',   'actor'),
  ('Orbit Seven',      'Oskar Holm',   'director'),
  ('Orbit Seven',      'Sara Nystrom', 'actor'),
  ('Orbit Seven',      'Jonas Falk',   'actor'),
  ('Laughing Matter',  'Elin Berg',    'director'),
  ('Laughing Matter',  'Jonas Falk',   'actor'),
  ('Laughing Matter',  'Ida Strand',   'actor'),
  ('Moonlight Bakery', 'Sara Nystrom', 'director'),
  ('Moonlight Bakery', 'Karl Dahl',    'actor')
) v (title, person, role)
JOIN movie m  ON m.title = v.title
JOIN person p ON p.name  = v.person;

INSERT INTO screening (movie_id, cinema_id, starts_at)
SELECT m.id, c.id,
       ((current_date + d) + v.t) AT TIME ZONE 'Europe/Stockholm'
FROM (VALUES
  ('The Last Reel',    'Cinema 1', time '18:00'),
  ('Orbit Seven',      'Cinema 1', time '20:30'),
  ('Laughing Matter',  'Cinema 2', time '17:30'),
  ('Moonlight Bakery', 'Cinema 2', time '19:30')
) v (title, cinema, t)
JOIN movie  m ON m.title = v.title
JOIN cinema c ON c.name  = v.cinema
CROSS JOIN generate_series(1, 3) d;

INSERT INTO menu_item (name, description, category, price, is_combo) VALUES
  ('Small popcorn', 'Salted', 'food', 39, false),
  ('Large popcorn', 'Salted', 'food', 59, false),
  ('Candy mix', 'Pick-and-mix bag', 'food', 45, false),
  ('Soda', '40 cl', 'drink', 35, false),
  ('Water', '50 cl', 'drink', 25, false),
  ('Coffee', 'Freshly brewed', 'drink', 30, false),
  ('Movie combo', '2 sodas and a large popcorn', 'food', 119, true),
  ('Sweet combo', 'Candy mix and a soda', 'food', 69, true);

INSERT INTO combo_item (combo_id, item_id, quantity)
SELECT combo.id, part.id, v.qty
FROM (VALUES
  ('Movie combo', 'Soda', 2),
  ('Movie combo', 'Large popcorn', 1),
  ('Sweet combo', 'Candy mix', 1),
  ('Sweet combo', 'Soda', 1)
) v (combo, part, qty)
JOIN menu_item combo ON combo.name = v.combo
JOIN menu_item part  ON part.name  = v.part;
