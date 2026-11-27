// Material Tokens 1.0.0 · contrato puro: taxonomía, orden de resolución determinista, privacidad y compatibilidad del paquete.
const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const M = require('../js/material-tokens-core.js'), D = require('../js/scene-delivery-core.js');
const CJK = /[㐀-鿿豈-﫿]/;
const project = () => ({ id: 'prj_mt', defaults: { wallHeightMm: 2700 },
  materials: [{ id: 'mat_wood', name: '橡木地板', category: 'floor', appearance: { color: '#d8b88a', preset: 'wood' } },
    { id: 'mat_custom', name: 'Mi piedra', category: 'floor', appearance: { color: '#887766', preset: 'surface-marble-01' } },
    { id: 'mat_x', name: 'texto libre', category: 'floor', appearance: { color: '#123456' } },
    { id: 'mat_plaster', category: 'wall', appearance: { color: '#f2efe9', preset: 'surface-painted-plaster-wall' } }],
  rooms: [{ id: 'rom_a', name: '客厅', polygon: [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }], floorMaterialId: 'mat_wood' },
    { id: 'rom_b', polygon: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }], floorMaterialId: 'mat_custom' },
    { id: 'rom_c', polygon: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }], floorMaterialId: 'mat_x' },
    { id: 'rom_d', polygon: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }] }, { id: 'rom_e', polygon: [] }],
  walls: [{ id: 'wal_1', surfaceMaterialId: 'mat_plaster' }, { id: 'wal_2' }],
  objects: [{ id: 'obj_sofa', type: 'sofa', name: '沙发', color: '#8a6a50' }, { id: 'obj_t', type: 'table', materialToken: 'material.wood.walnut.satin.brand-x' },
    { id: 'obj_u', type: 'lamp', materialToken: 'material.unobtainium.alloy.x' }, { id: 'obj_bad', type: 'chair', materialToken: 'roble <script>' }] });

test('taxonomía: tokens versionados, familias extensibles por prefijo y nombres visibles sin chino en ES/EN', () => {
  assert.equal(M.TAXONOMY_VERSION, '1.0.0');
  for (const t of ['material.wood.oak.natural', 'material.wood.walnut.satin', 'material.ceramic.porcelain.polished', 'material.fabric.linen.natural',
    'material.thread.cotton.fine', 'material.leather.suede', 'material.metal.stainless.brushed', 'material.glass.clear', 'material.art.canvas.printed'])
    assert.ok(M.TAXONOMY[t], t);
  for (const v of Object.values(M.TAXONOMY)) { assert.doesNotMatch(v.names.es + v.names.en, CJK, v.id); assert.ok(v.names.zh, v.id); }
  assert.equal(M.known('material.wood.walnut.satin.brand-x.ref-123'), 'material.wood.walnut.satin', 'a manufacturer variant reads by its family');
  assert.equal(M.known('material.unobtainium.alloy.x'), null); assert.equal(M.isToken('roble <script>'), false);
});

test('resolución determinista: explícito del catálogo → familia documentada → sin identidad (nunca por color)', () => {
  const d = M.materialsDoc({ project: project() }), by = Object.fromEntries(d.assignments.map(a => [a.target.kind + ':' + a.target.id, a.requested]));
  assert.deepEqual([by['room-floor:rom_a'].token, by['room-floor:rom_a'].source, by['room-floor:rom_a'].certainty], ['material.wood.oak.natural', 'explicit', 'documented']);
  assert.deepEqual([by['room-floor:rom_b'].token, by['room-floor:rom_b'].source], ['material.stone.marble.polished', 'catalog'], 'preset of the catalog family');
  assert.deepEqual([by['room-floor:rom_c'].token, by['room-floor:rom_c'].source, by['room-floor:rom_c'].certainty], [null, 'none', 'unknown'], 'colour alone never asserts a material');
  assert.match(by['room-floor:rom_c'].reason, /aproximará/); assert.equal(by['room-floor:rom_d'].source, 'none');
  assert.equal(by['room-floor:rom_e'], undefined, 'rooms without polygon are skipped');
  assert.equal(by['wall:wal_1'].token, 'material.plaster.painted.matte'); assert.equal(by['wall:wal_2'], undefined);
  assert.deepEqual([by['object:obj_sofa'].token, by['object:obj_sofa'].source], [null, 'none'], 'type and colour only orient an approximation');
  assert.deepEqual([by['object:obj_t'].source, by['object:obj_t'].knownToken], ['explicit', 'material.wood.walnut.satin']);
  assert.deepEqual([by['object:obj_u'].token, by['object:obj_u'].knownToken], ['material.unobtainium.alloy.x', null], 'unknown token travels, flagged as unknown');
  assert.equal(by['object:obj_bad'].token, null, 'free text is never a token');
  assert.deepEqual(d.resolutionOrder, ['explicit', 'catalog', 'approximation', 'reserve']);
  assert.deepEqual(JSON.stringify(M.materialsDoc({ project: project() })), JSON.stringify(d), 'deterministic');
});

