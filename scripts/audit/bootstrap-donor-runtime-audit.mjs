import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const donor = process.env.DONOR_FLAT_TO_3D || 'C:/Users/temp123/work/ft3d-reference-workspace/flat-to-3d';
const evidenceDir = path.join(root, 'docs/product/evidence/donor-runtime-audit-2026-11-02');
const rawDir = path.resolve(root, '../donor-runtime-audit-RAW-2026-11-02');
const pinned = 'd7b9b69753d3af679535ee56695a05c8d955c3c6';
const approved = '0f9c6ead9732901681498efec326d1ca92e42ffe';
const identity = [
  ['01-a-the-board', '01 · EXPLODED HOUSE', 'A · THE BOARD'],
  ['01-b-unfolded-room', '01 · EXPLODED HOUSE', 'B · UNFOLDED ROOM'],
  ['01-c-floor-by-floor', '01 · EXPLODED HOUSE', 'C · FLOOR BY FLOOR'],
  ['02-demo-section-sweep', '02 · SECTION SWEEP', 'DEMO'],
  ['03-a-open-the-lens', '03 · OPEN SECTION', 'A · OPEN THE LENS'],
  ['03-c-down-the-stair', '03 · OPEN SECTION', 'C · DOWN THE STAIR'],
  ['04-demo-build-time-lapse', '04 · BUILD TIME-LAPSE', 'DEMO'],
  ['05-a-the-programme', '05 · SCHEDULE BUILD', 'A · THE PROGRAMME'],
  ['05-b-1-1-site-sheet', '05 · SCHEDULE BUILD', 'B · 1:1 SITE SHEET'],
  ['05-c-site-camera', '05 · SCHEDULE BUILD', 'C · SITE CAMERA'],
  ['06-demo-card-model', '06 · CARD MODEL', 'DEMO'],
  ['07-a-one-door', '07 · SUNLIT ELEVATION', 'A · ONE DOOR'],
  ['07-b-the-row', '07 · SUNLIT ELEVATION', 'B · THE ROW'],
  ['07-c-the-face', '07 · SUNLIT ELEVATION', 'C · THE FACE']
];
const sha = spawnSync('git', ['-C', donor, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
if (sha.status !== 0 || sha.stdout.trim() !== pinned) throw new Error('Donor checkout does not match pinned SHA');
const source = await readFile(path.join(donor, 'index.html'), 'utf8');
const match = source.match(/const DEMOS = (\[[\s\S]*?\n\]);/);
if (!match) throw new Error('Selector DEMOS table not found');
const demos = JSON.parse(match[1]);
const variants = demos.flatMap((demo, groupIndex) =>
  demo.variants.map((variant, variantIndex) => ({ demo, variant, groupIndex, variantIndex })));
if (variants.length !== identity.length) throw new Error('Selector variant count is not 14');
const base = 'https://sam1983aing.github.io/flat-to-3d/';
const now = new Date().toISOString();
const records = await Promise.all(variants.map(async (item, i) => {
  const [id, group, take] = identity[i];
  const expectedGroup = id.slice(0, 2);
  if (expectedGroup !== item.demo.id) throw new Error(`Selector order mismatch for ${id}`);
  const entrypoint = item.variant.url.split('?')[0];
  await access(path.join(donor, entrypoint));
  const sourceLine = source.slice(0, source.indexOf('"url": "' + item.variant.url + '"')).split('\n').length;
  const selectorUrl = base + '#' + item.demo.id + (item.variantIndex ? ':' + item.variantIndex : '');
  const standaloneUrl = new URL(item.variant.url, base).href;
  let resolvedUrl = null, statusCode = null, loadStatus = 'URL_RESOLUTION_BLOCKED', error = null;
  try {
    const response = await fetch(standaloneUrl, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(20000) });
    resolvedUrl = response.url;
    statusCode = response.status;
    loadStatus = response.ok ? 'HTTP_VERIFIED_NOT_RUNTIME_LOADED' : 'HTTP_ERROR';
  } catch (e) { error = String(e); }
  return {
    inventoryIndex: i + 1, id, group, take, selectorUrl, standaloneUrl, resolvedUrl,
    donorRepo: 'Sam1983Aing/flat-to-3d', donorCommit: pinned, sourceEntrypoint: entrypoint,
    discoveryMethod: 'PINNED_SELECTOR_SOURCE_PLUS_HTTP_HEAD',
    evidence: [
      { class: 'DONOR_SOURCE', locator: `Sam1983Aing/flat-to-3d@${pinned}:index.html:${sourceLine}`, statement: `Selector variant ${item.variant.label} points to ${item.variant.url}` },
      { class: 'DONOR_SOURCE', locator: `Sam1983Aing/flat-to-3d@${pinned}:${entrypoint}`, statement: 'Entrypoint exists in pinned checkout' },
      { class: 'OBSERVED_RUNTIME', locator: `HTTP HEAD ${standaloneUrl} at ${now}`, statement: `HTTP ${statusCode ?? 'NO_RESPONSE'}; final URL ${resolvedUrl ?? 'NOT_OBSERVED'}` }
    ],
    loadStatus, httpStatus: statusCode, resolutionError: error, checkedAt: now
  };
}));
await mkdir(evidenceDir, { recursive: true });
await mkdir(rawDir, { recursive: true });
await writeFile(path.join(evidenceDir, 'reference-inventory.json'), JSON.stringify({
  schemaVersion: 'rubik-donor-runtime-audit.inventory.v1', baseSha: approved,
  selectorSource: `Sam1983Aing/flat-to-3d@${pinned}:index.html`, generatedAt: now, references: records
}, null, 2) + '\n');
const takeState = Object.fromEntries(records.map(record => [record.id, {
  captureStatus: 'NOT_STARTED', reconciliationStatus: 'NOT_STARTED', validationStatus: 'NOT_STARTED',
  lastSuccessfulStage: 'NOT_STARTED', attempts: [], blockingUnresolved: [], nonBlockingUnresolved: [],
  timestamps: { createdAt: now, updatedAt: now }
}]));
await writeFile(path.join(evidenceDir, 'audit-run-state.json'), JSON.stringify({
  schemaVersion: 'rubik-donor-runtime-audit.run-state.v1', baseSha: approved, phase: 'PREPARATION',
  auditBranch: 'audit/donor-runtime-7x14-2026-11-02', worktree: root, rawFolder: rawDir,
  createdAt: now, updatedAt: now, takes: takeState
}, null, 2) + '\n');
console.log(JSON.stringify({ references: records.length, resolved: records.filter(r => r.loadStatus === 'HTTP_VERIFIED_NOT_RUNTIME_LOADED').length, rawDir, blocked: records.filter(r => !r.resolvedUrl).map(r => r.id) }, null, 2));
