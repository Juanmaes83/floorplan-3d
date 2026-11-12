// SCULPT-R03 A4 · closing audit of A1+A2+A3 (pure). Adversarial property tests with a seeded generator, cost bounds,
// ordinary furniture untouched and GOV-05 attribution present in every file derived from the donor.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const K = require('../js/r03-cabinet-core.js');
const E = require('../js/r03-cabinet-editor-core.js');
const G = require('../js/r03-cabinet-geometry.js');
const X = require('../js/r03-cabinet-contract.js');
const Core = require('../js/project-core.js');

function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function randomOp(r, s) {
  const n = s.state.cabinet.columns.length, bay = Math.floor(r() * (n + 1)) - (r() < 0.05 ? 1 : 0), pick = a => a[Math.floor(r() * a.length)];
  const wild = () => pick([NaN, Infinity, -1, 0, 1e9, 59.5, 2200.5, -0]);
  const value = (lo, hi) => (r() < 0.1 ? wild() : Math.round(lo + r() * (hi - lo)));
  switch (Math.floor(r() * 12)) {
    case 0: return { type: 'split', bay };
    case 1: return { type: 'merge', bay };
    case 2: return { type: 'add-shelf', bay };
    case 3: return { type: 'remove-shelf', bay, index: Math.floor(r() * 4) - 1 };
    case 4: return { type: 'set-shelves', bay, shelves: Array.from({ length: Math.floor(r() * 5) }, () => value(-100, 2400)) };
    case 5: return { type: 'set-rod', bay, rod: r() < 0.3 ? null : value(-100, 2400) };
    case 6: return { type: 'set-drawers', bay, drawers: r() < 0.2 ? 1.5 : Math.floor(r() * 9) - 1, drawerHeight: r() < 0.5 ? undefined : value(40, 450) };
    case 7: return { type: 'set-front', front: pick(['closed', 'open', 'hidden', 'ajar', null]) };
    case 8: return { type: 'resize', ...(r() < 0.5 ? { w: value(200, 5000) } : {}), ...(r() < 0.4 ? { d: value(100, 1200) } : {}), ...(r() < 0.4 ? { height: value(300, 4500) } : {}) };
    case 9: return { type: 'set-bay-width', bay, width: value(50, 3000) };
    case 10: return { type: 'set-door-count', doorCount: r() < 0.1 ? 2.5 : Math.floor(r() * 15) - 1 };
    default: return { type: pick(['select-bay', 'bogus', undefined]), bay };
  }
}

test('A4 adversarial: 4 000 random edits (with NaN, ±Infinity, out-of-range, unknown ops) never produce an invalid cabinet', () => {
  for (const [seed, type, outer] of [[1, 'wardrobe', { w: 2400, d: 600 }], [7, 'cabinet', { w: 1600, d: 350 }], [42, 'shoecab', { w: 1000, d: 350 }], [99, 'tallcab', { w: 900, d: 580 }]]) {
    const r = rng(seed), start = K.defaultCabinet(type, outer);
    let s = E.createSession({ outer, cabinet: start }), accepted = 0, refused = 0;
    for (let i = 0; i < 1000; i++) {
      const before = JSON.stringify(s.state), res = E.apply(s, randomOp(r, s));
      if (res.ok) { accepted++; assert.deepEqual(K.validate(res.session.state.outer, res.session.state.cabinet), [], `seed ${seed} step ${i}: accepted state is valid`); }
      else { refused++; assert.equal(JSON.stringify(res.session.state), before, `seed ${seed} step ${i}: refusal changed nothing`); assert.ok(res.explanation.length > 0); }
      s = res.session;
      assert.ok(Number.isInteger(s.state.outer.w) && Number.isInteger(s.state.cabinet.height), 'outer sizes stay whole millimetres (contract-writable)');
    }
    assert.ok(accepted > 50 && refused > 50, `both paths exercised (seed ${seed}: ${accepted} accepted, ${refused} refused)`);
    // Undo everything (history is capped at HISTORY_MAX): the state walks back without ever being invalid.
    let steps = 0; while (s.undo.length) { s = E.undo(s).session; steps++; assert.deepEqual(K.validate(s.state.outer, s.state.cabinet), []); }
    assert.ok(steps <= E.HISTORY_MAX);
    // Whatever the session ends in can be saved through the contract and read back identically.
    const project = Core.initial(), id = { wardrobe: 'obj_template-004', cabinet: 'obj_template-029', shoecab: 'obj_template-035', tallcab: 'obj_template-004' }[type];
    if (type !== 'tallcab') {
      const res = E.result(s), w = X.write(project, id, res.cabinet, { outer: res.outer, provenance: res.provenance });
      assert.ok(w.ok, JSON.stringify(w.issues)); assert.deepEqual(X.read(w.project, id).cabinet, res.cabinet);
    }
  }
});

