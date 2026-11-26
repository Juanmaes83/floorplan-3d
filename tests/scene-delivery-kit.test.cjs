// M03 · Kit de render dentro de «Escena para Blender»: compatible con el paquete anterior, huellas y nombres visibles.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { createHash } = require('node:crypto');
const C = require('../js/scene-capture-core.js');
const D = require('../js/scene-delivery-core.js');
const Package = require('../js/project-package.js');
const digest = async b => createHash('sha256').update(b).digest('hex');
const root = path.resolve(__dirname, '..');
const CJK = /[㐀-鿿]/;

// Misma muestra que tests/scene-delivery.test.cjs (contrato del núcleo de captura), sin inventar otro formato.
function sampleCapture() {
  const box = (id, role, x) => ({ name: `${role}:${id}:0`, entity: { id, role }, level: null, source: { type: 'Mesh', name: null, instance: null, mirrored: false },
    material: { kind: 'surface', color: '#e9e4da', roughness: 0.9, metalness: 0, opacity: 1, side: 'front', hasMap: role === 'room' },
    vertices: [[x, 0, 0], [x + 1, 0, 0], [x, 1, 0]], faces: [[0, 1, 2]], bounds: { min: [x, 0, 0], max: [x + 1, 1, 0] } });
  const doc = { schema: C.SCHEMA, version: C.VERSION, representation: 'observed-visual-snapshot', contractual: false, units: 'metres', axes: 'three-y-up', unitsToMetresApplied: 1,
    scope: 'active-level', frame: { originPlanMm: { x: 0, y: 0 } }, view: { camera: { position: [0, 1.6, 4], quaternion: [0, 0, 0, 1], target: null, fovDeg: 50, aspect: 1.6, source: 'viewer' }, light: null },
    policy: {}, stats: { meshes: 2, vertices: 6, faces: 2, entities: 2, unlinked: 0 }, excluded: {}, skipped: {}, entities: [], meshes: [box('wal_1', 'wall', 0), box('rom_1', 'room', 2)] };
  return { doc, info: { projectId: 'prj_demo', assets: { ready: 1 }, assetErrors: [], objects: [{ id: 'obj_a', catalogModel: true }, { id: 'obj_b', catalogModel: false }], stability: { frames: 31 } } };
}
const kitBytes = () => Object.fromEntries(Object.entries(D.KIT_SOURCES).map(([k, rel]) => [k, new Uint8Array(fs.readFileSync(path.join(root, rel)))]));
const project = { id: 'prj_demo', name: 'Demo', defaults: { wallHeightMm: 2700 }, materials: [{ id: 'mat_t', appearance: { color: '#c8a27a' } }],
  rooms: [{ id: 'rom_a', name: '客厅', polygon: [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 }], floorMaterialId: 'mat_t' },
    { id: 'rom_b', name: 'Baño', counted: false, polygon: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }] }, { id: 'rom_c', name: 'x', polygon: [] }] };

test('M03 · rooms file: geometry, floor colour and the VISIBLE name only (never the stored raw name)', () => {
  const r = D.roomsDoc({ project, label: room => room.id === 'rom_a' ? 'Salón' : 'Baño' });
  assert.equal(r.format, 'rubik-sota.scene-rooms'); assert.equal(r.wallHeightMm, 2700); assert.equal(r.rooms.length, 2, 'rooms without a polygon are skipped'); assert.equal(r.version, '1.2.0'); assert.ok(Array.isArray(r.objects), 'objetos con su tipo (sin nombres)');
  assert.deepEqual(r.rooms.map(x => [x.id, x.label, x.counted, x.floorColor]), [['rom_a', 'Salón', true, '#c8a27a'], ['rom_b', 'Baño', false, null]]);
  assert.doesNotMatch(JSON.stringify(r), CJK); assert.throws(() => D.roomsDoc({}));
  // 1.2.0 · clave del material de suelo y su familia (identificadores ASCII del sistema): el rodaje resuelve el acabado por material
  assert.deepEqual(r.rooms.map(x => [x.floorMaterialId, x.floorPreset]), [['mat_t', null], [null, null]]);
  const p2 = { ...project, materials: [{ id: 'mat_t', appearance: { color: '#c8a27a', preset: 'surface-oak-wood-planks' } }, { id: 'texto libre 客厅', appearance: { color: '#ffffff', preset: 'a b' } }],
    rooms: [{ ...project.rooms[0] }, { ...project.rooms[1], floorMaterialId: 'texto libre 客厅' }] };
  const r2 = D.roomsDoc({ project: p2, label: () => 'x' });
  assert.deepEqual(r2.rooms.map(x => [x.floorMaterialId, x.floorPreset]), [['mat_t', 'surface-oak-wood-planks'], [null, null]], 'free text never travels as a key');
});

