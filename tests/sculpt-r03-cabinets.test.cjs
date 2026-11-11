// SCULPT-R03 · parametric cabinets lab: provenance, parity with the verbatim donor, audited hypotheses H1–H4,
// CabinetEvidenceV1 invariants and guards. Lab only: nothing here is loaded by the RUBIK product.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const L = path.join(__dirname, '..', 'labs', 'sculpt', 'r03-cabinets');
const D = require(path.join(L, 'workshop', 'design.js'));
const K = require(path.join(L, 'cabinet-core.js'));
const E = require(path.join(L, 'cabinet-evidence-core.js'));
const X = require(path.join(L, 'cabinet-compare-core.js'));
const W = require(path.join(L, 'verify-workshop.cjs'));
const { SCENARIOS } = require(path.join(L, 'fixtures', 'cabinet-scenarios.js'));
const C = require('../js/project-core.js'), T = require('../js/tracing-core.js'), PL = require('../js/furniture-placement.js');
const clone = v => structuredClone(v); // not JSON: NaN must survive
// Deterministic PRNG (mulberry32) so the seeded cases are identical on every run.
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const donorF = (type, w, d) => { const f = { type, w, d, cx: 0, cy: 0, rot: 0 }; f.cabinet = D.defaultCabinet(f); return f; };
const throws = fn => { try { fn(); return null; } catch (e) { return String(e.message); } };

// ---------- provenance / SOURCE EXACT ----------
test('workshop keeps the donor files byte-identical to SOURCE EXACT (sha256 manifest of 2495d8e)', () => {
  assert.deepEqual(W.verify(), []);
  const m = W.manifest();
  assert.equal(m.size, 18);
  assert.ok(!fs.existsSync(path.join(L, 'workshop', 'vendor')), 'vendor/three is not duplicated');
  const lic = fs.readFileSync(path.join(L, 'workshop', 'LICENSE-donor-MIT.txt'), 'utf8');
  assert.match(lic, /Copyright \(c\) 2026 wuyi/);
  assert.match(lic, /Portions Copyright \(c\) 2026 kai cai/);
  assert.match(lic, /Permission is hereby granted, free of charge/);
});
test('the donor unit tests run UNCHANGED against the verbatim workshop design.js (13/13)', () => {
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--test', 'tests/design.test.cjs'], { cwd: path.join(L, 'workshop'), env, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /# pass 13/); assert.match(r.stdout, /# fail 0/);
});
test('the fetch script refuses unsafe destinations without touching them', () => {
  const sh = fs.readFileSync(path.join(L, 'fetch-source-exact.sh'), 'utf8');
  assert.match(sh, /COMMIT="2495d8e0bf7d3846d2da827121c15e3e83d752bd"/);
  assert.match(sh, /TREE="9b2ab2010a6f782bff7dc02c96815ef9edd5273c"/);
  assert.match(sh, /refs\/pull\/11\/head/);
  assert.doesNotMatch(sh, /rm -rf -- "\$ABS"|rm -rf "\$DEST"/);
  const inside = spawnSync('bash', [path.join(L, 'fetch-source-exact.sh'), path.join(L, 'tmp-should-not-exist')], { encoding: 'utf8' });
  assert.equal(inside.status, 2); assert.ok(!fs.existsSync(path.join(L, 'tmp-should-not-exist')));
});

