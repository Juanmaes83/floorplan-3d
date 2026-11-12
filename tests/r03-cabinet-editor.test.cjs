// SCULPT-R03 A2/A3 · editor session (js/r03-cabinet-editor-core.js) and 3D geometry (js/r03-cabinet-geometry.js), pure.
// The brief's cases: split/merge, two shelves too close, rod vs drawers, incompatible drawers, door states, minimum and
// maximum sizes, restore, no change after a refusal; and one state shared by elevation, plan and 3D.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const K = require('../js/r03-cabinet-core.js');
const E = require('../js/r03-cabinet-editor-core.js');
const G = require('../js/r03-cabinet-geometry.js');
const X = require('../js/r03-cabinet-contract.js');
const Core = require('../js/project-core.js');

const outer = { w: 2000, d: 600 };
const open = () => E.createSession({ objectId: 'obj_t', objectType: 'wardrobe', outer, cabinet: K.defaultCabinet('wardrobe', outer) });
const ok = r => { assert.equal(r.ok, true, JSON.stringify(r.explanation || r.issues)); return r.session; };
const refused = (s, op, code) => {
  const before = JSON.stringify(s.state), r = E.apply(s, op);
  assert.equal(r.ok, false, `${op.type} must be refused`);
  if (code) assert.ok(r.issues.some(i => i.code === code), `${code} in ${JSON.stringify(r.issues)}`);
  assert.equal(JSON.stringify(r.session.state), before, 'no partial change');
  assert.equal(r.session.undo.length, s.undo.length, 'a refusal is not a history step');
  assert.ok(r.explanation.length && r.explanation.every(t => typeof t === 'string' && t.length > 10), 'explained');
  return r;
};

test('A2 split and merge a module; the bay count and widths come from the core', () => {
  let s = open(); assert.equal(s.state.cabinet.columns.length, 3);
  s = ok(E.apply(s, { type: 'split', bay: 1 })); assert.equal(s.state.cabinet.columns.length, 4); assert.equal(s.bay, 1);
  const inner = K.cavity(s.state.outer, s.state.cabinet).width;
  assert.ok(Math.abs(s.state.cabinet.columns.reduce((a, c) => a + c.width, 0) - inner) < 0.1);
  s = ok(E.apply(s, { type: 'merge', bay: 1 })); assert.equal(s.state.cabinet.columns.length, 3);
  // Splitting until a module would be narrower than the minimum is refused.
  let narrow = E.createSession({ outer: { w: 600, d: 600 }, cabinet: K.defaultCabinet('wardrobe', { w: 600, d: 600 }) });
  narrow = ok(E.apply(narrow, { type: 'split', bay: 0 }));
  refused(narrow, { type: 'split', bay: 0 }, 'bay-width');
  const one = E.createSession({ outer: { w: 600, d: 600 }, cabinet: K.defaultCabinet('wardrobe', { w: 600, d: 600 }) });
  refused(one, { type: 'merge', bay: 0 }, 'bay-index');
});

test('A2 shelves: add, edit, remove; two shelves too close are refused with an explanation', () => {
  let s = open(); s = ok(E.apply(s, { type: 'select-bay', bay: 2 }));
  const n = s.state.cabinet.columns[2].shelves.length;
  s = ok(E.apply(s, { type: 'add-shelf' })); assert.equal(s.state.cabinet.columns[2].shelves.length, n + 1);
  const shelves = s.state.cabinet.columns[2].shelves;
  const r = refused(s, { type: 'set-shelves', shelves: [shelves[0], shelves[0] + 30] }, 'shelf-gap');
  assert.match(r.explanation.join(' '), /Módulo 3: .*60 mm/);
  s = ok(E.apply(s, { type: 'remove-shelf', index: 0 })); assert.equal(s.state.cabinet.columns[2].shelves.length, n);
  refused(s, { type: 'remove-shelf', index: 99 });
  refused(s, { type: 'set-shelves', shelves: [NaN] }, 'input');
  // A full module: adding shelves until no opening is tall enough ends in a refusal, never a silent overlap.
  let full = s, last;
  for (let i = 0; i < 40; i++) { last = E.apply(full, { type: 'add-shelf' }); if (!last.ok) break; full = last.session; }
  assert.equal(last.ok, false); assert.ok(last.issues.some(i => i.code === 'shelf-gap' || i.code === 'shelves-count'));
});

