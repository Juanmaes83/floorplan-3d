import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const ev=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const id='07-b-the-row',dir=path.join(ev,'takes',id),raw=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02',id);
const donor='Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:07-sunlit-elevation/';
const rubik='Juanmaes83/floorplan-3d@0f9c6ead9732901681498efec326d1ca92e42ffe:';
const O=(statement,locator)=>({class:'OBSERVED_RUNTIME',statement,locator:path.join(raw,locator)});
const S=(statement,locator)=>({class:'DONOR_SOURCE',statement,locator:donor+locator});
const R=(statement,locator)=>({class:'RUBIK_CURRENT',statement,locator:rubik+locator});
const C=(statement,locator)=>({class:'CUT_ATLAS',statement,locator});
const shot=(v,n)=>`${v}/${v}-${n}.png`;
const plan=JSON.parse(await readFile(path.join(dir,'semantic-plan.json'),'utf8'));
if(plan.milestones.length!==10)throw Error('Expected ten 07-b milestones');
const c={schemaVersion:'rubik-donor-runtime-audit.reconciliation.v1',status:'AUDITED_WITH_DONOR_LIMITATION',
 discoveryRun:{desktop:null,portrait:null,landscape:null},semanticRun:{desktop:null,portrait:null,landscape:null},
 progressModel:{desktop:'SCROLL_PLUS_TIME',portrait:'SCROLL_PLUS_TIME',landscape:'SCROLL_PLUS_TIME'},
 transitions:[[.09,.13,.17],[.20,.25,.29],[.33,.37,.40],[.43,.47,.51],[.52,.55,.59],[.60,.65,.68],[.71,.75,.79],[.82,.86,.90],[.90,.94,.96],[.97,.99,1]],
 milestoneSources:[
  'b-the-row/page.js:16-48,75-86; engine/elevation.js:1146-1187',
  'b-the-row/page.js:87-90; engine/elevation.js:31-119,352-429',
  'b-the-row/page.js:87-90; engine/elevation.js:31-119,352-429',
  'b-the-row/page.js:91-97; engine/elevation.js:143-161',
  'b-the-row/page.js:38-48,75-86; engine/elevation.js:1146-1187',
  'b-the-row/page.js:98-99; engine/elevation.js:977-1003,1090-1096',
  'b-the-row/page.js:38-48,104; engine/elevation.js:566-850,1146-1187',
  'b-the-row/page.js:38-48,105; engine/elevation.js:566-850,1146-1187',
  'b-the-row/page.js:99; engine/elevation.js:847-855,1094-1096',
  'b-the-row/page.js:38-48,105; engine/elevation.js:1205-1422'
 ].map(x=>donor+x),
 continuity:[
  'Six numbered facades keep the same alternating roof rooms, windows, doors and orange plot 04 outline through camera relief.',
  'The luminous front crosses the same six facades one after another; plot 04 remains in the same place.',
  'Materialized doors/windows match their ink predecessors and plot 04 remains identified.',
  'Changed shadows attach to the same brick/roof facade edges while the camera selects plot 04.',
  'The approached front opening belongs to the orange outlined plot 04 from the row view.',
  'The pivoting oak leaf occupies that same plot 04 door frame.',
  'The parlour floor, stair and rear glazing belong behind that plot 04 entrance.',
  'The route from parlour to dining atrium shares floor/ceiling and rearward orientation.',
  'Glazed rear doors and tree remain in the same wall as the view advances within the atrium.',
  'The final view still belongs to plot 04 atrium, with the same open rear doors and garden beyond.'
 ],
 viewportSupport:{desktop:'SUPPORTED',portrait:'SUPPORTED',landscape:'DONOR_LIMITATION'},
 viewportEvidence:{desktop:[],portrait:[],landscape:[O('At 844×390 initial title overlays the model and plot-status cards extend beyond the bottom viewport, reducing six-plot comparison readability.',shot('landscape','start')),S('Only portrait aspect ratio W/H<0.8 receives the explicit phone camera override.','engine/elevation.js:89-103,1146-1187; b-the-row/page.js:38-48')]},
 restoreVerdict:{desktop:'VISUALLY_EQUIVALENT',portrait:'VISUALLY_EQUIVALENT',landscape:'VISUALLY_EQUIVALENT'},
 restoreReview:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'Natural reverse returned to scrollY 0, same route/hash, 2° ink elevation with six plot-status markers and plot 04 orange, initial sun/optic HUD; hidden GPU resource identity remains NOT_OBSERVED.'])),
 reverseOnlyMilestones:{desktop:[],portrait:[],landscape:[]},
 selectedKeyframes:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,[`${v}-start.png`,`${v}-end.png`,`${v}-restored-start.png`,`${v}-forward-m02-multi-house-sweep.png`,`${v}-forward-m06-plot-04-door-open.png`,`${v}-forward-m09-rear-doors-open.png`]])),
 professionalService:{problemSolved:'Let a developer, architect or buyer compare six distinct townhouse plots in one street composition, identify the available plot 04 and inspect its entrance and key rooms.',primaryUsers:['developer','architect','prospective buyer','design reviewer'],serviceOutcome:'The same numbered row changes from drawing to materialized street while plot 04 stays identified; the route enters its show house and ends in the atrium facing its garden.',decisionValue:'Clarifies repeated-versus-varied facade relation and the spatial experience behind one selected plot. Donor sold/reserved/available states, bedroom count, area and reservation CTA are authored, not verified Rubik facts.',evidence:[O('Six status-labeled houses and outlined plot 04 at A0.',shot('desktop','start')),O('Plot 04 atrium at B.',shot('desktop','end')),S('Pinned take defines six houses, statuses and only plot 04 interior.','b-the-row/page.js:1-31')]},
 continuityInvariants:[
  {statement:'All six plot positions and their repeated/alternate roof, window and door patterns persist through ink, relief and material front.',evidence:[O('Six-house ink row.',shot('desktop','start')),O('Materialized row.','desktop/desktop-forward-discovery-p035.png'),S('Six S.house instances are built once and animated by one stage.','b-the-row/page.js:8-27,87-99')]},
  {statement:'Orange plot 04 is the same house singled out from the row and entered through its door.',evidence:[O('Plot 04 orange in ink.',shot('desktop','start')),O('Approached plot 04 facade.',shot('desktop','forward-m05-plot-04-approach')),S('plot4 is houses[3] and only its doors open.','b-the-row/page.js:16-20,98-99')]},
  {statement:'The show-house interior keeps its stair, dining relation, rear glazing and tree through the visit.',evidence:[O('Plot 04 parlour.',shot('desktop','forward-m07-front-parlour')),O('Terminal atrium and garden glazing.',shot('desktop','end'))]}
 ],
 evidenceLedger:[O('Desktop, portrait and landscape each have original natural A→B→A and semantic passes.','desktop/desktop-forward-discovery.webm'),O('Landscape A0 crowds/clips plot status cards, a donor viewport limitation.',shot('landscape','start')),O('Final camera stays in atrium, not courtyard.',shot('desktop','end')),O('Natural reverse restores the initial six-plot sheet visually.',shot('desktop','restored-start')),S('Pinned page.js controls six houses, selected plot, sweep, sun and doors.','b-the-row/page.js:8-105'),C('Global D07 preserves Rubik light/material authority and adapts shadow-coherent hatch.','docs/product/ft3d-donor-global-reconciliation-2026-11-01.md:209-225'),R('Rubik owns building geometry and Story elevation camera/Solar.','js/building-ui.js:1-36; js/presentation-elevation-core.js:171-247')],
 donorSourceLocators:[
  ['b-the-row/page.js','V / houses / plot4 / STATUS','8-31','Six authored house variants and plot status labels; only plot4 gains interior.'],
  ['b-the-row/page.js','KEYS / frame','38-99','Absolute progress maps row camera, depth, sweep, sun and plot4 door states.'],
  ['engine/elevation.js','GLSL_COMMON / mat','31-119,352-429','One shader uses shadow-derived hatch and spatial sweep for technical/material appearance.'],
  ['engine/elevation.js','setSun','143-161','Directional light and its shadow map move together.'],
  ['engine/elevation.js','setDoor / setGardenDoor','977-1003,1090-1096','Front and rear pivot geometry of one selected house.'],
  ['engine/elevation.js','camAt / run / scrollP','1146-1187,1205-1422','Camera keys, phone overrides, Lenis progress and stable intro marker.']
 ].map(([p,s,l,claim])=>({repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:`07-sunlit-elevation/${p}`,symbol:s,lines:l,claim,classification:'SOURCE_CONFIRMED'})),
 cutsAtlas:[
  {locator:'Cut1 D07 Juanmaes83/floorplan-3d@6a573f1955fd70dd52bb10450c9b9df9b4833aa0:docs/product/ft3d-donor-code-gap-analysis-2026-11-01.md; Atlas D07 Juanmaes83/floorplan-3d@7696fb2c6c30f158001d38ecc53feb2674acaa25:docs/product/ft3d-reference-atlas-2026-11-01.md; Global D07 docs/product/ft3d-donor-global-reconciliation-2026-11-01.md:209-225',documentedDisposition:'D07-C1 ADAPT coherent shadow hatch; C2 KEEP EXISTING Rubik light/material/Solar; C3 REJECT donor-specific AO and single-light implementation. Older Cut1 extraction remains historical prior analysis.',relationToRuntime:'EXTENDS',evidence:[C('Prior Cut1/Global establish the principle and Rubik authority.','docs/product/ft3d-donor-global-reconciliation-2026-11-01.md:209-225'),O('One front is observed crossing multiple houses.',shot('desktop','forward-m02-multi-house-sweep'))]},
  {locator:'Cut3 D19 docs/product/evidence/donor-cuts-2026-11-01/cut3-d14-d15-d19.md:162-239; Atlas D19 Juanmaes83/floorplan-3d@7696fb2c6c30f158001d38ecc53feb2674acaa25:docs/product/ft3d-reference-atlas-2026-11-01.md; Global D19 docs/product/ft3d-donor-global-reconciliation-2026-11-01.md:431-447',documentedDisposition:'D19-C1 KEEP EXISTING Rubik geometry/material/environment; C2 ADAPT sourced camera/light/material coordination; C3 REJECT universal brick/renderer rewrite.',relationToRuntime:'CONFIRMS',evidence:[C('Cut3/Global credit Rubik visual infrastructure.','docs/product/evidence/donor-cuts-2026-11-01/cut3-d14-d15-d19.md:162-239'),O('Same row appears with material/detail.',shot('desktop','forward-m03-materialized-row'))]}
 ],
 rubikCrosswalk:{},gaps:[],candidateBridges:[],dependencies:[],qaExpectations:[],unresolved:[]};
