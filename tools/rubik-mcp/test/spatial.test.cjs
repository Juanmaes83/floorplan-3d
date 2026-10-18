'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const core = require('../src/core.cjs');
const { spatialProject } = require('../fixtures/spatial-project.cjs');

async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'rubik-mcp-spatial-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'project.json');
  const original = Buffer.from(JSON.stringify(spatialProject()));
  await fs.writeFile(file, original);
  return { file, original, reader: core.createProjectReader(file) };
}

async function relation(reader, id) {
  return (await core.getElement(reader, { id })).item.relation;
}

test('rotated footprints, concave rooms and stored IDs report geometric attribution or uncertainty', async t => {
  const { reader } = await fixture(t);
  const expected = [
    ['obj_rect', ['rom_rect'], 'unique'],
    ['obj_next', ['rom_next'], 'unique'],
    ['obj_cross', ['rom_rect', 'rom_next'], 'ambiguous'],
    ['obj_rotated', ['rom_rotated'], 'unique'],
    ['obj_concave-inside', ['rom_concave'], 'unique'],
    ['obj_concave-cross', ['rom_concave'], 'ambiguous'],
    ['obj_concave-notch', [], 'unattributed'],
    ['obj_boundary', ['rom_rect', 'rom_next'], 'ambiguous'],
    ['obj_outside', [], 'unattributed'],
    ['obj_wrong-stored-room', ['rom_rect'], 'ambiguous'],
  ];
  for (const [id, roomIds, status] of expected) {
    const got = await relation(reader, id);
    assert.deepEqual(got.roomIds, roomIds, id);
    assert.equal(got.status, status, id);
    assert.match(got.method, /^rotated_footprint_/, id);
  }
  assert.equal((await relation(reader, 'obj_rect')).storedRoomId, 'rom_rect');
  const mismatch = await relation(reader, 'obj_wrong-stored-room');
  assert.equal(mismatch.storedRoomId, 'rom_next');
  assert.equal(mismatch.reason, 'stored_room_id_conflicts_with_geometry');
  assert.equal((await relation(reader, 'obj_boundary')).reason, 'boundary_contact_only');
  assert.equal((await relation(reader, 'obj_concave-cross')).reason, 'footprint_partly_outside_rooms');
});

test('shared, exterior and outside wall strips and opening subspans retain every involved room', async t => {
  const { reader } = await fixture(t);
  const expected = [
    ['wal_shared', ['rom_rect', 'rom_next'], 'shared'],
    ['wal_exterior', ['rom_rect'], 'unique'],
    ['wal_long', ['rom_rect', 'rom_next'], 'shared'],
    ['wal_outside', [], 'unattributed'],
    ['opn_shared-door', ['rom_rect', 'rom_next'], 'shared'],
    ['opn_exterior-window', ['rom_rect'], 'unique'],
    ['opn_long-only-rect', ['rom_rect'], 'unique'],
    ['opn_outside', [], 'unattributed'],
  ];
  for (const [id, roomIds, status] of expected) {
    const got = await relation(reader, id);
    assert.deepEqual(got.roomIds, roomIds, id);
    assert.equal(got.status, status, id);
    if (roomIds.length) assert.ok(got.evidence.every(e => e.overlapAreaMm2 > 0 || e.contactLengthMm > 1), id);
  }
  const opening = await core.getElement(reader, { id: 'opn_long-only-rect' });
  assert.equal(opening.item.wallId, 'wal_long');
  assert.equal(opening.item.relation.method, 'opening_span_polygon_contact');
});

test('roomId filters own room ID and all derived candidates before search and pagination', async t => {
  const { reader } = await fixture(t);
  assert.deepEqual((await core.listElements(reader, { kind: 'rooms', roomId: 'rom_rect' })).items.map(x => x.id), ['rom_rect']);
  assert.equal((await core.listElements(reader, { kind: 'rooms', roomId: 'rom_missing' })).total, 0);
  const rectObjects = await core.listElements(reader, { kind: 'objects', roomId: 'rom_rect' });
  assert.deepEqual(rectObjects.items.map(x => x.id), ['obj_rect', 'obj_cross', 'obj_boundary', 'obj_wrong-stored-room']);
  const nextObjects = await core.listElements(reader, { kind: 'objects', roomId: 'rom_next' });
  assert.deepEqual(nextObjects.items.map(x => x.id), ['obj_next', 'obj_cross', 'obj_boundary']);
  assert.equal(nextObjects.items.some(x => x.id === 'obj_wrong-stored-room'), false);
  const page = await core.listElements(reader, { kind: 'objects', roomId: 'rom_rect', offset: 1, limit: 2 });
  assert.equal(page.total, 4);
  assert.equal(page.offset, 1);
  assert.equal(page.limit, 2);
  assert.deepEqual(page.items.map(x => x.id), ['obj_cross', 'obj_boundary']);
  const searched = await core.listElements(reader, { kind: 'objects', roomId: 'rom_rect', query: 'cross', limit: 1 });
  assert.equal(searched.total, 1);
  assert.equal(searched.items[0].id, 'obj_cross');
  assert.deepEqual((await core.listElements(reader, { kind: 'walls', roomId: 'rom_next' })).items.map(x => x.id), ['wal_shared', 'wal_long']);
  assert.deepEqual((await core.listElements(reader, { kind: 'openings', roomId: 'rom_next' })).items.map(x => x.id), ['opn_shared-door']);
});

test('queries keep source bytes and hash stable and redact file paths and source images', async t => {
  const { reader, file, original } = await fixture(t);
  const expectedHash = crypto.createHash('sha256').update(original).digest('hex');
  const results = [
    await core.getSummary(reader),
    await core.listElements(reader, { kind: 'objects', roomId: 'rom_rect', limit: 1 }),
    await core.listElements(reader, { kind: 'walls', roomId: 'rom_next' }),
    await core.listElements(reader, { kind: 'openings', roomId: 'rom_rect' }),
    await core.getElement(reader, { id: 'obj_rotated' }),
  ];
  for (const result of results) {
    assert.equal(result.snapshot.sha256, expectedHash);
    assert.equal(JSON.stringify(result).includes(file), false);
    assert.equal(JSON.stringify(result).includes('sourceImages'), result === results[0]);
    assert.ok(Buffer.byteLength(JSON.stringify(result)) <= core.MAX_RESPONSE_BYTES);
  }
  assert.deepEqual(await fs.readFile(file), original);
});

test('contract example room filter recovers rooms, walls and openings without stored roomId', async () => {
  const reader = core.createProjectReader(path.resolve(__dirname, '../../../docs/contracts/examples/floorplan-project-v1.example.json'));
  const counts = [];
  for (const kind of ['rooms', 'walls', 'openings', 'objects']) {
    counts.push((await core.listElements(reader, { kind, roomId: 'rom_living' })).total);
  }
  assert.deepEqual(counts, [1, 6, 3, 2]);
  const wall = (await core.getElement(reader, { id: 'wal_bath-west' })).item;
  assert.deepEqual(wall.relation.roomIds, ['rom_living', 'rom_bath']);
  assert.equal(wall.relation.status, 'shared');
});