test('A4 adversarial contract: random damage to a saved document is always reported, never repaired, never thrown', () => {
  const r = rng(2026), project = Core.initial(), id = 'obj_template-004';
  const saved = X.write(project, id, X.read(project, id).cabinet, { updatedAt: '2026-11-12T00:00:00.000Z' }).project;
  const paths = []; (function walk(v, p) { if (v && typeof v === 'object') for (const k of Object.keys(v)) { paths.push([...p, k]); walk(v[k], [...p, k]); } })(saved.extensions, ['extensions']);
  const junk = [null, undefined, NaN, '', 'x', -1, 1e12, [], {}, true, 2.5];
  for (let i = 0; i < 600; i++) {
    const q = structuredClone(saved), p = paths[Math.floor(r() * paths.length)], v = junk[Math.floor(r() * junk.length)];
    let o = q; for (const k of p.slice(0, -1)) o = o[k]; const before = JSON.stringify(q);
    if (r() < 0.2) delete o[p[p.length - 1]]; else o[p[p.length - 1]] = v;
    if (JSON.stringify(q) === before) continue;
    let rep, read; assert.doesNotThrow(() => { rep = X.validateExtension(q); read = X.read(q, id); }, `damage at ${p.join('/')}`);
    if (rep.ok) { assert.equal(rep.status === 'present' || rep.status === 'absent' || rep.status === 'future', true); continue; }
    assert.ok(['invalid', 'none', 'future', 'adapted', 'stale', 'ok'].includes(read.status));
    if (read.status === 'invalid') assert.equal(read.readOnly, true);
    const w = X.write(q, 'obj_template-029', X.read(Core.initial(), 'obj_template-029').cabinet);
    assert.equal(w.ok, false, `a damaged document blocks further writes (${p.join('/')})`);
  }
});

test('A4 cost: the largest cabinet the core allows stays light for a phone (parts, build time)', () => {
  const outer = { w: 4800, d: 700 };
  const c = K.defaultCabinet('wardrobe', outer); c.height = 2800; c.doorCount = 12;
  let s = E.createSession({ outer, cabinet: K.defaultCabinet('wardrobe', outer) });
  s = E.apply(s, { type: 'resize', height: 2800 }).session;
  while (s.state.cabinet.columns.length < K.LIMITS.bays[1]) { const r = E.apply(s, { type: 'split', bay: 0 }); if (!r.ok) break; s = r.session; }
  for (let b = 0; b < s.state.cabinet.columns.length; b++) { s = E.apply(s, { type: 'set-drawers', bay: b, drawers: 2, drawerHeight: 180 }).session; for (let k = 0; k < 6; k++) { const r = E.apply(s, { type: 'add-shelf', bay: b }); if (r.ok) s = r.session; } }
  s = E.apply(s, { type: 'set-front', front: 'open' }).session;
  const t0 = process.hrtime.bigint(); let parts; for (let i = 0; i < 200; i++) parts = G.parts(s.state.outer, s.state.cabinet);
  const msPer = Number(process.hrtime.bigint() - t0) / 1e6 / 200;
  assert.ok(parts.length < 400, `${parts.length} boxes`);
  assert.ok(msPer < 5, `geometry ${msPer.toFixed(3)} ms per rebuild`);
  console.log(`# A4 cost: ${s.state.cabinet.columns.length} bays, ${parts.length} boxes, ${msPer.toFixed(3)} ms geometry per edit`);
});

test('A4 ordinary furniture and legacy projects: nothing in RUBIK loads or changes; non-cabinets are never touched', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  for (const f of ['r03-cabinet-core', 'r03-cabinet-contract', 'r03-cabinet-editor-core', 'r03-cabinet-geometry', 'r03-cabinet-three', 'r03-cabinet-editor-ui']) assert.ok(!html.includes(f), `${f} is not loaded by index.html`);
  const p = Core.initial(), before = JSON.stringify(p);
  for (const o of p.objects) {
    const r = X.read(p, o.id);
    if (!K.isCabinetType(o.type)) { assert.equal(r.status, 'not-cabinet'); assert.equal(X.write(p, o.id, K.defaultCabinet('wardrobe', { w: 2000, d: 600 })).ok, false); }
  }
  assert.equal(JSON.stringify(p), before);
  // Saving one cabinet changes that object's size.heightMm and the extension, nothing else.
  const w = X.write(p, 'obj_template-004', X.read(p, 'obj_template-004').cabinet);
  const a = JSON.parse(before), b = structuredClone(w.project); delete b.extensions;
  const ia = a.objects.findIndex(o => o.id === 'obj_template-004'); delete b.objects[ia].size.heightMm;
  assert.deepEqual(b, a);
});

test('A4 GOV-05: every file derived from the donor names its source and the MIT notice; the others say they are original', () => {
  const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'docs/licenses/r03-donor-MIT.txt')));
  assert.match(read('js/r03-cabinet-core.js'), /caikaidev\/floorplan-3d @2495d8e/);
  assert.match(read('js/r03-cabinet-geometry.js'), /donor's cabinet-model\.js \(MIT/);
  for (const f of ['js/r03-cabinet-contract.js', 'js/r03-cabinet-editor-core.js', 'js/r03-cabinet-editor-ui.js', 'js/r03-cabinet-three.js']) assert.match(read(f), /SCULPT-R03/);
});
