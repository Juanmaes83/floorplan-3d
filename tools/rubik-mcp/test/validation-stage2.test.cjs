'use strict';

// MCP Etapa 2 — tests added by the empirical validation (docs/technical/local-mcp-stage2-empirical-validation.md).
// Written against the implementation audited at 369c5b7; updated after the F1/F2/F3 correction (77ca084). Purposes:
//  1. Close the side-effect gap found in the #196 tests: child_process, open() with a write flag, fs.write/writeSync,
//     FileHandle writes, dgram/tls/dns were not trapped although the #196 record says process creation was.
//  2. Independent geometric evidence: every candidate-reviewable footprint is checked with a DIFFERENT algorithm
//     (triangulation + convex clipping of spatial.cjs, wall strips of FloorPlanCore.wallRect) instead of re-running
//     FloorPlanPlacement / layout-review, and the D3 «no leaf contact» is checked by sampling the leaf.
//  3. F1 and F2. At 369c5b7 these tests characterised the defects (ANTES DE LA CORRECCIÓN: candidate-reviewable for an
//     assumed swing; pending after the first find() candidate). That historical evidence is kept in
//     docs/qa/artifacts/mcp-stage2-validation/before-fix/. They now verify the corrected behaviour, cross-checked with
//     the independent enumerator of validation/enumerate-candidates.cjs.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const childProcess = require('node:child_process');
const dgram = require('node:dgram');
const tls = require('node:tls');
const dns = require('node:dns');
const core = require('../src/core.cjs');
const Proposal = require('../src/proposal.cjs');
const Spatial = require('../src/spatial.cjs');
const C = require('../../../js/project-core.js');
const T = require('../../../js/tracing-core.js');
const { validationScenario } = require('../validation/validation-projects.cjs');
const { audit } = require('../validation/enumerate-candidates.cjs');

const shaOf = project => crypto.createHash('sha256').update(JSON.stringify(project)).digest('hex');
const run = (name, args) => { const p = validationScenario(name), sha = shaOf(p); return { project: p, result: Proposal.propose(p, { sha256: sha }, { goal: 'resolve-placement-conflict', expectedSha256: sha, ...args }) }; };

// ---------- 1. side effects: the traps the #196 tests did not install ----------
function trapEverything(t) {
  const hits = [], restore = [];
  const trap = (target, name, allow) => {
    const original = target[name];
    if (typeof original !== 'function') return;
    target[name] = function (...args) {
      if (allow && allow(...args)) return original.apply(this, args);
      hits.push(name);
      throw new Error(`side effect: ${name}`);
    };
    restore.push(() => { target[name] = original; });
  };
  for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) trap(childProcess, name);
  const readOnly = flags => flags === undefined || flags === 'r' || (typeof flags === 'number' && (flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_TRUNC)) === 0);
  trap(fsp, 'open', (_p, flags) => readOnly(flags));
  trap(fs, 'open', (_p, flags) => typeof flags !== 'function' && readOnly(flags));
  trap(fs, 'openSync', (_p, flags) => readOnly(flags));
  for (const name of ['write', 'writeSync', 'writev', 'writevSync', 'ftruncate', 'ftruncateSync', 'symlink', 'symlinkSync', 'link', 'linkSync', 'chmod', 'chmodSync', 'utimes', 'utimesSync']) trap(fs, name);
  for (const name of ['writeFile', 'appendFile', 'rm', 'unlink', 'rename', 'mkdir', 'copyFile', 'truncate', 'symlink', 'link', 'chmod', 'utimes', 'mkdtemp']) trap(fsp, name);
  for (const name of ['writeFileSync', 'appendFileSync', 'rmSync', 'unlinkSync', 'renameSync', 'mkdirSync', 'copyFileSync', 'truncateSync', 'createWriteStream', 'mkdtempSync']) trap(fs, name);
  trap(dgram, 'createSocket'); trap(tls, 'connect'); trap(dns, 'lookup'); trap(dns.promises, 'lookup');
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = () => { hits.push('fetch'); throw new Error('side effect: fetch'); };
  restore.push(() => { globalThis.fetch = fetchOriginal; });
  const release = () => { restore.splice(0).forEach(fn => fn()); };
  t.after(release);
  return { hits, release };
}

