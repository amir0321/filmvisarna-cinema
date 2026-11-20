import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { backendFolder, uploadsFolder } from '../paths.js';
import { localizeImage } from '../services/localMedia.service.js';

async function prepareCinemaImages() {
  const output = path.resolve(backendFolder, '../Frontend/public/images');
  await mkdir(output, { recursive: true });
  for (const [name, id] of [
    ['hall-large', 'photo-1489599849927-2ee91cede3ba'],
    ['hall-small', 'photo-1517604931442-7e0c8ed2963c'],
  ]) {
    const local = await localizeImage(`https://images.unsplash.com/${id}?w=800&h=450&fit=crop&auto=format`, 800);
    await copyFile(path.join(uploadsFolder, path.basename(local)), path.join(output, `${name}.webp`));
    console.log(`Prepared ${name}.webp`);
  }
}

void prepareCinemaImages().catch(() => {
  console.error('Cinema image download failed. Existing local images are unchanged.');
  process.exitCode = 1;
});
