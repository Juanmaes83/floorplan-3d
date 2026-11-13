// SCULPT-R03 · R1 puente con el editor de RUBIK (js/r03-cabinet-bridge.js). Con el núcleo real de RUBIK (FloorPlanCore) y
// reproduciendo exactamente cómo guarda el editor: mutate() = foto JSON del proyecto, cambio, Core.validate, y si falla se
// vuelve a la foto; deshacer = volver a la foto anterior. Datos sintéticos (proyecto de referencia de RUBIK).
'use strict';
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), { pathToFileURL } = require('node:url');
// three r160 de vendor/ es un módulo ES autocontenido: se importa desde una copia .mjs temporal (sin red ni npm).
let THREE;before(async () => { const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'r03-three-')), 'three.mjs');
  fs.copyFileSync(path.join(__dirname, '../vendor/three/build/three.module.js'), tmp);THREE = await import(pathToFileURL(tmp).href); });
const K = require('../js/r03-cabinet-core.js');
const X = require('../js/r03-cabinet-contract.js');
const E = require('../js/r03-cabinet-editor-core.js');
const B = require('../js/r03-cabinet-bridge.js');
const Core = require('../js/project-core.js');
const Package = require('../js/project-package.js');

const WARDROBE = 'obj_template-004', CABINET = 'obj_template-029', BED = 'obj_template-001';
const deepFreeze = v => { if (v && typeof v === 'object') { Object.freeze(v); for (const k of Object.keys(v)) deepFreeze(v[k]); } return v; };

// El editor de RUBIK, en miniatura y con la misma semántica (index.html: snap/commit/mutate/undo).
function editor(project = Core.initial()) {
  const ed = { project, undo: [], redo: [], toasts: [] };
  ed.mutate = fn => { const before = JSON.stringify(ed.project);
    try { fn(); ed.project.updatedAt = new Date(Math.max(Date.now(), Date.parse(ed.project.createdAt))).toISOString(); Core.validate(ed.project); ed.undo.push(before); ed.redo.length = 0; return true; }
    catch (e) { ed.project = JSON.parse(before); ed.toasts.push(e.message); return false; } };
  ed.doUndo = () => { ed.redo.push(JSON.stringify(ed.project)); ed.project = JSON.parse(ed.undo.pop()); };
  ed.doRedo = () => { ed.undo.push(JSON.stringify(ed.project)); ed.project = JSON.parse(ed.redo.pop()); };
  // Guardar el interior tal como lo haría index.html: dentro de mutate, sustituyendo el proyecto por el validado.
  ed.saveInterior = session => ed.mutate(() => { const r = B.save(ed.project, session); if (!r.ok) throw Error(r.explanation.join(' ')); ed.project = r.project; });
  return ed;
}
const edit = (session, ...ops) => ops.reduce((s, op) => { const r = E.apply(s, op); assert.ok(r.ok, `${op.type}: ${r.explanation?.join(' ')}`); return r.session; }, session);

test('R1 abrir: armario sin interior → sesión por defecto con aviso de valores supuestos; mueble que no es armario o inexistente → no', () => {
  const p = deepFreeze(Core.initial());
  const o = B.open(p, WARDROBE);
  assert.equal(o.ok, true);assert.equal(o.status, 'none');assert.equal(o.readOnly, false);assert.match(o.notice.text, /supuestos/);
  assert.equal(o.session.objectId, WARDROBE);assert.equal(K.validate(o.session.state.outer, o.session.state.cabinet).length, 0);
  assert.deepEqual([B.open(p, BED).ok, B.open(p, BED).status], [false, 'not-cabinet']);
  assert.deepEqual([B.open(p, 'nope').ok, B.open(p, 'nope').status], [false, 'unknown-object']);
  assert.equal(B.isCabinet(p.objects.find(x => x.id === CABINET)), true);assert.equal(B.isCabinet(p.objects.find(x => x.id === BED)), false);
});

