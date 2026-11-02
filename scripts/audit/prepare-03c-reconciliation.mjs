import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const ev=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const id='03-c-down-the-stair', dir=path.join(ev,'takes',id);
const raw=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02',id);
const donor='Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6';
const rubik='Juanmaes83/floorplan-3d@0f9c6ead9732901681498efec326d1ca92e42ffe';
const global='docs/product/ft3d-donor-global-reconciliation-2026-11-01.md';
const atlas='Juanmaes83/floorplan-3d@7696fb2c6c30f158001d38ecc53feb2674acaa25:docs/product/ft3d-reference-atlas-2026-11-01.md';
const O=(statement,locator)=>({class:'OBSERVED_RUNTIME',statement,locator});
const S=(statement,locator)=>({class:'DONOR_SOURCE',statement,locator:`${donor}:${locator}`});
const C=(statement,locator)=>({class:'CUT_ATLAS',statement,locator});
const R=(statement,locator)=>({class:'RUBIK_CURRENT',statement,locator:`${rubik}:${locator}`});
const file=(vp,name,run)=>path.join(raw,vp,...(run?[run]:[]),`${vp}-${name}`);
const discovery=(vp,name)=>file(vp,name);
const semantic=(vp,name)=>file(vp,name,vp==='portrait'?'semantic-correction-1':undefined);
const plan=JSON.parse(await readFile(path.join(dir,'semantic-plan.json'),'utf8'));
const base=JSON.parse(await readFile(path.join(ev,'takes/03-a-open-the-lens/reconciliation.json'),'utf8'));
const transitions=[
  [.03,.07,.10],[.11,.16,.21],[.25,.32,.37],[.43,.49,.54],[.57,.63,.67],
  [.66,.70,.74],[.76,.80,.83],[.87,.90,.93],[.94,.98,1]
];
const portraitTransitions=[
  [.03,.07,.10],[.12,.17,.21],[.25,.30,.35],[.42,.47,.51],[.54,.59,.63],
  [.62,.66,.69],[.69,.72,.75],[.76,.80,.82],[.83,.86,.90],[.94,.98,1]
];
const landscapeTransitions=[
  [.03,.07,.10],[.10,.15,.20],[.25,.30,.35],[.40,.45,.49],[.51,.55,.59],
  [.59,.62,.66],[.68,.71,.74],[.78,.82,.86],[.94,.98,1]
];
const sources=[
  '03-open-section/page.js:61-83,92-107,190-212; engine.js:109-230,561-592',
  '03-open-section/page.js:61-83,101-105,116-155; engine.js:561-592',
  '03-open-section/page.js:61-83,101-105,116-155; engine.js:561-592',
  '03-open-section/page.js:61-83,101-105,116-155; engine.js:561-592',
  '03-open-section/page.js:61-83,101-105,116-155; engine.js:561-592',
  '03-open-section/page.js:61-83,101-105,190-212; engine.js:561-592',
  '03-open-section/page.js:61-83,101-105,190-212; engine.js:491-513,561-592',
  '03-open-section/page.js:116-155,190-212; index.html:194-227',
  '03-open-section/index.html:194-227'
].map(x=>`${donor}:${x}`);
const continuity=[
  'The same stair spine, slabs, hillside and pool remain registered as ink gains depth and material.',
  'The street-level kitchen and lantern remain connected to the stair in the initial cut.',
  'The same stair descends to the bedroom landing and glazed cypress courtyard.',
  'The stair continues below the patio to the double-height living room and library wall.',
  'The living room opens through garden glazing to the terrace and cantilevered pool.',
  'The camera pulls back along the same section geometry; no new house replaces the pool view.',
  'The same roof, slabs, stair, terrace and pool return as a measured material section.',
  'Studio copy describes the section service outside the interactive model, without introducing a new observed project.',
  'Selected-work cards and footer are editorial content below the same section narrative.'
];
const portraitContinuity=[...continuity.slice(0,7),'The right portrait half continues the same section and pool from its left half.',...continuity.slice(7)];
const crosswalk=structuredClone(base.rubikCrosswalk);
const claims={
  semanticData:['EXISTS','Current Project/Building levels, rooms and derived section facts own Rubik meaning; donor site, dimensions and copy are authored demo facts.'],
  geometry:['PARTIAL','Rubik derives a real section and caps for supported project geometry; the donor three-level furnished house is fixed authored geometry.'],
  representation:['PARTIAL','Rubik has dynamic section/caps; the donor ink-to-lit-material front on one registered cut is not demonstrated as a current Rubik representation.'],
  materialsLight:['PARTIAL','Rubik has surface and light infrastructure; a spatial front coupling material and sunlight to a real section is not accredited.'],
  camera:['PARTIAL','Rubik has section-open camera and route capabilities; a project-derived vertical stair descent with coherent cut framing is a specific choreography not currently demonstrated.'],
  transition:['PARTIAL','Story supports absolute reversible state, but this coupled vertical descent, material front, room cards and return is not one demonstrated current sequence.'],
  scrollProgress:['EXISTS','Rubik Story/player progress and seek are current authorities; the donor 1250vh calendar is a presentation choice.'],
  ui:['PARTIAL','Rubik has presentation captions and controls; donor radar, level HUD and authored marketing close do not become Rubik contracts.'],
  mobile:['PARTIAL','Rubik has small-screen presentation paths; donor portrait section halves and 844×390 overlay collisions are donor-specific observations.'],
  lifecycleRestore:['EXISTS','Rubik has Story/section snapshot and restore. Donor 03-c returns visually but retains hidden caption/room DOM content; Rubik must not copy that lifecycle defect.'],
  outputs:['EXISTS','Rubik has current image/share outputs. Donor selected-work and contact CTA are editorial, not an export capability requirement.'],
  qa:['PARTIAL','Current presentation QA exists; a stair-descent bridge would need vertical continuity, reverse, DOM cleanup and mobile evidence.']
};
for(const [k,[status,claim]] of Object.entries(claims)){crosswalk[k].status=status;crosswalk[k].claim=claim}
const config={
  schemaVersion:'rubik-donor-runtime-audit.reconciliation.v1',status:'AUDITED_WITH_DONOR_LIMITATION',
  semanticRun:{portrait:'semantic-correction-1'},
  progressModel:{desktop:'SCROLL_PLUS_TIME',portrait:'SCROLL_PLUS_TIME',landscape:'SCROLL_PLUS_TIME'},
  transitions,transitionsByViewport:{portrait:portraitTransitions,landscape:landscapeTransitions},
  milestoneSources:sources,milestoneSourcesByViewport:{portrait:[...sources.slice(0,7),sources[6],...sources.slice(7)]},
  continuity,continuityByViewport:{portrait:portraitContinuity},
  viewportSupport:{desktop:'SUPPORTED',portrait:'SUPPORTED',landscape:'DONOR_LIMITATION'},
  viewportEvidence:{desktop:[],portrait:[O('Portrait returns to left and right halves of one material section.',semantic('portrait','forward-m07r-material-section-right-half.png'))],landscape:[O('At 844×390 room card, radar and drawing overlap during the descent.',semantic('landscape','forward-m03-bedroom-patio.png')),S('Mobile CSS uses a width threshold of 700px.','03-open-section/index.html:239-271')]},
  restoreVerdict:{desktop:'NOT_RESTORED',portrait:'NOT_RESTORED',landscape:'NOT_RESTORED'},
  restoreReview:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,`A0/A1 pixels, route/hash and scroll origin are visually equivalent in ${v}. Passive start-state.json versus reverse-state.json shows residual caption and room text in the DOM at A1. page.js removes show classes but does not clear text. Full UI state is NOT_RESTORED; internal render-resource identity is NOT_OBSERVED.`])),
  reverseOnlyMilestones:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'No independent reverse-only geometry state established. Editorial content retreats, then material section, pullback, pool, living room, patio and kitchen reverse to ink. Portrait traverses both section halves. Hidden caption/room DOM text remains at scroll origin.'])),
  selectedKeyframes:{
    desktop:['desktop-start.png','desktop-forward-m01-section-enters-depth.png','desktop-forward-m02-street-level-lantern.png','desktop-forward-m03-bedroom-patio.png','desktop-forward-m04-living-room.png','desktop-forward-m05-garden-pool.png','desktop-forward-m06-whole-house-pullback.png','desktop-forward-m07-material-section-returns.png','desktop-forward-m08-studio-service-copy.png','desktop-end.png','desktop-restored-start.png'],
    portrait:['portrait-start.png','semantic-correction-1/portrait-forward-m03-bedroom-patio.png','semantic-correction-1/portrait-forward-m04-living-room.png','semantic-correction-1/portrait-forward-m05-garden-pool.png','semantic-correction-1/portrait-forward-m07-material-section-returns.png','semantic-correction-1/portrait-forward-m07r-material-section-right-half.png','semantic-correction-1/portrait-forward-m08-studio-service-copy.png','portrait-end.png','portrait-restored-start.png'],
    landscape:['landscape-start.png','landscape-forward-m03-bedroom-patio.png','landscape-forward-m04-living-room.png','landscape-forward-m05-garden-pool.png','landscape-forward-m07-material-section-returns.png','landscape-forward-m08-studio-service-copy.png','landscape-end.png','landscape-restored-start.png']
  },
  professionalService:{problemSolved:'Helps an architect explain how one hillside house connects its street, bedroom and garden levels through the stair while retaining the section as the common spatial reference.',primaryUsers:['architect','client','design reviewer'],serviceOutcome:'A measured section gains depth and material, the camera descends from street kitchen through bedroom and living levels to the pool, then returns to the whole material section.',decisionValue:'Supports discussion of circulation, level relationships, daylight and the route from street to garden. The house and level numbers are donor-authored examples.',evidence:[O('Continuous desktop descent and return.',discovery('desktop','forward-discovery.webm')),S('PLAN.c encodes the distinct descending path and chapter copy.','03-open-section/page.js:61-83')]},
  continuityInvariants:[
    {statement:'One stair connects the same street, bedroom and garden-level slabs throughout the descent.',evidence:[O('Initial cut shows all levels.',discovery('desktop','start.png')),O('Bedroom landing.',semantic('desktop','forward-m03-bedroom-patio.png')),O('Garden-level living room.',semantic('desktop','forward-m04-living-room.png'))]},
    {statement:'The same terrace and pool remain beyond the living room before and after pullback.',evidence:[O('Pool at garden level.',semantic('desktop','forward-m05-garden-pool.png')),O('Pool in returned material section.',semantic('desktop','forward-m07-material-section-returns.png'))]},
    {statement:'Portrait left and right frames are contiguous views of the same returned section.',evidence:[O('Left section half.',semantic('portrait','forward-m07-material-section-returns.png')),O('Right section half.',semantic('portrait','forward-m07r-material-section-right-half.png'))]}
  ],
  evidenceLedger:[
    O('Independent desktop, portrait and landscape Discovery captures include natural A→B→A video and passive telemetry.',raw),
    O('Fresh semantic passes resolve the 03-c descent and viewport-specific return to the section.',semantic('desktop','forward-semantic.webm')),
    O('After reverse, the screenshot returns visually but passive HUD/body text differs from A0 in all three viewports.',path.join(raw,'desktop/reverse-state.json')),
    S('PLAN.c owns the 1250vh descent, distinct from PLAN.a; words leaves hidden caption/room text in the DOM at zero.','03-open-section/page.js:61-83,116-155'),
    C('Atlas 03C records the same residual caption and distinguishes PLAN.c from PLAN.a.',`${atlas}:139-143,187-188,559`),
    R('Rubik current has section, Story, route, UI and lifecycle authorities.', 'js/presentation-section-core.js:30-105; js/presentation-story-core.js:111-170; js/presentation-route.js:1-156; index.html:4615-4705')
  ],
  donorSourceLocators:[
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'03-open-section/page.js',symbol:'PLAN.c/stateAt/colourAt',lines:'61-107',claim:'Distinct authored 1250vh descent, room cards, lens and colour front.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'03-open-section/page.js',symbol:'words',lines:'116-155',claim:'Chapter captions, level HUD and room cards follow internal vh; show classes are removed without clearing caption/room DOM text.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'03-open-section/page.js',symbol:'readScroll/frame/__ready',lines:'162-212,215-268',claim:'Native scroll maps to smoothed internal vh after loader readiness.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'03-open-section/engine.js',symbol:'withColour/updateCaps/resolve/place',lines:'109-230,491-513,561-592',claim:'Material front and caps stay attached to the section while lens-derived distance and view offset frame the descending camera.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'03-open-section/index.html',symbol:'@media (max-width: 700px)',lines:'239-271',claim:'Width-only CSS leaves 844×390 in overlapping desktop overlay layout.',classification:'SOURCE_CONFIRMED'}
  ],
  cutsAtlas:[
    {locator:'Cut 1 D02 @6a573f1955fd70dd52bb10450c9b9df9b4833aa0; Atlas 03C @7696fb2c6c30f158001d38ecc53feb2674acaa25',documentedDisposition:'D02-C1 KEEP EXISTING section; C2 ADAPT bounded frame/viewpoint; C3 REJECT authored PLAN and house',relationToRuntime:'EXTENDS',evidence:[C('Atlas separates PLAN.c 1250vh descent and flags residual caption.',`${atlas}:139-143,187-188`),O('The stair descends through the same cut.',semantic('desktop','forward-m03-bedroom-patio.png'))]},
    {locator:'Cut 1 D06 @6a573f1955fd70dd52bb10450c9b9df9b4833aa0',documentedDisposition:'D06-C1 KEEP EXISTING section/caps; C2 ADAPT sourced style and notes; C3 REJECT universal caps/authored numbers',relationToRuntime:'CONFIRMS',evidence:[C('Global D06 bounds section/cap claims.',`${global}:191-207`),O('Material section returns over the same house.',semantic('desktop','forward-m07-material-section-returns.png'))]},
    {locator:'Atlas U04 @7696fb2c6c30f158001d38ecc53feb2674acaa25',documentedDisposition:'03C reverse geometry returns but caption text remains in DOM',relationToRuntime:'CONFIRMS',evidence:[C('Prior Atlas residual-caption finding.',`${atlas}:559`),O('A1 retains hidden caption/room text.',path.join(raw,'desktop/reverse-state.json'))]}
  ],
  rubikCrosswalk:crosswalk,
  gaps:[
    {classification:'ORCHESTRATION_GAP',statement:'A Rubik section-facing descent would need project-derived level/room stops across existing Section, Story and route authorities.',evidence:[S('PLAN.c supplies fixed stops and camera rects.','03-open-section/page.js:61-83'),R('Current Section, Story and route are distinct capabilities.','js/presentation-section-core.js:30-105; js/presentation-story-core.js:111-170; js/presentation-route.js:1-156')]},
    {classification:'TRANSITION_GAP',statement:'A spatial ink-to-material front on a current Rubik section is not demonstrated, although section and material infrastructure exist.',evidence:[S('colourAt and withColour couple the spatial front to the donor geometry.','03-open-section/page.js:107; engine.js:109-230'),R('Current section and surface renderer exist.','index.html:4664-4705; js/surface-renderer.mjs:1-74')]},
    {classification:'DONOR_LIMITATION',statement:'At 844×390 donor room cards and radar obscure the cut.',evidence:[O('Landscape overlap during bedroom chapter.',semantic('landscape','forward-m03-bedroom-patio.png')),S('The donor mobile layout is width-only at 700px.','03-open-section/index.html:239-271')]},
    {classification:'DONOR_LIMITATION',statement:'The donor reverse leaves caption and room text in the DOM after the visible section returns.',evidence:[O('A0/A1 passive body text differs.',path.join(raw,'desktop/reverse-state.json')),S('words removes show classes without clearing text.','03-open-section/page.js:121-129')]}
  ],
  candidateBridges:[
    {classification:'CONNECT_EXISTING',problemSolved:'Explain street-to-garden circulation on a current Rubik project section.',rubikAuthoritiesPreserved:['Project/Building level and room identities','Section descriptor/caps','Story camera and lifecycle','route safety'],existingCapabilitiesConsumed:['sectionOpen','presentation-route','semantic Project/Building'],missingConnector:'Project-derived vertical section stops and section-facing camera orchestration.',donorMechanismReference:'PLAN.c at page.js:61-83 as reference only; fixed house/coords rejected',confidence:'MEDIUM',implementationAuthorized:false},
    {classification:'ADAPT_EXISTING',problemSolved:'If useful, carry one real cut from technical ink to lit material during the descent.',rubikAuthoritiesPreserved:['current Building geometry','current Section clipping','View3D material/light owner'],existingCapabilitiesConsumed:['dynamic section/caps','surface renderer','Story absolute state'],missingConnector:'A verified spatial style/material front over current geometry with consistent clipping and light.',donorMechanismReference:'page.js:107; engine.js:109-230; Global D06-C2 ADAPT',confidence:'MEDIUM',implementationAuthorized:false},
    {classification:'REUSE_EXISTING',problemSolved:'Return cleanly from a section story without stale captions or room labels.',rubikAuthoritiesPreserved:['Story snapshot/restore','presentation UI lifecycle'],existingCapabilitiesConsumed:['Story seek/reverse','section snapshot/restore'],missingConnector:'None asserted; preserve existing lifecycle owner and test DOM cleanup.',donorMechanismReference:'page.js:121-129 is a donor limitation to reject',confidence:'HIGH',implementationAuthorized:false}
  ],
  dependencies:['TECHNICAL_PREREQUISITE: real Section descriptor/caps and current Building levels before section-facing stops.','TECHNICAL_PREREQUISITE: project-derived room/level IDs and route validity before stair descent choreography.','TECHNICAL_PREREQUISITE: Story-owned absolute progress and restore before any coupled camera/material narrative.'],
  qaExpectations:[
    {category:'SEMANTIC',invariant:'Level and room captions derive from authorized current project data.'},
    {category:'GEOMETRY',invariant:'One stair and the same floor/slab intersections persist across the entire descent.'},
    {category:'VISUAL',invariant:'The ink-to-material front does not replace or misregister the section geometry.'},
    {category:'CAMERA',invariant:'The vertical camera path keeps the relevant stair, room and level legible within the cut.'},
    {category:'LIFECYCLE',invariant:'Reverse clears caption and room DOM state as well as restoring visible geometry, HUD and camera.'},
    {category:'MOBILE',invariant:'Portrait traverses both section halves; landscape overlays leave the cut readable.'},
    {category:'ACCESSIBILITY',invariant:'Hidden captions and room cards do not remain in the accessibility tree after reverse.'},
    {category:'OUTPUT',invariant:'Any section output uses current project geometry and labels.'},
    {category:'REGRESSION',invariant:'The narrative does not alter saved project geometry or ordinary editing.'}
  ],
  unresolved:[
    {severity:'NON_BLOCKING',question:'Exact donor camera/material/cap/shadow object identity after reverse is not passively exposed, despite visual geometry return and observed DOM residue.',attempts:['clean A0/A1 screenshots in three viewports','passive body/HUD snapshots','continuous reverse video','pinned page.js and engine.js lifecycle inspection'],evidenceNeeded:'Narrow read-only object/resource snapshot only if identity-level proof becomes necessary.'},
    {severity:'NON_BLOCKING',question:'Product suitability of the donor-authored vertical tour is undecided by this audit.',attempts:['three-viewport runtime review','pinned PLAN.c/source inspection','Cut/Atlas and current Rubik crosswalk'],evidenceNeeded:'Later human product review after all 14 takes.'}
  ]
};
await writeFile(path.join(dir,'reconciliation.json'),JSON.stringify(config,null,2)+'\n');
const rows=plan.milestones.filter(m=>!m.viewports||m.viewports.includes('desktop')).map((m,i)=>`| ${m.label} | ${m.observedChange} | ${transitions[i].join(' / ')} | ${sources[i]} |`).join('\n');
const report=`# 03-c · Down the stair — runtime audit\n\n## Professional service\n\n${config.professionalService.problemSolved} ${config.professionalService.serviceOutcome} The donor's Casa Graó, level numbers and studio copy remain authored examples, not Rubik project data.\n\n## Identity and capture\n\nPinned donor: \`${donor}\`. Frozen Rubik: \`${rubik}\`. Standalone: \`https://sam1983aing.github.io/flat-to-3d/03-open-section/index.html?dir=c\`. RAW: \`${raw}\`. Three independent clean-context Discovery passes reached B and returned to scroll origin. The first portrait semantic pass failed at WebM encoder stop and remains in RAW; \`semantic-correction-1\` is the verified portrait pass.\n\n## Observed A→B\n\n| Milestone | Observed change | Desktop approximate native start / center / end | Pinned source |\n|---|---|---|---|\n${rows}\n\nPLAN.c opens the initial cut, descends from street kitchen and lantern past the bedroom courtyard to the double-height living room and pool, pulls back to the same material section, then ends in studio copy, selected work and footer. Portrait shows left and right material-section halves as separate M07/M07R states. Landscape retains overlapping desktop overlays at 844×390. These are independent 03-c observations; 03-a has a different PLAN and scroll calendar.\n\n## Reverse and lifecycle\n\nNatural B→A was recorded without reload/reset. All three A0/A1 screenshots are visually equivalent for cut geometry, hero/HUD and route/scroll origin. Passive A1 metadata retains caption and room text absent at A0. Donor \`page.js:121-129\` removes show classes but does not clear this text. Full UI state is \`NOT_RESTORED\`; hidden object/resource identity is \`NOT_OBSERVED\`. Atlas U04 had previously recorded residual caption after 03C reverse, and this audit confirms it.\n\n## Source, Cuts and Rubik\n\n\`PLAN.c\` at \`page.js:61-83\` supplies a 1250vh authored vertical descent with its own stops and room cards. \`stateAt\`, \`readScroll/frame\` and \`engine.js:resolve/place\` connect native scroll, smoothed internal vh and section-facing camera. \`colourAt/withColour\` and \`updateCaps\` retain registered geometry through the material transition. Cut 1 D02/D06 and the Atlas support bounded frame/style mechanisms while rejecting the fixed donor house and PLAN as Rubik authority. Current Rubik already has Section, Story, route, geometry, mobile UI, lifecycle and outputs; the 12-dimension crosswalk distinguishes their integration/orchestration from any missing capability. All bridge candidates are \`implementationAuthorized:false\`.\n\n## Unknowns\n\nExact internal donor resource identity after reverse and product suitability remain bounded \`NON_BLOCKING\` unknowns. There are no blocking unknowns in the final take record.\n`;
await writeFile(path.join(dir,'audit.md'),report);
console.log(JSON.stringify({id,status:config.status,desktopMilestones:transitions.length,portraitMilestones:portraitTransitions.length,landscapeMilestones:landscapeTransitions.length},null,2));
