CREATE VIEW cinema_overview WITH (security_invoker = true) AS
SELECT c.id, c.name, COUNT(s.id)::int AS total_seats
FROM cinema c
LEFT JOIN seat s ON s.cinema_id = c.id
GROUP BY c.id, c.name;

CREATE VIEW screening_times WITH (security_invoker = true) AS
SELECT s.id, s.movie_id, s.cinema_id, s.starts_at,
       s.starts_at + (m.duration_minutes * interval '1 minute') AS ends_at
FROM screening s
JOIN movie m ON m.id = s.movie_id;

CREATE VIEW booking_totals WITH (security_invoker = true) AS
SELECT
  b.id AS booking_id,
  COALESCE(t.ticket_total, 0) AS ticket_total,
  COALESCE(i.item_total, 0)   AS item_total,
  COALESCE(t.ticket_total, 0) + COALESCE(i.item_total, 0) AS total_price
FROM booking b
LEFT JOIN (
  SELECT tk.booking_id, SUM(pg.price) AS ticket_total
  FROM ticket tk
  JOIN price_group pg ON pg.id = tk.price_group_id
  GROUP BY tk.booking_id
) t ON t.booking_id = b.id
LEFT JOIN (
  SELECT bi.booking_id, SUM(mi.price * bi.quantity) AS item_total
  FROM booking_item bi
  JOIN menu_item mi ON mi.id = bi.menu_item_id
  GROUP BY bi.booking_id
) i ON i.booking_id = b.id;
