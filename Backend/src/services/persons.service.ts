import type { PoolClient } from "pg";
import type { CreatePersonInput, Person, UpdatePersonInput } from "../interfaces/types.js";
import { query, withTransaction } from "../utils/dbHelpers.js";
import { HttpError } from "../utils/httpErorr.js";

const PERSON_COLUMNS = "id, name, photo_url, bio, tmdb_id";

export async function getAllPersons(search?: string): Promise<Person[]> {
  return query<Person>(
    `SELECT ${PERSON_COLUMNS} FROM person
     WHERE ($1::text IS NULL OR name ILIKE $1)
     ORDER BY name, id
     LIMIT 50`,
    [search?.trim() ? `%${search.trim()}%` : null],
  );
}

// Shared by the person API and movie writes. The caller owns the transaction.
export async function savePerson(
  client: PoolClient,
  input: UpdatePersonInput & { person_id?: number },
): Promise<Person> {
  // Existing databases may contain duplicate names, so a new unique name index
  // would be destructive. Serialize lookup + write instead, including new names.
  await client.query("SELECT pg_advisory_xact_lock(hashtext('filmvisarna:person-register'))");

  let existing: Person | undefined;
  if (input.person_id !== undefined) {
    const result = await client.query<Person>(
      `SELECT ${PERSON_COLUMNS} FROM person WHERE id = $1`, [input.person_id],
    );
    existing = result.rows[0];
    if (!existing) throw new HttpError(404, "Personen hittades inte.");
  }

  const { rows: matches } = await client.query<Person>(
    `SELECT ${PERSON_COLUMNS} FROM person
     WHERE ($1::int IS NOT NULL AND tmdb_id = $1)
        OR ($2::text IS NOT NULL AND lower(trim(name)) = lower(trim($2)))
     ORDER BY (tmdb_id = $1) DESC NULLS LAST, id
     LIMIT 2`,
    [input.tmdb_id ?? null, input.name?.trim() ?? null],
  );
  const match = matches[0];
  const existingId = existing?.id;
  if (existingId !== undefined && matches.some((person) => person.id !== existingId)) {
    // Do not silently merge two profiles and change other movies' credits.
    throw new HttpError(409, "En annan person med samma namn eller TMDB-ID finns redan. Återanvänd den personen.");
  }
  existing ??= match;

  const name = input.name?.trim() ?? existing?.name;
  if (!name) throw new HttpError(400, "Namn krävs för en ny person.");
  const values = [
    name,
    input.photo_url !== undefined ? input.photo_url : existing?.photo_url ?? null,
    input.bio !== undefined ? input.bio : existing?.bio ?? null,
    input.tmdb_id !== undefined ? input.tmdb_id : existing?.tmdb_id ?? null,
  ];

  if (existing) {
    const { rows } = await client.query<Person>(
      `UPDATE person SET name = $1, photo_url = $2, bio = $3, tmdb_id = $4
       WHERE id = $5 RETURNING ${PERSON_COLUMNS}`, [...values, existing.id],
    );
    return rows[0];
  }

  const { rows } = await client.query<Person>(
    `INSERT INTO person (name, photo_url, bio, tmdb_id)
     VALUES ($1, $2, $3, $4) RETURNING ${PERSON_COLUMNS}`, values,
  );
  return rows[0];
}

export async function createPerson(input: CreatePersonInput): Promise<Person> {
  return withTransaction((client) => savePerson(client, input));
}

export async function updatePerson(id: number, input: UpdatePersonInput): Promise<Person> {
  return withTransaction((client) => savePerson(client, { ...input, person_id: id }));
}