test('no process, no write (any API), no network during propose_layout through the shared reader', async t => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'rubik-mcp-validation-'));
  t.after(() => fsp.rm(dir, { recursive: true, force: true }));
  const calls = [
    ['overlap', { objectId: 'obj_beta' }], ['door-blocked', { objectId: 'obj_chair', goal: 'clear-door-swing', openingId: 'opn_door' }],
    ['door-square-only', { objectId: 'obj_lamp', goal: 'clear-door-swing', openingId: 'opn_door' }], ['introduces-issue', { objectId: 'obj_odd' }],
    ['ambiguous-room', { objectId: 'obj_beta' }], ['outside', { objectId: 'obj_lost' }], ['swingless-inward', { objectId: 'obj_stool' }],
  ];
  const files = [];
  for (const [name] of calls) { const file = path.join(dir, `${name}.json`); const bytes = Buffer.from(JSON.stringify(validationScenario(name))); await fsp.writeFile(file, bytes); files.push({ file, bytes }); }
  const listing = await fsp.readdir(dir);
  const { hits, release } = trapEverything(t);
  for (const [i, [, args]] of calls.entries()) {
    const reader = core.createProjectReader(files[i].file);
    const sha = crypto.createHash('sha256').update(files[i].bytes).digest('hex');
    const result = await core.proposeLayout(reader, { goal: 'resolve-placement-conflict', expectedSha256: sha, ...args });
    assert.equal(result.applied, false);
  }
  release();
  assert.deepEqual(hits, [], 'no trapped API was called');
  for (const f of files) assert.deepEqual(await fsp.readFile(f.file), f.bytes);
  assert.deepEqual(await fsp.readdir(dir), listing);
});

test('static: neither the MCP sources nor the authorities they load reference child_process, worker_threads or network modules', () => {
  const root = path.resolve(__dirname, '../../..');
  const files = ['tools/rubik-mcp/src/proposal.cjs', 'tools/rubik-mcp/src/core.cjs', 'tools/rubik-mcp/src/spatial.cjs', 'tools/rubik-mcp/src/server.mjs',
    'js/furniture-placement.js', 'js/layout-review.js', 'js/tracing-core.js', 'js/project-core.js'];
  for (const f of files) {
    const text = fs.readFileSync(path.join(root, f), 'utf8');
    for (const m of ['child_process', 'worker_threads', "require('node:net')", "require('net')", "require('node:http')", "require('https')", 'fetch(', 'XMLHttpRequest']) assert.ok(!text.includes(m), `${f}: ${m}`);
  }
});

// ---------- 2. independent geometry (different algorithm) ----------
function overlapArea(poly, other) {
  // other is convex (footprint or wall strip): clip poly's triangles by it with spatial.cjs's own clipping.
  return Spatial.triangulate(poly, 'x').reduce((sum, tri) => sum + Spatial.clippedArea(other, tri), 0);
}
for (const [name, args] of [['overlap', { objectId: 'obj_beta' }], ['rotated', { objectId: 'obj_turned' }], ['against-wall', { objectId: 'obj_shelf' }],
  ['two-close', { objectId: 'obj_beta' }], ['concave', { objectId: 'obj_table' }], ['door-blocked', { objectId: 'obj_chair', goal: 'clear-door-swing', openingId: 'opn_door' }],
  ['models-disagree-after', { objectId: 'obj_odd' }], ['introduces-issue', { objectId: 'obj_odd' }], ['models-disagree-after', { objectId: 'obj_odd', stepMm: 500 }],
  ['introduces-issue', { objectId: 'obj_odd', stepMm: 600 }], ['swingless-plus-real', { objectId: 'obj_crate' }]])
  test(`independent check of the candidate (${name}${args.stepMm ? ` step ${args.stepMm}` : ''}): inside its room, no area shared with furniture or walls`, () => {
    const { project, result } = run(name, args);
    assert.equal(result.status, 'candidate-reviewable');
    const object = project.objects.find(o => o.id === args.objectId);
    const fp = T.footprint({ ...object, position: result.suggestedPose.position });
    const area = object.size.widthMm * object.size.depthMm;
    const room = project.rooms.find(r => r.id === result.suggestedPose.roomId);
    const inside = Spatial.triangulate(room.polygon, room.id).reduce((s, tri) => s + Spatial.clippedArea(fp, tri), 0);
    assert.ok(Math.abs(inside - area) < 1, `footprint inside the room: ${inside} of ${area} mm²`);
    for (const other of project.objects.filter(o => o.id !== object.id)) assert.ok(overlapArea(T.footprint(other), fp) < 1, `no overlap with ${other.id}`);
    for (const wall of project.walls.filter(w => w.status !== 'demolished')) {
      const strip = C.wallRect(wall).poly.map(([x, y]) => ({ x, y }));
      assert.ok(overlapArea(strip, fp) < 1, `no overlap with ${wall.id}`);
    }
  });

