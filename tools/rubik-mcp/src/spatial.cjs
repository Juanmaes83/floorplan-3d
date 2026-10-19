'use strict';

// Read-only spatial evidence for FloorPlanProjectV1. All coordinates are plan millimetres.
const C = require('../../../js/project-core.js');
const T = require('../../../js/tracing-core.js');

const EPS = 1e-7;
const MIN_AREA_MM2 = 1;
const MIN_CONTACT_MM = 1;

const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
const polygonArea = poly => poly.reduce((sum, p, i) => {
  const q = poly[(i + 1) % poly.length];
  return sum + p.x * q.y - q.x * p.y;
}, 0) / 2;
const bounds = poly => ({
  minX: Math.min(...poly.map(p => p.x)), maxX: Math.max(...poly.map(p => p.x)),
  minY: Math.min(...poly.map(p => p.y)), maxY: Math.max(...poly.map(p => p.y)),
});
const boundsMeet = (a, b) => a.minX <= b.maxX + EPS && b.minX <= a.maxX + EPS
  && a.minY <= b.maxY + EPS && b.minY <= a.maxY + EPS;

function pointOnSegment(p, a, b) {
  return Math.abs(cross(a, b, p)) <= EPS
    && p.x >= Math.min(a.x, b.x) - EPS && p.x <= Math.max(a.x, b.x) + EPS
    && p.y >= Math.min(a.y, b.y) - EPS && p.y <= Math.max(a.y, b.y) + EPS;
}

function segmentsMeet(a, b, c, d) {
  const x = cross(a, b, c), y = cross(a, b, d);
  const z = cross(c, d, a), w = cross(c, d, b);
  return (x * y < -EPS && z * w < -EPS)
    || pointOnSegment(c, a, b) || pointOnSegment(d, a, b)
    || pointOnSegment(a, c, d) || pointOnSegment(b, c, d);
}

function boundariesMeet(a, b) {
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
    if (segmentsMeet(a[i], a[(i + 1) % a.length], b[j], b[(j + 1) % b.length])) return true;
  }
  return false;
}

function triangleContains(p, a, b, c, direction) {
  return cross(a, b, p) * direction >= -EPS
    && cross(b, c, p) * direction >= -EPS
    && cross(c, a, p) * direction >= -EPS;
}

// Ear clipping is limited to the simple polygons already accepted by project-core.
function triangulate(poly, roomId) {
  const direction = Math.sign(polygonArea(poly));
  const vertices = poly.map((_, i) => i);
  const triangles = [];
  while (vertices.length > 3) {
    let ear = -1;
    for (let i = 0; i < vertices.length; i++) {
      const prev = vertices[(i + vertices.length - 1) % vertices.length];
      const curr = vertices[i], next = vertices[(i + 1) % vertices.length];
      const a = poly[prev], b = poly[curr], c = poly[next];
      if (cross(a, b, c) * direction <= EPS) continue;
      if (vertices.some(v => v !== prev && v !== curr && v !== next
        && triangleContains(poly[v], a, b, c, direction))) continue;
      ear = i;
      triangles.push([a, b, c]);
      break;
    }
    if (ear < 0) throw new Error(`No se puede triangular la estancia ${roomId}; no se infiere una relación espacial.`);
    vertices.splice(ear, 1);
  }
  triangles.push(vertices.map(i => poly[i]));
  return triangles;
}

// Convex subject clipped by a convex triangle. Works for either winding.
function clippedArea(subject, triangle) {
  const direction = Math.sign(polygonArea(triangle));
  let output = subject;
  for (let i = 0; i < triangle.length && output.length; i++) {
    const a = triangle[i], b = triangle[(i + 1) % triangle.length];
    const input = output;
    output = [];
    for (let j = 0; j < input.length; j++) {
      const p = input[j], q = input[(j + 1) % input.length];
      const pSide = cross(a, b, p) * direction;
      const qSide = cross(a, b, q) * direction;
      const pInside = pSide >= -EPS, qInside = qSide >= -EPS;
      if (pInside) output.push(p);
      if (pInside !== qInside) {
        const t = pSide / (pSide - qSide);
        output.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
      }
    }
  }
  return output.length < 3 ? 0 : Math.abs(polygonArea(output));
}

function overlapArea(convex, convexBounds, room) {
  if (!boundsMeet(convexBounds, room.bounds)) return 0;
  return room.triangles.reduce((sum, triangle) => sum + clippedArea(convex, triangle), 0);
}

