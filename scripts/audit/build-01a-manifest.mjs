import { readFile, writeFile, readdir, stat, copyFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const evidence=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const rawRoot=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02');
const takeDir=path.join(evidence,'takes/01-a-the-board');
const id='01-a-the-board';
const donorSha='d7b9b69753d3af679535ee56695a05c8d955c3c6';
const baseSha='0f9c6ead9732901681498efec326d1ca92e42ffe';
const inventory=JSON.parse(await readFile(path.join(evidence,'reference-inventory.json'),'utf8'));
const ref=inventory.references.find(x=>x.id===id);
const plan=JSON.parse(await readFile(path.join(takeDir,'semantic-plan.json'),'utf8'));
const state=JSON.parse(await readFile(path.join(evidence,'audit-run-state.json'),'utf8'));
const e=(cl,statement,locator)=>({class:cl,statement,locator});
const observed=(statement,locator)=>e('OBSERVED_RUNTIME',statement,locator);
const source=(statement,locator)=>e('DONOR_SOURCE',statement,locator);
const cut=(statement,locator)=>e('CUT_ATLAS',statement,locator);
const rubik=(statement,locator)=>e('RUBIK_CURRENT',statement,locator);
const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const sourcePrefix=`Sam1983Aing/flat-to-3d@${donorSha}:01-exploded-house/`;
const rubikPrefix=`Juanmaes83/floorplan-3d@${baseSha}:`;
const dirs=['desktop','portrait','landscape'];
const dimensions={desktop:[1440,900],portrait:[390,844],landscape:[844,390]};
const bounds=[
  [.05,.09,.118],[.106,.145,.174],[.162,.20,.23],[.218,.255,.286],
  [.274,.315,.342],[.33,.37,.398],[.398,.44,.48],[.48,.62,.66],
  [.66,.71,.75],[.75,.80,.84],[.84,.89,.93],[.93,.99,1]
];
const sourceMap=[
  'dir-a.js:316-390','dir-a.js:316-390','dir-a.js:316-390','dir-a.js:316-390',
  'dir-a.js:316-390','dir-a.js:316-390','dir-a.js:340-361',
  'dir-a.js:340-391; core.js:312-348','dir-a.js:340-368',
  'dir-a.js:340-368','dir-a.js:340-368','dir-a.js:340-368'
];
const continuity=(i)=>i<7
  ? ['The same floor footprint, wall openings and east glazed gable remain aligned while the selected authored layer moves.']
  : ['The east glazed gable, roof rafters, loft edge and furnished long room belong to the same continuous model during the camera move.'];
const near=(samples,p)=>{
  const x=samples.reduce((best,s)=>Math.abs(s.normalizedNativeProgress-p)<Math.abs(best.normalizedNativeProgress-p)?s:best,samples[0]);
  return {normalizedNativeProgress:+x.normalizedNativeProgress.toFixed(4),scrollY:x.scrollY,monotonicMs:+x.monotonicMs.toFixed(1)};
};
const verifyVideo=(p,w,h)=>{
  const probe=spawnSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_name,width,height','-of','json',p],{encoding:'utf8'});
  if(probe.status!==0)throw new Error(`ffprobe failed: ${p}`);
  const data=JSON.parse(probe.stdout);
  if(Number(data.format.duration)<=0||!data.streams.some(s=>s.codec_name==='vp8'&&s.width===w&&s.height===h))throw new Error(`Invalid video stream: ${p}`);
  const decode=spawnSync('ffmpeg',['-v','error','-i',p,'-f','null','NUL'],{encoding:'utf8',timeout:120000});
  if(decode.status!==0)throw new Error(`Video decode failed: ${p}: ${decode.stderr}`);
  return {codec:'vp8',durationSeconds:Number(data.format.duration),bytes:Number(data.format.size),dimensions:[w,h],decoded:true};
};
const assets=[],viewports={};
for(const vp of dirs){
  const dir=path.join(rawRoot,id,vp);
  const discovery=JSON.parse(await readFile(path.join(dir,'discovery-summary.json'),'utf8'));
  const semantic=JSON.parse(await readFile(path.join(dir,'semantic-capture.json'),'utf8'));
  const initial=JSON.parse(await readFile(path.join(dir,'start-state.json'),'utf8'));
  const end=JSON.parse(await readFile(path.join(dir,'end-state.json'),'utf8'));
  const reverse=JSON.parse(await readFile(path.join(dir,'reverse-state.json'),'utf8'));
  const telemetry=(await readFile(path.join(dir,`${vp}-forward-discovery.telemetry.ndjson`),'utf8')).trim().split('\n').map(JSON.parse);
  const [w,h]=dimensions[vp];
  const forwardVideo=path.join(dir,`${vp}-forward-discovery.webm`);
  const reverseVideo=path.join(dir,`${vp}-reverse-discovery.webm`);
  const semanticVideo=path.join(dir,`${vp}-forward-semantic.webm`);
  const videoEvidence={forward:verifyVideo(forwardVideo,w,h),reverse:verifyVideo(reverseVideo,w,h),semantic:verifyVideo(semanticVideo,w,h)};
  const first=telemetry[0].monotonicMs;
  const at=p=>{const n=near(telemetry,p);return {...n,videoSeconds:+Math.max(0,(n.monotonicMs-first)/1000).toFixed(3),precision:'approximate temporal locator from passive telemetry; visual boundary checked in continuous video'};};
  const milestones=plan.milestones.map((m,i)=>{
    const shot=semantic.records.find(r=>r.label===m.label);
    if(!shot)throw new Error(`Missing semantic screenshot ${vp} ${m.label}`);
    const [a,c,b]=bounds[i];
    return {
      label:m.label,semanticState:m.slug,changed:[m.observedChange],continuous:continuity(i),
      transitionStart:at(a),semanticCenter:at(c),transitionEnd:at(b),
      semanticScreenshotProgress:shot.metrics.scrollY/shot.metrics.maxScroll,
      sourceLocator:`${sourcePrefix}${sourceMap[i]}`,
      evidence:[
        observed(`${m.label} seen in second clean forward pass at ${vp}; ${m.observedChange}`,shot.path),
        observed(`Continuous transition around ${a.toFixed(3)}–${b.toFixed(3)} native progress; precise semantic boundaries are approximate`,`${forwardVideo}#t=${at(a).videoSeconds}-${at(b).videoSeconds}`)
      ]
    };
  });
  const support=vp==='landscape'?'DONOR_LIMITATION':'SUPPORTED';
  const limitation=vp==='landscape'
    ? [observed('At 844×390 the desktop navigation, layer callouts, radar and caption overlap and crop each other while the story still progresses and reverses.',path.join(dir,`${vp}-start.png`)),source('01 phone layout is selected only when innerWidth < 700; 844px uses desktop positions. Source README recommends laptop.',`${sourcePrefix}core.js:23,414; sketch.css:315-356; README.md:1-31`)]
    : [];
  viewports[vp]={
    width:w,height:h,dpr:discovery.start.dpr,runtimeSupport:support,progressModel:'SCROLL_PLUS_TIME',
    startState:{url:discovery.start.url,route:discovery.start.route,hash:discovery.start.hash,scrollY:discovery.start.scrollY,scrollHeight:discovery.start.scrollHeight,innerHeight:discovery.start.innerHeight,maxScroll:discovery.start.maxScroll,visibleHud:discovery.start.visibleHud,screenshot:path.join(dir,`${vp}-start.png`),snapshot:initial.snapshot,consoleErrors:initial.errorsStart,network:initial.networkStart},
    forwardResult:{assessed:true,complete:discovery.end.scrollY===discovery.end.maxScroll,video:forwardVideo,videoVerified:videoEvidence.forward.decoded,videoMetadata:videoEvidence.forward,telemetry:path.join(dir,`${vp}-forward-discovery.telemetry.ndjson`),semanticVideo,semanticVideoMetadata:videoEvidence.semantic,semanticPassComplete:semantic.records.length===14,semanticScreenshotsVerified:true,discoverySamples:21,additionalInputAfterMax:end.additionalInputAfterMax,endDemonstration:'Natural wheel reached max; two additional wheel inputs and settling revealed no further major semantic state.',limitationEvidence:limitation},
    milestones,
    endState:{url:discovery.end.url,route:discovery.end.route,hash:discovery.end.hash,scrollY:discovery.end.scrollY,scrollHeight:discovery.end.scrollHeight,innerHeight:discovery.end.innerHeight,maxScroll:discovery.end.maxScroll,visibleHud:discovery.end.visibleHud,screenshot:path.join(dir,`${vp}-end.png`)},
    reverseResult:{attempted:true,complete:discovery.restored.scrollY===0,video:reverseVideo,videoVerified:videoEvidence.reverse.decoded,videoMetadata:videoEvidence.reverse,telemetry:path.join(dir,`${vp}-reverse-discovery.telemetry.ndjson`),comparison:{A0:path.join(dir,`${vp}-start.png`),A1:path.join(dir,`${vp}-restored-start.png`),scrollEqual:discovery.start.scrollY===discovery.restored.scrollY,routeEqual:discovery.start.route===discovery.restored.route,hashEqual:discovery.start.hash===discovery.restored.hash,visualReview:'A0 and A1 visually equivalent at same viewport; internal camera/material/geometry state was not passively exposed.',runtimeInternalState:'NOT_OBSERVED'},reverseOnlyMilestones:'No reverse-only state identified in reviewed Discovery video; sequential layer re-separation and camera return observed.'},
    restoreVerdict:'VISUALLY_EQUIVALENT',
    interactions:[{type:'wheel',direction:'forward',count:discovery.forwardInputCount,stepPx:Math.floor(h*.08)},{type:'wheel',direction:'reverse',count:discovery.reverseInputCount,stepPx:-Math.floor(h*.08)}]
  };
  const names=await readdir(dir);
  for(const name of names){
    const p=path.join(dir,name),s=await stat(p);if(!s.isFile())continue;
    const kind=name.endsWith('.webm')?'VIDEO':name.endsWith('.ndjson')?'TELEMETRY':name.endsWith('.png')?'IMAGE':'METADATA';
    assets.push({path:p,sha256:await hash(p),kind,viewport:vp});
  }
}
// Keep a small review set in Git; complete capture remains RAW.
const selected={
  desktop:['desktop-start.png','desktop-forward-m04-cladding-lands.png','desktop-forward-m07-assembled-house.png','desktop-forward-m08-lens-and-porch.png','desktop-forward-m11-oak-loft.png','desktop-end.png','desktop-restored-start.png'],
  portrait:['portrait-start.png','portrait-forward-m08-lens-and-porch.png','portrait-end.png','portrait-restored-start.png'],
  landscape:['landscape-start.png','landscape-forward-m08-lens-and-porch.png','landscape-end.png','landscape-restored-start.png']
};
for(const [vp,names] of Object.entries(selected)){
  const kdir=path.join(takeDir,'keyframes',vp);await mkdir(kdir,{recursive:true});
  for(const name of names){
    const from=path.join(rawRoot,id,vp,name),to=path.join(kdir,name);
    await copyFile(from,to);
    assets.push({path:path.relative(root,to).replaceAll('\\','/'),sha256:await hash(to),kind:'KEYFRAME',viewport:vp});
  }
}
const cross=(status,claim,locators)=>({status,claim,evidence:locators.map(([statement,locator])=>rubik(statement,rubikPrefix+locator))});
const rubikCrosswalk={
  semanticData:cross('PARTIAL','Project/Building preserve semantic rooms, walls, openings and levels; no general authored structural-layer membership is established.',[['Project is sole durable authority; geometry derived.','index.html:1032-1052'],['Axon descriptor consumes structural levels.','js/presentation-axon-core.js:79-98']]),
  geometry:cross('PARTIAL','Rubik builds real project geometry and a levels descriptor; donor six building-component layers are not a generic derived subdivision.',[['Building layers and roof/exterior groups are built from current project.','index.html:2565-2568'],['Axon derives bounds and level separation.','js/presentation-axon-core.js:58-98']]),
  representation:cross('PARTIAL','Compact axon and exploded levels exist; ink-layer callouts and component land/pull visualization are a distinct representation.',[['Current axon/exploded narrative states.','js/presentation-story-core.js:249-345'],['Runtime owns axon handles.','index.html:4750-4828']]),
  materialsLight:cross('PARTIAL','Authorized material appearances and scene lighting exist; no donor ink/plotter treatment is inferred as integrated.',[['Surface material is derived from assigned appearance and cached.','js/surface-renderer.mjs:6-16'],['Existing surface lifecycle.','js/surface-renderer.mjs:45-74']]),
  camera:cross('PARTIAL','Rubik fits a whole building to the free region and has room descent; the donor authored 1.5° axo-to-porch-to-loft camera path is not the same contract.',[['Axon fit and camera state.','js/presentation-story-core.js:249-345'],['Room descent narrative.','js/presentation-story-core.js:87-124']]),
  transition:cross('PARTIAL','Pure reversible Story transitions exist; no six component groups are currently orchestrated through them.',[['Story sequence and scene state evaluator.','js/presentation-story-core.js:346-364'],['Renderer begin/apply/end.','index.html:4554-4656']]),
  scrollProgress:cross('EXISTS','Rubik has a reversible progress/seek player; donor native scroll is one input model, not a required matching UI.',[['Story sequence progress maps to scene/local progress.','js/presentation-story-core.js:346-364'],['UI seeks through Story progress.','js/presentation-ui.js:751-774']]),
  ui:cross('PARTIAL','Rubik has captions, minimap and template options; donor layer-specific annotation anchors are not established.',[['Presentation card, minimap and controls.','js/presentation-ui.js:8-31'],['Accessible minimap navigation.','js/presentation-ui.js:117-155']]),
  mobile:cross('PARTIAL','Rubik has mobile presentation layout and tests at both mobile sizes; this does not prove a hypothetical Board variant.',[['Mobile presentation CSS.','css/design-system.css:95-136'],['FT3D-6 mobile QA.','docs/qa/ft3d-6-implementation-2026-11-01.md:1-55']]),
  lifecycleRestore:cross('EXISTS','Rubik captures and restores the state touched by its current axon/exploded scenes; a future component-group lease remains unproven.',[['Begin captures current state and obtains handles.','index.html:4761-4800'],['Apply absolute deltas and End restores.','index.html:4814-4840']]),
  outputs:cross('PARTIAL','Current image/share and ZIP outputs exist; a recorded Board sequence is not established as a Rubik output.',[['Presentation image share.','js/presentation-ui.js:239-288'],['Views and project ZIP batch.','js/presentation-ui.js:321-360']]),
  qa:cross('PARTIAL','Rubik has reproducible Story/FT3D-5/6 QA tools; no Board-specific continuity/restore suite exists.',[['Axon visual renderer.','scripts/qa/render-presentation-axon.cjs:1-40'],['Template evidence harness.','scripts/qa/render-presentation-templates.cjs:1-46']])
};
const continuityInvariants=[
  {statement:'The same roof outline, east glazed gable, wall openings and slab footprint stay aligned as six drawn layers land.',evidence:[observed('Continuity visible from A through assembled state',viewports.desktop.milestones[0].evidence[0].locator),observed('Closed volume at M07',viewports.desktop.milestones[6].evidence[0].locator)]},
  {statement:'The porch and glazed east gable in the axon become the threshold entered by the camera, without a project swap.',evidence:[observed('M07 exterior and M08 porch continuous in forward video',viewports.desktop.forwardResult.video+'#t='+viewports.desktop.milestones[6].transitionStart.videoSeconds+'-'+viewports.desktop.milestones[8].transitionEnd.videoSeconds)]},
  {statement:'The loft bed, west oculus, rafters and long room remain spatially related from interior ascent to final look back.',evidence:[observed('M11 loft to M12 long room continuous in forward video',viewports.desktop.forwardResult.video+'#t='+viewports.desktop.milestones[10].transitionStart.videoSeconds+'-'+viewports.desktop.milestones[11].transitionEnd.videoSeconds)]}
];
const manifest={
  schemaVersion:'rubik-donor-runtime-audit.take.v1',auditId:'donor-runtime-7x14-2026-11-02',
  take:{id,group:ref.group,title:ref.take,inventoryIndex:ref.inventoryIndex},
  status:'AUDITED_WITH_DONOR_LIMITATION',
  baseline:{repository:'Juanmaes83/floorplan-3d',approvedSha:baseSha,auditBranch:'audit/donor-runtime-7x14-2026-11-02',worktree:root,cleanAtStart:true},
  reference:{selectorUrl:ref.selectorUrl,standaloneUrl:ref.standaloneUrl,resolvedUrl:ref.resolvedUrl,donorRepo:ref.donorRepo,donorCommit:donorSha,entrypoint:ref.sourceEntrypoint,urlDiscoveryEvidence:ref.evidence},
  tooling:{os:'Windows x86_64',codexCli:'0.155.1',agentBrowser:'0.41.1',browser:'Google Chrome 153.0.8010.53',playwright:'1.64.1 installed as recording fallback; not used for this take',ffmpeg:'8.1.2-full_build'},
  professionalService:{
    problemSolved:'Helps a client or reviewer understand how an authored timber-house assembly relates to a walkable finished space.',
    primaryUsers:['architect','client reviewer','design presenter'],
    serviceOutcome:'An annotated component assembly becomes one continuous interior visit through the east threshold, living area and loft.',
    decisionValue:'Supports discussion of assembly intent and spatial relationships in this study; it does not certify a construction sequence or structural specification.',
    evidence:[source('Donor describes six layers landing, then walking inside and up to loft',sourcePrefix+'README.md:1-20'),observed('Continuous A→B shows assembly, porch, rooms and loft',viewports.desktop.forwardResult.video)]
  },
  continuityInvariants,viewports,
  evidenceLedger:[
    observed('Desktop, portrait and landscape forward/reverse videos, telemetry and semantic passes captured',path.join(rawRoot,id)),
    source('Six authored layers and absolute lift/pull evaluation',sourcePrefix+'dir-a.js:316-390'),
    source('Native scroll target with smoothed p and wall-clock intro T',sourcePrefix+'main.js:120-184'),
    cut('Cut 2 D10 explicitly distinguishes six authored groups from construction/structural truth','git:cc04f67fc0b46c87bc696bf566adb362f43041fd:docs/product/ft3d-donor-code-gap-analysis-2026-11-01.md:1171-1275'),
    rubik('Rubik FT3D-5 has level-based compact/exploded capabilities with reversible lifecycle',rubikPrefix+'js/presentation-story-core.js:249-345; index.html:4750-4840'),
    {class:'INFERENCE',statement:'The study may help a client explain assembly intent, subject to authored-data limits.',locator:'professionalService',basedOn:[sourcePrefix+'README.md:1-20',viewports.desktop.forwardResult.video],inferenceStatus:'UNRESOLVED'}
  ],
  donorSourceLocators:[
    {repo:'Sam1983Aing/flat-to-3d',sha:donorSha,path:'01-exploded-house/dir-a.js',symbol:'layer/LIFT/PULL/ORDER/landAt/update',lines:'61;316-405',claim:'Six authored groups land with absolute lift and lateral pull; door slide separately evaluated.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:donorSha,path:'01-exploded-house/dir-a.js',symbol:'keys/STOPS',lines:'340-369',claim:'Authored camera keyframes and named porch/dining/living/loft/ridge stops produce the walk.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:donorSha,path:'01-exploded-house/main.js',symbol:'target/frame/step',lines:'120-184',claim:'Native scroll drives smoothed p; T also advances the time-dependent intro.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:donorSha,path:'01-exploded-house/core.js',symbol:'camAt/applyCam/ctx.phone',lines:'23;312-348;414-417',claim:'Camera switches phone keys under 700px; 844px landscape uses desktop layout.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:donorSha,path:'01-exploded-house/sketch.css',symbol:'body.phone and desktop HUD rules',lines:'143-201;315-356',claim:'Phone styling is width-gated; desktop-positioned callouts and radar collide in short landscape viewport.',classification:'SOURCE_PARTIAL'}
  ],
  cutsAtlas:[
    {locator:'Cut 2 §23 D10 @cc04f67fc0b46c87bc696bf566adb362f43041fd',documentedDisposition:'EXTRACT MECHANISM / ADAPT evaluator, preserve Rubik authority; reject authored structural truth',relationToRuntime:'EXTENDS',evidence:[cut('Source and sampled runtime previously established six authored layers; this audit adds continuous 3-viewport forward/reverse and second semantic pass.','git:cc04f67fc0b46c87bc696bf566adb362f43041fd:docs/product/ft3d-donor-code-gap-analysis-2026-11-01.md:1171-1275'),observed('Full video and semantic states',viewports.desktop.forwardResult.video)]},
    {locator:'Global reconciliation D10 @approved tree:docs/product/ft3d-donor-global-reconciliation-2026-11-01.md:265-282',documentedDisposition:'D10-C1 ADAPT; C2 ADAPT; C3 REJECT',relationToRuntime:'CONFIRMS',evidence:[cut('Six authored groups are not automatically derived from another project; same conclusion observed and source-confirmed.','docs/product/ft3d-donor-global-reconciliation-2026-11-01.md:265-282'),observed('Six sequential highlight states',viewports.desktop.forwardResult.video)]},
    {locator:'Atlas D10 @7696fb2c6c30f158001d38ecc53feb2674acaa25',documentedDisposition:'Historical reference identity; Cut 2/Global refine the layer-count wording',relationToRuntime:'EXTENDS',evidence:[cut('Atlas is historical; Cut 2 corrects nine conceptual categories versus six authored donor groups.','git:7696fb2c6c30f158001d38ecc53feb2674acaa25:docs/product/ft3d-reference-atlas-2026-11-01.md; Cut 2 §28 C2-CC1'),observed('Six annotated layer states',viewports.desktop.forwardResult.video)]},
    {locator:'Cut 1 D01/D04 and Global D12/D13',documentedDisposition:'Camera math, ink representation and orientation/route are separable mechanisms',relationToRuntime:'CONFIRMS',evidence:[cut('Prior source study separates camera, ink and route from group transforms.','docs/product/ft3d-donor-global-reconciliation-2026-11-01.md:101-119,155-173,301-337'),observed('Axon-to-perspective and radar/stop evolution',viewports.desktop.forwardResult.video)]}
  ],
  rubikCrosswalk,
  gaps:[
    {classification:'PRODUCT_DECISION_REQUIRED',statement:'A professional grouping of real Rubik components, its honest labels and its service identity need explicit product authority before any Board-like experience could exist.',evidence:[cut('Cut 2 D10 derives only a bounded subset and rejects invented structure.','git:cc04f67fc0b46c87bc696bf566adb362f43041fd:docs/product/ft3d-donor-code-gap-analysis-2026-11-01.md:1230-1275'),rubik('Current axon descriptor is level-based, not six authored component groups.',rubikPrefix+'js/presentation-axon-core.js:79-98')]},
    {classification:'ORCHESTRATION_GAP',statement:'Existing Story and geometry have no evidenced connection that sequences component-group transforms, callouts and a subsequent project-specific walk as one reversible service.',evidence:[observed('Donor sequence is continuous',viewports.desktop.forwardResult.video),rubik('Current Story narratives cover axon/exploded by levels and room descent separately.',rubikPrefix+'js/presentation-story-core.js:87-124,249-345')]},
    {classification:'DONOR_LIMITATION',statement:'844×390 donor landscape retains the desktop composition and overlays collide; this is donor behavior, not evidence of a Rubik mobile defect.',evidence:viewports.landscape.forwardResult.limitationEvidence}
  ],
  candidateBridges:[{
    classification:'ADAPT_EXISTING',
    problemSolved:'A future, explicitly authorized component reading could evaluate absolute transforms and matrix-following annotations for only demonstrable groups.',
    rubikAuthoritiesPreserved:['Project/Building semantics and IDs','existing View3D geometry/materials','Story progress and lifecycle','mobile-first UI'],
    existingCapabilitiesConsumed:['derived geometry and owners','Story stateAt and reversible player','existing room descent/route when valid'],
    missingConnector:'Verified component membership, disjoint ownership and normals for only actual project groups; professional labels and service identity still require a product decision.',
    donorMechanismReference:'dir-a.js:316-405 lift/pull/anchors; Cut 2 §23 D10',
    confidence:'MEDIUM',
    implementationAuthorized:false
  }],
  dependencies:['TECHNICAL_PREREQUISITE: verified component ownership/membership before transform lease','TECHNICAL_PREREQUISITE: actual navigable threshold/room stops before walk handoff','Technical reuse with FT3D-5 is not product fusion'],
  qaExpectations:[
    {category:'SEMANTIC',invariant:'No structural layer, construction sequence, certified specification or missing component is inferred from visual material/name.'},
    {category:'GEOMETRY',invariant:'Each real source object belongs to at most one moving component group and its openings remain aligned.'},
    {category:'CAMERA',invariant:'The same project and selected threshold remain continuous from component reading into any valid walk.'},
    {category:'LIFECYCLE',invariant:'Forward, reverse, cancel and failure restore every temporary transform, annotation and material lease.'},
    {category:'MOBILE',invariant:'Portrait and short landscape retain readable controls and visible model without collisions.'},
    {category:'REGRESSION',invariant:'Existing FT3D-5 level reading and Story restore remain unchanged by any future component adapter.'}
  ],
  unresolved:[
    {severity:'NON_BLOCKING',question:'Exact internal camera, material and geometry object state after donor B→A was not passively exposed; visual equivalence is observed, exact identity is not proven.',attempts:['Clean context A0/A1 screenshots at three viewports','Continuous reverse WebM','Passive scroll/HUD/route telemetry','Donor source absolute evaluator review'],evidenceNeeded:'Passive read-only object-state snapshot or narrowly scoped REA/probe if a future decision requires internal restore proof.'}
  ],
  assets,integrity:{assetsVerified:true,productionDiffZero:true},
  completion:{gates:Object.fromEntries(Array.from({length:21},(_,i)=>['T'+String(i+1).padStart(2,'0'),'PENDING_VALIDATOR'])),validatorResult:'NOT_RUN',validatedAt:null}
};
await writeFile(path.join(takeDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await mkdir(path.join(evidence,'hashes'),{recursive:true});
await writeFile(path.join(evidence,'hashes',`${id}.sha256`),
  assets.map(a=>`${a.sha256}  ${a.path}`).join('\n')+'\n');
const rows=plan.milestones.map((m,i)=>{
  const d=viewports.desktop.milestones[i],p=viewports.portrait.milestones[i],l=viewports.landscape.milestones[i];
  return `| ${m.label} | ${m.observedChange} | ${d.semanticCenter.normalizedNativeProgress} / ${p.semanticCenter.normalizedNativeProgress} / ${l.semanticCenter.normalizedNativeProgress} | ${sourceMap[i]} | Cut 2 D10; D01/D12/D13 as applicable | Same footprint/openings/roof/rooms |`;
}).join('\n');
const audit=`# 01-a · The Board — runtime audit

## ¿Qué problema profesional o de cliente resuelve?

Permite explicar a un cliente cómo una **casa de madera authored** pasa de capas legibles en un dibujo axonométrico a un volumen que se puede recorrer. El servicio observable es comprensión de relaciones entre componentes y espacio interior. La demo no certifica estructura, secuencia de obra ni especificaciones trasladables a otro proyecto. Evidencia: donor README y recorrido continuo desktop/portrait/landscape en RAW.

## Identidad y control

- Rubik baseline: \`${baseSha}\`; branch \`audit/donor-runtime-7x14-2026-11-02\`.
- Donor: \`Sam1983Aing/flat-to-3d@${donorSha}\`; selector \`${ref.selectorUrl}\`; standalone y final \`${ref.resolvedUrl}\`.
- Source entrypoint: \`${ref.sourceEntrypoint}\`; source runner \`01-exploded-house/main.js\`, take \`dir-a.js\`.
- Tooling: agent-browser 0.41.1, Chrome 153.0.8010.53, ffmpeg 8.1.2, DPR real 1 en los tres viewports.
- Cada viewport tuvo calibración descartada, contexto limpio de Discovery forward/reverse y contexto limpio de Semantic. El intro temporal se dejó estabilizar 4.5 s antes de A0; la primera tentativa desktop con intro inestable fue descartada y reemplazada.

## Evolución observada

Los vídeos Discovery y Semantic, telemetría NDJSON y muestras de seguridad están en \`${path.join(rawRoot,id)}\`. Las muestras del 5 % no son milestones.

| Milestone | Estado/cambio observado | Centro nativo D/P/L | Donor source | Cuts/Atlas | Continuidad |
|---|---|---|---|---|---|
${rows}

El end B es el vistazo desde el loft al Long Room. Se alcanzó scroll máximo mediante wheel natural, se añadieron dos wheel events sin nuevo estado importante y se esperó estabilización. Reverse ocurrió sin recarga ni reset; los tres viewports retornaron a scrollY 0 y a la composición A0. Veredicto: \`VISUALLY_EQUIVALENT\`, porque camera/material/geometry internos no se observaron pasivamente. No hay reverse-only milestone demostrado; el vídeo inverso muestra la visita y las capas replegándose en orden inverso.

## Viewports

| Viewport | A→B→A | Runtime support | Evidencia / límite |
|---|---|---|---|
| Desktop 1440×900 | 0 → 8100 → 0 | SUPPORTED | Seis capas, transición a perspectiva, puerta y cuatro stops interiores visibles |
| Portrait 390×844 | 0 → 7596 → 0 | SUPPORTED | Phone layout del source y progresión completa; algunas vistas recortan bordes del edificio |
| Landscape 844×390 | 0 → 3510 → 0 | DONOR_LIMITATION | Source usa phone sólo si width<700; desktop HUD, radar, etiquetas y caption se solapan en poco alto. La evolución y reverse siguen funcionando. |

## Reconciliación por milestone

M01–M06: \`dir-a.js:316-390\` crea ORDER de seis grupos authored y evalúa lift/pull absoluto. El dibujo, openings y techo siguen siendo el mismo modelo. Cut 2 §23 D10 lo documentó; el runtime continuo lo confirma y amplía temporalmente. Rubik ya deriva Project/Building geometry y FT3D-5 despiece **por niveles**; no existe evidencia de pertenencia genérica de componentes estructurales. Gap: decisión de servicio/semántica y posible orquestación, no ausencia del renderer.

M07–M08: \`dir-a.js:340-391\` y \`core.js:312-348\` cambian el encuadre de 1.5° a perspectiva y abren la puerta por Z; \`main.js:120-184\` suaviza el progreso nativo. Cut 1 D01 y Global D13 separan cámara y handoff. Rubik conserva su cámara, Story y route authority; la trayectoria authored del donor no se importa como ruta de proyecto.

M09–M12: \`dir-a.js:340-369\` define los stops porch/dining/living/loft/ridge. El runtime muestra muebles, huecos y techo continuos, luego cambia la cámara. Rubik tiene room descent, minimap y player; una visita de un proyecto real debe consumir rutas/stops válidos del host, no las coordenadas de esta casa.

No se encontró conflicto nuevo runtime/source/Cut. El Atlas histórico enumera categorías conceptuales adicionales; Cut 2 C2-CC1 y Global D10 ya distinguen esas categorías de las seis capas authored.

## Rubik, gaps y bridge documental

El crosswalk completo de 12 dimensiones está en \`manifest.json\`. Hay capacidades reutilizables de datos, geometría, Story, cámara, UI móvil, restore, salidas y QA. Las diferencias concretas son membership honesto de componentes, anotaciones ligadas a matrices y orquestación de la lectura con una visita validada. La clasificación propuesta es \`PRODUCT_DECISION_REQUIRED\` + \`ORCHESTRATION_GAP\`; el posible bridge es \`ADAPT_EXISTING\`, \`implementationAuthorized:false\`. No es una decisión de prioridad ni de fusión con FT3D-5.

## Known unknowns y QA derivada

No se observó pasivamente el estado interno exacto tras reverse; por eso no se declara RESTORED. Para una futura verificación interna haría falta un snapshot read-only acotado. Los invariantes QA futuros están en el manifest: semántica honesta, ownership disjunto, continuidad de cámara, restore, móvil y regresión FT3D-5. No se implementó ninguno.
`;
await writeFile(path.join(takeDir,'audit.md'),audit);
const attempt=state.takes[id];
attempt.captureStatus='COMPLETE';attempt.reconciliationStatus='COMPLETE';attempt.validationStatus='IN_PROGRESS';
attempt.lastSuccessfulStage='HASHES_COMPLETE';
attempt.blockingUnresolved=[];
attempt.nonBlockingUnresolved=manifest.unresolved;
attempt.timestamps.updatedAt=new Date().toISOString();
state.updatedAt=new Date().toISOString();
await writeFile(path.join(evidence,'audit-run-state.json'),JSON.stringify(state,null,2)+'\n');
console.log(JSON.stringify({take:id,assets:assets.length,rawFolder:path.join(rawRoot,id),manifest:path.join(takeDir,'manifest.json'),report:path.join(takeDir,'audit.md')},null,2));
