import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evidence = path.join(root, 'docs/product/evidence/donor-runtime-audit-2026-11-02');
const statePath = path.join(evidence, 'audit-run-state.json');
const state = JSON.parse(await readFile(statePath, 'utf8'));
const inventory = JSON.parse(await readFile(path.join(evidence, 'reference-inventory.json'), 'utf8'));
const id = process.argv.find(a => a.startsWith('--take='))?.slice(7);
const viewportName = process.argv.find(a => a.startsWith('--viewport='))?.slice(11);
const dimensions = { desktop: [1440,900], portrait: [390,844], landscape: [844,390] };
if (!id || !state.takes[id] || !dimensions[viewportName]) throw new Error('Use --take=<canonical-id> --viewport=<desktop|portrait|landscape>');
const currentIndex = inventory.references.findIndex(r => r.id === id);
if (currentIndex < 0) throw new Error('Take absent from inventory');
for (let i = 0; i < currentIndex; i++) {
  const prev = state.takes[inventory.references[i].id];
  if (prev.validationStatus !== 'COMPLETE' && prev.captureStatus !== 'BLOCKED') throw new Error('Previous take not validated or locally blocked');
}
const ref = inventory.references[currentIndex];
const rawDir = path.join(state.rawFolder, id, viewportName);
await mkdir(rawDir, { recursive: true });
const agentBin = process.env.AGENT_BROWSER_BIN || 'C:/Users/temp123/donor-runtime-audit-tools-2026-11-02/node_modules/agent-browser/bin/agent-browser.js';
const [width, height] = dimensions[viewportName];
const sessionBase = `rubik-donor-${id}-${viewportName}-${Date.now()}`.replaceAll(/[^a-zA-Z0-9_-]/g, '-');
const sleep = ms => new Promise(r => setTimeout(r, ms));
function ab(session, args, optional = false) {
  const r = spawnSync(process.execPath, [agentBin, '--session', session, ...args], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 90000 });
  if ((r.status !== 0 || r.error) && !optional) throw new Error(`agent-browser ${args[0]}: ${r.stderr || r.stdout || r.error?.message}`);
  return (r.stdout || '').trim();
}
function evalJson(session, js) {
  const out = ab(session, ['eval', js]);
  try { return JSON.parse(out); } catch { throw new Error(`Could not parse eval output: ${out.slice(0,400)}`); }
}
const hudJs = `['#camReadout','#counter','#caption','#room','#tb','#cm-lbl','#chip','#hud'].map(q=>document.querySelector(q)?.innerText?.trim()||'').filter(Boolean).join(' | ').slice(0,700)`;
const metricsJs = `({url:location.href,route:location.pathname,hash:location.hash,scrollY,scrollHeight:document.documentElement.scrollHeight,innerHeight,maxScroll:Math.max(0,document.documentElement.scrollHeight-innerHeight),dpr:devicePixelRatio,visibleHud:${hudJs},bodyText:document.body.innerText.slice(-1200)})`;
const telemetryJs = `(() => {
  window.__auditSamples=[]; window.__auditInput={type:'NONE'};
  addEventListener('wheel',e=>{window.__auditInput={type:'wheel',deltaY:e.deltaY,t:performance.now()}},{passive:true});
  window.__auditTimer=setInterval(()=>{
    const d=document.documentElement, maxScroll=Math.max(0,d.scrollHeight-innerHeight);
    const hud=['#camReadout','#counter','#caption','#room','#tb','#cm-lbl','#chip','#hud'].map(q=>document.querySelector(q)?.innerText?.trim()||'').filter(Boolean).join(' | ').slice(0,700);
    const m=hud.match(/SEQ\\s+(\\d+)%/);
    window.__auditSamples.push({monotonicMs:performance.now(),scrollY,scrollHeight:d.scrollHeight,innerHeight,maxScroll,normalizedNativeProgress:maxScroll?scrollY/maxScroll:0,runtimeProgress:m?Number(m[1])/100:'NOT_OBSERVED',route:location.pathname,hash:location.hash,visibleHud:hud.slice(0,350),interactionInput:window.__auditInput,camera:'NOT_OBSERVED',visibility:'NOT_OBSERVED',transforms:'NOT_OBSERVED',materialState:'NOT_OBSERVED',lighting:'NOT_OBSERVED',sunState:'NOT_OBSERVED',clipping:'NOT_OBSERVED'});
  },100);
  return true;
})()`;
const flush = (session, label, acc) => {
  const chunk = evalJson(session, 'window.__auditSamples.splice(0)');
  if (!Array.isArray(chunk)) throw new Error('Telemetry flush returned non-array');
  acc.push(...chunk.map(x => ({ ...x, pass: label })));
};
const saveTelemetry = async (name, samples) => {
  const file = path.join(rawDir, name);
  await writeFile(file, samples.map(x => JSON.stringify(x)).join('\n') + '\n');
  return file;
};
const stateUpdate = async (patch, stage) => {
  Object.assign(state.takes[id], patch, { lastSuccessfulStage: stage });
  state.takes[id].timestamps.updatedAt = new Date().toISOString();
  state.updatedAt = new Date().toISOString();
  await writeFile(statePath, JSON.stringify(state, null, 2) + '\n');
};
const startAt = new Date().toISOString();
state.takes[id].captureStatus = 'IN_PROGRESS';
state.takes[id].attempts.push({ viewport: viewportName, stage: 'DISCOVERY', startedAt: startAt, status: 'IN_PROGRESS' });
await stateUpdate({}, 'DISCOVERY_STARTED');
const calibrationSession = sessionBase + '-cal';
let calibration;
try {
  ab(calibrationSession, ['open','about:blank']);
  ab(calibrationSession, ['set','viewport',String(width),String(height)]);
  ab(calibrationSession, ['open',ref.standaloneUrl]);
  ab(calibrationSession, ['wait','1000']);
  const before = evalJson(calibrationSession, metricsJs);
  ab(calibrationSession, ['mouse','wheel',String(Math.round(height * 0.5))]);
  ab(calibrationSession, ['wait','800']);
  const after = evalJson(calibrationSession, metricsJs);
  calibration = {
    purpose: 'INTERACTION_MODEL_ONLY_NOT_EVIDENCE', before, after,
    model: after.scrollY > before.scrollY ? 'SCROLL_PLUS_TIME' : 'UNRESOLVED',
    note: '01 main.js target() reads native scrollY, frame() smooths p and advances T by wall time; verify per take source before classifying.'
  };
  await writeFile(path.join(rawDir,'calibration.json'),JSON.stringify(calibration,null,2)+'\n');
} finally { ab(calibrationSession,['close'],true); }

