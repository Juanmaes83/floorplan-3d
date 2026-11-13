// SCULPT-R02-A · R1 puente con el editor de RUBIK (js/r02a-ceiling-bridge.js). Con el núcleo real de RUBIK (FloorPlanCore)
// y reproduciendo cómo guarda el editor: mutate() = foto JSON, cambio, Core.validate y, si falla, vuelta a la foto;
// deshacer = volver a la foto anterior (index.html: snap/commit/mutate/undo). Datos sintéticos: el piso de referencia.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const B = require('../js/r02a-ceiling-bridge.js');
const X = require('../js/r02a-ceiling-contract.js');
const S = require('../js/r02a-ceiling-session.js');
const Core = require('../js/project-core.js');

const REF = { clearHeightMm: 2600, reference: 'finished-floor', source: 'medición sintética de prueba' };
const WARDROBE = 'obj_template-004';
const PENDANT = { id: 'cei_master-1', type: 'pendant', position: { x: 8300, y: 2300 }, size: { widthMm: 400, depthMm: 400, heightMm: 600 }, dropMm: 0 };
const deepFreeze = v => { if (v && typeof v === 'object') { Object.freeze(v); for (const k of Object.keys(v)) deepFreeze(v[k]); } return v; };
// Piso de referencia de RUBIK con alturas sintéticas en algunos muebles (cama 500, armarios 2200, mesa 750).
function flat() { const p = Core.initial(); for (const o of p.objects) { if (o.type === 'bed') o.size.heightMm = 500; if (o.type === 'wardrobe') o.size.heightMm = 2200; if (o.type === 'diningtable') o.size.heightMm = 750; } return p; }

// El editor de RUBIK, en miniatura y con la misma semántica.
function editor(project = flat()) {
  const ed = { project, undo: [], redo: [], toasts: [] };
  ed.mutate = fn => { const before = JSON.stringify(ed.project);
    try { fn(); ed.project.updatedAt = new Date(Math.max(Date.now(), Date.parse(ed.project.createdAt))).toISOString(); Core.validate(ed.project); ed.undo.push(before); ed.redo.length = 0; return true; }
    catch (e) { ed.project = JSON.parse(before); ed.toasts.push(e.message); return false; } };
  ed.doUndo = () => { ed.redo.push(JSON.stringify(ed.project)); ed.project = JSON.parse(ed.undo.pop()); };
  ed.doRedo = () => { ed.undo.push(JSON.stringify(ed.project)); ed.project = JSON.parse(ed.redo.pop()); };
  // Escribir con el puente tal como lo haría index.html: dentro de mutate, sustituyendo el proyecto por el devuelto.
  ed.write = call => ed.mutate(() => { const r = call(ed.project); if (!r.ok) throw Error(r.explanation.join(' ')); ed.project = r.project; });
  return ed;
}

test('R1 confirmar: dentro de mutate = UN paso del deshacer de RUBIK; sin referencia o bloqueado = rechazo explicado y nada cambia', () => {
  const ed = editor();
  const before = JSON.stringify(ed.project);
  assert.equal(ed.write(p => B.confirm(p, PENDANT)), false, 'sin referencia vertical: pendiente de datos → no se guarda');
  assert.equal(JSON.stringify(ed.project), before);assert.equal(ed.undo.length, 0);assert.match(ed.toasts.pop(), /Pendiente de datos|referencia/i);
  assert.ok(ed.write(p => B.setReference(p, { scope: 'room', roomId: 'rom_master', ...REF })));
  assert.ok(ed.write(p => B.confirm(p, PENDANT, { confirmedAt: '2026-11-13T09:00:00.000Z' })));
  assert.equal(ed.undo.length, 2, 'referencia y elemento: dos pasos, uno cada uno');
  assert.deepEqual(X.extension(ed.project).items.map(i => [i.id, i.roomId, i.review]), [['cei_master-1', 'rom_master', 'human-confirmed']]);
  // Encima del armario (2200 mm) una lámpara de 600 mm con techo a 2600 queda por debajo: se rechaza con su motivo.
  const n = ed.undo.length, snap = JSON.stringify(ed.project);
  assert.equal(ed.write(p => B.confirm(p, { ...PENDANT, id: 'cei_master-2', position: { x: 8800, y: 3070 } })), false);
  assert.match(ed.toasts.pop(), /Bloqueado/);assert.equal(JSON.stringify(ed.project), snap);assert.equal(ed.undo.length, n);
  // Deshacer y rehacer de RUBIK.
  ed.doUndo();assert.equal(X.extension(ed.project).items.length, 0);ed.doRedo();assert.equal(X.extension(ed.project).items.length, 1);
  assert.equal(B.remove(ed.project, 'cei_nope-1').ok, false, 'quitar algo que no está: rechazo');
  assert.ok(ed.write(p => B.remove(p, 'cei_master-1')));assert.equal(X.extension(ed.project).items.length, 0);
});

