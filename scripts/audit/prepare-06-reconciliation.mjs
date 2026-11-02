import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const ev=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const id='06-demo-card-model',dir=path.join(ev,'takes',id),raw=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02',id);
const donor='Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6';
const rubik='Juanmaes83/floorplan-3d@0f9c6ead9732901681498efec326d1ca92e42ffe';
const atlas='Juanmaes83/floorplan-3d@7696fb2c6c30f158001d38ecc53feb2674acaa25:docs/product/ft3d-reference-atlas-2026-11-01.md';
const global='docs/product/ft3d-donor-global-reconciliation-2026-11-01.md';
const cut='docs/product/evidence/donor-cuts-2026-11-01/cut3-d14-d15-d19.md';
const O=(statement,locator)=>({class:'OBSERVED_RUNTIME',statement,locator});
const S=(statement,locator)=>({class:'DONOR_SOURCE',statement,locator:`${donor}:06-card-model/${locator}`});
const C=(statement,locator)=>({class:'CUT_ATLAS',statement,locator});
const R=(statement,locator)=>({class:'RUBIK_CURRENT',statement,locator:`${rubik}:${locator}`});
const disc=(vp,name)=>path.join(raw,vp,'discovery-correction-1',`${vp}-${name}`);
const sem=(vp,name)=>path.join(raw,vp,'semantic-correction-1',`${vp}-${name}`);
const plan=JSON.parse(await readFile(path.join(dir,'semantic-plan.json'),'utf8'));
if(plan.milestones.length!==14)throw Error('06 requires 14 observed semantic milestones');
const transitions=[
  [.03,.05,.08],[.14,.18,.20],[.22,.25,.28],[.29,.32,.36],
  [.37,.40,.43],[.44,.46,.49],[.49,.51,.54],[.55,.58,.61],
  [.62,.65,.68],[.68,.70,.73],[.74,.77,.80],[.82,.85,.88],
  [.88,.91,.94],[.95,.98,1]
];
const src=[
  'js/page.js:184-223,246-307,420-451; js/desk.js:292-340,316-390',
  'js/page.js:270-307,420-451,545-557; js/desk.js:412-425',
  'js/page.js:97-108,479-526; js/sweep.js:12-104',
  'js/page.js:479-526; js/sweep.js:12-104; js/real.js:367-445',
  'js/page.js:454-468,487-526; js/real.js:367-445',
  'js/page.js:227-242,454-468; js/real.js:367-445',
  'js/page.js:227-242,463-468; js/real.js:446-745',
  'js/page.js:227-242,463-468; js/real.js:446-745',
  'js/page.js:227-242,463-468; js/real.js:746-780',
  'js/page.js:227-242,463-468,545-568; js/real.js:706-780',
  'js/page.js:235-244,470-474,479-526; js/real.js:367-445',
  'js/page.js:470-526; js/sweep.js:12-104',
  'js/page.js:483-526,545-576; js/desk.js:292-340,316-390',
  'js/page.js:529-576; index.html:57-66; css/page.css:158-184,208-239'
].map(x=>`${donor}:06-card-model/${x}`);
const continuity=[
  'The same glazing, upper band and stepped contour board frame the card house.',
  'The human figure stands beside the same house on the same contour base.',
  'The luminous front crosses the same roof, glazing and stepped site.',
  'The house retains its flat roof, clerestory, balcony and lower stair as card gives way to real materials.',
  'The exterior occupies the same contour footprint and keeps the same openings.',
  'The approach targets the same balcony and glazed facade seen on the model.',
  'The living room lies behind that glazed facade, below its upper study/gallery.',
  'The low interior retains the same stair, shelving, furniture and daylight orientation.',
  'The nested card model depicts the same house, now inside its own upper study; it is a separate small object.',
  'The study and overlook remain above the same living room and terrace.',
  'The railing, sliding glass and garden relate to the same house during the back-out.',
  'The real facade, balcony, stair and contour board remain aligned while the front returns.',
  'The card house returns on the same layered board with the same openings and trees.',
  'The closing copy overlays the same card model and workshop desk rather than a new project.'
];
const crosswalk={
  semanticData:{status:'PARTIAL',claim:'Rubik Project/Building owns real dimensions and identities. Donor 1:100 display values and studio message are authored presentation, not project facts.',evidence:[R('Project geometry is derived from current project data.','index.html:1034-1053; js/building-ui.js:36-95')]},
  geometry:{status:'PARTIAL',claim:'Rubik has real building walls/openings/levels; a temporary layered card support derived from real bounds and contour data is not established as current geometry.',evidence:[R('Current building geometry and 3D architecture path.','index.html:3486-3640; js/building-ui.js:36-95')]},
  representation:{status:'PARTIAL',claim:'Rubik offers View3D and presentation surfaces; a physical card/acetate/edge representation and spatially co-registered materialized view are not accredited as a current mode.',evidence:[R('Current Story and presentation renderer authorities.','js/presentation-story-core.js:254-364; js/surface-renderer.mjs:1-74')]},
  materialsLight:{status:'PARTIAL',claim:'Rubik owns materials, HDR/PMREM and presentation light. The donor-specific simultaneous card/real light filtering and depth-matched sweep are not shown in current Rubik.',evidence:[R('Current material and light paths.','js/surface-renderer.mjs:1-74; index.html:3758-3865')]},
  camera:{status:'PARTIAL',claim:'Rubik has perspective, framing, Story descent and route authorities; the donor scale-weighted dive and fixed-house walk/back are authored choreography.',evidence:[R('Current camera descent, overview and route.','js/presentation-story-core.js:46-110; js/presentation-route.js:1-156; index.html:4348-4395')]},
  transition:{status:'PARTIAL',claim:'Rubik has absolute Story/reveal state; no current spherical card/real visibility and shadow front is established.',evidence:[R('Current Story state and presentationReveal.','js/presentation-story-core.js:111-170,346-364; index.html:3344-3385')]},
  scrollProgress:{status:'EXISTS',claim:'Rubik Story already owns seek/playback and absolute progress. Donor 2030vh chapters and exponential smoothing are authored transport.',evidence:[R('Current Story seek and presentation player controls.','js/presentation-story-core.js:346-364; js/presentation-ui.js:751-774')]},
  ui:{status:'PARTIAL',claim:'Rubik already has presentation controls and sourced captions; donor studio CTA, scale chip and atmospheric HUD are presentation examples, not data authority.',evidence:[R('Current presentation UI and captions.','js/presentation-ui.js:8-31,613-774')]},
  mobile:{status:'PARTIAL',claim:'Rubik has mobile presentation paths, while any card-model variant would need its own framing and collision QA; donor 844×390 closing copy overlaps its header.',evidence:[R('Rubik responsive and presentation QA.','index.html:210-218; docs/qa/ft3d-6-implementation-2026-11-01.md:46-54')]},
  lifecycleRestore:{status:'EXISTS',claim:'Rubik Story has an end/restore owner. Donor corrected A0/A1 are visually equivalent after natural reverse, but hidden object and GPU identities are NOT_OBSERVED.',evidence:[R('Current Story end and renderer restore path.','index.html:4615-4703')]},
  outputs:{status:'EXISTS',claim:'Rubik has image/share/package outputs. Donor end CTA is studio marketing copy, not a new export format.',evidence:[R('Current image/share and ZIP output controls.','js/presentation-ui.js:239-288,321-360')]},
  qa:{status:'PARTIAL',claim:'Rubik has presentation QA; a reversible card/real representation would additionally require scale honesty, shadow-front coherence, mobile captions and reverse resource cleanup.',evidence:[R('Existing presentation QA harness and mobile cases.','scripts/qa/render-presentation-templates.cjs:1-46; docs/qa/ft3d-6-implementation-2026-11-01.md:46-54')]}
};
const selectedKeyframes={
  desktop:['discovery-correction-1/desktop-start.png','semantic-correction-1/desktop-forward-m02-card-at-eye-height.png','semantic-correction-1/desktop-forward-m03-luminous-transition-onset.png','semantic-correction-1/desktop-forward-m04-house-materialized.png','semantic-correction-1/desktop-forward-m07-living-interior.png','semantic-correction-1/desktop-forward-m09-desk-context-return.png','semantic-correction-1/desktop-forward-m12-return-sweep.png','semantic-correction-1/desktop-forward-m13-card-restored.png','discovery-correction-1/desktop-end.png','discovery-correction-1/desktop-restored-start.png'],
  portrait:['discovery-correction-1/portrait-start.png','semantic-correction-1/portrait-forward-m03-luminous-transition-onset.png','semantic-correction-1/portrait-forward-m07-living-interior.png','semantic-correction-1/portrait-forward-m09-desk-context-return.png','semantic-correction-1/portrait-forward-m13-card-restored.png','discovery-correction-1/portrait-end.png','discovery-correction-1/portrait-restored-start.png'],
  landscape:['discovery-correction-1/landscape-start.png','semantic-correction-1/landscape-forward-m03-luminous-transition-onset.png','semantic-correction-1/landscape-forward-m09-desk-context-return.png','semantic-correction-1/landscape-forward-m14-final-message.png','discovery-correction-1/landscape-end.png','discovery-correction-1/landscape-restored-start.png']
};
const config={
  schemaVersion:'rubik-donor-runtime-audit.reconciliation.v1',status:'AUDITED_WITH_DONOR_LIMITATION',
  discoveryRun:{desktop:'discovery-correction-1',portrait:'discovery-correction-1',landscape:'discovery-correction-1'},
  semanticRun:{desktop:'semantic-correction-1',portrait:'semantic-correction-1',landscape:'semantic-correction-1'},
  progressModel:{desktop:'SCROLL_PLUS_TIME',portrait:'SCROLL_PLUS_TIME',landscape:'SCROLL_PLUS_TIME'},
  transitions,milestoneSources:src,continuity,
  viewportSupport:{desktop:'SUPPORTED',portrait:'SUPPORTED',landscape:'DONOR_LIMITATION'},
  viewportEvidence:{desktop:[O('Corrected A0/A1 are visually equivalent after natural reverse and the semantic pass covers M01–M14.',disc('desktop','restored-start.png'))],portrait:[O('The portrait close and calls to action remain readable; corrected A0/A1 are visually equivalent.',disc('portrait','end.png'))],landscape:[O('At 844×390 the final heading and eyebrow overlap the top brand/nav header.',disc('landscape','end.png')),S('Mobile layout is selected at width <=759px or aspect <=4:5, excluding 844×390.','css/page.css:208-239')]},
  restoreVerdict:{desktop:'VISUALLY_EQUIVALENT',portrait:'VISUALLY_EQUIVALENT',landscape:'VISUALLY_EQUIVALENT'},
  restoreReview:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'After clean-context stable A0, natural forward to the stable end and reverse without reload, A1 returns to scrollY=0 and visually matches the fully assembled card house, contour base, headline, controls and workshop. Camera/material/light/shadow/temporary geometry/HUD appearance is visually equivalent; exact object/GPU identity remains NOT_OBSERVED. Original unstable-A0 runs are excluded.'])),
  reverseOnlyMilestones:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'No distinct reverse-only semantic state established. The back-out from B removes closing copy, returns through card-to-real sweep, house/interior/scale dive, then restores the stable card hero. Review continuous reverse video for timing and hidden cleanup; internal resource identity is NOT_OBSERVED.'])),
  selectedKeyframes,
  professionalService:{problemSolved:'Lets an architect explain to a client how one physical 1:100 study model relates to the spatial scale and lived rooms of the proposed house.',primaryUsers:['architect','client','design reviewer'],serviceOutcome:'The same house and contoured site move from card and desk into a materialized exterior/interior visit, reveal a nested model in the study, and return to the original card presentation.',decisionValue:'Can clarify proportion, site relation and room experience during design discussion. The donor studio CTA and authored house are not evidence of a Rubik project or a verified construction outcome.',evidence:[O('Corrected desktop A→B→A and M01–M14 show one house through card, real, nested model and return.',disc('desktop','forward-discovery.webm')),S('Donor README describes one parts list, scale dive, lamp-centered turn, two lighting states and return.','README.md:1-22')]},
  continuityInvariants:[
    {statement:'Card and real house preserve the flat roof, clerestory, balcony, glazing and lower stair on one contoured site.',evidence:[O('Card house at stable A0.',disc('desktop','start.png')),O('Materialized exterior.',sem('desktop','forward-m04-house-materialized.png')),S('cardHouse and realHouse consume the same houseParts list.','js/desk.js:290-304; js/real.js:367-391; js/house.js:13-136')]},
    {statement:'The scale figure leads to the same glazed facade and room arrangement, not an unrelated replacement model.',evidence:[O('Card at eye height.',sem('desktop','forward-m02-card-at-eye-height.png')),O('Living interior behind the glazing.',sem('desktop','forward-m07-living-interior.png'))]},
    {statement:'A distinct 1:100 model of that same house sits inside the full-size upper study.',evidence:[O('Small study desk model and +3.20 room label.',sem('desktop','forward-m09-desk-context-return.png')),S('Secondary tiny group uses scale .01 on the real study desk.','js/real.js:746-780')]},
    {statement:'The return front aligns real roof, balcony, openings and contour board before the card hero and CTA return.',evidence:[O('Real house on desk-scale site during return.',sem('desktop','forward-m12-return-sweep.png')),O('Card model restored.',sem('desktop','forward-m13-card-restored.png'))]}
  ],
  evidenceLedger:[
    O('Original A0 was captured during autonomous hero build in all viewports; originals remain preserved and superseded.',path.join(raw,'desktop/start-state.json')),
    O('Corrected three-viewport Discovery records clean-context natural A→B→A, 5% samples, forward/reverse video and telemetry.',disc('desktop','forward-discovery.webm')),
    O('Independent corrected semantic passes capture M01–M14 with continuous video and passive camera/HUD NDJSON.',sem('desktop','forward-semantic.webm')),
    O('Corrected A0/A1 are visually equivalent in desktop, portrait and landscape, while internal resource identity is unobserved.',disc('portrait','restored-start.png')),
    O('Landscape final title collides with brand/nav at 844×390.',disc('landscape','end.png')),
    S('The automatic hero model and copy finish after loader before the stable A0 marker used by the corrected harness.','js/page.js:370-420'),
    S('One parts list supplies card and real objects; separate tiny model is inside the study.','js/house.js:13-136; js/desk.js:292-304; js/real.js:367-391,746-780'),
    S('Scroll-controlled fixed-center radius, visibility/depth front, light partition and camera routes produce the observed turn and return.','js/page.js:97-108,180-307,479-576; js/sweep.js:12-104'),
    C('Cut3 D14/D15 and Global distinguish the main unscaled model, separate .01 tiny, and fixed-center sweep; Atlas 06 records the recursive study and return.',`${cut}:14-155; ${global}:335-373; ${atlas}:§4.6`),
    R('Current Rubik already owns project geometry, Story/camera, material/light, lifecycle and outputs, without accrediting this exact card/sphere presentation.','js/presentation-story-core.js:46-110,346-364; js/surface-renderer.mjs:1-74; index.html:3344-3385,4615-4703'),
    {class:'INFERENCE',statement:'The professional value of a card-to-real narrative for Rubik customers remains a later product decision.',locator:'professionalService',basedOn:[disc('desktop','forward-discovery.webm'),`${donor}:06-card-model/README.md:1-22`],inferenceStatus:'UNRESOLVED'}
  ],
  donorSourceLocators:[
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'06-card-model/js/house.js',symbol:'houseParts',lines:'13-136',claim:'A single metric house parts list supplies both primary representations.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'06-card-model/js/desk.js',symbol:'cardHouse/contourLayers/deskProps',lines:'290-390,427-493',claim:'Three-dimensional card and acetate house, thick contour board and oversized physical desk create the main miniaturized presentation without globally scaling the house .01.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'06-card-model/js/real.js',symbol:'realHouse/staging/tiny',lines:'367-445,446-780',claim:'Real materials/site/interior use the shared parts and a distinct tiny .01 model sits on the upper study desk.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'06-card-model/js/sweep.js',symbol:'SWEEP/sweepMaterial/DEPTH/sweepSide',lines:'12-104',claim:'One bulb-centered front uses radius, material discard, additive seam, separated light contributions and matching depth material.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'06-card-model/js/page.js',symbol:'CH/makeShot/diveCamera/turnCamera/walkCamera/backCamera/update/copy',lines:'180-307,420-576',claim:'Authored scroll chapters and scale-weighted camera dive drive forward turn, interior/study visit, back-out, reverse front, lamp fade and editorial close.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'06-card-model/js/page.js',symbol:'heroBuild/heroCopy',lines:'370-420',claim:'Autonomous assembly and heading timing explain why original A0 was premature.',classification:'SOURCE_CONFIRMED'},
    {repo:'Sam1983Aing/flat-to-3d',sha:'d7b9b69753d3af679535ee56695a05c8d955c3c6',path:'06-card-model/css/page.css',symbol:'mobile media query',lines:'208-239',claim:'Responsive rule excludes 844×390 and leaves final heading/header collision in desktop layout.',classification:'SOURCE_CONFIRMED'}
  ],
  cutsAtlas:[
    {locator:`Cut3 D14 ${cut}; Atlas 06 ${atlas}`,documentedDisposition:'D14-C1 KEEP EXISTING Rubik perspective/framing/descent; C2 ADAPT derived card support/composition; C3 REFERENCE ONLY scale-weighted route; C4 REJECT giant desk/global .01 claim',relationToRuntime:'EXTENDS',evidence:[C('Cut3 distinguishes unscaled main model, separate .01 tiny and existing Rubik camera capability.',`${cut}:14-88`),O('M09 reveals the tiny nested model in the real study, while M01 begins on the main card model.',sem('desktop','forward-m09-desk-context-return.png'))]},
    {locator:`Cut3 D15 ${cut}; Global D15 ${global}`,documentedDisposition:'D15-C1 ADAPT spatial field/band; C2 REIMPLEMENT light/shadow partition only if required; C3 REJECT fixed indices and donor distance compression as product assumptions',relationToRuntime:'CONFIRMS',evidence:[C('Cut3 and Global describe bulb-centered expanding radius, separate light contributions and coherent depth/shadows.',`${cut}:89-155; ${global}:357-373`),O('M03/M12 show a luminous boundary in opposite directions on the same house.',sem('desktop','forward-m03-luminous-transition-onset.png'))]},
    {locator:`Historical Atlas 06 ${atlas}`,documentedDisposition:'Reference-only donor runtime description, including hero assembly, scale descent, recursive study, return and lamp-off; earlier roadmap language is not adopted by this audit',relationToRuntime:'EXTENDS',evidence:[C('Atlas §4.6 lists the authored chapters and recursive model.',`${atlas}:§4.6`),O('Corrected full temporal videos and three viewport passes extend earlier reference observations.',disc('desktop','forward-discovery.webm'))]}
  ],
  rubikCrosswalk:crosswalk,
  gaps:[
    {classification:'REPRESENTATION_GAP',statement:'A derived, temporary physical card representation, contour support and edge/acetate cues are not accredited in current Rubik.',evidence:[S('cardHouse/contourLayers define representation-specific geometry.','js/desk.js:290-390'),R('Current project geometry and surface renderer do not establish a card-display layer.','index.html:3486-3640; js/surface-renderer.mjs:1-74')]},
    {classification:'TRANSITION_GAP',statement:'The exact radius-driven spatial card/real front with matching shadow/depth policy is absent from the audited current presentation scope.',evidence:[S('sweepMaterial/DEPTH implement card/real discard and shadow front.','js/sweep.js:12-104'),R('Current Story and presentationReveal use different transition paths.','js/presentation-story-core.js:111-170; index.html:3344-3385')]},
    {classification:'ORCHESTRATION_GAP',statement:'Existing Story, framing and route authorities would need project-derived states and one lifecycle owner to connect model-scale explanation with a valid room visit.',evidence:[S('CH/dive/walk/back are authored for one donor house.','js/page.js:180-307,420-526'),R('Story camera and route capabilities already exist.','js/presentation-story-core.js:46-110,346-364; js/presentation-route.js:1-156')]},
    {classification:'DONOR_LIMITATION',statement:'At 844×390 the donor close overlaps its brand/navigation because the mobile CSS branch does not apply; this is not a Rubik failure.',evidence:[O('Landscape closing collision.',disc('landscape','end.png')),S('Mobile layout rule excludes 844×390.','css/page.css:208-239')]},
    {classification:'PRODUCT_DECISION_REQUIRED',statement:'Whether a card-to-real scale service merits Rubik product inclusion is outside this audit; Atlas/Cut dispositions remain bounded reference evidence.',evidence:[C('Global D14/C2 and D15/C1 remain decision/reference bounded.',`${global}:335-373`),O('Runtime shows one donor-authored marketing presentation.',disc('desktop','forward-discovery.webm'))]}
  ],
  candidateBridges:[
    {classification:'ADAPT_EXISTING',problemSolved:'If approved later, present a project-derived physical study model while preserving real project units and geometry.',rubikAuthoritiesPreserved:['Project/Building units and IDs','existing View3D geometry','Story camera/lifecycle'],existingCapabilitiesConsumed:['project geometry','framing/overviewPose','Story descent'],missingConnector:'A temporary card/contour display adapter derived from authorized bounds and site data, with explicit presentation-only provenance.',donorMechanismReference:'desk.js:292-390; page.js:246-307; Global D14-C2 ADAPT, C4 REJECT',confidence:'MEDIUM',implementationAuthorized:false},
    {classification:'REIMPLEMENT_MECHANISM',problemSolved:'If useful, show the same authorized building changing representation through a spatially coherent front.',rubikAuthoritiesPreserved:['current renderer/material authority','Story absolute progress','Solar/light authority','project geometry'],existingCapabilitiesConsumed:['presentationReveal','surface renderer','Story seek/reverse'],missingConnector:'A verified representation mask/band and matching depth/shadow cleanup; dual light filtering only if coexistence requires it.',donorMechanismReference:'sweep.js:12-104; page.js:479-526; Global D15-C1 ADAPT, C2 conditional REIMPLEMENT, C3 REJECT',confidence:'LOW',implementationAuthorized:false},
    {classification:'CONNECT_EXISTING',problemSolved:'If the professional service is selected, carry the scale explanation through valid project rooms and return to the starting model.',rubikAuthoritiesPreserved:['current room IDs and route validity','Story camera and lifecycle','mobile framing'],existingCapabilitiesConsumed:['presentation-route','Story camera/seek','current semantic project'],missingConnector:'Project-derived room stops, bounded camera choreography and reversible model/room state handoff.',donorMechanismReference:'page.js:227-307,420-526; fixed donor coordinates are reference only',confidence:'MEDIUM',implementationAuthorized:false}
  ],
  dependencies:['TECHNICAL_PREREQUISITE: current project geometry and authorized site/bounds before deriving any card support.','TECHNICAL_PREREQUISITE: one Story-owned absolute state and restore before a reversible representation/light front.','TECHNICAL_PREREQUISITE: valid room/entry/route data before a house-scale interior visit.'],
  qaExpectations:[
    {category:'SEMANTIC',invariant:'Scale labels, site relation and room names derive from current project data or are explicitly marked as illustration.'},
    {category:'GEOMETRY',invariant:'Card and real views preserve the same opening, roof, balcony, stair and site identities; display support never becomes project geometry.'},
    {category:'VISUAL',invariant:'The spatial front remains registered on geometry, materials and shadows without detached swatches or a lighting seam artifact.'},
    {category:'CAMERA',invariant:'Scale descent and room visit stay inside valid geometry and preserve readable framing at all three viewports.'},
    {category:'LIFECYCLE',invariant:'Reverse restores the starting camera, representation, materials, light, shadows, temporary support, HUD and scroll/Story state.'},
    {category:'MOBILE',invariant:'Portrait and 844×390 landscape keep title, scale HUD and exit actions readable without obscuring the model.'},
    {category:'ACCESSIBILITY',invariant:'Narrative states, scale meaning and room changes have accessible text and reduced-motion equivalents.'},
    {category:'OUTPUT',invariant:'Any still or share output identifies the real project source and distinguishes a card display from measured geometry.'},
    {category:'REGRESSION',invariant:'Presentation-only card and sweep states do not mutate editor materials, real project geometry or saved data.'}
  ],
  unresolved:[
    {severity:'NON_BLOCKING',question:'Exact donor WebGL object, material, shadow and postprocess resource identities after reverse cannot be proven from passive runtime evidence.',attempts:['stable-start corrected A0/A1 screenshots in all viewports','continuous A→B→A video and NDJSON','pinned page.js/sweep.js lifecycle inspection'],evidenceNeeded:'Narrow read-only resource identity probe if identity-level restore becomes a later acceptance criterion.'},
    {severity:'NON_BLOCKING',question:'Professional usefulness and appropriate product placement of the card-to-real presentation are not decided by donor runtime.',attempts:['three-viewport runtime sequence','donor README/source','Cut3 D14/D15 and Global dispositions','frozen Rubik capability crosswalk'],evidenceNeeded:'Human review of all 14 audited references and Rubik service needs; no bridge implementation authorized.'}
  ]
};
await writeFile(path.join(dir,'reconciliation.json'),JSON.stringify(config,null,2)+'\n');
const rows=plan.milestones.map((m,i)=>`| ${m.label} | ${m.observedChange} | ${transitions[i].join(' / ')} | ${src[i]} |`).join('\n');
const report=`# 06 · Card Model — runtime audit\n\n## ¿Qué problema profesional o de cliente resuelve?\n\n${config.professionalService.problemSolved} ${config.professionalService.serviceOutcome} The donor's named house, centimetre/metre readout and studio copy are authored presentation, not verified Rubik project data.\n\n## Identity and capture\n\nDonor pinned: \`${donor}\`. Rubik frozen baseline: \`${rubik}\`. Standalone: \`https://sam1983aing.github.io/flat-to-3d/06-card-model/index.html\`. RAW: \`${raw}\`. Original A0 began during automatic card assembly in all three viewports; those six original attempts are retained but superseded. Discovery-correction-1 waits for complete hero assembly/copy and records natural A→B→A, WebM, NDJSON and 5% samples independently at 1440×900, 390×844 and 844×390. Semantic-correction-1 starts another clean context for M01–M14, continuous WebM and passive camera/HUD telemetry.\n\n## Observed A→B\n\n| Milestone | Observed semantic change | Approximate native transition start / center / end | Pinned causal source |\n|---|---|---|---|\n${rows}\n\nThe model descends to a figure, the same roof/glazing/balcony/site gains real materials through an amber spatial front, the camera visits living and upper study, encounters a separate small card model of the same house inside that study, backs out to the terrace, and returns through the front to the original card presentation. M09's early filename slug \`desk-context-return\` is retained for file traceability; its state is the nested model on the study desk, not the original workshop return. B is evidenced by stable final copy, max natural scroll and additional wheel with no new transformation.\n\n## Reverse and restore\n\nB→A is recorded without reload/reset. In all corrected viewports the assembled card house, contour board, headline/HUD and scroll origin are visually equivalent at A0/A1. The formal verdict is \`VISUALLY_EQUIVALENT\`, since hidden resource identity is \`NOT_OBSERVED\`. The reverse video is available for material/front/light timing; no separate reverse-only semantic state is established. The 844×390 donor layout overlaps the final headline and header, classified \`DONOR_LIMITATION\`; portrait final copy remains legible.\n\n## Source, Cuts/Atlas, Rubik and gaps\n\n\`houseParts\` supplies both primary card and real house. \`desk.js\` makes the thick layered card site and oversized desk; the main model does not carry a global .01 scale. \`real.js\` places a distinct .01 miniature inside the upper study. \`page.js\` maps native scroll to smoothed chapters, a scale-weighted dive, interior route, back-out, radius and lamp/end copy. \`sweep.js\` uses a fixed bulb center, growing/contracting radius, complementary material discard, narrow additive seam, light contribution separation and matching depth discard. Cut3 D14/D15 and Global already document those mechanisms; the present runtime confirms and extends temporal/mobile/restore evidence. Historical Atlas 06 records the recursive study and return; its earlier roadmap language is not adopted.\n\nRubik current already owns project geometry/units, framing, Story seek/camera/lifecycle, route, material/light and outputs. The exact physical card representation and radius-driven dual-state front are separate, bounded gaps; neither implies Rubik lacks general geometry, light or scale. The 12-dimension crosswalk, source locators, gaps, candidate bridges (all \`implementationAuthorized:false\`), technical prerequisites, QA invariants and explicit unknowns are in \`reconciliation.json\` and \`manifest.json\`. No product fusion, priority or implementation is decided.\n\n## Known unknowns\n\nHidden donor render-resource identity after reverse and later product suitability remain \`NON_BLOCKING\`. No blocking unknown is asserted after corrected capture and source review.\n`;
await writeFile(path.join(dir,'audit.md'),report);
console.log(JSON.stringify({id,status:config.status,milestones:plan.milestones.length},null,2));
