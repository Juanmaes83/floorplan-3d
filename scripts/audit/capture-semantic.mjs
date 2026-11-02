import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evidence = path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const statePath = path.join(evidence,'audit-run-state.json');
const state = JSON.parse(await readFile(statePath,'utf8'));
const inventory = JSON.parse(await readFile(path.join(evidence,'reference-inventory.json'),'utf8'));
const id = process.argv.find(a=>a.startsWith('--take='))?.slice(7);
const viewport = process.argv.find(a=>a.startsWith('--viewport='))?.slice(11);
const run = process.argv.find(a=>a.startsWith('--run='))?.slice(6);
const fps = Number(process.argv.find(a=>a.startsWith('--fps='))?.slice(6) ?? 30);
if (!Number.isInteger(fps) || fps < 1 || fps > 30) throw new Error('Use --fps=1..30');
const dims = {desktop:[1440,900],portrait:[390,844],landscape:[844,390]};
if (!id || !state.takes[id] || !dims[viewport]) throw new Error('Use --take=<id> --viewport=<desktop|portrait|landscape>');
const ref = inventory.references.find(r=>r.id===id);
const plan = JSON.parse(await readFile(path.join(evidence,'takes',id,'semantic-plan.json'),'utf8'));
if (run && !/^semantic-correction-[1-9][0-9]*$/.test(run)) throw new Error('Correction run must be semantic-correction-N');
const rawDir = path.join(state.rawFolder,id,viewport,...(run?[run]:[]));
await mkdir(rawDir,{recursive:true});
const bin = process.env.AGENT_BROWSER_BIN || 'C:/Users/temp123/donor-runtime-audit-tools-2026-11-02/node_modules/agent-browser/bin/agent-browser.js';
const session = `rubik-donor-${id}-${viewport}-${run||'semantic'}-${Date.now()}`.replaceAll(/[^a-zA-Z0-9_-]/g,'-');
const [width,height]=dims[viewport];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function ab(args,optional=false) {
  const r=spawnSync(process.execPath,[bin,'--session',session,...args],{encoding:'utf8',maxBuffer:10*1024*1024,timeout:90000});
  if ((r.status!==0||r.error)&&!optional) throw new Error(`agent-browser ${args[0]}: ${r.stderr||r.stdout||r.error?.message}`);
  return (r.stdout||'').trim();
}
function evalJson(js){const s=ab(['eval',js]);try{return JSON.parse(s)}catch{throw new Error(`eval parse: ${s.slice(0,200)}`)}}
function waitForStableStart(){
  if(!id.startsWith('03-')&&id!=='04-demo-build-time-lapse'&&id!=='06-demo-card-model')return;
  const marker=id==='04-demo-build-time-lapse'?'window.__heroDone===true':id==='06-demo-card-model'?"window.__rig?.ready===true && Number(document.querySelector('.hero .sub')?.style.opacity)>=0.99 && Number(document.querySelector('.top')?.style.opacity)>=0.99":'window.__ready===true';
  let ready=false;
  for(let poll=0;poll<60;poll++){
    ready=evalJson(marker);
    if(ready)break;
    ab(['wait','300']);
  }
  if(!ready)throw new Error(`${id} did not reach stable start marker ${marker}`);
  ab(['wait','500']);
}
const metrics=`({url:location.href,scrollY,maxScroll:Math.max(0,document.documentElement.scrollHeight-innerHeight),dpr:devicePixelRatio,visibleHud:['#camReadout','#counter','#caption','#room','#tb','#cm-lbl','#chip','#hud'].map(q=>document.querySelector(q)?.innerText?.trim()||'').filter(Boolean).join(' | ').slice(0,700)})`;
const capture=async(name,label)=>{
  const p=path.join(rawDir,`${viewport}-${name}.png`);
  ab(['screenshot',p]);
  return {label,path:p,metrics:evalJson(metrics),captureType:'LIVE_SCREENSHOT',capturedAt:new Date().toISOString()};
};
const milestones=plan.milestones.filter(m=>!m.viewports||m.viewports.includes(viewport));
const records=[];
state.takes[id].attempts.push({viewport,stage:'SEMANTIC',run:run||'original',startedAt:new Date().toISOString(),status:'IN_PROGRESS'});
state.takes[id].timestamps.updatedAt=new Date().toISOString();
await writeFile(statePath,JSON.stringify(state,null,2)+'\n');
try{
  ab(['open','about:blank']);
  ab(['set','viewport',String(width),String(height)]);
  ab(['open',ref.standaloneUrl]);
  ab(['wait','4500']);
  waitForStableStart();
  const initial=evalJson(metrics);
  records.push(await capture('semantic-start','A'));
  const video=path.join(rawDir,`${viewport}-forward-semantic.webm`);
  ab(['record','start',video,'--fps',String(fps)]);
  const step=Math.max(1,Math.floor(height*.08));
  let i=0;
  for(const m of milestones){
    const targetY=initial.maxScroll*(m.targetProgressByViewport?.[viewport]??m.targetProgress);
    while(i<Math.ceil(initial.maxScroll/step)+30){
      const current=evalJson(metrics);
      if(current.scrollY>=targetY-step*.5)break;
      const t=performance.now();
      ab(['mouse','wheel',String(step)]);
      i++;
      await sleep(Math.max(0,114-(performance.now()-t)));
    }
    ab(['wait','350']);
    records.push(await capture(`forward-${m.label.toLowerCase()}-${m.slug}`,m.label));
  }
  let final=evalJson(metrics);
  while(final.scrollY<final.maxScroll-1&&i<Math.ceil(initial.maxScroll/step)+50){
    const t=performance.now();ab(['mouse','wheel',String(step)]);i++;
    await sleep(Math.max(0,114-(performance.now()-t)));final=evalJson(metrics);
  }
  ab(['wait','800']);
  records.push(await capture('semantic-end','B'));
  ab(['record','stop']);
  const assets=[];
  for(const r of records){assets.push({path:r.path,bytes:(await stat(r.path)).size,sha256:createHash('sha256').update(await readFile(r.path)).digest('hex')})}
  assets.push({path:video,bytes:(await stat(video)).size,sha256:createHash('sha256').update(await readFile(video)).digest('hex')});
  await writeFile(path.join(rawDir,'semantic-capture.json'),JSON.stringify({id,viewport,run:run||'original',fps,initial,records,video,assets,inputCount:i,planSource:path.join(evidence,'takes',id,'semantic-plan.json')},null,2)+'\n');
  state.takes[id].attempts.at(-1).status='COMPLETE';
  state.takes[id].attempts.at(-1).finishedAt=new Date().toISOString();
  state.takes[id].blockingUnresolved=state.takes[id].blockingUnresolved.filter(x=>!(x.viewport===viewport&&x.question==='Semantic capture failed'));
  state.takes[id].captureStatus='IN_PROGRESS';
  state.takes[id].lastSuccessfulStage=`SEMANTIC_${viewport.toUpperCase()}_COMPLETE`;
  state.takes[id].timestamps.updatedAt=new Date().toISOString();
  await writeFile(statePath,JSON.stringify(state,null,2)+'\n');
  console.log(JSON.stringify({id,viewport,run:run||'original',milestones:milestones.length,finalY:records.at(-1).metrics.scrollY,maxScroll:records.at(-1).metrics.maxScroll,assets:assets.length},null,2));
}catch(e){
  state.takes[id].attempts.at(-1).status='FAILED';state.takes[id].attempts.at(-1).error=String(e);
  state.takes[id].blockingUnresolved.push({viewport,question:'Semantic capture failed',detail:String(e)});
  state.takes[id].captureStatus='FAILED';
  state.takes[id].timestamps.updatedAt=new Date().toISOString();
  await writeFile(statePath,JSON.stringify(state,null,2)+'\n');
  throw e;
}finally{ab(['close'],true)}
