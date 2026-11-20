'use strict';
/* SCULPT Simulator · D · Comparador de píxeles (sin dependencias: zlib de Node).
 * Decodifica los PNG que produce Chromium/Playwright (8 bits, RGB o RGBA, sin entrelazado) y mide en qué, dónde y cuánto
 * difieren dos imágenes. Sirve para diagnosticar la reproducibilidad de D y para el contrato de equivalencia perceptual.
 * No es un comparador «visual» difuso: cuenta canales exactos; las tolerancias las decide quien llama y quedan en el informe. */
const zlib = require('node:zlib'), crypto = require('node:crypto');
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const err = (code, msg) => Object.assign(Error(msg), { code });

/** PNG → {width, height, data: Uint8Array RGBA}. Rechaza lo que no sabe decodificar (no adivina). */
function decode(png) {
  if (!Buffer.isBuffer(png) || png.length < 33 || !png.subarray(0, 8).equals(SIG)) throw err('PNG', 'Not a PNG');
  let off = 8, w = 0, h = 0, depth = 0, type = 0, interlace = 0; const idat = [];
  while (off < png.length) {
    const len = png.readUInt32BE(off), kind = png.toString('ascii', off + 4, off + 8), body = png.subarray(off + 8, off + 8 + len);
    if (kind === 'IHDR') { w = body.readUInt32BE(0); h = body.readUInt32BE(4); depth = body[8]; type = body[9]; interlace = body[12]; }
    else if (kind === 'IDAT') idat.push(body);
    else if (kind === 'IEND') break;
    off += 12 + len;
  }
  if (depth !== 8 || (type !== 2 && type !== 6) || interlace) throw err('PNG_FORMAT', `Unsupported PNG (depth ${depth}, colour type ${type}, interlace ${interlace})`);
  const bpp = type === 6 ? 4 : 3, stride = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat));
  if (raw.length !== h * (stride + 1)) throw err('PNG_DATA', 'Truncated PNG data');
  const out = new Uint8Array(w * h * 4), prev = new Uint8Array(stride), cur = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let p;
      switch (f) {
        case 0: p = 0; break; case 1: p = a; break; case 2: p = b; break; case 3: p = (a + b) >> 1; break;
        case 4: { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; break; }
        default: throw err('PNG_FILTER', 'Bad filter ' + f);
      }
      cur[x] = (row[x] + p) & 255;
    }
    for (let x = 0; x < w; x++) { const s = x * bpp, d = (y * w + x) * 4; out[d] = cur[s]; out[d + 1] = cur[s + 1]; out[d + 2] = cur[s + 2]; out[d + 3] = bpp === 4 ? cur[s + 3] : 255; }
    prev.set(cur);
  }
  return { width: w, height: h, data: out };
}

/** RGBA → PNG (filtro 0). Para el mapa de diferencias que acompaña al informe. */
function encode({ width, height, data }) {
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) { raw[y * (width * 4 + 1)] = 0; Buffer.from(data.buffer, data.byteOffset + y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1); }
  const chunk = (kind, body) => { const b = Buffer.alloc(12 + body.length); b.writeUInt32BE(body.length, 0); b.write(kind, 4, 'ascii'); body.copy(b, 8); b.writeUInt32BE(crc(Buffer.concat([Buffer.from(kind, 'ascii'), body])), 8 + body.length); return b; };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
let CRC; function crc(buf) { if (!CRC) { CRC = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } } let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

const inRect = (x, y, r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height;
/**
 * Compara dos PNG (Buffer) o imágenes decodificadas.
 * opts.regions: {nombre: {x,y,width,height}} → recuento por región (p. ej. lienzo 3D frente a interfaz). Lo que no cae en
 *   ninguna región va a `other`. opts.grid: tamaño de celda para localizar dónde se concentra la diferencia.
 * Devuelve: píxeles distintos (cualquier canal ≠), máximo Δ por canal, media de Δ en los distintos, histograma de Δ,
 * caja envolvente y celdas más afectadas. `identical` solo si los bytes de píxel coinciden exactamente.
 */
function compare(a, b, { regions = null, grid = 32 } = {}) {
  const A = Buffer.isBuffer(a) ? decode(a) : a, B = Buffer.isBuffer(b) ? decode(b) : b;
  if (A.width !== B.width || A.height !== B.height) return { comparable: false, reason: `size ${A.width}x${A.height} vs ${B.width}x${B.height}` };
  const { width: w, height: h } = A, hist = new Array(256).fill(0), per = {}, cells = new Map();
  if (regions) for (const k of [...Object.keys(regions), 'other']) per[k] = { pixels: 0, differentPixels: 0, maxDelta: 0 };
  let diff = 0, max = 0, sum = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]), Math.abs(A.data[i + 3] - B.data[i + 3]));
    let region = null;
    if (regions) { region = 'other'; for (const [k, r] of Object.entries(regions)) if (inRect(x, y, r)) { region = k; break; } per[region].pixels++; }
    if (!d) continue;
    diff++; hist[d]++; sum += d; if (d > max) max = d;
    if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
    if (region) { per[region].differentPixels++; if (d > per[region].maxDelta) per[region].maxDelta = d; }
    const key = `${Math.floor(x / grid)},${Math.floor(y / grid)}`; cells.set(key, (cells.get(key) || 0) + 1);
  }
  const histogram = {}; hist.forEach((n, d) => { if (n) histogram[d] = n; });
  return {
    comparable: true, width: w, height: h, identical: diff === 0, differentPixels: diff, ratio: diff / (w * h),
    maxDelta: max, meanDelta: diff ? sum / diff : 0, histogram,
    bbox: diff ? { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 } : null,
    regions: regions ? per : undefined,
    topCells: [...cells].sort((p, q) => q[1] - p[1]).slice(0, 8).map(([k, n]) => { const [cx, cy] = k.split(',').map(Number); return { x: cx * grid, y: cy * grid, size: grid, differentPixels: n }; }),
  };
}

