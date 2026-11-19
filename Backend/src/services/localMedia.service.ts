import { createHash, randomUUID } from 'node:crypto';
import { access, mkdir, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { uploadsFolder } from '../paths.js';

const hosts = new Set(['image.tmdb.org', 'images.unsplash.com', 'i.ytimg.com', 'upload.wikimedia.org', 'thumb.wikimedia.org']);
const maxBytes = 10 * 1024 * 1024;

export async function localizeImage(source: string, width: number, directory = uploadsFolder): Promise<string> {
  const url = new URL(source);
  if (url.protocol !== 'https:' || !hosts.has(url.hostname) || url.port || url.username || url.password) {
    throw new Error('Unsupported image source; download and upload this image manually.');
  }
  const hash = createHash('sha256').update(`${width}:${url.href}`).digest('hex').slice(0, 24);
  const filename = `media-${hash}.webp`;
  const target = path.join(directory, filename);
  await mkdir(directory, { recursive: true });
  try { await access(target); return `/uploads/${filename}`; } catch { /* Download missing file. */ }
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20_000) });
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error('Image download failed.');
  if (Number(response.headers.get('content-length')) > maxBytes || !response.body) throw new Error('Image is too large or empty.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('Image is too large.');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const image = await sharp(Buffer.concat(chunks), { limitInputPixels: 40_000_000 })
    .rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, image);
    await rename(temporary, target);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
  return `/uploads/${filename}`;
}
