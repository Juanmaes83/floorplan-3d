'use strict';

// MCP Etapa 2 — propose_layout (RubikLayoutProposalV1). Synthetic fixtures only; every file is written to a temporary
// directory by the test itself. Covers the four states, invalid input, adversarial input and the invariants: same
// bytes, same hash, same answer, nothing written, nothing sent, only the position of the requested piece can change.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const net = require('node:net');
const http = require('node:http');
const https = require('node:https');
const core = require('../src/core.cjs');
const Proposal = require('../src/proposal.cjs');
const C = require('../../../js/project-core.js');
const Review = require('../../../js/layout-review.js');
const Placement = require('../../../js/furniture-placement.js');
const { scenario } = require('../fixtures/proposal-projects.cjs');

async function fixture(t, projectOrText) {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'rubik-mcp-proposal-'));
  t.after(() => fsp.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'project.json');
  const bytes = Buffer.from(typeof projectOrText === 'string' ? projectOrText : JSON.stringify(projectOrText));
  await fsp.writeFile(file, bytes);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  return { dir, file, bytes, sha256, reader: core.createProjectReader(file) };
}

// Any write, network or child-process attempt during the call fails the test.
function forbidSideEffects(t) {
  const restore = [];
  const trap = (target, name) => {
    const original = target[name];
    if (typeof original !== 'function') return;
    target[name] = function () { throw new Error(`side effect: ${name}`); };
    restore.push(() => { target[name] = original; });
  };
  for (const name of ['writeFile', 'appendFile', 'rm', 'unlink', 'rename', 'mkdir', 'copyFile', 'truncate']) trap(fsp, name);
  for (const name of ['writeFileSync', 'appendFileSync', 'rmSync', 'unlinkSync', 'renameSync', 'mkdirSync', 'copyFileSync', 'truncateSync', 'createWriteStream']) trap(fs, name);
  trap(net, 'connect'); trap(net, 'createConnection'); trap(http, 'request'); trap(https, 'request');
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('side effect: fetch'); };
  restore.push(() => { globalThis.fetch = fetchOriginal; });
  t.after(() => restore.forEach(fn => fn()));
  return () => { restore.forEach(fn => fn()); restore.length = 0; };
}

async function propose(t, name, args, mutate) {
  const project = scenario(name);
  if (mutate) mutate(project);
  const fx = await fixture(t, project);
  const release = forbidSideEffects(t);
  try {
    const result = await core.proposeLayout(fx.reader, { expectedSha256: fx.sha256, goal: 'resolve-placement-conflict', ...args });
    return { result, project, ...fx };
  } finally { release(); }
}

// The candidate, applied to a throwaway copy by the TEST (never by the tool), is clean for both authorities.
function independentlyClean(project, objectId, position, openingId) {
  const copy = C.clone(project);
  const moved = copy.objects.find(o => o.id === objectId);
  moved.position = { ...position };
  C.validate(copy);
  const placement = Placement.problems(copy, moved);
  const findings = Review.review(copy).findings.filter(f => f.objects.includes(objectId));
  const door = openingId ? C.geometry(copy).doors.find(d => d.id === openingId) : null;
  const contact = door ? Review.leafContact(door, require('../../../js/tracing-core.js').footprint(moved)) : null;
  return { placement, findings, contact };
}

function assertCommon(result, fx) {
  assert.equal(result.proposalVersion, 'RubikLayoutProposalV1');
  assert.equal(result.applied, false);
  assert.equal(result.source.sha256, fx.sha256);
  assert.ok(Array.isArray(result.notEvaluated) && result.notEvaluated.length >= 5);
  const text = JSON.stringify(result);
  assert.ok(Buffer.byteLength(text) < 750 * 1024);
  assert.ok(!text.includes(fx.dir), 'no local path in the answer');
  assert.ok(!('walls' in result) && !('project' in result) && !text.includes('"materials"'), 'no project copy in the answer');
}