test('privacidad y autoridad: sin nombres guardados ni texto libre; el proyecto no cambia', () => {
  const p = project(), before = JSON.stringify(p), d = M.materialsDoc({ project: p }), s = JSON.stringify(d);
  assert.equal(JSON.stringify(p), before, 'the project is never written'); assert.doesNotMatch(s.replace(/"zh":"[^"]*"/g, ''), CJK);
  for (const free of ['Mi piedra', 'texto libre', '沙发', '<script>']) assert.ok(!s.includes(free), free);
  assert.match(d.authority, /derived/); assert.throws(() => M.materialsDoc({}));
});

test('paquete: rubik-materiales.json viaja con su huella y es opcional (sin él, el ZIP es el anterior)', async () => {
  const digest = async b => require('node:crypto').createHash('sha256').update(b).digest('hex');
  const root = path.resolve(__dirname, '..'), kit = Object.fromEntries(Object.entries(D.KIT_SOURCES).map(([k, rel]) => [k, new Uint8Array(fs.readFileSync(path.join(root, rel)))]));
  const C = require('../js/scene-capture-core.js'), Package = require('../js/project-package.js');
  const box = (id, role, x) => ({ name: `${role}:${id}:0`, entity: { id, role }, level: null, source: { type: 'Mesh', name: null, instance: null, mirrored: false },
    material: { kind: 'surface', color: '#e9e4da', roughness: 0.9, metalness: 0, opacity: 1, side: 'front', hasMap: false },
    vertices: [[x, 0, 0], [x + 1, 0, 0], [x, 1, 0]], faces: [[0, 1, 2]], bounds: { min: [x, 0, 0], max: [x + 1, 1, 0] } });
  const doc = { schema: C.SCHEMA, version: C.VERSION, representation: 'observed-visual-snapshot', contractual: false, units: 'metres', axes: 'three-y-up', unitsToMetresApplied: 1,
    scope: 'active-level', frame: { originPlanMm: { x: 0, y: 0 } }, view: { camera: null, light: null },
    policy: {}, stats: { meshes: 1, vertices: 3, faces: 1, entities: 1, unlinked: 0 }, excluded: {}, skipped: {}, entities: [], meshes: [box('rom_a', 'room', 0)] };
  const capture = { doc, info: { projectId: 'prj_mt', assets: {}, assetErrors: [], objects: [] } }, glb = C.toGLB(doc), p = project();
  const script = new Uint8Array(fs.readFileSync(path.join(root, 'scripts/interop/blender-scene-import.py'))), rooms = D.roomsDoc({ project: p, label: () => 'x' }), materials = M.materialsDoc({ project: p });
  const m = await D.manifest({ capture, glb, project: p, digest, prepareScript: script, kit, rooms, materials });
  assert.ok(m.files[D.MATERIALS].sha256); const pk = D.packageFiles({ manifest: m, glb, prepareScript: script, kit, rooms, materials, lang: 'es' });
  assert.equal(await digest(pk.entries.get(D.MATERIALS)), m.files[D.MATERIALS].sha256);
  const old = await D.manifest({ capture, glb, project: p, digest, prepareScript: script, kit, rooms });
  assert.equal(old.files[D.MATERIALS], undefined); assert.equal(D.packageFiles({ manifest: old, glb, prepareScript: script, kit, rooms, lang: 'es' }).entries.has(D.MATERIALS), false);
  assert.ok(Package.zip);
});
