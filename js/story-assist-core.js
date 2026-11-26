/* RUBIK SOTA · StoryLayersV1 · ayuda de redacción (§8.1 «Redactar»). Núcleo PURO (UMD): window.FloorPlanStoryAssist.
   Adaptador de texto LOCAL («simulador»): convierte los hechos comprobados de un capítulo en lenguaje claro y pide al
   profesional lo que solo él puede aportar (motivo, método, decisión; beneficios, plazos y costes). No hay red ni modelo de
   lenguaje: cada frase sale de un dato de la historia o del cliente, y la ayuda dice cuáles ha usado.
   - context(): el ÚNICO contexto que recibe un adaptador. Contiene el capítulo (título, tipo y datos en lenguaje natural), lo
     que se conserva, si la propuesta ya tiene motivo/método/decisión (sí o no, nunca su texto) y SOLO los campos del cliente
     marcados «usar para redactar». Nada de identificadores, huellas, notas internas ni datos de trabajo.
   - Un adaptador externo (p. ej. el Asistente IA cuando tenga redacción autorizada) recibiría exactamente este contexto y
     devolvería un borrador que el profesional ve, edita, acepta o descarta antes de insertarlo. */
(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.FloorPlanStoryAssist = api; })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const T = {
    es: {
      label: 'Ayuda de redacción · sin conexión: frases a partir de los datos del proyecto',
      finish: (n, b, a) => `En ${n} proponemos cambiar el suelo de ${b} a ${a}.`,
      area: (n, b, a) => b === null ? `Proponemos una estancia nueva, ${n}, de ${a} m².` : a === null ? `Proponemos integrar ${n} (${b} m²) en el resto de la vivienda.` : `${n} pasa de ${b} m² a ${a} m².`,
      furniture: (a, g, m) => `Proponemos ajustar el mobiliario: ${[a ? `${a} pieza(s) nueva(s)` : '', g ? `retirar ${g} pieza(s)` : '', m ? `mover o cambiar ${m}` : ''].filter(Boolean).join(', ')}.`,
      layout: (a, g) => `Proponemos cambiar la distribución: ${a} muro(s) nuevo(s) y ${g} que se retiran.`,
      openings: (a, g) => `Proponemos ${a} hueco(s) nuevo(s) y retirar ${g}.`,
      other: n => `Incluye ${n} ajuste(s) más del proyecto.`,
      keptBoth: 'La superficie útil y la distribución se conservan.', keptArea: 'La superficie útil se conserva.', keptLayout: 'La distribución se conserva.',
      prefs: p => `Lo planteamos teniendo en cuenta lo que nos indicó: ${p}.`, reqs: r => `Respeta este requisito: ${r}.`, forName: n => `Para ${n}.`,
      askWhy: '¿Por qué lo propones y qué mejora para el cliente? (lo aportas tú)', askHow: '¿Cómo se haría: alcance, método, remates, plazos? (lo aportas tú)', askDecision: '¿Qué debe decidir el cliente ahora? (lo aportas tú)',
      askValidate: 'Beneficios, plazos y costes no se deducen de los datos: valídalos tú antes de aceptar.',
      used: { chapter: 'Datos comprobados del capítulo', kept: 'Lo que se conserva', name: 'Nombre del cliente', preferences: 'Preferencias del cliente', requirements: 'Requisitos del cliente' } },
    en: {
      label: 'Writing help · offline: sentences from the project data',
      finish: (n, b, a) => `In ${n} we propose changing the floor from ${b} to ${a}.`,
      area: (n, b, a) => b === null ? `We propose a new room, ${n}, of ${a} m².` : a === null ? `We propose merging ${n} (${b} m²) into the rest of the home.` : `${n} goes from ${b} m² to ${a} m².`,
      furniture: (a, g, m) => `We propose adjusting the furniture: ${[a ? `${a} new piece(s)` : '', g ? `removing ${g} piece(s)` : '', m ? `moving or changing ${m}` : ''].filter(Boolean).join(', ')}.`,
      layout: (a, g) => `We propose changing the layout: ${a} new wall(s) and ${g} removed.`,
      openings: (a, g) => `We propose ${a} new opening(s) and removing ${g}.`,
      other: n => `It includes ${n} more project adjustment(s).`,
      keptBoth: 'The usable area and the layout are kept.', keptArea: 'The usable area is kept.', keptLayout: 'The layout is kept.',
      prefs: p => `We have taken into account what you told us: ${p}.`, reqs: r => `It respects this requirement: ${r}.`, forName: n => `For ${n}.`,
      askWhy: 'Why do you propose it and what does it improve for the client? (your input)', askHow: 'How would it be done: scope, method, finishing, timing? (your input)', askDecision: 'What should the client decide now? (your input)',
      askValidate: 'Benefits, timing and costs cannot be inferred from the data: validate them before accepting.',
      used: { chapter: 'Verified chapter data', kept: 'What is kept', name: 'Client name', preferences: 'Client preferences', requirements: 'Client requirements' } } };
  const tr = lang => T[lang] || T.es;
  const val = (ch, id) => { const d = (ch.data || []).find(x => x.id === id); return d ? d.value : undefined; };
  const num = (v, lang) => typeof v === 'number' ? (lang === 'en' ? String(Math.round(v * 100) / 100) : String(Math.round(v * 100) / 100).replace('.', ',')) : v;

  /** Contexto mínimo y autorizado para un adaptador. kept: frases «se conserva» de facts(); client: clientForAssist(). */
  function context({ chapter, kept = [], proposal = {}, client = {}, lang = 'es' }) {
    if (!chapter) throw Error('context: chapter is required');
    return { lang, chapter: { kind: chapter.kind, subject: chapter.subject || null, title: chapter.title, data: (chapter.data || []).map(d => ({ id: d.id, label: d.label, value: d.value, unit: d.unit })) },
      kept: kept.slice(0, 6), filled: { why: !!proposal.why, how: !!proposal.how, decision: !!proposal.decision }, client: { ...client } };
  }

  /** Adaptador local. Devuelve { text, asks, used }: el borrador, las preguntas al profesional y qué datos se usaron. */
  const local = Object.freeze({ id: 'rubik-texto-local', label: lang => tr(lang).label, draft(ctx) {
    const t = tr(ctx.lang), ch = ctx.chapter, L = ctx.lang, parts = [], used = [t.used.chapter];
    const v = id => val(ch, id);
    if (ch.kind === 'finish') parts.push(t.finish(ch.subject || ch.title, v('floor-before') ?? '—', v('floor-after') ?? '—'));
    else if (ch.kind === 'room-area') parts.push(t.area(ch.subject || ch.title, v('area-before') === null ? null : num(v('area-before'), L), v('area-after') === null ? null : num(v('area-after'), L)));
    else if (ch.kind === 'furniture') parts.push(t.furniture(v('objects-added') || 0, v('objects-gone') || 0, v('objects-changed') || 0));
    else if (ch.kind === 'layout') parts.push(t.layout(v('walls-added') || 0, v('walls-gone') || 0));
    else if (ch.kind === 'openings') parts.push(t.openings(v('openings-added') || 0, v('openings-gone') || 0));
    else if (ch.kind === 'other') parts.push(t.other(v('other-count') || 0));
    const area = ctx.kept.some(k => /superficie útil se conserva|usable area is kept/i.test(k)), lay = ctx.kept.some(k => /distribución se conserva|layout is kept/i.test(k));
    if ((area || lay) && ch.kind !== 'layout' && ch.kind !== 'room-area') { parts.push(area && lay ? t.keptBoth : area ? t.keptArea : t.keptLayout); used.push(t.used.kept); }
    const c = ctx.client || {};
    if (c.preferences) { parts.push(t.prefs(c.preferences)); used.push(t.used.preferences); }
    if (c.requirements) { parts.push(t.reqs(c.requirements)); used.push(t.used.requirements); }
    if (c.name) { parts.unshift(t.forName(c.name)); used.push(t.used.name); }
    const asks = [!ctx.filled.why && t.askWhy, !ctx.filled.how && t.askHow, !ctx.filled.decision && t.askDecision, t.askValidate].filter(Boolean);
    return { text: parts.join(' '), asks, used };
  } });

  return Object.freeze({ context, local, adapters: { [local.id]: local } });
});
