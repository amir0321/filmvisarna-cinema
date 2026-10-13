import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { pool } from "../db";
import { HttpError } from "../utils/httpErorr";

export interface AuthUser {
  id: number;
  email: string;
  role: "user" | "admin";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Sign a JWT token for a user
// The token is signed with the user's ID as the subject and expires according to the configuration
export function signToken(userId: number): string {
  return jwt.sign({}, config.jwtSecret, {
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
    throw new HttpError(401, "Authorization header must be: Bearer <token>");
  }

  let userId: number;
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: ["HS256"],
    });
    userId = Number(typeof payload === "string" ? NaN : payload.sub);
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
  if (!Number.isInteger(userId)) throw new HttpError(401, "Invalid token");

  const { rows } = await pool.query<AuthUser>(
    "SELECT id, email, role FROM app_user WHERE id = $1",
    [userId],
  );
  if (!rows[0]) throw new HttpError(401, "User no longer exists");
  return rows[0];
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
  if (!req.user) throw new HttpError(401, "You need to log in");
  next();
}

// Middleware to require that the authenticated user has the "admin" role
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.user = await resolveUser(req);
  if (!req.user) throw new HttpError(401, "You need to log in");
  if (req.user.role !== "admin")
    throw new HttpError(403, "Admin access required");
  next();
}
