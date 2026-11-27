/* RUBIK SOTA · §8 D3 Dossier del proyecto · panel «Preparado para» dentro del diálogo del dossier.
   Reutiliza la ficha de cliente de StoryLayers (misma forma, mismo saneado), Mi estudio (FloorPlanBrandUI.snapshot) y la
   ayuda local (FloorPlanDossierClient.draft): borrador visible → editar / aceptar / descartar. Guarda por proyecto en este
   navegador. Las notas internas se quedan aquí: el documento del cliente nunca las incluye. */
(function () {
  'use strict';
  const app = window.FloorPlanApp, C = window.FloorPlanDossierClient; if (!app || !C) return;
  const KEY = 'rubik-dossier-client-v1', PKEY = 'rubik-story-proposal-v1';
  const lang = () => typeof LANG === 'string' ? LANG : 'es';
  const L = (es, en, zh) => ({ es, en, zh })[lang()] || es;
  const el = (tag, attrs, parent, text) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) n.setAttribute(k, v); if (text !== undefined) n.textContent = text; parent?.append(n); return n; };
  const all = k => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch { return {}; } };
  const load = () => C.normalize(all(KEY)[app.entryId]);
  const save = s => { const a = all(KEY); a[app.entryId] = C.normalize(s); try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { } };
  // Ficha de la historia (StoryLayers) del mismo proyecto: la más reciente con nombre.
  const storyClient = () => { const a = all(PKEY); const k = Object.keys(a).reverse().find(k => k.startsWith(app.entryId + '→') && a[k]?.client?.name); return k ? a[k].client : null; };
  let panel = null, rerender = () => { }, draftBox = null, dlg = null, step = 'client', nav = null;
  const STEPS = [['client', () => L('Cliente y contacto', 'Client and contact', '客户与联系方式')], ['note', () => L('Nota de presentación', 'Cover note', '封面说明')], ['review', () => L('Revisar el dossier', 'Review the dossier', '审阅资料')]];

  function cover(brand) { return C.cover(load(), brand); }

  function field(form, s, key, label, rows) {
    const w = el('div', { class: 'dc-field', 'data-dc-field': key }, form);
    const lab = el('label', { for: 'dc-' + key }, w, label);
    const inp = el(rows ? 'textarea' : 'input', { id: 'dc-' + key, ...(rows ? { rows: String(rows) } : { type: 'text' }) }, w); inp.value = s.client[key] || ''; void lab;
    inp.oninput = () => { const st = load(); st.client[key] = inp.value; save(st); rerender(); };
    const flags = el('div', { class: 'dc-flags' }, w);
    for (const [f, t] of [['use', L('Usar para redactar', 'Use for writing', '用于撰写')], ['show', L('Mostrar en el dossier', 'Show in the dossier', '在资料中显示')]]) {
      const l = el('label', {}, flags), cb = el('input', { type: 'checkbox', 'data-dc-flag': f + ':' + key }, l); el('span', {}, l, t);
      cb.checked = !!s.client[f][key]; cb.onchange = () => { const st = load(); st.client[f][key] = cb.checked; save(st); rerender(); };
    }
  }

  function render() {
    if (!panel) return; const s = load(), b = window.FloorPlanBrandUI?.snapshot?.() || null;
    panel.replaceChildren(); paintNav();
    const body = el('div', { class: 'dc-body' }, panel);
    const part = (name, node) => { node.dataset.dcPart = name; return node; };
    const src = part('client', el('div', { class: 'dc-row' }, body));
    const file = el('input', { type: 'file', accept: 'application/json,.json', id: 'dcClientFile', hidden: '' }, src);
    const loadBtn = el('button', { type: 'button', class: 'btn', id: 'dcLoadClient' }, src, L('Cargar ficha del cliente (JSON)', 'Load client file (JSON)', '载入客户资料（JSON）'));
    loadBtn.onclick = () => file.click();
    file.onchange = async () => { const f = file.files[0]; file.value = ''; if (!f) return; try { const r = C.clientFromFile(await f.text()); const st = load(); st.client = r.client; save(st); render(); rerender(); window.toast?.(L('Ficha cargada. Marca qué se usa y qué se muestra.', 'File loaded. Choose what is used and what is shown.', '已载入。请选择使用与显示的字段。') + (r.ignored.length ? ' ' + L('Campos ignorados: ', 'Ignored fields: ', '已忽略：') + r.ignored.join(', ') : ''), 5000); } catch (e) { window.toast?.(L('La ficha no se pudo leer: ', 'The file could not be read: ', '无法读取：') + e.message, 6000); } };
    const sc = storyClient();
    if (sc) { const u = el('button', { type: 'button', class: 'btn', id: 'dcStoryClient' }, src, L('Usar la ficha de la historia', 'Use the story client file', '使用说明中的客户资料')); u.onclick = () => { const st = load(); st.client = sc; save(st); render(); rerender(); }; }
    el('p', { class: 'dc-step-intro', 'data-dc-part': 'client' }, body, L('Quién recibe el dossier y qué datos salen en la portada. Cada dato: «Usar para redactar» (ayuda a escribir la nota) y «Mostrar en el dossier» (sale impreso), por separado.', 'Who receives the dossier and which data go on the cover. Each item: «Use for writing» and «Show in the dossier», separately.', '谁收到资料以及封面显示哪些数据。'));
    field(body, s, 'name', L('Nombre del cliente', 'Client name', '客户名称'));
    const tw = part('client', el('div', { class: 'dc-field' }, body)); el('label', { for: 'dc-treatment' }, tw, L('Tratamiento (opcional)', 'Title (optional)', '称谓（可选）'));
    const ti = el('input', { id: 'dc-treatment', type: 'text' }, tw); ti.value = s.client.treatment || ''; ti.oninput = () => { const st = load(); st.client.treatment = ti.value; save(st); rerender(); };
    field(body, s, 'preferences', L('Lo que pidió el cliente', 'What the client asked for', '客户要求'), 2);
    field(body, s, 'requirements', L('Requisitos', 'Requirements', '要求'), 2);
    // Contacto de Mi estudio: se elige qué aparece; nada se vuelve a teclear.
    const cw = part('client', el('fieldset', { class: 'dc-contact' }, body)); el('legend', {}, cw, L('Contacto de Mi estudio en la portada', 'My studio contact on the cover', '封面上的工作室联系方式'));
    const names = { email: L('Correo', 'Email', '邮箱'), phone: L('Teléfono', 'Phone', '电话'), web: 'Web' };
    for (const k of C.CONTACT) { const l = el('label', {}, cw), cb = el('input', { type: 'checkbox', 'data-dc-contact': k }, l); el('span', {}, l, names[k] + (b?.[k] ? ' · ' + b[k] : ' · ' + L('sin dato en Mi estudio', 'not set in My studio', '工作室未设置'))); cb.disabled = !b?.[k]; cb.checked = !cb.disabled && s.contact.fields.includes(k);
      cb.onchange = () => { const st = load(); st.contact.fields = C.CONTACT.filter(x => x === k ? cb.checked : st.contact.fields.includes(x)); save(st); rerender(); }; }
    if (C.CONTACT.some(k => !b?.[k])) { const r = el('div', { class: 'dc-row' }, cw);
      el('span', { class: 'dc-hint' }, r, L('Los datos que faltan se completan en Mi estudio → «Tu marca profesional».', 'Missing data are completed in My studio → «Your professional brand».', '缺少的数据在“我的工作室”中补充。'));
      const ms = el('button', { type: 'button', class: 'btn', id: 'dcOpenStudio' }, r, L('Abrir Mi estudio', 'Open My studio', '打开我的工作室'));
      ms.onclick = () => { const m = document.getElementById('brandManage'); if (!m) return; m.click(); const d = [...document.querySelectorAll('dialog[open]')].pop(); if (d && d !== dlg) d.addEventListener('close', () => { render(); rerender(); }, { once: true }); }; }
    // Nota de presentación con ayuda local.
    const nw = part('note', el('div', { class: 'dc-field' }, body)); el('label', { for: 'dc-note' }, nw, L('Nota de presentación (sale en la portada)', 'Cover note (printed on the cover)', '封面说明'));
    const note = el('textarea', { id: 'dc-note', rows: '3' }, nw); note.value = s.note; note.oninput = () => { const st = load(); st.note = note.value; save(st); rerender(); };
    const help = el('button', { type: 'button', class: 'btn', id: 'dcAssist' }, nw, L('Ayuda para redactar', 'Writing help', '写作帮助'));
    draftBox = el('div', { class: 'dc-draft', id: 'dcDraft', hidden: '' }, nw);
    help.onclick = () => showDraft(note);
    const iw = part('note', el('div', { class: 'dc-field dc-internal' }, body)); el('p', { class: 'dc-hint' }, iw, L('Solo para tu estudio: nunca salen en el dossier ni en el PDF.', 'For your studio only: never in the dossier or the PDF.', '仅供工作室使用。')); el('label', { for: 'dc-internal' }, iw, L('Notas internas (no salen en el dossier)', 'Internal notes (never printed)', '内部备注（不打印）'));
    const internal = el('textarea', { id: 'dc-internal', rows: '2' }, iw); internal.value = s.internal; internal.oninput = () => { const st = load(); st.internal = internal.value; save(st); };
    const D = window.FloorPlanDossier; if (D) { const c = D.contents(), miss = C.missing(c.sections, D.STYLES[D.style].sections);
      const mw = part('review', el('div', { class: 'dc-missing', id: 'dcMissing', role: 'status' }, body));
      const lbl = { sheet: L('lámina del plano', 'plan sheet', '平面图'), surfaces: L('superficies', 'areas', '面积'), orientation: L('orientación', 'orientation', '朝向'), site: L('emplazamiento', 'site', '场地'), views: L('vistas 3D preparadas', 'prepared 3D views', '三维视图'), review: L('revisión del cliente', 'client review', '客户审阅'), economic: L('presupuesto preparado', 'prepared budget', '预算') };
      mw.textContent = miss.length ? L('Antes de imprimir · falta: ', 'Before printing · missing: ', '打印前 · 缺少：') + miss.map(k => lbl[k] || k).join(', ') + L('. Esas páginas dicen qué falta; no se inventa nada.', '. Those pages say what is missing; nothing is invented.', '。') : L('Todas las secciones de este estilo tienen contenido real.', 'Every section of this style has real content.', '此风格所有部分均有真实内容。');
      // Datos pendientes con una entrada real para completarlos: se ofrece desde el aviso y se vuelve al dossier con lo escrito.
      if (miss.includes('views') && document.querySelector('#professionalWorkspace [data-route="prepare-views"]')) { const pv = el('button', { type: 'button', class: 'btn', id: 'dcPrepareViews' }, mw, L('Preparar imágenes', 'Prepare images', '准备图像')); pv.onclick = prepareViews; } }
    // Pie del paso: una acción principal por vista.
    const foot = el('div', { class: 'dc-foot' }, body);
    const idx = STEPS.findIndex(x => x[0] === step);
    if (idx > 0) el('button', { type: 'button', class: 'btn', id: 'dcPrev' }, foot, '← ' + STEPS[idx - 1][1]()).onclick = () => go(STEPS[idx - 1][0]);
    if (idx < STEPS.length - 1) el('button', { type: 'button', class: 'btn primary', id: 'dcNext' }, foot, L('Siguiente: ', 'Next: ', '下一步：') + STEPS[idx + 1][1]().toLowerCase()).onclick = () => go(STEPS[idx + 1][0]);
  }

  function paintNav() { if (!nav) return; nav.replaceChildren();
    STEPS.forEach(([k, t], i) => { const li = el('li', {}, nav); const b = el('button', { type: 'button', 'data-dc-step': k }, li, (i + 1) + ' · ' + t()); if (k === step) b.setAttribute('aria-current', 'step'); b.onclick = () => go(k); }); }
  function go(k) { step = k; if (dlg) dlg.dataset.dcStep = k; render(); rerender(); (panel.querySelector('[data-dc-part="' + k + '"] input, [data-dc-part="' + k + '"] textarea') || nav.querySelector('[aria-current]'))?.focus({ preventScroll: true }); if (k === 'review') dlg?.querySelector('#dossierDocument')?.scrollIntoView({ block: 'start' }); }
  // «Preparar imágenes» desde el aviso: se cierra el dossier, se preparan las vistas reales y se vuelve al paso de revisión.
  // Lo escrito ya está guardado (se guarda al teclear), así que nada se pierde.
  function prepareViews() { const style = window.FloorPlanDossier?.style || 'client'; const r = document.querySelector('#professionalWorkspace [data-route="prepare-views"]'); if (!r) return;
    dlg.close(); r.click(); window.toast?.(L('Preparando las vistas reales… volverás al dossier.', 'Preparing the real views… you will return to the dossier.', '正在准备视图…'), 4000); let n = 0;
    const t = setInterval(() => { n++; const st = window.FloorPlanProjectViews?.status?.(); if (st === 'ready' || n > 400) { clearInterval(t); setTimeout(() => { window.FloorPlanDossier?.open?.(style); go('review'); }, 400); } }, 500); }
  function showDraft(note) {
    const D = window.FloorPlanDossier, c = D?.contents?.(), s = load();
    const area = c?.metrics?.areaM2 != null ? (lang() === 'en' ? c.metrics.areaM2.toFixed(2) : c.metrics.areaM2.toFixed(2).replace('.', ',')) + ' m²' : null;
    const ctx = C.context({ area, rooms: c?.summary?.roomsCounted || 0, views: c?.views?.length || 0, sheet: !!c?.sections?.sheet, client: s.client, lang: lang() });
    const d = C.draft(ctx); draftBox.hidden = false; draftBox.replaceChildren();
    el('p', { class: 'dc-draft-label' }, draftBox, C.label(lang()) + ' · ' + L('borrador, revísalo antes de aceptar', 'draft, review before accepting', '草稿，请先审阅'));
    const ta = el('textarea', { id: 'dcDraftText', rows: '4' }, draftBox); ta.value = d.text;
    const asks = el('ul', { class: 'dc-asks' }, draftBox); for (const a of d.asks) el('li', {}, asks, a);
    el('p', { class: 'dc-used' }, draftBox, L('Datos usados: ', 'Data used: ', '使用的数据：') + (d.used.join(', ') || '—'));
    const row = el('div', { class: 'dc-row' }, draftBox);
    el('button', { type: 'button', class: 'btn primary', id: 'dcAccept' }, row, L('Aceptar en la nota', 'Accept into the note', '接受')).onclick = () => { const st = load(); st.note = ta.value; save(st); note.value = st.note; draftBox.hidden = true; rerender(); };
    el('button', { type: 'button', class: 'btn', id: 'dcDiscard' }, row, L('Descartar', 'Discard', '放弃')).onclick = () => { draftBox.hidden = true; };
    ta.focus();
  }

  window.FloorPlanDossierClientUI = { cover, get step() { return step; }, go,
    mount(dialog, after, onChange) { dlg = dialog; dialog.dataset.dcStep = step;
      nav = el('ol', { class: 'dc-steps', 'aria-label': L('Pasos del dossier', 'Dossier steps', '步骤') }); dialog.querySelector('.dossier-tools').after(nav);
      panel = document.createElement('section'); panel.className = 'dossier-client'; panel.id = 'dossierClient'; after.after(panel); rerender = () => { onChange(); }; },
    refresh() { render(); } };
})();
