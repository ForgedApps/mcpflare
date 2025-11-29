import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mediaDir = join(__dirname, '..', 'media');

const svgPath = join(mediaDir, 'icon.svg');
const pngPath = join(mediaDir, 'icon.png');

const svgContent = readFileSync(svgPath, 'utf-8');

await sharp(Buffer.from(svgContent))
  .resize(128, 128)
  .png()
  .toFile(pngPath);

console.log('✓ Created icon.png (128x128)');





