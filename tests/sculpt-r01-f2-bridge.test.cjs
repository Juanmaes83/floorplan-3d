// SCULPT-R01 · D3: R01 and RUBIK's own detector, on the six synthetic plans, through the bridge into RUBIK's APPROVED
// offline evaluator (scripts/f2-wall-evaluation.py, unmodified). Proves the pipeline end to end and that both detectors
// are measured with one rule. Synthetic only: data_kind 'synthetic', f2_validated false; nothing here counts for F2.
// The tolerance used (40 mm) is a TEST parameter for these drawn plans, not a product tolerance (still pending).
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const LAB = path.join(__dirname, '..', 'labs', 'sculpt', 'r01-recognition');
const B = require(path.join(LAB, 'f2-bridge.js'));
const E = require(path.join(LAB, 'recognition-evidence-core.js'));
const C = require(path.join(LAB, 'recognition-compare-core.js'));
const P = require(path.join(LAB, 'fixtures', 'synthetic-plans.js'));
const X = require('../js/plan-intake.js');
const EVALUATOR = path.join(__dirname, '..', 'scripts', 'f2-wall-evaluation.py');
const DONOR_COMMIT = E.DONOR.commit;                                   // R01 detector under test
const RUBIK_DETECTOR_COMMIT = '75615fdc6c96e7c43e52b13a24950b9652706f7d'; // the RUBIK master the lab compares against
const TOLERANCE_MM = '40';
const calibrationOf = plan => ({ mmPerPx: plan.mmPerPx, source: 'synthetic-declared (fixture construction scale)', frozen: true });

function records() {
  const r01 = [], rubik = [];
  P.NAMES.forEach((name, i) => {
    const plan = P.plan(name), cal = calibrationOf(plan), id = 'case_' + String(i + 1).padStart(3, '0');
    const references = B.fromReferenceRects(plan.truth.walls, cal);
    const a = E.analyse(plan.image);
    r01.push(B.evaluationCase({ id, type: 'digital', predictions: a.ok ? B.fromEvidence(a.evidence, cal) : null, references, analysisFailed: !a.ok }));
    const bands = X.rasterWallBands(plan.image, C.rubikParams(plan.mmPerPx));
    const walls = bands.map(b => ({ a: { x: b.a.x * plan.mmPerPx, y: b.a.y * plan.mmPerPx }, b: { x: b.b.x * plan.mmPerPx, y: b.b.y * plan.mmPerPx } }));
    rubik.push(B.evaluationCase({ id, type: 'digital', predictions: B.fromRubikWalls(walls), references }));
  });
  return {
    r01: B.record({ datasetId: 'eval_000', detectorCommit: DONOR_COMMIT, dataKind: 'synthetic', cases: r01 }),
    rubik: B.record({ datasetId: 'eval_000', detectorCommit: RUBIK_DETECTOR_COMMIT, dataKind: 'synthetic', cases: rubik })
  };
}
function evaluate(rec) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r01-f2-')), file = path.join(dir, 'record.json');
  fs.writeFileSync(file, JSON.stringify(rec));
  return JSON.parse(execFileSync('python3', [EVALUATOR, '--tolerance-mm', TOLERANCE_MM, file], { encoding: 'utf8' }));
}

test('D3 the approved evaluator accepts both records unchanged; the result says it does not validate F2', () => {
  const { r01, rubik } = records();
  for (const rec of [r01, rubik]) {
    const out = evaluate(rec);
    assert.equal(out.rules_status, 'metric_method_approved_thresholds_pending');
    assert.equal(out.f2_validated, false); assert.equal(out.data_kind, 'synthetic');
    assert.equal(out.aggregate.declared_cases, 6); assert.equal(out.aggregate.all_cases_have_reviewed_reference, true);
  }
});

