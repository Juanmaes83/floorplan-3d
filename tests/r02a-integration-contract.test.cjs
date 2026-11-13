'use strict';
/* R02-A · integración en el editor (13/11/2026): contrato candidato extensions['x-r02a-ceiling'] contra los módulos REALES
   de RUBIK que leen, guardan, duplican, exportan o presupuestan el proyecto. Datos SINTÉTICOS (piso de referencia).
   Puntos del encargo: 1 sin tocar el esquema canónico · 2 proyectos antiguos/sin R02-A · 3 guardar y reabrir ·
   4 datos incompletos, dañados o futuros · 5–6 duplicar, borrar estancias, huérfanos (el resto de la secuencia
   deshacer/rehacer lo cubre r02a-ceiling-bridge con 1500 secuencias) · 7 sin contaminar otras funciones. */
const test = require('node:test'), assert = require('node:assert/strict');
const Core = require('../js/project-core.js'), L = require('../js/project-library.js'), Building = require('../js/building-core.js');
const Delivery = require('../js/client-delivery-core.js'), Draft = require('../js/budget-draft-core.js');
const X = require('../js/r02a-ceiling-contract.js'), B = require('../js/r02a-ceiling-bridge.js');
const KEY = 'x-r02a-ceiling';
const REF = { scope: 'project', clearHeightMm: 2600, reference: 'finished-floor', source: 'medición sintética de prueba' };
const LAMP = { id: 'cei_test-1', type: 'pendant', position: { x: 8300, y: 2300 }, size: { widthMm: 400, depthMm: 400, heightMm: 600 }, dropMm: 0 };
const AT = { confirmedAt: '2026-11-13T09:00:00.000Z' };
const memory = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const ok = r => { assert.ok(r.ok, JSON.stringify(r.issues || r.explanation)); return r.project; };
function withLamp(p = Core.initial()) { return ok(B.confirm(ok(B.setReference(p, REF)), LAMP, AT)); }
const canonical = p => { const { extensions, updatedAt, ...rest } = p; return JSON.stringify(rest); };

test('1 · solo cambia extensions[x-r02a-ceiling]; el resto del proyecto queda byte a byte', () => {
  const p = Core.initial(), q = withLamp(p);
  assert.equal(canonical(q), canonical(p));
  assert.deepEqual(Object.keys(q.extensions), [KEY]);
  assert.equal(q.objects.length, p.objects.length, 'no crea muebles');
  Core.validate(q);
});

test('2 · proyecto sin R02-A: nada que leer ni escribir; validación y geometría iguales', () => {
  const p = Core.initial();
  assert.equal(X.extension(p).status, 'absent');assert.equal(B.afterLoad(p).status, 'absent');
  const r = B.afterRoomsChanged(p);assert.ok(r.ok);assert.deepEqual(r.removed, []);assert.equal(JSON.stringify(r.project), JSON.stringify(p));
  const geo = x => { const { source, ...g } = Core.geometry(x); return JSON.stringify(g); };
  assert.equal(geo(withLamp(p)), geo(p), 'la geometría de RUBIK (muros, estancias, muebles) no ve los elementos de techo');
});

test('3 · guardar, cerrar y reabrir: archivo JSON (Core.prepare) y biblioteca local conservan y recomprueban', () => {
  const q = withLamp(), reopened = Core.prepare(JSON.stringify(q)).project;
  assert.deepEqual(reopened.extensions[KEY], q.extensions[KEY]);
  const rc = B.afterLoad(reopened);assert.equal(rc.status, 'present');assert.equal(rc.holding, 1);
  const st = memory(), lib = L.load(st, Core.initial());lib.save(q);
  const again = L.load(st);assert.deepEqual(again.project().extensions[KEY], q.extensions[KEY], 'la biblioteca guarda la extensión');
});

test('4 · incompletos, dañados o de una versión futura: el proyecto se abre, nada se escribe encima y se explica', () => {
  const base = withLamp(), cases = {
    'versión no entera': e => { e.version = '1'; }, 'versión futura': e => { e.version = 2; },
    'campo desconocido': e => { e.items[0].nota = 'x'; }, 'sin confirmar por una persona': e => { e.items[0].review = 'auto'; },
    'id repetido': e => { e.items.push({ ...e.items[0] }); }, 'sin descuelgue': e => { delete e.items[0].dropMm; },
    'referencia sin fuente': e => { e.verticalReferences[0].source = ''; }, 'tipo desconocido': e => { e.items[0].type = 'foco'; } };
  for (const [name, damage] of Object.entries(cases)) {
    const p = structuredClone(base);damage(p.extensions[KEY]);
    Core.validate(p); // un lector que no conoce R02-A sigue abriendo el proyecto
    const status = X.extension(p).status, rc = B.afterLoad(p);
    assert.notEqual(rc.status, 'present', `${name}: no se presenta como válido (${rc.status})`);
    assert.equal(B.confirm(p, { ...LAMP, id: 'cei_test-2' }, AT).ok, false, `${name}: no se escribe encima`);
    assert.equal(B.setReference(p, REF).ok, false, `${name}: tampoco la referencia`);
    const r = B.afterRoomsChanged(p);assert.equal(JSON.stringify(r.project), JSON.stringify(p), `${name}: la limpieza no toca datos que no entiende`);
    if (status === 'future') assert.equal(r.untouched, 'future');
  }
});

