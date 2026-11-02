import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const ev=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const id='05-a-the-programme',dir=path.join(ev,'takes',id);
const raw=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02',id);
const sha='d7b9b69753d3af679535ee56695a05c8d955c3c6';
const donor=`Sam1983Aing/flat-to-3d@${sha}:05-schedule-build/`;
const rubik='Juanmaes83/floorplan-3d@0f9c6ead9732901681498efec326d1ca92e42ffe:';
const atlas='Juanmaes83/floorplan-3d@7696fb2c6c30f158001d38ecc53feb2674acaa25:docs/product/ft3d-reference-atlas-2026-11-01.md';
const cut='docs/product/evidence/donor-cuts-2026-11-01/cut4-d16-d17-d18.md';
const global='docs/product/ft3d-donor-global-reconciliation-2026-11-01.md';
const O=(statement,locator)=>({class:'OBSERVED_RUNTIME',statement,locator});
const S=(statement,locator)=>({class:'DONOR_SOURCE',statement,locator:donor+locator});
const C=(statement,locator)=>({class:'CUT_ATLAS',statement,locator});
const R=(statement,locator)=>({class:'RUBIK_CURRENT',statement,locator:rubik+locator});
const d=(vp,name)=>path.join(raw,vp,...(vp==='desktop'?['discovery-correction-1']:[]),`${vp}-${name}`);
const s=(vp,name)=>path.join(raw,vp,`${vp}-${name}`);
const plan=JSON.parse(await readFile(path.join(dir,'semantic-plan.json'),'utf8'));
const transitions=[
  [.01,.04,.06],[.07,.11,.14],[.15,.20,.25],[.27,.32,.37],[.38,.43,.47],
  [.48,.53,.58],[.59,.64,.68],[.69,.73,.77],[.78,.84,.89],[.91,.94,.95],
  [.951,.956,.962],[.962,.967,.973],[.973,.978,.984],[.985,.992,.997],[.997,.999,1]
];
const phaseNames=['site-setup','excavation','foundations','structure','floors','walls','roof','windows-and-doors','finishes','furniture-handover'];
const roomNames=['inside-entry','inside-living','inside-kitchen','inside-loft','inside-gallery-overlook'];
const milestoneSources=plan.milestones.map((_,i)=>donor+(i<10?'house.js:9-24,618-640,1416-1470; view.js:127-130,334-430,515-580,914-937':'view.js:20-99,284-325,461-480,924-1007'));
const continuity=[
  'The perimeter, welfare cabin and authored phase rows belong to the same single house site.',
  'Excavation occurs within that fenced footprint while early phase intervals overlap.',
  'Foundations occupy the excavated footprint rather than a second scene.',
  'Timber portal frames rise on the same foundation slab.',
  'The mezzanine and stair fit into the same portal structure.',
  'Wall cassettes close the same frame and keep its openings aligned.',
  'Roof cassettes and standing seam cover the same shell.',
  'Glazing and doors fill openings in the completed wall and roof shell.',
  'Interior and exterior finishes attach to that shell.',
  'Furniture extends the completed house before the camera enters it.',
  'The threshold is the entrance of the completed exterior house.',
  'The living room follows the entrance within that house.',
  'The kitchen and dining area remain below the same mezzanine.',
  'The loft suite and study are reached along the same stair.',
  'The upper gallery overlooks the double-height living room of the same house.'
];
const crosswalk={
  semanticData:{status:'PARTIAL',claim:'Rubik Project/Building and C1-C4 own geometry, quantities and economic records; no durable job, calendar, dependency, element-to-job or execution authority is established. Donor PHASES is a fixed illustration.',evidence:[R('Project/Building identity and Story state are separate.','js/building-ui.js:36-95; js/presentation-story-core.js:254-364'),C('D18 distinguishes current C1-C4 from construction planning.',`${cut}:210-305`)]},
  geometry:{status:'PARTIAL',claim:'Rubik owns real Building geometry; donor assigns authored phase and per-piece appearance to a single house. A mapping from Rubik element IDs to authorized work packages is missing.',evidence:[R('Current Building geometry and level path.','index.html:3594-3640; js/building-ui.js:36-95'),S('Pieces are assigned phase and local timing in the donor.','house.js:618-640,1416-1470')]},
  representation:{status:'PARTIAL',claim:'Rubik View3D/Story can represent a Building; the donor Gantt and 3D share one virtual week, but their fixed rows are not current project data.',evidence:[R('Current Building view and Story.','js/building-ui.js:36-95; js/presentation-story-core.js:254-364'),S('One PHASES array drives Gantt and house update.','house.js:9-24,1416-1470; view.js:334-430')]},
  materialsLight:{status:'PARTIAL',claim:'Rubik has current surface rendering; donor stage tints, ghosts, material arrival and construction props are specific to its authored house.',evidence:[R('Surface renderer consumes current project appearances.','js/surface-renderer.mjs:1-74'),S('Week update sets piece material/visibility.','house.js:1416-1470')]},
  camera:{status:'PARTIAL',claim:'Rubik owns presentation camera and route mechanisms; donor automatic five-stop interior spline is authored for this house.',evidence:[R('Current Story route and camera authorities.','js/presentation-story-core.js:111-170; js/presentation-route.js:1-156'),S('Five interior stops and spline keys.','view.js:20-99')]},
  transition:{status:'PARTIAL',claim:'Rubik Story can seek absolute progress; donor phase-piece arrivals and exterior-to-interior handover are authored transitions rather than verified project execution.',evidence:[R('Absolute Story sequence and seek.','js/presentation-story-core.js:111-170,346-364'),S('Week controls appearance and interior transition.','house.js:1416-1470; view.js:924-1007')]},
  scrollProgress:{status:'EXISTS',claim:'Rubik Story already owns transport. Donor blocks native scrolling and maps wheel to a virtual week; the transport mechanism provides no planning authority.',evidence:[R('Story seek/playback UI.','js/presentation-story-core.js:346-364; js/presentation-ui.js:751-774'),S('Wheel input changes virtual week.','view.js:914-937')]},
  ui:{status:'PARTIAL',claim:'Rubik has presentation controls, while donor Gantt, WBS and percent-complete labels are authored. Decorative CRITICAL PATH and TODAY labels cannot be read as computed planning or current date.',evidence:[R('Current presentation UI.','js/presentation-ui.js:8-31,613-774'),C('D18 documents the critical-path, today and percent limitations.',`${cut}:210-305`)]},
  mobile:{status:'PARTIAL',claim:'Rubik has responsive presentation paths; donor 390×844 omits the chart from the viewport and clips controls, while 844×390 chart labels collide and the programme covers the 3D.',evidence:[R('Responsive presentation and mobile QA.','index.html:442-448; docs/qa/ft3d-6-implementation-2026-11-01.md:1-55'),O('Portrait mid-build screenshot lacks chart.',s('portrait','forward-m07-roof.png')),O('Landscape chart labels overlap.',s('landscape','forward-m07-roof.png'))]},
  lifecycleRestore:{status:'EXISTS',claim:'Rubik Story has lifecycle restore. Donor 05-a returns virtual week, camera shot, route, native scroll and visible A0 presentation; hidden render-resource identity was not observed.',evidence:[R('Current Story cleanup authority.','index.html:4615-4703'),O('Natural reverse and A1 screenshot.',d('desktop','restored-start.png'))]},
  outputs:{status:'EXISTS',claim:'Rubik has image/share and economic outputs; the donor schedule is an on-screen illustration, with no verified project schedule export.',evidence:[R('Current image/share outputs.','js/presentation-ui.js:239-288,321-360'),C('D18 finds no persistent editable schedule or certified execution.',`${cut}:210-305`)]},
  qa:{status:'PARTIAL',claim:'Current presentation QA exists; a future schedule bridge would need source-of-truth tests for dates, dependencies, phase membership, deterministic seeking, mobile legibility and reverse cleanup.',evidence:[R('Current presentation QA harness.','scripts/qa/render-presentation-templates.cjs:1-46'),C('D18 separates planning domain and Story transport.',`${cut}:210-305`)]}
};
const config={
  schemaVersion:'rubik-donor-runtime-audit.reconciliation.v1',status:'AUDITED_WITH_DONOR_LIMITATION',
  discoveryRun:{desktop:'discovery-correction-1'},
  progressModel:{desktop:'VIRTUAL_SCROLL',portrait:'VIRTUAL_SCROLL',landscape:'VIRTUAL_SCROLL'},
  transitions,milestoneSources,continuity,
  viewportSupport:{desktop:'SUPPORTED',portrait:'DONOR_LIMITATION',landscape:'DONOR_LIMITATION'},
  viewportEvidence:{
    desktop:[O('Desktop Gantt and 3D advance together through ten authored phases.',s('desktop','forward-m07-roof.png'))],
    portrait:[O('At 390×844 the fixed-width programme side remains visible but the Gantt chart is outside the viewport and toolbar clips.',s('portrait','forward-m07-roof.png')),S('Fixed 320px side panel and no 390px chart layout.','sketch.css:286-325,536-560')],
    landscape:[O('At 844×390 week labels collide and programme covers most of the 3D.',s('landscape','forward-m07-roof.png')),S('Horizontal programme layout remains active at this width.','sketch.css:286-325,536-560')]
  },
  restoreVerdict:{desktop:'VISUALLY_EQUIVALENT',portrait:'VISUALLY_EQUIVALENT',landscape:'VISUALLY_EQUIVALENT'},
  restoreReview:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'Natural reverse returns virtual week 0, SHOT a2, the same canonical route and native scrollY=0. A0 and A1 screenshots are visually equivalent, including the same viewport-specific layout limitation. TOUR approaches zero with camera smoothing; hidden WebGL resource identity is NOT_OBSERVED.'])),
  reverseOnlyMilestones:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'No independent reverse-only state established: the same five interior stops retreat to the exterior, then furniture, finishes, glazing, roof, walls, floors, structure and ground works withdraw as the virtual week returns to zero.'])),
  selectedKeyframes:{
    desktop:['discovery-correction-1/desktop-entry-week7.png','discovery-correction-1/desktop-start.png','desktop-forward-m03-foundations.png','desktop-forward-m07-roof.png','desktop-forward-m10-furniture-handover.png','desktop-forward-m11-inside-entry.png','desktop-forward-m15-inside-gallery-overlook.png','discovery-correction-1/desktop-end.png','discovery-correction-1/desktop-restored-start.png'],
    portrait:['portrait-start.png','portrait-forward-m07-roof.png','portrait-forward-m15-inside-gallery-overlook.png','portrait-end.png','portrait-restored-start.png'],
    landscape:['landscape-start.png','landscape-forward-m07-roof.png','landscape-forward-m15-inside-gallery-overlook.png','landscape-end.png','landscape-restored-start.png']
  },
  professionalService:{problemSolved:'Communicates an example 14-week timber-house construction sequence with an aligned programme and visual build.',primaryUsers:['architect','client','construction planner'],serviceOutcome:'A viewer can scrub the same authored week across Gantt rows, staged house pieces and an automatic five-stop handover tour.',decisionValue:'Useful for discussing illustrative sequence and spatial consequences; its dates, durations, completion percentages and critical-path label are not verified planning or execution facts.',evidence:[O('Desktop week 0 to 14 continuous capture.',d('desktop','forward-discovery.webm')),S('Fixed PHASES and one week cursor drive house and chart.','house.js:9-24,1416-1470; view.js:334-430,914-937'),C('D18 states the planning limits.',`${cut}:210-305`)]},
  continuityInvariants:[
    {statement:'All ten authored phases act on the same timber house and site.',evidence:[S('One house receives phase-assigned pieces.','house.js:9-24,618-640,1416-1470'),O('Foundation and roof milestones.',s('desktop','forward-m03-foundations.png'))]},
    {statement:'The Gantt cursor and house pieces use the same virtual week but show planned illustration, not actual execution.',evidence:[S('Shared PHASES and week cursor.','house.js:9-24; view.js:334-430,914-937'),C('D18 limits progress semantics.',`${cut}:210-305`)]},
    {statement:'The five interior stops remain within the completed house and follow entry, living, kitchen, loft and overlook.',evidence:[S('Stop metadata and spline.','view.js:20-99'),O('Final gallery stop.',s('desktop','forward-m15-inside-gallery-overlook.png'))]},
    {statement:'Reverse removes the same phase pieces and returns the visual start without route change.',evidence:[O('A0 screenshot.',d('desktop','start.png')),O('A1 screenshot.',d('desktop','restored-start.png')),O('Continuous reverse.',d('desktop','reverse-discovery.webm'))]}
  ],
  evidenceLedger:[
    O('Canonical ?dir=a opens at week 7 in each independent viewport; the natural prelude reaches week 0 without reload.',d('desktop','entry-week7.png')),
    O('Original desktop 30fps prelude encoder failed; RAW attempt was preserved and correction-1 at 10fps completed.',path.join(raw,'desktop/discovery-summary.json')),
    O('All three Discovery passes record virtual week 0→14→0 with continuous forward/reverse video and 21 normalized samples; native scrollY remains zero.',d('desktop','forward-discovery.webm')),
    O('Independent semantic passes capture ten construction phases and five interior stops in each viewport.',s('desktop','forward-semantic.webm')),
    O('A0/A1 start states are visually equivalent; week and shot return while interior camera smoothing approaches zero.',d('desktop','restored-start.png')),
    O('Portrait chart disappears outside 390px viewport; landscape week labels collide and programme overlays 3D.',s('portrait','forward-m07-roof.png')),
    S('PHASES, piece placement and update govern authored stage appearance.','house.js:9-24,618-640,1416-1470'),
    S('Wheel-driven virtual week, Gantt, automatic interior tour and exposed state are source-confirmed.','view.js:20-99,334-430,914-1007'),
    C('Cut4 D18 and Atlas 05 distinguish shared-week presentation from real planning authority.',`${cut}:210-305; ${atlas}:150-155,189-194; ${global}:416-450`),
    R('Rubik Story, Building, presentation and C1-C4 are current separate authorities.','js/building-ui.js:36-95; js/presentation-story-core.js:254-364; js/quantity-schedule-core.js:1-40; js/budget-draft-core.js:1-40')
  ],
  donorSourceLocators:[
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/house.js',symbol:'PHASES/WEEKS/dateAt',lines:'9-45',claim:'Ten fixed overlapping phase intervals, 14 weeks and a fixed weekday-only calendar drive the example.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/house.js',symbol:'add/update',lines:'618-640,1416-1470',claim:'Manually assigned piece phase and local timing control appearance, tints and site works at one week.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/view.js',symbol:'programmeSVG/updateUi',lines:'334-430,515-625',claim:'The authored PHASES, cursor date, decorative adjacent arrows and 3D share a week.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/view.js',symbol:'INTERIOR_STOPS/TOUR_KEYS/wheel/__state',lines:'20-99,914-1007',claim:'Five-stop interior spline follows week 13.38, and natural wheel sets virtual week while native scroll stays zero.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha,path:'05-schedule-build/sketch.css',symbol:'html/body overflow and programme layout',lines:'14-15,286-325,536-560',claim:'Fixed horizontal programme and limited breakpoint account for observed narrow and landscape limitations.',classification:'SOURCE_CONFIRMED'}
  ],
  cutsAtlas:[
    {locator:'Cut 4 D18 @cut4-d16-d17-d18.md; Global D18; Atlas 05',documentedDisposition:'D18: shared week Gantt/3D is adaptable presentation; Story transport already exists; fixed phases, dates and critical-path label are reference only; real planning and execution need separate durable authority.',relationToRuntime:'CONFIRMS',evidence:[C('D18 static phases, no precedence graph, no professional calendar or actual progress.',`${cut}:210-305`),O('A week advances Gantt and house in desktop.',s('desktop','forward-m07-roof.png'))]},
    {locator:'Atlas 05 @7696fb2c6c30f158001d38ecc53feb2674acaa25',documentedDisposition:'Programme, site and automatic interior handover share a virtual cursor; Atlas is a baseline and mobile/reverse required fresh verification.',relationToRuntime:'EXTENDS',evidence:[C('Pinned Atlas 05.',`${atlas}:150-155,189-194`),O('Fresh three-viewport A→B→A reveals responsive limits and visual restoration.',d('desktop','reverse-discovery.webm'))]}
  ],
  rubikCrosswalk:crosswalk,
  gaps:[
    {classification:'PRODUCT_DECISION_REQUIRED',statement:'A real plan requires durable tasks, element membership, calendar, dependencies, date provenance and separate actual-execution observations. The donor provides only fixed illustration.',evidence:[S('Static PHASES and derived dates.','house.js:9-45'),C('D18 contract decision required.',`${cut}:210-305`),R('Story progress is presentation state.','js/presentation-story-core.js:254-364')]},
    {classification:'INTEGRATION_GAP',statement:'Even an illustrative project-specific phase view needs explicit mapping from authorized Rubik element IDs to work states; donor piece assignments are house-specific.',evidence:[S('Pieces receive manual phases.','house.js:618-640'),R('Current Building identity.','js/building-ui.js:36-95')]},
    {classification:'DONOR_LIMITATION',statement:'CRITICAL PATH arrows and TODAY/date/complete labels imply planning precision absent from the fixed dataset.',evidence:[S('Adjacent arrows and cursor date.','view.js:382-430'),C('D18 planning semantics limits.',`${cut}:210-305`)]},
    {classification:'MOBILE_GAP',statement:'390×844 excludes the Gantt chart and clips controls; 844×390 overlaps week labels and obscures much of the 3D.',evidence:[O('Portrait phase screenshot.',s('portrait','forward-m07-roof.png')),O('Landscape phase screenshot.',s('landscape','forward-m07-roof.png'))]}
  ],
  candidateBridges:[
    {classification:'REUSE_EXISTING',problemSolved:'Seek and replay a presentation week deterministically.',rubikAuthoritiesPreserved:['Story absolute progress','Story lifecycle'],existingCapabilitiesConsumed:['Story seek and playback','presentation UI'],missingConnector:'None for transport; meaningful construction dates require separate authority.',donorMechanismReference:'view.js wheel/setTargetWeek is transport only',confidence:'HIGH',implementationAuthorized:false},
    {classification:'ADAPT_EXISTING',problemSolved:'Show a visual phase of actual Rubik Building elements.',rubikAuthoritiesPreserved:['Project and Building element IDs','Story presentation owner','material/light owners'],existingCapabilitiesConsumed:['Building geometry','Story sequence','View3D renderer'],missingConnector:'Authorized element-to-task mapping and deterministic time-state evaluator.',donorMechanismReference:'house.js add/update principle, not the fixed PHASES',confidence:'MEDIUM',implementationAuthorized:false},
    {classification:'DEFER',problemSolved:'Expose a real planned and actual construction Gantt if product scope calls for it.',rubikAuthoritiesPreserved:['Project/Building IDs','C1-C4 economic authority','Story transport'],existingCapabilitiesConsumed:['Building quantities','existing economic records','Story seek'],missingConnector:'Separate planning and execution data contracts with calendars, dependencies, work membership and provenance.',donorMechanismReference:'view.js programmeSVG as presentation reference only; decorative critical path rejected',confidence:'MEDIUM',implementationAuthorized:false}
  ],
  dependencies:['PRODUCT_CONTRACT_DECISION: illustrative construction story versus real editable plan and actual execution.','TECHNICAL_PREREQUISITE: explicit Rubik element-to-work membership and date provenance before temporal visibility is treated as factual.','TECHNICAL_PREREQUISITE: retain Story-owned seek and lifecycle; do not use C1-C4 quantity tables as job schedules.','TECHNICAL_PREREQUISITE: responsive chart and camera layout if a schedule presentation is later authorized.'],
  qaExpectations:[
    {category:'SEMANTIC',invariant:'A virtual week, scheduled week, current date and actual progress are separately labeled and sourced.'},
    {category:'SEMANTIC',invariant:'Critical path appears only when calculated from an authorized dependency graph.'},
    {category:'GEOMETRY',invariant:'Temporal piece visibility preserves current Building IDs and the one-house continuity.'},
    {category:'VISUAL',invariant:'All ten phase and five interior states are reproducible from absolute presentation progress.'},
    {category:'CAMERA',invariant:'Interior camera enters the completed house and reverse reaches the start view after smoothing settles.'},
    {category:'LIFECYCLE',invariant:'0→14→0 restores route, week, shot, visible HUD and presentation resources.'},
    {category:'MOBILE',invariant:'At 390×844 and 844×390 programme rows, week labels, controls and 3D remain readable.'},
    {category:'ACCESSIBILITY',invariant:'Week, phase and interior stop changes have nonvisual labels and usable controls.'},
    {category:'OUTPUT',invariant:'Any schedule export identifies plan source and distinguishes planned from actual dates.'},
    {category:'REGRESSION',invariant:'Donor phase assumptions do not persist into Rubik Project, C1-C4 or Building data.'}
  ],
  unresolved:[
    {severity:'NON_BLOCKING',question:'Hidden WebGL resource identity and the few-millisecond interior camera smoothing tail after returning to week zero are not established by screenshots.',attempts:['three independent virtual-week Discovery reverses','passive SHOT/TOUR telemetry','A0/A1 visual comparison'],evidenceNeeded:'Narrow resource or camera inspection only if exact hidden lifecycle identity becomes necessary; current visible restoration is supported.'},
    {severity:'NON_BLOCKING',question:'Should Rubik support illustrative construction playback or a real editable planned/actual schedule?',attempts:['three-viewport donor runtime','pinned source','Cut4 D18','frozen Rubik C1-C4 crosswalk'],evidenceNeeded:'Product contract decision after the fourteen-take audit; no implementation authorized.'}
  ]
};
await writeFile(path.join(dir,'reconciliation.json'),JSON.stringify(config,null,2)+'\n');
const rows=plan.milestones.map((m,i)=>`| ${m.label} | ${m.observedChange} | ${transitions[i].join(' / ')} | ${milestoneSources[i]} |`).join('\n');
const report=`# 05-a · The Programme — runtime audit\n\n## Professional service\n\n${config.professionalService.problemSolved} ${config.professionalService.serviceOutcome} ${config.professionalService.decisionValue}\n\n## Identity and capture\n\nPinned donor: \`${donor}\`. Frozen Rubik: \`${rubik}\`. Canonical URL: \`https://sam1983aing.github.io/flat-to-3d/05-schedule-build/index.html?dir=a\`. RAW: \`${raw}\`. Each viewport entered that canonical URL at virtual week 7, recorded a natural wheel prelude to week 0 in the same context, then a continuous 0→14→0 Discovery. The failed original desktop 30fps prelude remains preserved; desktop correction-1 at 10fps completed. Native scrollY stayed zero. Three fresh independent semantic passes captured fifteen milestones.\n\n## Observed A→B\n\n| Milestone | Observed change | Approximate virtual transition start / center / end | Pinned source |\n|---|---|---|---|\n${rows}\n\nTen authored phases show one timber house progressing from site set-up and excavation to structure, shell, finishes and furniture. Intervals overlap. The same virtual week advances 3D pieces, programme cursor and stage text. From week 13.38 the camera enters the completed house and follows five authored stops. The 390×844 layout loses the Gantt chart offscreen and clips top controls; the 844×390 chart has overlapping week labels and the programme blocks much of the 3D.\n\n## Reverse and lifecycle\n\nAll three natural reverses reach virtual week 0 and SHOT a2 on the same route while native scroll remains zero. A0/A1 screenshots are visually equivalent in each viewport; TOUR approaches zero with a small smoothing tail. Full hidden render-resource identity is NOT_OBSERVED. No reverse-only semantic state was found.\n\n## Source, Cuts and Rubik\n\n\`house.js\` hard-codes ten PHASES, a 14-week horizon, a weekday-only date function and phase-assigned pieces. \`view.js\` renders Gantt and site from that week, intercepts wheel input and authors five interior camera stops. Cut4 D18 and the pinned Atlas support the shared-week visual mechanism. They reject treating adjacent-row arrows as a precedence graph, the CRITICAL PATH title as computed CPM, TODAY as the actual current date or stage-local percent as actual execution. Rubik already has Project/Building, Story transport and C1-C4 quantity/economic authorities; a real job calendar and execution record are separate product decisions. The twelve-dimension crosswalk and bridge candidates record \`implementationAuthorized:false\`.\n\n## Unknowns\n\nHidden resource identity, exact camera smoothing history and product suitability remain bounded non-blocking unknowns. The donor phase dates, durations, work membership and percentages are not promoted to Rubik contract data.\n`;
await writeFile(path.join(dir,'audit.md'),report);
console.log(JSON.stringify({id,status:config.status,milestones:plan.milestones.length},null,2));