// ---------- functional: candidate-reviewable ----------
for (const [name, objectId, extra] of [
  ['overlap', 'obj_beta', {}],
  ['rotated', 'obj_turned', {}],
  ['against-wall', 'obj_shelf', {}],
  ['two-close', 'obj_beta', {}],
  ['concave', 'obj_table', {}],
  ['scale-pending', 'obj_beta', {}],
  ['door-blocked', 'obj_chair', { goal: 'clear-door-swing', openingId: 'opn_door' }],
]) test(`candidate-reviewable: ${name} — a new position for ${objectId} only, checked by both authorities`, async t => {
  const { result, project, ...fx } = await propose(t, name, { objectId, ...extra });
  assertCommon(result, fx);
  assert.equal(result.status, 'candidate-reviewable', JSON.stringify(result.blockingReasons));
  const original = project.objects.find(o => o.id === objectId);
  assert.deepEqual(result.currentPose.position, original.position);
  assert.deepEqual(result.suggestedPose.size, original.size, 'size kept');
  assert.equal(result.suggestedPose.rotationDeg, original.rotationDeg, 'rotation kept');
  assert.equal(result.suggestedPose.roomId, result.currentPose.roomId, 'same room');
  assert.notDeepEqual(result.suggestedPose.position, original.position);
  assert.ok(Number.isSafeInteger(result.suggestedPose.position.x) && Number.isSafeInteger(result.suggestedPose.position.y));
  assert.equal(result.distanceMm, Math.round(Math.hypot(result.suggestedPose.position.x - original.position.x, result.suggestedPose.position.y - original.position.y)));
  assert.ok(result.problem && result.rationale && result.expectedEffects.some(e => e.code === 'moves-position-only'));
  assert.equal(result.search.generator, 'FloorPlanPlacement.find');
  const clean = independentlyClean(project, objectId, result.suggestedPose.position, extra.openingId);
  assert.deepEqual(clean.placement, [], 'FloorPlanPlacement agrees');
  assert.deepEqual(clean.findings, [], 'layout-review agrees');
  if (extra.openingId) assert.equal(clean.contact, null, 'the leaf no longer reaches it');
  if (name === 'scale-pending') assert.ok(result.uncertainty.some(u => u.code === 'scale-pending'));
  else assert.ok(result.uncertainty.some(u => u.code === 'scale-estimated'));
});

test('door goal: the conflict is the precise leaf contact of layout-review, before and after', async t => {
  const { result } = await propose(t, 'door-blocked', { objectId: 'obj_chair', goal: 'clear-door-swing', openingId: 'opn_door' });
  assert.equal(result.problem.code, 'door-leaf-contact');
  assert.ok(result.evidence.door.reviewLeafContactDeg < 90);
  assert.equal(result.evidence.door.reviewLeafContactDegAfter, null);
  assert.deepEqual(result.evidence.door.swing, { hinge: 'start', side: 'right' });
  assert.ok(result.expectedEffects.some(e => e.code === 'door-leaf-clear'));
});

// ---------- functional: no-change-needed ----------
for (const [name, args, why] of [
  ['correct', { objectId: 'obj_alpha' }, /no encuentra ningún conflicto/],
  ['door-clear', { objectId: 'obj_sofa', goal: 'clear-door-swing', openingId: 'opn_door' }, /no alcanza/],
  ['rug-in-door', { objectId: 'obj_rug', goal: 'clear-door-swing', openingId: 'opn_door' }, /revestimiento de suelo/],
]) test(`no-change-needed: ${name} — nothing to move, no candidate`, async t => {
  const { result, ...fx } = await propose(t, name, args);
  assertCommon(result, fx);
  assert.equal(result.status, 'no-change-needed');
  assert.equal(result.suggestedPose, null);
  assert.equal(result.search, null, 'no search when there is no problem');
  assert.match(result.rationale, why);
});

test('door square without leaf contact: no change, and the discrepancy between both models is kept as evidence', async t => {
  const { result } = await propose(t, 'door-square-only', { objectId: 'obj_lamp', goal: 'clear-door-swing', openingId: 'opn_door' });
  assert.equal(result.status, 'no-change-needed');
  assert.equal(result.evidence.door.placementSquareHit, true);
  assert.equal(result.evidence.door.reviewLeafContactDeg, null);
  assert.match(result.evidence.door.discrepancy, /cuadrado conservador/);
});

// ---------- functional: pending ----------
for (const [name, args, code] of [
  ['ambiguous-room', { objectId: 'obj_beta' }, 'ambiguous-room'],
  ['stored-room-conflict', { objectId: 'obj_beta' }, 'stored-room-conflict'],
  ['too-big', { objectId: 'obj_huge' }, 'search-grid-exhausted'],
  ['overlap', { objectId: 'obj_beta', maxCandidates: 1 }, 'search-budget-exhausted'],
  ['models-disagree-before', { objectId: 'obj_odd' }, 'models-disagree'],
  ['models-disagree-after', { objectId: 'obj_odd', stepMm: 500 }, 'goal-not-confirmed'],
  ['introduces-issue', { objectId: 'obj_odd', stepMm: 600 }, 'candidate-introduces-issues'],
  ['door-without-swing', { objectId: 'obj_chair', goal: 'clear-door-swing', openingId: 'opn_door' }, 'door-swing-missing'],
]) test(`pending: ${name} → ${code}, never presented as a proof`, async t => {
  const { result, ...fx } = await propose(t, name, args);
  assertCommon(result, fx);
  assert.equal(result.status, 'pending', JSON.stringify(result.blockingReasons));
  assert.equal(result.blockingReasons[0].code, code);
  assert.equal(result.suggestedPose, null);
});

