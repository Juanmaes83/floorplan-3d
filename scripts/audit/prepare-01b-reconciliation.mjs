import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const takeDir=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02/takes/01-b-unfolded-room');
const raw=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02/01-b-unfolded-room');
const donorSha='d7b9b69753d3af679535ee56695a05c8d955c3c6';
const baseSha='0f9c6ead9732901681498efec326d1ca92e42ffe';
const donor=`Sam1983Aing/flat-to-3d@${donorSha}:01-exploded-house/`;
const rubik=`Juanmaes83/floorplan-3d@${baseSha}:`;
const cut2='git:cc04f67fc0b46c87bc696bf566adb362f43041fd:docs/product/ft3d-donor-code-gap-analysis-2026-11-01.md';
const global='docs/product/ft3d-donor-global-reconciliation-2026-11-01.md';
const ev=(cl,statement,locator)=>({class:cl,statement,locator});
const O=(statement,locator)=>ev('OBSERVED_RUNTIME',statement,locator);
const S=(statement,locator)=>ev('DONOR_SOURCE',statement,donor+locator);
const C=(statement,locator)=>ev('CUT_ATLAS',statement,locator);
const R=(statement,locator)=>ev('RUBIK_CURRENT',statement,rubik+locator);
const frame=(vp,name)=>path.join(raw,vp,`${vp}-${name}.png`);
const video=path.join(raw,'desktop','desktop-forward-discovery.webm');
const cross=(status,claim,...evidence)=>({status,claim,evidence});
const shaPath=(p,symbol,lines,claim,classification='SOURCE_CONFIRMED')=>({repo:'Sam1983Aing/flat-to-3d',sha:donorSha,path:'01-exploded-house/'+p,symbol,lines,claim,classification});
const plan=JSON.parse(await readFile(path.join(takeDir,'semantic-plan.json'),'utf8'));
const config={
  schemaVersion:'rubik-donor-runtime-audit.reconciliation.v1',
  status:'AUDITED_WITH_DONOR_LIMITATION',
  transitions:[
    [.06,.10,.18],[.12,.18,.24],[.19,.25,.31],[.26,.32,.38],[.33,.39,.45],
    [.42,.49,.56],[.52,.56,.62],[.62,.70,.75],[.75,.79,.84],[.83,.88,.94],[.94,.99,1]
  ],
  milestoneSources:[
    'dir-b.js:199-202,262-283','dir-b.js:106-115,198-229','dir-b.js:106-115,198-229',
    'dir-b.js:106-115,138-149,198-229','dir-b.js:106-115,150-166,198-229',
    'dir-b.js:110-115,198-229','dir-b.js:198-237,263-283','dir-b.js:204-215; core.js:312-348',
    'dir-b.js:204-230; core.js:312-348','dir-b.js:204-248; core.js:312-348','dir-b.js:204-248; core.js:312-348'
  ].map(x=>donor+x),
  continuity:plan.milestones.map((_,i)=>i<7
    ?'Same kitchen floor footprint, door and window openings, sage cabinets and dining table remain associated with the rotating wall faces.'
    :'The same south door, east window, sage tile, dining table and pendant are seen from a moving camera inside the assembled room.'),
  viewportSupport:{desktop:'SUPPORTED',portrait:'SUPPORTED',landscape:'DONOR_LIMITATION'},
  viewportEvidence:{
    desktop:[],portrait:[],
    landscape:[O('At 844×390 the desktop navigation, introductory text, model labels and radar collide or crop during fold and walk.',frame('landscape','start')),S('Phone layout is selected by width <700, so 844px landscape retains desktop positions.','core.js:23,414; sketch.css:315-356')]
  },
  restoreVerdict:{desktop:'VISUALLY_EQUIVALENT',portrait:'VISUALLY_EQUIVALENT',landscape:'VISUALLY_EQUIVALENT'},
  restoreReview:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'A0 and A1 show the same unfolded sheet, callouts, camera composition and HUD after natural reverse; exact internal object identity was not passively observed.'])),
  reverseOnlyMilestones:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'No separate reverse-only state identified in continuous reverse review; camera exits, roof/walls unfold and sheet returns.'])),
  selectedKeyframes:{
    desktop:['desktop-start.png','desktop-forward-m02-west-sideboard-hinge.png','desktop-forward-m04-east-window-hinge.png','desktop-forward-m06-ceiling-lid-closes.png','desktop-forward-m09-door-threshold.png','desktop-forward-m10-sage-kitchen.png','desktop-end.png','desktop-restored-start.png'],
    portrait:['portrait-start.png','portrait-forward-m06-ceiling-lid-closes.png','portrait-forward-m09-door-threshold.png','portrait-end.png','portrait-restored-start.png'],
    landscape:['landscape-start.png','landscape-forward-m06-ceiling-lid-closes.png','landscape-forward-m09-door-threshold.png','landscape-end.png','landscape-restored-start.png']
  },
  professionalService:{
    problemSolved:'Helps a client or design reviewer understand how the floor, four elevations and ceiling of this authored kitchen relate to the enclosed room and its usable interior.',
    primaryUsers:['interior architect','joinery designer','client reviewer'],
    serviceOutcome:'A developed room drawing folds around its real pictured floor, then a camera passes through the same door to inspect kitchen and window bench.',
    decisionValue:'Supports discussion of spatial relationships and design intent in this study; printed dimensions, north and finish codes are authored demo content, not certified project data.',
    evidence:[S('The donor describes floor, walls and ceiling laid flat and folded shut before a walk inside.','dir-b.js:1-6'),O('Full A→B transition from sheet to window bench.',video)]
  },
  continuityInvariants:[
    {statement:'The developed floor, cabinet wall, door opening and window opening form the same kitchen after their parent faces rotate.',evidence:[O('Flat sheet before fold.',frame('desktop','start')),O('Partly folded faces preserve openings and joinery.',frame('desktop','forward-m04-east-window-hinge'))]},
    {statement:'The room enclosure and the entered kitchen retain the same south door and east window with no observed project swap.',evidence:[O('Closed room through door approach.',frame('desktop','forward-m07-closed-room')),O('Same door threshold and window bench.',frame('desktop','forward-m09-door-threshold'))]},
    {statement:'The sage cabinets, tile, table, pendant, plant and east window stay spatially related during the interior walk.',evidence:[O('Kitchen interior.',frame('desktop','forward-m10-sage-kitchen')),O('Window bench endpoint.',frame('desktop','end'))]}
  ],
  evidenceLedger:[
    O('Three viewport full forward, reverse and semantic passes with sidecar telemetry.',raw),
    S('Five hinged faces with absolute fold/grow progress and parented openings/content.','dir-b.js:106-115,198-230'),
    S('Authored sheet decals are attached to owner pivots at construction, and the camera has desktop/phone keys.','dir-b.js:204-215,262-283'),
    C('Cut 2 §24 D11 already established authored rectangular room, hinge math, topology limits and reverse evaluator.',cut2+':1279-1384'),
    R('Rubik has Project room/wall/opening geometry and Story lifecycle, without proven generic room-face unfolding.',rubik+'js/project-core.js:261-292; index.html:4750-4840'),
    {class:'INFERENCE',statement:'This study may help a client review joinery and room enclosure together, subject to the authored demo limits.',locator:'professionalService',basedOn:[video,donor+'dir-b.js:1-6'],inferenceStatus:'UNRESOLVED'}
  ],
  donorSourceLocators:[
    shaPath('dir-b.js','wall / N,S,Wst,E pivots and openings','106-166','Four cardinal, authored wall faces own their door/window and attached contents.'),
    shaPath('dir-b.js','FOLD/GROW/update','197-250','Absolute progress rotates each face around an edge, grows local contents, opens door, changes wash/sun/lamp and HUD.'),
    shaPath('dir-b.js','keys / eyeKey','204-215','Authored parallel-axo to eye-level poses, including phone overrides, drive the walk.'),
    shaPath('dir-b.js','SH / decal / drawSheet','262-283;377-455','Manual sheet and tags are generated as Canvas textures; decals are attached to parent pivots in the flat pose.'),
    shaPath('main.js','target / frame / step','120-184','Native scroll is smoothed into runtime progress; intro uses wall-clock time.'),
    shaPath('core.js','camAt / applyCam / ctx.phone','23;312-348;414-417','Camera interpolation and width-gated phone handling.', 'SOURCE_CONFIRMED')
  ],
  cutsAtlas:[
    {locator:'Cut 2 §24 D11 @cc04f67fc0b46c87bc696bf566adb362f43041fd',documentedDisposition:'REIMPLEMENT FROM MECHANISM; authored rectangular room, not universal auto-unfold',relationToRuntime:'EXTENDS',evidence:[C('Cut 2 established hinges, growth, source and sampled p0/.25/.5/.75/1/.5/0.',cut2+':1279-1384'),O('Continuous three-viewport hinge/walk/reverse evolution adds temporal and mobile evidence.',video)]},
    {locator:'Cut 2 §28 C2-CC2 and historical Atlas D11',documentedDisposition:'Clarifies initial decal attach, lid parent and eight authored decals; Atlas retained as history',relationToRuntime:'CONFIRMS',evidence:[C('Ownership and annotation precision is already documented.',cut2+':1663-1668'),S('Lid and decal parent relationships confirmed in pinned source.','dir-b.js:110-115,262-283')]},
    {locator:'Global reconciliation D11 at approved Rubik baseline',documentedDisposition:'D11-C1 REIMPLEMENT; C2 ADAPT; C3 REJECT',relationToRuntime:'CONFIRMS',evidence:[C('Prior dispositions distinguish face topology, temporary anchors and manual sheet.',global+':283-299'),O('Observed sheet-to-room continuity and authored labels.',video)]},
    {locator:'Cut 1 D01/D04 and Cut 2 D12/D13',documentedDisposition:'Camera, drawing treatment and navigation are separate mechanisms',relationToRuntime:'CONFIRMS',evidence:[C('Shared mechanisms are separately catalogued.',global+':101-119,155-173,301-337'),O('Near-parallel to eye-level camera handoff is visible.',frame('desktop','forward-m09-door-threshold'))]}
  ],
  rubikCrosswalk:{},gaps:[],candidateBridges:[],dependencies:[],qaExpectations:[],unresolved:[]
};

