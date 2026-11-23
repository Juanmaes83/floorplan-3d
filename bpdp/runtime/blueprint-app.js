/* BP-DP PREMIUM · BLUEPRINT 3D (módulo ES).
 * Abrir → elegir qué mostrar → Planta → Axonometría / Sección / Alzados → Capas / Inspector → Presentación → Vídeo → Lámina.
 * FOCO POR INTENCIÓN: «Visual limpio» por defecto (sin cotas, sin rótulos, sin paneles); cada intención muestra solo lo suyo.
 * Cotas: de la geometría del proyecto (FloorPlanProjectV1) vía RubikBlueprintCore (G1) — certeza «Estimado» (cálculo del
 * modelo), nunca «Documentado» sin fuente. Vistas en proyección ORTOGRÁFICA verdadera (cámara ortográfica del runtime).
 */
import { exportMp4, videoModal, sheetModal, titleBlock, pngConDensidad, escalaQueCabe, cajaGirada, solapa } from './outputs.js';
import * as HERO from './hero-firma.js';
import * as REV from './revision.js';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const E = () => window.RubikBpdpEvidence;
const INTENTS = [['clean', 'Visual limpio'], ['spaces', 'Espacios'], ['measure', 'Medición'], ['inspect', 'Inspeccionar'], ['present', 'Presentar']];
const VIEWS = [['plan', 'Planta'], ['axon', 'Axonometría'], ['section', 'Sección'], ['elev', 'Alzados']];
const FILM = 12.5; // guion técnico; después, la fase de firma del HERO FINAL común (RubikFinalCore.DURACIONES.firma)

