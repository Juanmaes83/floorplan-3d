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
  // Textos visibles en los idiomas de RUBIK (convención de los módulos: tx local que lee el LANG global; sin LANG, español).
  const tx = (es, en, zh) => ({ es, en, zh })[typeof LANG === 'string' ? LANG : 'es'] ?? es;
  const LIMITS_ES = () => [
    tx('Herramienta experimental de diseño: posición y altura revisables por una persona.', 'Experimental design tool: position and height to be reviewed by a person.', '实验性设计工具：位置和高度需人工审核。'),
    tx('No comprueba la altura de paso para personas: un elemento «revisable» puede quedar a una altura incompatible con la circulación.', 'It does not check clear passage height for people: a “reviewable” item may hang at a height incompatible with circulation.', '不检查人员通行净高："可审核"的元素可能处于妨碍通行的高度。'),
    tx('No comprueba instalaciones (electricidad, climatización), ni iluminación, ni normativa.', 'It does not check installations (electrical, HVAC), lighting or regulations.', '不检查设备（电气、空调）、照明或规范。'),
    tx('Las medidas de catálogo son genéricas, no de un producto medido.', 'Catalogue sizes are generic, not from a measured product.', '目录尺寸为通用值，并非实测产品。'),
    tx('Antes de ejecutar una obra, valida alturas y anclajes con un profesional.', 'Before building, validate heights and fixings with a professional.', '施工前请与专业人员核实高度和固定方式。')];
  const STATE_ES = () => ({ 'candidate-reviewable': tx('Revisable', 'Reviewable', '可审核'), pending: tx('Pendiente de datos', 'Missing data', '待补数据'), blocked: tx('Bloqueado', 'Blocked', '已阻止'), orphan: tx('Sin estancia', 'No room', '无房间'), invalid: tx('No válido', 'Invalid', '无效') });
  const REF_ES = () => ({ 'finished-floor': tx('suelo acabado', 'the finished floor', '完成地面'), 'level-floor': tx('forjado', 'the structural floor', '楼板') });
  // Nombres VISIBLES por la fuente única del producto: los datos guardados (p. ej. el ejemplo, en chino) no se muestran en bruto.
  const shown = (n, t) => (root.FloorPlanDisplayName ? root.FloorPlanDisplayName(n, t) : typeof nm === 'function' ? nm(n) : n);
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
  const st = { draft: null, result: null, alternatives: null, open: false, placing: false, last: null, notice: null, removed: [], loadedFor: null, passage: null };

  const project = () => app()?.project;
  const levelWord = () => (app()?.levelContext ? tx('esta planta', 'this level', '本楼层') : tx('toda la planta (este proyecto)', 'the whole level (this project)', '整层（本项目）'));
  function labelOf(id) { const p = project(), o = p?.objects?.find(x => x.id === id); return o ? `«${shown(o.name, o.type)}»` : `«${id}»`; }
  const roomOfId = id => project()?.rooms?.find(r => r.id === id);
  const roomName = id => { const r = roomOfId(id); return r ? shown(r.name) : id; };
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
    const r = app()?.applyCeiling ? app().applyCeiling(fn) : { ok: false, explanation: [tx('El editor no expone applyCeiling.', 'The editor does not expose applyCeiling.', '编辑器未提供 applyCeiling。')] };
    if (!r.ok) st.notice = { kind: 'error', text: (r.explanation || [tx('No se ha guardado.', 'Not saved.', '未保存。')]).join(' ') };
    return r;
  }
  function reconcile(p) {
    const r = B.afterRoomsChanged(p);
    if (r.ok && r.removed.length) { st.removed = r.removed; return r.project; }
    return null;
  }

  // ── Paso libre ORIENTATIVO (experimental, solo información) ─────────────────────────────────────────────────────
  // Un bloque compacto bajo los elementos de la estancia, solo si RubikPassageIndicative está cargado. Se calcula BAJO
  // DEMANDA (botón) con rutas en caché por firma (proyecto, planta y geometría); el resultado solo se muestra mientras la
  // firma de la estancia no cambie. No escribe, no cambia estados, no toca el guardado ni el deshacer, no bloquea nada.
  const PI = () => root.RubikPassageIndicative;
  const lang = () => (typeof LANG === 'string' ? LANG : 'es');
  const levelKey = () => { const c = app()?.levelContext; return c ? [c.buildingId, c.levelId].join('|') : null; };
  const geometryNow = p => app()?.geometry || root.FloorPlanCore?.geometry?.(p);
  function roomRequests(p, roomId) { const ids = new Set(X.recheck(p, { labelOf }).items.filter(i => i.roomId === roomId).map(i => i.id)); return X.asRequests(p).filter(r => ids.has(r.id)); }
  function passageKey(p, roomId) { const I = PI(); return I.signature(p, geometryNow(p), levelKey()) + '|' + JSON.stringify([roomRequests(p, roomId), X.verticalFor(p, roomId)]); }
  function consultPassage(roomId) {
    const I = PI(), p = project(), g = geometryNow(p), plan = root.FloorPlanPresentationRoute?.plan; if (!I || !p || !g) return;
    const routes = plan ? I.routesFor(p, g, plan, levelKey()).routes : [];
    const proposals = roomRequests(p, roomId).map(req => { const e = evaluate(p, req); return e.ok ? e.proposal : { id: req.id }; });
    const out = I.indicate({ proposals, routes, rooms: (g.rooms || []).filter(r => r.poly?.length >= 3).map(r => ({ id: r.id, poly: r.poly })) });
    st.passage = { roomId, key: passageKey(p, roomId), result: out };
  }
  function passageBlock(p, roomId, mine) {
    const I = PI(); if (!I || !mine.length) return '';
    const t = I.text(lang()), r = st.passage && st.passage.roomId === roomId ? st.passage : null, fresh = r && r.key === passageKey(p, roomId);
    const rows = fresh ? r.result.items.map(x => `<li data-passage-item="${esc(x.id)}" data-status="${esc(x.status)}"><b>${esc(S.TYPE_LABEL[mine.find(i => i.id === x.id)?.type] || x.id)}</b> · ${esc(I.describe(x, lang()))}</li>`).join('') : '';
    return `<div class="r02a-passage" data-passage="${fresh ? 'done' : r ? 'stale' : 'idle'}"><p><b>${esc(t.title)}</b><br><small>${esc(t.note)}</small></p>
      ${fresh ? `<ul class="r02a-passage-items">${rows}</ul>` : r ? `<p class="muted">${esc(t.stale)}</p>` : ''}
      <button type="button" class="btn" data-r02a="passage">${esc(t.consult)}</button></div>`;
  }

  // ── Panel de la estancia ───────────────────────────────────────────────────────────────────────────────────────
  function refLine(p, roomId) {
    const ext = X.extension(p), own = ext.verticalReferences.find(v => v.scope === 'room' && v.roomId === roomId), lvl = ext.verticalReferences.find(v => v.scope === 'project');
    const show = (v, where) => tx(`<b>${v.clearHeightMm} mm</b> de altura libre desde ${REF_ES()[v.reference]} · ${esc(where)} · fuente: ${esc(v.source)}`, `<b>${v.clearHeightMm} mm</b> clear height from ${REF_ES()[v.reference]} · ${esc(where)} · source: ${esc(v.source)}`, `自${REF_ES()[v.reference]}起净高 <b>${v.clearHeightMm} mm</b> · ${esc(where)} · 来源：${esc(v.source)}`);
    if (own) return { html: show(own, tx('solo esta estancia', 'this room only', '仅本房间')), own, lvl };
    if (lvl) return { html: show(lvl, tx('de ', 'for ', '') + levelWord()), own, lvl };
    return { html: tx('<b>Desconocida.</b> Sin referencia no se calculan cotas ni se dibuja el techo; nunca se supone (la altura de los muros no se usa como techo).', '<b>Unknown.</b> Without a reference no levels are computed and no ceiling is drawn; it is never assumed (wall height is not used as the ceiling).', '<b>未知。</b>没有基准时不计算标高、不绘制吊顶；绝不假定（不以墙高作为吊顶）。'), own, lvl };
  }
  function roomPanel(container, roomId) {
    const p = project(); if (!container || !p || !roomOfId(roomId)) return;
    // Cambio de idioma: los textos guardados en el estado del panel (última comprobación, alternativas, aviso) se generaron en
    // el idioma anterior. La comprobación se recalcula con el núcleo (solo lectura); alternativas y aviso transitorio se retiran.
    if (st.lang !== lang()) { if (st.lang !== undefined) { if (st.result && st.draft) st.result = evaluate(p, request(st.draft)); st.alternatives = null; st.notice = null; } st.lang = lang(); }
    const ext = X.extension(p);
    if (!st.draft || st.draft.roomId !== roomId) { st.draft = defaultDraft(roomId); st.result = null; st.alternatives = null; }
    const sec = doc.createElement('section');sec.className = 'r02a-ceiling';sec.dataset.roomId = roomId;
    const d = st.draft, cat = S.CATALOG[d.type], ref = refLine(p, roomId);
    let body;
    if (ext.status === 'future' || ext.status === 'invalid') {
      body = `<p class="r02a-warn" role="alert">${ext.status === 'future' ? tx('Los datos de techo de este proyecto son de una versión más reciente de RUBIK: se conservan tal cual y no se pueden editar aquí.', 'This project’s ceiling data is from a newer RUBIK version: it is kept as is and cannot be edited here.', '本项目的吊顶数据来自更新版本的 RUBIK：按原样保留，此处不可编辑。') : tx('Los datos de techo de este proyecto no son válidos: se conservan tal cual y no se pueden editar aquí.', 'This project’s ceiling data is not valid: it is kept as is and cannot be edited here.', '本项目的吊顶数据无效：按原样保留，此处不可编辑。')}</p>`;
    } else {
      const rc = X.recheck(p, { labelOf }), mine = rc.items.filter(i => i.roomId === roomId);
      const rows = mine.map(i => `<li data-item="${esc(i.id)}" data-holds="${i.holds}"><b>${esc(S.TYPE_LABEL[i.type] || i.type)}</b> · ${esc(STATE_ES()[i.state] || i.state)}
        <br><small>${esc(i.explanation.join(' '))}</small><br><button type="button" class="btn" data-r02a="edit" data-id="${esc(i.id)}">${esc(tx('Editar', 'Edit', '编辑'))}</button> <button type="button" class="btn danger" data-r02a="remove" data-id="${esc(i.id)}">${esc(tx('Quitar', 'Remove', '移除'))}</button></li>`).join('');
      const res = st.result, alts = st.alternatives;
      body = `
      <h4>${esc(tx('Referencia vertical', 'Vertical reference', '竖向基准'))}</h4>
      <p class="r02a-ref" data-ref="${ref.own ? 'room' : ref.lvl ? 'project' : 'unknown'}">${ref.html}</p>
      <div class="r02a-form">
        <label>${esc(tx('Se aplica a', 'Applies to', '适用于'))} <select data-f="scope"><option value="project">${esc(levelWord())}</option><option value="room">${esc(tx('solo esta estancia', 'this room only', '仅本房间'))}</option></select></label>
        <label>${esc(tx('Altura libre (mm)', 'Clear height (mm)', '净高 (mm)'))} <input type="number" inputmode="numeric" min="1" step="10" data-f="clear" value="${esc(ref.own?.clearHeightMm ?? ref.lvl?.clearHeightMm ?? '')}"></label>
        <label>${esc(tx('Medida desde', 'Measured from', '测量起点'))} <select data-f="reference"><option value="finished-floor">${esc(tx('el suelo acabado', 'the finished floor', '完成地面'))}</option><option value="level-floor">${esc(tx('el forjado', 'the structural floor', '楼板'))}</option></select></label>
        <label>${esc(tx('Fuente (obligatoria)', 'Source (required)', '来源（必填）'))} <input type="text" maxlength="200" data-f="source" placeholder="${esc(tx('p. ej. medición in situ del 12/11', 'e.g. on-site measurement of 12/11', '例如 11/12 现场测量'))}"></label>
        <button type="button" class="btn" data-r02a="ref-save">${esc(tx('Guardar referencia', 'Save reference', '保存基准'))}</button>
        ${ref.own ? `<button type="button" class="btn" data-r02a="ref-clear-room">${esc(tx('Quitar la de esta estancia', 'Remove this room’s reference', '移除本房间的基准'))}</button>` : ''}
        ${ref.lvl ? `<button type="button" class="btn" data-r02a="ref-clear-level">${esc(tx('Quitar la de ', 'Remove the reference for ', '移除基准：') + levelWord())}</button>` : ''}
      </div>
      <h4>${esc(tx('Elementos en esta estancia', 'Items in this room', '本房间的元素'))} (${mine.length})</h4>
      ${mine.length ? `<ul class="r02a-items">${rows}</ul>` : `<p class="muted">${esc(tx('Ninguno.', 'None.', '无。'))}</p>`}
      ${passageBlock(p, roomId, mine)}
      <h4>${esc(d.editing ? tx('Modificar elemento', 'Edit item', '修改元素') : tx('Añadir elemento', 'Add item', '添加元素'))}</h4>
      <div class="r02a-form">
        <label>${esc(tx('Tipo', 'Type', '类型'))} <select data-f="type">${Object.entries(S.TYPE_LABEL).map(([k, v]) => `<option value="${k}"${k === d.type ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
        <label>X (mm) <input type="number" inputmode="numeric" data-f="x" value="${esc(d.x)}"></label>
        <label>Y (mm) <input type="number" inputmode="numeric" data-f="y" value="${esc(d.y)}"></label>
        <label>${esc(tx('Giro (°)', 'Rotation (°)', '旋转 (°)'))} <input type="number" inputmode="numeric" step="15" data-f="rot" value="${esc(d.rot)}"></label>
        <label>${esc(tx('Ancho (mm)', 'Width (mm)', '宽 (mm)'))} <input type="number" inputmode="numeric" data-f="w" value="${esc(d.w)}"></label>
        <label>${esc(tx('Fondo (mm)', 'Depth (mm)', '深 (mm)'))} <input type="number" inputmode="numeric" data-f="d" value="${esc(d.d)}"></label>
        <label>${esc(tx('Alto (mm)', 'Height (mm)', '高 (mm)'))} <input type="number" inputmode="numeric" data-f="h" value="${esc(d.h)}"></label>
        <label>${esc(tx('Descuelgue desde el techo (mm)', 'Drop from the ceiling (mm)', '距吊顶下吊 (mm)'))} <input type="number" inputmode="numeric" min="0" data-f="drop" value="${esc(d.drop)}"></label>
        ${cat.kind === 'curtain' ? `<label>${esc(tx('Caída de la cortina (mm)', 'Curtain drop (mm)', '窗帘垂度 (mm)'))} <input type="number" inputmode="numeric" data-f="curtain" value="${esc(d.curtain ?? '')}"></label>` : ''}
        <p class="muted">${esc(tx('Medidas de catálogo genéricas (no de un producto medido): ajústalas a las reales.', 'Generic catalogue sizes (not from a measured product): adjust them to the real ones.', '通用目录尺寸（非实测产品）：请按实际调整。'))}</p>
        <button type="button" class="btn" data-r02a="place">${esc(st.placing ? tx('Toca el plano…', 'Tap the plan…', '点按平面图…') : tx('Colocar tocando el plano', 'Place by tapping the plan', '点按平面图放置'))}</button>
        <button type="button" class="btn" data-r02a="center">${esc(tx('Centro de la estancia', 'Room centre', '房间中心'))}</button>
        <button type="button" class="btn" data-r02a="check">${esc(tx('Comprobar', 'Check', '检查'))}</button>
      </div>
      ${res ? `<div class="r02a-result" data-state="${esc(res.state || 'invalid')}" role="status"><b>${esc(STATE_ES()[res.state] || tx('No válido', 'Invalid', '无效'))}</b><br>${esc((res.explanation || []).join(' '))}</div>` : ''}
      ${res && res.ok && res.state !== 'candidate-reviewable' ? `<button type="button" class="btn" data-r02a="alts">${esc(tx('Ver alternativas', 'See alternatives', '查看备选'))}</button>` : ''}
      ${alts ? (alts.alternatives?.length ? `<ol class="r02a-alts">${alts.alternatives.map((a, i) => `<li>(${a.position.x}, ${a.position.y}) ${esc(tx('a', 'at', '距离'))} ${a.distanceMm} mm <button type="button" class="btn" data-r02a="use-alt" data-i="${i}">${esc(tx(`Usar alternativa ${i + 1}`, `Use alternative ${i + 1}`, `使用备选 ${i + 1}`))}</button></li>`).join('')}</ol>` : `<p class="muted">${esc(alts.explanation || tx('No hay alternativas revisables en esta estancia.', 'There are no reviewable alternatives in this room.', '本房间没有可审核的备选。'))}</p>`) : ''}
      <p class="r02a-limit">${esc(tx('No comprueba la altura de paso para personas, instalaciones ni normativa.', 'It does not check clear passage height for people, installations or regulations.', '不检查人员通行净高、设备或规范。'))}</p>
      <label class="r02a-confirm"><input type="checkbox" data-f="confirmed"${d.confirmed ? ' checked' : ''}> ${esc(tx('He revisado este elemento y quiero guardarlo en el proyecto', 'I have reviewed this item and want to save it in the project', '我已审核此元素并希望保存到项目中'))}</label>
      <button type="button" class="btn primary" data-r02a="save"${d.confirmed ? '' : ' disabled'}>${esc(d.editing ? tx('Guardar cambios', 'Save changes', '保存更改') : tx('Guardar en el proyecto', 'Save in the project', '保存到项目'))}</button>
      ${d.editing ? `<button type="button" class="btn" data-r02a="new">${esc(tx('Nuevo elemento', 'New item', '新建元素'))}</button>` : ''}`;
    }
    markup(sec, `<details${st.open ? ' open' : ''}><summary><b>${esc(tx('Techo y elementos altos', 'Ceiling and high items', '吊顶与高位元素'))}</b> <span class="r02a-badge">${esc(tx('experimental', 'experimental', '实验性'))}</span></summary>
      <ul class="r02a-limits">${LIMITS_ES().map(t => `<li>${esc(t)}</li>`).join('')}</ul>${body}</details>`);
    container.append(sec);
    bind(sec, roomId);
  }
  function bind(sec, roomId) {
    const details = sec.querySelector('details');
    // Persist the disclosure intent before an editor refresh can detach this section.
    details.querySelector('summary').addEventListener('click', e => {
      if (e.defaultPrevented) return;
      e.preventDefault();
      st.open = details.open = !details.open;
    });
    details.addEventListener('toggle', () => { if (details.isConnected) st.open = details.open; });
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
        if (!ref.source) { st.notice = { kind: 'error', text: tx('La referencia vertical necesita su fuente (de dónde sale la medida).', 'The vertical reference needs its source (where the measurement comes from).', '竖向基准需要来源（测量数据从何而来）。') }; return rerender(); }
        if (write(p => B.setReference(p, ref)).ok) info(tx('Referencia vertical guardada. Los elementos guardados se han comprobado de nuevo.', 'Vertical reference saved. Saved items have been checked again.', '竖向基准已保存。已重新检查已保存的元素。'));
      } else if (act === 'ref-clear-room' || act === 'ref-clear-level') {
        const scope = act === 'ref-clear-room' ? { scope: 'room', roomId } : { scope: 'project' };
        if (write(p => B.clearReference(p, scope)).ok) info(tx('Referencia retirada. Los elementos que dependían de ella quedan pendientes de datos; no se mueven.', 'Reference removed. Items that depended on it now have missing data; they are not moved.', '基准已移除。依赖它的元素变为待补数据，不会被移动。'));
      } else if (act === 'edit') {
        const it = X.extension(project()).items.find(i => i.id === b.dataset.id); if (!it) return;
        st.draft = { id: it.id, roomId, type: it.type, x: it.position.x, y: it.position.y, rot: it.rotationDeg, w: it.size.widthMm, d: it.size.depthMm, h: it.size.heightMm, drop: it.dropMm, curtain: it.curtainLengthMm, confirmed: false, editing: true };
        st.result = null; st.alternatives = null;
      } else if (act === 'remove') {
        if (write(p => B.remove(p, b.dataset.id)).ok) { info(tx('Elemento quitado. Se puede deshacer.', 'Item removed. It can be undone.', '元素已移除。可以撤销。')); if (st.draft?.id === b.dataset.id) st.draft = defaultDraft(roomId); }
      } else if (act === 'new') { st.draft = defaultDraft(roomId); st.result = null; st.alternatives = null;
      } else if (act === 'center') { const c = centroid(roomOfId(roomId)); Object.assign(d, { x: c.x, y: c.y, confirmed: false }); st.result = null;
      } else if (act === 'passage') { consultPassage(roomId);
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
        if (r.ok) { info(tx(`Guardado en el proyecto: ${S.TYPE_LABEL[d.type]}. Se puede deshacer.`, `Saved in the project: ${S.TYPE_LABEL[d.type]}. It can be undone.`, `已保存到项目：${S.TYPE_LABEL[d.type]}。可以撤销。`)); st.draft = defaultDraft(roomId); st.result = null; }
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
    if (!g) { g = doc.createElementNS('http://www.w3.org/2000/svg', 'g'); g.id = 'gCeiling'; g.setAttribute('pointer-events', 'none'); g.setAttribute('aria-label', tx('Elementos de techo (experimental)', 'Ceiling items (experimental)', '吊顶元素（实验性）')); svg.insertBefore(g, doc.getElementById('gSel')); }
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
      if (rc.status === 'future' || rc.status === 'invalid') st.notice = { kind: 'error', text: rc.status === 'future' ? tx('Elementos de techo: datos de una versión más reciente. Se conservan sin cambios y no se pueden editar.', 'Ceiling items: data from a newer version. Kept unchanged and not editable.', '吊顶元素：数据来自更新版本。保持不变且不可编辑。') : tx('Elementos de techo: datos no válidos. Se conservan sin cambios y no se pueden editar.', 'Ceiling items: invalid data. Kept unchanged and not editable.', '吊顶元素：数据无效。保持不变且不可编辑。') };
      else if (rc.failing) st.notice = { kind: 'warn', text: tx(`Elementos de techo: ${rc.failing} de ${rc.items.length} ya no cumplen al abrir el proyecto. Revísalos en su estancia.`, `Ceiling items: ${rc.failing} of ${rc.items.length} no longer fit when opening the project. Review them in their room.`, `吊顶元素：打开项目时 ${rc.items.length} 个中有 ${rc.failing} 个不再符合。请在其房间中检查。`) };
    } else if (st.last && st.last !== json) {
      const r = B.afterEdit(JSON.parse(st.last), p, { labelOf });
      if (r.newlyFailing?.length) st.notice = { kind: 'warn', text: `${tx('Tras este cambio, ', 'After this change, ', '此次更改后，')}${r.newlyFailing.map(i => `${S.TYPE_LABEL[i.type]} (${roomName(i.roomId)}): ${i.explanation.join(' ')}`).join(' · ')} ${tx('No se ha movido nada.', 'Nothing has been moved.', '未移动任何内容。')}` };
      else if (r.recovered?.length) st.notice = { kind: 'info', text: tx(`${r.recovered.length} elemento(s) de techo vuelven a cumplir.`, `${r.recovered.length} ceiling item(s) fit again.`, `${r.recovered.length} 个吊顶元素重新符合。`) };
    }
    if (st.removed.length) { st.notice = { kind: 'info', text: tx(`Se ha eliminado una estancia: se retiran con ella ${st.removed.length} dato(s) de techo (se recuperan al deshacer).`, `A room was deleted: ${st.removed.length} ceiling item(s) were removed with it (they come back on undo).`, `已删除一个房间：随之移除 ${st.removed.length} 个吊顶数据（撤销可恢复）。`) }; st.removed = []; }
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
    markup(el, `<span>${esc(st.notice.text)}</span> <button type="button" aria-label="${esc(tx('Cerrar aviso', 'Close notice', '关闭提示'))}">×</button>`);
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
