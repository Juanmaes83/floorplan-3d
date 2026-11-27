/* RUBIK SOTA · §8 D3 Dossier del proyecto · cliente, contacto y nota de presentación. Núcleo PURO (UMD):
   window.FloorPlanDossierClient / module.exports. Reutiliza la ficha de cliente de StoryLayers (FloorPlanStoryProposal:
   normClient, clientFromFile, clientForAssist): no duplica su validación. Reglas:
   - La portada muestra SOLO los campos del cliente marcados «mostrar» y los datos de contacto elegidos de Mi estudio.
   - La ayuda de redacción lee SOLO los campos marcados «usar» y las cifras reales del dossier; criterio, plazos y costes
     los aporta el profesional (la ayuda los pide, no los inventa). El borrador se acepta, se edita o se descarta.
   - Las notas internas nunca salen en el documento del cliente. */
(function (root, factory) { const api = factory(root); if (typeof module === 'object' && module.exports) module.exports = api; else root.FloorPlanDossierClient = api; })(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';
  const SP = (typeof module === 'object' && module.exports) ? require('./story-proposal-core.js') : root.FloorPlanStoryProposal;
  const CONTACT = ['email', 'phone', 'web'];
  const normClient = c => SP.normalize({ client: c }).client;
  const clip = (s, n) => typeof s === 'string' ? s.replace(/\s+\n/g, '\n').trim().slice(0, n) : '';

  /** Estado guardado por proyecto: { client, contact:{fields}, note, internal }. Todo saneado. */
  function normalize(s) {
    s = s && typeof s === 'object' ? s : {};
    const fields = Array.isArray(s.contact?.fields) ? CONTACT.filter(k => s.contact.fields.includes(k)) : CONTACT.slice();
    return { client: normClient(s.client), contact: { fields }, note: clip(s.note, 900), internal: clip(s.internal, 2000) };
  }

  /** Lo que la portada del cliente puede mostrar. Nunca incluye `internal` ni campos sin «mostrar». */
  function cover(state, brand) {
    const s = normalize(state), c = s.client, show = k => c.show[k] && c[k];
    const addressee = show('name') ? (c.treatment ? c.treatment + ' ' + c.name : c.name) : null;
    const requests = ['preferences', 'requirements'].filter(show).map(k => ({ key: k, text: c[k] }));
    const contact = brand ? s.contact.fields.map(k => brand[k]).filter(Boolean) : [];
    return { addressee, requests, contact, note: s.note || null };
  }

  const T = {
    es: { area: (a, r, n) => `${n ? n + ', le' : 'Le'} presentamos el dossier de su vivienda: ${a} de superficie útil repartidos en ${r} estancias.`,
      forName: n => `Preparado para ${n}.`, prefs: p => `Hemos tenido en cuenta lo que nos indicó: ${p}.`, reqs: r => `Se respeta este requisito: ${r}.`,
      views: n => `Incluye ${n} vista(s) 3D preparada(s) del proyecto.`, plan: 'Incluye la lámina de distribución con cotas.',
      askWhy: '¿Qué quieres destacar de la propuesta y por qué? (lo aportas tú)', askNext: '¿Qué paso siguiente propones al cliente? (lo aportas tú)',
      askValidate: 'Plazos, costes y calidades no se deducen del plano: añádelos tú si proceden.',
      used: { metrics: 'Superficie y estancias del dossier', views: 'Vistas preparadas', name: 'Nombre del cliente', preferences: 'Preferencias del cliente', requirements: 'Requisitos del cliente' },
      label: 'Ayuda de redacción · sin conexión: frases a partir de los datos del dossier' },
    en: { area: (a, r, n) => `${n ? n + ', here' : 'Here'} is the dossier of your home: ${a} of usable area across ${r} rooms.`,
      forName: n => `Prepared for ${n}.`, prefs: p => `We have taken into account what you told us: ${p}.`, reqs: r => `This requirement is respected: ${r}.`,
      views: n => `It includes ${n} prepared 3D view(s) of the project.`, plan: 'It includes the dimensioned floor plan sheet.',
      askWhy: 'What do you want to highlight in the proposal and why? (your input)', askNext: 'What next step do you propose to the client? (your input)',
      askValidate: 'Timing, costs and qualities cannot be inferred from the plan: add them yourself if relevant.',
      used: { metrics: 'Dossier area and rooms', views: 'Prepared views', name: 'Client name', preferences: 'Client preferences', requirements: 'Client requirements' },
      label: 'Writing help · offline: sentences from the dossier data' } };
  const tr = l => T[l] || T.es;

  /** Contexto mínimo y autorizado: cifras reales y campos del cliente marcados «usar». Sin notas internas. */
  function context({ area = null, rooms = 0, views = 0, sheet = false, client = {}, lang = 'es' }) {
    return { lang, area, rooms, views, sheet: !!sheet, client: SP.clientForAssist(normClient(client)) };
  }
  /** Adaptador local (sin red). Devuelve { text, asks, used }. */
  function draft(ctx) {
    const t = tr(ctx.lang), parts = [], used = [];
    if (ctx.area) { parts.push(t.area(ctx.area, ctx.rooms, ctx.client.name)); used.push(t.used.metrics); if (ctx.client.name) used.push(t.used.name); }
    else if (ctx.client.name) { parts.push(t.forName(ctx.client.name)); used.push(t.used.name); }
    if (ctx.sheet) parts.push(t.plan);
    if (ctx.views) { parts.push(t.views(ctx.views)); used.push(t.used.views); }
    if (ctx.client.preferences) { parts.push(t.prefs(ctx.client.preferences)); used.push(t.used.preferences); }
    if (ctx.client.requirements) { parts.push(t.reqs(ctx.client.requirements)); used.push(t.used.requirements); }
    return { text: parts.join(' '), asks: [t.askWhy, t.askNext, t.askValidate], used, adapter: 'rubik-texto-local' };
  }
  const label = lang => tr(lang).label;

  /** Lo que falta antes de imprimir: secciones del estilo sin contenido real. */
  function missing(sections, order) { return order.filter(k => k !== 'cover' && sections[k] === false); }

  return Object.freeze({ CONTACT, normalize, cover, context, draft, label, missing, clientFromFile: SP.clientFromFile });
});
