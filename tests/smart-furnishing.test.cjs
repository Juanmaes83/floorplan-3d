'use strict';
// UX-12 + UX-13 · amueblamiento inteligente V1: núcleo puro. Las posiciones finales se comprueban con un verificador
// INDEPENDIENTE (tests/smart-furnishing/verify.cjs), no con el «ok» del generador. Datos sintéticos (piso de ejemplo).
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../js/project-core.js'), SF = require('../js/smart-furnishing-core.js'), UI = require('../js/smart-furnishing-ui.js');
const P = require('../js/furniture-placement.js'), LD = require('../js/live-dimensions-core.js');
const X = require('../js/r02a-ceiling-contract.js'), B = require('../js/r02a-ceiling-bridge.js'), R03 = require('../js/r03-cabinet-bridge.js'), R03C = require('../js/r03-cabinet-contract.js');
const { verify, wallPoly } = require('./smart-furnishing/verify.cjs');

const base = () => C.initial();
const sc0 = P.scene(base());
const inRoom = (p, id) => (p.objects || []).filter(o => P.roomsAt(sc0, o.position).some(r => r.id === id));
function emptied(id, p = base(), keep = () => false) { p.objects = p.objects.filter(o => keep(o) || !P.roomsAt(sc0, o.position).some(r => r.id === id)); return p; }
const doors = p => C.geometry(p).doors.map(d => ({ h: d.h, c: d.c, o: d.o, len: d.len }));
const ok = r => { assert.ok(r.ok, JSON.stringify(r.message || r.status)); return r; };
function applied(p, proposal) { const a = SF.apply(p, proposal, { acceptEstimatedScale: true }); assert.ok(a.ok, a.message); return a; }
const strip = prop => JSON.parse(JSON.stringify(prop));

test('reproducible: misma revisión + configuración + semilla = misma propuesta; generar NO cambia el proyecto', () => {
  const p = emptied('rom_living'), before = JSON.stringify(p), cfg = { roomId: 'rom_living', use: 'living', density: 'high', recipeId: 'nordico', seed: 7 };
  const a = ok(SF.generate(p, cfg)), b = ok(SF.generate(JSON.parse(before), cfg));
  assert.deepEqual(strip(a), strip(b));
  assert.equal(JSON.stringify(p), before, 'el proyecto queda idéntico tras generar');
  assert.ok(a.items.length >= 6, `densidad alta con varias piezas (${a.items.length})`);
  const res = applied(p, a); assert.deepEqual(verify(res.project, res.added, doors(p)), []);
});

test('semillas distintas dan distribuciones distintas cuando hay varias igual de buenas, todas válidas', () => {
  const p = emptied('rom_living'), seen = new Set();
  for (let seed = 1; seed <= 8; seed++) {
    const r = ok(SF.generate(p, { roomId: 'rom_living', use: 'living', density: 'medium', recipeId: 'nordico', seed }));
    assert.ok(r.alternatives > 1);
    seen.add(JSON.stringify(r.items.map(i => [i.type, i.position, i.rotationDeg])));
    const res = applied(p, r); assert.deepEqual(verify(res.project, res.added, doors(p)), [], `semilla ${seed}`);
  }
  assert.ok(seen.size >= 2, `al menos dos distribuciones distintas (${seen.size})`);
});

test('estancia en L (comedor con entrante): todas las piezas dentro del polígono real', () => {
  const p = emptied('rom_dining'), room = p.rooms.find(r => r.id === 'rom_dining');
  // Cóncava de verdad: algún vértice con giro contrario al resto.
  const turns = room.polygon.map((a, i) => { const b = room.polygon[(i + 1) % room.polygon.length], c = room.polygon[(i + 2) % room.polygon.length]; return Math.sign((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)); });
  assert.ok(new Set(turns.filter(Boolean)).size === 2, 'el comedor es un polígono en L');
  for (const recipeId of ['nordico', 'urbano', 'calido']) for (const density of SF.DENSITIES) {
    const r = ok(SF.generate(p, { roomId: 'rom_dining', use: 'dining', density, recipeId, seed: 2 }));
    const res = applied(p, r); assert.deepEqual(verify(res.project, res.added, doors(p)), [], `${recipeId}/${density}`);
    assert.ok(r.items.filter(i => i.type === 'chair').length >= 2, 'al menos dos sillas');
  }
});

