import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { query } from "../utils/dbHelpers";
import { requireAuth, signToken } from "../middleware/auth";
import { HttpError } from "../utils/httpErorr";
import { error } from "console";

export const authRouter = Router();

// Number of bcrypt rounds to use for hashing passwords
const bcrypt_rounds = 12;

// A dummy hash to use when a user is not found, to prevent timing attacks
const dummy_hash = bcrypt.hashSync("dummy_password", bcrypt_rounds);

const email = z
  .string()
  .trim()
  .email("Ogiltig e-postadress.")
  .max(200, "E-postadressen får inte vara längre än 200 tecken.");

const password = z
  .string()
  .min(8, "Lösenord krävs och måste vara minst 8 tecken.")
  .max(72, "Lösenordet får vara max 72 tecken långt.");

const registerBody = z.object({
  email,
  password,
  firstName: z.string().trim().min(1, "Förnamn krävs.").max(100).optional(),
  lastName: z.string().trim().min(1, "Efternamn krävs.").max(100).optional(),
  phone: z.string().trim().max(30).optional(),
});

const loginBody = z.object({
  email,
  password: z.string().min(1, "Lösenord krävs.").max(72),
});

const updateProfileBody = z.object({
  firstName: z.string().trim().min(1, "Förnamn får inte vara tomt.").max(100).optional(),
  lastName: z.string().trim().min(1, "Efternamn får inte vara tomt.").max(100).optional(),
  phone: z.string().trim().max(30).optional().nullable(),
});

const changePasswordBody = z.object({
  currentPassword: z.string().min(1, "Nuvarande lösenord krävs."),
  newPassword: z.string().min(8, "Nytt lösenord måste vara minst 8 tecken.").max(72),
});

const user_columns = `id, email, first_name AS "firstName", last_name AS "lastName", phone, is_verified AS "isVerified", points, role`;

// Register a new user - POST /api/auth/register
authRouter.post("/register", async (req, res) => {
  const body = registerBody.parse(req.body);
  const passwordHash = await bcrypt.hash(body.password, bcrypt_rounds);

  try {
    // Insert the new user into the database and return the user object
    const [user] = await query<{ id: number }>(
      `INSERT INTO app_user (email, password_hash, first_name, last_name, phone)
       VALUES (lower($1), $2, $3, $4, $5)
       RETURNING ${user_columns}`,
      [
        body.email,
        passwordHash,
        body.firstName ?? null,
        body.lastName ?? null,
        body.phone ?? null,
      ],
    );
    res.status(201).json({ token: signToken(user.id), user });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new HttpError(409, "Den angivna e-postadressen är redan registrerad.");
    }
    throw error;
  }
});

// Log in an existing user - POST /api/auth/login
authRouter.post("/login", async (req, res) => {
  const body = loginBody.parse(req.body);

  const [row] = await query<{ id: number; passwordHash: string }>(
    `SELECT ${user_columns}, password_hash AS "passwordHash" FROM app_user WHERE email = lower($1)`,
    [body.email],
  );

  const ok = await bcrypt.compare(
    body.password,
    row?.passwordHash ?? dummy_hash,
  );
  if (!row || !ok) throw new HttpError(401, "Felaktig e-postadress eller lösenord.");

  const { passwordHash: _omit, ...user } = row;
  res.json({ token: signToken(row.id), user });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const [user] = await query(
    `SELECT ${user_columns} FROM app_user WHERE id = $1`,
    [req.user!.id],
  );
  res.json(user);
});

authRouter.put("/me", requireAuth, async (req, res) => {
  const body = updateProfileBody.parse(req.body);
  const existing = await query<any>(
    `SELECT ${user_columns} FROM app_user WHERE id = $1`,
    [req.user!.id],
  );
  if (!existing[0]) throw new HttpError(404, "Användaren hittades inte.");

  const firstName =
    body.firstName !== undefined ? body.firstName : existing[0].firstName;
  const lastName =
    body.lastName !== undefined ? body.lastName : existing[0].lastName;
  const phone = body.phone !== undefined ? body.phone : existing[0].phone;

  const [updated] = await query<any>(
    `UPDATE app_user
     SET first_name = $1, last_name = $2, phone = $3
     WHERE id = $4
     RETURNING ${user_columns}`,
    [firstName, lastName, phone, req.user!.id],
  );

  res.json({
    success: true,
    message: "Profilen har uppdaterats.",
    user: updated,
  });
});

authRouter.post("/change-password", requireAuth, async (req, res) => {
  const body = changePasswordBody.parse(req.body);
  const [row] = await query<{ id: number; passwordHash: string }>(
    `SELECT id, password_hash AS "passwordHash" FROM app_user WHERE id = $1`,
    [req.user!.id],
  );
  if (!row) throw new HttpError(404, "Användaren hittades inte.");

  const ok = await bcrypt.compare(body.currentPassword, row.passwordHash);
  if (!ok) throw new HttpError(401, "Det nuvarande lösenordet är felaktigt.");

  const newHash = await bcrypt.hash(body.newPassword, bcrypt_rounds);
  await query(`UPDATE app_user SET password_hash = $1 WHERE id = $2`, [
    newHash,
    req.user!.id,
  ]);

  res.json({ success: true, message: "Lösenordet har ändrats." });
});

authRouter.post("/verify-email", requireAuth, async (req, res) => {
  const [user] = await query<any>(
    `UPDATE app_user SET is_verified = true WHERE id = $1 RETURNING ${user_columns}`,
    [req.user!.id],
  );
  res.json({
    success: true,
    message: "E-postadressen är nu verifierad.",
    user,
  });
});