const session = sessionBase + '-discovery';
const files = [];
try {
  ab(session,['open','about:blank']);
  ab(session,['set','viewport',String(width),String(height)]);
  ab(session,['open',ref.standaloneUrl]);
  ab(session,['wait','4500']);
  const start = evalJson(session, metricsJs);
  const snapshot = ab(session,['snapshot']);
  const consoleStart = ab(session,['console'],true);
  const errorsStart = ab(session,['errors'],true);
  const networkStart = ab(session,['network','requests'],true);
  const startFile = path.join(rawDir,`${viewportName}-start.png`);
  ab(session,['screenshot',startFile]); files.push(startFile);
  await writeFile(path.join(rawDir,'start-state.json'),JSON.stringify({start,snapshot,consoleStart,errorsStart,networkStart,observedAt:new Date().toISOString()},null,2)+'\n');
  evalJson(session,telemetryJs);
  const forwardVideo = path.join(rawDir,`${viewportName}-forward-discovery.webm`);
  ab(session,['record','start',forwardVideo,'--fps','30']);
  const forward = [];
  const samplePaths = [];
  const initialSample = path.join(rawDir,`${viewportName}-forward-discovery-p000.png`);
  ab(session,['screenshot',initialSample]);
  samplePaths.push(initialSample);
  const maxScroll = start.maxScroll;
  if (maxScroll <= 0) throw new Error('No native scroll range; interaction model requires manual investigation');
  const step = Math.max(1, Math.floor(height * 0.08));
  let nextSample = 5;
  let lastY = 0, noMove = 0, inputCount = 0;
  while (inputCount < Math.ceil(maxScroll / step) + 30) {
    const t = performance.now();
    ab(session,['mouse','wheel',String(step)]);
    inputCount++;
    if (inputCount % 5 === 0) {
      const m = evalJson(session, metricsJs);
      lastY = m.scrollY;
      if (m.scrollY >= m.maxScroll - 1) noMove++; else noMove = 0;
      while (nextSample <= 100 && (m.maxScroll ? m.scrollY/m.maxScroll*100 : 0) >= nextSample - 0.25) {
        const sampleFile = path.join(rawDir,`${viewportName}-forward-discovery-p${String(nextSample).padStart(3,'0')}.png`);
        ab(session,['screenshot',sampleFile]);
        samplePaths.push(sampleFile);
        nextSample += 5;
      }
      flush(session,'FORWARD_DISCOVERY',forward);
      if (noMove >= 2) break;
    }
    await sleep(Math.max(0, 114 - (performance.now() - t)));
  }
  ab(session,['wait','900']);
  ab(session,['mouse','wheel',String(step)]);
  ab(session,['mouse','wheel',String(step)]);
  ab(session,['wait','700']);
  flush(session,'FORWARD_DISCOVERY',forward);
  const end = evalJson(session,metricsJs);
  const endFile = path.join(rawDir,`${viewportName}-end.png`);
  ab(session,['screenshot',endFile]); files.push(endFile);
  ab(session,['record','stop']); files.push(forwardVideo);
  files.push(await saveTelemetry(`${viewportName}-forward-discovery.telemetry.ndjson`,forward));
  await writeFile(path.join(rawDir,'end-state.json'),JSON.stringify({end,additionalInputAfterMax:2,forwardInputCount:inputCount,forwardSampleCount:samplePaths.length,observedAt:new Date().toISOString()},null,2)+'\n');
  const reverseVideo = path.join(rawDir,`${viewportName}-reverse-discovery.webm`);
  const reverse = [];
  ab(session,['record','start',reverseVideo,'--fps','30']);
  let reverseCount = 0, atTop = 0;
  while (reverseCount < Math.ceil(maxScroll/step) + 30) {
    const t = performance.now();
    ab(session,['mouse','wheel',String(-step)]);
    reverseCount++;
    if (reverseCount % 5 === 0) {
      const m = evalJson(session,metricsJs);
      if (m.scrollY <= 1) atTop++; else atTop = 0;
      flush(session,'REVERSE_DISCOVERY',reverse);
      if (atTop >= 2) break;
    }
    await sleep(Math.max(0,114-(performance.now()-t)));
  }
  ab(session,['wait','1000']);
  flush(session,'REVERSE_DISCOVERY',reverse);
  const restored = evalJson(session,metricsJs);
  const restoredFile = path.join(rawDir,`${viewportName}-restored-start.png`);
  ab(session,['screenshot',restoredFile]); files.push(restoredFile);
  ab(session,['record','stop']); files.push(reverseVideo);
  files.push(await saveTelemetry(`${viewportName}-reverse-discovery.telemetry.ndjson`,reverse));
  const consoleEnd = ab(session,['console'],true), errorsEnd = ab(session,['errors'],true);
  await writeFile(path.join(rawDir,'reverse-state.json'),JSON.stringify({restored,reverseInputCount:reverseCount,consoleEnd,errorsEnd,observedAt:new Date().toISOString()},null,2)+'\n');
  const assets = await Promise.all([...files,...samplePaths].map(async p => ({path:p,bytes:(await stat(p)).size,sha256:createHash('sha256').update(await readFile(p)).digest('hex') })));
  await writeFile(path.join(rawDir,'discovery-assets.json'),JSON.stringify(assets,null,2)+'\n');
  const summary = { id, viewport:viewportName, calibration, start, end, restored, forwardInputCount:inputCount, reverseInputCount:reverseCount, forwardTelemetrySamples:forward.length, reverseTelemetrySamples:reverse.length, files:assets };
  await writeFile(path.join(rawDir,'discovery-summary.json'),JSON.stringify(summary,null,2)+'\n');
  state.takes[id].attempts.at(-1).status = 'COMPLETE';
  state.takes[id].attempts.at(-1).finishedAt = new Date().toISOString();
  await stateUpdate({},`DISCOVERY_${viewportName.toUpperCase()}_COMPLETE`);
  console.log(JSON.stringify({id,viewport:viewportName,startY:start.scrollY,endY:end.scrollY,maxScroll:end.maxScroll,restoredY:restored.scrollY,forwardSamples:forward.length,reverseSamples:reverse.length,assets:assets.length},null,2));
} catch (error) {
  state.takes[id].attempts.at(-1).status = 'FAILED';
  state.takes[id].attempts.at(-1).error = String(error);
  state.takes[id].blockingUnresolved.push({viewport:viewportName,question:'Discovery capture failed',detail:String(error)});
  await stateUpdate({captureStatus:'FAILED'},'DISCOVERY_FAILED');
  throw error;
} finally { ab(session,['close'],true); }
