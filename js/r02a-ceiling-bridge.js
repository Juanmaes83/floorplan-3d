/* SCULPT-R02-A · R1 — puente PURO entre los elementos de techo y el editor de RUBIK. NO lo carga index.html.
 *
 * No hay núcleo ni contrato nuevos: todo pasa por RubikCeilingContract (x-r02a-ceiling, candidato) y
 * RubikCeilingSession (evaluación con el núcleo de #193). Este archivo solo fija CÓMO los usaría el editor:
 *   - lo que escribe (confirm, setReference, remove, afterRoomsChanged) se llama DENTRO de mutate() de RUBIK, devuelve
 *     {ok, project} o {ok:false, issues, explanation} y nunca toca el proyecto recibido: si se rechaza, nada cambia y el
 *     deshacer de RUBIK no gana un paso;
 *   - lo que solo informa (afterEdit, afterLoad) no escribe nunca: un elemento confirmado que deja de cumplir por otra
 *     edición (un armario movido debajo de una lámpara, una referencia rebajada) se SEÑALA con su motivo; no se mueve
 *     ni se borra en silencio. Decide una persona.
 * No es MEP, ni iluminación, ni normativa. Sin regla de paso libre para personas (riesgo abierto en el documento). */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && typeof require === 'function';
  const X = node ? require('./r02a-ceiling-contract.js') : root.RubikCeilingContract;
  const clone = v => structuredClone(v);
  const words = issues => (issues || []).map(i => i.message || i.code);
  const refuse = (issues, explanation = words(issues)) => ({ ok: false, issues, explanation });
  const pass = r => (r.ok ? { ok: true, project: r.project } : refuse(r.issues));

  // Escrituras (dentro de mutate). El caller ya tiene la confirmación expresa de una persona: es la única vía.
  function confirm(project, request, { confirmedAt } = {}) {
    return pass(X.confirmItem(project, request, { confirm: true, ...(confirmedAt ? { confirmedAt } : {}) }));
  }
  const setReference = (project, ref) => pass(X.setVerticalReference(project, ref));
  const clearReference = (project, scope) => pass(X.removeVerticalReference(project, scope));
  const remove = (project, id) => {
    if (!X.extension(project).items.some(i => i && i.id === id)) return refuse([{ code: 'unknown-item', message: 'Ese elemento de techo no está guardado.' }]);
    return pass(X.removeItem(project, id));
  };
  /* Tras quitar o rehacer estancias en el MISMO mutate: retira los elementos y referencias cuya estancia ya no existe.
   * Datos de una versión futura o dañados: no se tocan (son de otro lector) y se dice. */
  function afterRoomsChanged(project) {
    const ext = X.extension(project);
    if (ext.status === 'absent') return { ok: true, project: clone(project), removed: [] };
    if (ext.status !== 'present') return { ok: true, project: clone(project), removed: [], untouched: ext.status };
    const removed = X.orphans(project);
    if (!removed.length) return { ok: true, project: clone(project), removed };
    const r = X.prune(project);
    return r.ok ? { ok: true, project: r.project, removed } : refuse(r.issues);
  }

  // Solo informa. Qué elementos confirmados cumplían antes de una edición y ya no (y cuáles vuelven a cumplir).
  function afterEdit(before, after, { labelOf } = {}) {
    const a = X.recheck(before, { labelOf }), b = X.recheck(after, { labelOf });
    if (b.status !== 'present') return { status: b.status, newlyFailing: [], recovered: [], failing: [], ...(b.issues ? { issues: b.issues } : {}) };
    const held = new Map((a.items || []).map(i => [i.id, i.holds]));
    const pick = i => ({ id: i.id, type: i.type, roomId: i.roomId, state: i.state, explanation: i.explanation.slice() });
    return { status: 'present',
      newlyFailing: b.items.filter(i => !i.holds && held.get(i.id) !== false).map(pick),
      recovered: b.items.filter(i => i.holds && held.get(i.id) === false).map(pick),
      failing: b.items.filter(i => !i.holds).map(pick) };
  }
  const afterLoad = (project, opts) => X.recheck(project, opts);
  const NOTICE = Object.freeze({ kind: 'info', text: 'Elementos de techo experimentales: posición y altura revisables por una persona. No comprueba la altura de paso, instalaciones ni normativa.' });

  const api = Object.freeze({ confirm, setReference, clearReference, remove, afterRoomsChanged, afterEdit, afterLoad, NOTICE });
  if (node) module.exports = api; else root.RubikCeilingBridge = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