/** Mapa de diferencias: gris tenue de A y en magenta los píxeles distintos (intensidad ∝ Δ, mínimo visible). */
function diffImage(a, b) {
  const A = Buffer.isBuffer(a) ? decode(a) : a, B = Buffer.isBuffer(b) ? decode(b) : b;
  if (A.width !== B.width || A.height !== B.height) throw err('SIZE', 'Different sizes');
  const out = new Uint8Array(A.data.length);
  for (let i = 0; i < out.length; i += 4) {
    const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
    const g = Math.round((A.data[i] + A.data[i + 1] + A.data[i + 2]) / 3 * 0.35 + 160);
    if (d) { const k = Math.min(255, 120 + d * 12); out[i] = k; out[i + 1] = 0; out[i + 2] = k; } else { out[i] = out[i + 1] = out[i + 2] = g; }
    out[i + 3] = 255;
  }
  return encode({ width: A.width, height: A.height, data: out });
}

/**
 * Contrato de equivalencia perceptual (solo si se ha demostrado variabilidad inevitable; ver EQUIVALENCIA.md).
 * `limits` son números medidos, no arbitrarios: {maxDelta, maxRatio}. Devuelve el veredicto y las medidas; las huellas
 * exactas se conservan aparte (quien llama las guarda): la equivalencia nunca sustituye a la huella.
 */
function equivalent(a, b, limits, opts) {
  if (!limits || !Number.isFinite(limits.maxDelta) || !Number.isFinite(limits.maxRatio)) throw err('LIMITS', 'maxDelta and maxRatio are required');
  const r = compare(a, b, opts);
  if (!r.comparable) return { equivalent: false, exact: false, ...r };
  return { equivalent: r.identical || (r.maxDelta <= limits.maxDelta && r.ratio <= limits.maxRatio), exact: r.identical, ...r };
}
/**
 * Contrato del alcance `window` (EQUIVALENCIA.md, medido el 20/11 en 3+3 sesiones de `flyToRoom rom_kid`):
 *  - FUERA del lienzo 3D (interfaz): EXACTO, 0 píxeles distintos (medido: 0).
 *  - SOBRE el lienzo 3D: el render WebGL es exacto (alcance canvas3d), pero las capas DOM superpuestas (etiquetas CSS2D de
 *    estancias, #hint3d) varían en bordes y apilado: ≤ 1,2 % de los píxeles del lienzo y Δ ≤ 64 (medido: 0,85 %, Δ 52).
 *    Una etiqueta ausente (~2,8 % del lienzo) queda FUERA del contrato y se detecta.
 */
const WINDOW_CONTRACT = Object.freeze({ outsideCanvasMaxPixels: 0, canvasMaxRatio: 0.012, canvasMaxDelta: 64, measured: { canvasRatio: 0.00848, maxDelta: 52, outsideCanvas: 0, sessions: 6, date: '2026-11-20' } });
function windowEquivalent(a, b, canvasRect, contract = WINDOW_CONTRACT) {
  if (!canvasRect || !(canvasRect.width > 0) || !(canvasRect.height > 0)) throw err('LIMITS', 'canvasRect is required');
  const r = compare(a, b, { regions: { canvas3d: canvasRect } });
  if (!r.comparable) return { equivalent: false, exact: false, ...r };
  const c = r.regions.canvas3d, o = r.regions.other, ratio = c.pixels ? c.differentPixels / c.pixels : 0;
  const equivalent = r.identical || (o.differentPixels <= contract.outsideCanvasMaxPixels && ratio <= contract.canvasMaxRatio && c.maxDelta <= contract.canvasMaxDelta);
  return { equivalent, exact: r.identical, outsideCanvasDifferent: o.differentPixels, canvasRatio: ratio, canvasMaxDelta: c.maxDelta, contract, differentPixels: r.differentPixels, bbox: r.bbox };
}
const pixelSha = img => crypto.createHash('sha256').update((Buffer.isBuffer(img) ? decode(img) : img).data).digest('hex');
module.exports = { decode, encode, compare, diffImage, equivalent, windowEquivalent, WINDOW_CONTRACT, pixelSha };
