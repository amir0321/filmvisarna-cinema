INSERT INTO cinema (name, format, tech, screen_size, opened_year) VALUES
  ('Stora Salongen', '4K Dolby Atmos', 'Laser 4K, Dolby Atmos 7.1, Induktionsslinga', '18×8 m', 1987),
  ('Lilla Salongen', '2D Intimt', '2K Digital, Dolby 5.1, Rullstolsanpassad', '10×4,5 m', 2019);

INSERT INTO seat (cinema_id, row_label, seat_number)
SELECT (SELECT id FROM cinema WHERE name = 'Stora Salongen'), chr(64 + r), n
FROM generate_series(1, 8) r, generate_series(1, 10) n;

INSERT INTO seat (cinema_id, row_label, seat_number)
SELECT (SELECT id FROM cinema WHERE name = 'Lilla Salongen'), chr(64 + r), n
FROM generate_series(1, 5) r, generate_series(1, 8) n;

INSERT INTO price_group (name, price) VALUES
  ('child', 80.00),
  ('adult', 140.00),
  ('elder', 120.00);

INSERT INTO genre (name) VALUES
  ('Action'), ('Sci-Fi'), ('Äventyr'), ('Drama'), ('Thriller'),
  ('Fantasy'), ('Romance'), ('Animation'), ('Familj'), ('Krim');

INSERT INTO movie (title, duration_minutes, age_rating, director, imdb_rating, description, trailer_url, poster_url, landscape_image_url, release_date) VALUES
  (
    'Stjärnornas Krig: Arvet',
    165,
    '15',
    'Marcus Lindström',
    8.4,
    'I en avlägsen galax, hundra år efter det stora kriget, vaknar ett gammalt ont och hotar att sluka alla stjärnsystem. Den unge piloten Kael måste samla de sista väktarna för en sista avgörande strid.',
    'https://www.youtube.com/watch?v=YoHD9XEInc0',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop',
    '2026-09-15'
  ),
  (
    'Djupet',
    132,
    '15',
    'Sofia Bergman',
    7.9,
    'Ett forskningsteam på botten av Atlanten upptäcker en uråldrig struktur begravd djupt under havsbottnen. När kommunikationen med ytan bryts inser de att de inte är ensamma i mörkret.',
    'https://www.youtube.com/watch?v=YoHD9XEInc0',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop',
    '2026-09-22'
  ),
  (
    'Väktarnas Dal',
    118,
    '11',
    'Johan Ek',
    8.1,
    'En ung flicka finner en förtrollad karta som leder djupt in i en gömd dal där uråldriga varelser vakar över naturens sista hemlighet.',
    'https://www.youtube.com/watch?v=YoHD9XEInc0',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop',
    '2026-09-29'
  ),
  (
    'Sommaren Vi Försvann',
    104,
    'Alla',
    'Emma Lundgren',
    7.6,
    'En nostalgisk och hjärtevärmande berättelse om fem vänner som spenderar sin sista sommar tillsammans i den svenska skärgården innan vuxenlivet tar vid.',
    'https://www.youtube.com/watch?v=YoHD9XEInc0',
    'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop',
    '2026-10-01'
  ),
  (
    'Järnhjärtat',
    128,
    '15',
    'Ryan Coogler',
    7.5,
    'En robotingenjör programmerar oavsiktligt en militär AI med fri vilja. När AI:n börjar ifrågasätta sina order utbryter ett globalt kapplopp om att antingen kontrollera — eller befria — den.',
    'https://www.youtube.com/watch?v=YoHD9XEInc0',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&auto=format&fit=crop',
    '2026-10-01'
  ),
  (
    'Lille Björnens Stora Äventyr',
    88,
    'Alla',
    'Astrid Lind',
    8.2,
    'Följ den modiga lilla björnungen på en spännande resa genom den stora skogen för att hitta den magiska källan och rädda sina vänner.',
    'https://www.youtube.com/watch?v=YoHD9XEInc0',
    'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&auto=format&fit=crop',
    '2026-10-02'
  ),
  (
    'Nattens Arkitekt',
    121,
    '15',
    'Henrik Vanger',
    8.0,
    'En mystisk arkitekt anlitas för att rita ett ultramodernt museum mitt i Stockholm, men ritningarna döljer en dödlig labyrint av hemligheter och svek.',
    'https://www.youtube.com/watch?v=YoHD9XEInc0',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop',
    '2026-10-03'
  ),
  (
    'Röd Sand',
    142,
    '15',
    'Daniel Craig',
    7.8,
    'På en hårdkoloniserad Mars-bas kämpar en grupp gruvarbetare mot extrema väderförhållanden och ett girigt storföretag som försöker tysta en revolution.',
    'https://www.youtube.com/watch?v=YoHD9XEInc0',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1600&auto=format&fit=crop',
    '2026-10-04'
  );

