'use strict';

// Evidence about one straight 2D separation. This deliberately does not solve a
// route or certify a passage width.
const C = require('../../../js/project-core.js');
const T = require('../../../js/tracing-core.js');
const Spatial = require('./spatial.cjs');
const M = require('./measure.cjs');

const EPS = 1e-7;
const MAX_OBSTACLES = 100;
const param = (p, a, b) => Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)
  ? (p.x - a.x) / (b.x - a.x) : (p.y - a.y) / (b.y - a.y);
const at = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

function segmentInsideLength(a, b, polygon) {
  if (M.distance(a, b) < EPS) return 0;
  const cuts = [0, 1];
  for (let i = 0; i < polygon.length; i++) {
    const hit = M.intersection(a, b, polygon[i], polygon[(i + 1) % polygon.length]);
    if (hit) cuts.push(Math.max(0, Math.min(1, param(hit, a, b))));
  }
  cuts.sort((x, y) => x - y);
  let length = 0;
  for (let i = 1; i < cuts.length; i++) {
    if (cuts[i] - cuts[i - 1] > EPS && M.inside(at(a, b, (cuts[i] + cuts[i - 1]) / 2), polygon))
      length += (cuts[i] - cuts[i - 1]) * M.distance(a, b);
  }
  return length;
}

function strips(project) {
  const result = [];
  for (const wall of project.walls) {
    if (wall.status === 'demolished') continue;
    const length = M.distance(wall.start, wall.end);
    const openings = project.openings.filter(item => item.wallId === wall.id)
      .sort((a, b) => a.offsetMm - b.offsetMm);
    let from = 0;
    for (const opening of openings) {
      if (opening.offsetMm > from + EPS) result.push({ id: wall.id, kind: 'solid_wall',
        poly: C.wallRect(wall, from, opening.offsetMm - from).poly.map(([x, y]) => ({ x, y })) });
      result.push({ id: opening.id, kind: opening.kind, wallId: wall.id,
        poly: C.wallRect(wall, opening.offsetMm, opening.widthMm).poly.map(([x, y]) => ({ x, y })) });
      from = Math.max(from, opening.offsetMm + opening.widthMm);
    }
    if (length > from + EPS) result.push({ id: wall.id, kind: 'solid_wall',
      poly: C.wallRect(wall, from, length - from).poly.map(([x, y]) => ({ x, y })) });
  }
  return result;
}

function doorChain(project, spatial, start, finish) {
  if (!start || !finish) return { status: 'uncertain_room_assignment' };
  if (start === finish) return { status: 'same_derived_room', roomIds: [start], openingIds: [] };
  const graph = new Map(project.rooms.map(room => [room.id, []]));
  for (const opening of project.openings) {
    const wall = project.walls.find(item => item.id === opening.wallId);
    if (!wall || wall.status === 'demolished' || !['door', 'sliding-door'].includes(opening.kind)
      || opening.sillHeightMm !== 0) continue;
    const rel = spatial.relation('openings', opening);
    if (rel.status !== 'shared' || rel.roomIds.length !== 2) continue;
    const [a, b] = rel.roomIds;
    graph.get(a).push({ to: b, openingId: opening.id });
    graph.get(b).push({ to: a, openingId: opening.id });
  }
  const visited = new Set([start]), queue = [{ room: start, rooms: [start], doors: [] }];
  for (const current of queue) {
    for (const edge of graph.get(current.room) || []) {
      if (visited.has(edge.to)) continue;
      const rooms = [...current.rooms, edge.to], doors = [...current.doors, edge.openingId];
      if (edge.to === finish) return { status: 'documented_door_chain', roomIds: rooms, openingIds: doors };
      visited.add(edge.to); queue.push({ room: edge.to, rooms, doors });
    }
  }
  return { status: 'no_documented_door_chain', roomIds: [start, finish], openingIds: [] };
}

function analyze(project, snapshot, args) {
  const { idA, idB, clearanceMm } = args;
  if (typeof idA !== 'string' || typeof idB !== 'string' || !idA || !idB || idA === idB)
    throw new Error('Indica dos IDs de muebles distintos.');
  if (!Number.isFinite(clearanceMm) || clearanceMm <= 0)
    throw new Error('Indica un umbral explícito positivo en milímetros.');
  if (project.objects.length > 100 || project.walls.length > 500 || project.openings.length > 500)
    throw new Error('Análisis acotado a 100 muebles, 500 muros y 500 huecos.');
  const A = M.shape(project, idA), B = M.shape(project, idB);
  if (A.kind !== 'objects' || B.kind !== 'objects') throw new Error('Este análisis admite dos muebles; usa measure_elements para otros tipos.');
  const spatial = Spatial.createSpatialIndex(project);
  const relations = [A, B].map(x => spatial.relation('objects', x.item));
  const roomIds = relations.map(r => r.status === 'unique' && r.roomIds.length === 1 ? r.roomIds[0] : null);
  const connectivity = doorChain(project, spatial, ...roomIds);
  const gap = M.regionDistance(A.poly, B.poly);
  const obstacles = [];
  const add = (id, kind, length) => {
    if (length > EPS) obstacles.push({ id, kind, intersectionLengthMm: Math.round(length * 1000) / 1000 });
  };
  if (gap.distanceMm > EPS) {
    for (const strip of strips(project)) add(strip.id, strip.kind, segmentInsideLength(gap.pointA, gap.pointB, strip.poly));
    for (const item of project.objects) {
      if (item.id !== idA && item.id !== idB) add(item.id, 'other_object',
        segmentInsideLength(gap.pointA, gap.pointB, T.footprint(item)));
    }
  }
  const room = roomIds[0] && roomIds[0] === roomIds[1] ? project.rooms.find(r => r.id === roomIds[0]) : null;
  const leavesRoom = room && gap.distanceMm > EPS
    && segmentInsideLength(gap.pointA, gap.pointB, room.polygon) < M.distance(gap.pointA, gap.pointB) - 0.001;
  const blocking = obstacles.some(o => o.kind === 'solid_wall' || o.kind === 'window' || o.kind === 'other_object');
  const uncertain = relations.some(r => r.status !== 'unique');
  const straightSegmentStatus = gap.distanceMm <= EPS ? 'contact_or_overlap_not_a_passage'
    : uncertain ? 'uncertain_room_assignment'
      : leavesRoom ? 'leaves_derived_room'
        : blocking ? 'blocked_by_documented_obstacle'
          : room ? 'no_documented_obstacle_on_minimum_segment' : 'cross_room_route_not_evaluated';
  return {
    snapshot, units: 'mm', plane: '2d', scaleConfidence: project.scale.confidence,
    idA, idB, thresholdMm: clearanceMm,
    geometricGap: { ...gap, comparison: gap.distanceMm < clearanceMm ? 'below_user_threshold' : 'at_or_above_user_threshold' },
    minimumSegment: { pointA: gap.pointA, pointB: gap.pointB, status: straightSegmentStatus,
      obstacles: obstacles.slice(0, MAX_OBSTACLES), obstacleCount: obstacles.length, truncated: obstacles.length > MAX_OBSTACLES },
    connectivity, relationStatus: relations.map((r, i) => ({ id: i ? idB : idA, status: r.status, roomIds: r.roomIds })),
    note: 'La distancia mínima recta no prueba paso libre. La cadena de puertas sólo documenta conexiones de estancias; no calcula una ruta ni su anchura, altura o cumplimiento normativo. Contacto/solape puede ser intencional o empotrado.',
  };
}

module.exports = { analyze, segmentInsideLength };
