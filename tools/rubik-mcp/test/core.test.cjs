'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const C = require('../../../js/project-core.js');
const core = require('../src/core.cjs');

async function fixture(t, project = C.initial()) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'rubik-mcp-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'floorplan.json');
  await fs.writeFile(file, JSON.stringify(project));
  return { dir, file, project, reader: core.createProjectReader(file) };
}

test('summary validates the selected V1 JSON and reports only compact metadata', async t => {
  const { reader, project } = await fixture(t);
  const summary = await core.getSummary(reader);
  assert.equal(summary.snapshot.projectId, project.id);
  assert.equal(summary.snapshot.schemaVersion, project.schemaVersion);
  assert.equal(summary.counts.rooms, project.rooms.length);
  assert.equal(summary.counts.sourceImages, project.sourceImages?.length || 0);
  assert.equal(JSON.stringify(summary).includes('data:image'), false);
});

test('element queries paginate and redact unneeded project fields', async t => {
  const { reader, project } = await fixture(t);
  const page = await core.listElements(reader, { kind: 'objects', offset: 0, limit: 2 });
  assert.equal(page.total, project.objects.length);
  assert.equal(page.items.length, 2);
  assert.equal('sourceImages' in page, false);
});

test('layout review calls Rubik geometry and preserves explicit-threshold semantics', async t => {
  const { reader, project, file } = await fixture(t);
  const before = await fs.readFile(file, 'utf8');
  const without = await core.reviewLayout(reader);
  assert.equal(without.checks.holgura.status, 'insufficient_evidence');
  const withThreshold = await core.reviewLayout(reader, { clearanceMm: 300 });
  assert.equal(withThreshold.units, 'mm');
  assert.equal(withThreshold.checks.holgura.thresholdMm, 300);
  assert.equal(await fs.readFile(file, 'utf8'), before);
  assert.equal(JSON.stringify(project), before);
});

test('rejects invalid project data and symbolic links', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'rubik-mcp-security-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const invalid = path.join(dir, 'invalid.json');
  await fs.writeFile(invalid, '{"schemaVersion":"9.0.0"}');
  await assert.rejects(core.createProjectReader(invalid).load(), /no cumple FloorPlanProjectV1/);
  const valid = path.join(dir, 'valid.json');
  await fs.writeFile(valid, JSON.stringify(C.initial()));
  const link = path.join(dir, 'link.json');
  await fs.symlink(valid, link);
  await assert.rejects(core.createProjectReader(link).load(), /enlace simbólico/);
});

test('rejects oversized input and detects changes to the selected file', async t => {
  const { reader, file } = await fixture(t);
  const first = await reader.load();
  const changed = C.initial(); changed.name = 'Updated export';
  await fs.writeFile(file, JSON.stringify(changed));
  const second = await reader.load();
  assert.notEqual(second.snapshot.sha256, first.snapshot.sha256);
  assert.equal(second.project.name, 'Updated export');
  await fs.writeFile(file, 'x'.repeat(core.MAX_PROJECT_BYTES + 1));
  await assert.rejects(reader.load(), /15 MiB/);
});
