import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import pool from '../db.js'

interface TicketInput {
  seatId: number
  priceGroupId: number
}

interface ItemInput {
  itemId: number
  quantity: number
}

// Used to stop an invalid request before the database is touched
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

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === '23505'
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

    // Prices come from the database, never from the browser
    const priceGroupIds = [...new Set(tickets.map(t => t.priceGroupId))]
    const groups = await client.query(
      'SELECT id, price FROM price_group WHERE id = ANY($1::int[])',
      [priceGroupIds],
    )
    if (groups.rowCount !== priceGroupIds.length) throw new HttpError(400, 'Ogiltig biljettyp.')
    const priceOfGroup = new Map<number, number>(
      groups.rows.map((g: { id: number; price: number }) => [g.id, g.price]),
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
      `INSERT INTO booking (screening_id, email, booking_ref)
       VALUES ($1, $2, $3) RETURNING id`,
      [screeningId, email, bookingRef],
    )
    const bookingId: number = booking.rows[0].id

    // Create the tickets (this is what marks the seats as taken)
    let total = 0
    for (const t of tickets) {
      const price = priceOfGroup.get(t.priceGroupId)!
      await client.query(
        `INSERT INTO ticket (booking_id, screening_id, seat_id, price_group_id, price_paid)
         VALUES ($1, $2, $3, $4, $5)`,
        [bookingId, screeningId, t.seatId, t.priceGroupId, price],
      )
      total += price
    }

    // Kiosk items (optional)
    if (items.length > 0) {
      const itemIds = items.map(i => i.itemId)
      const found = await client.query(
        'SELECT id, price FROM item WHERE id = ANY($1::int[]) AND is_available',
        [itemIds],
      )
      if (found.rowCount !== new Set(itemIds).size) {
        throw new HttpError(400, 'Ogiltiga eller slutsålda kioskprodukter.')
      }
      const priceOfItem = new Map<number, number>(
        found.rows.map((i: { id: number; price: number }) => [i.id, i.price]),
      )
      for (const i of items) {
        const price = priceOfItem.get(i.itemId)!
        await client.query(
          `INSERT INTO booking_item (booking_id, item_id, quantity, price_paid)
           VALUES ($1, $2, $3, $4)`,
          [bookingId, i.itemId, i.quantity, price],
        )
        total += price * i.quantity
      }
    }

    await client.query('COMMIT')
    res.status(201).json({ bookingRef, totalPrice: total })
  } catch (err) {
    await client.query('ROLLBACK') // undo everything saved in this transaction

    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: 'En eller flera stolar är redan bokade. Välj andra stolar.' })
      return
    }
    console.error('POST /api/bookings failed', err)
    res.status(500).json({ error: 'Kunde inte skapa bokningen.' })
  } finally {
    client.release() // always give the connection back to the pool
  }
})