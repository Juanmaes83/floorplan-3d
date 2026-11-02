import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const id='07-a-one-door';
const dir=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02/takes',id);
const raw=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02',id);
const donor='Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:07-sunlit-elevation/';
const rubik='Juanmaes83/floorplan-3d@0f9c6ead9732901681498efec326d1ca92e42ffe:';
const global='docs/product/ft3d-donor-global-reconciliation-2026-11-01.md';
const cut1='Juanmaes83/floorplan-3d@6a573f1955fd70dd52bb10450c9b9df9b4833aa0:docs/product/ft3d-donor-code-gap-analysis-2026-11-01.md';
const cut3='docs/product/evidence/donor-cuts-2026-11-01/cut3-d14-d15-d19.md';
const atlas='Juanmaes83/floorplan-3d@7696fb2c6c30f158001d38ecc53feb2674acaa25:docs/product/ft3d-reference-atlas-2026-11-01.md';
const O=(statement,locator)=>({class:'OBSERVED_RUNTIME',statement,locator:path.join(raw,locator)});
const S=(statement,locator)=>({class:'DONOR_SOURCE',statement,locator:donor+locator});
const C=(statement,locator)=>({class:'CUT_ATLAS',statement,locator});
const R=(statement,locator)=>({class:'RUBIK_CURRENT',statement,locator:rubik+locator});
const shot=(v,n)=>`${v}/${v}-${n}.png`;
const plan=JSON.parse(await readFile(path.join(dir,'semantic-plan.json'),'utf8'));
if(plan.milestones.length!==11)throw Error('Expected 11 observed milestones');
const sources=[
 'a-one-door/page.js:28-36,59-61; engine/elevation.js:1146-1187',
 'a-one-door/page.js:61-64; engine/elevation.js:34-58,106-119',
 'a-one-door/page.js:61-64; engine/elevation.js:34-58,106-119',
 'a-one-door/page.js:65-70; engine/elevation.js:143-161',
 'a-one-door/page.js:28-36,59-60; engine/elevation.js:1146-1187',
 'a-one-door/page.js:71-73; engine/elevation.js:977-1003,1090-1096',
 'a-one-door/page.js:28-36,79-80; engine/elevation.js:566-850,1146-1187',
 'a-one-door/page.js:28-36,81; engine/elevation.js:566-850,1146-1187',
 'a-one-door/page.js:71-73; engine/elevation.js:847-855,1094-1096',
 'a-one-door/page.js:28-36,82; engine/elevation.js:566-850,1146-1187',
 'a-one-door/page.js:28-36,82; engine/elevation.js:1205-1422'
];
const continuity=[
 'The same central door, balcony, stacked windows and neighboring row remain while the optic reveals depth.',
 'The luminous front crosses the same central door, balcony, windows and shadow-bearing facade.',
 'Finished brick retains the original openings and balcony positions.',
 'The same facade edges produce the moving shadow pattern under a changing sun.',
 'The camera approaches the central door that was present on the initial elevation.',
 'The oak leaf pivots within that same central opening, revealing the hall behind it.',
 'The continuous hall floor and stair lead toward the parlour, bookshelves and rear glazing.',
 'The parlour floor and rear glazing lead to the same kitchen/dining atrium.',
 'The garden doors occupy the glazing already visible from the atrium, with the same tree beyond.',
 'The camera passes through those garden doors to the walled courtyard and same tree.',
 'The walled courtyard and tree stay in place as the donor property text settles.'
];
const transitions=[[.04,.07,.10],[.14,.16,.19],[.23,.25,.29],[.30,.34,.38],[.39,.42,.46],[.46,.49,.53],[.57,.63,.68],[.74,.79,.82],[.81,.85,.88],[.88,.92,.95],[.96,.99,1]];
const cross={
 semanticData:['PARTIAL','Rubik owns project dimensions/identities; donor street address, 186 m², sales status and CTA are authored demonstration data.','index.html:1034-1053; js/building-ui.js:36-95'],
 geometry:['EXISTS','Rubik already builds walls, openings and levels from its project. Donor fixed townhouses/interior do not replace that authority.','index.html:3486-3640; js/building-ui.js:36-95'],
 representation:['PARTIAL','Rubik has elevation/story representation and View3D; shadow-coherent ink hatching and co-registered spatial paper-to-brick sweep are not established as current modes.','js/presentation-elevation-core.js:171-247; js/surface-renderer.mjs:1-74'],
 materialsLight:['EXISTS','Rubik owns materials, HDR/PMREM, shadows and optional Solar snapshot. The donor hatch and sun animation need separate adaptation if selected.','index.html:3758-3865; js/presentation-elevation-core.js:225-247'],
 camera:['PARTIAL','Rubik has elevation framing, Story lenses and route authorities; the exact street-to-courtyard camera keys are donor choreography.','js/presentation-elevation-core.js:171-247; js/presentation-route.js:1-156'],
 transition:['PARTIAL','Rubik has absolute Story/reveal state; the donor shadow-derived technical/material front is a particular representation transition.','js/presentation-story-core.js:346-364; index.html:3344-3385'],
 scrollProgress:['EXISTS','Rubik Story owns absolute seek and playback. Donor Lenis 760vh track is a transport implementation.','js/presentation-story-core.js:346-364; js/presentation-ui.js:751-774'],
 ui:['PARTIAL','Rubik has presentation controls and captions. Donor radar, sheet labels, address and booking CTA are authored communication and require source truth if reused.','js/presentation-ui.js:8-31,613-774'],
 mobile:['PARTIAL','Rubik has mobile presentation paths; this donor uses a portrait camera override and landscape composition, which need independent framing QA for any adapted service.','index.html:210-218; docs/qa/ft3d-6-implementation-2026-11-01.md:46-54'],
 lifecycleRestore:['EXISTS','Rubik Story has end/restore ownership. Donor A0/A1 are visually equivalent after natural reverse; internal donor resource identity is not observed.','js/presentation-story-core.js:346-364; js/presentation-ui.js:751-774'],
 outputs:['EXISTS','Rubik has presentation/still outputs and project provenance; donor sales CTA is not a Rubik output requirement.','js/presentation-ui.js:8-31,613-774'],
 qa:['PARTIAL','Rubik has FT3D-6 QA, while a shadow-coherent sweep/door route would require its own reverse, mobile and semantic truth checks.','docs/qa/ft3d-6-implementation-2026-11-01.md:1-75']
};
const rubikCrosswalk=Object.fromEntries(Object.entries(cross).map(([k,[status,claim,locator]])=>[k,{status,claim,evidence:[R(claim,locator)]}]));
const config={
 schemaVersion:'rubik-donor-runtime-audit.reconciliation.v1',status:'AUDITED',
 discoveryRun:{desktop:null,portrait:null,landscape:null},semanticRun:{desktop:null,portrait:null,landscape:null},
 progressModel:{desktop:'SCROLL_PLUS_TIME',portrait:'SCROLL_PLUS_TIME',landscape:'SCROLL_PLUS_TIME'},
 transitions,milestoneSources:sources.map(x=>donor+x),continuity,
 viewportSupport:{desktop:'SUPPORTED',portrait:'SUPPORTED',landscape:'SUPPORTED'},
 viewportEvidence:{desktop:[],portrait:[],landscape:[]},
 restoreVerdict:{desktop:'VISUALLY_EQUIVALENT',portrait:'VISUALLY_EQUIVALENT',landscape:'VISUALLY_EQUIVALENT'},
 restoreReview:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'Natural B→A returned to scrollY 0, same route/hash, initial 2° orthographic elevation, sun readout, hero/sheet text and central townhouse appearance. Front and rear doors, material sweep and changed shadows are no longer visually present; passive evidence does not prove identity-level internal restore.'])),
 reverseOnlyMilestones:{desktop:[],portrait:[],landscape:[]},
 selectedKeyframes:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,[`${v}-start.png`,`${v}-end.png`,`${v}-restored-start.png`,`${v}-forward-m02-material-sweep-onset.png`,`${v}-forward-m06-door-opens.png`,`${v}-forward-m09-rear-doors-open.png`]])),
 professionalService:{problemSolved:'Let an architect or client read one drawn street elevation as a sunlit, materialized house and follow its front door through actual room relationships to the rear courtyard.',primaryUsers:['architect','client','design reviewer'],serviceOutcome:'The same townhouse drawing gains depth, brick and physically related shadow; a reversible camera route tests entry, parlour, atrium and garden continuity.',decisionValue:'Can clarify facade depth, orientation, shadow and room sequence in project review. Donor address, area, status and booking call to action are authored copy, not verified Rubik project facts.',evidence:[O('The drawn No. 7 elevation becomes materialized and the route reaches its courtyard.',shot('desktop','forward-m11-terminal-courtyard')),S('Pinned take describes depth, material, sun movement and front-to-back walk.','a-one-door/page.js:1-7')]},
 continuityInvariants:[
  {statement:'The same doorway, balcony and stacked windows survive oblique depth and paper-to-brick transformation.',evidence:[O('Central facade in ink.',shot('desktop','start')),O('Same facade after material sweep.','desktop/desktop-forward-discovery-p025.png'),S('One h house and shared geometry drive both appearances.','a-one-door/page.js:9-13,59-73; engine/elevation.js:938-1003')]},
  {statement:'The front door opens into the entrance hall, with a continuous floor, stair, parlour and atrium toward the rear.',evidence:[O('Front door partially open.',shot('desktop','forward-m06-door-opens')),O('Continuous reception view.',shot('desktop','forward-m07-reception-parlour'))]},
  {statement:'Rear glazing and tree remain related as doors open and camera enters the same walled courtyard.',evidence:[O('Doors opening from atrium.',shot('desktop','forward-m09-rear-doors-open')),O('Courtyard end.',shot('desktop','end'))]}
 ],
 evidenceLedger:[O('Three clean-context Discovery A→B→A passes and semantic A→B passes recorded.','desktop/desktop-forward-discovery.webm'),O('Desktop ink elevation and 2° optic at stable A0.',shot('desktop','start')),O('Portrait separately reaches the courtyard.',shot('portrait','end')),O('Landscape separately reaches the courtyard.',shot('landscape','end')),O('All three restored A1 screenshots match the start visually after natural reverse.',shot('desktop','restored-start')),S('Frame maps camera, depth cue, spatial sweep, sun and doors from absolute p.','a-one-door/page.js:28-73'),C('Global D07 retains Rubik light/material authority and adapts coherent hatching.',`${global}:209-225`),R('Rubik elevation Story already composes facade framing and optional solar state.','js/presentation-elevation-core.js:171-247')],
 donorSourceLocators:[
  ['a-one-door/page.js','KEYS / frame','28-73','Camera keys and absolute depth/sweep/sun/door mapping produce the observed ordered states.'],
  ['engine/elevation.js','GLSL_COMMON / mat','31-119,352-429','Shadow-derived technical hatch and spatial uSweep determine ink/material appearance.'],
  ['engine/elevation.js','setSun / sun shadow','143-161','Directional light and its shadow map move together.'],
  ['engine/elevation.js','house / setDoor / setGardenDoor','938-1096','One house has pivoting front and rear door groups.'],
  ['engine/elevation.js','camAt','1146-1187','Perspective/orthographic look and phone framing interpolate authored camera keys.'],
  ['engine/elevation.js','run / scrollP / __introDone','1205-1422','Lenis animatedScroll drives progress; self-drawn intro completes before stable A0.']
 ].map(([p,s,l,claim])=>({repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:`07-sunlit-elevation/${p}`,symbol:s,lines:l,claim,classification:'SOURCE_CONFIRMED'})),
 cutsAtlas:[
  {locator:`Cut1 D07 ${cut1}; Atlas D07 ${atlas}; Global D07 ${global}:209-225`,documentedDisposition:'D07-C1 ADAPT shadow-coherent hatch; C2 KEEP EXISTING Rubik material/light/Solar; C3 REJECT donor-specific AO and one-light assumptions. Historical Cut1 extraction is prior analysis, not an implementation instruction.',relationToRuntime:'EXTENDS',evidence:[C('Prior Cut1 and Global distinguish shadow-based graphical principle from Rubik light authority.',`${cut1}; ${global}:209-225`),O('Observed hatching tracks the same facade shadow before/after materialization.',shot('desktop','forward-m02-material-sweep-onset'))]},
  {locator:`Cut3 D19 ${cut3}:162-239; Atlas D19 ${atlas}; Global D19 ${global}:431-447`,documentedDisposition:'D19-C1 KEEP EXISTING geometry/material/environment; C2 ADAPT sourced camera/light/material coordination; C3 REJECT universal brick/clearcoat/renderer rewrite.',relationToRuntime:'CONFIRMS',evidence:[C('Cut3 and Global already credit Rubik geometry/material infrastructure.',`${cut3}:162-239; ${global}:431-447`),O('The same townhouse displays richer brick/detail without becoming a different geometry.',shot('desktop','forward-m03-material-sweep-complete'))]}
 ],
 rubikCrosswalk,
 gaps:[
  {classification:'NO_GAP',statement:'Rubik already owns project geometry, materials, light, presentation progress and restore infrastructure.',evidence:[R('Existing project/Story/elevation infrastructure.','index.html:3486-3640; js/presentation-elevation-core.js:171-247; js/presentation-story-core.js:346-364')]},
  {classification:'REPRESENTATION_GAP',statement:'A project-derived shadow-coherent ink hatch and spatially registered ink-to-material facade front are not accredited in current Rubik.',evidence:[S('Donor shader connects shadow, hatch and uSweep.','engine/elevation.js:31-119,352-429'),R('Current elevation Story composes camera/solar without this donor front.','js/presentation-elevation-core.js:171-247')]},
  {classification:'ORCHESTRATION_GAP',statement:'If selected later, one Story state would have to coordinate drawing, relief, sun, doors and front-to-back route without mutating project authority.',evidence:[S('Donor frame coordinates those states from p.','a-one-door/page.js:28-73'),R('Rubik Story and elevation already have absolute progress.','js/presentation-story-core.js:346-364; js/presentation-elevation-core.js:171-247')]}
 ],
 candidateBridges:[
  {classification:'ADAPT_EXISTING',problemSolved:'If selected later, preserve the same project facade while moving from technical shadow hatching to sourced material/light.',rubikAuthoritiesPreserved:['Project/Building geometry','Rubik material/light/Solar','Story absolute state'],existingCapabilitiesConsumed:['elevation Story','View3D geometry/materials','Solar snapshot'],missingConnector:'Project-derived hatch/mask adapter registered to geometry and shadow, with independent source/data provenance.',donorMechanismReference:'engine/elevation.js:31-119,352-429; Global D07-C1 ADAPT, D07-C2 KEEP, D07-C3 REJECT',confidence:'MEDIUM',implementationAuthorized:false},
  {classification:'CONNECT_EXISTING',problemSolved:'If selected later, relate one facade opening to valid room and garden stops while preserving reverse.',rubikAuthoritiesPreserved:['Project/Building openings and room IDs','Story camera/restore','mobile framing'],existingCapabilitiesConsumed:['presentation-route','elevation Story camera','Story lifecycle'],missingConnector:'Validated project-derived entry/interior/garden route and door-state handoff; donor fixed camera keys and sales copy remain references only.',donorMechanismReference:'a-one-door/page.js:28-82; engine/elevation.js:1090-1096,1146-1187',confidence:'MEDIUM',implementationAuthorized:false}
 ],
 dependencies:['TECHNICAL_PREREQUISITE: authorized facade/opening and valid room/route data before any front-to-back visit.','TECHNICAL_PREREQUISITE: Story-owned absolute presentation state and restoration before reversible ink/material/sun/door coordination.','TECHNICAL_PREREQUISITE: material and light authority remains Rubik-owned; any hatch adapter must follow its shadows, not invent project solar facts.'],
 qaExpectations:[
  ['SEMANTIC','Address, area, levels and sales status come from current project data or are explicitly marked illustrative.'],['GEOMETRY','Door, balcony and window identities remain registered through ink, depth and brick states.'],['VISUAL','Hatching follows the same shadow geometry as materialized light; spatial sweep does not detach from the facade.'],['CAMERA','Route enters only through a valid opening and stays clear of project geometry in all viewports.'],['LIFECYCLE','Natural reverse restores camera, optic, hatch/material, sun/shadows, doors, HUD and progress.'],['MOBILE','Portrait and 844×390 keep facade, essential captions and plan radar readable.'],['ACCESSIBILITY','Drawing-to-building meaning and room changes have text and reduced-motion equivalents.'],['OUTPUT','Still/video output distinguishes verified project facts from authored donor sales copy.'],['REGRESSION','Presentation state does not alter saved project geometry, materials or Solar configuration.']
 ].map(([category,invariant])=>({category,invariant})),
 unresolved:[
  {severity:'NON_BLOCKING',question:'Passive evidence does not prove donor GPU material/shadow-map/resource identity after reverse.',attempts:['A0/A1 screenshots, route/scroll/HUD equality in all viewports','continuous reverse WebM/telemetry','pinned page.js and engine/elevation.js absolute-state inspection'],evidenceNeeded:'Narrow read-only object/resource identity probe if later acceptance requires internal identity.'},
  {severity:'NON_BLOCKING',question:'Professional value and placement of this experience among 14 references remain a later product decision.',attempts:['three-viewport observed sequence','pinned README/source','Cut1 D07, Cut3 D19 and Global reconciliation'],evidenceNeeded:'Human review after full 14-reference audit; no bridge authorized here.'}
 ]
};
await writeFile(path.join(dir,'reconciliation.json'),JSON.stringify(config,null,2)+'\n');
await writeFile(path.join(dir,'audit.md'),`# 07-a — One Door\n\n## Professional service\n\n${config.professionalService.problemSolved} ${config.professionalService.decisionValue}\n\n## Observed runtime\n\nClean desktop, portrait and landscape Discovery passes each show stable A, natural A→B, natural B→A and visually equivalent A1. A separate clean semantic pass captured M01–M11 in each viewport. The sequence keeps one townhouse while ink gains depth, a spatial front reveals brick/material, sun and shadow move, the front door opens, the camera visits hall/parlour/atrium, rear doors open and the route reaches the walled courtyard. Donor address, dimensions, sales status and CTA are authored content. See semantic-plan.json and manifest milestones for timing and evidence.\n\n## Source, Cuts and Rubik\n\nPinned page.js maps camera, depth cue, sweep, sun and door states to scroll progress; shared elevation.js owns shadow-derived hatch/material shader, geometry, camera interpolation and Lenis. Cut1 D07 and Global D07 address coherent hatch and preserve Rubik light/material/Solar authority. Cut3 D19 and Global D19 credit existing Rubik geometry/material/environment and reject a renderer rewrite. Frozen Rubik has elevation Story, material/light, geometry, progress and restore; the observed shadow-coherent facade representation and coordinated route remain possible gap/bridge candidates only. No product implementation or roadmap decision is authorized.\n\n## Reverse and unresolved\n\nA1 matches A0 visually in all three viewports, including 2° optic, initial sun HUD, facade and route/scroll. Internal GPU object/material/shadow-map identity remains NOT_OBSERVED; verdict VISUALLY_EQUIVALENT. See reconciliation.json for non-blocking unknowns and testable future QA invariants.\n`);
console.log('Prepared 07-a reconciliation: 11 milestone source locators, 12 Rubik dimensions, 3 gaps, 2 bridge candidates.');
