// OP-10 candidata · núcleo de captura (js/scene-capture-core.js). node --test tests/scene-capture-core.test.mjs
// Las 6 primeras portan la intención de openPlan3D tests/portable-render-scene.test.ts (unidades RUBIK: metros, k=1).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as THREE from '../vendor/three/build/three.module.js';
const require = createRequire(import.meta.url);
const C = require('../js/scene-capture-core.js');
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
  assert.throws(() => cap(root, { limits: { vertices: 300000 } }), e => e.code === 'VERTEX_BUDGET');
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

// ---------------------------------------------------------------- Delta de la candidata 1.0.0 (C2, C3, C4, C7)
const GLB = require('../scripts/interop/glb.cjs');

test('C2 · huecos y luminarias con ID canónico: rol opening / fixture; la hoja de puerta sigue siendo opening-leaf', () => {
  const root = new THREE.Group(), win = new THREE.Group(); win.userData.openingId = 'opn_w'; root.add(win);
  win.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.01)), new THREE.Mesh(new THREE.BoxGeometry(0.04, 1, 0.06)));
  const pivot = new THREE.Group(); pivot.userData.openingId = 'opn_d'; const leaf = new THREE.Mesh(new THREE.BoxGeometry()); leaf.userData.door = { id: 'opn_d' }; pivot.add(leaf); root.add(pivot);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry()); lamp.userData.fixture = 'ceiling-lamp:rom_1'; root.add(lamp);
  const d = cap(root);
  assert.deepEqual(d.meshes.map(m => m.entity.role + ':' + m.entity.id), ['opening:opn_w', 'opening:opn_w', 'opening-leaf:opn_d', 'fixture:ceiling-lamp:rom_1']);
  assert.equal(d.stats.unlinked, 0);
});

test('C4 · normales transformadas por la matriz normal (escala no uniforme y reflejo) y unitarias', () => {
  const root = new THREE.Group(), m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)); m.scale.set(-3, 1, 1); m.rotation.y = 0.4; root.add(m);
  const d = cap(root), mesh = d.meshes[0];
  assert.equal(mesh.normals.length, mesh.vertices.length);
  for (const n of mesh.normals) assert.ok(Math.abs(Math.hypot(...n) - 1) < 1e-5);
  // Cada normal apunta hacia fuera de la caja (mismo semiespacio que el vértice respecto al centro)
  for (let i = 0; i < mesh.vertices.length; i++) assert.ok(mesh.vertices[i][0] * mesh.normals[i][0] + mesh.vertices[i][1] * mesh.normals[i][1] + mesh.vertices[i][2] * mesh.normals[i][2] > 0);
  assert.equal(cap(root, { normals: false }).meshes[0].normals, undefined);
});

test('C7 · vista: cámara y luz numéricas; texto libre, URL y valores no finitos fuera', () => {
  const root = new THREE.Group(); root.add(new THREE.Mesh(new THREE.BoxGeometry()));
  const d = cap(root, { view: { camera: { position: [1, 1.6, 2], quaternion: [0, 0, 0, 1], target: [0, 1, 0], fov: 50, aspect: 1.6, source: 'https://evil.example' },
    light: { night: false, hour: 15, exposure: 1.05, sun: { direction: [0.3, 0.8, 0.5], color: '#fff1dd', intensity: 2.6 }, hemi: { sky: '#fff8ee', ground: 'javascript:x', intensity: NaN }, lamps: { on: false } } } });
  assert.equal(d.view.camera.source, 'viewer'); assert.equal(d.view.camera.fovDeg, 50); assert.equal(d.view.light.mode, 'day');
  assert.equal(d.view.light.hemi.ground, null); assert.equal(d.view.light.hemi.intensity, null);
  assert.doesNotMatch(C.toJSON(d), /evil|javascript/);
  assert.equal(cap(root, { view: { camera: { position: [NaN, 0, 0], quaternion: [0, 0, 0, 1] } } }).view, null);
});

