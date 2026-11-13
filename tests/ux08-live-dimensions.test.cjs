// UX-08 · cotas en vivo al mover muebles: geometría pura (js/live-dimensions-core.js) y capa visual sin DOM.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const L = require('../js/live-dimensions-core.js');
const U = require('../js/live-dimensions-ui.js');
const Core = require('../js/project-core.js');
const T = require('../js/tracing-core.js');

const rect = { rooms: [{ id: 'r', poly: [[0, 0], [4000, 0], [4000, 3000], [0, 3000]] }], walls: [] };
const lShape = { rooms: [{ id: 'L', poly: [[0, 0], [4000, 0], [4000, 1500], [2000, 1500], [2000, 3000], [0, 3000]] }], walls: [] };
const bySide = m => Object.fromEntries(m.sides.map(s => [s.side, s.mm]));

test('UX-08 estancia rectangular, mueble alineado: espacio libre delante de cada lado, en mm', () => {
  const m = L.measure(rect, { cx: 1000, cy: 1000, w: 1000, d: 500, rot: 0 });
  assert.equal(m.status, 'ok'); assert.equal(m.roomId, 'r');
  assert.deepEqual(bySide(m), { top: 750, right: 2500, bottom: 1750, left: 500 });
  // Cada cota va de un punto del lado a un punto del límite, en la perpendicular del lado.
  for (const s of m.sides) assert.ok(Math.abs(Math.hypot(s.to.x - s.from.x, s.to.y - s.from.y) - s.mm) < 1);
});

test('UX-08 mueble girado: las cotas siguen los lados de la huella orientada (la misma que layout-review y R03)', () => {
  const a = L.footprint({ cx: 1000, cy: 1000, w: 1000, d: 500, rot: 30 });
  const b = T.footprint({ position: { x: 1000, y: 1000 }, size: { widthMm: 1000, depthMm: 500 }, rotationDeg: 30 });
  a.forEach((v, i) => { assert.ok(Math.abs(v.x - b[i].x) < 1e-9 && Math.abs(v.y - b[i].y) < 1e-9); });
  assert.deepEqual(bySide(L.measure(rect, { cx: 1000, cy: 1000, w: 1000, d: 500, rot: 90 })), { top: 2750, right: 1500, bottom: 750, left: 500 });
  // Giros arbitrarios en estancias rectangulares y en L: contraste independiente por fuerza bruta (rayos desde 801 puntos (esquinas incluidas)
  // de cada lado, en la perpendicular del lado, contra cada borde de la estancia).
  for (const [g, piece] of [[rect, { cx: 2000, cy: 1500, w: 1000, d: 1000, rot: 45 }], [rect, { cx: 1300, cy: 900, w: 1200, d: 600, rot: 17 }],
    [lShape, { cx: 1000, cy: 900, w: 900, d: 500, rot: 33 }], [lShape, { cx: 1100, cy: 2200, w: 700, d: 400, rot: -60 }]]) {
    const m = L.measure(g, piece), exact = bySide(m), sampled = bruteForce(g.rooms[0].poly, piece); assert.equal(m.status, 'ok');
    // El muestreo es una cota superior (puede no caer justo en el vértice que manda); el núcleo es exacto: nunca mayor,
    // y a menos de la resolución del muestreo (≤ 2 mm con 800 tramos por lado).
    for (const side of Object.keys(sampled)) {
      assert.ok(exact[side] <= sampled[side] && sampled[side] - exact[side] <= 2, `${JSON.stringify(piece)} ${side}: ${exact[side]} vs ${sampled[side]}`);
    }
  }
});
function bruteForce(poly, piece) {
  const F = L.footprint(piece), out = {}, P = poly.map(([x, y]) => ({ x, y }));
  const area = F.reduce((s, a, i) => s + a.x * F[(i + 1) % 4].y - F[(i + 1) % 4].x * a.y, 0);
  ['top', 'right', 'bottom', 'left'].forEach((side, i) => {
    const a = F[i], b = F[(i + 1) % 4], ex = b.x - a.x, ey = b.y - a.y, l = Math.hypot(ex, ey);
    const n = area > 0 ? { x: ey / l, y: -ex / l } : { x: -ey / l, y: ex / l };
    let best = Infinity;
    for (let k = 0; k <= 800; k++) {
      const o = { x: a.x + ex * k / 800, y: a.y + ey * k / 800 };
      for (let j = 0; j < P.length; j++) {
        const c = P[j], d = P[(j + 1) % P.length], sx = d.x - c.x, sy = d.y - c.y, den = n.x * sy - n.y * sx;
        if (Math.abs(den) < 1e-12) continue;
        const t = ((c.x - o.x) * sy - (c.y - o.y) * sx) / den, u = ((c.x - o.x) * n.y - (c.y - o.y) * n.x) / den;
        if (t >= -1e-6 && u >= -1e-9 && u <= 1 + 1e-9) best = Math.min(best, t);
      }
    }
    out[side] = Math.round(best);
  });
  return out;
}