test('A2 rod vs drawers and shelves; incompatible drawers; all refused atomically', () => {
  let s = open(); s = ok(E.apply(s, { type: 'select-bay', bay: 1 }));
  s = ok(E.apply(s, { type: 'set-drawers', drawers: 2, drawerHeight: 180 }));
  const rod = s.state.cabinet.columns[1].rod;
  assert.ok(rod !== null);
  refused(s, { type: 'set-rod', rod: 2 * 180 + 50 }, 'rod');                  // 50 mm above the drawers (< 100)
  const r = refused(s, { type: 'set-drawers', drawers: 6, drawerHeight: 400 }, 'drawers-height');
  assert.match(r.explanation.join(' '), /6 cajones de 400 mm/);
  refused(s, { type: 'set-drawers', drawers: 7 }, 'drawers');
  refused(s, { type: 'set-drawers', drawerHeight: 60 }, 'drawers');
  refused(s, { type: 'set-drawers', drawers: 1.5 }, 'input');
  s = ok(E.apply(s, { type: 'set-rod', rod: null })); assert.equal(s.state.cabinet.columns[1].rod, null);
  const shelf = s.state.cabinet.columns[1].shelves[0];
  refused(s, { type: 'set-rod', rod: shelf + 10 }, 'rod');                    // through a shelf
});

test('A2 door states: closed / hidden / open; invalid state refused; geometry follows', () => {
  let s = open();
  for (const front of ['hidden', 'open', 'closed']) { s = ok(E.apply(s, { type: 'set-front', front })); assert.equal(s.state.cabinet.front, front); }
  refused(s, { type: 'set-front', front: 'ajar' }, 'input');
  const doors = f => G.parts(outer, { ...s.state.cabinet, front: f }).filter(p => p.role === 'door');
  assert.equal(doors('hidden').length, 0);
  assert.equal(doors('closed').length, s.state.cabinet.doorCount);
  for (const d of doors('closed')) assert.ok(d.z + d.d / 2 <= outer.d / 2 + 1e-9, 'closed leaves stay inside the front plane');
  for (const d of doors('open')) assert.ok(d.z + d.d / 2 > outer.d / 2 + d.local.w * 0.9, 'open leaves stand out by their width');
});

test('A2 sizes: minimum and maximum, and a resize keeps proportions through the core', () => {
  let s = open();
  refused(s, { type: 'resize', height: 300 }, 'dimensions');
  refused(s, { type: 'resize', height: 4500 }, 'dimensions');
  refused(s, { type: 'resize', d: 150 }, 'cavity');
  refused(s, { type: 'resize', w: 300 }, 'cavity');
  refused(s, { type: 'resize', w: 2000.5 }, 'input');
  s = ok(E.apply(s, { type: 'resize', w: 2400, height: 2400 }));
  assert.equal(s.state.outer.w, 2400); assert.equal(s.state.cabinet.height, 2400);
  assert.ok(Math.abs(s.state.cabinet.columns.reduce((a, c) => a + c.width, 0) - K.cavity(s.state.outer, s.state.cabinet).width) < 0.1);
  s = ok(E.apply(s, { type: 'set-bay-width', bay: 0, width: 900 }));
  assert.ok(Math.abs(s.state.cabinet.columns[0].width - 900) < 1e-9);
  refused(s, { type: 'set-bay-width', bay: 0, width: 100 }, 'bay-width');
  refused(s, { type: 'set-door-count', doorCount: 13 }, 'door-count');
});

test('A2 undo / redo / restore: exact states back, restore is itself undoable, refusals never enter history', () => {
  const s0 = open(); let s = s0;
  s = ok(E.apply(s, { type: 'split', bay: 0 })); const s1 = s.state;
  s = ok(E.apply(s, { type: 'set-front', front: 'open' })); const s2 = s.state;
  refused(s, { type: 'set-drawers', drawers: 9 });
  s = E.undo(s).session; assert.deepEqual(s.state, s1);
  s = E.undo(s).session; assert.deepEqual(s.state, s0.state); assert.equal(E.undo(s).ok, false);
  s = E.redo(s).session; s = E.redo(s).session; assert.deepEqual(s.state, s2); assert.equal(E.redo(s).ok, false);
  assert.equal(E.dirty(s), true);
  s = E.restore(s).session; assert.deepEqual(s.state, s0.state); assert.equal(E.dirty(s), false);
  s = E.undo(s).session; assert.deepEqual(s.state, s2, 'restore can be undone');
  // A new edit after undo drops the redo branch.
  s = E.undo(s).session; s = ok(E.apply(s, { type: 'set-front', front: 'hidden' })); assert.equal(s.redo.length, 0);
});

