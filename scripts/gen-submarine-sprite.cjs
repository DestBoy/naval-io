// Generate a 64x32 submarine PNG using only Node built-ins (zlib + Buffer).
// No native dependencies required.
// Uses grayscale tones that SpriteLoader.colorizeCanvas will tint with
// player territory/border colors:
//   rgb(180,180,180) → territoryColor (hull)
//   rgb(70,70,70)    → borderColor (conning tower + fins)
//   rgb(130,130,130) → spawnHighlightColor (deck)
//   transparent elsewhere

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const W = 64;
const H = 32;

// Build RGBA pixel buffer (top-down, row by row)
const pixels = Buffer.alloc(W * H * 4);

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  pixels[i] = r;
  pixels[i + 1] = g;
  pixels[i + 2] = b;
  pixels[i + 3] = a;
}

function fillEllipse(cx, cy, rx, ry, r, g, b) {
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) {
        setPixel(cx + x, cy + y, r, g, b);
      }
    }
  }
}

function fillRect(x0, y0, w, h, r, g, b) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      setPixel(x, y, r, g, b);
    }
  }
}

function fillTriangle(px0, py0, px1, py1, px2, py2, r, g, b) {
  const minY = Math.min(py0, py1, py2);
  const maxY = Math.max(py0, py1, py2);
  const minX = Math.min(px0, px1, px2);
  const maxX = Math.max(px0, px1, px2);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      // Barycentric test
      const d1 = (x - px1) * (py0 - py1) - (px0 - px1) * (y - py1);
      const d2 = (x - px2) * (py1 - py2) - (px1 - px2) * (y - py2);
      const d3 = (x - px0) * (py2 - py0) - (px2 - px0) * (y - py0);
      const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
      const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(hasNeg && hasPos)) {
        setPixel(x, y, r, g, b);
      }
    }
  }
}

// Hull — main body (territory color 180,180,180)
fillEllipse(32, 22, 24, 6, 180, 180, 180);

// Deck stripe (spawn highlight 130,130,130)
fillRect(14, 19, 36, 2, 130, 130, 130);

// Conning tower (border color 70,70,70)
fillRect(28, 12, 8, 8, 70, 70, 70);
fillEllipse(32, 12, 4, 2, 70, 70, 70);

// Periscope (border color)
fillRect(31, 4, 2, 8, 70, 70, 70);
// Periscope top (small circle)
for (let y = -1; y <= 1; y++) {
  for (let x = -1; x <= 1; x++) {
    if (x * x + y * y <= 1) setPixel(32 + x, 4 + y, 70, 70, 70);
  }
}

// Front porthole (border color)
for (let y = -1; y <= 1; y++) {
  for (let x = -1; x <= 1; x++) {
    if (x * x + y * y <= 2) setPixel(50 + x, 22 + y, 70, 70, 70);
  }
}

// Tail fin (border color) — triangle
fillTriangle(8, 18, 14, 22, 8, 26, 70, 70, 70);

// ---- Encode PNG ----
function crc32(buf) {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// PNG signature
const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr.writeUInt8(8, 8);  // bit depth
ihdr.writeUInt8(6, 9);  // color type (RGBA)
ihdr.writeUInt8(0, 10); // compression
ihdr.writeUInt8(0, 11); // filter
ihdr.writeUInt8(0, 12); // interlace

// IDAT — filter byte (0 = None) at start of each row
const stride = W * 4;
const raw = Buffer.alloc((stride + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (stride + 1)] = 0; // filter: None
  pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
}
const idat = zlib.deflateSync(raw);

// IEND
const iend = Buffer.alloc(0);

const png = Buffer.concat([
  sig,
  chunk("IHDR", ihdr),
  chunk("IDAT", idat),
  chunk("IEND", iend),
]);

const outPath = path.join(__dirname, "..", "resources", "sprites", "submarine.png");
fs.writeFileSync(outPath, png);
console.log(`Wrote ${outPath} (${png.length} bytes)`);
