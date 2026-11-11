import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { query, withTransaction } from "../utils/dbHelpers";
import { requireAuth, signToken } from "../middleware/auth";
import { HttpError } from "../utils/httpErorr";
import { authActionService } from '../services/authActions.service.js';
import type { AuthUser } from '../interfaces/types.js';

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
  .max(72, "Lösenordet får vara max 72 tecken långt.")
  .refine(value => !bcrypt.truncates(value), 'Lösenordet får vara högst 72 byte. Specialtecken kan ta mer plats.');

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
  newPassword: password,
});

const user_columns = `id, email, first_name AS "firstName", last_name AS "lastName", phone, is_verified AS "isVerified", points, role`;

export function createAuthRouter(actions = authActionService) {
  const authRouter = Router();

  // Do not trust X-Forwarded-For unless a deployment explicitly configures trusted proxies.
  authRouter.use(async (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return next();
    if (!await actions.limit(`auth:ip:${req.ip ?? req.socket.remoteAddress}`, 30)) {
      res.setHeader('Retry-After', '900');
      throw new HttpError(429, 'För många försök. Vänta 15 minuter och försök igen.');
    }
    next();
  });

  // Register a new user - POST /api/auth/register
  authRouter.post("/register", async (req, res) => {
    const body = registerBody.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, bcrypt_rounds);

    try {
      // Insert the new user into the database and return the user object
      const [user] = await query<AuthUser>(
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
      // The account remains usable if mail delivery fails; the client can offer resend.
      const verificationEmailSent = await actions.sendLink(user.email, 'verify_email').catch(() => false);
      res.status(201).json({ token: signToken(user.id), user, verificationEmailSent });
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
    const loginLimitKey = `login:ip:${req.ip ?? req.socket.remoteAddress}:${body.email.toLowerCase()}`;
    if (!await actions.limit(loginLimitKey, 10)) {
      res.setHeader("Retry-After", "900");
      throw new HttpError(429, "För många inloggningsförsök. Vänta 15 minuter och försök igen.");
    }

    const [row] = await query<AuthUser & { passwordHash: string; authVersion: number }>(
      `SELECT ${user_columns}, password_hash AS "passwordHash", auth_version AS "authVersion" FROM app_user WHERE email = lower($1)`,
      [body.email],
    );

    const ok = await bcrypt.compare(
      body.password,
      row?.passwordHash ?? dummy_hash,
    );
    if (!row || !ok) throw new HttpError(401, "Felaktig e-postadress eller lösenord.");

    await actions.clearLimit(loginLimitKey);
    const { passwordHash: _omit, authVersion, ...user } = row;
    res.json({ token: signToken(row.id, authVersion), user });
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
    const existing = await query<AuthUser>(
      `SELECT ${user_columns} FROM app_user WHERE id = $1`,
      [req.user!.id],
    );
    if (!existing[0]) throw new HttpError(404, "Användaren hittades inte.");

    const firstName =
      body.firstName !== undefined ? body.firstName : existing[0].firstName;
    const lastName =
      body.lastName !== undefined ? body.lastName : existing[0].lastName;
    const phone = body.phone !== undefined ? body.phone : existing[0].phone;

    const [updated] = await query<AuthUser>(
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
    const newHash = await bcrypt.hash(body.newPassword, bcrypt_rounds);
    await withTransaction(async client => {
      const { rows: [row] } = await client.query<{ passwordHash: string }>(
        'SELECT password_hash AS "passwordHash" FROM app_user WHERE id = $1 FOR UPDATE', [req.user!.id]);
      if (!row) throw new HttpError(404, 'Användaren hittades inte.');
      if (!await bcrypt.compare(body.currentPassword, row.passwordHash)) {
        throw new HttpError(401, 'Det nuvarande lösenordet är felaktigt.');
      }
      await client.query('UPDATE app_user SET password_hash = $1, auth_version = auth_version + 1 WHERE id = $2', [newHash, req.user!.id]);
      await client.query("DELETE FROM auth_action_token WHERE user_id = $1 AND purpose = 'reset_password'", [req.user!.id]);
    });

    res.json({ success: true, message: "Lösenordet har ändrats." });
  });

  const tokenBody = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/, 'Ogiltig länk. Begär en ny länk.') });

  authRouter.post('/forgot-password', async (req, res) => {
    const body = z.object({ email }).parse(req.body);
    actions.assertEmailConfigured();
    // Acknowledge both existing and unknown accounts before dispatch to avoid SMTP timing leaks.
    res.json({ success: true, message: 'Om det finns ett konto med adressen skickar vi en länk för att återställa lösenordet. Kontrollera även skräpposten.' });
    void actions.sendLink(body.email, 'reset_password').catch(() => console.error('[Auth] Password reset request failed'));
  });

  authRouter.post('/reset-password', async (req, res) => {
    const body = tokenBody.extend({ password }).parse(req.body);
    const email = await actions.resetPassword(body.token, body.password);
    res.json({ success: true, message: 'Ditt lösenord har uppdaterats. Logga in med ditt nya lösenord.', email });
  });

  authRouter.post('/resend-verification', requireAuth, async (req, res) => {
    actions.assertEmailConfigured();
    const [user] = await query<{ is_verified: boolean }>('SELECT is_verified FROM app_user WHERE id = $1', [req.user!.id]);
    if (user?.is_verified) return res.json({ success: true, message: 'Din e-postadress är redan verifierad.' });
    const sent = await actions.sendLink(req.user!.email, 'verify_email');
    if (!sent) throw new HttpError(429, 'Vänta minst en minut mellan verifieringsmejl. Efter tre utskick behöver du vänta 15 minuter.');
    res.json({ success: true, message: 'Ett nytt verifieringsmejl har skickats. Kontrollera även skräpposten.' });
  });

  authRouter.post('/verify-email', async (req, res) => {
    const body = tokenBody.parse(req.body);
    const email = await actions.verifyEmail(body.token);
    res.json({ success: true, message: 'Din e-postadress är nu verifierad.', email });
  });

  return authRouter;
}

export const authRouter = createAuthRouter();