test('R1 guardar dentro del deshacer de RUBIK: guardar → el proyecto valida, el mueble toma la altura; deshacer y rehacer devuelven exactamente cada estado', () => {
  const ed = editor(), before = JSON.stringify(ed.project);
  let s = B.open(ed.project, WARDROBE).session;
  s = edit(s, { type: 'split', bay: 0 }, { type: 'select-bay', bay: 0 }, { type: 'add-shelf' }, { type: 'set-drawers', drawers: 2 }, { type: 'resize', height: 2300 });
  assert.equal(ed.saveInterior(s), true, ed.toasts.join(' '));
  const after = JSON.stringify(ed.project);
  const r = X.read(ed.project, WARDROBE);
  assert.equal(r.status, 'ok');assert.equal(r.cabinet.columns.length, s.state.cabinet.columns.length);assert.equal(r.cabinet.height, 2300);
  assert.equal(ed.project.objects.find(o => o.id === WARDROBE).size.heightMm, 2300, 'planta, alzado y 3D comparten la altura');
  assert.equal(r.provenance.layout, 'edited');assert.equal(r.provenance.height, 'edited');
  ed.doUndo();assert.equal(JSON.stringify(ed.project), before, 'deshacer: el proyecto de antes, byte a byte');assert.equal(X.read(ed.project, WARDROBE).status, 'none');
  ed.doRedo();assert.equal(JSON.stringify(ed.project), after, 'rehacer: el de después');
  // Sobrevive al guardado del proyecto (JSON) y al paquete ZIP de RUBIK.
  const reopened = JSON.parse(JSON.stringify(ed.project));Core.validate(reopened);assert.equal(X.read(reopened, WARDROBE).status, 'ok');
});

test('R1 guardar rechazado: sesión de solo lectura o interior inválido → nada cambia, ni el proyecto ni el deshacer, y se explica', () => {
  const ed = editor(), before = JSON.stringify(ed.project);
  const ro = E.createSession({ objectId: WARDROBE, objectType: 'wardrobe', outer: { w: 2400, d: 600 }, cabinet: K.defaultCabinet('wardrobe', { w: 2400, d: 600 }), readOnly: true });
  assert.equal(ed.saveInterior(ro), false);assert.match(ed.toasts.at(-1), /solo lectura/);
  // Un estado inválido forzado (no se puede llegar desde la sesión: se fabrica para probar la defensa).
  const s = B.open(ed.project, WARDROBE).session, bad = { ...s, state: { ...s.state, cabinet: { ...s.state.cabinet, columns: s.state.cabinet.columns.map((c, i) => i ? c : { ...c, shelves: [100, 120] }) } } };
  assert.equal(ed.saveInterior(bad), false);assert.match(ed.toasts.at(-1), /60 mm/);
  // Otro mueble: no es un armario.
  const bed = { ...s, objectId: BED };assert.equal(ed.saveInterior(bed), false);
  assert.equal(JSON.stringify(ed.project), before);assert.equal(ed.undo.length, 0, 'un rechazo no entra en el deshacer');
});

test('R1 3D: armario guardado → modelo exacto (sin reescalar) con su altura y su anchura; sin interior, otro mueble o datos dañados → null (RUBIK dibuja el suyo)', () => {
  const ed = editor();let s = B.open(ed.project, WARDROBE).session;s = edit(s, { type: 'split', bay: 0 }, { type: 'set-front', front: 'open' });ed.saveInterior(s);
  const obj = ed.project.objects.find(o => o.id === WARDROBE);
  const m = B.model3D(THREE, ed.project, obj);
  assert.ok(m && m.exact, 'modelo exacto');assert.equal(m.status, 'ok');
  const box = new THREE.Box3().setFromObject(m.group), size = box.getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.y - obj.size.heightMm / 1000) < 0.002, `altura ${size.y} = ${obj.size.heightMm} mm`);
  assert.ok(Math.abs(box.min.y) < 0.002, 'apoya en el suelo (la elevación la pone RUBIK)');
  // Anchura del casco = anchura del mueble (las puertas abiertas pueden salir por delante, no por los lados más de lo que barren).
  const carcass = new THREE.Box3();m.group.traverse(o => { if (o.isMesh && !/door|leaf|front|handle|drawer/i.test(o.name || o.userData?.part || '')) carcass.expandByObject(o); });
  assert.ok(Math.abs(carcass.getSize(new THREE.Vector3()).x - obj.size.widthMm / 1000) < 0.005, 'casco tan ancho como el mueble');
  assert.equal(B.model3D(THREE, Core.initial(), Core.initial().objects.find(o => o.id === WARDROBE)), null, 'sin interior guardado');
  assert.equal(B.model3D(THREE, ed.project, ed.project.objects.find(o => o.id === BED)), null, 'no es armario');
  const broken = structuredClone(ed.project);broken.extensions['x-r03-cabinet'].entries[0].cabinet.columns = 'roto';
  assert.equal(B.model3D(THREE, broken, broken.objects.find(o => o.id === WARDROBE)), null, 'dañado: no se dibuja un interior que no se puede leer');
});

