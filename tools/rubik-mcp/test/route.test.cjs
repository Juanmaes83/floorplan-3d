'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const Core = require('../../../js/project-core.js');
const T = require('../../../js/tracing-core.js');
const core = require('../src/core.cjs');
const Route = require('../src/route.cjs');
const F = require('../fixtures/route-projects.cjs');

const P = (x, y) => ({ x, y });
const S = Route.STATUS;
const route = (project, start, end, widthMm, overrides) => Route.findRoute(project, { sha256: 'test' }, { start, end, widthMm }, overrides);

// ---------- Independent verifier: rebuilds the plan from the JSON, shares no code with route.cjs ----------
const d2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function pSeg(p, a, b) {
  const vx = b.x - a.x, vy = b.y - a.y, l = vx * vx + vy * vy;
  const t = l ? Math.min(1, Math.max(0, ((p.x - a.x) * vx + (p.y - a.y) * vy) / l)) : 0;
  return d2(p, { x: a.x + t * vx, y: a.y + t * vy });
}
function segSeg(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  if (o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0) return 0;
  return Math.min(pSeg(a, c, d), pSeg(b, c, d), pSeg(c, a, b), pSeg(d, a, b));
}
function inPoly(p, poly, eps = 1e-6) {
  for (let i = 0; i < poly.length; i++) if (pSeg(p, poly[i], poly[(i + 1) % poly.length]) <= eps) return 'edge';
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c;
  }
  return c ? 'in' : 'out';
}
const strip = (w, off, len) => Core.wallRect(w, off, len).poly.map(([x, y]) => ({ x, y }));
function independentPlan(project) {
  const forbidden = [], floor = project.rooms.map(r => r.polygon);
  for (const w of project.walls) {
    if (w.status === 'demolished') continue;
    const len = d2(w.start, w.end);
    let at = 0;
    for (const o of project.openings.filter(x => x.wallId === w.id).sort((a, b) => a.offsetMm - b.offsetMm)) {
      if (o.offsetMm > at) forbidden.push(strip(w, at, o.offsetMm - at));
      const s = strip(w, o.offsetMm, o.widthMm);
      if (['door', 'sliding-door', 'opening'].includes(o.kind) && o.sillHeightMm === 0) floor.push(s); else forbidden.push(s);
      at = o.offsetMm + o.widthMm;
    }
    if (len > at) forbidden.push(strip(w, at, len - at));
  }
  for (const o of project.objects) if (!['rug', 'acwall'].includes(o.type)) forbidden.push(T.footprint(o));
  return { forbidden, floor };
}
// Exact against every obstacle edge; disc sampled (5 mm along the path, 36 directions, 5 radii) against the floor.
function independentlyVerify(project, points, widthMm, { exactRoomEdges = false } = {}) {
  const r = widthMm / 2, plan = independentPlan(project), tol = 1e-6;
  let min = Infinity;
  const segs = points.length > 1 ? points.slice(1).map((q, k) => [points[k], q]) : [[points[0], points[0]]];
  const edgesOf = poly => poly.map((a, i) => [a, poly[(i + 1) % poly.length]]);
  for (const [a, b] of segs) for (const poly of plan.forbidden) for (const [c, d] of edgesOf(poly)) min = Math.min(min, segSeg(a, b, c, d));
  if (exactRoomEdges) for (const [a, b] of segs) for (const poly of project.rooms.map(x => x.polygon)) for (const [c, d] of edgesOf(poly)) min = Math.min(min, segSeg(a, b, c, d));
  assert.ok(min >= r - tol, `clearance ${min} < ${r}`);
  const okAt = q => plan.floor.some(poly => inPoly(q, poly) !== 'out') && !plan.forbidden.some(poly => inPoly(q, poly, 0) === 'in');
  for (const [a, b] of segs) {
    const n = Math.max(1, Math.ceil(d2(a, b) / 5));
    for (let k = 0; k <= n; k++) {
      const p = { x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n };
      for (const rho of [0, r / 4, r / 2, 3 * r / 4, r - 1e-3]) for (let t = 0; t < 36; t++) {
        const q = { x: p.x + rho * Math.cos(t * Math.PI / 18), y: p.y + rho * Math.sin(t * Math.PI / 18) };
        assert.ok(okAt(q), `disc point outside the floor at ${JSON.stringify(q)} (path point ${JSON.stringify(p)})`);
      }
    }
  }
  return min;
}
const proven = (out, project, widthMm, opts) => {
  assert.equal(out.status, S.PROVEN, JSON.stringify(out.reasons));
  const min = independentlyVerify(project, out.trajectory.points, widthMm, opts);
  assert.ok(out.limiting.widthMm >= widthMm - 1e-6 && out.limiting.widthMm <= 2 * min + 1e-3, `${out.limiting.widthMm} vs ${2 * min}`);
  assert.equal(out.trajectory.points[0].x, out.request.start.x);
  assert.equal(out.trajectory.points.at(-1).y, out.request.end.y);
  return out;
};
const blocked = (out, codeOrGap) => {
  assert.equal(out.status, S.BLOCKED, JSON.stringify(out.reasons));
  assert.equal(out.trajectory, null);
  assert.ok(out.reasons.length > 0);
  return out;
};
const gaps = out => out.reasons.filter(r => r.code === 'gap_narrower_than_required');
const hasGap = (out, gapMm, ids) => assert.ok(gaps(out).some(g => g.gapMm === gapMm && ids.every(id => g.elements.some(e => e.id === id))),
  `gap ${gapMm} ${ids} not in ${JSON.stringify(gaps(out).map(g => [g.gapMm, g.elements.map(e => e.id)]))}`);

