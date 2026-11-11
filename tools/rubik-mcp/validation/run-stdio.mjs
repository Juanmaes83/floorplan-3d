// MCP Etapa 2 — empirical validation over the REAL server (node src/server.mjs --project <file>) and the real stdio
// protocol. A minimal newline-delimited JSON-RPC client written here, independent of the SDK client, so that stdout
// and stderr are captured separately and every stdout line can be checked. Not part of the runtime.
// Usage: node validation/run-stdio.mjs <outDir>
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { validationScenario } = require('./validation-projects.cjs');
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const serverPath = path.join(repo, 'tools/rubik-mcp/src/server.mjs');
const outDir = path.resolve(process.argv[2] || path.join(repo, 'docs/qa/artifacts/mcp-stage2-validation'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const EXPECTED_TOOLS = ['check_route_2d', 'diagnose_project', 'get_project_element', 'get_project_summary', 'inspect_pair_clearance', 'list_project_elements', 'measure_elements', 'propose_layout', 'review_layout'];

// Each group = one server process on one file. `calls` are propose_layout arguments (expectedSha256 filled in from the
// real summary unless the call sets it), each sent TWICE to check determinism.
const GROUPS = [
  { fixture: 'overlap', calls: [
    { label: 'A-overlap-candidate', expect: 'candidate-reviewable', args: { objectId: 'obj_beta', goal: 'resolve-placement-conflict' } },
    { label: 'B-overlap-door-no-change', expect: 'no-change-needed', args: { objectId: 'obj_beta', goal: 'clear-door-swing', openingId: 'opn_door' } },
    { label: 'C-budget-exhausted', expect: 'pending', args: { objectId: 'obj_beta', goal: 'resolve-placement-conflict', maxCandidates: 1 } },
    { label: 'D-id-missing', expect: 'blocked', args: { objectId: 'obj_missing', goal: 'resolve-placement-conflict' } },
    { label: 'D-not-furniture', expect: 'blocked', args: { objectId: 'wal_south', goal: 'resolve-placement-conflict' } },
    { label: 'D-stale-hash', expect: 'blocked', args: { objectId: 'obj_beta', goal: 'resolve-placement-conflict', expectedSha256: '0'.repeat(64) } },
  ] },
  { fixture: 'door-blocked', calls: [
    { label: 'A-door-candidate', expect: 'candidate-reviewable', args: { objectId: 'obj_chair', goal: 'clear-door-swing', openingId: 'opn_door' } },
    { label: 'D-door-invalid', expect: 'blocked', args: { objectId: 'obj_chair', goal: 'clear-door-swing', openingId: 'opn_missing' } },
  ] },
  { fixture: 'rotated', calls: [{ label: 'A-rotated-candidate', expect: 'candidate-reviewable', args: { objectId: 'obj_turned', goal: 'resolve-placement-conflict' } }] },
  { fixture: 'correct', calls: [{ label: 'B-correct', expect: 'no-change-needed', args: { objectId: 'obj_alpha', goal: 'resolve-placement-conflict' } }] },
  { fixture: 'door-square-only', calls: [{ label: 'B-D3-square-not-leaf', expect: 'no-change-needed', args: { objectId: 'obj_lamp', goal: 'clear-door-swing', openingId: 'opn_door' } }] },
  { fixture: 'ambiguous-room', calls: [{ label: 'C-ambiguous-room', expect: 'pending', args: { objectId: 'obj_beta', goal: 'resolve-placement-conflict' } }] },
  { fixture: 'door-without-swing', calls: [
    { label: 'C-D1-door-swing-missing', expect: 'pending', args: { objectId: 'obj_chair', goal: 'clear-door-swing', openingId: 'opn_door' } },
    { label: 'A-D1-overlap-with-swingless-door', expect: 'candidate-reviewable', args: { objectId: 'obj_beta', goal: 'resolve-placement-conflict' } },
  ] },
  { fixture: 'swingless-inward', calls: [{ label: 'F1-assumed-swing-conflict', expect: 'candidate-reviewable', args: { objectId: 'obj_stool', goal: 'resolve-placement-conflict' } }] },
  { fixture: 'models-disagree-before', calls: [{ label: 'C-D2-models-disagree', expect: 'pending', args: { objectId: 'obj_odd', goal: 'resolve-placement-conflict' } }] },
  { fixture: 'models-disagree-after', calls: [
    { label: 'C-D2-rejected-step500', expect: 'pending', args: { objectId: 'obj_odd', goal: 'resolve-placement-conflict', stepMm: 500 } },
    { label: 'C-D2-rejected-default-step', expect: 'pending', args: { objectId: 'obj_odd', goal: 'resolve-placement-conflict' } },
  ] },
  { fixture: 'introduces-issue', calls: [
    { label: 'C-introduces-step600', expect: 'pending', args: { objectId: 'obj_odd', goal: 'resolve-placement-conflict', stepMm: 600 } },
    { label: 'C-introduces-default-step', expect: 'pending', args: { objectId: 'obj_odd', goal: 'resolve-placement-conflict' } },
  ] },
  { fixture: 'outside', calls: [{ label: 'D-outside-rooms', expect: 'blocked', args: { objectId: 'obj_lost', goal: 'resolve-placement-conflict' } }] },
  { fixture: 'contract-example', source: 'docs/contracts/examples/floorplan-project-v1.example.json', calls: 'all' },
];

function rpcClient(file, logs) {
  const child = spawn(process.execPath, [serverPath, '--project', file], { stdio: ['pipe', 'pipe', 'pipe'] });
  let buffer = '', nextId = 1;
  const waiting = new Map();
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', chunk => {
    buffer += chunk;
    let i;
    while ((i = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, i); buffer = buffer.slice(i + 1);
      if (!line.trim()) continue;
      logs.stdout.push(line);
      let message; try { message = JSON.parse(line); } catch { logs.nonJson.push(line); continue; }
      if (message.jsonrpc !== '2.0') logs.nonJson.push(line);
      if (message.id !== undefined && waiting.has(message.id)) { waiting.get(message.id)(message); waiting.delete(message.id); }
    }
  });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { logs.stderr += chunk; });
  const exited = new Promise(resolve => child.on('exit', (code, signal) => resolve({ code, signal })));
  const request = (method, params) => new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => reject(new Error(`timeout ${method}`)), 30000);
    waiting.set(id, message => { clearTimeout(timer); resolve(message); });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  const notify = (method, params) => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, ...(params ? { params } : {}) }) + '\n');
  const close = async () => { child.stdin.end(); const timer = setTimeout(() => child.kill('SIGKILL'), 5000); const result = await exited; clearTimeout(timer); return result; };
  return { request, notify, close };
}

