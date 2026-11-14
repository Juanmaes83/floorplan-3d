/* UX-12 + UX-13 · Amueblamiento inteligente V1: panel «Amueblar esta estancia» en el panel de la estancia del editor.
 *
 * Flujo: elegir uso real, densidad, receta y semilla → Generar propuesta (no toca el proyecto) → revisar cifras, piezas
 * descartadas y diferencias entre recetas → Ver en 2D (vista previa en #gSel, que las exportaciones ya vacían) o Ver en
 * 3D (cajas translúcidas en una capa propia de la escena) → Aplicar (un solo paso del commit de RUBIK: validación,
 * deshacer y guardado) o Descartar (nada cambia). Los muebles aplicados son objetos normales: se editan uno a uno.
 * `previewMarkup` es puro (también en Node) para poder comparar recetas sin navegador. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const SF = node ? require('./smart-furnishing-core.js') : root.FloorPlanSmartFurnishing;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Vista previa 2D de una propuesta (mm del plano). k = mm por píxel de pantalla.
  function previewMarkup(proposal, k = 1) {
    if (!proposal?.ok) return '';
    let s = `<g class="sf-preview" data-sf-recipe="${esc(proposal.recipe.id)}" data-sf-seed="${proposal.seed}" pointer-events="none" aria-hidden="true">`;
    for (const it of proposal.items) {
      const w = it.size.widthMm, d = it.size.depthMm;
      s += `<g data-sf-item="${esc(it.id)}" data-sf-type="${esc(it.type)}" data-sf-color="${esc(it.color)}" transform="translate(${it.position.x} ${it.position.y}) rotate(${it.rotationDeg})">` +
        `<rect x="${-w / 2}" y="${-d / 2}" width="${w}" height="${d}" fill="${esc(it.color)}" fill-opacity="${it.type === 'rug' ? 0.35 : 0.72}" stroke="#2f5d62" stroke-width="1.5" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>` +
        `<line x1="${-w / 2}" y1="${-d / 2}" x2="${w / 2}" y2="${-d / 2}" stroke="#2f5d62" stroke-width="3" vector-effect="non-scaling-stroke"/>` +
        (it.type === 'rug' ? '' : `<text y="${4 * k}" font-size="${11 * k}" text-anchor="middle" fill="#1f2326" stroke="#fff" stroke-width="${3 * k}" paint-order="stroke" transform="rotate(${-it.rotationDeg})">${esc(it.name)}</text>`) + '</g>';
    }
    return s + '</g>';
  }
  // Diferencias entre dos propuestas de la misma estancia (pieza a pieza por papel): lo que el panel enseña al cambiar receta.
  function differences(a, b) {
    if (!a?.ok || !b?.ok) return [];
    const out = [], byRole = p => { const m = new Map(); for (const it of p.items) { const k = it.role; m.set(k, [...(m.get(k) || []), it]); } return m; }, A = byRole(a), B = byRole(b);
    for (const role of new Set([...A.keys(), ...B.keys()])) {
      const x = A.get(role)?.[0], y = B.get(role)?.[0];
      if (!x && y) out.push(`+ ${y.name}`); else if (x && !y) out.push(`− ${x.name}`);
      else if (x.variant !== y.variant || x.size.widthMm !== y.size.widthMm) out.push(`${x.name} ${x.size.widthMm}×${x.size.depthMm} → ${y.name} ${y.size.widthMm}×${y.size.depthMm}`);
      else if (x.color !== y.color) out.push(`${y.name}: color ${x.color} → ${y.color}`);
    }
    return out;
  }
  if (node) { module.exports = { previewMarkup, differences }; return; }

  const doc = root.document;
  const st = { roomId: null, use: '', density: 'medium', recipeId: 'nordico', seed: 1, proposal: null, previous: null, diff: [], ack: false, result: null, applied: null };
  const trace = [];
  const log = (type, detail = {}) => { trace.push({ type, at: Math.round(performance.now()), ...detail }); doc.dispatchEvent(new CustomEvent('smart-furnishing', { detail: { type, ...detail } })); };
  const app = () => root.FloorPlanApp;
  const zones = () => root.FloorPlanBuildingUI?.stairZoneList?.() || [];
  const label = r => typeof roomDisplay === 'function' ? roomDisplay(r) : r?.name || '';
  const fmtArea = v => String(v).replace('.', ',');

  // Estilos propios (no se toca la hoja del editor).
  const css = doc.createElement('style');
  css.textContent = `.sf-panel .sf-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}
.sf-panel fieldset{border:0;padding:0;margin:6px 0;display:flex;gap:6px;flex-wrap:wrap}.sf-panel legend{font-size:12px;color:var(--muted,#6b6257);margin-bottom:4px;width:100%}
.sf-panel label.sf-seg{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--line,#d8d2c8);border-radius:8px;padding:6px 10px;min-height:36px;cursor:pointer;font-size:13px}
.sf-panel label.sf-seg:has(input:checked){border-color:#2f5d62;background:#e6f0ef;font-weight:600}
.sf-panel select,.sf-panel input[type=number]{min-height:36px;font:inherit;font-size:13px;max-width:100%}
.sf-panel ol,.sf-panel ul{margin:6px 0;padding-left:20px;font-size:12px}.sf-panel li{margin:3px 0;overflow-wrap:anywhere}
.sf-panel .sf-sw{display:inline-block;width:12px;height:12px;border-radius:3px;border:1px solid #0003;vertical-align:-2px;margin-right:4px}
.sf-panel .sf-note{font-size:12px;color:var(--muted,#6b6257);margin:6px 0}.sf-panel .sf-warn{font-size:12px;color:#8a4b14;background:#fff4e5;border-radius:6px;padding:6px 8px;margin:6px 0}
.sf-panel .sf-err{font-size:13px;color:#8f2d1f;background:#fdecea;border-radius:6px;padding:8px;margin:6px 0}
.sf-panel .sf-ok{font-size:13px;color:#1f5a3a;background:#e8f4ec;border-radius:6px;padding:8px;margin:6px 0}
.sf-panel .sf-actions{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.sf-panel .sf-actions .btn{min-height:40px}
.sf-panel details.sf-more summary{font-size:12px;cursor:pointer}`;
  doc.head.append(css);

  function proposalFor(roomId) { return st.proposal && st.proposal.roomId === roomId ? st.proposal : null; }
  function generate(reason) {
    const project = app().project, room = project.rooms.find(r => r.id === st.roomId);
    const prev = proposalFor(st.roomId);
    const r = SF.generate(project, { roomId: st.roomId, roomLabel: label(room), use: st.use || undefined, density: st.density, recipeId: st.recipeId, seed: st.seed, zones: zones() });
    st.result = r; st.ack = false; st.applied = null;
    st.diff = prev && r.ok && prev.recipe.id !== r.recipe.id ? differences(prev, r) : [];
    st.previous = prev && r.ok && prev.recipe.id !== r.recipe.id ? prev.recipe.label : null;
    st.proposal = r.ok ? r : null;
    log('generate', { reason, status: r.status, recipe: r.recipeId, seed: r.seed, density: r.density, items: r.items.length, revision: r.revision });
    refresh();
  }
  // La capa 3D se actualiza aquí también: con la vista 3D inactiva, View3D.sync no la toca y quedarían cajas viejas.
  function refresh() { rerenderPanel(); if (typeof renderSel === 'function') renderSel(); update3D(); root.View3D?.sync?.(); }
  function rerenderPanel() { const sec = doc.getElementById('sfPanel'); if (!sec) return; const host = sec.closest('#panel') || sec.parentElement; const open = sec.open; sec.remove(); roomPanel(host, st.roomId, open); }

  function itemsList(p) {
    return `<ol id="sfItems">${p.items.map(it => `<li data-sf-item="${esc(it.id)}"><span class="sf-sw" style="background:${esc(it.color)}"></span><b>${esc(it.name)}</b> · ${it.size.widthMm} × ${it.size.depthMm} mm · centro (${it.position.x}, ${it.position.y}) · ${it.rotationDeg}°<br><small>${esc(it.rule)}</small></li>`).join('')}</ol>`;
  }
  function resultMarkup() {
    const r = st.result, applied = st.applied;
    if (applied) return `<div class="sf-ok" id="sfApplied" role="status">Aplicado: ${applied.count} mueble${applied.count === 1 ? '' : 's'} en un solo paso. Cada uno se edita, mueve o borra como cualquier otro mueble.</div>
      <div class="sf-actions"><button class="btn" type="button" id="sfUndo">Deshacer amueblamiento</button><button class="btn" type="button" id="sfView3DApplied">Ver en 3D</button></div>`;
    if (!r) return '';
    if (!r.ok) return `<div class="sf-err" id="sfError" role="alert" data-sf-status="${esc(r.status)}">${esc(r.message)}</div>`;
    const p = r;
    return `<div id="sfProposal" data-sf-status="proposal" data-sf-recipe="${esc(p.recipe.id)}" data-sf-seed="${p.seed}" data-sf-count="${p.items.length}">
      <p class="sf-note"><b>Propuesta</b> · ${esc(p.useLabel)} · ${esc(p.recipe.label)} · densidad ${esc(p.densityLabel.toLowerCase())} · semilla ${p.seed} · ${p.items.length} mueble${p.items.length === 1 ? '' : 's'}${p.alternatives > 1 ? ` · ${p.alternatives} distribuciones igual de buenas` : ''}</p>
      ${st.diff.length ? `<div class="sf-note" id="sfDiff"><b>Cambios respecto a «${esc(st.previous)}»:</b><ul>${st.diff.map(d => `<li>${esc(d)}</li>`).join('')}</ul></div>` : ''}
      ${itemsList(p)}
      ${p.kept.length ? `<p class="sf-note" id="sfKept">Se respetan ${p.kept.length} mueble${p.kept.length === 1 ? '' : 's'} que ya están en la estancia: no se mueven ni se sustituyen.</p>` : ''}
      ${p.discarded.length ? `<div class="sf-note" id="sfDiscarded"><b>No se proponen:</b><ul>${p.discarded.map(d => `<li>${esc(d.name)}: ${esc(d.reason)}</li>`).join('')}</ul></div>` : ''}
      <details class="sf-more"><summary>Receta «${esc(p.recipe.label)}»: qué aplica y qué no</summary><p class="sf-note">${esc(p.recipe.summary)}</p>
        <p class="sf-note">Coherencia: ${p.recipe.coherence.map(esc).join(' · ')}.</p><p class="sf-note">Paleta: ${Object.entries(p.recipe.palette).map(([k, v]) => `<span class="sf-sw" style="background:${esc(v)}" title="${esc(k)}"></span>`).join('')}</p>
        <ul>${p.recipe.notApplied.map(t => `<li>${esc(t)}</li>`).join('')}${p.recipe.notes.map(t => `<li>${esc(t)}</li>`).join('')}</ul></details>
      <details class="sf-more"><summary>Qué se comprueba y qué no</summary><p class="sf-note">Se comprueba: ${p.checked.map(esc).join(', ')}.</p><p class="sf-note">No se comprueba: ${p.notChecked.map(esc).join(', ')}.</p></details>
      <p class="sf-warn">${esc(p.disclaimer)}</p>
      ${p.scaleWarning ? `<p class="sf-warn">${esc(p.scaleWarning)}</p><label class="sf-row"><input type="checkbox" id="sfAck" ${st.ack ? 'checked' : ''}> Entiendo que las medidas son orientativas</label>` : ''}
      <div class="sf-actions"><button class="btn" type="button" id="sfView2D">Ver en 2D</button><button class="btn" type="button" id="sfView3D">Ver en 3D</button><button class="btn" type="button" id="sfAnother">Cambiar propuesta</button></div>
      <div class="sf-actions"><button class="btn primary" type="button" id="sfApply" ${p.scaleWarning && !st.ack ? 'disabled' : ''}>Aplicar</button><button class="btn" type="button" id="sfDiscard">Descartar</button></div>
      <p class="sf-err" id="sfApplyError" role="alert" hidden></p></div>`;
  }

  function roomPanel(host, roomId, keepOpen) {
    if (!host) return;
    const project = app().project, room = project.rooms.find(r => r.id === roomId); if (!room) return;
    if (st.roomId !== roomId) { Object.assign(st, { roomId, proposal: null, result: null, previous: null, diff: [], ack: false, applied: null, use: { living: 'living', bedroom: 'bedroom', dining: 'dining', office: 'office' }[room.family] || '' }); }
    const family = room.family && room.family !== 'unspecified', g = app().geometry?.rooms?.find(r => r.id === roomId);
    const area = g ? Math.abs(g.poly.reduce((s, p, i) => { const q = g.poly[(i + 1) % g.poly.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2e6) : 0;
    const sec = doc.createElement('details'); sec.className = 'panel-group sf-panel'; sec.id = 'sfPanel'; sec.dataset.group = 'room-furnish'; sec.dataset.roomId = roomId;
    sec.open = keepOpen ?? !!(st.result || st.applied);
    const uses = Object.entries(SF.USES).map(([k, u]) => `<option value="${k}" ${st.use === k ? 'selected' : ''}>${esc(u.label)}</option>`).join('');
    const html = `<summary id="sfSummary">Amueblar esta estancia</summary>
      <p class="sf-note">Estancia: <b>${esc(label(room))}</b> · ${fmtArea(area.toFixed(1))} m²</p>
      <label class="sf-row" for="sfUse">Uso real declarado</label><select id="sfUse"><option value="" ${st.use ? '' : 'selected'}>Elige el uso…</option>${uses}</select>
      <p class="sf-note">${family ? 'Tomado del tipo de la estancia; puedes cambiarlo para esta propuesta.' : 'La estancia no tiene tipo declarado: elige su uso real (no se cambia el tipo de la estancia).'}</p>
      <fieldset id="sfDensity"><legend>Densidad</legend>${SF.DENSITIES.map(d => `<label class="sf-seg"><input type="radio" name="sfDensity" value="${d}" ${st.density === d ? 'checked' : ''}>${SF.DENSITY_LABEL[d]}</label>`).join('')}</fieldset>
      <label class="sf-row" for="sfRecipe">Receta de estilo</label><select id="sfRecipe">${Object.values(SF.RECIPES).map(r => `<option value="${r.id}" ${st.recipeId === r.id ? 'selected' : ''}>${esc(r.label)}</option>`).join('')}</select>
      <p class="sf-note" id="sfRecipeSummary">${esc(SF.RECIPES[st.recipeId].summary)}</p>
      <div class="sf-row"><label for="sfSeed">Semilla</label><input type="number" id="sfSeed" min="1" max="999999" step="1" value="${st.seed}" inputmode="numeric" style="width:96px"><span class="sf-note">Misma semilla y mismo plano: misma propuesta.</span></div>
      <div class="sf-actions"><button class="btn primary" type="button" id="sfGenerate">Generar propuesta</button></div>
      <div id="sfResult" aria-live="polite">${resultMarkup()}</div>`;
    if (root.SafeDOM) root.SafeDOM.markup(sec, html); else sec.innerHTML = html;
    const body = host.querySelector('.panel-body') || host; body.prepend(sec);
    bind(sec);
  }

  function bind(sec) {
    const $ = s => sec.querySelector(s);
    const regenerateIfShown = reason => { if (st.result) generate(reason); else refresh(); };
    $('#sfUse').onchange = e => { st.use = e.target.value; regenerateIfShown('use'); };
    sec.querySelectorAll('input[name=sfDensity]').forEach(i => i.onchange = e => { st.density = e.target.value; regenerateIfShown('density'); });
    $('#sfRecipe').onchange = e => { st.recipeId = e.target.value; regenerateIfShown('recipe'); };
    $('#sfSeed').onchange = e => { const v = Math.round(Number(e.target.value)); st.seed = Number.isSafeInteger(v) && v >= 1 ? v : 1; regenerateIfShown('seed'); };
    $('#sfGenerate').onclick = () => generate('button');
    const a = id => sec.querySelector('#' + id);
    if (a('sfAck')) a('sfAck').onchange = e => { st.ack = e.target.checked; a('sfApply').disabled = !st.ack; };
    if (a('sfAnother')) a('sfAnother').onclick = () => { st.seed += 1; generate('another'); };
    if (a('sfDiscard')) a('sfDiscard').onclick = () => { st.proposal = null; st.result = null; st.diff = []; log('discard'); refresh(); };
    if (a('sfView2D')) a('sfView2D').onclick = () => view2D();
    if (a('sfView3D')) a('sfView3D').onclick = () => view3D();
    if (a('sfView3DApplied')) a('sfView3DApplied').onclick = () => view3D();
    if (a('sfApply')) a('sfApply').onclick = () => applyNow();
    if (a('sfUndo')) a('sfUndo').onclick = () => { log('undo'); st.applied = null; if (typeof undo === 'function') undo(); };
  }

  async function view2D() {
    log('view2d');
    if (typeof is3D === 'function' && is3D() && typeof setView === 'function') await setView('2d');
    const g = app().geometry?.rooms?.find(r => r.id === st.roomId), svgEl = doc.getElementById('plan');
    if (g && svgEl && typeof view === 'object' && typeof applyView === 'function') {
      const xs = g.poly.map(p => p[0]), ys = g.poly.map(p => p[1]), w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys), r = svgEl.getBoundingClientRect();
      view.s = Math.min(r.width / (w * 1.25), r.height / (h * 1.25)); view.x0 = (Math.min(...xs) + Math.max(...xs)) / 2 - r.width / 2 / view.s; view.y0 = (Math.min(...ys) + Math.max(...ys)) / 2 - r.height / 2 / view.s; applyView();
    }
    // En pantallas estrechas el panel tapa el plano: se cierra para ver la propuesta (se vuelve con «Propiedades»).
    if (typeof narrow === 'function' && narrow() && typeof drawer === 'function') drawer('panel', false);
    if (typeof renderSel === 'function') renderSel();
  }
  async function view3D() {
    log('view3d');
    if (typeof narrow === 'function' && narrow() && typeof drawer === 'function') drawer('panel', false);
    if (typeof setView === 'function') await setView('3d');
    root.View3D?.sync?.();
  }
  function applyNow() {
    const p = st.proposal, err = doc.getElementById('sfApplyError'); if (!p) return;
    const r = app().applyFurnishing(copy => SF.apply(copy, p, { acceptEstimatedScale: st.ack, zones: zones() }));
    const msg = r?.message || r?.explanation?.join(' ') || 'No se ha podido aplicar.';
    if (!r?.ok) { log('apply-refused', { reason: r?.reason, message: msg }); if (err) { err.hidden = false; err.textContent = msg; } return; }
    st.applied = { count: p.items.length, ids: p.items.map(i => i.id) }; st.proposal = null; st.result = null; st.diff = [];
    log('apply', { ids: st.applied.ids, revision: p.revision });
    refresh();
  }

  // 2D: dentro de #gSel, solo mientras la estancia está seleccionada.
  function planMarkup(roomId, k) { const p = proposalFor(roomId); return p ? previewMarkup(p, k) : ''; }

  // 3D: capa propia con cajas translúcidas de la propuesta (no son los muebles: aún no existen en el proyecto).
  let three = null;
  function create3D(THREE) { const group = new THREE.Group(); group.name = 'smart-furnishing-preview'; three = { THREE, group, origin: { x: 0, y: 0 }, key: '' }; return { group }; }
  function update3D(origin) {
    if (!three) return; if (origin) three.origin = { x: origin.x, y: origin.y };
    const p = st.proposal, key = JSON.stringify([p?.revision, p?.recipe?.id, p?.seed, p?.density, p?.use, three.origin]);
    if (key === three.key) return; three.key = key;
    const { THREE, group } = three;
    for (const c of [...group.children]) { group.remove(c); c.geometry?.dispose(); c.material?.dispose(); }
    if (!p) return;
    for (const it of p.items) {
      const h = (it.type === 'rug' ? 15 : it.size.heightMm || 800) / 1000;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(it.size.widthMm / 1000, h, it.size.depthMm / 1000), new THREE.MeshStandardMaterial({ color: it.color, transparent: true, opacity: 0.6, roughness: 0.7 }));
      mesh.position.set((it.position.x - three.origin.x) / 1000, h / 2, (it.position.y - three.origin.y) / 1000); mesh.rotation.y = -it.rotationDeg * Math.PI / 180;
      mesh.userData = { sfItem: it.id, color: it.color }; group.add(mesh);
    }
  }

  root.FloorPlanSmartFurnishingUI = Object.freeze({ roomPanel, planMarkup, create3D, update3D, previewMarkup, differences,
    get state() { return JSON.parse(JSON.stringify({ roomId: st.roomId, use: st.use, density: st.density, recipeId: st.recipeId, seed: st.seed, proposal: st.proposal, applied: st.applied, status: st.result?.status || null })); },
    get trace() { return trace.slice(); }, get meshes() { return three ? three.group.children.slice() : []; } });
})(typeof globalThis !== 'undefined' ? globalThis : this);
