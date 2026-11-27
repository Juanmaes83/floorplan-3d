/* RUBIK SOTA · StoryLayersV1 · «Historia del cambio» (Entregar › P10). Diálogo modal sobre los núcleos puros
   js/story-layers-core.js (historia comprobada y trazable) y js/story-proposal-core.js (plantilla comercial, §7.3).
   Solo LEE la biblioteca (original y variante del mismo grupo) y guarda la historia y la propuesta en este navegador (clave
   propia, nunca dentro del proyecto). La identidad es la de «Mi estudio» (instantánea congelada de FloorPlanBrand); cada
   entrega elige qué campos muestra. «Previsualizar como cliente» dibuja LAS MISMAS páginas que luego se descargan: lo que se
   ve es lo que recibe el cliente (mismos bytes). La trazabilidad técnica (identificadores, rutas de campos y huellas) se
   descarga aparte como archivo interno; nunca entra en el ZIP del cliente. Al cerrar, Entregar recupera ficha, posición y
   foco (launch() del espacio de trabajo). */
(function () {
  'use strict';
  const S = window.FloorPlanStoryLayers, P = window.FloorPlanStoryProposal, Compare = window.FloorPlanRevisionCompare, A = window.FloorPlanStoryAssist;
  if (!S || !P || !Compare) return;
  const KEY = 'rubik-story-layers-v1', PKEY = 'rubik-story-proposal-v1';
  const L = (es, en, zh) => ({ es, en, zh })[typeof LANG === 'string' ? LANG : 'es'] || es;
  const lang = () => (typeof LANG === 'string' && ['es', 'en', 'zh'].includes(LANG) ? LANG : 'es');
  const docLang = () => (lang() === 'en' ? 'en' : 'es'); // el documento del cliente: español o inglés (nunca chino visible en ES/EN)
  const el = (tag, attrs = {}, parent = null, text = null) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) n.setAttribute(k, v); if (text !== null) n.textContent = text; if (parent) parent.append(n); return n; };
  const digest = async b => [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map(x => x.toString(16).padStart(2, '0')).join('');
  const shown = r => (window.FloorPlanDisplayName ? window.FloorPlanDisplayName(r.name, 'room') : r.id);
  const projName = n => (typeof nm === 'function' ? nm(n) : n) || '—';
  const mkStore = key => ({ all() { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } },
    get(k) { return this.all()[k] || null; }, set(k, v) { const a = this.all(); a[k] = v; try { localStorage.setItem(key, JSON.stringify(a)); return true; } catch { return false; } } });
  const store = mkStore(KEY), pstore = mkStore(PKEY);
  const STATE_TXT = () => ({ READY: L('Lista para entregar', 'Ready to deliver', '可交付'), INCOMPLETE: L('Pendiente de revisión', 'Pending review', '待审阅'), OBSOLETE: L('Obsoleta: el proyecto cambió', 'Out of date: the project changed', '已过期：项目已更改') });
  const DATA_STATE = () => ({ calculated: L('Calculado del proyecto', 'Calculated from the project', '根据项目计算'), absent: L('Ausente', 'Absent', '缺失') });
  const FIELD_TXT = () => ({ person: L('Persona de contacto', 'Contact person', '联系人'), phone: L('Teléfono', 'Phone', '电话'), email: L('Correo', 'Email', '邮箱'), web: L('Web', 'Website', '网站') });

  let dlg, ctx = null, pending = null;
  const app = () => window.FloorPlanApp;
  /* §7.2 · Vuelta contextual. Al salir de la historia hacia Diseñar se recuerda el par y el capítulo (solo en esta pestaña,
     sessionStorage). La barra «Volver a la historia» se ve en Diseñar mientras la variante del par está abierta. */
  const RKEY = 'rubik-story-return-v1', ID = /^[\w-]{1,96}$/;
  const ret = { get() { try { return JSON.parse(sessionStorage.getItem(RKEY) || 'null'); } catch { return null; } },
    set(v) { try { sessionStorage.setItem(RKEY, JSON.stringify(v)); } catch {} bar(); }, clear() { try { sessionStorage.removeItem(RKEY); } catch {} bar(); } };
  const STEPS = () => [L('Crear y editar variante', 'Create and edit a variant', '创建并编辑变体'), L('Revisar el cambio', 'Review the change', '审阅变化'), L('Descargar para el cliente', 'Download for the client', '下载给客户')];
  const identicalPair = pair => { try { return Compare.compare(pair.before.project, pair.after.project, { relation: 'library-variant' }).identical === true; } catch { return false; } };
  const IDENTICAL = () => L('Variante creada. Edita algo para mostrar el primer cambio.', 'Variant created. Edit something to show the first change.', '变体已创建。请编辑内容以显示第一个变化。');
  // La ficha P10 de Entregar: título, paso actual y UNA acción principal por estado (lo pinta professional-workspace-ui.js).
  function cardModel() {
    const a = app(), t = a?.storyTargets?.() || { state: 'no-library', pairs: [] }, o = a?.compareTargets?.()?.original, on = projName(o?.name || a?.entryInfo?.()?.name || '');
    const base = { steps: STEPS() };
    if (t.state === 'no-variant') return { ...base, state: 'no-variant', step: 1, status: L('Primer paso: crear una variante', 'First step: create a variant', '第一步：创建变体'),
      detail: L(`RUBIK abre la variante en Diseñar y conserva el original «${on}» sin cambios. Cambia lo que quieras proponer y vuelve a la historia desde la barra superior.`, `RUBIK opens the variant in Design and keeps the original «${on}» unchanged. Change what you want to propose and come back to the story from the top bar.`, `RUBIK 在设计中打开变体，并保持原始方案「${on}」不变。修改你要提议的内容，然后通过顶部栏返回说明。`),
      action: { label: L('Crear variante', 'Create variant', '创建变体'), run: ev => createVariant(ev) } };
    if (t.state !== 'ready') return { ...base, state: t.state, step: 1, status: t.state === 'no-library' ? L('Proyecto sin guardar en la biblioteca', 'Project not saved in the library', '项目未保存在项目库中') : L('Selección no comparable', 'Selection not comparable', '所选内容不可比较'),
      detail: t.state === 'no-library' ? L('La historia compara dos revisiones guardadas en este navegador. Guarda el proyecto para crear su variante.', 'The story compares two revisions saved in this browser. Save the project to create its variant.', '说明比较本浏览器中保存的两个版本。请保存项目以创建变体。') : L('Abre el original o una de sus variantes para preparar su historia.', 'Open the original or one of its variants to prepare its story.', '请打开原始方案或其变体以准备说明。'),
      action: { label: L('Abrir proyectos', 'Open projects', '打开项目'), run: () => document.getElementById('projectsBtn')?.click() } };
    const pair = t.pairs[0], vn = projName(pair.after.name);
    if (identicalPair(pair)) return { ...base, state: 'identical', step: 1, pair, status: IDENTICAL(),
      detail: L(`La variante «${vn}» es igual al original «${projName(pair.before.name)}». Ábrela en Diseñar, cambia un acabado, un mueble o la distribución, y vuelve a la historia.`, `The variant «${vn}» is identical to the original «${projName(pair.before.name)}». Open it in Design, change a finish, a piece of furniture or the layout, and come back to the story.`, `变体「${vn}」与原始方案「${projName(pair.before.name)}」相同。请在设计中打开它，修改材料、家具或布局，然后返回说明。`),
      action: { label: L('Editar variante', 'Edit variant', '编辑变体'), run: () => editVariant(pair, null) } };
    const saved = !!store.get(keyOf(pair));
    return { ...base, state: saved ? 'saved' : 'ready', step: saved ? 3 : 2, pair, status: saved ? L('Revisión guardada: falta previsualizar y descargar', 'Review saved: preview and download remain', '审阅已保存：尚需预览并下载') : L(`Cambios guardados en «${vn}» frente a «${projName(pair.before.name)}»`, `Changes saved in «${vn}» against «${projName(pair.before.name)}»`, `「${vn}」相对「${projName(pair.before.name)}」的已保存变化`),
      detail: L('RUBIK comprueba qué cambia y qué se conserva; tú añades el porqué y la decisión, y el cliente recibe exactamente lo que previsualizas.', 'RUBIK verifies what changes and what is kept; you add the why and the decision, and the client receives exactly what you preview.', 'RUBIK 核实变化与保留内容；你补充原因与决定，客户收到的与预览完全一致。'),
      action: { label: saved ? L('Continuar la historia', 'Continue the story', '继续说明') : L('Revisar el cambio', 'Review the change', '审阅变化'), run: () => open({ after: pair.after.id }) } };
  }
  function toDesign() { if (dlg?.open) dlg.close(); window.FloorPlanProfessionalUI?.close(); bar(); document.querySelector('[data-sl-return="back"]')?.focus(); }
  async function createVariant(ev) {
    const a = app(), orig = a.entryInfo(); const v = await a.createVariant(ev);
    ret.set({ before: orig.id, after: v.id, chapter: null }); toDesign();
  }
  // Antes de salir a Diseñar, lo escrito en la historia y la propuesta se guarda: al volver se recupera tal cual.
  function editVariant(pair, chapter) {
    if (ctx?.story && ctx.pair === pair) { ctx.saved = JSON.parse(JSON.stringify(ctx.story)); store.set(keyOf(pair), ctx.saved); pstore.set(keyOf(pair), JSON.parse(JSON.stringify(ctx.proposal))); }
    if (!app().openEntry(pair.after.id)) throw Error(L('No se ha podido abrir la variante.', 'The variant could not be opened.', '无法打开变体。'));
    ret.set({ before: pair.before.id, after: pair.after.id, chapter: chapter || null }); toDesign();
  }
  function bar() {
    const r = ret.get(), a = app(), cur = a?.entryInfo?.(), inDesign = !document.body.classList.contains('professional-area');
    let b = document.getElementById('storyReturn');
    const show = !!(r && cur && cur.id === r.after && inDesign && !document.body.classList.contains('presenting'));
    if (!show) { if (b) b.hidden = true; return; }
    const orig = a.entryInfo(r.before);
    if (!b) { b = el('div', { id: 'storyReturn', class: 'sl-return', role: 'region' }, document.body); }
    // §9 · Con la cabecera PERLA, la vuelta a la historia es LA vuelta contextual de la fila 2: no flota sobre el plano.
    const r2 = document.querySelector('.perla-r2');
    if (r2) { if (b.parentElement !== r2) r2.prepend(b); b.classList.add('sl-return-inline'); b.style.top = ''; b.style.left = ''; b.style.maxWidth = ''; }
    // Bajo los controles superiores del lienzo (cotas, norte): nunca encima de una acción.
    const tops = r2 ? [] : [...document.querySelectorAll('#stage > .perla-canvas-top, #stage > #solarNorth, #stage > .canvas-top')].filter(n => n.getClientRects().length).map(n => n.getBoundingClientRect().bottom);
    const st = r2 ? null : document.getElementById('stage')?.getBoundingClientRect(); if (!r2) b.style.top = Math.round(Math.max(st ? st.top : 0, ...tops) + 8) + 'px';
    if (r2) {} else if (st && innerWidth > 600) { b.style.left = Math.round(st.left + st.width / 2) + 'px'; b.style.maxWidth = Math.round(Math.min(760, st.width - 16)) + 'px'; } else { b.style.left = ''; b.style.maxWidth = ''; }
    const sig = [lang(), cur.id, cur.name, orig?.name].join('|'); b.hidden = false; if (b.dataset.sig === sig) { const bk = b.querySelector('[data-sl-return="back"]'); if (bk) bk.disabled = false; return; } b.dataset.sig = sig;
    b.setAttribute('aria-label', L('Historia del cambio', 'Story of the change', '变更说明')); b.replaceChildren();
    const full = L(`Editando la variante «${projName(cur.name)}» · el original «${projName(orig?.name || '')}» se conserva`, `Editing the variant «${projName(cur.name)}» · the original «${projName(orig?.name || '')}» is kept`, `正在编辑变体「${projName(cur.name)}」· 原始方案「${projName(orig?.name || '')}」保持不变`); const tx2 = el('span', { class: 'sl-return-txt', 'data-sl-return': 'text', title: full }, b, r2 ? undefined : full);
    // §9 en línea: frase completa aprobada donde cabe; en pantallas estrechas, la corta (la completa queda en el título).
    if (r2) { el('span', { class: 'sl-return-full' }, tx2, full); el('span', { class: 'sl-return-short' }, tx2, L(`Variante «${projName(cur.name)}»`, `Variant «${projName(cur.name)}»`, `变体「${projName(cur.name)}」`)); }
    const back = el('button', { type: 'button', class: 'btn primary', 'data-sl-return': 'back' }, b, L('Volver a la historia', 'Back to the story', '返回说明'));
    back.onclick = async ev => { back.disabled = true; try { await a.persistence.requireSaved(ev); } catch (e) { back.disabled = false; window.toast?.(e.message, 6000); return; }
      const r2 = ret.get(); ret.clear(); window.FloorPlanProfessionalUI?.open('deliver');
      await new Promise(res => requestAnimationFrame(res)); const opener = document.querySelector('[data-route="story-layers"]');
      opener?.scrollIntoView({ block: 'center' }); await open({ after: r2.after, chapter: r2.chapter, returnTo: opener }); };
    const x = el('button', { type: 'button', class: 'btn', 'data-sl-return': 'dismiss', 'aria-label': L('Ocultar el aviso; la historia sigue en Entregar', 'Hide; the story stays in Deliver', '隐藏；说明仍在交付中') }, b, '×');
    x.onclick = () => { ret.clear(); };
  }
  for (const ev of ['floorplan-project-switched', 'resize']) window.addEventListener(ev, () => bar());
  // El <body> puede no existir aún si una página carga este módulo en <head> sin defer (p. ej. la prueba F0.2b).
  const watchBody = () => new MutationObserver(() => bar()).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  if (document.body) watchBody(); else document.addEventListener('DOMContentLoaded', watchBody, { once: true });
  document.addEventListener('rubik:languagechange', () => queueMicrotask(bar));
  /* Desde el comparador (otra pestaña, solo lectura): «Preparar historia para el cliente» (?historia=antes~después) y
     «Editar variante» (?editar=antes~después). Se comprueba que el par existe y es original→variante; la dirección se limpia. */
  function boot() {
    const q = new URLSearchParams(location.search), mode = q.has('historia') ? 'historia' : q.has('editar') ? 'editar' : null; if (!mode) { bar(); return; }
    const [before, after] = String(q.get(mode)).split('~'); q.delete(mode);
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
    const a = app(), inf = ID.test(before || '') && ID.test(after || '') ? a?.entryInfo?.(after) : null;
    if (!inf || inf.variantOf !== before || !a.openEntry(after)) { window.toast?.(L('Ese par ya no está en la biblioteca de este navegador.', 'That pair is no longer in this browser’s library.', '该组合已不在本浏览器的项目库中。'), 6000); bar(); return; }
    if (mode === 'editar') { ret.set({ before, after, chapter: null }); return; }
    window.FloorPlanProfessionalUI?.open('deliver');
    requestAnimationFrame(() => open({ after, returnTo: document.querySelector('[data-route="story-layers"]') }));
  }
  const whenReady = fn => { if (document.documentElement.dataset.editorReady === 'true') return queueMicrotask(fn); const mo = new MutationObserver(() => { if (document.documentElement.dataset.editorReady === 'true') { mo.disconnect(); fn(); } }); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-editor-ready'] }); };
  whenReady(boot);
  function ensure() {
    if (dlg?.isConnected) return dlg;
    dlg = el('dialog', { id: 'storyLayersDialog', class: 'story-layers-dialog', 'aria-labelledby': 'slTitle' }, document.body);
    dlg.addEventListener('close', () => { const back = ctx?.returnTo; for (const u of ctx?.urls || []) URL.revokeObjectURL(u); ctx = null; if (back?.isConnected) back.focus({ preventScroll: true }); });
    return dlg;
  }
  async function pairs() { return window.FloorPlanApp?.storyTargets?.() || { state: 'no-library', pairs: [] }; }
  async function makeStory(pair) {
    const fb = await S.fingerprint(pair.before.project, digest), fa = await S.fingerprint(pair.after.project, digest);
    const refs = { before: { entryId: pair.before.id, fingerprint: fb }, after: { entryId: pair.after.id, fingerprint: fa } };
    const matShown = m => (window.FloorPlanDisplayName ? window.FloorPlanDisplayName(m.name, 'material') : m.id) || m.id;
    const story = S.build({ before: pair.before.project, after: pair.after.project, refs, relation: 'library-variant', name: shown, material: matShown, lang: lang(),
      labels: { before: projName(pair.before.name), after: projName(pair.after.name) } });
    return { story, current: { before: fb, after: fa } };
  }
  const keyOf = p => p.before.id + '→' + p.after.id;

  // Las dos plantas con el MISMO encuadre (planSvg del comparador) y los rótulos numerados en el punto exacto del elemento.
  function chapterSvg(comparison, pair, ch, side, title) {
    const svg = Compare.planSvg(comparison, side, side === 'before' ? pair.before.project : pair.after.project, { title });
    const [, , w, h] = comparison.perspective.viewBox, r = Math.max(w, h) / 45;
    const marks = ch.data.map((d, i) => [d, i]).filter(([d]) => d.anchor && d.anchor.side === side)
      .map(([d, i]) => `<g class="sl-callout" data-callout="${ch.id}:${d.id}" data-anchor="${d.anchor.kind}:${d.anchor.id}"><circle cx="${d.anchor.x}" cy="${d.anchor.y}" r="${r}" fill="#b5653a" stroke="#fff" stroke-width="${r / 5}"/><text x="${d.anchor.x}" y="${d.anchor.y}" dy="${r * .35}" text-anchor="middle" font-size="${r * 1.1}" font-family="sans-serif" fill="#fff">${i + 1}</text></g>`);
    return svg.replace('</svg>', marks.join('') + '</svg>');
  }

  /* ---------- Propuesta (identidad de Mi estudio + texto del profesional + notas) ---------- */
  const snapshot = () => window.FloorPlanBrandUI?.snapshot?.() || null;
  function budgetCompare() {
    // Importes SOLO de presupuestos guardados de estas dos revisiones (Presupuestar › guardar), por el comparador trazable.
    let saved = {}; try { saved = JSON.parse(localStorage.getItem('rubik-budget-v1')) || {}; } catch { }
    const RB = window.FloorPlanRevisionBudget, B = window.FloorPlanBudgetCore || window.FloorPlanBudget, parse = x => { try { return x && B?.parseBudget ? B.parseBudget(JSON.stringify(x)) : null; } catch { return null; } };
    const b = parse(saved[ctx.pair.before.project.id]), a = parse(saved[ctx.pair.after.project.id]);
    if (!RB || (!b && !a)) return null;
    try { return RB.compareBudgets({ comparison: ctx.comparison, beforeProject: ctx.pair.before.project, afterProject: ctx.pair.after.project, beforeBudget: b, afterBudget: a }); } catch { return { totals: { status: 'incoherent' } }; }
  }
  function baseDoc() {
    const id = P.identity(snapshot(), ctx.proposal.contact, docLang());
    return P.document({ story: ctx.story, proposal: ctx.proposal, identity: id, facts: P.facts(ctx.story, docLang()), cost: P.cost(budgetCompare(), docLang()),
      lang: docLang(), projectName: projName(ctx.pair.before.name), chapterText: ch => S.textOf(ctx.story, ch) });
  }
  function clientDoc() { const d = baseDoc(); d.views = chosenViews(); return d; }

  /* ---------- §8.2 · Medios del proyecto: vistas preparadas y vídeo del recorrido, con su estado ---------- */
  const MEDIA_TXT = () => ({ current: L('Vigente: de la revisión de la propuesta', 'Current: from the proposal revision', '有效：来自提案版本'), stale: L('Obsoleto: el proyecto cambió desde que se preparó', 'Out of date: the project changed since it was prepared', '已过期：准备后项目已更改'),
    'other-entry': L('De otro proyecto abierto: abre la variante para prepararlo', 'From another open project: open the variant to prepare it', '来自另一个打开的项目：请打开变体后准备'), absent: L('Ausente', 'Absent', '缺失') });
  function mediaInfo() {
    const V = window.FloorPlanProjectViews, a = app(), active = a?.entryInfo?.()?.id || null, afterId = ctx.pair.after.id;
    const storyObsolete = !!ctx.current && ctx.story.revisions.after.fingerprint !== ctx.current.after;
    const vs = V ? V.status() : 'none', vid = window.FloorPlanTourVideo?.result || null;
    const rev = (() => { try { return window.FloorPlanGuide?.revision?.(a.project) ?? null; } catch { return null; } })();
    return { views: { state: P.mediaState({ exists: vs === 'ready' || vs === 'stale', entryId: active, afterId, current: vs === 'ready', storyObsolete }), status: vs, items: vs === 'ready' && active === afterId ? V.current() : [] },
      video: { state: P.mediaState({ exists: !!vid, entryId: vid?.entryId ?? active, afterId, current: !!vid && vid.revision === rev, storyObsolete }), result: vid } };
  }
  const chosenViews = () => { const m = mediaInfo(); if (m.views.state !== 'current') return []; return ctx.proposal.media.views.map(id => m.views.items.find(v => v.id === id)).filter(Boolean).map(v => ({ id: v.id, label: v.label, dataUrl: v.dataUrl })); };
  const chosenVideo = () => { const m = mediaInfo(); return ctx.proposal.media.video && m.video.state === 'current' ? m.video.result : null; };
  // Lo elegido que ya no está vigente o no existe: bloquea la entrega y se dice por qué.
  function mediaProblems() { const m = mediaInfo(), out = [];
    if (ctx.proposal.media.views.length && (m.views.state !== 'current' || ctx.proposal.media.views.some(id => !m.views.items.some(v => v.id === id)))) out.push(L('Una vista elegida ya no es de la revisión de la propuesta: vuelve a prepararla o quítala.', 'A chosen view no longer belongs to the proposal revision: prepare it again or remove it.', '所选视图已不属于提案版本：请重新准备或移除。'));
    if (ctx.proposal.media.video && m.video.state !== 'current') out.push(L('El vídeo elegido no es de la revisión de la propuesta: vuelve a grabarlo o quítalo.', 'The chosen video is not from the proposal revision: record it again or remove it.', '所选视频不属于提案版本：请重新录制或移除。'));
    return out; }
  const mediaKey = () => { const v = chosenVideo(); return JSON.stringify([chosenViews().map(x => x.id + ':' + x.dataUrl.length), v ? v.blob.size + ':' + v.revision : null]); };

  /* ---------- Páginas del cliente: una sola función de dibujo para la vista previa y para el archivo ---------- */
  const PW = 1754, PH = 1240, M = 96, HEAD = 128, FOOT = 70, BODY = PH - HEAD - FOOT - 40, CW = PW - 2 * M;
  const FONT = { h1: ['700 46px sans-serif', 58, '#1f2326'], h2: ['700 32px sans-serif', 42, '#1f2326'], h3: ['600 25px sans-serif', 34, '#3a3d40'], p: ['24px sans-serif', 34, '#2b2f33'],
    pend: ['italic 24px sans-serif', 34, '#8a5a00'], li: ['24px sans-serif', 34, '#2b2f33'], note: ['italic 23px sans-serif', 32, '#4d5257'], small: ['20px sans-serif', 28, '#5b6066'] };
  function items(doc, g) {
    const out = [], measure = f => s => { g.font = f; return g.measureText(s).width; };
    const text = (kind, s, { indent = 0, bullet = '', pad = 10 } = {}) => { const [f, lh] = FONT[kind]; const lines = P.wrap(s, CW - indent - (bullet ? 34 : 0), measure(f));
      out.push({ kind, lines, lh, pad, indent, bullet, h: lines.length * lh + pad, content: s, keep: kind === 'h1' || kind === 'h2' || kind === 'h3' }); };
    const fig = ch => out.push({ kind: 'figure', chapterId: ch.id, h: 470, content: ch.title });
    const L2 = doc.labels, hero = doc.chapters.find(c => c.id === doc.hero);
    text('h1', doc.title, { pad: 14 }); if (doc.client && doc.client.addressee) text('h3', L('Para', 'For', '致') + ': ' + doc.client.addressee, { pad: 8 }); text('p', doc.summary, { pad: 22 });
    if (hero) { text('h2', L2.where, { pad: 8 }); fig(hero); }
    text('h3', L2.changes, { pad: 4 }); for (const s of doc.facts.changes) text('li', s, { bullet: '•' });
    text('h3', L2.kept, { pad: 4 }); for (const s of doc.facts.kept) text('li', s, { bullet: '•' });
    if (doc.client && doc.client.requests.length) { text('h3', L('Lo que nos indicó', 'What you told us', '您的要求'), { pad: 4 }); for (const r of doc.client.requests) text('li', r, { bullet: '•' }); }
    if (doc.views && doc.views.length) { text('h2', L('Vistas de la propuesta', 'Views of the proposal', '提案视图'), { pad: 8 }); for (const v of doc.views) out.push({ kind: 'image', src: v.dataUrl, h: 640, content: v.label, caption: L('Propuesta', 'Proposal', '提案') + ' · ' + v.label }); }
    doc.chapters.forEach((ch, i) => {
      if (ch !== hero) { text('h2', ch.title, { pad: 8 }); fig(ch); }
      else text('h2', ch.title, { pad: 8 });
      if (ch.text) text('p', ch.text, { pad: 12 });
      for (const d of ch.data) text('li', `${d.n}. ${d.text}`, { bullet: '' });
      for (const n of ch.notes) text('note', `${L2.note}: ${n}`, { pad: 12 });
    });
    for (const s of doc.sections) {
      text('h2', s.title, { pad: 6 });
      if (s.key === 'cost') { for (const l of s.lines) text('li', l, { bullet: '•' }); for (const l of s.pending) text('pend', l, { bullet: '•' }); }
      else text(s.pending ? 'pend' : 'p', s.text, { pad: 18 });
    }
    if (doc.generalNotes.length) { text('h2', L2.notes, { pad: 6 }); for (const n of doc.generalNotes) text('note', n, { bullet: '•' }); }
    return out;
  }
  async function drawFigure(g, chId, x, y, w, h) {
    const ch = ctx.story.chapters.find(c => c.id === chId), half = (w - 24) / 2, L2 = clientLabels();
    for (const [i, side] of ['before', 'after'].entries()) {
      g.fillStyle = '#fbfaf7'; g.fillRect(x + i * (half + 24), y, half, h);
      const url = URL.createObjectURL(new Blob([chapterSvg(ctx.comparison, ctx.pair, ch, side, '')], { type: 'image/svg+xml' }));
      try { const img = new Image(); img.src = url; await img.decode(); const k = Math.min((half - 20) / img.width, (h - 60) / img.height);
        g.drawImage(img, x + i * (half + 24) + (half - img.width * k) / 2, y + 48 + (h - 60 - img.height * k) / 2, img.width * k, img.height * k); } finally { URL.revokeObjectURL(url); }
      g.fillStyle = '#1f2326'; g.font = '700 26px sans-serif'; g.fillText(side === 'before' ? L2.current : L2.proposal, x + i * (half + 24) + 16, y + 34);
    }
  }
  const clientLabels = () => docLang() === 'en' ? { current: 'Current state', proposal: 'Proposal' } : { current: 'Estado actual', proposal: 'Propuesta' };
  async function loadImage(src) { const img = new Image(); img.src = src; await img.decode(); return img; }
  async function renderPages(doc) {
    const probe = document.createElement('canvas').getContext('2d'), pages = P.flow(items(doc, probe), BODY), out = [];
    const logo = doc.identity.logo ? await loadImage(doc.identity.logo).catch(() => null) : null;
    for (const [pi, page] of pages.entries()) {
      const cv = document.createElement('canvas'); cv.width = PW; cv.height = PH; const g = cv.getContext('2d');
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, PW, PH);
      // Cabecera: identidad de Mi estudio (nombre, logo y SOLO el contacto elegido) o nada si no hay identidad.
      let hx = M;
      if (logo) { const k = Math.min(80 / logo.width, 80 / logo.height); g.drawImage(logo, M, 28, logo.width * k, logo.height * k); hx = M + logo.width * k + 20; }
      if (doc.identity.present) { g.fillStyle = '#1f2326'; g.font = '700 30px sans-serif'; g.fillText(doc.identity.name, hx, 62); g.fillStyle = '#5b6066'; g.font = '21px sans-serif'; g.fillText([doc.identity.tagline, doc.identity.contact].filter(Boolean).join(' · ').slice(0, 160), hx, 96); }
      g.fillStyle = '#d9d4cb'; g.fillRect(M, HEAD - 8, CW, 2);
      for (const it of page) {
        const y = HEAD + 24 + it.y;
        if (it.kind === 'figure') { await drawFigure(g, it.chapterId, M, y, CW, it.h - 10); continue; }
        if (it.kind === 'image') { const img = await loadImage(it.src), bh = it.h - 56, k = Math.min(CW / img.width, bh / img.height), w = img.width * k, h = img.height * k;
          g.drawImage(img, M + (CW - w) / 2, y, w, h); g.font = FONT.small[0]; g.fillStyle = FONT.small[2]; g.fillText(it.caption, M + (CW - w) / 2, y + h + 30); continue; }
        const [f, lh, col] = FONT[it.kind]; g.font = f; g.fillStyle = col;
        it.lines.forEach((ln, i) => { const x = M + it.indent + (it.bullet ? 34 : 0); if (i === 0 && it.bullet && !it.cont) g.fillText(it.bullet, M + it.indent + 8, y + lh * (i + 1) - 8); g.fillText(ln, x, y + lh * (i + 1) - 8); });
      }
      g.fillStyle = '#d9d4cb'; g.fillRect(M, PH - FOOT, CW, 1); g.fillStyle = '#5b6066'; g.font = '20px sans-serif'; g.fillText(doc.credit, M, PH - FOOT + 36);
      const pg = doc.page(pi + 1, pages.length); g.fillText(pg, PW - M - g.measureText(pg).width, PH - FOOT + 36);
      const blob = await new Promise(r => cv.toBlob(r, 'image/png')), bytes = new Uint8Array(await blob.arrayBuffer());
      out.push({ file: `propuesta/${String(pi + 1).padStart(2, '0')}-${pi === 0 ? 'portada' : 'pagina'}.png`, bytes, sha256: await digest(bytes), content: page.filter(x => x.kind === 'h1' || x.kind === 'h2' || x.kind === 'figure' || x.kind === 'image').map(x => x.content), cont: page.some(x => x.cont) });
    }
    return out;
  }
  // Cuántas imágenes tendrá el archivo (el mismo reparto en páginas que el dibujo, sin dibujar).
  function expectedPages() { try { return P.flow(items(clientDoc(), document.createElement('canvas').getContext('2d')), BODY).length; } catch { return 0; } }
  // Qué se previsualizó: si cambia la historia, la propuesta o la identidad, la vista previa deja de valer.
  const previewKey = () => JSON.stringify([ctx.story, ctx.proposal, mediaKey(), P.identity(snapshot(), ctx.proposal.contact, docLang()), budgetCompare()?.totals?.status || 'none']);

  /* ---------- Estado y textos de progreso ---------- */
  function status() {
    const r = S.readiness(ctx.story, { current: ctx.current, media: ctx.media, saved: ctx.saved });
    const savedProp = JSON.stringify(ctx.proposal) === JSON.stringify(ctx.proposalSaved || null);
    const fresh = !!ctx.pages.length && ctx.pagesKey === previewKey();
    const mp = mediaProblems(), ok = r.state === 'READY' && savedProp && fresh && !mp.length;
    const why = r.obsolete ? L('La historia es de otra revisión del proyecto: pulsa «Rehacer con las revisiones actuales».', 'The story belongs to another revision: press «Rebuild with the current revisions».', '故事属于另一个版本：请点击「使用当前版本重新生成」。')
      : !ctx.saved || !savedProp || JSON.stringify(ctx.story) !== JSON.stringify(ctx.saved) ? L('Guarda la revisión para fijar lo que vas a entregar.', 'Save the review to fix what you will deliver.', '请保存审阅以确定交付内容。')
      : mp.length ? mp[0] : !fresh ? L('Previsualiza como cliente: el archivo es exactamente lo que ves.', 'Preview as the client: the file is exactly what you see.', '请以客户视角预览：文件与所见完全一致。') : '';
    const total = fresh ? ctx.pages.length : expectedPages();
    const progress = `${ctx.saved && savedProp ? L('Revisión guardada', 'Review saved', '审阅已保存') : L('Revisión sin guardar', 'Review not saved', '审阅未保存')} · ${fresh ? ctx.pages.length : 0} ${L('de', 'of', '/')} ${total} ${L('imágenes listas', 'images ready', '张图片就绪')}`;
    return { r, ok, why, progress, fresh, savedProp };
  }
  function refresh() {
    const st = status(), b = dlg.querySelector('[data-sl="state"]');
    if (b) { b.dataset.state = st.r.state; b.className = 'sl-state sl-' + st.r.state.toLowerCase(); b.firstChild.textContent = STATE_TXT()[st.r.state]; }
    const pr = dlg.querySelector('[data-sl="progress"]'); if (pr) pr.textContent = st.progress;
    const why = dlg.querySelector('[data-sl="why"]'); if (why) { why.textContent = st.why; why.hidden = !st.why; }
    const dl = dlg.querySelector('[data-sl="download"]'); if (dl) dl.disabled = !st.ok;
    const pv = dlg.querySelector('[data-sl="images"]'); if (pv) pv.disabled = st.r.obsolete;
  }

  /* ---------- Diálogo ---------- */
  function render() {
    const d = ensure(); d.replaceChildren();
    const head = el('header', { class: 'sl-head' }, d);
    el('h2', { id: 'slTitle' }, head, L('Historia del cambio', 'Story of the change', '变更说明'));
    const close = el('button', { type: 'button', class: 'btn', 'data-sl': 'close' }, head, L('Cerrar', 'Close', '关闭')); close.onclick = () => d.close();
    el('p', { class: 'sl-lead' }, d, L('Explica al cliente qué propones, dónde y por qué, con los cambios que RUBIK comprueba entre el original y la variante.', 'Explain to the client what you propose, where and why, with the changes RUBIK verifies between the original and the variant.', '向客户说明你提议的内容、位置和原因，并附上 RUBIK 在原始方案与变体之间核实的变化。'));
    if (!ctx.pair) {
      el('p', { class: 'sl-empty', role: 'status' }, d, { 'no-variant': L('Primer paso: crea una variante. RUBIK la abre en Diseñar y conserva el original.', 'First step: create a variant. RUBIK opens it in Design and keeps the original.', '第一步：创建变体。RUBIK 会在设计中打开它并保留原始方案。'),
        'no-library': L('Guarda el proyecto en la biblioteca para tener dos revisiones que comparar.', 'Save the project in the library to have two revisions to compare.', '请将项目保存到项目库，以便比较两个版本。'),
        'not-eligible': L('Abre el original o una de sus variantes.', 'Open the original or one of its variants.', '请打开原始方案或其变体。') }[ctx.targets.state] || '—');
      const m = cardModel(); const go = el('button', { type: 'button', class: 'btn primary', 'data-sl': 'empty-action' }, d, m.action.label);
      go.onclick = async ev => { try { await m.action.run(ev); } catch (e) { window.toast?.(e.message, 6000); } };
      return;
    }
    const stepNow = !ctx.identical ? (ctx.saved ? 3 : 2) : 1, so = el('ol', { class: 'sl-steps', 'data-sl': 'steps' }, d);
    STEPS().forEach((t, i) => { const li = el('li', i + 1 === stepNow ? { 'aria-current': 'step' } : i + 1 < stepNow ? { 'data-done': 'true' } : {}, so, t);
      if (i === 0) { const ev = el('button', { type: 'button', class: 'btn', 'data-sl': 'edit-variant' }, li, L('Editar variante', 'Edit variant', '编辑变体')); ev.onclick = () => editVariant(ctx.pair, ctx.chapter); } });
    el('p', { class: 'sl-pairname', 'data-sl': 'pairname' }, d, L(`Original «${projName(ctx.pair.before.name)}» → variante «${projName(ctx.pair.after.name)}»`, `Original «${projName(ctx.pair.before.name)}» → variant «${projName(ctx.pair.after.name)}»`, `原始方案「${projName(ctx.pair.before.name)}」→ 变体「${projName(ctx.pair.after.name)}」`));
    if (ctx.targets.pairs.length > 1) {
      const lab = el('label', { class: 'sl-pair' }, d, L('Variante: ', 'Variant: ', '变体：'));
      const sel = el('select', { 'data-sl': 'pair' }, lab);
      ctx.targets.pairs.forEach((p, i) => { const o = el('option', { value: String(i) }, sel, projName(p.after.name)); if (p === ctx.pair) o.selected = true; });
      sel.onchange = async () => { ctx.pair = ctx.targets.pairs[+sel.value]; ctx.pages = []; await load(); render(); };
    }
    if (ctx.identical) { el('p', { class: 'sl-empty', role: 'status', 'data-sl': 'identical' }, d, IDENTICAL()); d.querySelector('[data-sl="edit-variant"]')?.classList.add('primary'); return; }
    const st = status();
    const banner = el('p', { class: 'sl-state sl-' + st.r.state.toLowerCase(), role: 'status', 'data-sl': 'state', 'data-state': st.r.state }, d, STATE_TXT()[st.r.state]);
    if (st.r.obsolete) { banner.append(' · ' + L('Revísala antes de entregarla como vigente.', 'Review it before delivering it as current.', '请在作为最新版本交付前审阅。'));
      const regen = el('button', { type: 'button', class: 'btn primary', 'data-sl': 'regenerate' }, d, L('Rehacer con las revisiones actuales', 'Rebuild with the current revisions', '使用当前版本重新生成')); regen.onclick = async () => { const keep = ctx.proposal; ctx.saved = null; ctx.media = {}; ctx.pages = []; await load(true); ctx.proposal = P.normalize(keep, { chapterIds: ctx.story.order }); render(); d.querySelector('[data-sl="save"]')?.focus(); };
      el('p', { class: 'sl-how' }, d, L('Rehacer vuelve a comprobar el cambio con las revisiones guardadas ahora. Tu propuesta (título, textos y notas) se conserva; después, guarda la revisión y previsualiza de nuevo.', 'Rebuilding checks the change again with the revisions saved now. Your proposal (title, texts and notes) is kept; then save the review and preview again.', '重新生成会用当前保存的版本再次核实变化。你的提案（标题、文字和备注）会保留；之后请保存审阅并重新预览。')); }
    el('p', { class: 'sl-progress', 'data-sl': 'progress', role: 'status' }, d, st.progress);

    // 1) Lo que RUBIK comprueba (capítulos revisables; datos con su trazabilidad para el profesional).
    el('h3', { class: 'sl-step' }, d, L('Revisar el cambio · lo que RUBIK comprueba', 'Review the change · what RUBIK verifies', '审阅变化 · RUBIK 核实的内容'));
    el('p', { class: 'sl-frame' }, d, L('Misma planta, mismo encuadre y misma escala para las dos revisiones.', 'Same plan, framing and scale for both revisions.', '两个版本使用相同平面、取景和比例。'));
    const list = el('ol', { class: 'sl-chapters' }, d);
    S.ordered(ctx.story).forEach((ch, idx, arr) => {
      const li = el('li', { class: 'sl-chapter', 'data-chapter': ch.id }, list); li.addEventListener('focusin', () => { ctx.chapter = ch.id; });
      el('h4', {}, li, ch.title);
      const fig = el('div', { class: 'sl-figure' }, li), lab = clientLabels();
      for (const side of ['before', 'after']) { const f = el('figure', { 'data-side': side }, fig); f.innerHTML = chapterSvg(ctx.comparison, ctx.pair, ch, side, ''); el('figcaption', {}, f, side === 'before' ? lab.current : lab.proposal); }
      const ta = el('textarea', { rows: '2', 'aria-label': L('Texto del capítulo', 'Chapter text', '章节文字') + ' · ' + ch.title, 'data-sl': 'text' }, li); ta.value = S.textOf(ctx.story, ch);
      ta.onchange = () => { ctx.story = S.edit(ctx.story, { texts: { [ch.id]: ta.value } }); refresh(); };
      const tb = el('table', { class: 'sl-data' }, li), hr = el('tr', {}, el('thead', {}, tb));
      const heads = [L('Nº', 'No.', '序号'), L('Dato', 'Datum', '数据'), L('Valor', 'Value', '数值'), L('Fuente', 'Source', '来源'), L('Revisión', 'Revision', '版本'), L('Estado', 'State', '状态')];
      for (const h of heads) el('th', { scope: 'col' }, hr, h);
      const td = (tr, i, text) => el('td', { 'data-label': heads[i] }, tr, text);
      const bd = el('tbody', {}, tb);
      ch.data.forEach((x, i) => { const tr = el('tr', { 'data-datum': x.id, 'data-state': x.state }, bd); td(tr, 0, String(i + 1)); td(tr, 1, x.label);
        td(tr, 2, x.value === null ? DATA_STATE().absent : `${x.value} ${x.unit}`); td(tr, 3, x.source.field);
        td(tr, 4, `${x.revision.side === 'before' ? L('antes', 'before', '之前') : L('después', 'after', '之后')} · ${x.revision.fingerprint.slice(0, 8)}`); td(tr, 5, DATA_STATE()[x.state]); });
      const mv = el('div', { class: 'sl-move' }, li);
      const up = el('button', { type: 'button', class: 'btn', 'data-sl': 'up', 'aria-label': L('Subir', 'Move up', '上移') + ' · ' + ch.title }, mv, '↑'); up.disabled = idx === 0;
      const dn = el('button', { type: 'button', class: 'btn', 'data-sl': 'down', 'aria-label': L('Bajar', 'Move down', '下移') + ' · ' + ch.title }, mv, '↓'); dn.disabled = idx === arr.length - 1;
      const swap = k => { const o = [...ctx.story.order]; [o[idx], o[idx + k]] = [o[idx + k], o[idx]]; ctx.story = S.edit(ctx.story, { order: o }); render(); d.querySelector(`[data-chapter="${ch.id}"] [data-sl="${k < 0 ? 'up' : 'down'}"]`)?.focus(); };
      up.onclick = () => swap(-1); dn.onclick = () => swap(1);
      if (A) assistBox(li, ch);
    });

    // 2) La propuesta: identidad de Mi estudio, texto del profesional y notas con visibilidad explícita.
    el('h3', { class: 'sl-step' }, d, L('Revisar el cambio · tu propuesta para el cliente', 'Review the change · your proposal for the client', '审阅变化 · 给客户的提案'));
    const pv = el('section', { class: 'sl-proposal', 'data-sl': 'proposal' }, d), snap = snapshot();
    const idBox = el('fieldset', { class: 'sl-identity' }, pv); el('legend', {}, idBox, L('Quién propone el cambio', 'Who proposes the change', '谁提出变更'));
    if (!snap) el('p', { 'data-sl': 'no-identity' }, idBox, L('Sin identidad de estudio para este proyecto: la propuesta saldrá sin nombre ni logo. Configúrala en «Mi estudio» si quieres firmarla.', 'No studio identity for this project: the proposal will go out without name or logo. Set it up in «My studio» to sign it.', '该项目没有工作室身份：提案将不带名称或标志。如需署名，请在「我的工作室」中设置。'));
    else {
      el('p', { class: 'sl-id-name' }, idBox, snap.profile.name);
      const lg = el('label', { class: 'sl-check' }, idBox); const lc = el('input', { type: 'checkbox', 'data-sl': 'id-logo' }, lg); lc.checked = ctx.proposal.contact.logo !== false; lg.append(' ' + L('Logo', 'Logo', '标志'));
      lc.disabled = !snap.profile.logo; lc.onchange = () => setProp({ contact: { ...ctx.proposal.contact, logo: lc.checked } });
      for (const f of P.CONTACT) { if (!snap.profile[f]) continue; const lb = el('label', { class: 'sl-check' }, idBox), cb = el('input', { type: 'checkbox', 'data-sl': 'id-' + f }, lb); cb.checked = ctx.proposal.contact.fields.includes(f);
        lb.append(` ${FIELD_TXT()[f]}: ${f === 'web' ? snap.profile.web.replace(/^https?:\/\//, '') : snap.profile[f]}`);
        cb.onchange = () => setProp({ contact: { ...ctx.proposal.contact, fields: cb.checked ? [...ctx.proposal.contact.fields, f] : ctx.proposal.contact.fields.filter(x => x !== f) } }); }
    }
    clientBox(pv);
    const doc0 = clientDoc();
    const field = (key, label, rows, placeholder) => { const lb = el('label', { class: 'sl-field' }, pv, label), ta = el(rows ? 'textarea' : 'input', { 'data-sl': 'p-' + key, ...(rows ? { rows: String(rows) } : { type: 'text' }), placeholder, maxlength: String(P.LIMITS[key]) }, lb);
      ta.value = ctx.proposal[key]; ta.onchange = () => setProp({ [key]: ta.value }); };
    field('title', L('Título', 'Title', '标题'), 0, doc0.title);
    field('summary', L('Qué se propone y dónde (resumen)', 'What is proposed and where (summary)', '提议内容与位置（摘要）'), 3, doc0.summary);
    field('why', L('Por qué y qué mejora busca', 'Why and what it aims to improve', '原因及改善目标'), 3, L('Criterio, motivos, objetivo; opciones consideradas…', 'Criteria, reasons, goal; options considered…', '标准、原因、目标；考虑过的方案…'));
    field('how', L('Cómo se haría y qué implica', 'How it would be done and what it involves', '实施方式及影响'), 3, L('Alcance, método, remates, dependencias, decisiones pendientes…', 'Scope, method, finishing, dependencies, pending decisions…', '范围、方法、收口、依赖、待定事项…'));
    field('decision', L('Qué debe decidir el cliente ahora', 'What the client should decide now', '客户现在需要决定的事项'), 2, L('Por ejemplo: aprobar la propuesta para pedir muestras.', 'For example: approve the proposal to order samples.', '例如：批准提案以订购样品。'));
    const cost = doc0.sections.find(s => s.key === 'cost');
    const cb = el('div', { class: 'sl-cost', 'data-sl': 'cost', 'data-status': cost.status }, pv); el('strong', {}, cb, L('Coste (del presupuesto guardado): ', 'Cost (from the saved budget): ', '成本（来自已保存预算）：'));
    for (const l of [...cost.lines, ...cost.pending]) el('div', {}, cb, l);
    mediaBox(pv);
    // Notas: generales o de un capítulo, con visibilidad elegida. Las internas no salen nunca hacia el cliente.
    const nb = el('fieldset', { class: 'sl-notes', 'data-sl': 'notes' }, pv); el('legend', {}, nb, L('Notas', 'Notes', '备注'));
    ctx.proposal.notes.forEach((n, i, arr) => {
      const row = el('div', { class: 'sl-note', 'data-note': n.id, 'data-visibility': n.visibility }, nb);
      const ta = el('textarea', { rows: '2', 'data-sl': 'note-text', 'aria-label': L('Texto de la nota', 'Note text', '备注内容') + ' ' + (i + 1) }, row); ta.value = n.text;
      ta.onchange = () => setNotes(ns => ns.map(x => x.id === n.id ? { ...x, text: ta.value } : x));
      const vis = el('select', { 'data-sl': 'note-visibility', 'aria-label': L('Visibilidad', 'Visibility', '可见性') }, row);
      for (const [v, t] of [['client', L('Para el cliente', 'For the client', '给客户')], ['internal', L('Interna', 'Internal', '内部')]]) { const o = el('option', { value: v }, vis, t); o.selected = n.visibility === v; }
      vis.onchange = () => { row.dataset.visibility = vis.value; setNotes(ns => ns.map(x => x.id === n.id ? { ...x, visibility: vis.value } : x)); };
      const an = el('select', { 'data-sl': 'note-anchor', 'aria-label': L('Dónde va', 'Where it goes', '位置') }, row);
      for (const [v, t] of [['general', L('Nota general', 'General note', '一般备注')], ...ctx.story.order.map(cid => ctx.story.chapters.find(c => c.id === cid)).filter(c => c.kind !== 'overview').map(c => [c.id, c.title])]) { const o = el('option', { value: v }, an, t); o.selected = (n.anchor.kind === 'general' ? 'general' : n.anchor.id) === v; }
      an.onchange = () => setNotes(ns => ns.map(x => x.id === n.id ? { ...x, anchor: an.value === 'general' ? { kind: 'general', id: null } : { kind: 'chapter', id: an.value } } : x));
      const upn = el('button', { type: 'button', class: 'btn', 'data-sl': 'note-up', 'aria-label': L('Subir nota', 'Move note up', '上移备注') }, row, '↑'); upn.disabled = i === 0;
      const dnn = el('button', { type: 'button', class: 'btn', 'data-sl': 'note-down', 'aria-label': L('Bajar nota', 'Move note down', '下移备注') }, row, '↓'); dnn.disabled = i === arr.length - 1;
      const mvn = k => setNotes(ns => { const o = [...ns]; [o[i], o[i + k]] = [o[i + k], o[i]]; return o; }, true);
      upn.onclick = () => mvn(-1); dnn.onclick = () => mvn(1);
      const del = el('button', { type: 'button', class: 'btn', 'data-sl': 'note-delete' }, row, L('Quitar', 'Remove', '删除')); del.onclick = () => setNotes(ns => ns.filter(x => x.id !== n.id), true);
    });
    const add = el('button', { type: 'button', class: 'btn', 'data-sl': 'note-add' }, nb, L('Añadir nota', 'Add note', '添加备注'));
    add.onclick = () => { const id = 'nota-' + Date.now().toString(36).slice(-8); setNotes(ns => [...ns, { id, text: L('Nota', 'Note', '备注'), visibility: 'internal', anchor: { kind: 'general', id: null } }], true); dlg.querySelector(`[data-note="${id}"] textarea`)?.focus(); };

    // 3) Previsualizar como cliente (mismas páginas que el archivo) y descargar.
    el('h3', { class: 'sl-step' }, d, L('Descargar para el cliente · previsualiza primero', 'Download for the client · preview first', '下载给客户 · 先预览'));
    const prev = el('section', { class: 'sl-preview', 'data-sl': 'preview', 'aria-label': L('Vista previa del cliente', 'Client preview', '客户预览') }, d);
    if (st.fresh) { ctx.pages.forEach((p, i) => { const u = URL.createObjectURL(new Blob([p.bytes], { type: 'image/png' })); ctx.urls.push(u); el('img', { src: u, alt: L('Página', 'Page', '页') + ' ' + (i + 1), 'data-page': String(i + 1) }, prev); });
      for (const a of ctx.attach || []) { const u = URL.createObjectURL(new Blob([a.bytes], { type: a.type })); ctx.urls.push(u); el('video', { src: u, controls: '', preload: 'metadata', 'data-attachment': a.file, 'aria-label': a.content[0] }, prev); }
      const back = el('button', { type: 'button', class: 'btn', 'data-sl': 'edit' }, prev, L('Volver a editar', 'Back to editing', '返回编辑')); back.onclick = () => dlg.querySelector('[data-sl="p-title"]')?.focus(); }
    el('p', { class: 'sl-why', 'data-sl': 'why', hidden: st.why ? null : '' }, d, st.why);
    el('p', { class: 'sl-includes' }, d, L('El archivo incluye las páginas de la propuesta (PNG) y un índice legible. No incluye notas internas ni datos técnicos.', 'The file includes the proposal pages (PNG) and a readable index. It does not include internal notes or technical data.', '文件包含提案页面（PNG）和可读目录，不含内部备注或技术数据。'));
    const act = el('div', { class: 'sl-actions' }, d);
    const save = el('button', { type: 'button', class: 'btn', 'data-sl': 'save' }, act, L('Guardar revisión', 'Save review', '保存审阅')); save.disabled = st.r.obsolete;
    save.onclick = () => { ctx.saved = JSON.parse(JSON.stringify(ctx.story)); ctx.proposalSaved = JSON.parse(JSON.stringify(ctx.proposal)); store.set(keyOf(ctx.pair), ctx.saved); pstore.set(keyOf(ctx.pair), ctx.proposalSaved); render(); d.querySelector('[data-sl="save"]')?.focus(); };
    const gen = el('button', { type: 'button', class: 'btn', 'data-sl': 'images' }, act, L('Previsualizar como cliente', 'Preview as client', '以客户视角预览')); gen.disabled = st.r.obsolete;
    gen.onclick = async () => { gen.disabled = true; const key = previewKey(); try { ctx.pages = await renderPages(clientDoc()); ctx.pagesKey = key; ctx.attach = await attachments(); for (const ch of ctx.story.chapters) ctx.media[ch.id] = { state: 'READY', revision: ctx.story.revisions.after.fingerprint }; }
      catch (e) { ctx.pages = []; console.warn('StoryLayers preview', e); } render(); d.querySelector('[data-sl="preview"] img')?.scrollIntoView({ block: 'nearest' }); d.querySelector('[data-sl="images"]')?.focus(); };
    const tr = el('button', { type: 'button', class: 'btn', 'data-sl': 'trace' }, act, L('Trazabilidad técnica (interna)', 'Technical traceability (internal)', '技术追溯（内部）')); tr.onclick = () => downloadTrace();
    const dl = el('button', { type: 'button', class: 'btn primary', 'data-sl': 'download' }, act, L('Descargar para el cliente', 'Download for the client', '下载给客户')); dl.disabled = !st.ok;
    dl.onclick = () => download();
  }
  /* §8.2 · Cliente (opcional): introducir o cargar una ficha; qué se USA para redactar y qué APARECE en la entrega. */
  function clientBox(pv) {
    const c = ctx.proposal.client, box = el('fieldset', { class: 'sl-client', 'data-sl': 'client' }, pv); el('legend', {}, box, L('Para quién es la propuesta (opcional)', 'Who the proposal is for (optional)', '提案对象（可选）'));
    el('p', { class: 'sl-hint' }, box, L('Se guarda solo en este navegador, con esta propuesta. La ayuda de redacción recibe únicamente los campos marcados «Usar para redactar»; en la entrega aparecen solo los marcados «Mostrar».', 'Stored only in this browser, with this proposal. The writing help receives only the fields marked «Use for writing»; the delivery shows only those marked «Show».', '仅保存在本浏览器中。写作帮助只接收标记为「用于撰写」的字段；交付中只显示标记为「显示」的字段。'));
    const set = ch => setProp({ client: { ...ctx.proposal.client, ...ch } });
    const row = (k, label, rows) => { const r = el('div', { class: 'sl-client-row', 'data-field': k }, box), lb = el('label', { class: 'sl-field' }, r, label);
      const inp = el(rows ? 'textarea' : 'input', { 'data-sl': 'c-' + k, ...(rows ? { rows: '2' } : { type: 'text' }), maxlength: String(P.LIMITS[k === 'name' ? 'clientName' : k]) }, lb); inp.value = c[k]; inp.onchange = () => set({ [k]: inp.value });
      if (k === 'name') { const tl = el('label', { class: 'sl-field' }, r, L('Tratamiento', 'Form of address', '称呼')), t = el('input', { type: 'text', 'data-sl': 'c-treatment', maxlength: String(P.LIMITS.treatment), placeholder: L('Sra., Sr., Familia…', 'Ms, Mr, Family…', '女士、先生…') }, tl); t.value = c.treatment; t.onchange = () => set({ treatment: t.value }); }
      for (const [flag, txt] of [['use', L('Usar para redactar', 'Use for writing', '用于撰写')], ['show', L('Mostrar en la entrega', 'Show in the delivery', '在交付中显示')]]) {
        const l2 = el('label', { class: 'sl-check' }, r), cb = el('input', { type: 'checkbox', 'data-sl': `c-${flag}-${k}` }, l2); cb.checked = !!c[flag][k]; l2.append(' ' + txt);
        cb.onchange = () => set({ [flag]: { ...ctx.proposal.client[flag], [k]: cb.checked } }); } };
    row('name', L('Nombre', 'Name', '姓名'), 0); row('preferences', L('Preferencias', 'Preferences', '偏好'), 2); row('requirements', L('Requisitos del encargo', 'Brief requirements', '委托要求'), 2);
    const lf = el('label', { class: 'btn sl-file' }, box, L('Cargar ficha del cliente (JSON)', 'Load client card (JSON)', '载入客户资料（JSON）')), fi = el('input', { type: 'file', accept: 'application/json,.json', 'data-sl': 'c-file' }, lf);
    const msg = el('p', { class: 'sl-hint', role: 'status', 'data-sl': 'c-msg' }, box, ctx.clientMsg || '');
    fi.onchange = async () => { const f = fi.files?.[0]; if (!f) return; try { const r = P.clientFromFile(await f.text()), keep = ctx.proposal.client;
        setProp({ client: { ...r.client, use: keep.use, show: keep.show } }); ctx.clientMsg = L(`Ficha cargada: ${f.name}.`, `Card loaded: ${f.name}.`, `已载入：${f.name}。`) + (r.ignored.length ? ' ' + L(`Campos no usados: ${r.ignored.join(', ')}.`, `Unused fields: ${r.ignored.join(', ')}.`, `未使用字段：${r.ignored.join(', ')}。`) : ''); }
      catch (e) { ctx.clientMsg = L('No se ha podido leer la ficha: ', 'The card could not be read: ', '无法读取资料：') + e.message; }
      render(); dlg.querySelector('[data-sl="c-msg"]')?.focus?.(); dlg.querySelector('[data-sl="client"]')?.scrollIntoView({ block: 'nearest' }); };
  }
  /* §8.2 · Imágenes y vídeo ya disponibles en RUBIK, con su estado. Solo lo VIGENTE puede elegirse para la entrega. */
  function mediaBox(pv) {
    const m = mediaInfo(), T = MEDIA_TXT(), box = el('fieldset', { class: 'sl-media', 'data-sl': 'media' }, pv); el('legend', {}, box, L('Imágenes y vídeo del proyecto', 'Project images and video', '项目图片与视频'));
    const vr = el('div', { class: 'sl-media-row', 'data-media': 'views', 'data-state': m.views.state }, box);
    el('strong', {}, vr, L('Vistas preparadas', 'Prepared views', '已准备的视图') + ': '); el('span', { 'data-sl': 'views-state' }, vr, T[m.views.state]);
    for (const v of m.views.items) { const lb = el('label', { class: 'sl-check sl-thumb' }, vr), cb = el('input', { type: 'checkbox', 'data-sl': 'view', value: v.id }, lb); cb.checked = ctx.proposal.media.views.includes(v.id);
      el('img', { src: v.dataUrl, alt: '' }, lb); lb.append(' ' + v.label);
      cb.onchange = () => setProp({ media: { ...ctx.proposal.media, views: cb.checked ? [...ctx.proposal.media.views, v.id] : ctx.proposal.media.views.filter(x => x !== v.id) } }); }
    if (m.views.state === 'other-entry' || (m.video.state === 'other-entry' && !m.video.result)) el('p', { class: 'sl-hint' }, vr, L('Las vistas y el vídeo se preparan con la variante abierta: usa «Editar variante» y vuelve a la historia.', 'Views and video are prepared with the variant open: use «Edit variant» and come back to the story.', '视图和视频需在打开变体时准备：请使用「编辑变体」后返回。'));
    else if (m.views.state !== 'current') { const go = el('button', { type: 'button', class: 'btn', 'data-sl': 'prepare-views' }, vr, L('Preparar vistas de la propuesta', 'Prepare views of the proposal', '准备提案视图'));
      go.onclick = async () => { go.disabled = true; go.textContent = L('Preparando vistas…', 'Preparing views…', '正在准备视图…'); try { await window.FloorPlanProjectViews.prepare(); } catch (e) { window.toast?.(e.message, 6000); }
        render(); (dlg.querySelector('[data-sl="media"] [data-sl="view"]') || dlg.querySelector('[data-sl="media"] [data-sl="prepare-views"]'))?.focus(); }; }
    const vd = el('div', { class: 'sl-media-row', 'data-media': 'video', 'data-state': m.video.state }, box);
    el('strong', {}, vd, L('Vídeo del recorrido', 'Walkthrough video', '漫游视频') + ': '); el('span', { 'data-sl': 'video-state' }, vd, T[m.video.state] + (m.video.state === 'absent' ? ' · ' + L('grábalo en «Presentación 3D → Grabar vídeo» con la variante abierta.', 'record it in «3D presentation → Record video» with the variant open.', '请在打开变体时于「三维展示 → 录制视频」中录制。') : ''));
    if (m.video.state === 'current') { const lb = el('label', { class: 'sl-check' }, vd), cb = el('input', { type: 'checkbox', 'data-sl': 'video' }, lb); cb.checked = ctx.proposal.media.video; lb.append(' ' + L('Incluir en el archivo del cliente', 'Include in the client file', '包含在客户文件中'));
      cb.onchange = () => setProp({ media: { ...ctx.proposal.media, video: cb.checked } }); }
  }
  /* §8.1 · Ayuda para redactar una nota del capítulo: borrador visible antes de insertarlo; editar, aceptar o descartar.
     Cerrar la ayuda conserva el borrador, la posición y el foco. La visibilidad de la nota la elige el profesional. */
  // Redibujar sin mover la vista: el elemento ancla queda en el mismo punto de la pantalla y recibe el foco.
  function stay(sel, fn) { const a0 = dlg.querySelector(sel), t0 = a0 ? a0.getBoundingClientRect().top : null; fn(); render(); const a1 = dlg.querySelector(sel);
    if (a1 && t0 !== null) dlg.scrollTop += a1.getBoundingClientRect().top - t0; a1?.focus({ preventScroll: true }); }
  function assistBox(li, ch) {
    if (ch.kind === 'overview') return;
    const st = (ctx.assist ||= {})[ch.id] || null, ad = A.local;
    const open = el('button', { type: 'button', class: 'btn', 'data-sl': 'assist', 'aria-expanded': st?.open ? 'true' : 'false' }, li, L('Ayuda para redactar una nota', 'Help me write a note', '帮我写备注'));
    open.onclick = () => { const cur = ctx.assist[ch.id];
      if (cur?.open) { stay(`[data-chapter="${CSS.escape(ch.id)}"] [data-sl="assist"]`, () => { cur.open = false; }); return; }
      const cx = A.context({ chapter: ch, kept: P.facts(ctx.story, docLang()).kept, proposal: ctx.proposal, client: P.clientForAssist(ctx.proposal.client), lang: docLang() });
      const d = cur?.draft != null ? cur : { ...ad.draft(cx), draft: null }; ctx.assist[ch.id] = { ...d, draft: d.draft ?? d.text, open: true, vis: cur?.vis || 'client' };
      stay(`[data-chapter="${CSS.escape(ch.id)}"] [data-sl="assist"]`, () => {}); dlg.querySelector(`[data-chapter="${CSS.escape(ch.id)}"] [data-sl="assist-draft"]`)?.focus({ preventScroll: true }); };
    if (!st?.open) return;
    const pnl = el('section', { class: 'sl-assist', role: 'region', 'data-sl': 'assist-panel', 'aria-label': L('Ayuda para redactar', 'Writing help', '写作帮助') + ' · ' + ch.title }, li);
    el('p', { class: 'sl-hint', 'data-sl': 'assist-source' }, pnl, ad.label(docLang()));
    el('p', { class: 'sl-hint', 'data-sl': 'assist-used' }, pnl, L('Usa: ', 'Uses: ', '使用：') + st.used.join(' · '));
    const lb = el('label', { class: 'sl-field' }, pnl, L('Borrador (puedes editarlo antes de aceptarlo)', 'Draft (you can edit it before accepting)', '草稿（接受前可编辑）'));
    const ta = el('textarea', { rows: '3', 'data-sl': 'assist-draft', maxlength: String(P.LIMITS.note) }, lb); ta.value = st.draft; ta.oninput = () => { st.draft = ta.value; };
    if (st.asks.length) { const ul = el('ul', { class: 'sl-asks', 'data-sl': 'assist-asks' }, pnl); for (const q of st.asks) el('li', {}, ul, q); }
    const vl = el('label', { class: 'sl-field' }, pnl, L('Visibilidad de la nota', 'Note visibility', '备注可见性')), vs = el('select', { 'data-sl': 'assist-visibility' }, vl);
    for (const [v, t] of [['client', L('Para el cliente', 'For the client', '给客户')], ['internal', L('Interna', 'Internal', '内部')]]) { const o = el('option', { value: v }, vs, t); o.selected = st.vis === v; }
    vs.onchange = () => { st.vis = vs.value; };
    const row = el('div', { class: 'sl-actions-inline' }, pnl);
    const ok = el('button', { type: 'button', class: 'btn primary', 'data-sl': 'assist-accept' }, row, L('Aceptar e insertar nota', 'Accept and insert note', '接受并插入备注'));
    ok.onclick = () => { const text = ta.value.trim(); if (!text) { ta.focus(); return; } const id = 'nota-' + Date.now().toString(36).slice(-8); delete ctx.assist[ch.id];
      setNotes(ns => [...ns, { id, text, visibility: vs.value, anchor: { kind: 'chapter', id: ch.id } }], true); dlg.querySelector(`[data-note="${id}"] textarea`)?.focus(); };
    const no = el('button', { type: 'button', class: 'btn', 'data-sl': 'assist-discard' }, row, L('Descartar', 'Discard', '放弃'));
    no.onclick = () => stay(`[data-chapter="${CSS.escape(ch.id)}"] [data-sl="assist"]`, () => { delete ctx.assist[ch.id]; });
    const cl = el('button', { type: 'button', class: 'btn', 'data-sl': 'assist-close' }, row, L('Cerrar la ayuda', 'Close help', '关闭帮助'));
    cl.onclick = () => stay(`[data-chapter="${CSS.escape(ch.id)}"] [data-sl="assist"]`, () => { st.open = false; });
  }
  function setProp(change) { ctx.proposal = P.normalize({ ...ctx.proposal, ...change }, { chapterIds: ctx.story.order }); refresh(); }
  function setNotes(fn, rerender = false) { ctx.proposal = P.normalize({ ...ctx.proposal, notes: fn(ctx.proposal.notes) }, { chapterIds: ctx.story.order }); if (rerender) render(); else refresh(); }

  function save(name, bytes, type) { const blob = new Blob([bytes], { type }); const a = el('a', { href: URL.createObjectURL(blob), download: name }, document.body); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  // El vídeo elegido viaja como adjunto con su huella: los MISMOS bytes que se ven en la vista previa.
  async function attachments() { const v = chosenVideo(); if (!v) return []; const bytes = new Uint8Array(await v.blob.arrayBuffer()), ext = /mp4/.test(v.blob.type) ? 'mp4' : 'webm';
    return [{ file: 'propuesta/video-recorrido.' + ext, bytes, sha256: await digest(bytes), type: v.blob.type, attachment: true, content: [L('Vídeo del recorrido de la propuesta', 'Walkthrough video of the proposal', '提案漫游视频')] }]; }
  function download() {
    const st = status(); if (!st.ok) return null; const att = ctx.attach || [];
    const doc = clientDoc(), man = P.clientManifest(doc, [...ctx.pages, ...att].map(p => ({ file: p.file, sha256: p.sha256, bytes: p.bytes.length, content: p.content, attachment: !!p.attachment })), { date: new Date().toISOString().slice(0, 10) });
    const entries = new Map([['propuesta/manifiesto.json', new TextEncoder().encode(JSON.stringify(man, null, 1) + '\n')], ...ctx.pages.map(p => [p.file, p.bytes]), ...att.map(p => [p.file, p.bytes])]);
    const bytes = window.FloorPlanPackage.zip(entries, { check: n => { if (!/^propuesta\/([0-9]{2}-(portada|pagina)\.png|manifiesto\.json|video-recorrido\.(webm|mp4))$/.test(n)) throw Error('Ruta no permitida: ' + n); return n; } });
    save('rubik-propuesta-cliente.zip', bytes, 'application/zip'); ctx.lastManifest = man; return man;
  }
  // Archivo INTERNO: historia con identificadores, rutas y huellas, la propuesta completa (notas internas incluidas) y la huella
  // de cada página entregada. Sirve para auditar; nunca se entrega al cliente.
  function downloadTrace() {
    const tech = { schema: 'rubik-sota.story-trace', version: '1.0.0', interno: true, historia: S.manifest(ctx.story, ctx.pages.map((p, i) => ({ chapterId: 'pagina-' + (i + 1), file: p.file, sha256: p.sha256, bytes: p.bytes.length }))), propuesta: ctx.proposal };
    save('rubik-historia-trazabilidad-INTERNA.json', new TextEncoder().encode(JSON.stringify(tech, null, 1) + '\n'), 'application/json'); ctx.lastTrace = tech; return tech;
  }
  async function load(fresh = false) {
    const { story, current } = await makeStory(ctx.pair);
    const saved = fresh ? null : store.get(keyOf(ctx.pair)), psaved = fresh ? null : pstore.get(keyOf(ctx.pair));
    // Una historia guardada se reabre TAL CUAL (con sus huellas): si las revisiones cambiaron, queda obsoleta.
    ctx.story = saved && saved.schema === S.SCHEMA ? JSON.parse(JSON.stringify(saved)) : story; ctx.saved = saved && saved.schema === S.SCHEMA ? saved : null;
    ctx.proposal = P.normalize(psaved || {}, { chapterIds: ctx.story.order }); ctx.proposalSaved = psaved ? JSON.parse(JSON.stringify(ctx.proposal)) : null;
    ctx.current = current; ctx.media = ctx.media || {}; ctx.pages = ctx.pages || [];
    ctx.comparison = Compare.compare(ctx.pair.before.project, ctx.pair.after.project, { relation: 'library-variant' }); ctx.identical = ctx.comparison.identical === true;
  }
  async function open(opts = {}) {
    const targets = await pairs(), want = opts.after ? targets.pairs?.find(p => p.after.id === opts.after) : null;
    ctx = { targets, pair: want || targets.pairs?.[0] || null, media: {}, pages: [], urls: [], returnTo: opts.returnTo || null, chapter: null };
    if (ctx.pair) await load();
    render(); ensure().showModal();
    const ch = opts.chapter && dlg.querySelector(`[data-chapter="${CSS.escape(opts.chapter)}"] textarea`);
    if (ch) { ctx.chapter = opts.chapter; ch.focus(); ch.scrollIntoView({ block: 'center' }); } else dlg.querySelector(ctx.identical ? '[data-sl="edit-variant"]' : '[data-sl="close"]')?.focus();
  }
  window.FloorPlanStoryLayersUI = Object.freeze({ open, cardModel, createVariant, get returnContext() { return ret.get(); }, get state() { return ctx && status().r; }, get manifest() { return ctx?.lastManifest || null; }, get trace() { return ctx?.lastTrace || null; },
    get pages() { return ctx ? ctx.pages.map(p => ({ file: p.file, sha256: p.sha256, cont: p.cont })) : []; } });
})();