test('R1 tras una edición: el armario movido debajo de la lámpara la SEÑALA (no la mueve ni la borra); al volver, se recupera; rebajar la referencia también', () => {
  const ed = editor();ed.write(p => B.setReference(p, { scope: 'room', roomId: 'rom_master', ...REF }));ed.write(p => B.confirm(p, PENDANT));
  const label = id => ({ [WARDROBE]: 'el armario' }[id] || `«${id}»`);
  const a = deepFreeze(JSON.parse(JSON.stringify(ed.project)));
  ed.mutate(() => { ed.project.objects.find(o => o.id === WARDROBE).position = { x: 8300, y: 2300 }; });
  const b = deepFreeze(JSON.parse(JSON.stringify(ed.project)));
  const r = B.afterEdit(a, b, { labelOf: label });
  assert.equal(r.status, 'present');assert.deepEqual(r.newlyFailing.map(x => x.id), ['cei_master-1']);
  assert.match(r.newlyFailing[0].explanation.join(' '), /el armario/, 'con el motivo, en palabras');
  assert.deepEqual(X.extension(b).items.map(i => i.position), [PENDANT.position], 'no se mueve ni se borra: decide una persona');
  ed.mutate(() => { ed.project.objects.find(o => o.id === WARDROBE).position = { x: 8800, y: 3070 }; });
  const back = B.afterEdit(b, ed.project);assert.deepEqual(back.newlyFailing, []);assert.deepEqual(back.recovered.map(x => x.id), ['cei_master-1']);
  // Límite CONOCIDO (riesgo abierto del documento, decisión de producto): sin regla de paso libre para personas, una
  // lámpara a 40 cm del suelo en una zona sin muebles sigue «revisable». Se fija aquí para que no se olvide.
  const c = JSON.parse(JSON.stringify(ed.project));assert.ok(ed.write(p => B.setReference(p, { scope: 'room', roomId: 'rom_master', ...REF, clearHeightMm: 1000 })));
  assert.deepEqual(B.afterEdit(c, ed.project).newlyFailing, [], 'sin regla de paso: no se señala (límite conocido)');
  // Referencia por debajo de descuelgue + altura del elemento: deja de cumplir y se dice por qué.
  const d = JSON.parse(JSON.stringify(ed.project));assert.ok(ed.write(p => B.setReference(p, { scope: 'room', roomId: 'rom_master', ...REF, clearHeightMm: 500 })));
  const low = B.afterEdit(d, ed.project).newlyFailing;assert.deepEqual(low.map(x => x.id), ['cei_master-1']);assert.match(low[0].explanation.join(' '), /superan la altura libre/);
  // Sin extensión, o con datos de una versión futura: no informa nada que no sepa.
  assert.equal(B.afterEdit(flat(), flat()).status, 'absent');
});

test('R1 estancias: borrar una estancia y limpiar sus elementos en el MISMO mutate = un paso; deshacer devuelve las dos cosas; datos futuros o dañados no se tocan', () => {
  const ed = editor();ed.write(p => B.setReference(p, { scope: 'room', roomId: 'rom_master', ...REF }));ed.write(p => B.confirm(p, PENDANT));
  ed.write(p => B.setReference(p, { scope: 'room', roomId: 'rom_kid', ...REF }));
  const n = ed.undo.length;let removed = null;
  assert.ok(ed.mutate(() => { ed.project.rooms = ed.project.rooms.filter(r => r.id !== 'rom_master');const r = B.afterRoomsChanged(ed.project);removed = r.removed;ed.project = r.project; }));
  assert.deepEqual(removed.sort(), ['cei_master-1', 'ref:rom_master']);assert.equal(ed.undo.length, n + 1, 'un solo paso');
  assert.equal(X.validateExtension(ed.project).ok, true, 'sin huérfanos');assert.deepEqual(X.verticalFor(ed.project, 'rom_kid'), REF, 'lo de otras estancias sigue');
  ed.doUndo();assert.ok(ed.project.rooms.some(r => r.id === 'rom_master'));assert.equal(X.extension(ed.project).items.length, 1, 'deshacer devuelve estancia y lámpara');
  // Sin extensión: nada que hacer. Futura o dañada: no se toca y se dice.
  const none = flat();assert.deepEqual(B.afterRoomsChanged(none), { ok: true, project: none, removed: [] });
  for (const ext of [{ version: 9, whatever: true }, { version: 'x' }]) {
    const p = flat();p.extensions = { [X.KEY]: ext };p.rooms = p.rooms.slice(1);const r = B.afterRoomsChanged(deepFreeze(p));
    assert.equal(r.ok, true);assert.deepEqual(r.project.extensions[X.KEY], ext);assert.ok(['future', 'invalid'].includes(r.untouched));
    assert.equal(B.confirm(p, PENDANT).ok, false, 'y no se escribe encima');
  }
});

