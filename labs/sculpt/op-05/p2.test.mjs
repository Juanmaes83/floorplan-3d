// OP-05 · P2 · Núcleo puro de referencias privadas. Proyectos sintéticos en memoria; ninguna persistencia.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {test} from 'node:test';
import * as P from './private-model-core.mjs';
const require = createRequire(import.meta.url), Core = require('../../../js/project-core.js'), Mue = require('../../../js/own-furniture-core.js');
const bench = await readFile(new URL('../../../assets/f3/synthetic-bench.glb', import.meta.url));
const evidence = createHash('sha256').update(await readFile(new URL('../../../assets/f3/LICENSE.txt', import.meta.url))).digest('hex');
const admitted = (over = {}) => ({sha256: createHash('sha256').update(bench).digest('hex'), byteLength: bench.length, title: 'Banco sintético',
  rights: {basis: 'original', attribution: 'RUBIK · banco sintético', license: 'MIT', evidenceSha256: evidence, scope: P.SCOPE}, ...over});
const project = (id = 'prj_op05lab000000000000000000000000') => { const p = Core.clone(Core.initial()); p.id = id; return p; };
const objectOf = p => p.objects[0].id;
const ids = (() => { let n = 0; return () => 'pmd_' + String(++n).padStart(32, '0'); })();

test('P2 · asociar: proyecto NUEVO, el original intacto, el objeto canónico sin cambios y el proyecto sigue siendo válido', () => {
  const p = project(), snap = JSON.stringify(p), o = objectOf(p), q = P.attach(p, o, admitted());
  assert.equal(JSON.stringify(p), snap, 'inmutabilidad del proyecto fuente');
  assert.deepEqual(q.objects, p.objects, 'id, posición, rotación, cotas y assetRef del objeto no cambian');
  assert.equal(q.schemaVersion, p.schemaVersion, 'sin cambio de versión (no interfiere con OP-07)');
  Core.validate(q); Core.validate(q, {strict: true});
  const ext = P.read(q); assert.equal(ext.items[0].objectId, o); assert.equal(ext.models[0].profileId, 'f3-v1');
});

test('P2 · identificador opaco: aleatorio, con formato propio y sin relación con el SHA-256', () => {
  const a = P.newModelId(), b = P.newModelId(), sha = admitted().sha256;
  assert.match(a, /^pmd_[a-f0-9]{32}$/); assert.notEqual(a, b);
  assert.ok(!sha.includes(a.slice(4)) && !a.includes(sha.slice(0, 16)));
  const q = P.attach(project(), objectOf(project()), admitted());
  assert.notEqual(P.read(q).models[0].modelId, 'model-' + sha, 'no es el id derivado del digest del laboratorio');
});

test('P2 · deduplicación sin ampliar derechos: misma ficha → reutiliza; otra ficha con los mismos bytes → conflicto', () => {
  const p = project(), [a, b] = [p.objects[0].id, p.objects[1].id];
  const q = P.attach(P.attach(p, a, admitted(), {modelId: ids}), b, admitted(), {modelId: ids});
  const ext = P.read(q); assert.equal(ext.models.length, 1); assert.equal(ext.items.length, 2); assert.equal(ext.items[0].modelId, ext.items[1].modelId);
  const wider = admitted({rights: {...admitted().rights, basis: 'licensed', license: 'CC-BY-4.0'}});
  assert.throws(() => P.attach(q, b, wider), e => e.code === 'rights-conflict');
});

test('P2 · validación estricta: campos desconocidos, ámbito no privado, huella o perfil distintos y referencias rotas', () => {
  const p = project(), o = objectOf(p);
  for (const bad of [admitted({rights: {...admitted().rights, scope: 'public'}}), admitted({rights: {...admitted().rights, url: 'https://x'}}), admitted({rights: {...admitted().rights, evidenceSha256: 'x'}})])
    assert.throws(() => P.attach(p, o, bad), e => e.code === 'rights-invalid');
  assert.throws(() => P.attach(p, 'obj_noexiste', admitted()), e => e.code === 'object-not-found');
  assert.throws(() => P.attach(p, o, admitted({byteLength: 9 * 1024 * 1024})), e => e.code === 'descriptor-invalid', 'perfil F3: 8 MiB');
  const q = P.attach(p, o, admitted());
  const tamper = f => { const t = Core.clone(q); f(t.extensions[P.EXT]); return t; };
  for (const t of [tamper(e => { e.items[0].sha256 = '0'.repeat(64); }), tamper(e => { e.models[0].extra = 1; }), tamper(e => { e.version = 2; }), tamper(e => { e.items[0].objectId = 'obj_otro'; })])
    assert.throws(() => P.read(t), e => e.code === 'extension-invalid' || e.code === 'descriptor-invalid');
});

