/* R02-A · Techos y elementos altos — conexión con el editor de RUBIK (integración, 13/11/2026). EXPERIMENTAL.
 *
 * NO es un motor nuevo: todo lo que decide sale de los módulos de #203/#217, que se cargan antes que este archivo:
 *   RubikCeilingSession (evaluación y alternativas con el núcleo de #193), RubikCeilingContract (x-r02a-ceiling, candidato)
 *   y RubikCeilingBridge (escrituras dentro del mutate de RUBIK, avisos tras editar, recomprobación al abrir).
 * Este archivo solo pone la interfaz y los puntos de conexión con index.html:
 *   - reconcile(project): lo llama commit() de RUBIK en CADA cambio. Si una estancia ya no existe, retira sus elementos y
 *     su referencia en el MISMO paso del deshacer (bridge.afterRoomsChanged). Devuelve el proyecto nuevo o null.
 *   - roomPanel(container, roomId): sección «Techo y elementos altos» en el panel de la estancia seleccionada.
 *   - render(): capa del plano 2D y avisos (bridge.afterEdit tras cada cambio, bridge.afterLoad al abrir otro proyecto).
 *   - create3D(THREE): grupo de la vista 3D, con los elementos a sus cotas; solo se dibuja lo que tiene referencia.
 * Escribe SIEMPRE con FloorPlanApp.applyCeiling(fn) (snap → cambio → commit → renderAll), así que entra en el deshacer.
 * Nada se guarda sin la confirmación expresa de una persona; nada se mueve ni se borra solo salvo los huérfanos de una
 * estancia eliminada en ese mismo paso. No es MEP, ni iluminación, ni normativa; no comprueba la altura de paso. */