// ---------- Matrix ----------
test('free straight path: one segment, exact limiting width and explicit frame, units and scale', () => {
  const p = F.open(), out = proven(route(p, P(1000, 2000), P(5000, 2000), 800), p, 800, { exactRoomEdges: true });
  assert.deepEqual(out.trajectory.points, [P(1000, 2000), P(5000, 2000)]);
  assert.equal(out.limiting.widthMm, 2000); // start is 1000 mm from the west face
  assert.equal(out.limiting.basis, 'exacta_sobre_la_trayectoria_devuelta');
  assert.deepEqual([out.units, out.plane, out.scaleConfidence, out.request.widthMm], ['mm', '2d', 'estimated', 800]);
  assert.equal(out.coordinateSystem.origin, 'plan-top-left');
  assert.ok(out.limits.some(l => /Escala estimated/.test(l)) && out.limits.some(l => /no acredita accesibilidad/.test(l)));
  assert.deepEqual(out.traversed.regionIds, ['rom_hall']);
});

test('blocked straight line with a valid detour: the detour keeps the width on every segment and turn', () => {
  const p = F.open([['table', 3000, 2000, 1000, 2000]]);
  assert.ok(segSeg(P(1000, 2000), P(5000, 2000), P(2500, 1000), P(2500, 3000)) === 0, 'the straight line crosses the table');
  const out = proven(route(p, P(1000, 2000), P(5000, 2000), 800), p, 800, { exactRoomEdges: true });
  assert.ok(out.trajectory.segments >= 2);
  assert.equal(out.trajectory.method, 'quadtree_certificado');
  assert.ok(out.limiting.elements.some(e => e.id === 'obj_table'));
});

