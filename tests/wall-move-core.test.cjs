'use strict';
// M08 · «Desplazar muro con su contexto»: pruebas puras sobre el ejemplo de RUBIK y casos sintéticos de límite.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../js/project-core.js'), O = require('../js/opening-edit.js'), Q = require('../js/quantity-core.js'), M = require('../js/wall-move-core.js');
const D = { Core: C, Openings: O, Quantities: Q };
const W = id => 'wal_ref-' + id, plan = (p, id, d) => M.plan(p, W(id), d, D);
const world = (p, o) => { const w = p.walls.find(x => x.id === o.wallId), L = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y), ux = (w.end.x - w.start.x) / L, uy = (w.end.y - w.start.y) / L; return [w.start.x + ux * o.offsetMm, w.start.y + uy * o.offsetMm].map(v => Math.round(v)); };
const assoc = (p, id) => Q.room(p, id).wallFaces;
const norm = poly => { const s = poly.map(v => `${v.x},${v.y}`); const k = s.indexOf([...s].sort()[0]); return s.slice(k).concat(s.slice(0, k)).join(' '); };

test('M08 · un tabique completo (5 piezas: muro + 2 paños de puerta) se desplaza con su contexto, de forma coherente', () => {
  const p = C.initial(), before = JSON.stringify(p), r = plan(p, 'w38', 300);
  assert.equal(r.ok, true, r.code);
  assert.equal(JSON.stringify(p), before, 'la operación es pura: el proyecto de entrada no cambia');
  const n = r.next;
  assert.deepEqual([...r.report.run].sort(), ['w35', 'w36', 'w38', 'door-0', 'door-3'].map(W).sort());
  for (const id of r.report.run) { const a = p.walls.find(w => w.id === id), b = n.walls.find(w => w.id === id); assert.equal(b.start.x, a.start.x - 300); assert.equal(b.end.x, a.end.x - 300); assert.equal(b.start.y, a.start.y); }
  // Muros que acometen: se acortan o alargan exactamente 300 mm y siguen unidos al tramo.
  const adj = Object.fromEntries(r.report.walls.filter(w => w.role === 'adjusted').map(w => [w.id, w.lengthAfterMm - w.lengthBeforeMm]));
  assert.deepEqual(adj, { [W('w34')]: -300, [W('w37')]: -300, [W('w39')]: 300 });
  // Huecos: conservan su coordenada longitudinal y se desplazan en perpendicular.
  for (const o of p.openings) { const o2 = n.openings.find(x => x.id === o.id); if (!r.report.run.includes(o.wallId)) continue; const [x0, y0] = world(p, o), [x1, y1] = world(n, o2); assert.equal(o2.wallId, o.wallId); assert.equal(o2.offsetMm, o.offsetMm); assert.equal(y1, y0, o.id); assert.equal(x1, x0 - 300, o.id); }
  // Estancias: áreas coherentes con el desplazamiento y asociación con muros intacta (autoridad: quantity-core).
  const rooms = Object.fromEntries(r.report.rooms.map(x => [x.id.replace('rom_', ''), +(x.areaAfterM2 - x.areaBeforeM2).toFixed(3)]));
  assert.equal(rooms.kid, -1.011); assert.equal(rooms.mbath, 0.624); assert.equal(rooms.gbath, -0.402); assert.equal(rooms.hall, 0.861);
  for (const room of p.rooms) if (assoc(p, room.id).associationComplete) assert.equal(assoc(n, room.id).associationComplete, true, room.id);
  assert.doesNotThrow(() => C.validate(n));
  // Muebles apoyados en la cara: acompañan exactamente; los atravesados se informan y no se mueven.
  for (const id of r.report.objects.moved) { const a = p.objects.find(o => o.id === id), b = n.objects.find(o => o.id === id); assert.equal(b.position.x, a.position.x - 300); assert.equal(b.position.y, a.position.y); }
  for (const id of r.report.objects.crossed) assert.deepEqual(n.objects.find(o => o.id === id).position, p.objects.find(o => o.id === id).position);
  // Lo que no pertenece al alcance queda idéntico.
  const touched = new Set([...r.report.walls.map(w => w.id)]);
  for (const w of p.walls) if (!touched.has(w.id)) assert.deepEqual(n.walls.find(x => x.id === w.id), w, w.id);
  assert.deepEqual(n.materials, p.materials); assert.equal(n.id, p.id); assert.equal(n.schemaVersion, p.schemaVersion);
});

