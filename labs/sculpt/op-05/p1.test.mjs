// OP-05 · P1 · Port JS de localGLB* y cargador privado. Reutiliza los fixtures de admission.test.mjs; solo prueba el delta.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {registerHooks} from 'node:module';
import {execFileSync} from 'node:child_process';
import {test} from 'node:test';

const three = new URL('../../../vendor/three/', import.meta.url), donor = new URL('./upstream/src/lib/utils/', import.meta.url);
registerHooks({resolve(specifier, context, nextResolve) {
  if (specifier === 'three') return nextResolve(new URL('build/three.module.js', three).href, context);
  if (specifier.startsWith('three/addons/')) return nextResolve(new URL(`examples/jsm/${specifier.slice('three/addons/'.length)}`, three).href, context);
  if (context.parentURL?.startsWith(donor.href) && /^\.\/[a-zA-Z0-9]+$/.test(specifier)) return nextResolve(new URL(`${specifier}.ts`, context.parentURL).href, context);
  return nextResolve(specifier, context);
}});
const Original = await import('./upstream/src/lib/utils/localGLBGeometry.ts'), Port = await import('./js/localGLBGeometry.mjs');
const Loader = await import('../../../js/asset-loader.mjs'), {loadPrivateModel, verifyPrivateBytes, PRIVATE_NORMALIZATION} = await import('./private-loader.mjs');
const bench = async () => Uint8Array.from(await readFile(new URL('../../../assets/f3/synthetic-bench.glb', import.meta.url))).buffer;
const sha = b => createHash('sha256').update(new Uint8Array(b)).digest('hex');
function rewrite(source, edit) { // mismo helper que admission.test.mjs
  const header = new DataView(source), jsonLength = header.getUint32(12, true);
  const document = JSON.parse(new TextDecoder().decode(source.slice(20, 20 + jsonLength))), bin = new Uint8Array(source.slice(28 + jsonLength));
  const binary = edit(document, bin) || bin, json = new TextEncoder().encode(JSON.stringify(document)), length = Math.ceil(json.length / 4) * 4;
  const bytes = new Uint8Array(28 + length + binary.length), out = new DataView(bytes.buffer);
  [0x46546c67, 2, bytes.length, length, 0x4e4f534a].forEach((w, i) => out.setUint32(i * 4, w, true));
  bytes.fill(32, 20, 20 + length); bytes.set(json, 20); out.setUint32(20 + length, binary.length, true); out.setUint32(24 + length, 0x004e4942, true); bytes.set(binary, 28 + length);
  return bytes.buffer;
}
// Mutaciones negativas (las mismas familias que el laboratorio) + la base válida.
const MUTATIONS = {
  valid: () => {},
  externalUri: d => { d.buffers[0].uri = 'https://example.com/b.bin'; },
  badIndex: d => { const a = d.meshes[0].primitives[0].indices; if (a !== undefined) d.accessors[a].count = 1e9; else d.accessors[0].count = 1e9; },
  nodeCycle: d => { d.nodes[0].children = [0]; },
  missingAccessor: d => { d.meshes[0].primitives[0].attributes.POSITION = 999; },
  amplified: d => { d.nodes = Array.from({length: 4096}, (_, i) => ({mesh: 0})); d.scenes[0].nodes = d.nodes.map((_, i) => i); },
};
const outcome = (M, buffer) => { try { const document = Loader.inspectGLB(buffer), binary = new Uint8Array(buffer, 28 + new DataView(buffer).getUint32(12, true));
  const r = M.validateLocalGLBGeometry({document, binary}); return {ok: true, scene: JSON.stringify(r.scene)}; } catch (e) { return {ok: false, message: e.message}; } };

test('P1 · el port JS es la transformación exacta de los originales (regenerable y sin edición manual)', () => {
  execFileSync(process.execPath, [new URL('./js/port.cjs', import.meta.url).pathname, '--check'], {stdio: 'pipe'});
});

test('P1 · paridad de validación: original TS y port JS dan el mismo resultado en la base y en cada negativo', async () => {
  const base = await bench(); let rejected = 0;
  for (const [name, edit] of Object.entries(MUTATIONS)) {
    const b = name === 'valid' ? base.slice(0) : rewrite(base.slice(0), edit);
    const a = outcome(Original, b), c = outcome(Port, b);
    assert.deepEqual(c, a, name);
    if (name === 'valid') assert.equal(a.ok, true); else if (!a.ok) rejected++;
  }
  assert.ok(rejected >= 4, `los negativos se rechazan (${rejected})`);
});

