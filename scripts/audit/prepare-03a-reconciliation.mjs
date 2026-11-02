import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const ev=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const id='03-a-open-the-lens',takeDir=path.join(ev,'takes',id);
const raw=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02',id);
const donor='Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6';
const rubik='Juanmaes83/floorplan-3d@0f9c6ead9732901681498efec326d1ca92e42ffe';
const global='docs/product/ft3d-donor-global-reconciliation-2026-11-01.md';
const O=(statement,locator)=>({class:'OBSERVED_RUNTIME',statement,locator});
const S=(statement,locator)=>({class:'DONOR_SOURCE',statement,locator:`${donor}:${locator}`});
const C=(statement,locator)=>({class:'CUT_ATLAS',statement,locator});
const R=(statement,locator)=>({class:'RUBIK_CURRENT',statement,locator:`${rubik}:${locator}`});
const f=(vp,name,run)=>path.join(raw,vp,...(run?[run]:[]),`${vp}-${name}`);
const discoveryRuns={desktop:'discovery-correction-1',portrait:'discovery-correction-1',landscape:'discovery-correction-2'};
const disc=(vp,name)=>f(vp,name,discoveryRuns[vp]);
const sem=(vp,name)=>f(vp,name,vp==='portrait'?'semantic-correction-3':'semantic-correction-2');
const plan=JSON.parse(await readFile(path.join(takeDir,'semantic-plan.json'),'utf8'));
const base=JSON.parse(await readFile(path.join(ev,'takes/02-demo-section-sweep/reconciliation.json'),'utf8'));
const transitions=[
  [.02,.07,.11],[.11,.17,.22],[.25,.31,.35],[.36,.42,.46],[.47,.52,.56],
  [.59,.64,.68],[.68,.71,.74],[.76,.83,.86],[.88,.94,.96],[.96,.98,1]
];
const landscapeTransitions=[
  [.01,.06,.10],[.10,.15,.20],[.22,.27,.31],[.32,.37,.41],[.42,.45,.49],
  [.51,.56,.60],[.60,.64,.68],[.69,.75,.78],[.83,.90,.94],[.94,.98,1]
];
const portraitTransitions=[
  [.02,.07,.11],[.11,.17,.22],[.24,.31,.35],[.35,.42,.46],[.46,.52,.56],
  [.56,.60,.63],[.66,.71,.73],[.75,.79,.81],[.81,.83,.85],[.85,.89,.94],[.94,.98,1]
];
const sources=[
  '03-open-section/page.js:29-70,92-107; engine.js:561-592',
  '03-open-section/page.js:70-107,199-211; engine.js:109-230,590-614',
  '03-open-section/page.js:29-70,101-110,118-155; engine.js:561-592',
  '03-open-section/page.js:29-70,101-110,118-155; engine.js:561-592',
  '03-open-section/page.js:29-70,101-110,118-155; engine.js:561-592',
  '03-open-section/page.js:29-70,101-110,118-155; engine.js:561-592',
  '03-open-section/page.js:29-70,101-110,118-155; engine.js:561-592',
  '03-open-section/page.js:29-70,101-110,199-211; engine.js:561-592,628-700',
  '03-open-section/page.js:190-212; index.html:194-227',
  '03-open-section/index.html:194-227'
];
const continuity=[
  'The same cut wall, stair spine, three levels, hillside and pool retain their positions while the lens opens.',
  'The stair, slab edges, roof lantern, glazing and pool remain registered as ink gains material and light.',
  'The camera approaches the stair already visible in the full section.',
  'The top stair leads directly into the street-level kitchen and roof lantern seen in the opening cut.',
  'The same stair descends to the bedroom slab and cypress courtyard glazing.',
  'The stair continues to the garden-level living room and library wall.',
  'The living room glazing opens toward the same terrace and pool on the slope.',
  'The same slabs, stair, roof lantern and pool re-form a measured material section.',
  'The studio copy is a page presentation after the same section, not a newly observed building.',
  'Selected-work cards and footer are editorial content outside the section model.'
];
const portraitContinuity=[...continuity.slice(0,8),
  'The right mobile half continues the same slab, terrace and pool from the left section half.',
  ...continuity.slice(8)];