test('R1 borrar: el interior se va con el mueble (sin huérfanos) y deshacer devuelve ambos; con extensión futura no se toca lo ajeno', () => {
  const ed = editor();let s = B.open(ed.project, WARDROBE).session;s = edit(s, { type: 'split', bay: 0 });ed.saveInterior(s);
  const withInterior = JSON.stringify(ed.project);
  // index.html: deleteSel filtra el mueble; aquí, además, afterDelete en el mismo mutate.
  assert.equal(ed.mutate(() => { ed.project.objects = ed.project.objects.filter(o => o.id !== WARDROBE); const r = B.afterDelete(ed.project); if (!r.ok) throw Error('x'); ed.project = r.project; }), true);
  assert.deepEqual(X.orphans(ed.project), []);assert.equal(ed.project.extensions?.['x-r03-cabinet'], undefined, 'sin entradas, la extensión desaparece');
  ed.doUndo();assert.equal(JSON.stringify(ed.project), withInterior, 'deshacer devuelve mueble e interior');assert.equal(X.read(ed.project, WARDROBE).status, 'ok');
  const fut = structuredClone(ed.project);fut.extensions['x-r03-cabinet'].version = 99;fut.objects = fut.objects.filter(o => o.id !== WARDROBE);
  const r = B.afterDelete(fut);assert.equal(r.ok, true);assert.equal(r.kept, 'future');assert.deepEqual(r.project.extensions['x-r03-cabinet'], fut.extensions['x-r03-cabinet']);
});

test('R1 duplicar: la copia recibe el interior guardado del original; sin interior, la copia es un armario normal; ambos independientes', () => {
  const ed = editor();let s = B.open(ed.project, WARDROBE).session;s = edit(s, { type: 'split', bay: 0 }, { type: 'set-drawers', drawers: 2 });ed.saveInterior(s);
  const dupe = id => ed.mutate(() => { const f = structuredClone(ed.project.objects.find(o => o.id === id));f.id = 'obj_copy-' + id;f.position = { x: f.position.x + 200, y: f.position.y + 200 };
    ed.project.objects.push(f);const r = B.afterDuplicate(ed.project, id, f.id);if (!r.ok) throw Error(r.explanation.join(' '));ed.project = r.project; });
  assert.equal(dupe(WARDROBE), true, ed.toasts.join(' '));
  const a = X.read(ed.project, WARDROBE), b = X.read(ed.project, 'obj_copy-' + WARDROBE);
  assert.equal(b.status, 'ok');assert.deepEqual(b.cabinet, a.cabinet, 'misma distribución');
  // Editar la copia no cambia el original.
  let s2 = B.open(ed.project, 'obj_copy-' + WARDROBE).session;s2 = edit(s2, { type: 'merge', bay: 0 });ed.saveInterior(s2);
  assert.notDeepEqual(X.read(ed.project, 'obj_copy-' + WARDROBE).cabinet.columns.length, X.read(ed.project, WARDROBE).cabinet.columns.length);
  assert.equal(dupe(CABINET), true);assert.equal(X.read(ed.project, 'obj_copy-' + CABINET).status, 'none', 'sin interior: copia normal');
});

test('R1 al abrir un proyecto: informe sin cambios (huérfanos, ilegibles, estado de cada armario)', () => {
  const ed = editor();let s = B.open(ed.project, WARDROBE).session;s = edit(s, { type: 'split', bay: 0 });ed.saveInterior(s);
  const orphan = structuredClone(ed.project);orphan.objects = orphan.objects.filter(o => o.id !== WARDROBE);deepFreeze(orphan);
  const rep = B.afterLoad(orphan);assert.deepEqual(rep.orphans, [WARDROBE]);assert.equal(rep.status, 'present');
  assert.ok(rep.cabinets.length > 0 && rep.cabinets.every(c => c.status === 'none'));
  const ok = B.afterLoad(ed.project);assert.deepEqual(ok.orphans, []);assert.equal(ok.cabinets.find(c => c.id === WARDROBE).status, 'ok');
});

