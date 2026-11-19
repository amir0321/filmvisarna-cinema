import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile, readdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import type { Server } from "node:http";
import { createServer } from "node:http";
import pg from "pg";
import type { Movie, Person } from "../interfaces/types.js";

// Only use an explicitly configured test database, never the project's .env.
const databaseUrl = process.env.CAST_TEST_DATABASE_URL ?? process.env.AUTH_TEST_DATABASE_URL;
type TmdbDetails = Awaited<ReturnType<typeof import("../services/tmdb.service.js").getTmdbMovieDetails>>;
type TmdbSearch = Awaited<ReturnType<typeof import("../services/tmdb.service.js").searchTmdbMovies>>;
type TmdbReply = { status?: number; body?: unknown; raw?: string; location?: string };

describe("cast profiles, movies and uploads with PostgreSQL", { skip: !databaseUrl }, () => {
  let admin: pg.Pool;
  let pool: pg.Pool;
  let server: Server;
  let tmdbServer: Server;
  let appConfig: typeof import("../config.js").config;
  let tmdbReply: (url: URL) => TmdbReply | Promise<TmdbReply>;
  const tmdbCalls: URL[] = [];
  const tmdbTestKey = "isolated-tmdb-test-key-never-use-real-credentials";
  let baseUrl: string;
  let adminCookie: string;
  let userCookie: string;
  let createSession: (id: number) => Promise<{ token: string }>;
  const schema = `cast_test_${randomUUID().replaceAll("-", "")}`;
  const uploadedFiles: string[] = [];

  before(async () => {
    admin = new pg.Pool({ connectionString: databaseUrl });
    await admin.query(`CREATE SCHEMA "${schema}"`);
    const isolatedUrl = new URL(databaseUrl!);
    isolatedUrl.searchParams.set("options", `-c search_path=${schema}`);
    process.env.DATABASE_URL = isolatedUrl.href;
    process.env.DB_SSL = "false";
    process.env.JWT_SECRET = "isolated-cast-integration-test-secret-only";
    process.env.NODE_ENV = "test";
    process.env.FRONTEND_URL = "http://localhost:5173";
    process.env.CORS_ORIGIN = "http://localhost:5173";
    tmdbServer = createServer(async (req, res) => {
      const url = new URL(req.url!, "http://localhost");
      tmdbCalls.push(url);
      try {
        const reply = await tmdbReply(url);
        res.writeHead(reply.status ?? 200, { "Content-Type": "application/json", ...(reply.location ? { Location: reply.location } : {}) });
        res.end(reply.raw ?? JSON.stringify(reply.body ?? {}));
      } catch {
        res.writeHead(500);
        res.end();
      }
    });
    await new Promise<void>(done => tmdbServer.listen(0, "127.0.0.1", done));
    const tmdbAddress = tmdbServer.address();
    assert.ok(tmdbAddress && typeof tmdbAddress !== "string");
    process.env.TMDB_API_KEY = tmdbTestKey;
    process.env.TMDB_API_BASE_URL = `http://127.0.0.1:${tmdbAddress.port}/3`;
    ({ config: appConfig } = await import("../config.js"));
    ({ pool } = await import("../db.js"));
    ({ createSession } = await import("../services/sessions.service.js"));
    await pool.query(await readFile(resolve("sql/01_schema.sql"), "utf8"));
    const { app } = await import("../app.js");
    server = await new Promise<Server>((resolveServer) => {
      const listening = app.listen(0, "127.0.0.1", () => resolveServer(listening));
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    baseUrl = `http://127.0.0.1:${address.port}/api`;
  });

  beforeEach(async () => {
    appConfig.tmdbApiKey = tmdbTestKey;
    tmdbCalls.length = 0;
    tmdbReply = () => ({ status: 500 });
    await pool.query("TRUNCATE person, movie, genre, cinema, app_user RESTART IDENTITY CASCADE");
    const { rows } = await pool.query<{ id: number }>(`INSERT INTO app_user (email, password_hash, role)
      VALUES ('admin@example.test', 'unused', 'admin'), ('user@example.test', 'unused', 'user') RETURNING id`);
    adminCookie = `filmvisarna_session=${(await createSession(rows[0].id)).token}`;
    userCookie = `filmvisarna_session=${(await createSession(rows[1].id)).token}`;
  });

  after(async () => {
    if (server) await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
    if (tmdbServer) await new Promise<void>((done, reject) => tmdbServer.close(error => error ? reject(error) : done()));
    await Promise.all(uploadedFiles.map(file => unlink(file)));
    await pool?.end();
    if (admin) {
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await admin.end();
    }
  });

  async function request<T = Person>(path: string, method = "GET", body?: unknown, cookie = adminCookie) {
    const response = await fetch(baseUrl + path, {
      method,
      headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1", Cookie: cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() as { success: boolean; data: T; error?: string } };
  }

  test("migration preserves legacy rows, can run twice and keeps TMDB IDs unique", async () => {
    await pool.query(`ALTER TABLE person DROP COLUMN photo_url, DROP COLUMN bio, DROP COLUMN tmdb_id;
      ALTER TABLE movie_person DROP COLUMN character_name, DROP COLUMN billing_order;
      INSERT INTO person (name) VALUES ('Legacy actor'), (' legacy ACTOR ');
      INSERT INTO movie (title, duration_minutes) VALUES ('Legacy film', 90);
      INSERT INTO movie_person (movie_id, person_id, role) VALUES (1, 1, 'actor')`);
    const migration = await readFile(resolve("sql/migrations/20261112_cast_profiles.sql"), "utf8");
    await pool.query(migration);
    await pool.query(migration);
    assert.deepEqual((await pool.query("SELECT * FROM person ORDER BY id")).rows, [
      { id: 1, name: "Legacy actor", photo_url: null, bio: null, tmdb_id: null },
      { id: 2, name: " legacy ACTOR ", photo_url: null, bio: null, tmdb_id: null },
    ]);
    assert.deepEqual((await pool.query("SELECT * FROM movie_person")).rows, [
      { movie_id: 1, person_id: 1, role: "actor", character_name: null, billing_order: 0 },
    ]);
    await pool.query("UPDATE person SET tmdb_id = 10 WHERE id = 1");
    await assert.rejects(pool.query("UPDATE person SET tmdb_id = 10 WHERE id = 2"), { code: "23505" });
  });

  test("person API reuses normalized names and TMDB IDs, updates profiles and searches publicly", async () => {
    const first = await request("/persons", "POST", { name: "  Actor Name  ", photo_url: "/uploads/actor.jpg", bio: "Original" });
    assert.equal(first.status, 201);
    const sameName = await request("/persons", "POST", { name: " actor NAME ", tmdb_id: 42 });
    assert.equal(sameName.body.data.id, first.body.data.id);
    assert.equal(sameName.body.data.photo_url, "/uploads/actor.jpg");
    const sameTmdb = await request("/persons", "POST", { name: "Updated Name", tmdb_id: 42 });
    assert.equal(sameTmdb.body.data.id, first.body.data.id);
    const updated = await request(`/persons/${first.body.data.id}`, "PUT", { bio: null, photo_url: "https://example.test/actor.png" });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.bio, null);
    assert.equal(updated.body.data.tmdb_id, 42);
    const listed = await request<Person[]>("/persons?search=UPDATED", "GET", undefined, "");
    assert.equal(listed.status, 200);
    assert.deepEqual(listed.body.data, [updated.body.data]);
    assert.equal((await request<Person[]>("/persons?search=missing")).body.data.length, 0);
    assert.equal((await request("/persons/999", "PUT", { bio: "Missing" })).status, 404);
  });

  test("concurrent person creation does not produce duplicate normalized names or TMDB IDs", async () => {
    for (const inputs of [
      [{ name: " Concurrent Name " }, { name: "concurrent NAME" }],
      [{ name: "First name", tmdb_id: 77 }, { name: "Second name", tmdb_id: 77 }],
    ]) {
      const results = await Promise.all(inputs.map(input => request("/persons", "POST", input)));
      assert.ok(results.every(result => result.status === 201));
      assert.equal(results[0].body.data.id, results[1].body.data.id);
    }
    assert.equal((await request<Person[]>("/persons")).body.data.length, 2);
  });

  test("public person lists and searches return at most 50 people in stable order", async () => {
    await pool.query(`INSERT INTO person (name)
      SELECT 'Actor ' || lpad(n::text, 3, '0') FROM generate_series(1, 60) n`);
    for (const path of ["/persons", "/persons?search=actor"]) {
      const result = await request<Person[]>(path, "GET", undefined, "");
      assert.equal(result.status, 200);
      assert.equal(result.body.data.length, 50);
      assert.equal(result.body.data[0].name, "Actor 001");
      assert.equal(result.body.data[49].name, "Actor 050");
    }
  });

  test("editing an existing profile rejects collisions without merging or changing other people", async () => {
    const first = (await request("/persons", "POST", { name: "First", tmdb_id: 10 })).body.data;
    const second = (await request("/persons", "POST", { name: "Second", tmdb_id: 20 })).body.data;
    for (const input of [{ name: " SECOND " }, { tmdb_id: 20 }, { name: "Second", tmdb_id: 10 }]) {
      assert.equal((await request(`/persons/${first.id}`, "PUT", input)).status, 409);
    }
    assert.deepEqual((await request<Person[]>("/persons")).body.data, [first, second]);
  });

  test("person and movie writes require admin and validate profile and cast input", async () => {
    for (const cookie of ["", userCookie]) {
      const status = cookie ? 403 : 401;
      for (const [path, method] of [["/persons", "POST"], ["/persons/1", "PUT"], ["/movies", "POST"], ["/movies/1", "PUT"]]) {
        assert.equal((await request(path, method, {}, cookie)).status, status);
      }
    }
    for (const input of [{ name: " " }, { name: "Actor", tmdb_id: -1 }, { name: "Actor", photo_url: "javascript:alert(1)" }]) {
      assert.equal((await request("/persons", "POST", input)).status, 400);
    }
    for (const member of [{}, { name: " " }, { name: "Actor", billing_order: -1 }, { name: "Actor", person_id: 0 }]) {
      assert.equal((await request("/movies", "POST", { title: "Film", duration_minutes: 90, cast_members: [member] })).status, 400);
    }
    for (const url of ["ftp://example.test/image.jpg", "/other/image.jpg", "/uploads/../secret", "//evil.test/image.jpg"]) {
      assert.equal((await request("/movies", "POST", { title: "Film", duration_minutes: 90, poster_url: url })).status, 400);
    }
  });

  test("movies return ordered cast, legacy actors and accurate counts without genre multiplication", async () => {
    const person = (await request("/persons", "POST", { name: "Zed", tmdb_id: 100, bio: "Biography", photo_url: "/uploads/zed.webp" })).body.data;
    const created = await request<Movie>("/movies", "POST", {
      title: "Cast film", duration_minutes: 90, genres: ["Drama", "Action", "Drama"],
      poster_url: "/uploads/poster.png", landscape_image_url: "http://example.test/wide.jpg",
      cast_members: [
        { person_id: person.id, character_name: "Hero", billing_order: 2 },
        { name: "Beta", billing_order: 1 }, { name: "Alpha", billing_order: 1 },
      ],
    });
    assert.equal(created.status, 201);
    const movie = created.body.data;
    assert.deepEqual(movie.genres, ["Action", "Drama"]);
    assert.deepEqual(movie.actors, ["Alpha", "Beta", "Zed"]);
    assert.deepEqual(movie.cast_members[2], { person_id: person.id, name: "Zed", photo_url: "/uploads/zed.webp", bio: "Biography", character_name: "Hero", tmdb_id: 100, billing_order: 2 });
    assert.equal(movie.total_screenings_count, 0);
    assert.equal(movie.active_screenings_count, 0);
    await pool.query("INSERT INTO cinema (name) VALUES ('Test cinema')");
    await pool.query(`INSERT INTO screening (movie_id, cinema_id, starts_at)
      VALUES ($1, 1, now() - interval '1 day'), ($1, 1, now() + interval '1 day'), ($1, 1, now() + interval '2 days')`, [movie.id]);
    const detail = (await request<Movie>(`/movies/${movie.id}`, "GET", undefined, "")).body.data;
    assert.equal(detail.total_screenings_count, 3);
    assert.equal(detail.active_screenings_count, 2);
    assert.deepEqual((await request<Movie[]>("/movies?genre=Drama")).body.data, [detail]);
  });

  test("image and trailer URLs reject credentials, unsafe schemes, long values and upload traversal", async () => {
    const movie = (await request<Movie>("/movies", "POST", { title: "URL film", duration_minutes: 90 })).body.data;
    const person = (await request("/persons", "POST", { name: "URL Actor" })).body.data;
    const invalidHttpUrls = [
      "javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "ftp://example.test/file",
      "https://user@example.test/image", "https://:password@example.test/image",
      "http://user:password@example.test/image", `https://example.test/${"a".repeat(2048)}`,
    ];
    for (const url of invalidHttpUrls) {
      for (const [path, method] of [["/movies", "POST"], [`/movies/${movie.id}`, "PUT"]]) {
        const result = await request(path, method, { title: "URL film", duration_minutes: 90, trailer_url: url });
        assert.equal(result.status, 400, `${method} ${path}: ${url.slice(0, 80)}`);
      }
    }
    for (const url of [...invalidHttpUrls, "/uploads/image..png", "/uploads/../secret", "/uploads/%2e%2e.png", `/uploads/${"a".repeat(2048)}`]) {
      for (const field of ["poster_url", "landscape_image_url"]) {
        assert.equal((await request("/movies", "POST", { title: "Film", duration_minutes: 90, [field]: url })).status, 400);
        assert.equal((await request(`/movies/${movie.id}`, "PUT", { [field]: url })).status, 400);
      }
      assert.equal((await request("/persons", "POST", { name: "Actor", photo_url: url })).status, 400);
      assert.equal((await request(`/persons/${person.id}`, "PUT", { photo_url: url })).status, 400);
    }
    for (const url of ["http://example.test/trailer", "https://example.test/watch?v=123"]) {
      assert.equal((await request("/movies", "POST", { title: "Safe URL film", duration_minutes: 90, trailer_url: url })).status, 201);
      assert.equal((await request(`/movies/${movie.id}`, "PUT", { trailer_url: url })).status, 200);
    }
    assert.equal((await request(`/movies/${movie.id}`, "PUT", { trailer_url: "/uploads/trailer.mp4" })).status, 400);
  });

  test("movie updates reuse people, preserve omitted relations and remove only actor links", async () => {
    const created = await request<Movie>("/movies", "POST", { title: "Film", duration_minutes: 90, genres: ["Drama"], cast_members: [{ name: "Shared", tmdb_id: 50 }] });
    const movie = created.body.data;
    const personId = movie.cast_members[0].person_id;
    await pool.query("INSERT INTO movie_person (movie_id, person_id, role) VALUES ($1, $2, 'director')", [movie.id, personId]);
    const other = await request<Movie>("/movies", "POST", { title: "Other", duration_minutes: 80, cast_members: [{ name: " shared " }] });
    assert.equal(other.body.data.cast_members[0].person_id, personId);
    const updated = await request<Movie>(`/movies/${movie.id}`, "PUT", { cast_members: [{ person_id: personId, name: "Shared Updated", photo_url: "/uploads/new.gif", character_name: "Lead", billing_order: 5 }] });
    assert.equal(updated.status, 200);
    assert.deepEqual(updated.body.data.genres, ["Drama"]);
    assert.equal(updated.body.data.cast_members[0].character_name, "Lead");
    const titleOnly = await request<Movie>(`/movies/${movie.id}`, "PUT", { title: "Renamed" });
    assert.deepEqual(titleOnly.body.data.cast_members, updated.body.data.cast_members);
    const cleared = await request<Movie>(`/movies/${movie.id}`, "PUT", { cast_members: [], genres: [] });
    assert.deepEqual(cleared.body.data.cast_members, []);
    assert.deepEqual(cleared.body.data.actors, []);
    assert.deepEqual(cleared.body.data.genres, []);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM person WHERE id = $1", [personId])).rows[0].n, 1);
    assert.equal((await pool.query("SELECT role FROM movie_person WHERE movie_id = $1", [movie.id])).rows[0].role, "director");
    const otherDetail = (await request<Movie>(`/movies/${other.body.data.id}`)).body.data;
    assert.equal(otherDetail.cast_members[0].name, "Shared Updated");
    assert.equal(otherDetail.cast_members[0].photo_url, "/uploads/new.gif");
  });

  test("failed cast writes roll back the movie, genres and profile changes together", async () => {
    const { createMovie, updateMovie, getMovieById } = await import("../services/movies.service.js");
    const movie = await createMovie({ title: "Original", duration_minutes: 90, genres: ["Drama"], cast_members: [{ name: "Original actor" }] });
    await assert.rejects(updateMovie(movie.id, {
      title: "Changed", genres: ["New genre"], cast_members: [
        { person_id: movie.cast_members[0].person_id, bio: "Should roll back" },
        { name: "Should not remain" }, { person_id: 999999 },
      ],
    }), { status: 404 });
    assert.deepEqual(await getMovieById(movie.id), movie);
    assert.equal((await pool.query("SELECT 1 FROM genre WHERE name = 'New genre'")).rowCount, 0);
    assert.equal((await pool.query("SELECT 1 FROM person WHERE name = 'Should not remain'")).rowCount, 0);
    await assert.rejects(createMovie({ title: "Failed creation", duration_minutes: 80, genres: ["New genre"], cast_members: [{ person_id: 999999 }] }), { status: 404 });
    assert.equal((await pool.query("SELECT 1 FROM movie WHERE title = 'Failed creation'")).rowCount, 0);
    const duplicate = await request<Movie>(`/movies/${movie.id}`, "PUT", { cast_members: [{ person_id: movie.cast_members[0].person_id }, { name: "original ACTOR" }] });
    assert.equal(duplicate.status, 400);
    assert.deepEqual(await getMovieById(movie.id), movie);
  });

  function tmdbMovieFixture() {
    return {
      id: 42, title: " <b>En film</b> ", original_title: " Original title ", overview: " Svensk beskrivning ",
      release_date: "2020-06-12", poster_path: "/poster.jpg", backdrop_path: "/landscape.webp",
      runtime: 120, vote_average: 8.2,
      genres: [{ name: " Drama " }],
      credits: {
        cast: [{ id: 101, name: "Actor", character: "Hero", order: 0, profile_path: "/actor.jpg" }],
        crew: [{ name: "<b>Director</b>", job: "Director" }],
      },
      videos: { results: [
        { site: "YouTube", type: "Trailer", key: "javascript:alert(1)", official: true, iso_639_1: "sv" },
        { site: "YouTube", type: "Trailer", key: "abcdefghijk", official: true, iso_639_1: "en" },
        { site: "YouTube", type: "Trailer", key: "sv123456789", official: true, iso_639_1: "sv" },
      ] },
      release_dates: { results: [
        { iso_3166_1: "US", release_dates: [{ certification: " PG-13 ", type: 3 }] },
        { iso_3166_1: "SE", release_dates: [{ certification: " 11 ", type: 3 }] },
      ] },
    };
  }

  test("TMDB endpoints require admin and validate search and IDs before upstream calls", async () => {
    for (const path of ["/movies/external/search?query=film", "/movies/external/42"]) {
      assert.equal((await request(path, "GET", undefined, "")).status, 401);
      assert.equal((await request(path, "GET", undefined, userCookie)).status, 403);
    }
    for (const path of [
      "/movies/external/search", "/movies/external/search?query=a", "/movies/external/search?query=%20%20",
      `/movies/external/search?query=${"a".repeat(121)}`, "/movies/external/search?query[]=film",
      "/movies/external/abc", "/movies/external/0", "/movies/external/-1", "/movies/external/1.5",
    ]) assert.equal((await request(path)).status, 400, path);
    assert.equal(tmdbCalls.length, 0);
  });

  test("TMDB search sanitizes external text, restricts image URLs and returns at most eight suggestions", async () => {
    const paths = ["/safe.JPG", "//evil.test/image.jpg", "/folder/image.jpg", "https://evil.test/image.jpg", "/image.svg", "/bad.jpg?key=value", "/safe.webp", null];
    tmdbReply = () => ({ body: { results: Array.from({ length: 12 }, (_, index) => ({
      id: index + 1, title: ` \u0000<b>Film ${index}</b> `, original_title: "<i>Original</i>",
      overview: `<script>${tmdbTestKey}</script><p>Beskrivning</p>\u007f`,
      release_date: index === 1 ? "" : "2021-03-15", poster_path: paths[index % paths.length],
      api_key: tmdbTestKey,
    })) } });
    const result = await request<TmdbSearch>("/movies/external/search?query=Film%20%26%20api_key%3Devil");
    assert.equal(result.status, 200);
    assert.equal(result.body.data.length, 8);
    assert.deepEqual(result.body.data[0], { tmdbId: 1, title: "Film 0", originalTitle: "Original", releaseYear: 2021, posterUrl: "https://image.tmdb.org/t/p/w500/safe.JPG", overview: "Beskrivning" });
    assert.equal(result.body.data[1].releaseYear, null);
    for (const index of [1, 2, 3, 4, 5, 7]) assert.equal(result.body.data[index].posterUrl, null);
    assert.equal(JSON.stringify(result.body).includes(tmdbTestKey), false);
    assert.equal(tmdbCalls[0].pathname, "/3/search/movie");
    assert.equal(tmdbCalls[0].searchParams.get("api_key"), tmdbTestKey);
    assert.equal(tmdbCalls[0].searchParams.get("query"), "Film & api_key=evil");
    assert.equal(tmdbCalls[0].searchParams.get("language"), "sv-SE");
    assert.equal((await pool.query("SELECT 1 FROM movie")).rowCount, 0);
  });

  test("TMDB details prefer Swedish bios, fall back to English, reuse local biographies and fetch up to eight actors concurrently", async () => {
    await pool.query("INSERT INTO person (name,tmdb_id,bio) VALUES ('Local',101,'<b>Lokal biografi</b>')");
    const movie = tmdbMovieFixture();
    movie.overview = "<script>discard()</script>";
    movie.poster_path = "/unsafe.svg";
    movie.credits.cast = Array.from({ length: 10 }, (_, index) => ({
      id: 101 + index, name: ` <b>Actor ${index}</b> `, character: "<i>Hero</i>",
      order: index, profile_path: index === 1 ? "//evil.test/a.jpg" : "/actor.jpg",
    })).reverse();
    let active = 0;
    let maxActive = 0;
    tmdbReply = async url => {
      if (url.pathname === "/3/movie/42") {
        return { body: url.searchParams.get("language") === "en-US" ? { ...movie, overview: " <p>English fallback</p> " } : movie };
      }
      const id = Number(url.pathname.split("/").pop());
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise(done => setTimeout(done, 15));
      active--;
      if (id === 104) return { status: 500, body: { api_key: tmdbTestKey } };
      return { body: { id, biography: "English primary", translations: { translations: [
        { iso_639_1: "en", data: { biography: "<p>English biography</p>" } },
        { iso_639_1: "sv", data: { biography: id === 103 ? " " : " <b>Svensk biografi</b><script>bad()</script> " } },
      ] } } };
    };
    const result = await request<TmdbDetails>("/movies/external/42");
    assert.equal(result.status, 200);
    const details = result.body.data;
    assert.equal(details.title, "En film");
    assert.equal(details.description, "English fallback");
    assert.equal(details.duration_minutes, 120);
    assert.equal(details.age_rating, "11");
    assert.equal(details.imdb_rating, 8.2);
    assert.deepEqual(details.genres, ["Drama"]);
    assert.equal(details.director, "Director");
    assert.equal(details.poster_url, null);
    assert.equal(details.landscape_image_url, "https://image.tmdb.org/t/p/w1280/landscape.webp");
    assert.equal(details.trailer_url, "https://www.youtube.com/watch?v=sv123456789");
    assert.equal(details.cast_members.length, 8);
    assert.deepEqual(details.cast_members.map(member => member.billing_order), [0, 1, 2, 3, 4, 5, 6, 7]);
    assert.equal(details.cast_members[0].bio, "Lokal biografi");
    assert.equal(details.cast_members[1].bio, "Svensk biografi");
    assert.equal(details.cast_members[2].bio, "English biography");
    assert.equal(details.cast_members[3].bio, null);
    assert.equal(details.cast_members[1].photo_url, null);
    assert.equal(details.cast_members[0].character_name, "Hero");
    assert.equal(tmdbCalls.some(call => call.pathname === "/3/person/101"), false);
    assert.equal(tmdbCalls.filter(call => call.pathname.startsWith("/3/person/")).length, 7);
    assert.ok(maxActive > 1, "person details must be fetched in parallel");
    assert.equal(tmdbCalls[0].searchParams.get("append_to_response"), "credits,videos,release_dates");
    assert.equal(tmdbCalls[0].searchParams.get("include_video_language"), "sv,en,null");
    assert.equal(JSON.stringify(details).includes(tmdbTestKey), false);
    assert.equal((await pool.query("SELECT 1 FROM movie")).rowCount, 0);
    assert.equal((await pool.query("SELECT 1 FROM person")).rowCount, 1);
  });

  test("TMDB details use US certification and primary English biography when translations are empty", async () => {
    const movie = tmdbMovieFixture();
    movie.release_dates.results = movie.release_dates.results.filter(item => item.iso_3166_1 === "US");
    movie.videos.results = [];
    tmdbReply = url => ({ body: url.pathname.startsWith("/3/person/")
      ? { id: 101, biography: "<b>Primary English</b>", translations: { translations: [] } } : movie });
    const result = await request<TmdbDetails>("/movies/external/42");
    assert.equal(result.status, 200);
    assert.equal(result.body.data.age_rating, "PG-13");
    assert.equal(result.body.data.cast_members[0].bio, "Primary English");
    assert.equal(result.body.data.trailer_url, null);
    assert.equal(tmdbCalls.filter(call => call.pathname === "/3/movie/42").length, 1);
  });

  test("TMDB configuration, rate limits and upstream errors use safe responses without key leakage or error logging", async t => {
    const logged = t.mock.method(console, "error", () => undefined);
    appConfig.tmdbApiKey = "";
    for (const path of ["/movies/external/search?query=Film", "/movies/external/42"]) {
      const result = await request(path);
      assert.equal(result.status, 503);
      assert.equal(result.body.error, "Extern filmsökning är inte konfigurerad på servern.");
    }
    assert.equal(tmdbCalls.length, 0);
    appConfig.tmdbApiKey = tmdbTestKey;
    for (const status of [429, 401, 500]) {
      tmdbReply = () => ({ status, body: { status_message: tmdbTestKey } });
      for (const path of ["/movies/external/search?query=Film", "/movies/external/42"]) {
        const result = await request(path);
        assert.equal(result.status, status === 429 ? 429 : 502);
        assert.equal(result.body.error, status === 429
          ? "För många anrop mot film-API:et. Vänta en stund och försök igen."
          : "Kunde inte hämta filmdata från externt API.");
        assert.equal(JSON.stringify(result.body).includes(tmdbTestKey), false);
      }
    }
    for (const body of [{ results: [{ id: "bad", title: tmdbTestKey }] }, { error: tmdbTestKey }]) {
      tmdbReply = () => ({ body });
      assert.equal((await request("/movies/external/search?query=Film")).status, 502);
    }
    tmdbReply = () => ({ raw: "not-json " + tmdbTestKey });
    assert.equal((await request("/movies/external/42")).status, 502);
    assert.equal(logged.mock.calls.length, 0);
  });

  test("TMDB requests use an eight-second timeout and do not forward credentials through redirects", async t => {
    tmdbReply = () => ({ status: 302, location: "/3/leaked-redirect" });
    assert.equal((await request("/movies/external/search?query=Film")).status, 502);
    assert.equal(tmdbCalls.length, 1);
    const timeout = t.mock.method(AbortSignal, "timeout", (milliseconds: number) => {
      assert.equal(milliseconds, 8000);
      return AbortSignal.abort(new DOMException("Timed out", "TimeoutError"));
    });
    const result = await request("/movies/external/search?query=Film");
    assert.equal(result.status, 502);
    assert.equal(timeout.mock.calls.length, 1);
    assert.equal(JSON.stringify(result.body).includes(tmdbTestKey), false);
  });

  test("TMDB person rate limits remain visible even when biographies are fetched with allSettled", async () => {
    tmdbReply = url => url.pathname.startsWith("/3/person/")
      ? { status: 429, body: { key: tmdbTestKey } } : { body: tmdbMovieFixture() };
    const result = await request("/movies/external/42");
    assert.equal(result.status, 429);
    assert.equal(JSON.stringify(result.body).includes(tmdbTestKey), false);
  });

  test("seed enrichment fills legacy profiles and credits, reuses actors across movies and preserves edited biographies", async () => {
    const { seedMovies } = await import("../seeds/demo.js");
    const { getSeedMovies } = await import("../seeds/movieData.js");
    const { withTransaction } = await import("../utils/dbHelpers.js");
    await pool.query("INSERT INTO person (name,bio) VALUES ('Ryan Gosling','Administratörens biografi')");
    await withTransaction(client => seedMovies(client, "2026-11-12"));
    await withTransaction(client => seedMovies(client, "2026-11-12"));
    const expected = getSeedMovies("2026-11-12").flatMap(movie => movie.cast_members);
    const people = (await pool.query<Person>("SELECT * FROM person WHERE tmdb_id IS NOT NULL")).rows;
    assert.equal(people.length, new Set(expected.map(member => member.tmdb_id)).size);
    assert.ok(people.every(person => person.photo_url?.startsWith("https://") && person.bio));
    const gosling = people.find(person => person.name === "Ryan Gosling")!;
    assert.equal(gosling.bio, "Administratörens biografi");
    assert.equal((await pool.query("SELECT 1 FROM movie_person WHERE person_id=$1 AND role='actor'", [gosling.id])).rowCount, 3);
    const credits = (await pool.query("SELECT character_name,billing_order FROM movie_person WHERE role='actor'")).rows;
    assert.equal(credits.length, expected.length);
    assert.ok(credits.every(credit => credit.character_name && Number.isInteger(credit.billing_order)));
    assert.equal(tmdbCalls.length, 0, "seed enrichment must work without TMDB network access");
  });

  const imageHeaders: Record<string, Buffer> = {
    "image/jpeg": Buffer.from("ffd8ff", "hex"),
    "image/png": Buffer.from("89504e470d0a1a0a", "hex"),
    "image/gif": Buffer.from("GIF89a"),
    "image/webp": Buffer.from("524946460000000057454250", "hex"),
  };

  async function upload(filename: string, mime: string, size = 12, cookie = adminCookie, content?: Uint8Array) {
    const bytes = content ? new Uint8Array(content) : new Uint8Array(size);
    if (!content) bytes.set((imageHeaders[mime] ?? Buffer.alloc(0)).subarray(0, size));
    const form = new FormData();
    form.set("image", new Blob([bytes], { type: mime }), filename);
    const response = await fetch(baseUrl + "/upload", { method: "POST", headers: { "X-CSRF-Protection": "1", Cookie: cookie }, body: form });
    const body = await response.json() as { success: boolean; url?: string; filename?: string; error?: string };
    if (body.filename) uploadedFiles.push(resolve("uploads", body.filename));
    return { status: response.status, body };
  }

  test("uploads validate MIME and matching extensions, enforce 5 MB and require admin", async () => {
    for (const [filename, mime] of [["image.JPG", "image/jpeg"], ["image.jpeg", "image/jpeg"], ["image.png", "image/png"], ["image.webp", "image/webp"], ["image.gif", "image/gif"]]) {
      const result = await upload(filename, mime, filename.endsWith("png") ? 5 * 1024 * 1024 : 12);
      assert.equal(result.status, 201);
      assert.match(result.body.url!, /^\/uploads\//);
      const stored = await fetch(baseUrl.replace(/\/api$/, "") + result.body.url);
      assert.equal(stored.status, 200);
      assert.equal(stored.headers.get("content-security-policy"), "default-src 'none'; sandbox");
      assert.equal(stored.headers.get("x-content-type-options"), "nosniff");
    }
    for (const [filename, mime] of [["image.svg", "image/svg+xml"], ["image.exe", "image/png"], ["image.jpg", "image/png"], ["image.png", "text/plain"]]) {
      assert.equal((await upload(filename, mime)).status, 400);
    }
    const oversized = await upload("large.jpg", "image/jpeg", 5 * 1024 * 1024 + 1);
    assert.equal(oversized.status, 400);
    assert.deepEqual(oversized.body, { success: false, error: "Bildfilen är för stor. Maximal filstorlek är 5 MB." });
    assert.equal((await upload("image.png", "image/png", 10, "")).status, 401);
    assert.equal((await upload("image.png", "image/png", 10, userCookie)).status, 403);
  });

  test("both GIF87a and GIF89a image headers are accepted", async () => {
    for (const signature of ["GIF87a", "GIF89a"]) {
      assert.equal((await upload("image.gif", "image/gif", 6, adminCookie, Buffer.from(signature))).status, 201);
    }
  });

  test("forged PNG uploads and mismatched or truncated magic bytes return 400 and are deleted from disk", async () => {
    const invalidFiles: [string, string, Uint8Array][] = [
      ["forged.png", "image/png", Buffer.from("<html><script>alert(1)</script></html>")],
      ["mismatch.png", "image/png", imageHeaders["image/jpeg"]!],
      ["mismatch.jpg", "image/jpeg", imageHeaders["image/png"]!],
      ["invalid.gif", "image/gif", Buffer.from("GIF88a")],
      ["invalid.webp", "image/webp", Buffer.from("524946460000000057415645", "hex")],
      ["invalid.webp", "image/webp", Buffer.from("000000000000000057454250", "hex")],
      ["short.png", "image/png", imageHeaders["image/png"]!.subarray(0, 7)],
      ["short.jpg", "image/jpeg", imageHeaders["image/jpeg"]!.subarray(0, 2)],
      ["short.gif", "image/gif", Buffer.from("GIF89")],
      ["short.webp", "image/webp", imageHeaders["image/webp"]!.subarray(0, 11)],
      ["empty.png", "image/png", new Uint8Array()],
    ];
    for (const [filename, mime, content] of invalidFiles) {
      const before = (await readdir(resolve("uploads"))).sort();
      const result = await upload(filename, mime, content.length, adminCookie, content);
      const after = (await readdir(resolve("uploads"))).sort();
      // Clean up any leaked test files even if the assertions below fail.
      uploadedFiles.push(...after.filter(file => !before.includes(file)).map(file => resolve("uploads", file)));
      assert.equal(result.status, 400, filename);
      assert.deepEqual(result.body, { success: false, error: "Filens innehåll matchar inte ett giltigt bildformat (JPEG, PNG, WebP, GIF)." });
      assert.deepEqual(after, before, `${filename} must be removed before the error response`);
    }
  });
});