test('two alternative routes: the 700 mm side is never used for 800 mm; both too narrow for 1100 mm', () => {
  const p = F.open([['table', 3000, 2150, 1000, 2300]]); // table y 1000–3300: 1000 mm below, 700 mm above
  const out = proven(route(p, P(1000, 2000), P(5000, 2000), 800), p, 800, { exactRoomEdges: true });
  for (const [a, b] of out.trajectory.points.slice(1).map((q, k) => [out.trajectory.points[k], q]))
    for (let k = 0; k <= 200; k++) { const x = a.x + (b.x - a.x) * k / 200, y = a.y + (b.y - a.y) * k / 200; if (x >= 2500 && x <= 3500) assert.ok(y <= 600 + 1e-6, `y ${y}`); }
  const no = blocked(route(p, P(1000, 2000), P(5000, 2000), 1100));
  hasGap(no, 700, ['obj_table']); hasGap(no, 1000, ['obj_table']);
});

test('corridor just below, exactly at and above the requested width', () => {
  const below = blocked(route(F.corridor(799), P(1500, 1499.5), P(7500, 1499.5), 800));
  hasGap(below, 799, ['rom_corridor']);
  const at = F.corridor(800), exact = proven(route(at, P(1500, 1500), P(7500, 1500), 800), at, 800);
  assert.equal(exact.limiting.widthMm, 800);
  assert.ok(exact.limiting.elements.some(e => e.id === 'rom_corridor'));
  const above = F.corridor(801);
  assert.equal(proven(route(above, P(1500, 1500.5), P(7500, 1500.5), 800), above, 800).limiting.widthMm, 801);
});

test('L turn: the disc turns a 900 mm and an exact 800 mm corner, but not past a cabinet that leaves 707 mm', () => {
  const free = F.lTurn();
  proven(route(free, P(1000, 450), P(3550, 3000), 800), free, 800, { exactRoomEdges: true });
  const exact = F.plan({ rooms: [['lshape', [[0, 0], [4000, 0], [4000, 4000], [3200, 4000], [3200, 800], [0, 800]]]] });
  assert.equal(proven(route(exact, P(1000, 400), P(3600, 3000), 800), exact, 800, { exactRoomEdges: true }).limiting.widthMm, 800);
  const cab = F.lTurn([['cabinet', 3800, 200, 400, 400]]);
  // Both ends fit (450 mm clearance) but the inner corner (3100, 900) is 500·√2 from the cabinet corner (3600, 400).
  assert.equal(route(cab, P(1000, 450), P(3550, 3000), 800).endpoints.start.clearanceMm, 450);
  hasGap(blocked(route(cab, P(1000, 450), P(3550, 3000), 800)), 707.106, ['obj_cabinet', 'rom_lshape']);
});

test('concave room: the chord leaves the room, the route turns and stays inside', () => {
  const p = F.concave();
  assert.equal(inPoly(P(3000, 3000), p.rooms[0].polygon), 'out', 'chord midpoint outside');
  assert.ok(proven(route(p, P(1000, 1000), P(5000, 5000), 800), p, 800, { exactRoomEdges: true }).trajectory.segments >= 2);
});

test('wall with a sufficient door, an insufficient door and a window', () => {
  const door = F.twoRooms(900), ok = proven(route(door, P(2000, 2000), P(6000, 2000), 800), door, 800);
  assert.deepEqual(ok.traversed, { regionIds: ['rom_west', 'rom_east'], openingIds: ['opn_middle'] });
  const narrow = blocked(route(F.twoRooms(700), P(2000, 2000), P(6000, 2000), 800));
  assert.ok(narrow.reasons.some(r => r.code === 'opening_narrower_than_required' && r.openingId === 'opn_middle' && r.widthMm === 700));
  hasGap(narrow, 700, ['opn_middle']);
  const win = blocked(route(F.twoRooms(900, 'window'), P(2000, 2000), P(6000, 2000), 800));
  assert.deepEqual(win.reasons.find(r => r.code === 'opening_not_passable'), { code: 'opening_not_passable', openingId: 'opn_middle', kind: 'window', reason: 'window' });
  // A door raised above the floor is not a passage either.
  const raised = blocked(route(F.twoRooms(900, 'door', { sillHeightMm: 300 }), P(2000, 2000), P(6000, 2000), 800));
  assert.ok(raised.reasons.some(r => r.code === 'opening_not_passable' && r.reason === 'sill_above_floor'));
});

