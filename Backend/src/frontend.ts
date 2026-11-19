import express from 'express';
import path from 'node:path';
import { frontendDistFolder } from './paths.js';

export function createFrontendRouter(distFolder = frontendDistFolder) {
  const router = express.Router();
  router.use(express.static(distFolder, {
    index: false,
    setHeaders: (res, filename) => {
      // Vite hashes files under assets/. HTML and public files must revalidate.
      res.setHeader('Cache-Control', filename.startsWith(path.join(distFolder, 'assets') + path.sep)
        ? 'public, max-age=31536000, immutable' : 'no-cache');
    },
  }));
  router.use('/assets', (_req, res) => {
    res.status(404).json({ success: false, error: 'Filen hittades inte' });
  });
  router.get('/{*splat}', (req, res, next) => {
    if (path.extname(req.path) || !req.accepts('html')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(distFolder, 'index.html'), error => {
      if (error) next(error);
    });
  });
  return router;
}
