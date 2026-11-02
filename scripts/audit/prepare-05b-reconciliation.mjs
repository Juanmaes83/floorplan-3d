import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const ev=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const id='05-b-1-1-site-sheet',dir=path.join(ev,'takes',id);
const raw=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02',id);
const sha='d7b9b69753d3af679535ee56695a05c8d955c3c6';
const donor=`Sam1983Aing/flat-to-3d@${sha}:05-schedule-build/`;
const rubik='Juanmaes83/floorplan-3d@0f9c6ead9732901681498efec326d1ca92e42ffe:';
const cut='docs/product/evidence/donor-cuts-2026-11-01/cut4-d16-d17-d18.md';
const atlas='Juanmaes83/floorplan-3d@7696fb2c6c30f158001d38ecc53feb2674acaa25:docs/product/ft3d-reference-atlas-2026-11-01.md';
const global='docs/product/ft3d-donor-global-reconciliation-2026-11-01.md';
const O=(statement,locator)=>({class:'OBSERVED_RUNTIME',statement,locator});
const S=(statement,locator)=>({class:'DONOR_SOURCE',statement,locator:donor+locator});
const C=(statement,locator)=>({class:'CUT_ATLAS',statement,locator});
const R=(statement,locator)=>({class:'RUBIK_CURRENT',statement,locator:rubik+locator});
const d=(vp,name)=>path.join(raw,vp,`${vp}-${name}`);
const s=(vp,name)=>path.join(raw,vp,...(vp==='desktop'?['semantic-correction-1']:vp==='portrait'?['semantic-correction-2']:[]),`${vp}-${name}`);
const plan=JSON.parse(await readFile(path.join(dir,'semantic-plan.json'),'utf8'));
const prior=JSON.parse(await readFile(path.join(ev,'takes/05-a-the-programme/reconciliation.json'),'utf8'));
const sourceStages=[
  'house.js:9-24,618-640,1416-1470; view.js:630-776,914-963',
  'house.js:9-24,618-640,1416-1470; view.js:285-329,730-776',
  'house.js:9-24,618-640,1416-1470; view.js:630-776',
  'house.js:618-640,1416-1470; view.js:285-329',
  'house.js:618-640,1416-1470; view.js:730-776',
  'house.js:618-640,1416-1470; view.js:730-776',
  'house.js:618-640,1416-1470; view.js:730-776',
  'house.js:618-640,1416-1470; view.js:730-776',
  'house.js:618-640,1416-1470; view.js:730-776',
  'house.js:618-640,1416-1470; view.js:730-776',
  'view.js:127-130,285-329,491-500,730-776',
  'view.js:285-329,491-500,730-776,951-963'
];
const transitions=plan.milestones.map((m,i)=>{
  const p=m.targetProgress;
  return [Math.max(0,+(p-(i===10?.012:.025)).toFixed(4)),p,Math.min(1,+(p+(i===10?.012:.025)).toFixed(4))];
});
const continuity=[
  'The orange cursor and excavation belong to the same printed foundation footprint.',
  'Excavation occurs inside that footprint; the sheet remains under it.',
  'Footings and slab match the plan geometry underneath.',
  'Portal frames rise from that slab; future wall and roof positions remain ghosted.',
  'Mezzanine and stair fit within the same frames.',
  'Wall cassettes fill the same frame while ghost outlines recede.',
  'Roof cassettes close the same shell; the plan stays visible on the ground.',
  'Windows and doors occupy openings in that shell.',
  'Finishes cover the same shell while the week cursor advances.',
  'Furniture and handover belong to the same completed house.',
  'The same completed house remains above the programme when the camera returns overhead.',
  'At exact week 14 the same overhead house and sheet receive the completion HUD.'
];
const crosswalk=structuredClone(prior.rubikCrosswalk);
crosswalk.representation={status:'PARTIAL',claim:'Rubik View3D and Story can present current Building geometry. Donor B prints a fixed foundation plan and programme into one ground CanvasTexture while construction geometry rises above it; no current Rubik project plan/programme-to-ground-sheet binding is established.',evidence:[R('Current Building and Story view.','js/building-ui.js:36-95; js/presentation-story-core.js:254-364'),S('Cached base and dynamic sheet texture.','view.js:630-776')]};
crosswalk.camera={status:'PARTIAL',claim:'Rubik owns Story camera/route mechanisms. Donor B authors top→b2→b3→top by week; the automatic five-stop interior tour is not the canonical B route.',evidence:[R('Story route and camera authorities.','js/presentation-story-core.js:111-170; js/presentation-route.js:1-156'),S('B camera thresholds and auto shot.','view.js:285-329')]};
crosswalk.transition={status:'PARTIAL',claim:'Rubik Story seeks absolute progress. Donor B couples staged pieces, a dynamic ground-sheet overlay and an authored camera trajectory to one virtual week.',evidence:[R('Story absolute sequence and seek.','js/presentation-story-core.js:111-170,346-364'),S('Sheet update and camera mapping.','view.js:285-329,730-776,951-963')]};
crosswalk.ui={status:'PARTIAL',claim:'Rubik has presentation controls. Donor B uses an on-site drawing/programme plus authored phase HUD, weekday dates and percent labels; these are illustration, not professional schedule truth.',evidence:[R('Presentation controls.','js/presentation-ui.js:8-31,613-774'),S('Sheet, HUD and fixed PHASES.','view.js:491-500,630-776; house.js:9-24'),C('D18 distinguishes fixed programme from planning authority.',`${cut}:210-305`)]};
crosswalk.mobile={status:'PARTIAL',claim:'Rubik has responsive presentation paths. Donor B crops the top toolbar and on-site sheet at 390×844; at 844×390 the phase and date cards cover much of the sheet.',evidence:[R('Rubik responsive presentation and mobile QA.','index.html:442-448; docs/qa/ft3d-6-implementation-2026-11-01.md:1-55'),O('Portrait completed sheet crop.',s('portrait','forward-m12-overhead-completion-sheet.png')),O('Landscape HUD overlay.',s('landscape','forward-m12-overhead-completion-sheet.png'))]};
crosswalk.lifecycleRestore={status:'EXISTS',claim:'Rubik Story has lifecycle restore. Donor B natural reverse returns virtual week 0, SHOT top, same route, native scroll and a visually equivalent A0 site sheet; hidden render-resource identity is NOT_OBSERVED.',evidence:[R('Story cleanup authority.','index.html:4615-4703'),O('B natural reverse and A1.',d('desktop','restored-start.png'))]};
crosswalk.outputs={status:'EXISTS',claim:'Rubik image/share and economic outputs exist. Donor B shows a programme on the ground but no verified project plan, build schedule or site-sheet export.',evidence:[R('Presentation outputs.','js/presentation-ui.js:239-288,321-360'),C('D18 has no verified schedule export or execution authority.',`${cut}:210-305`)]};
const config={
  schemaVersion:'rubik-donor-runtime-audit.reconciliation.v1',status:'AUDITED_WITH_DONOR_LIMITATION',
  semanticRun:{desktop:'semantic-correction-1',portrait:'semantic-correction-2'},
  progressModel:{desktop:'VIRTUAL_SCROLL',portrait:'VIRTUAL_SCROLL',landscape:'VIRTUAL_SCROLL'},
  transitions,milestoneSources:sourceStages.map(x=>donor+x),continuity,
  viewportSupport:{desktop:'SUPPORTED',portrait:'DONOR_LIMITATION',landscape:'DONOR_LIMITATION'},
  viewportEvidence:{
    desktop:[O('Fixed site plan and programme remain legible under the staged house.',s('desktop','forward-m07-roof-assembly.png'))],
    portrait:[O('Top toolbar and sheet are cropped; HUD overlaps the drawing at 390×844.',s('portrait','forward-m12-overhead-completion-sheet.png')),S('Full-viewport fixed stage and limited breakpoint retain horizontal controls.','sketch.css:15-25,59-80,536-560')],
    landscape:[O('Phase and date cards obscure much of the sheet at 844×390.',s('landscape','forward-m12-overhead-completion-sheet.png')),S('Fixed HUD card positions remain active.','sketch.css:164-204,450-453,536-560')]
  },
  endDemonstration:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'Natural wheel reached virtual week 14 and an overhead completed house above the printed site sheet; further wheel input revealed no later canonical transformation. Native scrollY stayed zero. Room tabs are optional and were not part of the automatic B route.'])),
  restoreVerdict:{desktop:'VISUALLY_EQUIVALENT',portrait:'VISUALLY_EQUIVALENT',landscape:'VISUALLY_EQUIVALENT'},
  restoreReview:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'Natural reverse returned week 0, SHOT top, same ?dir=b route and native scrollY=0. A0/A1 screenshots are visually equivalent. Hidden WebGL resource identity and exact camera pose history are NOT_OBSERVED.'])),
  reverseOnlyMilestones:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'The late-phase Site Mobilisation fallback reappears while unwinding from exact week 14; the camera returns through b3 and b2 to top as the same house pieces recede. No separate reverse-only geometry or phase was established.'])),
  selectedKeyframes:{
    desktop:['desktop-entry-week7.png','desktop-start.png','semantic-correction-1/desktop-forward-m01-paper-foundation-start.png','semantic-correction-1/desktop-forward-m04-portal-frames.png','semantic-correction-1/desktop-forward-m07-roof-assembly.png','semantic-correction-1/desktop-forward-m11-late-phase-gap.png','semantic-correction-1/desktop-forward-m12-overhead-completion-sheet.png','desktop-end.png','desktop-restored-start.png'],
    portrait:['portrait-start.png','semantic-correction-2/portrait-forward-m04-portal-frames.png','semantic-correction-2/portrait-forward-m11-late-phase-gap.png','semantic-correction-2/portrait-forward-m12-overhead-completion-sheet.png','portrait-end.png','portrait-restored-start.png'],
    landscape:['landscape-start.png','landscape-forward-m04-portal-frames.png','landscape-forward-m11-late-phase-gap.png','landscape-forward-m12-overhead-completion-sheet.png','landscape-end.png','landscape-restored-start.png']
  },
  professionalService:{problemSolved:'Explains how one planned building emerges from a foundation drawing and construction programme on its actual site footprint.',primaryUsers:['architect','client','site coordinator'],serviceOutcome:'A viewer follows the same authored week across printed plan, programme, staged geometry and camera, ending with the complete house over its drawing.',decisionValue:'Useful for spatial explanation of an illustrative build sequence; the printed dates, phase membership and completion percentages are fixed demo data, not verified project planning or execution.',evidence:[O('Desktop continuous wheel 0→14 over the site sheet.',d('desktop','forward-discovery.webm')),S('Cached base sheet and changing programme cursor share the week with house update.','view.js:630-776,951-963; house.js:1416-1470'),C('D18 limits planning claims.',`${cut}:210-305`)]},
  continuityInvariants:[
    {statement:'Foundation plan, slab and rising house share one footprint.',evidence:[O('Paper foundation and portal frames.',s('desktop','forward-m01-paper-foundation-start.png')),O('Frame after slab.',s('desktop','forward-m04-portal-frames.png')),S('One house and B sheet texture.','house.js:618-640; view.js:630-776')]},
    {statement:'The same virtual week drives construction pieces and printed programme cursor.',evidence:[S('House update and sheet overlay.','house.js:1416-1470; view.js:730-776,951-963'),O('Roof at week about 9.',s('desktop','forward-m07-roof-assembly.png'))]},
    {statement:'Camera shifts top→b2→b3→top around the same building rather than swapping to another model.',evidence:[S('B auto-shot thresholds.','view.js:285-329'),O('Final overhead house.',s('desktop','forward-m12-overhead-completion-sheet.png'))]},
    {statement:'Reverse removes staged pieces and restores the initial drawing and route visually.',evidence:[O('A0.',d('desktop','start.png')),O('A1.',d('desktop','restored-start.png')),O('Continuous reverse.',d('desktop','reverse-discovery.webm'))]}
  ],
  evidenceLedger:[
    O('Canonical ?dir=b enters at week 7; natural wheel prelude reaches week 0 without reload.',d('desktop','entry-week7.png')),
    O('Three independent Discovery passes record 0→14→0 and 21 samples each, with native scrollY zero.',d('desktop','forward-discovery.webm')),
    O('Selected three-viewport semantic passes each capture twelve milestones and exact week-14 Practical Completion.',s('desktop','forward-semantic.webm')),
    O('Desktop and portrait original semantic terminal attempts stopped just below week 14; portrait correction-1 failed; all attempts are retained.',path.join(raw,'portrait/semantic-correction-1/portrait-forward-semantic.webm')),
    O('At 13.5–14 the nearly complete house displays Site Mobilisation before the exact completion branch.',s('desktop','forward-m11-late-phase-gap.png')),
    O('Natural reverse returns to visually equivalent A0 in three viewports.',d('desktop','restored-start.png')),
    S('B sheet is a cached base plus dynamic week overlay mapped as CanvasTexture.','view.js:184-190,630-776,951-963'),
    S('B camera auto-shot uses top/b2/b3/top, while phase-piece visibility uses the same week.','view.js:285-329; house.js:1416-1470'),
    C('Cut4 D18 and Global separate shared-time illustration from planning authority.',`${cut}:210-305; ${global}:411-430`),
    R('Rubik Building, Story and C1–C4 remain separate authorities.','js/building-ui.js:36-95; js/presentation-story-core.js:254-364; js/quantity-schedule-core.js:1-40')
  ],
  donorSourceLocators:[
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/house.js',symbol:'PHASES/add/update',lines:'9-24,618-640,1416-1470',claim:'Fixed phases and manual phase membership drive the same house piece states.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/view.js',symbol:'ensureSheetBase/drawSheet/syncVisuals',lines:'630-776,951-963',claim:'B ground sheet is a cached plan plus dynamic programme overlay refreshed by virtual week.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/view.js',symbol:'autoShotForWeek/applyCamera',lines:'285-329',claim:'B camera follows top, b2, b3 and top thresholds; no automatic B interior tour.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/view.js',symbol:'renderHud/activePhases',lines:'127-130,491-500',claim:'At weeks 13.5–14 phase selection falls back to Site Mobilisation until exact T>=14 completion branch.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/view.js',symbol:'setTargetWeek/wheel/loop',lines:'783-790,914-937,987-1007',claim:'Natural wheel advances virtual week and reverse can return to week zero.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/sketch.css',symbol:'fixed stage/HUD/breakpoint',lines:'15-25,59-80,164-204,450-453,536-560',claim:'Fixed viewport HUD and narrow breakpoint align with portrait and landscape cropping/overlap.',classification:'SOURCE_PARTIAL'}
  ],
  cutsAtlas:[
    {locator:'Cut4 D18; Global D18; pinned Atlas 05',documentedDisposition:'Shared week governs illustrative programme and 3D; transport can be reused, while real calendar, dependencies and execution require separate authority.',relationToRuntime:'CONFIRMS',evidence:[C('D18 shared-time mechanism and limits.',`${cut}:210-305; ${global}:411-430`),O('House rises over week-driven programme.',s('desktop','forward-m07-roof-assembly.png'))]},
    {locator:'Cut4 D18; pinned Atlas 05',documentedDisposition:'D18 describes programme/3D mechanism. It does not establish the B ground-sheet continuity, B camera thresholds, late-phase HUD fallback or mobile layouts.',relationToRuntime:'EXTENDS',evidence:[C('Prior Cut/Atlas scope.',`${cut}:210-305; ${atlas}:150-155,189-194`),O('B sheet and final overhead.',s('desktop','forward-m12-overhead-completion-sheet.png'))]}
  ],
  rubikCrosswalk:crosswalk,
  gaps:[
    {classification:'INTEGRATION_GAP',statement:'A Rubik-specific on-site sheet would need an authorized plan geometry and element-to-work mapping; donor B is fixed to one house and PHASES array.',evidence:[S('Manual phase pieces and static sheet.', 'house.js:9-24,618-640; view.js:630-776'),R('Building is current geometry authority.','js/building-ui.js:36-95')]},
    {classification:'ORCHESTRATION_GAP',statement:'The sheet cursor, staged visibility and camera would need one Story-owned time state, while retaining separate planning provenance.',evidence:[S('Shared week updates sheet and scene.','view.js:951-963; house.js:1416-1470'),R('Story owns presentation seek.','js/presentation-story-core.js:254-364')]},
    {classification:'PRODUCT_DECISION_REQUIRED',statement:'A factual plan or execution sheet requires durable tasks, dates, dependencies, element membership and observed actual progress; donor data is illustrative.',evidence:[C('D18 professional domain limit.',`${cut}:210-305`),S('Fixed PHASES and week-driven HUD.','house.js:9-24; view.js:491-500')]},
    {classification:'DONOR_LIMITATION',statement:'Near-complete weeks 13.5–14 display Site Mobilisation before exact week 14, and narrow/landscape layouts crop or obscure the site sheet.',evidence:[O('Late-phase fallback.',s('desktop','forward-m11-late-phase-gap.png')),O('Portrait crop.',s('portrait','forward-m12-overhead-completion-sheet.png'))]}
  ],
  candidateBridges:[
    {classification:'REUSE_EXISTING',problemSolved:'Seek a deterministic visual time state.',rubikAuthoritiesPreserved:['Story transport','Story lifecycle'],existingCapabilitiesConsumed:['Story seek and playback'],missingConnector:'None for transport; schedule truth remains separate.',donorMechanismReference:'view.js setTargetWeek/wheel as reference only',confidence:'HIGH',implementationAuthorized:false},
    {classification:'ADAPT_EXISTING',problemSolved:'Present a project drawing and authorized schedule as one spatial site sheet.',rubikAuthoritiesPreserved:['Project/Building IDs','Story presentation owner','plan and output authorities'],existingCapabilitiesConsumed:['Building geometry','Story sequence','existing plan/output paths'],missingConnector:'Project plan projection, validated task-to-element mapping and a responsive sheet descriptor.',donorMechanismReference:'view.js ensureSheetBase/drawSheet, not its fixed house geometry or demo PHASES',confidence:'MEDIUM',implementationAuthorized:false},
    {classification:'DEFER',problemSolved:'Use factual planned and actual construction dates on a site sheet if product scope later requires it.',rubikAuthoritiesPreserved:['Project/Building','C1–C4 economics','Story transport'],existingCapabilitiesConsumed:['Building quantities','Story seek'],missingConnector:'Separate durable planning and execution contracts with provenance.',donorMechanismReference:'Fixed fourteen-week sheet as an illustrative reference only',confidence:'MEDIUM',implementationAuthorized:false}
  ],
  dependencies:['TECHNICAL_PREREQUISITE: authorized plan projection and stable Building element identity for any project-specific on-site sheet.','TECHNICAL_PREREQUISITE: validated element-to-task mapping and date provenance before a week is factual.','PRODUCT_CONTRACT_DECISION: illustrative construction story versus real planned/actual execution.','TECHNICAL_PREREQUISITE: Story owns presentation seek and restore; no duplicate timeline authority.'],
  qaExpectations:[
    {category:'SEMANTIC',invariant:'A printed programme distinguishes authored illustration, planned dates and actual execution.'},
    {category:'GEOMETRY',invariant:'Plan footprint, slab, frames and final house remain aligned to the same Building IDs.'},
    {category:'VISUAL',invariant:'Ground sheet base and dynamic week overlay remain legible under all construction stages.'},
    {category:'CAMERA',invariant:'B camera follows top→b2→b3→top and does not imply automatic interior tour.'},
    {category:'LIFECYCLE',invariant:'Natural forward and reverse restore week, camera mode, route, HUD and sheet presentation.'},
    {category:'MOBILE',invariant:'At 390×844 and 844×390 controls, phase HUD and site sheet do not crop or collide.'},
    {category:'ACCESSIBILITY',invariant:'The programme state and construction phase remain available without reading the texture.'},
    {category:'OUTPUT',invariant:'Any exported sheet identifies drawing, plan and date provenance.'},
    {category:'REGRESSION',invariant:'A late phase without an active PHASES row does not relabel the finished house Site Mobilisation.'}
  ],
  unresolved:[
    {severity:'NON_BLOCKING',question:'Hidden WebGL resource identity and exact camera pose history after reverse are not passively observable.',attempts:['three natural Discovery reverses','SHOT/week telemetry','A0/A1 visual comparison'],evidenceNeeded:'Narrow camera/resource inspection only if exact internal lifecycle identity becomes necessary.'},
    {severity:'NON_BLOCKING',question:'Whether a spatial site sheet provides enough professional value in Rubik remains a product decision.',attempts:['three-viewport runtime','pinned source','Cut4 D18 and Global','frozen Rubik crosswalk'],evidenceNeeded:'Human review after fourteen-take evidence set; no implementation authorized.'}
  ]
};
await writeFile(path.join(dir,'reconciliation.json'),JSON.stringify(config,null,2)+'\n');
const rows=plan.milestones.map((m,i)=>`| ${m.label} | ${m.observedChange} | ${transitions[i].join(' / ')} | ${sourceStages[i]} |`).join('\n');
const report=`# 05-b · 1:1 Site Sheet — runtime audit\n\n## Professional service\n\n${config.professionalService.problemSolved} ${config.professionalService.serviceOutcome} ${config.professionalService.decisionValue}\n\n## Capture and evolution\n\nPinned donor: \`${donor}\`. Frozen Rubik: \`${rubik}\`. Canonical URL: \`https://sam1983aing.github.io/flat-to-3d/05-schedule-build/index.html?dir=b\`. RAW: \`${raw}\`. Each viewport entered at virtual week 7, naturally wheeled to zero in the same context, then recorded continuous 0→14→0 Discovery. Independent semantic passes captured twelve milestones each; desktop correction-1 and portrait correction-2 are selected, preserving failed/short terminal attempts.\n\n| Milestone | Observed change | Approximate virtual transition start / center / end | Pinned source |\n|---|---|---|---|\n${rows}\n\nThe same foundation footprint remains visible as the house rises above a printed drawing and fixed fourteen-week programme. The camera moves top→b2→b3→top. At 13.5–14 the HUD falls back to Site Mobilisation until exact WK14 triggers Practical Completion. Room tabs are offered but the B canonical route does not automatically tour inside. Portrait crops the controls and sheet; landscape HUD cards obscure the sheet.\n\n## Reverse and lifecycle\n\nAll three natural reverses return week zero, SHOT top, same route and native scrollY zero. A0/A1 screenshots are visually equivalent; hidden WebGL resource identity and exact camera history are NOT_OBSERVED. The late-phase fallback also appears while reversing.\n\n## Source, Cuts and Rubik\n\nPinned \`view.js:630-776\` builds a cached ground sheet and updates a dynamic programme overlay from the virtual week; \`view.js:285-329\` controls the B camera. \`house.js:9-24,618-640,1416-1470\` supplies fixed phase assignments and piece appearance. Cut4 D18 and Global confirm shared-time illustration, but the B sheet continuity, camera thresholds, mobile limitations and late-phase fallback extend that prior scope. Rubik already owns Building geometry, Story seek/restore, presentation UI and economic C1–C4. The twelve-dimension crosswalk distinguishes those capabilities from a project plan projection, task membership and real planning authority. Candidate bridges are documentary and carry \`implementationAuthorized:false\`.\n\n## Unknowns\n\nInternal resource identity, exact reverse camera history and product suitability remain bounded non-blocking unknowns. Fixed donor dates, phases and percentages are not promoted to Rubik facts.\n`;
await writeFile(path.join(dir,'audit.md'),report);
console.log(JSON.stringify({id,status:config.status,milestones:plan.milestones.length},null,2));