test('wall end that can be rounded (2000 mm) and one that cannot (700 mm)', () => {
  const round = F.wallEnd(4000), out = proven(route(round, P(1500, 1000), P(4500, 1000), 800), round, 800);
  assert.ok(Math.max(...out.trajectory.points.map(q => q.y)) >= 4400, 'goes around the free end');
  hasGap(blocked(route(F.wallEnd(5300), P(1500, 1000), P(4500, 1000), 800)), 700, ['wal_part']);
});

test('rotated furniture, built-in furniture and furniture in contact', () => {
  const rot = F.strip(1600, [['rotated', 3000, 600, 1200, 400, 30]]);
  const top = Math.max(...T.footprint(rot.objects[0]).map(q => q.y));
  hasGap(blocked(route(rot, P(500, 800), P(5500, 800), 800)), Math.floor((1600 - top) * 1000) / 1000, ['obj_rotated']);
  proven(route(rot, P(500, 800), P(5500, 800), 500), rot, 500, { exactRoomEdges: true });
  const built = F.strip(1200, [['wardrobe', 3000, 1100, 1000, 400]]); // overlaps the north wall: 900 mm left
  assert.equal(proven(route(built, P(500, 450), P(5500, 450), 800), built, 800).limiting.widthMm, 900);
  const contact = F.strip(1600, [['sofa', 3000, 425, 2000, 850]]); // touches the south face, leaves 750 mm
  hasGap(blocked(route(contact, P(500, 1200), P(5500, 1200), 800)), 750, ['obj_sofa']);
});

test('margins of ±0.01 mm around a rotated piece decide correctly, contact included', () => {
  for (const rot of [0, 17, 45]) {
    const p = F.plan({ rooms: [['room', F.rect(0, 0, 6000, 3000)]], walls: F.enclose('room', 0, 0, 6000, 3000), objects: [['piece', 3000, 800, 300, 2000, rot]] });
    const gap = 3000 - Math.max(...T.footprint(p.objects[0]).map(q => q.y));
    for (const margin of [-1, -0.01, 0]) proven(route(p, P(800, 1500), P(5200, 1500), gap + margin), p, gap + margin);
    for (const margin of [0.01, 1]) {
      const out = blocked(route(p, P(800, 1500), P(5200, 1500), gap + margin));
      assert.ok(gaps(out).some(g => Math.abs(g.gapMm - gap) <= 0.001 && g.elements.some(e => e.id === 'obj_piece')), `${rot} ${margin}`);
    }
  }
});

test('start or end inside an obstacle, too close to it, outside the rooms or on a room boundary', () => {
  const p = F.open([['table', 3000, 2000, 1000, 2000]]), end = P(5000, 2000);
  assert.deepEqual(route(p, P(3000, 2000), end, 800).reasons, [{ code: 'point_inside_obstacle', point: 'start', elementId: 'obj_table', kind: 'object' }]);
  const close = route(p, P(2200, 2000), end, 800);
  assert.equal(close.status, S.NOT_EVALUABLE);
  assert.deepEqual(close.reasons[0], { code: 'point_clearance_below_required', point: 'start', clearanceMm: 300, requiredMm: 400,
    nearestElement: { id: 'obj_table', kind: 'object', point: P(2500, 2000) } });
  assert.equal(route(p, P(1000, 2000), P(-500, 0), 800).reasons[0].code, 'point_outside_documented_domain');
  const shared = route(F.corridor(800), P(3000, 1500), P(7500, 1500), 800);
  assert.deepEqual(shared.reasons[0], { code: 'point_on_region_boundary', point: 'start', regionIds: ['rom_west', 'rom_corridor'] });
  for (const out of [close, shared]) assert.equal(out.trajectory, null);
});

