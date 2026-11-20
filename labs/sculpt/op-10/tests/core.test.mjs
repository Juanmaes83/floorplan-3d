// SCULPT OP-10 · pruebas del núcleo de captura. Ejecutar: node --test labs/sculpt/op-10/tests/core.test.mjs
// Las 6 primeras portan la intención de openPlan3D tests/portable-render-scene.test.ts (unidades RUBIK: metros, k=1).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as THREE from '../../../../vendor/three/build/three.module.js';
const require = createRequire(import.meta.url);
const C = require('../src/scene-capture-core.js');
const cap = (root, o = {}) => C.capture(root, { unitsToMetres: 1, ...o });
const fingerprint = root => { const out = []; root.traverse(o => { out.push(o.uuid, o.matrix.elements.join(','), o.visible); if (o.geometry) out.push(Array.from(o.geometry.attributes.position.array).join(',')); if (o.isInstancedMesh) out.push(Array.from(o.instanceMatrix.array).join(',')); }); return out.join('|'); };

test('donante 1 · transformaciones anidadas en metros, sin datos privados ni mutación, determinista', () => {
  const root = new THREE.Group(); root.position.set(1, 3, -2);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 0.5)); mesh.rotation.y = Math.PI / 2;
  mesh.userData.wallId = 'wal_a'; mesh.userData.sourceURL = 'https://private.example/x'; root.add(mesh);
  root.updateMatrixWorld(true); // como en el visor, que renderiza cada fotograma con matrices ya calculadas
  const before = fingerprint(root), d = cap(root, { scope: 'active-level' }), wall = d.meshes[0];
  assert.equal(d.units, 'metres'); assert.equal(d.unitsToMetresApplied, 1); assert.equal(d.contractual, false);
  assert.deepEqual(wall.entity, { id: 'wal_a', role: 'wall' });
  assert.ok(Math.abs(Math.min(...wall.vertices.map(v => v[0])) - 0.75) < 1e-6);
  assert.ok(Math.abs(Math.max(...wall.vertices.map(v => v[1])) - 3.5) < 1e-6);
  assert.ok(Math.abs(Math.min(...wall.vertices.map(v => v[2])) + 3) < 1e-6);
  assert.doesNotMatch(C.toJSON(d), /private\.example|sourceURL/);
  root.updateMatrixWorld(true); assert.equal(fingerprint(root), before, 'el árbol no cambia');
  assert.equal(C.toJSON(cap(root)), C.toJSON(cap(root)), 'bytes idénticos en capturas repetidas');
});

test('donante 2 · reflejo: el orden de triángulos se invierte y las normales siguen hacia fuera', () => {
  const root = new THREE.Group(), mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 0.5)); mesh.scale.x = -2; root.add(mesh);
  const box = cap(root).meshes[0]; assert.equal(box.source.mirrored, true);
  for (const f of box.faces) {
    const [a, b, c] = f.map(i => new THREE.Vector3().fromArray(box.vertices[i]));
    assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).dot(a) > 0);
  }
});

test('donante 3 · ancestros ocultos y subárboles excluidos no se exportan', () => {
  const root = new THREE.Group(), hidden = new THREE.Group(), excluded = new THREE.Group();
  hidden.visible = false; excluded.userData.renderExclude = true;
  for (const p of [root, hidden, excluded]) p.add(new THREE.Mesh(new THREE.BoxGeometry()));
  root.add(hidden, excluded);
  const d = cap(root); assert.equal(d.meshes.length, 1); assert.equal(d.excluded.hidden, 1); assert.equal(d.excluded['excluded-by-marker'], 1);
});

test('donante 4 · draw range no indexado; los vértices sin uso no salen', () => {
  const root = new THREE.Group(), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([NaN, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0], 3)); g.setDrawRange(3, 3); root.add(new THREE.Mesh(g));
  assert.deepEqual(cap(root).meshes[0].vertices, [[0, 0, 0], [1, 0, 0], [0, 1, 0]]);
});