test('R1 reabrir: el archivo (JSON de RUBIK) conserva lo guardado y afterLoad lo vuelve a comprobar tal como está', () => {
  const ed = editor();ed.write(p => B.setReference(p, { scope: 'room', roomId: 'rom_master', ...REF }));ed.write(p => B.confirm(p, PENDANT));
  const again = Core.prepare(JSON.stringify(ed.project)).project;assert.deepEqual(again, ed.project);
  const r = B.afterLoad(again);assert.equal(r.status, 'present');assert.equal(r.holding, 1);assert.equal(r.failing, 0);
  assert.match(B.NOTICE.text, /altura de paso/);
});

// Secuencias aleatorias (deterministas) de lo que haría una persona en RUBIK, con cobertura mínima exigida.
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
test('R1 adversarial: 1500 secuencias (confirmar, rechazar, mover muebles, borrar estancias, referencias, deshacer, rehacer, reabrir); el proyecto siempre valida, sin huérfanos, ningún rechazo cambia nada', { timeout: 600000 }, () => {
  const R = rng(20261113), pick = a => a[Math.floor(R() * a.length)], TYPES = Object.keys(S.TYPE_LABEL);
  const cov = { confirmed: 0, refused: 0, roomsRemoved: 0, pruned: 0, flagged: 0, recovered: 0, undo: 0, redo: 0, reload: 0, moved: 0, refs: 0 };
  for (let s = 0; s < 1500; s++) {
    const ed = editor();let seq = 0;
    for (let step = 0; step < 12; step++) {
      const p = ed.project, rooms = p.rooms, items = X.extension(p).items, op = R();
      const before = JSON.stringify(p), undoN = ed.undo.length;
      if (op < 0.18) { const room = pick(rooms);if (ed.write(q => B.setReference(q, { scope: 'room', roomId: room.id, ...REF, clearHeightMm: 2300 + Math.round(R() * 7) * 100 }))) cov.refs++; }
      else if (op < 0.52) {
        // Casi siempre en una estancia con referencia y cerca de su centro (para que haya confirmados); a veces al azar
        // en cualquier punto de cualquier estancia (para que haya rechazos de todo tipo).
        const withRef = X.extension(p).verticalReferences.map(v => v.roomId), easy = R() < 0.75 && withRef.length;
        const room = easy ? rooms.find(r => r.id === pick(withRef)) || pick(rooms) : pick(rooms);
        const xs = room.polygon.map(v => v.x), ys = room.polygon.map(v => v.y), type = pick(TYPES), k = easy ? 0.3 : 1;
        const at = (lo, hi) => Math.round((lo + hi) / 2 + (R() - 0.5) * k * (hi - lo));
        const req = { id: `cei_s${s}-${seq++}`, type, position: { x: at(Math.min(...xs), Math.max(...xs)), y: at(Math.min(...ys), Math.max(...ys)) }, dropMm: Math.round(R() * 3) * 100 };
        if (ed.write(q => B.confirm(q, req))) { cov.confirmed++;
          // Lo guardado cumple en el momento de guardarlo (se re-evalúa al confirmar, nunca se fía del que llama).
          const it = B.afterLoad(ed.project).items.find(i => i.id === req.id);assert.ok(it?.holds, `guardado y revisable: ${JSON.stringify(it)}`); }
        else { cov.refused++;assert.equal(JSON.stringify(ed.project), before, 'un rechazo no cambia nada');assert.equal(ed.undo.length, undoN); }
      }
      else if (op < 0.66) {
        // Mover un mueble alto; casi siempre debajo de un elemento guardado (o lejos, para que otros vuelvan a cumplir).
        // Si algo dejó de cumplir, a veces la persona devuelve el mueble a su sitio original (y debe volver a cumplir).
        const tall = p.objects.filter(o => o.size.heightMm >= 2000), home = new Map(flat().objects.map(x => [x.id, x.position]));
        const moved = tall.filter(x => JSON.stringify(x.position) !== JSON.stringify(home.get(x.id))), fix = moved.length && R() < 0.4;
        const o = fix ? pick(moved) : pick(tall), target = fix ? home.get(o.id) : items.length && R() < 0.7 ? pick(items).position : { x: Math.round(R() * 11000), y: Math.round(R() * 9000) };
        const a = deepFreeze(JSON.parse(before));
        if (ed.mutate(() => { ed.project.objects.find(x => x.id === o.id).position = { ...target }; })) {
          cov.moved++;const rep = B.afterEdit(a, ed.project);assert.equal(JSON.stringify(a), before, 'afterEdit no escribe');
          const now = B.afterLoad(ed.project), failing = new Set(now.items.filter(i => !i.holds).map(i => i.id));
          for (const f of rep.newlyFailing) assert.ok(failing.has(f.id) && f.explanation.length, 'cada aviso es de un elemento que no cumple, con su motivo');
          assert.deepEqual(rep.failing.map(f => f.id).sort(), [...failing].sort());
          assert.deepEqual(X.extension(ed.project).items, X.extension(a).items, 'nada se mueve ni se borra solo');
          cov.flagged += rep.newlyFailing.length;cov.recovered += rep.recovered.length;
        }
      }
      else if (op < 0.72 && rooms.length > 2) {
        const gone = R() < 0.6 && items.length ? pick(items).roomId : pick(rooms).id;let removed = [];
        if (ed.mutate(() => { ed.project.rooms = ed.project.rooms.filter(r => r.id !== gone);const r = B.afterRoomsChanged(ed.project);if (!r.ok) throw Error('prune');removed = r.removed;ed.project = r.project; })) {
          cov.roomsRemoved++;cov.pruned += removed.filter(x => x.startsWith('cei_')).length;assert.equal(ed.undo.length, undoN + 1, 'estancia y limpieza: un paso');
        }
      }
      else if (op < 0.82 && ed.undo.length) { const target = ed.undo[ed.undo.length - 1];ed.doUndo();cov.undo++;assert.equal(JSON.stringify(ed.project), target, 'deshacer: byte a byte'); }
      else if (op < 0.90 && ed.redo.length) { const target = ed.redo[ed.redo.length - 1];ed.doRedo();cov.redo++;assert.equal(JSON.stringify(ed.project), target, 'rehacer: byte a byte'); }
      else { ed.project = Core.prepare(JSON.stringify(ed.project)).project;cov.reload++;assert.equal(JSON.stringify(ed.project), before, 'reabrir conserva todo'); }
      // Invariantes tras cada paso.
      assert.doesNotThrow(() => Core.validate(ed.project));
      const v = X.validateExtension(ed.project);assert.equal(v.ok, true, `extensión válida y sin huérfanos: ${JSON.stringify(v.issues)}`);
      const ids = X.extension(ed.project).items.map(i => i.id);assert.equal(new Set(ids).size, ids.length, 'ids únicos');
    }
  }
  const MIN = { confirmed: 300, refused: 300, roomsRemoved: 100, pruned: 40, flagged: 40, recovered: 5, undo: 300, redo: 50, reload: 100, moved: 300, refs: 300 };
  for (const [k, n] of Object.entries(MIN)) assert.ok(cov[k] >= n, `cobertura ${k}: ${cov[k]} ≥ ${n} (${JSON.stringify(cov)})`);
  console.log('cobertura', JSON.stringify(cov));
});

