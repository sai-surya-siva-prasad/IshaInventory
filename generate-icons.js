// Generates PNG icons for PWA — no external packages needed
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  return table;
}
const CRC_TABLE = makeCrcTable();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const byte of buf) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xFF];
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type, 'ascii');
  const crcVal = crc32(Buffer.concat([typeB, data]));
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crcVal);
  return Buffer.concat([len, typeB, data, crcB]);
}

function createIcon(size) {
  // Build flat pixel buffer: size*size pixels, each {r,g,b}
  const pixels = new Uint8Array(size * size * 3);
  // Fill with #007AFF
  for (let i = 0; i < size * size; i++) {
    pixels[i * 3] = 0x00;
    pixels[i * 3 + 1] = 0x7A;
    pixels[i * 3 + 2] = 0xFF;
  }

  const setPixel = (x, y, r, g, b) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 3;
    pixels[idx] = r; pixels[idx + 1] = g; pixels[idx + 2] = b;
  };

  // Draw white "W" — simple block letter
  const margin = Math.round(size * 0.22);
  const thick = Math.max(2, Math.round(size * 0.08));
  const top = margin;
  const bot = size - margin;
  const left = margin;
  const right = size - margin;
  const mid = Math.round(size / 2);
  const midBot = Math.round(size * 0.65);

  const fillRect = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++)
        setPixel(x, y, 255, 255, 255);
  };

  // Left vertical bar
  fillRect(left, top, left + thick - 1, bot);
  // Right vertical bar
  fillRect(right - thick + 1, top, right, bot);
  // Left inner diagonal (left+thick down to mid)
  for (let step = 0; step <= midBot - top; step++) {
    const t = step / (midBot - top);
    const x = Math.round(left + thick + t * (mid - thick / 2 - left - thick));
    fillRect(x, top + step, x + thick - 1, top + step);
  }
  // Right inner diagonal (right-thick down to mid)
  for (let step = 0; step <= midBot - top; step++) {
    const t = step / (midBot - top);
    const x = Math.round(right - thick - t * (right - thick - mid - thick / 2));
    fillRect(x - thick + 1, top + step, x, top + step);
  }
  // Left outer diagonal going back up to bot (after mid point)
  for (let step = 0; step <= bot - midBot; step++) {
    const t = step / (bot - midBot);
    const x = Math.round(mid - thick / 2 + t * (Math.round(size * 0.37) - mid + thick / 2));
    fillRect(x, midBot + step, x + thick - 1, midBot + step);
  }

  // Build raw PNG rows (filter byte 0 + RGB)
  const rowBytes = 1 + size * 3;
  const raw = Buffer.alloc(size * rowBytes);
  for (let y = 0; y < size; y++) {
    raw[y * rowBytes] = 0;
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 3;
      raw[y * rowBytes + 1 + x * 3] = pixels[src];
      raw[y * rowBytes + 1 + x * 3 + 1] = pixels[src + 1];
      raw[y * rowBytes + 1 + x * 3 + 2] = pixels[src + 2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', createIcon(192));
writeFileSync('public/icons/icon-512.png', createIcon(512));
writeFileSync('public/icons/apple-touch-icon.png', createIcon(180));
console.log('Done: public/icons/ — icon-192.png, icon-512.png, apple-touch-icon.png');
