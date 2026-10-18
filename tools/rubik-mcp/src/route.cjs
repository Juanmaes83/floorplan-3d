'use strict';

// Read-only 2D route query for a disc of explicit diameter between two explicit points.
// Contract: docs/technical/local-mcp-route-2d.md. Positive answers are polylines verified exactly
// (segment-to-segment distances); negative answers are certified by quadtree cells whose
// classification carries a proven bound. Anything else is reported as uncertain or as a budget limit.
const C = require('../../../js/project-core.js');
const T = require('../../../js/tracing-core.js');
const Spatial = require('./spatial.cjs');

const STATUS = Object.freeze({
  PROVEN: 'recorrido_demostrado_en_modelo_2d',
  BLOCKED: 'bloqueado_por_geometría_documentada',
  INSUFFICIENT: 'evidencia_insuficiente',
  NOT_EVALUABLE: 'no_evaluable',
  BUDGET: 'límite_de_cálculo',
});
const TOL_MM = 1e-6;       // contact admitted: clearance >= r - TOL_MM counts as fitting
const PROBE_MM = 1e-3;     // side probe to classify pieces of the domain boundary
const ON_EDGE_MM = 1e-6;   // a request point this close to a region edge is on that edge
const MIN_CELL_MM = 0.25;  // finest quadtree cell; below it a case stays undecided
const MAX_PAIR_SEGMENTS = 24;
const NON_OBSTACLE_TYPES = new Set(['rug', 'acwall']); // floor covering and wall-mounted split (layout-review stacking)
const PASSABLE_KINDS = new Set(['door', 'sliding-door', 'opening']);
const LIMITS = Object.freeze({
  objects: 100, walls: 500, openings: 500, rooms: 200, roomVertices: 4000,
  segments: 20000, initialCells: 200000, leaves: 250000, iterations: 400, ms: 6000,
  pathPoints: 200, evidence: 10, coordinateMm: 1e7, maxWidthMm: 100000,
});

const floor3 = v => Math.floor(v * 1000 + 1e-9) / 1000;
const round3 = v => Math.round(v * 1000) / 1000;
const pt = p => ({ x: round3(p.x), y: round3(p.y) });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

function closestOnSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0;
  return { x: a.x + t * dx, y: a.y + t * dy };
}
const pointSegment = (p, s) => dist(p, closestOnSegment(p, s.a, s.b));

function properOrTouching(a, b, c, d) {
  const d1 = cross(c, d, a), d2 = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  const on = (p, q, r) => Math.abs(cross(p, q, r)) <= 1e-9 * Math.max(1, dist(p, q))
    && r.x >= Math.min(p.x, q.x) - 1e-9 && r.x <= Math.max(p.x, q.x) + 1e-9
    && r.y >= Math.min(p.y, q.y) - 1e-9 && r.y <= Math.max(p.y, q.y) + 1e-9;
  return on(c, d, a) || on(c, d, b) || on(a, b, c) || on(a, b, d);
}

// Exact minimum distance between segments [p,q] and s, with the two closest points.
function segmentSegment(p, q, s) {
  if (properOrTouching(p, q, s.a, s.b)) {
    const r = { x: q.x - p.x, y: q.y - p.y }, w = { x: s.b.x - s.a.x, y: s.b.y - s.a.y };
    const den = r.x * w.y - r.y * w.x;
    if (Math.abs(den) > 1e-12) {
      const t = ((s.a.x - p.x) * w.y - (s.a.y - p.y) * w.x) / den;
      const at = { x: p.x + r.x * t, y: p.y + r.y * t };
      return { d: 0, onPath: at, onElement: at };
    }
  }
  let best = null;
  for (const [x, u, v, flip] of [[p, s.a, s.b, false], [q, s.a, s.b, false], [s.a, p, q, true], [s.b, p, q, true]]) {
    const c = closestOnSegment(x, u, v), d = dist(x, c);
    if (!best || d < best.d) best = flip ? { d, onPath: c, onElement: x } : { d, onPath: x, onElement: c };
  }
  return best;
}