test('M08 · planta abierta: el contorno que sigue más allá del extremo del muro recibe un escalón, y −d lo deshace exactamente', () => {
  const p = C.initial(), r = plan(p, 'w34', -100);
  assert.equal(r.ok, true, r.code);
  const dining = r.next.rooms.find(x => x.id === 'rom_dining');
  assert.equal(dining.polygon.length, p.rooms.find(x => x.id === 'rom_dining').polygon.length + 2, 'dos vértices nuevos: el escalón en el extremo libre del tabique');
  assert.ok(dining.polygon.some(v => v.x === 4580 && v.y === 5190) && dining.polygon.some(v => v.x === 4580 && v.y === 5090), 'escalón de 100 mm en x = 4580');
  const back = M.plan(r.next, W('w34'), 100, D);
  assert.equal(back.ok, true, back.code);
  for (const room of p.rooms) assert.equal(norm(back.next.rooms.find(x => x.id === room.id).polygon), norm(room.polygon), room.id);
  for (const w of p.walls) { const b = back.next.walls.find(x => x.id === w.id); assert.deepEqual([b.start, b.end], [w.start, w.end], w.id); }
});

test('M08 · determinista: el mismo plan dos veces da exactamente el mismo resultado', () => {
  const p = C.initial();
  assert.equal(JSON.stringify(plan(p, 'w46', -300).next), JSON.stringify(plan(p, 'w46', -300).next));
});

test('M08 · se rechaza con motivo (y sin tocar nada) todo lo que no puede interpretarse con seguridad', () => {
  const p = C.initial(), snap = JSON.stringify(p);
  const cases = [
    ['w5', 300, 'structural'], ['w38', 0, 'bad-offset'], ['w38', 6000, 'bad-offset'], ['w38', 1.5, 'bad-offset'],
    ['w34', 300, 'leaves-host-wall'], ['w37', 100, 'overlapping-element'], ['w29', 600, 'wall-collision'], ['w33', 100, 'opening-out-of-wall'],
  ];
  for (const [id, d, code] of cases) { const r = plan(p, id, d); assert.equal(r.ok, false, `${id} ${d}`); assert.equal(r.code, code, `${id} ${d}: ${r.code}`); assert.ok(M.explain(code, 'es').length > 10 && M.explain(code, 'en').length > 10 && M.explain(code, 'zh').length > 4); assert.equal(r.next, undefined); }
  assert.equal(plan(p, 'nope', 100).code, 'not-found');
  const dem = C.clone(p); dem.walls.find(w => w.id === W('w38')).status = 'demolished'; assert.equal(plan(dem, 'w38', 100).code, 'demolished');
  const op07 = C.clone(p); op07.walls.find(w => w.id === W('w38')).curve = { sagittaMm: 200 }; assert.equal(plan(op07, 'w38', 100).code, 'curved', 'OP-07: muros curvos/inclinados fuera de alcance');
  assert.equal(JSON.stringify(p), snap);
});