test('estancia pequeña sin espacio: se rechaza con motivo y no se propone nada', () => {
  const p = base(), before = JSON.stringify(p);
  const r = SF.generate(p, { roomId: 'rom_gbath', use: 'bedroom', density: 'low', recipeId: 'urbano', seed: 1 });
  assert.equal(r.ok, false); assert.equal(r.status, 'no-space'); assert.deepEqual(r.items, []);
  assert.match(r.message, /No hay sitio/); assert.match(r.message, /no cambia/);
  assert.equal(JSON.stringify(p), before);
  assert.equal(SF.apply(p, r).ok, false, 'un rechazo no se puede aplicar');
});

test('barrido de puerta: ninguna pieza lo invade, y una pieza movida dentro del barrido se rechaza al aplicar', () => {
  const p = emptied('rom_living'), ds = C.geometry(p).doors, rooms = P.scene(p).rooms, liv = rooms.find(r => r.id === 'rom_living');
  const door = ds.find(d => { const q = { x: d.h[0] + (d.c[0] + d.o[0]) * d.len / 3, y: d.h[1] + (d.c[1] + d.o[1]) * d.len / 3 }; return P.roomsAt(P.scene(p), q).some(r => r.id === 'rom_living'); });
  assert.ok(door, 'el salón tiene una puerta que abre hacia dentro');
  for (const seed of [1, 2, 3]) { const r = ok(SF.generate(p, { roomId: 'rom_living', use: 'living', density: 'high', recipeId: 'calido', seed })); const res = applied(p, r); assert.deepEqual(verify(res.project, res.added, doors(p)), []); }
  const r = ok(SF.generate(p, { roomId: 'rom_living', use: 'living', density: 'low', recipeId: 'urbano', seed: 1 })), t = structuredClone(r);
  const small = t.items.find(i => i.type === 'coffeetable'); small.position = { x: Math.round(door.h[0] + (door.c[0] + door.o[0]) * door.len / 3), y: Math.round(door.h[1] + (door.c[1] + door.o[1]) * door.len / 3) };
  const bad = SF.apply(p, t, { acceptEstimatedScale: true });
  assert.equal(bad.ok, false); assert.ok(bad.problems.some(x => x.kind === 'door'), JSON.stringify(bad.problems));
  // Y el verificador independiente también lo ve (control negativo del verificador).
  const forced = C.clone(p); forced.objects.push({ ...small, roomId: 'rom_living', id: 'obj_forced-door' });
  assert.ok(verify(forced, ['obj_forced-door'], doors(p)).some(m => /puerta/.test(m)));
  assert.ok(liv);
});

test('estancia ambigua (solapa con otra estancia): no se propone nada', () => {
  const p = emptied('rom_living'), liv = p.rooms.find(r => r.id === 'rom_living');
  p.rooms.push({ ...structuredClone(liv), id: 'rom_overlap-test', name: 'Solape', polygon: [{ x: 4820, y: 6610 }, { x: 7000, y: 6610 }, { x: 7000, y: 8000 }, { x: 4820, y: 8000 }] });
  const r = SF.generate(p, { roomId: 'rom_living', use: 'living', density: 'low', recipeId: 'nordico', seed: 1 });
  assert.equal(r.status, 'ambiguous-room'); assert.deepEqual(r.items, []);
});

test('escala: estimada exige confirmación al aplicar; sin calibrar no se genera', () => {
  const p = emptied('rom_living'); assert.equal(p.scale.confidence, 'estimated');
  const r = ok(SF.generate(p, { roomId: 'rom_living', use: 'living', density: 'low', recipeId: 'nordico', seed: 1 }));
  assert.match(r.scaleWarning, /estimada/);
  const no = SF.apply(p, r); assert.equal(no.ok, false); assert.equal(no.reason, 'scale');
  assert.ok(SF.apply(p, r, { acceptEstimatedScale: true }).ok);
  const pending = structuredClone(p); pending.scale = { confidence: 'pending' };
  const q = SF.generate(pending, { roomId: 'rom_living', use: 'living', density: 'low', recipeId: 'nordico', seed: 1 });
  assert.equal(q.status, 'scale-pending'); assert.deepEqual(q.items, []);
});

