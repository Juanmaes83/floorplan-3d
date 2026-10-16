'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const core = require('../src/core.cjs');
const { spatialProject } = require('../fixtures/spatial-project.cjs');

async function fixture(t, content = JSON.stringify(spatialProject())) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'rubik-mcp-stage1b-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'selected.json');
  const original = Buffer.from(content);
  await fs.writeFile(file, original);
  return { file, original, sha256: crypto.createHash('sha256').update(original).digest('hex'), reader: core.createProjectReader(file) };
}
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 0.001, `${actual} != ${expected} mm`);

test('valid diagnosis groups independent scale, provenance, completeness and spatial uncertainty without a contract error', async t => {
  const project = spatialProject();
  project.scale = { confidence: 'estimated', method: 'template' };
  project.openings[0].swing = undefined;
  project.walls[0].source = { method: 'manual', review: 'unreviewed' };
  const { reader, file, original, sha256 } = await fixture(t, JSON.stringify(project));
  const result = await core.diagnoseProject(reader);
  assert.equal(result.valid, true);
  assert.equal(result.snapshot.sha256, sha256);
  assert.equal(result.checks.references, 'passed');
  assert.ok(result.findings.some(f => f.category === 'scale' && f.severity === 'info'));
  assert.ok(result.findings.some(f => f.elementId === 'wal_shared' && f.category === 'provenance'));
  assert.ok(result.findings.some(f => f.elementId === 'opn_shared-door' && f.rule === 'door.swing_optional'));
  assert.ok(result.findings.some(f => f.elementId === 'obj_cross' && f.severity === 'ambiguous'));
  assert.ok(result.findings.some(f => f.elementId === 'obj_outside' && f.severity === 'incomplete'));
  assert.equal(JSON.stringify(result).includes(file), false);
  assert.ok(Buffer.byteLength(JSON.stringify(result)) <= core.MAX_RESPONSE_BYTES);
  assert.deepEqual(await fs.readFile(file), original);
});

test('invalid format, broken reference and invalid geometry expose only canonical first error; ordinary tools still reject', async t => {
  for (const [content, category, type, id] of [
    ['{broken', 'format', undefined, undefined],
    [(() => { const p = spatialProject(); p.openings[0].wallId = 'wal_missing'; return JSON.stringify(p); })(), 'reference', 'openings', 'opn_shared-door'],
    [(() => { const p = spatialProject(); p.walls[0].end = { ...p.walls[0].start }; return JSON.stringify(p); })(), 'geometry', 'walls', 'wal_shared'],
    [(() => { const p = spatialProject(); p.units = 'cm'; return JSON.stringify(p); })(), 'contract', undefined, undefined],
  ]) {
    const { reader, original, file, sha256 } = await fixture(t, content);
    const result = await core.diagnoseProject(reader);
    assert.equal(result.status, 'blocked');
    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].category, category);
    assert.equal(result.findings[0].rule, category === 'format' ? 'JSON.parse' : 'FloorPlanProjectV1');
    assert.equal(result.findings[0].elementType, type);
    assert.equal(result.findings[0].elementId, id);
    assert.equal(result.checks.spatialRelations, 'not_run');
    assert.equal(result.snapshot.sha256, sha256);
    await assert.rejects(core.getSummary(reader));
    await assert.rejects(core.measureElements(reader, { idA: 'obj_rect', idB: 'obj_next', mode: 'regions' }));
    assert.deepEqual(await fs.readFile(file), original);
  }
});

