// MCP Etapa 2 · hardening. (1) The isolated computations return EXACTLY what the in-process ones return, on every
// proposal fixture and on route/review. (2) Over the REAL stdio server: no head-of-line blocking, real cancellation (no
// response, slot freed), concurrency cap with an explained refusal, time budget, bounded string inputs, recovery after
// garbage, clean stdout and the file untouched. Synthetic projects only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const core = require('../src/core.cjs');
const Isolate = require('../src/isolate.cjs');
const { scenario, names } = require('../fixtures/proposal-projects.cjs');
const serverPath = path.join(here, '..', 'src', 'server.mjs');
const sha = b => createHash('sha256').update(b).digest('hex');

function write(project) { const dir = mkdtempSync(path.join(os.tmpdir(), 'mcp-hard-')), file = path.join(dir, 'p.json'); writeFileSync(file, JSON.stringify(project)); return file; }
// ~100 objects and a grid where layout-review rejects every admissible pose: 250 full verifications, several seconds.
function heavyProject() {
  const p = scenario('review-rejects-all'), r = p.rooms[0], xs = r.polygon.map(q => q.x), ys = r.polygon.map(q => q.y);
  for (let i = 0; p.objects.length < 100; i++) p.objects.push({ id: `obj_filler-${String(i).padStart(3, '0')}`, type: 'plant', name: 'filler', position: { x: Math.min(...xs) + 150 + (i % 10) * 10, y: Math.max(...ys) - 150 - Math.floor(i / 10) * 10 }, size: { widthMm: 5, depthMm: 5 }, rotationDeg: 0 });
  return p;
}

test('isolated computations are identical to the in-process ones (every proposal fixture, route and review)', async () => {
  const iso = Isolate.createIsolate({ timeoutMs: 60000 });
  for (const name of names) {
    const file = write(scenario(name)), reader = core.createProjectReader(file), { snapshot, project } = await reader.load();
    for (const objectId of project.objects.map(o => o.id).slice(0, 3)) {
      for (const args of [{ objectId, goal: 'resolve-placement-conflict', expectedSha256: snapshot.sha256 }, { objectId, goal: 'resolve-placement-conflict', expectedSha256: '0'.repeat(64) }]) {
        assert.deepEqual(await core.runIsolated(iso, reader, 'proposeLayout', args), await core.proposeLayout(reader, args), `${name} ${objectId}`);
      }
    }
    const door = project.openings.find(o => o.kind === 'door');
    if (door && project.objects[0]) { const a = { objectId: project.objects[0].id, goal: 'clear-door-swing', openingId: door.id, expectedSha256: snapshot.sha256 }; assert.deepEqual(await core.runIsolated(iso, reader, 'proposeLayout', a), await core.proposeLayout(reader, a), `${name} door`); }
    assert.deepEqual(await core.runIsolated(iso, reader, 'reviewLayout', { clearanceMm: 600 }), await core.reviewLayout(reader, { clearanceMm: 600 }), `${name} review`);
    const room = project.rooms[0], c = room.polygon.reduce((s, q) => ({ x: s.x + q.x / room.polygon.length, y: s.y + q.y / room.polygon.length }), { x: 0, y: 0 });
    const route = { start: { x: Math.round(c.x), y: Math.round(c.y) }, end: { x: Math.round(c.x) + 200, y: Math.round(c.y) }, widthMm: 400 };
    assert.deepEqual(await core.runIsolated(iso, reader, 'checkRoute2d', route), await core.checkRoute2d(reader, route), `${name} route`);
  }
  assert.equal(iso.stats().active, 0);
});

test('isolate: refuses work beyond the cap with an explanation, honours an aborted signal, stops at the time budget', async () => {
  const file = write(heavyProject()), reader = core.createProjectReader(file), { snapshot } = await reader.load();
  const args = { objectId: 'obj_odd', goal: 'resolve-placement-conflict', expectedSha256: snapshot.sha256, stepMm: 10 };
  const iso = Isolate.createIsolate({ timeoutMs: 60000, concurrent: 2 });
  const a = new AbortController(), b = new AbortController();
  const p1 = core.runIsolated(iso, reader, 'proposeLayout', args, { signal: a.signal }), p2 = core.runIsolated(iso, reader, 'proposeLayout', args, { signal: b.signal });
  await new Promise(r => setTimeout(r, 50)); // both reads done, two workers running
  await assert.rejects(core.runIsolated(iso, reader, 'proposeLayout', args), /Ya hay 2 cálculos pesados en curso/);
  a.abort(); b.abort();
  await assert.rejects(p1, /cancelada/); await assert.rejects(p2, /cancelada/);
  assert.equal(iso.stats().active, 0, 'cancelling frees the slots');
  const pre = new AbortController(); pre.abort();
  await assert.rejects(core.runIsolated(iso, reader, 'proposeLayout', args, { signal: pre.signal }), /cancelada/);
  const quick = Isolate.createIsolate({ timeoutMs: 200 });
  await assert.rejects(core.runIsolated(quick, reader, 'proposeLayout', args), /superó el límite de 0.2 s/);
  assert.equal(quick.stats().timedOut, 1); assert.equal(quick.stats().active, 0);
  assert.throws(() => Isolate.timeoutFromEnv({ RUBIK_MCP_HEAVY_TIMEOUT_MS: '5' }), /entre 100 y 120000/);
  assert.equal(Isolate.timeoutFromEnv({}), Isolate.LIMITS.defaultTimeoutMs);
});