const cross={
 semanticData:['PARTIAL','Rubik owns project/building dimensions and IDs; an authoritative six-plot status inventory is not accredited by this frozen baseline. Donor sold/reserved/available, 142 m² and CTA are authored.','js/building-ui.js:1-36; index.html:2408-2428'],
 geometry:['PARTIAL','Rubik builds one project/building and levels from data; a single composed six-plot street with six independently identified homes is not accredited.','js/building-ui.js:1-36,317-377; index.html:3486-3640'],
 representation:['PARTIAL','Rubik has elevation Story/View3D; cross-house shadow hatch and registered technical/material front are not established modes.','js/presentation-elevation-core.js:171-247; js/surface-renderer.mjs:1-74'],
 materialsLight:['EXISTS','Rubik owns material, shadow and optional Solar authority; donor one-light animation is an authored visual reference.','index.html:3758-3865; js/presentation-elevation-core.js:225-247'],
 camera:['PARTIAL','Rubik has facade Story framing and routes; isolate-one-plot row-to-interior choreography is donor authored.','js/presentation-elevation-core.js:171-247; js/presentation-route.js:1-156'],
 transition:['PARTIAL','Rubik has Story/reveal state; donor sweep across six houses is a particular co-registered representation transition.','js/presentation-story-core.js:346-364; index.html:3344-3385'],
 scrollProgress:['EXISTS','Rubik Story has absolute seek/playback; donor Lenis 660vh transport need not be copied.','js/presentation-story-core.js:346-364; js/presentation-ui.js:751-774'],
 ui:['PARTIAL','Rubik has presentation controls; donor plot-status cards, radar and reserve CTA are authored UI and need project source truth.','js/presentation-ui.js:8-31,613-774'],
 mobile:['PARTIAL','Rubik has mobile presentation paths; donor landscape A0 clips plot cards and overlays heading on row, so any adapted six-plot service needs independent framing.','index.html:210-218; docs/qa/ft3d-6-implementation-2026-11-01.md:46-54'],
 lifecycleRestore:['EXISTS','Rubik Story has restore owner; donor A0/A1 are visually equivalent after natural reverse but GPU identity is unobserved.','js/presentation-story-core.js:346-364; js/presentation-ui.js:751-774'],
 outputs:['EXISTS','Rubik has presentation/output paths; donor plot reservation CTA is not an output requirement.','js/presentation-ui.js:8-31,613-774'],
 qa:['PARTIAL','Rubik has FT3D-6 QA; six-plot status truth, highlight continuity, mobile and reverse would require dedicated checks.','docs/qa/ft3d-6-implementation-2026-11-01.md:1-75']
};
c.rubikCrosswalk=Object.fromEntries(Object.entries(cross).map(([k,[status,claim,loc]])=>[k,{status,claim,evidence:[R(claim,loc)]}]));
c.gaps=[
 {classification:'INTEGRATION_GAP',statement:'A source-backed plot/status record would have to connect multiple authorized buildings to the six-plot presentation; donor statuses are static copy.',evidence:[S('STATUS is authored inline in page.js.','b-the-row/page.js:22-31'),R('Current Building UI is project/level centric.','js/building-ui.js:1-36,317-377')]},
 {classification:'REPRESENTATION_GAP',statement:'Shadow-coherent ink/material front across multiple homes is not accredited in Rubik current.',evidence:[S('Shared shader and uSweep drive row front.','engine/elevation.js:31-119; b-the-row/page.js:87-90'),R('Current elevation Story has facade/solar state but no proven six-house front.','js/presentation-elevation-core.js:171-247')]},
 {classification:'ORCHESTRATION_GAP',statement:'One selected plot would need continuity from row identity to valid entry/rooms, with reversible sun, door and camera state.',evidence:[S('plot4 alone has interior and animated doors.','b-the-row/page.js:16-20,98-105'),R('Rubik has Story route/restore to consume.','js/presentation-route.js:1-156; js/presentation-story-core.js:346-364')]},
 {classification:'DONOR_LIMITATION',statement:'At 844×390 the initial heading overlays the row and plot cards are clipped, weakening the six-plot comparison.',evidence:[O('Landscape A0 overlap/clipping.',shot('landscape','start')),S('Phone camera override only applies at portrait ratio.','engine/elevation.js:89-103,1146-1187')]}
];
c.candidateBridges=[
 {classification:'CONNECT_EXISTING',problemSolved:'If later selected, show source-backed multi-plot identities/statuses and select one valid project/building for a visit.',rubikAuthoritiesPreserved:['Project/Building IDs and units','current geometry','Story lifecycle'],existingCapabilitiesConsumed:['project library','Building data','presentation UI'],missingConnector:'Authorized plot inventory and selected-building reference; never infer live sale status from donor labels.',donorMechanismReference:'b-the-row/page.js:8-31 illustrates status/highlight only; authored data is not reusable truth',confidence:'LOW',implementationAuthorized:false},
 {classification:'ADAPT_EXISTING',problemSolved:'If later selected, carry one coherent shadow/ink/material front across an authorized street ensemble.',rubikAuthoritiesPreserved:['current renderer/material authority','Solar/light authority','project geometry'],existingCapabilitiesConsumed:['elevation Story','surface renderer','Solar snapshot'],missingConnector:'Per-building registered hatch/front and shared lighting state, with explicit cleanup.',donorMechanismReference:'engine/elevation.js:31-119; b-the-row/page.js:87-97; Global D07-C1 ADAPT/C2 KEEP/C3 REJECT',confidence:'MEDIUM',implementationAuthorized:false},
 {classification:'CONNECT_EXISTING',problemSolved:'If later selected, follow the chosen plot from row to valid rooms and return to the original row.',rubikAuthoritiesPreserved:['project room/opening IDs','Story absolute seek/restore','mobile framing'],existingCapabilitiesConsumed:['presentation-route','Story camera','current semantic project'],missingConnector:'Selected plot-to-entry/room route and reversible door/camera handoff.',donorMechanismReference:'b-the-row/page.js:38-105 fixed camera keys are reference only',confidence:'MEDIUM',implementationAuthorized:false}
];
c.dependencies=['TECHNICAL_PREREQUISITE: authoritative plot/building identities and status provenance before any multi-plot claim.','TECHNICAL_PREREQUISITE: valid selected-plot opening/room route before a show-house visit.','TECHNICAL_PREREQUISITE: Story-owned reversible material/light/door/camera state before an ink-to-real row transition.'];
c.qaExpectations=[['SEMANTIC','Plot labels and status derive from verified project data or are explicitly illustrative.'],['GEOMETRY','All six plot identities and openings remain registered across ink/material states.'],['VISUAL','One sun/shadow convention remains coherent across all six facades during the sweep.'],['CAMERA','Selected plot 04 stays traceable from row to its entrance and interior without crossing geometry.'],['LIFECYCLE','Reverse restores plot labels/highlight, doors, sun, materials, camera, HUD and scroll.'],['MOBILE','390×844 and 844×390 keep plot statuses and selection legible without clipping.'],['ACCESSIBILITY','Plot status and selected unit are conveyed in text/keyboard-accessible form.'],['OUTPUT','Any export distinguishes live plot facts from donor-authored status/CTA.'],['REGRESSION','Presentation effects do not mutate saved buildings, statuses or materials.']].map(([category,invariant])=>({category,invariant}));
c.unresolved=[
 {severity:'NON_BLOCKING',question:'Passive reverse does not prove internal donor GPU/shadow-map resource identity.',attempts:['three A0/A1 screenshots and NDJSON','continuous reverse video','pinned frame/engine source'],evidenceNeeded:'Narrow read-only resource identity probe if internal identity later matters.'},
 {severity:'NON_BLOCKING',question:'Current Rubik data does not establish whether six independently marketable plots belong in one authoritative presentation service.',attempts:['frozen Building/project/library inspection','donor six-plot authored data','Cut/Global crosswalk'],evidenceNeeded:'Human product/data authority decision after all 14 references; no implementation in this audit.'}
];
await writeFile(path.join(dir,'reconciliation.json'),JSON.stringify(c,null,2)+'\n');
await writeFile(path.join(dir,'audit.md'),`# 07-b — The Row\n\n## Professional service\n\n${c.professionalService.problemSolved} ${c.professionalService.decisionValue}\n\n## Observed runtime\n\nThree clean-context Discovery passes show A→B→A and three semantic passes capture M01–M10. Six numbered townhouses remain one row as the ink elevation gains relief, a luminous front materializes successive houses, shadows move, plot 04 is isolated, its door opens and camera enters the show-house parlour and atrium. B remains inside the atrium facing open garden doors. Landscape 844×390 initial composition clips plot cards and overlays the title on the row: DONOR_LIMITATION, not Rubik failure. A1 is visually equivalent to A0 in all three viewports; hidden resource identity is NOT_OBSERVED.\n\n## Source, Cuts and Rubik\n\nPinned b-the-row/page.js builds six houses with authored STATUS labels and gives only plot4 interior. Shared engine provides shadow-derived hatch/material front, camera, sun and Lenis. Cut1/Global D07 and Cut3/Global D19 dispositions are preserved. Frozen Rubik already has geometry, elevation Story, materials/light/Solar, progress/restore and outputs. An authoritative multi-plot identity/status connector, coherent row front and selected-plot route are candidate technical gaps, not implementation decisions. See reconciliation.json/manifest.json for milestone locators, crosswalk, dependencies, unknowns and QA.\n`);
console.log('Prepared 07-b reconciliation: 10 milestones, 12 Rubik dimensions, 4 gaps, 3 bridge candidates.');
