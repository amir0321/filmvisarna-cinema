import assert from 'node:assert/strict';
import { before, test } from 'node:test';

process.env.JWT_SECRET = 'isolated-cancellation-unit-test-secret';
let cancellationCredentialsSchema: typeof import('../services/cancellations.service.js').cancellationCredentialsSchema;
let validateCancellationDeadline: typeof import('../services/cancellations.service.js').validateCancellationDeadline;
let generateBookingConfirmationHtml: typeof import('../templates/bookingConfirmationTemplate.js').generateBookingConfirmationHtml;
let generateBookingConfirmationText: typeof import('../templates/bookingConfirmationTemplate.js').generateBookingConfirmationText;
before(async () => {
  ({ cancellationCredentialsSchema, validateCancellationDeadline } = await import('../services/cancellations.service.js'));
  ({ generateBookingConfirmationHtml, generateBookingConfirmationText } = await import('../templates/bookingConfirmationTemplate.js'));
});

test('cancellation credentials normalize reference and email and reject malformed inputs', () => {
  assert.deepEqual(cancellationCredentialsSchema.parse({ bookingRef: ' fv-a1b2c ', email: ' ANNA@EXAMPLE.TEST ' }), {
    bookingRef: 'FV-A1B2C', email: 'anna@example.test',
  });
  for (const bookingRef of ['FV-1234', 'FV-123456', 'XX-12345', 'FV-A!BCD', '', null, 123]) {
    assert.equal(cancellationCredentialsSchema.safeParse({ bookingRef, email: 'anna@example.test' }).success, false);
  }
  for (const email of ['invalid', '', null, 123, `${'a'.repeat(200)}@example.test`]) {
    assert.equal(cancellationCredentialsSchema.safeParse({ bookingRef: 'FV-ABCDE', email }).success, false);
  }
});

test('cancellation is allowed exactly two hours before start, but not one millisecond later', () => {
  const now = Date.parse('2026-11-15T12:00:00Z');
  const startsAt = new Date(now + 2 * 60 * 60 * 1000);
  assert.doesNotThrow(() => validateCancellationDeadline(startsAt, now, 2));
  assert.throws(() => validateCancellationDeadline(startsAt, now + 1, 2), { status: 400, message: 'Kan inte avboka mindre än 2 timmar innan visningen startar.' });
  assert.throws(() => validateCancellationDeadline(startsAt, startsAt, 2), { status: 400, message: 'Kan inte avboka en visning som redan har startat.' });
});

test('HTML and text confirmation emails explain the reference/email form and cancellation deadline', () => {
  const data = {
    email: 'anna@example.test', bookingRef: 'FV-ABCDE', movieTitle: 'Testfilm',
    screeningDate: '15 november 2099', screeningTime: '18:00', cinemaName: 'Stora salongen',
    seats: ['A1'], tickets: [{ type: 'Vuxen', quantity: 1, price: 140 }], kioskItems: [],
    cancelUrl: 'https://cinema.example/avboka',
  };
  for (const content of [generateBookingConfirmationHtml(data), generateBookingConfirmationText(data)]) {
    assert.match(content, /https:\/\/cinema.example\/avboka/);
    assert.match(content, /Ange bokningsnummer och e-postadressen som användes vid bokningen/);
    assert.match(content, /senast 2 timmar före visningen/);
    assert.doesNotMatch(content, /#token=|\?token=/);
  }
});