function insidePolygon(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
const boundsOf = poly => ({
  minX: Math.min(...poly.map(p => p.x)), maxX: Math.max(...poly.map(p => p.x)),
  minY: Math.min(...poly.map(p => p.y)), maxY: Math.max(...poly.map(p => p.y)),
});

// Uniform bucket index over bounding boxes; queries return each item once.
const MAX_INDEX_ENTRIES = 4_000_000;
function bucketIndex(size, used = { entries: 0 }) {
  const cells = new Map();
  let stamp = 0;
  const keyOf = (i, j) => i * 1048576 + j;
  return {
    insert(item, b) {
      for (let i = Math.floor(b.minX / size); i <= Math.floor(b.maxX / size); i++)
        for (let j = Math.floor(b.minY / size); j <= Math.floor(b.maxY / size); j++) {
          const k = keyOf(i, j);
          if (++used.entries > MAX_INDEX_ENTRIES) throw budget({ code: 'geometry_budget', element: 'index_entries', limit: MAX_INDEX_ENTRIES });
          if (!cells.has(k)) cells.set(k, []);
          cells.get(k).push(item);
        }
    },
    query(b, visit) {
      stamp++;
      for (let i = Math.floor(b.minX / size); i <= Math.floor(b.maxX / size); i++)
        for (let j = Math.floor(b.minY / size); j <= Math.floor(b.maxY / size); j++) {
          for (const item of cells.get(keyOf(i, j)) || []) {
            if (item._stamp === stamp) continue;
            item._stamp = stamp;
            visit(item);
          }
        }
    },
  };
}

class Unevaluable extends Error {
  constructor(status, reason) { super(reason.code); this.status = status; this.reason = reason; }
}
const notEvaluable = reason => new Unevaluable(STATUS.NOT_EVALUABLE, reason);
const budget = reason => new Unevaluable(STATUS.BUDGET, reason);

function openingStrip(wall, offset, length) {
  return C.wallRect(wall, offset, length).poly.map(([x, y]) => ({ x, y }));
}

// Domain = documented rooms + passable openings; obstacles = active wall pieces, non-passable openings, furniture.
function buildModel(project) {
  const counts = { objects: project.objects.length, walls: project.walls.length, openings: project.openings.length,
    rooms: project.rooms.length, roomVertices: project.rooms.reduce((n, r) => n + r.polygon.length, 0) };
  for (const key of Object.keys(counts)) if (counts[key] > LIMITS[key])
    throw budget({ code: 'geometry_budget', element: key, count: counts[key], limit: LIMITS[key] });
  if (!project.rooms.length) throw notEvaluable({ code: 'no_documented_rooms' });

  let spatial;
  try { spatial = Spatial.createSpatialIndex(project); }
  catch { throw notEvaluable({ code: 'room_not_triangulable' }); }
  const triangles = [];
  for (const room of project.rooms) {
    try { triangles.push({ id: room.id, tri: Spatial.triangulate(room.polygon, room.id), b: boundsOf(room.polygon) }); }
    catch { throw notEvaluable({ code: 'room_not_triangulable', roomId: room.id }); }
  }
  for (let i = 0; i < triangles.length; i++) for (let j = i + 1; j < triangles.length; j++) {
    const A = triangles[i], B = triangles[j];
    if (A.b.maxX <= B.b.minX || B.b.maxX <= A.b.minX || A.b.maxY <= B.b.minY || B.b.maxY <= A.b.minY) continue;
    let area = 0;
    for (const ta of A.tri) for (const tb of B.tri) area += Spatial.clippedArea(ta, tb);
    if (area > 1) throw notEvaluable({ code: 'rooms_overlap', roomIds: [A.id, B.id], overlapAreaMm2: Math.round(area) });
  }

  const regions = project.rooms.map(room => ({ id: room.id, kind: 'room', poly: room.polygon }));
  const obstacles = [];
  const openings = [];
  const ignoredObjects = [];
  for (const wall of project.walls) {
    const length = dist(wall.start, wall.end);
    const own = project.openings.filter(o => o.wallId === wall.id).sort((a, b) => a.offsetMm - b.offsetMm || (a.id < b.id ? -1 : 1));
    for (let k = 1; k < own.length; k++) if (own[k].offsetMm < own[k - 1].offsetMm + own[k - 1].widthMm - 1e-7)
      throw notEvaluable({ code: 'openings_overlap', openingIds: [own[k - 1].id, own[k].id], wallId: wall.id });
    if (wall.status === 'demolished') {
      const rel = spatial.relation('walls', wall);
      if (rel.status === 'shared' && rel.roomIds.length === 2)
        regions.push({ id: wall.id, kind: 'demolished_wall', poly: openingStrip(wall, 0, length), roomIds: rel.roomIds });
      for (const o of own) openings.push({ id: o.id, kind: o.kind, widthMm: o.widthMm, passable: false, reason: 'wall_demolished' });
      continue;
    }
    let from = 0;
    for (const o of own) {
      if (o.offsetMm > from + 1e-7) obstacles.push({ id: wall.id, kind: 'solid_wall', poly: openingStrip(wall, from, o.offsetMm - from) });
      const rel = spatial.relation('openings', o);
      const reason = !PASSABLE_KINDS.has(o.kind) ? 'window' : o.sillHeightMm !== 0 ? 'sill_above_floor'
        : rel.status !== 'shared' || rel.roomIds.length !== 2 ? 'not_between_two_rooms' : null;
      const poly = openingStrip(wall, o.offsetMm, o.widthMm);
      openings.push({ id: o.id, kind: o.kind, widthMm: o.widthMm, passable: !reason, ...(reason ? { reason } : { roomIds: rel.roomIds }), poly });
      if (reason) obstacles.push({ id: o.id, kind: o.kind === 'window' ? 'window' : 'opening_not_passable', poly });
      else regions.push({ id: o.id, kind: o.kind, poly, widthMm: o.widthMm, roomIds: rel.roomIds });
      from = o.offsetMm + o.widthMm;
    }
    if (length > from + 1e-7) obstacles.push({ id: wall.id, kind: 'solid_wall', poly: openingStrip(wall, from, length - from) });
  }
  for (const item of project.objects) {
    if (NON_OBSTACLE_TYPES.has(item.type)) { ignoredObjects.push({ id: item.id, type: item.type }); continue; }
    obstacles.push({ id: item.id, kind: 'object', poly: T.footprint(item) });
  }
  return { regions, obstacles, openings, ignoredObjects };
}

function buildIndex(model, r) {
  const all = [...model.regions, ...model.obstacles].map(x => boundsOf(x.poly));
  const box = { minX: Math.min(...all.map(b => b.minX)), maxX: Math.max(...all.map(b => b.maxX)),
    minY: Math.min(...all.map(b => b.minY)), maxY: Math.max(...all.map(b => b.maxY)) };
  const size = Math.max(r, 250, Math.max(box.maxX - box.minX, box.maxY - box.minY) / 400);
  const used = { entries: 0 };
  const polys = bucketIndex(size, used);
  model.regions.forEach((x, n) => { x.b = boundsOf(x.poly); x.role = 'region'; x.n = n; polys.insert(x, x.b); });
  model.obstacles.forEach((x, n) => { x.b = boundsOf(x.poly); x.role = 'obstacle'; x.n = n; polys.insert(x, x.b); });
  const at = (p, role) => {
    let hit = null;
    polys.query({ minX: p.x, maxX: p.x, minY: p.y, maxY: p.y }, x => {
      if (!hit && x.role === role && p.x >= x.b.minX && p.x <= x.b.maxX && p.y >= x.b.minY && p.y <= x.b.maxY && insidePolygon(p, x.poly)) hit = x;
    });
    return hit;
  };
  const inRegion = p => !!at(p, 'region');
  const inDomain = p => inRegion(p) && !at(p, 'obstacle');

  // Segments that bound F: every obstacle edge, plus the pieces of region edges with the domain on one side only.
  const segments = [];
  const add = (a, b, owner, src) => {
    if (dist(a, b) <= 1e-9) return;
    if (segments.length >= LIMITS.segments) throw budget({ code: 'geometry_budget', element: 'segments', limit: LIMITS.segments });
    segments.push({ a, b, id: owner.id, kind: owner.kind, src });
  };
  for (const o of model.obstacles) o.poly.forEach((a, i) => add(a, o.poly[(i + 1) % o.poly.length], o, `o${o.n}:${i}`));
  const edges = [];
  model.regions.forEach(x => x.poly.forEach((a, i) => edges.push({ a, b: x.poly[(i + 1) % x.poly.length], owner: x, i,
    bb: boundsOf([a, x.poly[(i + 1) % x.poly.length]]) })));
  const edgeIndex = bucketIndex(size, used);
  edges.forEach(e => edgeIndex.insert(e, e.bb));
  for (const e of edges) {
    const len = dist(e.a, e.b), ux = (e.b.x - e.a.x) / len, uy = (e.b.y - e.a.y) / len;
    const cuts = [0, 1];
    edgeIndex.query(e.bb, f => {
      if (f === e) return;
      for (const p of [f.a, f.b]) {
        if (Math.abs(cross(e.a, e.b, p)) / len > 1e-7) continue;
        const t = ((p.x - e.a.x) * ux + (p.y - e.a.y) * uy) / len;
        if (t > 1e-12 && t < 1 - 1e-12) cuts.push(t);
      }
      const den = (e.b.x - e.a.x) * (f.b.y - f.a.y) - (e.b.y - e.a.y) * (f.b.x - f.a.x);
      if (Math.abs(den) > 1e-12) {
        const t = ((f.a.x - e.a.x) * (f.b.y - f.a.y) - (f.a.y - e.a.y) * (f.b.x - f.a.x)) / den;
        const u = ((f.a.x - e.a.x) * (e.b.y - e.a.y) - (f.a.y - e.a.y) * (e.b.x - e.a.x)) / den;
        if (t > 1e-12 && t < 1 - 1e-12 && u >= -1e-12 && u <= 1 + 1e-12) cuts.push(t);
      }
    });
    cuts.sort((x, y) => x - y);
    for (let k = 1; k < cuts.length; k++) {
      if (cuts[k] - cuts[k - 1] <= 1e-12) continue;
      const a = { x: e.a.x + (e.b.x - e.a.x) * cuts[k - 1], y: e.a.y + (e.b.y - e.a.y) * cuts[k - 1] };
      const b = { x: e.a.x + (e.b.x - e.a.x) * cuts[k], y: e.a.y + (e.b.y - e.a.y) * cuts[k] };
      const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const left = inRegion({ x: m.x - uy * PROBE_MM, y: m.y + ux * PROBE_MM });
      const right = inRegion({ x: m.x + uy * PROBE_MM, y: m.y - ux * PROBE_MM });
      if (left !== right) add(a, b, { id: e.owner.id, kind: e.owner.kind === 'room' ? 'room_boundary' : 'opening_edge' }, `r${e.owner.n}:${e.i}`);
    }
  }
  const segIndex = bucketIndex(size, used);
  for (const s of segments) { s.bb = boundsOf([s.a, s.b]); segIndex.insert(s, s.bb); }
  const near = (b, visit) => segIndex.query(b, visit);
  return { box, inDomain, inRegion, at, segments, near };
}

// Exact clearance of a segment (or point) against every boundary segment within reach.
function segmentClearance(index, p, q, reach) {
  const b = { minX: Math.min(p.x, q.x) - reach, maxX: Math.max(p.x, q.x) + reach,
    minY: Math.min(p.y, q.y) - reach, maxY: Math.max(p.y, q.y) + reach };
  let best = { d: Infinity, seg: null };
  index.near(b, s => { const h = segmentSegment(p, q, s); if (h.d < best.d) best = { ...h, seg: s }; });
  return best;
}

function createSolver(index, r, deadline, limits) {
  const reach = r + 1;
  const segOk = (p, q) => segmentClearance(index, p, q, reach).d >= r - TOL_MM;
  const h0 = r / 2;
  const x0 = index.box.minX - h0, y0 = index.box.minY - h0;
  const nx = Math.ceil((index.box.maxX - index.box.minX) / h0) + 3, ny = Math.ceil((index.box.maxY - index.box.minY) / h0) + 3;
  if (nx * ny > limits.initialCells) throw budget({ code: 'initial_resolution_budget', cells: nx * ny, limit: limits.initialCells });
  const leaves = new Map(), internal = new Set();
  const key = (L, i, j) => `${L},${i},${j}`;
  let created = 0;

  function classify(cx, cy, h) {
    const c = { x: cx, y: cy }, hd = h * Math.SQRT1_2;
    if (!index.inDomain(c)) return hd < r - TOL_MM ? 'blocked' : 'uncertain';
    const radius = r + hd;
    const near = [];
    let d = radius;
    index.near({ minX: cx - radius, maxX: cx + radius, minY: cy - radius, maxY: cy + radius }, s => {
      const e = pointSegment(c, s);
      if (e < radius) { near.push({ s, e }); if (e < d) d = e; }
    });
    if (d >= radius) return 'free';
    if (d + hd < r - TOL_MM) return 'blocked';
    // Distance to a segment is convex: its maximum over the square is at a corner.
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => ({ x: cx + a * h / 2, y: cy + b * h / 2 }));
    near.sort((u, v) => u.e - v.e);
    const cand = near.slice(0, MAX_PAIR_SEGMENTS).map(({ s }) => corners.map(k => pointSegment(k, s)));
    for (const ds of cand) if (Math.max(...ds) < r - TOL_MM) return 'blocked';
    for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) {
      if (Math.max(...cand[i].map((v, k) => (v + cand[j][k]) / 2)) < r - TOL_MM) return 'blocked';
    }
    return 'uncertain';
  }
  function make(L, i, j) {
    const h = h0 / 2 ** L, cx = x0 + (i + 0.5) * h, cy = y0 + (j + 0.5) * h;
    const leaf = { L, i, j, h, cx, cy, key: key(L, i, j), state: classify(cx, cy, h) };
    leaves.set(leaf.key, leaf);
    if (++created > limits.leaves) throw budget({ code: 'cell_budget', limit: limits.leaves });
    return leaf;
  }
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) make(0, i, j);
    if (Date.now() > deadline) throw budget({ code: 'time_budget' });
  }
  const refinable = leaf => leaf.state === 'uncertain' && leaf.h / 2 >= MIN_CELL_MM;
  function refine(leaf) {
    leaves.delete(leaf.key); internal.add(leaf.key);
    for (const a of [0, 1]) for (const b of [0, 1]) make(leaf.L + 1, 2 * leaf.i + a, 2 * leaf.j + b);
  }
  function leafAt(p) {
    for (let L = 0; ; L++) {
      const h = h0 / 2 ** L, i = Math.floor((p.x - x0) / h), j = Math.floor((p.y - y0) / h);
      if (i < 0 || j < 0 || i >= nx * 2 ** L || j >= ny * 2 ** L) return null;
      const k = key(L, i, j);
      if (leaves.has(k)) return leaves.get(k);
      if (!internal.has(k)) return null;
    }
  }
  function collect(L, i, j, di, dj, out) {
    if (i < 0 || j < 0 || i >= nx * 2 ** L || j >= ny * 2 ** L) return;
    const k = key(L, i, j);
    if (leaves.has(k)) { out.add(leaves.get(k)); return; }
    if (internal.has(k)) {
      for (const a of di === 1 ? [0] : di === -1 ? [1] : [0, 1])
        for (const b of dj === 1 ? [0] : dj === -1 ? [1] : [0, 1]) collect(L + 1, 2 * i + a, 2 * j + b, di, dj, out);
      return;
    }
    for (let m = 1; m <= L; m++) {
      const up = key(L - m, i >> m, j >> m);
      if (leaves.has(up)) { out.add(leaves.get(up)); return; }
    }
  }
  function neighbours(leaf) {
    const out = new Set();
    for (const di of [-1, 0, 1]) for (const dj of [-1, 0, 1]) if (di || dj) collect(leaf.L, leaf.i + di, leaf.j + dj, di, dj, out);
    return [...out].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  }
  return { leaves, refine, refinable, leafAt, neighbours, segOk, h0, get created() { return created; } };
}