config.rubikCrosswalk={
  semanticData:cross('PARTIAL','Project preserves room polygons, walls and opening.wallId; room-to-face side and shared-wall ownership are not established for an unfold.',R('Rooms, wall rectangles and openings are derived from Project IDs.','js/project-core.js:261-292'),R('Current renderer has wallId and roomId/face metadata for a separate reveal, not a proven unfolding topology.','index.html:3304-3367')),
  geometry:cross('PARTIAL','Rubik has room, wall and opening geometry, including real openings; an ordered net of hinged room faces and a valid ceiling lid are not established.',R('Room polygons and wall opening geometries exist.','js/project-core.js:261-292'),R('Wall and floor meshes are current View3D geometry.','index.html:3499-3500,4899')),
  representation:cross('PARTIAL','Rubik has room views and an axon/exploded level presentation, but no evidenced six-face developed drawing for arbitrary rooms.',R('Room descent is a current Story narrative.','js/presentation-story-core.js:87-124'),R('Axon/exploded level narrative is present.','js/presentation-story-core.js:249-345')),
  materialsLight:cross('PARTIAL','Rubik has project surface appearances and lighting; authored sage/tile finish codes, plotter ink and donor sun movement are not project truth.',R('Surface material is derived from assigned appearance.','js/surface-renderer.mjs:6-74'),R('Presentation light preset and status are exposed.','index.html:4899')),
  camera:cross('PARTIAL','Rubik already fits project views and has room descent, but donor camera coordinates and a hinge-to-threshold handoff do not identify a valid route for another room.',R('Current room descent evaluator.','js/presentation-story-core.js:87-124'),R('Current axon camera fitting and state.','js/presentation-story-core.js:249-345')),
  transition:cross('PARTIAL','Story has deterministic reversible state evaluation; no face-hinge descriptor with room topology and opening ownership is evidenced.',R('Story stateAt derives scene state from progress.','js/presentation-story-core.js:1-45'),R('View3D presentation begin/apply/end exists.','index.html:4554-4656')),
  scrollProgress:cross('EXISTS','The existing Story player and seek controls provide controlled reversible progress without needing donor native scroll.',R('Story sequence maps global to local progress.','js/presentation-story-core.js:346-364'),R('UI exposes seeking.','js/presentation-ui.js:751-774')),
  ui:cross('PARTIAL','Presentation cards, captions and minimap exist; sheet-specific face annotations and model-sourced dimensions are not established.',R('Current presentation card and minimap controls.','js/presentation-ui.js:8-31'),R('Minimap uses current geometry and IDs.','js/presentation-ui.js:129-155')),
  mobile:cross('PARTIAL','Rubik presentation has mobile CSS and FT3D-6 QA; no unfolded-room variant has been tested in Rubik.',R('Current mobile presentation layout.','css/design-system.css:95-136'),R('FT3D-6 mobile QA authority.','docs/qa/ft3d-6-implementation-2026-11-01.md:1-55')),
  lifecycleRestore:cross('PARTIAL','Current scenes capture/apply/restore their owned state; future face transforms, child overlays and resources need a separate proven lease.',R('Axon capture/apply/end restore current handles.','index.html:4750-4840'),R('Story runtime manages current presentation lifecycle.','index.html:4554-4656')),
  outputs:cross('EXISTS','Rubik already offers image/share and ZIP of current project views; donor sheet is no authorized deliverable.',R('Image/share controls.','js/presentation-ui.js:239-288'),R('View/project batch ZIP.','js/presentation-ui.js:321-360')),
  qa:cross('PARTIAL','Existing QA covers presentation scenes and templates; face-topology, opening attachment and reverse for an unfold have no project-specific suite.',R('Axon visual QA harness.','scripts/qa/render-presentation-axon.cjs:1-40'),R('Template QA harness.','scripts/qa/render-presentation-templates.cjs:1-46'))
};
config.gaps=[
  {classification:'PRODUCT_DECISION_REQUIRED',statement:'Which room face, ceiling and professional annotation can truthfully be shown for a real project requires a bounded service contract and topology evidence.',evidence:[C('Cut 2 D11 limits arbitrary/shared/non-rectangular rooms and manual sheet data.',cut2+':1279-1384'),R('Rubik exposes polygons, walls and openings but no proven face-side graph.','js/project-core.js:261-292')]},
  {classification:'REPRESENTATION_GAP',statement:'A temporary, reversible face-hinge representation linked to real wall/opening IDs is not evidenced in Rubik current.',evidence:[O('Five face hinges observed on this authored rectangular study.',video),R('Current axon presentation separates levels, not room faces.','js/presentation-story-core.js:249-345')]},
  {classification:'ORCHESTRATION_GAP',statement:'Hinge, matrix-following annotations and valid room entry are not connected as one reversible Rubik service.',evidence:[O('Continuous sheet-to-room-to-interior handoff.',video),R('Rubik has Story and room descent as current capabilities.','js/presentation-story-core.js:87-124,346-364')]},
  {classification:'DONOR_LIMITATION',statement:'The donor 844×390 desktop composition overlaps the model, nav, HUD and text; this does not establish a Rubik mobile defect.',evidence:config.viewportEvidence.landscape}
];
config.candidateBridges=[{
  classification:'REIMPLEMENT_MECHANISM',
  problemSolved:'A bounded room-face reading could unfold only validated faces and openings while retaining the real room identity.',
  rubikAuthoritiesPreserved:['Project room/wall/opening IDs and materials','Building level datum','View3D geometry and renderer','Story progress/player/lifecycle','mobile-first presentation UI'],
  existingCapabilitiesConsumed:['room polygon and wall/opening geometry','existing room descent and camera fit','Story reversible state evaluation','presentation image/ZIP if product chooses an output'],
  missingConnector:'Verified room-to-face association, side and shared ownership; temporary hinge representation/lease and matrix-following labels; valid camera handoff. No generic net or manual sheet copied.',
  donorMechanismReference:'dir-b.js:106-115,198-283 hinge/grow/parented annotation; Cut 2 §24 D11 and Global D11-C1/C2/C3',
  confidence:'MEDIUM',implementationAuthorized:false
}];
config.dependencies=[
  'TECHNICAL_PREREQUISITE: prove room-to-wall-face topology and opening side/owner before any temporary hinge evaluation.',
  'TECHNICAL_PREREQUISITE: represent shared, non-rectangular and ceiling-absent cases explicitly or exclude them with a reason.',
  'TECHNICAL_PREREQUISITE: obtain a real route/threshold before camera handoff; donor coordinates are not Rubik route authority.',
  'Technical reuse of Story and geometry does not merge Unfolded Room with Board or FT3D-5 as a product service.'
];
config.qaExpectations=[
  {category:'SEMANTIC',invariant:'Only source-backed wall, opening, height and finish facts appear; demo codes, north and printed dimensions never become project claims.'},
  {category:'GEOMETRY',invariant:'The same opening remains attached to exactly one validated wall face through hinge motion; shared walls have one declared owner.'},
  {category:'VISUAL',invariant:'The room footprint, joinery and openings remain continuous from flat sheet to closed room to interior view.'},
  {category:'CAMERA',invariant:'A camera handoff uses an actual navigable threshold and preserves the same room/level.'},
  {category:'LIFECYCLE',invariant:'Forward, reverse, cancel and failure restore all temporary transforms, overlay resources, materials and camera state.'},
  {category:'MOBILE',invariant:'Portrait and short landscape expose legible annotations and controls without collision or model occlusion.'},
  {category:'ACCESSIBILITY',invariant:'The state and reverse controls remain keyboard and screen-reader understandable without depending on scroll alone.'},
  {category:'REGRESSION',invariant:'Existing FT3D-5 and FT3D-6 stories retain their current ownership and restore behavior.'}
];
config.unresolved=[{
  severity:'NON_BLOCKING',
  question:'Exact internal object identity and resource state after donor B→A were not passively exposed; visual equivalence, scroll and route return were observed.',
  attempts:['Fresh A0 and natural B→A/A1 at all viewports','A0/A1 visual comparison','Reverse video and telemetry','Absolute update/source inspection'],
  evidenceNeeded:'Read-only scoped object/resource snapshot if a later technical decision requires identity-level restore proof.'
}];
await writeFile(path.join(takeDir,'reconciliation.json'),JSON.stringify(config,null,2)+'\n');
const rows=plan.milestones.map((m,i)=>`| ${m.label} | ${m.observedChange} | ${config.transitions[i].join(' / ')} | ${config.milestoneSources[i].split(':').slice(-2).join(':')} |`).join('\n');
const report=`# 01-b · Unfolded Room — runtime audit

## ¿Qué problema profesional o de cliente resuelve?

Permite explicar a un cliente cómo las seis superficies de una cocina concreta, sus huecos y su mobiliario se relacionan con el recinto construido y con la experiencia de entrar en él. La hoja, las cotas, el norte y los códigos de acabado son datos authored del donor; no prueban una hoja técnica calculada para cualquier proyecto. La evidencia de servicio es el recorrido continuo desktop, portrait y landscape, además de la descripción del source pinneado.

## Identidad y control

- Rubik baseline: \`${baseSha}\`; branch \`audit/donor-runtime-7x14-2026-11-02\`.
- Donor: \`Sam1983Aing/flat-to-3d@${donorSha}\`; selector \`https://sam1983aing.github.io/flat-to-3d/#01:1\`; standalone/final \`https://sam1983aing.github.io/flat-to-3d/01-exploded-house/index.html?dir=b\`.
- Source: \`01-exploded-house/dir-b.js\`, \`main.js\`, \`core.js\`; Cut 2 §24 D11, §28 C2-CC2 y Global D11.
- RAW: \`${raw}\`; manifest, hashes y keyframes seleccionados acompañan este informe. Las muestras cada ~5 % son DISCOVERY_SAMPLE, no milestones.
- Herramientas: agent-browser 0.41.1, Chrome 153.0.8010.53, ffmpeg 8.1.2, DPR 1 en cada viewport.

## Evolución observada A→B

| Milestone | Cambio observado | Inicio / centro / fin nativo aproximado | Source causal |
|---|---|---|---|
${rows}

El estado A es la cocina desarrollada sobre una hoja. La transición primero da profundidad al suelo/contenido, luego levanta cuatro paredes por aristas; el techo, hijo de la pared norte, cierra el recinto. La cámara pasa de casi paralela a perspectiva, se acerca a la misma puerta y entra a ver la cocina y el banco de ventana. El estado B muestra el banco bajo la ventana; wheel adicional después de estabilización no reveló otro cambio importante. Cada milestone tiene screenshot de una segunda sesión limpia y tiempos aproximados en el manifest; los vídeos Discovery preservan los intervalos completos.

## Reverse, restore y viewports

Se grabó B→A con wheel natural y sin reload/reset. Los tres viewports volvieron a scrollY 0, route/hash iniciales y composición de hoja inicial. A0/A1 son visualmente equivalentes; el estado interno exacto de objetos/recursos es \`NOT_OBSERVED\`, así que el veredicto es \`VISUALLY_EQUIVALENT\`. No se identificó milestone exclusivo del reverse; se observa salida de cámara, apertura de techo/paredes y regreso de hoja.

| Viewport | A→B→A | Soporte | Observación |
|---|---|---|---|
| Desktop 1440×900 | 0→8100→0 | SUPPORTED | Hoja, plegado, puerta, cocina y ventana legibles. |
| Portrait 390×844 | 0→7596→0 | SUPPORTED | Plegado y visita completos; varias anotaciones pequeñas o fuera del encuadre. |
| Landscape 844×390 | 0→3510→0 | DONOR_LIMITATION | Usa layout desktop: nav, texto, radar y modelo se solapan/cortan. Evolución y reverse siguen operando. |

## Reconciliación milestone → source → Cuts/Atlas → Rubik

M01–M07: \`dir-b.js:106-115,198-283\` define pivotes cardinales, FOLD/GROW absolutos, door y overlays hijos/decals. La misma puerta, ventana, suelo, cocina y mesa continúan entre las caras de la hoja y la caja. Cut 2 §24 D11 documentó este mecanismo y sus límites; el vídeo continuo lo confirma y amplía con timing y móvil. C2-CC2 ya precisó el attach inicial, lid hijo y ocho decals frente al resumen Atlas. No emerge conflicto nuevo.

M08–M11: \`dir-b.js:204-248\` fija poses de cámara y UI para puerta, cocina y ventana; \`core.js:312-348\` interpola la cámara, mientras \`main.js:120-184\` suaviza el progreso de scroll. El paso por la puerta es de la misma habitación. Rubik tiene geometría Project/Building, cámara, Story, room descent, UI, outputs y lifecycle existentes; la ruta y coordenadas authored no son autoridad de otro proyecto.

El crosswalk de 12 dimensiones y las evidencias por source/viewport están en \`manifest.json\`. El gap técnico es asociación comprobada room→face/opening/shared owner y una representación temporal con bisagras/annotations que consuma Story sin crear otro modelo editable. Global D11-C1 indica REIMPLEMENT, C2 ADAPT y C3 REJECT; el bridge queda sólo como candidato documental \`REIMPLEMENT_MECHANISM\`, \`implementationAuthorized:false\`. No hay decisión de producto, fusión ni orden de implementación.

## Unresolved y QA derivada

Permanece abierto, como \`NON_BLOCKING\`, el estado interno exacto tras reverse. Se registraron A0/A1, vídeos, telemetry y source; una verificación de identidad exigiría snapshot read-only acotado. El manifest deriva invariantes futuros de semántica, opening/face ownership, continuidad, cámara, restore, móvil, accesibilidad y regresión; esta auditoría no los implementa.
`;
await writeFile(path.join(takeDir,'audit.md'),report);
console.log(JSON.stringify({take:'01-b-unfolded-room',milestones:plan.milestones.length,crosswalk:Object.keys(config.rubikCrosswalk).length,report:path.join(takeDir,'audit.md')}));
