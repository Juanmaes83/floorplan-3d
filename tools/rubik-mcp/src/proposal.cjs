'use strict';

/* MCP Etapa 2 — propuestas de distribución explicables (docs/technical/local-mcp-stage2-proposals.md).
   Read-only and deterministic. Composes the existing authorities, never a new collision engine:
   - FloorPlanPlacement.candidates / scene / roomsAt / problemsIn (js/furniture-placement.js): the candidate sequence,
     prefilter, rounding, tolerance and budget of FloorPlanPlacement.find, on a grid of rings around the current
     position; conservative door model (the square swept by the leaf). The search does not stop at the first position
     that FloorPlanPlacement accepts: it goes on, with the same budget, until one also passes layout-review.
   - FloorPlanLayoutReview.review / leafContact (js/layout-review.js): overlaps and the precise door-leaf contact.
   - FloorPlanCore.validate / geometry / clone (js/project-core.js): canonical contract and derived geometry.
   - Spatial.createSpatialIndex (./spatial.cjs): room attribution of the rotated footprint.
   The answer is a RubikLayoutProposalV1: a candidate position for ONE piece of furniture, never applied (applied:false).
   The candidate is checked on an ephemeral in-memory copy that is discarded; no project, patch or variant is emitted. */

const C = require('../../../js/project-core.js');
const T = require('../../../js/tracing-core.js');
const Review = require('../../../js/layout-review.js');
const Placement = require('../../../js/furniture-placement.js');
const Spatial = require('./spatial.cjs');

const PROPOSAL_VERSION = 'RubikLayoutProposalV1';
const GOALS = Object.freeze(['resolve-placement-conflict', 'clear-door-swing']);
const LIMITS = Object.freeze({
  stepMm: { min: 10, max: 1000, default: Placement.STEP_MM },
  maxCandidates: { min: 1, max: Placement.MAX_CANDIDATES, default: Placement.MAX_CANDIDATES },
  objects: 100,
  rejectedLog: 10,
  // Full verifications (FloorPlanCore.validate + FloorPlanPlacement.problems + layout-review of the whole project) per
  // call. layout-review is O(n²) in furniture (~21 ms with 100 pieces); this keeps a call bounded (~5 s worst case).
  // It can only stop the search earlier than maxCandidates, never extend or reset it.
  verifications: 250,
});
const SHA256 = /^[0-9a-f]{64}$/;
const ID = /^[\s\S]{1,160}$/;
const EPS = 1e-6;
const NON_BLOCKING = new Set(['rug', 'acwall']);
const ALLOWED_ARGS = new Set(['objectId', 'goal', 'expectedSha256', 'openingId', 'stepMm', 'maxCandidates']);

// What this tool never evaluates, whatever the result.
const NOT_EVALUATED = Object.freeze([
  { code: 'height', message: 'Altura, elevación y mallas 3D: solo huellas en planta.' },
  { code: 'clearance', message: 'Holguras y paso entre muebles: no hay umbral ni se inventa uno (usa inspect_pair_clearance o check_route_2d).' },
  { code: 'route', message: 'Recorridos, accesibilidad, evacuación y normativa.' },
  { code: 'stairs-and-levels', message: 'Escaleras, huecos de escalera y otras plantas: el JSON exportado no las incluye en esta búsqueda.' },
  { code: 'door-details', message: 'Grosor de la hoja, tiradores, marcos y el lado opuesto de la puerta.' },
  { code: 'other-moves', message: 'Mover otros muebles, girar, redimensionar o cambiar de estancia: solo se propone una nueva posición del mueble indicado.' },
  { code: 'preference', message: 'Ergonomía, estética, uso o preferencia: la candidata es la primera válida, no la mejor.' },
]);

const USED_DATA = Object.freeze([
  'objects[objectId]: id, type, name, position, size, rotationDeg, roomId',
  'objects[*]: posición, tamaño y giro para solapes',
  'rooms[*]: id, name, polygon',
  'walls[*]: start, end, thicknessMm, status',
  'openings[*]: wallId, kind, offsetMm, widthMm, swing',
  'scale.confidence',
]);

function fail(message) { throw new Error(message); }

