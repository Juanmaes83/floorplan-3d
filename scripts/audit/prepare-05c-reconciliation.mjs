import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const ev=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const id='05-c-site-camera',dir=path.join(ev,'takes',id),raw=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02',id);
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
const d=(vp,name)=>path.join(raw,vp,...(vp==='desktop'?['discovery-correction-1']:[]),`${vp}-${name}`);
const s=(vp,name)=>path.join(raw,vp,...(vp==='desktop'?['semantic-correction-1']:[]),`${vp}-${name}`);
const plan=JSON.parse(await readFile(path.join(dir,'semantic-plan.json'),'utf8'));
const prior=JSON.parse(await readFile(path.join(ev,'takes/05-a-the-programme/reconciliation.json'),'utf8'));
const targets=plan.milestones.map(m=>m.targetProgress);
const transitions=targets.map((p,i)=>[Math.max(0,+(p-(i>=10?.004:.025)).toFixed(4)),p,Math.min(1,+(p+(i>=10?.004:.025)).toFixed(4))]);
const sourceStages=plan.milestones.map((_,i)=>donor+(i<10?'house.js:9-24,618-640,1416-1470; view.js:165-177,316-329,597-625':'view.js:20-99,242-261,285-329,597-625,914-1007'));
const continuity=[
  'The site perimeter and early works remain under one site-camera frame.',
  'Excavation remains inside that fenced site.',
  'Foundations occupy the same excavated footprint.',
  'Timber frames rise from that same slab.',
  'Mezzanine and stair fit into those frames.',
  'Wall cassettes fill the same frame and openings.',
  'Roof closes the same timber shell.',
  'Glazing fills openings in that shell.',
  'Finishes attach to that house while the site camera remains oriented to it.',
  'Furniture is placed inside the finished shell.',
  'The path camera approaches the entrance of the same house.',
  'The entry view is within that entrance.',
  'The living area shares the visible stair and glazing.',
  'Kitchen and dining remain beneath the same mezzanine.',
  'The loft sits above the same living area and stair.',
  'The gallery overlooks that double-height living room and terrace.'
];
const crosswalk=structuredClone(prior.rubikCrosswalk);
crosswalk.materialsLight={status:'PARTIAL',claim:'Rubik already has a sun/hour control, directional light, shadow map and Story solar snapshot. Donor C computes time of day 7.3→18.4 from the illustrative virtual week and moves a sun with that hour; no current Rubik construction-week-to-sun authority is established.',evidence:[R('Current sun control and light application.','index.html:534,2551-2558,3758-3779'),R('Story solar snapshot phase.','js/presentation-story-core.js:178-239'),S('C time-of-day and sun placement.','view.js:165-177,316-329')]};
crosswalk.camera={status:'PARTIAL',claim:'Rubik Story already owns camera routes and presentation camera. Donor C uses one site camera, then a path approach at week 13.2 and an automatic five-stop interior spline from week 13.48.',evidence:[R('Current Story camera/route authorities.','js/presentation-story-core.js:111-170; js/presentation-route.js:1-156'),S('C camera poses, thresholds and tour keys.','view.js:20-99,242-261,285-329')]};
crosswalk.transition={status:'PARTIAL',claim:'Rubik Story can seek absolute presentation progress. Donor C orchestrates fixed phase-piece arrivals, synthetic date/time/sun and camera shot cam→path→inside from the same virtual week.',evidence:[R('Story absolute sequence and seek.','js/presentation-story-core.js:111-170,346-364'),S('Week drives C time, sun, camera and house.','view.js:285-329,914-1007; house.js:1416-1470')]};
crosswalk.ui={status:'PARTIAL',claim:'Rubik has presentation controls. Donor C displays an authored 14-week programme, synthetic date/time, percent and CRITICAL PATH label; none establish actual site telemetry, CPM or execution.',evidence:[R('Presentation controls and Story UI.','js/presentation-ui.js:8-31,613-774'),S('C clock and compact chart are drawn from virtual week.','view.js:334-430,597-625'),C('D18 limits date, CPM and execution claims.',`${cut}:210-305`)]};
crosswalk.mobile={status:'PARTIAL',claim:'Rubik has responsive presentation paths. Donor C crops toolbar/date and programme in portrait, while landscape week labels collide and the bottom programme covers much of the 3D.',evidence:[R('Current responsive presentation and QA.','index.html:442-448; docs/qa/ft3d-6-implementation-2026-11-01.md:1-55'),O('Portrait final scene.',d('portrait','end.png')),O('Landscape final scene.',d('landscape','end.png'))]};
crosswalk.lifecycleRestore={status:'EXISTS',claim:'Rubik Story has lifecycle restore. Donor C natural reverse returns week 0, SHOT cam, route and native scroll to their A0 values with visual equivalence; exact camera pose/resource identity remains NOT_OBSERVED.',evidence:[R('Current Story cleanup.','index.html:4615-4703'),O('C A1 after reverse.',d('desktop','restored-start.png'))]};
const config={
  schemaVersion:'rubik-donor-runtime-audit.reconciliation.v1',status:'AUDITED_WITH_DONOR_LIMITATION',
  discoveryRun:{desktop:'discovery-correction-1'},semanticRun:{desktop:'semantic-correction-1'},
  progressModel:{desktop:'VIRTUAL_SCROLL',portrait:'VIRTUAL_SCROLL',landscape:'VIRTUAL_SCROLL'},
  transitions,milestoneSources:sourceStages,continuity,
  viewportSupport:{desktop:'SUPPORTED',portrait:'DONOR_LIMITATION',landscape:'DONOR_LIMITATION'},
  viewportEvidence:{
    desktop:[O('Site camera, clock and programme advance with the same house.',s('desktop','forward-m07-roof.png'))],
    portrait:[O('At 390×844 the toolbar/date and programme are cropped, though the house remains visible.',d('portrait','end.png')),S('Fixed full-viewport C band and HUD with narrow breakpoint.','sketch.css:15-25,450-453,478-536,536-560')],
    landscape:[O('At 844×390 compact week labels collide and the band covers much of the house.',d('landscape','end.png')),S('Fixed bottom band persists at narrow height.','sketch.css:478-536,536-560')]
  },
  endDemonstration:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'Natural wheel reached virtual week 14 and final gallery overlook; further wheel input after settling revealed no later canonical state. Native scrollY stayed zero.'])),
  restoreVerdict:{desktop:'VISUALLY_EQUIVALENT',portrait:'VISUALLY_EQUIVALENT',landscape:'VISUALLY_EQUIVALENT'},
  restoreReview:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'Natural reverse returned virtual week 0, SHOT cam, same canonical route and scrollY=0. A0/A1 screenshots are visually equivalent. Exact camera pose history and hidden WebGL resource identity remain NOT_OBSERVED.'])),
  reverseOnlyMilestones:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'Gallery→loft→kitchen→living→entry retreats to the approach path, then site camera; finished layers, frame and ground work withdraw as week returns to zero. No independent reverse-only construction phase was found.'])),
  selectedKeyframes:{
    desktop:['discovery-correction-1/desktop-entry-week7.png','discovery-correction-1/desktop-start.png','semantic-correction-1/desktop-forward-m04-structure.png','semantic-correction-1/desktop-forward-m07-roof.png','semantic-correction-1/desktop-forward-m10-furniture-handover.png','semantic-correction-1/desktop-forward-m11-approach-path.png','semantic-correction-1/desktop-forward-m12-inside-entry.png','semantic-correction-1/desktop-forward-m16-inside-gallery-overlook.png','discovery-correction-1/desktop-end.png','discovery-correction-1/desktop-restored-start.png'],
    portrait:['portrait-start.png','portrait-forward-m07-roof.png','portrait-forward-m11-approach-path.png','portrait-forward-m16-inside-gallery-overlook.png','portrait-end.png','portrait-restored-start.png'],
    landscape:['landscape-start.png','landscape-forward-m07-roof.png','landscape-forward-m11-approach-path.png','landscape-forward-m16-inside-gallery-overlook.png','landscape-end.png','landscape-restored-start.png']
  },
  professionalService:{problemSolved:'Shows an illustrative construction sequence from a site-camera viewpoint while connecting visible build stages to a programme, a changing daylight clock and a final interior walk-through.',primaryUsers:['architect','client','site coordinator'],serviceOutcome:'A viewer can see how the same timber house rises over 14 authored weeks, approach it after handover and inspect five interior locations.',decisionValue:'Useful for communicating spatial consequences and a possible site presentation; the dates, clock, phase progress and CRITICAL PATH are synthetic demo displays, not actual site telemetry or certified work.',evidence:[O('Continuous C 0→14 Discovery from site to gallery.',d('desktop','forward-discovery.webm')),S('Fixed week maps to C sun/time, camera and house.','view.js:165-177,285-329,597-625; house.js:1416-1470'),C('D18 planning limits.',`${cut}:210-305`)]},
  continuityInvariants:[
    {statement:'The fenced site, slab, portal frames and finished shell belong to one house.',evidence:[O('Structure stage.',s('desktop','forward-m04-structure.png')),O('Completed exterior approach.',s('desktop','forward-m11-approach-path.png')),S('One phase-assigned house root.','house.js:618-640,1416-1470')]},
    {statement:'Date/time, compact chart and stage appearance share the same virtual week; they are not actual observations of site execution.',evidence:[S('C clock is derived from state.tod and week.','view.js:316-329,597-625'),C('D18 limits temporal authority.',`${cut}:210-305`),O('Site camera at roof stage.',s('desktop','forward-m07-roof.png'))]},
    {statement:'The path and five interior stops remain in the completed house seen from site camera.',evidence:[S('C camera poses and tour keys.','view.js:20-99,242-261,285-329'),O('Path exterior.',s('desktop','forward-m11-approach-path.png')),O('Final overlook.',s('desktop','forward-m16-inside-gallery-overlook.png'))]},
    {statement:'Reverse unwinds the same house and returns the initial site-camera view visually.',evidence:[O('A0.',d('desktop','start.png')),O('A1.',d('desktop','restored-start.png')),O('Continuous reverse.',d('desktop','reverse-discovery.webm'))]}
  ],
  evidenceLedger:[
    O('Canonical C enters at week 7 and naturally wheels to zero without reload in each selected Discovery.',d('desktop','entry-week7.png')),
    O('Three independent Discovery passes show week 0→14→0, with continuous forward/reverse video and telemetry.',d('desktop','forward-discovery.webm')),
    O('Selected semantic passes show ten construction phases, path approach and five interior stops.',s('desktop','forward-semantic.webm')),
    O('Desktop 10fps prelude encoder failed; initial desktop semantic gate wrongly required B terminal text. Both failed attempts remain RAW, and fresh 5fps corrections completed.',path.join(raw,'desktop/discovery-correction-1/discovery-summary.json')),
    O('Portrait crops controls/programme; landscape chart labels collide and band obscures 3D.',d('portrait','end.png')),
    S('C week drives synthetic date/time, sun placement, house update and camera mode.', 'view.js:165-177,285-329,597-625,914-1007; house.js:1416-1470'),
    C('Cut4 D18 and Global separate shared-week presentation from real planning/execution authority.',`${cut}:210-305; ${global}:411-430`),
    R('Rubik Building, Story, sun control and C1–C4 exist as current authorities.','js/building-ui.js:36-95; js/presentation-story-core.js:254-364; index.html:534,3758-3779; js/quantity-schedule-core.js:1-40')
  ],
  donorSourceLocators:[
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/house.js',symbol:'PHASES/add/update',lines:'9-24,618-640,1416-1470',claim:'Ten fixed authored phases govern one house and site piece appearances.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/view.js',symbol:'placeSun/updateSceneForWeek',lines:'165-177,316-329',claim:'C virtual week derives synthetic time of day 7.3→18.4 and positions sun/light.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/view.js',symbol:'CAM_POSES/autoShotForWeek/tour spline',lines:'20-99,242-261,285-329',claim:'C site camera switches cam→path at week 13.2→inside at 13.48, then follows five interior stops.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/view.js',symbol:'renderHud/programmeSVG',lines:'334-430,597-625',claim:'Compact authored Gantt and synthetic date/time HUD share the week.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/view.js',symbol:'setTargetWeek/wheel/loop',lines:'783-790,914-1007',claim:'Natural wheel drives reversible virtual week while native scroll is blocked.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/sketch.css',symbol:'C band and responsive rule',lines:'478-560',claim:'Fixed lower programme band contributes to observed narrow-screen obstruction.',classification:'SOURCE_PARTIAL'}
  ],
  cutsAtlas:[
    {locator:'Cut4 D18; Global D18; pinned Atlas 05',documentedDisposition:'Shared virtual week governs illustrative programme and 3D; real tasks, dates, dependencies and execution require separate authority.',relationToRuntime:'CONFIRMS',evidence:[C('D18 and Global shared-time mechanism with limits.',`${cut}:210-305; ${global}:411-430`),O('One week drives scene and lower programme.',s('desktop','forward-m07-roof.png'))]},
    {locator:'Cut4 D18; pinned Atlas 05',documentedDisposition:'Prior scope did not establish C-specific synthetic daylight clock, cam→path→inside choreography, three-viewport reverse or mobile clipping.',relationToRuntime:'EXTENDS',evidence:[C('Prior D18 and Atlas scope.',`${cut}:210-305; ${atlas}:150-155,189-194`),O('C approach and interior stop.',s('desktop','forward-m11-approach-path.png'))]}
  ],
  rubikCrosswalk:crosswalk,
  gaps:[
    {classification:'INTEGRATION_GAP',statement:'A Rubik project construction view would need authorized Building element-to-work membership; donor pieces and PHASES are fixed to one house.',evidence:[S('Manual phase membership.','house.js:9-24,618-640'),R('Current Building IDs.','js/building-ui.js:36-95')]},
    {classification:'ORCHESTRATION_GAP',statement:'Story could own one presentation cursor connecting current geometry, camera, programme and sunlight; donor maps all to an authored week without factual date provenance.',evidence:[S('Shared C week mapping.','view.js:285-329,597-625'),R('Story seek and Rubik sun control.','js/presentation-story-core.js:254-364; index.html:3758-3779')]},
    {classification:'PRODUCT_DECISION_REQUIRED',statement:'Actual site telemetry and construction planning need durable task, calendar, dependency, provenance and observed execution contracts; synthetic donor clock is insufficient.',evidence:[C('D18 professional limits.',`${cut}:210-305`),S('C time is deterministic function of illustrative week.','view.js:316-329')]},
    {classification:'DONOR_LIMITATION',statement:'Portrait clips toolbar/date/programme and landscape lower band obscures much of the scene; compact week labels collide.',evidence:[O('Portrait end.',d('portrait','end.png')),O('Landscape end.',d('landscape','end.png'))]}
  ],
  candidateBridges:[
    {classification:'REUSE_EXISTING',problemSolved:'Seek and restore a presentation time state.',rubikAuthoritiesPreserved:['Story transport','Story lifecycle'],existingCapabilitiesConsumed:['Story seek and playback'],missingConnector:'None for transport; factual schedule authority remains separate.',donorMechanismReference:'view.js wheel/setTargetWeek as reference',confidence:'HIGH',implementationAuthorized:false},
    {classification:'CONNECT_EXISTING',problemSolved:'Coordinate a site-facing camera and solar presentation with current Building geometry.',rubikAuthoritiesPreserved:['Building IDs','Story camera/route','Rubik sun/light owner'],existingCapabilitiesConsumed:['Story camera','sun/hour control','View3D rendering'],missingConnector:'Story-owned presentation descriptor binding authorized project state to camera and light without treating synthetic week as current date.',donorMechanismReference:'view.js C cam→path→inside and placeSun principle',confidence:'MEDIUM',implementationAuthorized:false},
    {classification:'DEFER',problemSolved:'Show factual planned and actual site progress if product scope calls for it.',rubikAuthoritiesPreserved:['Project/Building','C1–C4 economics','Story transport'],existingCapabilitiesConsumed:['Building quantities','Story seek'],missingConnector:'Separate durable planning and execution data contracts with provenance.',donorMechanismReference:'C clock, percent and CRITICAL PATH are illustrative only',confidence:'MEDIUM',implementationAuthorized:false}
  ],
  dependencies:['TECHNICAL_PREREQUISITE: stable Building IDs and authorized element-to-work membership for project-specific build stages.','TECHNICAL_PREREQUISITE: Story owns camera/light presentation and lifecycle restoration.','PRODUCT_CONTRACT_DECISION: illustrative site story versus factual planned/actual execution.','TECHNICAL_PREREQUISITE: date, time and sun labels need explicit provenance before use as professional telemetry.'],
  qaExpectations:[
    {category:'SEMANTIC',invariant:'Illustrative week, planned date, actual observation and clock are distinctly labeled and sourced.'},
    {category:'GEOMETRY',invariant:'Phase states preserve the same Building footprint, frame, openings and interior.'},
    {category:'VISUAL',invariant:'All ten construction phases, path and five interior stops are reproducible from absolute progress.'},
    {category:'CAMERA',invariant:'C goes cam→path→inside and reverse returns to cam without a residual stop.'},
    {category:'LIFECYCLE',invariant:'Week 0→14→0 restores route, HUD, camera, lighting and visibility.'},
    {category:'MOBILE',invariant:'390×844 and 844×390 keep camera view, date, week labels and controls readable.'},
    {category:'ACCESSIBILITY',invariant:'Construction phase and site-camera time are available without visual chart interpretation.'},
    {category:'OUTPUT',invariant:'Any site-camera output identifies the source and synthetic/actual status of dates and progress.'},
    {category:'REGRESSION',invariant:'A synthetic date or percent cannot write actual execution into Project or economic records.'}
  ],
  unresolved:[
    {severity:'NON_BLOCKING',question:'Exact camera pose history and WebGL resource identity after reverse remain passively unobserved.',attempts:['three natural C reverses','week/shot/tour telemetry','A0/A1 visual comparison'],evidenceNeeded:'Narrow renderer/camera inspection only if exact hidden lifecycle identity becomes necessary.'},
    {severity:'NON_BLOCKING',question:'Professional value of a site-camera story versus a real site-progress service requires human product review.',attempts:['three-viewport runtime','pinned C source','Cut4 D18 and Global','frozen Rubik crosswalk'],evidenceNeeded:'Review after the fourteen-reference audit; no implementation authorized.'}
  ]
};
await writeFile(path.join(dir,'reconciliation.json'),JSON.stringify(config,null,2)+'\n');
const rows=plan.milestones.map((m,i)=>`| ${m.label} | ${m.observedChange} | ${transitions[i].join(' / ')} | ${sourceStages[i]} |`).join('\n');
const report=`# 05-c · Site Camera — runtime audit\n\n## Professional service\n\n${config.professionalService.problemSolved} ${config.professionalService.serviceOutcome} ${config.professionalService.decisionValue}\n\n## Capture and evolution\n\nPinned donor: \`${donor}\`. Frozen Rubik: \`${rubik}\`. Canonical URL: \`https://sam1983aing.github.io/flat-to-3d/05-schedule-build/index.html?dir=c\`. RAW: \`${raw}\`. Each viewport entered at week 7, used a natural wheel prelude to week zero, then recorded continuous 0→14→0 Discovery. Separate calibration contexts were closed before capture. Desktop 10fps encoder and first semantic terminal-text gate failed; fresh 5fps correction-1 passes are selected, and failed attempts are preserved. Portrait and landscape original 5fps passes completed.\n\n| Milestone | Observed change | Approximate virtual transition start / center / end | Pinned source |\n|---|---|---|---|\n${rows}\n\nOne site and house progress through fixed phases. The synthetic clock moves from early morning to evening as the virtual week moves, with changing sun/shadow. C holds a site camera before an authored path approach and five interior stops. Portrait crops controls, clock and programme; landscape labels collide and the lower band obscures much of the model.\n\n## Reverse and lifecycle\n\nAll three natural reverses return virtual week zero, SHOT cam, same route and native scrollY zero. A0/A1 screenshots are visually equivalent. Exact hidden resource identity and camera pose history are NOT_OBSERVED.\n\n## Source, Cuts and Rubik\n\nPinned \`house.js\` fixes ten phases and manual piece memberships. \`view.js:165-177,285-329,597-625\` maps the same illustrative week to sun/time, site camera, path/interior route and compact programme. Cut4 D18 and Global confirm the shared-time presentation pattern and planning limits; C-specific clock, sun, path choreography and mobile/reverse observations extend them. Rubik already owns Building geometry, Story transport/camera/restore, sun/hour control and C1–C4 economic data. The crosswalk records connectors and separate domain decisions without promoting donor dates or percentages to project facts. Candidate bridges all have \`implementationAuthorized:false\`.\n\n## Unknowns\n\nExact camera/resource identity after reverse and the professional value of this presentation remain bounded non-blocking unknowns. The synthetic clock is not actual site telemetry.\n`;
await writeFile(path.join(dir,'audit.md'),report);
console.log(JSON.stringify({id,status:config.status,milestones:plan.milestones.length},null,2));
