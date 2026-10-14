import assert from "node:assert/strict";
import { test } from "node:test";

function seatStatus(
  hasTicket: boolean,
  bookingStatus?: string,
): "booked" | "available" {
  return hasTicket && bookingStatus === "confirmed" ? "booked" : "available";
}

test("Seat without a ticket is available", () => {
  assert.equal(seatStatus(false), "available");
});

test("Seat with confirmed booking is booked", () => {
  assert.equal(seatStatus(true, "confirmed"), "booked");
});

test("Seat with cancelled booking is available", () => {
  assert.equal(seatStatus(true, "cancelled"), "available");
});
