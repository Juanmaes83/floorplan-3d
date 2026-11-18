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

test('the isolated worker is locked down: file writes, child processes and network throw; reads of code still work', async () => {
  const { Worker } = await import('node:worker_threads');
  const lockdownPath = path.join(here, '..', 'src', 'lockdown.cjs');
  const code = `const { parentPort, workerData } = require('node:worker_threads'); require(workerData.lockdown).lockdown();
    const fs = require('node:fs'), cp = require('node:child_process'), http = require('node:http'), net = require('node:net'), out = {};
    const probe = (k, f) => { try { f(); out[k] = 'allowed'; } catch (e) { out[k] = /Bloqueado/.test(e.message) ? 'blocked' : 'error:' + e.message; } };
    probe('writeFileSync', () => fs.writeFileSync(workerData.target, 'x'));
    probe('openSync-w', () => fs.openSync(workerData.target, 'w'));
    probe('openSync-r', () => fs.closeSync(fs.openSync(workerData.lockdown, 'r')));
    probe('spawn', () => cp.spawn('true')); probe('http', () => http.request('http://127.0.0.1')); probe('net', () => net.connect(1));
    probe('fetch', () => fetch('http://127.0.0.1')); parentPort.postMessage(out);`;
  const target = path.join(mkdtempSync(path.join(os.tmpdir(), 'mcp-lock-')), 'must-not-exist.txt');
  const w = new Worker(code, { eval: true, workerData: { lockdown: lockdownPath, target } });
  const out = await new Promise((res, rej) => { w.once('message', res); w.once('error', rej); });
  await w.terminate();
  assert.deepEqual(out, { writeFileSync: 'blocked', 'openSync-w': 'blocked', 'openSync-r': 'allowed', spawn: 'blocked', http: 'blocked', net: 'blocked', fetch: 'blocked' });
  assert.throws(() => statSync(target), /ENOENT/, 'nothing was written');
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

// Audit (12/11): «verificar que todas las entradas y rutas provienen del validador principal». The worker can only be
// reached through core.runIsolated, which calls reader.load() first: every refusal of the reader (symlink, size, format,
// contract, file replaced) stops BEFORE a worker exists, and what the worker receives is exactly what the reader returned.
test('provenance: the worker only ever receives the reader\'s validated project; every reader refusal starts no worker', async () => {
  const { symlinkSync, renameSync } = await import('node:fs');
  const real = Isolate.createIsolate({ timeoutMs: 60000 }), calls = [];
  const spy = { run: (...a) => { calls.push(a); return real.run(...a); } };
  const args = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, widthMm: 800 };
  // Valid file: the clone handed to the worker is the reader's project and snapshot, unchanged.
  const good = write(scenario(names[0])), reader = core.createProjectReader(good), loaded = await reader.load();
  await core.runIsolated(spy, reader, 'checkRoute2d', args);
  assert.equal(calls.length, 1); assert.deepEqual(calls[0].slice(0, 4), ['checkRoute2d', loaded.project, loaded.snapshot, args]);
  calls.length = 0;
  const dir = mkdtempSync(path.join(os.tmpdir(), 'mcp-prov-')), at = n => path.join(dir, n);
  writeFileSync(at('bad.json'), '{not json'); writeFileSync(at('contract.json'), JSON.stringify({ schemaVersion: '1.0.0', walls: 'no' }));
  writeFileSync(at('big.json'), Buffer.alloc(core.MAX_PROJECT_BYTES + 1, 32)); symlinkSync(good, at('link.json'));
  const cases = [['symlink', at('link.json'), /enlace simbólico/], ['oversize', at('big.json'), /15 MiB/], ['not JSON', at('bad.json'), /JSON válido/], ['contract', at('contract.json'), /FloorPlanProjectV1/]];
  for (const [name, file, re] of cases) {
    for (const task of ['proposeLayout', 'checkRoute2d', 'reviewLayout']) {
      await assert.rejects(core.runIsolated(spy, core.createProjectReader(file), task, args), re, `${name} / ${task}`);
    }
  }
  assert.equal(calls.length, 0, 'no worker for any refused input');
  // The file replaced under the same name (new inode): the reader reads and VALIDATES it again; the worker gets the new,
  // validated content with its new hash (never the old one, never unvalidated bytes). A proposal made with the old hash
  // then comes back with the stale-hash refusal of #196 (expectedSha256), not with a result for the wrong file.
  const swap = write(scenario(names[0])), swapReader = core.createProjectReader(swap), first = await swapReader.load();
  writeFileSync(swap + '.new', JSON.stringify(scenario(names[1]))); renameSync(swap + '.new', swap);
  const r = await core.runIsolated(spy, swapReader, 'reviewLayout', {});
  assert.equal(r.snapshot.sha256, sha(readFileSync(swap))); assert.notEqual(r.snapshot.sha256, first.snapshot.sha256);
  assert.equal(calls.length, 1); assert.deepEqual(calls[0][1], (await swapReader.load()).project);
  const stale = await core.runIsolated(spy, swapReader, 'proposeLayout', { objectId: first.project.objects[0].id, goal: 'resolve-placement-conflict', expectedSha256: first.snapshot.sha256 });
  assert.equal(stale.status, 'blocked', 'a proposal against the old hash is blocked, never offered as reviewable');
  assert.equal(real.stats().started, 3);
});

// Adversarial arguments that BYPASS the zod schemas (calling the isolate directly): the pure functions validate their
// own inputs, so the isolated path refuses exactly like the in-process one; prototype-like task names start no worker.
test('adversarial: hostile arguments get the same refusal isolated and in-process; prototype task names start nothing', async () => {
  const iso = Isolate.createIsolate({ timeoutMs: 30000 });
  const file = write(scenario(names[0])), reader = core.createProjectReader(file), { project, snapshot } = await reader.load(), oid = project.objects[0].id;
  const P = extra => ({ objectId: oid, goal: 'resolve-placement-conflict', expectedSha256: snapshot.sha256, ...extra });
  const cases = [
    ['proposeLayout', P({ stepMm: 1 }), /stepMm/], ['proposeLayout', P({ stepMm: NaN }), /stepMm/], ['proposeLayout', P({ maxCandidates: 1e9 }), /maxCandidates/],
    ['proposeLayout', P({ goal: 'move-everything' }), /goal/],
    ['checkRoute2d', { start: { x: NaN, y: 0 }, end: { x: 1, y: 1 }, widthMm: 800 }, /start y end/], ['checkRoute2d', { start: { x: 0, y: 0 }, end: { x: Infinity, y: 1 }, widthMm: 800 }, /start y end/],
    ['checkRoute2d', { start: 'a', end: null, widthMm: '800' }, /start y end/], ['checkRoute2d', { start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, widthMm: 1e12 }, /widthMm/],
    ['reviewLayout', { clearanceMm: -1 }, /holgura/],
  ];
  const direct = { proposeLayout: core.proposeLayout, checkRoute2d: core.checkRoute2d, reviewLayout: core.reviewLayout };
  for (const [task, args, re] of cases) {
    const a = await core.runIsolated(iso, reader, task, args).then(() => null, e => e.message), b = await direct[task](reader, args).then(() => null, e => e.message);
    assert.match(a || '', re, `${task} ${JSON.stringify(args)}`); assert.equal(a, b, 'same refusal on both paths');
  }
  // An unknown objectId such as "__proto__" is not a lookup into a prototype: an ordinary, explained result, identical.
  assert.deepEqual(await core.runIsolated(iso, reader, 'proposeLayout', P({ objectId: '__proto__' })), await core.proposeLayout(reader, P({ objectId: '__proto__' })));
  const started = iso.stats().started;
  for (const t of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf', '']) await assert.rejects(iso.run(t, project, snapshot, {}), /Cálculo no admitido/);
  assert.equal(iso.stats().started, started, 'no worker for a task outside the three');
});
