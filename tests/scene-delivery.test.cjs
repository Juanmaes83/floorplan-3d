// OP-10 C5/C6 · «Escena para Blender»: manifiesto, registro para Studio E3 / expediente y paquete ZIP (núcleo puro).
const { test } = require('node:test'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const D = require('../js/scene-delivery-core.js'), C = require('../js/scene-capture-core.js'), Package = require('../js/project-package.js'), Expediente = require('../js/expediente-core.js');
const digest = async b => crypto.createHash('sha256').update(Buffer.from(b)).digest('hex');
function sampleCapture() {
  const box = (id, role, x) => ({ name: `${role}:${id}:0`, entity: { id, role }, level: null, source: { type: 'Mesh', name: null, instance: null, mirrored: false },
    material: { kind: 'surface', color: '#e9e4da', roughness: 0.9, metalness: 0, opacity: 1, side: 'front', hasMap: role === 'room' },
    vertices: [[x, 0, 0], [x + 1, 0, 0], [x, 1, 0]], faces: [[0, 1, 2]], bounds: { min: [x, 0, 0], max: [x + 1, 1, 0] } });
  const doc = { schema: C.SCHEMA, version: C.VERSION, representation: 'observed-visual-snapshot', contractual: false, units: 'metres', axes: 'three-y-up', unitsToMetresApplied: 1,
    scope: 'active-level', frame: { originPlanMm: { x: 0, y: 0 } }, view: { camera: { position: [0, 1.6, 4], quaternion: [0, 0, 0, 1], target: null, fovDeg: 50, aspect: 1.6, source: 'viewer' }, light: null },
    policy: {}, stats: { meshes: 2, vertices: 6, faces: 2, entities: 2, unlinked: 0 }, excluded: {}, skipped: {}, entities: [], meshes: [box('wal_1', 'wall', 0), box('rom_1', 'room', 2)] };
  return { doc, info: { projectId: 'prj_demo', projectUpdatedAt: '2026-11-19T00:00:00.000Z', assets: { ready: 1 }, assetErrors: [], objects: [{ id: 'obj_a', catalogModel: true }, { id: 'obj_b', catalogModel: false }], stability: { frames: 31 } } };
}
const project = { id: 'prj_demo', updatedAt: '2026-11-19T00:00:00.000Z', sourceImages: [{ name: 'foto-privada.jpg', storage: { ref: 'idb://secret' } }], notes: 'Cliente: Sra. X' };

test('C5 · manifiesto determinista, huellas correctas y sin datos privados del proyecto', async () => {
  const capture = sampleCapture(), glb = C.toGLB(capture.doc);
  const a = await D.manifest({ capture, glb, project, digest }), b = await D.manifest({ capture, glb, project, digest });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.equal(a.files['scene.glb'].sha256, await digest(glb)); assert.equal(a.files['scene.glb'].bytes, glb.length);
  assert.equal(a.source.observedProjectSha256, await digest(Buffer.from(D.canonical(project))));
  assert.equal(a.fallbacks.texturesNotCopied, 1); assert.deepEqual(a.fallbacks.catalogModels, ['obj_a']); assert.equal(a.fallbacks.proceduralObjects, 1);
  assert.equal(a.createdAt, null); assert.match(a.blender.import, /glTF 2\.0/);
  assert.doesNotMatch(JSON.stringify(a), /foto-privada|idb:\/\/|Sra\. X/);
  await assert.rejects(D.manifest({ capture, project, digest }), /required/);
});

test('C6 · registro: «observed-only» sin revisión F0; «confirmed» solo con un contentId válido de la autoridad', async () => {
  const capture = sampleCapture(), glb = C.toGLB(capture.doc), m = await D.manifest({ capture, glb, project, digest });
  const r0 = await D.record({ manifest: m, digest });
  assert.equal(r0.identity.status, 'observed-only'); assert.equal(r0.identity.contentId, null); assert.equal(r0.sceneSha256, m.files['scene.glb'].sha256);
  assert.equal(r0.manifestSha256, await digest(Buffer.from(D.canonical(m))));
  assert.equal(r0.studio.sourceKind, 'blender-scene'); assert.equal(r0.studio.fidelity, 'observed-visual');
  // Formato real de la autoridad F0 (js/expediente-core.js#contentId), calculado aquí solo para obtener un valor con su forma.
  const subject = { kind: 'project', project: { id: 'prj_demo', walls: [], rooms: [], openings: [], objects: [], materials: [], sourceImages: [] } };
  const contentId = await Expediente.contentId(subject, { budgets: {}, reviews: {} }, async () => '');
  const r1 = await D.record({ manifest: m, digest, confirmed: { contentId, revision: 7, confirmedAt: '2026-11-19T10:00:00Z' } });
  assert.deepEqual(r1.identity, { status: 'confirmed', contentId, revision: 7, confirmedAt: '2026-11-19T10:00:00Z' });
  const bad = await D.record({ manifest: m, digest, confirmed: { contentId: 'not-a-hash' } });
  assert.equal(bad.identity.status, 'observed-only', 'un contentId inválido no se acepta como confirmado');
});

test('C5 · paquete: ZIP existente (project-package), solo tres nombres permitidos, LEEME en ES/EN', async () => {
  const capture = sampleCapture(), glb = C.toGLB(capture.doc), m = await D.manifest({ capture, glb, project, digest });
  const p = D.packageFiles({ manifest: m, glb, lang: 'es', zip: Package.zip });
  assert.equal(p.name, 'rubik-escena-blender-prj_demo.zip'); assert.deepEqual([...p.entries.keys()], ['scene.glb', 'manifest.json', 'LEEME.txt']);
  const bytes = Buffer.from(await p.bytes.arrayBuffer());
  assert.equal(bytes.readUInt32LE(0), 0x04034b50); assert.ok(bytes.includes(Buffer.from('scene.glb')));
  assert.match(new TextDecoder().decode(p.entries.get('LEEME.txt')), /Importar › glTF 2\.0/);
  assert.match(D.readme(m, 'en'), /Import › glTF 2\.0/);
  assert.throws(() => Package.zip(new Map([['../evil', new Uint8Array(1)]]), { check: n => { if (!D.FILES.includes(n)) throw Error('Unexpected'); } }), /Unexpected/);
  const again = D.packageFiles({ manifest: m, glb, lang: 'es', zip: Package.zip });
  assert.equal(Buffer.compare(bytes, Buffer.from(await again.bytes.arrayBuffer())), 0, 'ZIP determinista (sin fechas)');
  assert.equal(D.safeName('Casa García / 2º'), 'Casa-Garcia-2o');
});