test('overlapping rooms and overlapping openings are not evaluable; invalid geometry is rejected', async t => {
  const ov = F.plan({ rooms: [['first', F.rect(0, 0, 3000, 3000)], ['second', F.rect(2000, 0, 5000, 3000)]] });
  assert.deepEqual(route(ov, P(500, 500), P(4500, 500), 800).reasons, [{ code: 'rooms_overlap', roomIds: ['rom_first', 'rom_second'], overlapAreaMm2: 3000000 }]);
  const two = F.twoRooms(900);
  two.openings.push({ ...two.openings[0], id: 'opn_second', offsetMm: 2000, widthMm: 600 });
  Core.validate(two);
  const out = route(two, P(2000, 2000), P(6000, 2000), 800);
  assert.equal(out.status, S.NOT_EVALUABLE);
  assert.deepEqual(out.reasons[0].openingIds, ['opn_middle', 'opn_second']);
  const bad = F.open();
  bad.rooms[0].polygon = [P(0, 0), P(6000, 4000), P(6000, 0), P(0, 4000)];
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'rubik-route-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'bad.json');
  await fs.writeFile(file, JSON.stringify(bad));
  const reader = core.createProjectReader(file);
  await assert.rejects(core.checkRoute2d(reader, { start: P(100, 100), end: P(200, 200), widthMm: 800 }), /FloorPlanProjectV1/);
  assert.equal((await core.diagnoseProject(reader)).valid, false);
});

test('thin obstacles and corners that a sampling grid could jump', () => {
  const post = F.strip(1500, [['post', 3000, 750, 10, 10]]);
  hasGap(blocked(route(post, P(500, 750), P(5500, 750), 800)), 745, ['obj_post']);
  proven(route(post, P(500, 750), P(5500, 750), 700), post, 700, { exactRoomEdges: true });
  const thin = F.plan({ rooms: [['room', F.rect(0, 0, 6000, 4000)]], walls: [...F.enclose('room', 0, 0, 6000, 4000), ['thin', 3000, 0, 3000, 4000, { thicknessMm: 10 }]] });
  const wall = blocked(route(thin, P(1000, 2000), P(5000, 2000), 100));
  assert.ok(wall.startRegion.boundingElements.some(e => e.id === 'wal_thin'));
  // Two blocks touching corner to corner, then 1 mm apart diagonally: never a passage for a 400 mm disc.
  const touching = blocked(route(F.strip(1600, [['blocka', 2400, 400, 800, 800], ['blockb', 3200, 1200, 800, 800]]), P(500, 800), P(5500, 800), 400));
  assert.ok(touching.reasons.some(r => r.code === 'contact_closes_passage' && r.elements.map(e => e.id).join() === 'obj_blocka,obj_blockb' && r.point.x === 2800 && r.point.y === 800));
  hasGap(blocked(route(F.strip(1602, [['blocka', 2400, 400, 800, 800], ['blockb', 3201, 1201, 800, 800]]), P(500, 800), P(5500, 800), 400)), 1.414, ['obj_blocka', 'obj_blockb']);
});

test('estimated and pending scale keep the model status and say the millimetres are not confirmed', () => {
  const p = F.open([], { scale: { confidence: 'pending', method: 'none' } });
  const out = route(p, P(1000, 2000), P(5000, 2000), 800);
  assert.equal(out.status, S.PROVEN);
  assert.equal(out.scaleConfidence, 'pending');
  assert.ok(out.limits.some(l => /Escala pending: los milímetros del modelo no están confirmados/.test(l)));
});

