'use strict';

const C = require('../../../js/project-core.js');
const T = require('../../../js/tracing-core.js');
const Spatial = require('./spatial.cjs');

const EPS = 1e-7; // coordinate comparison in stored millimetres, not a design clearance
const round = value => Math.round(value * 1000) / 1000;
const point = p => ({ x: round(p.x), y: round(p.y) });
const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const edges = poly => poly.map((p, i) => [p, poly[(i + 1) % poly.length]]);
const onSegment = (p, a, b) => Math.abs(cross(a, b, p)) < EPS
  && p.x >= Math.min(a.x, b.x) - EPS && p.x <= Math.max(a.x, b.x) + EPS
  && p.y >= Math.min(a.y, b.y) - EPS && p.y <= Math.max(a.y, b.y) + EPS;
const closestOn = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, length2 = dx * dx + dy * dy;
  if (length2 < EPS) throw new Error('Geometría degenerada: tramo sin longitud.');
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length2));
  return { x: a.x + t * dx, y: a.y + t * dy };
};
function intersection(a, b, c, d) {
  const r = { x: b.x - a.x, y: b.y - a.y }, s = { x: d.x - c.x, y: d.y - c.y };
  const determinant = r.x * s.y - r.y * s.x;
  if (Math.abs(determinant) < EPS) {
    for (const p of [a, b, c, d]) if (onSegment(p, a, b) && onSegment(p, c, d)) return p;
    return null;
  }
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / determinant;
  const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / determinant;
  return t >= -EPS && t <= 1 + EPS && u >= -EPS && u <= 1 + EPS
    ? { x: a.x + t * r.x, y: a.y + t * r.y } : null;
}
function inside(p, poly) {
  let result = false;
  for (const [a, b] of edges(poly)) {
    if (onSegment(p, a, b)) return true;
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) result = !result;
  }
  return result;
}
function regionDistance(A, B) {
  let best = { d: Infinity };
  for (const [a, b] of edges(A)) for (const [c, d] of edges(B)) {
    const meeting = intersection(a, b, c, d);
    if (meeting) return { distanceMm: 0, pointA: point(meeting), pointB: point(meeting), geometryState: 'contact_or_overlap' };
    for (const [p, u, v, flip] of [[a, c, d, false], [b, c, d, false], [c, a, b, true], [d, a, b, true]]) {
      const q = closestOn(p, u, v), gap = distance(p, q);
      if (gap < best.d) best = flip ? { d: gap, a: q, b: p } : { d: gap, a: p, b: q };
    }
  }
  if (inside(A[0], B)) return { distanceMm: 0, pointA: point(A[0]), pointB: point(A[0]), geometryState: 'overlap' };
  if (inside(B[0], A)) return { distanceMm: 0, pointA: point(B[0]), pointB: point(B[0]), geometryState: 'overlap' };
  return { distanceMm: round(best.d), pointA: point(best.a), pointB: point(best.b), geometryState: 'separated' };
}

function shape(project, id) {
  for (const kind of ['objects', 'walls', 'openings', 'rooms']) {
    const item = project[kind].find(entry => entry.id === id);
    if (!item) continue;
    if (kind === 'objects') return { kind, item, poly: T.footprint(item), reference: item.position, basis: 'rotated_object_footprint' };
    if (kind === 'rooms') return { kind, item, poly: item.polygon, basis: 'room_polygon' };
    const wall = kind === 'walls' ? item : project.walls.find(entry => entry.id === item.wallId);
    if (!wall) throw new Error('Referencia de muro rota en el JSON seleccionado.');
    const offset = kind === 'walls' ? 0 : item.offsetMm;
    const length = kind === 'walls' ? distance(wall.start, wall.end) : item.widthMm;
    const poly = C.wallRect(wall, offset, length).poly.map(([x, y]) => ({ x, y }));
    const t = (offset + length / 2) / distance(wall.start, wall.end);
    const reference = { x: wall.start.x + (wall.end.x - wall.start.x) * t,
      y: wall.start.y + (wall.end.y - wall.start.y) * t };
    return { kind, item, poly, reference, basis: kind === 'walls' ? 'wall_strip' : 'opening_subspan_strip' };
  }
  throw new Error('No existe un elemento medible con ese ID.');
}

function measure(project, snapshot, args) {
  const { idA, idB, mode } = args;
  if (typeof idA !== 'string' || typeof idB !== 'string' || !idA || !idB || idA === idB) throw new Error('Indica dos IDs distintos del proyecto.');
  if (!['reference_points', 'regions'].includes(mode)) throw new Error('mode debe ser reference_points o regions.');
  const A = shape(project, idA), B = shape(project, idB);
  if (mode === 'reference_points' && (!A.reference || !B.reference)) throw new Error('Las estancias no tienen un punto de referencia único; usa regions.');
  const spatial = Spatial.createSpatialIndex(project);
  const relations = [A, B].map(shape => spatial.relation(shape.kind, shape.item));
  const result = mode === 'reference_points'
    ? { distanceMm: round(distance(A.reference, B.reference)), pointA: point(A.reference), pointB: point(B.reference), geometryState: 'reference_points' }
    : regionDistance(A.poly, B.poly);
  return { snapshot, units: 'mm', plane: '2d', mode,
    method: mode === 'reference_points' ? 'Euclidean distance between stored object centres or wall/opening axis midpoints'
      : 'Minimum Euclidean distance between 2D regions; zero for contact or overlap',
    scaleConfidence: project.scale.confidence,
    status: relations.some(r => ['ambiguous', 'unattributed'].includes(r.status)) ? 'spatial_relation_uncertain' : 'measured',
    elements: [{ id: idA, kind: A.kind, geometry: A.basis, relationStatus: relations[0].status },
      { id: idB, kind: B.kind, geometry: B.basis, relationStatus: relations[1].status }],
    ...result,
    note: 'Distancia geométrica en planta; no representa holgura transitable, altura, 3D ni cumplimiento normativo.',
  };
}

// Shared only with the bounded obstacle analysis. Keep geometric definitions identical.
module.exports = { measure, shape, regionDistance, inside, intersection, distance, point };
