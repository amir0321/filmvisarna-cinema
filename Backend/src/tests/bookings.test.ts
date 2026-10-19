import assert from "node:assert/strict";
import { test } from "node:test";
import {
  listBookingsQuerySchema,
  updateBookingSchema,
} from "../controllers/bookings.controller.js";

test("listBookingsQuerySchema parses empty query", () => {
  const result = listBookingsQuerySchema.parse({});
  assert.deepEqual(result, {});
});

test("listBookingsQuerySchema parses valid filters", () => {
  const result = listBookingsQuerySchema.parse({
    screeningId: "12",
    status: "confirmed",
    isPaid: "true",
    search: "FV-12345",
    from: "2026-10-19",
    to: "2026-10-25",
  });
  assert.deepEqual(result, {
    screeningId: 12,
    status: "confirmed",
    isPaid: true,
    search: "FV-12345",
    from: "2026-10-19",
    to: "2026-10-25",
  });
});

test("listBookingsQuerySchema rejects invalid status", () => {
  assert.throws(
    () => listBookingsQuerySchema.parse({ status: "invalid_status" }),
    /Invalid option/,
  );
});

test("listBookingsQuerySchema rejects invalid date format", () => {
  assert.throws(
    () => listBookingsQuerySchema.parse({ from: "19-10-2026" }),
    /Format: ÅÅÅÅ-MM-DD/,
  );
});

test("updateBookingSchema accepts valid isPaid and isCheckedIn", () => {
  const r1 = updateBookingSchema.parse({ isPaid: true });
  assert.deepEqual(r1, { isPaid: true });

  const r2 = updateBookingSchema.parse({ isCheckedIn: true });
  assert.deepEqual(r2, { isCheckedIn: true });

  const r3 = updateBookingSchema.parse({ isPaid: true, isCheckedIn: true });
  assert.deepEqual(r3, { isPaid: true, isCheckedIn: true });
});

test("updateBookingSchema rejects empty body", () => {
  assert.throws(
    () => updateBookingSchema.parse({}),
    /Minst ett fält/,
  );
});