test('A2 the session never mutates what it was given, and a read-only interior refuses edits', () => {
  const cabinet = Object.freeze(K.defaultCabinet('wardrobe', outer)), before = JSON.stringify(cabinet);
  let s = E.createSession({ outer, cabinet });
  s = ok(E.apply(s, { type: 'split', bay: 0 })); s = ok(E.apply(s, { type: 'add-shelf' }));
  assert.equal(JSON.stringify(cabinet), before);
  const ro = E.createSession({ outer, cabinet, readOnly: true });
  refused(ro, { type: 'split', bay: 0 }, 'input');
  assert.equal(E.apply(ro, { type: 'select-bay', bay: 1 }).ok, true, 'reading a read-only interior still works');
});

test('A2 provenance: only what the user changed becomes «edited»', () => {
  let s = open(); assert.deepEqual(E.result(s).provenance, { height: 'assumed-type-default', boards: 'assumed', layout: 'default' });
  s = ok(E.apply(s, { type: 'set-front', front: 'open' }));
  assert.equal(E.result(s).provenance.layout, 'default', 'opening the doors is not a layout change');
  s = ok(E.apply(s, { type: 'split', bay: 0 })); assert.equal(E.result(s).provenance.layout, 'edited');
  s = ok(E.apply(s, { type: 'resize', height: 2300 })); assert.equal(E.result(s).provenance.height, 'edited');
  assert.equal(E.result(s).provenance.boards, 'assumed', 'board thickness was never edited: still the donor default');
});

test('A2 → A1 end to end: edit in a session, save through the contract, reopen, same interior', () => {
  const project = Core.initial(), id = 'obj_template-039';
  const r = X.read(project, id);
  let s = E.createSession({ objectId: id, objectType: 'wardrobe', outer: r.outer, cabinet: r.cabinet, provenance: r.provenance });
  s = ok(E.apply(s, { type: 'split', bay: 0 })); s = ok(E.apply(s, { type: 'set-drawers', bay: 1, drawers: 2, drawerHeight: 200 }));
  const res = E.result(s);
  const w = X.write(project, id, res.cabinet, { outer: res.outer, provenance: res.provenance });
  assert.ok(w.ok, JSON.stringify(w.issues));
  const again = X.read(Core.prepare(JSON.stringify(w.project)).project, id);
  assert.equal(again.status, 'ok'); assert.deepEqual(again.cabinet, res.cabinet); assert.equal(again.provenance.layout, 'edited');
});

test('A3 one state: 3D boards sit exactly where the elevation draws them; the carcass matches the object size', () => {
  let s = open(); s = ok(E.apply(s, { type: 'set-drawers', bay: 2, drawers: 2, drawerHeight: 180 }));
  s = ok(E.apply(s, { type: 'set-front', front: 'hidden' }));
  const { outer: o, cabinet: c } = s.state, parts = G.parts(o, c), elev = K.elevation(o, c);
  const b = G.bounds(parts.filter(p => !['door', 'drawer-box', 'drawer-front', 'handle'].includes(p.role)));
  assert.ok(Math.abs(b.maxX - b.minX - o.w) < 1e-6 && Math.abs(b.maxY - c.height) < 1e-6, `carcass ${JSON.stringify(b)}`);
  assert.ok(b.minZ >= -o.d / 2 - 1e-6 && b.maxZ <= o.d / 2 + 1e-6, 'within the depth');
  const shelves3d = parts.filter(p => p.role === 'shelf').map(p => [Math.round(p.x - p.w / 2 + o.w / 2), Math.round(p.y), Math.round(p.w)]).sort();
  const shelves2d = elev.filter(p => p.role === 'shelf').map(p => [Math.round(p.x), Math.round(p.y), Math.round(p.w)]).sort();
  assert.deepEqual(shelves3d, shelves2d, 'shelves: same x, height and width in elevation and 3D');
  const dividers3d = parts.filter(p => p.role === 'divider').map(p => Math.round(p.x - p.w / 2 + o.w / 2)).sort();
  const dividers2d = elev.filter(p => p.role === 'divider').map(p => Math.round(p.x)).sort();
  assert.deepEqual(dividers3d, dividers2d);
  const drawers3d = parts.filter(p => p.role === 'drawer-front').length, drawers2d = elev.filter(p => p.role === 'drawer').length;
  assert.equal(drawers3d, drawers2d); assert.equal(drawers3d, 2);
  const rods3d = parts.filter(p => p.role === 'rod').map(p => [p.bay, Math.round(p.y)]).sort(), rods2d = elev.filter(p => p.role === 'rod').map(p => [p.bay, Math.round(p.y)]).sort();
  assert.deepEqual(rods3d, rods2d);
});