test('UX-08 estancia irregular (en L): el hueco es el real delante de todo el lado, no el de la caja de la estancia', () => {
  // Junto a la esquina entrante: el lado derecho está pegado al tabique (0) y hacia arriba quedan 1800 mm reales.
  assert.deepEqual(bySide(L.measure(lShape, { cx: 1700, cy: 2000, w: 600, d: 400, rot: 0 })), { top: 1800, right: 0, bottom: 800, left: 1400 });
  // En el brazo superior: hacia abajo manda la esquina entrante (300), no el fondo de la caja (1800).
  assert.equal(bySide(L.measure(lShape, { cx: 2500, cy: 1000, w: 600, d: 400, rot: 0 })).bottom, 300);
  // Un tabique (muro) dentro de la estancia también es un límite.
  const withWall = { rooms: rect.rooms, walls: [{ poly: [[2500, 0], [2600, 0], [2600, 2000], [2500, 2000]] }] };
  assert.equal(bySide(L.measure(withWall, { cx: 1000, cy: 1000, w: 1000, d: 500, rot: 0 })).right, 1000);
});

test('UX-08 junto a un muro: 0 mm, y sin confundir el muro contiguo con el que está delante', () => {
  assert.deepEqual(bySide(L.measure(rect, { cx: 500, cy: 250, w: 1000, d: 500, rot: 0 })), { top: 0, right: 3000, bottom: 2500, left: 0 });
});

test('UX-08 sin referencia fiable no hay cifra: fuera, cruzando, en dos estancias, invadiendo un muro o con datos inválidos', () => {
  assert.equal(L.measure(rect, { cx: 5000, cy: 1000, w: 1000, d: 500, rot: 0 }).status, 'no-room');
  const out = L.measure(lShape, { cx: 2200, cy: 1400, w: 1000, d: 600, rot: 0 });
  assert.equal(out.status, 'outside'); assert.deepEqual(out.sides, []); assert.match(out.reason, /sale de su estancia/);
  const two = { rooms: [rect.rooms[0], { id: 'b', poly: [[500, 500], [1500, 500], [1500, 1500], [500, 1500]] }], walls: [] };
  assert.equal(L.measure(two, { cx: 1000, cy: 1000, w: 200, d: 200, rot: 0 }).status, 'ambiguous');
  const wall = { rooms: rect.rooms, walls: [{ poly: [[1300, 0], [1400, 0], [1400, 3000], [1300, 3000]] }] };
  assert.equal(L.measure(wall, { cx: 1000, cy: 1000, w: 1000, d: 500, rot: 0 }).status, 'wall');
  for (const bad of [{ cx: NaN, cy: 0, w: 1, d: 1, rot: 0 }, { cx: 0, cy: 0, w: 0, d: 1, rot: 0 }, null]) assert.equal(L.measure(rect, bad).status, 'invalid');
  // La capa visual lo dice en una línea y no dibuja ninguna cota.
  const s = U.markup(lShape, { cx: 2200, cy: 1400, w: 1000, d: 600, rot: 0 }, { k: 10 });
  assert.match(s, /Sin cotas: El mueble sale de su estancia/); assert.doesNotMatch(s, /data-mm=/);
});

test('UX-08 milímetros reales: las cifras no dependen del zoom; el zoom solo cambia el tamaño del dibujo', () => {
  const p = { cx: 1000, cy: 1000, w: 1000, d: 500, rot: 20 }, exact = Object.values(bySide(L.measure(rect, p)));
  const shown = k => [...U.markup(rect, p, { k }).matchAll(/data-mm="(\d+)"/g)].map(x => +x[1]);
  // Toda cifra visible es la del núcleo, a cualquier zoom. Con el plano muy reducido, una cifra que taparía un asa se
  // omite (antes sin cifra que encima de un control), nunca se cambia.
  for (const k of [0.25, 1, 10, 40, 120]) for (const v of shown(k)) assert.ok(exact.includes(v), `k=${k}: ${v}`);
  assert.deepEqual(shown(1).sort((a, b) => a - b), [...exact].sort((a, b) => a - b), 'con zoom normal se ven las cuatro');
  assert.match(U.markup(rect, p, { k: 10 }), /pointer-events="none"/);
});

test('UX-08 solo lectura: no muta la geometría ni el mueble, y con el proyecto de ejemplo mide sus estancias reales', () => {
  const project = Core.initial(), g = Core.geometry(project), before = JSON.stringify(project), gBefore = JSON.stringify(g);
  for (const o of project.objects) {
    const piece = { cx: o.position.x, cy: o.position.y, w: o.size.widthMm, d: o.size.depthMm, rot: o.rotationDeg }, frozen = JSON.stringify(piece);
    const m = L.measure(g, piece);
    assert.ok(['ok', 'outside', 'wall', 'no-room', 'ambiguous'].includes(m.status), `${o.id}: ${m.status}`);
    if (m.status === 'ok') for (const s of m.sides) assert.ok(Number.isInteger(s.mm) && s.mm >= 0);
    assert.equal(JSON.stringify(piece), frozen);
  }
  assert.equal(JSON.stringify(project), before); assert.equal(JSON.stringify(g), gBefore);
  // El armario del dormitorio principal: dentro de su estancia, con cotas.
  const w = project.objects.find(o => o.id === 'obj_template-004');
  const m = L.measure(g, { cx: w.position.x, cy: w.position.y, w: w.size.widthMm, d: w.size.depthMm, rot: w.rotationDeg });
  assert.equal(m.status, 'ok'); assert.equal(m.roomId, 'rom_master');
});
