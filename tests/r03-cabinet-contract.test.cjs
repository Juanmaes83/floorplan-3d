// SCULPT-R03 A1 · candidate contract `extensions["x-r03-cabinet"]` (js/r03-cabinet-contract.js). Synthetic fixtures only.
// Proves: round-trip JSON and ZIP, legacy projects, future 1.x projects, buildings (strict levels), references and ids,
// invalid data refused, no silent loss, deletion without orphans and atomic refusal. Option 1 (a field inside objects[])
// is exercised on an in-memory copy of the schema to measure its real cost; the canonical schema is never changed.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const K = require('../js/r03-cabinet-core.js');
const X = require('../js/r03-cabinet-contract.js');
const Core = require('../js/project-core.js');
const Building = require('../js/building-core.js');
const Package = require('../js/project-package.js');
const Schema = require('../js/project-schema.js');

const WARDROBE = 'obj_template-004';      // 2400 × 600 in the reference project
const CABINET = 'obj_template-029';       // 1600 × 350
const BED = 'obj_template-001';
const base = () => Core.initial();
const deepFreeze = v => { if (v && typeof v === 'object') { Object.freeze(v); for (const k of Object.keys(v)) deepFreeze(v[k]); } return v; };
const ISO = '2026-11-12T10:00:00.000Z';

function saved(project = base(), id = WARDROBE) {
  const r = X.read(project, id);
  assert.equal(r.status, 'none');
  const split = K.splitBay(r.outer, r.cabinet, 0);
  assert.ok(split.ok);
  const w = X.write(project, id, split.cabinet, { updatedAt: ISO });
  assert.ok(w.ok, JSON.stringify(w.issues));
  return w.project;
}

test('A1 legacy: a project without the extension validates, reads a proposed default and is never written by reading', () => {
  const p = deepFreeze(base());
  const r = X.read(p, WARDROBE);
  assert.equal(r.status, 'none');
  assert.equal(r.saved, false);
  assert.deepEqual(r.provenance, { height: 'assumed-type-default', boards: 'assumed', layout: 'default' });
  assert.equal(r.cabinet.height, K.ASSUMED.heightByTypeMm.value.wardrobe);
  assert.equal(K.validate(r.outer, r.cabinet).length, 0);
  assert.equal(X.validateExtension(p).status, 'absent');
  assert.equal(X.read(p, BED).status, 'not-cabinet');
  assert.equal(X.read(p, 'obj_missing-999').status, 'unknown-object');
  assert.equal(p.extensions, undefined, 'reading never adds the extension');
});

test('A1 the object height is the authority when present; a height no default fits is reported, not replaced', () => {
  const p = base(); p.objects.find(o => o.id === WARDROBE).size.heightMm = 2400;
  const r = X.read(p, WARDROBE);
  assert.equal(r.cabinet.height, 2400); assert.equal(r.provenance.height, 'object-height'); assert.deepEqual(r.issues, []);
  p.objects.find(o => o.id === WARDROBE).size.heightMm = 300;
  const low = X.read(p, WARDROBE);
  assert.equal(low.issues[0].code, 'object-height-unfit');
});

test('A1 round-trip JSON: write → stringify → prepare → read gives the same interior; the object size follows it', () => {
  const p = saved();
  assert.equal(p.extensions[X.KEY].version, 1);
  assert.equal(p.extensions[X.KEY].entries.length, 1);
  const object = p.objects.find(o => o.id === WARDROBE);
  assert.equal(object.size.heightMm, p.extensions[X.KEY].entries[0].cabinet.height, 'object height = cabinet height (one state)');
  const again = Core.prepare(JSON.stringify(p)).project;
  assert.deepEqual(again, p);
  const r = X.read(again, WARDROBE);
  assert.equal(r.status, 'ok');
  assert.deepEqual(r.cabinet, p.extensions[X.KEY].entries[0].cabinet);
  assert.equal(r.cabinet.columns.length, 5, 'the split survives (4 default bays + 1)');
  assert.equal(X.validateExtension(again).ok, true);
});