async function runGroup(group, tmpRoot) {
  const project = group.source ? JSON.parse(await readFile(path.join(repo, group.source), 'utf8')) : validationScenario(group.fixture);
  const bytes = Buffer.from(JSON.stringify(project, null, 2));
  const dir = await mkdtemp(path.join(tmpRoot, `${group.fixture}-`));
  const file = path.join(dir, 'project.json');
  await writeFile(file, bytes);
  const before = { sha256: sha(bytes), size: (await stat(file)).size, mtimeMs: (await stat(file)).mtimeMs, listing: await readdir(dir) };
  const logs = { stdout: [], nonJson: [], stderr: '' };
  const client = rpcClient(file, logs);
  const transcript = [];
  const call = async (name, args) => {
    const message = await client.request('tools/call', { name, arguments: args });
    transcript.push({ tool: name, arguments: args, isError: !!message.result?.isError, response: message.result?.structuredContent ?? message.result ?? message.error });
    return message.result?.structuredContent;
  };
  const init = await client.request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'rubik-mcp-stage2-validation', version: '1.0.0' } });
  client.notify('notifications/initialized');
  const listed = (await client.request('tools/list', {})).result.tools;
  const summary = await call('get_project_summary', {});
  const rooms = await call('list_project_elements', { kind: 'rooms' });
  const objects = await call('list_project_elements', { kind: 'objects' });
  const openings = await call('list_project_elements', { kind: 'openings' });
  const review = await call('review_layout', {});
  let calls = group.calls;
  if (calls === 'all') {
    calls = objects.items.map(o => ({ label: `E-${o.id}-resolve`, args: { objectId: o.id, goal: 'resolve-placement-conflict' } }));
    for (const op of openings.items.filter(x => x.kind === 'door')) for (const o of objects.items) calls.push({ label: `E-${o.id}-${op.id}`, args: { objectId: o.id, goal: 'clear-door-swing', openingId: op.id } });
  }
  const proposals = [];
  for (const c of calls) {
    const args = { expectedSha256: summary.snapshot.sha256, ...c.args };
    const first = await call('propose_layout', args);
    const second = await call('propose_layout', args);
    proposals.push({ label: c.label, expect: c.expect ?? null, arguments: args, status: first?.status, code: first?.blockingReasons?.[0]?.code ?? null,
      suggested: first?.suggestedPose?.position ?? null, rejected: first?.evidence?.rejectedCandidate?.position ?? null,
      identicalOnRepeat: JSON.stringify(first) === JSON.stringify(second), applied: first?.applied, response: first });
  }
  const exit = await client.close();
  const afterBytes = await readFile(file);
  const after = { sha256: sha(afterBytes), size: (await stat(file)).size, mtimeMs: (await stat(file)).mtimeMs, listing: await readdir(dir) };
  await rm(dir, { recursive: true, force: true });
  return {
    fixture: group.fixture, source: group.source || `validation/validation-projects.cjs:${group.fixture}`,
    command: `node tools/rubik-mcp/src/server.mjs --project <tmp>/${group.fixture}/project.json`,
    serverInfo: init.result.serverInfo, protocolVersion: init.result.protocolVersion,
    tools: listed.map(t => ({ name: t.name, annotations: t.annotations })).sort((a, b) => a.name.localeCompare(b.name)),
    toolsAsExpected: JSON.stringify(listed.map(t => t.name).sort()) === JSON.stringify(EXPECTED_TOOLS),
    allReadOnly: listed.every(t => t.annotations?.readOnlyHint === true && t.annotations?.destructiveHint === false && t.annotations?.idempotentHint === true && t.annotations?.openWorldHint === false),
    summarySha256: summary.snapshot.sha256, scaleConfidence: summary.scaleConfidence,
    reviewStatus: review.status, reviewFindings: review.findings.map(f => ({ code: f.code, objects: f.objects })),
    proposals,
    integrity: { before, after, sameBytes: Buffer.compare(bytes, afterBytes) === 0, sameSha: before.sha256 === after.sha256, sameSize: before.size === after.size, sameMtime: before.mtimeMs === after.mtimeMs, sameListing: JSON.stringify(before.listing) === JSON.stringify(after.listing), summaryMatchesFile: summary.snapshot.sha256 === before.sha256 },
    protocol: { stdoutLines: logs.stdout.length, nonJsonRpcLines: logs.nonJson.length, stderr: logs.stderr.trim(), exit },
    transcript, stdoutRaw: logs.stdout,
  };
}

