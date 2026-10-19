'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const core = require('../src/core.cjs');
const { spatialProject } = require('../fixtures/spatial-project.cjs');

async function projectReader(t, project) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'rubik-clearance-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'source.json'), bytes = Buffer.from(JSON.stringify(project));
  await fs.writeFile(file, bytes);
  return { reader: core.createProjectReader(file), file, bytes, hash: crypto.createHash('sha256').update(bytes).digest('hex') };
}
const inspect = (reader, idA = 'obj_rect', idB = 'obj_next', clearanceMm = 600) =>
  core.inspectPairClearance(reader, { idA, idB, clearanceMm });

test('solid wall blocks the minimum segment even with a door elsewhere; door chain is separate evidence', async t => {
  const { reader, file, bytes, hash } = await projectReader(t, spatialProject());
  const result = await inspect(reader);
  assert.equal(result.snapshot.sha256, hash);
  assert.equal(result.scaleConfidence, 'estimated');
  assert.equal(result.geometricGap.distanceMm, 3450);
  assert.equal(result.geometricGap.comparison, 'at_or_above_user_threshold');
  assert.equal(result.minimumSegment.status, 'blocked_by_documented_obstacle');
  assert.ok(result.minimumSegment.obstacles.some(o => o.id === 'wal_shared' && o.kind === 'solid_wall'));
  assert.deepEqual(result.connectivity.openingIds, ['opn_shared-door']);
  assert.equal(result.connectivity.status, 'documented_door_chain');
  assert.deepEqual(await fs.readFile(file), bytes);
  assert.equal(JSON.stringify(result).includes(file), false);
});

test('a door subspan on the straight segment is visible but never certifies a route', async t => {
  const p = spatialProject();
  p.objects = p.objects.filter(o => ['obj_rect', 'obj_next'].includes(o.id));
  p.objects[0].position.y = p.objects[1].position.y = 1600;
  const { reader } = await projectReader(t, p);
  const result = await inspect(reader, 'obj_rect', 'obj_next', 4000);
  assert.equal(result.geometricGap.comparison, 'below_user_threshold');
  assert.equal(result.minimumSegment.status, 'cross_room_route_not_evaluated');
  assert.ok(result.minimumSegment.obstacles.some(o => o.id === 'opn_shared-door' && o.kind === 'door'));
  assert.ok(!result.minimumSegment.obstacles.some(o => o.kind === 'solid_wall'));
  assert.equal(result.connectivity.status, 'documented_door_chain');
});

test('a window on the same subspan is an obstacle and not a door connection', async t => {
  const p = spatialProject();
  p.objects = p.objects.filter(o => ['obj_rect', 'obj_next'].includes(o.id));
  p.objects[0].position.y = p.objects[1].position.y = 1600;
  Object.assign(p.openings[0], { kind: 'window', sillHeightMm: 900, heightMm: 1200 });
  const { reader } = await projectReader(t, p);
  const result = await inspect(reader);
  assert.equal(result.minimumSegment.status, 'blocked_by_documented_obstacle');
  assert.ok(result.minimumSegment.obstacles.some(o => o.kind === 'window'));
  assert.equal(result.connectivity.status, 'no_documented_door_chain');
});

test('same-room third object obstructs the minimum segment; contact is not declared a passage', async t => {
  const p = spatialProject();
  const base = p.objects.find(o => o.id === 'obj_rect');
  p.objects = [base, { ...base, id: 'obj_far', position: { x: 3000, y: 1000 }, roomId: 'rom_rect' },
    { ...base, id: 'obj_middle', position: { x: 2000, y: 1000 }, roomId: 'rom_rect' }];
  const { reader } = await projectReader(t, p);
  const result = await inspect(reader, 'obj_rect', 'obj_far', 500);
  assert.equal(result.connectivity.status, 'same_derived_room');
  assert.equal(result.minimumSegment.status, 'blocked_by_documented_obstacle');
  assert.ok(result.minimumSegment.obstacles.some(o => o.id === 'obj_middle'));
  p.objects[1].position.x = 1600;
  const touching = await projectReader(t, p);
  assert.equal((await inspect(touching.reader, 'obj_rect', 'obj_far', 500)).minimumSegment.status,
    'contact_or_overlap_not_a_passage');
});

test('a straight minimum segment leaving a concave room does not imply an interior passage', async t => {
  const p = spatialProject();
  const lower = p.objects.find(o => o.id === 'obj_concave-inside');
  const upper = { ...lower, id: 'obj_concave-upper', name: 'upper',
    position: { x: 3500, y: 5500 } };
  p.objects = [lower, upper];
  const { reader } = await projectReader(t, p);
  const result = await inspect(reader, lower.id, upper.id, 700);
  assert.equal(result.connectivity.status, 'same_derived_room');
  assert.equal(result.minimumSegment.status, 'leaves_derived_room');
});

test('invalid arguments and invalid JSON cannot produce clearance claims', async t => {
  const p = spatialProject(), { reader } = await projectReader(t, p);
  await assert.rejects(inspect(reader, 'obj_rect', 'obj_next', 0), /umbral explícito/);
  await assert.rejects(inspect(reader, 'rom_rect', 'obj_next', 300), /dos muebles/);
  await assert.rejects(inspect(reader, 'obj_absent', 'obj_next', 300), /No existe/);
  p.openings[0].wallId = 'wal_missing';
  const bad = await projectReader(t, p);
  await assert.rejects(inspect(bad.reader), /FloorPlanProjectV1/);
});