test('measure reference points and 2D regions with known geometry, concavity, rotation, walls and openings', async t => {
  const { reader, original, file, sha256 } = await fixture(t);
  const measure = (idA, idB, mode) => core.measureElements(reader, { idA, idB, mode });
  const centres = await measure('obj_rect', 'obj_next', 'reference_points');
  near(centres.distanceMm, 4000);
  assert.deepEqual(centres.pointA, { x: 1000, y: 1000 });
  assert.deepEqual(centres.pointB, { x: 5000, y: 1000 });
  const footprints = await measure('obj_rect', 'obj_next', 'regions');
  near(footprints.distanceMm, 3450);
  assert.deepEqual(footprints.pointA, { x: 1300, y: 750 });
  assert.deepEqual(footprints.pointB, { x: 4750, y: 750 });
  near((await measure('obj_concave-notch', 'rom_concave', 'regions')).distanceMm, 750);
  near((await measure('obj_rotated', 'rom_rotated', 'regions')).distanceMm, 0);
  near((await measure('obj_rect', 'wal_exterior', 'regions')).distanceMm, 700);
  near((await measure('obj_rect', 'opn_shared-door', 'regions')).distanceMm, 2700);
  assert.equal(footprints.snapshot.sha256, sha256);
  assert.equal(footprints.units, 'mm');
  assert.equal(footprints.plane, '2d');
  assert.equal(footprints.scaleConfidence, 'estimated');
  assert.equal((await measure('obj_cross', 'obj_next', 'regions')).status, 'spatial_relation_uncertain');
  await assert.rejects(measure('rom_concave', 'obj_rect', 'reference_points'), /no tienen un punto/);
  await assert.rejects(measure('obj_missing', 'obj_rect', 'regions'), /No existe/);
  assert.deepEqual(await fs.readFile(file), original);
});

test('contact and overlap measure zero without claiming a traversable clearance; estimated scale remains explicit', async t => {
  const p = spatialProject();
  p.scale = { confidence: 'estimated', method: 'template' };
  const source = p.objects[0];
  p.objects.push({ ...source, id: 'obj_touch', name: 'touch', roomId: undefined, position: { x: 1600, y: 1000 } });
  p.objects.push({ ...source, id: 'obj_overlap', name: 'overlap', roomId: undefined, position: { x: 1500, y: 1000 } });
  const { reader, file, original } = await fixture(t, JSON.stringify(p));
  for (const id of ['obj_touch', 'obj_overlap']) {
    const result = await core.measureElements(reader, { idA: 'obj_rect', idB: id, mode: 'regions' });
    near(result.distanceMm, 0);
    assert.equal(result.scaleConfidence, 'estimated');
    assert.deepEqual(result.pointA, result.pointB);
  }
  assert.deepEqual(await fs.readFile(file), original);
});

test('rotated footprint uses its exact plan extent for a known wall gap', async t => {
  const p = spatialProject();
  p.walls.push({ id: 'wal_rotated-gap', start: { x: 13000, y: 0 }, end: { x: 13000, y: 4000 },
    thicknessMm: 100, heightMm: 2600, structure: 'partition', status: 'existing' });
  const { reader } = await fixture(t, JSON.stringify(p));
  const result = await core.measureElements(reader, {
    idA: 'obj_rotated', idB: 'wal_rotated-gap', mode: 'regions',
  });
  near(result.distanceMm, 950 - 550 / Math.sqrt(2));
  near(result.pointA.x, 12000 + 550 / Math.sqrt(2));
  near(result.pointB.x, 12950);
});

test('diagnostic limits visible findings and reports truncation instead of hiding omitted elements', async t => {
  const p = spatialProject();
  const template = p.objects.find(object => object.id === 'obj_outside');
  for (let i = 0; i < 110; i++) p.objects.push({ ...template,
    id: `obj_extra-${i}`, name: `extra-${i}`, position: { x: 20000 + i * 700, y: 18000 } });
  const { reader } = await fixture(t, JSON.stringify(p));
  const result = await core.diagnoseProject(reader);
  assert.equal(result.valid, true);
  assert.equal(result.findings.length, 100);
  assert.equal(result.truncated, true);
  assert.ok(result.totalFindings > 100);
  assert.ok(Buffer.byteLength(JSON.stringify(result)) <= core.MAX_RESPONSE_BYTES);
});
