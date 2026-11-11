import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { pool } from "../db";
import { HttpError } from "../utils/httpErorr";
import { getSessionToken, hashSessionToken } from '../services/sessions.service';

import { AuthUser } from "../interfaces/types.js";
export type { AuthUser };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      session?: { expiresAt: number };
    }
  }
}

// Only accept the HttpOnly session cookie. Legacy bearer tokens cannot restore sessions.
async function resolveUser(req: Request): Promise<AuthUser | undefined> {
  const token = getSessionToken(req);
  if (!token) return undefined;

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
    req.session = { expiresAt: payload.exp * 1000 };
  } catch {
    throw new HttpError(401, "Ogiltig eller utgången token.");
  }
  if (!Number.isInteger(userId)) throw new HttpError(401, "Ogiltig token.");

  const { rows } = await pool.query<AuthUser & { authVersion: number }>(
    `SELECT u.id, u.email, u.role, u.auth_version AS "authVersion"
     FROM app_user u JOIN auth_session s ON s.user_id = u.id
     WHERE u.id = $1 AND s.token_hash = $2 AND s.expires_at > now()`,
    [userId, hashSessionToken(token)],
  );
  if (!rows[0]) throw new HttpError(401, "Din session har gått ut. Logga in igen.");
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