// Binary heap keyed by [cost, tie].
function heap() {
  const a = [];
  const less = (x, y) => x.f < y.f || (x.f === y.f && x.tie < y.tie);
  return {
    get size() { return a.length; },
    push(v) { a.push(v); let i = a.length - 1; while (i) { const p = (i - 1) >> 1; if (!less(a[i], a[p])) break; [a[i], a[p]] = [a[p], a[i]]; i = p; } },
    pop() {
      const top = a[0], last = a.pop();
      if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && less(a[l], a[m])) m = l; if (r < a.length && less(a[r], a[m])) m = r;
        if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; } }
      return top;
    },
  };
}

const PENALTY = { free: 1, uncertain: 4, unresolved: 1e6 };
const centre = leaf => ({ x: leaf.cx, y: leaf.cy });
const touchPoint = (A, B) => {
  const minX = Math.max(A.cx - A.h / 2, B.cx - B.h / 2), maxX = Math.min(A.cx + A.h / 2, B.cx + B.h / 2);
  const minY = Math.max(A.cy - A.h / 2, B.cy - B.h / 2), maxY = Math.min(A.cy + A.h / 2, B.cy + B.h / 2);
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
};

// A* over non-blocked leaves from s to g. Exhausting it is the proof of separation.
function search(solver, s, g, deadline) {
  const penalty = leaf => leaf.state === 'free' ? PENALTY.free : solver.refinable(leaf) ? PENALTY.uncertain : PENALTY.unresolved;
  const ends = (p) => {
    const own = solver.leafAt(p), links = new Map();
    if (own) links.set(own.key, { leaf: own });
    if (own && own.state !== 'free') {
      const ring = new Set([own]);
      let frontier = [own];
      for (let depth = 0; depth < 2; depth++) {
        const next = [];
        for (const x of frontier) for (const y of solver.neighbours(x)) if (!ring.has(y)) { ring.add(y); next.push(y); }
        frontier = next;
      }
      for (const y of [...ring].sort((a, b) => dist(centre(a), p) - dist(centre(b), p) || (a.key < b.key ? -1 : 1)))
        if (y.state === 'free' && solver.segOk(p, centre(y))) links.set(y.key, { leaf: y, verified: true });
    }
    return links;
  };
  const startLinks = ends(s), goalLinks = ends(g);
  const open = heap(), best = new Map(), parent = new Map(), closed = new Set();
  let tie = 0;
  for (const { leaf, verified } of startLinks.values()) {
    if (leaf.state === 'blocked') continue;
    const cost = dist(s, centre(leaf)) * (verified ? 1 : penalty(leaf));
    if (cost < (best.get(leaf.key) ?? Infinity)) { best.set(leaf.key, cost); parent.set(leaf.key, { from: null, verified: !!verified }); open.push({ f: cost + dist(centre(leaf), g), g: cost, leaf, tie: tie++ }); }
  }
  let goalCost = Infinity, goalVia = null, expanded = 0;
  while (open.size) {
    const cur = open.pop();
    if (cur.f >= goalCost) break;
    if (closed.has(cur.leaf.key)) continue;
    closed.add(cur.leaf.key);
    if ((++expanded & 1023) === 0 && Date.now() > deadline) throw budget({ code: 'time_budget' });
    const link = goalLinks.get(cur.leaf.key);
    if (link) {
      const c = cur.g + dist(centre(cur.leaf), g) * (link.verified ? 1 : penalty(cur.leaf));
      if (c < goalCost) { goalCost = c; goalVia = { leaf: cur.leaf, verified: !!link.verified }; }
    }
    for (const nb of solver.neighbours(cur.leaf)) {
      if (nb.state === 'blocked' || closed.has(nb.key)) continue;
      const c = cur.g + dist(centre(cur.leaf), centre(nb)) * penalty(nb);
      if (c < (best.get(nb.key) ?? Infinity)) {
        best.set(nb.key, c); parent.set(nb.key, { from: cur.leaf });
        open.push({ f: c + dist(centre(nb), g), g: c, leaf: nb, tie: tie++ });
      }
    }
  }
  if (!goalVia) return { found: false, reached: closed };
  const chain = [];
  for (let leaf = goalVia.leaf; leaf; leaf = parent.get(leaf.key).from) chain.push(leaf);
  chain.reverse();
  return { found: true, chain, startVerified: parent.get(chain[0].key).verified, goalVerified: goalVia.verified };
}

