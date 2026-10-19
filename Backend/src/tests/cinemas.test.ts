import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createCinemaSchema,
  updateCinemaSchema,
} from "../controllers/cinemas.controller.js";

test("createCinemaSchema parses valid cinema with BE-7 tech fields", () => {
  const result = createCinemaSchema.parse({
    name: "Salong IMAX",
    format: "4K Laser",
    tech: "Dolby Atmos 11.1",
    screen_size: "22x10 m",
    opened_year: 2024,
    rows: 12,
    seatsPerRow: 14,
  });

  assert.equal(result.name, "Salong IMAX");
  assert.equal(result.format, "4K Laser");
  assert.equal(result.tech, "Dolby Atmos 11.1");
  assert.equal(result.screen_size, "22x10 m");
  assert.equal(result.opened_year, 2024);
  assert.equal(result.rows, 12);
  assert.equal(result.seatsPerRow, 14);
});

test("updateCinemaSchema parses partial update with wheelchairSeats", () => {
  const result = updateCinemaSchema.parse({
    format: "4K Dolby Atmos",
    wheelchairSeats: [
      { row: "A", number: 1 },
      { row: "A", number: 2 },
    ],
  });

  assert.equal(result.format, "4K Dolby Atmos");
  assert.equal(result.wheelchairSeats?.length, 2);
  assert.equal(result.wheelchairSeats?.[0].row, "A");
  assert.equal(result.wheelchairSeats?.[0].number, 1);
});
