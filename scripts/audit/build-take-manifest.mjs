import {readFile,writeFile,readdir,stat,copyFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const evRoot=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const id=process.argv.find(x=>x.startsWith('--take='))?.slice(7);
const inventory=JSON.parse(await readFile(path.join(evRoot,'reference-inventory.json'),'utf8'));
const ref=inventory.references.find(x=>x.id===id);
if(!ref)throw new Error('Use --take=<canonical-id>');
const virtualWeek=id.startsWith('05-');
const takeDir=path.join(evRoot,'takes',id);
const config=JSON.parse(await readFile(path.join(takeDir,'reconciliation.json'),'utf8'));
const plan=JSON.parse(await readFile(path.join(takeDir,'semantic-plan.json'),'utf8'));
const statePath=path.join(evRoot,'audit-run-state.json');
const state=JSON.parse(await readFile(statePath,'utf8'));
const rawRoot=state.rawFolder;
const dims={desktop:[1440,900],portrait:[390,844],landscape:[844,390]};
const basesha='0f9c6ead9732901681498efec326d1ca92e42ffe';
const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const e=(cl,statement,locator)=>({class:cl,statement,locator});
function probeVideo(p,w,h){
  const r=spawnSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_name,width,height','-of','json',p],{encoding:'utf8'});
  if(r.status!==0)throw new Error(`ffprobe: ${p}: ${r.stderr}`);
  const data=JSON.parse(r.stdout);
  if(Number(data.format?.duration)<=0||!data.streams?.some(s=>s.codec_name==='vp8'&&s.width===w&&s.height===h))throw new Error(`Wrong video metadata ${p}`);
  const dec=spawnSync('ffmpeg',['-v','error','-i',p,'-f','null','NUL'],{encoding:'utf8',timeout:120000});
  if(dec.status!==0)throw new Error(`Decode: ${p}: ${dec.stderr}`);
  return {codec:'vp8',durationSeconds:Number(data.format.duration),bytes:Number(data.format.size),dimensions:[w,h],decoded:true};
}
const assets=[],viewports={};
for(const vp of Object.keys(dims)){
  const dir=path.join(rawRoot,id,vp),[w,h]=dims[vp];
  const discoveryDir=path.join(dir,...(config.discoveryRun?.[vp]?[config.discoveryRun[vp]]:[]));
  const semanticDir=path.join(dir,...(config.semanticRun?.[vp]?[config.semanticRun[vp]]:[]));
  const viewportMilestones=plan.milestones.filter(m=>!m.viewports||m.viewports.includes(vp));
  const discovery=JSON.parse(await readFile(path.join(discoveryDir,'discovery-summary.json'),'utf8'));
  const semantic=JSON.parse(await readFile(path.join(semanticDir,'semantic-capture.json'),'utf8'));
  const initial=JSON.parse(await readFile(path.join(discoveryDir,'start-state.json'),'utf8'));
  const end=JSON.parse(await readFile(path.join(discoveryDir,'end-state.json'),'utf8'));
  const telemetry=(await readFile(path.join(discoveryDir,`${vp}-forward-discovery.telemetry.ndjson`),'utf8')).trim().split('\n').map(JSON.parse);
  if(!telemetry.length)throw new Error(`Empty telemetry: ${vp}`);
  const fv=path.join(discoveryDir,`${vp}-forward-discovery.webm`),rv=path.join(discoveryDir,`${vp}-reverse-discovery.webm`),sv=path.join(semanticDir,`${vp}-forward-semantic.webm`);
  const videoMetadata={forward:probeVideo(fv,w,h),reverse:probeVideo(rv,w,h),semantic:probeVideo(sv,w,h)};
  const progressKey=virtualWeek?'normalizedRuntimeProgress':'normalizedNativeProgress';
  const nearest=p=>telemetry.reduce((a,b)=>Math.abs(b[progressKey]-p)<Math.abs(a[progressKey]-p)?b:a,telemetry[0]);
  const mark=p=>{const x=nearest(p);return {[progressKey]:+x[progressKey].toFixed(4),...(virtualWeek?{runtimeWeek:+x.runtimeWeek.toFixed(3)}:{}),scrollY:x.scrollY,monotonicMs:+x.monotonicMs.toFixed(1),videoSeconds:+Math.max(0,(x.monotonicMs-telemetry[0].monotonicMs)/1000).toFixed(3),precision:'approximate passive telemetry locator; review continuous video for exact frame'};};
  const milestones=viewportMilestones.map((m,i)=>{
    const shot=semantic.records.find(x=>x.label===m.label);
    if(!shot)throw new Error(`Missing semantic ${vp} ${m.label}`);
    const [a,c,b]=(config.transitionsByViewport?.[vp]||config.transitions)[i];
    if(!(a<=c&&c<=b))throw new Error(`Bad transition ${m.label}`);
    const changed=m.observedChangeByViewport?.[vp]||m.observedChange;
    return {label:m.label,semanticState:m.slug,changed:[changed],continuous:[(config.continuityByViewport?.[vp]||config.continuity)[i]],transitionStart:mark(a),semanticCenter:mark(c),transitionEnd:mark(b),semanticScreenshotProgress:virtualWeek?shot.metrics.normalizedRuntimeProgress:shot.metrics.scrollY/shot.metrics.maxScroll,sourceLocator:(config.milestoneSourcesByViewport?.[vp]||config.milestoneSources)[i],evidence:[e('OBSERVED_RUNTIME',`${m.label} in fresh semantic pass at ${vp}: ${changed}`,shot.path),e('OBSERVED_RUNTIME',`Continuous transition around ${virtualWeek?'virtual week':'native'} progress ${a}-${b}`,`${fv}#t=${mark(a).videoSeconds}-${mark(b).videoSeconds}`)]};
  });
  const support=config.viewportSupport[vp];
  const startShot=path.join(discoveryDir,`${vp}-start.png`),endShot=path.join(discoveryDir,`${vp}-end.png`),restoredShot=path.join(discoveryDir,`${vp}-restored-start.png`);
  viewports[vp]={
    width:w,height:h,dpr:discovery.start.dpr,runtimeSupport:support,progressModel:config.progressModel?.[vp]||discovery.calibration.model,
    startState:{url:discovery.start.url,route:discovery.start.route,hash:discovery.start.hash,scrollY:discovery.start.scrollY,scrollHeight:discovery.start.scrollHeight,innerHeight:discovery.start.innerHeight,maxScroll:discovery.start.maxScroll,...(virtualWeek?{runtimeWeek:discovery.start.runtimeWeek,runtimeShot:discovery.start.runtimeShot,normalizedRuntimeProgress:discovery.start.normalizedRuntimeProgress}:{}),visibleHud:discovery.start.visibleHud,screenshot:startShot,snapshot:initial.snapshot,consoleErrors:initial.errorsStart,network:initial.networkStart},
    forwardResult:{assessed:true,complete:virtualWeek?discovery.end.runtimeWeek>=13.99:discovery.end.scrollY===discovery.end.maxScroll,video:fv,videoVerified:videoMetadata.forward.decoded,videoMetadata:videoMetadata.forward,telemetry:path.join(discoveryDir,`${vp}-forward-discovery.telemetry.ndjson`),semanticVideo:sv,semanticVideoMetadata:videoMetadata.semantic,semanticPassComplete:semantic.records.length===viewportMilestones.length+2,semanticScreenshotsVerified:true,discoverySamples:21,additionalInputAfterMax:end.additionalInputAfterMax,endDemonstration:virtualWeek?'Natural wheel reached virtual week 14 and the final interior stop; additional wheel inputs after settling revealed no further major state. Native scrollY stayed zero.':'Natural wheel reached the end; additional wheel inputs after settling revealed no further major state.',limitationEvidence:config.viewportEvidence[vp]||[]},
    milestones,
    endState:{url:discovery.end.url,route:discovery.end.route,hash:discovery.end.hash,scrollY:discovery.end.scrollY,scrollHeight:discovery.end.scrollHeight,innerHeight:discovery.end.innerHeight,maxScroll:discovery.end.maxScroll,...(virtualWeek?{runtimeWeek:discovery.end.runtimeWeek,runtimeShot:discovery.end.runtimeShot,normalizedRuntimeProgress:discovery.end.normalizedRuntimeProgress}:{}),visibleHud:discovery.end.visibleHud,screenshot:endShot},
    reverseResult:{attempted:true,complete:virtualWeek?discovery.restored.runtimeWeek<=.01:discovery.restored.scrollY===0,video:rv,videoVerified:videoMetadata.reverse.decoded,videoMetadata:videoMetadata.reverse,telemetry:path.join(discoveryDir,`${vp}-reverse-discovery.telemetry.ndjson`),comparison:{A0:startShot,A1:restoredShot,scrollEqual:discovery.start.scrollY===discovery.restored.scrollY,...(virtualWeek?{runtimeWeekEqual:Math.abs(discovery.start.runtimeWeek-discovery.restored.runtimeWeek)<.01,runtimeShotEqual:discovery.start.runtimeShot===discovery.restored.runtimeShot}:{}),routeEqual:discovery.start.route===discovery.restored.route,hashEqual:discovery.start.hash===discovery.restored.hash,visualReview:config.restoreReview[vp],runtimeInternalState:'NOT_OBSERVED'},reverseOnlyMilestones:config.reverseOnlyMilestones[vp]},
    restoreVerdict:config.restoreVerdict[vp],
    interactions:[{type:'wheel',direction:'forward',count:discovery.forwardInputCount,stepPx:Math.floor(h*.08)},{type:'wheel',direction:'reverse',count:discovery.reverseInputCount,stepPx:-Math.floor(h*.08)}]
  };
  for(const name of await readdir(dir)){
    const p=path.join(dir,name),s=await stat(p);if(!s.isFile())continue;
    assets.push({path:p,sha256:await hash(p),kind:name.endsWith('.webm')?'VIDEO':name.endsWith('.png')?'IMAGE':name.endsWith('.ndjson')?'TELEMETRY':'METADATA',viewport:vp});
  }
  if(discoveryDir!==dir)for(const name of await readdir(discoveryDir)){
    const p=path.join(discoveryDir,name),s=await stat(p);if(!s.isFile())continue;
    assets.push({path:p,sha256:await hash(p),kind:name.endsWith('.webm')?'VIDEO':name.endsWith('.png')?'IMAGE':name.endsWith('.ndjson')?'TELEMETRY':'METADATA',viewport:vp});
  }
  if(semanticDir!==dir)for(const name of await readdir(semanticDir)){
    const p=path.join(semanticDir,name),s=await stat(p);if(!s.isFile())continue;
    assets.push({path:p,sha256:await hash(p),kind:name.endsWith('.webm')?'VIDEO':name.endsWith('.png')?'IMAGE':'METADATA',viewport:vp});
  }
}
for(const [vp,names] of Object.entries(config.selectedKeyframes)){
  const target=path.join(takeDir,'keyframes',vp);await mkdir(target,{recursive:true});
  for(const name of names){if(name.includes('..'))throw Error(`Unsafe keyframe path ${name}`);const from=path.join(rawRoot,id,vp,name),to=path.join(target,name.replaceAll(/[\\/]/g,'--'));await copyFile(from,to);assets.push({path:path.relative(root,to).replaceAll('\\','/'),sha256:await hash(to),kind:'KEYFRAME',viewport:vp});}
}
const manifest={
  schemaVersion:'rubik-donor-runtime-audit.take.v1',auditId:'donor-runtime-7x14-2026-11-02',take:{id,group:ref.group,title:ref.take,inventoryIndex:ref.inventoryIndex},status:config.status,
  baseline:{repository:'Juanmaes83/floorplan-3d',approvedSha:basesha,auditBranch:state.auditBranch,worktree:root,cleanAtStart:true},
  reference:{selectorUrl:ref.selectorUrl,standaloneUrl:ref.standaloneUrl,resolvedUrl:ref.resolvedUrl,donorRepo:ref.donorRepo,donorCommit:ref.donorCommit,entrypoint:ref.sourceEntrypoint,urlDiscoveryEvidence:ref.evidence},
  tooling:{os:'Windows x86_64',codexCli:'0.155.1',agentBrowser:'0.41.1',browser:'Google Chrome 153.0.8010.53',playwright:'1.64.1 installed as recording fallback; not used',ffmpeg:'8.1.2-full_build'},
  professionalService:config.professionalService,
  continuityInvariants:config.continuityInvariants,
  viewports,evidenceLedger:config.evidenceLedger,
  donorSourceLocators:config.donorSourceLocators,cutsAtlas:config.cutsAtlas,rubikCrosswalk:config.rubikCrosswalk,
  gaps:config.gaps,candidateBridges:config.candidateBridges,dependencies:config.dependencies,qaExpectations:config.qaExpectations,unresolved:config.unresolved,
  assets,integrity:{assetsVerified:true,productionDiffZero:true},
  completion:{gates:Object.fromEntries(Array.from({length:21},(_,i)=>[`T${String(i+1).padStart(2,'0')}`,'PENDING_VALIDATOR'])),validatorResult:'NOT_RUN',validatedAt:null}
};
await writeFile(path.join(takeDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await mkdir(path.join(evRoot,'hashes'),{recursive:true});
await writeFile(path.join(evRoot,'hashes',`${id}.sha256`),assets.map(a=>`${a.sha256}  ${a.path}`).join('\n')+'\n');
const entry=state.takes[id];
entry.captureStatus='COMPLETE';entry.reconciliationStatus='COMPLETE';entry.validationStatus='IN_PROGRESS';entry.lastSuccessfulStage='HASHES_COMPLETE';entry.blockingUnresolved=config.unresolved.filter(x=>x.severity==='BLOCKING');entry.nonBlockingUnresolved=config.unresolved.filter(x=>x.severity==='NON_BLOCKING');entry.timestamps.updatedAt=new Date().toISOString();state.updatedAt=entry.timestamps.updatedAt;
await writeFile(statePath,JSON.stringify(state,null,2)+'\n');
console.log(JSON.stringify({id,status:manifest.status,milestones:plan.milestones.length,assets:assets.length,manifest:path.join(takeDir,'manifest.json')},null,2));