function pathFromChain(found, s, g) {
  const pts = [s];
  found.chain.forEach((leaf, n) => {
    if (n) pts.push(touchPoint(found.chain[n - 1], leaf));
    pts.push(centre(leaf));
  });
  pts.push(g);
  return pts;
}

// Pushes points with too little clearance towards the middle of their two closest opposite elements.
function relax(index, r, p) {
  let q = p;
  for (let k = 0; k < 8; k++) {
    const found = [];
    index.near({ minX: q.x - 2 * r, maxX: q.x + 2 * r, minY: q.y - 2 * r, maxY: q.y + 2 * r }, s => {
      const c = closestOnSegment(q, s.a, s.b); found.push({ c, d: dist(q, c) });
    });
    if (!found.length) return q;
    found.sort((a, b) => a.d - b.d);
    if (found[0].d >= r) return q;
    const n = found[0].c;
    const opposite = found.find(f => (f.c.x - q.x) * (n.x - q.x) + (f.c.y - q.y) * (n.y - q.y) < -1e-9);
    if (opposite) q = { x: (n.x + opposite.c.x) / 2, y: (n.y + opposite.c.y) / 2 };
    else if (found[0].d > 0) q = { x: n.x + (q.x - n.x) / found[0].d * r, y: n.y + (q.y - n.y) / found[0].d * r };
    else return q;
  }
  return q;
}