test('C4 · GLB: mismos bytes que glb.cjs#pack, válido para glb.cjs#parse, determinista y sin imágenes ni extensiones', () => {
  const root = new THREE.Group(), w = new THREE.Mesh(new THREE.BoxGeometry(4, 2.6, 0.12), new THREE.MeshStandardMaterial({ color: '#e9e4da', roughness: 0.9 }));
  w.position.set(12.5, 1.3, -7.25); w.userData.wallId = 'wal_1'; root.add(w);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshPhysicalMaterial({ transparent: true, opacity: 0.25 })); glass.userData.openingId = 'opn_1'; root.add(glass);
  const d = cap(root, { view: { camera: { position: [0, 1.6, 5], quaternion: [0, 0, 0, 1], fov: 50, aspect: 1.5 } } });
  const { gltf, bin } = C.toGLTF(d), glb = Buffer.from(C.toGLB(d));
  assert.equal(Buffer.compare(glb, GLB.pack(gltf, Buffer.from(bin))), 0, 'mismo contenedor que el exportador canónico');
  const { doc } = GLB.parse(glb);
  assert.equal(doc.asset.version, '2.0'); assert.equal(doc.extensionsUsed, undefined); assert.equal(doc.images, undefined);
  assert.deepEqual(doc.nodes.filter(n => n.mesh !== undefined).map(n => [n.extras.rubik_role, n.extras.rubik_id]), [['wall', 'wal_1'], ['opening', 'opn_1']]);
  assert.equal(doc.materials.find(m => m.extras.rubik_kind === 'glass').alphaMode, 'BLEND');
  assert.equal(doc.cameras[0].perspective.aspectRatio, 1.5);
  assert.equal(Buffer.compare(glb, Buffer.from(C.toGLB(cap(root, { view: { camera: { position: [0, 1.6, 5], quaternion: [0, 0, 0, 1], fov: 50, aspect: 1.5 } } })))), 0, 'bytes idénticos');
  // Posiciones reconstruidas (traslación del nodo + float32 local) frente a la captura: ≤ 1 µm.
  // Posiciones reconstruidas (traslación del vacío + traslación local + float32) frente a la captura: ≤ 1 µm.
  const { bin: b2 } = GLB.parse(glb), parent = doc.nodes.find(n => n.name === 'wall:wal_1'), n0 = doc.nodes[parent.children[0]];
  const a0 = doc.accessors[doc.meshes[n0.mesh].primitives[0].attributes.POSITION], v0 = doc.bufferViews[a0.bufferView];
  let maxDev = 0;
  d.meshes[0].vertices.forEach((v, i) => { for (let k = 0; k < 3; k++) maxDev = Math.max(maxDev, Math.abs(b2.readFloatLE(v0.byteOffset + i * 12 + k * 4) + n0.translation[k] + parent.translation[k] - v[k])); });
  assert.ok(maxDev <= 1e-6, 'desviación ' + maxDev);
  assert.deepEqual(parent.translation, [12.5, 0, -7.25], 'el vacío del muro nace en el centro de su base');
  assert.throws(() => C.toGLB({ schema: 'otra' }), e => e.code === 'SCENE');
  assert.throws(() => C.toGLB(d, { limits: { bytes: 100 } }), e => e.code === 'BYTES');
});

test('C3 · detector: la tapa del armario antiguo (misma cota y caras laterales) se detecta; la corregida no', () => {
  const mk = (bodyTop) => { const root = new THREE.Group(), g = new THREE.Group(); g.userData.fid = 'obj_w'; root.add(g);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, bodyTop - 0.08, 0.58)); body.position.set(0, 0.08 + (bodyTop - 0.08) / 2, -0.01);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.58)); lid.position.set(0, 2.19, -0.01); g.add(body, lid); return cap(root); };
  const before = C.coincidentFaces(mk(2.2)), after = C.coincidentFaces(mk(2.18));
  assert.ok(before.sameFacing.length >= 1 && before.sameFacing[0].areaM2 > 0.6, JSON.stringify(before.sameFacing));
  assert.equal(after.sameFacing.length, 0, JSON.stringify(after.sameFacing));
  assert.ok(after.opposite >= 1, 'el contacto tapa/cuerpo queda como informativo');
});

test('C1/C4 · agrupación por elemento: muebles con su ID y origen de plano; sin raíz si se pide (piloto offline)', () => {
  const root = new THREE.Group(), f = new THREE.Group(); f.userData.fid = 'obj_sofa'; f.position.set(2, 0, 1); root.add(f);
  const a = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 0.9)); a.position.y = 0.2; const b = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 0.2)); b.position.set(0, 0.6, -0.35); f.add(a, b);
  root.add(new THREE.Mesh(new THREE.BoxGeometry()));
  const d = cap(root), { gltf } = C.toGLTF(d, { origins: new Map([['object:obj_sofa', [2, 0, 1]]]), sceneRoot: false });
  const top = gltf.scenes[0].nodes.map(i => gltf.nodes[i]);
  assert.deepEqual(top.map(n => n.name), ['obj_sofa', 'unlinked:none:2']);
  assert.deepEqual(top[0].translation, [2, 0, 1]); assert.equal(top[0].extras.rubik_origin, 'project-plan'); assert.equal(top[0].children.length, 2);
  assert.equal(C.toGLTF(d).gltf.nodes.at(-1).name, 'RUBIK_scene', 'por defecto, una raíz con los metadatos');
});
