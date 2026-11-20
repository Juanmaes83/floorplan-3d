// OP-10 · el comparador C↔B detecta cambios reales (no solo da verde): desplazamiento > 1 µm, giro invertido, malla perdida,
// identidad cambiada; y tolera el reordenado de vértices y los duplicados de esquina del importador glTF.
const { test } = require('node:test'), assert = require('node:assert/strict'), { roundtrip } = require('../scripts/interop/scene-roundtrip.cjs');
const box = () => ({ name: 'wall:wal_1:0', entity: { id: 'wal_1', role: 'wall' }, level: null,
  vertices: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 0], [1, 0, 0]], faces: [[0, 1, 2], [0, 2, 3], [4, 5, 2]] });
const scene = m => ({ meshes: [m] }), clone = x => JSON.parse(JSON.stringify(x));
test('reordenado y duplicados de esquina: PASS; desplazamiento de 1 µm exacto: PASS (inclusivo)', () => {
  const b = box(), c = clone(b); c.vertices = [c.vertices[3], c.vertices[2], c.vertices[1], c.vertices[0], c.vertices[5], c.vertices[4]];
  c.faces = [[3, 2, 1], [3, 1, 0], [5, 4, 1]]; assert.equal(roundtrip(scene(b), scene(c)).pass, true);
  const d = clone(b); d.vertices[2] = [1.000001, 1, 0]; assert.equal(roundtrip(scene(b), scene(d)).pass, true);
});
test('desplazamiento de 2 µm, giro invertido, malla perdida o identidad cambiada: FAIL', () => {
  const b = box();
  const d = clone(b); d.vertices[2] = [1.000002, 1, 0]; assert.equal(roundtrip(scene(b), scene(d)).pass, false);
  const w = clone(b); w.faces[0] = [0, 2, 1]; assert.match(JSON.stringify(roundtrip(scene(b), scene(w)).issues), /winding/);
  assert.match(JSON.stringify(roundtrip(scene(b), { meshes: [] }).issues), /missing in Blender/);
  const e = clone(b); e.entity.id = 'wal_2'; assert.match(JSON.stringify(roundtrip(scene(b), scene(e)).issues), /entity changed/);
  const far = clone(b); far.vertices[2] = [1.5, 1, 0]; assert.equal(roundtrip(scene(b), scene(far)).pass, false);
});