function simplify(points, ok, deadline) {
  const out = [points[0]];
  let i = 0;
  while (i < points.length - 1) {
    if (Date.now() > deadline) throw budget({ code: 'time_budget' });
    let step = 1;
    while (i + step * 2 < points.length && ok(points[i], points[i + step * 2])) step *= 2;
    let j = Math.min(points.length - 1, i + step);
    if (j === i + 1 && !ok(points[i], points[j])) return null;
    while (j + 1 < points.length && j + 1 <= i + step * 2 && ok(points[i], points[j + 1])) j++;
    out.push(points[j]);
    i = j;
  }
  return out;
}

// Independent final check: brute force over every boundary segment, no bucket index.
function verifyPolyline(index, r, points) {
  if (points.some(p => !index.inDomain(p))) return null;
  let min = Infinity;
  for (let k = 1; k < points.length; k++) for (const s of index.segments) min = Math.min(min, segmentSegment(points[k - 1], points[k], s).d);
  if (points.length === 1) for (const s of index.segments) min = Math.min(min, pointSegment(points[0], s));
  if (!(min >= r - TOL_MM)) return null;
  const elements = [];
  const pairs = points.length === 1 ? [[points[0], points[0], 0]] : points.slice(1).map((p, k) => [points[k], p, k]);
  for (const [p, q, k] of pairs) for (const s of index.segments) {
    const h = segmentSegment(p, q, s);
    if (h.d > min + TOL_MM) continue;
    const prev = elements.find(e => e.id === s.id && e.kind === s.kind);
    if (!prev || h.d < prev.d) {
      const entry = { id: s.id, kind: s.kind, d: h.d, pathPoint: pt(h.onPath), elementPoint: pt(h.onElement), segmentIndex: k };
      if (prev) Object.assign(prev, entry); else elements.push(entry);
    }
  }
  elements.sort((a, b) => a.d - b.d || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { minClearance: min, tiedElementCount: elements.length,
    elements: elements.slice(0, LIMITS.evidence).map(({ d, ...e }) => ({ ...e, distanceMm: floor3(d) })) };
}

// Regions in the order the trajectory first enters them (distance along the polyline).
function traversed(model, points) {
  const entry = poly => {
    let along = 0;
    for (let k = 1; k < points.length; k++) {
      const p = points[k - 1], q = points[k], len = dist(p, q), cuts = [0, 1];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const den = (q.x - p.x) * (b.y - a.y) - (q.y - p.y) * (b.x - a.x);
        if (Math.abs(den) < 1e-12) continue;
        const t = ((a.x - p.x) * (b.y - a.y) - (a.y - p.y) * (b.x - a.x)) / den;
        const u = ((a.x - p.x) * (q.y - p.y) - (a.y - p.y) * (q.x - p.x)) / den;
        if (t > 0 && t < 1 && u >= 0 && u <= 1) cuts.push(t);
      }
      cuts.sort((x, y) => x - y);
      for (let c = 1; c < cuts.length; c++) {
        const m = (cuts[c - 1] + cuts[c]) / 2;
        if (cuts[c] - cuts[c - 1] > 1e-9 && insidePolygon({ x: p.x + (q.x - p.x) * m, y: p.y + (q.y - p.y) * m }, poly)) return along + cuts[c - 1] * len;
      }
      along += len;
    }
    return points.length === 1 && insidePolygon(points[0], poly) ? 0 : null;
  };
  const order = list => list.map(x => ({ id: x.id, t: entry(x.poly) })).filter(x => x.t !== null)
    .sort((a, b) => a.t - b.t || (a.id < b.id ? -1 : 1)).map(x => x.id);
  return { regionIds: order(model.regions.filter(x => x.kind === 'room')), openingIds: order(model.regions.filter(x => x.kind !== 'room')) };
}