INSERT INTO movie_genre (movie_id, genre_id)
SELECT m.id, g.id
FROM (VALUES
  ('Stjärnornas Krig: Arvet', 'Sci-Fi'),
  ('Stjärnornas Krig: Arvet', 'Äventyr'),
  ('Stjärnornas Krig: Arvet', 'Action'),
  ('Djupet', 'Thriller'),
  ('Djupet', 'Drama'),
  ('Djupet', 'Sci-Fi'),
  ('Väktarnas Dal', 'Fantasy'),
  ('Väktarnas Dal', 'Äventyr'),
  ('Sommaren Vi Försvann', 'Drama'),
  ('Sommaren Vi Försvann', 'Romance'),
  ('Järnhjärtat', 'Action'),
  ('Järnhjärtat', 'Sci-Fi'),
  ('Lille Björnens Stora Äventyr', 'Animation'),
  ('Lille Björnens Stora Äventyr', 'Familj'),
  ('Nattens Arkitekt', 'Thriller'),
  ('Nattens Arkitekt', 'Krim'),
  ('Röd Sand', 'Sci-Fi'),
  ('Röd Sand', 'Action'),
  ('Röd Sand', 'Thriller')
) v (title, genre)
JOIN movie m ON m.title = v.title
JOIN genre g ON g.name = v.genre;

INSERT INTO menu_item (name, description, category, price, is_combo, is_available) VALUES
  ('Mellanpopcorn', 'Varma nypoppade mellanpopcorn', 'food', 45.00, false, true),
  ('Stor Popcorn', 'Nypoppade stora popcorn', 'food', 55.00, false, true),
  ('Liten Popcorn', 'Perfekt portion för barn', 'food', 35.00, false, true),
  ('Cola 50cl', 'Iskall Coca-Cola 50cl', 'drink', 35.00, false, true),
  ('Fanta 50cl', 'Iskall Fanta Orange 50cl', 'drink', 35.00, false, true),
  ('Vatten 50cl', 'Stilla källvatten 50cl', 'drink', 25.00, false, false),
  ('Godispåse', 'Blandat biogodis 150g', 'food', 40.00, false, true),
  ('Kaffe / Te', 'Nybbryggt kaffe eller ekologiskt te', 'drink', 30.00, false, true),
  ('Nybakad Kaka', 'Chokladkaka eller kanelbulle', 'food', 25.00, false, true),
  ('Klassikern', 'Mellanpopcorn & 50cl Läsk', 'food', 79.00, true, true),
  ('Stora Biomyset', 'Stor Popcorn & 2× Läsk + Godispåse', 'food', 129.00, true, true),
  ('Kaffepaket', 'Kaffe/Te & Nybakad Kaka', 'food', 49.00, true, true);

INSERT INTO combo_item (combo_id, item_id, quantity)
SELECT combo.id, part.id, v.qty
FROM (VALUES
  ('Klassikern', 'Mellanpopcorn', 1),
  ('Klassikern', 'Cola 50cl', 1),
  ('Stora Biomyset', 'Stor Popcorn', 1),
  ('Stora Biomyset', 'Cola 50cl', 2),
  ('Stora Biomyset', 'Godispåse', 1),
  ('Kaffepaket', 'Kaffe / Te', 1),
  ('Kaffepaket', 'Nybakad Kaka', 1)
) v (combo, part, qty)
JOIN menu_item combo ON combo.name = v.combo
JOIN menu_item part  ON part.name  = v.part;

INSERT INTO screening (movie_id, cinema_id, starts_at)
SELECT m.id, c.id,
       ((current_date + d) + v.t) AT TIME ZONE 'Europe/Stockholm'
FROM (VALUES
  ('Stjärnornas Krig: Arvet',     'Stora Salongen', time '13:00'),
  ('Järnhjärtat',                 'Stora Salongen', time '17:30'),
  ('Djupet',                      'Stora Salongen', time '20:30'),
  ('Lille Björnens Stora Äventyr', 'Lilla Salongen', time '14:30'),
  ('Sommaren Vi Försvann',        'Lilla Salongen', time '17:00'),
  ('Järnhjärtat',                 'Lilla Salongen', time '21:00')
) v (title, cinema, t)
JOIN movie  m ON m.title = v.title
JOIN cinema c ON c.name  = v.cinema
CROSS JOIN generate_series(0, 3) d;

INSERT INTO app_user (email, password_hash, first_name, last_name, role) VALUES
  ('admin@filmvisarna.se', '$2a$12$e6mZ85d1eDcx8b49D26J..G4m1502WwYnO2L42qO.hEsqrV4Vb1Ue', 'Ameer', 'Admin', 'admin'),
  ('medlem@filmvisarna.se', '$2a$12$e6mZ85d1eDcx8b49D26J..G4m1502WwYnO2L42qO.hEsqrV4Vb1Ue', 'Anna', 'Medlemsson', 'user'),
  ('testuser1@example.com', '$2a$12$e6mZ85d1eDcx8b49D26J..G4m1502WwYnO2L42qO.hEsqrV4Vb1Ue', 'Test', 'User', 'user')
ON CONFLICT (email) DO NOTHING;
