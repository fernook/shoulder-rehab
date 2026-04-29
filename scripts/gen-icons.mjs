import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public');
mkdirSync(out, { recursive: true });

function iconSvg({ size, padding }) {
  const stroke = Math.round(size * 0.094);
  const startX = padding;
  const peakX = size / 2;
  const endX = size - padding;
  const baseY = size - padding;
  const peakY = padding;
  const radius = Math.round(size * 0.22);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#0a0a0a"/>
  <path d="M ${startX} ${baseY} L ${peakX} ${peakY} L ${endX} ${baseY}"
        stroke="#e5e5e5" stroke-width="${stroke}"
        stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
}

function maskableSvg({ size }) {
  // No corner radius, more padding (safe area)
  const padding = Math.round(size * 0.22);
  const stroke = Math.round(size * 0.094);
  const startX = padding;
  const peakX = size / 2;
  const endX = size - padding;
  const baseY = size - padding;
  const peakY = padding;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0a0a0a"/>
  <path d="M ${startX} ${baseY} L ${peakX} ${peakY} L ${endX} ${baseY}"
        stroke="#e5e5e5" stroke-width="${stroke}"
        stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
}

async function render(svgString, filename) {
  const buf = await sharp(Buffer.from(svgString)).png().toBuffer();
  writeFileSync(join(out, filename), buf);
  console.log('wrote', filename);
}

await render(iconSvg({ size: 192, padding: 32 }), 'icon-192.png');
await render(iconSvg({ size: 512, padding: 88 }), 'icon-512.png');
await render(maskableSvg({ size: 512 }), 'icon-512-maskable.png');
await render(iconSvg({ size: 180, padding: 30 }), 'apple-touch-icon.png');
