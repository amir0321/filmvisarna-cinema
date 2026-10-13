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

const email = z.string().trim().email().max(200);

const password = z
  .string()
  .min(8, "Password is required")
  .max(72, "Password must be at most 72 characters long");

const registerBody = z.object({
  email,
  password,
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
});

const user_columns = `id, email, first_name AS "firstName", last_name AS "lastName", role`;

// Register a new user - POST /api/auth/register
authRouter.post("/register", async (req, res) => {
  const body = registerBody.parse(req.body);
  const passwordHash = await bcrypt.hash(body.password, bcrypt_rounds);

  try {
    // Insert the new user into the database and return the user object
    const [user] = await query<{ id: number }>(
      `INSERT INTO app_user (email, password_hash, first_name, last_name)
       VALUES (lower($1), $2, $3, $4)
       RETURNING ${user_columns}`,
      [body.email, passwordHash, body.firstName ?? null, body.lastName ?? null],
    );
    res.status(201).json({ token: signToken(user.id), user });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new HttpError(409, "That email is already registered");
    }
    throw error;
  }
});
