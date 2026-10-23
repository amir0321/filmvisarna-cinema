import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createMovieBody,
  listMoviesQuerySchema,
  updateMovieBody,
} from "../controllers/movies.controller.js";

test("createMovieBody parses valid movie with BE-5 fields", () => {
  const result = createMovieBody.parse({
    title: "Inception",
    duration_minutes: 148,
    director: "Christopher Nolan",
    imdb_rating: 8.8,
    trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
    landscape_image_url: "https://example.com/inception-landscape.jpg",
    genres: ["Sci-Fi", "Action"],
  });

  assert.equal(result.title, "Inception");
  assert.equal(result.director, "Christopher Nolan");
  assert.equal(result.imdb_rating, 8.8);
  assert.equal(
    result.trailer_url,
    "https://www.youtube.com/watch?v=YoHD9XEInc0",
  );
  assert.equal(
    result.landscape_image_url,
    "https://example.com/inception-landscape.jpg",
  );
});

test("createMovieBody rejects invalid imdb_rating (> 10)", () => {
  assert.throws(
    () =>
      createMovieBody.parse({
        title: "Test Film",
        duration_minutes: 90,
        imdb_rating: 11.5,
      }),
    /imdb_rating kan max vara 10/,
  );
});

test("createMovieBody rejects invalid trailer_url", () => {
  assert.throws(
    () =>
      createMovieBody.parse({
        title: "Test Film",
        duration_minutes: 90,
        trailer_url: "not-a-valid-url",
      }),
    /trailer_url måste vara en giltig URL/,
  );
});

test("updateMovieBody allows partial update with BE-5 fields", () => {
  const result = updateMovieBody.parse({
    director: "Quentin Tarantino",
    imdb_rating: "8.9",
  });

  assert.equal(result.director, "Quentin Tarantino");
  assert.equal(result.imdb_rating, 8.9);
});

test("listMoviesQuerySchema parses genre and search filters (BE-14)", () => {
  const result = listMoviesQuerySchema.parse({
    genre: "Action",
    search: "Star Wars",
    age: "15",
  });

  assert.equal(result.genre, "Action");
  assert.equal(result.search, "Star Wars");
  assert.equal(result.age, 15);
});

