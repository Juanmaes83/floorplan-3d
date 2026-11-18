// MCP Etapa 2 over the real protocol: a client connected by stdio discovers propose_layout next to the eight existing
// tools, with read-only annotations, and receives the four states, the stale-hash refusal and identical repeated
// answers. The export is never changed and stdout carries only JSON-RPC.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const require = createRequire(import.meta.url);
const { scenario } = require('../fixtures/proposal-projects.cjs');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const serverPath = path.join(root, 'tools/rubik-mcp/src/server.mjs');
const PREVIOUS = ['check_route_2d', 'diagnose_project', 'get_project_element', 'get_project_summary', 'inspect_pair_clearance', 'list_project_elements', 'measure_elements', 'review_layout'];

async function connect(t, project) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'rubik-mcp-proposal-protocol-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'project.json');
  const bytes = Buffer.from(JSON.stringify(project));
  await writeFile(file, bytes);
  const client = new Client({ name: 'rubik-mcp-proposal-test', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [serverPath, '--project', file], stderr: 'pipe' });
  let stderr = '';
  transport.stderr?.on('data', chunk => { stderr += chunk; });
  t.after(async () => { try { await client.close(); } catch { /* closed */ } });
  await client.connect(transport);
  return { client, dir, file, bytes, stderrText: () => stderr };
}

test('stdio: propose_layout is discovered, read-only, and answers the four states without touching the export', async t => {
  const { client, dir, file, bytes, stderrText } = await connect(t, scenario('overlap'));
  const before = await stat(file);
  const tools = (await client.listTools()).tools;
  assert.deepEqual(tools.map(x => x.name).sort(), [...PREVIOUS, 'propose_layout'].sort());
  const tool = tools.find(x => x.name === 'propose_layout');
  assert.deepEqual(tool.annotations, { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
  assert.deepEqual(tool.inputSchema.required.sort(), ['expectedSha256', 'goal', 'objectId']);
  assert.ok(!('path' in tool.inputSchema.properties) && !('project' in tool.inputSchema.properties), 'no argument selects a file');
  for (const name of PREVIOUS) assert.equal(tools.find(x => x.name === name).annotations.readOnlyHint, true, name);

  const sha = (await client.callTool({ name: 'get_project_summary', arguments: {} })).structuredContent.snapshot.sha256;
  const call = args => client.callTool({ name: 'propose_layout', arguments: { goal: 'resolve-placement-conflict', expectedSha256: sha, ...args } });

  const candidate = await call({ objectId: 'obj_beta' });
  assert.equal(candidate.isError, undefined);
  assert.equal(candidate.structuredContent.status, 'candidate-reviewable');
  assert.equal(candidate.structuredContent.applied, false);
  assert.equal(candidate.structuredContent.source.sha256, sha);
  assert.deepEqual(JSON.parse(candidate.content[0].text), candidate.structuredContent);

  const pending = await call({ objectId: 'obj_beta', maxCandidates: 1 });
  assert.equal(pending.structuredContent.status, 'pending');
  assert.equal(pending.structuredContent.blockingReasons[0].code, 'search-budget-exhausted');

  const noChange = await call({ objectId: 'obj_beta', goal: 'clear-door-swing', openingId: 'opn_door' });
  assert.equal(noChange.structuredContent.status, 'no-change-needed');

  const blocked = await call({ objectId: 'wal_south' });
  assert.equal(blocked.structuredContent.status, 'blocked');
  const stale = await call({ objectId: 'obj_beta', expectedSha256: '0'.repeat(64) });
  assert.equal(stale.structuredContent.status, 'blocked');
  assert.equal(stale.structuredContent.blockingReasons[0].code, 'stale-source');

  // Repeated identical requests give identical answers.
  const again = await call({ objectId: 'obj_beta' });
  assert.deepEqual(again.structuredContent, candidate.structuredContent);

  // Schema refusals are controlled errors, never crashes.
  for (const args of [{ objectId: 'obj_beta', stepMm: 5 }, { objectId: 'obj_beta', maxCandidates: 100000 }, { objectId: 'obj_beta', goal: 'teleport' }, { objectId: 'obj_beta', expectedSha256: 'xyz' }, { objectId: '' }]) {
    const r = await call(args).catch(error => ({ isError: true, error }));
    assert.equal(r.isError, true, JSON.stringify(args));
  }
  // An extra "path" argument cannot select or read another file.
  const sneaky = await call({ objectId: 'obj_beta', path: '/etc/passwd' }).catch(error => ({ isError: true, error }));
  assert.ok(sneaky.isError || sneaky.structuredContent.status === 'candidate-reviewable');
  assert.ok(!JSON.stringify(sneaky).includes('root:'), 'nothing from another file');

  // The eight previous tools still answer on the same file.
  for (const [name, args] of [['diagnose_project', {}], ['review_layout', {}], ['list_project_elements', { kind: 'objects' }], ['get_project_element', { id: 'obj_beta' }],
    ['measure_elements', { idA: 'obj_alpha', idB: 'obj_beta', mode: 'regions' }], ['inspect_pair_clearance', { idA: 'obj_alpha', idB: 'obj_beta', clearanceMm: 600 }],
    ['check_route_2d', { start: { x: 200, y: 200 }, end: { x: 3800, y: 2800 }, widthMm: 300 }]]) {
    const r = await client.callTool({ name, arguments: args });
    assert.equal(r.isError, undefined, name);
    assert.equal(r.structuredContent.snapshot?.sha256 ?? r.structuredContent.snapshot?.sha256, sha, name);
  }

  assert.deepEqual(await readFile(file), bytes, 'same bytes');
  assert.equal((await stat(file)).mtimeMs, before.mtimeMs);
  assert.deepEqual(await readdir(dir), ['project.json'], 'no file written');
  assert.equal(stderrText().trim(), 'Rubik MCP local de solo lectura iniciado.', 'no debug output');
});

test('stdio: stdout carries only JSON-RPC messages', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'rubik-mcp-proposal-stdout-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'project.json');
  await writeFile(file, JSON.stringify(scenario('door-blocked')));
  const child = spawn(process.execPath, [serverPath, '--project', file], { stdio: ['pipe', 'pipe', 'pipe'] });
  t.after(() => child.kill());
  let out = '';
  child.stdout.on('data', chunk => { out += chunk; });
  const send = message => child.stdin.write(JSON.stringify(message) + '\n');
  const waitFor = id => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), 15000);
    const check = () => {
      const lines = out.split('\n').filter(Boolean);
      const hit = lines.map(line => JSON.parse(line)).find(m => m.id === id);
      if (hit) { clearTimeout(timer); child.stdout.off('data', check); resolve(hit); }
    };
    child.stdout.on('data', check); check();
  });
  send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'raw', version: '1' } } });
  await waitFor(1);
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  send({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'get_project_summary', arguments: {} } });
  const sha = (await waitFor(2)).result.structuredContent.snapshot.sha256;
  send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'propose_layout', arguments: { objectId: 'obj_chair', goal: 'clear-door-swing', openingId: 'opn_door', expectedSha256: sha } } });
  const answer = await waitFor(3);
  assert.equal(answer.result.structuredContent.status, 'candidate-reviewable');
  for (const line of out.split('\n').filter(Boolean)) assert.equal(JSON.parse(line).jsonrpc, '2.0', 'every stdout line is JSON-RPC');
});
