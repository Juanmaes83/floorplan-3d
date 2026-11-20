/* SCULPT-R01 · F2 bridge. Turns detections into the input of RUBIK's APPROVED offline wall evaluator
 * (scripts/f2-wall-evaluation.py, record_version 1, frame image-aligned-mm; method approved by Juanma on 30-09-2026),
 * so R01 and RUBIK's own detector are measured with the same rule. It does not compute any metric itself.
 *  - Scale: only an explicit, FROZEN calibration {mmPerPx, source, frozen:true}. Scale hints read by OCR are never
 *    used (they stay 'unverified' in RecognitionEvidenceV1). No calibration → refused, never a default.
 *  - Frame: the original raster axes, origin top-left, pixels × mmPerPx, rounded to the mm only when written.
 *  - Walls only: the approved evaluator compares wall axes. Openings/rooms/OCR are NOT evaluated by it (stated).
 *  - Failed analyses are kept (analysis_status 'failed', predictions null): no case is filtered out.
 * Pure: no DOM, no file access, no clock. Synthetic records are labelled data_kind 'synthetic' and never count for F2. */
(function (root) {
  'use strict';
  const RECORD_VERSION = 1, FRAME = 'image-aligned-mm';
  const SHA40 = /^[0-9a-f]{40}$/, EVAL_ID = /^eval_\d{3}$/, CASE_ID = /^case_\d{3}$/;
  const TYPES = Object.freeze(['digital', 'scan', 'photo']);
  const NOT_EVALUATED = Object.freeze(['openings', 'rooms', 'ocr-labels', 'scale-hints', 'compass', 'dimension-frame']);
  const fail = (code, detail) => { const e = new Error(detail ? `${code}: ${detail}` : code); e.code = code; throw e; };

  function checkCalibration(c) {
    if (!c || typeof c !== 'object') fail('calibration-missing', 'an explicit frozen calibration is required');
    if (!(typeof c.mmPerPx === 'number' && Number.isFinite(c.mmPerPx) && c.mmPerPx > 0 && c.mmPerPx < 1000)) fail('calibration-invalid', 'mmPerPx must be a finite positive number');
    if (c.frozen !== true) fail('calibration-not-frozen', 'freeze the calibration before evaluating (F2 protocol)');
    if (typeof c.source !== 'string' || !c.source.trim()) fail('calibration-unsourced', 'state where the calibration comes from');
    return c.mmPerPx;
  }
  // Axis-aligned rectangle [x0,y0,x1,y1] in px → centre-line segment in mm (the same convention for truth and detections).
  function rectAxis(rect, axis, k) {
    const [x0, y0, x1, y1] = rect;
    const a = axis === 'h' ? { x: x0, y: (y0 + y1) / 2 } : { x: (x0 + x1) / 2, y: y0 };
    const b = axis === 'h' ? { x: x1, y: (y0 + y1) / 2 } : { x: (x0 + x1) / 2, y: y1 };
    return { start: { x: Math.round(a.x * k), y: Math.round(a.y * k) }, end: { x: Math.round(b.x * k), y: Math.round(b.y * k) } };
  }
  const distinct = s => s.start.x !== s.end.x || s.start.y !== s.end.y;
  const ids = list => list.filter(distinct).map((s, i) => ({ id: 'seg_' + String(i + 1).padStart(3, '0'), start: s.start, end: s.end }));

  // R01 evidence (RecognitionEvidenceV1, pixels) → predictions.
  function fromEvidence(evidence, calibration) {
    const k = checkCalibration(calibration);
    if (!evidence || !Array.isArray(evidence.walls)) fail('evidence-invalid');
    return ids(evidence.walls.filter(w => Array.isArray(w.rect)).map(w => rectAxis(w.rect, w.axis, k)));
  }
  // RUBIK's own detector (FloorPlanIntake.rasterWallBands segments, already multiplied by the same mmPerPx) → predictions.
  function fromRubikWalls(walls) {
    if (!Array.isArray(walls)) fail('rubik-walls-invalid');
    return ids(walls.map(w => ({ start: { x: Math.round(w.a.x), y: Math.round(w.a.y) }, end: { x: Math.round(w.b.x), y: Math.round(w.b.y) } })));
  }
  // Reference axes from rectangles (synthetic truth here; a manually reviewed annotation in a real F2 run).
  function fromReferenceRects(rects, calibration) {
    const k = checkCalibration(calibration);
    return ids(rects.map(r => rectAxis(r.rect, r.axis, k)));
  }
  function evaluationCase({ id, type, predictions, references, analysisFailed = false }) {
    if (!CASE_ID.test(id)) fail('case-id', 'case_NNN');
    if (!TYPES.includes(type)) fail('case-type', TYPES.join('|'));
    return { id, type, analysis_status: analysisFailed ? 'failed' : 'ok', reference_status: references == null ? 'missing' : 'reviewed',
      predictions: analysisFailed ? null : predictions, references: references == null ? null : references };
  }
  function record({ datasetId, detectorCommit, dataKind, cases }) {
    if (!EVAL_ID.test(datasetId)) fail('dataset-id', 'eval_NNN');
    if (!SHA40.test(detectorCommit)) fail('detector-commit', 'full 40-hex SHA, never "latest"');
    if (dataKind !== 'synthetic' && dataKind !== 'real') fail('data-kind');
    if (!Array.isArray(cases) || !cases.length) fail('cases', 'non-empty list; do not filter failures');
    if (new Set(cases.map(c => c.id)).size !== cases.length) fail('cases', 'duplicate case id');
    return { record_version: RECORD_VERSION, dataset_id: datasetId, detector_commit: detectorCommit, units: 'mm', coordinate_frame: FRAME, data_kind: dataKind, cases };
  }
  const api = { RECORD_VERSION, FRAME, NOT_EVALUATED, checkCalibration, fromEvidence, fromRubikWalls, fromReferenceRects, evaluationCase, record };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikR01F2Bridge = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
