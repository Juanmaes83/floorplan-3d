// SCULPT-R02-A normalized · B2/B3: review session (js/r02a-ceiling-session.js) and candidate persistence
// (js/r02a-ceiling-contract.js) over the lab core. Synthetic data only: the lab scenarios of #193 and RUBIK's reference flat.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/r02a-ceiling-session.js');
const X = require('../js/r02a-ceiling-contract.js');
const E = require('../js/r02a-ceiling-core.js');
const Core = require('../js/project-core.js');
const Building = require('../js/building-core.js');
const F = require('../labs/sculpt/r02a-normalized/fixtures/ceiling-scenarios.js');

const REF = { clearHeightMm: 2600, reference: 'finished-floor', source: 'medición sintética de prueba' };
const sc = name => F.scenario(name);
const ev = (name, over = {}) => { const s = sc(name); return S.evaluate({ project: s.project, ceiling: s.ceiling, request: s.requests[0], accepted: s.requests.slice(1), ...over }); };
const deepFreeze = v => { if (v && typeof v === 'object') { Object.freeze(v); for (const k of Object.keys(v)) deepFreeze(v[k]); } return v; };
// RUBIK's reference flat with synthetic heights on a few floor objects (bed 500, wardrobes 2200).
function flat() { const p = Core.initial(); for (const o of p.objects) { if (o.type === 'bed') o.size.heightMm = 500; if (o.type === 'wardrobe') o.size.heightMm = 2200; } return p; }

test('B3 states: candidate-reviewable, pending (missing reference or data) and blocked, each explained in Spanish', () => {
  const ok = ev('rect-ceiling-light');
  assert.equal(ok.state, 'candidate-reviewable'); assert.match(ok.explanation[0], /Revisable/); assert.match(ok.explanation[1], /arriba 2600 mm, abajo 2500 mm/);
  const unknown = ev('unknown-ceiling');
  assert.equal(unknown.state, 'pending'); assert.match(unknown.explanation[0], /Pendiente de datos: falta un dato vertical/);
  const s = sc('rect-ceiling-light'), noDrop = S.evaluate({ project: s.project, ceiling: s.ceiling, request: { ...s.requests[0], dropMm: undefined } });
  assert.equal(noDrop.state, 'pending', 'no drop → pending, never a default');
  const tall = ev('curtain-track', { request: { ...sc('curtain-track').requests[0], curtainLengthMm: 2600 } });
  assert.equal(tall.state, 'blocked'); assert.ok(tall.reasons.includes('exceeds-clear-height')); assert.match(tall.explanation[0], /superan la altura libre/);
});

test('B3 insufficient height: a drop that leaves no room is blocked; a stated lower reference changes the verdict', () => {
  const s = sc('rect-ceiling-light'), q = { ...s.requests[0], dropMm: 2550 };
  assert.equal(S.evaluate({ project: s.project, ceiling: s.ceiling, request: q }).state, 'blocked');
  const pendant = { id: 'p1', type: 'pendant', position: { x: 2000, y: 1500 }, dropMm: 0 };
  const hi = S.evaluate({ project: s.project, ceiling: REF, request: pendant }), lo = S.evaluate({ project: s.project, ceiling: { ...REF, clearHeightMm: 500 }, request: pendant });
  assert.equal(hi.state, 'candidate-reviewable'); assert.equal(lo.state, 'blocked');
});

test('B3 missing or unusable references: unknown, unsourced, contradictory and level-floor are never turned into a height', () => {
  const s = sc('rect-ceiling-light'), q = s.requests[0];
  assert.equal(S.evaluate({ project: s.project, ceiling: null, request: q }).vertical.status, 'unknown');
  const unsourced = S.evaluate({ project: s.project, ceiling: { clearHeightMm: 2600, reference: 'finished-floor', source: '' }, request: q });
  assert.equal(unsourced.ok, false); assert.match(unsourced.explanation[0], /ceiling-declaration-invalid/);
  const b = sc('two-levels');
  const contradictory = S.evaluate({ building: b.building, levelId: 'lvl_g', ceiling: { ...REF, reference: 'level-floor' }, request: b.requests[0] });
  assert.equal(contradictory.vertical.status, 'contradictory'); assert.equal(contradictory.state, 'pending');
  const derived = S.evaluate({ building: b.building, levelId: 'lvl_g', request: b.requests[0] });
  assert.equal(derived.vertical.status, 'derived'); assert.equal(derived.vertical.reference, 'level-floor');
});

test('B3 interferences: two items clash in 3D (blocked), plan-only overlap clears, floor objects clash or report unknown height', () => {
  const t = sc('two-interfering');
  const clash = S.evaluate({ project: t.project, ceiling: t.ceiling, request: t.requests[1], accepted: [t.requests[0]] });
  assert.equal(clash.state, 'blocked'); assert.ok(clash.reasons.some(r => r.startsWith('overlap-3d-with')));
  assert.match(clash.explanation[0], /choca en altura con «pendant-1»/);
  const f = sc('floor-layer');
  const overWardrobe = S.evaluate({ project: f.project, ceiling: f.ceiling, request: f.requests[0] });
  assert.equal(overWardrobe.state, 'blocked'); assert.match(overWardrobe.explanation[0], /obj_wardrobe/);
  const overTable = S.evaluate({ project: f.project, ceiling: f.ceiling, request: f.requests[1] });
  assert.equal(overTable.state, 'pending'); assert.ok(overTable.reasons.includes('floor-object-height-unknown:obj_table'));
});

