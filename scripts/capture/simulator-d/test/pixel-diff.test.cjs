// D · comparador de píxeles: decodificación PNG real de Chromium, regiones, mapa de diferencias y casos negativos de
// equivalencia (una diferencia real nunca se declara equivalente; la equivalencia exige límites explícitos).
const { test } = require('node:test'), assert = require('node:assert/strict');
const P = require('../src/pixel-diff.cjs');
const img = (w, h, f) => { const d = new Uint8Array(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [r, g, b] = f(x, y), i = (y * w + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; } return { width: w, height: h, data: d }; };
test('PNG: codificar y decodificar es exacto; formatos no admitidos se rechazan', () => {
  const a = img(37, 21, (x, y) => [x * 7 % 256, y * 11 % 256, (x * y) % 256]), back = P.decode(P.encode(a));
  assert.equal(back.width, 37); assert.deepEqual(Buffer.from(back.data), Buffer.from(a.data));
  assert.throws(() => P.decode(Buffer.from('nope')), e => e.code === 'PNG');
});
test('compare: recuento, máximo, caja, regiones y celdas', () => {
  const a = img(64, 64, () => [100, 100, 100]), b = img(64, 64, (x, y) => (x >= 40 && x < 44 && y >= 10 && y < 12 ? [103, 100, 100] : [100, 100, 100]));
  const r = P.compare(a, b, { regions: { canvas3d: { x: 0, y: 0, width: 32, height: 64 } }, grid: 16 });
  assert.equal(r.differentPixels, 8); assert.equal(r.maxDelta, 3); assert.deepEqual(r.bbox, { x: 40, y: 10, width: 4, height: 2 });
  assert.equal(r.regions.canvas3d.differentPixels, 0); assert.equal(r.regions.other.differentPixels, 8); assert.equal(r.topCells[0].differentPixels, 8);
  assert.equal(P.compare(a, a).identical, true); assert.equal(P.compare(a, img(10, 10, () => [0, 0, 0])).comparable, false);
  assert.ok(P.decode(P.diffImage(a, b)).width === 64);
});
test('equivalencia: exige límites; una diferencia mayor nunca es equivalente; la exacta se marca exacta', () => {
  const a = img(100, 100, () => [50, 50, 50]), tiny = img(100, 100, (x, y) => (x === 5 && y === 5 ? [51, 50, 50] : [50, 50, 50])), big = img(100, 100, (x) => (x < 30 ? [200, 50, 50] : [50, 50, 50]));
  assert.throws(() => P.equivalent(a, tiny, {}), e => e.code === 'LIMITS');
  assert.equal(P.equivalent(a, a, { maxDelta: 0, maxRatio: 0 }).exact, true);
  const t = P.equivalent(a, tiny, { maxDelta: 1, maxRatio: 1e-4 }); assert.equal(t.equivalent, true); assert.equal(t.exact, false);
  assert.equal(P.equivalent(a, tiny, { maxDelta: 0, maxRatio: 1 }).equivalent, false, 'delta above the limit');
  assert.equal(P.equivalent(a, big, { maxDelta: 255, maxRatio: 0.01 }).equivalent, false, 'area above the limit');
  assert.notEqual(P.pixelSha(a), P.pixelSha(tiny));
});

test('contrato de ventana: fuera del lienzo exacto; sobre el lienzo dentro de los límites medidos; una etiqueta ausente no pasa', () => {
  const W = 100, H = 50, base = () => ({ width: W, height: H, data: new Uint8Array(W * H * 4).fill(200) }), rect = { x: 0, y: 20, width: 100, height: 30 };
  const a = base(), b = base(); b.data[(25 * W + 10) * 4] = 220; // 1 px sobre el lienzo, Δ20
  const r = P.windowEquivalent(a, b, rect); assert.equal(r.equivalent, true); assert.equal(r.exact, false); assert.equal(r.outsideCanvasDifferent, 0);
  const c = base(); c.data[(5 * W + 10) * 4] = 201; // 1 px FUERA del lienzo, Δ1
  assert.equal(P.windowEquivalent(a, c, rect).equivalent, false, 'outside the canvas must be exact');
  const d = base(); for (let y = 20; y < 30; y++) for (let x = 0; x < 30; x++) d.data[(y * W + x) * 4] = 20; // 10 % del lienzo
  assert.equal(P.windowEquivalent(a, d, rect).equivalent, false, 'a missing label (area) is detected');
  assert.throws(() => P.windowEquivalent(a, b, null), e => e.code === 'LIMITS');
  assert.equal(P.WINDOW_CONTRACT.canvasMaxRatio, 0.012);
});
