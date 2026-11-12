/* SCULPT-R03 · A2 editor session (pure). The state machine behind the cabinet interior editor: one current state,
 * history for undo/redo, restore to the opened state, and an explanation for every refusal. It has NO geometric rule
 * of its own: every operation is computed and validated by RubikCabinetCore (js/r03-cabinet-core.js), and a refused
 * operation returns the session unchanged (atomic). No DOM, storage or network; NOT loaded by index.html.
 * A session never writes a project: `result()` hands the edited cabinet to the caller (in the lab, RubikCabinetContract.write). */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && typeof require === 'function';
  const K = node ? require('./r03-cabinet-core.js') : root.RubikCabinetCore;
  const HISTORY_MAX = 100;
  const clone = v => structuredClone(v);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const mm = v => `${Math.round(v)} mm`;
  const OPS = Object.freeze(['select-bay', 'split', 'merge', 'set-shelves', 'add-shelf', 'remove-shelf', 'set-rod', 'set-drawers', 'set-front', 'set-door-count', 'resize', 'set-bay-width']);

  /* Readable reasons, with the numbers that matter. The limits are read from RubikCabinetCore.LIMITS (never duplicated). */
  function explain(issues, state, proposed) {
    const L = K.LIMITS, out = [];
    const inner = state ? K.cavity(state.outer, state.cabinet) : null;
    for (const x of issues || []) {
      const m = x.bay == null ? '' : `Módulo ${x.bay + 1}: `;
      // The numbers of the change that was refused (proposed), not of the state that stays.
      const col = x.bay == null ? null : (proposed?.bay === x.bay ? { ...state?.cabinet.columns[x.bay], ...proposed.patch } : state?.cabinet.columns[x.bay]);
      switch (x.code) {
        case 'shelf-gap': out.push(`${m}cada balda necesita al menos ${L.boardGapMm} mm libres por encima y por debajo (también sobre los cajones y bajo el techo interior).`); break;
        case 'rod': out.push(`${m}la barra choca: necesita ${L.rodAboveDrawersMm} mm sobre los cajones, ${L.rodShelfGapMm} mm de separación con cada balda y ${L.rodBelowTopMm} mm bajo el techo interior.`); break;
        case 'drawers-height': out.push(`${m}${col ? `${col.drawers} cajones de ${mm(col.drawerHeight)} (${mm(col.drawers * col.drawerHeight)})` : 'los cajones'} no caben: la altura libre es ${inner ? mm(inner.height) : '—'} y deben quedar ${L.drawerHeadroomMm} mm encima.`); break;
        case 'drawers': out.push(`${m}entre ${L.drawers[0]} y ${L.drawers[1]} cajones, de ${L.drawerHeight[0]} a ${L.drawerHeight[1]} mm de alto.`); break;
        case 'bay-width': out.push(`${m}cada módulo necesita al menos ${L.bayMinWidth} mm de anchura libre.`); break;
        case 'shelves-count': out.push(`${m}como máximo ${L.shelvesMax} baldas por módulo.`); break;
        case 'bays-count': out.push(`El armario admite de ${L.bays[0]} a ${L.bays[1]} módulos.`); break;
        case 'bay-index': out.push(x.message.startsWith('No hay') ? 'No hay un módulo contiguo con el que unir.' : 'Ese módulo no existe.'); break;
        case 'single-bay': out.push('Con un solo módulo, su anchura es toda la anchura libre del armario.'); break;
        case 'cavity': out.push(`El interior queda demasiado pequeño: altura libre mínima ${L.cavityMinHeight} mm, fondo libre mínimo ${L.cavityMinDepth} mm y ${L.bayMinWidth} mm por módulo.`); break;
        case 'dimensions': out.push(`Medidas fuera de rango: altura ${L.height[0]}–${L.height[1]} mm, tablero ${L.thickness[0]}–${L.thickness[1]} mm, zócalo ${L.plinth[0]}–${L.plinth[1]} mm.`); break;
        case 'door-count': out.push(`De ${L.doors[0]} a ${L.doors[1]} puertas.`); break;
        case 'outer': out.push('Las medidas exteriores deben ser números positivos.'); break;
        case 'bay-widths-sum': out.push('Las anchuras de los módulos deben llenar el armario.'); break;
        case 'state': out.push('Estado de puertas no válido.'); break;
        case 'input': out.push(x.message); break;
        default: out.push(x.message || x.code);
      }
    }
    return [...new Set(out)];
  }

  function createSession({ objectId = null, objectType = 'wardrobe', outer, cabinet, provenance = null, readOnly = false } = {}) {
    const issues = K.validate(outer, cabinet);
    const state = { outer: { w: outer.w, d: outer.d }, cabinet: clone(cabinet) };
    return Object.freeze({ objectId, objectType, readOnly, provenance: provenance && clone(provenance), original: clone(state), state, bay: 0,
      undo: [], redo: [], issues, last: null, touched: { height: false, boards: false, layout: false } });
  }
  const bayCount = s => s.state.cabinet.columns.length;
  const clampBay = (s, i) => Math.max(0, Math.min(bayCount(s) - 1, i));
  const refuse = (s, issues, op, proposed) => { const explanation = explain(issues, s.state, proposed); return { ok: false, session: Object.freeze({ ...s, last: { op: op.type, ok: false, issues, explanation } }), issues, explanation }; };
  const input = message => [{ code: 'input', message }];
  const isInt = Number.isInteger, num = Number.isFinite;

  // Computes the next {outer, cabinet} for one operation, through the core. Returns {ok, state, bay, touched} or {ok:false, issues}.
  function compute(s, op) {
    const { outer, cabinet: c } = s.state, b = op.bay ?? s.bay;
    const col = c.columns[b];
    const needBay = () => (!isInt(b) || !col ? input('Elige un módulo existente.') : null);
    const done = (r, extra = {}) => (r.ok ? { ok: true, state: { outer: r.outer, cabinet: r.cabinet }, ...extra } : { ok: false, issues: r.issues });
    switch (op.type) {
      case 'split': { const e = needBay(); if (e) return { ok: false, issues: e }; return done(K.splitBay(outer, c, b), { bay: b, touched: 'layout' }); }
      case 'merge': { const e = needBay(); if (e) return { ok: false, issues: e }; return done(K.mergeBay(outer, c, b), { bay: Math.min(b, c.columns.length - 2), touched: 'layout' }); }
      case 'set-shelves': {
        const e = needBay(); if (e) return { ok: false, issues: e };
        if (!Array.isArray(op.shelves) || op.shelves.some(y => !num(y))) return { ok: false, issues: input('Las alturas de las baldas deben ser números en mm.') };
        return done(K.setBay(outer, c, b, { shelves: op.shelves.slice().sort((p, q) => p - q) }), { bay: b, touched: 'layout' });
      }
      case 'add-shelf': {
        const e = needBay(); if (e) return { ok: false, issues: e };
        // A proposal, not a rule: the middle of the tallest opening of the bay. The core decides whether it fits.
        const openings = K.openings(outer, c, col).slice().sort((p, q) => q.height - p.height);
        const top = openings[0], y = Math.round(top.bottom + (top.height - c.thickness) / 2);
        return done(K.setBay(outer, c, b, { shelves: col.shelves.concat([y]).sort((p, q) => p - q) }), { bay: b, touched: 'layout' });
      }
      case 'remove-shelf': {
        const e = needBay(); if (e) return { ok: false, issues: e };
        if (!isInt(op.index) || op.index < 0 || op.index >= col.shelves.length) return { ok: false, issues: input('Esa balda no existe.') };
        return done(K.setBay(outer, c, b, { shelves: col.shelves.filter((_, i) => i !== op.index) }), { bay: b, touched: 'layout' });
      }
      case 'set-rod': {
        const e = needBay(); if (e) return { ok: false, issues: e };
        if (op.rod !== null && !num(op.rod)) return { ok: false, issues: input('La altura de la barra debe ser un número en mm.') };
        return done(K.setBay(outer, c, b, { rod: op.rod === null ? null : Math.round(op.rod) }), { bay: b, touched: 'layout' });
      }
      case 'set-drawers': {
        const e = needBay(); if (e) return { ok: false, issues: e };
        const patch = {};
        if (op.drawers !== undefined) { if (!isInt(op.drawers)) return { ok: false, issues: input('El número de cajones debe ser entero.') }; patch.drawers = op.drawers; }
        if (op.drawerHeight !== undefined) { if (!num(op.drawerHeight)) return { ok: false, issues: input('La altura del cajón debe ser un número en mm.') }; patch.drawerHeight = Math.round(op.drawerHeight); }
        // `kind` is the donor's preset label only (long/short/shelves/drawers): geometry never reads it, so it is kept.
        const r = done(K.setBay(outer, c, b, patch), { bay: b, touched: 'layout' });
        return r.ok ? r : { ...r, proposed: { bay: b, patch } };
      }
      case 'set-front': {
        if (!K.FRONT_STATES.includes(op.front)) return { ok: false, issues: input('Estado de puertas no válido.') };
        const next = clone(c); next.front = op.front; const issues = K.validate(outer, next);
        return issues.length ? { ok: false, issues } : { ok: true, state: { outer: { ...outer }, cabinet: next }, bay: s.bay, touched: null };
      }
      case 'set-door-count': {
        if (!isInt(op.doorCount)) return { ok: false, issues: input('El número de puertas debe ser entero.') };
        return done(K.resize(outer, c, { doorCount: op.doorCount }), { bay: s.bay, touched: 'layout' });
      }
      case 'resize': {
        const ch = {};
        for (const [k, key] of [['w', 'w'], ['d', 'd'], ['height', 'height']]) if (op[k] !== undefined) {
          if (!isInt(op[k]) || op[k] <= 0) return { ok: false, issues: input('Las medidas deben ser milímetros enteros y positivos.') };
          ch[key] = op[k];
        }
        if (!Object.keys(ch).length) return { ok: false, issues: input('No hay medidas que cambiar.') };
        return done(K.resize(outer, c, ch), { bay: s.bay, touched: ch.height !== undefined ? 'height' : 'layout' });
      }
      case 'set-bay-width': {
        const e = needBay(); if (e) return { ok: false, issues: e };
        if (!num(op.width)) return { ok: false, issues: input('La anchura debe ser un número en mm.') };
        return done(K.setBayWidth(outer, c, b, op.width), { bay: b, touched: 'layout' });
      }
      default: return { ok: false, issues: input(`Operación desconocida: ${op.type}`) };
    }
  }

  /* One edit. Refused → the same state (no partial change), with the core's issues and their explanation. */
  function apply(s, op) {
    if (!op || !OPS.includes(op.type)) return refuse(s, input(`Operación desconocida: ${op && op.type}`), op || { type: '?' });
    if (op.type === 'select-bay') {
      if (!isInt(op.bay) || op.bay < 0 || op.bay >= bayCount(s)) return refuse(s, input('Ese módulo no existe.'), op);
      return { ok: true, session: Object.freeze({ ...s, bay: op.bay, last: { op: op.type, ok: true } }) };
    }
    if (s.readOnly) return refuse(s, input('Este interior es de solo lectura (versión o datos no editables).'), op);
    const r = compute(s, op);
    if (!r.ok) return refuse(s, r.issues, op, r.proposed);
    if (same(r.state, s.state)) return { ok: true, unchanged: true, session: Object.freeze({ ...s, bay: clampBay({ state: r.state }, r.bay ?? s.bay), last: { op: op.type, ok: true, unchanged: true } }) };
    const undo = s.undo.concat([{ state: s.state, bay: s.bay, op: op.type }]).slice(-HISTORY_MAX);
    const touched = r.touched ? { ...s.touched, [r.touched]: true } : s.touched;
    const next = { ...s, state: r.state, bay: clampBay({ state: r.state }, r.bay ?? s.bay), undo, redo: [], issues: [], touched, last: { op: op.type, ok: true } };
    return { ok: true, session: Object.freeze(next) };
  }
  function undo(s) {
    if (!s.undo.length) return { ok: false, session: s };
    const prev = s.undo[s.undo.length - 1];
    return { ok: true, session: Object.freeze({ ...s, state: prev.state, bay: prev.bay, undo: s.undo.slice(0, -1), redo: s.redo.concat([{ state: s.state, bay: s.bay, op: prev.op }]), issues: [], last: { op: 'undo', ok: true } }) };
  }
  function redo(s) {
    if (!s.redo.length) return { ok: false, session: s };
    const next = s.redo[s.redo.length - 1];
    return { ok: true, session: Object.freeze({ ...s, state: next.state, bay: next.bay, redo: s.redo.slice(0, -1), undo: s.undo.concat([{ state: s.state, bay: s.bay, op: next.op }]), issues: [], last: { op: 'redo', ok: true } }) };
  }
  // Back to the state the editor was opened with; recorded in the history so it can itself be undone.
  function restore(s) {
    if (same(s.state, s.original)) return { ok: true, unchanged: true, session: s };
    return { ok: true, session: Object.freeze({ ...s, state: clone(s.original), bay: 0, undo: s.undo.concat([{ state: s.state, bay: s.bay, op: 'restore' }]).slice(-HISTORY_MAX), redo: [], issues: [], last: { op: 'restore', ok: true } }) };
  }
  const dirty = s => !same(s.state, s.original);
  /* What the caller saves: the edited state plus provenance updated only for what the user really changed. */
  function result(s) {
    const p = s.provenance ? clone(s.provenance) : { height: 'assumed-type-default', boards: 'assumed', layout: 'default' };
    if (s.touched.height) p.height = 'edited';
    if (s.touched.layout && dirty(s)) p.layout = 'edited';
    return { outer: clone(s.state.outer), cabinet: clone(s.state.cabinet), provenance: p, issues: K.validate(s.state.outer, s.state.cabinet) };
  }
  /* Facts the UI shows next to the drawing; all computed by the core. */
  function summary(s) {
    const { outer, cabinet: c } = s.state, inner = K.cavity(outer, c);
    return {
      outer: { ...outer, h: c.height }, inner, bays: K.bays(outer, c).map(b => ({ index: b.index, width: b.width, kind: b.kind, shelves: b.shelves.slice(), rod: b.rod, drawers: b.drawers, drawerHeight: b.drawerHeight, openings: K.openings(outer, c, b) })),
      doors: c.doorCount, front: c.front, hingeDrawerConflicts: K.drawerDoorConflicts(outer, c),
      canUndo: s.undo.length > 0, canRedo: s.redo.length > 0, dirty: dirty(s)
    };
  }
  const api = { OPS, HISTORY_MAX, createSession, apply, undo, redo, restore, dirty, result, summary, explain };
  if (node && module.exports) module.exports = api; else root.RubikCabinetEditor = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