test('A3 open doors: the leaves sweep what the plan swing says; open drawers reach the plan drawer reach', () => {
  let s = open(); s = ok(E.apply(s, { type: 'set-front', front: 'open' }));
  s = ok(E.apply(s, { type: 'set-drawers', bay: 2, drawers: 1, drawerHeight: 180 }));
  const { outer: o, cabinet: c } = s.state, parts = G.parts(o, c), swing = K.swing(o, c);
  for (const d of parts.filter(p => p.role === 'door')) {
    const sw = swing[d.door];
    const tipZ = d.z + d.d / 2;                       // outer face of the turned leaf
    assert.ok(Math.abs(tipZ - (sw.hingeLocal.y + sw.leafMm + 18)) < 25, `door ${d.door}: tip ${tipZ} vs swing ${sw.hingeLocal.y + sw.leafMm}`);
    assert.ok(Math.abs((d.hinge === 'left' ? d.x - d.w / 2 : d.x + d.w / 2) - sw.hingeLocal.x) < 20, 'leaf stands at its hinge');
  }
  const reach = K.drawerReach(o, c);
  for (const f of parts.filter(p => p.role === 'drawer-front')) assert.ok(f.pulledMm > 0, 'drawers out with the doors open');
  assert.equal(reach.length, 1);
});

test('A3 rotation and elevation: the 3D footprint is the RUBIK footprint for every quadrant', () => {
  for (const rotationDeg of [0, 90, 180, 270, 33]) {
    const object = { position: { x: 1000, y: 2000 }, rotationDeg, size: { widthMm: 2000, depthMm: 600 } };
    const fp = G.footprint(object, outer);
    // three.js placement: rotation.y = −rot; a local point (x, z) goes to (x cos r − z sin r … ) in plan: same as K.toPlan.
    const r = -rotationDeg * Math.PI / 180, toWorld = (x, z) => ({ x: object.position.x + x * Math.cos(r) + z * Math.sin(r), y: object.position.y - x * Math.sin(r) + z * Math.cos(r) });
    const corners = [[-1000, -300], [1000, -300], [1000, 300], [-1000, 300]].map(([x, z]) => toWorld(x, z));
    corners.forEach((p, i) => { assert.ok(Math.abs(p.x - fp[i].x) < 1e-6 && Math.abs(p.y - fp[i].y) < 1e-6, `rot ${rotationDeg} corner ${i}`); });
  }
});

test('A3 vertical: no reference → unknown (never a default ceiling); stated references are compared with the elevation', () => {
  const c = K.defaultCabinet('wardrobe', outer), object = { elevationMm: 100 };
  assert.equal(G.verticalCheck(object, c, null).status, 'unknown');
  assert.match(G.verticalCheck(object, c, null).message, /2300 mm/);
  assert.equal(G.verticalCheck(object, c, { clearHeightMm: 2500, reference: 'finished-floor', source: '' }).status, 'pending');
  assert.equal(G.verticalCheck(object, c, { clearHeightMm: 2500, reference: 'level-floor', source: 'plano' }).status, 'pending');
  assert.equal(G.verticalCheck(object, c, { clearHeightMm: 2.5, reference: 'finished-floor', source: 'x' }).status, 'invalid');
  const fit = G.verticalCheck(object, c, { clearHeightMm: 2500, reference: 'finished-floor', source: 'medición del propietario' });
  assert.equal(fit.status, 'fits'); assert.equal(fit.marginMm, 200);
  assert.equal(G.verticalCheck(object, c, { clearHeightMm: 2250, reference: 'finished-floor', source: 'medición' }).status, 'does-not-fit');
});