test('R1 guardas: el editor carga EXACTAMENTE los módulos R02-A en orden; el puente no usa el DOM ni escribe sin pasar por el contrato', () => {
  const root = path.join(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  // Integración (13/11/2026): index.html carga R02-A. Antes la guarda exigía que no lo cargara; ahora exige el conjunto exacto.
  const loaded = [...html.matchAll(/<script src="js\/(r02a-[^"]+)"><\/script>/g)].map(m => m[1]);
  assert.deepEqual(loaded, ['r02a-donor-extracts.js', 'r02a-ceiling-core.js', 'r02a-ceiling-session.js', 'r02a-ceiling-contract.js', 'r02a-ceiling-bridge.js', 'r02a-ceiling-editor.js']);
  const ui = fs.readFileSync(path.join(root, 'js/r02a-ceiling-editor.js'), 'utf8');
  assert.doesNotMatch(ui, /extensions\s*\[|\.extensions\s*=|localStorage|fetch\(|XMLHttpRequest|sendBeacon/, 'el panel no escribe la extensión ni guarda ni envía nada: solo FloorPlanApp.applyCeiling con el puente');
  const src = fs.readFileSync(path.join(root, 'js/r02a-ceiling-bridge.js'), 'utf8');
  assert.doesNotMatch(src, /document\.|window\.|localStorage|fetch\(/, 'puro');
  assert.doesNotMatch(src, /extensions\s*\[|\.extensions\s*=/, 'no escribe la extensión por su cuenta: solo a través de RubikCeilingContract');
});