// ---------- KEEP: parity with the donor ----------
test('default cabinets are identical to the donor for every type over a grid of sizes', () => {
  let n = 0;
  for (const type of K.TYPES) for (let w = 600; w <= 4800; w += 150) for (const d of [300, 350, 400, 450, 500, 550, 600, 650]) {
    const f = { type, w, d };
    const donor = throws(() => D.defaultCabinet(f)) === null ? D.defaultCabinet(f) : null;
    if (!donor) continue;
    assert.deepEqual(K.defaultCabinet(type, { w, d }), donor, `${type} ${w}×${d}`); n++;
  }
  assert.ok(n > 800);
});
test('validation parity on 3000 seeded mutations: the donor throws ⇔ issues exist, and issues[0] is the donor message', () => {
  const R = rng(20261111), pick = a => a[Math.floor(R() * a.length)], vals = [NaN, -50, 0, 10, 60, 150, 400, 900, 1500, 2100, 5000];
  const muts = [
    c => c.columns[0].shelves = [Math.round(R() * 2200), Math.round(R() * 2200)].sort((a, b) => a - b),
    c => c.columns[0].rod = pick([null, NaN, ...vals]),
    c => Object.assign(c.columns[0], { drawers: pick([0, 1, 2, 3, 6, 7, 1.5]), drawerHeight: pick([60, 80, 180, 400, 401, NaN]) }),
    c => c.columns[0].width += pick([-500, -20, 0.05, 20, 400]),
    c => c[pick(['height', 'thickness', 'back', 'frontGap', 'plinth'])] = pick(vals),
    c => c.front = pick(['closed', 'open', 'hidden', 'ajar']),
    c => c.doorCount = pick([0, 1, 4, 12, 13, 2.5]),
    c => c.columns[0].kind = pick(['long', 'short', 'shelves', 'drawers', 'other']),
    c => c.columns[0].shelves = Array.from({ length: pick([0, 3, 12, 13]) }, (_, i) => 100 + i * 150),
    c => { c.columns.length > 1 ? c.columns.pop() : c.columns.push(clone(c.columns[0])); }
  ];
  let failing = 0;
  for (let i = 0; i < 3000; i++) {
    const type = pick(K.TYPES), w = 600 + Math.round(R() * 3000), d = pick([350, 450, 600]);
    const f = donorF(type, w, d); for (let k = 0, n = 1 + Math.floor(R() * 3); k < n; k++) pick(muts)(f.cabinet);
    const spec = clone(f.cabinet), donor = throws(() => D.validateCabinet(f, f.cabinet)), issues = K.validate({ w, d }, spec);
    assert.equal(donor === null, issues.length === 0, `case ${i}: donor=${donor} sculpt=${JSON.stringify(issues)}`);
    if (donor) { failing++; assert.equal(issues[0].message, donor, `case ${i}`); }
  }
  assert.ok(failing > 500 && failing < 2900, 'the seeded set exercises both outcomes: ' + failing);
});
test('resize and bay-width parity with the donor whenever the donor succeeds', () => {
  const R = rng(7), outer = { w: 2000, d: 600 };
  for (let i = 0; i < 300; i++) {
    const f = donorF('wardrobe', 2000, 600), changes = { w: 1400 + Math.round(R() * 2000), height: 1900 + Math.round(R() * 700), thickness: [16, 18, 19, 25][i % 4] };
    const s = K.resize(outer, clone(f.cabinet), changes);
    const oldH = D.cavity(f, f.cabinet).height; f.w = changes.w; Object.assign(f.cabinet, { height: changes.height, thickness: changes.thickness });
    const donor = throws(() => D.resizeCabinet(f, f.cabinet, oldH));
    assert.equal(donor === null, s.ok, `resize case ${i}`);
    if (s.ok) assert.deepEqual(s.cabinet, f.cabinet);
    const g = donorF('wardrobe', 2000, 600), width = 150 + Math.round(R() * 1600), b = K.setBayWidth(outer, clone(g.cabinet), 0, width);
    const dw = throws(() => D.bayWidths(g, g.cabinet, 0, width));
    assert.equal(dw === null, b.ok, `bay width case ${i}`);
    if (b.ok) assert.deepEqual(b.cabinet, g.cabinet);
  }
});

// ---------- H1: partial mutation ----------
test('H1 reproduced: donor bayWidths/resizeCabinet leave the cabinet modified when they reject; the sculpt never mutates', () => {
  const f = donorF('wardrobe', 2000, 600), before = clone(f.cabinet);
  assert.ok(throws(() => D.bayWidths(f, f.cabinet, 0, 1800)));
  assert.notDeepEqual(f.cabinet, before, 'donor API mutated before validating');
  assert.deepEqual(f.cabinet.columns.map(c => Math.round(c.width)), [1800, 64, 64]);
  const g = donorF('wardrobe', 2000, 600), oldH = D.cavity(g, g.cabinet).height; g.cabinet.height = 600;
  assert.ok(throws(() => D.resizeCabinet(g, g.cabinet, oldH)));
  assert.deepEqual(g.cabinet.columns.map(c => c.shelves), [[410], [410], [410]], 'shelves rescaled although the resize was refused');
  // Donor app context: cabinet-editor.js editCabinet clones before applying, so the DATA in the app is protected; the
  // defect is in the engine API (design.js), which any other caller would hit.
  const spec = clone(before), frozen = JSON.stringify(spec), outer = { w: 2000, d: 600 };
  for (const r of [K.setBayWidth(outer, spec, 0, 1800), K.resize(outer, spec, { height: 600 }), K.splitBay(outer, spec, 0), K.mergeBay(outer, spec, 0), K.setBay(outer, spec, 0, { shelves: [10] }), K.setBayWidth(outer, spec, 9, 300)]) assert.ok(typeof r.ok === 'boolean');
  assert.equal(JSON.stringify(spec), frozen, 'no sculpt operation mutates its input');
  const bad = K.setBayWidth(outer, spec, 0, 1800);
  assert.equal(bad.ok, false); assert.equal(bad.cabinet, undefined); assert.deepEqual(bad.issues.map(i => i.code), ['bay-width', 'bay-width']);
});
test('validation collects every issue with stable codes (donor stops at the first)', () => {
  const s = SCENARIOS['invalid-shelves'], issues = K.validate({ w: 2000, d: 600 }, s.cabinet);
  assert.deepEqual(issues.map(i => i.code), ['bay-widths-sum', 'shelf-gap', 'rod']);
  assert.equal(issues[0].message, throws(() => D.validateCabinet({ w: 2000, d: 600 }, clone(s.cabinet))));
});
test('NaN never becomes a valid value through an edit (structuredClone, not JSON)', () => {
  const o = { w: 2000, d: 600 }, c = K.defaultCabinet('wardrobe', o);
  for (const patch of [{ rod: NaN }, { shelves: [NaN] }, { drawerHeight: NaN }]) assert.equal(K.setBay(o, c, 0, patch).ok, false, JSON.stringify(Object.keys(patch)));
  const e = E.propose({ ...SCENARIOS['bedroom-default'], cabinet: { ...c, columns: c.columns.map((b, i) => i ? b : { ...b, rod: NaN }) } }).evidence;
  assert.equal(e.cabinet.status, 'invalid'); assert.deepEqual(e.cabinet.issues.map(i => i.code), ['rod']);
});
test('elevation never emits negative sizes; overlapping boards are reported as overlap', () => {
  for (const id of Object.keys(SCENARIOS)) { const s = SCENARIOS[id], o = s.project.objects.find(x => x.id === s.objectId); if (!K.isCabinetType(o.type)) continue;
    const spec = s.cabinet || K.defaultCabinet(o.type, { w: o.size.widthMm, d: o.size.depthMm }), prim = K.elevation({ w: o.size.widthMm, d: o.size.depthMm }, spec);
    assert.ok(prim.every(p => p.w >= 0 && p.h >= 0), id); }
  const inv = SCENARIOS['invalid-shelves'], prim = K.elevation({ w: 2000, d: 600 }, inv.cabinet);
  assert.deepEqual(prim.filter(p => p.role === 'overlap').map(p => p.h), [8]);
});
test('split and merge keep the exterior doors and the width balance', () => {
  const o = { w: 2000, d: 600 }, c = K.defaultCabinet('wardrobe', o), doors = K.fronts(o, c);
  const s = K.splitBay(o, c, 0); assert.ok(s.ok); assert.equal(s.cabinet.columns.length, 4); assert.deepEqual(K.fronts(o, s.cabinet), doors);
  const m = K.mergeBay(o, s.cabinet, 0); assert.ok(m.ok); assert.equal(m.cabinet.columns.length, 3);
  for (const x of [s.cabinet, m.cabinet]) assert.ok(Math.abs(x.columns.reduce((a, b) => a + b.width, 0) + (x.columns.length + 1) * x.thickness - o.w) < 1e-9);
});
test('clear heights: openings + boards + drawers fill every bay exactly', () => {
  for (const type of K.TYPES) for (const [w, d] of [[2000, 600], [1200, 450], [600, 600], [2400, 350]]) {
    const o = { w, d }, c = K.defaultCabinet(type, o); if (K.validate(o, c).length) continue;
    const inner = K.cavity(o, c);
    for (const b of K.bays(o, c)) assert.ok(Math.abs(K.openings(o, c, b).reduce((s, x) => s + x.height, 0) + b.shelves.length * c.thickness + b.drawers * b.drawerHeight - inner.height) < 1e-9);
  }
});

