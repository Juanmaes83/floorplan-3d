import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const takeDir=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02/takes/01-c-floor-by-floor');
const raw=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02/01-c-floor-by-floor');
const donorSha='d7b9b69753d3af679535ee56695a05c8d955c3c6',baseSha='0f9c6ead9732901681498efec326d1ca92e42ffe';
const donor=`Sam1983Aing/flat-to-3d@${donorSha}:01-exploded-house/`,rubik=`Juanmaes83/floorplan-3d@${baseSha}:`;
const cut2='git:cc04f67fc0b46c87bc696bf566adb362f43041fd:docs/product/ft3d-donor-code-gap-analysis-2026-11-01.md';
const global='docs/product/ft3d-donor-global-reconciliation-2026-11-01.md';
const ev=(cl,statement,locator)=>({class:cl,statement,locator});
const O=(statement,locator)=>ev('OBSERVED_RUNTIME',statement,locator),S=(statement,locator)=>ev('DONOR_SOURCE',statement,donor+locator),C=(statement,locator)=>ev('CUT_ATLAS',statement,locator),R=(statement,locator)=>ev('RUBIK_CURRENT',statement,rubik+locator);
const frame=(vp,name)=>path.join(raw,vp,`${vp}-${name}.png`),video=path.join(raw,'desktop','desktop-forward-discovery.webm');
const cross=(status,claim,...evidence)=>({status,claim,evidence});
const sl=(file,symbol,lines,claim,classification='SOURCE_CONFIRMED')=>({repo:'Sam1983Aing/flat-to-3d',sha:donorSha,path:'01-exploded-house/'+file,symbol,lines,claim,classification});
const plan=JSON.parse(await readFile(path.join(takeDir,'semantic-plan.json'),'utf8'));
const config={
  schemaVersion:'rubik-donor-runtime-audit.reconciliation.v1',status:'AUDITED_WITH_DONOR_LIMITATION',
  transitions:[[.05,.09,.13],[.11,.15,.18],[.16,.22,.30],[.30,.35,.40],[.40,.48,.56],[.54,.61,.68],[.70,.76,.82],[.80,.85,.90],[.87,.95,1]],
  milestoneSources:[
    'dir-c.js:74-115,209-233','dir-c.js:74-115,209-233','dir-c.js:114-188,209-233',
    'dir-c.js:210-238','dir-c.js:213-222; core.js:312-348','dir-c.js:213-222,239-265',
    'dir-c.js:210-233','dir-c.js:210-251','dir-c.js:213-265'
  ].map(x=>donor+x),
  continuity:plan.milestones.map((_,i)=>i<4?'The same concrete core, floor plates, timber columns and level-three desks stay in one authored building as vertical gaps close.':'The same level-three desks, timber columns, perimeter glazing and level-four soffit remain aligned during camera entry and overhead descent.'),
  viewportSupport:{desktop:'SUPPORTED',portrait:'SUPPORTED',landscape:'DONOR_LIMITATION'},
  viewportEvidence:{desktop:[],portrait:[],landscape:[O('At 844×390 desktop nav, intro, level labels and radar crop or overlap the model, while progress and reverse still work.',frame('landscape','start')),S('Phone layout is width-gated at 700px; 844px landscape follows desktop positioning.','core.js:23,414; sketch.css:315-356')]},
  restoreVerdict:{desktop:'VISUALLY_EQUIVALENT',portrait:'VISUALLY_EQUIVALENT',landscape:'VISUALLY_EQUIVALENT'},
  restoreReview:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'A0/A1 show the same separated levels, hero, labels, camera composition and HUD after natural reverse; internal object/resource identity was not passively observed.'])),
  reverseOnlyMilestones:Object.fromEntries(['desktop','portrait','landscape'].map(v=>[v,'No separate reverse-only state identified: studio traverse reverses, upper level rises and lower levels separate in sequence.'])),
  selectedKeyframes:{
    desktop:['desktop-start.png','desktop-forward-m03-furnished-third-level.png','desktop-forward-m04-level-three-gap.png','desktop-forward-m05-enter-level-three-gap.png','desktop-forward-m07-level-four-descends.png','desktop-forward-m08-soffit-closes.png','desktop-end.png','desktop-restored-start.png'],
    portrait:['portrait-start.png','portrait-forward-m04-level-three-gap.png','portrait-forward-m07-level-four-descends.png','portrait-end.png','portrait-restored-start.png'],
    landscape:['landscape-start.png','landscape-forward-m04-level-three-gap.png','landscape-forward-m07-level-four-descends.png','landscape-end.png','landscape-restored-start.png']
  },
  professionalService:{problemSolved:'Explains the vertical organization and level-three workspace of one authored multilevel timber building to a client or design reviewer.',primaryUsers:['architect','building design reviewer','client'],serviceOutcome:'An exploded building stacks from the ground upward, holds an upper-level gap to reveal the studio, then lowers the overhead plate as the camera traverses that same floor.',decisionValue:'Clarifies spatial relationship between levels and occupied studio in this study; the apparent weekly construction sequence, stretched core and roof garden are authored demo claims rather than Rubik project facts.',evidence:[S('Donor description specifies floor stack, level-three gap and level-four lowering.','dir-c.js:1-4,209-212'),O('Full A→B sequence shows stacking, entry and overhead descent.',video)]},
  continuityInvariants:[
    {statement:'Concrete ground, central core, perimeter timber grid and level-three desks remain in the same building as floor gaps close.',evidence:[O('Separated level stack.',frame('desktop','start')),O('Lower stack with level-three desks.',frame('desktop','forward-m04-level-three-gap'))]},
    {statement:'The studio seen from axon is the level entered by the camera while the same level-four plate hangs over it.',evidence:[O('Level-three gap before entry.',frame('desktop','forward-m04-level-three-gap')),O('Under suspended level.',frame('desktop','forward-m06-under-suspended-level'))]},
    {statement:'The level-four soffit descends toward the same timber columns, desks and perimeter facade, preserving the workspace relation.',evidence:[O('Highlighted overhead descent.',frame('desktop','forward-m07-level-four-descends')),O('Enclosed studio endpoint.',frame('desktop','end'))]}
  ],
  evidenceLedger:[O('All three viewports have continuous forward/reverse videos, telemetry and a second semantic pass.',raw),S('Six authored storeys use GAP/LAND absolute progress; core scales vertically and cityUp remains collapsed.','dir-c.js:210-245'),C('Cut 2 §22 D09 established source mechanism, demo assumptions and sampled probe; global D09 distinguishes already solved level reading from unresolved handoff.',cut2+':1058-1170'),R('Rubik baseline has level-based axon/exploded Story with restore and separate room descent.','js/presentation-story-core.js:87-124,249-364; index.html:4750-4840'),{class:'INFERENCE',statement:'This study may help a reviewer discuss spatial stacking and studio occupation, subject to authored building limitations.',locator:'professionalService',basedOn:[video,donor+'dir-c.js:1-4'],inferenceStatus:'UNRESOLVED'}],
  donorSourceLocators:[
    sl('dir-c.js','storey/timberFloor builders','74-188','Creates fixed ground, four timber levels and roof with authored furniture on level three.'),
    sl('dir-c.js','GAP/LAND/update','209-265','Six absolute vertical offsets land bottom-up with held upper gap, color/label/dash progress and authored UI.'),
    sl('dir-c.js','keys/eyeKey','213-222','Authored camera transitions from near-parallel axon into level three and across studio, with phone overrides.'),
    sl('dir-c.js','coreG/capG/cityUp','189-201;223-245','Global concrete core stretches to top of separated roof, cap translates, and cityUp stays compressed; no genuine connection proof.'),
    sl('main.js','target/frame/step','120-184','Native scroll drives smoothed p; intro shadows use separate wall-clock T.'),
    sl('core.js','camAt/applyCam/ctx.phone','23;312-348;414-417','Width-gated camera variants and projection.')
  ],
  cutsAtlas:[
    {locator:'Cut 2 §22 D09 @cc04f67fc0b46c87bc696bf566adb362f43041fd',documentedDisposition:'EXTRACT MECHANISM historically; do not import authored GAP, core stretch, city or route as product truth',relationToRuntime:'EXTENDS',evidence:[C('Cut 2 describes six groups, absolute LAND/GAP and sampled reverse probes.',cut2+':1058-1170'),O('Continuous three-viewport forward/reverse and semantic states extend temporal/mobile evidence.',video)]},
    {locator:'Global reconciliation D09 at approved Rubik baseline',documentedDisposition:'D09-C1/C2 KEEP EXISTING; C3 REJECT; C4 UNRESOLVED',relationToRuntime:'CONFIRMS',evidence:[C('Current FT3D-5 level reading and lifecycle already solve C1/C2, while generic handoff remains unverified.',global+':245-263'),O('Observed level stack and authored level-three entry.',video)]},
    {locator:'Atlas D09 historical and Cut 2 §27.1',documentedDisposition:'Six authored storeys and cumulative Y offsets differ from Board component layers and Unfolded faces',relationToRuntime:'CONFIRMS',evidence:[C('Cut 2 distinguishes membership, axes and prerequisites of D09/D10/D11.',cut2+':1603-1617'),O('Six level labels in initial stack.',frame('desktop','start'))]},
    {locator:'Cut 1 D01 and Cut 2 D12/D13',documentedDisposition:'Camera/progress/orientation and valid route are separate from level offsets',relationToRuntime:'CONFIRMS',evidence:[C('Global catalog separates camera, player and route authorities.',global+':101-119,301-337'),O('Axon-to-eye-level camera transition.',frame('desktop','forward-m05-enter-level-three-gap'))]}
  ],
  rubikCrosswalk:{},gaps:[],candidateBridges:[],dependencies:[],qaExpectations:[],unresolved:[]
};
config.rubikCrosswalk={
  semanticData:cross('EXISTS','Project/Building preserve real level IDs, elevations, rooms and opening ownership; donor six authored floors are not imported.',R('Project derives room/wall/opening geometry from source IDs.','js/project-core.js:261-292'),R('Axon descriptor derives levels from current Building.','js/presentation-axon-core.js:79-98')),
  geometry:cross('EXISTS','Rubik constructs current multilevel building geometry and bounds for level separation.',R('Building geometry enters View3D sync.','index.html:3499-3500,3808'),R('Level descriptor and separation bounds.','js/presentation-axon-core.js:58-98')),
  representation:cross('EXISTS','FT3D-5 compact and exploded level reading already exists; the authored donor look and six-group stack are study-specific.',R('Axon/exploded narrative on actual levels.','js/presentation-story-core.js:249-345'),R('Current axon handles captured and applied.','index.html:4750-4828')),
  materialsLight:cross('PARTIAL','Rubik has project appearances and lighting, but donor timber/CLT claims and lamp/sun treatment are not inferred as current project truth.',R('Surface appearances are assigned from current data.','js/surface-renderer.mjs:6-74'),R('Current light preset/state.','index.html:4899')),
  camera:cross('PARTIAL','Rubik fits a building axon and has room descent; a general automatic exploded-to-valid-level-route handoff is unverified.',R('Current axon camera state.','js/presentation-story-core.js:249-345'),R('Room descent narrative is a separate current capability.','js/presentation-story-core.js:87-124')),
  transition:cross('EXISTS','Absolute reversible compact/exploded level state and scene progress already exist; donor GAP/LAND constants are not required.',R('Axon/exploded level transition.','js/presentation-story-core.js:249-345'),R('Story sequence/local progress.','js/presentation-story-core.js:346-364')),
  scrollProgress:cross('EXISTS','Story player and seek map progress without donor native scrolling or a second scheduler.',R('Story sequence progress.','js/presentation-story-core.js:346-364'),R('Seek UI.','js/presentation-ui.js:751-774')),
  ui:cross('PARTIAL','Rubik has presentation controls, captions and minimap; donor floor-by-floor callouts are not assumed to be product labels.',R('Presentation card/minimap/controls.','js/presentation-ui.js:8-31'),R('Minimap uses actual room/level data.','js/presentation-ui.js:129-155')),
  mobile:cross('PARTIAL','Current presentation has responsive layout and mobile QA; exact donor composition is not adopted.',R('Presentation mobile CSS.','css/design-system.css:95-136'),R('FT3D-6 mobile QA.','docs/qa/ft3d-6-implementation-2026-11-01.md:1-55')),
  lifecycleRestore:cross('EXISTS','Current level presentation captures/applies/restores its own handles and state; donor itself has no editor rollback.',R('Axon begin/apply/end on current handles.','index.html:4750-4840'),R('Story runtime/scene lifecycle.','index.html:4554-4656')),
  outputs:cross('EXISTS','Rubik can capture/share images and batch ZIP current project views; donor has no special output contract to port.',R('Image/share.','js/presentation-ui.js:239-288'),R('Batch ZIP.','js/presentation-ui.js:321-360')),
  qa:cross('PARTIAL','FT3D-5/6 reproducible QA exists; a hypothetical automatic handoff would need separate evidence.',R('Axon QA harness.','scripts/qa/render-presentation-axon.cjs:1-40'),R('Template QA harness.','scripts/qa/render-presentation-templates.cjs:1-46'))
};
config.gaps=[
  {classification:'NO_GAP',statement:'Real-level compact/exploded presentation, progress and reversible lifecycle already exist in Rubik; donor six-level constants add no required product capability.',evidence:[C('Global D09-C1/C2 are KEEP EXISTING.',global+':245-263'),R('Current level narrative and lifecycle.','js/presentation-story-core.js:249-345; index.html:4750-4840')]},
  {classification:'INTEGRATION_GAP',statement:'A general handoff from a level reading to an actual selected, navigable room/route is unverified even though Story, level geometry and room descent exist.',evidence:[O('Donor camera enters its authored level-three studio.',video),C('Global D09-C4 remains UNRESOLVED.',global+':245-263'),R('Room descent is separate from current axon states.','js/presentation-story-core.js:87-124,249-345')]},
  {classification:'DONOR_LIMITATION',statement:'844×390 donor desktop layout crops level labels/nav and overlays radar on the building; this does not establish a Rubik mobile defect.',evidence:config.viewportEvidence.landscape}
];
config.candidateBridges=[
  {classification:'REUSE_EXISTING',problemSolved:'Represent real project levels in compact/exploded form with existing Rubik authority and lifecycle.',rubikAuthoritiesPreserved:['Project/Building level IDs, elevations and geometry','existing View3D/Story/player','mobile-first UI'],existingCapabilitiesConsumed:['FT3D-5 axon descriptor and scene','current Story progress/restore'],missingConnector:'None for the already supported level reading; donor GAP/LAND and six fixed groups are not required.',donorMechanismReference:'dir-c.js:209-245 as comparative reference; Global D09-C1/C2 KEEP EXISTING',confidence:'HIGH',implementationAuthorized:false},
  {classification:'UNRESOLVED',problemSolved:'If a future professional service requires continuing from level reading into a verified room visit, connect only a real selected level/entry/route.',rubikAuthoritiesPreserved:['Project/Building and current level selection','Rubik route planner and camera','Story lifecycle/player'],existingCapabilitiesConsumed:['current level reading','room descent and route if valid'],missingConnector:'Validated selection/entry, recomposed handoff pose and route in the current project; no authored coordinate fallback.',donorMechanismReference:'dir-c.js:213-222 camera keys; Global D09-C4 UNRESOLVED',confidence:'LOW',implementationAuthorized:false}
];
config.dependencies=[
  'TECHNICAL_PREREQUISITE: actual Building level descriptor and current geometry for any level reading.',
  'TECHNICAL_PREREQUISITE: a valid selected room/entry/route and recomposed camera pose before any automatic visit handoff.',
  'The stretched donor core, fixed six groups and invented construction schedule are reference-only demo content, not product dependencies.'
];
config.qaExpectations=[
  {category:'SEMANTIC',invariant:'Levels, elevations and materials in a presentation come from current Project/Building data; no authored donor week/CLT claims are imported.'},
  {category:'GEOMETRY',invariant:'Existing level explode/recompose keeps each object with its real level and never stretches a shared core as a fake connector.'},
  {category:'CAMERA',invariant:'Any handoff enters a validated level/room through a real route, after level geometry is recomposed.'},
  {category:'LIFECYCLE',invariant:'Reverse, cancel and End restore current levelView, visibility, transforms, camera and UI without drift.'},
  {category:'MOBILE',invariant:'Both mobile orientations preserve the selected level, readable cue and usable controls.'},
  {category:'ACCESSIBILITY',invariant:'Level state and visit transition are understandable via keyboard and assistive text, independent of donor scroll.'},
  {category:'REGRESSION',invariant:'FT3D-5 compact/exploded and FT3D-6 template behavior remain valid for supported Building configurations.'}
];
config.unresolved=[
  {severity:'NON_BLOCKING',question:'Exact internal donor object/resource identity after B→A is not passively exposed; visual equivalence and route/scroll return are observed.',attempts:['Fresh A0 and natural B→A/A1 at all viewports','Continuous reverse video and telemetry','Source absolute evaluator review'],evidenceNeeded:'Narrow read-only object/resource snapshot if a later technical question requires identity-level restore proof.'},
  {severity:'NON_BLOCKING',question:'The donor roof group also lands at .80–.90 in source, but its motion is occluded by the interior camera; no distinct roof milestone is claimed from runtime.',attempts:['Full desktop/portrait/landscape videos','5% safety samples','Pinned source LAND intervals'],evidenceNeeded:'A separately justified view of the roof during the same progress interval if roof motion becomes essential to a future decision.'}
];
await writeFile(path.join(takeDir,'reconciliation.json'),JSON.stringify(config,null,2)+'\n');
const rows=plan.milestones.map((m,i)=>`| ${m.label} | ${m.observedChange} | ${config.transitions[i].join(' / ')} | ${config.milestoneSources[i]} |`).join('\n');
const report=`# 01-c · Floor by Floor — runtime audit

## ¿Qué problema profesional o de cliente resuelve?

Ayuda a un cliente o revisor a comprender la organización vertical de un edificio de madera authored y cómo se ocupa el estudio del nivel 3 mientras el nivel 4 queda separado y después desciende. La frase “one week each”, el núcleo estirado y el número fijo de niveles pertenecen a esta demo; no son datos de otro proyecto ni prueba de una secuencia de obra real.

## Identidad y evidencia

- Rubik baseline \`${baseSha}\`; branch \`audit/donor-runtime-7x14-2026-11-02\`.
- Donor \`Sam1983Aing/flat-to-3d@${donorSha}\`; selector \`https://sam1983aing.github.io/flat-to-3d/#01:2\`; standalone/final \`https://sam1983aing.github.io/flat-to-3d/01-exploded-house/index.html?dir=c\`.
- Source \`01-exploded-house/dir-c.js\`, \`main.js\`, \`core.js\`; Cut 2 §22 D09 y Global D09.
- RAW \`${raw}\`; vídeos forward/reverse/semantic y telemetry por viewport. Las muestras del 5 % son DISCOVERY_SAMPLE, no milestones.
- Tooling agent-browser 0.41.1, Chrome 153.0.8010.53, ffmpeg 8.1.2, DPR real 1.

## Evolución observada A→B

| Milestone | Cambio observado | Inicio / centro / fin nativo aproximado | Source causal |
|---|---|---|---|
${rows}

A muestra ground, cuatro niveles y cubierta separados. El apilado de los niveles inferiores termina con el estudio del tercero legible y un gran hueco superior. La cámara se introduce bajo la planta suspendida; el techo/sofito del cuarto nivel baja sobre la misma retícula de columnas y mesas. B es el estudio cerrado visto desde dentro. Wheel adicional tras la estabilización no mostró otra transformación importante. La bajada de cubierta figura en LAND del source, pero queda oculta desde la cámara interior: no se presenta como milestone runtime independiente.

## Reverse / restore / viewports

El reverse B→A fue continuo con wheel natural, sin reload ni reset. Reabrió el hueco, devolvió la cámara al axon y separó los niveles. A0/A1 son visualmente equivalentes en los tres viewports; no se observó identidad interna de objetos/recursos, así que \`VISUALLY_EQUIVALENT\` es el veredicto.

| Viewport | A→B→A | Soporte | Observación |
|---|---|---|---|
| Desktop 1440×900 | 0→8100→0 | SUPPORTED | Niveles, gap, entrada, descenso superior y estudio legibles. |
| Portrait 390×844 | 0→7596→0 | SUPPORTED | Mismo recorrido y reverse, con encuadre más estrecho. |
| Landscape 844×390 | 0→3510→0 | DONOR_LIMITATION | Layout desktop solapa/corta nav, etiquetas, modelo y radar; la evolución funciona. |

## Reconciliación

M01–M04: \`dir-c.js:210-245\` calcula offsets Y absolutos de seis grupos con GAP/LAND; ground y tres niveles descienden mientras nivel 4/roof esperan. Labels/dashes siguen posiciones actuales. La continuidad la dan la misma planta del estudio, columnas, núcleo y envolvente. Cut 2 §22 D09 lo había acreditado con source/probes y muestras; el vídeo completo amplía timing y móvil.

M05–M09: \`dir-c.js:213-222\` fija cámara axon→ojo y recorrido por el nivel 3; \`main.js:120-184\` suaviza scroll. LAND baja nivel 4 sobre la cámara; el núcleo global se escala como solución visual authored, no conexión estructural. Global D09-C1/C2 declara que Rubik ya tiene lectura compacta/despiece por niveles y lifecycle; C3 rechaza core/ciudad/seis grupos como verdad y C4 conserva unresolved el handoff general a una ruta. El crosswalk de 12 dimensiones está en el manifest.

El gap concreto es \`INTEGRATION_GAP\` si algún servicio futuro necesitara continuar desde un nivel elegido a una estancia/ruta válida. Story, Building, room descent y player ya existen. El bridge documental de lectura de niveles es \`REUSE_EXISTING\`; el handoff permanece \`UNRESOLVED\`, \`implementationAuthorized:false\`. No se decide servicio, prioridad ni fusión. No se encontró conflicto nuevo runtime/source/Cut.

## Known unknowns y QA derivada

El estado interno exacto tras reverse y la bajada de la cubierta oculta desde la cámara interior son \`NON_BLOCKING\` explícitos. El manifest deriva invariantes futuros sobre IDs reales, recomposición, ruta validada, restore, mobile y regresión. No se implementó nada.
`;
await writeFile(path.join(takeDir,'audit.md'),report);
console.log(JSON.stringify({take:'01-c-floor-by-floor',milestones:plan.milestones.length,crosswalk:Object.keys(config.rubikCrosswalk).length}));