function describePoint(index, model, r, p, label) {
  const region = model.regions.filter(x => insidePolygon(p, x.poly)
    || x.poly.some((a, i) => pointSegment(p, { a, b: x.poly[(i + 1) % x.poly.length] }) <= ON_EDGE_MM));
  const onEdge = region.filter(x => x.poly.some((a, i) => pointSegment(p, { a, b: x.poly[(i + 1) % x.poly.length] }) <= ON_EDGE_MM));
  const obstacle = index.at(p, 'obstacle');
  let c = { d: Infinity, seg: null };
  for (const seg of index.segments) { const h = segmentSegment(p, p, seg); if (h.d < c.d) c = { ...h, seg }; }
  const nearest = c.seg ? { id: c.seg.id, kind: c.seg.kind, point: pt(c.onElement) } : null;
  const info = { point: pt(p), clearanceMm: floor3(c.d), nearestElement: nearest,
    region: region.length === 1 && !onEdge.length ? { kind: region[0].kind, id: region[0].id } : null };
  if (!region.length) return { info, reason: { code: 'point_outside_documented_domain', point: label } };
  if (onEdge.length) return { info, reason: { code: 'point_on_region_boundary', point: label, regionIds: region.map(x => x.id) } };
  if (region.length > 1) return { info, reason: { code: 'point_in_several_regions', point: label, regionIds: region.map(x => x.id) } };
  if (obstacle) return { info, reason: { code: 'point_inside_obstacle', point: label, elementId: obstacle.id, kind: obstacle.kind } };
  if (c.d < r - TOL_MM) return { info, reason: { code: 'point_clearance_below_required', point: label, clearanceMm: floor3(c.d),
    requiredMm: r, nearestElement: nearest } };
  return { info };
}