test('A1 round-trip ZIP (project package of RUBIK): the extension survives encode → unzip → validateEntries', async () => {
  const p = saved();
  const archive = await Package.encode(p, async () => null);
  const entries = await Package.unzip(await archive.arrayBuffer());
  assert.deepEqual([...entries.keys()], ['project.json']);
  const { project } = await Package.validateEntries(entries);
  assert.deepEqual(project.extensions, p.extensions);
  assert.equal(X.read(project, WARDROBE).status, 'ok');
});

test('A1 buildings: a level with interiors passes the strict building validation; ids that look multi-level stay values', () => {
  let p = saved();
  // An object id containing "floor" would be rejected if it were a KEY of the extension (MULTI_LEVEL_HINT).
  const copy = structuredClone(p.objects.find(o => o.id === CABINET)); copy.id = 'obj_floor-cabinet'; p.objects.push(copy);
  const r = X.read(p, 'obj_floor-cabinet');
  const w = X.write(p, 'obj_floor-cabinet', r.cabinet, { updatedAt: ISO });
  assert.ok(w.ok, JSON.stringify(w.issues)); p = w.project;
  const b = Building.create(p);
  assert.doesNotThrow(() => Building.validate(b));
  const two = Building.addLevel(b, saved(), { name: 'Planta primera' });
  assert.doesNotThrow(() => Building.validate(two));
  assert.equal(two.levels.length, 2);
  for (const level of two.levels) assert.equal(X.validateExtension(level.project).ok, true);
});

test('A1 future 1.x projects: unknown project fields are kept and the write path does not drop them', () => {
  const p = base(); p.schemaVersion = '1.99.0'; p.futureTopLevel = { keep: true }; p.objects.find(o => o.id === WARDROBE).futureField = 'keep me';
  const r = X.read(p, WARDROBE);
  const w = X.write(p, WARDROBE, r.cabinet, { updatedAt: ISO });
  assert.ok(w.ok, JSON.stringify(w.issues));
  assert.deepEqual(w.project.futureTopLevel, { keep: true });
  assert.equal(w.project.objects.find(o => o.id === WARDROBE).futureField, 'keep me');
  assert.equal(w.project.schemaVersion, '1.99.0', 'no silent migration');
});

test('A1 future extension version: read-only, kept verbatim, every write refused', () => {
  const p = base(); p.extensions = { [X.KEY]: { version: 2, entries: [{ anything: true }], newIdea: 1 } };
  deepFreeze(p);
  assert.equal(X.read(p, WARDROBE).status, 'future');
  assert.equal(X.validateExtension(p).status, 'future');
  const w = X.write(p, WARDROBE, K.defaultCabinet('wardrobe', { w: 2400, d: 600 }));
  assert.equal(w.ok, false); assert.equal(w.issues[0].code, 'future');
  // Deleting the object is still allowed and keeps the unknown extension for its own reader.
  const d = X.removeObject(p, WARDROBE);
  assert.ok(d.ok); assert.equal(d.interiorKept, true);
  assert.deepEqual(d.project.extensions[X.KEY], p.extensions[X.KEY]);
});

test('A1 other x-* extensions and other entries are preserved byte for byte', () => {
  let p = saved(); p.extensions['x-other-tool'] = { a: [1, 2, { b: null }] };
  p = X.write(p, CABINET, X.read(p, CABINET).cabinet, { updatedAt: ISO }).project;
  const before = structuredClone(p.extensions[X.KEY].entries.find(e => e.objectId === WARDROBE));
  const r = X.read(p, CABINET); const s = K.setBay(r.outer, r.cabinet, 0, { shelves: [200] });
  assert.ok(s.ok, JSON.stringify(s.issues));
  p = X.write(p, CABINET, s.cabinet, { updatedAt: ISO }).project;
  assert.deepEqual(p.extensions['x-other-tool'], { a: [1, 2, { b: null }] });
  assert.deepEqual(p.extensions[X.KEY].entries.find(e => e.objectId === WARDROBE), before);
});

