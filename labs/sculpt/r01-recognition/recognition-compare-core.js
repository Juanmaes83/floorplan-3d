/* SCULPT-R01 · comparator: R01 donor (through RecognitionEvidenceV1) vs RUBIK's own detector
 * (FloorPlanIntake.rasterWallBands, run with the same parameters detectPlan() derives from a calibrated scale).
 *
 * It MEASURES; it does not judge. No pass/fail threshold, no "improvement %" claim: the numbers are lengths in
 * pixels and counts, with the matching tolerance reported next to them. Ground truth exists only for synthetic plans.
 */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && typeof require === 'function';
  const E = node ? require('./recognition-evidence-core.js') : root.RubikRecognitionEvidence;
  const X = node ? require('../../../js/plan-intake.js') : root.FloorPlanIntake;

  // Axis-aligned centre-line segment: {axis:'h'|'v', pos, from, to, thickness}.
  const fromRect = (r, axis) => axis === 'h'
    ? { axis, pos: (r[1] + r[3]) / 2, from: r[0], to: r[2], thickness: r[3] - r[1] }
    : { axis, pos: (r[0] + r[2]) / 2, from: r[1], to: r[3], thickness: r[2] - r[0] };
  function fromBand(b) {
    const h = Math.abs(b.a.y - b.b.y) < 1e-9;
    return h ? { axis: 'h', pos: b.a.y, from: Math.min(b.a.x, b.b.x), to: Math.max(b.a.x, b.b.x), thickness: b.thickness }
      : { axis: 'v', pos: b.a.x, from: Math.min(b.a.y, b.b.y), to: Math.max(b.a.y, b.b.y), thickness: b.thickness };
  }

  // detectPlan() parameters for a calibrated image (js/tracing-ui.js, master@75615fd): 50–600 mm thick, ≥300 mm long.
  const rubikParams = mmPx => ({ minThick: Math.max(2, Math.round(50 / mmPx)), maxThick: Math.max(3, Math.round(600 / mmPx)), minLength: Math.max(10, Math.round(300 / mmPx)) });

  function runRubik(image, mmPerPx) {
    const params = rubikParams(mmPerPx);
    const bands = X.rasterWallBands(image, params);
    const walls = bands.map(b => ({ a: { x: b.a.x * mmPerPx, y: b.a.y * mmPerPx }, b: { x: b.b.x * mmPerPx, y: b.b.y * mmPerPx }, thickness: b.thickness * mmPerPx, paired: true }));
    let rooms = null, openings = null, assembleError = null;
    if (walls.length >= 3) {
      try {
        const a = X.assemble(walls, {});
        const p = X.buildProject({ name: 'sculpt-r01', walls: a.walls, rooms: a.rooms, map: q => q, scale: { confidence: 'pending', method: 'none' } }).project;
        rooms = p.rooms.length; openings = p.openings.length;
      } catch (e) { assembleError = 'assemble-failed'; }
    }
    return { params, segments: bands.map(fromBand), counts: { walls: bands.length, openings, rooms }, assembleError };
  }

  function runDonor(image) {
    const r = E.analyse(image);
    if (!r.ok) return { error: r.error.code, segments: [], counts: { walls: 0, openings: null, rooms: null } };
    const ev = r.evidence;
    return {
      evidence: ev, segments: ev.walls.map(w => fromRect(w.rect, w.axis)),
      touchingSegments: ev.walls.filter(w => w.touchesOtherWall).map(w => fromRect(w.rect, w.axis)),
      counts: { walls: ev.walls.length, isolatedWalls: ev.walls.filter(w => !w.touchesOtherWall).length, openings: ev.openings.length, rooms: ev.rooms.length }
    };
  }

  // Coverage of ground truth by detected centre lines, sampled every pixel; and detected length off any true wall.
  function score(segments, truthWalls, tolPx) {
    const truth = truthWalls.map(w => ({ ...fromRect(w.rect, w.axis), rect: w.rect }));
    let truthLen = 0, covered = 0;
    for (const t of truth) for (let s = t.from; s < t.to; s++) {
      truthLen++;
      const c = s + .5;
      if (segments.some(d => d.axis === t.axis && Math.abs(d.pos - t.pos) <= tolPx && d.from <= c && d.to >= c)) covered++;
    }
    let detLen = 0, off = 0;
    for (const d of segments) for (let s = Math.floor(d.from); s < Math.ceil(d.to); s++) {
      detLen++;
      const c = s + .5, x = d.axis === 'h' ? c : d.pos, y = d.axis === 'h' ? d.pos : c;
      if (!truth.some(t => x >= t.rect[0] - tolPx && x <= t.rect[2] + tolPx && y >= t.rect[1] - tolPx && y <= t.rect[3] + tolPx)) off++;
    }
    return { truthLengthPx: truthLen, coveredLengthPx: covered, detectedLengthPx: detLen, offWallLengthPx: off };
  }

  function compare(image, { mmPerPx, truth = null, tolPx = 3 } = {}) {
    if (!(mmPerPx > 0)) throw new Error('compare needs the calibrated scale RUBIK requires before detecting (mmPerPx).');
    const donor = runDonor(image), rubik = runRubik(image, mmPerPx);
    const out = {
      tolerancePx: tolPx, mmPerPx,
      donor: { counts: donor.counts, error: donor.error || null },
      rubik: { counts: rubik.counts, params: rubik.params, assembleError: rubik.assembleError }
    };
    if (truth) {
      out.truth = { walls: truth.walls.length, openings: truth.openings.length, rooms: truth.rooms.length };
      out.donor.walls = score(donor.segments, truth.walls, tolPx);
      // Same score without the pieces the evidence flags as touching no other wall (C4). Reported, never substituted.
      if (donor.touchingSegments) out.donor.touchingWalls = score(donor.touchingSegments, truth.walls, tolPx);
      out.rubik.walls = score(rubik.segments, truth.walls, tolPx);
    }
    return out;
  }

  const api = { fromRect, fromBand, rubikParams, runRubik, runDonor, score, compare };
  if (node && module.exports) module.exports = api; else root.RubikRecognitionCompare = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