// ---------- plan geometry, rotations ----------
test('cabinet frame → plan uses the RUBIK footprint convention (clockwise, y down) at any rotation', () => {
  for (const rot of [0, 37, 90, 180, 270, 359]) {
    const o = { position: { x: 1234, y: 567 }, size: { widthMm: 2000, depthMm: 600 }, rotationDeg: rot };
    const corners = K.toPlan(o, [{ x: -1000, y: -300 }, { x: 1000, y: -300 }, { x: 1000, y: 300 }, { x: -1000, y: 300 }]);
    T.footprint(o).forEach((p, i) => { assert.ok(Math.abs(p.x - corners[i].x) < 1e-9 && Math.abs(p.y - corners[i].y) < 1e-9, `rot ${rot}`); });
    // the donor's toLocal is the inverse transform
    const f = { cx: 1234, cy: 567, rot }, local = D.toLocal(corners[2].x, corners[2].y, f);
    assert.ok(Math.abs(local.x - 1000) < 1e-9 && Math.abs(local.y - 300) < 1e-9);
  }
  const rotated = E.propose({ project: SCENARIOS['rotated-east-wall'].project, objectId: 'obj_wardrobe', vertical: SCENARIOS['rotated-east-wall'].vertical }).evidence;
  // body x 3400..4000; hinges sit one board behind the front face (x = 3700 − 282); every leaf sweeps west, into the room
  for (const d of rotated.clearance.doors) { assert.ok(d.plan.sector.every(p => p.x <= 3418 + 1e-6)); assert.ok(Math.min(...d.plan.sector.map(p => p.x)) < 3000); }
});

