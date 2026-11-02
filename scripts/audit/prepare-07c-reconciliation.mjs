import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const ev=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const id='07-c-the-face',dir=path.join(ev,'takes',id),raw=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02',id);
const donor='Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:07-sunlit-elevation/';
const rubik='Juanmaes83/floorplan-3d@0f9c6ead9732901681498efec326d1ca92e42ffe:';
const O=(statement,locator)=>({class:'OBSERVED_RUNTIME',statement,locator:path.join(raw,locator)});
const S=(statement,locator)=>({class:'DONOR_SOURCE',statement,locator:donor+locator});
const R=(statement,locator)=>({class:'RUBIK_CURRENT',statement,locator:rubik+locator});
const C=(statement,locator)=>({class:'CUT_ATLAS',statement,locator});
const disc=(v,n)=>`${v}/${v}-${n}.png`;
const sem=(v,n)=>`${v}/${v==='desktop'?'semantic-correction-2/':''}${v}-${n}.png`;
const plan=JSON.parse(await readFile(path.join(dir,'semantic-plan.json'),'utf8'));
if(plan.milestones.length!==9)throw Error('Expected nine 07-c milestones');
const c={schemaVersion:'rubik-donor-runtime-audit.reconciliation.v1',status:'AUDITED',
 discoveryRun:{desktop:null,portrait:null,landscape:null},semanticRun:{desktop:'semantic-correction-2',portrait:null,landscape:null},
 progressModel:{desktop:'SCROLL_PLUS_TIME',portrait:'SCROLL_PLUS_TIME',landscape:'SCROLL_PLUS_TIME'},
 transitions:[[.08,.13,.17],[.19,.25,.29],[.32,.36,.39],[.42,.46,.50],[.51,.55,.58],[.63,.68,.71],[.72,.75,.79],[.80,.84,.88],[.94,.98,1]],
 milestoneSources:[
  'c-the-face/page.js:18-28,55-62; engine/elevation.js:1146-1187',
  'c-the-face/page.js:63-66; engine/elevation.js:31-119,352-429',
  'c-the-face/page.js:63-66; engine/elevation.js:1069-1083',
  'c-the-face/page.js:67-74; engine/elevation.js:143-161,1069-1083',
  'c-the-face/page.js:67-74; engine/elevation.js:143-161,1069-1083',
  'c-the-face/page.js:18-28,67-74; engine/elevation.js:1069-1083,1146-1187',
  'c-the-face/page.js:18-28,75; engine/elevation.js:1146-1187',
  'c-the-face/page.js:75; engine/elevation.js:977-1003,1090-1096',
  'c-the-face/page.js:18-28,81-86; engine/elevation.js:566-850,1146-1187'
 ].map(x=>donor+x),
 continuity:[
  'The same window, porch opening, human figure and zigzag header bond remain as the lens reveals depth.',
  'The luminous front crosses the original header pattern, window and porch without changing their locations.',
  'The materialized bond keeps the same diagonal burnt-header lattice and porch/window geometry.',
  'Moving light changes shadows on existing projected headers; the header positions remain fixed.',
  'The same built-out header bricks cast longer shadows as the raking sun settles.',
  'Close camera view reveals those same headers as physical boxes proud of the same buff bond.',
  'The patterned facade leads around the same deep porch reveal toward the original oak door.',
  'The door leaf pivots within that same porch/brick opening, with interior aligned behind it.',
  'The interior floor and stair lie behind the original facade and porch; the donor sample CTA is an overlay.'
 ],
 viewportSupport:{desktop:'SUPPORTED',portrait:'SUPPORTED',landscape:'SUPPORTED'},viewportEvidence:{desktop:[],portrait:[],landscape:[]},
 restoreVerdict:{desktop:'VISUALLY_EQUIVALENT',portrait:'VISUALLY_EQUIVALENT',landscape:'VISUALLY_EQUIVALENT'},
 restoreReview:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'Natural reverse returned to scrollY 0, same route/hash, ink 1:20 patterned facade, 2° optic and original sun/HUD; no visual residue of material/rake/door. Hidden GPU resource identity remains NOT_OBSERVED.'])),
 reverseOnlyMilestones:{desktop:[],portrait:[],landscape:[]},
 selectedKeyframes:{desktop:['desktop-start.png','desktop-end.png','desktop-restored-start.png','semantic-correction-2/desktop-forward-m02-brick-sweep-onset.png','semantic-correction-2/desktop-forward-m06-header-closeup.png','semantic-correction-2/desktop-forward-m08-door-opening.png'],portrait:['portrait-start.png','portrait-end.png','portrait-restored-start.png','portrait-forward-m02-brick-sweep-onset.png','portrait-forward-m06-header-closeup.png','portrait-forward-m08-door-opening.png'],landscape:['landscape-start.png','landscape-end.png','landscape-restored-start.png','landscape-forward-m02-brick-sweep-onset.png','landscape-forward-m06-header-closeup.png','landscape-forward-m08-door-opening.png']},
 professionalService:{problemSolved:'Let an architect, material supplier or client inspect how a proposed facade bond and physically projecting headers read at drawing scale, under normal/raking sun and at human approach scale.',primaryUsers:['architect','facade/material reviewer','material supplier','client'],serviceOutcome:'A 1:20 ink facade becomes a material wall; the same header lattice casts changing real shadows, is inspected close up and remains continuous through the porch into the hall.',decisionValue:'Can support material/relief discussion and sample-panel evaluation. Kiln & Course, KC-06, 60 mm headers, mortar and order CTA are invented donor specifications, not verified Rubik material/project facts.',evidence:[O('Ink bond and hatch at A0.',disc('desktop','start')),O('Close projecting header geometry and long shadows.',sem('desktop','forward-m06-header-closeup')),S('Pinned take describes invented brand and 60 mm proud headers.','c-the-face/page.js:1-16')]},
 continuityInvariants:[
  {statement:'Drawn zigzag header lattice, window and porch retain their spatial coordinates through material front.',evidence:[O('Drawn facade.',disc('desktop','start')),O('Sweep across same bond.',sem('desktop','forward-m02-brick-sweep-onset')),S('Same h0 house receives relief and shader state.','c-the-face/page.js:8-12,63-75; engine/elevation.js:1069-1083')]},
  {statement:'Low sun changes shadow length on fixed protruding header geometry, without a geometry swap.',evidence:[O('Materialized wall before full rake.','desktop/desktop-forward-discovery-p030.png'),O('Header close-up after rake.',sem('desktop','forward-m06-header-closeup')),S('Header boxes are created once; sun direction alone changes in frame.','engine/elevation.js:1069-1083; c-the-face/page.js:67-74')]},
  {statement:'The bond wraps into the same deep porch and door opening; the camera enters behind it.',evidence:[O('Same porch at materialized facade.','desktop/desktop-forward-discovery-p030.png'),O('Door opening.',sem('desktop','forward-m08-door-opening')),O('Interior B.',disc('desktop','end'))]}
 ],
 evidenceLedger:[O('Desktop, portrait and landscape original Discovery A→B→A recorded.','desktop/desktop-forward-discovery.webm'),O('Selected semantic desktop correction-2, portrait original and landscape original recorded.',sem('desktop','forward-m02-brick-sweep-onset')),O('Original desktop semantic encoder failed; correction-1 was superseded only for M02 visibility.', 'desktop/semantic-correction-1/semantic-capture.json'),O('Header close-up shows physical projection and raking shadows.',sem('desktop','forward-m06-header-closeup')),O('Natural reverse visually returns ink 1:20 facade.',disc('desktop','restored-start')),S('Donor builds 0.06 m protruding header boxes and moves sun separately.','engine/elevation.js:1069-1083; c-the-face/page.js:67-74'),C('Global D19 rejects universal 60 mm detail/renderer rewrite.','docs/product/ft3d-donor-global-reconciliation-2026-11-01.md:431-447'),R('Rubik already has primary wall geometry, materials and optional presentation Solar.','index.html:3486-3640,3758-3865; js/presentation-elevation-core.js:225-247')],
 donorSourceLocators:[
  ['c-the-face/page.js','h0 / KEYS / frame','8-75','A facade with explicit relief uses absolute camera, sweep, sun and door progress.'],
  ['engine/elevation.js','house / relief bricks','938-1083','Protruding header boxes are merged into geometry with v.relief 0.06 m.'],
  ['engine/elevation.js','GLSL_COMMON / mat','31-119,166-429','Shadow-derived technical hatch and spatial paper/material front, with procedural brick response.'],
  ['engine/elevation.js','setSun','143-161','Directional light/shadow map move under raking sun.'],
  ['engine/elevation.js','camAt','1146-1187','Author camera keys including portrait overrides.'],
  ['engine/elevation.js','setDoor / run / scrollP','1090-1096,1205-1422','Front door pivot and Lenis-driven reversible absolute frame; intro stable marker.']
 ].map(([p,s,l,claim])=>({repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:`07-sunlit-elevation/${p}`,symbol:s,lines:l,claim,classification:'SOURCE_CONFIRMED'})),
 cutsAtlas:[
  {locator:'Cut1 D07 Juanmaes83/floorplan-3d@6a573f1955fd70dd52bb10450c9b9df9b4833aa0:docs/product/ft3d-donor-code-gap-analysis-2026-11-01.md; Atlas D07 Juanmaes83/floorplan-3d@7696fb2c6c30f158001d38ecc53feb2674acaa25:docs/product/ft3d-reference-atlas-2026-11-01.md; Global D07 docs/product/ft3d-donor-global-reconciliation-2026-11-01.md:209-225',documentedDisposition:'D07-C1 ADAPT shadow-coherent technical hatch; C2 KEEP EXISTING Rubik light/material/Solar; C3 REJECT donor-specific AO/one-light assumptions.',relationToRuntime:'EXTENDS',evidence:[C('Cut1/Global distinguish transferable shadow-hatch principle from donor renderer.','docs/product/ft3d-donor-global-reconciliation-2026-11-01.md:209-225'),O('Header shadow shape survives paper/material front.',sem('desktop','forward-m02-brick-sweep-onset'))]},
  {locator:'Cut3 D19 docs/product/evidence/donor-cuts-2026-11-01/cut3-d14-d15-d19.md:162-239; Atlas D19 Juanmaes83/floorplan-3d@7696fb2c6c30f158001d38ecc53feb2674acaa25:docs/product/ft3d-reference-atlas-2026-11-01.md; Global D19 docs/product/ft3d-donor-global-reconciliation-2026-11-01.md:431-447',documentedDisposition:'D19-C1 KEEP EXISTING Rubik geometry/material/environment; C2 ADAPT sourced camera/light/material coordination; C3 REJECT universal 60 mm brick, clearcoat/postFX or new renderer.',relationToRuntime:'CONFIRMS',evidence:[C('Cut3 and Global specifically cite c-the-face relief/RAKE and reject universal detail recipe.','docs/product/evidence/donor-cuts-2026-11-01/cut3-d14-d15-d19.md:162-239; docs/product/ft3d-donor-global-reconciliation-2026-11-01.md:431-447'),O('Close-up proves relief and light work together on this authored wall.',sem('desktop','forward-m06-header-closeup'))]}
 ],
 rubikCrosswalk:{},gaps:[],candidateBridges:[],dependencies:[],qaExpectations:[],unresolved:[]};