test('P1 · el cargador privado no acepta URL ni Blob y no se salta longitud, huella, geometría ni presupuesto', async () => {
  const b = await bench(), d = {sha256: sha(b), byteLength: b.byteLength};
  await assert.rejects(verifyPrivateBytes('https://example.com/m.glb', d), /Solo se aceptan bytes/);
  await assert.rejects(Loader.loadVerifiedBytes(new Blob([b]), {verify: () => {}}), /Only verified bytes/);
  await assert.rejects(Loader.loadVerifiedBytes(b), /verification step is required/);
  await assert.rejects(verifyPrivateBytes(b, {...d, byteLength: d.byteLength + 1}), /longitud/);
  await assert.rejects(verifyPrivateBytes(b, {...d, sha256: '0'.repeat(64)}), /huella/);
  await assert.rejects(verifyPrivateBytes(new ArrayBuffer(Loader.LIMITS.bytes + 1), {sha256: '0'.repeat(64), byteLength: Loader.LIMITS.bytes + 1}), /límites/);
  for (const name of ['externalUri', 'nodeCycle', 'missingAccessor', 'amplified']) {
    const m = rewrite(b.slice(0), MUTATIONS[name]);
    await assert.rejects(verifyPrivateBytes(m, {sha256: sha(m), byteLength: m.byteLength}), undefined, name);
  }
});

test('P1 · carga privada: medidas de MALLA, normalización declarada, escala no certificada; el original no se toca', async () => {
  const b = await bench(), copy = new Uint8Array(b.slice(0)), d = {sha256: sha(b), byteLength: b.byteLength};
  const r = await loadPrivateModel(b, d);
  assert.deepEqual(new Uint8Array(b), copy, 'los bytes del llamador no cambian');
  assert.equal(r.physicalScale, 'not-certified'); assert.equal(r.normalization, PRIVATE_NORMALIZATION);
  assert.ok(['width', 'height', 'depth'].every(k => r.meshDimensionsMm[k] > 0)); assert.equal(r.dimensionsMm, undefined);
  assert.equal(r.bytes, b.byteLength); assert.ok(r.triangles > 0);
  Loader.dispose(r.scene);
});

test('P1 · cancelación antes y durante la verificación libera todo y no devuelve escena', async () => {
  const b = await bench(), d = {sha256: sha(b), byteLength: b.byteLength};
  const pre = new AbortController(); pre.abort();
  await assert.rejects(loadPrivateModel(b, d, {signal: pre.signal}), /aborted/);
  const mid = new AbortController();
  const p = Loader.loadVerifiedBytes(b, {verify: async () => { mid.abort(); await new Promise(r => setTimeout(r, 5)); }, signal: mid.signal});
  await assert.rejects(p, /aborted/);
  await assert.rejects(Loader.loadVerifiedBytes(b, {verify: () => new Promise(r => setTimeout(r, 200)), timeoutMs: 20}), /aborted/, 'el temporizador también cancela');
});

test('P1 · liberación de GPU: dispose libera cada geometría y material de la escena cargada', async () => {
  const b = await bench(), r = await loadPrivateModel(b, {sha256: sha(b), byteLength: b.byteLength});
  const disposed = new Set(); let total = 0;
  r.scene.traverse(o => { if (o.geometry) { total++; o.geometry.addEventListener('dispose', () => disposed.add(o.geometry)); } });
  Loader.dispose(r.scene); assert.ok(total > 0); assert.equal(disposed.size, total);
});

test('P1 · catálogo intacto: normalize conserva la tolerancia de 20 mm y measure no la aplica', async () => {
  const THREE = await import('three');
  const mesh = () => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 0.25), new THREE.MeshBasicMaterial())); return g; };
  const n = {unitToMeter: 1, rotationDeg: [0, 0, 0]};
  assert.ok(Loader.normalize(mesh(), {normalization: n, dimensionsMm: {width: 1000, height: 500, depth: 250}}));
  assert.throws(() => Loader.normalize(mesh(), {normalization: n, dimensionsMm: {width: 1021, height: 500, depth: 250}}), /20 mm/);
  assert.deepEqual(Loader.measure(mesh(), n).dimensionsMm, {width: 1000, height: 500, depth: 250});
});
