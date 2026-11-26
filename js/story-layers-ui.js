/* RUBIK SOTA · StoryLayersV1 · «Explicar el cambio» (Entregar › P10). Diálogo modal sobre el núcleo puro
   js/story-layers-core.js. Solo LEE la biblioteca (original y variante del mismo grupo, como «Comparar con el original»)
   y guarda la historia revisada en este navegador (clave propia, nunca dentro del proyecto). Las imágenes se generan con
   el encuadre común del comparador existente (misma planta, mismo marco, misma escala) y los rótulos anclados a los
   elementos. Al cerrar, Entregar recupera ficha, posición y foco (launch() del espacio de trabajo). */
(function () {
  'use strict';
  const S = window.FloorPlanStoryLayers, Compare = window.FloorPlanRevisionCompare;
  if (!S || !Compare) return;
  const KEY = 'rubik-story-layers-v1';
  const L = (es, en, zh) => ({ es, en, zh })[typeof LANG === 'string' ? LANG : 'es'] || es;
  const lang = () => (typeof LANG === 'string' && ['es', 'en', 'zh'].includes(LANG) ? LANG : 'es');
  const el = (tag, attrs = {}, parent = null, text = null) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) n.setAttribute(k, v); if (text !== null) n.textContent = text; if (parent) parent.append(n); return n; };
  const digest = async b => [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map(x => x.toString(16).padStart(2, '0')).join('');
  const shown = r => (window.FloorPlanDisplayName ? window.FloorPlanDisplayName(r.name, 'room') : r.id);
  const projName = n => (typeof nm === 'function' ? nm(n) : n) || '—';
  const store = { all() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } },
    get(k) { return this.all()[k] || null; }, set(k, v) { const a = this.all(); a[k] = v; try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch { return false; } } };
  const STATE_TXT = () => ({ READY: L('Lista para entregar', 'Ready to deliver', '可交付'), INCOMPLETE: L('Pendiente de revisión', 'Pending review', '待审阅'), OBSOLETE: L('Obsoleta: el proyecto cambió', 'Out of date: the project changed', '已过期：项目已更改') });
  const DATA_STATE = () => ({ calculated: L('Calculado del proyecto', 'Calculated from the project', '根据项目计算'), absent: L('Ausente', 'Absent', '缺失') });
  const ITEM_TXT = id => id.startsWith('revision.before') ? L('La revisión «antes» sigue siendo la guardada', 'The «before» revision is still the saved one', '「之前」版本仍为已保存版本')
    : id.startsWith('revision.after') ? L('La revisión «después» sigue siendo la guardada', 'The «after» revision is still the saved one', '「之后」版本仍为已保存版本')
    : id.startsWith('media.') ? L('Imagen generada de este capítulo', 'Generated image of this chapter', '本章节已生成图片')
    : id.startsWith('data.') ? L('Dato ausente (se muestra como ausente)', 'Absent datum (shown as absent)', '缺失数据（显示为缺失）') : L('Lo que se entrega es lo que revisaste (guardado)', 'What is delivered is what you reviewed (saved)', '交付内容即你审阅并保存的内容');

  let dlg, ctx = null;
  function ensure() {
    if (dlg?.isConnected) return dlg;
    dlg = el('dialog', { id: 'storyLayersDialog', class: 'story-layers-dialog', 'aria-labelledby': 'slTitle' }, document.body);
    dlg.addEventListener('close', () => { ctx = null; });
    return dlg;
  }
  // Pares disponibles: los mismos destinos que «Comparar con el original» (original → variantes del grupo).
  async function pairs() {
    const t = window.FloorPlanApp?.storyTargets?.() || { state: 'no-library', pairs: [] };
    return t;
  }
  async function makeStory(pair) {
    const fb = await S.fingerprint(pair.before.project, digest), fa = await S.fingerprint(pair.after.project, digest);
    const refs = { before: { entryId: pair.before.id, fingerprint: fb }, after: { entryId: pair.after.id, fingerprint: fa } };
    const matShown = m => (window.FloorPlanDisplayName ? window.FloorPlanDisplayName(m.name, 'material') : m.id) || m.id;
    const story = S.build({ before: pair.before.project, after: pair.after.project, refs, relation: 'library-variant', name: shown, material: matShown, lang: lang(),
      labels: { before: projName(pair.before.name), after: projName(pair.after.name) } });
    return { story, current: { before: fb, after: fa } };
  }
  const keyOf = p => p.before.id + '→' + p.after.id;

  // Imagen de un capítulo: las dos plantas con el MISMO encuadre (planSvg del comparador) y los rótulos numerados en el
  // punto exacto del elemento (coordenadas de planta, el mismo marco).
  function chapterSvg(comparison, pair, ch, side) {
    let svg = Compare.planSvg(comparison, side, side === 'before' ? pair.before.project : pair.after.project, { title: side === 'before' ? L('Antes', 'Before', '之前') : L('Después', 'After', '之后') });
    const [, , w, h] = comparison.perspective.viewBox, r = Math.max(w, h) / 45;
    const marks = ch.data.map((d, i) => [d, i]).filter(([d]) => d.anchor && d.anchor.side === side)
      .map(([d, i]) => `<g class="sl-callout" data-callout="${ch.id}:${d.id}" data-anchor="${d.anchor.kind}:${d.anchor.id}"><circle cx="${d.anchor.x}" cy="${d.anchor.y}" r="${r}" fill="#b5653a" stroke="#fff" stroke-width="${r / 5}"/><text x="${d.anchor.x}" y="${d.anchor.y}" dy="${r * .35}" text-anchor="middle" font-size="${r * 1.1}" font-family="sans-serif" fill="#fff">${i + 1}</text></g>`);
    return svg.replace('</svg>', marks.join('') + '</svg>');
  }
  async function chapterPng(comparison, pair, story, ch) {
    const W = 1600, H = 1000, band = 180, half = W / 2, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'); g.fillStyle = '#fbfaf7'; g.fillRect(0, 0, W, H);
    for (const [i, side] of ['before', 'after'].entries()) {
      const url = URL.createObjectURL(new Blob([chapterSvg(comparison, pair, ch, side)], { type: 'image/svg+xml' }));
      try { const img = new Image(); img.src = url; await img.decode(); g.drawImage(img, i * half + 20, 60, half - 40, H - band - 80); } finally { URL.revokeObjectURL(url); }
      g.fillStyle = '#3a3d40'; g.font = '600 26px sans-serif'; g.fillText(side === 'before' ? L('Antes', 'Before', '之前') + ' · ' + projName(pair.before.name) : L('Después', 'After', '之后') + ' · ' + projName(pair.after.name), i * half + 24, 40);
    }
    g.fillStyle = '#fff'; g.fillRect(0, H - band, W, band); g.fillStyle = '#1f2326'; g.font = '700 30px sans-serif'; g.fillText(ch.title, 24, H - band + 44);
    g.font = '22px sans-serif'; g.fillText(S.textOf(story, ch).slice(0, 120), 24, H - band + 82);
    ch.data.forEach((d, i) => { g.fillText(`${i + 1}. ${d.label}: ${d.value === null ? DATA_STATE().absent : d.value + ' ' + d.unit} · ${d.revision.side === 'before' ? L('antes', 'before', '之前') : L('después', 'after', '之后')} ${d.revision.fingerprint.slice(0, 8)}`, 24 + (i % 2) * 800, H - band + 120 + Math.floor(i / 2) * 30); });
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    return { blob, bytes: new Uint8Array(await blob.arrayBuffer()) };
  }

  function render() {
    const d = ensure(); d.replaceChildren();
    const head = el('header', { class: 'sl-head' }, d);
    el('h2', { id: 'slTitle' }, head, L('Explicar el cambio al cliente', 'Explain the change to the client', '向客户说明变化'));
    const close = el('button', { type: 'button', class: 'btn', 'data-sl': 'close' }, head, L('Cerrar', 'Close', '关闭')); close.onclick = () => d.close();
    if (!ctx.pair) {
      el('p', { class: 'sl-empty', role: 'status' }, d, { 'no-variant': L('Este proyecto no tiene variantes guardadas: crea una variante en «Proyectos → Crear variante» y modifícala.', 'This project has no saved variants: create one in «Projects → Create variant» and edit it.', '该项目没有已保存的变体：请在「项目 → 创建变体」中创建并修改。'),
        'no-library': L('Guarda el proyecto en la biblioteca para tener dos revisiones que comparar.', 'Save the project in the library to have two revisions to compare.', '请将项目保存到项目库，以便比较两个版本。'),
        'not-eligible': L('Abre el original o una de sus variantes.', 'Open the original or one of its variants.', '请打开原始方案或其变体。') }[ctx.targets.state] || '—');
      return;
    }
    if (ctx.targets.pairs.length > 1) {
      const lab = el('label', { class: 'sl-pair' }, d, L('Revisión «después»: ', '«After» revision: ', '「之后」版本：'));
      const sel = el('select', { 'data-sl': 'pair' }, lab);
      ctx.targets.pairs.forEach((p, i) => { const o = el('option', { value: String(i) }, sel, projName(p.after.name)); if (p === ctx.pair) o.selected = true; });
      sel.onchange = async () => { ctx.pair = ctx.targets.pairs[+sel.value]; await load(); render(); };
    }
    const r = S.readiness(ctx.story, { current: ctx.current, media: ctx.media, saved: ctx.saved });
    const banner = el('p', { class: 'sl-state sl-' + r.state.toLowerCase(), role: 'status', 'data-sl': 'state', 'data-state': r.state }, d, STATE_TXT()[r.state]);
    if (r.obsolete) { banner.append(' · ' + L('Revísala antes de entregarla como vigente.', 'Review it before delivering it as current.', '请在作为最新版本交付前审阅。'));
      const regen = el('button', { type: 'button', class: 'btn primary', 'data-sl': 'regenerate' }, d, L('Rehacer con las revisiones actuales', 'Rebuild with the current revisions', '使用当前版本重新生成')); regen.onclick = async () => { ctx.saved = null; ctx.media = {}; await load(true); render(); }; }
    el('p', { class: 'sl-frame' }, d, L('Misma planta, mismo encuadre y misma escala para las dos revisiones.', 'Same plan, framing and scale for both revisions.', '两个版本使用相同平面、取景和比例。'));
    const list = el('ol', { class: 'sl-chapters' }, d);
    S.ordered(ctx.story).forEach((ch, idx, arr) => {
      const li = el('li', { class: 'sl-chapter', 'data-chapter': ch.id }, list);
      el('h3', {}, li, ch.title);
      const fig = el('div', { class: 'sl-figure' }, li);
      for (const side of ['before', 'after']) { const f = el('figure', { 'data-side': side }, fig); f.innerHTML = chapterSvg(ctx.comparison, ctx.pair, ch, side); el('figcaption', {}, f, side === 'before' ? L('Antes', 'Before', '之前') : L('Después', 'After', '之后')); }
      const ta = el('textarea', { rows: '2', 'aria-label': L('Texto del capítulo', 'Chapter text', '章节文字') + ' · ' + ch.title, 'data-sl': 'text' }, li); ta.value = S.textOf(ctx.story, ch);
      ta.onchange = () => { ctx.story = S.edit(ctx.story, { texts: { [ch.id]: ta.value } }); refreshState(); };
      const tb = el('table', { class: 'sl-data' }, li), hr = el('tr', {}, el('thead', {}, tb));
      for (const h of [L('Nº', 'No.', '序号'), L('Dato', 'Datum', '数据'), L('Valor', 'Value', '数值'), L('Fuente', 'Source', '来源'), L('Revisión', 'Revision', '版本'), L('Estado', 'State', '状态')]) el('th', { scope: 'col' }, hr, h);
      const bd = el('tbody', {}, tb);
      ch.data.forEach((x, i) => { const tr = el('tr', { 'data-datum': x.id, 'data-state': x.state }, bd); el('td', {}, tr, String(i + 1)); el('td', {}, tr, x.label);
        el('td', {}, tr, x.value === null ? DATA_STATE().absent : `${x.value} ${x.unit}`); el('td', {}, tr, x.source.field);
        el('td', {}, tr, `${x.revision.side === 'before' ? L('antes', 'before', '之前') : L('después', 'after', '之后')} · ${x.revision.fingerprint.slice(0, 8)}`); el('td', {}, tr, DATA_STATE()[x.state]); });
      const mv = el('div', { class: 'sl-move' }, li);
      const up = el('button', { type: 'button', class: 'btn', 'data-sl': 'up', 'aria-label': L('Subir', 'Move up', '上移') + ' · ' + ch.title }, mv, '↑'); up.disabled = idx === 0;
      const dn = el('button', { type: 'button', class: 'btn', 'data-sl': 'down', 'aria-label': L('Bajar', 'Move down', '下移') + ' · ' + ch.title }, mv, '↓'); dn.disabled = idx === arr.length - 1;
      const swap = k => { const o = [...ctx.story.order]; [o[idx], o[idx + k]] = [o[idx + k], o[idx]]; ctx.story = S.edit(ctx.story, { order: o }); render(); d.querySelector(`[data-chapter="${ch.id}"] [data-sl="${k < 0 ? 'up' : 'down'}"]`)?.focus(); };
      up.onclick = () => swap(-1); dn.onclick = () => swap(1);
    });
    const ready = el('ul', { class: 'sl-readiness', 'aria-label': L('Preparación', 'Readiness', '准备情况') }, d);
    for (const it of r.items) el('li', { 'data-item': it.id, 'data-ok': String(it.ok), 'data-severity': it.severity }, ready, (it.ok ? '✓ ' : it.severity === 'BLOCKING' ? '✗ ' : '! ') + ITEM_TXT(it.id) + (it.detail && !it.ok ? ' — ' + it.detail : ''));
    const act = el('div', { class: 'sl-actions' }, d);
    const save = el('button', { type: 'button', class: 'btn', 'data-sl': 'save' }, act, L('Guardar revisión', 'Save review', '保存审阅')); save.disabled = r.obsolete;
    save.onclick = () => { ctx.saved = JSON.parse(JSON.stringify(ctx.story)); store.set(keyOf(ctx.pair), ctx.saved); render(); d.querySelector('[data-sl="save"]')?.focus(); };
    const gen = el('button', { type: 'button', class: 'btn', 'data-sl': 'images' }, act, L('Generar imágenes', 'Generate images', '生成图片')); gen.disabled = r.obsolete;
    gen.onclick = async () => { gen.disabled = true; ctx.files = []; for (const ch of S.ordered(ctx.story)) { ctx.media[ch.id] = { state: 'LOADING' }; try { const p = await chapterPng(ctx.comparison, ctx.pair, ctx.story, ch);
        ctx.files.push({ chapterId: ch.id, file: `historia/${String(ctx.files.length + 1).padStart(2, '0')}-${ch.id.replace(/[^a-z0-9-]/gi, '-')}.png`, bytes: p.bytes, sha256: await digest(p.bytes) }); ctx.media[ch.id] = { state: 'READY', revision: ctx.story.revisions.after.fingerprint }; }
      catch (e) { ctx.media[ch.id] = { state: 'ERROR' }; } } render(); d.querySelector('[data-sl="images"]')?.focus(); };
    const dl = el('button', { type: 'button', class: 'btn primary', 'data-sl': 'download' }, act, L('Descargar historia vigente', 'Download current story', '下载最新版本故事')); dl.disabled = r.state !== 'READY';
    dl.onclick = () => download();
  }
  function refreshState() { const r = S.readiness(ctx.story, { current: ctx.current, media: ctx.media, saved: ctx.saved }), b = dlg.querySelector('[data-sl="state"]');
    if (b) { b.dataset.state = r.state; b.className = 'sl-state sl-' + r.state.toLowerCase(); b.firstChild.textContent = STATE_TXT()[r.state]; }
    const dl = dlg.querySelector('[data-sl="download"]'); if (dl) dl.disabled = r.state !== 'READY';
    for (const it of r.items) { const li = dlg.querySelector(`[data-item="${CSS.escape(it.id)}"]`); if (li) { li.dataset.ok = String(it.ok); li.textContent = (it.ok ? '✓ ' : it.severity === 'BLOCKING' ? '✗ ' : '! ') + ITEM_TXT(it.id) + (it.detail && !it.ok ? ' — ' + it.detail : ''); } } }
  function download() {
    const man = S.manifest(ctx.story, ctx.files.map(f => ({ chapterId: f.chapterId, file: f.file, sha256: f.sha256, bytes: f.bytes.length })));
    const entries = new Map([['historia/manifiesto.json', new TextEncoder().encode(JSON.stringify(man, null, 1) + '\n')], ...ctx.files.map(f => [f.file, f.bytes])]);
    const bytes = window.FloorPlanPackage.zip(entries, { check: n => { if (!/^historia\/([0-9]{2}-[a-z0-9-]{1,60}\.png|manifiesto\.json)$/i.test(n)) throw Error('Ruta no permitida: ' + n); return n; } });
    const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type: 'application/zip' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'rubik-historia-del-cambio.zip' }, document.body); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    ctx.lastManifest = man; return man;
  }
  async function load(fresh = false) {
    const { story, current } = await makeStory(ctx.pair);
    const saved = fresh ? null : store.get(keyOf(ctx.pair));
    // Una historia guardada se reabre TAL CUAL (con sus huellas): si las revisiones cambiaron, queda obsoleta.
    ctx.story = saved && saved.schema === S.SCHEMA ? JSON.parse(JSON.stringify(saved)) : story; ctx.saved = saved && saved.schema === S.SCHEMA ? saved : null;
    ctx.current = current; ctx.media = ctx.media || {}; ctx.files = ctx.files || [];
    ctx.comparison = Compare.compare(ctx.pair.before.project, ctx.pair.after.project, { relation: 'library-variant' });
  }
  async function open() {
    const targets = await pairs(); ctx = { targets, pair: targets.pairs?.[0] || null, media: {}, files: [] };
    if (ctx.pair) await load();
    render(); ensure().showModal(); dlg.querySelector('[data-sl="close"]')?.focus();
  }
  window.FloorPlanStoryLayersUI = Object.freeze({ open, get state() { return ctx && S.readiness(ctx.story, { current: ctx.current, media: ctx.media, saved: ctx.saved }); }, get manifest() { return ctx?.lastManifest || null; } });
})();