function startServer(file, env = {}) {
  const child = spawn(process.execPath, [serverPath, '--project', file], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, ...env } });
  const t0 = Date.now(), seen = new Map(), bad = []; let buf = '', stderr = '';
  child.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); try { const m = JSON.parse(line); if (m.id !== undefined) seen.set(m.id, { at: Date.now() - t0, m }); } catch { bad.push(line); } } });
  child.stderr.on('data', d => { stderr += d; });
  const send = o => child.stdin.write(JSON.stringify(o) + '\n');
  const wait = (id, ms = 30000) => new Promise(res => { const s = Date.now(); const tick = () => { if (seen.has(id)) return res(seen.get(id)); if (Date.now() - s > ms) return res(null); setTimeout(tick, 5); }; tick(); });
  const call = (id, name, args) => send({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });
  return { child, send, wait, call, bad, stderr: () => stderr, now: () => Date.now() - t0 };
}
async function init(s) { s.send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'hardening-test', version: '1' } } }); assert.ok(await s.wait(0)); s.send({ jsonrpc: '2.0', method: 'notifications/initialized' }); }

test('stdio: a heavy proposal no longer blocks other requests; a cancelled one gets no response and frees its slot', async t => {
  const file = write(heavyProject()), before = { sha: sha(readFileSync(file)), mtime: statSync(file).mtimeMs }, s = startServer(file);
  t.after(() => s.child.kill());
  await init(s);
  const shaArg = before.sha, heavy = id => s.call(id, 'propose_layout', { objectId: 'obj_odd', goal: 'resolve-placement-conflict', expectedSha256: shaArg, stepMm: 10 });
  heavy(1); const sent = s.now(); s.call(2, 'get_project_summary', {});
  const r2 = await s.wait(2), r1 = await s.wait(1);
  assert.ok(r2.at - sent < 1500, `summary answered in ${r2.at - sent} ms while the proposal ran`);
  assert.ok(r1.at > r2.at, 'the summary did not wait for the proposal');
  assert.equal(r1.m.result.structuredContent.status, 'pending'); assert.equal(r1.m.result.structuredContent.search.verificationLimitReached, true);
  // Cancel two running proposals: no responses; then two new ones are accepted (slots were freed) and a third is refused.
  heavy(3); heavy(4); await new Promise(r => setTimeout(r, 150));
  s.send({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 3, reason: 'test' } });
  s.send({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 4, reason: 'test' } });
  s.call(5, 'get_project_summary', {}); assert.ok(await s.wait(5, 2000), 'answered right after the cancellations');
  heavy(6); heavy(7); await new Promise(r => setTimeout(r, 150)); heavy(8);
  const r8 = await s.wait(8, 5000);
  assert.equal(r8.m.result.isError, true); assert.match(r8.m.result.content[0].text, /Ya hay 2 cálculos pesados en curso/);
  assert.ok(await s.wait(6) && await s.wait(7), 'the two accepted proposals complete');
  assert.equal(await s.wait(3, 500), null, 'no response for cancelled request 3'); assert.equal(await s.wait(4, 500), null, 'nor for 4');
  assert.deepEqual(s.bad, [], 'stdout carries only JSON-RPC'); assert.equal(s.stderr().trim(), 'Rubik MCP local de solo lectura iniciado.');
  assert.equal(sha(readFileSync(file)), before.sha); assert.equal(statSync(file).mtimeMs, before.mtime);
});

test('stdio: time budget from RUBIK_MCP_HEAVY_TIMEOUT_MS, bounded strings, recovery after garbage and invalid calls', async t => {
  const file = write(heavyProject()), s = startServer(file, { RUBIK_MCP_HEAVY_TIMEOUT_MS: '300' });
  t.after(() => s.child.kill());
  await init(s);
  const shaArg = sha(readFileSync(file));
  s.call(1, 'propose_layout', { objectId: 'obj_odd', goal: 'resolve-placement-conflict', expectedSha256: shaArg, stepMm: 10 });
  const r1 = await s.wait(1, 5000);
  assert.equal(r1.m.result.isError, true); assert.match(r1.m.result.content[0].text, /superó el límite de 0.3 s.*No es una conclusión sobre el proyecto/);
  s.call(2, 'list_project_elements', { kind: 'objects', query: 'x'.repeat(201) });
  assert.match((await s.wait(2)).m.result.content[0].text, /Input validation error.*query/);
  s.call(3, 'list_project_elements', { kind: 'objects', roomId: 'r'.repeat(161) });
  assert.match((await s.wait(3)).m.result.content[0].text, /Input validation error.*roomId/);
  s.child.stdin.write('{not json\n'); s.child.stdin.write('\n');
  s.call(4, 'nope_tool', {}); assert.match((await s.wait(4)).m.result.content[0].text, /not found/);
  s.send({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'propose_layout', arguments: { objectId: 'obj_odd', goal: 'resolve-placement-conflict', expectedSha256: 'nothex' } } });
  assert.match((await s.wait(5)).m.result.content[0].text, /expectedSha256/);
  s.call(6, 'get_project_summary', {}); assert.equal((await s.wait(6)).m.result.structuredContent.snapshot.sha256, shaArg, 'still serving after every bad input');
  assert.deepEqual(s.bad, []);
});

test('stdio: an invalid timeout configuration stops the server at start with a clear message (no silent default)', async () => {
  const file = write(scenario('overlap'));
  const child = spawn(process.execPath, [serverPath, '--project', file], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, RUBIK_MCP_HEAVY_TIMEOUT_MS: '0' } });
  let err = ''; child.stderr.on('data', d => { err += d; });
  const code = await new Promise(r => child.on('exit', r));
  assert.equal(code, 1); assert.match(err, /RUBIK_MCP_HEAVY_TIMEOUT_MS debe ser un entero/);
});