test('A1 invalid data is refused atomically: nothing changes and every reason is listed', () => {
  const p = deepFreeze(saved()), before = JSON.stringify(p);
  const r = X.read(p, WARDROBE);
  const bad = structuredClone(r.cabinet); bad.columns[0].shelves = [500, 520];     // two boards 2 mm apart
  let w = X.write(p, WARDROBE, bad);
  assert.equal(w.ok, false); assert.ok(w.issues.some(i => i.code === 'shelf-gap'));
  const nan = structuredClone(r.cabinet); nan.thickness = NaN;
  w = X.write(p, WARDROBE, nan); assert.equal(w.ok, false);
  const frac = structuredClone(r.cabinet); frac.height = 2200.5;
  w = X.write(p, WARDROBE, frac); assert.equal(w.ok, false); assert.equal(w.issues[0].code, 'height');
  w = X.write(p, BED, r.cabinet); assert.equal(w.ok, false); assert.equal(w.issues[0].code, 'not-cabinet');
  w = X.write(p, 'obj_missing-999', r.cabinet); assert.equal(w.ok, false); assert.equal(w.issues[0].code, 'unknown-object');
  w = X.write(p, WARDROBE, r.cabinet, { outer: { w: 2400.5, d: 600 } }); assert.equal(w.ok, false); assert.equal(w.issues[0].code, 'outer');
  w = X.write(p, WARDROBE, r.cabinet, { provenance: { height: 'measured-on-site' } }); assert.equal(w.ok, false); assert.equal(w.issues[0].code, 'provenance');
  assert.equal(JSON.stringify(p), before, 'the input project is untouched');
});

test('A1 damaged documents: shape errors, duplicates, unknown fields and type changes are reported, never repaired silently', () => {
  const p = saved(); const entry = p.extensions[X.KEY].entries[0];
  const variants = {
    'unknown-field': q => { q.extensions[X.KEY].entries[0].extra = 1; },
    duplicate: q => { q.extensions[X.KEY].entries.push(structuredClone(entry)); },
    'type-changed': q => { q.objects.find(o => o.id === WARDROBE).type = 'bookshelf'; },
    'missing-field': q => { delete q.extensions[X.KEY].entries[0].provenance; },
    'cabinet:shelf-gap': q => { q.extensions[X.KEY].entries[0].cabinet.columns[0].shelves = [100, 110]; }
  };
  for (const [code, damage] of Object.entries(variants)) {
    const q = structuredClone(p); damage(q);
    const report = X.validateExtension(q);
    assert.equal(report.ok, false, code); assert.ok(report.issues.some(i => i.code === code), `${code}: ${JSON.stringify(report.issues)}`);
    const read = X.read(q, WARDROBE);
    if (code !== 'type-changed') { assert.equal(read.status, 'invalid', code); assert.equal(read.readOnly, true); }
    // A write elsewhere must not paper over the damaged entry.
    const other = X.write(q, CABINET, X.read(q, CABINET).cabinet);
    assert.equal(other.ok, false, `${code}: writing another cabinet is refused while the document is damaged`);
  }
  const broken = base(); broken.extensions = { [X.KEY]: { entries: [] } };
  assert.equal(X.read(broken, WARDROBE).status, 'invalid');
});

test('A1 resizing the object adapts the saved interior through the core, and an unfit resize keeps the saved data (stale)', () => {
  const p = saved(); const o = p.objects.find(x => x.id === WARDROBE);
  o.size.widthMm = 3000;
  const a = X.read(p, WARDROBE);
  assert.equal(a.status, 'adapted'); assert.equal(a.cabinet.columns.length, 5);
  assert.ok(Math.abs(a.cabinet.columns.reduce((s, c) => s + c.width, 0) - K.cavity(a.outer, a.cabinet).width) < 0.1);
  assert.deepEqual(a.savedCabinet, p.extensions[X.KEY].entries[0].cabinet, 'the saved interior is still there until the user saves');
  o.size.widthMm = 900;                                   // five bays of ≥150 mm no longer fit
  const s = X.read(p, WARDROBE);
  assert.equal(s.status, 'stale'); assert.ok(s.issues.length);
  assert.deepEqual(s.cabinet, p.extensions[X.KEY].entries[0].cabinet, 'stale returns the saved interior unchanged');
});

