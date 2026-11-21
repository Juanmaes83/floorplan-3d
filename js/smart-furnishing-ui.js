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
  // Nombres VISIBLES por la fuente única de RUBIK (regla: sin chino en español o inglés).
  const shown = it => root.FloorPlanDisplayName ? root.FloorPlanDisplayName(it.name, it.type) : it.name;
  function differences(a, b) {
    if (!a?.ok || !b?.ok) return [];
    const out = [], byRole = p => { const m = new Map(); for (const it of p.items) { const k = it.role; m.set(k, [...(m.get(k) || []), it]); } return m; }, A = byRole(a), B = byRole(b);
    for (const role of new Set([...A.keys(), ...B.keys()])) {
      const x = A.get(role)?.[0], y = B.get(role)?.[0];
      if (!x && y) out.push(`+ ${shown(y)}`); else if (x && !y) out.push(`− ${shown(x)}`);
      else if (x.variant !== y.variant || x.size.widthMm !== y.size.widthMm) out.push(`${shown(x)} ${x.size.widthMm}×${x.size.depthMm} → ${shown(y)} ${y.size.widthMm}×${y.size.depthMm}`);
      else if (x.color !== y.color) out.push(`${shown(y)}: color ${x.color} → ${y.color}`);
    }
    return out;
  }
  if (node) { module.exports = { previewMarkup, differences }; return; }

  const doc = root.document;
  // Language of the session (the app's global LANG; es by default). The core keeps its Spanish texts as its contract; this
  // panel presents them: `g` rewrites the known ones (closed vocabulary of the V1 recipes, statuses and rules) and `nm`
  // shows the catalogue labels in the language of the session. Nothing is stored and nothing is translated in the model.
  const tx = (es, en, zh) => { const l = typeof LANG === 'string' ? LANG : 'es'; return l === 'en' ? en : l === 'zh' ? zh : es; };
  const GLOSS = {
    'Salón': ['Living room', '客厅'], 'Dormitorio': ['Bedroom', '卧室'], 'Comedor': ['Dining room', '餐厅'], 'Despacho': ['Office', '书房'],
    'Baja': ['Low', '低'], 'Media': ['Medium', '中'], 'Alta': ['High', '高'],
    'Nórdico claro': ['Light Nordic', '明亮北欧'], 'Urbano compacto': ['Compact urban', '紧凑都市'], 'Mediterráneo cálido': ['Warm Mediterranean', '温暖地中海'],
    'Maderas claras, textiles grises y blancos; piezas amplias y pocas, con una planta grande.': ['Light woods, grey and white textiles; few, generous pieces, with one large plant.', '浅色木材、灰白色织物；件数少而尺寸大，配一株大型绿植。'],
    'Nogal oscuro y grafito; piezas compactas (sofá de dos plazas, mesa redonda, puf) que liberan suelo.': ['Dark walnut and graphite; compact pieces (two-seater sofa, round table, pouf) that free up floor space.', '深色胡桃木与石墨色；紧凑的家具（双人沙发、圆桌、坐墩）腾出更多地面空间。'],
    'Arena, terracota y verde; sofá rinconera si cabe, butacas y mesa grande para reunir.': ['Sand, terracotta and green; a corner sofa if it fits, armchairs and a large table to gather around.', '沙色、赤陶色与绿色；放得下就用转角沙发，配扶手椅和便于聚会的大餐桌。'],
    'Todas las maderas comparten un tono claro': ['All the woods share a light tone', '所有木材都采用浅色调'], 'Textiles en grises y blancos': ['Textiles in greys and whites', '织物为灰色和白色'],
    'Un único color de acento (azul niebla)': ['A single accent colour (mist blue)', '仅一种点缀色（雾蓝）'], 'Una sola madera oscura (nogal)': ['A single dark wood (walnut)', '仅一种深色木材（胡桃木）'],
    'Textiles en grafito': ['Textiles in graphite', '织物为石墨色'], 'Acento cobre en piezas pequeñas': ['Copper accent on small pieces', '小件家具采用铜色点缀'],
    'Maderas de tono miel': ['Honey-toned woods', '蜜色调木材'], 'Textiles arena': ['Sand textiles', '沙色织物'], 'Acento terracota': ['Terracotta accent', '赤陶色点缀'],
    'Acabado de suelo: la receta lo sugiere, pero V1 no cambia suelos (se conserva el actual).': ['Floor finish: the recipe suggests it, but V1 does not change floors (the current one is kept).', '地面饰面：配方有建议，但 V1 不会更改地面（保留当前地面）。'],
    'Modelos 3D comerciales: el catálogo propio BIB-01 no está completado; se usan las piezas genéricas de RUBIK.': ['Commercial 3D models: the own catalogue BIB-01 is not complete; RUBIK generic pieces are used.', '商业 3D 模型：自有目录 BIB-01 尚未完成；使用 RUBIK 的通用家具。'],
    'Textiles, cuadros y pequeña decoración: no hay recursos en el catálogo genérico.': ['Textiles, pictures and small decoration: there are no resources in the generic catalogue.', '织物、画作和小型装饰：通用目录中没有相应资源。'],
    'la estancia completa (también en L)': ['the whole room (also L-shaped)', '整个房间（包括 L 形）'], 'los muros': ['the walls', '墙体'], 'el barrido de las puertas': ['the door swing', '门的开启范围'],
    'la escalera y su hueco': ['the stair and its opening', '楼梯及其洞口'], 'los muebles existentes y los propuestos': ['the existing and the proposed furniture', '现有家具和建议的家具'],
    'accesibilidad': ['accessibility', '无障碍'], 'evacuación': ['evacuation', '疏散'], 'paso libre o recorridos': ['clear passage or routes', '通行空间或动线'], 'altura libre': ['clear height', '净高'],
    'normativa': ['regulations', '规范'], 'muebles de otras plantas': ['furniture on other levels', '其他楼层的家具'],
    'Colocación geométrica orientativa, no diseño profesional certificado. No comprueba accesibilidad, evacuación, paso libre ni normativa.': ['Indicative geometric placement, not certified professional design. It does not check accessibility, evacuation, clear passage or regulations.', '仅为参考性的几何布置，不是经认证的专业设计。不检查无障碍、疏散、通行空间或规范。'],
    'La escala del plano es estimada: las medidas son orientativas y hay que confirmarlas antes de aplicar.': ['The scale of the plan is estimated: dimensions are indicative and must be confirmed before applying.', '平面图比例为估算值：尺寸仅供参考，应用前需要确认。'],
    'Sofá con la espalda contra un tramo de pared, lejos de las puertas.': ['Sofa with its back against a stretch of wall, away from the doors.', '沙发靠墙放置，远离门。'],
    'Cabecero contra una pared, con sitio para las mesillas.': ['Headboard against a wall, with room for the nightstands.', '床头靠墙，两侧留出床头柜的位置。'],
    'Mesa centrada en la zona libre de la estancia, alineada con su lado largo.': ['Table centred in the free area of the room, aligned with its long side.', '餐桌置于房间空闲区域中央，与长边对齐。'],
    'Escritorio contra una pared, lejos de las puertas.': ['Desk against a wall, away from the doors.', '书桌靠墙，远离门。'],
    'Delante del sofá, centrada en su eje, con 450 mm de paso.': ['In front of the sofa, centred on its axis, with 450 mm of passage.', '置于沙发前，居中对齐，留出 450 mm 通道。'],
    'Bajo la mesa de centro, centrada (no bloquea).': ['Under the coffee table, centred (it does not block).', '置于茶几下方，居中（不阻挡）。'],
    'Contra la pared de enfrente del sofá, centrada en su eje de visión.': ['Against the wall opposite the sofa, centred on its line of sight.', '靠沙发对面的墙，居中对齐视线。'],
    'A un lado de la mesa de centro, mirando hacia ella.': ['Beside the coffee table, facing it.', '置于茶几一侧，朝向茶几。'],
    'Junto a un extremo del sofá, alineada con su respaldo.': ['Next to one end of the sofa, aligned with its back.', '置于沙发一端旁，与靠背对齐。'], 'En el otro extremo del sofá.': ['At the other end of the sofa.', '置于沙发的另一端。'],
    'En una esquina libre, lejos de las puertas.': ['In a free corner, away from the doors.', '置于空闲角落，远离门。'], 'A un lado del cabecero, alineada con él.': ['Beside the headboard, aligned with it.', '置于床头一侧，与其对齐。'],
    'Al otro lado del cabecero.': ['On the other side of the headboard.', '置于床头的另一侧。'], 'Contra una pared libre, lejos de las puertas y de la pieza principal.': ['Against a free wall, away from the doors and the main piece.', '靠空闲墙面，远离门和主要家具。'],
    'Delante del escritorio, en su eje.': ['In front of the desk, on its axis.', '置于书桌前，居中。'], 'Alrededor de la mesa, mirando hacia ella.': ['Around the table, facing it.', '围绕餐桌，朝向餐桌。'],
    'Ya hay una pieza de este tipo en la estancia: se respeta.': ['There is already a piece of this type in the room: it is respected.', '房间内已有此类家具：予以保留。'],
    'Recurso no disponible en el catálogo genérico (BIB-01 pendiente).': ['Resource not available in the generic catalogue (BIB-01 pending).', '通用目录中没有该资源（BIB-01 待完成）。'],
    'La mesa redonda de 100 cm admite cuatro sillas.': ['The 100 cm round table takes four chairs.', '100 cm 圆桌可配四把椅子。'],
    'No hay ninguna posición posible para esta regla.': ['There is no possible position for this rule.', '此规则没有可行的位置。'],
    'No hay ninguna posición posible.': ['There is no possible position.', '没有可行的位置。'],
    'La estancia indicada no existe en esta planta.': ['The indicated room does not exist on this level.', '所指房间不在此楼层。'],
    'Parte de esta estancia pertenece también a otra estancia: no se puede atribuir el mobiliario con certeza. Corrige los contornos antes de amueblar.': ['Part of this room also belongs to another room: the furniture cannot be attributed with certainty. Correct the outlines before furnishing.', '此房间的一部分也属于另一个房间：无法确定家具归属。请先修正轮廓再布置家具。'],
    'La escala del plano está sin calibrar: no se pueden proponer muebles con medidas reales. Calibra la escala primero.': ['The scale of the plan is not calibrated: furniture with real dimensions cannot be proposed. Calibrate the scale first.', '平面图比例尚未校准：无法提出带真实尺寸的家具。请先校准比例。'],
    'Indica el uso real de la estancia (salón, dormitorio, comedor o despacho) para proponer muebles.': ['State the real use of the room (living room, bedroom, dining room or office) to propose furniture.', '请指明房间的实际用途（客厅、卧室、餐厅或书房），以便建议家具。'],
    'La receta pide piezas que no existen en el catálogo genérico (BIB-01 pendiente): no se propone nada.': ['The recipe asks for pieces that do not exist in the generic catalogue (BIB-01 pending): nothing is proposed.', '配方需要通用目录中不存在的家具（BIB-01 待完成）：不提出任何建议。'],
    'No hay ninguna propuesta que aplicar.': ['There is no proposal to apply.', '没有可应用的建议。'], 'El proyecto ha cambiado desde que se generó la propuesta. Genera una nueva.': ['The project has changed since the proposal was generated. Generate a new one.', '自生成建议以来项目已更改。请重新生成。'],
    'Confirma que entiendes que la escala es estimada antes de aplicar.': ['Confirm that you understand the scale is estimated before applying.', '应用前请确认你了解比例为估算值。'], 'La propuesta no añade ningún mueble.': ['The proposal does not add any furniture.', '该建议不会添加任何家具。'],
    'No se ha podido aplicar.': ['It could not be applied.', '无法应用。'],
    'los límites de la estancia': ['the limits of the room', '房间边界'], 'la escalera': ['the stair', '楼梯'], 'otros muebles': ['other furniture', '其他家具']
  };
  const NAME_KEYS = typeof NAMES_FROM_ES === 'object' ? Object.keys(NAMES_FROM_ES).sort((a, b) => b.length - a.length) : [];
  const names = t => { let r = String(t ?? ''); if (tx('es', 'en', 'zh') === 'es') return r; for (const k of NAME_KEYS) r = r.split(k).join(typeof nm === 'function' ? nm(k) : k); return r; };
  const gl = t => {
    t = String(t ?? ''); if (tx('es', 'en', 'zh') === 'es') return t;
    const hit = GLOSS[t]; if (hit) return tx(t, hit[0], hit[1]);
    let m;
    if ((m = t.match(/^El uso «(.*)» no tiene programa de muebles en V1 \(solo salón, dormitorio, comedor y despacho\)\.$/))) return tx(t, `The use "${m[1]}" has no furniture programme in V1 (only living room, bedroom, dining room and office).`, `用途「${m[1]}」在 V1 中没有家具方案（仅支持客厅、卧室、餐厅和书房）。`);
    if ((m = t.match(/^«(.*)» ya tiene las piezas de este programa o no cabe ninguna más: no hay nada que proponer\. El proyecto no cambia\.$/))) return tx(t, `"${m[1]}" already has the pieces of this programme or no more fit: there is nothing to propose. The project does not change.`, `「${m[1]}」已有此方案的家具，或再也放不下：没有可建议的内容。项目不会更改。`);
    if ((m = t.match(/^No hay sitio para (.*) en «(.*)»\. (.*) No se propone nada: el proyecto no cambia\.$/))) { const piece = m[1].startsWith('la pieza principal (') ? tx(m[1], `the main piece (${names(m[1].slice(20, -1))})`, `主要家具（${names(m[1].slice(20, -1))}）`) : tx(m[1], 'the main piece', '主要家具'); return tx(t, `There is no room for ${piece} in "${m[2]}". ${gl(m[3])} Nothing is proposed: the project does not change.`, `「${m[2]}」中没有放置${piece}的空间。${gl(m[3])} 不提出任何建议：项目不会更改。`); }
    if ((m = t.match(/^No cabe sin invadir (.*)\.$/))) { const parts = m[1].split(', ').map(g); return tx(t, `It does not fit without intruding on ${parts.join(', ')}.`, `放置后会侵占${parts.join('、')}。`); }
    if ((m = t.match(/^Se usa «(.*)» porque la primera opción de la receta no cabe\.$/))) return tx(t, `"${names(m[1])}" is used because the first option of the recipe does not fit.`, `使用「${names(m[1])}」，因为配方的首选项放不下。`);
    if ((m = t.match(/^Sugerencia de suelo no aplicada: (.*)\.$/))) { const f = { 'Suelo de roble claro': ['Light oak floor', '浅橡木地面'], 'Suelo de hormigón pulido': ['Polished concrete floor', '抛光混凝土地面'], 'Suelo de barro cocido': ['Terracotta floor', '陶土地面'] }[m[1]]; return f ? tx(t, `Floor suggestion not applied: ${f[0]}.`, `未应用的地面建议：${f[1]}。`) : t; }
    if ((m = t.match(/^(.*): (No cabe sin invadir .*|No hay ninguna posición posible\.)$/))) return `${names(m[1])}: ${gl(m[2])}`;
    if ((m = t.match(/^La propuesta ya no es válida: (.*)$/))) return tx(t, `The proposal is no longer valid: ${names(m[1])}`, `该建议已失效：${names(m[1])}`);
    if ((m = t.match(/^La revisión del conjunto encuentra conflictos: (.*)\.$/))) return tx(t, `The review of the whole finds conflicts: ${m[1]}.`, `整体审核发现冲突：${m[1]}。`);
    if ((m = t.match(/^El resultado no cumple el contrato del proyecto: (.*)$/))) return tx(t, `The result does not meet the project contract: ${m[1]}`, `结果不符合项目契约：${m[1]}`);
    return names(t);
  };
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
    return `<ol id="sfItems">${p.items.map(it => `<li data-sf-item="${esc(it.id)}"><span class="sf-sw" style="background:${esc(it.color)}"></span><b>${esc(nm(it.name))}</b> · ${it.size.widthMm} × ${it.size.depthMm} mm · ${tx('centro', 'centre', '中心')} (${it.position.x}, ${it.position.y}) · ${it.rotationDeg}°<br><small>${esc(gl(it.rule))}</small></li>`).join('')}</ol>`;
  }
  function resultMarkup() {
    const r = st.result, applied = st.applied;
    if (applied) return `<div class="sf-ok" id="sfApplied" role="status">${tx(`Aplicado: ${applied.count} mueble${applied.count === 1 ? '' : 's'} en un solo paso. Cada uno se edita, mueve o borra como cualquier otro mueble.`, `Applied: ${applied.count} piece${applied.count === 1 ? '' : 's'} of furniture in a single step. Each one is edited, moved or deleted like any other piece of furniture.`, `已应用：一次性添加 ${applied.count} 件家具。每件都可像其他家具一样编辑、移动或删除。`)}</div>
      <div class="sf-actions"><button class="btn" type="button" id="sfUndo">${tx('Deshacer amueblamiento', 'Undo furnishing', '撤销布置')}</button><button class="btn" type="button" id="sfView3DApplied">${tx('Ver en 3D', 'View in 3D', '在 3D 中查看')}</button></div>`;
    if (!r) return '';
    if (!r.ok) return `<div class="sf-err" id="sfError" role="alert" data-sf-status="${esc(r.status)}">${esc(gl(r.message))}</div>`;
    const p = r;
    return `<div id="sfProposal" data-sf-status="proposal" data-sf-recipe="${esc(p.recipe.id)}" data-sf-seed="${p.seed}" data-sf-count="${p.items.length}">
      <p class="sf-note"><b>${tx('Propuesta', 'Proposal', '建议')}</b> · ${esc(gl(p.useLabel))} · ${esc(gl(p.recipe.label))} · ${tx('densidad', 'density', '密度')} ${esc(gl(p.densityLabel).toLowerCase())} · ${tx('semilla', 'seed', '种子')} ${p.seed} · ${tx(`${p.items.length} mueble${p.items.length === 1 ? '' : 's'}`, `${p.items.length} piece${p.items.length === 1 ? '' : 's'} of furniture`, `${p.items.length} 件家具`)}${p.alternatives > 1 ? ` · ${tx(`${p.alternatives} distribuciones igual de buenas`, `${p.alternatives} equally good layouts`, `${p.alternatives} 种同样好的布局`)}` : ''}</p>
      ${st.diff.length ? `<div class="sf-note" id="sfDiff"><b>${tx(`Cambios respecto a «${esc(gl(st.previous))}»:`, `Changes compared with "${esc(gl(st.previous))}":`, `与「${esc(gl(st.previous))}」相比的更改：`)}</b><ul>${st.diff.map(d => `<li>${esc(gl(d))}</li>`).join('')}</ul></div>` : ''}
      ${itemsList(p)}
      ${p.kept.length ? `<p class="sf-note" id="sfKept">${tx(`Se respetan ${p.kept.length} mueble${p.kept.length === 1 ? '' : 's'} que ya están en la estancia: no se mueven ni se sustituyen.`, `${p.kept.length} piece${p.kept.length === 1 ? '' : 's'} of furniture already in the room ${p.kept.length === 1 ? 'is' : 'are'} respected: not moved or replaced.`, `房间内已有的 ${p.kept.length} 件家具予以保留：不会移动或替换。`)}</p>` : ''}
      ${p.discarded.length ? `<div class="sf-note" id="sfDiscarded"><b>${tx('No se proponen:', 'Not proposed:', '未建议：')}</b><ul>${p.discarded.map(d => `<li>${esc(nm(d.name))}: ${esc(gl(d.reason))}</li>`).join('')}</ul></div>` : ''}
      <details class="sf-more"><summary>${tx(`Receta «${esc(gl(p.recipe.label))}»: qué aplica y qué no`, `Recipe "${esc(gl(p.recipe.label))}": what it applies and what it does not`, `配方「${esc(gl(p.recipe.label))}」：应用什么、不应用什么`)}</summary><p class="sf-note">${esc(gl(p.recipe.summary))}</p>
        <p class="sf-note">${tx('Coherencia', 'Coherence', '一致性')}: ${p.recipe.coherence.map(c => esc(gl(c))).join(' · ')}.</p><p class="sf-note">${tx('Paleta', 'Palette', '色板')}: ${Object.entries(p.recipe.palette).map(([k, v]) => `<span class="sf-sw" style="background:${esc(v)}" title="${esc(k)}"></span>`).join('')}</p>
        <ul>${p.recipe.notApplied.map(t => `<li>${esc(gl(t))}</li>`).join('')}${p.recipe.notes.map(t => `<li>${esc(gl(t))}</li>`).join('')}</ul></details>
      <details class="sf-more"><summary>${tx('Qué se comprueba y qué no', 'What is checked and what is not', '检查什么、不检查什么')}</summary><p class="sf-note">${tx('Se comprueba', 'Checked', '已检查')}: ${p.checked.map(c => esc(gl(c))).join(tx(', ', ', ', '、'))}.</p><p class="sf-note">${tx('No se comprueba', 'Not checked', '未检查')}: ${p.notChecked.map(c => esc(gl(c))).join(tx(', ', ', ', '、'))}.</p></details>
      <p class="sf-warn">${esc(gl(p.disclaimer))}</p>
      ${p.scaleWarning ? `<p class="sf-warn">${esc(gl(p.scaleWarning))}</p><label class="sf-row"><input type="checkbox" id="sfAck" ${st.ack ? 'checked' : ''}> ${tx('Entiendo que las medidas son orientativas', 'I understand the dimensions are indicative', '我了解尺寸仅供参考')}</label>` : ''}
      <div class="sf-actions"><button class="btn" type="button" id="sfView2D">${tx('Ver en 2D', 'View in 2D', '在 2D 中查看')}</button><button class="btn" type="button" id="sfView3D">${tx('Ver en 3D', 'View in 3D', '在 3D 中查看')}</button><button class="btn" type="button" id="sfAnother">${tx('Cambiar propuesta', 'Change proposal', '更换建议')}</button></div>
      <div class="sf-actions"><button class="btn primary" type="button" id="sfApply" ${p.scaleWarning && !st.ack ? 'disabled' : ''}>${tx('Aplicar', 'Apply', '应用')}</button><button class="btn" type="button" id="sfDiscard">${tx('Descartar', 'Discard', '放弃')}</button></div>
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
    const uses = Object.entries(SF.USES).map(([k, u]) => `<option value="${k}" ${st.use === k ? 'selected' : ''}>${esc(gl(u.label))}</option>`).join('');
    const html = `<summary id="sfSummary">${tx('Amueblar esta estancia', 'Furnish this room', '布置此房间')}</summary>
      <p class="sf-note">${tx('Estancia', 'Room', '房间')}: <b>${esc(label(room))}</b> · ${fmtArea(area.toFixed(1))} m²</p>
      <label class="sf-row" for="sfUse">${tx('Uso real declarado', 'Declared real use', '声明的实际用途')}</label><select id="sfUse"><option value="" ${st.use ? '' : 'selected'}>${tx('Elige el uso…', 'Choose the use…', '选择用途…')}</option>${uses}</select>
      <p class="sf-note">${family ? tx('Tomado del tipo de la estancia; puedes cambiarlo para esta propuesta.', 'Taken from the room type; you can change it for this proposal.', '取自房间类型；你可以为此建议更改。') : tx('La estancia no tiene tipo declarado: elige su uso real (no se cambia el tipo de la estancia).', 'The room has no declared type: choose its real use (the room type is not changed).', '该房间没有声明类型：请选择其实际用途（不会更改房间类型）。')}</p>
      <fieldset id="sfDensity"><legend>${tx('Densidad', 'Density', '密度')}</legend>${SF.DENSITIES.map(d => `<label class="sf-seg"><input type="radio" name="sfDensity" value="${d}" ${st.density === d ? 'checked' : ''}>${esc(gl(SF.DENSITY_LABEL[d]))}</label>`).join('')}</fieldset>
      <label class="sf-row" for="sfRecipe">${tx('Receta de estilo', 'Style recipe', '风格配方')}</label><select id="sfRecipe">${Object.values(SF.RECIPES).map(r => `<option value="${r.id}" ${st.recipeId === r.id ? 'selected' : ''}>${esc(gl(r.label))}</option>`).join('')}</select>
      <p class="sf-note" id="sfRecipeSummary">${esc(gl(SF.RECIPES[st.recipeId].summary))}</p>
      <div class="sf-row"><label for="sfSeed">${tx('Semilla', 'Seed', '种子')}</label><input type="number" id="sfSeed" min="1" max="999999" step="1" value="${st.seed}" inputmode="numeric" style="width:96px"><span class="sf-note">${tx('Misma semilla y mismo plano: misma propuesta.', 'Same seed and same plan: same proposal.', '种子和平面图相同：建议相同。')}</span></div>
      <div class="sf-actions"><button class="btn primary" type="button" id="sfGenerate">${tx('Generar propuesta', 'Generate proposal', '生成建议')}</button></div>
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
    const msg = gl(r?.message || r?.explanation?.join(' ') || 'No se ha podido aplicar.');
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

  // A proposal (or its refusal) carries texts written when it was generated, with the name of the room as the person saw it.
  // On a language change it is generated again with the same inputs (same seed, same plan: same proposal; the project is not touched),
  // keeping the acknowledgement of the estimated scale, so the whole result is in the new language.
  doc.addEventListener('rubik:languagechange', () => {
    if (!st.result || st.applied || !doc.getElementById('sfPanel')) return;
    const ack = st.ack; try { generate('language'); } finally { st.ack = ack; if (st.result) rerenderPanel(); }
  });
  root.FloorPlanSmartFurnishingUI = Object.freeze({ roomPanel, planMarkup, create3D, update3D, previewMarkup, differences,
    get state() { return JSON.parse(JSON.stringify({ roomId: st.roomId, use: st.use, density: st.density, recipeId: st.recipeId, seed: st.seed, proposal: st.proposal, applied: st.applied, status: st.result?.status || null })); },
    get trace() { return trace.slice(); }, get meshes() { return three ? three.group.children.slice() : []; } });
})(typeof globalThis !== 'undefined' ? globalThis : this);