test('an exhausted search is incomplete, not impossible', async t => {
  const budget = (await propose(t, 'overlap', { objectId: 'obj_beta', maxCandidates: 1 })).result;
  assert.equal(budget.search.budgetExhausted, true);
  assert.match(budget.blockingReasons[0].message, /No demuestra que no exista sitio/);
  const grid = (await propose(t, 'too-big', { objectId: 'obj_huge' })).result;
  assert.equal(grid.search.budgetExhausted, false);
  assert.match(grid.blockingReasons[0].message, /No demuestra/);
});

test('a candidate accepted by FloorPlanPlacement but rejected by layout-review is kept as a rejected candidate', async t => {
  const after = (await propose(t, 'models-disagree-after', { objectId: 'obj_odd', stepMm: 500 })).result;
  assert.ok(after.evidence.rejectedCandidate);
  assert.ok(after.evidence.after.reviewModel.some(f => f.code === 'solape' && f.measurementMm === 0.5));
  const introduced = (await propose(t, 'introduces-issue', { objectId: 'obj_odd', stepMm: 600 })).result;
  assert.ok(introduced.evidence.introduced.some(f => f.code === 'puerta'), 'the new door contact is reported, not hidden');
});

test('doors without swing: the assumption of FloorPlanPlacement is declared in every proposal', async t => {
  const { result } = await propose(t, 'door-without-swing', { objectId: 'obj_beta' });
  assert.equal(result.status, 'candidate-reviewable');
  const u = result.uncertainty.find(x => x.code === 'placement-assumes-door-swing');
  assert.deepEqual(u.openingIds, ['opn_door']);
  assert.ok(result.uncertainty.some(x => x.code === 'review-doors-partial'));
});

// ---------- functional: blocked ----------
for (const [name, args, code] of [
  ['outside', { objectId: 'obj_lost' }, 'object-outside-rooms'],
  ['overlap', { objectId: 'obj_missing' }, 'object-not-found'],
  ['overlap', { objectId: 'wal_south' }, 'not-furniture'],
  ['overlap', { objectId: 'rom_living' }, 'not-furniture'],
  ['door-blocked', { objectId: 'obj_chair', goal: 'clear-door-swing' }, 'opening-required'],
  ['door-blocked', { objectId: 'obj_chair', goal: 'clear-door-swing', openingId: 'opn_missing' }, 'opening-not-found'],
  ['overlap', { objectId: '../../../etc/passwd' }, 'object-not-found'],
]) test(`blocked: ${name} ${args.objectId} → ${code}`, async t => {
  const { result, ...fx } = await propose(t, name, args);
  assertCommon(result, fx);
  assert.equal(result.status, 'blocked');
  assert.equal(result.blockingReasons[0].code, code);
  assert.equal(result.suggestedPose, null);
});

test('blocked: a window is not a swing door', async t => {
  const { result } = await propose(t, 'door-blocked', { objectId: 'obj_chair', goal: 'clear-door-swing', openingId: 'opn_window' }, p => {
    p.openings.push({ id: 'opn_window', wallId: 'wal_north', kind: 'window', offsetMm: 1000, widthMm: 800, heightMm: 1200, sillHeightMm: 900 });
  });
  assert.equal(result.blockingReasons[0].code, 'not-a-swing-door');
});

test('blocked: a stale hash stops the analysis before reading any element', async t => {
  const { result, ...fx } = await propose(t, 'overlap', { objectId: 'obj_beta', expectedSha256: 'a'.repeat(64) });
  assert.equal(result.status, 'blocked');
  assert.equal(result.blockingReasons[0].code, 'stale-source');
  assert.equal(result.evidence.actualSha256, fx.sha256);
  assert.equal(result.object, null);
  assert.equal(result.search, null);
});

// ---------- invalid input: controlled errors ----------
test('invalid arguments are refused, never clamped', async t => {
  const fx = await fixture(t, scenario('overlap'));
  const ok = { objectId: 'obj_beta', goal: 'resolve-placement-conflict', expectedSha256: fx.sha256 };
  for (const [args, message] of [
    [{ ...ok, goal: 'move-anything' }, /goal debe ser/],
    [{ ...ok, expectedSha256: 'abc' }, /expectedSha256/],
    [{ ...ok, expectedSha256: undefined }, /expectedSha256/],
    [{ ...ok, objectId: '' }, /objectId/],
    [{ ...ok, objectId: 'x'.repeat(161) }, /objectId/],
    [{ ...ok, objectId: 42 }, /objectId/],
    [{ ...ok, stepMm: 5 }, /stepMm/],
    [{ ...ok, stepMm: 10.5 }, /stepMm/],
    [{ ...ok, stepMm: 1e9 }, /stepMm/],
    [{ ...ok, maxCandidates: 4001 }, /maxCandidates/],
    [{ ...ok, maxCandidates: 0 }, /maxCandidates/],
    [{ ...ok, openingId: '' }, /openingId/],
    [{ ...ok, path: '/etc/passwd' }, /no admitido/],
    [{ ...ok, project: '../other.json' }, /no admitido/],
    [null, /objeto/],
    [[ok], /objeto/],
  ]) await assert.rejects(core.proposeLayout(fx.reader, args), message, JSON.stringify(args)?.slice(0, 80));
});

