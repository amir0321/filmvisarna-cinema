import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { pool } from "../db";
import { HttpError } from "../utils/httpErorr";

import { AuthUser } from "../interfaces/types.js";
export type { AuthUser };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Sign a JWT token for a user
// The token is signed with the user's ID as the subject and expires according to the configuration
export function signToken(userId: number, authVersion = 0): string {
  return jwt.sign({ version: authVersion }, config.jwtSecret, {
    subject: String(userId),
    expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

// Resolve the authenticated user from the request's Authorization header
// If the header is missing or invalid, it returns undefined or throws an HttpError
async function resolveUser(req: Request): Promise<AuthUser | undefined> {
  const header = req.headers.authorization;
  if (!header) return undefined;

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new HttpError(401, "Auktoriseringsheadern måste ha formatet: Bearer <token>");
  }

  let userId: number;
  let authVersion: number;
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: ["HS256"],
    });
    // Verification checks expiry when present; explicitly require it for every session.
    if (typeof payload === "string" || typeof payload.exp !== "number" ||
        !Number.isFinite(payload.exp) || payload.exp <= 0 || !Number.isFinite(payload.exp * 1000)) {
      throw new Error("JWT must contain a valid expiration time");
    }
    userId = Number(payload.sub);
    authVersion = payload.version ?? 0;
  } catch {
    throw new HttpError(401, "Ogiltig eller utgången token.");
  }
  if (!Number.isInteger(userId)) throw new HttpError(401, "Ogiltig token.");

  const { rows } = await pool.query<AuthUser & { authVersion: number }>(
    'SELECT id, email, role, auth_version AS "authVersion" FROM app_user WHERE id = $1',
    [userId],
  );
  if (!rows[0]) throw new HttpError(401, "Användaren finns inte längre.");
  if (rows[0].authVersion !== authVersion) throw new HttpError(401, 'Din session har gått ut. Logga in igen.');
  const { authVersion: _version, ...user } = rows[0];
  return user;
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.user = await resolveUser(req);
  next();
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.user = await resolveUser(req);
  if (!req.user) throw new HttpError(401, "Du måste logga in för att fortsätta.");
  next();
}

// Middleware to require that the authenticated user has the "admin" role
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.user = await resolveUser(req);
  if (!req.user) throw new HttpError(401, "Du måste logga in för att fortsätta.");
  if (req.user.role !== "admin")
    throw new HttpError(403, "Administratörsbehörighet krävs.");
  next();
}