test('B3 partially invalid proposals: one bad request refuses the batch atomically with a code; the good ones are not half-applied', () => {
  const s = sc('rect-ceiling-light');
  const bad = S.evaluate({ project: s.project, ceiling: s.ceiling, request: { ...s.requests[0], id: 'x2', size: { widthMm: -5, depthMm: 100, heightMm: 100 } }, accepted: [s.requests[0]] });
  assert.equal(bad.ok, false); assert.match(bad.explanation[0], /invalid-size/);
  for (const r of [{ ...s.requests[0], position: { x: NaN, y: 0 } }, { ...s.requests[0], type: 'sprinkler' }, { ...s.requests[0], dropMm: -1 }, { ...s.requests[0], curtainLengthMm: 900 }])
    assert.equal(S.evaluate({ project: s.project, ceiling: s.ceiling, request: r }).ok, false, JSON.stringify(r));
});

test('B2 containment (not evaluated by the core): a footprint that crosses into another room through an opening is blocked', () => {
  const p = flat(), hall = p.rooms.find(r => r.id === 'rom_hall');
  // A wide ceiling light centred in the hall's narrow part, close to the living room boundary at y = 6610.
  const req = { id: 'cei_hall-1', type: 'ceilinglight', position: { x: 5450, y: 6560 }, size: { widthMm: 600, depthMm: 600, heightMm: 100 }, dropMm: 0 };
  const e = S.evaluate({ project: p, ceiling: REF, request: req });
  assert.ok(e.ok); assert.equal(e.proposal.roomId, 'rom_hall');
  assert.equal(S.contained(e.proposal, hall), false);
  assert.equal(e.containment, 'leaves-room'); assert.equal(e.state, 'blocked'); assert.equal(e.reasons[0], 'footprint-leaves-room');
  const inside = S.evaluate({ project: p, ceiling: REF, request: { ...req, position: { x: 5450, y: 5000 } } });
  assert.equal(inside.containment, 'inside');
});

test('B2 alternatives: reviewable positions in the same room, nearest first, each one re-checked by the core; none when height is the problem', () => {
  const p = flat();
  // Over the master bed (500 high) a 2300 mm pendant with a 0 drop leaves 2600 − 2300 = 300 < 500: clash.
  const req = { id: 'cei_pend-1', type: 'pendant', position: { x: 8300, y: 1000 }, size: { widthMm: 400, depthMm: 400, heightMm: 2300 }, dropMm: 0 };
  const e = S.evaluate({ project: p, ceiling: REF, request: req });
  assert.equal(e.state, 'blocked'); assert.ok(e.reasons.some(r => r.startsWith('clash-with-floor-object')));
  const t0 = process.hrtime.bigint(), alt = S.alternatives({ project: p, ceiling: REF, request: req }, { max: 3 });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  assert.ok(alt.ok && alt.alternatives.length === 3, JSON.stringify(alt).slice(0, 300));
  assert.equal(alt.roomId, 'rom_master');
  for (const a of alt.alternatives) { assert.equal(a.evaluation.state, 'candidate-reviewable'); assert.equal(a.evaluation.proposal.roomId, 'rom_master'); assert.equal(a.evaluation.containment, 'inside'); }
  const d = alt.alternatives.map(a => a.distanceMm); assert.deepEqual(d, [...d].sort((x, y) => x - y), 'nearest first');
  assert.ok(alt.tried <= alt.grid && alt.grid <= S.LIMITS.gridPoints * 1.2, 'bounded search');
  assert.ok(ms < 1500, `alternatives in ${ms.toFixed(0)} ms`);
  const tooTall = S.alternatives({ project: p, ceiling: REF, request: { ...req, size: { ...req.size, heightMm: 2700 } } });
  assert.equal(tooTall.alternatives.length, 0); assert.equal(tooTall.reason, 'exceeds-clear-height');
  const pending = S.alternatives({ project: p, ceiling: null, request: req });
  assert.equal(pending.reason, 'pending-data');
});

test('B2 compare: before / after of the review set, with the project measured unchanged', () => {
  const p = deepFreeze(flat()), before = JSON.parse(JSON.stringify(p));
  const a = { id: 'cei_a-1' }, b = { id: 'cei_b-1' };
  const c = S.compare({ projectBefore: before, projectAfter: p, before: [a], after: [a, b] });
  assert.deepEqual(c.added, ['cei_b-1']); assert.deepEqual(c.kept, ['cei_a-1']); assert.equal(c.projectUnchanged, true);
  S.alternatives({ project: p, ceiling: REF, request: { id: 'cei_x-1', type: 'ceilinglight', position: { x: 8300, y: 1000 }, dropMm: 0 } });
  assert.equal(JSON.stringify(p), JSON.stringify(before), 'evaluating and searching never touch the project');
});