// ---------- H2: door swing ----------
test('H2 reproduced: the donor door obstacle is an 18 mm slab and only exists while the 3D shows doors open', () => {
  const f = donorF('wardrobe', 2000, 600); f.cx = 0; f.cy = 0;
  assert.equal(D.furnitureObstacles(f).length, 1, 'closed: body only, no swing clearance');
  const sw = K.swing({ w: 2000, d: 600 }, f.cabinet)[0], h = sw.hingeLocal, p = { x: h.x + 0.7 * sw.radiusMm * Math.SQRT1_2, y: h.y + 0.7 * sw.radiusMm * Math.SQRT1_2 };
  f.cabinet.front = 'open';
  assert.equal(D.furnitureObstacles(f).some(r => D.circleRect(p.x, p.y, 0, r)), false, 'a point inside the swept sector is outside every donor obstacle');
  assert.ok(sw.areaMm2.sector > 20 * sw.areaMm2.donorSlab);
  // sector ⊂ RUBIK square and its radius reaches the leaf corner
  assert.ok(sw.sector.every(q => q.x >= Math.min(...sw.square.map(s => s.x)) - 1e-9 && q.x <= Math.max(...sw.square.map(s => s.x)) + 1e-9 && q.y >= h.y - 1e-9 && q.y <= h.y + sw.radiusMm + 1e-9));
  assert.ok(Math.abs(sw.radiusMm - Math.hypot(sw.leafMm, 18)) < 1e-9);
});
test('H2 at scene level: a nightstand in the swing is seen by the evidence, not by the donor nor by RUBIK today', () => {
  const c = X.compare(SCENARIOS['nightstand-in-swing']);
  assert.deepEqual(c.donor.furnitureInClearance, { closed: [], open: [] });
  assert.deepEqual(c.rubikToday.placementProblems, []);
  assert.deepEqual(c.evidence.furnitureInClearance, ['obj_nightstand']);
  assert.deepEqual(c.evidence.findings, { doorSquare: ['furniture:obj_nightstand'], doorSector: ['furniture:obj_nightstand'], drawers: [] });
  assert.equal(c.evidence.summary, 'issues');
});
test('door swing in a narrow corridor is reported through RUBIK placement (room + wall), never applied', () => {
  const e = E.propose({ ...SCENARIOS['narrow-corridor'], objectId: 'obj_shoecab' }).evidence;
  assert.deepEqual(e.clearance.findings.doorSquare, ['room:rom_corridor', 'wall:wal_corridor-e']);
  assert.deepEqual(e.clearance.findings.doorSector, ['wall:wal_corridor-e'], 'the exact sector touches the wall; the room exit comes from the conservative square');
  assert.equal(e.previewDiff.applied, false);
});

// ---------- H3: assumed values ----------
test('H3 confirmed: every default is a named donor assumption, independent of any measured input', () => {
  for (const [k, v] of Object.entries(K.ASSUMED)) assert.match(v.source, /donor default @2495d8e/, k);
  for (const [w, d] of [[900, 400], [2000, 600], [3600, 650]]) { const c = K.defaultCabinet('wardrobe', { w, d }); assert.deepEqual([c.thickness, c.back, c.frontGap, c.plinth, c.height], [18, 9, 20, 80, 2200]); }
  const e = E.propose({ ...SCENARIOS['bedroom-default'] }).evidence;
  assert.equal(e.cabinet.status, 'proposed-default');
  assert.deepEqual(e.cabinet.assumptions.map(a => a.key), Object.keys(K.ASSUMED));
  const declared = E.propose({ ...SCENARIOS['drawers-across-hinge'] }).evidence;
  assert.equal(declared.cabinet.status, 'declared');
  assert.ok(declared.cabinet.assumptions.every(a => ['drawerAllowancesMm', 'drawerTravel', 'doorLeafRevealMm', 'doorOpeningDeg'].includes(a.key)), 'hardware stays assumed even for a declared layout');
});

// ---------- H4: ceiling height ----------
test('H4 reproduced: the donor ceiling comes from view calibration (default 2400, clamped ≥ 2100); the evidence uses only a given reference', () => {
  assert.equal(D.defaults().ceilingHeight, 2400);
  assert.equal(D.viewSettings({ ceilingHeight: 2050 }).ceilingHeight, 2100, 'a real 2050 mm ceiling cannot even be represented');
  const low = X.compare(SCENARIOS['low-ceiling']);
  assert.equal(low.donor.warnsHeight, false, 'donor: 2200 ≤ 2400 calibration → no warning');
  assert.equal(low.evidence.fits, false); assert.equal(low.evidence.marginMm, -50);
  const unknown = E.propose({ ...SCENARIOS['unknown-ceiling'] }).evidence;
  assert.equal(unknown.height.fits, null); assert.equal(unknown.height.vertical.status, 'unknown');
  assert.match(unknown.notEvaluated[0], /^altura libre/);
  const derived = E.propose({ ...SCENARIOS['derived-vertical'] }).evidence;
  // closure cut: a level-floor reference is not comparable with an object on the finished floor without the floor finish
  assert.equal(derived.height.vertical.status, 'derived'); assert.deepEqual(derived.height.check, { status: 'pending', reason: 'reference-not-comparable' });
  assert.equal(derived.height.fits, null); assert.equal(derived.height.topMm, 2200);
  const invalid = E.propose({ ...SCENARIOS['bedroom-default'], vertical: { clearHeightMm: 2500.5, reference: 'finished-floor' } }).evidence;
  assert.equal(invalid.height.vertical.status, 'invalid'); assert.equal(invalid.height.fits, null);
});