test('budgets end as límite_de_cálculo, never as blocked or proven', () => {
  const det = F.open([['table', 3000, 2000, 1000, 2000]]);
  assert.deepEqual([route(det, P(1000, 2000), P(5000, 2000), 2).status, route(det, P(1000, 2000), P(5000, 2000), 2).reasons[0].code], [S.BUDGET, 'initial_resolution_budget']);
  const cells = route(F.corridor(799), P(1500, 1499.5), P(7500, 1499.5), 800, { leaves: 50 });
  assert.deepEqual([cells.status, cells.reasons[0].code, cells.trajectory], [S.BUDGET, 'cell_budget', null]);
  const iter = route(det, P(1000, 2000), P(5000, 2000), 800, { iterations: 1 });
  assert.deepEqual([iter.status, iter.reasons[0].code], [S.BUDGET, 'iteration_budget']);
  const many = F.open(Array.from({ length: 101 }, (_, i) => [`box${i}`, 100 + (i % 50) * 110, 100 + Math.floor(i / 50) * 110, 50, 50]));
  assert.deepEqual(route(many, P(3000, 3000), P(5000, 3000), 800).reasons[0], { code: 'geometry_budget', element: 'objects', count: 101, limit: 100 });
});

test('requests without explicit positive width or explicit points are rejected', () => {
  const p = F.open();
  for (const args of [{ start: P(1, 1), end: P(2, 2) }, { start: P(1, 1), end: P(2, 2), widthMm: 0 }, { start: P(1, 1), end: P(2, 2), widthMm: -5 },
    { start: { x: Number.NaN, y: 0 }, end: P(2, 2), widthMm: 800 }, { start: P(1, 1), widthMm: 800 }, { start: P(1, 1), end: P(2, 2), widthMm: 200000 }])
    assert.throws(() => Route.findRoute(p, {}, args), /Indica/);
});

test('deterministic output for the same file and request', () => {
  for (const [p, a, b, w] of [[F.open([['table', 3000, 2000, 1000, 2000]]), P(1000, 2000), P(5000, 2000), 800],
    [F.corridor(799), P(1500, 1499.5), P(7500, 1499.5), 800], [F.lTurn([['cabinet', 3800, 200, 400, 400]]), P(1000, 450), P(3550, 3000), 800]])
    assert.deepEqual(route(p, a, b, w), route(p, a, b, w));
});

test('template plan: a proven route through a door and a blocked one with the narrow sliding door named', () => {
  const p = Core.initial(), at = id => p.rooms.find(r => r.id === id).labelAt;
  const t0 = Date.now();
  const okRaw = route(p, at('rom_master'), at('rom_living'), 600), no = blocked(route(p, at('rom_kitchen'), at('rom_kid'), 900));
  const ms = Date.now() - t0;
  assert.ok(ms < 5000, `${ms} ms`);
  const ok = proven(okRaw, p, 600);
  assert.deepEqual(ok.traversed, { regionIds: ['rom_master', 'rom_hall', 'rom_living'], openingIds: ['opn_door-1'] });
  assert.ok(no.reasons.some(r => r.code === 'opening_narrower_than_required' && r.openingId === 'opn_slide-1' && r.widthMm === 815));
});

test('file reader: hash, bytes unchanged, bounded output, no images or paths', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'rubik-route-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const project = F.open([['table', 3000, 2000, 1000, 2000]]);
  project.sourceImages = Core.initial().sourceImages || [];
  const file = path.join(dir, 'source.json'), bytes = Buffer.from(JSON.stringify(project));
  await fs.writeFile(file, bytes);
  const out = await core.checkRoute2d(core.createProjectReader(file), { start: P(1000, 2000), end: P(5000, 2000), widthMm: 800 });
  assert.equal(out.snapshot.sha256, crypto.createHash('sha256').update(bytes).digest('hex'));
  assert.equal(out.status, S.PROVEN);
  assert.deepEqual(await fs.readFile(file), bytes);
  const text = JSON.stringify(out);
  assert.ok(Buffer.byteLength(text) < core.MAX_RESPONSE_BYTES);
  for (const leak of [file, dir, 'sourceImages', 'data:image', '"walls":[', '"rooms":[']) assert.equal(text.includes(leak), false, leak);
});