// Length of a segment within a convex wall/opening strip, including a coincident face.
function segmentInStrip(a, b, strip) {
  const direction = Math.sign(polygonArea(strip));
  let from = 0, to = 1;
  for (let i = 0; i < strip.length; i++) {
    const p = strip[i], q = strip[(i + 1) % strip.length];
    const start = cross(p, q, a) * direction;
    const end = cross(p, q, b) * direction;
    if (start < -EPS && end < -EPS) return 0;
    if (Math.abs(start - end) <= EPS) continue;
    const t = start / (start - end);
    if (start < -EPS) from = Math.max(from, t);
    else if (end < -EPS) to = Math.min(to, t);
    if (from >= to) return 0;
  }
  return Math.max(0, to - from) * Math.hypot(b.x - a.x, b.y - a.y);
}

function boundaryContactMm(room, strip, wall) {
  const wallLength = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  const ux = (wall.end.x - wall.start.x) / wallLength;
  const uy = (wall.end.y - wall.start.y) / wallLength;
  let contact = 0;
  for (let i = 0; i < room.poly.length; i++) {
    const a = room.poly[i], b = room.poly[(i + 1) % room.poly.length];
    const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
    if (Math.abs((dx * ux + dy * uy) / length) < 0.95) continue;
    contact += segmentInStrip(a, b, strip);
  }
  return contact;
}

function createSpatialIndex(project) {
  const rooms = project.rooms.map(room => ({
    id: room.id, poly: room.polygon, bounds: bounds(room.polygon),
    triangles: triangulate(room.polygon, room.id),
  }));
  const walls = new Map(project.walls.map(wall => [wall.id, wall]));

  function objectRelation(item) {
    const footprint = T.footprint(item);
    const footprintBounds = bounds(footprint);
    const footprintArea = item.size.widthMm * item.size.depthMm;
    const tolerance = Math.max(MIN_AREA_MM2, footprintArea * 1e-8);
    const matches = [];
    const touches = [];
    for (const room of rooms) {
      if (!boundsMeet(footprintBounds, room.bounds)) continue;
      const area = overlapArea(footprint, footprintBounds, room);
      if (area > tolerance) matches.push({ roomId: room.id, overlapAreaMm2: Math.round(area) });
      else if (boundariesMeet(footprint, room.poly)) touches.push(room.id);
    }
    const candidates = matches.length ? matches.map(m => m.roomId) : touches;
    let status = 'unattributed', reason;
    if (matches.length > 1) { status = 'ambiguous'; reason = 'footprint_overlaps_multiple_rooms'; }
    else if (matches.length === 1) {
      status = matches[0].overlapAreaMm2 >= footprintArea - tolerance ? 'unique' : 'ambiguous';
      if (status === 'ambiguous') reason = 'footprint_partly_outside_rooms';
    } else if (touches.length) { status = 'ambiguous'; reason = 'boundary_contact_only'; }
    else reason = 'outside_all_rooms';
    if (item.roomId && !candidates.includes(item.roomId)) {
      if (status !== 'unattributed') status = 'ambiguous';
      reason = 'stored_room_id_conflicts_with_geometry';
    }
    return {
      roomIds: candidates, status,
      method: matches.length ? 'rotated_footprint_overlap' : 'rotated_footprint_boundary_contact',
      ...(item.roomId ? { storedRoomId: item.roomId } : {}),
      ...(matches.length ? { evidence: matches } : {}),
      ...(reason ? { reason } : {}),
    };
  }

  function stripRelation(wall, offset, length, method) {
    const strip = C.wallRect(wall, offset, length).poly.map(([x, y]) => ({ x, y }));
    const stripBounds = bounds(strip);
    const evidence = [];
    for (const room of rooms) {
      if (!boundsMeet(stripBounds, room.bounds)) continue;
      const area = overlapArea(strip, stripBounds, room);
      const contact = boundaryContactMm(room, strip, wall);
      if (area <= MIN_AREA_MM2 && contact <= MIN_CONTACT_MM) continue;
      evidence.push({ roomId: room.id, overlapAreaMm2: Math.round(area), contactLengthMm: Math.round(contact * 10) / 10 });
    }
    const roomIds = evidence.map(entry => entry.roomId);
    return {
      roomIds, status: roomIds.length > 1 ? 'shared' : roomIds.length ? 'unique' : 'unattributed',
      method, ...(evidence.length ? { evidence } : { reason: 'no_room_strip_contact' }),
    };
  }

  function relation(kind, item) {
    if (kind === 'rooms') return { roomIds: [item.id], status: 'unique', method: 'own_id' };
    if (kind === 'objects') return objectRelation(item);
    if (kind === 'walls') return stripRelation(item, 0,
      Math.hypot(item.end.x - item.start.x, item.end.y - item.start.y), 'wall_strip_polygon_contact');
    const wall = walls.get(item.wallId);
    // C.validate has already rejected broken wallId references.
    return stripRelation(wall, item.offsetMm, item.widthMm, 'opening_span_polygon_contact');
  }

  return { relation };
}

// Shared with the route query (room overlap check); same tolerances as the relations above.
module.exports = { createSpatialIndex, triangulate, clippedArea };
