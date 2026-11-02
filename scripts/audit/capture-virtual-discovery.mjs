import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// The 05 Schedule Build family prevents native scrolling. Its wheel handler moves
// the exposed week state. Keep native scroll and week as separate measurements.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const evidence=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const statePath=path.join(evidence,'audit-run-state.json');
const state=JSON.parse(await readFile(statePath,'utf8'));
const inventory=JSON.parse(await readFile(path.join(evidence,'reference-inventory.json'),'utf8'));
const id=process.argv.find(a=>a.startsWith('--take='))?.slice(7);
const viewport=process.argv.find(a=>a.startsWith('--viewport='))?.slice(11);
const run=process.argv.find(a=>a.startsWith('--run='))?.slice(6);
const dimensions={desktop:[1440,900],portrait:[390,844],landscape:[844,390]};
if(!id?.startsWith('05-')||!state.takes[id]||!dimensions[viewport])throw Error('Use --take=<05 canonical id> --viewport=<desktop|portrait|landscape>');
if(run&&!/^discovery-correction-[1-9][0-9]*$/.test(run))throw Error('Correction run must be discovery-correction-N');
const index=inventory.references.findIndex(r=>r.id===id),ref=inventory.references[index];
for(let i=0;i<index;i++)if(state.takes[inventory.references[i].id].validationStatus!=='COMPLETE'&&state.takes[inventory.references[i].id].captureStatus!=='BLOCKED')throw Error('Previous take not validated or locally blocked');
const rawDir=path.join(state.rawFolder,id,viewport,...(run?[run]:[]));
await mkdir(rawDir,{recursive:true});
const bin=process.env.AGENT_BROWSER_BIN||'C:/Users/temp123/donor-runtime-audit-tools-2026-11-02/node_modules/agent-browser/bin/agent-browser.js';
const session=`rubik-donor-${id}-${viewport}-${Date.now()}`.replaceAll(/[^a-zA-Z0-9_-]/g,'-');
const [width,height]=dimensions[viewport],step=Math.max(1,Math.floor(height*.08));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function ab(args,optional=false){
  const r=spawnSync(process.execPath,[bin,'--session',session,...args],{encoding:'utf8',maxBuffer:10*1024*1024,timeout:90000});
  if((r.status!==0||r.error)&&!optional)throw Error(`agent-browser ${args[0]}: ${r.stderr||r.stdout||r.error?.message}`);
  return (r.stdout||'').trim();
}
function ev(js){const s=ab(['eval',js]);try{return JSON.parse(s)}catch{throw Error(`eval parse: ${s.slice(0,300)}`)}}
const metrics=`(()=>{const d=document.documentElement,s=window.__state||{};return {url:location.href,route:location.pathname,hash:location.hash,scrollY,scrollHeight:d.scrollHeight,innerHeight,maxScroll:Math.max(0,d.scrollHeight-innerHeight),dpr:devicePixelRatio,runtimeWeek:s.WK??'NOT_OBSERVED',runtimeMax:14,normalizedRuntimeProgress:Number.isFinite(s.WK)?s.WK/14:'NOT_OBSERVED',runtimeShot:s.SHOT??'NOT_OBSERVED',runtimeTour:s.TOUR??'NOT_OBSERVED',visibleHud:document.querySelector('#hud')?.innerText?.trim().slice(0,700)||'',bodyText:document.body.innerText.slice(-1200)}})()`;
const telemetryJs=`(()=>{window.__auditSamples=[];window.__auditInput={type:'NONE'};addEventListener('wheel',e=>{window.__auditInput={type:'wheel',deltaY:e.deltaY,t:performance.now()}},{passive:true});window.__auditTimer=setInterval(()=>{const d=document.documentElement,s=window.__state||{},n=Number.isFinite(s.WK)?s.WK/14:'NOT_OBSERVED';window.__auditSamples.push({monotonicMs:performance.now(),scrollY,scrollHeight:d.scrollHeight,innerHeight,maxScroll:Math.max(0,d.scrollHeight-innerHeight),normalizedNativeProgress:0,normalizedRuntimeProgress:n,runtimeProgress:n,runtimeWeek:s.WK??'NOT_OBSERVED',runtimeShot:s.SHOT??'NOT_OBSERVED',runtimeTour:s.TOUR??'NOT_OBSERVED',route:location.pathname,hash:location.hash,visibleHud:document.querySelector('#hud')?.innerText?.trim().slice(0,350)||'',interactionInput:window.__auditInput,camera:'NOT_OBSERVED',cameraFov:'NOT_OBSERVED',activeChapter:'NOT_OBSERVED',cutPlanePosition:'NOT_OBSERVED',frontVisibility:'NOT_OBSERVED',runtimeState:{week:s.WK??'NOT_OBSERVED',shot:s.SHOT??'NOT_OBSERVED',tour:s.TOUR??'NOT_OBSERVED'},visibility:'NOT_OBSERVED',transforms:'NOT_OBSERVED',materialState:'NOT_OBSERVED',lighting:'NOT_OBSERVED',sunState:'NOT_OBSERVED',clipping:'NOT_OBSERVED'});},100);return true})()`;
const forward=[],reverse=[],files=[],samplePaths=[];
const flush=(label,acc)=>{const c=ev('window.__auditSamples.splice(0)');if(!Array.isArray(c))throw Error('Telemetry flush non-array');acc.push(...c.map(x=>({...x,pass:label})))};
async function asset(p){return {path:p,bytes:(await stat(p)).size,sha256:createHash('sha256').update(await readFile(p)).digest('hex')}}
async function saveTelemetry(name,arr){const p=path.join(rawDir,name);await writeFile(p,arr.map(x=>JSON.stringify(x)).join('\n')+'\n');files.push(p)}
async function stateUpdate(patch,stage){Object.assign(state.takes[id],patch,{lastSuccessfulStage:stage});state.takes[id].timestamps.updatedAt=new Date().toISOString();state.updatedAt=state.takes[id].timestamps.updatedAt;await writeFile(statePath,JSON.stringify(state,null,2)+'\n')}
state.takes[id].captureStatus='IN_PROGRESS';state.takes[id].attempts.push({viewport,stage:'DISCOVERY',run:run||'original',startedAt:new Date().toISOString(),status:'IN_PROGRESS'});await stateUpdate({},'DISCOVERY_STARTED');
try{
  ab(['open','about:blank']);ab(['set','viewport',String(width),String(height)]);ab(['open',ref.standaloneUrl]);ab(['wait','4500']);
  let ready=false;for(let i=0;i<60;i++){ready=ev('window.__ready===true');if(ready)break;ab(['wait','300'])}if(!ready)throw Error('05 did not reach window.__ready');
  ab(['wait','500']);
  const entry=ev(metrics);if(!Number.isFinite(entry.runtimeWeek))throw Error('No passive week state');
  const entryFile=path.join(rawDir,`${viewport}-entry-week7.png`);ab(['screenshot',entryFile]);files.push(entryFile);
  await writeFile(path.join(rawDir,'entry-state.json'),JSON.stringify({entry,sourceUrl:ref.standaloneUrl,observedAt:new Date().toISOString()},null,2)+'\n');
  const preludeVideo=path.join(rawDir,`${viewport}-prelude-to-week0.webm`);ab(['record','start',preludeVideo,'--fps','10']);
  let before=entry,after=entry,preludeCount=0;
  while(after.runtimeWeek>0.002&&preludeCount<300){const t=performance.now();ab(['mouse','wheel',String(-step)]);preludeCount++;if(preludeCount%3===0)after=ev(metrics);await sleep(Math.max(0,114-(performance.now()-t)))}
  ab(['wait','700']);after=ev(metrics);if(after.runtimeWeek>0.01)throw Error(`Prelude did not reach week 0: ${after.runtimeWeek}`);
  ab(['record','stop']);files.push(preludeVideo);
  const calibration={purpose:'INTERACTION_MODEL_ONLY_NOT_EVIDENCE',before,after,model:'VIRTUAL_SCROLL',note:'Native scroll remains zero; wheel drives the exposed 05 week state. The natural prelude from canonical week 7 to week 0 is recorded without reload.',preludeInputCount:preludeCount,preludeVideo};
  await writeFile(path.join(rawDir,'calibration.json'),JSON.stringify(calibration,null,2)+'\n');
  const start=ev(metrics),snapshot=ab(['snapshot']),consoleStart=ab(['console'],true),errorsStart=ab(['errors'],true),networkStart=ab(['network','requests'],true);
  const startFile=path.join(rawDir,`${viewport}-start.png`);ab(['screenshot',startFile]);files.push(startFile);
  await writeFile(path.join(rawDir,'start-state.json'),JSON.stringify({start,snapshot,consoleStart,errorsStart,networkStart,observedAt:new Date().toISOString()},null,2)+'\n');
  ev(telemetryJs);
  const forwardVideo=path.join(rawDir,`${viewport}-forward-discovery.webm`);ab(['record','start',forwardVideo,'--fps','10']);
  const p0=path.join(rawDir,`${viewport}-forward-discovery-p000.png`);ab(['screenshot',p0]);samplePaths.push(p0);
  let inputCount=0,nextSample=5,current=start;
  while(current.runtimeWeek<13.998&&inputCount<400){
    const t=performance.now();ab(['mouse','wheel',String(step)]);inputCount++;
    if(inputCount%3===0){current=ev(metrics);flush('FORWARD_DISCOVERY',forward);while(nextSample<=100&&current.normalizedRuntimeProgress>=nextSample/100){const p=path.join(rawDir,`${viewport}-forward-discovery-p${String(nextSample).padStart(3,'0')}.png`);ab(['screenshot',p]);samplePaths.push(p);nextSample+=5}}
    await sleep(Math.max(0,114-(performance.now()-t)));
  }
  ab(['wait','1000']);ab(['mouse','wheel',String(step)]);ab(['mouse','wheel',String(step)]);ab(['wait','700']);flush('FORWARD_DISCOVERY',forward);
  const end=ev(metrics);if(end.runtimeWeek<13.99)throw Error(`Forward did not reach week 14: ${end.runtimeWeek}`);
  while(nextSample<=100){const p=path.join(rawDir,`${viewport}-forward-discovery-p${String(nextSample).padStart(3,'0')}.png`);ab(['screenshot',p]);samplePaths.push(p);nextSample+=5}
  const endFile=path.join(rawDir,`${viewport}-end.png`);ab(['screenshot',endFile]);files.push(endFile);ab(['record','stop']);files.push(forwardVideo);
  await saveTelemetry(`${viewport}-forward-discovery.telemetry.ndjson`,forward);
  await writeFile(path.join(rawDir,'end-state.json'),JSON.stringify({end,additionalInputAfterMax:2,forwardInputCount:inputCount,forwardSampleCount:samplePaths.length,observedAt:new Date().toISOString()},null,2)+'\n');
  const reverseVideo=path.join(rawDir,`${viewport}-reverse-discovery.webm`);ab(['record','start',reverseVideo,'--fps','10']);
  let reverseCount=0,currentReverse=end;
  while(currentReverse.runtimeWeek>0.002&&reverseCount<400){const t=performance.now();ab(['mouse','wheel',String(-step)]);reverseCount++;if(reverseCount%3===0){currentReverse=ev(metrics);flush('REVERSE_DISCOVERY',reverse)}await sleep(Math.max(0,114-(performance.now()-t)))}
  ab(['wait','1200']);flush('REVERSE_DISCOVERY',reverse);
  const restored=ev(metrics);if(restored.runtimeWeek>0.01)throw Error(`Reverse did not reach week 0: ${restored.runtimeWeek}`);
  const restoredFile=path.join(rawDir,`${viewport}-restored-start.png`);ab(['screenshot',restoredFile]);files.push(restoredFile);ab(['record','stop']);files.push(reverseVideo);
  await saveTelemetry(`${viewport}-reverse-discovery.telemetry.ndjson`,reverse);
  const consoleEnd=ab(['console'],true),errorsEnd=ab(['errors'],true);
  await writeFile(path.join(rawDir,'reverse-state.json'),JSON.stringify({restored,reverseInputCount:reverseCount,consoleEnd,errorsEnd,observedAt:new Date().toISOString()},null,2)+'\n');
  const assets=await Promise.all([...files,...samplePaths].map(asset));await writeFile(path.join(rawDir,'discovery-assets.json'),JSON.stringify(assets,null,2)+'\n');
  const summary={id,viewport,run:run||'original',stableStartReady:true,entry,calibration,start,end,restored,forwardInputCount:inputCount,reverseInputCount:reverseCount,forwardTelemetrySamples:forward.length,reverseTelemetrySamples:reverse.length,files:assets};
  await writeFile(path.join(rawDir,'discovery-summary.json'),JSON.stringify(summary,null,2)+'\n');
  state.takes[id].attempts.at(-1).status='COMPLETE';state.takes[id].attempts.at(-1).finishedAt=new Date().toISOString();await stateUpdate({},`DISCOVERY_${viewport.toUpperCase()}_COMPLETE`);
  console.log(JSON.stringify({id,viewport,entryWeek:entry.runtimeWeek,startWeek:start.runtimeWeek,endWeek:end.runtimeWeek,restoredWeek:restored.runtimeWeek,forwardSamples:forward.length,reverseSamples:reverse.length,assets:assets.length},null,2));
}catch(e){state.takes[id].attempts.at(-1).status='FAILED';state.takes[id].attempts.at(-1).error=String(e);state.takes[id].blockingUnresolved.push({viewport,question:'Discovery capture failed',detail:String(e)});await stateUpdate({captureStatus:'FAILED'},'DISCOVERY_FAILED');throw e}
finally{ab(['close'],true)}