const tmpRoot = await mkdtemp(path.join(os.tmpdir(), 'rubik-mcp-stage2-validation-'));
await mkdir(path.join(outDir, 'results'), { recursive: true });
await mkdir(path.join(outDir, 'logs'), { recursive: true });
await mkdir(path.join(outDir, 'fixtures'), { recursive: true });
const summary = [];
for (const group of GROUPS) {
  const r = await runGroup(group, tmpRoot);
  if (!group.source) await writeFile(path.join(outDir, 'fixtures', `${group.fixture}.json`), JSON.stringify(validationScenario(group.fixture), null, 2) + '\n');
  await writeFile(path.join(outDir, 'logs', `${group.fixture}.stdout.jsonl`), r.stdoutRaw.join('\n') + '\n');
  await writeFile(path.join(outDir, 'logs', `${group.fixture}.stderr.log`), r.protocol.stderr + '\n');
  const { stdoutRaw, ...kept } = r;
  await writeFile(path.join(outDir, 'results', `${group.fixture}.json`), JSON.stringify(kept, null, 2) + '\n');
  for (const p of r.proposals) summary.push({ fixture: r.fixture, label: p.label, expect: p.expect, status: p.status, code: p.code, suggested: p.suggested, rejected: p.rejected, identicalOnRepeat: p.identicalOnRepeat, applied: p.applied });
  console.log(`${r.fixture.padEnd(24)} tools:${r.toolsAsExpected && r.allReadOnly ? 'ok' : 'FAIL'} stdoutNonJson:${r.protocol.nonJsonRpcLines} exit:${r.protocol.exit.code} integrity:${Object.entries(r.integrity).filter(([k]) => k.startsWith('same') || k === 'summaryMatchesFile').every(([, v]) => v) ? 'ok' : 'FAIL'}`);
  for (const p of r.proposals) console.log(`   ${p.label.padEnd(36)} ${String(p.status).padEnd(22)} ${String(p.code ?? '').padEnd(28)} expect:${p.expect ?? '-'} ${p.expect && p.expect !== p.status ? 'MISMATCH' : ''} repeat:${p.identicalOnRepeat} applied:${p.applied}`);
}
await rm(tmpRoot, { recursive: true, force: true });
await writeFile(path.join(outDir, 'results', 'summary.json'), JSON.stringify({ codeSha: process.env.CODE_SHA || null, node: process.version, generatedAt: new Date().toISOString(), proposals: summary }, null, 2) + '\n');