// ---------- CabinetEvidenceV1 ----------
test('evidence invariants hold for every scenario and are deterministic and serialisable', () => {
  for (const [id, s] of Object.entries(SCENARIOS)) {
    assert.doesNotThrow(() => C.validate(s.project, { strict: true }), id);
    const before = JSON.stringify(s.project), r1 = E.propose({ ...s }), r2 = E.propose({ ...s });
    assert.equal(JSON.stringify(s.project), before, id + ': project untouched');
    assert.equal(JSON.stringify(r1), JSON.stringify(r2), id + ': deterministic');
    if (!r1.ok) { assert.equal(id, 'not-a-cabinet'); assert.equal(r1.error.code, 'not-a-cabinet'); continue; }
    assert.deepEqual(E.validate(r1.evidence), [], id);
    assert.deepEqual(JSON.parse(JSON.stringify(r1.evidence)), r1.evidence, id + ': JSON round trip');
    assert.equal(r1.evidence.canonical, false);
  }
});
test('evidence validator rejects incoherent evidence', () => {
  const e = E.propose({ ...SCENARIOS['bedroom-default'] }).evidence, bad = f => { const x = clone(e); f(x); return E.validate(x); };
  assert.ok(bad(x => x.previewDiff.applied = true).includes('applied'));
  assert.ok(bad(x => x.canonical = true).includes('canonical'));
  assert.ok(bad(x => x.previewDiff.candidates.push({ op: 'would-set', status: 'blocked', blockers: [], pendingOn: [], independentIssues: [] })).includes('candidate-op-status'));
  assert.ok(bad(x => x.computed.bays[0].widthMm += 5).includes('computed-mismatch'));
  assert.ok(bad(x => x.height.fits = null).includes('vertical-fits'));
});
test('previewDiff: the interior is blocked by the canonical schema; size.heightMm is only a reviewable candidate', () => {
  const blocked = E.propose({ ...SCENARIOS['bedroom-default'] }).evidence.previewDiff.candidates;
  assert.deepEqual(blocked.map(c => [c.id, c.op, c.status]), [['interior', 'none', 'blocked']]);
  assert.deepEqual(blocked[0].blockers, [{ kind: 'schema', code: 'no-canonical-field' }]);
  const mismatch = E.propose({ ...SCENARIOS['height-mismatch'] }).evidence.previewDiff.candidates;
  assert.deepEqual(mismatch[0], { id: 'object-height', path: '/objects/0/size/heightMm', op: 'would-set', status: 'candidate-reviewable', from: 2400, to: 2200, blockers: [], pendingOn: [], independentIssues: [], reason: mismatch[0].reason });
  const schema = require('../js/project-schema.js');
  const s = JSON.stringify(schema); assert.ok(!/"cabinet"/.test(s), 'FloorPlanProjectV1 has no cabinet field (unchanged)');
});
test('hinge/drawer conflicts are reported; the default layout never creates one', () => {
  const e = E.propose({ ...SCENARIOS['drawers-across-hinge'] }).evidence;
  assert.deepEqual(e.computed.hingeDrawerConflicts, [2]);
  for (const type of K.TYPES) for (let w = 600; w <= 4800; w += 300) { const o = { w, d: 600 }, c = K.defaultCabinet(type, o); if (!K.validate(o, c).length) assert.deepEqual(K.drawerDoorConflicts(o, c), [], `${type} ${w}`); }
});
test('RUBIK today: the box is placed by FloorPlanPlacement, drawn at a fixed height, with no interior and no swing', () => {
  const e = E.propose({ ...SCENARIOS['height-mismatch'] }).evidence;
  assert.equal(e.rubikToday.drawn3dHeightMm, 2200); assert.equal(e.rubikToday.placementChecksHeight, false);
  assert.ok(PL.NOT_CHECKED.includes('altura libre'));
  const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(index, /if \(f\.type === 'wardrobe'\)\{\n\s+const h = 2\.2,/);
  assert.equal(E.propose({ ...SCENARIOS['tallcab-kitchen'] }).evidence.rubikToday.drawn3dHeightMm, null);
});

// ---------- guards ----------
test('guards: lab isolated from the product, no external requests, no product file references the lab', () => {
  assert.match(fs.readFileSync(path.join(__dirname, '..', '.vercelignore'), 'utf8'), /^labs\/$/m);
  const page = fs.readFileSync(path.join(L, 'index.html'), 'utf8');
  assert.doesNotMatch(page, /https?:\/\/(?!www\.w3\.org)/, 'lab page loads nothing from the network');
  for (const f of ['index.html', 'js/furniture-placement.js', 'js/project-core.js', 'js/generic-catalog.js']) assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), /sculpt\/r03|RubikCabinet/, f);
});

// =====================================================================================================================
// CLOSURE CUT (11/11/2026). Regression tests written BEFORE the fix and run against 964072d in an isolated copy.
// Tags: [A-repro]/[B-repro]/[C-repro] target the audited defects; [nuevo] covers a capability that did not exist.
// =====================================================================================================================
const util = require('util');
const scen = (base, patch = () => {}) => { const s = structuredClone(SCENARIOS[base]); patch(s); return s; };
const ev = s => E.propose({ ...s }).evidence;
const heightCandidate = e => (e.previewDiff.candidates || []).find(c => /\/size\/heightMm$/.test(c.path || ''));
const safeValidate = (e, ctx) => { try { return E.validate(e, ctx); } catch (err) { return 'THROWS: ' + err.constructor.name + ': ' + err.message; } };
const declared = (clearHeightMm, extra = {}) => ({ status: 'declared', clearHeightMm, reference: 'finished-floor', source: 'escenario de prueba', ...extra });
const COMBOS = {
  'mismatch-low-ceiling': scen('height-mismatch', s => { s.vertical = declared(2150); }),
  'mismatch-unknown-ceiling': scen('height-mismatch', s => { s.vertical = null; }),
  'mismatch-in-swing': scen('nightstand-in-swing', s => { s.project.objects[0].size.heightMm = 2400; }),
  'mismatch-invalid-interior': scen('invalid-shelves', s => { s.project.objects[0].size.heightMm = 2400; }),
  'mismatch-reviewable': scen('height-mismatch')
};

