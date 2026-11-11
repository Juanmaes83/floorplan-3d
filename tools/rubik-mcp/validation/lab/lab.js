/* LABORATORIO DE VALIDACIÓN MCP ETAPA 2 — PROPUESTA NO APLICADA. Read-only drawing of one validation scenario:
   the synthetic project (FloorPlanProjectV1), the REAL propose_layout answer recorded over stdio, and the search
   audit. All geometry comes from Rubik's own modules (FloorPlanCore.geometry, FloorPlanTracing.footprint,
   FloorPlanLayoutReview, FloorPlanPlacement) loaded by index.html. Plan millimetres, origin top-left, x right,
   y down, rotation clockwise — the same as the SVG user space, so no axis flip is applied. Nothing is saved:
   the only "moved" piece is drawn from a throwaway copy inside this page. Not part of the product. */
(function () {
  'use strict';
  const C = window.FloorPlanCore, T = window.FloorPlanTracing, R = window.FloorPlanLayoutReview, Pl = window.FloorPlanPlacement;
  const NS = 'http://www.w3.org/2000/svg';
  const params = new URLSearchParams(location.search);
  const id = params.get('s');
  const sc = window.LAB_DATA.scenarios[id];
  const svg = document.getElementById('plan'), panel = document.getElementById('panel');
  if (!sc) { panel.textContent = 'Escenario desconocido: ' + id; return; }
  const project = sc.project, mcp = sc.mcp, g = C.geometry(project);
  const object = project.objects.find(o => o.id === mcp.objectId) || null;
  const pts = P => P.map(p => Array.isArray(p) ? p.join(',') : `${p.x},${p.y}`).join(' ');
  const el = (tag, attrs, from, parent = svg) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (from) n.dataset.from = from;
    parent.append(n);
    return n;
  };

  // View box: rooms + walls + any candidate, with a margin.
  const all = [...g.rooms.flatMap(r => r.poly.map(([x, y]) => ({ x, y }))), ...g.walls.flatMap(w => w.poly.map(([x, y]) => ({ x, y })))];
  for (const o of project.objects) all.push(...T.footprint(o));
  const cand = mcp.suggestedPose?.position || mcp.evidence?.rejectedCandidate?.position || null;
  if (object && cand) all.push(...T.footprint({ ...object, position: cand }));
  const audit2 = sc.audit?.firstAcceptedByBoth?.position || null;
  if (object && audit2) all.push(...T.footprint({ ...object, position: audit2 }));
  // After the F2 correction: the first position FloorPlanPlacement accepted and layout-review rejected, before the
  // accepted one (evidence.rejectedBefore). Drawn so the search that went on is visible.
  const firstRej = mcp.suggestedPose ? mcp.evidence?.rejectedBefore?.first?.position || null : null;
  if (object && firstRej) all.push(...T.footprint({ ...object, position: firstRej }));
  const sameP = (a, b) => a && b && a.x === b.x && a.y === b.y;
  const minX = Math.min(...all.map(p => p.x)) - 500, maxX = Math.max(...all.map(p => p.x)) + 500;
  const minY = Math.min(...all.map(p => p.y)) - 500, maxY = Math.max(...all.map(p => p.y)) + 500;
  svg.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
  const unit = Math.max(maxX - minX, maxY - minY) / 60;
  const text = (x, y, s, from, color = '#1f2421', size = unit * 0.9) => { const t = el('text', { x, y, fill: color, 'font-size': size, 'font-family': 'system-ui,sans-serif', 'paint-order': 'stroke', stroke: '#fff', 'stroke-width': size / 6 }, from); t.textContent = s; return t; };
  const thin = { 'vector-effect': 'non-scaling-stroke' };

  // Step 1 — the project as stored.
  for (const r of g.rooms) { el('polygon', { points: pts(r.poly), fill: '#ece4d4', stroke: '#b9ab92', 'stroke-width': 1, ...thin }, '1'); const c = r.poly.reduce((a, [x, y]) => ({ x: a.x + x / r.poly.length, y: a.y + y / r.poly.length }), { x: 0, y: 0 }); text(c.x, c.y, r.name, '1', '#8a7d66'); }
  for (const w of g.walls) el('polygon', { points: pts(w.poly), fill: '#2b302c' }, '1');
  for (const d of g.doors) {
    const op = project.openings.find(o => o.id === d.id), L = d.len, [hx, hy] = d.h;
    el('polygon', { points: pts(d.rect.poly), fill: '#fff', stroke: '#2b302c', 'stroke-width': 1, ...thin }, '1');
    const closed = { x: hx + d.c[0] * L, y: hy + d.c[1] * L }, open = { x: hx + d.o[0] * L, y: hy + d.o[1] * L };
    const square = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([u, v]) => ({ x: hx + (d.c[0] * u + d.o[0] * v) * L, y: hy + (d.c[1] * u + d.o[1] * v) * L }));
    if (op.swing) {
      const sweep = (d.c[0] * d.o[1] - d.c[1] * d.o[0]) > 0 ? 1 : 0;
      el('path', { d: `M ${hx} ${hy} L ${closed.x} ${closed.y} A ${L} ${L} 0 0 ${sweep} ${open.x} ${open.y} Z`, fill: 'rgba(36,99,181,.10)', stroke: '#2463b5', 'stroke-width': 1.5, ...thin, id: `leaf-${d.id}` }, '1');
      el('polygon', { points: pts(square), fill: 'none', stroke: '#2463b5', 'stroke-width': 1, 'stroke-dasharray': '3 4', ...thin, id: `square-${d.id}` }, '3');
      text(hx, hy - unit * 0.4, `${d.id} (swing ${op.swing.hinge}/${op.swing.side})`, '1', '#2463b5', unit * 0.7);
    } else {
      // No swing in the JSON: FloorPlanCore.geometry still derives one (hinge start, side left) and FloorPlanPlacement uses it.
      el('polygon', { points: pts(square), fill: 'rgba(217,122,0,.08)', stroke: '#d97a00', 'stroke-width': 1.5, 'stroke-dasharray': '6 4', ...thin, id: `assumed-${d.id}` }, '1');
      text(square[2].x, square[2].y, `${d.id}: SIN swing — cuadrado SUPUESTO por FloorPlanPlacement`, '1', '#b06200', unit * 0.7);
    }
  }
  for (const o of project.objects) {
    if (object && o.id === object.id) continue;
    el('polygon', { points: pts(T.footprint(o)), fill: '#d9dde1', stroke: '#5d625b', 'stroke-width': 1, ...thin }, '1');
    text(o.position.x, o.position.y, o.name || o.id, '1', '#3a3f3b', unit * 0.7);
  }

  // Step 2 — the piece the request is about, at its stored position.
  let currentPoly = null;
  if (object) {
    currentPoly = T.footprint(object);
    el('polygon', { id: 'target-current', points: pts(currentPoly), fill: 'rgba(192,57,43,.18)', stroke: '#c0392b', 'stroke-width': 2.5, ...thin }, '2');
    text(object.position.x, object.position.y, `${object.name || object.id} (${object.position.x}, ${object.position.y})`, '2', '#c0392b');
  }

  // Step 3 — the conflict, as each authority sees it on the stored project.
  const review = R.review(project);
  const mine = object ? review.findings.filter(f => f.objects.includes(object.id)) : [];
  for (const f of mine) {
    if (f.evidence.kind === 'overlap' && f.evidence.polygon?.length >= 3) el('polygon', { points: pts(f.evidence.polygon), fill: 'rgba(192,57,43,.55)', stroke: '#7a1f1f', 'stroke-width': 1, ...thin }, '3');
    if (f.evidence.kind === 'door') { const [a, b] = f.evidence.leaf; el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#7a1f1f', 'stroke-width': 3, ...thin, id: 'leaf-contact' }, '3'); }
  }
  const placementBefore = object ? Pl.problems(project, object) : [];

  // Step 5 — the MCP position (suggested or rejected), the arrow, and the audit's second candidate.
  let candPoly = null;
  if (object && cand) {
    const rejected = !mcp.suggestedPose;
    candPoly = T.footprint({ ...object, position: cand });
    el('polygon', { id: 'target-candidate', points: pts(candPoly), fill: rejected ? 'rgba(217,122,0,.15)' : 'rgba(30,125,79,.18)', stroke: rejected ? '#d97a00' : '#1e7d4f', 'stroke-width': 2.5, 'stroke-dasharray': '8 5', ...thin }, '5');
    const m = el('marker', { id: 'arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, null);
    el('path', { d: 'M0,0 L10,5 L0,10 z', fill: rejected ? '#d97a00' : '#1e7d4f' }, null, m);
    el('line', { x1: object.position.x, y1: object.position.y, x2: cand.x, y2: cand.y, stroke: rejected ? '#d97a00' : '#1e7d4f', 'stroke-width': 2, 'marker-end': 'url(#arrow)', ...thin }, '5');
    text(cand.x, cand.y + unit * 1.2, `${rejected ? 'CANDIDATA RECHAZADA' : 'CANDIDATA MCP'} (${cand.x}, ${cand.y})`, '5', rejected ? '#b06200' : '#1e7d4f');
  }
  if (object && firstRej) {
    el('polygon', { id: 'first-rejected', points: pts(T.footprint({ ...object, position: firstRej })), fill: 'rgba(217,122,0,.12)', stroke: '#d97a00', 'stroke-width': 2, 'stroke-dasharray': '8 5', ...thin }, '5');
    text(firstRej.x, firstRej.y - unit * 0.8, `1.ª RECHAZADA por layout-review, nº ${mcp.evidence.rejectedBefore.first.index} (${firstRej.x}, ${firstRej.y})`, '5', '#b06200', unit * 0.75);
  }
  if (object && audit2 && !sameP(audit2, cand)) {
    el('polygon', { id: 'audit-second', points: pts(T.footprint({ ...object, position: audit2 })), fill: 'none', stroke: '#2463b5', 'stroke-width': 2, 'stroke-dasharray': '2 4', ...thin }, '6');
    text(audit2.x, audit2.y - unit * 0.8, `AUDITORÍA: 1.ª aceptada por ambas (${audit2.x}, ${audit2.y})`, '6', '#2463b5', unit * 0.75);
  }

  // Step 6 — re-check of the MCP position inside the page, on a throwaway copy (never saved).
  let labCheck = null;
  if (object && cand) {
    const copy = C.clone(project);
    const moved = copy.objects.find(o => o.id === object.id); moved.position = { ...cand };
    labCheck = {
      placement: Pl.problems(copy, moved).map(p => p.kind + (p.id ? ' ' + p.id : '')),
      review: R.review(copy).findings.filter(f => f.objects.includes(object.id)).map(f => f.code + (f.measurementMm !== undefined ? ` ${f.measurementMm} mm` : '') + (f.measurementDeg !== undefined ? ` ${f.measurementDeg}°` : '')),
    };
  }

  // Panel.
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const reason = mcp.blockingReasons?.[0];
  const excerpt = { status: mcp.status, goal: mcp.goal, objectId: mcp.objectId, openingId: mcp.openingId, problem: mcp.problem, currentPose: mcp.currentPose && { position: mcp.currentPose.position, rotationDeg: mcp.currentPose.rotationDeg, roomId: mcp.currentPose.roomId }, suggestedPose: mcp.suggestedPose && { position: mcp.suggestedPose.position, rotationDeg: mcp.suggestedPose.rotationDeg }, blockingReasons: mcp.blockingReasons, applied: mcp.applied };
  panel.innerHTML = `
   <h1>${esc(sc.title)}</h1>
   <p class="sub">Escenario sintético <code>${esc(sc.fixture)}</code> · código ${esc((window.LAB_DATA.codeSha || '').slice(0, 12))} · SHA-256 JSON ${esc(sc.integrity.before.sha256.slice(0, 16))}…</p>
   <div class="step" data-from="1">1 · Proyecto inicial (${project.rooms.length} estancia(s), ${project.objects.length} mueble(s), escala ${esc(project.scale.confidence)})</div>
   <div class="step" data-from="2">2 · Mueble: ${object ? esc(`${object.name || object.id} · ${object.id} · (${object.position.x}, ${object.position.y}) · ${object.size.widthMm}×${object.size.depthMm} mm · ${object.rotationDeg}°`) : esc(mcp.objectId) + ' — no es un mueble del JSON'}</div>
   <div data-from="3"><div class="step">3 · Conflicto en el proyecto guardado</div>
     <dl><dt>FloorPlanPlacement</dt><dd>${esc(placementBefore.map(p => p.kind + (p.id ? ' ' + p.id : '') + ((mcp.problem?.assumedSwingOpeningIds || []).includes(p.id) && p.kind === 'door' ? ' (barrido SUPUESTO: puerta sin swing)' : '')).join(', ') || 'sin conflicto')}</dd>
     <dt>layout-review</dt><dd>${esc(mine.map(f => f.code + (f.measurementMm !== undefined ? ` ${f.measurementMm} mm` : '') + (f.measurementDeg !== undefined ? ` ${f.measurementDeg}°` : '')).join(', ') || 'sin hallazgos del mueble')}</dd></dl></div>
   <div data-from="4"><div class="step">4 · Respuesta MCP real (stdio)</div>
     <p><span class="badge s-${esc(mcp.status)}">${esc(mcp.status)}</span> ${reason ? '<code>' + esc(reason.code) + '</code>' : ''}</p>
     <p>${esc(reason ? reason.message : (mcp.rationale || ''))}</p>
     <pre>${esc(JSON.stringify(excerpt, null, 1))}</pre></div>
   <div data-from="5"><div class="step">5 · Posición ${mcp.suggestedPose ? 'sugerida' : cand ? 'candidata RECHAZADA' : 'sugerida: ninguna'}</div>
     <dl><dt>Distancia</dt><dd>${mcp.distanceMm ?? (cand && object ? Math.round(Math.hypot(cand.x - object.position.x, cand.y - object.position.y)) : '—')} mm</dd>
     <dt>Búsqueda</dt><dd>${mcp.search ? esc(`${mcp.search.tried} posiciones, paso ${mcp.search.stepMm} mm, máx. ${mcp.search.maxCandidates}; ${mcp.search.placementValidRejected ?? 0} aceptada(s) por FloorPlanPlacement y rechazada(s) después${mcp.search.acceptedIndex ? `; aceptada la nº ${mcp.search.acceptedIndex}` : ''}${mcp.search.budgetExhausted ? '; presupuesto agotado' : ''}${mcp.search.verificationLimitReached ? `; límite de ${mcp.search.verificationLimit} verificaciones alcanzado` : ''}`) : 'no se buscó'}</dd>
     ${sc.audit ? `<dt>Auditoría independiente</dt><dd>${sc.audit.firstAcceptedByBoth ? esc(`el enumerador encuentra la 1.ª aceptada por ambas autoridades en la nº ${sc.audit.firstAcceptedByBoth.index} (${sc.audit.firstAcceptedByBoth.distanceMm} mm); la 1.ª de find() es la nº ${sc.audit.firstFoundByFind?.index}. ${mcp.suggestedPose ? (sameP(sc.audit.firstAcceptedByBoth.position, mcp.suggestedPose.position) ? 'COINCIDE con la MCP.' : 'NO coincide con la MCP.') : 'Fuera del presupuesto pedido.'}`) : 'ninguna posición aceptada por ambas dentro del límite examinado'}</dd>` : ''}</dl></div>
   <div data-from="6"><div class="step">6 · Verificación</div>
     <dl><dt>MCP después</dt><dd>${esc(mcp.evidence?.after ? `placement: ${mcp.evidence.after.placementModel.map(p => p.kind).join(', ') || 'ok'} · review: ${mcp.evidence.after.reviewModel.map(f => f.code + (f.measurementMm !== undefined ? ' ' + f.measurementMm + ' mm' : '')).join(', ') || 'ok'}` : '—')}</dd>
     <dt>Laboratorio (copia efímera)</dt><dd>${labCheck ? esc(`placement: ${labCheck.placement.join(', ') || 'ok'} · review: ${labCheck.review.join(', ') || 'ok'}`) : '—'}</dd>
     <dt>Incertidumbre</dt><dd>${esc((mcp.uncertainty || []).map(u => u.code).join(', ') || '—')}</dd>
     <dt>No evaluado</dt><dd>${esc((mcp.notEvaluated || []).map(u => u.code).join(', '))}</dd></dl></div>
   <div data-from="7"><div class="applied">applied: ${esc(String(mcp.applied))} — PROPUESTA NO APLICADA</div>
     <dl><dt>JSON antes</dt><dd>${esc(sc.integrity.before.sha256)}</dd><dt>JSON después</dt><dd>${esc(sc.integrity.after.sha256)}</dd><dt>Bytes iguales</dt><dd>${sc.integrity.sameBytes ? 'sí' : 'NO'}</dd></dl></div>
   <div class="legend"><span><i style="border-color:#c0392b"></i>actual</span><span><i style="border-color:#1e7d4f;border-style:dashed"></i>candidata</span><span><i style="border-color:#d97a00;border-style:dashed"></i>rechazada / supuesto</span><span><i style="border-color:#2463b5;border-style:dotted"></i>barrido / auditoría</span></div>`;

  function setStep(n) {
    document.body.dataset.step = String(n);
    for (const node of document.querySelectorAll('[data-from]')) node.style.display = Number(node.dataset.from) <= n ? '' : 'none';
  }
  window.setStep = setStep;
  setStep(Number(params.get('step') || 7));
  const ctm = svg.getScreenCTM();
  window.LAB_RENDERED = {
    id, objectId: mcp.objectId, currentPoly, candPoly, labCheck,
    ctm: ctm && { a: ctm.a, b: ctm.b, c: ctm.c, d: ctm.d },
    targetPoints: document.getElementById('target-current')?.getAttribute('points') || null,
    candidatePoints: document.getElementById('target-candidate')?.getAttribute('points') || null,
  };
})();
