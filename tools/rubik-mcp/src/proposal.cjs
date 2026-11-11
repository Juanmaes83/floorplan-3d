'use strict';

/* MCP Etapa 2 — propuestas de distribución explicables (docs/technical/local-mcp-stage2-proposals.md).
   Read-only and deterministic. Composes the existing authorities, never a new collision engine:
   - FloorPlanPlacement.find / problemsIn (js/furniture-placement.js): candidate search on a grid of rings around the
     current position; conservative door model (the square swept by the leaf).
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
const placementList = list => list.map(p => ({ kind: p.kind, ...(p.id ? { id: p.id } : {}), detail: p.detail }));

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

  // 5. The problem exists? Never move something that has no problem.
  const placementBefore = Placement.problemsIn(scene, object, roomId);
  const reviewBefore = reviewFindingsFor(Review.review(project), object.id);
  out.evidence.before = { placementModel: placementList(placementBefore), reviewModel: reviewBefore };
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
    out.problem = { code: 'placement-conflict', problems: placementList(placementBefore),
      description: `«${out.object.name}» tiene ${placementBefore.length} conflicto(s) de colocación en su estancia (FloorPlanPlacement).` };
  }

  // 6. Candidate search: the existing deterministic search, bounded.
  const found = Placement.find(project, object, { near: object.position, stepMm: args.stepMm, maxCandidates: args.maxCandidates });
  out.search = {
    generator: 'FloorPlanPlacement.find', order: `anillos de ${args.stepMm} mm alrededor de la posición actual; dentro de cada anillo, por distancia y ángulo`,
    stepMm: args.stepMm, maxCandidates: args.maxCandidates, toleranceMm: Placement.TOLERANCE_MM,
    tried: found.tried ?? 0, budgetExhausted: !found.ok && (found.tried ?? 0) >= args.maxCandidates,
    checks: [...Placement.CHECKED.filter(c => c !== 'la escalera y su hueco')],
  };
  out.uncertainty.push({ code: 'grid-search', message: `La candidata es la primera posición válida de una cuadrícula de ${args.stepMm} mm, la más cercana en esa cuadrícula. No es óptima ni se exploran posiciones intermedias.` });
  if (!found.ok) {
    if (found.reason === 'no-space') {
      out.evidence.searchBlockers = found.blockers;
      return pending(out.search.budgetExhausted ? 'search-budget-exhausted' : 'search-grid-exhausted', out.search.budgetExhausted
        ? `No se ha encontrado una posición válida en ${found.tried} candidatas (presupuesto agotado). No demuestra que no exista sitio.`
        : `Ninguna posición de la cuadrícula de ${args.stepMm} mm en la estancia es válida (${found.tried} probadas). No demuestra que no exista sitio entre los puntos de la cuadrícula.`);
    }
    if (found.reason === 'ambiguous-room') return pending('ambiguous-room', found.message);
    if (found.reason === 'no-room') return block('object-outside-rooms', found.message);
    return block('invalid-object-geometry', found.message);
  }

  // 7. Verify the candidate on an ephemeral copy against both authorities. find() returning ok is not enough.
  const moved = { ...object, position: { x: found.position.x, y: found.position.y } };
  const copy = C.clone(project);
  copy.objects = copy.objects.map(o => (o.id === object.id ? { ...o, position: { ...moved.position } } : o));
  C.validate(copy);
  const placementAfter = Placement.problems(copy, moved);
  const reviewAll = Review.review(copy);
  const reviewAfter = reviewFindingsFor(reviewAll, object.id);
  out.evidence.after = { placementModel: placementList(placementAfter), reviewModel: reviewAfter };
  const candidate = pose(moved, found.roomId);
  let resolved, why;
  if (door) {
    const contactAfter = Review.leafContact(door, T.footprint(moved));
    out.evidence.door.reviewLeafContactDegAfter = contactAfter === null ? null : Math.round(contactAfter * 10) / 10;
    resolved = (contactAfter === null || contactAfter >= 90 - EPS) && !placementAfter.some(p => p.kind === 'door' && p.id === door.id);
    why = 'La hoja de la puerta sigue alcanzando el mueble en la candidata según layout-review.';
  } else {
    const stillOverlap = reviewAfter.some(f => f.code === 'solape');
    resolved = placementAfter.length === 0 && !stillOverlap;
    why = stillOverlap
      ? 'FloorPlanPlacement acepta la candidata (tolerancia 1 mm), pero layout-review sigue registrando un solape del mueble.'
      : 'FloorPlanPlacement vuelve a encontrar conflictos en la candidata.';
  }
  const beforeKeys = new Set(reviewBefore.map(key));
  const introduced = reviewAfter.filter(f => !beforeKeys.has(key(f)));
  const others = reviewAll.findings.filter(f => !f.objects.includes(object.id));
  out.remainingIssues = others.slice(0, 20).map(f => ({ code: f.code, objects: [...f.objects], message: f.message }));
  if (others.length > 20) out.remainingIssues.push({ code: 'truncated', message: `${others.length - 20} hallazgos más de otros elementos.` });
  if (reviewAll.checks.puertas?.status !== 'checked') out.uncertainty.push({ code: 'review-doors-partial', message: reviewAll.checks.puertas.reason || 'Algunas puertas no se han podido revisar.' });

  if (!resolved) {
    return pending('goal-not-confirmed', why, { evidence: { ...out.evidence, rejectedCandidate: candidate } });
  }
  if (introduced.length) {
    return pending('candidate-introduces-issues', 'La candidata resuelve el objetivo, pero layout-review registra hallazgos nuevos del mueble en esa posición.', {
      evidence: { ...out.evidence, rejectedCandidate: candidate, introduced },
    });
  }

  out.suggestedPose = candidate;
  out.distanceMm = found.distanceMm;
  out.rationale = `Primera posición válida del barrido determinista de FloorPlanPlacement (${found.tried} candidata(s) probadas), a ${found.distanceMm} mm de la actual, dentro de «${found.roomName}». Comprobada después con FloorPlanPlacement y layout-review sobre una copia efímera en memoria.`;
  out.expectedEffects = [
    { code: 'moves-position-only', message: `Solo cambia la posición de «${out.object.name}»: de (${object.position.x}, ${object.position.y}) a (${moved.position.x}, ${moved.position.y}) mm. ID, tamaño, giro y estancia se conservan.` },
    ...(door ? [{ code: 'door-leaf-clear', openingId: door.id, message: 'Según layout-review, la hoja de la puerta deja de alcanzar el mueble al abrir 90°.' }] : []),
    ...placementBefore.map(p => ({ code: `resolves-${p.kind}`, ...(p.id ? { id: p.id } : {}), message: `Resuelve en el modelo de colocación: ${p.detail}` })),
    ...reviewBefore.filter(f => !reviewAfter.some(g => key(g) === key(f))).map(f => ({ code: `review-clears-${f.code}`, objects: f.objects, message: `Deja de aparecer en layout-review: ${f.message}` })),
  ];
  return finish(out, 'candidate-reviewable');
}

module.exports = { PROPOSAL_VERSION, GOALS, LIMITS, NOT_EVALUATED, normalize, propose };
