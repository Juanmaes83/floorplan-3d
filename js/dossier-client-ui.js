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
  let panel = null, rerender = () => { }, draftBox = null;

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
    panel.replaceChildren();
    el('summary', {}, panel, L('Preparado para · cliente, contacto y nota', 'Prepared for · client, contact and note', '编制对象 · 客户、联系方式与说明'));
    const body = el('div', { class: 'dc-body' }, panel);
    const src = el('div', { class: 'dc-row' }, body);
    const file = el('input', { type: 'file', accept: 'application/json,.json', id: 'dcClientFile', hidden: '' }, src);
    const loadBtn = el('button', { type: 'button', class: 'btn', id: 'dcLoadClient' }, src, L('Cargar ficha del cliente (JSON)', 'Load client file (JSON)', '载入客户资料（JSON）'));
    loadBtn.onclick = () => file.click();
    file.onchange = async () => { const f = file.files[0]; file.value = ''; if (!f) return; try { const r = C.clientFromFile(await f.text()); const st = load(); st.client = r.client; save(st); render(); rerender(); window.toast?.(L('Ficha cargada. Marca qué se usa y qué se muestra.', 'File loaded. Choose what is used and what is shown.', '已载入。请选择使用与显示的字段。') + (r.ignored.length ? ' ' + L('Campos ignorados: ', 'Ignored fields: ', '已忽略：') + r.ignored.join(', ') : ''), 5000); } catch (e) { window.toast?.(L('La ficha no se pudo leer: ', 'The file could not be read: ', '无法读取：') + e.message, 6000); } };
    const sc = storyClient();
    if (sc) { const u = el('button', { type: 'button', class: 'btn', id: 'dcStoryClient' }, src, L('Usar la ficha de la historia', 'Use the story client file', '使用说明中的客户资料')); u.onclick = () => { const st = load(); st.client = sc; save(st); render(); rerender(); }; }
    field(body, s, 'name', L('Nombre del cliente', 'Client name', '客户名称'));
    const tw = el('div', { class: 'dc-field' }, body); el('label', { for: 'dc-treatment' }, tw, L('Tratamiento (opcional)', 'Title (optional)', '称谓（可选）'));
    const ti = el('input', { id: 'dc-treatment', type: 'text' }, tw); ti.value = s.client.treatment || ''; ti.oninput = () => { const st = load(); st.client.treatment = ti.value; save(st); rerender(); };
    field(body, s, 'preferences', L('Lo que pidió el cliente', 'What the client asked for', '客户要求'), 2);
    field(body, s, 'requirements', L('Requisitos', 'Requirements', '要求'), 2);
    // Contacto de Mi estudio: se elige qué aparece; nada se vuelve a teclear.
    const cw = el('fieldset', { class: 'dc-contact' }, body); el('legend', {}, cw, L('Contacto de Mi estudio en la portada', 'My studio contact on the cover', '封面上的工作室联系方式'));
    const names = { email: L('Correo', 'Email', '邮箱'), phone: L('Teléfono', 'Phone', '电话'), web: 'Web' };
    for (const k of C.CONTACT) { const l = el('label', {}, cw), cb = el('input', { type: 'checkbox', 'data-dc-contact': k }, l); el('span', {}, l, names[k] + (b?.[k] ? ' · ' + b[k] : ' · ' + L('sin dato en Mi estudio', 'not set in My studio', '工作室未设置'))); cb.disabled = !b?.[k]; cb.checked = !cb.disabled && s.contact.fields.includes(k);
      cb.onchange = () => { const st = load(); st.contact.fields = C.CONTACT.filter(x => x === k ? cb.checked : st.contact.fields.includes(x)); save(st); rerender(); }; }
    // Nota de presentación con ayuda local.
    const nw = el('div', { class: 'dc-field' }, body); el('label', { for: 'dc-note' }, nw, L('Nota de presentación (sale en la portada)', 'Cover note (printed on the cover)', '封面说明'));
    const note = el('textarea', { id: 'dc-note', rows: '3' }, nw); note.value = s.note; note.oninput = () => { const st = load(); st.note = note.value; save(st); rerender(); };
    const help = el('button', { type: 'button', class: 'btn', id: 'dcAssist' }, nw, L('Ayuda para redactar', 'Writing help', '写作帮助'));
    draftBox = el('div', { class: 'dc-draft', id: 'dcDraft', hidden: '' }, nw);
    help.onclick = () => showDraft(note);
    const iw = el('div', { class: 'dc-field dc-internal' }, body); el('label', { for: 'dc-internal' }, iw, L('Notas internas (no salen en el dossier)', 'Internal notes (never printed)', '内部备注（不打印）'));
    const internal = el('textarea', { id: 'dc-internal', rows: '2' }, iw); internal.value = s.internal; internal.oninput = () => { const st = load(); st.internal = internal.value; save(st); };
    const D = window.FloorPlanDossier; if (D) { const c = D.contents(), miss = C.missing(c.sections, D.STYLES[D.style].sections);
      const mw = el('div', { class: 'dc-missing', id: 'dcMissing', role: 'status' }, body);
      const lbl = { sheet: L('lámina del plano', 'plan sheet', '平面图'), surfaces: L('superficies', 'areas', '面积'), orientation: L('orientación', 'orientation', '朝向'), site: L('emplazamiento', 'site', '场地'), views: L('vistas 3D preparadas', 'prepared 3D views', '三维视图'), review: L('revisión del cliente', 'client review', '客户审阅'), economic: L('presupuesto preparado', 'prepared budget', '预算') };
      mw.textContent = miss.length ? L('Antes de imprimir · falta: ', 'Before printing · missing: ', '打印前 · 缺少：') + miss.map(k => lbl[k] || k).join(', ') + L('. Esas páginas dicen qué falta; no se inventa nada.', '. Those pages say what is missing; nothing is invented.', '。') : L('Todas las secciones de este estilo tienen contenido real.', 'Every section of this style has real content.', '此风格所有部分均有真实内容。'); }
  }

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

  window.FloorPlanDossierClientUI = { cover, mount(dialog, after, onChange) { panel = document.createElement('details'); panel.className = 'dossier-client'; panel.id = 'dossierClient'; after.after(panel); rerender = () => { onChange(); }; }, refresh() { render(); } };
})();
