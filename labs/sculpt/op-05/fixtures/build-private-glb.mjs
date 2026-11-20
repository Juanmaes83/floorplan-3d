// OP-05 · Modelo privado SINTÉTICO del laboratorio (no es un modelo de cliente): pirámide magenta con una textura JPEG
// embebida (color base; emisión magenta sin textura, dentro del perfil F3), inconfundible frente al volumen genérico. Determinista; dentro del perfil F3.
import {readFileSync} from 'node:fs';
const jpeg = new Uint8Array(readFileSync(new URL('./private-marker.jpg', import.meta.url)));
export function buildPrivateGLB() {
  const h = 1, b = 0.5, apex = [0, h, 0], base = [[-b, 0, -b], [b, 0, -b], [b, 0, b], [-b, 0, b]];
  const pos = [], nor = [], uv = [], idx = [];
  const face = (a, c, d) => { const u = c.map((v, i) => v - a[i]), v = d.map((x, i) => x - a[i]);
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], l = Math.hypot(...n);
    const s = pos.length / 3; for (const p of [a, c, d]) { pos.push(...p); nor.push(...n.map(x => x / l)); } uv.push(0.5, 0, 0, 1, 1, 1); idx.push(s, s + 1, s + 2); };
  for (let i = 0; i < 4; i++) face(apex, base[(i + 1) % 4], base[i]);
  face(base[0], base[1], base[2]); face(base[0], base[2], base[3]);
  const f32 = a => new Uint8Array(new Float32Array(a).buffer), u16 = a => new Uint8Array(new Uint16Array(a).buffer);
  const parts = [f32(pos), f32(nor), f32(uv), u16(idx), jpeg], views = [], chunks = []; let off = 0;
  for (const p of parts) { const pad = (4 - (off % 4)) % 4; if (pad) { chunks.push(new Uint8Array(pad)); off += pad; } views.push({buffer: 0, byteOffset: off, byteLength: p.length}); chunks.push(p); off += p.length; }
  const binPad = (4 - (off % 4)) % 4; if (binPad) { chunks.push(new Uint8Array(binPad)); off += binPad; }
  views[0].target = views[1].target = views[2].target = 34962; views[3].target = 34963;
  const mins = [0, 1, 2].map(k => Math.min(...pos.filter((_, i) => i % 3 === k))), maxs = [0, 1, 2].map(k => Math.max(...pos.filter((_, i) => i % 3 === k)));
  const doc = {asset: {version: '2.0', generator: 'RUBIK OP-05 synthetic lab'}, scene: 0, scenes: [{nodes: [0]}], nodes: [{mesh: 0}],
    meshes: [{primitives: [{attributes: {POSITION: 0, NORMAL: 1, TEXCOORD_0: 2}, indices: 3, material: 0}]}],
    materials: [{pbrMetallicRoughness: {baseColorTexture: {index: 0}, metallicFactor: 0, roughnessFactor: 1}, emissiveFactor: [0.9, 0, 0.9]}],
    textures: [{source: 0, sampler: 0}], samplers: [{magFilter: 9729, minFilter: 9729, wrapS: 33071, wrapT: 33071}],
    images: [{bufferView: 4, mimeType: 'image/jpeg'}],
    accessors: [{bufferView: 0, componentType: 5126, count: pos.length / 3, type: 'VEC3', min: mins, max: maxs}, {bufferView: 1, componentType: 5126, count: nor.length / 3, type: 'VEC3'},
      {bufferView: 2, componentType: 5126, count: uv.length / 2, type: 'VEC2'}, {bufferView: 3, componentType: 5123, count: idx.length, type: 'SCALAR'}],
    bufferViews: views, buffers: [{byteLength: off}]};
  const json = new TextEncoder().encode(JSON.stringify(doc)), jl = Math.ceil(json.length / 4) * 4, total = 12 + 8 + jl + 8 + off;
  const out = new Uint8Array(total), dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546c67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true); dv.setUint32(12, jl, true); dv.setUint32(16, 0x4e4f534a, true);
  out.fill(32, 20, 20 + jl); out.set(json, 20); dv.setUint32(20 + jl, off, true); dv.setUint32(24 + jl, 0x004e4942, true);
  let p = 28 + jl; for (const c of chunks) { out.set(c, p); p += c.length; }
  return out.buffer;
}