// ---------- A · vertical invariants ----------
test('[A-repro] low-ceiling: the expected result stays (2200 in 2150 → does not fit, −50)', () => {
  const e = ev(SCENARIOS['low-ceiling']);
  assert.equal(e.height.fits, false); assert.equal(e.height.marginMm, -50); assert.equal(e.height.topMm, 2200);
});
for (const [name, f] of [
  ['fits:true when it does not fit (low-ceiling)', e => { e.height.fits = true; }],
  ['marginMm changed arbitrarily', e => { e.height.marginMm = 300; }],
  ['topMm manipulated', e => { e.height.topMm = 2000; }],
  ['cabinetHeightMm different from the height used', e => { e.height.cabinetHeightMm = 2100; }],
  ['elevation without correspondence with the object', e => { e.height.elevationMm = 300; }],
  ['marginMm NaN serialised to null by JSON', e => { e.height.marginMm = NaN; return JSON.parse(JSON.stringify(e)); }],
  ['fits Infinity', e => { e.height.fits = Infinity; }],
  ['vertical clearHeightMm replaced after the fact', e => { e.height.vertical.clearHeightMm = 2600; }]
]) test('[A-repro] validate rejects a manipulated vertical result: ' + name, () => {
  let e = ev(SCENARIOS['low-ceiling']); e = f(e) || e;
  const r = safeValidate(e);
  assert.ok(Array.isArray(r), String(r)); assert.ok(r.length > 0, 'accepted as valid: ' + name);
});
test('[A-repro] fits:false when it fits (bedroom-default) is rejected', () => {
  const e = ev(SCENARIOS['bedroom-default']); e.height.fits = false;
  const r = safeValidate(e); assert.ok(Array.isArray(r) && r.length > 0);
});
test('[A-repro] a level-floor reference is not compared with a finished-floor object without a floor finish: pending, no invented fit', () => {
  const e = ev(SCENARIOS['derived-vertical']);
  assert.equal(e.height.fits, null); assert.equal(e.height.marginMm, null);
});
test('[A-repro] a declared height without a stated source is not treated as verifiable', () => {
  const e = ev(scen('bedroom-default', s => { s.vertical = { clearHeightMm: 2500, reference: 'finished-floor' }; }));
  assert.notEqual(e.height.vertical.source, 'not stated'); assert.equal(e.height.fits, null);
});
test('[A-repro] a non-finite object elevation never produces a fit verdict', () => {
  const e = ev(scen('bedroom-default', s => { s.project.objects[0].elevationMm = NaN; }));
  assert.equal(e.height.fits, null); assert.equal(e.height.topMm, null);
});
test('[A-repro] an object heightMm that the canonical contract rejects is not reported as a plain difference', () => {
  for (const bad of [2200.5, -1, 'alto', NaN]) {
    const e = ev(scen('bedroom-default', s => { s.project.objects[0].size.heightMm = bad; }));
    assert.equal(e.height.objectHeightConsistency, 'object-height-invalid', String(bad));
  }
});
test('[A-repro] non-finite or missing clear heights are invalid or unknown, never zero (protection that already existed)', () => {
  for (const v of [NaN, Infinity, -Infinity, null, undefined, 0, -10]) {
    const e = ev(scen('bedroom-default', s => { s.vertical = { status: 'declared', clearHeightMm: v, reference: 'finished-floor', source: 'x' }; }));
    assert.equal(e.height.fits, null, String(v)); assert.equal(e.height.vertical.clearHeightMm, null, String(v));
  }
  assert.equal(ev(SCENARIOS['unknown-ceiling']).height.vertical.status, 'unknown');
});