// Defensive validation (the MCP server also validates with Zod). Rejects instead of clamping.
function normalize(args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) fail('Los argumentos deben ser un objeto.');
  for (const key of Object.keys(args)) if (!ALLOWED_ARGS.has(key)) fail(`Argumento no admitido: ${String(key).slice(0, 40)}.`);
  const { objectId, goal, expectedSha256, openingId } = args;
  if (typeof objectId !== 'string' || !ID.test(objectId)) fail('objectId debe ser un texto de 1 a 160 caracteres.');
  if (!GOALS.includes(goal)) fail(`goal debe ser uno de: ${GOALS.join(', ')}.`);
  if (typeof expectedSha256 !== 'string' || !SHA256.test(expectedSha256)) fail('expectedSha256 debe ser el SHA-256 hexadecimal (64 caracteres) del archivo, devuelto por get_project_summary.');
  if (openingId !== undefined && (typeof openingId !== 'string' || !ID.test(openingId))) fail('openingId debe ser un texto de 1 a 160 caracteres.');
  const int = (name) => {
    const value = args[name], limit = LIMITS[name];
    if (value === undefined) return limit.default;
    if (!Number.isSafeInteger(value) || value < limit.min || value > limit.max) fail(`${name} debe ser un entero entre ${limit.min} y ${limit.max}.`);
    return value;
  };
  return { objectId, goal, expectedSha256, ...(openingId === undefined ? {} : { openingId }), stepMm: int('stepMm'), maxCandidates: int('maxCandidates') };
}

const pose = (object, roomId) => ({
  position: { x: object.position.x, y: object.position.y },
  rotationDeg: object.rotationDeg,
  size: { widthMm: object.size.widthMm, depthMm: object.size.depthMm },
  ...(roomId ? { roomId } : {}),
});
const reviewFindingsFor = (result, id) => result.findings
  .filter(f => f.objects.includes(id))
  .map(f => ({
    code: f.code, objects: [...f.objects],
    ...(f.measurementMm !== undefined ? { measurementMm: f.measurementMm } : {}),
    ...(f.measurementDeg !== undefined ? { measurementDeg: f.measurementDeg } : {}),
    message: f.message,
  }));
const key = f => `${f.code}:${[...f.objects].sort().join('|')}`;
// `assumed` marks a conflict with the square of a door whose swing is NOT in the JSON (FloorPlanCore.geometry assumes a
// hinge for it): geometric evidence of the placement model, but based on an assumption, not on recorded data.
const placementList = (list, assumed = () => false) => list.map(p => ({ kind: p.kind, ...(p.id ? { id: p.id } : {}), detail: p.detail, ...(assumed(p) ? { assumedSwing: true } : {}) }));

function finish(out, status, extra = {}) {
  return { ...out, ...extra, status, applied: false };
}