test('uso: sin declarar se pide; uso sin programa en V1 se rechaza', () => {
  const p = emptied('rom_living');
  assert.equal(SF.generate(p, { roomId: 'rom_living', density: 'low', recipeId: 'nordico', seed: 1 }).status, 'use-required');
  assert.equal(SF.generate(p, { roomId: 'rom_living', use: 'kitchen', density: 'low', recipeId: 'nordico', seed: 1 }).status, 'use-unsupported');
  const fam = structuredClone(p); fam.rooms.find(r => r.id === 'rom_living').family = 'living'; fam.schemaVersion = '1.6.0';
  assert.equal(ok(SF.generate(fam, { roomId: 'rom_living', density: 'low', recipeId: 'nordico', seed: 1 })).use, 'living', 'el tipo de la estancia sirve de uso');
});

test('muebles existentes: se respetan (no se mueven ni sustituyen) y la pieza existente sirve de ancla', () => {
  const full = base();
  const none = SF.generate(full, { roomId: 'rom_living', use: 'living', density: 'medium', recipeId: 'nordico', seed: 1 });
  assert.equal(none.status, 'nothing-to-add', 'salón ya amueblado: nada que añadir');
  const p = emptied('rom_living', base(), o => o.type === 'sofa'), sofa = p.objects.find(o => o.type === 'sofa' && P.roomsAt(sc0, o.position).some(r => r.id === 'rom_living'));
  const before = JSON.stringify(p.objects);
  const r = ok(SF.generate(p, { roomId: 'rom_living', use: 'living', density: 'medium', recipeId: 'nordico', seed: 1 }));
  assert.equal(r.anchor.kept, true); assert.equal(r.anchor.id, sofa.id); assert.ok(!r.items.some(i => i.type === 'sofa'));
  const table = r.items.find(i => i.type === 'coffeetable'); assert.ok(table, 'mesa de centro delante del sofá existente');
  const front = { x: -Math.sin(sofa.rotationDeg * Math.PI / 180), y: Math.cos(sofa.rotationDeg * Math.PI / 180) };
  assert.ok((table.position.x - sofa.position.x) * front.x + (table.position.y - sofa.position.y) * front.y > 0, 'la mesa está delante del sofá');
  const res = applied(p, r);
  assert.equal(JSON.stringify(res.project.objects.slice(0, p.objects.length)), before, 'los muebles existentes no cambian');
  assert.deepEqual(verify(res.project, res.added, doors(p)), []);
});

test('armario R03 con interior: se respeta y su extensión x-r03-cabinet no cambia', () => {
  let p = base(); const W = 'obj_template-004';
  const o = R03.open(p, W); const s = R03.save(p, o.session); assert.ok(s.ok); p = s.project;
  p = emptied('rom_master', p, x => x.id === W);
  const ext0 = JSON.stringify(p.extensions['x-r03-cabinet']);
  const r = ok(SF.generate(p, { roomId: 'rom_master', use: 'bedroom', density: 'high', recipeId: 'nordico', seed: 1 }));
  assert.ok(!r.items.some(i => i.type === 'wardrobe'), 'no se propone otro armario');
  const res = applied(p, r);
  assert.equal(JSON.stringify(res.project.extensions['x-r03-cabinet']), ext0);
  assert.equal(R03C.read(res.project, W).status, 'ok');
  assert.deepEqual(verify(res.project, res.added, doors(p)), []);
});

test('elemento de techo R02-A: x-r02a-ceiling no cambia y sigue leyéndose', () => {
  const REF = { scope: 'project', clearHeightMm: 2600, reference: 'finished-floor', source: 'medición sintética de prueba' };
  const LAMP = { id: 'cei_test-1', type: 'pendant', position: { x: 8300, y: 2300 }, size: { widthMm: 400, depthMm: 400, heightMm: 600 }, dropMm: 0 };
  let p = B.confirm(B.setReference(emptied('rom_master'), REF).project, LAMP, { confirmedAt: '2026-11-13T09:00:00.000Z' }).project;
  const ext0 = JSON.stringify(p.extensions['x-r02a-ceiling']);
  const r = ok(SF.generate(p, { roomId: 'rom_master', use: 'bedroom', density: 'medium', recipeId: 'urbano', seed: 1 }));
  const res = applied(p, r);
  assert.equal(JSON.stringify(res.project.extensions['x-r02a-ceiling']), ext0);
  assert.equal(X.extension(res.project).status, 'present'); assert.equal(B.afterLoad(res.project).status, 'present');
});

