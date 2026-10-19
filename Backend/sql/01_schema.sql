CREATE TABLE app_user (
  id            int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  first_name    text,
  last_name     text,
  phone         text,
  is_verified   boolean NOT NULL DEFAULT false,
  points        int NOT NULL DEFAULT 0 CHECK (points >= 0),
  role          text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------- MOVIE, GENRE, PERSON -------------------------------------
CREATE TABLE movie (
  id                  int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title               text NOT NULL,
  description         text,
  duration_minutes    int  NOT NULL CHECK (duration_minutes > 0),
  age_rating          text,
  poster_url          text,
  landscape_image_url text,
  trailer_url         text,
  director            text,
  imdb_rating         numeric(3, 1) CHECK (imdb_rating >= 0 AND imdb_rating <= 10),
  release_date        date
);

CREATE TABLE genre (
  id   int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE
);

CREATE TABLE movie_genre (
  movie_id int NOT NULL REFERENCES movie (id) ON DELETE CASCADE,
  genre_id int NOT NULL REFERENCES genre (id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, genre_id)
);

CREATE TABLE person (
  id   int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE movie_person (
  movie_id  int  NOT NULL REFERENCES movie (id)  ON DELETE CASCADE,
  person_id int  NOT NULL REFERENCES person (id) ON DELETE CASCADE,
  role      text NOT NULL CHECK (role IN ('director', 'actor')),
  PRIMARY KEY (movie_id, person_id, role)
);

-- ---------- CINEMA, SEAT, SCREENING ----------------------------------
CREATE TABLE cinema (
  id          int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        text NOT NULL UNIQUE,
  format      text,
  tech        text,
  screen_size text,
  opened_year int
);

CREATE TABLE seat (
  id          int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cinema_id   int  NOT NULL REFERENCES cinema (id) ON DELETE CASCADE,
  row_label   text NOT NULL,
  seat_number int  NOT NULL CHECK (seat_number > 0),
  seat_type   text NOT NULL DEFAULT 'regular' CHECK (seat_type IN ('regular', 'wheelchair')),
  UNIQUE (cinema_id, row_label, seat_number)
);

CREATE TABLE screening (
  id        int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  movie_id  int         NOT NULL REFERENCES movie (id),
  cinema_id int         NOT NULL REFERENCES cinema (id),
  starts_at timestamptz NOT NULL,
  UNIQUE (cinema_id, starts_at)
);
CREATE INDEX screening_movie_idx ON screening (movie_id, starts_at);

-- ---------- PRICE_GROUP ----------------------------------------------
CREATE TABLE price_group (
  id    int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name  text NOT NULL UNIQUE CHECK (name IN ('child', 'adult', 'elder')),
  price numeric(10, 2) NOT NULL CHECK (price >= 0)
);

-- ---------- BOOKING, TICKET ------------------------------------------
CREATE TABLE booking (
  id                int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           int  REFERENCES app_user (id),          -- NULL for guests
  screening_id      int  NOT NULL REFERENCES screening (id),
  booking_reference text NOT NULL UNIQUE,
  guest_name        text,
  guest_email       text,
  status            text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  is_paid           boolean NOT NULL DEFAULT false,
  paid_at           timestamptz,
  is_checked_in     boolean NOT NULL DEFAULT false,
  checked_in_at     timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_has_owner CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL),
  UNIQUE (id, screening_id)
);
CREATE INDEX booking_user_idx ON booking (user_id);

CREATE TABLE ticket (
  screening_id   int NOT NULL REFERENCES screening (id),
  seat_id        int NOT NULL REFERENCES seat (id),
  booking_id     int NOT NULL,
  price_group_id int NOT NULL REFERENCES price_group (id),
  CONSTRAINT ticket_pkey PRIMARY KEY (screening_id, seat_id),
  CONSTRAINT ticket_booking_fk FOREIGN KEY (booking_id, screening_id)
    REFERENCES booking (id, screening_id) ON DELETE CASCADE
);
CREATE INDEX ticket_booking_idx ON ticket (booking_id);

-- ---------- MENU_ITEM, COMBO_ITEM, BOOKING_ITEM ----------------------
CREATE TABLE menu_item (
  id           int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         text NOT NULL UNIQUE,
  description  text,
  category     text NOT NULL CHECK (category IN ('food', 'drink')),
  price        numeric(10, 2) NOT NULL CHECK (price >= 0),
  is_combo     boolean NOT NULL DEFAULT false,
  image_url    text,
  is_available boolean NOT NULL DEFAULT true
);

CREATE TABLE combo_item (
  combo_id int NOT NULL REFERENCES menu_item (id) ON DELETE CASCADE,
  item_id  int NOT NULL REFERENCES menu_item (id),
  quantity int NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (combo_id, item_id),
  CHECK (combo_id <> item_id)
);

CREATE FUNCTION check_combo_item() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT (SELECT is_combo FROM menu_item WHERE id = NEW.combo_id) THEN
    RAISE EXCEPTION 'combo_id must point to a menu_item with is_combo = true';
  END IF;
  IF (SELECT is_combo FROM menu_item WHERE id = NEW.item_id) THEN
    RAISE EXCEPTION 'a combo cannot contain another combo';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER combo_item_rules
  BEFORE INSERT OR UPDATE ON combo_item
  FOR EACH ROW EXECUTE FUNCTION check_combo_item();

CREATE TABLE booking_item (
  booking_id   int NOT NULL REFERENCES booking (id) ON DELETE CASCADE,
  menu_item_id int NOT NULL REFERENCES menu_item (id),
  quantity     int NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (booking_id, menu_item_id)
);
