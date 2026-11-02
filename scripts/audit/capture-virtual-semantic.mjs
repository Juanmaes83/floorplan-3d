import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const evidence=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const statePath=path.join(evidence,'audit-run-state.json');
const state=JSON.parse(await readFile(statePath,'utf8'));
const inventory=JSON.parse(await readFile(path.join(evidence,'reference-inventory.json'),'utf8'));
const id=process.argv.find(a=>a.startsWith('--take='))?.slice(7);
const viewport=process.argv.find(a=>a.startsWith('--viewport='))?.slice(11);
const run=process.argv.find(a=>a.startsWith('--run='))?.slice(6);
const dims={desktop:[1440,900],portrait:[390,844],landscape:[844,390]};
if(!id?.startsWith('05-')||!state.takes[id]||!dims[viewport])throw Error('Use --take=<05 canonical id> --viewport=<desktop|portrait|landscape>');
if(run&&!/^semantic-correction-[1-9][0-9]*$/.test(run))throw Error('Correction run must be semantic-correction-N');
const ref=inventory.references.find(r=>r.id===id);
const plan=JSON.parse(await readFile(path.join(evidence,'takes',id,'semantic-plan.json'),'utf8'));
const milestones=plan.milestones.filter(m=>!m.viewports||m.viewports.includes(viewport));
const rawDir=path.join(state.rawFolder,id,viewport,...(run?[run]:[]));await mkdir(rawDir,{recursive:true});
const bin=process.env.AGENT_BROWSER_BIN||'C:/Users/temp123/donor-runtime-audit-tools-2026-11-02/node_modules/agent-browser/bin/agent-browser.js';
const session=`rubik-donor-${id}-${viewport}-${run||'semantic'}-${Date.now()}`.replaceAll(/[^a-zA-Z0-9_-]/g,'-');
const [width,height]=dims[viewport],step=Math.max(1,Math.floor(height*.08));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function ab(args,optional=false){const r=spawnSync(process.execPath,[bin,'--session',session,...args],{encoding:'utf8',maxBuffer:10*1024*1024,timeout:90000});if((r.status!==0||r.error)&&!optional)throw Error(`agent-browser ${args[0]}: ${r.stderr||r.stdout||r.error?.message}`);return(r.stdout||'').trim()}
function ev(js){const s=ab(['eval',js]);try{return JSON.parse(s)}catch{throw Error(`eval parse: ${s.slice(0,200)}`)}}
const metrics=`(()=>{const d=document.documentElement,s=window.__state||{};return {url:location.href,scrollY,maxScroll:Math.max(0,d.scrollHeight-innerHeight),dpr:devicePixelRatio,runtimeWeek:s.WK??'NOT_OBSERVED',runtimeMax:14,normalizedRuntimeProgress:Number.isFinite(s.WK)?s.WK/14:'NOT_OBSERVED',runtimeShot:s.SHOT??'NOT_OBSERVED',runtimeTour:s.TOUR??'NOT_OBSERVED',visibleHud:document.querySelector('#hud')?.innerText?.trim().slice(0,700)||''}})()`;
const capture=(name,label)=>{const p=path.join(rawDir,`${viewport}-${name}.png`);ab(['screenshot',p]);return {label,path:p,metrics:ev(metrics),captureType:'LIVE_SCREENSHOT',capturedAt:new Date().toISOString()}};
const records=[];
state.takes[id].attempts.push({viewport,stage:'SEMANTIC',run:run||'original',startedAt:new Date().toISOString(),status:'IN_PROGRESS'});state.takes[id].timestamps.updatedAt=new Date().toISOString();await writeFile(statePath,JSON.stringify(state,null,2)+'\n');
try{
  ab(['open','about:blank']);ab(['set','viewport',String(width),String(height)]);ab(['open',ref.standaloneUrl]);ab(['wait','4500']);
  let ready=false;for(let i=0;i<60;i++){ready=ev('window.__ready===true');if(ready)break;ab(['wait','300'])}if(!ready)throw Error('05 did not reach window.__ready');
  ab(['wait','500']);let now=ev(metrics),preludeCount=0;
  while(now.runtimeWeek>0.002&&preludeCount<300){const t=performance.now();ab(['mouse','wheel',String(-step)]);preludeCount++;if(preludeCount%3===0)now=ev(metrics);await sleep(Math.max(0,114-(performance.now()-t)))}
  ab(['wait','700']);now=ev(metrics);if(now.runtimeWeek>0.01)throw Error(`Prelude did not reach week 0: ${now.runtimeWeek}`);
  const initial=now;records.push(capture('semantic-start','A'));
  const video=path.join(rawDir,`${viewport}-forward-semantic.webm`);ab(['record','start',video,'--fps','10']);
  let inputCount=0,terminalInput='WHEEL_ONLY';
  for(const m of milestones){
    const target=14*(m.targetProgressByViewport?.[viewport]??m.targetProgress);
    while(now.runtimeWeek<target-(target>=14?0:0.008)&&inputCount<500){const t=performance.now();const delta=now.runtimeWeek>=13?Math.min(step,10):step;ab(['mouse','wheel',String(delta)]);inputCount++;now=ev(metrics);await sleep(Math.max(0,114-(performance.now()-t)))}
    ab(['wait','450']);now=ev(metrics);
    if(target===14&&now.runtimeWeek<14){
      // The donor can settle at 13.9995 while its target is 14; the final
      // difference is below its animation threshold. Use its visible week
      // slider with natural keyboard input, retaining the wheel traversal on
      // video. A no-op End on an already-maxed slider emits no input event, so
      // step left once before End to commit the exact terminal week.
      ab(['focus','input[aria-label="Scrub build week"]']);ab(['press','ArrowLeft']);ab(['press','End']);
      terminalInput='WHEEL_THEN_SLIDER_LEFT_END';ab(['wait','500']);now=ev(metrics);
    }
    if(target===14&&now.runtimeWeek!==14)throw Error(`M12 did not reach exact week 14: ${now.runtimeWeek}`);
    records.push(capture(`forward-${m.label.toLowerCase()}-${m.slug}`,m.label));
  }
  while(now.runtimeWeek<13.998&&inputCount<450){const t=performance.now();ab(['mouse','wheel',String(step)]);inputCount++;now=ev(metrics);await sleep(Math.max(0,114-(performance.now()-t)))}
  ab(['wait','900']);now=ev(metrics);if(now.runtimeWeek!==14||!now.visibleHud.includes('PRACTICAL COMPLETION'))throw Error(`Semantic forward did not reach exact Practical Completion: ${now.runtimeWeek}`);
  records.push(capture('semantic-end','B'));ab(['record','stop']);
  const assets=[];for(const r of records)assets.push({path:r.path,bytes:(await stat(r.path)).size,sha256:createHash('sha256').update(await readFile(r.path)).digest('hex')});
  assets.push({path:video,bytes:(await stat(video)).size,sha256:createHash('sha256').update(await readFile(video)).digest('hex')});
  await writeFile(path.join(rawDir,'semantic-capture.json'),JSON.stringify({id,viewport,run:run||'original',initial,records,video,assets,preludeInputCount:preludeCount,inputCount,terminalInput,planSource:path.join(evidence,'takes',id,'semantic-plan.json')},null,2)+'\n');
  state.takes[id].attempts.at(-1).status='COMPLETE';state.takes[id].attempts.at(-1).finishedAt=new Date().toISOString();state.takes[id].blockingUnresolved=state.takes[id].blockingUnresolved.filter(x=>!(x.viewport===viewport&&x.question==='Semantic capture failed'));state.takes[id].captureStatus='IN_PROGRESS';state.takes[id].lastSuccessfulStage=`SEMANTIC_${viewport.toUpperCase()}_COMPLETE`;state.takes[id].timestamps.updatedAt=new Date().toISOString();await writeFile(statePath,JSON.stringify(state,null,2)+'\n');
  console.log(JSON.stringify({id,viewport,run:run||'original',milestones:milestones.length,finalWeek:now.runtimeWeek,assets:assets.length},null,2));
}catch(e){state.takes[id].attempts.at(-1).status='FAILED';state.takes[id].attempts.at(-1).error=String(e);state.takes[id].blockingUnresolved.push({viewport,question:'Semantic capture failed',detail:String(e)});state.takes[id].captureStatus='FAILED';state.takes[id].timestamps.updatedAt=new Date().toISOString();await writeFile(statePath,JSON.stringify(state,null,2)+'\n');throw e}
finally{ab(['close'],true)}