// Gaps narrower than the disc that separate the region reached from the start from other free space.
// A gap counts only if, along a probe line through it, one side reaches the start region and the other
// reaches free space outside it.
function blockedEvidence(solver, index, model, r, reached, deadline) {
  const clock = () => { if (Date.now() > deadline) throw budget({ code: 'time_budget' }); };
  const keyOf = seg => `${seg.src}|${seg.a.x},${seg.a.y}|${seg.b.x},${seg.b.y}`;
  const frontier = new Map();
  let n = 0;
  for (const key of [...reached].sort()) {
    const leaf = solver.leaves.get(key);
    if (!leaf) continue;
    for (const nb of solver.neighbours(leaf)) {
      if (nb.state !== 'blocked') continue;
      const c = centre(nb), reach = r + nb.h * Math.SQRT1_2;
      index.near({ minX: c.x - reach, maxX: c.x + reach, minY: c.y - reach, maxY: c.y + reach }, seg => {
        if (pointSegment(c, seg) < reach) frontier.set(keyOf(seg), seg);
      });
    }
    if ((++n & 255) === 0) clock();
  }
  // Nearest free cell on one side of a gap, walking through blocked floor cells of that half-plane only.
  const side = (p, dir) => {
    const first = solver.leafAt(p);
    if (!first) return 'none';
    const open = heap(), seen = new Set([first.key]);
    let tie = 0;
    open.push({ f: 0, leaf: first, tie: tie++ });
    while (open.size && seen.size < 4000) {
      const { f, leaf } = open.pop();
      for (const nb of solver.neighbours(leaf)) {
        if (seen.has(nb.key)) continue;
        seen.add(nb.key);
        const c = centre(nb);
        if ((c.x - p.x) * dir.x + (c.y - p.y) * dir.y <= 0) continue;
        if (nb.state !== 'blocked') return reached.has(nb.key) ? 'start' : 'other';
        if (index.inDomain(c)) open.push({ f: f + dist(centre(leaf), c), leaf: nb, tie: tie++ });
      }
    }
    return 'none';
  };
  const separates = (mid, dir) => {
    const one = side(mid, dir), two = side(mid, { x: -dir.x, y: -dir.y });
    return (one === 'start' && two === 'other') || (one === 'other' && two === 'start');
  };
  const perp = (u, v) => { const l = dist(u, v); return l > 1e-9 ? { x: -(v.y - u.y) / l, y: (v.x - u.x) / l } : null; };
  const polyOf = src => (src[0] === 'o' ? model.obstacles : model.regions)[+src.slice(1).split(':')[0]].poly;
  const adjacent = (a, b) => {
    const [pa, ia] = a.src.split(':'), [pb, ib] = b.src.split(':');
    if (pa !== pb) return false;
    const len = polyOf(a.src).length;
    return +ia === +ib || (+ia + 1) % len === +ib || (+ib + 1) % len === +ia;
  };
  const found = new Map();
  for (const [ka, a] of [...frontier.entries()].sort()) {
    clock();
    index.near({ minX: a.bb.minX - 2 * r, maxX: a.bb.maxX + 2 * r, minY: a.bb.minY - 2 * r, maxY: a.bb.maxY + 2 * r }, b => {
      const kb = keyOf(b);
      if (kb <= ka || !frontier.has(kb)) return;
      // Opposite faces of one obstacle enclose its interior, not a passage.
      if (adjacent(a, b) || (a.src[0] === 'o' && a.src.split(':')[0] === b.src.split(':')[0])) return;
      const h = segmentSegment(a.a, a.b, b);
      if (!(h.d < 2 * r - TOL_MM)) return;
      const mid = { x: (h.onPath.x + h.onElement.x) / 2, y: (h.onPath.y + h.onElement.y) / 2 };
      let dirs;
      if (h.d > 1e-9) {
        // Only a gap measured across documented floor (not along an edge) is a passage width.
        if (!index.inDomain(mid) || segmentClearance(index, mid, mid, 1).d <= 1e-6) return;
        dirs = [perp(h.onPath, h.onElement)];
      } else {
        if (a.kind !== 'object' && b.kind !== 'object') return;
        dirs = [perp(a.a, a.b), perp(b.a, b.b)];
      }
      if (!dirs.some(d => d && separates(mid, d))) return;
      const [x, y] = [a, b].sort((u, v) => (u.id + u.kind < v.id + v.kind ? -1 : u.id + u.kind > v.id + v.kind ? 1 : 0));
      const k = `${x.id}|${x.kind}|${y.id}|${y.kind}`;
      const prev = found.get(k);
      if (!prev || h.d < prev.gap) found.set(k, { x, y, gap: h.d, p: h.onPath, q: h.onElement });
    });
  }
  // Coincident elements (a jamb, the wall face and the room edge) measuring the same gap become one fact.
  const merged = new Map();
  for (const e of [...found.values()].sort((a, b) => a.gap - b.gap || (a.x.id + a.y.id < b.x.id + b.y.id ? -1 : 1))) {
    const ends = [pt(e.p), pt(e.q)].sort((u, v) => u.x - v.x || u.y - v.y);
    const k = e.gap > 1e-9 ? `${floor3(e.gap)}|${ends[0].x},${ends[0].y}|${ends[1].x},${ends[1].y}` : `0|${ends[0].x},${ends[0].y}`;
    if (!merged.has(k)) merged.set(k, { ...e, elements: new Map() });
    for (const x of [e.x, e.y]) merged.get(k).elements.set(`${x.id}|${x.kind}`, { id: x.id, kind: x.kind });
  }
  const gaps = [...merged.values()];
  const ids = new Set([...frontier.values()].map(seg => seg.id));
  const openingFacts = model.openings.filter(o => ids.has(o.id) || (o.passable && gaps.some(g => g.x.id === o.id || g.y.id === o.id)))
    .map(o => o.passable
      ? (o.widthMm < 2 * r - TOL_MM ? { code: 'opening_narrower_than_required', openingId: o.id, kind: o.kind, widthMm: o.widthMm, requiredMm: 2 * r } : null)
      : { code: 'opening_not_passable', openingId: o.id, kind: o.kind, reason: o.reason }).filter(Boolean);
  const bounding = [...new Map([...frontier.values()].map(seg => [`${seg.id}|${seg.kind}`, { id: seg.id, kind: seg.kind }])).values()]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : a.kind < b.kind ? -1 : 1));
  const list = e => [...e.elements.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : a.kind < b.kind ? -1 : 1));
  const fact = e => e.gap > 1e-9
    ? { code: 'gap_narrower_than_required', elements: list(e), gapMm: floor3(e.gap), requiredMm: 2 * r, points: [pt(e.p), pt(e.q)] }
    : { code: 'contact_closes_passage', elements: list(e), point: pt(e.p) };
  return {
    reasons: [...openingFacts, ...gaps.filter(e => e.gap > 1e-9).slice(0, 5).map(fact), ...gaps.filter(e => e.gap <= 1e-9).slice(0, 5).map(fact),
      ...(!gaps.length && !openingFacts.length ? [{ code: 'no_documented_passage_from_start_region' }] : [])],
    startRegion: { boundingElements: bounding.slice(0, LIMITS.evidence), boundingElementCount: bounding.length, separatingGapCount: gaps.length },
  };
}

const RULE = Object.freeze({
  agent: 'disco 2D cuyo diámetro es widthMm; el centro recorre la trayectoria',
  contact: 'admitido: el disco puede tocar un obstáculo o el borde del dominio, no invadirlo',
  clearanceToleranceMm: TOL_MM,
  domain: 'unión de polígonos de estancia, subtramos de puertas/correderas/huecos con antepecho 0 compartidos por dos estancias y bandas de muros demolidos compartidas por dos estancias',
  obstacles: 'tramos sólidos de muros activos, ventanas, huecos no transitables y huellas giradas de muebles (salvo alfombras y splits de pared)',
  positive: 'polilínea verificada con distancias exactas segmento-segmento',
  negative: 'separación demostrada por celdas cuadradas bloqueadas con cota de Lipschitz y convexidad de la distancia',
});
const LIMITS_TEXT = [
  'Resultado geométrico en el modelo 2D del JSON: no acredita accesibilidad, evacuación, normativa, altura libre ni transitabilidad real.',
  'La anchura de un hueco es la nominal del JSON: no descuenta hoja, marco, tope ni maniobra de puerta.',
  'El disco no representa a una persona ni a un mueble rectangular que gira.',
];

