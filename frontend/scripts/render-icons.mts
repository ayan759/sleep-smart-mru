/**
 * Renders the app icons from public/moon.webp (itself made by render-moon.mts):
 *   app/icon.png        256 px, browser tab and Android
 *   app/apple-icon.png  180 px, iOS home screen (iOS rounds the corners itself)
 *   app/favicon.ico     32 px PNG inside an ICO wrapper, for browsers that ask for /favicon.ico
 * Run: node scripts/render-icons.mts (from frontend/). Deterministic.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("..", import.meta.url));
const ABYSS = "#0a0e1c"; // --color-abyss
const MOON = "#f3dfa5"; // --color-moon, used for the soft glow

async function render(size: number, rounded: boolean): Promise<Buffer> {
  const r = rounded ? Math.round(size * 0.22) : 0;
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stop-color="${MOON}" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="${MOON}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${r}" fill="${ABYSS}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.46}" fill="url(#g)"/>
    </svg>`,
  );
  const moonSize = Math.round(size * 0.7);
  const moon = await sharp(`${root}public/moon.webp`).resize(moonSize, moonSize).png().toBuffer();
  const offset = Math.round((size - moonSize) / 2);
  return sharp(bg)
    .composite([{ input: moon, top: offset, left: offset }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** A one-image ICO file holding a PNG (supported by every current browser). */
function ico(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size % 256, 0); // width (0 means 256)
  entry.writeUInt8(size % 256, 1); // height
  entry.writeUInt8(0, 2); // no palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8); // image size
  entry.writeUInt32LE(6 + 16, 12); // image offset
  return Buffer.concat([header, entry, png]);
}

writeFileSync(`${root}app/icon.png`, await render(256, true));
writeFileSync(`${root}app/apple-icon.png`, await render(180, false));
writeFileSync(`${root}app/favicon.ico`, ico(await render(32, true), 32));
console.log("Wrote app/icon.png, app/apple-icon.png, app/favicon.ico");
