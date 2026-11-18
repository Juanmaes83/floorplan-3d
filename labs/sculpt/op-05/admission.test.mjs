import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {registerHooks} from 'node:module';
import {test} from 'node:test';

const three = new URL('../../../vendor/three/', import.meta.url);
registerHooks({resolve(specifier, context, nextResolve) {
  if (specifier === 'three') return nextResolve(new URL('build/three.module.js', three).href, context);
  if (specifier.startsWith('three/addons/')) {
    return nextResolve(new URL(`examples/jsm/${specifier.slice('three/addons/'.length)}`, three).href, context);
  }
  return nextResolve(specifier, context);
}});
const {planAdmission} = await import('./admission.mjs');
const buffer = async () => Uint8Array.from(await readFile(new URL('../../../assets/f3/synthetic-bench.glb', import.meta.url))).buffer;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const evidenceSha256 = digest(await readFile(new URL('../../../assets/f3/LICENSE.txt', import.meta.url)));
const permission = () => ({basis:'original',attribution:'RUBIK · banco sintético',license:'MIT',evidenceSha256});
const metadata = () => ({title:'Banco',rights:permission()});

test('stages a digest-bound private descriptor and strips names and links from source metadata', async () => {
  const bytes = await buffer(), copy = bytes.slice(0);
  const result = await planAdmission(bytes, {...metadata(), sourceFilename:'private.glb', sourceUrl:'https://example.test/?token=test'});
  assert.equal(result.action,'stage');
  assert.match(result.descriptor.id,/^model-[a-f0-9]{64}$/);
  assert.equal(result.descriptor.sha256,digest(new Uint8Array(copy)));
  assert.equal(result.descriptor.permission.evidenceSha256,evidenceSha256);
  assert.equal(result.descriptor.permission.scope,'local-private');
  assert.equal(result.descriptor.bytes,bytes.byteLength);
  assert.doesNotMatch(JSON.stringify(result),/private\.glb|example\.test|token/);
  assert.deepEqual(bytes,copy);
});

test('uses original bytes for identity and preserves the prior metadata on deduplication', async () => {
  const first = (await planAdmission(await buffer(),metadata())).descriptor;
  const result = await planAdmission(await buffer(),{...metadata(),title:'Otra etiqueta'},[first]);
  assert.equal(result.action,'reuse');
  assert.deepEqual(result.descriptor,first);
});

test('rejects missing rights, conflicts for the same bytes, and bad GLB containers', async () => {
  const bytes=await buffer();
  await assert.rejects(planAdmission(bytes,{title:'Banco'}),/derechos/);
  const first=(await planAdmission(bytes,metadata())).descriptor;
  const altered={title:'Banco',rights:{...permission(),license:'Different license'}};
  await assert.rejects(planAdmission(bytes,altered,[first]),/conflicto/);
  const corrupt=bytes.slice(0);
  new DataView(corrupt).setUint32(4,1,true);
  await assert.rejects(planAdmission(corrupt,metadata()),/Invalid GLB header/);
  await assert.rejects(planAdmission(new ArrayBuffer(8*1024*1024+1),metadata()),/límites/);
});