test('invalid files are refused by the shared reader: bad JSON, broken contract, non-finite and incomplete nested data', async t => {
  const args = { objectId: 'obj_beta', goal: 'resolve-placement-conflict', expectedSha256: 'a'.repeat(64) };
  const good = JSON.stringify(scenario('overlap'));
  for (const [label, text, message] of [
    ['json', '{"schema":', /JSON válido/],
    ['contract', JSON.stringify({ ...scenario('overlap'), schemaVersion: 'nope' }), /FloorPlanProjectV1/],
    ['non-finite', good.replace('"x":2300', '"x":1e999'), /FloorPlanProjectV1/],
    ['incomplete nested', JSON.stringify((() => { const p = scenario('overlap'); delete p.objects[1].position.y; return p; })()), /FloorPlanProjectV1/],
    ['string number', good.replace('"x":2300', '"x":"2300"'), /FloorPlanProjectV1/],
  ]) {
    const fx = await fixture(t, text);
    await assert.rejects(core.proposeLayout(fx.reader, args), message, label);
  }
});

test('a symlinked project is refused before any analysis', { skip: process.platform === 'win32' }, async t => {
  const fx = await fixture(t, scenario('overlap'));
  const link = path.join(fx.dir, 'link.json');
  await fsp.symlink(fx.file, link);
  await assert.rejects(core.proposeLayout(core.createProjectReader(link), { objectId: 'obj_beta', goal: 'resolve-placement-conflict', expectedSha256: fx.sha256 }), /enlace simbólico/);
});

// ---------- invariants ----------
test('same file, same bytes, same hash, same answer; nothing written, nothing sent', async t => {
  const fx = await fixture(t, scenario('overlap'));
  const before = await fsp.stat(fx.file), listing = await fsp.readdir(fx.dir);
  const release = forbidSideEffects(t);
  const answers = [];
  for (let i = 0; i < 4; i++) answers.push(await core.proposeLayout(fx.reader, { objectId: 'obj_beta', goal: 'resolve-placement-conflict', expectedSha256: fx.sha256 }));
  release();
  for (const a of answers.slice(1)) assert.deepEqual(a, answers[0], 'deterministic and idempotent');
  assert.deepEqual(await fsp.readFile(fx.file), fx.bytes, 'same bytes');
  const after = await fsp.stat(fx.file);
  assert.equal(after.mtimeMs, before.mtimeMs);
  assert.deepEqual(await fsp.readdir(fx.dir), listing, 'no new file');
  assert.equal((await core.getSummary(fx.reader)).snapshot.sha256, fx.sha256, 'same hash');
});

test('the pure function never mutates the project it receives and only one piece is ever proposed', () => {
  const project = scenario('two-close');
  const frozen = JSON.stringify(project);
  const sha = crypto.createHash('sha256').update(frozen).digest('hex');
  const result = Proposal.propose(project, { sha256: sha }, { objectId: 'obj_beta', goal: 'resolve-placement-conflict', expectedSha256: sha });
  assert.equal(JSON.stringify(project), frozen, 'input untouched');
  assert.equal(result.status, 'candidate-reviewable');
  const ids = new Set(JSON.stringify(result).match(/obj_[a-z-]+/g));
  assert.ok(ids.has('obj_beta'));
  assert.equal(result.objectId, 'obj_beta');
  assert.ok(!('objects' in result), 'no list of moved objects');
});

test('the contract exposes exactly its documented fields', async t => {
  const { result } = await propose(t, 'overlap', { objectId: 'obj_beta' });
  assert.deepEqual(Object.keys(result).sort(), ['applied', 'blockingReasons', 'currentPose', 'distanceMm', 'evidence', 'expectedEffects', 'goal', 'notEvaluated', 'object', 'objectId', 'problem', 'proposalVersion', 'rationale', 'remainingIssues', 'search', 'source', 'status', 'suggestedPose', 'uncertainty', 'usedData'].sort());
  assert.deepEqual(Object.keys(result.source).sort(), ['scaleConfidence', 'schemaVersion', 'sha256']);
  assert.ok(Proposal.GOALS.includes(result.goal));
});
