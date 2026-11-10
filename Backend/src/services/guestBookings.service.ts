import { randomBytes } from 'node:crypto';
import type pg from 'pg';
import { pool } from '../db.js';
import { config } from '../config.js';
import type { CreateBookingInput } from '../interfaces/types.js';
import { HttpError } from '../utils/httpErorr.js';
import { isAuthEmailConfigured, sendGuestBookingEmail } from './emailService.js';
import { bookingFingerprint, createBooking } from './bookings.service.js';
import { consumeBookingLimit, hashBookingValue, normalizeBookingEmail } from './bookingLimits.service.js';

export interface GuestBookingEmail { email: string; url: string; expiresInMinutes: number }
interface GuestIntent { email: string; payload: CreateBookingInput; requestKey: string; expiresAt: Date }
const invalidLink = () => new HttpError(400, 'Bekräftelselänken är ogiltig eller har gått ut. Begär en ny länk.');

export function createGuestBookingService(dependencies: {
  db: pg.Pool;
  sendEmail: (message: GuestBookingEmail) => Promise<void>;
  canSendEmail: () => boolean;
  book: typeof createBooking;
} = { db: pool, sendEmail: sendGuestBookingEmail, canSendEmail: isAuthEmailConfigured, book: createBooking }) {
  const { db, sendEmail, canSendEmail, book } = dependencies;

  async function getIntent(token: string): Promise<GuestIntent> {
    if (!/^[a-f0-9]{64}$/.test(token)) throw invalidLink();
    const { rows: [intent] } = await db.query<GuestIntent>(`SELECT email, payload, request_key AS "requestKey", expires_at AS "expiresAt"
      FROM guest_booking_intent WHERE token_hash = $1 AND expires_at > clock_timestamp()`, [hashBookingValue(token)]);
    if (!intent) throw invalidLink();
    return intent;
  }

  async function preview(token: string) {
    const intent = await getIntent(token);
    const input = intent.payload;
    const { rows: [screening] } = await db.query<{ id: number; movieTitle: string; posterUrl: string | null; cinema: string; startsAt: Date; endsAt: Date }>(`
      SELECT st.id, m.title AS "movieTitle", m.poster_url AS "posterUrl", c.name AS cinema,
        st.starts_at AS "startsAt", st.ends_at AS "endsAt"
      FROM screening_times st JOIN movie m ON m.id = st.movie_id JOIN cinema c ON c.id = st.cinema_id
      WHERE st.id = $1 AND st.starts_at > clock_timestamp()`, [input.screeningId]);
    if (!screening) throw new HttpError(409, 'Visningen finns inte längre eller har redan startat.');
    const { rows: tickets } = await db.query<{ seatId: number; priceGroupId: number; row: string; number: number; price: number; name: string }>(`
      SELECT s.id AS "seatId", pg.id AS "priceGroupId", s.row_label AS row, s.seat_number AS number, pg.price, pg.name
      FROM jsonb_array_elements($1::jsonb) WITH ORDINALITY AS t(value, position)
      JOIN seat s ON s.id = (t.value->>'seatId')::int JOIN price_group pg ON pg.id = (t.value->>'priceGroupId')::int
      JOIN screening sc ON sc.id = $2 AND sc.cinema_id = s.cinema_id ORDER BY t.position`, [JSON.stringify(input.tickets), input.screeningId]);
    if (tickets.length !== input.tickets.length) throw new HttpError(400, 'Platserna eller biljettyperna är ogiltiga. Gör ett nytt val.');
    const { rows: items } = await db.query<{ itemId: number; name: string; quantity: number; price: number }>(`
      SELECT mi.id AS "itemId", mi.name, i.quantity, mi.price
      FROM jsonb_to_recordset($1::jsonb) AS i("itemId" int, quantity int)
      JOIN menu_item mi ON mi.id = i."itemId" AND mi.is_available`, [JSON.stringify(input.items ?? [])]);
    if (items.length !== (input.items ?? []).length) throw new HttpError(400, 'En kioskprodukt är inte längre tillgänglig. Gör ett nytt val.');
    return { email: intent.email, guestName: input.guestName, expiresAt: intent.expiresAt, screening, tickets, items,
      totalPrice: tickets.reduce((total, ticket) => total + Number(ticket.price), 0) + items.reduce((total, item) => total + Number(item.price) * item.quantity, 0) };
  }

  async function request(input: CreateBookingInput, requestKey: string) {
    if (!canSendEmail()) throw new HttpError(503, 'E-posttjänsten är tillfälligt otillgänglig. Försök igen senare.');
    const email = normalizeBookingEmail(input.email);
    const payload = { ...input, email };
    const { rows: [existing] } = await db.query<{ requestKey: string; payload: CreateBookingInput; sentAt: Date | null }>(
      'SELECT request_key AS "requestKey", payload, sent_at AS "sentAt" FROM guest_booking_intent WHERE email = $1 AND expires_at > clock_timestamp()', [email]);
    if (existing) {
      if (existing.requestKey === requestKey && bookingFingerprint(existing.payload) === bookingFingerprint(payload)) {
        if (!existing.sentAt) throw new HttpError(503, 'Bekräftelsemejlet håller på att skickas. Försök igen om en stund.');
        return;
      }
      throw new HttpError(429, 'Ett bekräftelsemejl har redan skickats. Använd länken i mejlet eller vänta tills den har gått ut.');
    }
    // Bound storage and mail volume even when attackers rotate addresses and source IPs.
    await consumeBookingLimit(db, 'mail:global', config.bookingLimits.globalEmails);
    await consumeBookingLimit(db, `mail:${email}`, config.bookingLimits.emails, 900, config.bookingLimits.emailCooldownSeconds);
    const token = randomBytes(32).toString('hex');
    const tokenHash = hashBookingValue(token);
    const inserted = await db.query(`INSERT INTO guest_booking_intent(email, token_hash, request_key, payload, expires_at)
      VALUES ($1, $2, $3, $4, clock_timestamp() + make_interval(mins => $5))
      ON CONFLICT (email) DO UPDATE SET token_hash = EXCLUDED.token_hash, request_key = EXCLUDED.request_key,
        payload = EXCLUDED.payload, expires_at = EXCLUDED.expires_at, booking_id = NULL, sent_at = NULL
      WHERE guest_booking_intent.expires_at <= clock_timestamp() RETURNING email`,
    [email, tokenHash, requestKey, payload, config.bookingLimits.guestLinkMinutes]);
    if (!inserted.rowCount) throw new HttpError(429, 'Ett bekräftelsemejl har redan skickats. Kontrollera din inkorg.');
    try {
      // Validate the requested programme and seat/category mapping before sending anything.
      await preview(token);
      const url = new URL('/bekrafta-gastbokning', config.frontendUrl);
      url.hash = new URLSearchParams({ token }).toString();
      await sendEmail({ email, url: url.href, expiresInMinutes: config.bookingLimits.guestLinkMinutes });
      await db.query('UPDATE guest_booking_intent SET sent_at = clock_timestamp() WHERE token_hash = $1', [tokenHash]);
    } catch (error) {
      await db.query('DELETE FROM guest_booking_intent WHERE token_hash = $1', [tokenHash]);
      if (error instanceof HttpError) throw error;
      throw new HttpError(503, 'Bekräftelsemejlet kunde inte skickas. Försök igen senare.');
    }
  }

  async function confirm(token: string, seatIds?: number[]) {
    const intent = await getIntent(token);
    const input = intent.payload;
    if (seatIds) {
      if (seatIds.length !== input.tickets.length || new Set(seatIds).size !== seatIds.length) {
        throw new HttpError(400, 'Välj lika många olika platser som biljetter.');
      }
      input.tickets = input.tickets.map((ticket, index) => ({ ...ticket, seatId: seatIds[index] }));
    }
    return book(input, null, { requestKey: intent.requestKey, guestToken: token });
  }

  return { request, preview, confirm };
}

export const guestBookingService = createGuestBookingService();
