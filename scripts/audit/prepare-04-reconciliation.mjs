import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const ev=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const id='04-demo-build-time-lapse',dir=path.join(ev,'takes',id);
const raw=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02',id);
const donor='Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6';
const rubik='Juanmaes83/floorplan-3d@0f9c6ead9732901681498efec326d1ca92e42ffe';
const atlas='Juanmaes83/floorplan-3d@7696fb2c6c30f158001d38ecc53feb2674acaa25:docs/product/ft3d-reference-atlas-2026-11-01.md';
const global='docs/product/ft3d-donor-global-reconciliation-2026-11-01.md';
const cut='docs/product/evidence/donor-cuts-2026-11-01/cut4-d16-d17-d18.md';
const O=(statement,locator)=>({class:'OBSERVED_RUNTIME',statement,locator});
const S=(statement,locator)=>({class:'DONOR_SOURCE',statement,locator:`${donor}:04-build-time-lapse/${locator}`});
const C=(statement,locator)=>({class:'CUT_ATLAS',statement,locator});
const R=(statement,locator)=>({class:'RUBIK_CURRENT',statement,locator:`${rubik}:${locator}`});
const disc=(vp,name)=>path.join(raw,vp,...(vp==='landscape'?[]:[vp==='desktop'?'discovery-correction-2':'discovery-correction-1']),`${vp}-${name}`);
const sem=(vp,name)=>path.join(raw,vp,`${vp}-${name}`);
const plan=JSON.parse(await readFile(path.join(dir,'semantic-plan.json'),'utf8'));
const transitions=[
  [.02,.05,.09],[.10,.15,.21],[.25,.30,.34],[.39,.45,.50],
  [.52,.55,.58],[.57,.60,.63],[.62,.65,.69],[.69,.74,.77],
  [.77,.80,.84],[.85,.90,.93],[.92,.95,.97],[.96,.99,1]
];
const portraitTransitions=structuredClone(transitions);
portraitTransitions[7]=[.67,.70,.74];portraitTransitions[8]=[.75,.78,.83];
const sourceLocators=[
  'js/main.js:94-106,224-283,313-317,404-474; js/pipe.js:225-265',
  'js/main.js:110-189,190-212,404-474; js/world.js:454-457,660-748',
  'js/main.js:110-212,404-474; js/world.js:660-748; js/stage.js:1-120',
  'js/main.js:190-212,404-474; js/world.js:660-748,1095-1120',
  'js/main.js:190-212,404-474; js/world.js:660-748,1095-1120',
  'js/main.js:190-212,404-474; js/world.js:660-748; js/stage.js:1-120',
  'js/main.js:190-212,404-474; js/stage.js:1-120',
  'js/main.js:168-212,404-474; js/stage.js:176-240',
  'js/main.js:168-212,404-474; js/stage.js:245-360',
  'js/main.js:213-283,404-474; js/pipe.js:127-265',
  'js/main.js:213-283,404-474; js/pipe.js:127-265',
  'js/main.js:213-283,404-474; js/programme.js:1-55; js/pipe.js:225-265'
].map(x=>`${donor}:04-build-time-lapse/${x}`);
const continuity=[
  'Drawing 01 zooms from the same six-view A-901 sheet without replacing the underlying house.',
  'The footing perimeter corresponds to the excavation shown in drawing 01.',
  'The same excavated site receives walls, mezzanine, temporary stair and crane.',
  'The roof slab and props occupy the previously built concrete shell.',
  'The same shell remains while temporary supports leave and finishes appear.',
  'The second-floor room is part of the same finished shell.',
  'Furniture and lights extend the same upper library/studio room.',
  'The tour descends within the same house to the first-floor kitchen and dining area.',
  'The first-floor living zone and terrace remain connected to the kitchen and stair.',
  'The exterior is the assembled house, with roof, glazing and terrace matching the site.',
  'The exterior is rendered as drawing 06 of the same house.',
  'Drawing 06 returns to its place among the original six drawings, with authored service copy.'
];
const crosswalk={
  semanticData:{status:'PARTIAL',claim:'Rubik Project/Building identities own actual geometry and rooms, but no general job/week/date/dependency authority is established for real construction progress. The donor PROG and 38 weeks are authored demo data.',evidence:[R('Current project and Building identities are distinct from presentation state.','js/building-ui.js:36-95; js/presentation-story-core.js:254-364')]},
  geometry:{status:'PARTIAL',claim:'Rubik builds real project geometry; the donor encodes appearance and disappearance times per merged vertex, including temporary work and finishes. No current element-to-work-package mapping is accredited.',evidence:[R('Current project geometry and level building path.','index.html:3594-3640; js/building-ui.js:36-95')]},
  representation:{status:'PARTIAL',claim:'Rubik has View3D and Story presentation; six synchronized fixed-week drawing rects from one scene are a separate bounded rendering mechanism.',evidence:[R('Current 3D presentation and sequence sources.','js/building-ui.js:36-95; js/presentation-story-core.js:254-364')]},
  materialsLight:{status:'PARTIAL',claim:'Rubik has current surface/light infrastructure; donor time-conditioned material replacement, stage props, sunlight and six paper/material passes are not demonstrated as one current feature.',evidence:[R('Surface renderer consumes current project appearances.','js/surface-renderer.mjs:1-74')]},
  camera:{status:'PARTIAL',claim:'Rubik has camera/route authorities, while the donor authored four-leg camera walk from pit through the upper and lower interiors is specific to this house.',evidence:[R('Current Story and route camera authorities.','js/presentation-story-core.js:111-170; js/presentation-route.js:1-156')]},
  transition:{status:'PARTIAL',claim:'Rubik absolute Story progress can drive reversible presentation, but a per-element construction time with paper-to-site and site-to-sheet transitions is not demonstrated.',evidence:[R('Current absolute Story state and sequence.','js/presentation-story-core.js:111-170,346-364')]},
  scrollProgress:{status:'EXISTS',claim:'Rubik already owns seek and playback; 29.4 viewport heights and donor WEEK_KEYS are authored transport for the demo, not construction authority.',evidence:[R('Current Story progress/seek.','js/presentation-story-core.js:346-364; js/presentation-ui.js:751-774')]},
  ui:{status:'PARTIAL',claim:'Rubik presentation controls exist. The donor programme block, WK indicator, paper notes and contact copy illustrate scheduling but are not a user-editable Gantt or verified actual progress.',evidence:[R('Current presentation UI controls and captions.','js/presentation-ui.js:8-31,613-774')]},
  mobile:{status:'PARTIAL',claim:'Rubik has responsive presentation paths; donor portrait crops context and the 844×390 desktop breakpoint clips the programme and lets its HUD obscure the lower view.',evidence:[R('Existing responsive presentation and mobile QA.','index.html:442-448; docs/qa/ft3d-6-implementation-2026-11-01.md:1-55')]},
  lifecycleRestore:{status:'EXISTS',claim:'Rubik Story owns lifecycle restore. Donor 04 returns route, scroll and drawings but the docked programme visible at A0 is missing at A1 in observed desktop and portrait passes.',evidence:[R('Current Story end and cleanup authority.','index.html:4615-4703')]},
  outputs:{status:'EXISTS',claim:'Rubik has current image/share output; donor sheet A-901 is an authored multi-view presentation, not a verified project export.',evidence:[R('Current image/share and ZIP outputs.','js/presentation-ui.js:239-288,321-360')]},
  qa:{status:'PARTIAL',claim:'Current presentation QA exists; any temporal bridge would require element/work authority, deterministic seek, multiple-pass isolation, reverse cleanup, responsive HUD and schedule honesty.',evidence:[R('Current presentation QA harness.','scripts/qa/render-presentation-templates.cjs:1-46')]}
};
const selectedKeyframes={
  desktop:['discovery-correction-2/desktop-start.png','desktop-forward-m01-drawing-01-dive.png','desktop-forward-m02-footings-site.png','desktop-forward-m03-walls-mezzanine.png','desktop-forward-m04-roof-pour-props.png','desktop-forward-m05-finish-replaces-temporaries.png','desktop-forward-m06-second-floor-library.png','desktop-forward-m08-first-floor-kitchen.png','desktop-forward-m09-living-terrace.png','desktop-forward-m10-handover-exterior.png','desktop-forward-m11-drawing-06-return.png','desktop-forward-m12-six-drawing-close.png','discovery-correction-2/desktop-restored-start.png'],
  portrait:['discovery-correction-1/portrait-start.png','portrait-forward-m02-footings-site.png','portrait-forward-m04-roof-pour-props.png','portrait-forward-m06-second-floor-library.png','portrait-forward-m08-first-floor-kitchen.png','portrait-forward-m09-living-terrace.png','portrait-forward-m11-drawing-06-return.png','portrait-forward-m12-six-drawing-close.png','discovery-correction-1/portrait-restored-start.png'],
  landscape:['landscape-start.png','landscape-forward-m03-walls-mezzanine.png','landscape-forward-m04-roof-pour-props.png','landscape-forward-m07-mezzanine-lounge.png','landscape-forward-m09-living-terrace.png','landscape-forward-m12-six-drawing-close.png','landscape-restored-start.png']
};
const config={
  schemaVersion:'rubik-donor-runtime-audit.reconciliation.v1',status:'AUDITED_WITH_DONOR_LIMITATION',
  discoveryRun:{desktop:'discovery-correction-2',portrait:'discovery-correction-1'},
  progressModel:{desktop:'SCROLL_PLUS_TIME',portrait:'SCROLL_PLUS_TIME',landscape:'SCROLL_PLUS_TIME'},
  transitions,transitionsByViewport:{portrait:portraitTransitions},milestoneSources:sourceLocators,continuity,
  viewportSupport:{desktop:'SUPPORTED',portrait:'DONOR_LIMITATION',landscape:'DONOR_LIMITATION'},
  viewportEvidence:{
    desktop:[O('The stable A0 and A1 drawings match, but the A0 programme block is not visible at A1.',disc('desktop','restored-start.png'))],
    portrait:[O('Narrow framing crops the first-floor kitchen and living room into separate partial views.',sem('portrait','forward-m08-first-floor-kitchen.png')),O('At the closing sheet the contact action overlays the programme rows.',sem('portrait','forward-m12-six-drawing-close.png'))],
    landscape:[O('The programme block extends beyond the right edge of the 844×390 opening.',disc('landscape','start.png')),O('The large lower programme HUD obscures much of the structure and room at 844×390.',sem('landscape','forward-m04-roof-pour-props.png')),S('The mobile CSS breakpoint is 700px wide.','index.html:224-260')]
  },
  restoreVerdict:{desktop:'NOT_RESTORED',portrait:'NOT_RESTORED',landscape:'NOT_RESTORED'},
  restoreReview:{desktop:'Natural reverse reaches scrollY=0 and restores all six drawings. A0 programme rect is x=839.6, y=62, 580×117, opacity=1. After 2.5 seconds at A1, the programme still has text and opacity=1 but its rect is x=2590.8, y=-364.3, 1842×117: entirely outside the 1440×900 viewport. Full visible UI is NOT_RESTORED. Exact style/cause and hidden WebGL resource identity are NOT_OBSERVED.',portrait:'Natural reverse reaches scrollY=0 and restores all six drawings, but the programme visible below the heading at A0 is absent at A1. Full visible UI is NOT_RESTORED; internal resource identity is NOT_OBSERVED.',landscape:'Natural reverse reaches scrollY=0 and restores the six drawings. At A0 the programme dock is visibly clipped beyond the right edge; at A1 even that fragment is absent. Full visible UI is NOT_RESTORED; internal resource identity is NOT_OBSERVED.'},
  reverseOnlyMilestones:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'No independent reverse-only building phase established. The same house withdraws from drawing 06 through completed interiors, temporary props and excavation to the six drawings; the programme dock does not return to its A0 position.'])),
  selectedKeyframes,
  professionalService:{problemSolved:'Explains a proposed construction sequence for one hillside house through an aligned programme, staged 3D site and fixed-week drawings.',primaryUsers:['architect','client','construction planner'],serviceOutcome:'The visitor sees excavation through structure, props, finishes and handover while a week indicator and programme move together, then the completed house returns to drawing 06 on the six-view sheet.',decisionValue:'Useful for discussing intended construction order and temporary works only as an illustration. The 38-week durations and stage assignments are authored demo content, not a calculated schedule or actual execution record.',evidence:[O('Three-viewport forward captures traverse site and return to six drawings.',disc('desktop','forward-discovery.webm')),S('PROG/TILES, WEEK_KEYS and per-vertex week attributes define one shared demo calendar.','js/programme.js:1-30; js/main.js:190-212; js/world.js:454-457')]},
  continuityInvariants:[
    {statement:'Six drawings show stages of one house at fixed weeks rather than six independent projects.',evidence:[S('PROG/TILES share the same scene and weeks.','js/programme.js:1-30'),S('P.draw renders per-tile time/rectangle over one scene.','js/pipe.js:225-265'),O('Initial six-drawing sheet.',disc('desktop','start.png'))]},
    {statement:'The excavated footing pit becomes the same concrete shell and roof, then gains finishes and furniture.',evidence:[O('Footings around the pit.',sem('desktop','forward-m02-footings-site.png')),O('Concrete walls and mezzanine.',sem('desktop','forward-m03-walls-mezzanine.png')),O('Finished library in the same shell.',sem('desktop','forward-m06-second-floor-library.png'))]},
    {statement:'Temporary props are present under the roof pour and absent from the finished upper room.',evidence:[O('Dense roof props.',sem('desktop','forward-m04-roof-pour-props.png')),O('Empty finished room before furniture.',sem('desktop','forward-m05-finish-replaces-temporaries.png')),S('Temporal appearance/out attributes govern part lifetime.','js/world.js:454-457,660-748')]},
    {statement:'The completed exterior becomes drawing 06 and returns to the original six-view sheet.',evidence:[O('Material exterior.',sem('desktop','forward-m10-handover-exterior.png')),O('Drawing 06.',sem('desktop','forward-m11-drawing-06-return.png')),O('Six-view close.',sem('desktop','forward-m12-six-drawing-close.png'))]}
  ],
  evidenceLedger:[
    O('Original desktop/portrait starts were still in autonomous hero drawing; original RAW is preserved and stable-start corrections were captured.',path.join(raw,'desktop/discovery-summary.json')),
    O('Desktop correction-2, portrait correction-1 and original landscape each record natural A→B→A and continuous video.',disc('desktop','forward-discovery.webm')),
    O('Fresh semantic passes show the paper-to-site build and sheet return in all three viewports.',sem('desktop','forward-semantic.webm')),
    O('A0/A1 drawings and scroll origin return, but the programme dock is absent after reverse in desktop and portrait.',disc('portrait','restored-start.png')),
    O('After 2.5 seconds at A1, the desktop programme remains opacity 1 but is located at x=2590.8 outside the viewport; at A0 it was x=839.6.',path.join(raw,'desktop/discovery-correction-2/reverse-state.json')),
    S('Hero drawing completion is signaled only after S.drawn at window.__heroDone.','js/main.js:284-309,386-400'),
    S('PROG/TILES are shared; WEEK_KEYS maps scroll to week; temporal attributes and pipeline render one scene at several weeks.','js/programme.js:1-30; js/main.js:190-212; js/world.js:454-457,660-748; js/pipe.js:225-265'),
    C('Atlas 04 records six-view-to-site and return; Cut4 D16/D17 and global reconciliation reject demo weeks as real planning authority.',`${atlas}:145-148; ${cut}:29-49,68-100; ${global}:377-416`),
    R('Current Rubik already owns Story transport, Project/Building geometry and presentation lifecycle.','js/presentation-story-core.js:254-364; js/building-ui.js:36-95; index.html:4615-4703')
  ],
  donorSourceLocators:[
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'04-build-time-lapse/js/programme.js',symbol:'PROG/TILES/SEQ.place',lines:'1-55',claim:'One authored 38-week programme drives loader, six fixed-week drawings and on-site HUD.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'04-build-time-lapse/js/main.js',symbol:'WEEK_KEYS/weekAt/LEGS/END/frame',lines:'110-212,386-474',claim:'The 29.4vh scroll maps to authored weeks, camera route, paper/site blend, HUD and drawing-06 return.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'04-build-time-lapse/js/main.js',symbol:'S.drawn/window.__heroDone',lines:'284-309,386-400',claim:'Autonomous six-drawing hero must finish before a stable A0 capture.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'04-build-time-lapse/js/world.js',symbol:'weekly/stamp/partWeeks/bucketsOf/propsAt',lines:'373-382,454-457,660-748,1095-1120',claim:'Per-vertex appearance and removal weeks, shared uniforms and temporaries create staged geometry; schedule is authored.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'04-build-time-lapse/js/pipe.js',symbol:'makePipe/P.draw/useSet',lines:'31-56,127-265',claim:'One scene is rendered into up to six rects at separate fixed weeks using paper and material passes.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'04-build-time-lapse/index.html',symbol:'responsive breakpoint/programme',lines:'112-205,224-260',claim:'The 700px width breakpoint leaves 844×390 in a clipped desktop programme layout.',classification:'SOURCE_CONFIRMED'}
  ],
  cutsAtlas:[
    {locator:'Cut 4 D16 @cut4-d16-d17-d18.md; Global D16; Atlas 04',documentedDisposition:'D16-C1 ADAPT principle of time-evaluated appearance/removal; D16-C2 DEFER actual planning domain; D16-C3 REJECT authored 38-week/coordinate schedule',relationToRuntime:'CONFIRMS',evidence:[C('Cut4 distinguishes time shader principle from real plan authority.',`${cut}:68-121`),O('Week 19 props and week 27 finished room are distinct states.',sem('desktop','forward-m04-roof-pour-props.png'))]},
    {locator:'Cut 4 D17 @cut4-d16-d17-d18.md; Global D17; Atlas 04',documentedDisposition:'D17-C1 ADAPT bounded multi-view representation; D17-C2 REJECT independent construction domain; D17-C3 REFERENCE ONLY fixed six tiles/pipeline',relationToRuntime:'CONFIRMS',evidence:[C('Cut4 treats six views as one scene at distinct times.',`${cut}:147-205`),O('Six fixed-week views share A-901 sheet.',disc('desktop','start.png'))]},
    {locator:'Atlas 04 @7696fb2c6c30f158001d38ecc53feb2674acaa25',documentedDisposition:'Six live drawings zoom into site, stage 38 weeks and return through drawing 06; mobile and lifecycle require fresh runtime evaluation',relationToRuntime:'EXTENDS',evidence:[C('Pinned Atlas 04 baseline.',`${atlas}:145-148`),O('Natural B→A reveals absent programme dock at A1.',disc('desktop','restored-start.png'))]}
  ],
  rubikCrosswalk:crosswalk,
  gaps:[
    {classification:'PRODUCT_DECISION_REQUIRED',statement:'A real construction timeline needs durable element-to-work membership, planned dates/dependencies and actual progress authority; donor PROG and WEEK_KEYS supply none.',evidence:[S('PROG is fixed 38-week data.','js/programme.js:1-30'),C('Cut4 D16-C2 defers domain decisions.',`${cut}:68-121`),R('Story owns presentation time, not construction jobs.','js/presentation-story-core.js:254-364')]},
    {classification:'REPRESENTATION_GAP',statement:'A bounded Rubik comparison could evaluate one current Building at multiple authorized states, but fixed six tile/paper passes and their GPU cost are donor presentation choices.',evidence:[S('P.draw uses one scene and tile-specific time.','js/pipe.js:225-265'),R('Building sources/IDs are current Rubik authorities.','js/building-ui.js:36-95')]},
    {classification:'DONOR_LIMITATION',statement:'Portrait closing contact button overlays schedule rows; landscape programme/HUD is clipped or obscures the low viewport.',evidence:[O('Portrait closing overlap.',sem('portrait','forward-m12-six-drawing-close.png')),O('Landscape schedule off right at A0.',disc('landscape','start.png'))]},
    {classification:'DONOR_LIMITATION',statement:'Natural reverse returns the six drawings and scroll origin but does not visually restore the initial programme dock.',evidence:[O('Desktop stable A0.',disc('desktop','start.png')),O('Desktop A1 lacks the dock.',disc('desktop','restored-start.png'))]}
  ],
  candidateBridges:[
    {classification:'ADAPT_EXISTING',problemSolved:'Present an authorized construction state for actual Rubik elements at a chosen time.',rubikAuthoritiesPreserved:['Project/Building element IDs','Story absolute progress and lifecycle','existing material/light owners'],existingCapabilitiesConsumed:['Story seek/sequence','View3D geometry','current appearance renderer'],missingConnector:'Explicit source for work membership and element appearance/removal intervals, plus deterministic rendering of the derived state.',donorMechanismReference:'world.js:weekly/stamp/partWeeks as a time-evaluation principle; authored PROG and spatial week formulas rejected',confidence:'MEDIUM',implementationAuthorized:false},
    {classification:'ADAPT_EXISTING',problemSolved:'Compare one real Building at several authorized time states.',rubikAuthoritiesPreserved:['one current Building source and IDs','one time authority','render pass isolation'],existingCapabilitiesConsumed:['Building view source','View3D camera/rendering','Story progress'],missingConnector:'Time-state evaluator and bounded multi-pass view isolation; product choice for whether comparison is needed.',donorMechanismReference:'pipe.js:P.draw; six fixed tiles and material pipeline reference only',confidence:'MEDIUM',implementationAuthorized:false},
    {classification:'REUSE_EXISTING',problemSolved:'Keep presentation playback and reverse tied to current project state.',rubikAuthoritiesPreserved:['Story transport and restore','Project/Building data'],existingCapabilitiesConsumed:['Story seek/playback','presentation UI'],missingConnector:'None for transport; a real schedule remains a separate domain decision.',donorMechanismReference:'main.js:weekAt is demo choreography, not a project schedule',confidence:'HIGH',implementationAuthorized:false}
  ],
  dependencies:['PRODUCT_CONTRACT_DECISION: illustration versus real planned/actual construction progress must be explicit before durable schedule data.','TECHNICAL_PREREQUISITE: preserve real Project/Building element IDs and their mapping to any authorized jobs before temporal visibility.','TECHNICAL_PREREQUISITE: Story-owned absolute seek and clean restore before multi-view or paper/site presentation.','TECHNICAL_PREREQUISITE: isolate render passes and resources if the same Building is shown at several times.'],
  qaExpectations:[
    {category:'SEMANTIC',invariant:'Weeks, phases and actual progress are labeled according to their authoritative source; authored illustration is not reported as execution.'},
    {category:'GEOMETRY',invariant:'Element IDs and geometry remain stable as temporal appearance and removal are evaluated.'},
    {category:'VISUAL',invariant:'Props, formwork and staging appear and disappear at sourced intervals without changing permanent model identity.'},
    {category:'VISUAL',invariant:'Six or fewer independent time views do not contaminate one another through shared uniforms, materials, depth or camera state.'},
    {category:'LIFECYCLE',invariant:'Forward, seek and reverse produce the same state for the same absolute time.'},
    {category:'LIFECYCLE',invariant:'Reverse restores the programme dock, captions, camera and rendering as well as scroll origin.'},
    {category:'MOBILE',invariant:'Programme and call to action do not overlap at 390×844; 844×390 retains legible programme and site.'},
    {category:'OUTPUT',invariant:'Any exported sheet uses current project geometry and labels its time/source.'},
    {category:'REGRESSION',invariant:'Presentation never writes donor phase assumptions or geometry into the saved Rubik project.'}
  ],
  unresolved:[
    {severity:'NON_BLOCKING',question:'The cause of the programme rect moving outside the desktop viewport after reverse, and hidden render-resource identity, are not established from passive captures.',attempts:['stable A0/A1 screenshots in three viewports','natural reverse videos','pinned programme.js/main.js inspection','separate desktop 2.5-second settled correction with passive programme rect and opacity'],evidenceNeeded:'A narrow read-only computed-style/transform trace only if root-cause attribution becomes necessary; do not infer hidden WebGL resource identity from screenshots.'},
    {severity:'NON_BLOCKING',question:'Whether Rubik should offer an illustrative sequence or a real planned/actual construction domain is a later product/contract decision.',attempts:['three-viewport runtime audit','pinned donor source','Cut4 D16/D17','frozen Rubik crosswalk'],evidenceNeeded:'Human product decision after all 14 take audits; no implementation authorized here.'}
  ]
};
await writeFile(path.join(dir,'reconciliation.json'),JSON.stringify(config,null,2)+'\n');
const rows=plan.milestones.map((m,i)=>`| ${m.label} | ${m.observedChange} | ${transitions[i].join(' / ')} | ${sourceLocators[i]} |`).join('\n');
const report=`# 04 · Build Time-Lapse — runtime audit\n\n## Professional service\n\n${config.professionalService.problemSolved} ${config.professionalService.serviceOutcome} The 38 weeks and programme are a scripted example, not a Rubik construction plan or progress report.\n\n## Identity and capture\n\nPinned donor: \`${donor}\`. Frozen Rubik: \`${rubik}\`. Standalone: \`https://sam1983aing.github.io/flat-to-3d/04-build-time-lapse/index.html\`. RAW: \`${raw}\`. Desktop and portrait original Discovery starts occurred before the autonomous hero completed; their RAW remains preserved. Discovery correction-1 in each waits for \`window.__heroDone\`. Landscape original starts after the same marker. All three traverse A→B→A in independent contexts; fresh semantic passes cover twelve milestones.\n\n## Observed A→B\n\n| Milestone | Observed change | Desktop native transition start / center / end | Pinned source |\n|---|---|---|---|\n${rows}\n\nSix live drawings of one house zoom through drawing 01 into a material site. Excavation, footings, walls, props, roof, finishes and furnishings follow the 38-week demo programme. The camera exits to the completed house, converts it to drawing 06 and returns it to the six-view sheet and authored service close. The portrait crop separates upper and lower interior details; the landscape programme consumes a large share of the 390px height.\n\n## Reverse and lifecycle\n\nNatural B→A reverses the site sequence and returns the drawings and scroll origin without reload. Stable A0/A1 screenshots show the initial docked programme block missing at A1 in desktop and portrait; at 844×390 the A0 dock is clipped to the right and the A1 dock is absent. The take's full UI restore verdict is \`NOT_RESTORED\`. The exact layout/opacity cause and internal render-resource identity remain bounded \`NOT_OBSERVED\` until the passive settled correction is inspected.\n\n## Source, Cuts and Rubik\n\n\`programme.js\` defines one fixed 38-week PROG and six TILES. \`main.js\` maps 29.4 viewport heights through WEEK_KEYS and an authored four-leg route. \`world.js\` attaches appearance/removal times to geometry and temporary work, while \`pipe.js\` evaluates one scene at six tile times. Cut4 D16/D17 and the Atlas support time-evaluation and multi-view principles but explicitly reject treating the donor weeks and six-tile layout as a real Rubik plan. Rubik already has Project/Building identities, View3D, Story seek, lifecycle and output; its missing construction authority is a distinct domain decision. The twelve-dimension crosswalk, gaps and candidate bridges retain \`implementationAuthorized:false\`.\n\n## Unknowns\n\nThe A1 programme cause, hidden render-resource identity and product suitability are non-blocking unknowns. No donor phase duration, work membership or actual-progress claim is promoted to a current Rubik contract.\n`;
const finalReport=report
  .replace('Discovery correction-1 in each waits for `window.__heroDone`. Landscape original starts after the same marker.', 'Desktop correction-1 and correction-2, portrait correction-1 and landscape original wait for `window.__heroDone`. Desktop correction-2 also waits 2.5 seconds at A1 and passively records programme bounds and opacity; earlier attempts remain preserved.')
  .replace('The exact layout/opacity cause and internal render-resource identity remain bounded `NOT_OBSERVED` until the passive settled correction is inspected.', 'Desktop correction-2 confirms that after 2.5 seconds the programme remains opacity 1 and retains its text, but its rect is x=2590.8, y=-364.3, 1842×117, entirely outside the 1440×900 viewport; at A0 it was x=839.6, y=62, 580×117. The exact style cause and hidden render-resource identity remain bounded `NOT_OBSERVED`.');
await writeFile(path.join(dir,'audit.md'),finalReport);
console.log(JSON.stringify({id,status:config.status,milestones:plan.milestones.length},null,2));
