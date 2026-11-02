import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const id='02-demo-section-sweep';
const dir=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02/takes',id);
const raw=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02',id);
const sha='d7b9b69753d3af679535ee56695a05c8d955c3c6';
const base='0f9c6ead9732901681498efec326d1ca92e42ffe';
const donor=`Sam1983Aing/flat-to-3d@${sha}:02-section-sweep/`;
const rubik=`Juanmaes83/floorplan-3d@${base}:`;
const cut1='git:6a573f1955fd70dd52bb10450c9b9df9b4833aa0:docs/product/ft3d-donor-code-gap-analysis-2026-11-01.md';
const cut2='git:cc04f67fc0b46c87bc696bf566adb362f43041fd:docs/product/ft3d-donor-code-gap-analysis-2026-11-01.md';
const global='docs/product/ft3d-donor-global-reconciliation-2026-11-01.md';
const ev=(cl,statement,locator)=>({class:cl,statement,locator});
const O=(s,l)=>ev('OBSERVED_RUNTIME',s,l),S=(s,l)=>ev('DONOR_SOURCE',s,donor+l),C=(s,l)=>ev('CUT_ATLAS',s,l),R=(s,l)=>ev('RUBIK_CURRENT',s,rubik+l);
const f=(vp,n)=>path.join(raw,vp,`${vp}-${n}.png`);
const v=path.join(raw,'desktop','desktop-forward-discovery.webm');
const cross=(status,claim,...evidence)=>({status,claim,evidence});
const sl=(file,symbol,lines,claim,classification='SOURCE_CONFIRMED')=>({repo:'Sam1983Aing/flat-to-3d',sha,path:'02-section-sweep/'+file,symbol,lines,claim,classification});
const plan=JSON.parse(await readFile(path.join(dir,'semantic-plan.json'),'utf8'));
const config={
  schemaVersion:'rubik-donor-runtime-audit.reconciliation.v1',status:'AUDITED_WITH_DONOR_LIMITATION',
  transitions:[[.01,.05,.07],[.07,.10,.13],[.13,.16,.19],[.18,.21,.24],[.25,.29,.32],[.32,.35,.38],[.38,.40,.43],[.45,.49,.52],[.52,.56,.59],[.61,.65,.69],[.70,.75,.79],[.78,.81,.86],[.88,.90,.94],[.94,.96,.99]],
  milestoneSources:[
    'main.js:62-100,210-239; draw.js:75-123',
    'main.js:219-260,529-550; draw.js:75-123',
    'main.js:101-145,235-253; house.js:1-80',
    'main.js:101-145,147-206,235-253',
    'main.js:101-145,147-206,470-478',
    'main.js:101-145,147-206,470-478',
    'main.js:101-145,147-206,470-478',
    'main.js:101-145,147-206',
    'main.js:101-145,147-206,470-478',
    'main.js:101-145,147-206,470-478',
    'main.js:101-145,147-206,251-253',
    'main.js:101-145,147-206,251-253',
    'main.js:235-260,529-550; draw.js:75-123',
    'main.js:235-260,442-511; draw.js:75-123'
  ].map(x=>donor+x),
  continuity:plan.milestones.map((_,i)=>i<3?'The same slope, three floor plates, stair, study book wall and glazed garden face remain aligned as the section acquires depth and material.':i<12?'The study book wall, entrance stair, coloured art, bedroom bed and two glazed facades locate the camera in the same three-level house throughout the walk.':'The same floor plates, stair, book wall, garden glazing and slope reappear as the camera withdraws and the section returns.'),
  viewportSupport:{desktop:'SUPPORTED',portrait:'SUPPORTED',landscape:'DONOR_LIMITATION'},
  viewportEvidence:{desktop:[],portrait:[],landscape:[O('At 844×390 the heading overlaps the section, level notes and title block; forward and reverse still operate.',f('landscape','start')),S('Only aspect ratio at or below 9:10 switches the layout to portrait; 844×390 retains desktop placement.','index.html:163-190')]},
  restoreVerdict:{desktop:'VISUALLY_EQUIVALENT',portrait:'VISUALLY_EQUIVALENT',landscape:'VISUALLY_EQUIVALENT'},
  restoreReview:Object.fromEntries(['desktop','portrait','landscape'].map(vp=>[vp,'A0/A1 have the same section geometry, hero copy, drawing HUD, route/hash and scroll origin; passive runtime state returns to swing/scanX 40/front false. Internal material, render-target and shadow resource identity was not exposed.'])),
  reverseOnlyMilestones:Object.fromEntries(['desktop','portrait','landscape'].map(vp=>[vp,'No separate reverse-only spatial state established. The end copy clears, sheet opens into the materialized cut, the spatial walk traverses backward, and the opening hero returns.'])),
  selectedKeyframes:{
    desktop:['desktop-start.png','desktop-forward-m01-section-lens-opens.png','desktop-forward-m02-materialized-cut.png','desktop-forward-m03-through-the-cut.png','desktop-forward-m05-the-study.png','desktop-forward-m08-stair-descent.png','desktop-forward-m10-the-bedroom.png','desktop-forward-m11-lower-garden.png','desktop-forward-m13-cut-reappears.png','desktop-end.png','desktop-restored-start.png'],
    portrait:['portrait-start.png','portrait-forward-m02-materialized-cut.png','portrait-forward-m05-the-study.png','portrait-forward-m11-lower-garden.png','portrait-end.png','portrait-restored-start.png'],
    landscape:['landscape-start.png','landscape-forward-m02-materialized-cut.png','landscape-forward-m05-the-study.png','landscape-forward-m11-lower-garden.png','landscape-end.png','landscape-restored-start.png']
  },
  professionalService:{problemSolved:'Helps an architect explain how a section drawing relates to occupied rooms, vertical movement and the garden-facing exterior of the same house.',primaryUsers:['architect','client','design reviewer'],serviceOutcome:'A technical section gains depth and material, the viewer follows a continuous route through upper, entrance and garden levels, then returns to the original sheet.',decisionValue:'Supports discussion of spatial organization and the relationship between a drawing and lived rooms. The authored house, furniture, sun dates and CTA are donor-specific claims, not transferable Rubik project facts.',evidence:[S('README describes drawing-to-depth, ink-to-lit-material, walk through the cut and return.','README.md:1-18'),O('Full desktop forward recording shows section, sweep, room route and return.',v)]},
  continuityInvariants:[
    {statement:'The section and the materialized cut show the same roof profile, three plates, stair, book wall, slope and garden glazing.',evidence:[O('Opening technical sheet.',f('desktop','start')),O('Materialized section.',f('desktop','forward-m02-materialized-cut'))]},
    {statement:'The stair connects the entrance living space to the upper study and lower lounge in the same model.',evidence:[O('Entrance stair.',f('desktop','forward-m04-entrance-and-stair')),O('Stair descent.',f('desktop','forward-m08-stair-descent'))]},
    {statement:'The bedroom glazing, garden facade and section cut retain one building orientation as the camera leaves and returns.',evidence:[O('Bedroom and garden.',f('desktop','forward-m10-the-bedroom')),O('Exterior garden facade.',f('desktop','forward-m11-lower-garden')),O('Cut on withdrawal.',f('desktop','forward-m13-cut-reappears'))]}
  ],
  evidenceLedger:[O('Three viewports have full natural forward/reverse recordings, 5-percent samples and a second semantic pass.',raw),O('Passive runtime __st reports swing/sweep/walk/rev/end chapters, camera/FOV, scanX and front flag in corrected Discovery telemetry.',path.join(raw,'desktop','desktop-forward-discovery.telemetry.ndjson')),S('story(y) derives camera, scan, front visibility and sheet; drawing.compose blends the technical and lit targets.','main.js:209-260,529-550; draw.js:75-123'),C('Cut 1 D05/D08 and Cut 2 D13 cover technical buffer, spatial material front and camera choreography; Global reconciliation preserves component dispositions.',global+':173-244,319-335'),R('Rubik already has dynamic section, Story, current geometry and a route planner/choreography, with distinct ownership and lifecycle.','js/presentation-section-core.js:1-105; js/presentation-story-core.js:111-170; js/presentation-route.js:1-156; index.html:4554-4705'),{class:'INFERENCE',statement:'A technical-to-occupied-space narrative may help a client understand the design, but suitability for a Rubik service remains a product decision.',locator:'professionalService',basedOn:[v,donor+'README.md:1-18'],inferenceStatus:'UNRESOLVED'}],
  donorSourceLocators:[
    sl('main.js','frames/swingState','62-100','One camera changes from far 0.12-degree section view into perspective; portrait uses separate camera framing.'),
    sl('main.js','walkKeys/buildWalk/walkPose','101-206','Authored Catmull-Rom camera and target splines carry the room route, pacing and lens shifts.'),
    sl('main.js','chapters/forwardScanX/story','209-260','Scroll in viewport heights determines five chapters, scan position, front visibility, sheet and sun-shaft state.'),
    sl('main.js','update/loop/__st','523-550,595-611','Native scroll is smoothed into story progress; runtime publishes chapter, camera, FOV, scanX and front state.'),
    sl('draw.js','createDrawing/renderND/compose/INK','21-220','Normal/depth/ID drawing buffer and full-screen shader create technical ink and world-x spatial blend with lit render.'),
    sl('real.js','createReal/setFront/render','18-140','Separate lit target, front group and sun-shaft target feed the drawing compositor.'),
    sl('index.html','portrait media query','163-190','Only tall aspect ratio receives portrait HUD arrangement; landscape retains desktop layout.')
  ],
  cutsAtlas:[
    {locator:'Cut 1 D05 @6a573f1955fd70dd52bb10450c9b9df9b4833aa0',documentedDisposition:'D05-C1 REIMPLEMENT technical discontinuity rendering if applicable; C2 ADAPT pochè; C3 REJECT donor IDs and authored duplicate house',relationToRuntime:'EXTENDS',evidence:[C('Global reconciles Cut 1 D05 into three components and limits the donor technical buffer.',global+':173-191'),O('Continuous runtime establishes the drawing-to-material sequence and mobile composition.',v)]},
    {locator:'Cut 1 D08 @6a573f1955fd70dd52bb10450c9b9df9b4833aa0',documentedDisposition:'D08-C1 ADAPT spatial mask principle; C2 KEEP EXISTING Story/camera authority; C3 REJECT donor constants, sentinels and fictional background',relationToRuntime:'CONFIRMS',evidence:[C('Global describes the scanX state and cautions that its source curve is not a universal primitive.',global+':229-244'),O('Observed moving cut plane and materialization.',f('desktop','forward-m02-materialized-cut'))]},
    {locator:'Cut 2 D13 @cc04f67fc0b46c87bc696bf566adb362f43041fd',documentedDisposition:'D13-C1 KEEP EXISTING route authority; C2 ADAPT pacing only if useful; C3 REJECT authored spline as a general planner',relationToRuntime:'EXTENDS',evidence:[C('Global records D13 route/choreography split and opt-in checker limit.',global+':319-335'),O('Full walk through labelled rooms and natural reverse is observed.',v)]},
    {locator:'Atlas / Global D05, D08, D13',documentedDisposition:'Technical representation, material front and route choreography are separate mechanisms that may share one service; preserve Rubik ownership.',relationToRuntime:'CONFIRMS',evidence:[C('Global synthesis and dependency map.',global+':584-590'),O('Same project invariants across sheet, materialized cut and walk.',f('desktop','forward-m13-cut-reappears'))]}
  ],
  rubikCrosswalk:{},gaps:[],candidateBridges:[],dependencies:[],qaExpectations:[],unresolved:[]
};
config.rubikCrosswalk={
  semanticData:cross('EXISTS','Project/Building own walls, rooms, openings, level IDs and real dimensions; donor labels and sun dates have no authority.',R('Section derives from current project and geometry.','js/presentation-section-core.js:30-105')),
  geometry:cross('PARTIAL','Rubik builds real geometry and a dynamic section on the active level; a whole authored three-level section is not established as a current general presentation.',R('Section target groups and active-level bound.','index.html:4664-4694'),R('Section descriptor derives supported intersections.','js/presentation-section-core.js:1-105')),
  representation:cross('PARTIAL','Dynamic clipping/caps exist, while donor normal/depth/ID technical ink and coordinated spatial blend are not proven for Rubik content.',R('Current dynamic section clip and caps.','index.html:4673-4705'),C('D05-C1 remains unverified at Global reconciliation.',global+':173-191')),
  materialsLight:cross('PARTIAL','Rubik has authorized surface and lighting state; donor per-pixel ink/material front and shaft handoff are not demonstrated.',R('Surface renderer consumes current project appearances.','js/surface-renderer.mjs:1-74'),R('Current section preserves material clipping state.','index.html:4675-4703')),
  camera:cross('PARTIAL','Rubik has section-open camera and planned room route choreography; this donor-specific long continuous path through three levels is not an existing generic route.',R('Section-open deterministic camera.','js/presentation-story-core.js:111-170'),R('Route planner and choreography are separate.','js/presentation-route.js:1-156')),
  transition:cross('PARTIAL','Rubik Story has absolute state, section movement and restore; the observed technical-to-lit spatial transition is unverified.',R('Section-open stateAt(p).','js/presentation-story-core.js:125-170'),R('Story sequence/local progress.','js/presentation-story-core.js:346-364')),
  scrollProgress:cross('EXISTS','Rubik has one Story progress/player and seek authority; donor long native-scroll mapping is not required to claim that capability.',R('Story progress and sequences.','js/presentation-story-core.js:346-364'),R('Presentation seek UI.','js/presentation-ui.js:751-774')),
  ui:cross('PARTIAL','Rubik has presentation controls, minimap and captions; donor sheet title block, live lens and CAD radar are not assumed product contracts.',R('Presentation UI and minimap use project state.','js/presentation-ui.js:8-31,129-155')),
  mobile:cross('PARTIAL','Rubik presentation responds to small viewports; donor landscape overlap is a donor limitation, not evidence of a Rubik defect.',R('Responsive presentation card and controls.','index.html:442-448'),R('FT3D-6 mobile QA.','docs/qa/ft3d-6-implementation-2026-11-01.md:1-55')),
  lifecycleRestore:cross('EXISTS','Rubik section and Story snapshot/restore camera, clipping/material planes and UI; donor passive A0/A1 proves visual equivalence only.',R('Story end and section cleanup.','index.html:4615-4703')),
  outputs:cross('EXISTS','Rubik already captures/shares images and batches views; the donor CTA is not a new output contract.',R('Image/share and batch ZIP.','js/presentation-ui.js:239-288,321-360')),
  qa:cross('PARTIAL','Current presentation tests exist; any technical-material front and long route would need targeted visual, mobile and restore invariants.',R('Existing presentation QA harnesses.','scripts/qa/render-presentation-templates.cjs:1-46'))
};
config.gaps=[
  {classification:'REPRESENTATION_GAP',statement:'The donor technical ink uses a normal/depth/ID compositor; Rubik has a real section but no accredited equivalent for this exact technical rendering over arbitrary current project geometry.',evidence:[S('One ND pass and full-screen ink compositor.','draw.js:21-220'),R('Current dynamic section uses clipping/caps.','index.html:4664-4705'),C('Global D05-C1 REIMPLEMENT is unverified, not a button-name comparison.',global+':173-191')]},
  {classification:'ORCHESTRATION_GAP',statement:'A coordinated section lens, material front and valid room route as one reversible service is not demonstrated by the current separate Rubik authorities.',evidence:[O('Complete sheet-to-walk-to-sheet traversal.',v),R('Current section-open and route are separate.','js/presentation-story-core.js:111-170; js/presentation-route.js:1-156')]},
  {classification:'DONOR_LIMITATION',statement:'The 844×390 donor landscape title/HUD overlaps the section, while the interaction and reverse still work.',evidence:config.viewportEvidence.landscape}
];
config.candidateBridges=[
  {classification:'REIMPLEMENT_MECHANISM',problemSolved:'If technical ink is needed, render a section-readable technical view of current Rubik geometry.',rubikAuthoritiesPreserved:['Project/Building geometry and dimensions','View3D material ownership and clipping','existing Section descriptor/lifecycle'],existingCapabilitiesConsumed:['dynamic section and caps','current rendering scene'],missingConnector:'A Rubik-compatible technical representation/compositor with verified transparency, clipping and material behavior.',donorMechanismReference:'draw.js:21-220; Global D05-C1 REIMPLEMENT, C3 REJECT',confidence:'MEDIUM',implementationAuthorized:false},
  {classification:'ADAPT_EXISTING',problemSolved:'If a spatial materialization service is selected, coordinate technical and lit representation over one project.',rubikAuthoritiesPreserved:['one Story progress and camera','Project/Building geometry','Rubik material/light state'],existingCapabilitiesConsumed:['Story section-open','existing lit View3D representation'],missingConnector:'A world-space, reversible blend over the same Rubik geometry and real region, without donor hardcoded scan curve.',donorMechanismReference:'main.js:219-260; draw.js:75-123; Global D08-C1 ADAPT',confidence:'MEDIUM',implementationAuthorized:false},
  {classification:'CONNECT_EXISTING',problemSolved:'If a section-to-room visit is selected, continue from a real section to a validated room route.',rubikAuthoritiesPreserved:['Rubik route planner and selected room/entry','Story player and lifecycle','mobile-first presentation UI'],existingCapabilitiesConsumed:['section-open Story','room route plan/choreography'],missingConnector:'A verified handoff pose and entry/route for the actual project; no borrowed donor Catmull-Rom control points.',donorMechanismReference:'main.js:101-206; Global D13-C1 KEEP EXISTING, C2 ADAPT, C3 REJECT',confidence:'LOW',implementationAuthorized:false}
];
config.dependencies=['TECHNICAL_PREREQUISITE: a supported real Section descriptor/caps and current Building geometry before technical or materialized section output.','TECHNICAL_PREREQUISITE: a valid selected room, entry and route before any walkthrough handoff.','TECHNICAL_PREREQUISITE: one reversible Story state and Rubik-owned camera/material/light snapshots across any composed transition.'];
config.qaExpectations=[
  {category:'SEMANTIC',invariant:'Section elevations, labels and dates derive from current project/authorized sources; donor sheet facts never become project data.'},
  {category:'GEOMETRY',invariant:'Technical and lit representations show identical walls, openings, stair and level relations at each transition frame.'},
  {category:'VISUAL',invariant:'A spatial front changes representation continuously over one project and does not expose missing caps, transparent artifacts or mismatched shadows.'},
  {category:'CAMERA',invariant:'Any walk uses a validated entry and maintains safe framing through each actual room and level.'},
  {category:'LIFECYCLE',invariant:'Reverse and End restore camera, clipping planes, materials, lights, temporary render targets, UI and scroll/player state.'},
  {category:'MOBILE',invariant:'Portrait and landscape preserve legible section, labels and controls without donor 844×390 overlap.'},
  {category:'ACCESSIBILITY',invariant:'Meaning of section, level, current room and representation remains available without visual-only shader cues.'},
  {category:'OUTPUT',invariant:'Captured still/video uses the same current project state and includes only authorized source-based annotations.'},
  {category:'REGRESSION',invariant:'Existing section-open, route, Story, lighting and output behavior remain valid independently.'}
];
config.unresolved=[
  {severity:'NON_BLOCKING',question:'Exact donor render-target, shader and shadow resource identity after natural B→A is not passively observable; visual, camera/chapter/scanX/front and scroll/route restore are observed.',attempts:['A0/A1 screenshots at all three viewports','continuous reverse video and corrected passive runtime telemetry','source story/update/real review'],evidenceNeeded:'A narrowly scoped read-only resource snapshot if identity-level lifecycle proof becomes necessary.'},
  {severity:'NON_BLOCKING',question:'The handoff from drawn sun angle to volumetric beam is source-confirmed but its precise optical timing cannot be isolated from the available frames without a targeted light pass.',attempts:['Full Discovery and semantic video','5-percent samples and room keyframes','README/main.js/draw.js/real.js review'],evidenceNeeded:'Targeted time-sensitive frames around scanX crossing south glazing and passive shaft-state telemetry if a light-specific decision depends on it.'}
];
await writeFile(path.join(dir,'reconciliation.json'),JSON.stringify(config,null,2)+'\n');
const rows=plan.milestones.map((m,i)=>`| ${m.label} | ${m.observedChange} | ${config.transitions[i].join(' / ')} | ${config.milestoneSources[i]} |`).join('\n');
const report=`# 02 · Section Sweep — runtime audit

## ¿Qué problema profesional o de cliente resuelve?

Permite explicar a un cliente cómo la sección A-A de una casa en pendiente se corresponde con estancias habitables, recorridos entre niveles y relación con el jardín. El dibujo se abre, se materializa, se recorre y vuelve a ser la misma lámina. La casa, las cotas, fechas solares y el CTA son contenido authored del donor, no datos de Rubik.

## Identidad y evidencia

- Rubik baseline \`${base}\`; branch \`audit/donor-runtime-7x14-2026-11-02\`.
- Donor \`Sam1983Aing/flat-to-3d@${sha}\`; selector \`https://sam1983aing.github.io/flat-to-3d/#02\`; standalone/final \`https://sam1983aing.github.io/flat-to-3d/02-section-sweep/index.html\`.
- RAW \`${raw}\`; cada viewport tiene vídeo forward/reverse/semantic, telemetry forward/reverse, 5%-samples y A0/B/A1. Las muestras no son milestones.
- Herramientas: agent-browser 0.41.1, Chrome 153.0.8010.53, ffmpeg 8.1.2; DPR real en manifest.
- Tras detectar \`window.__st\` en el source, Discovery se repitió para registrar pasivamente capítulo, cámara, FOV, scanX y front. Los intentos iniciales permanecen en run-state.

## Evolución observada A→B

| Milestone | Cambio observado | Inicio / centro / fin nativo aproximado | Source causal |
|---|---|---|---|
${rows}

A es una sección técnica casi ortográfica con cotas, rayos solares dibujados y título. El lente se abre sin perder alineación de forjados, escalera y huecos; un frente espacial sustituye tinta por material. La ruta recorre salón, estudio, mezzanine, descenso, planta de jardín y exterior. Retorna por la misma casa hacia el corte y la lámina con copy final. B se comprobó tras wheel adicional y estabilización, sin nueva transformación importante. La telemetría desktop sitúa capítulos aproximados en swing 0–.07, sweep .07–.125, walk .126–.879, rev .879–.97 y end .97–1; no se equipara ese porcentaje físico con semántica por sí solo.

## Reverse, restore y viewports

El reverse B→A se ejecutó con wheel natural, sin reload, reset ni función interna. Se retira el copy final, reaparece el corte material, la cámara recorre de vuelta las estancias y regresa al dibujo inicial. A0/A1 son \`VISUALLY_EQUIVALENT\` en los tres viewports; el runtime pasivo vuelve a swing, scanX 40 y front false, pero no expone la identidad de recursos internos de material/luz.

| Viewport | Soporte | Observación |
|---|---|---|
| 1440×900 desktop | SUPPORTED | Lámina, barrido, estancias y retorno legibles. |
| 390×844 portrait | SUPPORTED | Ruta y reverse completos con encuadre vertical adaptado. |
| 844×390 landscape | DONOR_LIMITATION | El título y la lámina se solapan; la página mantiene layout desktop por su media query de aspecto. El recorrido sigue funcionando. |

## Reconciliación por mecanismo

M01–M02: \`main.js:62-100,209-260\` transforma una cámara de 0.12°/distancia extrema en sección con perspectiva; \`draw.js:21-220\` compone normal, profundidad, ID y render lit por \`scanX\`. Cut 1 D05/D08 había acreditado los mecanismos y Global conserva D05-C1 REIMPLEMENT, D08-C1 ADAPT, rechazo de IDs/curvas/escena authored. El runtime confirma la continuidad de los mismos elementos.

M03–M12: \`walkKeys/buildWalk/walkPose\` controla la ruta authored y los room labels; \`story(y)\` decide front visibility y capítulos. Cut 2 D13 distingue la autoridad de ruta Rubik de la coreografía donor. Rubik tiene sección dinámica, Story y plan/choreography de ruta, pero no se acredita que el spline fijo del donor sea una ruta válida para un proyecto arbitrario. El posible handoff es \`ORCHESTRATION_GAP\`, condicionado a selección y entrada reales.

M13–M14: \`story(y)\` invierte el frente material y el swing; \`hud\` recompone lámina y copy. El retorno observado es compatible con source y Cuts; el comentario source de continuidad C1 de la curva no sustituye el límite matemático ya documentado en Global D08. No se registra conflicto nuevo ni se reescribe ningún Cut.

El crosswalk de las 12 dimensiones, gaps, bridge candidates con \`implementationAuthorized:false\`, dependencias técnicas y QA derivada están en \`manifest.json\`. Los bridges son hipótesis técnicas para revisión, sin selección de producto ni orden de implementación.

## Known unknowns

La identidad interna de render targets/shaders/sombras tras reverse y el timing óptico exacto de sunbeams son \`NON_BLOCKING\` explícitos. Ninguno se presenta como evidencia observada ni impide reconstruir la experiencia esencial.
`;
await writeFile(path.join(dir,'audit.md'),report);
console.log(JSON.stringify({take:id,milestones:plan.milestones.length,crosswalk:Object.keys(config.rubikCrosswalk).length}));