// ---------- B · robustness of validate() ----------
const B_CASES = [
  ['whole evidence null', () => null], ['evidence is an array', () => []], ['evidence is a string', () => 'x'],
  ['cabinet null', e => { e.cabinet = null; }], ['cabinet.spec null', e => { e.cabinet.spec = null; }], ['cabinet.issues null', e => { e.cabinet.issues = null; }],
  ['cabinet.issues is an object', e => { e.cabinet.issues = {}; }], ['object null', e => { e.object = null; }], ['object.size null', e => { e.object.size = null; }],
  ['object.size is an array', e => { e.object.size = [2000, 600]; }], ['computed null (valid cabinet)', e => { e.computed = null; }], ['computed.cavity null', e => { e.computed.cavity = null; }],
  ['computed.bays null', e => { e.computed.bays = null; }], ['computed.bays is an object', e => { e.computed.bays = { 0: {} }; }], ['computed.fronts null', e => { e.computed.fronts = null; }],
  ['clearance null', e => { e.clearance = null; }], ['clearance.doors null', e => { e.clearance.doors = null; }], ['clearance.drawers is a string', e => { e.clearance.drawers = 'x'; }],
  ['height null', e => { e.height = null; }], ['height.vertical null', e => { e.height.vertical = null; }], ['previewDiff null', e => { e.previewDiff = null; }],
  ['previewDiff.candidates null', e => { e.previewDiff.candidates = null; }], ['previewDiff.candidates is an object', e => { e.previewDiff.candidates = { a: 1 }; }],
  ['notEvaluated null', e => { e.notEvaluated = null; }], ['door plan with non-finite coordinates', e => { e.clearance.doors[0].plan.sector[3].x = NaN; }],
  ['empty door polygon', e => { e.clearance.doors[0].plan.square = []; }], ['malformed polygon (numbers)', e => { e.clearance.doors[0].plan.sector = [1, 2, 3]; }],
  ['unknown cabinet status', e => { e.cabinet.status = 'perfect'; }], ['candidate without op', e => { delete e.previewDiff.candidates[0].op; }],
  ['candidate without status', e => { delete e.previewDiff.candidates[0].status; }], ['bay width as a string', e => { e.computed.bays[0].widthMm = '642'; }],
  ['cabinet.spec columns not an array', e => { e.cabinet.spec.columns = 3; }]
];
for (const [name, f] of B_CASES) test('[B-repro] validate() answers with stable codes, without throwing: ' + name, () => {
  const base = ev(SCENARIOS['nightstand-in-swing']); let e = structuredClone(base); const out = f(e); if (out !== undefined) e = out;
  const snapshot = structuredClone(e), r1 = safeValidate(e), r2 = safeValidate(e);
  assert.ok(Array.isArray(r1), String(r1));
  assert.ok(r1.length > 0, 'incomplete evidence accepted as valid');
  assert.ok(r1.every(c => typeof c === 'string' && c !== 'validator-exception'), JSON.stringify(r1));
  assert.deepEqual(r1, r2, 'deterministic');
  assert.ok(util.isDeepStrictEqual(e, snapshot), 'validate() must not modify its input');
});
test('[B-repro] computed values are checked against the pure engine, not only against each other', () => {
  const e = ev(SCENARIOS['bedroom-default']);
  e.computed.bays[0].widthMm += 5; e.computed.bays[1].widthMm -= 5;   // still balanced, but false
  assert.ok(safeValidate(e).length > 0);
  const g = ev(SCENARIOS['bedroom-default']); g.computed.cavity.depth = 999;
  assert.ok(safeValidate(g).length > 0);
});

// ---------- C · previewDiff ----------
test('[C-repro] taller object + ceiling too low → the height candidate is blocked (no would-set)', () => {
  const c = heightCandidate(ev(COMBOS['mismatch-low-ceiling']));
  assert.equal(c.status, 'blocked'); assert.notEqual(c.op, 'would-set');
});
test('[C-repro] taller object + unknown ceiling → pending, not presented as accepted', () => {
  const c = heightCandidate(ev(COMBOS['mismatch-unknown-ceiling']));
  assert.equal(c.status, 'pending'); assert.notEqual(c.op, 'would-set');
});
test('[C-repro] a blocked candidate manipulated into candidate-reviewable is rejected', () => {
  const e = ev(COMBOS['mismatch-low-ceiling']), c = heightCandidate(e);
  c.status = 'candidate-reviewable'; c.op = 'would-set';
  assert.ok(safeValidate(e).length > 0);
});
test('[C-repro] a pending candidate manipulated into candidate-reviewable is rejected', () => {
  const e = ev(COMBOS['mismatch-unknown-ceiling']), c = heightCandidate(e);
  c.status = 'candidate-reviewable'; c.op = 'would-set';
  assert.ok(safeValidate(e).length > 0);
});
test('[C-repro] the level-floor reference does not make the height candidate reviewable', () => {
  const c = heightCandidate(ev(scen('derived-vertical', s => { s.project.objects[0].size.heightMm = 2400; })));
  assert.equal(c.status, 'pending');
});
test('[C-repro] a placement / swing problem is reported next to the height candidate, not hidden', () => {
  const e = ev(COMBOS['mismatch-in-swing']), c = heightCandidate(e);
  assert.ok(Array.isArray(c.independentIssues) && c.independentIssues.some(i => i.kind === 'door-swing-square'), JSON.stringify(c));
  assert.notEqual(e.summary?.state, 'clear');
});
test('[nuevo] invalid interior + different object height → explicit blocked candidate (the old code omitted it)', () => {
  const c = heightCandidate(ev(COMBOS['mismatch-invalid-interior']));
  assert.ok(c, 'candidate present'); assert.equal(c.status, 'blocked'); assert.equal(c.op, 'none');
  assert.ok(c.blockers.some(b => b.code === 'cabinet-invalid'));
});
test('a reviewable candidate without blockers stays reviewable (would-set, never applied)', () => {
  const e = ev(COMBOS['mismatch-reviewable']), c = heightCandidate(e);
  assert.equal(c.status, 'candidate-reviewable'); assert.equal(c.op, 'would-set'); assert.equal(e.previewDiff.applied, false);
});