const crosswalk=structuredClone(base.rubikCrosswalk);
const claims={
  semanticData:['EXISTS','Current Project/Building data and derived section facts remain authoritative; the donor’s hillside address, dates, levels and copy are authored demo content.'],
  geometry:['PARTIAL','Rubik derives a real section and caps for supported project geometry; the donor’s pre-authored whole three-level house and furnishings are not generic project geometry.'],
  representation:['PARTIAL','Dynamic section/caps exist, while this donor’s registered ink, colour vertex attributes and spatial material sweep over the same cut are not accredited as one current Rubik representation.'],
  materialsLight:['PARTIAL','Rubik owns authorized surface and light state; an ink-to-lit-material front tied to a real section is not currently demonstrated.'],
  camera:['PARTIAL','Rubik has section-open camera and route capabilities; the donor’s constant-size cut while the lens opens and its section-facing room-by-room framing are specific choreography not yet proven for arbitrary Rubik projects.'],
  transition:['PARTIAL','Story supports absolute state and reversible section movement; the observed coupled lens, technical notes, colour front, route and return are not one demonstrated current sequence.'],
  scrollProgress:['EXISTS','Rubik has one Story/player progress and seek authority. The donor’s 1600vh native-scroll calendar is a presentation choice, not a missing named control.'],
  ui:['PARTIAL','Rubik has presentation UI and captions; the donor’s CAD radar, title block and marketing close are not automatically product contracts.'],
  mobile:['PARTIAL','Rubik has small-screen presentation paths. The donor’s portrait left/right section framing and 844×390 overlap are donor observations, not proof of a Rubik defect.'],
  lifecycleRestore:['EXISTS','Rubik has Story/section snapshot and restore. Donor A0/A1 is visually equivalent after a stable-start correction; exact donor internal resource identity is not observed.'],
  outputs:['EXISTS','Rubik has current image/share output paths. The donor’s selected-work and contact CTA are editorial, not a new required Rubik export.'],
  qa:['PARTIAL','Current presentation QA exists; any constant-size lens and material-front bridge would require targeted continuity, mobile and reverse evidence.']
};
for(const [k,[status,claim]] of Object.entries(claims)){crosswalk[k].status=status;crosswalk[k].claim=claim}
crosswalk.representation.evidence=[R('Dynamic section clipping and caps over current geometry.','index.html:4664-4705'),R('Section descriptor derives current project intersections.','js/presentation-section-core.js:30-105')];
crosswalk.camera.evidence=[R('Current section-open camera evaluates absolute progress.','js/presentation-story-core.js:111-170'),R('Current route planner is distinct from donor authored room stops.','js/presentation-route.js:1-156')];