test('5–6 · duplicar como variante conserva la extensión; borrar la estancia retira sus elementos en el mismo paso', () => {
  const q = withLamp(), st = memory(), lib = L.load(st, q);
  lib.variant(q, 'Variante techo');
  const v = lib.group(lib.activeId()).find(g => g.id === lib.activeId());
  assert.deepEqual(v.project.extensions[KEY].items.map(i => i.id), ['cei_test-1'], 'la variante copia los elementos');
  const roomId = q.extensions[KEY].items[0].roomId, cut = structuredClone(q);
  cut.rooms = cut.rooms.filter(r => r.id !== roomId);
  const r = B.afterRoomsChanged(cut);assert.ok(r.ok);assert.deepEqual(r.removed, ['cei_test-1']);
  assert.deepEqual(X.extension(r.project).items, [], 'sin huérfanos');
  assert.deepEqual(X.extension(r.project).verticalReferences.map(v => v.scope), ['project'], 'la referencia de la planta sigue: no dependía de la estancia');
});

test('referencia: por planta con excepción por estancia; quitarla deja los elementos «pendientes de datos», sin moverlos', () => {
  let p = withLamp();const roomId = p.extensions[KEY].items[0].roomId;
  assert.equal(X.verticalFor(p, roomId).clearHeightMm, 2600, 'sin referencia propia, la estancia usa la de la planta');
  p = ok(B.setReference(p, { scope: 'room', roomId, clearHeightMm: 2400, reference: 'finished-floor', source: 'falso techo medido (sintético)' }));
  assert.equal(X.verticalFor(p, roomId).clearHeightMm, 2400, 'la de la estancia manda');
  p = ok(B.clearReference(p, { scope: 'room', roomId }));assert.equal(X.verticalFor(p, roomId).clearHeightMm, 2600);
  p = ok(B.clearReference(p, { scope: 'project' }));
  assert.equal(X.verticalFor(p, roomId), null, 'sin referencia: desconocida, nunca supuesta');
  const rc = B.afterLoad(p);assert.equal(rc.failing, 1);assert.equal(rc.items[0].state, 'pending');
  assert.deepEqual(p.extensions[KEY].items[0].position, LAMP.position, 'no se mueve');
  assert.equal(B.clearReference(p, { scope: 'project' }).ok, false, 'quitar lo que no existe se rechaza');
});

test('7 · sin contaminar: entrega al cliente, presupuesto, edificio y R03 no ven ni pierden nada', () => {
  const p = Core.initial(), q = withLamp(p);
  assert.equal(Delivery.minimizeProject(q).extensions, undefined, 'ENT-01 no entrega la extensión al cliente');
  const LABELS = { title: 'Presupuesto', floor: 'Pavimento', skirting: 'Rodapié', paint: 'Pintura', newWalls: 'Tabiquería', demolition: 'Demolición', door: 'Puerta', slidingDoor: 'Corredera', window: 'Ventana', tariff: 'Tarifa',
    chapters: { floors: 'Pavimentos', walls: 'Paredes', partitions: 'Tabiquería', carpentry: 'Carpintería' } };
  const lines = x => JSON.stringify(Draft.lines(x, { labels: LABELS }).map(l => [l.tariffKey, l.quantity]));
  assert.equal(lines(q), lines(p), 'el borrador de presupuesto no cambia');
  const b = Building.create(q);Building.validate(b);assert.deepEqual(b.levels[0].project.extensions[KEY], q.extensions[KEY], 'una planta de edificio la conserva');
  const both = structuredClone(q);both.extensions['x-r03-cabinet'] = { version: 1, entries: [] };Core.validate(both);
  const cut = structuredClone(both);cut.rooms = cut.rooms.filter(r => r.id !== q.extensions[KEY].items[0].roomId);
  const r = B.afterRoomsChanged(cut);assert.deepEqual(r.project.extensions['x-r03-cabinet'], { version: 1, entries: [] }, 'la limpieza de R02-A no toca R03');
});