test('cotas UX-08: cada mueble nuevo tiene cotas válidas en su estancia', () => {
  const p = emptied('rom_child'), r = ok(SF.generate(p, { roomId: 'rom_child', use: 'office', density: 'high', recipeId: 'calido', seed: 1 })), res = applied(p, r), g = C.geometry(res.project);
  for (const id of res.added) {
    const o = res.project.objects.find(x => x.id === id), m = LD.measure(g, { cx: o.position.x, cy: o.position.y, w: o.size.widthMm, d: o.size.depthMm, rot: o.rotationDeg });
    assert.equal(m.status, 'ok', `${o.type}: ${m.reason}`); assert.equal(m.roomId, 'rom_child');
  }
});

test('aplicar: copia atómica y válida; el original no cambia; si el proyecto cambió, se rechaza', () => {
  const p = emptied('rom_living'), before = JSON.stringify(p), r = ok(SF.generate(p, { roomId: 'rom_living', use: 'living', density: 'medium', recipeId: 'urbano', seed: 3 }));
  const res = applied(p, r);
  assert.equal(JSON.stringify(p), before, 'el original no cambia');
  assert.equal(res.project.objects.length, p.objects.length + r.items.length);
  const reopened = JSON.parse(JSON.stringify(res.project)); C.validate(reopened);
  assert.deepEqual(res.added.map(id => reopened.objects.find(o => o.id === id).id), res.added, 'al reabrir siguen todos');
  const moved = structuredClone(p); moved.objects[0].position.x += 10;
  const stale = SF.apply(moved, r, { acceptEstimatedScale: true }); assert.equal(stale.ok, false); assert.equal(stale.reason, 'stale');
  const twice = SF.apply(res.project, r, { acceptEstimatedScale: true }); assert.equal(twice.ok, false, 'no se aplica dos veces (sin duplicados)');
});

test('QA negativo: dimensiones inválidas, pieza atravesando un muro e id duplicado se rechazan; nada se aplica a medias', () => {
  const p = emptied('rom_living'), r = ok(SF.generate(p, { roomId: 'rom_living', use: 'living', density: 'medium', recipeId: 'nordico', seed: 1 }));
  const zero = structuredClone(r); zero.items[1].size.widthMm = 0;
  let a = SF.apply(p, zero, { acceptEstimatedScale: true }); assert.equal(a.ok, false); assert.ok(a.problems.some(x => x.kind === 'geometry')); assert.equal(a.project, undefined);
  const frac = structuredClone(r); frac.items[0].position.x += 0.5;
  assert.equal(SF.apply(p, frac, { acceptEstimatedScale: true }).ok, false, 'posición no entera');
  // A través del muro superior del salón (y = 6610).
  const wall = structuredClone(r); wall.items[0].position = { x: 7500, y: 6610 }; wall.items[0].rotationDeg = 0;
  a = SF.apply(p, wall, { acceptEstimatedScale: true }); assert.equal(a.ok, false); assert.ok(a.problems.some(x => x.kind === 'wall' || x.kind === 'room'), JSON.stringify(a.problems));
  const dup = structuredClone(r); dup.items[1].id = dup.items[0].id;
  assert.equal(SF.apply(p, dup, { acceptEstimatedScale: true }).ok, false);
  // El verificador independiente detecta una pieza que atraviesa un muro.
  const forced = C.clone(p); forced.objects.push({ id: 'obj_forced-wall', type: 'sofa', name: 'x', position: { x: 7500, y: 6610 }, rotationDeg: 0, size: { widthMm: 2400, depthMm: 900 }, roomId: 'rom_living' });
  assert.ok(verify(forced, ['obj_forced-wall']).some(m => /muro|estancia/.test(m)));
  assert.ok(wallPoly(p.walls[0]).length === 4);
});

