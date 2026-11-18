import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { HttpError } from '../utils/httpErorr';

// Requiring a custom header forces cross-origin browser writes through CORS
// preflight. Validate Origin too, including same-site sibling subdomains.
export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('Origin');
  const allowedOrigins = new Set([config.frontendUrl, ...config.corsOrigin]);
  if (req.get('X-CSRF-Protection') !== '1' || (origin !== undefined && !allowedOrigins.has(origin))) {
    throw new HttpError(403, 'Anropet nekades av CSRF-skyddet. Ladda om sidan och försök igen.');
  }
  next();
}
