// Generate a 16x4 torpedo PNG using only Node built-ins.
// Tiny elongated projectile shape, neutral gray (colorizeCanvas will tint).

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const W = 16;
const H = 4;
const pixels = Buffer.alloc(W * H * 4);

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  pixels[i] = r;
  pixels[i + 1] = g;
  pixels[i + 2] = b;
  pixels[i + 3] = a;
}

// Torpedo body — elongated, gray tones for colorizeCanvas
// Hull (180,180,180 = territory color)
for (let x = 1; x < 14; x++) {
  setPixel(x, 1, 180, 180, 180);
  setPixel(x, 2, 180, 180, 180);
}
// Nose cone (darker = border color 70,70,70)
setPixel(14, 1, 70, 70, 70);
setPixel(14, 2, 70, 70, 70);
setPixel(15, 1, 70, 70, 70);
setPixel(15, 2, 70, 70, 70);
// Tail fins (border color)
setPixel(0, 0, 70, 70, 70);
setPixel(0, 3, 70, 70, 70);
setPixel(1, 0, 70, 70, 70);
setPixel(1, 3, 70, 70, 70);

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

const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr.writeUInt8(8, 8);
ihdr.writeUInt8(6, 9);
ihdr.writeUInt8(0, 10);
ihdr.writeUInt8(0, 11);
ihdr.writeUInt8(0, 12);

const stride = W * 4;
const raw = Buffer.alloc((stride + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (stride + 1)] = 0;
  pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
}
const idat = zlib.deflateSync(raw);
const iend = Buffer.alloc(0);

const png = Buffer.concat([
  sig,
  chunk("IHDR", ihdr),
  chunk("IDAT", idat),
  chunk("IEND", iend),
]);

const outPath = path.join(__dirname, "..", "resources", "sprites", "torpedo.png");
fs.writeFileSync(outPath, png);
console.log(`Wrote ${outPath} (${png.length} bytes)`);