test('B.4 contract: a confirmed item is re-evaluated, stored, survives JSON and strict building levels; nothing without confirmation', () => {
  let p = flat();
  const req = { id: 'cei_master-1', type: 'ceilinglight', position: { x: 8300, y: 2700 }, dropMm: 0 };
  assert.equal(X.confirmItem(p, req).ok, false, 'no confirmation → refused');
  assert.equal(X.confirmItem(p, req, { confirm: true }).ok, false, 'no stored reference → pending → refused');
  p = X.setVerticalReference(p, { scope: 'room', roomId: 'rom_master', ...REF }).project;
  const w = X.confirmItem(p, req, { confirm: true, confirmedAt: '2026-11-12T10:00:00.000Z' });
  assert.ok(w.ok, JSON.stringify(w.issues)); p = w.project;
  assert.deepEqual(X.verticalFor(p, 'rom_master'), REF); assert.equal(X.verticalFor(p, 'rom_kid'), null, 'no project-wide default');
  const again = Core.prepare(JSON.stringify(p)).project; assert.deepEqual(again, p);
  assert.doesNotThrow(() => Building.validate(Building.create(p)), 'strict building level accepts it');
  // A second item that clashes with the first in 3D is refused on confirmation even if the caller claims otherwise.
  const clash = X.confirmItem(p, { id: 'cei_master-2', type: 'pendant', position: { x: 8300, y: 2700 }, size: { widthMm: 400, depthMm: 400, heightMm: 600 }, dropMm: 0 }, { confirm: true });
  assert.equal(clash.ok, false); assert.equal(clash.issues[0].code, 'not-reviewable');
  assert.equal(X.validateExtension(p).ok, true);
});

test('B.4 contract: future versions read-only, damaged data reported, orphans pruned, other x-* kept', () => {
  const p = flat(); p.extensions = { [X.KEY]: { version: 2, anything: [] }, 'x-other': { a: 1 } };
  assert.equal(X.setVerticalReference(p, { scope: 'project', ...REF }).ok, false);
  let q = X.setVerticalReference(flat(), { scope: 'room', roomId: 'rom_master', ...REF }).project;
  q.extensions['x-other'] = { keep: [1, 2] };
  q = X.confirmItem(q, { id: 'cei_master-1', type: 'ceilinglight', position: { x: 8300, y: 2700 }, dropMm: 0 }, { confirm: true }).project;
  assert.deepEqual(q.extensions['x-other'], { keep: [1, 2] });
  for (const damage of [x => { x.items[0].review = 'auto'; }, x => { x.items[0].position.x = 1.5; }, x => { x.verticalReferences[0].source = ''; }, x => { x.items[0].extra = 1; }, x => { x.items.push(structuredClone(x.items[0])); }]) {
    const d = structuredClone(q); damage(d.extensions[X.KEY]);
    assert.equal(X.validateExtension(d).ok, false); assert.equal(X.confirmItem(d, { id: 'cei_new-1', type: 'ceilinglight', position: { x: 8000, y: 1000 }, dropMm: 0 }, { confirm: true }).ok, false);
  }
  const gone = structuredClone(q); gone.rooms = gone.rooms.filter(r => r.id !== 'rom_master');
  assert.deepEqual(X.orphans(gone).sort(), ['cei_master-1', 'ref:rom_master']);
  const pr = X.prune(gone); assert.equal(pr.ok, true); assert.equal(X.extension(pr.project).status === 'absent' || X.extension(pr.project).items.length === 0, true);
});

test('B guards: nothing in the product loads R02-A; the core is lab #193 verbatim except one require path; extracts byte-identical', () => {
  const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  for (const f of ['r02a-ceiling-core', 'r02a-donor-extracts', 'r02a-ceiling-session', 'r02a-ceiling-contract']) assert.ok(!html.includes(f));
  const sha = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, '..', f))).digest('hex');
  assert.equal(sha('js/r02a-donor-extracts.js'), '9cb9a794fc7427bee6bbeb6a7879b4f170a856eba925a912bb128baebf245f4d', 'same bytes as #193 workshop/donor-ceiling-extracts.js @7d8a626');
  const core = fs.readFileSync(path.join(__dirname, '..', 'js/r02a-ceiling-core.js'), 'utf8').replace("require('./r02a-donor-extracts.js')", "require('./workshop/donor-ceiling-extracts.js')");
  assert.equal(crypto.createHash('sha256').update(core).digest('hex'), '64acd65faa44d0bf70bdc7df62d96cf6ebb9375a56ebe4000f9619014c1e3477', 'same bytes as #193 ceiling-layout-evidence-core.js @7d8a626 once the path is restored');
  assert.ok(!/openai|anthropic|fetch\(|XMLHttpRequest/i.test(fs.readFileSync(path.join(__dirname, '..', 'js/r02a-ceiling-session.js'), 'utf8')));
});