test('A1 deletion: removeObject leaves no orphan; orphans left by other readers are found and pruned on request', () => {
  const p = saved();
  const d = X.removeObject(p, WARDROBE);
  assert.ok(d.ok); assert.equal(d.project.extensions, undefined, 'last interior gone → no empty extension left');
  assert.equal(d.project.objects.some(o => o.id === WARDROBE), false);
  // A reader that does not know the extension deletes the object only.
  const q = structuredClone(p); q.objects = q.objects.filter(o => o.id !== WARDROBE);
  assert.doesNotThrow(() => Core.validate(q), 'the canonical validator still accepts it');
  assert.deepEqual(X.orphans(q), [WARDROBE]);
  assert.equal(X.validateExtension(q).issues[0].code, 'orphan');
  const pruned = X.prune(q);
  assert.ok(pruned.ok); assert.deepEqual(pruned.removed, [WARDROBE]); assert.equal(X.orphans(pruned.project).length, 0);
  const rm = X.remove(p, WARDROBE);
  assert.ok(rm.ok); assert.equal(rm.removed, 1); assert.equal(rm.project.objects.some(o => o.id === WARDROBE), true, 'remove keeps the wardrobe');
});

test('A1 duplicate: copyInterior gives the copy the same saved interior under its own id', () => {
  const p = saved(); const copy = structuredClone(p.objects.find(o => o.id === WARDROBE)); copy.id = 'obj_wardrobe-copy'; p.objects.push(copy);
  assert.equal(X.read(p, 'obj_wardrobe-copy').status, 'none', 'without the helper the copy falls back to the default');
  const c = X.copyInterior(p, WARDROBE, 'obj_wardrobe-copy');
  assert.ok(c.ok); assert.deepEqual(X.read(c.project, 'obj_wardrobe-copy').cabinet, X.read(c.project, WARDROBE).cabinet);
  assert.equal(X.copyInterior(base(), WARDROBE, 'obj_wardrobe-copy').ok, false);
});

test('A1 the client delivery never carries the interior: minimizeProject drops extensions (ENT-01 contract, not touched)', () => {
  const Delivery = require('../js/client-delivery-core.js');
  const p = saved();
  const minimal = Delivery.minimizeProject(p);
  assert.equal(minimal.extensions, undefined);
  assert.ok(Delivery.PROJECT_DROPPED.includes('extensions'));
  assert.equal(minimal.objects.find(o => o.id === WARDROBE).size.heightMm, p.objects.find(o => o.id === WARDROBE).size.heightMm, 'only the outer height reaches the client');
});

test('A1 option 1 measured, not adopted: a field inside objects[] is not a contract today (1.0.0 and strict levels refuse it)', () => {
  const p = saved(); const q = structuredClone(p);
  q.objects.find(o => o.id === WARDROBE).cabinet = q.extensions[X.KEY].entries[0].cabinet; delete q.extensions;
  assert.throws(() => Core.validate(q), /unknown field/, '1.0.0 is validated exactly');
  q.schemaVersion = '1.12.0';
  // Any other 1.x is read tolerantly: the unknown field is KEPT but means nothing to the reader (not a contract).
  assert.doesNotThrow(() => Core.validate(q));
  assert.throws(() => Core.validate(q, { strict: true }), /unknown field/, 'a building level (strict) rejects it');
  assert.throws(() => Building.validate(Building.create(q)), /unknown field/);
  assert.ok(!Building.PROJECT_VERSIONS.includes('1.13.0'), 'a new minor also needs the building list of level versions');
  // The in-memory copy of the schema shows what option 1 would have to change.
  const schema = structuredClone(Schema);
  assert.equal(schema.$defs.object.additionalProperties, false);
  assert.equal(schema.$defs.object.properties.cabinet, undefined);
  // Option 2 (the candidate) needs none of that: same document, interior in extensions, strict building OK.
  assert.doesNotThrow(() => Building.validate(Building.create(p)));
});
