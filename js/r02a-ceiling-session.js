/* SCULPT-R02-A normalized · review session around RubikCeilingLayoutEvidence (js/r02a-ceiling-core.js, lab #193 kept
 * verbatim). The core stays the ONE authority for the vertical rule, wall checks, interferences and the three review
 * states; this module only composes it for an interactive review:
 *  - evaluate(): one proposal against the project, the vertical reference and the items already accepted for review,
 *    with Spanish explanations;
 *  - containment: the check the core lists as NOT evaluated (rotated footprint fully inside its room). It can only make
 *    a candidate stricter (blocked: footprint-leaves-room), never looser;
 *  - alternatives(): a bounded grid search inside the room; every candidate is re-proposed through the core and only
 *    'candidate-reviewable' ones are offered, nearest first;
 *  - compare(): before / after of the reviewable set, with the project's own content proven unchanged.
 * It never writes the project and has no apply function. Pure: no DOM, storage, network, clock or randomness.
 * Not MEP, not lighting or HVAC design, not regulatory. NOT loaded by index.html. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && typeof require === 'function';
  const E = node ? require('./r02a-ceiling-core.js') : root.RubikCeilingLayoutEvidence;
  const D = node ? require('./r02a-donor-extracts.js') : root.RubikR02DonorExtracts;
  const LIMITS = Object.freeze({ alternatives: 5, gridPoints: 1600, minStepMm: 50 });
  const TYPE_LABEL = Object.freeze({ ceilinglight: 'Plafón', pendant: 'Lámpara colgante', bathheater: 'Calefactor de baño', curtaintrack: 'Riel de cortina', curtainbox: 'Cajón de cortina', acwall: 'Split de aire (mural alto)' });
  const REASON = {
    'outside-rooms': 'el punto elegido no está dentro de ninguna estancia',
    'footprint-leaves-room': 'parte del elemento queda fuera de la estancia',
    'no-wall-free-position': 'no cabe entre los muros de la estancia',
    'no-integer-pose': 'no hay una posición en milímetros enteros libre de muros',
    'unsupported-wall-orientation': 'hay muros en diagonal: la recolocación automática no se intenta',
    'suggestion-leaves-room': 'la única recolocación posible lo saca de la estancia',
    'exceeds-clear-height': 'descuelgue + altura (+ caída de cortina) superan la altura libre',
    'mount-unknown': 'falta un dato vertical (altura libre, descuelgue o caída de cortina)',
    'moved-without-position': 'recolocación sin posición',
    'invalid-proposal': 'propuesta no válida', 'plan-missing': 'propuesta incompleta'
  };
  function reasonText(r) {
    const [code, id] = r.split(':');
    if (code === 'overlap-3d-with') return `choca en altura con «${id}»`;
    if (code === 'clash-with-floor-object') return `queda por debajo de la parte alta del mueble «${id}»`;
    if (code === 'vertical-overlap-unknown-with') return `se solapa en planta con «${id}» y falta una altura para saber si chocan`;
    if (code === 'floor-object-height-unknown') return `pasa sobre el mueble «${id}», que no tiene altura conocida`;
    if (code === 'proposal-height-unknown' || code === 'reference-unknown') return `pasa sobre «${id}» y falta la altura del elemento o la referencia`;
    return REASON[code] || r;
  }
  // ---- containment (NOT evaluated by the core) ----
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  function properCross(p, q, r, s) { const d1 = cross(p, q, r), d2 = cross(p, q, s), d3 = cross(r, s, p), d4 = cross(r, s, q); return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)); }
  function inPolyClosed(x, y, P) {
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if (cross([a.x, a.y], [b.x, b.y], [x, y]) === 0 && x >= Math.min(a.x, b.x) && x <= Math.max(a.x, b.x) && y >= Math.min(a.y, b.y) && y <= Math.max(a.y, b.y)) return true; }
    let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c; } return c;
  }
  // The rotated footprint (donor footprint, the same the core uses) lies inside the room polygon: every corner inside or
  // on the boundary and no footprint edge properly crosses a room edge (handles L-shaped and concave rooms).
  function contained(item, room) {
    const fp = D.footprint({ cx: item.position.x, cy: item.position.y, w: item.size.widthMm, d: item.size.depthMm, rot: item.rotationDeg || 0 }), P = room.polygon;
    if (!fp.every(([x, y]) => inPolyClosed(x, y, P))) return false;
    for (let i = 0; i < 4; i++) for (let j = 0; j < P.length; j++) if (properCross(fp[i], fp[(i + 1) % 4], [P[j].x, P[j].y], [P[(j + 1) % P.length].x, P[(j + 1) % P.length].y])) return false;
    return true;
  }

  /* One proposal in its context. `accepted` are the requests already kept for review (they take part in the
     interference checks, exactly as the core does for several requests). */
  function evaluate({ project, building = null, levelId = null, ceiling = null, request, accepted = [], options = {} }) {
    const requests = accepted.filter(r => r.id !== request?.id).concat([request]);
    const r = E.propose({ project, building, levelId, ceiling, requests, options });
    if (!r.ok) return { ok: false, error: r.error, explanation: [`Datos no válidos (${r.error.code}${r.error.detail ? ', ' + r.error.detail : ''}).`] };
    const evidence = r.evidence, proposal = evidence.proposals[evidence.proposals.length - 1];
    const diff = E.previewDiff(evidence).find(d => d.id === request.id);
    const room = (building ? building.levels.find(l => l.id === levelId).project : project).rooms.find(x => x.id === proposal.roomId);
    const at = proposal.plan.suggestion?.position || proposal.position;
    const containment = !room ? 'no-room' : contained({ ...proposal, position: at }, room) ? 'inside' : 'leaves-room';
    let state = diff.state, reasons = diff.reasons.slice();
    if (containment === 'leaves-room') { state = 'blocked'; reasons = ['footprint-leaves-room', ...reasons]; }
    const explanation = [];
    if (state === 'candidate-reviewable') explanation.push(diff.relocated ? `Revisable tras recolocarlo a (${at.x}, ${at.y}) para no tocar muros.` : 'Revisable: sin obstáculos conocidos. Necesita revisión humana.');
    else explanation.push((state === 'blocked' ? 'Bloqueado: ' : 'Pendiente de datos: ') + [...new Set(reasons.map(reasonText))].join('; ') + '.');
    if (proposal.mount.status === 'computed') explanation.push(`Cotas desde ${evidence.vertical.reference === 'finished-floor' ? 'suelo acabado' : 'forjado'}: arriba ${proposal.mount.topMm} mm, abajo ${proposal.mount.bottomMm} mm${proposal.kind === 'curtain' ? `, punto más bajo ${proposal.mount.lowestPointMm} mm` : ''}.`);
    for (const c of proposal.floorClearance) if (c.status === 'clear') explanation.push(`Holgura de ${c.clearanceMm} mm sobre «${c.objectId}».`);
    return { ok: true, evidence, proposal, diff, state, reasons, containment, explanation, vertical: evidence.vertical };
  }

  /* Reviewable alternatives for a proposal that is blocked (or to compare options): same item, positions on a grid
     inside the same room, each one re-proposed through the core with the accepted items; nearest first. Bounded. */
  function alternatives(input, { max = 3, stepMm = 100 } = {}) {
    const base = evaluate(input);
    if (!base.ok) return { ok: false, alternatives: [], reason: 'invalid-request' };
    const project = input.building ? input.building.levels.find(l => l.id === input.levelId).project : input.project;
    const q = input.request, rooms = project.rooms.filter(r => Array.isArray(r.polygon));
    const room = rooms.find(r => r.id === base.proposal.roomId) || rooms.find(r => inPolyClosed(q.position.x, q.position.y, r.polygon));
    if (!room) return { ok: true, alternatives: [], reason: 'no-room' };
    if (base.proposal.mount.status === 'computed' && base.proposal.mount.fitsClearHeight === false) return { ok: true, alternatives: [], reason: 'exceeds-clear-height', explanation: 'Moverlo no ayuda: no cabe en altura en ningún sitio de esta estancia.' };
    if (base.state === 'pending') return { ok: true, alternatives: [], reason: 'pending-data', explanation: 'Faltan datos verticales: primero hay que completarlos.' };
    const xs = room.polygon.map(p => p.x), ys = room.polygon.map(p => p.y), w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    const step = Math.max(LIMITS.minStepMm, stepMm, Math.ceil(Math.sqrt((w * h) / LIMITS.gridPoints) / 10) * 10);
    const cands = [];
    for (let x = Math.min(...xs) + step / 2; x < Math.max(...xs); x += step) for (let y = Math.min(...ys) + step / 2; y < Math.max(...ys); y += step) {
      const p = { x: Math.round(x), y: Math.round(y) };
      if (!inPolyClosed(p.x, p.y, room.polygon)) continue;
      cands.push({ p, d: Math.hypot(p.x - q.position.x, p.y - q.position.y) });
    }
    cands.sort((a, b) => a.d - b.d || a.p.x - b.p.x || a.p.y - b.p.y);
    const out = [], max_ = Math.min(max, LIMITS.alternatives); let tried = 0;
    for (const c of cands) {
      if (out.length >= max_) break;
      if (out.some(o => Math.hypot(o.position.x - c.p.x, o.position.y - c.p.y) < Math.max(q.size?.widthMm || 0, q.size?.depthMm || 0, step * 3) * 0.6)) continue;
      tried++;
      const ev = evaluate({ ...input, request: { ...q, position: c.p } });
      if (ev.ok && ev.state === 'candidate-reviewable' && !ev.diff.relocated) out.push({ position: c.p, distanceMm: Math.round(c.d), evaluation: ev });
    }
    return { ok: true, alternatives: out, roomId: room.id, stepMm: step, tried, grid: cands.length };
  }

  /* Before / after of the review set. projectUnchanged is MEASURED: the canonical JSON of the project before and after. */
  function compare({ projectBefore, projectAfter, before = [], after = [] }) {
    const ids = l => new Set(l.map(r => r.id)), b = ids(before), a = ids(after);
    return { added: after.filter(r => !b.has(r.id)).map(r => r.id), removed: before.filter(r => !a.has(r.id)).map(r => r.id), kept: after.filter(r => b.has(r.id)).map(r => r.id),
      projectUnchanged: JSON.stringify(projectBefore) === JSON.stringify(projectAfter), note: 'Propuesta revisable: nada se escribe en el proyecto.' };
  }
  const api = { LIMITS, TYPE_LABEL, CATALOG: E.CATALOG, evaluate, alternatives, compare, contained, reasonText };
  if (node && module.exports) module.exports = api; else root.RubikCeilingSession = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
