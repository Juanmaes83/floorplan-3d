'use strict';
/* Corte 5 — search audit (experimental, NOT runtime). Walks the SAME candidate sequence as FloorPlanPlacement.find
   (FloorPlanPlacement.candidates: rings of stepMm around the current position, same bounding-box prefilter) and asks
   the existing authorities about each position: FloorPlanPlacement.problemsIn (what find accepts) and layout-review
   (what propose_layout additionally requires; plus leafContact for the door goal). It reports the first position
   find() returns, why propose_layout rejects it, and the first position that BOTH authorities accept, if any, with
   how many positions were examined and the cost. No new collision engine: every geometric decision is an authority's. */
const C = require('../../../js/project-core.js');
const T = require('../../../js/tracing-core.js');
const Review = require('../../../js/layout-review.js');
const Placement = require('../../../js/furniture-placement.js');

function audit(project, { objectId, goal = 'resolve-placement-conflict', openingId, stepMm = Placement.STEP_MM, maxCandidates = Placement.MAX_CANDIDATES, limit = 20000 } = {}) {
  const started = process.hrtime.bigint();
  const object = project.objects.find(o => o.id === objectId);
  const sc = Placement.scene(project, { ignoreIds: [objectId] });
  const room = Placement.roomsAt(sc, object.position)[0];
  const xs = room.poly.map(p => p.x), ys = room.poly.map(p => p.y);
  const maxRadius = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const fp0 = T.footprint({ ...object, position: { x: 0, y: 0 } });
  const hx = Math.max(...fp0.map(p => Math.abs(p.x))), hy = Math.max(...fp0.map(p => Math.abs(p.y)));
  const tol = Placement.TOLERANCE_MM;
  const fits = c => c.x - hx >= Math.min(...xs) - tol && c.x + hx <= Math.max(...xs) + tol && c.y - hy >= Math.min(...ys) - tol && c.y + hy <= Math.max(...ys) + tol;
  const door = openingId ? C.geometry(project).doors.find(d => d.id === openingId) : null;
  let tried = 0, firstPlacement = null, firstBoth = null, rejections = 0;
  const rejectedReasons = {};
  for (const c of Placement.candidates({ x: Math.round(object.position.x), y: Math.round(object.position.y) }, stepMm, maxRadius)) {
    if (!fits(c)) continue;
    if (tried >= limit) break;
    tried++;
    const pose = { ...object, position: { x: Math.round(c.x), y: Math.round(c.y) } };
    if (Placement.problemsIn(sc, pose, room.id, tol, true).length) continue;
    const copy = C.clone(project);
    copy.objects = copy.objects.map(o => (o.id === objectId ? { ...o, position: { ...pose.position } } : o));
    const findings = Review.review(copy).findings.filter(f => f.objects.includes(objectId));
    const leaf = door ? Review.leafContact(door, T.footprint(pose)) : null;
    const reviewOk = !findings.length && (leaf === null || leaf >= 90 - 1e-6);
    const entry = { index: tried, position: pose.position, distanceMm: Math.round(Math.hypot(pose.position.x - object.position.x, pose.position.y - object.position.y)), reviewFindings: findings.map(f => `${f.code}${f.measurementMm !== undefined ? ' ' + f.measurementMm + ' mm' : ''}${f.measurementDeg !== undefined ? ' ' + f.measurementDeg + '°' : ''}`) };
    if (!firstPlacement) firstPlacement = entry;
    if (reviewOk) { firstBoth = entry; break; }
    rejections++;
    for (const f of findings) rejectedReasons[f.code] = (rejectedReasons[f.code] || 0) + 1;
  }
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  return {
    objectId, goal, stepMm, maxCandidates,
    firstFoundByFind: firstPlacement,
    firstAcceptedByBoth: firstBoth,
    positionsExamined: tried,
    placementValidButReviewRejected: rejections,
    rejectedReasons,
    withinFindBudget: firstBoth ? firstBoth.index <= maxCandidates : null,
    elapsedMs: Math.round(ms * 10) / 10,
  };
}
module.exports = { audit };