test('donante 5 · unidades: el factor del donante solo se aplica si se declara (0,01 = centímetros)', () => {
  const root = new THREE.Group(), m = new THREE.Mesh(new THREE.BoxGeometry(400, 250, 20)); m.position.y = 125; root.add(m);
  assert.ok(Math.abs(cap(root, { unitsToMetres: 0.01 }).stats.bounds.max[1] - 2.5) < 1e-6);
  assert.throws(() => C.capture(root, {}), e => e.code === 'UNITS', 'sin unidades declaradas no hay captura');
});

test('donante 6 · rechaza vacío, transformación inválida, coordenadas fuera de rango, animación y presupuesto', () => {
  assert.throws(() => cap(new THREE.Group()), e => e.code === 'EMPTY');
  const root = new THREE.Group(), mesh = new THREE.Mesh(new THREE.BoxGeometry()); root.add(mesh);
  mesh.position.x = NaN; assert.throws(() => cap(root), e => e.code === 'TRANSFORM' || e.code === 'COORDINATES');
  mesh.position.x = 1e6; assert.throws(() => cap(root), e => e.code === 'COORDINATES');
  mesh.scale.set(0, 1, 1); mesh.position.x = 0; assert.throws(() => cap(root), e => e.code === 'TRANSFORM');
  root.clear(); root.add(new THREE.SkinnedMesh(new THREE.BoxGeometry())); assert.throws(() => cap(root), e => e.code === 'ANIMATED');
  root.clear(); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(300003 * 3), 3)); root.add(new THREE.Mesh(g));
  assert.throws(() => cap(root), e => e.code === 'VERTEX_BUDGET');
});

test('RUBIK · InstancedMesh (batch de primitivas) se expande por instancia con su matriz, con límite', () => {
  const root = new THREE.Group(), furn = new THREE.Group(); furn.userData.fid = 'obj_sofa'; root.add(furn);
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: '#336699' }), 3);
  [[0, 0, 0], [2, 0, 0], [4, 0, 0]].forEach((p, i) => inst.setMatrixAt(i, new THREE.Matrix4().makeTranslation(...p))); furn.add(inst);
  const d = cap(root); assert.equal(d.meshes.length, 3); assert.equal(d.stats.instancesExpanded, 3);
  assert.deepEqual(d.meshes.map(m => m.source.instance), [0, 1, 2]); assert.deepEqual(d.meshes.map(m => m.entity.id), ['obj_sofa', 'obj_sofa', 'obj_sofa']);
  assert.ok(Math.abs(d.meshes[2].bounds.max[0] - 4.5) < 1e-6); assert.equal(d.meshes[0].material.color, '#336699');
  assert.throws(() => cap(root, { limits: { instances: 2 } }), e => e.code === 'INSTANCE_BUDGET');
});

test('RUBIK · geometría con grupos y varios materiales: una malla por grupo con su material', () => {
  const root = new THREE.Group(), mesh = new THREE.Mesh(new THREE.BoxGeometry(), [0, 1, 2, 3, 4, 5].map(i => new THREE.MeshStandardMaterial({ color: i % 2 ? '#ffffff' : '#000000' })));
  root.add(mesh); const d = cap(root);
  assert.equal(d.meshes.length, 6); assert.equal(d.stats.faces, 12); assert.deepEqual(d.meshes.map(m => m.material.color), ['#000000', '#ffffff', '#000000', '#ffffff', '#000000', '#ffffff']);
});

test('RUBIK · identidad: el ID canónico más cercano gana; planta heredada; sin ID queda «unlinked»', () => {
  const root = new THREE.Group(), level = new THREE.Group(); level.userData.levelId = 'lvl_1'; root.add(level);
  const wall = new THREE.Mesh(new THREE.BoxGeometry()); wall.userData.wallId = 'wal_1'; level.add(wall);
  const furn = new THREE.Group(); furn.userData.fid = 'obj_1'; const part = new THREE.Mesh(new THREE.BoxGeometry()); furn.add(part); level.add(furn);
  const door = { id: 'opn_1' }, leaf = new THREE.Mesh(new THREE.BoxGeometry()); leaf.userData.door = door; wall.add(leaf);
  root.add(new THREE.Mesh(new THREE.BoxGeometry()));
  const d = cap(root), by = Object.fromEntries(d.meshes.map(m => [m.entity.role + ':' + m.entity.id, m.level]));
  assert.deepEqual(by, { 'wall:wal_1': 'lvl_1', 'opening-leaf:opn_1': 'lvl_1', 'object:obj_1': 'lvl_1', 'unlinked:null': null });
  assert.deepEqual(d.entities, ['object:obj_1', 'opening-leaf:opn_1', 'wall:wal_1']);
});