// `overrides` may only lower the internal budgets (used by tests to reach them on small fixtures).
function findRoute(project, snapshot, args = {}, overrides = {}) {
  const limits = { ...LIMITS };
  for (const k of ['initialCells', 'leaves', 'iterations', 'ms']) if (Number.isFinite(overrides[k]) && overrides[k] > 0) limits[k] = Math.min(LIMITS[k], overrides[k]);
  const deadline = Date.now() + limits.ms;
  const { start, end, widthMm } = args;
  const validPoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Math.abs(p.x) <= LIMITS.coordinateMm && Math.abs(p.y) <= LIMITS.coordinateMm;
  if (!validPoint(start) || !validPoint(end)) throw new Error('Indica start y end como {x,y} en mm del plano, dentro de ±10 000 000.');
  if (!Number.isFinite(widthMm) || widthMm <= 0 || widthMm > LIMITS.maxWidthMm) throw new Error('Indica widthMm explícito, positivo y como máximo 100 000 mm.');
  const s = { x: start.x, y: start.y }, g = { x: end.x, y: end.y }, r = widthMm / 2;
  const base = {
    snapshot, status: null, rule: RULE, units: 'mm', plane: '2d',
    coordinateSystem: { ...project.coordinateSystem, frame: 'coordenadas de planta del JSON (mm)' },
    request: { start: pt(s), end: pt(g), widthMm }, scaleConfidence: project.scale.confidence,
    endpoints: null, trajectory: null, limiting: null, traversed: null, reasons: [], computation: null,
    ignoredObjects: [], limits: [...LIMITS_TEXT, ...(project.scale.confidence === 'real' ? []
      : [`Escala ${project.scale.confidence}: los milímetros del modelo no están confirmados físicamente.`])],
  };
  const finish = (status, extra = {}) => ({ ...base, ...extra, status });
  let model, index;
  try {
    model = buildModel(project);
    base.ignoredObjects = model.ignoredObjects.slice(0, LIMITS.evidence);
    index = buildIndex(model, r);
  } catch (error) {
    if (error instanceof Unevaluable) return finish(error.status, { reasons: [error.reason] });
    throw error;
  }
  const a = describePoint(index, model, r, s, 'start'), b = describePoint(index, model, r, g, 'end');
  base.endpoints = { start: a.info, end: b.info };
  if (a.reason || b.reason) return finish(STATUS.NOT_EVALUABLE, { reasons: [a.reason, b.reason].filter(Boolean) });

  const proven = (points, method, computation) => {
    if (points.length > LIMITS.pathPoints) return finish(STATUS.BUDGET, { reasons: [{ code: 'output_budget', points: points.length, limit: LIMITS.pathPoints }], computation });
    const check = verifyPolyline(index, r, points);
    if (!check) return finish(STATUS.INSUFFICIENT, { reasons: [{ code: 'internal_verification_failed' }], computation });
    const lengthMm = points.slice(1).reduce((sum, p, k) => sum + dist(points[k], p), 0);
    return finish(STATUS.PROVEN, {
      trajectory: { points, segments: points.length - 1, lengthMm: round3(lengthMm), method },
      limiting: { widthMm: 2 * check.minClearance, basis: 'exacta_sobre_la_trayectoria_devuelta',
        note: 'Mayor diámetro que cabe a lo largo de esta trayectoria; otra trayectoria podría admitir más.',
        elements: check.elements, tiedElementCount: check.tiedElementCount },
      traversed: traversed(model, points), computation,
    });
  };
  if (dist(s, g) <= TOL_MM || segmentClearance(index, s, g, r + 1).d >= r - TOL_MM)
    return proven(dist(s, g) <= TOL_MM ? [s] : [s, g], 'segmento_recto', { method: 'straight_segment', leaves: 0, iterations: 0 });

  let solver, iterations = 0;
  const computation = () => ({ method: 'quadtree_certificado', leaves: solver ? solver.created : 0, iterations,
    initialCellMm: solver ? round3(solver.h0) : null, finestCellMm: MIN_CELL_MM, segments: index.segments.length });
  try {
    solver = createSolver(index, r, deadline, limits);
    for (;;) {
      if (++iterations > limits.iterations) throw budget({ code: 'iteration_budget', limit: limits.iterations });
      if ([s, g].some(p => solver.leafAt(p)?.state !== 'uncertain' && solver.leafAt(p)?.state !== 'free'))
        return finish(STATUS.INSUFFICIENT, { reasons: [{ code: 'numerical_inconsistency_at_endpoint' }], computation: computation() });
      const found = search(solver, s, g, deadline);
      if (!found.found) {
        const evidence = blockedEvidence(solver, index, model, r, found.reached, deadline);
        return finish(STATUS.BLOCKED, { reasons: evidence.reasons, startRegion: evidence.startRegion, computation: computation() });
      }
      const chainFree = found.chain.every((leaf, n) => leaf.state === 'free'
        || (n === 0 && found.startVerified) || (n === found.chain.length - 1 && found.goalVerified));
      if (chainFree) {
        const raw = pathFromChain(found, s, g);
        const simple = simplify(raw, solver.segOk, deadline);
        if (simple) return proven(simple, 'quadtree_certificado', computation());
      }
      const toRefine = found.chain.filter(solver.refinable);
      if (toRefine.length) { toRefine.forEach(solver.refine); continue; }
      const repaired = pathFromChain(found, s, g).map((p, k, all) => (k === 0 || k === all.length - 1) ? p : relax(index, r, p));
      const simple = simplify(repaired, solver.segOk, deadline);
      if (simple) return proven(simple, 'quadtree_reparado', computation());
      return finish(STATUS.INSUFFICIENT, { reasons: [{ code: 'margin_below_resolution', finestCellMm: MIN_CELL_MM,
        undecidedBandMm: round3(MIN_CELL_MM * Math.SQRT2),
        note: 'Existe una conexión por celdas no resueltas: el margen frente al ancho pedido es menor que la resolución.' }], computation: computation() });
    }
  } catch (error) {
    if (error instanceof Unevaluable) return finish(error.status, { reasons: [error.reason], computation: computation() });
    throw error;
  }
}

module.exports = { findRoute, segmentSegment, STATUS, LIMITS, TOL_MM, MIN_CELL_MM };
