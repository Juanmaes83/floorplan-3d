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
  assert.deepEqual(c.evidence.blockedBy, ['furniture:obj_nightstand']);
});
test('door swing in a narrow corridor is reported through RUBIK placement (room + wall), never applied', () => {
  const e = E.propose({ ...SCENARIOS['narrow-corridor'], objectId: 'obj_shoecab' }).evidence;
  assert.deepEqual(e.clearance.blockedBy, ['room:rom_corridor', 'wall:wal_corridor-e']);
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
  assert.equal(derived.height.vertical.status, 'derived'); assert.equal(derived.height.marginMm, 550);
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
  assert.ok(bad(x => x.previewDiff.candidates.push({ op: 'would-set', status: 'blocked' })).includes('blocked-op'));
  assert.ok(bad(x => x.computed.bays[0].widthMm += 5).includes('width-balance'));
  assert.ok(bad(x => x.height.fits = null).includes('fits-vs-vertical'));
});
test('previewDiff: the interior is blocked by the canonical schema; size.heightMm is only a reviewable candidate', () => {
  const blocked = E.propose({ ...SCENARIOS['bedroom-default'] }).evidence.previewDiff.candidates;
  assert.deepEqual(blocked.map(c => [c.op, c.status]), [['none', 'blocked']]);
  const mismatch = E.propose({ ...SCENARIOS['height-mismatch'] }).evidence.previewDiff.candidates;
  assert.deepEqual(mismatch[0], { path: '/objects/0/size/heightMm', op: 'would-set', from: 2400, to: 2200, status: 'candidate-reviewable', reason: mismatch[0].reason });
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
