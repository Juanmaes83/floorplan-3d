/* SCULPT-R01 · RecognitionEvidenceV1 — RUBIK adapter around the R01 donor (workshop copy, MIT).
 *
 * Contract: turns a raster plan into EVIDENCE in image pixels for a human to review.
 * It never writes project geometry, never converts pixels to millimetres, never applies a scale,
 * never names a room unless OCR text says so, never invents rooms and never assigns a confidence.
 * Pure: no DOM, no network, no clock, no randomness. Same input → same output.
 */
(function (root) {
  'use strict';
  const R = typeof module === 'object' && typeof require === 'function'
    ? require('./workshop/recognition-core.js')
    : root.FloorplanRecognition;

  const SCHEMA = 'rubik.recognition-evidence', VERSION = 1;
  const DONOR = Object.freeze({
    repo: 'zhuzhuyumeng/floorplan-3d', commit: '1d235fc0a3c45783e1e1fa129944f8f34d97d297',
    license: 'MIT', workshop: 'labs/sculpt/r01-recognition/workshop/recognition-core.js'
  });
  const LIMITS = Object.freeze({ minSide: 32, maxPixels: 3000000, maxWords: 5000, maxText: 200 });
  // C1/C2: donor-specific behaviour switched off. Explicit, so every evidence states what ran.
  const DETECT_OPTIONS = Object.freeze({ ignoreRects: Object.freeze([]) });
  const ENRICH_OPTIONS = Object.freeze({ synthesizeRooms: false, heuristicNames: false, inferDroppedDecimal: false });
  // What this evidence can never claim. Codes, so a UI can translate them.
  const STANDING_LIMITS = Object.freeze([
    'not-validated-on-real-plans', 'pixels-only-no-scale', 'not-load-bearing-analysis',
    'opening-kind-is-raster-heuristic', 'ocr-text-unverified', 'human-review-required'
  ]);
  const OPENING_KINDS = new Set(['door', 'window']);
  // C4: a wall rectangle "touches" another when they overlap or are at most this far apart. A geometric fact, not a score.
  const TOUCH_GAP_PX = 1;
  const touches = (a, b) => a[0] <= b[2] + TOUCH_GAP_PX && b[0] <= a[2] + TOUCH_GAP_PX && a[1] <= b[3] + TOUCH_GAP_PX && b[1] <= a[3] + TOUCH_GAP_PX;
  const SHA256_RE = /^[0-9a-f]{64}$/;

  const finite = v => typeof v === 'number' && Number.isFinite(v);
  const rect4 = r => Array.isArray(r) && r.length === 4 && r.every(finite) ? [r[0], r[1], r[2], r[3]] : null;
  const point = p => Array.isArray(p) && p.length === 2 && p.every(finite) ? [p[0], p[1]] : null;
  const bboxOf = b => b && [b.x0, b.y0, b.x1, b.y1].every(finite) ? [b.x0, b.y0, b.x1, b.y1] : null;
  const fail = (code, detail) => ({ ok: false, error: detail ? { code, detail } : { code } });

  function checkImage(image) {
    if (!image || typeof image !== 'object') return 'image-missing';
    const { width, height, data } = image;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) return 'image-invalid';
    if (!data || typeof data.length !== 'number' || data.length !== width * height * 4) return 'image-invalid';
    if (width < LIMITS.minSide || height < LIMITS.minSide || width * height > LIMITS.maxPixels) return 'image-size-out-of-range';
    return null;
  }

  // Words come from any OCR engine the caller ran. Their score is the engine's own number, passed through untouched.
  function cleanWords(words) {
    if (words == null) return { words: null };
    if (!Array.isArray(words) || words.length > LIMITS.maxWords) return { error: 'ocr-words-invalid' };
    const out = [];
    for (const w of words) {
      const bbox = w && bboxOf(w.bbox);
      if (!w || typeof w.text !== 'string' || !bbox || bbox[2] < bbox[0] || bbox[3] < bbox[1]) return { error: 'ocr-words-invalid' };
      const text = w.text.slice(0, LIMITS.maxText);
      out.push({ text, bbox: { x0: bbox[0], y0: bbox[1], x1: bbox[2], y1: bbox[3] }, engineScore: finite(w.confidence) ? w.confidence : null });
    }
    return { words: out };
  }

  function imageRefOf(ref) {
    if (ref == null) return null;
    if (typeof ref !== 'object') return undefined;
    const out = {};
    if (ref.sha256 != null) { if (typeof ref.sha256 !== 'string' || !SHA256_RE.test(ref.sha256)) return undefined; out.sha256 = ref.sha256; }
    if (ref.id != null) { if (typeof ref.id !== 'string' || !ref.id || ref.id.length > 120) return undefined; out.id = ref.id; }
    return Object.keys(out).length ? out : null;
  }

  function analyse(image, { words = null, ocrEngine = null, imageRef = null } = {}) {
    const bad = checkImage(image);
    if (bad) return fail(bad);
    const ocr = cleanWords(words);
    if (ocr.error) return fail(ocr.error);
    if (ocrEngine != null && (typeof ocrEngine !== 'string' || !ocrEngine || ocrEngine.length > 80)) return fail('ocr-engine-invalid');
    if (ocrEngine != null && ocr.words == null) return fail('ocr-engine-without-words');
    const ref = imageRefOf(imageRef);
    if (ref === undefined) return fail('image-ref-invalid');
    let result;
    try {
      result = R.detect(image, { ignoreRects: DETECT_OPTIONS.ignoreRects });
      // The donor mutates; give it its own copies of the words (with the engine score as its confidence).
      if (ocr.words) R.enrich(result, ocr.words.map(w => ({ text: w.text, bbox: { ...w.bbox }, confidence: w.engineScore ?? undefined })), ENRICH_OPTIONS);
    } catch (e) {
      return fail('detector-rejected', String(e && e.message || e).slice(0, 200));
    }
    return { ok: true, evidence: fromDetection(result, { words: ocr.words, ocrEngine, imageRef: ref }) };
  }

  function labelOf(ev, basis) {
    if (!ev) return null;
    return { text: String(ev.text), matched: ev.name ?? null, bbox: bboxOf(ev.bbox), merged: !!ev.merged, placement: basis === 'ocr-inside' ? 'inside' : 'nearby' };
  }

  function fromDetection(result, { words = null, ocrEngine = null, imageRef = null } = {}) {
    const W = result.width, H = result.height;
    const walls = (result.walls || []).map((w, i) => {
      const r = rect4(w.rect);
      return { id: 'wall-' + i, rect: r, axis: w.axis === 'v' ? 'v' : 'h', thicknessPx: r ? Math.min(r[2] - r[0], r[3] - r[1]) : null, touchesOtherWall: false, review: 'unreviewed' };
    });
    for (const a of walls) a.touchesOtherWall = !!a.rect && walls.some(b => b !== a && b.rect && touches(a.rect, b.rect));
    const openings = (result.openings || []).map((o, i) => ({
      id: 'opening-' + i, rect: rect4(o.rect), axis: o.axis === 'v' ? 'v' : 'h',
      kind: OPENING_KINDS.has(o.type) ? o.type : 'unknown', kindBasis: 'raster-heuristic', review: 'unreviewed'
    }));
    // Synthetic rooms never reach the evidence (C2 also keeps the donor from creating them).
    const rooms = (result.rooms || []).filter(r => !r.synthetic).map((r, i) => {
      const area = r.areaEvidence ? { valueM2: finite(r.areaLabel) ? r.areaLabel : null, text: String(r.areaEvidence.text), bbox: bboxOf(r.areaEvidence.bbox), merged: !!r.areaEvidence.merged } : null;
      return {
        id: 'room-' + i, poly: (r.poly || []).map(point).filter(Boolean), at: point(r.at), areaPx: finite(r.areaPx) ? r.areaPx : null,
        label: labelOf(r.textEvidence && { ...r.textEvidence, name: r.name }, r.nameBasis), areaLabel: area,
        wordsInside: [], review: 'unreviewed'
      };
    });
    // C5 (GENERALISE): the donor only keeps labels from its Chinese alias table, so «Salón» was lost.
    // Every OCR word whose box centre lies inside a room polygon is listed by index, verbatim, without naming the room.
    if (words) words.forEach((w, i) => {
      const cx = (w.bbox.x0 + w.bbox.x1) / 2, cy = (w.bbox.y0 + w.bbox.y1) / 2;
      const hits = rooms.filter(r => r.poly.length >= 3 && R.contains(cx, cy, r.poly));
      if (hits.length) hits.sort((a, b) => (a.areaPx ?? Infinity) - (b.areaPx ?? Infinity))[0].wordsInside.push(i);
    });
    const unplacedLabels = (result.unplacedLabels || []).map(l => ({ text: String(l.text), matched: l.name ?? null, bbox: bboxOf(l.bbox) }));
    const hints = words ? R.scaleCandidates(result, words.map(w => ({ text: w.text, bbox: w.bbox })))
      .map(c => ({ method: c.method, axis: c.axis, mmPerPxCandidate: c.mmPerPx, valuesRead: c.values.slice(), status: 'unverified', applied: false })) : [];
    const c = result.compass;
    const warnings = [];
    if (!walls.length) warnings.push('no-walls');
    if (!rooms.length) warnings.push('no-closed-rooms');
    if (!result.dimensionFrame) warnings.push('no-dimension-frame');
    if (!c) warnings.push('no-compass');
    if (words && !rooms.some(r => r.label)) warnings.push('no-room-labels-read');
    if (unplacedLabels.length) warnings.push('labels-without-room');
    if (walls.some(w => !w.touchesOtherWall)) warnings.push('isolated-wall-pieces');
    return {
      schema: SCHEMA, version: VERSION, canonical: false,
      frame: { units: 'image-px', origin: 'top-left', yAxis: 'down', width: W, height: H },
      source: {
        engine: 'sculpt-r01', donor: { ...DONOR },
        detectOptions: { ignoreRects: [] },
        touchGapPx: TOUCH_GAP_PX,
        enrichOptions: words ? { ...ENRICH_OPTIONS } : null,
        image: imageRef
      },
      scale: { status: 'unknown', mmPerPx: null, hints },
      walls, openings, rooms,
      annotations: {
        compass: c ? { at: point([c.x, c.y]), angleDeg: finite(c.angleDeg) ? c.angleDeg : null, facing: c.facing ?? null, basis: 'raster-heuristic' } : null,
        dimensionFrame: result.dimensionFrame ? { rect: rect4(result.dimensionFrame.rect) } : null
      },
      ocr: words ? { status: 'provided', engine: ocrEngine, words: words.map(w => ({ text: w.text, bbox: bboxOf(w.bbox), engineScore: w.engineScore })) } : { status: 'not-run', engine: null, words: [] },
      unplacedLabels,
      warnings,
      limits: STANDING_LIMITS.slice()
    };
  }

  // Strict structural check. Returns the list of problems; [] means valid.
  function validate(ev) {
    const errs = [];
    const add = m => { if (errs.length < 50) errs.push(m); };
    if (!ev || typeof ev !== 'object') return ['not-an-object'];
    if (ev.schema !== SCHEMA || ev.version !== VERSION) add('schema');
    if (ev.canonical !== false) add('canonical-must-be-false');
    const f = ev.frame;
    if (!f || f.units !== 'image-px' || f.origin !== 'top-left' || f.yAxis !== 'down' || !Number.isInteger(f.width) || !Number.isInteger(f.height)) { add('frame'); return errs; }
    const inside = ([x, y]) => x >= 0 && y >= 0 && x <= f.width && y <= f.height;
    const okRect = r => Array.isArray(r) && r.length === 4 && r.every(finite) && r[2] >= r[0] && r[3] >= r[1] && inside([r[0], r[1]]) && inside([r[2], r[3]]);
    if (!ev.scale || ev.scale.status !== 'unknown' || ev.scale.mmPerPx !== null) add('scale-must-stay-unknown');
    for (const h of ev.scale?.hints || []) if (h.applied !== false || h.status !== 'unverified') add('scale-hint-applied');
    for (const k of ['walls', 'openings', 'rooms']) if (!Array.isArray(ev[k])) add(k + '-missing');
    for (const w of ev.walls || []) {
      if (!okRect(w.rect)) add('wall-rect:' + w.id);
      if (w.review !== 'unreviewed') add('wall-review:' + w.id);
      if (typeof w.touchesOtherWall !== 'boolean') add('wall-touch:' + w.id);
    }
    for (const o of ev.openings || []) {
      if (!okRect(o.rect)) add('opening-rect:' + o.id);
      if (!['door', 'window', 'unknown'].includes(o.kind) || o.kindBasis !== 'raster-heuristic') add('opening-kind:' + o.id);
      if (o.review !== 'unreviewed') add('opening-review:' + o.id);
    }
    for (const r of ev.rooms || []) {
      if (!Array.isArray(r.poly) || r.poly.length < 3 || !r.poly.every(p => Array.isArray(p) && p.length === 2 && p.every(finite) && inside(p))) add('room-poly:' + r.id);
      if (r.review !== 'unreviewed') add('room-review:' + r.id);
      if (r.label && (typeof r.label.text !== 'string' || !['inside', 'nearby'].includes(r.label.placement))) add('room-label:' + r.id);
      if ('synthetic' in r || 'name' in r) add('room-invented-field:' + r.id);
      if (!Array.isArray(r.wordsInside) || !r.wordsInside.every(i => Number.isInteger(i) && i >= 0 && i < (ev.ocr?.words?.length ?? 0))) add('room-words:' + r.id);
    }
    // Nothing may carry a confidence: only the OCR engine's own score, under its own name.
    const walk = (v, path) => {
      if (!v || typeof v !== 'object') return;
      for (const [k, x] of Object.entries(v)) {
        if (/^(confidence|score|probability|mm|lengthMm|areaM2Measured)$/i.test(k)) add('forbidden-field:' + path + k);
        walk(x, path + k + '.');
      }
    };
    walk(ev, '');
    if (!ev.ocr || !['not-run', 'provided'].includes(ev.ocr.status)) add('ocr-status');
    if (!Array.isArray(ev.limits) || !STANDING_LIMITS.every(l => ev.limits.includes(l))) add('limits');
    return errs;
  }

  const api = { SCHEMA, VERSION, DONOR, LIMITS, TOUCH_GAP_PX, DETECT_OPTIONS, ENRICH_OPTIONS, STANDING_LIMITS, analyse, fromDetection, validate };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikRecognitionEvidence = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