test('M03 · complete kit: every file fingerprinted, launchers and review path declared, ES/EN/ZH instructions', async () => {
  const capture = sampleCapture(), glb = C.toGLB(capture.doc), kit = kitBytes(), rooms = D.roomsDoc({ project, label: () => 'Salón' }), reference = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);
  const script = new Uint8Array(fs.readFileSync(path.join(root, 'scripts/interop/blender-scene-import.py')));
  const m = await D.manifest({ capture, glb, project, digest, prepareScript: script, kit, rooms, reference });
  for (const name of [...Object.values(D.KIT), D.ROOMS, D.REFERENCE]) assert.ok(m.files[name]?.sha256, name);
  assert.equal(m.files[D.KIT.render].sha256, await digest(kit.render)); assert.match(m.blender.paths.render.launchers.windows, /RENDERIZAR-windows\.bat/);
  assert.match(m.blender.paths.render.review, /Review render/); assert.match(m.privacy, /displayed room names/);
  const p = D.packageFiles({ manifest: m, glb, prepareScript: script, kit, rooms, reference, lang: 'es', zip: Package.zip });
  assert.deepEqual([...p.entries.keys()], ['scene.glb', 'manifest.json', 'LEEME.txt', D.SCRIPT, ...Object.values(D.KIT), D.ROOMS, D.REFERENCE]);
  for (const [n, b] of p.entries) if (m.files[n]) assert.equal(await digest(b), m.files[n].sha256, 'packaged bytes = declared bytes: ' + n);
  assert.ok(p.bytes.size > 0, 'FloorPlanPackage.zip returns a Blob');
  const es = D.readme(m, 'es'), en = D.readme(m, 'en'), zh = D.readme(m, 'zh');
  assert.match(es, /RENDERIZAR-windows\.bat/); assert.match(es, /Revisar render/); assert.match(es, /continúa por la vista que faltaba/);
  assert.match(en, /Review render/); assert.match(zh, /审阅渲染/); for (const t of [es, en]) assert.doesNotMatch(t, CJK);
});

test('M03 · an incomplete kit is never shipped half: no kit files, the README says so, the scene still works', async () => {
  const capture = sampleCapture(), glb = C.toGLB(capture.doc), kit = kitBytes(); delete kit.bat;
  const script = new Uint8Array([1, 2, 3]), rooms = D.roomsDoc({ project, label: () => 'X' });
  const m = await D.manifest({ capture, glb, project, digest, prepareScript: script, kit, rooms });
  assert.equal(m.blender.paths.render.available, false); for (const n of Object.values(D.KIT)) assert.equal(m.files[n], undefined, n);
  const p = D.packageFiles({ manifest: m, glb, prepareScript: script, kit, rooms, lang: 'en', zip: Package.zip });
  assert.deepEqual([...p.entries.keys()], ['scene.glb', 'manifest.json', 'LEEME.txt', D.SCRIPT]); assert.match(D.readme(m, 'en'), /could not be included/);
});

test('M03 · the kit sources are the repository files and keep their recognisable headers', () => {
  const SPDX = '# SPDX-License-Identifier: GPL-3.0-or-later';
  const heads = { render: SPDX, verify: SPDX, profiles: '{', sh: '#!/bin/sh', bat: '@echo off', licence: 'RUBIK SOTA · Licencia', copying: '                    GNU GENERAL PUBLIC LICENSE', rodaje: SPDX, recursos: '{', rodar: '#!/bin/sh', rodarBat: '@echo off' };
  for (const [k, rel] of Object.entries(D.KIT_SOURCES)) assert.ok(fs.readFileSync(path.join(root, rel), 'utf8').startsWith(heads[k]), rel);
  const prof = JSON.parse(fs.readFileSync(path.join(root, D.KIT_SOURCES.profiles), 'utf8')); assert.deepEqual(Object.keys(prof.profiles), ['preview', 'review', 'delivery']);
});

test('M03 · the Windows launchers use CRLF line endings (cmd.exe labels and goto need them)', () => {
  for (const k of ['bat', 'rodarBat']) {
    const bat = fs.readFileSync(path.join(root, D.KIT_SOURCES[k]));
    assert.equal(bat.includes(Buffer.from('\n')) && !bat.toString('latin1').split('\r\n').some(l => l.includes('\n')), true, k);
    for (const label of [':fin_error', 'goto :fin_error']) assert.ok(bat.toString('latin1').includes(label), k + ' ' + label);
  }
  const rodar = fs.readFileSync(path.join(root, D.KIT_SOURCES.rodarBat), 'latin1');
  for (const piece of ['rubik_blender_prepare.py', 'rubik_blender_rodaje.py', '--profile %PERFIL%', 'entrega1440', 'libx264', 'Blender 5.2.1'])
    assert.ok(rodar.includes(piece), 'Windows rodaje launcher mirrors rodar.sh: ' + piece);
});


test('M03 · licence (owner decision): only the three bpy scripts are GPL-3.0-or-later, with notice and full text; launchers and data are not', () => {
  const SPDX = '# SPDX-License-Identifier: GPL-3.0-or-later';
  for (const rel of ['scripts/interop/blender-scene-import.py', D.KIT_SOURCES.render, D.KIT_SOURCES.verify]) { const t = fs.readFileSync(path.join(root, rel), 'utf8'); assert.ok(t.startsWith(SPDX), rel); assert.match(t.split('\n')[1], /^# Copyright \(C\) 2026 /, rel); }
  for (const rel of [D.KIT_SOURCES.sh, D.KIT_SOURCES.bat, D.KIT_SOURCES.profiles]) assert.ok(!fs.readFileSync(path.join(root, rel), 'utf8').includes('SPDX'), 'not GPL: ' + rel);
  const crypto = require('crypto'); assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, D.KIT_SOURCES.copying))).digest('hex'), '3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986', 'canonical GPL-3.0 text (FSF)');
  const n = fs.readFileSync(path.join(root, D.KIT_SOURCES.licence), 'utf8');
  for (const f of ['rubik_blender_prepare.py', 'rubik_blender_render.py', 'rubik_blender_verify.py', 'COPYING-GPL-3.0.txt', 'renderizar.sh', 'RENDERIZAR-windows.bat', 'scene.glb', '.blend']) assert.ok(n.includes(f), f);
  assert.match(n, /GPL-3\.0-or-later/); assert.match(n, /NO cubre|Not covered/);
});