// ---------- closure: scenario matrix, context re-derivation, fixtures ----------
test('the lab fixtures carry the same combinations the tests build independently', () => {
  // 'mismatch-reviewable' is the existing 'height-mismatch' scenario itself; the other four exist in the fixtures
  assert.deepEqual(COMBOS['mismatch-reviewable'], SCENARIOS['height-mismatch']);
  for (const k of Object.keys(COMBOS).filter(k => k !== 'mismatch-reviewable')) { const a = structuredClone(SCENARIOS[k]), b = structuredClone(COMBOS[k]); delete a.title; delete b.title; assert.deepEqual(a, b, k); }
});
const MATRIX = {
  'bedroom-default': ['clear', null], 'rotated-east-wall': ['clear', null], 'low-ceiling': ['issues', null], 'unknown-ceiling': ['clear-with-pending', null],
  'invalid-shelves': ['invalid', null], 'nightstand-in-swing': ['issues', null], 'narrow-corridor': ['issues', null], 'height-mismatch': ['clear', 'candidate-reviewable'],
  'derived-vertical': ['clear-with-pending', null], 'mismatch-low-ceiling': ['issues', 'blocked'], 'mismatch-unknown-ceiling': ['clear-with-pending', 'pending'],
  'mismatch-in-swing': ['issues', 'candidate-reviewable'], 'mismatch-invalid-interior': ['invalid', 'blocked']
};
for (const [id, [state, height]] of Object.entries(MATRIX)) test(`[C] scenario matrix: ${id} → summary ${state}, height candidate ${height ?? 'none'}`, () => {
  const s = SCENARIOS[id], before = structuredClone(s.project), e = ev(s), c = heightCandidate(e);
  assert.equal(e.summary.state, state); assert.equal(c ? c.status : null, height);
  if (c) assert.equal(c.op, c.status === 'candidate-reviewable' ? 'would-set' : 'none');
  assert.equal(e.previewDiff.applied, false);
  assert.ok(e.previewDiff.candidates.some(k => k.id === 'interior' && k.status === 'blocked' && k.op === 'none'));
  assert.ok(util.isDeepStrictEqual(s.project, before), 'project untouched');
  assert.deepEqual(E.validate(e), []); assert.deepEqual(E.validate(e, { ...s }), [], 'full re-derivation with the project');
  assert.deepEqual(ev(s), e, 'reproducible');
});
test('[C] a candidate keeps placement and swing issues separate, with their authority, and does not let them decide the height', () => {
  const c = heightCandidate(ev(SCENARIOS['mismatch-in-swing']));
  assert.deepEqual(c.blockers, []); assert.deepEqual(c.pendingOn, []);
  assert.deepEqual(c.independentIssues.map(i => [i.kind, i.items]), [['door-swing-square', ['furniture:obj_nightstand']], ['door-swing-sector', ['furniture:obj_nightstand']]]);
  assert.match(c.independentIssues[1].authority, /experimental/);
  const low = heightCandidate(ev(SCENARIOS['mismatch-low-ceiling']));
  assert.deepEqual(low.blockers, [{ kind: 'vertical', code: 'does-not-fit', marginMm: -50 }]);
  const inv = heightCandidate(ev(SCENARIOS['mismatch-invalid-interior']));
  assert.deepEqual(inv.blockers.map(b => b.code), ['cabinet-invalid']); assert.equal(inv.to, 2200);
});
test('[C] the conservative square and the exact sector are reported separately (a square-only finding is not a sector collision)', () => {
  const e = ev(SCENARIOS['narrow-corridor']);
  assert.ok(e.clearance.findings.doorSquare.includes('room:rom_corridor'));
  assert.ok(!e.clearance.findings.doorSector.includes('room:rom_corridor'));
  assert.deepEqual(e.summary.experimental.map(x => x.kind), ['door-swing-sector']);
  assert.match(e.clearance.interpretation, /conservador/);
});
test('validate(e, context) re-derives everything, including results that need the project', () => {
  const s = SCENARIOS['narrow-corridor'], e = ev(s);
  e.rubikToday.placementProblems = ['room:rom_corridor']; // forged, but internally plausible
  const r = E.validate(e, { ...s });
  assert.ok(r.includes('recomputed-mismatch'), JSON.stringify(r));
  assert.ok(E.validate(ev(s), { ...s, vertical: declared(2100) }).includes('recomputed-mismatch'), 'evidence produced with another reference');
});
test('readVertical distinguishes unknown, invalid (with a stable problem), unsourced and sourced references', () => {
  assert.equal(E.readVertical(null).status, 'unknown');
  assert.deepEqual(E.readVertical([]), { status: 'invalid', clearHeightMm: null, reference: null, source: null, problem: 'not-an-object' });
  assert.equal(E.readVertical({ status: 'guessed', clearHeightMm: 2500, reference: 'finished-floor', source: 'x' }).problem, 'status');
  assert.equal(E.readVertical({ clearHeightMm: 2500, reference: 'ceiling' , source: 'x' }).problem, 'reference');
  assert.deepEqual(E.readVertical({ clearHeightMm: 2500, reference: 'finished-floor', source: 'not stated' }), { status: 'unsourced', clearHeightMm: 2500, reference: 'finished-floor', source: null, claimed: 'declared' });
  assert.equal(E.readVertical({ clearHeightMm: 2500, reference: 'finished-floor', source: '  ' }).status, 'unsourced');
  assert.equal(E.readVertical(declared(2500)).status, 'declared');
  const elevated = ev(scen('bedroom-default', s => { s.project.objects[0].elevationMm = 400; }));
  assert.deepEqual([elevated.height.topMm, elevated.height.fits, elevated.height.marginMm], [2600, false, -100], 'elevation counts in the top');
  assert.deepEqual(E.validate(elevated), []);
});
