// OP-05 · Regresión de los dos hallazgos de Codex sobre P1/P2 (rubik-sculpt-simulator-lab@7fbbad55,
// CIERRE-P0-V5-Y-RELEVO-OP05/op05-p1p2-probe.mjs): misma construcción, resultado seguro exigido.
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {test} from 'node:test';
const three = new URL('../../../vendor/three/', import.meta.url);
registerHooks({resolve(s, c, n) { if (s === 'three') return n(new URL('build/three.module.js', three).href, c);
  if (s.startsWith('three/addons/')) return n(new URL(`examples/jsm/${s.slice(13)}`, three).href, c); return n(s, c); }});
const {loadPrivateModel} = await import('./private-loader.mjs'), Loader = await import('../../../js/asset-loader.mjs');
const {attach, read} = await import('./private-model-core.mjs');
const rights = attribution => ({basis: 'original', attribution, license: 'CC0-1.0', evidenceSha256: 'b'.repeat(64), scope: 'project-private'});

test('Hallazgo P1 · un buffer de 8 MiB + 1 se rechaza ANTES de copiarlo (0 copias)', async () => {
  const over = new ArrayBuffer(8 * 1024 * 1024 + 1), original = over.slice.bind(over); let copies = 0;
  over.slice = (...a) => { copies++; return original(...a); };
  await assert.rejects(loadPrivateModel(over, {byteLength: over.byteLength, sha256: 'a'.repeat(64)}), /supera los límites/);
  await assert.rejects(Loader.loadVerifiedBytes(over, {verify: () => {}}), /before copying/);
  const ok = new ArrayBuffer(64), o2 = ok.slice.bind(ok); let c2 = 0; ok.slice = (...a) => { c2++; return o2(...a); };
  await assert.rejects(loadPrivateModel(ok, {byteLength: 65, sha256: 'a'.repeat(64)}), /longitud/);
  await assert.rejects(Loader.loadVerifiedBytes(ok, {verify: () => {}, expectedBytes: 65}), /before copying/);
  assert.equal(copies + c2, 0, 'ninguna copia antes de validar tipo, límite F3 y longitud declarada');
});

test('Hallazgo P2 · una atribución bruta de 250 021 caracteres se rechaza; se conserva el valor recortado y acotado', () => {
  const p = {objects: [{id: 'obj_p2'}]}, admitted = attribution => ({sha256: 'a'.repeat(64), byteLength: 1, title: 'QA', rights: rights(attribution)});
  assert.throws(() => attach(p, 'obj_p2', admitted(' '.repeat(250000) + 'Laboratorio sintético')), e => e.code === 'rights-invalid');
  assert.throws(() => attach(p, 'obj_p2', {...admitted('ok'), title: ' '.repeat(5000) + 'QA'}), e => e.code === 'descriptor-invalid', 'título bruto acotado');
  const q = attach(p, 'obj_p2', admitted('  Laboratorio sintético  ')), r = read(q).models[0].rights;
  assert.equal(r.attribution, 'Laboratorio sintético'); assert.ok(r.attribution.length <= 200);
  assert.equal(r.scope, 'project-private', 'sin cambio de permisos');
  // Misma ficha normalizada → deduplica; la normalización no amplía derechos.
  assert.equal(read(attach(q, 'obj_p2', admitted('Laboratorio sintético'))).models.length, 1);
});