const cross={
 semanticData:['PARTIAL','Rubik owns project dimensions and identities; invented KC-06, 60 mm projection, mortar, sample pack and CTA are not current project facts.','index.html:1034-1053; js/building-ui.js:36-95'],
 geometry:['PARTIAL','Rubik has authoritative walls/openings; a verified project-derived header relief/diaper pattern is not established. Donor 0.06 m is instance data only.','index.html:3486-3640; js/building-ui.js:36-95'],
 representation:['PARTIAL','Rubik has elevation Story/View3D; shadow-derived drawn hatch linked to the same material wall is not an accredited current mode.','js/presentation-elevation-core.js:171-247; js/surface-renderer.mjs:1-74'],
 materialsLight:['EXISTS','Rubik owns materials, shadows and optional Solar; donor rake response is a service-specific coordination of material, relief and light.','index.html:3758-3865; js/presentation-elevation-core.js:225-247'],
 camera:['PARTIAL','Rubik has elevation camera and route authorities; the 1:20-to-header-to-porch inspection path is donor choreography.','js/presentation-elevation-core.js:171-247; js/presentation-route.js:1-156'],
 transition:['PARTIAL','Rubik has absolute Story/reveal; donor paper-to-brick facade sweep and sun rake are particular presentation transitions.','js/presentation-story-core.js:346-364; index.html:3344-3385'],
 scrollProgress:['EXISTS','Rubik Story has absolute seek/playback; donor Lenis 540vh is transport.','js/presentation-story-core.js:346-364; js/presentation-ui.js:751-774'],
 ui:['PARTIAL','Rubik has presentation controls/captions; invented product spec/order CTA is donor-authored UI.','js/presentation-ui.js:8-31,613-774'],
 mobile:['PARTIAL','Rubik has mobile presentation paths; a detail-level bond and spec panel require independent portrait/landscape framing and legibility QA.','index.html:210-218; docs/qa/ft3d-6-implementation-2026-11-01.md:46-54'],
 lifecycleRestore:['EXISTS','Rubik Story has restore owner; donor natural reverse visually recovers ink, 2° optic and original sun, with internal GPU identity unobserved.','js/presentation-story-core.js:346-364; js/presentation-ui.js:751-774'],
 outputs:['EXISTS','Rubik has presentation/export paths; sample panel ordering is not an authorized output from this audit.','js/presentation-ui.js:8-31,613-774'],
 qa:['PARTIAL','Rubik has FT3D-6 QA; verified relief dimensions/material provenance, lighting and reverse across viewports need service-specific tests.','docs/qa/ft3d-6-implementation-2026-11-01.md:1-75']
};
c.rubikCrosswalk=Object.fromEntries(Object.entries(cross).map(([k,[status,claim,locator]])=>[k,{status,claim,evidence:[R(claim,locator)]}]));
c.gaps=[
 {classification:'INTEGRATION_GAP',statement:'A sourced facade material/relief specification would have to connect to authorized project data; invented KC-06 facts cannot fill that role.',evidence:[S('Donor product attributes are inline authored copy and v.relief=0.06.','c-the-face/page.js:1-16,81-86'),R('Rubik project owns current geometry/material source.','index.html:1034-1053,3486-3640')]},
 {classification:'REPRESENTATION_GAP',statement:'A shadow-coherent technical hatch and spatial ink/material front for verified relief are not accredited in current Rubik.',evidence:[S('Shader derives hatch/front from shadow and uSweep.','engine/elevation.js:31-119,352-429'),R('Current elevation Story does not establish this drawing/material front.','js/presentation-elevation-core.js:171-247')]},
 {classification:'ORCHESTRATION_GAP',statement:'If selected later, sourced relief, raking light, close camera and door route would require one reversible Story-owned state.',evidence:[S('One frame maps sun, camera and door over same h0.','c-the-face/page.js:18-75'),R('Rubik Story seek/restore and Solar already exist.','js/presentation-story-core.js:346-364; js/presentation-elevation-core.js:225-247')]}
];
c.candidateBridges=[
 {classification:'CONNECT_EXISTING',problemSolved:'If later selected, tie a material/relief demonstration to verified project/facade dimensions and material identity.',rubikAuthoritiesPreserved:['Project/Building geometry and IDs','current materials','output provenance'],existingCapabilitiesConsumed:['wall/opening geometry','material selection','presentation captions'],missingConnector:'Source-backed facade relief descriptor; no hard-coded universal 60 mm projection or invented brand as project truth.',donorMechanismReference:'engine/elevation.js:1069-1083 and c-the-face/page.js:8-12 as instance reference; Global D19-C3 REJECT universal detail',confidence:'LOW',implementationAuthorized:false},
 {classification:'ADAPT_EXISTING',problemSolved:'If later selected, show that the same sourced relief produces both technical hatching and physical/raking shadows.',rubikAuthoritiesPreserved:['Rubik renderer/material/light/Solar','project geometry','Story lifecycle'],existingCapabilitiesConsumed:['elevation Story','surface renderer','Solar/light/shadows'],missingConnector:'Shadow-registered drawing/material adapter and reversible light/camera coordination; avoid donor-specific AO/renderer rewrite.',donorMechanismReference:'engine/elevation.js:31-119,143-161,352-429; c-the-face/page.js:63-75; Global D07-C1 ADAPT/D19-C2 ADAPT',confidence:'MEDIUM',implementationAuthorized:false}
];
c.dependencies=['TECHNICAL_PREREQUISITE: verified facade bond/projection dimensions and material source before a professional material claim.','TECHNICAL_PREREQUISITE: same geometry/normals and Rubik-owned shadow/light authority before comparing technical hatch with raking shadow.','TECHNICAL_PREREQUISITE: Story-owned reversible camera/light/door/material state before a detail-to-interior route.'];
c.qaExpectations=[['SEMANTIC','Material name, bond, projection and mortar values derive from verified project/specification or are marked illustrative.'],['GEOMETRY','Header positions and relief dimension stay the same through drawing, material and low-sun states.'],['VISUAL','Technical hatch and physical shadow correspond to the same relief geometry; raking light does not fake geometry.'],['CAMERA','Close inspection resolves bond/relief without clipping, then follows the valid porch opening.'],['LIFECYCLE','Reverse restores ink, sun, material, camera, door, HUD and scroll in each viewport.'],['MOBILE','Bond detail, material label and action remain legible at 390×844 and 844×390.'],['ACCESSIBILITY','Relief and shadow differences have textual/reduced-motion equivalents.'],['OUTPUT','Exports preserve provenance of material specification and label illustrative values.'],['REGRESSION','Presentation relief/light state does not mutate saved project geometry or materials.']].map(([category,invariant])=>({category,invariant}));
c.unresolved=[
 {severity:'NON_BLOCKING',question:'Passive evidence does not prove internal donor GPU/shadow-map resource identity after reverse.',attempts:['three A0/A1 screenshots and reverse telemetry/video','pinned absolute-state source','corrected semantic videos'],evidenceNeeded:'Narrow read-only resource identity probe if identity-level restore becomes a later requirement.'},
 {severity:'NON_BLOCKING',question:'Whether a verified Rubik facade material specification can support this professional sample-panel service remains a later product/data decision.',attempts:['donor authored brand/spec source','runtime relief/shadow sequence','Cut3/Global D19 and frozen Rubik inspection'],evidenceNeeded:'Human review after all references; no bridge implementation authorized.'}
];
await writeFile(path.join(dir,'reconciliation.json'),JSON.stringify(c,null,2)+'\n');
await writeFile(path.join(dir,'audit.md'),`# 07-c — The Face\n\n## Professional service\n\n${c.professionalService.problemSolved} ${c.professionalService.decisionValue}\n\n## Observed runtime\n\nThree clean-context Discovery A→B→A passes and selected semantic M01–M09 show one 1:20 facade: ink/shadow hatch, depth, spatial brick front, lowered sun and longer shadows on geometrically projecting headers, close material inspection, porch/door and interior. The same window/door/header lattice remains registered. B is interior; A1 is visually equivalent to A0 in all viewports, not proven internally restored. Desktop original semantic recording failed from encoder backlog; correction-1 completed but M02 was weak; correction-2 at 6 fps is selected for clear M02. Portrait/landscape original semantic 6 fps are selected. All attempts are preserved in RAW/run state.\n\n## Source, Cuts and Rubik\n\nPinned c-the-face/page.js sets authored 0.06 m relief, camera keys, sweep, rake and door. Shared elevation.js builds real header boxes (1069–1083) and derives hatch/material from shadow and spatial sweep. Cut1/Global D07 and Cut3/Global D19 preserve Rubik geometry/material/Solar, adapt the coherent visual principle and reject universal 60 mm brick or a new renderer. Frozen Rubik has primary geometry, materials/light, elevation Story, route, progress and restore. A verified material specification connector, sourced relief and coordinated technical/physical shadow remain possible gaps, with no product implementation or roadmap authorized. See reconciliation.json and manifest.json for milestone/evidence locators, crosswalk, QA and unknowns.\n`);
console.log('Prepared 07-c reconciliation: 9 milestones, 12 Rubik dimensions, 3 gaps, 2 bridge candidates.');
