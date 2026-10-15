import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { pool } from '../db.js'
import { sendBookingConfirmation } from '../services/emailService.js'

interface TicketInput {
  seatId: number
  priceGroupId: number
}

interface ItemInput {
  itemId: number
  quantity: number
}

class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function isId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

// The ticket table has primary key (screening_id, seat_id), named ticket_pkey
function isSeatTaken(err: unknown): boolean {
  return (
    typeof err === 'object' && err !== null &&
    'code' in err && err.code === '23505' &&
    'constraint' in err && err.constraint === 'ticket_pkey'
  )
}
async function sendConfirmationFor(bookingId: number, bookingRef: string, email: string): Promise<void> {
  const info = await pool.query(
    `SELECT m.title, m.poster_url, c.name AS cinema, st.starts_at
     FROM booking b
     JOIN screening st ON st.id = b.screening_id
     JOIN movie m ON m.id = st.movie_id
     JOIN cinema c ON c.id = st.cinema_id
     WHERE b.id = $1`,
    [bookingId],
  )
  const seats = await pool.query(
    `SELECT s.row_label, s.seat_number
     FROM ticket t JOIN seat s ON s.id = t.seat_id
     WHERE t.booking_id = $1
     ORDER BY s.row_label, s.seat_number`,
    [bookingId],
  )
  const tickets = await pool.query(
    `SELECT pg.name, pg.price, count(*)::int AS quantity
     FROM ticket t JOIN price_group pg ON pg.id = t.price_group_id
     WHERE t.booking_id = $1
     GROUP BY pg.name, pg.price`,
    [bookingId],
  )
  const kiosk = await pool.query(
    `SELECT mi.name, mi.price, bi.quantity
     FROM booking_item bi JOIN menu_item mi ON mi.id = bi.menu_item_id
     WHERE bi.booking_id = $1`,
    [bookingId],
  )

  const row = info.rows[0]
  const startsAt = new Date(row.starts_at)
  const timeZone = 'Europe/Stockholm'

  await sendBookingConfirmation({
    email,
    bookingRef,
    movieTitle: row.title,
    screeningDate: startsAt.toLocaleDateString('sv-SE', { dateStyle: 'long', timeZone }),
    screeningTime: startsAt.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', timeZone }),
    cinemaName: row.cinema,
    seats: seats.rows.map((s: { row_label: string; seat_number: number }) => `${s.row_label}${s.seat_number}`),
    tickets: tickets.rows.map((t: { name: string; price: string; quantity: number }) => ({
      type: t.name,
      quantity: t.quantity,
      price: Number(t.price),
    })),
    kioskItems: kiosk.rows.map((k: { name: string; price: string; quantity: number }) => ({
      name: k.name,
      quantity: k.quantity,
      price: Number(k.price),
    })),
    posterUrl: row.poster_url ?? undefined,
  })
}
export const bookings = Router()

