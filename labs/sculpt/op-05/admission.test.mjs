import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {registerHooks} from 'node:module';
import {test} from 'node:test';

const three = new URL('../../../vendor/three/', import.meta.url);
const donor = new URL('./upstream/src/lib/utils/', import.meta.url);
registerHooks({resolve(specifier, context, nextResolve) {
  if (specifier === 'three') return nextResolve(new URL('build/three.module.js', three).href, context);
  if (specifier.startsWith('three/addons/')) {
    return nextResolve(new URL(`examples/jsm/${specifier.slice('three/addons/'.length)}`, three).href, context);
  }
  if (context.parentURL?.startsWith(donor.href) && /^\.\/[a-zA-Z0-9]+$/.test(specifier)) {
    return nextResolve(new URL(`${specifier}.ts`, context.parentURL).href, context);
  }
  return nextResolve(specifier, context);
}});
const {planAdmission} = await import('./admission.mjs');
const buffer = async () => Uint8Array.from(await readFile(new URL('../../../assets/f3/synthetic-bench.glb', import.meta.url))).buffer;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const evidenceSha256 = digest(await readFile(new URL('../../../assets/f3/LICENSE.txt', import.meta.url)));
const permission = () => ({basis:'original',attribution:'RUBIK · banco sintético',license:'MIT',evidenceSha256});
const metadata = () => ({title:'Banco',rights:permission()});

function rewrite(source, edit) {
  const header = new DataView(source);
  const jsonLength = header.getUint32(12,true);
  const document = JSON.parse(new TextDecoder().decode(source.slice(20,20+jsonLength)));
  const bin = new Uint8Array(source.slice(28+jsonLength));
  const binary = edit(document, bin) || bin;
  const json = new TextEncoder().encode(JSON.stringify(document));
  const length = Math.ceil(json.length/4)*4;
  const bytes = new Uint8Array(28+length+binary.length);
  const out = new DataView(bytes.buffer);
  [0x46546c67,2,bytes.length,length,0x4e4f534a].forEach((word,i)=>out.setUint32(i*4,word,true));
  bytes.fill(32,20,20+length);
  bytes.set(json,20);
  out.setUint32(20+length,binary.length,true);
  out.setUint32(24+length,0x004e4942,true);
  bytes.set(binary,28+length);
  return bytes.buffer;
}

test('stages a digest-bound private descriptor and strips names and links from source metadata', async () => {
  const bytes = await buffer(), copy = bytes.slice(0);
  const result = await planAdmission(bytes, {...metadata(), sourceFilename:'private.glb', sourceUrl:'https://example.test/?token=test'});
  assert.equal(result.action,'stage');
  assert.match(result.descriptor.id,/^model-[a-f0-9]{64}$/);
  assert.equal(result.descriptor.sha256,digest(new Uint8Array(copy)));
  assert.equal(result.descriptor.permission.evidenceSha256,evidenceSha256);
  assert.equal(result.descriptor.permission.scope,'local-private');
  assert.equal(result.descriptor.bytes,bytes.byteLength);
  assert.ok(result.descriptor.geometry.vertices>0);
  assert.doesNotMatch(JSON.stringify(result),/private\.glb|example\.test|token/);
  assert.deepEqual(bytes,copy);
});

test('uses original bytes for identity and preserves the prior metadata on deduplication', async () => {
  const first = (await planAdmission(await buffer(),metadata())).descriptor;
  const result = await planAdmission(await buffer(),{...metadata(),title:'Otra etiqueta'},[first]);
  assert.equal(result.action,'reuse');
  assert.deepEqual(result.descriptor,first);
  const legacy={...first,sourceFilename:'private.glb',sourceUrl:'https://example.test/?token=test',permission:{...first.permission,path:'private/proof'}};
  assert.deepEqual((await planAdmission(await buffer(),metadata(),[legacy])).descriptor,first);
});

test('rejects missing rights, conflicts for the same bytes, and bad GLB containers', async () => {
  const bytes=await buffer();
  await assert.rejects(planAdmission(bytes,{title:'Banco'}),/derechos/);
  const first=(await planAdmission(bytes,metadata())).descriptor;
  const altered={title:'Banco',rights:{...permission(),license:'Different license'}};
  await assert.rejects(planAdmission(bytes,altered,[first]),/conflicto/);
  await assert.rejects(planAdmission(bytes,metadata(),[first,{...first,permission:{...first.permission,license:'Other'}}]),/conflicto/);
  const corrupt=bytes.slice(0);
  new DataView(corrupt).setUint32(4,1,true);
  await assert.rejects(planAdmission(corrupt,metadata()),/Invalid GLB header/);
  await assert.rejects(planAdmission(new ArrayBuffer(8*1024*1024+1),metadata()),/límites/);
});

test('rejects malformed resource references, scene graphs, and decoded indices', async () => {
  const bytes=await buffer();
  const remote=rewrite(bytes,d=>{d.images=[{uri:'https://example.test/texture.jpg'}];});
  await assert.rejects(planAdmission(remote,metadata()),/Unsupported embedded image/);
  const cycle=rewrite(bytes,d=>{d.nodes[0].children=[0];});
  await assert.rejects(planAdmission(cycle,metadata()),/scene graph contains a cycle/);
  const badIndex=rewrite(bytes,(d,bin)=>{
    const primitive=d.meshes[0].primitives[0],idx=d.accessors[primitive.indices];
    const view=d.bufferViews[idx.bufferView];
    const offset=(view.byteOffset||0)+(idx.byteOffset||0);
    const data=new DataView(bin.buffer);
    if(idx.componentType===5121)data.setUint8(offset,255);
    else if(idx.componentType===5123)data.setUint16(offset,65535,true);
    else data.setUint32(offset,4294967295,true);
  });
  await assert.rejects(planAdmission(badIndex,metadata()),/index points outside/);
});

test('checks amplified decoded geometry and aggregate texture memory before a decoder runs', async () => {
  const bytes=await buffer();
  const geometry=rewrite(bytes,d=>{
    d.accessors.push(...Array.from({length:20},()=>({componentType:5126,type:'VEC3',count:300000})));
  });
  assert.ok(geometry.byteLength<8*1024*1024);
  await assert.rejects(planAdmission(geometry,metadata()),/Decoded geometry exceeds the memory budget/);
  const texture=rewrite(bytes,(d,bin)=>{
    const jpeg=Uint8Array.of(255,216,255,192,0,11,8,8,0,8,0,1,1,17,0,255,217);
    const extra=bin.length;
    const result=new Uint8Array(extra+20);
    result.set(bin);result.set(jpeg,extra);
    d.buffers[0].byteLength=result.length;
    const bv=d.bufferViews.push({buffer:0,byteOffset:extra,byteLength:jpeg.length})-1;
    d.images=Array.from({length:2},()=>({bufferView:bv,mimeType:'image/jpeg'}));
    return result;
  });
  await assert.rejects(planAdmission(texture,metadata()),/Texture memory outside limit/);
});
