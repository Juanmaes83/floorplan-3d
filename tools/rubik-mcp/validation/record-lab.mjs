// MCP Etapa 2 — visual validation with Playwright + Chromium. Not part of the runtime.
// 1. Builds lab-data.js from the synthetic fixtures, the REAL stdio results (results/*.json) and the search audit.
// 2. Opens RUBIK (index.html) in a throwaway context, imports the fixture JSON through its own #fileIn and checks
//    that the editor reads the same position/size/rotation the MCP reported.
// 3. Opens the lab (validation/lab) for each scenario, checks the drawing against FloorPlanTracing.footprint computed
//    in Node, and saves screenshots at 1440×900, 1280×800, 390×844 and 844×390.
// 4. Records three videos with traces, console/page errors and network requests.
// Usage: node validation/record-lab.mjs <outDir>
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, stat, writeFile, rename, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const T = require('../../../js/tracing-core.js');
const { validationScenario } = require('./validation-projects.cjs');
const { audit } = require('./enumerate-candidates.cjs');
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const outDir = path.resolve(process.argv[2] || path.join(repo, 'docs/qa/artifacts/mcp-stage2-validation'));
const sha = b => createHash('sha256').update(b).digest('hex');

// ---------- 1. lab data ----------
const results = {};
for (const f of await readdir(path.join(outDir, 'results'))) if (f.endsWith('.json') && f !== 'summary.json' && !f.startsWith('playwright') && !f.startsWith('search')) results[f.replace(/\.json$/, '')] = JSON.parse(await readFile(path.join(outDir, 'results', f), 'utf8'));
const SCENARIOS = [
  ['A-overlap-candidate', 'overlap', 'A · candidate-reviewable: dos mesas solapadas'],
  ['A-rotated-candidate', 'rotated', 'A · candidate-reviewable: mesa girada 30°'],
  ['A-door-candidate', 'door-blocked', 'A · candidate-reviewable: silla en el barrido de la puerta'],
  ['B-correct', 'correct', 'B · no-change-needed: sin conflicto'],
  ['B-D3-square-not-leaf', 'door-square-only', 'B · D3: dentro del cuadrado, fuera de la hoja'],
  ['C-D1-door-swing-missing', 'door-without-swing', 'C · D1: puerta sin swing (pending)'],
  ['F1-assumed-swing-conflict', 'swingless-inward', 'F1 · conflicto creado por un barrido SUPUESTO'],
  ['C-ambiguous-room', 'ambiguous-room', 'C · pending: estancia ambigua'],
  ['C-budget-exhausted', 'overlap', 'C · pending: presupuesto agotado (maxCandidates 1)'],
  ['C-D2-models-disagree', 'models-disagree-before', 'C · D2: solape 0,5 mm solo para layout-review'],
  ['C-D2-rejected-default-step', 'models-disagree-after', 'C · D2/F2: candidata rechazada y 2.ª candidata ignorada'],
  ['C-introduces-default-step', 'introduces-issue', 'C · F2: candidata que roza la hoja; 2.ª candidata ignorada'],
  ['D-stale-hash', 'overlap', 'D · blocked: hash obsoleto'],
  ['D-not-furniture', 'overlap', 'D · blocked: el ID es un muro'],
  ['D-outside-rooms', 'outside', 'D · blocked: mueble fuera de toda estancia'],
];
const labData = { codeSha: process.env.CODE_SHA || null, scenarios: {} };
const searchAudit = {};
for (const [label, fixture, title] of SCENARIOS) {
  const run = results[fixture];
  const proposal = run.proposals.find(p => p.label === label);
  if (!proposal) throw new Error(`missing proposal ${label}`);
  const project = validationScenario(fixture);
  let scenarioAudit = null;
  if (proposal.response.evidence?.rejectedCandidate) {
    const a = { objectId: proposal.arguments.objectId, goal: proposal.arguments.goal, stepMm: proposal.arguments.stepMm, maxCandidates: proposal.arguments.maxCandidates };
    scenarioAudit = audit(project, Object.fromEntries(Object.entries(a).filter(([, v]) => v !== undefined)));
    searchAudit[label] = scenarioAudit;
  }
  labData.scenarios[label] = { title, fixture, project, mcp: proposal.response, integrity: run.integrity, audit: scenarioAudit };
}
await writeFile(path.join(here, 'lab', 'lab-data.js'), `window.LAB_DATA = ${JSON.stringify(labData)};\n`);

