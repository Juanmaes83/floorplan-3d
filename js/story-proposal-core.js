/* RUBIK SOTA · StoryLayersV1 · plantilla comercial (§7.3). Núcleo PURO (UMD): window.FloorPlanStoryProposal / module.exports.
   «Mi estudio define la identidad. Cada entrega define la propuesta.»
   - La identidad llega como instantánea congelada de FloorPlanBrand (Mi estudio). Aquí solo se elige qué campos se muestran.
   - La propuesta (título, resumen, motivo, ejecución, decisión y notas) la escribe o confirma el profesional.
   - Lo que dice RUBIK (qué cambia y qué se conserva) sale de la historia comprobada, en LENGUAJE NATURAL: el documento del
     cliente no lleva identificadores, rutas de campos ni huellas (la trazabilidad técnica viaja aparte y no se entrega).
   - El coste solo con importes TRAZABLES del comparador de presupuestos guardados (FloorPlanRevisionBudget); si falta o no es
     comparable, queda AUSENTE y se dice qué falta valorar.
   - Las notas internas NUNCA entran en el documento ni en el manifiesto del cliente.
   - wrap()/flow(): ajuste de línea por anchura medida y paso de página; ningún texto se trunca. */
(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.FloorPlanStoryProposal = api; })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const VERSION = 1, LIMITS = { title: 140, summary: 1200, why: 2000, how: 2000, decision: 600, note: 800, clientName: 120, treatment: 40, preferences: 600, requirements: 600 }, MAX_NOTES = 40;
  const CLIENT = ['name', 'preferences', 'requirements'];
  const CONTACT = ['person', 'phone', 'email', 'web'], VIS = ['client', 'internal'];
  // Texto del profesional: se conservan los saltos de línea; se quitan controles y espacios repetidos.
  const clean = (v, max) => String(v ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
  const fail = m => { throw Error(m); };

  const T = {
    es: { current: 'Estado actual', proposal: 'Propuesta', changes: 'Qué cambia', kept: 'Qué se conserva', where: 'Qué se propone y dónde', why: 'Por qué y qué mejora busca',
      how: 'Cómo se haría y qué implica', cost: 'Cuánto cuesta y qué incluye', decision: 'Qué debes decidir ahora', notes: 'Notas', note: 'Nota',
      pendingDefine: 'Pendiente de definir por el estudio.', pendingValue: 'Pendiente de valorar.', title: n => `Propuesta de cambio · ${n}`,
      netKept: v => `La superficie útil se conserva: ${v} m².`, netChange: (b, a) => `La superficie útil pasa de ${b} m² a ${a} m².`,
      roomsKept: n => `Se conservan las ${n} estancias.`, roomsChange: (b, a) => `Las estancias pasan de ${b} a ${a}.`,
      layoutKept: 'La distribución se conserva: no se añade ni se quita ningún muro.', layoutChange: (a, g) => `Distribución: ${a} muro(s) nuevo(s) y ${g} quitado(s) o a demoler.`,
      furnitureChange: (a, g, m) => `Mobiliario: ${a} mueble(s) nuevo(s), ${g} quitado(s) y ${m} movido(s) o cambiado(s).`, otherChange: n => `Otros ajustes en los datos del proyecto: ${n}.`,
      openingsKept: 'Puertas y ventanas se conservan.', openingsChange: (a, g) => `Puertas y ventanas: ${a} hueco(s) nuevo(s) y ${g} quitado(s).`,
      areaChange: (n, b, a) => `${n}: la superficie pasa de ${b} m² a ${a} m².`, roomNew: (n, a) => `${n}: estancia nueva de ${a} m².`, roomGone: (n, b) => `${n}: se elimina (tenía ${b} m²).`,
      floorChange: (n, b, a) => `Suelo de ${n}: ${b} → ${a}.`, absent: 'no existe', notDeclared: 'sin acabado declarado',
      summary: c => c.length ? `Proponemos: ${c.join(' ')}` : 'No hay cambios entre las dos revisiones.',
      costNone: 'No hay un presupuesto guardado que corresponda a esta propuesta.', costIncoherent: 'El presupuesto guardado no corresponde a esta revisión del proyecto: no se dan importes.',
      costProposal: (n, g, t) => `Presupuesto de la propuesta: ${n} sin IVA · ${g} con IVA (${t} %).`, costCurrent: n => `Presupuesto del estado actual: ${n} sin IVA.`,
      costDelta: d => `Diferencia frente al estado actual: ${d} sin IVA.`, costPartial: (k, d) => `Diferencia en las ${k} partidas que se pueden comparar: ${d} sin IVA. No es la diferencia total.`,
      costPendingItems: n => `${n} partida(s) pendientes de valorar.`, costProvisional: 'Hay precios sin revisar: los importes son provisionales.',
      costOneSided: 'No hay presupuesto del estado actual con el que comparar.', credit: n => `Preparado por ${n} con RUBIK SOTA`, creditNone: 'Preparado con RUBIK SOTA',
      page: (i, n) => `Página ${i} de ${n}` },
    en: { current: 'Current state', proposal: 'Proposal', changes: 'What changes', kept: 'What is kept', where: 'What is proposed and where', why: 'Why and what it aims to improve',
      how: 'How it would be done and what it involves', cost: 'What it costs and what it includes', decision: 'What you need to decide now', notes: 'Notes', note: 'Note',
      pendingDefine: 'To be defined by the studio.', pendingValue: 'To be priced.', title: n => `Proposed change · ${n}`,
      netKept: v => `The usable area is kept: ${v} m².`, netChange: (b, a) => `The usable area goes from ${b} m² to ${a} m².`,
      roomsKept: n => `All ${n} rooms are kept.`, roomsChange: (b, a) => `Rooms go from ${b} to ${a}.`,
      layoutKept: 'The layout is kept: no wall is added or removed.', layoutChange: (a, g) => `Layout: ${a} new wall(s) and ${g} removed or to be demolished.`,
      furnitureChange: (a, g, m) => `Furniture: ${a} new piece(s), ${g} removed and ${m} moved or changed.`, otherChange: n => `Other adjustments in the project data: ${n}.`,
      openingsKept: 'Doors and windows are kept.', openingsChange: (a, g) => `Doors and windows: ${a} new opening(s) and ${g} removed.`,
      areaChange: (n, b, a) => `${n}: the area goes from ${b} m² to ${a} m².`, roomNew: (n, a) => `${n}: new room of ${a} m².`, roomGone: (n, b) => `${n}: removed (it had ${b} m²).`,
      floorChange: (n, b, a) => `Floor of ${n}: ${b} → ${a}.`, absent: 'does not exist', notDeclared: 'no declared finish',
      summary: c => c.length ? `We propose: ${c.join(' ')}` : 'There are no changes between the two revisions.',
      costNone: 'There is no saved budget matching this proposal.', costIncoherent: 'The saved budget does not match this revision of the project: no amounts are given.',
      costProposal: (n, g, t) => `Budget of the proposal: ${n} excl. VAT · ${g} incl. VAT (${t} %).`, costCurrent: n => `Budget of the current state: ${n} excl. VAT.`,
      costDelta: d => `Difference from the current state: ${d} excl. VAT.`, costPartial: (k, d) => `Difference in the ${k} comparable items: ${d} excl. VAT. It is not the total difference.`,
      costPendingItems: n => `${n} item(s) still to be priced.`, costProvisional: 'Some prices are unreviewed: the amounts are provisional.',
      costOneSided: 'There is no budget of the current state to compare with.', credit: n => `Prepared by ${n} with RUBIK SOTA`, creditNone: 'Prepared with RUBIK SOTA',
      page: (i, n) => `Page ${i} of ${n}` } };
  const tr = lang => T[lang] || T.es;
  const num = (v, lang) => { const s = (Math.round(v * 100) / 100).toFixed(Number.isInteger(Math.round(v * 100) / 100) ? 0 : 2); return lang === 'en' ? s : s.replace('.', ','); };
  const eur = (v, lang) => { const n = Math.round(v * 100) / 100, a = Math.abs(n).toFixed(2).split('.'), g = a[0].replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : '.');
    return (n < 0 ? '−' : '') + (lang === 'en' ? `€${g}.${a[1]}` : `${g},${a[1]} €`); };
  const signed = (v, lang) => (v > 0 ? '+' : '') + eur(v, lang);

  /** Propuesta normalizada. chapterIds: capítulos de la historia a los que una nota puede vincularse. */
  function normalize(p = {}, { chapterIds = [] } = {}) {
    const notes = (Array.isArray(p.notes) ? p.notes : []).slice(0, MAX_NOTES).map((n, i) => {
      const text = clean(n && n.text, LIMITS.note), vis = VIS.includes(n && n.visibility) ? n.visibility : 'internal';
      const anchor = n && n.anchor && n.anchor.kind === 'chapter' && chapterIds.includes(n.anchor.id) ? { kind: 'chapter', id: n.anchor.id } : { kind: 'general', id: null };
      return { id: /^nota-[a-z0-9]{1,12}$/.test(n && n.id) ? n.id : 'nota-' + (i + 1), text, visibility: vis, anchor };
    }).filter(n => n.text);
    const fields = Array.isArray(p.contact && p.contact.fields) ? CONTACT.filter(f => p.contact.fields.includes(f)) : [];
    return { version: VERSION, title: clean(p.title, LIMITS.title), summary: clean(p.summary, LIMITS.summary), why: clean(p.why, LIMITS.why), how: clean(p.how, LIMITS.how),
      decision: clean(p.decision, LIMITS.decision), contact: { fields, logo: !(p.contact && p.contact.logo === false) }, notes, client: normClient(p.client), media: normMedia(p.media) };
  }
  /* §8.2 · Cliente: datos que el profesional introduce o carga (opcional). Cada campo dice si se USA para personalizar (lo que
     recibe la ayuda de redacción) y si APARECE en la entrega. Por defecto, nada se usa ni se muestra hasta que se marca. */
  function normClient(c) {
    c = c && typeof c === 'object' ? c : {};
    const flags = o => Object.fromEntries(CLIENT.map(k => [k, !!(o && o[k] === true)]));
    return { name: clean(c.name, LIMITS.clientName), treatment: clean(c.treatment, LIMITS.treatment), preferences: clean(c.preferences, LIMITS.preferences), requirements: clean(c.requirements, LIMITS.requirements), use: flags(c.use), show: flags(c.show) };
  }
  /** Ficha cargada desde un archivo (JSON): solo los campos conocidos; lo demás se ignora y se dice. */
  function clientFromFile(json) {
    const o = typeof json === 'string' ? JSON.parse(json) : json; if (!o || typeof o !== 'object' || Array.isArray(o)) throw Error('La ficha no es un objeto JSON.');
    const pick = k => typeof o[k] === 'string' ? o[k] : Array.isArray(o[k]) ? o[k].filter(x => typeof x === 'string').join('; ') : '';
    const known = ['name', 'nombre', 'treatment', 'tratamiento', 'preferences', 'preferencias', 'requirements', 'requisitos'];
    return { client: normClient({ name: pick('name') || pick('nombre'), treatment: pick('treatment') || pick('tratamiento'), preferences: pick('preferences') || pick('preferencias'), requirements: pick('requirements') || pick('requisitos') }),
      ignored: Object.keys(o).filter(k => !known.includes(k)) };
  }
  /** Lo que la ayuda puede leer del cliente: SOLO los campos marcados «usar». */
  const clientForAssist = c => Object.fromEntries(CLIENT.filter(k => c && c.use && c.use[k] && c[k]).map(k => [k, k === 'name' && c.treatment ? c.treatment + ' ' + c.name : c[k]]));
  /* §8.2 · Medios elegidos del proyecto (vistas preparadas y vídeo del recorrido): ids, nunca bytes. */
  function normMedia(m) { m = m && typeof m === 'object' ? m : {}; return { views: (Array.isArray(m.views) ? m.views : []).filter(x => typeof x === 'string' && /^[\w:.-]{1,80}$/.test(x)).slice(0, 6), video: m.video === true }; }
  /** Estado de un medio respecto a la revisión de la propuesta: vigente, obsoleto (otra revisión de la variante), de otro
   *  proyecto (p. ej. el original) o ausente. Solo un medio VIGENTE puede entrar en la entrega. */
  function mediaState({ exists, entryId, afterId, current, storyObsolete }) {
    if (!exists) return 'absent'; if (entryId !== afterId) return 'other-entry'; if (!current || storyObsolete) return 'stale'; return 'current';
  }
  // «Internas» nunca: el filtro es el ÚNICO camino del texto de una nota hacia cualquier archivo para el cliente.
  const clientNotes = proposal => (proposal.notes || []).filter(n => n.visibility === 'client');

  /** Hechos comprobados por RUBIK, en lenguaje natural. Con el nombre VISIBLE de cada estancia (subject del capítulo). */
  function facts(story, lang = 'es') {
    const t = tr(lang), changes = [], kept = [], ch = id => story.chapters.find(c => c.id === id), val = (c, id) => c && (c.data.find(d => d.id === id) || {}).value;
    const ov = ch('overview'), nb = val(ov, 'net-before'), na = val(ov, 'net-after'), rb = val(ov, 'rooms-before'), ra = val(ov, 'rooms-after');
    for (const c of story.chapters) {
      if (c.kind === 'finish') changes.push(t.floorChange(c.subject || '—', val(c, 'floor-before') ?? t.notDeclared, val(c, 'floor-after') ?? t.notDeclared));
      else if (c.kind === 'room-area') { const b = val(c, 'area-before'), a = val(c, 'area-after'), n = c.subject || '—';
        changes.push(b === null ? t.roomNew(n, num(a, lang)) : a === null ? t.roomGone(n, num(b, lang)) : t.areaChange(n, num(b, lang), num(a, lang))); }
      else if (c.kind === 'layout') changes.push(t.layoutChange(val(c, 'walls-added'), val(c, 'walls-gone')));
      else if (c.kind === 'openings') changes.push(t.openingsChange(val(c, 'openings-added'), val(c, 'openings-gone')));
      else if (c.kind === 'furniture') changes.push(t.furnitureChange(val(c, 'objects-added'), val(c, 'objects-gone'), val(c, 'objects-changed')));
      else if (c.kind === 'other') changes.push(t.otherChange(val(c, 'other-count')));
    }
    if (nb !== null && na !== null && nb !== undefined) (Math.abs(nb - na) < .005 ? kept.push(t.netKept(num(na, lang))) : changes.push(t.netChange(num(nb, lang), num(na, lang))));
    if (rb !== null && ra !== null && rb !== undefined) (rb === ra ? kept.push(t.roomsKept(ra)) : changes.push(t.roomsChange(rb, ra)));
    if (!ch('layout')) kept.push(t.layoutKept);
    if (!ch('openings')) kept.push(t.openingsKept);
    return { changes, kept };
  }

  /** Coste para el cliente desde FloorPlanRevisionBudget.compareBudgets (o null). Solo importes trazables; lo demás, pendiente. */
  function cost(cmp, lang = 'es') {
    const t = tr(lang), lines = [], pending = [];
    const st = cmp && cmp.totals ? cmp.totals.status : 'none';
    if (st === 'complete') {
      const A = cmp.after, B = cmp.before; lines.push(t.costProposal(eur(A.net, lang), eur(A.gross, lang), num(A.taxRatePercent, lang)), t.costCurrent(eur(B.net, lang)), t.costDelta(signed(cmp.totals.net.delta, lang)));
      if ((A.unreviewed || []).length || (B.unreviewed || []).length) pending.push(t.costProvisional);
    } else if (st === 'partial') {
      const A = cmp.after; if (A && typeof A.net === 'number') lines.push(t.costProposal(eur(A.net, lang), eur(A.gross, lang), num(A.taxRatePercent, lang)));
      lines.push(t.costPartial(cmp.totals.comparable.items, signed(cmp.totals.comparable.netDelta, lang))); pending.push(t.costPendingItems(cmp.totals.excluded.length));
    } else if (st === 'one-sided' && cmp.after && typeof cmp.after.net === 'number') {
      lines.push(t.costProposal(eur(cmp.after.net, lang), eur(cmp.after.gross, lang), num(cmp.after.taxRatePercent, lang))); pending.push(t.costOneSided);
    } else pending.push(st === 'incoherent' ? t.costIncoherent : t.costNone, t.pendingValue);
    return { status: st === 'complete' ? 'complete' : lines.length ? 'partial' : 'absent', lines, pending };
  }

  /** Identidad para esta entrega desde la instantánea de Mi estudio, con SOLO los campos elegidos. */
  function identity(snapshot, contact = { fields: [], logo: true }, lang = 'es') {
    const t = tr(lang);
    if (!snapshot || !snapshot.profile) return { present: false, name: null, logo: null, contact: '', credit: t.creditNone, fields: [] };
    const p = snapshot.profile, fields = CONTACT.filter(f => (contact.fields || []).includes(f) && p[f]);
    return { present: true, name: p.name, tagline: p.tagline || '', logo: contact.logo !== false ? (p.logo || null) : null, fields,
      contact: fields.map(f => f === 'web' ? String(p.web).replace(/^https?:\/\//, '') : p[f]).join(' · '), credit: t.credit(p.name) };
  }

  /** Documento del cliente (estructura pura; el dibujo es de la interfaz). chapterText(ch) → texto aprobado del capítulo. */
  function document({ story, proposal, identity: id, facts: f, cost: c, lang = 'es', projectName = '', chapterText = ch => ch.text, mark = null }) {
    const t = tr(lang), notes = clientNotes(proposal), side = s => s === 'before' ? t.current : t.proposal;
    const chapters = (story.order || story.chapters.map(x => x.id)).map(cid => story.chapters.find(x => x.id === cid)).filter(ch => ch && ch.kind !== 'overview').map(ch => ({
      id: ch.id, title: ch.title, text: chapterText(ch),
      // Datos del capítulo en lenguaje natural, numerados como sus marcas en las plantas (sin campos ni huellas).
      data: ch.data.map((d, i) => ({ n: i + 1, marked: !!d.anchor, text: `${side(d.revision.side)} · ${d.label}: ${d.value === null ? t.absent : (typeof d.value === 'number' && d.unit !== 'u' ? num(d.value, lang) + ' ' + d.unit : d.unit === 'u' ? d.value : d.value)}` })),
      notes: notes.filter(n => n.anchor.kind === 'chapter' && n.anchor.id === ch.id).map(n => n.text) }));
    const or = (v, p) => v ? { text: v, pending: false } : { text: p, pending: true };
    const cl = proposal.client || normClient(null), show = k => cl.show[k] && cl[k];
    const client = { addressee: show('name') ? (cl.treatment ? cl.treatment + ' ' + cl.name : cl.name) : null, requests: [show('preferences') ? cl.preferences : null, show('requirements') ? cl.requirements : null].filter(Boolean) };
    return { lang, identity: id, client, title: proposal.title || t.title(projectName || '—'), summary: proposal.summary || t.summary(f.changes), facts: f, chapters,
      hero: chapters[0] ? chapters[0].id : null, labels: { current: t.current, proposal: t.proposal, changes: t.changes, kept: t.kept, where: t.where, note: t.note, notes: t.notes },
      sections: [{ key: 'why', title: t.why, ...or(proposal.why, t.pendingDefine) }, { key: 'how', title: t.how, ...or(proposal.how, t.pendingDefine) },
        { key: 'cost', title: t.cost, lines: c.lines, pending: c.pending, status: c.status }, { key: 'decision', title: t.decision, ...or(proposal.decision, t.pendingDefine) }],
      // Una nota de un capítulo que no tiene página propia (p. ej. el resumen, que va en la portada) pasa a las generales: nunca se pierde.
      generalNotes: notes.filter(n => n.anchor.kind === 'general' || !chapters.some(c => c.id === n.anchor.id)).map(n => n.text), credit: id.credit, page: t.page, mark };
  }

  /** Manifiesto que se ENTREGA al cliente: qué contiene cada página, en lenguaje natural. Sin notas internas, sin huellas de
   *  revisión ni rutas de campos (la trazabilidad técnica vive en el archivo interno). Solo la huella de cada imagen, para
   *  poder comprobar que el archivo no se alteró. */
  function clientManifest(doc, pages, { date } = {}) {
    return { schema: 'rubik-sota.story-client', version: '1.0.0', title: doc.title, preparedBy: doc.identity.present ? doc.identity.name : null, preparedFor: doc.client ? doc.client.addressee : null, requests: doc.client ? doc.client.requests : [], date: date || null,
      summary: doc.summary, changes: doc.facts.changes, kept: doc.facts.kept, sections: doc.sections.map(s => ({ title: s.title, text: s.text ?? null, lines: s.lines || null, pending: s.pending === true || (Array.isArray(s.pending) ? s.pending : false) })),
      notes: [...doc.generalNotes, ...doc.chapters.flatMap(c => c.notes)], pages: pages.filter(p => !p.attachment).map(p => ({ file: p.file, sha256: p.sha256, bytes: p.bytes, content: p.content })),
      attachments: pages.filter(p => p.attachment).map(p => ({ file: p.file, sha256: p.sha256, bytes: p.bytes, content: p.content })) };
  }

  /** Ajuste de línea: respeta los saltos del texto, parte por palabras y, si una palabra no cabe, por caracteres. Nunca trunca. */
  function wrap(text, width, measure) {
    const out = [];
    for (const para of String(text ?? '').split('\n')) {
      if (!para.trim()) { out.push(''); continue; }
      let line = '';
      for (const word of para.split(/ +/)) {
        const cand = line ? line + ' ' + word : word;
        if (measure(cand) <= width) { line = cand; continue; }
        if (line) out.push(line);
        if (measure(word) <= width) { line = word; continue; }
        let piece = ''; for (const chr of word) { if (measure(piece + chr) > width && piece) { out.push(piece); piece = chr; } else piece += chr; } line = piece;
      }
      out.push(line);
    }
    return out;
  }
  /** Paso de página: items {h, split?} en orden; los de texto (split = alturas de línea) continúan en la página siguiente.
   *  Devuelve páginas con los trozos colocados. Un item indivisible que no cabe empieza página nueva. */
  function flow(items, pageH) {
    const pages = [[]]; let y = 0;
    const push = it => { pages[pages.length - 1].push({ ...it, y }); y += it.h; };
    const hOf = x => x && x.lines ? x.lines.length * x.lh + (x.pad || 0) : x ? x.h : 0;
    items.forEach((it0, k) => {
      // El alto de un bloque de texto SALE de sus líneas (nunca de un alto declarado que podría no coincidir).
      const it = it0.lines ? { ...it0, h: hOf(it0) } : it0;
      if (it.pageBreak) { if (pages[pages.length - 1].length) { pages.push([]); y = 0; } return; }
      // Un título nunca queda solo al pie: va con el comienzo de lo que le sigue (dos líneas o el bloque entero).
      if (it.keep && pages[pages.length - 1].length) { const nx = items[k + 1], need = it.h + (nx ? (nx.lines ? Math.min(hOf(nx), nx.lh * 2 + (nx.pad || 0)) : nx.h) : 0);
        if (y + need > pageH) { pages.push([]); y = 0; } }
      if (y + it.h <= pageH) { push(it); return; }
      if (it.lines && it.lines.length > 1) {
        let rest = it.lines.slice(), first = true;
        while (rest.length) {
          const fit = Math.max(0, Math.floor((pageH - y - (first ? it.pad || 0 : 0)) / it.lh));
          if (fit < 1) { pages.push([]); y = 0; first = false; continue; }
          const part = rest.slice(0, fit); rest = rest.slice(fit);
          push({ ...it, lines: part, h: part.length * it.lh + (first ? it.pad || 0 : 0), cont: !first }); first = false;
          if (rest.length) { pages.push([]); y = 0; }
        }
        return;
      }
      if (pages[pages.length - 1].length) { pages.push([]); y = 0; }
      push(it);
    });
    return pages;
  }
  return Object.freeze({ VERSION, LIMITS, CONTACT, normalize, clientNotes, facts, cost, identity, document, clientManifest, clientFromFile, clientForAssist, mediaState, CLIENT, wrap, flow, eur, num });
});