export function mountBlueprint(shell, S, { onBack }) {
  const { pkg } = S, P = pkg.project, synthetic = pkg.scenario === 'synthetic', M = S.model;
  // Nombre VISIBLE por el embudo de RUBIK (nunca en chino en ES/EN): RubikFinalCore.textoVisible vía HERO.nombreProyecto.
  const NOMBRE = HERO.nombreProyecto(pkg);
  const levels = synthetic ? P.levels : [{ id: null, name: 'Planta', elevationMm: 0 }];
  const elevOf = id => (levels.find(l => l.id === id) || levels[0]).elevationMm / 1000;
  const origin = pkg.frame.originPlanMm, W = (x, y, e) => [(x - origin.x) / 1000, e, (y - origin.y) / 1000];
  // Núcleo técnico G1 sobre el mismo proyecto (cotas, fichas, certeza). Shim de FloorPlanCore con datos del paquete.
  const Core = { geometry: () => ({ center: origin, envelope: { w: S.size.x * 1000, h: S.size.z * 1000 } }), wallRect: w => ({ declared: !!w.structureSource }) };
  const names = pkg.displayNames || {};
  const bp = window.RubikBlueprintCore.build({ project: P, Core, revision: pkg.revision, displayName: (n, t) => names[n] || n, sources: [] });
  const itemById = new Map(bp.items.map(i => [i.id, i]));
  // Estado de la experiencia (se conserva al cambiar de vista o intención).
  const st = { intent: 'clean', view: 'axon', level: synthetic ? 'L0' : null, elev: 'elev-s', secAxis: 'z', secPos: 0, measure: 'perimeter', selected: null, panel: null, film: null };
  shell.app.dataset.theme = 'paper'; S.applyStyle('blueprint');
  const TOTAL = FILM + (HERO.available() ? HERO.FIRMA_S() : 0), reduced = () => !exporting && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // El MP4 es un entregable para el cliente: siempre lleva la versión cinematográfica completa (órbita y aparición escalonada).
  let exporting = false;
  let FIRMA = HERO.firma(pkg, 'blueprint', { synthetic }); const titles = HERO.capa(shell.stage, () => shell.stage.getBoundingClientRect().bottom - shell.dock.getBoundingClientRect().top + 12, { app: shell.app, arriba: () => shell.top.getBoundingClientRect().bottom - shell.stage.getBoundingClientRect().top + 8 });
  // ── marco: barra superior, dock, cajón ──
  shell.top.innerHTML = `<div class="mark">BLUEPRINT 3D <small>${esc(NOMBRE)}</small></div><span class="badge ${synthetic ? 'syn' : 'real'}">${synthetic ? 'ESCENA SINTÉTICA' : 'PROYECTO RUBIK · DATOS REALES'}</span>
   <span class="spacer"></span><button type="button" class="btn" data-a="layers" aria-pressed="false">Capas</button><button type="button" class="btn" data-a="firma">Firma</button><button type="button" class="btn" data-a="video">Vídeo</button><button type="button" class="btn" data-a="sheet">Lámina</button><button type="button" class="btn" data-a="back" aria-label="Volver al paso anterior">Volver</button>`;
  shell.dock.innerHTML = `<div class="ctx" data-ctx></div><div class="seg" role="tablist" aria-label="¿Qué quieres mostrar?">${INTENTS.map(([k, l]) => `<button type="button" class="btn" role="tab" data-intent="${k}" aria-pressed="${k === st.intent}">${l}</button>`).join('')}</div>`;
  const ctx = shell.dock.querySelector('[data-ctx]');
  // ── capa de anotaciones (SVG + rótulos) ──
  const annot = shell.annot, svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); annot.appendChild(svg);
  const labels = document.createElement('div'); annot.appendChild(labels);
  const catcher = document.createElement('div'); catcher.className = 'catcher'; catcher.hidden = true; shell.stage.appendChild(catcher);
  // ── geometría de cotas por nivel: lado exterior por prueba de estancias (no es una afirmación estructural) ──
  const inPoly = (pt, poly) => { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y) + a.x) inside = !inside; } return inside; };
  function dimsFor(levelId) {
    const rooms = (P.rooms || []).filter(r => !synthetic || r.levelId === levelId), e = elevOf(levelId) + 0.02, out = [];
    for (const w of P.walls || []) {
      if (w.status === 'demolished' || (synthetic && w.levelId !== levelId)) continue;
      const L = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y); if (L < 600) continue;
      const ux = (w.end.x - w.start.x) / L, uy = (w.end.y - w.start.y) / L, nx = -uy, ny = ux, mid = { x: (w.start.x + w.end.x) / 2, y: (w.start.y + w.end.y) / 2 }, d = w.thicknessMm / 2 + 400;
      const sA = rooms.some(r => inPoly({ x: mid.x + nx * d, y: mid.y + ny * d }, r.polygon)), sB = rooms.some(r => inPoly({ x: mid.x - nx * d, y: mid.y - ny * d }, r.polygon));
      const exterior = sA !== sB || (!sA && !sB), sign = sA && !sB ? -1 : sB && !sA ? 1 : (nx * (mid.x - origin.x) + ny * (mid.y - origin.y) > 0 ? 1 : -1);
      const off = w.thicknessMm / 2 + (exterior ? 650 : 260), ox = nx * sign * off, oy = ny * sign * off;
      const claim = itemById.get(w.id)?.claims.find(c => c.key.endsWith(':length'));
      out.push({ id: w.id, exterior, len: L, a: W(w.start.x + ox, w.start.y + oy, e), b: W(w.end.x + ox, w.end.y + oy, e), wa: W(w.start.x, w.start.y, e), wb: W(w.end.x, w.end.y, e), text: (L / 1000).toFixed(2), certainty: claim ? claim.certainty : 'estimated' });
    }
    return out.sort((x, y) => y.len - x.len);
  }
  const area = poly => { let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p.x * q.y - q.x * p.y; } return Math.abs(a) / 2 / 1e6; };
  // ── dibujo de anotaciones con control de densidad (no se desplazan etiquetas para tapar el modelo: se omiten) ──
  function drawAnnotations(project = S.project, target = null) {
    const showDims = (st.intent === 'measure') && st.view !== 'elev', showRooms = st.intent === 'spaces' && ['plan', 'axon'].includes(st.view);
    // Obstáculos de interfaz MEDIDOS (barra, dock, cajón, rótulo): una cota o un rótulo que caería debajo se omite.
    const accepted = target ? [] : uiObstacles(), fits = r => !accepted.some(a => r.x < a.x + a.w + 8 && a.x < r.x + r.w + 8 && r.y < a.y + a.h + 6 && a.y < r.y + r.h + 6);
    let s = '', html = '';
    if (showDims) for (const d of dimsFor(st.level)) {
      if (st.measure === 'perimeter' && !d.exterior) continue;
      const a = project(d.a), b = project(d.b), wa = project(d.wa), wb = project(d.wb), len = Math.hypot(b.x - a.x, b.y - a.y); if (len < 46) continue;
      const ang = Math.atan2(b.y - a.y, b.x - a.x), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      // Caja REAL del texto girado (ancho por número de caracteres, alto de línea) desplazada 5 px hacia fuera de la línea.
      const tw = d.text.length * 7.2 + 6, th = 15, c = Math.abs(Math.cos(ang)), sn = Math.abs(Math.sin(ang)), bw = tw * c + th * sn, bh = tw * sn + th * c;
      const r = { x: mx - bw / 2, y: my - bh / 2 - 5 * c, w: bw, h: bh }; if (!fits(r)) continue; accepted.push(r);
      const tick = (p) => `<line x1="${p.x - 5 * Math.cos(ang - Math.PI / 4)}" y1="${p.y - 5 * Math.sin(ang - Math.PI / 4)}" x2="${p.x + 5 * Math.cos(ang - Math.PI / 4)}" y2="${p.y + 5 * Math.sin(ang - Math.PI / 4)}"/>`;
      s += `<g class="dim"><line x1="${wa.x}" y1="${wa.y}" x2="${a.x}" y2="${a.y}" stroke-opacity=".55"/><line x1="${wb.x}" y1="${wb.y}" x2="${b.x}" y2="${b.y}" stroke-opacity=".55"/><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>${tick(a)}${tick(b)}</g>`;
      const deg = ang * 180 / Math.PI, rot = deg > 90 || deg < -90 ? deg + 180 : deg;
      s += `<text x="${mx}" y="${my}" transform="rotate(${rot} ${mx} ${my}) translate(0 -5)" text-anchor="middle" class="dt">${d.text}</text>`;
    }
    if (showRooms) for (const r of (P.rooms || []).filter(r => !synthetic || r.levelId === st.level).sort((x, y) => area(y.polygon) - area(x.polygon))) {
      const at = r.labelAt || r.polygon[0], p = project(W(at.x, at.y, elevOf(st.level) + .05)), nm = names[r.id] || r.name, w = Math.max(70, nm.length * 7.4 + 14, 136), rr = { x: p.x - w / 2, y: p.y - 18, w, h: 36 };
      if (!fits(rr)) continue; accepted.push(rr);
      html += `<div class="lbl" style="left:${p.x}px;top:${p.y}px">${esc(nm)}<small>${area(r.polygon).toFixed(1).replace('.', ',')} m² · estimado</small></div>`;
    }
    if (target) return { svg: s, html, count: accepted.filter(a => !a.ui).length };
    svg.innerHTML = `<style>.dim line{stroke:#26328a;stroke-width:1.1}.dt{font:600 11.5px ui-monospace,Consolas,monospace;fill:#26328a;paint-order:stroke;stroke:#eef0f7;stroke-width:3px}</style>${s}`;
    labels.innerHTML = html; shell.state.annotations = accepted.filter(a => !a.ui).length;
  }
  function uiObstacles() {
    const o = shell.annot.getBoundingClientRect(), rel = r => ({ x: r.left - o.left - 6, y: r.top - o.top - 6, w: r.width + 12, h: r.height + 12, ui: true }), out = [];
    for (const el of [...shell.top.children, shell.dock, shell.caption, shell.drawer.hidden ? null : shell.drawer]) { if (!el) continue; const r = el.getBoundingClientRect(); if (r.width && r.height) out.push(rel(r)); }
    return out; }
  S.onFrame(() => { if (!st.film?.playing) drawAnnotations(); });
  S.controls.addEventListener('change', () => drawAnnotations());
  // ── vistas ──
  const levelBox = () => { if (!synthetic || !st.level) return S.bbox; const b = new (S.bbox.constructor)(); for (const c of M.components) if (c.level === st.level || (st.view === 'plan' && c.system === 'foundation' && false)) { b.expandByPoint({ x: c.bounds.min[0], y: c.bounds.min[1], z: c.bounds.min[2] }); b.expandByPoint({ x: c.bounds.max[0], y: c.bounds.max[1], z: c.bounds.max[2] }); } return b.isEmpty() ? S.bbox : b; };
  function applyView(animate = true) {
    const v = st.view; let pose;
    S.setIsolate(synthetic && v === 'plan' && st.level ? { type: 'level', id: st.level } : null);
    if (v === 'plan') { S.setClip({ plan: elevOf(st.level) + 1.2 }); pose = S.poseFor('plan', { box: levelBox() }); }
    else if (v === 'section') { const b = S.bbox; if (!st.secPos) st.secPos = secDefault(st.secAxis);
      S.setClip({ section: { axis: st.secAxis, pos: st.secPos } }); pose = S.poseFor(st.secAxis === 'z' ? 'elev-s' : 'elev-e'); }
    else if (v === 'elev') { S.setClip({}); pose = S.poseFor(st.elev); }
    else { S.setClip({}); pose = S.poseFor('axon'); }
    S.goTo(pose, animate ? 750 : 0).then(() => drawAnnotations());
    renderCtx();
  }
  // ── barra contextual por intención/vista ──
  function renderCtx() {
    const vbtn = VIEWS.map(([k, l]) => `<button type="button" class="btn" data-view="${k}" aria-pressed="${st.view === k}">${l}</button>`).join('');
    let extra = '';
    if (synthetic && ['plan', 'measure', 'spaces'].some(x => x === st.view || x === st.intent)) extra += `<span>·</span>${P.levels.map(l => `<button type="button" class="btn" data-level="${l.id}" aria-pressed="${st.level === l.id}">${esc(l.name)}</button>`).join('')}`;
    if (st.view === 'section') extra += `<span>·</span><button type="button" class="btn" data-sec="z" aria-pressed="${st.secAxis === 'z'}">A-A</button><button type="button" class="btn" data-sec="x" aria-pressed="${st.secAxis === 'x'}">B-B</button><label>Plano<input type="range" data-secpos min="0" max="1000" value="${secValue()}" aria-label="Posición del plano de sección"></label>`;
    if (st.view === 'elev') extra += `<span>·</span>${[['elev-s', 'Sur'], ['elev-n', 'Norte'], ['elev-e', 'Este'], ['elev-w', 'Oeste']].map(([k, l]) => `<button type="button" class="btn" data-elev="${k}" aria-pressed="${st.elev === k}">${l}</button>`).join('')}`;
    if (st.intent === 'measure') extra += `<span>·</span><button type="button" class="btn" data-meas="perimeter" aria-pressed="${st.measure === 'perimeter'}">Perímetro</button><button type="button" class="btn" data-meas="all" aria-pressed="${st.measure === 'all'}">Todos los muros ≥ 0,6 m</button>`;
    if (st.intent === 'present') { ctx.innerHTML = `<button type="button" class="btn primary" data-film="play">${st.film?.playing ? 'Pausa' : 'Reproducir'}</button><button type="button" class="btn" data-film="restart">Desde el inicio</button><label>Tiempo<input type="range" data-filmt min="0" max="${Math.round(TOTAL * 100)}" value="${Math.round((st.film?.t || 0) * 100)}" aria-label="Posición en la presentación"></label><button type="button" class="btn" data-film="video">Preparar vídeo</button>`; return; }
    ctx.innerHTML = vbtn + extra;
  }
  const secValue = () => { const b = S.bbox, lo = st.secAxis === 'z' ? b.min.z : b.min.x, hi = st.secAxis === 'z' ? b.max.z : b.max.x; return Math.round((st.secPos - lo) / (hi - lo) * 1000); };
  // ── intenciones ──
  function setIntent(k) {
    if (st.film && k !== 'present') stopFilm(true);
    st.intent = k; shell.dock.querySelectorAll('[data-intent]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.intent === k)));
    catcher.hidden = k !== 'inspect'; if (k !== 'inspect') { S.setSelected(null); if (st.panel === 'inspect') closePanel(); if (!st.film) shell.caption.textContent = ''; }
    // La ficha se abre al tocar un elemento, no antes: en móvil un cajón vacío tapaba la vivienda que hay que tocar.
    else if (st.selected) openPanel('inspect'); else { if (st.panel) closePanel(); shell.caption.textContent = 'Toca un elemento para ver su ficha'; }
    if (k === 'measure' && !['plan', 'section', 'axon'].includes(st.view)) st.view = 'plan';
    if (k === 'spaces' && !['plan', 'axon'].includes(st.view)) st.view = 'plan';
    if (k === 'present') startFilm(); else applyView();
    renderCtx(); drawAnnotations();
  }
  // ── cajón: capas / inspector ──
  function openPanel(kind) { st.panel = kind; shell.drawer.hidden = false; shell.top.querySelector('[data-a="layers"]').setAttribute('aria-pressed', String(kind === 'layers')); renderPanel(); }
  function closePanel() { st.panel = null; shell.drawer.hidden = true; shell.top.querySelector('[data-a="layers"]').setAttribute('aria-pressed', 'false'); }
  function renderPanel() {
    const D = shell.drawer;
    if (st.panel === 'layers') {
      D.innerHTML = `<header><h2>Capas</h2><span class="spacer"></span><button type="button" class="btn ghost" data-a="close-panel" aria-label="Cerrar capas">✕</button></header><div class="body">
       ${M.systems.map(s => `<div class="layer"><input type="checkbox" id="ly-${s.id}" data-layer="${s.id}" ${S.state.visible[s.id] !== false ? 'checked' : ''}><label for="ly-${s.id}">${esc(s.label)}</label><span class="n">${s.count}${s.auxiliary ? ` + ${s.auxiliary} aux.` : ''}</span><button type="button" class="btn ghost" data-solo="${s.id}" aria-pressed="${S.state.isolate?.type === 'system' && S.state.isolate.id === s.id}">Aislar</button></div>`).join('')}
       <h3>No modelado</h3><ul class="missing">${M.notModelled.map(x => `<li><b>${esc(x.label)}</b>: ${esc(x.reason)}</li>`).join('')}</ul></div>`;
      return;
    }
    const c = st.selected && M.byKey.get(st.selected);
    if (!c) { D.innerHTML = `<header><h2>Inspeccionar</h2><span class="spacer"></span><button type="button" class="btn ghost" data-a="close-panel" aria-label="Cerrar inspector">✕</button></header><div class="body"><p>Toca un elemento de la vivienda para ver sus datos, su procedencia y la certeza de cada afirmación.</p></div>`; return; }
    const it = c.entityId && itemById.get(c.entityId), meta = c.meta;
    const claims = it ? it.claims : synthClaims(c);
    D.innerHTML = `<header><h2>${esc(c.name)}</h2><span class="spacer"></span><button type="button" class="btn ghost" data-a="close-panel" aria-label="Cerrar inspector">✕</button></header><div class="body">
     <h3>Registro del modelo</h3><dl class="rows"><dt>Sistema</dt><dd>${esc(M.systems.find(s => s.id === c.system)?.label)}</dd><dt>Identificador</dt><dd style="font-family:var(--mono);font-size:12px">${esc(c.entityId || '—')}</dd>
      ${c.level ? `<dt>Nivel</dt><dd>${esc((levels.find(l => l.id === c.level) || { name: c.level === 'roof' ? 'Cubierta' : c.level }).name)}</dd>` : ''}${meta?.material ? `<dt>Material</dt><dd>${esc(meta.material.name)}</dd>` : ''}${meta?.dims ? `<dt>Dimensiones</dt><dd>${esc(meta.dims)}</dd>` : ''}<dt>Mallas visuales</dt><dd>${c.meshIdx.length}</dd></dl>
     ${it ? `<h3>Revisión del elemento</h3><p>${esc(it.review.text)}</p>` : ''}
     <h3>Afirmaciones</h3>${claims.map(cl => `<div class="claim"><div class="h"><span>${esc(cl.claim)}</span><span class="v">${esc(cl.value)} <span class="chip" data-c="${cl.certainty}">${E().label(cl.certainty)}</span></span></div><p>${esc(cl.justification.join(' '))}</p></div>`).join('')}
     <h3>Revisión del proyecto</h3><p style="font:12px var(--mono);color:var(--muted)">${esc(pkg.revision.slice(0, 24))}…</p></div>`;
  }
  function synthClaims(c) {
    const m = c.meta || {}, A = E().assess, key = `syn:${c.entityId}:`;
    return [A({ key: key + 'dims', label: 'Dimensiones', value: m.dims || null, kind: 'declaration', declaredBy: 'synthetic-fixture' }),
      A({ key: key + 'material', label: 'Material', value: m.material?.name || null, kind: 'declaration', declaredBy: 'synthetic-fixture' }),
      A({ key: key + 'real', label: 'Existencia física', value: null, kind: 'declaration' })];
  }
  // ── película Blueprint: Planta → Volumen técnico 3D → Axonometría → Sección → Presentación final ──
  const PHASES = [[0, 2.2, 'Planta'], [2.2, 5.2, 'Volumen técnico 3D'], [5.2, 8, 'Axonometría'], [8, 10.6, 'Sección'], [10.6, FILM, 'Presentación'], [FILM, Infinity, 'Firma']];
  const sm = x => { const u = Math.min(1, Math.max(0, x)); return u * u * u * (u * (u * 6 - 15) + 10); };
  function filmPoses() {
    const plan = S.poseFor('plan', { ui: false, margin: 1.25 }), axon = S.poseFor('axon', { ui: false, margin: 1.2 }), rot = { ...axon, dir: axon.dir.clone().applyAxisAngle({ x: 0, y: 1, z: 0, isVector3: true }, 0.7) };
    const sec = S.poseFor('axon-sw', { ui: false, margin: 1.2 }), fin = S.poseFor('axon', { ui: false, margin: 1.12 });
    return { plan, axon, rot, sec, fin };
  }
  let FP = null;
  // Plano → volumen SIN deformar geometría: el plano de corte horizontal sube desde 1,2 m hasta por encima de la cubierta.
  function filmApply(t) {
    FP = FP || filmPoses(); const b = S.bbox, top = b.max.y + .2, cut0 = elevOf(synthetic ? 'L0' : null) + 1.2;
    S.setIsolate(null); S.setGrowth(1);
    if (t < 2.2) { S.setClip({ plan: cut0 }); S.applyPose(FP.plan); }
    else if (t < 5.2) { const k = (t - 2.2) / 3; S.setClip({ plan: cut0 + (top - cut0) * sm(k) }); S.applyPose(S.blendPose(FP.plan, FP.axon, k)); }
    else if (t < 8) { S.setClip({}); S.applyPose(S.blendPose(FP.axon, FP.rot, (t - 5.2) / 2.8)); }
    else if (t < 10.6) { const k = (t - 8) / 2.6; const z = b.max.z + .3 - (b.max.z + .3 - secDefault('z')) * sm(k / .7); S.setClip({ section: { axis: 'z', pos: z } }); S.applyPose(S.blendPose(FP.rot, FP.sec, Math.min(1, k * 1.5))); }
    else if (t < FILM || TOTAL === FILM) { const k = Math.min(1, (t - 10.6) / (FILM - 10.6)); S.setClip({}); S.applyPose(S.blendPose(FP.sec, FP.fin, k)); }
    else { // HERO FINAL: la vivienda se aparta a la derecha, órbita lenta y firma del profesional (mismo contrato que el resto de vídeos)
      const ep = HERO.epilogo(t - FILM, { reduced: reduced() }); S.setClip({});
      S.applyPose(S.blendPose(FP.fin, HERO.heroPose(FP.fin, { orbita: ep.orbita, aspect: heroAspect }), ep.acercar)); }
  }
  let heroAspect = 16 / 9;
  const firmaAt = t => t <= FILM || !FIRMA ? 0 : HERO.epilogo(t - FILM, { reduced: reduced() }).firma;
  /** Posición por defecto del plano de sección: a un 38 % de la profundidad, para no coincidir con un tabique del eje. */
  const secDefault = axis => { const b = S.bbox; return axis === 'z' ? b.min.z + (b.max.z - b.min.z) * .38 : b.min.x + (b.max.x - b.min.x) * .38; };
  const phaseAt = t => (PHASES.find(p => t >= p[0] && t < p[1]) || PHASES[PHASES.length - 1])[2];
  function drawFilmOverlay(ctx2, t, w, h) {
    const k = w / 1920; ctx2.save();
    if (t < 2.2) { // la planta del vídeo lleva sus cotas perimetrales: las mismas que «Medición · Perímetro» en la herramienta
      // Mismas reglas que la lámina: caja real del texto girado; se omiten las cotas que pisarían otra o saldrían del encuadre.
      const acc = [{ x: 0, y: h - 110 * k, w: w, h: 110 * k }]; ctx2.font = `600 ${Math.round(18 * k)}px ui-monospace,Consolas,monospace`; ctx2.textBaseline = 'middle';
      for (const d of dimsFor(synthetic ? 'L0' : null)) { if (!d.exterior) continue; const a = S.projectTo(d.a, w, h), bb = S.projectTo(d.b, w, h), len = Math.hypot(bb.x - a.x, bb.y - a.y);
        const ang0 = Math.atan2(bb.y - a.y, bb.x - a.x), ang = ang0 > Math.PI / 2 || ang0 < -Math.PI / 2 ? ang0 + Math.PI : ang0, tw = ctx2.measureText(d.text).width + 8 * k, th = 24 * k;
        const cx = (a.x + bb.x) / 2 + Math.sin(ang) * 14 * k, cy = (a.y + bb.y) / 2 - Math.cos(ang) * 14 * k, box = cajaGirada(cx, cy, tw, th, ang);
        const tintaV = r => { const d = ctx2.getImageData(Math.floor(r.x), Math.floor(r.y), Math.max(1, Math.ceil(r.w)), Math.max(1, Math.ceil(r.h))).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 170 && d[i + 1] < 170) n++; return n / (d.length / 4); };
        if (len < tw + 20 * k || box.x < 0 || box.y < 0 || box.x + box.w > w || box.y + box.h > h || acc.some(r => solapa(r, box, 5 * k)) || tintaV(box) > .035) continue; acc.push(box);
        ctx2.strokeStyle = '#26328a'; ctx2.lineWidth = 1.6 * k; ctx2.beginPath(); ctx2.moveTo(a.x, a.y); ctx2.lineTo(bb.x, bb.y); ctx2.stroke();
        ctx2.save(); ctx2.translate(cx, cy); ctx2.rotate(ang); ctx2.fillStyle = '#26328a'; ctx2.textAlign = 'center'; ctx2.fillText(d.text, 0, 0); ctx2.restore(); }
      ctx2.textBaseline = 'alphabetic'; window.__bpdpVideoCotas = acc.slice(1);
    }
    const fp = firmaAt(t); ctx2.globalAlpha = Math.max(0, 1 - fp * 8);
    ctx2.fillStyle = '#26328a'; ctx2.font = `600 ${Math.round(22 * k)}px ui-monospace,Consolas,monospace`; ctx2.textAlign = 'left'; ctx2.fillText(phaseAt(Math.min(t, FILM - 1e-6)).toUpperCase(), 64 * k, h - 64 * k);
    ctx2.font = `500 ${Math.round(16 * k)}px ui-monospace,Consolas,monospace`; ctx2.fillStyle = '#5d6480';
    ctx2.fillText(`${(NOMBRE).toUpperCase()} · REV ${pkg.revision.slice(0, 10)} · ${synthetic ? 'ESCENA SINTÉTICA' : 'DATOS REALES DE RUBIK'}`, 64 * k, h - 34 * k);
    ctx2.textAlign = 'right'; ctx2.fillText('Cotas calculadas de la geometría del modelo · Estimado', w - 64 * k, h - 34 * k);
    ctx2.restore(); if (fp > 0) HERO.pintar(ctx2, w, h, FIRMA, fp);
  }
  function startFilm() {
    closePanel(); catcher.hidden = true; svg.innerHTML = ''; labels.innerHTML = '';
    FIRMA = HERO.firma(pkg, 'blueprint', { synthetic }); HERO.preparar(FIRMA);
    st.film = { t: 0, playing: true, last: performance.now() }; FP = null; heroAspect = (S.canvas.clientWidth || 16) / (S.canvas.clientHeight || 9); filmApply(0); renderCtx();
    st.film.off = S.onFrame(now => { const f = st.film; if (!f) return; if (f.playing) { f.t = Math.min(TOTAL, f.t + (now - f.last) / 1000); if (f.t >= TOTAL) f.playing = false; } f.last = now;
      if (f.playing || f.applied !== f.t) { f.applied = f.t; filmApply(f.t); titles.draw(FIRMA, firmaAt(f.t)); }
      shell.caption.textContent = firmaAt(f.t) > 0 ? '' : phaseAt(f.t); const r = ctx.querySelector('[data-filmt]'); if (r) r.value = String(Math.round(f.t * 100)); const pb = ctx.querySelector('[data-film="play"]'); if (pb) pb.textContent = f.playing ? 'Pausa' : 'Reproducir'; });
  }
  function stopFilm(restore) { if (!st.film) return; st.film.off?.(); st.film = null; shell.caption.textContent = ''; titles.draw(null, 0); if (restore) { S.setGrowth(1); applyView(false); } }
  // Vigencia: salida asociada a la revisión del paquete; se comprueba al terminar, al reabrir y al descargar.
  const validez = rev => REV.vigencia(pkg, rev);
  const staleGuard = async () => { const v = await validez(pkg.revision); if (!v.vigente) throw Object.assign(Error('El proyecto ha cambiado desde que se abrió esta experiencia. Ciérrala y vuelve a abrirla para preparar la revisión vigente.'), { code: 'STALE', vigencia: v }); };
  /** Generador del vídeo (sin diálogo): lo usan el visor y el catálogo de Entregar. Cancelable con `signal`. */
  async function buildVideo({ signal, onProgress } = {}) { await staleGuard(); const restoreSize = () => S.renderAt(S.canvas.clientWidth || 1, S.canvas.clientHeight || 1).restore();
      FP = null; heroAspect = 16 / 9; FIRMA = await HERO.preparar(HERO.firma(pkg, 'blueprint', { synthetic }));
      exporting = true; let r; try { r = await exportMp4({ duration: TOTAL, fps: 30, width: 1920, height: 1080, signal, onProgress,
        apply: () => {}, draw: (c2, t, w, h) => { FP = FP || filmPoses(); filmApply(t); const { canvas } = S.renderAt(w, h); c2.drawImage(canvas, 0, 0, w, h); drawFilmOverlay(c2, t, w, h); } }); } finally { exporting = false; }
      restoreSize(); r.revision = pkg.revision; r.firma = FIRMA ? { estudio: FIRMA.estudio, perfil: FIRMA.perfil, estilo: FIRMA.estilo, desde: FILM, duracion: TOTAL - FILM } : null; heroAspect = (S.canvas.clientWidth || 16) / (S.canvas.clientHeight || 9); return r; 
  }
  async function makeVideo({ fresh = false, opener = document.activeElement } = {}) {
    const wasFilm = !!st.film; if (st.film) st.film.playing = false;
    const restoreSize = () => S.renderAt(S.canvas.clientWidth || 1, S.canvas.clientHeight || 1).restore();
    const vm = videoModal(shell.app, { cached: fresh ? null : REV.ultima(pkg, 'blueprint', 'video'), validez, opener, onResult: r => REV.recordar(pkg, 'blueprint', 'video', r), title: 'Vídeo Blueprint', filename: `blueprint-${pkg.projectId}-${pkg.revision.slice(0, 8)}.mp4`, run: buildVideo });
    vm.done.finally(() => { restoreSize(); if (!wasFilm) { S.setGrowth(1); applyView(false); } }).catch(() => {});
    return vm;
  }
  // ── lámina técnica A3 · 1:100 (planta, alzados, sección y axonometría del mismo runtime) ──
  /**
   * LÁMINA A3 (420 × 297 mm · 200 ppp · 3307 × 2339 px, densidad declarada en el PNG).
   * - Cada vista a escala usa la escala NORMALIZADA real con la que cabe (1:100 si cabe; si no, la siguiente) y la rotula.
   * - La barra gráfica, sus marcas y sus rótulos se dibujan DENTRO de su vista, con la longitud de esa escala.
   * - Cotas: caja real del texto girado; se omiten (no se desplazan) las que pisarían otra cota o saldrían de la vista.
   * - La axonometría se identifica como vista ilustrativa, sin escala.
   * opts.celdaPlanta = [x, y, w, h] permite comprobar qué pasa si la planta no cabe a la escala prevista.
   */
  async function buildSheet(opts = {}) {
    const DPI = 200, Wp = 3307, Hp = 2339, cv = document.createElement('canvas'); cv.width = Wp; cv.height = Hp; const g = cv.getContext('2d');
    g.fillStyle = '#fbfbfd'; g.fillRect(0, 0, Wp, Hp); g.strokeStyle = '#26328a'; g.lineWidth = 4; g.strokeRect(50, 50, Wp - 100, Hp - 100); g.lineWidth = 1.5; g.strokeRect(62, 62, Wp - 124, Hp - 124);
    const save = { pose: S.currentPose(), view: st.view, intent: st.intent, level: st.level }, vistas = [];
    const titulo = (x, y, w, t) => { let fs = 30; g.font = `600 ${fs}px ui-monospace,Consolas,monospace`; while (fs > 18 && g.measureText(t).width > w - 36) { fs--; g.font = `600 ${fs}px ui-monospace,Consolas,monospace`; } g.fillStyle = '#26328a'; g.textAlign = 'left'; g.fillText(t, x + 18, y + 44); };
    /** Vista: área de dibujo = celda menos franja de título (64) y, si lleva barra, franja inferior (130). */
    const vista = ({ id, nombre, x, y, w, h, setup, ext, escalada = true, barra = false }) => {
      const dx = x + 30, dy = y + 56, dw = w - 60, dh = h - 56 - (barra ? 110 : 20);
      setup(); const pose = S.currentPose(); let esc = null;
      if (escalada && pose.kind === 'ortho') { esc = escalaQueCabe(ext[0], ext[1], dw, dh, DPI, 100); pose.half = dh / 2 / esc.ppm; S.applyPose(pose); }
      const { canvas } = S.renderAt(dw, dh); g.drawImage(canvas, dx, dy, dw, dh); g.strokeStyle = '#26328a'; g.lineWidth = 1.5; g.strokeRect(x, y, w, h);
      titulo(x, y, w, `${nombre} · ${esc ? `E 1:${esc.escala}${esc.escala !== 100 ? ' (no cabe a 1:100)' : ''}` : 'VISTA ILUSTRATIVA · SIN ESCALA'}`);
      const v = { id, nombre, celda: [x, y, w, h], dibujo: [dx, dy, dw, dh], escala: esc?.escala ?? null, ppm: esc?.ppm ?? null, ilustrativa: !esc, noCabe: !!esc?.noCabe }; vistas.push(v);
      return { v, proj: p => { const q = S.projectTo(p, dw, dh); return { x: dx + q.x, y: dy + q.y }; } };
    };
    const lv0 = synthetic ? 'L0' : null, lb = levelBox(), sz = lb.getSize(new lb.min.constructor()), all = S.bbox.getSize(new lb.min.constructor());
    const [px, py, pw, ph] = opts.celdaPlanta || [90, 90, 1600, 1250];
    const P1 = vista({ id: 'planta', nombre: synthetic ? 'PLANTA BAJA' : 'PLANTA', x: px, y: py, w: pw, h: ph, barra: true, ext: [sz.x + 2.5, sz.z + 2.5], // 1,25 m por lado: separación de la cota (0,65 m) + medio muro + rótulo
      setup: () => { st.level = lv0; S.setIsolate(synthetic ? { type: 'level', id: lv0 } : null); S.setGrowth(1); S.setClip({ plan: elevOf(lv0) + 1.2 }); S.applyPose(S.poseFor('plan', { box: lb, ui: false })); } });
    // ── cotas exteriores sin solapes ──
    const [dx, dy, dw, dh] = P1.v.dibujo, aceptadas = [], cotas = []; let omitidas = 0, control = null;
    const oscuro = (d, i) => d[i] < 170 && d[i + 1] < 170; // tinta de la lámina (el papel y la retícula son claros)
    const tinta = r => { const x = Math.floor(r.x), y = Math.floor(r.y), w = Math.max(1, Math.ceil(r.w)), h = Math.max(1, Math.ceil(r.h)), d = g.getImageData(x, y, w, h).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (oscuro(d, i)) n++; return n / (w * h); };
    const tintaLinea = (a, b) => { const n = Math.max(8, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 6)); let k = 0, t = 0; for (let i = 1; i < n; i++) { const x = a.x + (b.x - a.x) * i / n, y = a.y + (b.y - a.y) * i / n, d = g.getImageData(Math.round(x), Math.round(y), 1, 1).data; t++; if (oscuro(d, 0)) k++; } return k / t; };
    g.save(); g.strokeStyle = '#26328a'; g.fillStyle = '#26328a'; g.lineWidth = 2; g.font = '600 24px ui-monospace,Consolas,monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const d of dimsFor(lv0)) { if (!d.exterior) continue; const a = P1.proj(d.a), b = P1.proj(d.b), wa = P1.proj(d.wa), wb = P1.proj(d.wb), len = Math.hypot(b.x - a.x, b.y - a.y);
      const ang0 = Math.atan2(b.y - a.y, b.x - a.x), ang = ang0 > Math.PI / 2 || ang0 < -Math.PI / 2 ? ang0 + Math.PI : ang0, tw = g.measureText(d.text).width + 10, th = 30;
      // el rótulo va 18 px hacia fuera de la línea de cota (perpendicular), nunca sobre el muro
      const nx = Math.sin(ang), ny = -Math.cos(ang), cx = (a.x + b.x) / 2 + nx * 18, cy = (a.y + b.y) / 2 + ny * 18, box = cajaGirada(cx, cy, tw, th, ang);
      const dentro = [a, b, wa, wb].every(p => p.x >= dx && p.x <= dx + dw && p.y >= dy && p.y <= dy + dh) && box.x >= dx && box.y >= dy && box.x + box.w <= dx + dw && box.y + box.h <= dy + dh;
      // «No tapar el dibujo»: se mide sobre los píxeles ya dibujados de la lámina (muros, muebles, carpinterías y cotas previas).
      if (len < tw + 24 || !dentro || aceptadas.some(r => solapa(r, box, 6)) || tinta(box) > .035 || tintaLinea(a, b) > .22) { omitidas++; continue; }
      aceptadas.push(box); cotas.push({ texto: d.text, caja: box, m: d.len / 1000, px: len });
      g.globalAlpha = .55; g.beginPath(); g.moveTo(wa.x, wa.y); g.lineTo(a.x, a.y); g.moveTo(wb.x, wb.y); g.lineTo(b.x, b.y); g.stroke(); g.globalAlpha = 1; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      for (const p of [a, b]) { g.beginPath(); g.moveTo(p.x - 7 * Math.cos(ang0 - Math.PI / 4), p.y - 7 * Math.sin(ang0 - Math.PI / 4)); g.lineTo(p.x + 7 * Math.cos(ang0 - Math.PI / 4), p.y + 7 * Math.sin(ang0 - Math.PI / 4)); g.stroke(); }
      g.save(); g.translate(cx, cy); g.rotate(ang); g.fillText(d.text, 0, 0); g.restore();
      if (!control || d.len > control.m * 1000) control = { texto: d.text, m: d.len / 1000, px: len, mm: len / DPI * 25.4, mmEsperados: d.len / P1.v.escala }; }
    // ── barra gráfica de 5 m y norte, DENTRO de la vista de planta ──
    const E = P1.v.escala, L = 5 * P1.v.ppm, bx = px + 40, by = py + ph - 62; g.lineWidth = 3; g.textBaseline = 'alphabetic';
    g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + L, by); g.stroke(); for (let i = 0; i <= 5; i++) { const x = bx + i * P1.v.ppm; g.beginPath(); g.moveTo(x, by - (i % 5 ? 7 : 12)); g.lineTo(x, by + (i % 5 ? 7 : 12)); g.stroke(); }
    for (let i = 0; i < 5; i += 2) g.fillRect(bx + i * P1.v.ppm, by - 4, P1.v.ppm, 8);
    g.font = '600 24px ui-monospace,Consolas,monospace'; g.textAlign = 'center'; g.fillText('0', bx, by + 36); g.fillText('5 m', bx + L, by + 36);
    // Nota de escala: junto a la barra si cabe; si no, encima, reduciendo el cuerpo. Nunca sale de la vista.
    const nX = px + pw - 70, nY = py + ph - 66, nota = `E 1:${E} · 5 m = ${(5000 / E).toFixed(0)} mm en A3 impreso al 100 %`; g.textAlign = 'left';
    let fsN = 22, notaX = bx + L + 60, notaY = by + 8, libre = nX - 50 - notaX; const fit = w => { g.font = `500 ${fsN}px ui-monospace,Consolas,monospace`; return g.measureText(nota).width <= w; };
    if (!fit(libre)) { notaX = bx; notaY = by - 26; libre = nX - 50 - bx; while (fsN > 14 && !fit(libre)) fsN--; }
    g.font = `500 ${fsN}px ui-monospace,Consolas,monospace`; g.fillText(nota, notaX, notaY); const notaW = g.measureText(nota).width; g.beginPath(); g.moveTo(nX, nY - 40); g.lineTo(nX + 18, nY + 20); g.lineTo(nX, nY + 8); g.lineTo(nX - 18, nY + 20); g.closePath(); g.fill(); g.textAlign = 'center'; g.font = '600 24px ui-monospace,Consolas,monospace'; g.fillText('N', nX, nY - 50);
    const barra = { x0: bx, y: by, px: L, mmEnA3: L / DPI * 25.4, mmEsperados: 5000 / E, cabe: notaX + notaW <= nX - 40 && bx + L + 30 < px + pw && by + 40 <= py + ph, rotulos: [bx - 10, bx + L + 30], nota: { x: notaX, y: notaY, w: notaW, cuerpo: fsN } };
    g.restore();
    vista({ id: 'axonometria', nombre: 'AXONOMETRÍA', x: 1720, y: 90, w: 1497, h: 1250, escalada: false, setup: () => { S.setIsolate(null); S.setClip({}); S.applyPose(S.poseFor('axon', { margin: 1.05, ui: false })); } });
    vista({ id: 'alzado-s', nombre: 'ALZADO SUR', x: 90, y: 1370, w: 1050, h: 780, ext: [all.x + 1, all.y + 1], setup: () => { S.setClip({}); S.applyPose(S.poseFor('elev-s', { ui: false })); } });
    vista({ id: 'seccion-aa', nombre: 'SECCIÓN A-A', x: 1160, y: 1370, w: 1050, h: 780, ext: [all.x + 1, all.y + 1], setup: () => { S.setClip({ section: { axis: 'z', pos: secDefault('z') } }); S.applyPose(S.poseFor('elev-s', { ui: false })); } });
    S.renderAt(1, 1).restore();
    const grupos = {}; for (const v of vistas.filter(v => v.escala)) (grupos['1:' + v.escala] = grupos['1:' + v.escala] || []).push({ planta: 'planta', 'alzado-s': 'alzado', 'seccion-aa': 'sección' }[v.id]);
    const escalas = Object.entries(grupos).map(([e, vs]) => `${vs.join(' y ').replace(/^./, c => c.toUpperCase())} ${e}`).join(' · ') + ' · Axonometría sin escala';
    titleBlock(g, 2230, 1370, 987, 870, [['Proyecto', NOMBRE, true], ['Escenario', synthetic ? 'Escena SINTÉTICA de demostración' : 'Proyecto real de RUBIK (ejemplo)'], ['Revisión', pkg.revision.slice(0, 20)],
      ['Formato', 'A3 apaisado · 420 × 297 mm · 200 ppp'], ['Escalas', escalas], ['Imprimir', 'Al 100 %, sin «Ajustar a página»'], ['Certeza', 'Cotas calculadas de la geometría · Estimado'],
      ['Fecha', new Date().toISOString().slice(0, 10)], HERO.firma(pkg, 'blueprint', { synthetic })?.estudio ? ['Profesional', HERO.firma(pkg, 'blueprint', { synthetic }).estudio, true] : ['Generado con', 'RUBIK · Blueprint 3D']]);
    st.level = save.level; S.setClip({}); applyView(false); S.applyPose(save.pose);
    const blob = await pngConDensidad(await new Promise(r => cv.toBlob(r, 'image/png')), DPI);
    const meta = { formato: 'A3 apaisado', mm: [+(Wp / DPI * 25.4).toFixed(2), +(Hp / DPI * 25.4).toFixed(2)], px: [Wp, Hp], dpi: DPI, vistas, barra, cotas, omitidas, control, revision: pkg.revision, impresionFisica: 'PENDIENTE' };
    window.__bpdpLastSheetMeta = meta; return { blob, meta, revision: pkg.revision, sha256: [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))].map(b => b.toString(16).padStart(2, '0')).join('') };
  }
  async function makeSheet(opts = {}) {
    const r = await buildSheet(opts); REV.recordar(pkg, 'blueprint', 'sheet', r); const m = r.meta, pl = m.vistas.find(v => v.id === 'planta');
    sheetModal(shell.app, { revision: pkg.revision, validez, opener: opts.opener ?? shell.top.querySelector('[data-a="sheet"]'), title: 'Lámina técnica Blueprint (A3)', filename: `lamina-blueprint-${pkg.projectId}-${pkg.revision.slice(0, 8)}.png`, blob: r.blob,
      meta: `PNG · A3 apaisado 420 × 297 mm · 200 ppp · planta E 1:${pl.escala}${pl.escala !== 100 ? ' (no cabe a 1:100)' : ''} · axonometría ilustrativa · revisión ${pkg.revision.slice(0, 12)} · firma: ${HERO.firma(pkg, 'blueprint', { synthetic })?.estudio || 'sin firma'}` });
    return r;
  }
  // ── eventos ──
  shell.app.addEventListener('click', onClick); shell.app.addEventListener('input', onInput); window.addEventListener('keydown', onKey, true);
  catcher.addEventListener('click', e => { st.selected = S.pickAt(e.clientX, e.clientY); S.setSelected(st.selected); if (st.selected) { shell.caption.textContent = ''; openPanel('inspect'); } else closePanel(); });
  function onClick(e) {
    const b = e.target.closest('button'); if (!b || shell.app.querySelector('.modal')?.contains(b)) return;
    const a = b.dataset.a;
    if (a === 'back') return back(); if (a === 'layers') return st.panel === 'layers' ? closePanel() : openPanel('layers'); if (a === 'close-panel') { if (st.intent === 'inspect') setIntent('clean'); return closePanel(); }
    if (a === 'video') return makeVideo(); if (a === 'sheet') return makeSheet();
    if (a === 'firma') return HERO.abrirPanel(shell.app, pkg, { modulo: 'blueprint', synthetic, opener: b, fondo: (w, h) => { const was = st.film; FP = FP || filmPoses(); heroAspect = w / h; filmApply(TOTAL); const { canvas, restore } = S.renderAt(w, h); const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(canvas, 0, 0, w, h); restore(); if (!was) applyView(false); return c; }, onChange: () => { FIRMA = HERO.firma(pkg, 'blueprint', { synthetic }); } });
    if (b.dataset.intent) return setIntent(b.dataset.intent);
    if (b.dataset.view) { st.view = b.dataset.view; return applyView(); }
    if (b.dataset.level) { st.level = b.dataset.level; return applyView(); }
    if (b.dataset.elev) { st.elev = b.dataset.elev; return applyView(); }
    if (b.dataset.sec) { st.secAxis = b.dataset.sec; st.secPos = 0; return applyView(); }
    if (b.dataset.meas) { st.measure = b.dataset.meas; renderCtx(); return drawAnnotations(); }
    if (b.dataset.solo) { const cur = S.state.isolate; S.setIsolate(cur?.type === 'system' && cur.id === b.dataset.solo ? null : { type: 'system', id: b.dataset.solo }); return renderPanel(); }
    if (b.dataset.film === 'play') { if (!st.film) startFilm(); else { if (st.film.t >= TOTAL) st.film.t = 0; st.film.playing = !st.film.playing; st.film.last = performance.now(); } return; }
    if (b.dataset.film === 'restart' && st.film) { st.film.t = 0; st.film.playing = true; st.film.last = performance.now(); return; }
    if (b.dataset.film === 'video') return makeVideo();
  }
  function onInput(e) {
    const t = e.target;
    if (t.dataset.layer) { S.setSystemVisible(t.dataset.layer, t.checked); return; }
    if (t.dataset.secpos !== undefined) { const b = S.bbox, lo = st.secAxis === 'z' ? b.min.z : b.min.x, hi = st.secAxis === 'z' ? b.max.z : b.max.x; st.secPos = lo + (hi - lo) * (+t.value / 1000); S.setClip({ section: { axis: st.secAxis, pos: st.secPos } }); return; }
    if (t.dataset.filmt !== undefined && st.film) { st.film.t = +t.value / 100; st.film.playing = false; }
  }
  function onKey(e) {
    if (shell.app.querySelector('.modal')) return;
    if (e.key === 'Escape') { e.preventDefault(); back(); }
    if (e.key === ' ' && st.film && !/INPUT|BUTTON/.test(e.target.tagName)) { e.preventDefault(); st.film.playing = !st.film.playing; st.film.last = performance.now(); }
  }
  /** Atrás = paso anterior: cerrar panel → salir de la intención → volver a la elección (nunca a una «Home»). */
  function back() { if (st.panel) return closePanel(); if (st.intent !== 'clean') return setIntent('clean'); onBack(); }
  applyView(false); renderCtx();
  const api = { get state() { return { ...st, film: st.film ? { t: st.film.t, playing: st.film.playing } : null, annotations: shell.state.annotations || 0 }; }, setIntent, makeVideo, makeSheet, buildSheet, buildVideo, dims: dimsFor, bp, filmApply, FILM, TOTAL, get firma() { return FIRMA; }, get heroBoxes() { return titles.last; },
    setView(v, o = {}) { Object.assign(st, o); st.view = v; applyView(false); }, select(key) { st.selected = key; S.setSelected(key); openPanel('inspect'); },
    unmount() { stopFilm(false); titles.remove(); window.removeEventListener('keydown', onKey, true); shell.app.removeEventListener('click', onClick); shell.app.removeEventListener('input', onInput); catcher.remove(); } };
  return api;
}
