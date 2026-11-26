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
  const S = window.FloorPlanStoryLayers, P = window.FloorPlanStoryProposal, Compare = window.FloorPlanRevisionCompare;
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

  let dlg, ctx = null;
  function ensure() {
    if (dlg?.isConnected) return dlg;
    dlg = el('dialog', { id: 'storyLayersDialog', class: 'story-layers-dialog', 'aria-labelledby': 'slTitle' }, document.body);
    dlg.addEventListener('close', () => { for (const u of ctx?.urls || []) URL.revokeObjectURL(u); ctx = null; });
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
  function clientDoc() {
    const id = P.identity(snapshot(), ctx.proposal.contact, docLang());
    return P.document({ story: ctx.story, proposal: ctx.proposal, identity: id, facts: P.facts(ctx.story, docLang()), cost: P.cost(budgetCompare(), docLang()),
      lang: docLang(), projectName: projName(ctx.pair.before.name), chapterText: ch => S.textOf(ctx.story, ch) });
  }

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
    text('h1', doc.title, { pad: 14 }); text('p', doc.summary, { pad: 22 });
    if (hero) { text('h2', L2.where, { pad: 8 }); fig(hero); }
    text('h3', L2.changes, { pad: 4 }); for (const s of doc.facts.changes) text('li', s, { bullet: '•' });
    text('h3', L2.kept, { pad: 4 }); for (const s of doc.facts.kept) text('li', s, { bullet: '•' });
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
        const [f, lh, col] = FONT[it.kind]; g.font = f; g.fillStyle = col;
        it.lines.forEach((ln, i) => { const x = M + it.indent + (it.bullet ? 34 : 0); if (i === 0 && it.bullet && !it.cont) g.fillText(it.bullet, M + it.indent + 8, y + lh * (i + 1) - 8); g.fillText(ln, x, y + lh * (i + 1) - 8); });
      }
      g.fillStyle = '#d9d4cb'; g.fillRect(M, PH - FOOT, CW, 1); g.fillStyle = '#5b6066'; g.font = '20px sans-serif'; g.fillText(doc.credit, M, PH - FOOT + 36);
      const pg = doc.page(pi + 1, pages.length); g.fillText(pg, PW - M - g.measureText(pg).width, PH - FOOT + 36);
      const blob = await new Promise(r => cv.toBlob(r, 'image/png')), bytes = new Uint8Array(await blob.arrayBuffer());
      out.push({ file: `propuesta/${String(pi + 1).padStart(2, '0')}-${pi === 0 ? 'portada' : 'pagina'}.png`, bytes, sha256: await digest(bytes), content: page.filter(x => x.kind === 'h1' || x.kind === 'h2' || x.kind === 'figure').map(x => x.content), cont: page.some(x => x.cont) });
    }
    return out;
  }
  // Qué se previsualizó: si cambia la historia, la propuesta o la identidad, la vista previa deja de valer.
  const previewKey = () => JSON.stringify([ctx.story, ctx.proposal, P.identity(snapshot(), ctx.proposal.contact, docLang()), budgetCompare()?.totals?.status || 'none']);

  /* ---------- Estado y textos de progreso ---------- */
  function status() {
    const r = S.readiness(ctx.story, { current: ctx.current, media: ctx.media, saved: ctx.saved });
    const savedProp = JSON.stringify(ctx.proposal) === JSON.stringify(ctx.proposalSaved || null);
    const fresh = !!ctx.pages.length && ctx.pagesKey === previewKey();
    const ok = r.state === 'READY' && savedProp && fresh;
    const why = r.obsolete ? L('La historia es de otra revisión del proyecto: pulsa «Rehacer con las revisiones actuales».', 'The story belongs to another revision: press «Rebuild with the current revisions».', '故事属于另一个版本：请点击「使用当前版本重新生成」。')
      : !ctx.saved || !savedProp || JSON.stringify(ctx.story) !== JSON.stringify(ctx.saved) ? L('Guarda la revisión para fijar lo que vas a entregar.', 'Save the review to fix what you will deliver.', '请保存审阅以确定交付内容。')
      : !fresh ? L('Previsualiza como cliente: el archivo es exactamente lo que ves.', 'Preview as the client: the file is exactly what you see.', '请以客户视角预览：文件与所见完全一致。') : '';
    const progress = `${ctx.saved && savedProp ? L('Revisión guardada', 'Review saved', '审阅已保存') : L('Revisión sin guardar', 'Review not saved', '审阅未保存')} · ${fresh ? ctx.pages.length : 0} ${L('de', 'of', '/')} ${fresh ? ctx.pages.length : '—'} ${L('páginas listas', 'pages ready', '页已就绪')}`;
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
      el('p', { class: 'sl-empty', role: 'status' }, d, { 'no-variant': L('Este proyecto no tiene variantes guardadas: crea una variante en «Proyectos → Crear variante» y modifícala.', 'This project has no saved variants: create one in «Projects → Create variant» and edit it.', '该项目没有已保存的变体：请在「项目 → 创建变体」中创建并修改。'),
        'no-library': L('Guarda el proyecto en la biblioteca para tener dos revisiones que comparar.', 'Save the project in the library to have two revisions to compare.', '请将项目保存到项目库，以便比较两个版本。'),
        'not-eligible': L('Abre el original o una de sus variantes.', 'Open the original or one of its variants.', '请打开原始方案或其变体。') }[ctx.targets.state] || '—');
      return;
    }
    if (ctx.targets.pairs.length > 1) {
      const lab = el('label', { class: 'sl-pair' }, d, L('Variante: ', 'Variant: ', '变体：'));
      const sel = el('select', { 'data-sl': 'pair' }, lab);
      ctx.targets.pairs.forEach((p, i) => { const o = el('option', { value: String(i) }, sel, projName(p.after.name)); if (p === ctx.pair) o.selected = true; });
      sel.onchange = async () => { ctx.pair = ctx.targets.pairs[+sel.value]; ctx.pages = []; await load(); render(); };
    }
    const st = status();
    const banner = el('p', { class: 'sl-state sl-' + st.r.state.toLowerCase(), role: 'status', 'data-sl': 'state', 'data-state': st.r.state }, d, STATE_TXT()[st.r.state]);
    if (st.r.obsolete) { banner.append(' · ' + L('Revísala antes de entregarla como vigente.', 'Review it before delivering it as current.', '请在作为最新版本交付前审阅。'));
      const regen = el('button', { type: 'button', class: 'btn primary', 'data-sl': 'regenerate' }, d, L('Rehacer con las revisiones actuales', 'Rebuild with the current revisions', '使用当前版本重新生成')); regen.onclick = async () => { ctx.saved = null; ctx.media = {}; ctx.pages = []; await load(true); render(); }; }
    el('p', { class: 'sl-progress', 'data-sl': 'progress', role: 'status' }, d, st.progress);

    // 1) Lo que RUBIK comprueba (capítulos revisables; datos con su trazabilidad para el profesional).
    el('h3', { class: 'sl-step' }, d, L('1 · Revisa el cambio comprobado', '1 · Review the verified change', '1 · 审阅已核实的变化'));
    el('p', { class: 'sl-frame' }, d, L('Misma planta, mismo encuadre y misma escala para las dos revisiones.', 'Same plan, framing and scale for both revisions.', '两个版本使用相同平面、取景和比例。'));
    const list = el('ol', { class: 'sl-chapters' }, d);
    S.ordered(ctx.story).forEach((ch, idx, arr) => {
      const li = el('li', { class: 'sl-chapter', 'data-chapter': ch.id }, list);
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
    });

    // 2) La propuesta: identidad de Mi estudio, texto del profesional y notas con visibilidad explícita.
    el('h3', { class: 'sl-step' }, d, L('2 · Prepara la propuesta para el cliente', '2 · Prepare the proposal for the client', '2 · 准备给客户的提案'));
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
    el('h3', { class: 'sl-step' }, d, L('3 · Previsualiza y descarga para el cliente', '3 · Preview and download for the client', '3 · 预览并下载给客户'));
    const prev = el('section', { class: 'sl-preview', 'data-sl': 'preview', 'aria-label': L('Vista previa del cliente', 'Client preview', '客户预览') }, d);
    if (st.fresh) { ctx.pages.forEach((p, i) => { const u = URL.createObjectURL(new Blob([p.bytes], { type: 'image/png' })); ctx.urls.push(u); el('img', { src: u, alt: L('Página', 'Page', '页') + ' ' + (i + 1), 'data-page': String(i + 1) }, prev); });
      const back = el('button', { type: 'button', class: 'btn', 'data-sl': 'edit' }, prev, L('Volver a editar', 'Back to editing', '返回编辑')); back.onclick = () => dlg.querySelector('[data-sl="p-title"]')?.focus(); }
    el('p', { class: 'sl-why', 'data-sl': 'why', hidden: st.why ? null : '' }, d, st.why);
    el('p', { class: 'sl-includes' }, d, L('El archivo incluye las páginas de la propuesta (PNG) y un índice legible. No incluye notas internas ni datos técnicos.', 'The file includes the proposal pages (PNG) and a readable index. It does not include internal notes or technical data.', '文件包含提案页面（PNG）和可读目录，不含内部备注或技术数据。'));
    const act = el('div', { class: 'sl-actions' }, d);
    const save = el('button', { type: 'button', class: 'btn', 'data-sl': 'save' }, act, L('Guardar revisión', 'Save review', '保存审阅')); save.disabled = st.r.obsolete;
    save.onclick = () => { ctx.saved = JSON.parse(JSON.stringify(ctx.story)); ctx.proposalSaved = JSON.parse(JSON.stringify(ctx.proposal)); store.set(keyOf(ctx.pair), ctx.saved); pstore.set(keyOf(ctx.pair), ctx.proposalSaved); render(); d.querySelector('[data-sl="save"]')?.focus(); };
    const gen = el('button', { type: 'button', class: 'btn', 'data-sl': 'images' }, act, L('Previsualizar como cliente', 'Preview as client', '以客户视角预览')); gen.disabled = st.r.obsolete;
    gen.onclick = async () => { gen.disabled = true; const key = previewKey(); try { ctx.pages = await renderPages(clientDoc()); ctx.pagesKey = key; for (const ch of ctx.story.chapters) ctx.media[ch.id] = { state: 'READY', revision: ctx.story.revisions.after.fingerprint }; }
      catch (e) { ctx.pages = []; console.warn('StoryLayers preview', e); } render(); d.querySelector('[data-sl="preview"] img')?.scrollIntoView({ block: 'nearest' }); d.querySelector('[data-sl="images"]')?.focus(); };
    const tr = el('button', { type: 'button', class: 'btn', 'data-sl': 'trace' }, act, L('Trazabilidad técnica (interna)', 'Technical traceability (internal)', '技术追溯（内部）')); tr.onclick = () => downloadTrace();
    const dl = el('button', { type: 'button', class: 'btn primary', 'data-sl': 'download' }, act, L('Descargar para el cliente', 'Download for the client', '下载给客户')); dl.disabled = !st.ok;
    dl.onclick = () => download();
  }
  function setProp(change) { ctx.proposal = P.normalize({ ...ctx.proposal, ...change }, { chapterIds: ctx.story.order }); refresh(); }
  function setNotes(fn, rerender = false) { ctx.proposal = P.normalize({ ...ctx.proposal, notes: fn(ctx.proposal.notes) }, { chapterIds: ctx.story.order }); if (rerender) render(); else refresh(); }

  function save(name, bytes, type) { const blob = new Blob([bytes], { type }); const a = el('a', { href: URL.createObjectURL(blob), download: name }, document.body); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  function download() {
    const st = status(); if (!st.ok) return null;
    const doc = clientDoc(), man = P.clientManifest(doc, ctx.pages.map(p => ({ file: p.file, sha256: p.sha256, bytes: p.bytes.length, content: p.content })), { date: new Date().toISOString().slice(0, 10) });
    const entries = new Map([['propuesta/manifiesto.json', new TextEncoder().encode(JSON.stringify(man, null, 1) + '\n')], ...ctx.pages.map(p => [p.file, p.bytes])]);
    const bytes = window.FloorPlanPackage.zip(entries, { check: n => { if (!/^propuesta\/([0-9]{2}-(portada|pagina)\.png|manifiesto\.json)$/.test(n)) throw Error('Ruta no permitida: ' + n); return n; } });
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
    ctx.comparison = Compare.compare(ctx.pair.before.project, ctx.pair.after.project, { relation: 'library-variant' });
  }
  async function open() {
    const targets = await pairs(); ctx = { targets, pair: targets.pairs?.[0] || null, media: {}, pages: [], urls: [] };
    if (ctx.pair) await load();
    render(); ensure().showModal(); dlg.querySelector('[data-sl="close"]')?.focus();
  }
  window.FloorPlanStoryLayersUI = Object.freeze({ open, get state() { return ctx && status().r; }, get manifest() { return ctx?.lastManifest || null; }, get trace() { return ctx?.lastTrace || null; },
    get pages() { return ctx ? ctx.pages.map(p => ({ file: p.file, sha256: p.sha256, cont: p.cont })) : []; } });
})();
