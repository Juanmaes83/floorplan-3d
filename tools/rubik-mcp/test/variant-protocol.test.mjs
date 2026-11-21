import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import Core from '../../../js/project-core.js';
import Package from '../../../js/project-package.js';
import { scenario } from '../fixtures/proposal-projects.cjs';
import { entryName, exportVariant } from '../src/export-variant.mjs';
import { digest } from '../src/simulation.cjs';

const server = fileURLToPath(new URL('../src/server.mjs', import.meta.url));
const cli = fileURLToPath(new URL('../src/export-variant.mjs', import.meta.url));

test('MCP stages 1–4 preserve the source and produce a canonical, attributable variant after review', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'rubik-m05-'));
  const outputPath = join(dir, 'review');
  await mkdir(outputPath);
  const original = scenario('overlap');
  original.name = 'P'.repeat(120);
  const originalBytes = JSON.stringify(original);
  const projectPath = join(dir, 'original.json');
  await writeFile(projectPath, originalBytes);
  const client = new Client({ name: 'rubik-variant-test', version: '1.0.0' });
  t.after(async () => { await client.close(); await rm(dir, { recursive: true, force: true }); });
  const transport = new StdioClientTransport({ command: process.execPath, args: [server, '--project', projectPath] });
  await client.connect(transport);
  const listed = (await client.listTools()).tools;
  const entry = listed.find(tool => tool.name === 'simulate_layout');
  assert.equal(entry.annotations.readOnlyHint, true);
  assert.equal(listed.some(tool => /export|apply|write/.test(tool.name)), false);

  const call = async (name, args = {}) => {
    const response = await client.callTool({ name, arguments: args });
    assert.equal(response.isError, undefined, JSON.stringify(response));
    return response.structuredContent;
  };
  const summary = await call('get_project_summary');
  assert.equal(summary.snapshot.sha256, digest(originalBytes));
  assert.equal((await call('diagnose_project')).valid, true);
  const request = { objectId: 'obj_beta', goal: 'resolve-placement-conflict', expectedSha256: summary.snapshot.sha256 };
  const proposal = await call('propose_layout', request);
  const report = await call('simulate_layout', request);
  assert.equal(report.source.sha256, summary.snapshot.sha256);
  assert.equal(report.applied, false);
  assert.equal(report.proposal.applicable, false);
  assert.equal(report.status, 'candidate-reviewable');
  assert.deepEqual(report.affected[0].after, proposal.suggestedPose);
  assert.equal(report.comparison.before.review.counts.solape, 1);
  assert.equal(report.comparison.after.review.counts.solape, 0);
  assert.equal(report.comparison.before.review.checks.holgura.status, 'insufficient_evidence');
  assert.equal(report.comparison.before.netAreaM2, report.comparison.after.netAreaM2);
  assert.equal(report.comparison.before.objects, report.comparison.after.objects);
  const { simulationSha256, ...unsigned } = report;
  assert.equal(simulationSha256, digest(JSON.stringify(unsigned)));
  assert.deepEqual(await call('simulate_layout', request), report);
  const withClearance = await call('simulate_layout', { ...request, clearanceMm: 600 });
  assert.equal(withClearance.comparison.after.review.checks.holgura.status, 'checked');
  assert.notEqual(withClearance.simulationSha256, simulationSha256);
  assert.ok(withClearance.notEvaluated.some(reason => reason.code === 'route'));

  const options = { projectPath, outputPath, request, simulationSha256 };
  const denied = () => assert.fail('confirmation must not be presented for this result');
  for (const [changes, status] of [[{ maxCandidates: 1 }, 'pending'], [{ objectId: 'wal_south' }, 'blocked'],
    [{ goal: 'clear-door-swing', openingId: 'opn_door' }, 'no-change-needed'], [{ expectedSha256: '0'.repeat(64) }, 'blocked']]) {
    const modified = { ...request, ...changes };
    const refusal = await call('simulate_layout', modified);
    assert.equal(refusal.status, status);
    assert.equal(refusal.simulationSha256, undefined);
    await assert.rejects(exportVariant({ ...options, request: modified, confirm: denied }), /no es exportable/);
  }
  await assert.rejects(exportVariant({ ...options, simulationSha256: '0'.repeat(64), confirm: denied }), /huella/);
  assert.equal(await exportVariant({ ...options, confirm: () => false }), null);
  const abort = new AbortController();
  await assert.rejects(exportVariant({ ...options, signal: abort.signal, confirm: () => { abort.abort(); return true; } }), { name: 'AbortError' });
  await assert.rejects(exportVariant({ ...options, confirm: async () => { await writeFile(projectPath, originalBytes + ' '); return true; } }), /original cambió/);
  await writeFile(projectPath, originalBytes);
  assert.deepEqual(await readdir(outputPath), []);
  const existing = 'revisión previa';
  let existingPath;
  await assert.rejects(exportVariant({ ...options, confirm: async ({ finalPath }) => {
    existingPath = finalPath; await writeFile(finalPath, existing); return true;
  } }), { code: 'EEXIST' });
  assert.equal(await readFile(existingPath, 'utf8'), existing);
  const result = await exportVariant({ ...options, confirm({ manifest, finalPath }) {
    assert.equal(manifest.simulation.simulationSha256, simulationSha256);
    assert.match(finalPath, /rubik-variante-.*\.zip$/);
    return true;
  } });
  const archive = await Package.unzip(await readFile(result.finalPath), {
    check: entryName, maxEntries: 2, jsonNames: ['project.json', 'simulation.json'],
  });
  assert.deepEqual([...archive.keys()], ['project.json', 'simulation.json']);
  const bytes = archive.get('project.json');
  const variant = JSON.parse(new TextDecoder().decode(bytes));
  assert.doesNotThrow(() => Core.validate(variant));
  assert.notEqual(variant.id, original.id);
  assert.match(variant.name, /Variante MCP$/);
  assert.ok(variant.name.length <= 120);
  const expected = structuredClone(original);
  expected.id = variant.id;
  expected.name = variant.name;
  expected.objects.find(item => item.id === request.objectId).position = proposal.suggestedPose.position;
  assert.deepEqual(variant, expected);
  const manifest = JSON.parse(new TextDecoder().decode(archive.get('simulation.json')));
  assert.deepEqual(manifest, result.manifest);
  assert.equal(manifest.variant.sha256, digest(bytes));
  assert.equal(manifest.attachmentsIncluded, false);
  assert.equal(await readFile(projectPath, 'utf8'), originalBytes);
  assert.equal((await readdir(outputPath)).length, 2, 'only the prior and the completed review archives');
  const noninteractive = spawnSync(process.execPath, [cli, '--project', projectPath, '--output-dir', outputPath,
    '--object-id', request.objectId, '--goal', request.goal, '--expected-sha256', request.expectedSha256,
    '--simulation-sha256', simulationSha256], { input: `GUARDAR ${simulationSha256.slice(0,8)}\n`, encoding: 'utf8' });
  assert.notEqual(noninteractive.status, 0);
  assert.match(noninteractive.stderr, /terminal interactiva/);
  assert.equal((await readdir(outputPath)).length, 2);
});
