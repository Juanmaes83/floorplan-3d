'use strict';
// Randomised cross-check of check_route_2d against an independent brute-force grid that shares no code with
// route.cjs. With 10 mm cells: a chain of cells whose centre clearance is >= r + 7.08 mm proves a route exists;
// no chain of cells with clearance >= r - 7.08 mm proves there is none. The tool must agree whenever the
// brute force is decisive, and its own trajectories are resampled every 2 mm.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const T = require('../../../js/tracing-core.js');
const Route = require('../src/route.cjs');
const F = require('../fixtures/route-projects.cjs');

const d2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pSeg = (p, a, b) => { const vx = b.x - a.x, vy = b.y - a.y, l = vx * vx + vy * vy, t = l ? Math.min(1, Math.max(0, ((p.x - a.x) * vx + (p.y - a.y) * vy) / l)) : 0; return d2(p, { x: a.x + t * vx, y: a.y + t * vy }); };
const inP = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; };

function scenes(seed, count) {
  let state = seed;
  const rnd = () => { state = (state * 1103515245 + 12345) % 2147483648; return state / 2147483648; };
  const W = 3000, H = 2000, out = [];
  while (out.length < count) {
    const objects = Array.from({ length: 2 + Math.floor(rnd() * 5) }, (_, i) => [`box${i}`, Math.round(300 + rnd() * 2400), Math.round(200 + rnd() * 1600),
      Math.round(150 + rnd() * 800), Math.round(150 + rnd() * 800), Math.round(rnd() * 90)]);
    const project = F.plan({ rooms: [['room', F.rect(0, 0, W, H)]], objects });
    const widthMm = Math.round(300 + rnd() * 600), r = widthMm / 2;
    const polys = project.objects.map(T.footprint), edges = [[{ x: 0, y: 0 }, { x: W, y: 0 }], [{ x: W, y: 0 }, { x: W, y: H }], [{ x: W, y: H }, { x: 0, y: H }], [{ x: 0, y: H }, { x: 0, y: 0 }]];
    for (const q of polys) q.forEach((a, i) => edges.push([a, q[(i + 1) % q.length]]));
    const clearance = q => (q.x < 0 || q.y < 0 || q.x > W || q.y > H || polys.some(pp => inP(q, pp))) ? -1 : Math.min(...edges.map(([a, b]) => pSeg(q, a, b)));
    let start, end, tries = 0;
    do { start = { x: Math.round(100 + rnd() * 800), y: Math.round(100 + rnd() * 1800) }; end = { x: Math.round(2100 + rnd() * 800), y: Math.round(100 + rnd() * 1800) }; }
    while ((clearance(start) < r || clearance(end) < r) && ++tries < 200);
    if (clearance(start) >= r && clearance(end) >= r) out.push({ project, widthMm, r, start, end, clearance, W, H });
  }
  return out;
}

function brute({ r, start, end, clearance, W, H }) {
  const h = 10, nx = W / h, ny = H / h, sure = new Uint8Array(nx * ny), maybe = new Uint8Array(nx * ny);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const c = clearance({ x: (i + 0.5) * h, y: (j + 0.5) * h });
    sure[i * ny + j] = c >= r + h * 0.7072 ? 1 : 0;
    maybe[i * ny + j] = c >= r - h * 0.7072 ? 1 : 0;
  }
  const near = (p, rad) => { const out = []; for (let i = Math.max(0, Math.floor((p.x - rad) / h)); i <= Math.min(nx - 1, Math.floor((p.x + rad) / h)); i++) for (let j = Math.max(0, Math.floor((p.y - rad) / h)); j <= Math.min(ny - 1, Math.floor((p.y + rad) / h)); j++) if (d2({ x: (i + 0.5) * h, y: (j + 0.5) * h }, p) <= rad) out.push(i * ny + j); return out; };
  const flood = (mask, from) => { const seen = new Uint8Array(nx * ny), q = []; for (const f of from) if (mask[f] && !seen[f]) { seen[f] = 1; q.push(f); }
    for (let t = 0; t < q.length; t++) { const c = q[t], i = Math.floor(c / ny), j = c % ny; for (let a = i - 1; a <= i + 1; a++) for (let b = j - 1; b <= j + 1; b++) { if (a < 0 || b < 0 || a >= nx || b >= ny) continue; const e = a * ny + b; if (mask[e] && !seen[e]) { seen[e] = 1; q.push(e); } } } return seen; };
  // A straight segment from an endpoint to a cell centre within (clearance - r) keeps the disc inside.
  const sureFrom = flood(sure, near(start, Math.max(0, clearance(start) - r)));
  const maybeFrom = flood(maybe, near(start, h));
  return { exists: near(end, Math.max(0, clearance(end) - r)).some(c => sureFrom[c]), possible: near(end, h).some(c => maybeFrom[c]) };
}

for (const seed of [42, 20261018]) test(`random rooms with rotated furniture agree with an independent brute force (seed ${seed})`, () => {
  const seen = { proven: 0, blocked: 0 };
  for (const scene of scenes(seed, 30)) {
    const out = Route.findRoute(scene.project, {}, { start: scene.start, end: scene.end, widthMm: scene.widthMm });
    const truth = brute(scene), label = `w=${scene.widthMm} ${JSON.stringify([scene.start, scene.end, scene.project.objects.map(o => [o.position, o.size, o.rotationDeg])])}`;
    if (truth.exists) assert.equal(out.status, Route.STATUS.PROVEN, label);
    if (!truth.possible) assert.equal(out.status, Route.STATUS.BLOCKED, label);
    assert.ok(out.status === Route.STATUS.PROVEN || out.status === Route.STATUS.BLOCKED || (truth.possible && !truth.exists), label);
    if (out.status === Route.STATUS.PROVEN) {
      seen.proven++;
      const pts = out.trajectory.points;
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1], b = pts[k], n = Math.ceil(d2(a, b) / 2);
        for (let t = 0; t <= n; t++) { const q = { x: a.x + (b.x - a.x) * t / n, y: a.y + (b.y - a.y) * t / n }; assert.ok(scene.clearance(q) >= scene.r - 1e-6, `${label} at ${JSON.stringify(q)}`); }
      }
    } else if (out.status === Route.STATUS.BLOCKED) seen.blocked++;
  }
  assert.ok(seen.proven >= 5 && seen.blocked >= 5, JSON.stringify(seen));
});