test('D3 per-plan metrics reproduce the lab benchmark with the approved rule (grey walls + black text, dimension lines)', () => {
  const { r01, rubik } = records(), a = evaluate(r01), b = evaluate(rubik);
  const m = (out, name) => out.cases[P.NAMES.indexOf(name)].metrics;
  const table = P.NAMES.map(n => ({ plan: n, r01: { p: m(a, n).precision_length, r: m(a, n).recall_length_all_orientations }, rubik: { p: m(b, n).precision_length, r: m(b, n).recall_length_all_orientations } }));
  console.log('# D3 synthetic, tolerance 40 mm (test parameter):', JSON.stringify(table));
  // Commercial-screenshot look: RUBIK sees nothing, R01 recovers the walls.
  assert.equal(m(b, 'grey-walls-black-text').recall_length_all_orientations, 0);
  assert.ok(m(a, 'grey-walls-black-text').recall_length_all_orientations > 0.95);
  // Dimension lines and text inside rooms: R01 predicts wall length where there is none; RUBIK does not.
  assert.ok(m(a, 'dimension-lines').precision_length < m(b, 'dimension-lines').precision_length);
  // Plain black/grey walls: both detectors cover the drawn walls.
  for (const n of ['black-walls', 'grey-walls']) for (const out of [a, b]) assert.ok(m(out, n).recall_length_all_orientations > 0.95, `${n}`);
});

test('D3 scale is never guessed: no calibration, unfrozen or unsourced → refused; OCR scale hints are not used', () => {
  const plan = P.plan('black-walls'), ev = E.analyse(plan.image, { words: [{ text: '4800', bbox: { x0: 300, y0: 440, x1: 340, y1: 452 } }] }).evidence;
  assert.throws(() => B.fromEvidence(ev, null), /calibration-missing/);
  assert.throws(() => B.fromEvidence(ev, { mmPerPx: 10, source: 'x' }), /calibration-not-frozen/);
  assert.throws(() => B.fromEvidence(ev, { mmPerPx: 10, frozen: true }), /calibration-unsourced/);
  assert.throws(() => B.fromEvidence(ev, { mmPerPx: NaN, frozen: true, source: 'x' }), /calibration-invalid/);
  const a = B.fromEvidence(ev, { mmPerPx: 10, frozen: true, source: 'x' }), b = B.fromEvidence(ev, { mmPerPx: 20, frozen: true, source: 'x' });
  assert.equal(b[0].end.x - b[0].start.x, 2 * (a[0].end.x - a[0].start.x), 'only the stated calibration scales the segments');
  assert.ok(ev.scale.hints.every(h => h.applied === false && h.status === 'unverified'));
});

test('D3 nothing is filtered: a failed analysis stays as a case (predictions null) and the evaluator counts it', () => {
  const ok = P.plan('black-walls'), cal = calibrationOf(ok), refs = B.fromReferenceRects(ok.truth.walls, cal);
  const tiny = { width: 8, height: 8, data: new Uint8ClampedArray(8 * 8 * 4).fill(255) }, failed = E.analyse(tiny);
  assert.equal(failed.ok, false);
  const rec = B.record({ datasetId: 'eval_000', detectorCommit: DONOR_COMMIT, dataKind: 'synthetic', cases: [
    B.evaluationCase({ id: 'case_001', type: 'digital', predictions: B.fromEvidence(E.analyse(ok.image).evidence, cal), references: refs }),
    B.evaluationCase({ id: 'case_002', type: 'scan', predictions: null, references: refs, analysisFailed: true }),
    B.evaluationCase({ id: 'case_003', type: 'photo', predictions: [], references: null })
  ] });
  const out = evaluate(rec);
  assert.equal(out.aggregate.declared_cases, 3); assert.equal(out.aggregate.all_analyses_succeeded, false); assert.equal(out.aggregate.all_cases_have_reviewed_reference, false);
  assert.throws(() => B.record({ datasetId: 'eval_000', detectorCommit: 'latest', dataKind: 'synthetic', cases: rec.cases }), /detector-commit/);
  assert.throws(() => B.record({ datasetId: 'eval_000', detectorCommit: DONOR_COMMIT, dataKind: 'synthetic', cases: [] }), /cases/);
  assert.throws(() => B.evaluationCase({ id: 'plan_001', type: 'digital', predictions: [], references: [] }), /case-id/);
});

test('D3 the evaluator still rejects what it must (unknown fields), so the bridge cannot smuggle extra data', () => {
  const { r01 } = records(), bad = structuredClone(r01); bad.cases[0].predictions[0].confidence = 0.9;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r01-f2-bad-')), file = path.join(dir, 'r.json'); fs.writeFileSync(file, JSON.stringify(bad));
  const r = spawnSync('python3', [EVALUATOR, '--tolerance-mm', TOLERANCE_MM, file], { encoding: 'utf8' });
  assert.notEqual(r.status, 0);
});