function propose(project, snapshot, rawArgs) {
  const args = normalize(rawArgs);
  const out = {
    proposalVersion: PROPOSAL_VERSION,
    status: null,
    goal: args.goal,
    source: {
      sha256: snapshot.sha256,
      schemaVersion: typeof project.schemaVersion === 'string' ? project.schemaVersion : null,
      scaleConfidence: project.scale?.confidence ?? 'unknown',
    },
    objectId: args.objectId,
    ...(args.openingId ? { openingId: args.openingId } : {}),
    object: null,
    problem: null,
    currentPose: null,
    suggestedPose: null,
    distanceMm: null,
    rationale: null,
    evidence: {},
    blockingReasons: [],
    expectedEffects: [],
    remainingIssues: [],
    uncertainty: [],
    notEvaluated: NOT_EVALUATED.map(n => ({ ...n })),
    search: null,
    usedData: [...USED_DATA],
    applied: false,
  };
  const block = (code, message, extra) => finish(out, 'blocked', { blockingReasons: [{ code, message }], ...extra });
  const pending = (code, message, extra) => finish(out, 'pending', { blockingReasons: [{ code, message }], ...extra });

  // 1. The proposal must correspond to the bytes the person is looking at.
  if (snapshot.sha256 !== args.expectedSha256) {
    return block('stale-source', 'El SHA-256 del archivo no coincide con expectedSha256: el JSON cambió desde que se consultó. Vuelve a leer el resumen y repite la petición.', {
      evidence: { expectedSha256: args.expectedSha256, actualSha256: snapshot.sha256 },
    });
  }

  // 2. Scale: never a reason to refuse, always declared.
  const scale = out.source.scaleConfidence;
  if (scale !== 'real') out.uncertainty.push({ code: `scale-${scale}`, message: scale === 'estimated'
    ? 'Escala estimada (no confirmada): las distancias en mm son aproximadas.'
    : 'Escala sin calibrar o desconocida: las distancias en mm son relativas al dibujo.' });

  // 3. The element: one piece of furniture of the JSON, identified by its id.
  const object = project.objects.find(o => o.id === args.objectId);
  if (!object) {
    const other = ['rooms', 'walls', 'openings'].find(k => project[k].some(x => x.id === args.objectId));
    return other
      ? block('not-furniture', `El ID corresponde a un elemento de «${other}», no a un mueble. Solo se proponen posiciones de muebles.`)
      : block('object-not-found', 'No existe un mueble con ese ID en el JSON seleccionado.');
  }
  if (project.objects.length > LIMITS.objects) {
    return pending('project-too-large', `La búsqueda acotada del MCP admite hasta ${LIMITS.objects} muebles por proyecto; no se ha calculado ninguna candidata.`);
  }
  out.object = { id: object.id, type: object.type, name: object.name || object.type };

  // 4. Room: the single room containing the object's position (FloorPlanPlacement), cross-checked with the footprint
  //    relation of the MCP. Never chosen by convenience.
  const scene = Placement.scene(project);
  const centreRooms = Placement.roomsAt(scene, object.position);
  const relation = Spatial.createSpatialIndex(project).relation('objects', object);
  out.evidence.room = { centreRoomIds: centreRooms.map(r => r.id), footprintRelation: relation };
  out.currentPose = pose(object, centreRooms.length === 1 ? centreRooms[0].id : undefined);
  if (!centreRooms.length) {
    return block('object-outside-rooms', 'La posición del mueble no está dentro de ninguna estancia. Esta herramienta no cambia de estancia: decide manualmente dónde debe ir.');
  }
  if (centreRooms.length > 1) {
    return pending('ambiguous-room', 'La posición del mueble pertenece a más de una estancia: no se puede atribuir con certeza y no se elige una por conveniencia.');
  }
  if (relation.reason === 'stored_room_id_conflicts_with_geometry') {
    return pending('stored-room-conflict', `El roomId guardado (${relation.storedRoomId}) contradice la geometría: falta decidir a qué estancia pertenece.`);
  }
  const roomId = centreRooms[0].id;

  // Doors without swing: FloorPlanCore.geometry derives them with a default hinge (start/left) and FloorPlanPlacement
  // avoids that assumed square, while FloorPlanLayoutReview skips them. Declared, never hidden.
  const activeDoors = project.openings.filter(o => o.kind === 'door'
    && project.walls.find(w => w.id === o.wallId)?.status !== 'demolished');
  const swingless = activeDoors.filter(o => !o.swing).map(o => o.id);
  if (swingless.length) out.uncertainty.push({ code: 'placement-assumes-door-swing', openingIds: swingless.slice(0, 20),
    message: 'Hay puertas sin bisagra ni sentido registrados. FloorPlanPlacement las trata con una bisagra supuesta (inicio/izquierda) y evita ese cuadrado; layout-review no las evalúa. Las candidatas pueden apartarse de un barrido que no consta en el JSON.' });
  // F1: a placement conflict with one of those doors is a conflict with an ASSUMED sweep, not an accredited one.
  const swinglessIds = new Set(swingless);
  const isAssumed = p => p.kind === 'door' && swinglessIds.has(p.id);

  // 5. The problem exists? Never move something that has no problem.
  const placementBefore = Placement.problemsIn(scene, object, roomId);
  const reviewBefore = reviewFindingsFor(Review.review(project), object.id);
  out.evidence.before = { placementModel: placementList(placementBefore, isAssumed), reviewModel: reviewBefore };
  let door = null;
  if (args.goal === 'clear-door-swing') {
    if (!args.openingId) return block('opening-required', 'clear-door-swing necesita openingId: el ID de la puerta cuyo barrido se quiere despejar.');
    const opening = project.openings.find(o => o.id === args.openingId);
    if (!opening) return block('opening-not-found', 'No existe un hueco con ese openingId en el JSON seleccionado.');
    if (opening.kind !== 'door') return block('not-a-swing-door', `El hueco es «${opening.kind}», no una puerta abatible: no tiene barrido.`);
    if (project.walls.find(w => w.id === opening.wallId)?.status === 'demolished') return block('door-on-demolished-wall', 'La puerta está en un muro demolido: no tiene barrido activo.');
    if (!opening.swing || !['start', 'end'].includes(opening.swing.hinge) || !['left', 'right'].includes(opening.swing.side)) {
      return pending('door-swing-missing', 'La puerta no tiene registrados bisagra y sentido de apertura (swing): no se puede calcular su barrido y no se inventan.');
    }
    door = C.geometry(project).doors.find(d => d.id === opening.id);
    if (!door) return pending('door-geometry-unavailable', 'No se pudo derivar la geometría de la puerta.');
    const footprint = T.footprint(object);
    const contact = Review.leafContact(door, footprint);
    const square = placementBefore.some(p => p.kind === 'door' && p.id === opening.id);
    out.evidence.door = {
      swing: { hinge: opening.swing.hinge, side: opening.swing.side }, widthMm: opening.widthMm,
      reviewLeafContactDeg: contact === null ? null : Math.round(contact * 10) / 10,
      placementSquareHit: square,
      models: {
        review: 'layout-review.leafContact: hoja de grosor nulo que gira 90° (radio = ancho del hueco).',
        placement: 'furniture-placement: cuadrado conservador que envuelve el barrido completo.',
      },
    };
    if (NON_BLOCKING.has(object.type)) {
      return finish(out, 'no-change-needed', { rationale: `«${out.object.name}» es de un tipo que la revisión de Rubik no cuenta como obstáculo de puerta (revestimiento de suelo o colgado en pared).` });
    }
    if (contact === null || contact >= 90 - EPS) {
      if (square) out.evidence.door.discrepancy = 'El mueble está dentro del cuadrado conservador de la puerta, pero la hoja no lo alcanza según layout-review. Se conserva como evidencia; no hay contacto de la hoja que despejar.';
      return finish(out, 'no-change-needed', { rationale: 'Según layout-review, la hoja de la puerta no alcanza el mueble al abrir 90°.' });
    }
    out.problem = { code: 'door-leaf-contact', openingId: opening.id, contactDeg: out.evidence.door.reviewLeafContactDeg,
      description: `La hoja de la puerta (${opening.widthMm} mm) alcanza «${out.object.name}» al abrir unos ${Math.round(contact)}° de 90° (layout-review).` };
  } else {
    if (!placementBefore.length) {
      if (reviewBefore.some(f => f.code === 'solape')) {
        return pending('models-disagree', 'FloorPlanPlacement no ve conflicto (tolerancia 1 mm), pero layout-review registra un solape del mueble. Se conserva la discrepancia; no se propone ningún movimiento.');
      }
      return finish(out, 'no-change-needed', { rationale: 'FloorPlanPlacement no encuentra ningún conflicto de colocación del mueble en su estancia.' });
    }
    // F1: classify the conflicts by origin. Accredited (recorded data) vs. derived from an assumed door swing.
    const accredited = placementBefore.filter(p => !isAssumed(p));
    const assumedIds = [...new Set(placementBefore.filter(isAssumed).map(p => p.id))];
    out.problem = { code: 'placement-conflict', problems: placementList(placementBefore, isAssumed),
      ...(assumedIds.length ? { assumedSwingOpeningIds: assumedIds } : {}),
      description: `«${out.object.name}» tiene ${placementBefore.length} conflicto(s) de colocación en su estancia (FloorPlanPlacement)${assumedIds.length ? `, ${placementBefore.length - accredited.length} de ellos con el barrido SUPUESTO de una puerta sin swing` : ''}.` };
    if (assumedIds.length) {
      out.evidence.assumedSwing = { openingIds: assumedIds, model: 'FloorPlanCore.geometry deriva la puerta con una bisagra supuesta (inicio, lado izquierdo) porque el JSON no registra swing; FloorPlanPlacement evita el cuadrado de ese barrido supuesto y layout-review no evalúa la puerta.' };
    }
    if (!accredited.length) {
      if (reviewBefore.some(f => f.code === 'solape')) {
        return pending('models-disagree', 'El único conflicto de FloorPlanPlacement procede del barrido supuesto de una puerta sin swing, y layout-review registra además un solape del mueble que FloorPlanPlacement tolera (1 mm). Se conserva la discrepancia; no se propone ningún movimiento.');
      }
      return pending('conflict-based-on-assumed-swing', `El único motivo para mover «${out.object.name}» es el barrido SUPUESTO de ${assumedIds.length === 1 ? 'la puerta' : 'las puertas'} ${assumedIds.join(', ')}: el JSON no registra bisagra ni sentido de apertura, así que no está confirmado que la hoja abra hacia el mueble. No se inventa el lado ni la bisagra y no se propone ningún movimiento. Registra el swing de la puerta y repite la petición.`);
    }
    if (assumedIds.length) {
      out.uncertainty.push({ code: 'assumed-swing-conflict', openingIds: assumedIds, message: 'Parte del conflicto procede del barrido supuesto de una puerta sin swing. La búsqueda también evita ese cuadrado supuesto, pero apartarse de él no se declara como efecto resuelto: la apertura no está confirmada.' });
    }
  }

  // 6+7. Candidate search and verification. The sequence, prefilter, rounding, tolerance, budget and room are exactly
  //      those of FloorPlanPlacement.find (same generator, FloorPlanPlacement.candidates, and same validity test,
  //      problemsIn with the 1 mm tolerance). Unlike find(), the search does not stop at the first position that
  //      FloorPlanPlacement accepts: every such position is checked on an ephemeral copy against both authorities and,
  //      when rejected, the search goes on with the SAME budget. The first position that passes every gate wins.
  const searchScene = Placement.scene(project, { ignoreIds: [object.id] });
  const room = searchScene.rooms.find(r => r.id === roomId);
  const xs = room.poly.map(p => p.x), ys = room.poly.map(p => p.y);
  const maxRadius = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const fp0 = T.footprint({ ...object, position: { x: 0, y: 0 } });
  const hx = Math.max(...fp0.map(p => Math.abs(p.x))), hy = Math.max(...fp0.map(p => Math.abs(p.y)));
  const tol = Placement.TOLERANCE_MM;
  // The prefilter of find(): a centre can only be valid when the footprint's bounding box fits the room's; such
  // centres are not counted against the budget (find() does not count them either).
  const fits = c => c.x - hx >= Math.min(...xs) - tol && c.x + hx <= Math.max(...xs) + tol && c.y - hy >= Math.min(...ys) - tol && c.y + hy <= Math.max(...ys) + tol;
  const beforeKeys = new Set(reviewBefore.map(key));

  // Every gate for one position that FloorPlanPlacement already accepts. Nothing is kept from the copy.
  const verify = position => {
    const moved = { ...object, position };
    const copy = C.clone(project);
    copy.objects = copy.objects.map(o => (o.id === object.id ? { ...o, position: { ...position } } : o));
    C.validate(copy);
    const placementAfter = Placement.problems(copy, moved);
    const reviewAll = Review.review(copy);
    const reviewAfter = reviewFindingsFor(reviewAll, object.id);
    const v = { moved, placementAfter, reviewAll, reviewAfter, contactAfter: null };
    if (door) {
      const contactAfter = Review.leafContact(door, T.footprint(moved));
      v.contactAfter = contactAfter === null ? null : Math.round(contactAfter * 10) / 10;
      if (!((contactAfter === null || contactAfter >= 90 - EPS) && !placementAfter.some(p => p.kind === 'door' && p.id === door.id))) {
        return { ...v, ok: false, code: 'goal-not-confirmed', why: 'La hoja de la puerta sigue alcanzando el mueble en la candidata según layout-review.' };
      }
    } else {
      const stillOverlap = reviewAfter.some(f => f.code === 'solape');
      if (placementAfter.length || stillOverlap) {
        return { ...v, ok: false, code: 'goal-not-confirmed', why: stillOverlap
          ? 'FloorPlanPlacement acepta la candidata (tolerancia 1 mm), pero layout-review sigue registrando un solape del mueble.'
          : 'FloorPlanPlacement vuelve a encontrar conflictos en la candidata.' };
      }
    }
    const introduced = reviewAfter.filter(f => !beforeKeys.has(key(f)));
    if (introduced.length) return { ...v, ok: false, code: 'candidate-introduces-issues', why: 'La candidata resuelve el objetivo, pero layout-review registra hallazgos nuevos del mueble en esa posición.', introduced };
    return { ...v, ok: true };
  };

  const blockers = {};
  const rejected = [];
  const rejectedByCode = {};
  let tried = 0, rejectedCount = 0, firstRejected = null, accepted = null, gridExhausted = true, verificationLimitReached = false;
  for (const c of Placement.candidates({ x: Math.round(object.position.x), y: Math.round(object.position.y) }, args.stepMm, maxRadius)) {
    if (!fits(c)) continue;
    if (tried >= args.maxCandidates) { gridExhausted = false; break; }
    tried++;
    const position = { x: Math.round(c.x), y: Math.round(c.y) };
    const list = Placement.problemsIn(searchScene, { ...object, position }, roomId, tol, true);
    if (list.length) { for (const p of list) blockers[p.kind] = (blockers[p.kind] || 0) + 1; continue; }
    if (rejectedCount >= LIMITS.verifications) { verificationLimitReached = true; tried--; gridExhausted = false; break; }
    const v = verify(position);
    if (v.ok) { accepted = { ...v, index: tried }; break; }
    rejectedCount++;
    rejectedByCode[v.code] = (rejectedByCode[v.code] || 0) + 1;
    const entry = { index: tried, position, distanceMm: Math.round(Math.hypot(position.x - object.position.x, position.y - object.position.y)),
      code: v.code, reviewFindings: v.reviewAfter.map(f => `${f.code}${f.measurementMm !== undefined ? ` ${f.measurementMm} mm` : ''}${f.measurementDeg !== undefined ? ` ${f.measurementDeg}°` : ''}`).slice(0, 5) };
    if (rejected.length < LIMITS.rejectedLog) rejected.push(entry);
    if (!firstRejected) firstRejected = { ...v, entry };
  }
  // The budget is spent only when the loop stopped on it; a grid with exactly maxCandidates admissible positions that
  // were all examined is reported as an exhausted grid.
  const budgetExhausted = !accepted && !gridExhausted && !verificationLimitReached;
  out.search = {
    generator: 'FloorPlanPlacement.candidates + FloorPlanPlacement.problemsIn (mismo orden, prefiltro, redondeo, tolerancia y presupuesto que FloorPlanPlacement.find)',
    order: `anillos de ${args.stepMm} mm alrededor de la posición actual; dentro de cada anillo, por distancia y ángulo`,
    stepMm: args.stepMm, maxCandidates: args.maxCandidates, toleranceMm: tol,
    tried, budgetExhausted,
    verificationLimit: LIMITS.verifications, verificationLimitReached,
    placementValidRejected: rejectedCount,
    ...(rejectedCount ? { rejectedByCode, rejected, ...(rejectedCount > rejected.length ? { rejectedTruncated: rejectedCount - rejected.length } : {}) } : {}),
    ...(accepted ? { acceptedIndex: accepted.index } : {}),
    checks: [...Placement.CHECKED.filter(c => c !== 'la escalera y su hueco')],
    gates: ['FloorPlanPlacement.problemsIn (tolerancia 1 mm)', 'objetivo', 'FloorPlanPlacement.problems + layout-review sobre una copia efímera', 'sin hallazgos nuevos del mueble'],
  };
  out.uncertainty.push({ code: 'grid-search', message: `La candidata es la primera posición de una cuadrícula de ${args.stepMm} mm que supera todas las comprobaciones, en el orden determinista de FloorPlanPlacement. No es óptima ni se exploran posiciones intermedias.` });

  if (!accepted) {
    if (firstRejected) {
      // Some positions passed FloorPlanPlacement but none passed every gate. Keep the first rejection as evidence.
      const v = firstRejected;
      const r = v.reviewAll;
      if (r.checks.puertas?.status !== 'checked') out.uncertainty.push({ code: 'review-doors-partial', message: r.checks.puertas.reason || 'Algunas puertas no se han podido revisar.' });
      const reach = verificationLimitReached
        ? `Se alcanzó el límite de ${LIMITS.verifications} verificaciones completas con layout-review (${tried} posiciones examinadas, presupuesto de ${args.maxCandidates})`
        : budgetExhausted
          ? `Se agotó el presupuesto de ${args.maxCandidates} posiciones`
          : `Se recorrió toda la cuadrícula de ${args.stepMm} mm (${tried} posiciones)`;
      return pending(v.code, `${v.why} ${reach}: ${rejectedCount} posición(es) aceptada(s) por FloorPlanPlacement y rechazada(s) por las demás comprobaciones; ninguna supera todas. No demuestra que no exista sitio.`, {
        evidence: {
          ...out.evidence,
          after: { placementModel: placementList(v.placementAfter, isAssumed), reviewModel: v.reviewAfter },
          rejectedCandidate: pose(v.moved, roomId),
          ...(v.introduced ? { introduced: v.introduced } : {}),
          ...(door ? { door: { ...out.evidence.door, reviewLeafContactDegAfter: v.contactAfter } } : {}),
        },
      });
    }
    out.evidence.searchBlockers = blockers;
    return pending(budgetExhausted ? 'search-budget-exhausted' : 'search-grid-exhausted', budgetExhausted
      ? `No se ha encontrado una posición válida en ${tried} candidatas (presupuesto agotado). No demuestra que no exista sitio.`
      : `Ninguna posición de la cuadrícula de ${args.stepMm} mm en la estancia es válida (${tried} probadas). No demuestra que no exista sitio entre los puntos de la cuadrícula.`);
  }

  const { moved, placementAfter, reviewAll, reviewAfter } = accepted;
  out.evidence.after = { placementModel: placementList(placementAfter, isAssumed), reviewModel: reviewAfter };
  if (door) out.evidence.door.reviewLeafContactDegAfter = accepted.contactAfter;
  if (firstRejected) out.evidence.rejectedBefore = { count: rejectedCount, first: firstRejected.entry };
  const others = reviewAll.findings.filter(f => !f.objects.includes(object.id));
  out.remainingIssues = others.slice(0, 20).map(f => ({ code: f.code, objects: [...f.objects], message: f.message }));
  if (others.length > 20) out.remainingIssues.push({ code: 'truncated', message: `${others.length - 20} hallazgos más de otros elementos.` });
  if (reviewAll.checks.puertas?.status !== 'checked') out.uncertainty.push({ code: 'review-doors-partial', message: reviewAll.checks.puertas.reason || 'Algunas puertas no se han podido revisar.' });

  const distanceMm = Math.round(Math.hypot(moved.position.x - object.position.x, moved.position.y - object.position.y));
  out.suggestedPose = pose(moved, roomId);
  out.distanceMm = distanceMm;
  out.rationale = `Primera posición, en el orden determinista de FloorPlanPlacement (${tried} posición(es) examinadas${rejectedCount ? `, ${rejectedCount} aceptada(s) por FloorPlanPlacement pero rechazada(s) por layout-review u otra comprobación` : ''}), que supera todas las comprobaciones: a ${distanceMm} mm de la actual, dentro de «${room.name}». Comprobada con FloorPlanPlacement y layout-review sobre una copia efímera en memoria. No es necesariamente la mejor.`;
  out.expectedEffects = [
    { code: 'moves-position-only', message: `Solo cambia la posición de «${out.object.name}»: de (${object.position.x}, ${object.position.y}) a (${moved.position.x}, ${moved.position.y}) mm. ID, tamaño, giro y estancia se conservan.` },
    ...(door ? [{ code: 'door-leaf-clear', openingId: door.id, message: 'Según layout-review, la hoja de la puerta deja de alcanzar el mueble al abrir 90°.' }] : []),
    // A conflict with an ASSUMED door swing is never reported as resolved: it stays in `uncertainty`.
    ...placementBefore.filter(p => !isAssumed(p)).map(p => ({ code: `resolves-${p.kind}`, ...(p.id ? { id: p.id } : {}), message: `Resuelve en el modelo de colocación: ${p.detail}` })),
    ...reviewBefore.filter(f => !reviewAfter.some(g => key(g) === key(f))).map(f => ({ code: `review-clears-${f.code}`, objects: f.objects, message: `Deja de aparecer en layout-review: ${f.message}` })),
  ];
  return finish(out, 'candidate-reviewable');
}

module.exports = { PROPOSAL_VERSION, GOALS, LIMITS, NOT_EVALUATED, normalize, propose };