test('P2 · resolución: privada solo con bytes disponibles y huella igual; si no, genérica con su razón', () => {
  const p = project(), o = objectOf(p), q = P.attach(p, o, admitted()), {sha256, byteLength} = admitted();
  assert.deepEqual(P.resolve(q, o), {kind: 'generic', reason: 'bytes-unavailable'});
  assert.equal(P.resolve(q, o, {available: (s, n) => s === sha256 && n === byteLength}).kind, 'private');
  assert.deepEqual(P.resolve(q, p.objects[1].id, {available: () => true}), {kind: 'generic', reason: 'no-private-model'});
  const broken = Core.clone(q); broken.extensions[P.EXT].version = 9;
  assert.deepEqual(P.resolve(broken, o, {available: () => true}), {kind: 'generic', reason: 'invalid-reference'});
  assert.deepEqual(P.genericObjects(broken), broken.objects.map(x => x.id), 'ante una extensión dañada, todo genérico (falla cerrado)');
});

test('P2 · aislamiento por proyecto: una referencia de A no resuelve en B aunque comparta IDs de objeto', () => {
  const a = project('prj_op05aaaaaaaaaaaaaaaaaaaaaaaaaaaaa'), b = project('prj_op05bbbbbbbbbbbbbbbbbbbbbbbbbbbbb'), o = objectOf(a);
  const qa = P.attach(a, o, admitted());
  assert.equal(P.resolve(b, o, {available: () => true}).kind, 'generic');
  assert.equal(b.extensions?.[P.EXT], undefined);
  assert.notEqual(P.read(P.attach(b, o, admitted())).models[0].modelId, P.read(qa).models[0].modelId, 'ficha propia de cada proyecto');
});

test('P2 · minimización: ninguna salida compartida contiene ids, huellas, derechos ni títulos; destino desconocido → error', () => {
  const p = project(), o = objectOf(p), q = P.attach(p, o, admitted()), d = P.read(q).models[0];
  const secrets = [d.modelId, d.sha256, d.rights.evidenceSha256, d.title, d.rights.attribution, P.EXT];
  for (const dest of P.SHARED_DESTINATIONS) {
    const m = P.minimize(q, dest), json = JSON.stringify(m);
    for (const s of secrets) assert.ok(!json.includes(s), `${dest}: sin «${s.slice(0, 12)}…»`);
    assert.deepEqual(m.objects, q.objects, `${dest}: objetos canónicos intactos (representación genérica)`);
    Core.validate(m);
  }
  assert.ok(JSON.stringify(q).includes(d.sha256), 'el original conserva su referencia (la minimización no lo modifica)');
  for (const dest of ['share-link', 'studio', 'ffe', '', undefined, 'PROJECT-EXPORT'])
    assert.throws(() => P.minimize(q, dest), e => e.code === 'destination-unknown', String(dest));
  assert.throws(() => P.minimize(q, 'private-expediente'), e => e.code === 'not-available');
  assert.deepEqual(P.genericObjects(q), [o], 'los consumidores visuales saben qué objetos llevan la representación genérica');
});

test('P2 · compatibilidad: convive con MUE-01 y otras extensiones sin tocarlas; quitar la última referencia retira la extensión', () => {
  const p = project(), o = objectOf(p);
  p.extensions = {'x-mue01-furniture-photo': {version: 1, items: [{objectId: o, photo: null}]}, 'x-otra': {a: 1}};
  const before = JSON.stringify(p.extensions['x-mue01-furniture-photo']);
  assert.deepEqual(Mue.read(p), Mue.read(P.attach(p, o, admitted())), 'MUE-01 lee lo mismo antes y después');
  const q = P.attach(p, o, admitted());
  assert.equal(JSON.stringify(q.extensions['x-mue01-furniture-photo']), before); assert.deepEqual(q.extensions['x-otra'], {a: 1});
  const r = P.detach(q, o); assert.equal(r.extensions[P.EXT], undefined); assert.deepEqual(Object.keys(r.extensions).sort(), ['x-mue01-furniture-photo', 'x-otra']);
  const minimized = P.minimize(q, 'project-export');
  assert.equal(JSON.stringify(minimized.extensions['x-mue01-furniture-photo']), before, 'MUE-01 no cambia (decisión: no tocar MUE-01)');
});