test('M08 · encuentro oblicuo (sintético, 60°): el extremo desliza por el muro anfitrión y las uniones siguen coincidiendo tras redondear', () => {
  const p = C.initial();
  p.walls = []; p.openings = []; p.objects = []; p.rooms = [];
  const wall = (id, a, b, structure = 'partition') => ({ id, start: a, end: b, thicknessMm: 100, heightMm: 2600, structure, status: 'existing', source: { method: 'manual', review: 'confirmed' } });
  const k = Math.round(3000 * Math.cos(Math.PI / 3)), h = Math.round(3000 * Math.sin(Math.PI / 3));
  p.walls.push(wall('wal_test-a', { x: 0, y: 0 }, { x: k, y: h }), wall('wal_test-b', { x: 4000, y: 0 }, { x: 4000 + k, y: h }), wall('wal_test-c', { x: 600, y: 1039 }, { x: 4600, y: 1039 }));
  // wal_c acomete por sus dos extremos a wal_a y wal_b (encuentros en T a 60°).
  const r = M.plan(p, 'wal_test-c', 200, D);
  assert.equal(r.ok, true, r.code);
  const c = r.next.walls.find(w => w.id === 'wal_test-c');
  assert.equal(c.start.y, 1239); assert.equal(c.end.y, 1239);
  assert.ok(Math.abs(r.report.tangentialMm.A - 115) <= 1, 'desliza ~115 mm a lo largo (200/tan 60°)');
  for (const [id, P] of [['wal_test-a', c.start], ['wal_test-b', c.end]]) { const w = r.next.walls.find(x => x.id === id), d = Q.distanceMm ? null : null; const L = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y), dist = Math.abs((w.end.x - w.start.x) * (w.start.y - P.y) - (w.start.x - P.x) * (w.end.y - w.start.y)) / L; assert.ok(dist <= 1, `${id}: el extremo sigue sobre su anfitrión (${dist.toFixed(2)} mm)`); }
  assert.equal(M.plan(p, 'wal_test-c', 2000, D).code, 'leaves-host-wall', 'no sale del muro anfitrión');
});

test('M08 · lados con nombre: la etiqueta de cada lado usa la estancia de ese lado y el signo del plan', () => {
  const p = C.initial(), s = M.sides(p, W('w38'), D), r = plan(p, 'w38', 100);
  const grew = r.report.rooms.filter(x => x.areaAfterM2 < x.areaBeforeM2).map(x => x.id);
  assert.ok(grew.includes(s.plus.roomId), '«Hacia X» con signo + reduce la estancia X');
});


test('M08 · protege los muros que acometen y conserva los anfitriones sin cambios', () => {
  const p = C.initial(), before = JSON.stringify(p);
  assert.equal(p.walls.find(w => w.id === W('w25')).structure, 'load-bearing');
  for (const mm of [-600, -300, -100, -50, 50, 100]) {
    const r = plan(p, 'w26', mm);
    assert.equal(r.ok, false);
    assert.equal(r.code, 'structural');
    assert.deepEqual(r.detail.walls, [W('w25')]);
    assert.equal(r.next, undefined);
  }
  assert.equal(JSON.stringify(p), before);

  const fixture = C.initial(), w = (id, x1, y1, x2, y2, structure = 'partition') =>
    ({ id, start: {x:x1,y:y1}, end: {x:x2,y:y2}, structure, status: 'existing', thicknessMm:100, heightMm:2600, source:{method:'manual',review:'confirmed'} });
  fixture.rooms = []; fixture.openings = []; fixture.objects = [];
  const moved = w('wal_move', 0, 0, 3000, 0);
  const host = w('wal_host', 0, -1500, 0, 1500, 'load-bearing');
  const joint = w('wal_joint', 3000, 0, 3000, 1500, 'exterior');
  const branch = w('wal_branch', 1500, 0, 1500, 1500, 'load-bearing');
  fixture.walls = [moved, host];
  const result = M.plan(fixture, moved.id, 100, D);
  assert.equal(result.ok, true, result.code);
  assert.deepEqual(result.next.walls.find(wall => wall.id === host.id), host);
  for (const neighbor of [joint, branch]) {
    fixture.walls = [moved, host, neighbor];
    const r = M.plan(fixture, moved.id, 100, D);
    assert.equal(r.code, 'structural');
    assert.deepEqual(r.detail.walls, [neighbor.id]);
    assert.equal(r.next, undefined);
  }
});
