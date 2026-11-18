import path from 'node:path';

// Works both from src/ (tsx) and dist/ (compiled CommonJS), regardless of cwd.
export const backendFolder = path.resolve(__dirname, '..');
export const frontendDistFolder = path.resolve(backendFolder, '../Frontend/dist');
export const uploadsFolder = path.resolve(backendFolder, 'uploads');