test('UX-13 recetas: cambian piezas, tamaños y colores de verdad (datos y dibujo); una receta solo de nombre no pasaría', () => {
  for (const [room, use] of [['rom_living', 'living'], ['rom_master', 'bedroom']]) {
    const p = emptied(room), props = Object.keys(SF.RECIPES).map(id => ok(SF.generate(p, { roomId: room, use, density: 'high', recipeId: id, seed: 1 })));
    for (const pr of props) {
      const rec = SF.RECIPES[pr.recipe.id];
      for (const it of pr.items) assert.equal(it.color, rec.palette[SF.MATERIAL_OF[it.type]], `${pr.recipe.id}/${it.type}: color de su paleta`);
      for (const it of pr.items) assert.equal(it.assetRef, undefined, 'sin modelos comerciales no autorizados');
      assert.ok(pr.recipe.notApplied.length >= 3, 'dice lo que no aplica');
    }
    for (let i = 0; i < props.length; i++) for (let j = i + 1; j < props.length; j++) {
      const d = UI.differences(props[i], props[j]);
      assert.ok(d.length >= 2, `${props[i].recipe.id} vs ${props[j].recipe.id} en ${room}: ${JSON.stringify(d)}`);
      assert.notEqual(UI.previewMarkup(props[i], 10), UI.previewMarkup(props[j], 10), 'el dibujo también cambia');
      const fills = m => [...m.matchAll(/fill="(#[0-9a-f]{6})"/gi)].map(x => x[1]).sort().join();
      assert.notEqual(fills(UI.previewMarkup(props[i], 10)), fills(UI.previewMarkup(props[j], 10)));
    }
  }
  // Control: una «receta» que solo cambia la etiqueta no produce ninguna diferencia, y el detector lo ve.
  const p = emptied('rom_living'), fake = { ...SF.RECIPES.nordico, id: 'renombrada', label: 'Nórdico renombrado' };
  const a = ok(SF.generate(p, { roomId: 'rom_living', use: 'living', density: 'high', recipeId: 'nordico', seed: 1 })), b = ok(SF.generate(p, { roomId: 'rom_living', use: 'living', density: 'high', recipe: fake, seed: 1 }));
  assert.deepEqual(UI.differences(a, b).length, 0);
});

test('recursos: color no válido, piezas inexistentes en el catálogo y alternativas por falta de sitio', () => {
  const p = emptied('rom_living');
  const badColor = { ...SF.RECIPES.nordico, id: 'mala', palette: { ...SF.RECIPES.nordico.palette, wood: 'rojo' } };
  assert.equal(SF.generate(p, { roomId: 'rom_living', use: 'living', recipe: badColor, seed: 1 }).status, 'invalid-recipe');
  const noSofa = { ...SF.RECIPES.nordico, id: 'sinsofa', pieces: { ...SF.RECIPES.nordico.pieces, sofa: ['sofa-de-lujo'] } };
  assert.equal(SF.generate(p, { roomId: 'rom_living', use: 'living', recipe: noSofa, seed: 1 }).status, 'resource-unavailable');
  const noChair = { ...SF.RECIPES.nordico, id: 'sinsillon', pieces: { ...SF.RECIPES.nordico.pieces, armchair: ['chaise-inexistente'] } };
  const r = ok(SF.generate(p, { roomId: 'rom_living', use: 'living', density: 'high', recipe: noChair, seed: 1 }));
  assert.ok(r.discarded.some(d => d.role === 'armchair' && /no disponible/.test(d.reason)));
  for (const id of Object.keys(SF.VARIANT_DEF)) assert.ok(SF.variant(id), `${id}: existe en el catálogo genérico`);
  // Rinconera de «Mediterráneo cálido» en un salón pequeño: se usa la siguiente opción y se dice.
  const small = emptied('rom_kitchen'), c = ok(SF.generate(small, { roomId: 'rom_kitchen', use: 'living', density: 'low', recipeId: 'calido', seed: 1 }));
  assert.equal(c.items[0].variant, 'sofa3'); assert.ok(c.recipe.notes.some(n => /primera opción de la receta no cabe/.test(n)), JSON.stringify(c.recipe.notes));
  const res = applied(small, c); assert.deepEqual(verify(res.project, res.added, doors(small)), []);
});

test('densidad: más densidad, más piezas (mismo uso, receta y semilla)', () => {
  const p = emptied('rom_living'), n = d => ok(SF.generate(p, { roomId: 'rom_living', use: 'living', density: d, recipeId: 'nordico', seed: 1 })).items.length;
  const [lo, me, hi] = SF.DENSITIES.map(n); assert.ok(lo < me && me < hi, `${lo} < ${me} < ${hi}`);
});