(function (root) {
  'use strict';
  const S = root.RubikCeilingSession, X = root.RubikCeilingContract, B = root.RubikCeilingBridge;
  if (!S || !X || !B) return;
  const doc = root.document, app = () => root.FloorPlanApp;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const markup = (el, html) => (root.SafeDOM ? root.SafeDOM.markup(el, html) : (el.innerHTML = html));
  const LIMITS_ES = Object.freeze([
    'Herramienta experimental de diseño: posición y altura revisables por una persona.',
    'No comprueba la altura de paso para personas: un elemento «revisable» puede quedar a una altura incompatible con la circulación.',
    'No comprueba instalaciones (electricidad, climatización), ni iluminación, ni normativa.',
    'Las medidas de catálogo son genéricas, no de un producto medido.',
    'Antes de ejecutar una obra, valida alturas y anclajes con un profesional.'
  ]);
  const STATE_ES = { 'candidate-reviewable': 'Revisable', pending: 'Pendiente de datos', blocked: 'Bloqueado', orphan: 'Sin estancia', invalid: 'No válido' };
  const REF_ES = { 'finished-floor': 'suelo acabado', 'level-floor': 'forjado' };
  // Estilos propios (así index.html no cambia de CSS). Cajas de 44 px mínimo para el toque.
  if (doc && !doc.getElementById('r02aStyle')) {
    const css = doc.createElement('style'); css.id = 'r02aStyle';
    css.textContent = `.r02a-ceiling{margin-top:12px;border-top:1px solid #d9d3c8;padding-top:8px}.r02a-ceiling summary{min-height:44px;display:flex;align-items:center;gap:6px;cursor:pointer}
.r02a-badge{font-size:11px;background:#fff1d6;color:#7a4a12;border-radius:4px;padding:1px 6px}.r02a-limits{font-size:12px;color:#5b5348;padding-left:18px;margin:4px 0}
.r02a-ceiling{min-width:0;max-width:100%;overflow-wrap:anywhere}
.r02a-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 8px;margin:6px 0}.r02a-form label{display:flex;flex-direction:column;font-size:12px;gap:2px;min-width:0}.r02a-form input,.r02a-form select{min-height:36px;font:inherit;width:100%;min-width:0;box-sizing:border-box}.r02a-form .btn{white-space:normal}
.r02a-form .btn,.r02a-ceiling .btn{min-height:40px}.r02a-form p{grid-column:1/-1;margin:0}.r02a-ceiling h4{margin:10px 0 4px}
.r02a-items{padding-left:18px}.r02a-items li[data-holds=false]{color:#a3261b}.r02a-result{border-left:4px solid #6b655c;padding:6px 8px;margin:6px 0;background:#faf8f4}
.r02a-result[data-state=candidate-reviewable]{border-color:#1f5a7a}.r02a-result[data-state=blocked],.r02a-result[data-state=invalid]{border-color:#a3261b}
.r02a-limit{font-size:12px;font-weight:600;color:#7a4a12}.r02a-confirm{display:flex;gap:8px;align-items:flex-start;margin:6px 0}.r02a-warn{color:#a3261b}
#r02aNotice{position:fixed;left:50%;transform:translateX(-50%);top:calc(var(--shell-header-bottom,58px) + 8px);z-index:60;max-width:min(560px,calc(100vw - 32px));background:#fff;border:1px solid #d9d3c8;border-left:4px solid #1f5a7a;border-radius:6px;padding:8px 10px;box-shadow:0 6px 18px rgba(0,0,0,.12);font-size:13px;display:flex;gap:8px;align-items:flex-start}
#r02aNotice[data-kind=warn]{border-left-color:#b5653a}#r02aNotice[data-kind=error]{border-left-color:#a3261b}#r02aNotice[hidden]{display:none}#r02aNotice button{min-width:32px;min-height:32px;border:0;background:none;font-size:18px;cursor:pointer}`;
    doc.head.append(css);
  }
  const st = { draft: null, result: null, alternatives: null, open: false, placing: false, last: null, notice: null, removed: [], loadedFor: null };

  const project = () => app()?.project;
  const levelWord = () => (app()?.levelContext ? 'esta planta' : 'toda la planta (este proyecto)');
  function labelOf(id) { const p = project(), o = p?.objects?.find(x => x.id === id); return o ? `«${o.name}»` : `«${id}»`; }
  const roomOfId = id => project()?.rooms?.find(r => r.id === id);
  const roomName = id => roomOfId(id)?.name || id;
  function centroid(room) { const P = room.polygon; return { x: Math.round(P.reduce((a, p) => a + p.x, 0) / P.length), y: Math.round(P.reduce((a, p) => a + p.y, 0) / P.length) }; }
  const newId = () => (root.FloorPlanCore?.id ? root.FloorPlanCore.id('cei') : 'cei_' + Math.random().toString(36).slice(2, 12));
  function defaultDraft(roomId) {
    const c = S.CATALOG.pendant, room = roomOfId(roomId);
    return { id: newId(), roomId, type: 'pendant', x: room ? centroid(room).x : 0, y: room ? centroid(room).y : 0, rot: 0, w: c.widthMm, d: c.depthMm, h: c.heightMm, drop: 0, curtain: null, confirmed: false, editing: false };
  }
  function request(d) {
    const cat = S.CATALOG[d.type], int = v => (v === '' || v === null || v === undefined ? NaN : Math.round(Number(v)));
    return { id: d.id, type: d.type, position: { x: int(d.x), y: int(d.y) }, rotationDeg: int(d.rot) || 0, size: { widthMm: int(d.w), depthMm: int(d.d), heightMm: int(d.h) },
      dropMm: int(d.drop), ...(cat.kind === 'curtain' && d.curtain !== null && d.curtain !== '' ? { curtainLengthMm: int(d.curtain) } : {}) };
  }
  // The same two steps the contract uses: find the room under the point, then evaluate with that room's reference.
  function evaluate(p, req) {
    const accepted = X.asRequests(p).filter(r => r.id !== req.id), probe = S.evaluate({ project: p, request: req, accepted, labelOf });
    if (!probe.ok) return probe;
    return S.evaluate({ project: p, ceiling: X.verticalFor(p, probe.proposal.roomId), request: req, accepted, labelOf });
  }

  // ── Escritura: siempre por el commit de RUBIK (un paso del deshacer) ───────────────────────────────────────────────
  // Un aviso informativo («guardado») nunca tapa uno de alerta que el MISMO cambio acaba de producir (render → afterEdit).
  const info = text => { if (!st.notice || st.notice.kind === 'info') st.notice = { kind: 'info', text }; };
  function write(fn) {
    st.notice = null;
    const r = app()?.applyCeiling ? app().applyCeiling(fn) : { ok: false, explanation: ['El editor no expone applyCeiling.'] };
    if (!r.ok) st.notice = { kind: 'error', text: (r.explanation || ['No se ha guardado.']).join(' ') };
    return r;
  }
  function reconcile(p) {
    const r = B.afterRoomsChanged(p);
    if (r.ok && r.removed.length) { st.removed = r.removed; return r.project; }
    return null;
  }

  // ── Panel de la estancia ───────────────────────────────────────────────────────────────────────────────────────
  function refLine(p, roomId) {
    const ext = X.extension(p), own = ext.verticalReferences.find(v => v.scope === 'room' && v.roomId === roomId), lvl = ext.verticalReferences.find(v => v.scope === 'project');
    const show = (v, where) => `<b>${v.clearHeightMm} mm</b> de altura libre desde ${REF_ES[v.reference]} · ${esc(where)} · fuente: ${esc(v.source)}`;
    if (own) return { html: show(own, 'solo esta estancia'), own, lvl };
    if (lvl) return { html: show(lvl, 'de ' + levelWord()), own, lvl };
    return { html: '<b>Desconocida.</b> Sin referencia no se calculan cotas ni se dibuja el techo; nunca se supone (la altura de los muros no se usa como techo).', own, lvl };
  }
  function roomPanel(container, roomId) {
    const p = project(); if (!container || !p || !roomOfId(roomId)) return;
    const ext = X.extension(p);
    if (!st.draft || st.draft.roomId !== roomId) { st.draft = defaultDraft(roomId); st.result = null; st.alternatives = null; }
    const sec = doc.createElement('section');sec.className = 'r02a-ceiling';sec.dataset.roomId = roomId;
    const d = st.draft, cat = S.CATALOG[d.type], ref = refLine(p, roomId);
    let body;
    if (ext.status === 'future' || ext.status === 'invalid') {
      body = `<p class="r02a-warn" role="alert">Los datos de techo de este proyecto ${ext.status === 'future' ? 'son de una versión más reciente de RUBIK' : 'no son válidos'}: se conservan tal cual y no se pueden editar aquí.</p>`;
    } else {
      const rc = X.recheck(p, { labelOf }), mine = rc.items.filter(i => i.roomId === roomId);
      const rows = mine.map(i => `<li data-item="${esc(i.id)}" data-holds="${i.holds}"><b>${esc(S.TYPE_LABEL[i.type] || i.type)}</b> · ${esc(STATE_ES[i.state] || i.state)}
        <br><small>${esc(i.explanation.join(' '))}</small><br><button type="button" class="btn" data-r02a="edit" data-id="${esc(i.id)}">Editar</button> <button type="button" class="btn danger" data-r02a="remove" data-id="${esc(i.id)}">Quitar</button></li>`).join('');
      const res = st.result, alts = st.alternatives;
      body = `
      <h4>Referencia vertical</h4>
      <p class="r02a-ref" data-ref="${ref.own ? 'room' : ref.lvl ? 'project' : 'unknown'}">${ref.html}</p>
      <div class="r02a-form">
        <label>Se aplica a <select data-f="scope"><option value="project">${esc(levelWord())}</option><option value="room">solo esta estancia</option></select></label>
        <label>Altura libre (mm) <input type="number" inputmode="numeric" min="1" step="10" data-f="clear" value="${esc(ref.own?.clearHeightMm ?? ref.lvl?.clearHeightMm ?? '')}"></label>
        <label>Medida desde <select data-f="reference"><option value="finished-floor">el suelo acabado</option><option value="level-floor">el forjado</option></select></label>
        <label>Fuente (obligatoria) <input type="text" maxlength="200" data-f="source" placeholder="p. ej. medición in situ del 12/11"></label>
        <button type="button" class="btn" data-r02a="ref-save">Guardar referencia</button>
        ${ref.own ? '<button type="button" class="btn" data-r02a="ref-clear-room">Quitar la de esta estancia</button>' : ''}
        ${ref.lvl ? `<button type="button" class="btn" data-r02a="ref-clear-level">Quitar la de ${esc(levelWord())}</button>` : ''}
      </div>
      <h4>Elementos en esta estancia (${mine.length})</h4>
      ${mine.length ? `<ul class="r02a-items">${rows}</ul>` : '<p class="muted">Ninguno.</p>'}
      <h4>${d.editing ? 'Modificar elemento' : 'Añadir elemento'}</h4>
      <div class="r02a-form">
        <label>Tipo <select data-f="type">${Object.entries(S.TYPE_LABEL).map(([k, v]) => `<option value="${k}"${k === d.type ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
        <label>X (mm) <input type="number" inputmode="numeric" data-f="x" value="${esc(d.x)}"></label>
        <label>Y (mm) <input type="number" inputmode="numeric" data-f="y" value="${esc(d.y)}"></label>
        <label>Giro (°) <input type="number" inputmode="numeric" step="15" data-f="rot" value="${esc(d.rot)}"></label>
        <label>Ancho (mm) <input type="number" inputmode="numeric" data-f="w" value="${esc(d.w)}"></label>
        <label>Fondo (mm) <input type="number" inputmode="numeric" data-f="d" value="${esc(d.d)}"></label>
        <label>Alto (mm) <input type="number" inputmode="numeric" data-f="h" value="${esc(d.h)}"></label>
        <label>Descuelgue desde el techo (mm) <input type="number" inputmode="numeric" min="0" data-f="drop" value="${esc(d.drop)}"></label>
        ${cat.kind === 'curtain' ? `<label>Caída de la cortina (mm) <input type="number" inputmode="numeric" data-f="curtain" value="${esc(d.curtain ?? '')}"></label>` : ''}
        <p class="muted">Medidas de catálogo genéricas (no de un producto medido): ajústalas a las reales.</p>
        <button type="button" class="btn" data-r02a="place">${st.placing ? 'Toca el plano…' : 'Colocar tocando el plano'}</button>
        <button type="button" class="btn" data-r02a="center">Centro de la estancia</button>
        <button type="button" class="btn" data-r02a="check">Comprobar</button>
      </div>
      ${res ? `<div class="r02a-result" data-state="${esc(res.state || 'invalid')}" role="status"><b>${esc(STATE_ES[res.state] || 'No válido')}</b><br>${esc((res.explanation || []).join(' '))}</div>` : ''}
      ${res && res.ok && res.state !== 'candidate-reviewable' ? '<button type="button" class="btn" data-r02a="alts">Ver alternativas</button>' : ''}
      ${alts ? (alts.alternatives?.length ? `<ol class="r02a-alts">${alts.alternatives.map((a, i) => `<li>(${a.position.x}, ${a.position.y}) a ${a.distanceMm} mm <button type="button" class="btn" data-r02a="use-alt" data-i="${i}">Usar alternativa ${i + 1}</button></li>`).join('')}</ol>` : `<p class="muted">${esc(alts.explanation || 'No hay alternativas revisables en esta estancia.')}</p>`) : ''}
      <p class="r02a-limit">No comprueba la altura de paso para personas, instalaciones ni normativa.</p>
      <label class="r02a-confirm"><input type="checkbox" data-f="confirmed"${d.confirmed ? ' checked' : ''}> He revisado este elemento y quiero guardarlo en el proyecto</label>
      <button type="button" class="btn primary" data-r02a="save"${d.confirmed ? '' : ' disabled'}>${d.editing ? 'Guardar cambios' : 'Guardar en el proyecto'}</button>
      ${d.editing ? '<button type="button" class="btn" data-r02a="new">Nuevo elemento</button>' : ''}`;
    }
    markup(sec, `<details${st.open ? ' open' : ''}><summary><b>Techo y elementos altos</b> <span class="r02a-badge">experimental</span></summary>
      <ul class="r02a-limits">${LIMITS_ES.map(t => `<li>${esc(t)}</li>`).join('')}</ul>${body}</details>`);
    container.append(sec);
    bind(sec, roomId);
  }
  function bind(sec, roomId) {
    sec.querySelector('details').addEventListener('toggle', e => { st.open = e.target.open; });
    const d = st.draft;
    for (const el of sec.querySelectorAll('[data-f]')) {
      const k = el.dataset.f;
      if (['scope', 'clear', 'reference', 'source'].includes(k)) continue;
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => {
        if (k === 'confirmed') { d.confirmed = el.checked; sec.querySelector('[data-r02a="save"]').disabled = !el.checked; return; }
        if (k === 'type') { const c = S.CATALOG[el.value]; Object.assign(d, { type: el.value, w: c.widthMm, d: c.depthMm, h: c.heightMm, drop: el.value === 'acwall' ? 200 : 0, curtain: c.kind === 'curtain' ? 2200 : null }); rerender(); return; }
        d[k] = el.value; d.confirmed = false; st.result = null; st.alternatives = null;
        const save = sec.querySelector('[data-r02a="save"]'), box = sec.querySelector('[data-f="confirmed"]'); if (save) save.disabled = true; if (box) box.checked = false;
      });
    }
    sec.addEventListener('click', e => {
      const b = e.target.closest('[data-r02a]'); if (!b) return;
      const act = b.dataset.r02a, f = k => sec.querySelector(`[data-f="${k}"]`)?.value;
      if (act === 'ref-save') {
        const scope = f('scope'), ref = { scope, ...(scope === 'room' ? { roomId } : {}), clearHeightMm: Math.round(Number(f('clear'))), reference: f('reference'), source: (f('source') || '').trim() };
        if (!ref.source) { st.notice = { kind: 'error', text: 'La referencia vertical necesita su fuente (de dónde sale la medida).' }; return rerender(); }
        if (write(p => B.setReference(p, ref)).ok) info('Referencia vertical guardada. Los elementos guardados se han comprobado de nuevo.');
      } else if (act === 'ref-clear-room' || act === 'ref-clear-level') {
        const scope = act === 'ref-clear-room' ? { scope: 'room', roomId } : { scope: 'project' };
        if (write(p => B.clearReference(p, scope)).ok) info('Referencia retirada. Los elementos que dependían de ella quedan pendientes de datos; no se mueven.');
      } else if (act === 'edit') {
        const it = X.extension(project()).items.find(i => i.id === b.dataset.id); if (!it) return;
        st.draft = { id: it.id, roomId, type: it.type, x: it.position.x, y: it.position.y, rot: it.rotationDeg, w: it.size.widthMm, d: it.size.depthMm, h: it.size.heightMm, drop: it.dropMm, curtain: it.curtainLengthMm, confirmed: false, editing: true };
        st.result = null; st.alternatives = null;
      } else if (act === 'remove') {
        if (write(p => B.remove(p, b.dataset.id)).ok) { info('Elemento quitado. Se puede deshacer.'); if (st.draft?.id === b.dataset.id) st.draft = defaultDraft(roomId); }
      } else if (act === 'new') { st.draft = defaultDraft(roomId); st.result = null; st.alternatives = null;
      } else if (act === 'center') { const c = centroid(roomOfId(roomId)); Object.assign(d, { x: c.x, y: c.y, confirmed: false }); st.result = null;
      } else if (act === 'place') { arm();
      } else if (act === 'check') { st.result = evaluate(project(), request(d)); st.alternatives = null;
      } else if (act === 'alts') {
        const p = project(), req = request(d), probe = S.evaluate({ project: p, request: req, accepted: X.asRequests(p).filter(r => r.id !== req.id) });
        st.alternatives = S.alternatives({ project: p, ceiling: probe.ok ? X.verticalFor(p, probe.proposal.roomId) : null, request: req, accepted: X.asRequests(p).filter(r => r.id !== req.id), labelOf });
      } else if (act === 'use-alt') {
        const a = st.alternatives?.alternatives?.[Number(b.dataset.i)]; if (!a) return;
        Object.assign(d, { x: a.position.x, y: a.position.y, confirmed: false }); st.result = a.evaluation; st.alternatives = null;
      } else if (act === 'save') {
        if (!d.confirmed) return;
        const req = request(d), r = write(p => B.confirm(p, req));
        if (r.ok) { info(`Guardado en el proyecto: ${S.TYPE_LABEL[d.type]}. Se puede deshacer.`); st.draft = defaultDraft(roomId); st.result = null; }
        else st.result = { ok: false, state: 'blocked', explanation: r.explanation };
      }
      rerender();
    });
  }
  function rerender() { const sec = doc.querySelector('section.r02a-ceiling'); if (!sec) return; const roomId = sec.dataset.roomId, host = sec.parentElement; sec.remove(); roomPanel(host, roomId); showNotice(); }

  // ── «Colocar tocando el plano»: un solo toque, convertido a mm con la matriz del SVG ──────────────────────────────
  function arm() {
    const svg = doc.getElementById('plan'); if (!svg) return;
    st.placing = true;
    const swallow = e => { e.stopImmediatePropagation(); e.preventDefault(); };
    const down = e => {
      if (!svg.contains(e.target)) return;
      swallow(e);
      const m = svg.getScreenCTM(); if (!m) return;
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      Object.assign(st.draft, { x: Math.round(pt.x), y: Math.round(pt.y), confirmed: false });
      st.placing = false; st.result = evaluate(project(), request(st.draft)); st.alternatives = null;
      root.removeEventListener('pointerdown', down, true);
      const once = ev => { if (svg.contains(ev.target)) swallow(ev); };
      root.addEventListener('pointerup', once, { capture: true, once: true }); root.addEventListener('click', once, { capture: true, once: true });
      rerender(); render();
    };
    root.addEventListener('pointerdown', down, true);
  }

  // ── Plano 2D y avisos ────────────────────────────────────────────────────────────────────────────────────────────
  function layer() {
    const svg = doc.getElementById('plan'); if (!svg) return null;
    let g = doc.getElementById('gCeiling');
    if (!g) { g = doc.createElementNS('http://www.w3.org/2000/svg', 'g'); g.id = 'gCeiling'; g.setAttribute('pointer-events', 'none'); g.setAttribute('aria-label', 'Elementos de techo (experimental)'); svg.insertBefore(g, doc.getElementById('gSel')); }
    return g;
  }
  function render() {
    const p = project(); if (!p) return;
    const g = layer();
    // Avisos: abrir otro proyecto → recomprobación; cualquier otro cambio → qué deja de cumplir y qué vuelve a cumplir.
    const key = (app()?.entryId || p.id), json = JSON.stringify(p);
    if (st.loadedFor !== key) {
      st.loadedFor = key; st.draft = null; st.result = null; st.alternatives = null;
      const rc = B.afterLoad(p, { labelOf });
      if (rc.status === 'future' || rc.status === 'invalid') st.notice = { kind: 'error', text: `Elementos de techo: datos ${rc.status === 'future' ? 'de una versión más reciente' : 'no válidos'}. Se conservan sin cambios y no se pueden editar.` };
      else if (rc.failing) st.notice = { kind: 'warn', text: `Elementos de techo: ${rc.failing} de ${rc.items.length} ya no cumplen al abrir el proyecto. Revísalos en su estancia.` };
    } else if (st.last && st.last !== json) {
      const r = B.afterEdit(JSON.parse(st.last), p, { labelOf });
      if (r.newlyFailing?.length) st.notice = { kind: 'warn', text: `Tras este cambio, ${r.newlyFailing.map(i => `${S.TYPE_LABEL[i.type]} (${roomName(i.roomId)}): ${i.explanation.join(' ')}`).join(' · ')} No se ha movido nada.` };
      else if (r.recovered?.length) st.notice = { kind: 'info', text: `${r.recovered.length} elemento(s) de techo vuelven a cumplir.` };
    }
    if (st.removed.length) { st.notice = { kind: 'info', text: `Se ha eliminado una estancia: se retiran con ella ${st.removed.length} dato(s) de techo (se recuperan al deshacer).` }; st.removed = []; }
    st.last = json;
    if (g) {
      const rc = X.recheck(p, { labelOf }), byId = new Map(rc.items?.map(i => [i.id, i]) || []);
      const items = X.extension(p).status === 'present' ? X.extension(p).items : [];
      const parts = items.map(it => {
        const s = byId.get(it.id), cls = !s ? 'invalid' : s.holds ? 'holds' : s.state;
        return `<g transform="translate(${it.position.x} ${it.position.y}) rotate(${it.rotationDeg})" data-item="${esc(it.id)}" data-state="${esc(cls)}"><rect x="${-it.size.widthMm / 2}" y="${-it.size.depthMm / 2}" width="${it.size.widthMm}" height="${it.size.depthMm}" fill="${cls === 'holds' ? '#7aa7c7' : cls === 'pending' ? '#b9b3a9' : '#c0392b'}" fill-opacity=".22" stroke="${cls === 'holds' ? '#1f5a7a' : cls === 'pending' ? '#6b655c' : '#a3261b'}" stroke-width="30" stroke-dasharray="90 60"/></g>`;
      });
      if (st.draft && st.draft.roomId && roomOfId(st.draft.roomId) && doc.querySelector('section.r02a-ceiling details[open]')) {
        const d = st.draft, n = v => Number(v) || 0;
        parts.push(`<g transform="translate(${n(d.x)} ${n(d.y)}) rotate(${n(d.rot)})" data-draft="1"><rect x="${-n(d.w) / 2}" y="${-n(d.d) / 2}" width="${n(d.w)}" height="${n(d.d)}" fill="none" stroke="#b5653a" stroke-width="40"/></g>`);
      }
      markup(g, parts.join(''));
    }
    showNotice();
    sync3D();
  }
  function showNotice() {
    let el = doc.getElementById('r02aNotice');
    if (!st.notice) { if (el) el.hidden = true; return; }
    if (!el) { el = doc.createElement('div'); el.id = 'r02aNotice'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); doc.body.append(el); }
    el.dataset.kind = st.notice.kind; el.hidden = false;
    markup(el, `<span>${esc(st.notice.text)}</span> <button type="button" aria-label="Cerrar aviso">×</button>`);
    el.querySelector('button').onclick = () => { st.notice = null; el.hidden = true; };
  }

  // ── Vista 3D ───────────────────────────────────────────────────────────────────────────────────────────────────
  let three = null;
  function create3D(THREE) {
    const group = new THREE.Group(); group.name = 'r02a-ceiling'; group.userData.r02a = true;
    three = { THREE, group, origin: { x: 0, y: 0 }, key: '' };
    return { group };
  }
  function update3D(origin) { if (!three) return; if (origin && (origin.x !== three.origin.x || origin.y !== three.origin.y)) { three.origin = { x: origin.x, y: origin.y }; three.key = ''; } sync3D(); }
  function sync3D(force) {
    const p = project(); if (!three || !p) return;
    const k = JSON.stringify([p.extensions?.[X.KEY] || null, p.rooms, p.objects, three.origin]);
    if (!force && k === three.key) return; three.key = k;
    const { THREE, group, origin } = three;
    for (const c of [...group.children]) { group.remove(c); c.geometry?.dispose(); c.material?.dispose(); }
    if (X.extension(p).status !== 'present') return;
    const wx = x => (x - origin.x) / 1000, wz = y => (y - origin.y) / 1000;
    const rc = X.recheck(p, { labelOf }), byId = new Map(rc.items.map(i => [i.id, i]));
    for (const it of X.extension(p).items) {
      const req = X.asRequests(p).find(r => r.id === it.id), ev = evaluate(p, req);
      if (!ev.ok || ev.proposal.mount.status !== 'computed') continue; // sin referencia: no se dibuja (nunca se supone una altura)
      const m = ev.proposal.mount, holds = byId.get(it.id)?.holds, h = it.size.heightMm / 1000;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(it.size.widthMm / 1000, h, it.size.depthMm / 1000),
        new THREE.MeshStandardMaterial({ color: holds ? (S.CATALOG[it.type].color || '#f0f0f0') : '#c0392b', roughness: .6, transparent: !holds, opacity: holds ? 1 : .75 }));
      mesh.position.set(wx(it.position.x), m.bottomMm / 1000 + h / 2, wz(it.position.y)); mesh.rotation.y = -it.rotationDeg * Math.PI / 180;
      mesh.userData = { r02aItem: it.id, holds: !!holds, topMm: m.topMm, bottomMm: m.bottomMm }; group.add(mesh);
      if (it.curtainLengthMm) {
        const fall = it.curtainLengthMm / 1000, curtain = new THREE.Mesh(new THREE.BoxGeometry(it.size.widthMm / 1000, fall, .02), new THREE.MeshStandardMaterial({ color: '#e9e1d3', transparent: true, opacity: .55 }));
        curtain.position.set(wx(it.position.x), m.bottomMm / 1000 - fall / 2, wz(it.position.y)); curtain.rotation.y = mesh.rotation.y; curtain.userData = { r02aCurtain: it.id }; group.add(curtain);
      }
    }
  }

  root.RubikCeilingEditor = Object.freeze({ reconcile, roomPanel, render, create3D, update3D, LIMITS_ES,
    get state() { return { open: st.open, placing: st.placing, draft: st.draft && { ...st.draft }, result: st.result && { state: st.result.state, explanation: st.result.explanation }, notice: st.notice && { ...st.notice } }; },
    get meshes() { return three ? three.group.children.map(c => ({ ...c.userData, y: c.position.y })) : []; } });
})(typeof globalThis !== 'undefined' ? globalThis : this);