bookings.post('/', async (req, res) => {
  // ---------- 1. Check the request body ----------
  const body = req.body ?? {}
  const screeningId: unknown = body.screeningId
  const email: unknown = body.email
  const rawTickets: unknown = body.tickets
  const rawItems: unknown = body.items ?? []

  if (!isId(screeningId)) {
    res.status(400).json({ error: 'Ogiltigt visnings-id.' })
    return
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'Ogiltig e-postadress.' })
    return
  }
  if (!Array.isArray(rawTickets) || rawTickets.length < 1 || rawTickets.length > 10) {
    res.status(400).json({ error: 'Välj mellan 1 och 10 stolar.' })
    return
  }
  if (!Array.isArray(rawItems)) {
    res.status(400).json({ error: 'Ogiltiga kioskprodukter.' })
    return
  }

  const tickets: TicketInput[] = []
  for (const t of rawTickets) {
    if (!isId(t?.seatId) || !isId(t?.priceGroupId)) {
      res.status(400).json({ error: 'Ogiltig stol eller biljettyp.' })
      return
    }
    tickets.push({ seatId: t.seatId, priceGroupId: t.priceGroupId })
  }
  if (new Set(tickets.map(t => t.seatId)).size !== tickets.length) {
    res.status(400).json({ error: 'Samma stol två gånger.' })
    return
  }

  const items: ItemInput[] = []
  for (const i of rawItems) {
    if (!isId(i?.itemId) || !Number.isInteger(i?.quantity) || i.quantity < 1 || i.quantity > 20) {
      res.status(400).json({ error: 'Ogiltig kioskprodukt.' })
      return
    }
    items.push({ itemId: i.itemId, quantity: i.quantity })
  }
  if (new Set(items.map(i => i.itemId)).size !== items.length) {
    res.status(400).json({ error: 'Samma produkt två gånger.' })
    return
  }

  // ---------- 2. Database transaction ----------
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // The screening must exist and not have started
    const screening = await client.query(
      'SELECT cinema_id, starts_at FROM screening WHERE id = $1',
      [screeningId],
    )
    if (screening.rowCount === 0) throw new HttpError(404, 'Visningen finns inte.')
    if (new Date(screening.rows[0].starts_at) <= new Date()) {
      throw new HttpError(409, 'Visningen har redan startat.')
    }

    // Prices come from the database. numeric columns arrive as strings, so convert
    const priceGroupIds = [...new Set(tickets.map(t => t.priceGroupId))]
    const groups = await client.query(
      'SELECT id, price FROM price_group WHERE id = ANY($1::int[])',
      [priceGroupIds],
    )
    if (groups.rowCount !== priceGroupIds.length) throw new HttpError(400, 'Ogiltig biljettyp.')
    const priceOfGroup = new Map<number, number>(
      groups.rows.map((g: { id: number; price: string }) => [g.id, Number(g.price)]),
    )

    // The seats must belong to this screening's cinema
    const seatIds = tickets.map(t => t.seatId)
    const seats = await client.query(
      'SELECT id FROM seat WHERE id = ANY($1::int[]) AND cinema_id = $2',
      [seatIds, screening.rows[0].cinema_id],
    )
    if (seats.rowCount !== seatIds.length) throw new HttpError(400, 'Ogiltiga stolar för visningen.')

    // Create the booking with a booking reference that can't be guessed
    const bookingRef = randomBytes(6).toString('hex')
    const booking = await client.query(
      `INSERT INTO booking (screening_id, guest_email, booking_reference)
       VALUES ($1, $2, $3) RETURNING id`,
      [screeningId, email, bookingRef],
    )
    const bookingId: number = booking.rows[0].id

    // Create the tickets (this is what marks the seats as taken)
    let total = 0
    for (const t of tickets) {
      const price = priceOfGroup.get(t.priceGroupId)!
      await client.query(
        `INSERT INTO ticket (screening_id, seat_id, booking_id, price_group_id)
         VALUES ($1, $2, $3, $4)`,
        [screeningId, t.seatId, bookingId, t.priceGroupId],
      )
      total += price
    }

    // Kiosk items (optional)
    if (items.length > 0) {
      const itemIds = items.map(i => i.itemId)
      const found = await client.query(
        'SELECT id, price FROM menu_item WHERE id = ANY($1::int[]) AND is_available',
        [itemIds],
      )
      if (found.rowCount !== itemIds.length) {
        throw new HttpError(400, 'Ogiltiga eller slutsålda kioskprodukter.')
      }
      const priceOfItem = new Map<number, number>(
        found.rows.map((i: { id: number; price: string }) => [i.id, Number(i.price)]),
      )
      for (const i of items) {
        const price = priceOfItem.get(i.itemId)!
        await client.query(
          `INSERT INTO booking_item (booking_id, menu_item_id, quantity)
           VALUES ($1, $2, $3)`,
          [bookingId, i.itemId, i.quantity],
        )
        total += price * i.quantity
      }
    }

    await client.query('COMMIT')
    res.status(201).json({ bookingRef, totalPrice: total })
    sendConfirmationFor(bookingId, bookingRef, email)
    .catch(err=> console.error('Confirmation email failed:', err))
  } catch (err) {
    await client.query('ROLLBACK') // undo everything saved in this transaction

    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    if (isSeatTaken(err)) {
      res.status(409).json({ error: 'En eller flera stolar är redan bokade. Välj andra stolar.' })
      return
    }
    console.error('POST /api/bookings failed', err)
    res.status(500).json({ error: 'Kunde inte skapa bokningen.' })
  } finally {
    client.release() // always give the connection back to the pool
  }
})