const config={
  schemaVersion:'rubik-donor-runtime-audit.reconciliation.v1',status:'AUDITED_WITH_DONOR_LIMITATION',
  discoveryRun:discoveryRuns,
  semanticRun:{desktop:'semantic-correction-2',portrait:'semantic-correction-3',landscape:'semantic-correction-2'},
  progressModel:{desktop:'SCROLL_PLUS_TIME',portrait:'SCROLL_PLUS_TIME',landscape:'SCROLL_PLUS_TIME'},
  transitions,transitionsByViewport:{portrait:portraitTransitions,landscape:landscapeTransitions},
  milestoneSources:sources.map(x=>`${donor}:${x}`),
  milestoneSourcesByViewport:{portrait:[...sources.slice(0,8),sources[7],...sources.slice(8)].map(x=>`${donor}:${x}`)},
  continuity,continuityByViewport:{portrait:portraitContinuity},
  viewportSupport:{desktop:'SUPPORTED',portrait:'SUPPORTED',landscape:'DONOR_LIMITATION'},
  viewportEvidence:{desktop:[],portrait:[O('Portrait renders left and right halves of the same material section in sequence.',sem('portrait','forward-m08r-material-section-right-half.png'))],landscape:[
    O('At 844×390 the room card, drawing, caption and radar overlap, although forward and reverse progress continue.',disc('landscape','forward-discovery-p045.png')),
    S('The mobile layout and radar hiding are width-based at 700px, so 844×390 retains desktop elements.','03-open-section/index.html:239-271')
  ]},
  restoreVerdict:{desktop:'VISUALLY_EQUIVALENT',portrait:'VISUALLY_EQUIVALENT',landscape:'VISUALLY_EQUIVALENT'},
  restoreReview:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,`Stable A0 and A1 show the same cut, stair, hillside, hero/HUD, route/hash and scroll origin in ${v}; exact camera/material/temporary-resource object identity is NOT_OBSERVED. The initial desktop/landscape attempt was superseded because the title block had not finished entering.`])),
  reverseOnlyMilestones:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'No separate reverse-only geometry state established. The footer and studio close retreat, the material section returns, framing runs back through pool/living/bedroom/kitchen/stair, then material and lens return to ink. Portrait traverses both section halves.'])),
  selectedKeyframes:{
    desktop:['discovery-correction-1/desktop-start.png','semantic-correction-2/desktop-forward-m01-lens-opens.png','semantic-correction-2/desktop-forward-m02-material-sunlight-sweep.png','semantic-correction-2/desktop-forward-m04-kitchen-lantern.png','semantic-correction-2/desktop-forward-m05-bedroom-patio.png','semantic-correction-2/desktop-forward-m07-garden-pool.png','semantic-correction-2/desktop-forward-m08-material-section-returns.png','semantic-correction-2/desktop-forward-m09-studio-service-copy.png','discovery-correction-1/desktop-end.png','discovery-correction-1/desktop-restored-start.png'],
    portrait:['discovery-correction-1/portrait-start.png','semantic-correction-3/portrait-forward-m05-bedroom-patio.png','semantic-correction-3/portrait-forward-m06-living-room.png','semantic-correction-3/portrait-forward-m08-material-section-returns.png','semantic-correction-3/portrait-forward-m08r-material-section-right-half.png','semantic-correction-3/portrait-forward-m09-studio-service-copy.png','discovery-correction-1/portrait-end.png','discovery-correction-1/portrait-restored-start.png'],
    landscape:['discovery-correction-2/landscape-start.png','semantic-correction-2/landscape-forward-m05-bedroom-patio.png','semantic-correction-2/landscape-forward-m08-material-section-returns.png','semantic-correction-2/landscape-forward-m09-studio-service-copy.png','discovery-correction-2/landscape-end.png','discovery-correction-2/landscape-restored-start.png']
  },
  professionalService:{
    problemSolved:'Helps an architect explain what rooms and vertical movement lie behind one hillside section drawing while keeping the cut readable as perspective, material and light are introduced.',
    primaryUsers:['architect','client','design reviewer'],
    serviceOutcome:'One technical 1:100 section opens its lens without losing the cut, gains material and sunlight, visits stair/rooms/pool and returns to a material section before editorial service copy.',
    decisionValue:'Supports discussion of level relationships, circulation, daylight and the link between a technical cut and occupied space. The specific house, site and project facts are authored donor content.',
    evidence:[S('README states the cut-size lens opening, ink/material scan and room-by-room visit.','03-open-section/README.md:1-18'),O('The complete desktop forward video shows the cut, tour, material return and editorial ending.',disc('desktop','forward-discovery.webm'))]
  },
  continuityInvariants:[
    {statement:'The same stair spans all three slabs from ink A to the kitchen, bedroom and living room visits.',evidence:[O('Opening cut shows stair and slabs.',disc('desktop','start.png')),O('Bedroom pass shows the same stair and courtyard.',sem('desktop','forward-m05-bedroom-patio.png'))]},
    {statement:'The pool, terrace, hillside and garden-level slab remain registered through the material sweep and return.',evidence:[O('Material sweep with pool and slope.',sem('desktop','forward-m02-material-sunlight-sweep.png')),O('Material section with same pool and slope.',sem('desktop','forward-m08-material-section-returns.png'))]},
    {statement:'Portrait left and right section halves retain the same level/grid identities rather than becoming separate projects.',evidence:[O('Portrait left half.',sem('portrait','forward-m08-material-section-returns.png')),O('Portrait right half.',sem('portrait','forward-m08r-material-section-right-half.png'))]}
  ],
  evidenceLedger:[
    O('Three clean-context corrected Discovery passes contain natural A→B→A video, NDJSON telemetry and five-percent samples.',raw),
    O('Three fresh semantic passes record the viewport-specific section, room and editorial states.',sem('desktop','forward-semantic.webm')),
    S('PLAN.a, stateAt and colourAt drive the section-facing lens, room visits and colour front.','03-open-section/page.js:29-110,190-212'),
    S('place fixes cut size by frameH/tan(lens/2), applies clipping/caps and updates colour state.','03-open-section/engine.js:561-625'),
    C('Cut 1 D02/D06 and Atlas identify section lens/caps; Global preserves Rubik authority and donor limitations.',`${global}:119-137,191-207`),
    R('Current Rubik has section descriptor/caps, Story camera and lifecycle, with independent route capability.','js/presentation-section-core.js:30-105; js/presentation-story-core.js:111-170; index.html:4554-4705'),
    {class:'INFERENCE',statement:'The observed section narrative may have client decision value, subject to later product review.',locator:'professionalService',basedOn:[disc('desktop','forward-discovery.webm'),`${donor}:03-open-section/README.md:1-18`],inferenceStatus:'UNRESOLVED'}
  ],
  donorSourceLocators:[
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'03-open-section/page.js',symbol:'PLAN.a/stateAt/mix/colourAt',lines:'29-110',claim:'Authored 1600vh room and lens track, tangential lens interpolation and spatial colour front.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'03-open-section/page.js',symbol:'readScroll/frame/words',lines:'111-212',claim:'Native scroll maps to a smoothed internal vh; captions, room cards and editorial handoff follow that state.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'03-open-section/page.js',symbol:'start/finish/__ready',lines:'215-268',claim:'Loader and drawing animation complete before __ready; explains why original desktop/landscape A0 was premature.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'03-open-section/engine.js',symbol:'withColour',lines:'109-230',claim:'One building shader mixes ink and lit material behind an X-position front.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'03-open-section/engine.js',symbol:'updateCaps',lines:'491-513',claim:'Cut lids are rebuilt when intersected pieces change and otherwise repositioned.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'03-open-section/engine.js',symbol:'resolve/place/notes',lines:'561-690',claim:'Section frame and viewpoint are separated; lens determines distance, view offset preserves cut registration, and notes are drawn over the cut.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'03-open-section/index.html',symbol:'@media (max-width: 700px)',lines:'239-271',claim:'Width-only mobile CSS leaves 844×390 in desktop radar and room-card layout.',classification:'SOURCE_CONFIRMED'}
  ],
  cutsAtlas:[
    {locator:'Cut 1 D02 @6a573f1955fd70dd52bb10450c9b9df9b4833aa0; Atlas 03A @7696fb2c6c30f158001d38ecc53feb2674acaa25',documentedDisposition:'D02-C1 KEEP EXISTING Rubik section; C2 ADAPT frame/viewpoint lens relationship; C3 REJECT fixed house/PLAN',relationToRuntime:'CONFIRMS',evidence:[C('Global D02 documents the frame/viewpoint formula and bounded adaptation.',`${global}:119-137`),O('Lens opening retains the cut and stair.',sem('desktop','forward-m01-lens-opens.png'))]},
    {locator:'Cut 1 D06 @6a573f1955fd70dd52bb10450c9b9df9b4833aa0',documentedDisposition:'D06-C1 KEEP EXISTING Rubik section/caps; C2 ADAPT sourced style/notes; C3 REJECT universal caps and authored house numbers',relationToRuntime:'EXTENDS',evidence:[C('Global D06 preserves existing section authority and limits donor cap claims.',`${global}:191-207`),O('Material section and notes return after the room sequence.',sem('desktop','forward-m08-material-section-returns.png'))]},
    {locator:'Atlas 03A @7696fb2c6c30f158001d38ecc53feb2674acaa25',documentedDisposition:'One shared ?dir=a/?dir=c runtime with distinct authored PLAN branches; older nine-checkpoint review did not certify full temporal evolution',relationToRuntime:'EXTENDS',evidence:[C('Atlas identifies 03A page.js PLAN.a and shared engine.',`Juanmaes83/floorplan-3d@7696fb2c6c30f158001d38ecc53feb2674acaa25:docs/product/ft3d-reference-atlas-2026-11-01.md:3-5`),O('Continuous runtime reaches editorial end and returns to A.',disc('desktop','forward-discovery.webm'))]}
  ],
  rubikCrosswalk:crosswalk,
  gaps:[
    {classification:'INTEGRATION_GAP',statement:'Current section/camera authorities are separate; the observed constant-size-cut lens opening would need a bounded frame/viewpoint connector if considered useful.',evidence:[S('resolve/place separates frame and viewpoint.','03-open-section/engine.js:561-592'),R('Current section and sectionOpen are distinct existing capabilities.','js/presentation-section-core.js:30-105; js/presentation-story-core.js:111-170')]},
    {classification:'TRANSITION_GAP',statement:'The donor registers ink and lit material on one cut with a spatial colour front; an equivalent authorized Rubik transition is not accredited.',evidence:[S('withColour and colourAt drive the front.','03-open-section/engine.js:109-230; page.js:107-110'),R('Current section and surface renderer exist without this demonstrated front.','index.html:4664-4705; js/surface-renderer.mjs:1-74')]},
    {classification:'ORCHESTRATION_GAP',statement:'The room-by-room section-facing tour is an authored PLAN.a; current Rubik Story and route capacities would require project-derived stops and one lifecycle owner to produce a comparable service.',evidence:[S('PLAN.a supplies fixed room states.','03-open-section/page.js:29-70'),R('Story and route authorities are separate.','js/presentation-story-core.js:111-170; js/presentation-route.js:1-156')]},
    {classification:'DONOR_LIMITATION',statement:'The donor 844×390 layout retains desktop overlay placement and obscures part of the cut; this is not a Rubik failure.',evidence:[O('Overlapping landscape room card and radar.',disc('landscape','forward-discovery-p045.png')),S('Only widths up to 700px receive mobile layout.','03-open-section/index.html:239-271')]}
  ],
  candidateBridges:[
    {classification:'CONNECT_EXISTING',problemSolved:'Keep a section’s real cut/frame readable while a Story lens opens.',rubikAuthoritiesPreserved:['Project/Building geometry','current Section descriptor and caps','Story camera/lifecycle'],existingCapabilitiesConsumed:['sectionOpen','dynamic section/caps'],missingConnector:'A bounded frame/viewpoint adapter that derives from current Section bounds and available screen region.',donorMechanismReference:'engine.js:561-592; Global D02-C2 ADAPT, C3 REJECT',confidence:'MEDIUM',implementationAuthorized:false},
    {classification:'ADAPT_EXISTING',problemSolved:'If useful, show the same authorized cut changing from technical ink to lit material without geometry replacement.',rubikAuthoritiesPreserved:['Project/Building geometry','View3D material/light ownership','current section clipping'],existingCapabilitiesConsumed:['dynamic section/caps','surface renderer','Story absolute progress'],missingConnector:'A verified spatial style/material front over current geometry with coherent clipping and shadows.',donorMechanismReference:'page.js:107-110; engine.js:109-230; Global D06-C2 ADAPT',confidence:'MEDIUM',implementationAuthorized:false},
    {classification:'CONNECT_EXISTING',problemSolved:'If the service is selected, visit meaningful rooms along a real project section and return cleanly.',rubikAuthoritiesPreserved:['current level/room IDs','Story seek/reverse authority','route validity and mobile framing'],existingCapabilitiesConsumed:['Story sectionOpen','presentation-route','semantic project data'],missingConnector:'Project-derived room-stop selection and section-facing camera orchestration.',donorMechanismReference:'page.js:29-70 authored PLAN.a as reference only; fixed coordinates and copy rejected',confidence:'LOW',implementationAuthorized:false}
  ],
  dependencies:['TECHNICAL_PREREQUISITE: real Section descriptor/caps and current Building geometry before any section lens or material-front presentation.','TECHNICAL_PREREQUISITE: selected room IDs and valid route before section-facing room stops.','TECHNICAL_PREREQUISITE: Story-owned absolute state and restore before any reversible coupled camera/material sequence.'],
  qaExpectations:[
    {category:'SEMANTIC',invariant:'Section labels, level elevations and project facts derive from current authorized project data, not the donor house.'},
    {category:'GEOMETRY',invariant:'Opening the lens preserves the same cut walls, openings, stair and slab identities.'},
    {category:'VISUAL',invariant:'A spatial ink-to-material front changes representation on the same geometry without a detached arbitrary swap.'},
    {category:'CAMERA',invariant:'The cut remains legible and registered while the lens opens, including portrait and landscape framing.'},
    {category:'LIFECYCLE',invariant:'Natural reverse restores the initial camera, section/caps, materials, lighting, HUD and scroll/Story state.'},
    {category:'MOBILE',invariant:'Portrait can traverse the section halves; landscape controls and labels do not obscure the cut.'},
    {category:'ACCESSIBILITY',invariant:'Narrative milestones and room names remain available through accessible text and reduced-motion holds.'},
    {category:'OUTPUT',invariant:'Any section export uses the same authorized model/labels as live presentation.'},
    {category:'REGRESSION',invariant:'Section lens/material transitions do not alter ordinary Rubik geometry editing or saved project data.'}
  ],
  unresolved:[
    {severity:'NON_BLOCKING',question:'Exact donor camera/material/cap/shadow object identities after B→A are not passively observable; visually equivalent A0/A1, route/hash and scroll are observed.',attempts:['stable-start corrected A0/A1 screenshots','continuous reverse video at all viewports','pinned page.js/engine.js state update and cap lifecycle review'],evidenceNeeded:'Narrow read-only donor object-state probe if identity-level restoration becomes essential.'},
    {severity:'NON_BLOCKING',question:'A section-facing room tour and editorial service copy have possible professional value, but Rubik product suitability is not decided by this audit.',attempts:['full runtime and source inspection','Cut/Atlas crosswalk','Rubik current capability inspection'],evidenceNeeded:'Later human product review using the complete 7-group audit.'}
  ]
};
await writeFile(path.join(takeDir,'reconciliation.json'),JSON.stringify(config,null,2)+'\n');
const rows=plan.milestones.filter(m=>!m.viewports||m.viewports.includes('desktop')).map((m,i)=>`| ${m.label} | ${m.observedChange} | ${transitions[i].join(' / ')} | ${sources[i]} |`).join('\n');
const report=`# 03-a · Open the lens — runtime audit\n\n## ¿Qué problema profesional o de cliente resuelve?\n\n${config.professionalService.problemSolved} ${config.professionalService.serviceOutcome} The authored site, level values, labels and studio CTA are donor content, not Rubik project data.\n\n## Identity and capture\n\nRubik baseline \`0f9c6ead9732901681498efec326d1ca92e42ffe\`; donor \`${donor}\`; standalone \`https://sam1983aing.github.io/flat-to-3d/03-open-section/index.html?dir=a\`. RAW: \`${raw}\`. Desktop and landscape Discovery were repeated from \`window.__ready\` because their original A0 was still entering; original attempts remain untouched. Portrait Discovery A0/A1 was visually stable. Semantic portrait and landscape were repeated after correcting viewport-specific targets; a final semantic correction waits for loader readiness in all viewports. Only the corrected attempt paths in \`reconciliation.json\` are used for validation.\n\n## Observed A→B\n\n| Milestone | Observed change | Desktop approximate native transition start / center / end | Pinned causal source |\n|---|---|---|---|\n${rows}\n\nThe section starts as ink at 1:100, opens its perspective lens while the cut remains registered, changes material and light through an X-position front, visits the same stair/rooms/terrace/pool, pulls back to a material section, then yields to the studio's authored service copy, selected work and footer. B required natural wheel to the page end and further input after settling. Portrait represents the returned section as left then right halves (M08/M08R). Landscape uses desktop overlays at 844×390 and has a documented donor limitation.\n\n## Reverse and restore\n\nB→A was recorded continuously without reload, reset or internal calls. Editorial content retreats; material section and room frames reverse; colour and lens return to ink. Stable A0/A1 in each viewport are \`VISUALLY_EQUIVALENT\` for the drawing, hero/HUD, route/hash and scroll. Internal object identity is \`NOT_OBSERVED\`; the report does not claim \`RESTORED\`.\n\n## Reconciliation\n\nM01 and M03–M08 follow \`page.js:PLAN.a/stateAt\` and \`engine.js:resolve/place\`: one camera faces the cut; distance changes with lens so the cut frame remains legible. The authored three-level house, fixed PLAN and viewport bands are source-specific. Cut 1 D02 and Atlas cover the mechanism; runtime confirms and extends the temporal/mobile evidence.\n\nM02 follows \`page.js:colourAt\` and \`engine.js:withColour\`: an X-position front blends ink and lit material on the same building geometry. \`updateCaps\` preserves cut lids; notes fade and return. Cut 1 D06 and Global document bounded section/cap/style mechanisms. The present audit records no runtime–Cut conflict.\n\nRubik current owns Project/Building geometry, Section descriptor/caps, Story camera and lifecycle, route planning, surface materials, UI and outputs. The 12-dimension evidence-backed crosswalk, gaps, bridge candidates (all \`implementationAuthorized:false\`), technical prerequisites, QA invariants and unresolved items are in \`manifest.json\` and \`reconciliation.json\`. No product merge or priority is decided.\n\n## Known unknowns\n\nExact internal donor resource identity after reverse and product suitability of the service remain \`NON_BLOCKING\` with evidence needed recorded in \`reconciliation.json\`. Landscape overlap is classified as \`DONOR_LIMITATION\`, not a Rubik defect.\n`;
await writeFile(path.join(takeDir,'audit.md'),report);
console.log(JSON.stringify({id,status:config.status,desktopMilestones:transitions.length,portraitMilestones:portraitTransitions.length,landscapeMilestones:landscapeTransitions.length},null,2));