// ---------- static server (repo root, read-only) ----------
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try { const p = decodeURIComponent(new URL(req.url, 'http://l').pathname), f = path.resolve(repo, '.' + (p === '/' ? '/index.html' : p)); if (!f.startsWith(repo + path.sep)) throw 0; res.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); res.end(await readFile(f)); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
for (const d of ['screenshots', 'videos', 'traces', 'logs', 'results']) await mkdir(path.join(outDir, d), { recursive: true });

const log = { generatedAt: new Date().toISOString(), base: '<local static server>', chromium: browser.version(), playwright: require('playwright/package.json').version, runs: [] };
function watch(page, name) {
  const entry = { name, consoleErrors: [], pageErrors: [], requests: [], external: [] };
  page.on('console', m => { if (m.type() === 'error') entry.consoleErrors.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => entry.pageErrors.push(String(e.message).slice(0, 300)));
  page.on('request', r => { const u = r.url(); entry.requests.push(u.replace(base, '/')); if (!u.startsWith(base) && !/^(data|blob):/.test(u)) entry.external.push(u); });
  log.runs.push(entry);
  return entry;
}
const labUrl = (label, step = 7) => `${base}tools/rubik-mcp/validation/lab/index.html?s=${encodeURIComponent(label)}&step=${step}`;
const near = (a, b) => Math.abs(a - b) < 1e-6;
const checks = [];

// ---------- 2. RUBIK editor reads the same JSON ----------
async function appImport(page, fixture) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'mcp-lab-import-'));
  const file = path.join(dir, `${fixture}.json`);
  await writeFile(file, JSON.stringify(validationScenario(fixture), null, 2));
  await page.goto(base);
  await page.waitForFunction(() => window.FloorPlanApp && window.FloorPlanCore);
  await page.locator('#fileIn').setInputFiles(file);
  await page.waitForFunction(() => window.FloorPlanApp.project?.objects?.some(o => o.id === 'obj_beta' || o.id === 'obj_chair' || o.id === 'obj_stool'), null, { timeout: 30000 });
  await rm(dir, { recursive: true, force: true });
}
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage(); const w = watch(page, 'app-import');
  for (const [fixture, label] of [['overlap', 'A-overlap-candidate'], ['door-blocked', 'A-door-candidate'], ['swingless-inward', 'F1-assumed-swing-conflict']]) {
    await appImport(page, fixture);
    const mcp = labData.scenarios[label].mcp;
    const inApp = await page.evaluate(id => { const o = window.FloorPlanApp.project.objects.find(x => x.id === id); return { position: o.position, size: o.size, rotationDeg: o.rotationDeg, projectId: window.FloorPlanApp.project.id }; }, mcp.objectId);
    const ok = near(inApp.position.x, mcp.currentPose.position.x) && near(inApp.position.y, mcp.currentPose.position.y) && inApp.size.widthMm === mcp.currentPose.size.widthMm && inApp.size.depthMm === mcp.currentPose.size.depthMm && inApp.rotationDeg === mcp.currentPose.rotationDeg;
    checks.push({ check: `editor-reads-${fixture}`, ok, editor: inApp, mcpCurrentPose: mcp.currentPose });
    for (const [w2, h2] of [[1440, 900], [390, 844]]) { await page.setViewportSize({ width: w2, height: h2 }); await page.waitForTimeout(400); await page.screenshot({ path: path.join(outDir, 'screenshots', `app-${fixture}-${w2}x${h2}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  await context.close();
  if (w.external.length) checks.push({ check: 'app-no-external-requests', ok: false, external: w.external });
}

// ---------- 3. lab screenshots + fidelity ----------
const SIZES = [[1440, 900], [1280, 800], [390, 844], [844, 390]];
for (const [label] of SCENARIOS) {
  const s = labData.scenarios[label];
  const object = s.project.objects.find(o => o.id === s.mcp.objectId);
  for (const [width, height] of SIZES) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage(); const w = watch(page, `lab-${label}-${width}x${height}`);
    await page.goto(labUrl(label));
    await page.waitForFunction(() => window.LAB_RENDERED);
    const r = await page.evaluate(() => window.LAB_RENDERED);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (width === 1440) {
      const expectCur = object ? T.footprint(object) : null;
      const cand = s.mcp.suggestedPose?.position || s.mcp.evidence?.rejectedCandidate?.position || null;
      const expectCand = object && cand ? T.footprint({ ...object, position: cand }) : null;
      const same = (a, b) => (!a && !b) || (a && b && a.length === b.length && a.every((p, i) => near(p.x, b[i].x) && near(p.y, b[i].y)));
      const parse = str => str && str.split(' ').map(t => { const [x, y] = t.split(',').map(Number); return { x, y }; });
      checks.push({ check: `lab-fidelity-${label}`, ok: same(parse(r.targetPoints), expectCur) && same(parse(r.candidatePoints), expectCand) && r.ctm && r.ctm.a > 0 && r.ctm.d > 0 && near(r.ctm.b, 0) && near(r.ctm.c, 0),
        note: 'polígonos dibujados = FloorPlanTracing.footprint en Node; eje y hacia abajo (ctm.d > 0), sin giro de ejes', ctm: r.ctm });
      if (r.labCheck && s.mcp.evidence?.after) checks.push({ check: `lab-recheck-matches-mcp-${label}`, ok: JSON.stringify(r.labCheck.placement.map(x => x.split(' ')[0])) === JSON.stringify(s.mcp.evidence.after.placementModel.map(p => p.kind)) && r.labCheck.review.length === s.mcp.evidence.after.reviewModel.length, lab: r.labCheck });
    }
    checks.push({ check: `lab-no-horizontal-scroll-${label}-${width}x${height}`, ok: !overflow });
    await page.screenshot({ path: path.join(outDir, 'screenshots', `lab-${label}-${width}x${height}.png`) });
    await context.close();
  }
}

// ---------- 4. videos with traces ----------
async function record(name, plan) {
  const vdir = await mkdtemp(path.join(os.tmpdir(), 'mcp-lab-video-'));
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: vdir, size: { width: 1440, height: 900 } } });
  await context.tracing.start({ screenshots: true, snapshots: true, title: name });
  const page = await context.newPage(); const w = watch(page, `video-${name}`);
  const started = Date.now();
  await plan(page);
  const durationMs = Date.now() - started;
  await context.tracing.stop({ path: path.join(outDir, 'traces', `${name}.zip`) });
  const video = page.video();
  await context.close();
  const src = await video.path();
  const dest = path.join(outDir, 'videos', `${name}.webm`);
  await rename(src, dest);
  await rm(vdir, { recursive: true, force: true });
  const bytes = await readFile(dest);
  log.runs.find(x => x === w).video = { file: `videos/${name}.webm`, bytes: bytes.length, sha256: sha(bytes), wallClockMs: durationMs };
}
const steps = async (page, label, pause = 1100) => { await page.goto(labUrl(label, 1)); await page.waitForFunction(() => window.LAB_RENDERED); for (let n = 1; n <= 7; n++) { await page.evaluate(k => window.setStep(k), n); await page.waitForTimeout(pause); } };
await record('video-1-conflicto-y-propuesta', async page => {
  await appImport(page, 'overlap'); await page.waitForTimeout(1500);
  await steps(page, 'A-overlap-candidate');
  await steps(page, 'A-rotated-candidate', 700);
});
await record('video-2-puerta-y-barrido', async page => {
  await steps(page, 'A-door-candidate');
  await steps(page, 'B-D3-square-not-leaf', 800);
  await steps(page, 'C-D1-door-swing-missing', 800);
  await steps(page, 'F1-assumed-swing-conflict', 900);
});
await record('video-3-casos-adversariales', async page => {
  for (const label of ['D-stale-hash', 'C-ambiguous-room', 'C-budget-exhausted', 'C-D2-rejected-default-step', 'C-introduces-default-step', 'D-outside-rooms']) await steps(page, label, 650);
});
await browser.close();
await new Promise(r => server.close(r));

// ---------- logs ----------
await writeFile(path.join(outDir, 'logs', 'playwright-runs.json'), JSON.stringify(log, null, 2) + '\n');
await writeFile(path.join(outDir, 'results', 'playwright-checks.json'), JSON.stringify({ codeSha: labData.codeSha, checks }, null, 2) + '\n');
await writeFile(path.join(outDir, 'results', 'search-audit.json'), JSON.stringify(searchAudit, null, 2) + '\n');
const failed = checks.filter(c => !c.ok);
const errors = log.runs.flatMap(r => [...r.consoleErrors.map(e => `${r.name}: console ${e}`), ...r.pageErrors.map(e => `${r.name}: page ${e}`), ...r.external.map(e => `${r.name}: external ${e}`)]);
console.log(`checks ${checks.length - failed.length}/${checks.length}`); for (const c of failed) console.log('FAIL', JSON.stringify(c).slice(0, 400));
console.log(`errors ${errors.length}`); for (const e of errors.slice(0, 20)) console.log(' ', e);
for (const r of log.runs.filter(r => r.video)) console.log(r.video.file, r.video.bytes, 'bytes', r.video.wallClockMs, 'ms');