test('RUBIK · política: propuesta sin aplicar, sombras de contacto, sección, contorno y territorio fuera; líneas contadas', () => {
  const root = new THREE.Group(), keep = new THREE.Mesh(new THREE.BoxGeometry()); keep.userData.wallId = 'wal_1'; root.add(keep);
  const proposal = new THREE.Group(); proposal.name = 'smart-furnishing-preview'; proposal.add(new THREE.Mesh(new THREE.BoxGeometry()));
  const contact = new THREE.Mesh(new THREE.PlaneGeometry()); contact.userData.contactRoomId = 'rom_1';
  const section = new THREE.Group(); section.userData.presentationSection = true; section.add(new THREE.Mesh(new THREE.BoxGeometry()));
  const outline = new THREE.Mesh(new THREE.PlaneGeometry()); outline.userData.presentationOutline = 'rom_1';
  const territory = new THREE.Group(); territory.userData.territorialContext = true; territory.add(new THREE.Mesh(new THREE.BoxGeometry()));
  root.add(proposal, contact, section, outline, territory, new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry())));
  const d = cap(root); assert.equal(d.meshes.length, 1);
  for (const r of ['unapplied-proposal', 'contact-shadow-decal', 'presentation-section', 'presentation-outline', 'territorial-context']) assert.equal(d.excluded[r], 1, r);
  assert.equal(d.skipped.line, 1); assert.equal(cap(root, { includeTerritory: true }).meshes.length, 2, 'el territorio solo entra si se pide');
});

test('RUBIK · vidrio declarado, mapas nunca copiados; vista compatible con el contrato del donante', () => {
  const root = new THREE.Group(), glass = new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshPhysicalMaterial({ transparent: true, opacity: 0.28 }));
  const tex = new THREE.Texture(); tex.name = 'private-photo.jpg';
  const wall = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ map: tex })); wall.userData.wallId = 'wal_1'; root.add(glass, wall);
  const d = cap(root, { supportSlab: true });
  assert.equal(d.meshes[0].material.kind, 'glass'); assert.equal(d.meshes[1].material.hasMap, true); assert.doesNotMatch(C.toJSON(d), /private-photo/);
  const v1 = C.toOpenPlan3D(d); assert.equal(v1.schema, 'openplan3d-render-scene'); assert.equal(v1.coordinates, 'arkit-metres-y-up');
  assert.deepEqual(v1.meshes.map(m => m.material), ['wall', 'floor'], 'el vidrio se omite como en el donante; la losa derivada es suelo');
});

test('RUBIK · exclusión por nodo concreto (suelo decorativo) sin marcar ni mutar el objeto', () => {
  const root = new THREE.Group(), ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160)), wall = new THREE.Mesh(new THREE.BoxGeometry()); wall.userData.wallId = 'wal_1'; root.add(ground, wall);
  const before = JSON.stringify(ground.userData), d = cap(root, { excludeNodes: new Map([[ground, 'decorative-ground']]) });
  assert.equal(d.meshes.length, 1); assert.equal(d.excluded['decorative-ground'], 1); assert.equal(JSON.stringify(ground.userData), before);
  assert.ok(d.stats.bounds.max[0] < 1, 'los límites ya no incluyen el plano de 160 m');
});

test('RUBIK · R02-A: los elementos de techo se vinculan a su ID (r02aItem / r02aCurtain)', () => {
  const root = new THREE.Group(), g = new THREE.Group(); g.name = 'r02a-ceiling'; g.userData.r02a = true; root.add(g);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry()); lamp.userData = { r02aItem: 'cei_1', holds: true }; const curtain = new THREE.Mesh(new THREE.PlaneGeometry()); curtain.userData = { r02aCurtain: 'cei_2' }; g.add(lamp, curtain);
  assert.deepEqual(cap(root).meshes.map(m => m.entity), [{ id: 'cei_1', role: 'ceiling-element' }, { id: 'cei_2', role: 'ceiling-element' }]);
});