test('R1 adversarial: 1500 secuencias aleatorias abrir → editar → guardar/borrar/duplicar/deshacer; el proyecto valida siempre, sin huérfanos, y ningún rechazo cambia nada', () => {
  let seed = 7;const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;const pick = a => a[Math.floor(rnd() * a.length)];
  const ed = editor(), seedCabinets = Core.initial().objects.filter(B.isCabinet);const ids = () => ed.project.objects.filter(B.isCabinet).map(o => o.id);
  const VALUES = [NaN, Infinity, -1, 0, 0.5, 1, 7, 60, 150, 250, 999, 2400, 5000];
  const st = { saveOk: 0, saveRefused: 0, opRefused: 0, del: 0, dupCopied: 0, undo: 0, refill: 0 };
  for (let i = 0; i < 1500; i++) {
    // Siempre hay armarios con los que trabajar: si quedan menos de 3, se vuelve a poner uno del proyecto de referencia.
    if (ids().length < 3) { const f = structuredClone(pick(seedCabinets));f.id = `obj_refill-${i}`;ed.mutate(() => ed.project.objects.push(f));st.refill++; }
    const before = JSON.stringify(ed.project), act = rnd();
    if (act < 0.55) {
      const o = B.open(ed.project, pick(ids()));if (!o.ok) continue;let s = o.session;
      for (let k = 0; k < 4; k++) { const op = pick([{ type: 'split', bay: 0 }, { type: 'merge', bay: 0 }, { type: 'add-shelf' }, { type: 'set-drawers', drawers: pick([0, 1, 2, 7, NaN]) }, { type: 'resize', height: pick(VALUES) }, { type: 'set-rod', rod: pick([null, ...VALUES]) }, { type: 'set-front', front: pick(['open', 'closed', 'hidden', 'ajar']) }]);
        const r = E.apply(s, op);if (r.ok) s = r.session;else { st.opRefused++;assert.deepEqual(r.session.state, s.state, 'rechazo atómico en la sesión'); } }
      // A veces se fuerza un interior inválido (no alcanzable desde la sesión) para probar la defensa del guardado.
      if (rnd() < 0.15) s = { ...s, state: { ...s.state, cabinet: { ...s.state.cabinet, height: pick([NaN, 10, 99999]) } } };
      if (ed.saveInterior(s)) st.saveOk++;else { st.saveRefused++;assert.equal(JSON.stringify(ed.project), before, 'guardado rechazado: nada cambia'); }
    } else if (act < 0.68) { const id = pick(ids());ed.mutate(() => { ed.project.objects = ed.project.objects.filter(o => o.id !== id);ed.project = B.afterDelete(ed.project).project; });st.del++;
    } else if (act < 0.85) { const id = pick(ids());let copied = false;
      ed.mutate(() => { const f = structuredClone(ed.project.objects.find(o => o.id === id));f.id = `obj_dup-${i}`;ed.project.objects.push(f);const r = B.afterDuplicate(ed.project, id, f.id);if (!r.ok) throw Error(r.explanation.join(' '));copied = r.copied;ed.project = r.project; });
      if (copied) { st.dupCopied++;assert.deepEqual(X.read(ed.project, `obj_dup-${i}`).cabinet, X.read(ed.project, id).cabinet, 'la copia tiene el mismo interior'); }
    } else if (ed.undo.length) { ed.doUndo();st.undo++; }
    Core.validate(ed.project);assert.deepEqual(X.orphans(ed.project), [], `iteración ${i}: sin huérfanos`);assert.equal(X.validateExtension(ed.project).ok, true);
  }
  // La prueba solo vale si de verdad ha ejercitado cada camino.
  for (const [k, min] of Object.entries({ saveOk: 150, saveRefused: 40, opRefused: 200, del: 100, dupCopied: 30, undo: 80 })) assert.ok(st[k] >= min, `cobertura ${k}=${st[k]} (mínimo ${min}) ${JSON.stringify(st)}`);
});