test('D3, independently: sampling the leaf every 0.05° from 0° to 90°, it never reaches the lamp', () => {
  const p = validationScenario('door-square-only'), lamp = p.objects.find(o => o.id === 'obj_lamp'), d = C.geometry(p).doors.find(x => x.id === 'opn_door');
  const fp = T.footprint(lamp), [hx, hy] = d.h;
  const inside = (q) => { let s = 0; for (let i = 0; i < fp.length; i++) { const a = fp[i], b = fp[(i + 1) % fp.length]; s += Math.sign((b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x)); } return Math.abs(s) === fp.length; };
  let reached = false;
  for (let deg = 0; deg <= 90 && !reached; deg += 0.05) {
    const r = deg * Math.PI / 180, ux = Math.cos(r) * d.c[0] + Math.sin(r) * d.o[0], uy = Math.cos(r) * d.c[1] + Math.sin(r) * d.o[1];
    for (let t = 0; t <= d.len; t += 2) if (inside({ x: hx + ux * t, y: hy + uy * t })) { reached = true; break; }
  }
  assert.equal(reached, false);
  const nearest = Math.min(...fp.map(q => Math.hypot(q.x - hx, q.y - hy)));
  assert.ok(nearest > d.len, `nearest corner ${nearest.toFixed(1)} mm > leaf ${d.len} mm`);
});

// ---------- 3. characterisation of the findings (current behaviour, not a desired one) ----------
test('[F1, corregido] a conflict that exists only because of an ASSUMED swing is pending, not candidate-reviewable', () => {
  const { project, result } = run('swingless-inward', { objectId: 'obj_stool' });
  assert.ok(!project.openings.find(o => o.id === 'opn_north').swing, 'the JSON declares no swing');
  assert.deepEqual(result.problem.problems.map(p => [p.kind, p.id, p.assumedSwing]), [['door', 'opn_north', true]], 'the only conflict is the assumed door square');
  assert.deepEqual(result.evidence.before.reviewModel, [], 'layout-review sees nothing');
  assert.equal(result.status, 'pending');
  assert.equal(result.blockingReasons[0].code, 'conflict-based-on-assumed-swing');
  assert.equal(result.suggestedPose, null);
  assert.equal(result.applied, false);
  assert.deepEqual(result.evidence.assumedSwing.openingIds, ['opn_north']);
});

for (const [name, args, rejectedAt, acceptedAt] of [
  ['models-disagree-after', { objectId: 'obj_odd' }, 363, 443],
  ['introduces-issue', { objectId: 'obj_odd' }, 10, 15],
  ['models-disagree-after', { objectId: 'obj_odd', stepMm: 500 }, 3, 10],
  ['introduces-issue', { objectId: 'obj_odd', stepMm: 600 }, 2, 7],
]) test(`[F2, corregido] ${name} ${JSON.stringify(args)}: the search goes on past #${rejectedAt} and returns what the independent enumerator finds (#${acceptedAt})`, () => {
  const { project, result } = run(name, args);
  const a = audit(project, { objectId: args.objectId, stepMm: args.stepMm });
  assert.equal(a.firstFoundByFind.index, rejectedAt, 'the audit walks the same sequence as find()');
  assert.equal(a.firstAcceptedByBoth.index, acceptedAt);
  assert.equal(result.status, 'candidate-reviewable');
  assert.equal(result.search.acceptedIndex, acceptedAt);
  assert.equal(result.search.tried, acceptedAt);
  assert.deepEqual(result.suggestedPose.position, a.firstAcceptedByBoth.position);
  assert.equal(result.distanceMm, a.firstAcceptedByBoth.distanceMm);
  assert.equal(result.search.placementValidRejected, a.placementValidButReviewRejected, 'same number of rejections as the enumerator');
  assert.equal(result.search.rejected[0].index, rejectedAt);
  assert.deepEqual(result.search.rejected[0].position, a.firstFoundByFind.position);
});

test('control: the traps above do fire when the trapped APIs are called', async t => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'rubik-mcp-validation-control-'));
  t.after(() => fsp.rm(dir, { recursive: true, force: true }));
  const { hits, release } = trapEverything(t);
  const tries = [
    () => childProcess.spawn(process.execPath, ['-e', '0']), () => childProcess.execSync('true'), () => childProcess.fork(__filename),
    () => fs.openSync(path.join(dir, 'x'), 'w'), () => fs.writeSync(1, 'x'), () => fetch('http://127.0.0.1:9'), () => dgram.createSocket('udp4'),
  ];
  for (const fn of tries) assert.throws(fn, /side effect/);
  await assert.rejects(async () => fsp.open(path.join(dir, 'y'), 'w'), /side effect/);
  await assert.rejects(Promise.resolve().then(() => fsp.writeFile(path.join(dir, 'z'), 'x')), /side effect/);
  release();
  assert.deepEqual(hits, ['spawn', 'execSync', 'fork', 'openSync', 'writeSync', 'fetch', 'createSocket', 'open', 'writeFile']);
  assert.deepEqual(await fsp.readdir(dir), [], 'nothing was created');
});
