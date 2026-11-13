/* SCULPT-R03 · A2 editor UI. A mountable DOM component over RubikCabinetEditor (session) and RubikCabinetCore
 * (elevation primitives). It holds no rule: every change is an editor operation; a refusal shows the explanation and
 * the inputs go back to the current values. Keyboard: modules are a roving tablist (←/→/Home/End), Ctrl+Z / Ctrl+Y /
 * Ctrl+Shift+Z undo and redo inside the editor, Escape inside an input restores its value. Touch targets ≥ 44 px.
 * NOT loaded by index.html: the lab page mounts it; the product connection is a proposal for the integration surgery. */
(function (root) {
  'use strict';
  const K = root.RubikCabinetCore, E = root.RubikCabinetEditor;
  const NS = 'http://www.w3.org/2000/svg';
  const FRONT_LABEL = { closed: 'Cerradas', open: 'Abiertas', hidden: 'Ocultas (ver interior)' };
  const PROV_LABEL = { height: { 'object-height': 'altura del objeto', 'assumed-type-default': 'altura supuesta por tipo', edited: 'altura editada' },
    boards: { assumed: 'tableros supuestos (18 mm)', edited: 'tableros editados' }, layout: { default: 'distribución por defecto', edited: 'distribución editada' } };
  const OP_DONE = { split: 'Módulo dividido', merge: 'Módulos unidos', 'add-shelf': 'Balda añadida', 'remove-shelf': 'Balda quitada', 'set-shelves': 'Baldas actualizadas',
    'set-rod': 'Barra actualizada', 'set-drawers': 'Cajones actualizados', 'set-front': 'Puertas', resize: 'Medidas aplicadas', 'set-bay-width': 'Anchura del módulo aplicada',
    'set-door-count': 'Número de puertas aplicado', undo: 'Deshecho', redo: 'Rehecho', restore: 'Restablecido el estado inicial' };
  const r = v => Math.round(v);
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (k === 'text') el.textContent = v; else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  };
  const s = (tag, attrs = {}) => { const el = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v); return el; };

  /* Front elevation (mm, y up) as SVG. Closed doors are drawn translucent over the interior so the layout stays
     readable; open doors are the 18 mm edge of each leaf at its hinge; hidden draws none. */
  function elevationSVG(outer, cabinet, { selectedBay = null, onBay = null, title = 'Alzado frontal' } = {}) {
    const prims = K.elevation(outer, cabinet), H = cabinet.height, W = outer.w, pad = 190, top = 190;
    const svg = s('svg', { viewBox: `${-pad} ${-top} ${W + 2 * pad} ${H + top + 150}`, role: 'img', 'aria-label': `${title}: ${W} × ${H} mm` , class: 'r03-elev' });
    const g = s('g', { transform: `translate(0 ${H}) scale(1 -1)` }); svg.append(g);
    const rect = (p, cls, extra = {}) => { const el = s('rect', { x: p.x, y: p.y, width: Math.max(0, p.w), height: Math.max(0, p.h), class: cls, ...extra }); g.append(el); return el; };
    const text = (x, y, t, cls = 'r03-dim') => { const el = s('text', { x, y, class: cls }); el.textContent = t; svg.append(el); return el; };
    for (const p of prims) {
      if (p.role === 'carcass') rect(p, 'r03-carcass');
      else if (p.role === 'cavity') rect(p, 'r03-cavity');
      else if (p.role === 'bay') {
        const el = rect(p, 'r03-bay' + (p.bay === selectedBay ? ' is-selected' : ''), { 'data-bay': p.bay });
        if (onBay) { el.style.cursor = 'pointer'; el.addEventListener('click', () => onBay(p.bay)); }
      } else if (p.role === 'opening') {
        if (p.h > 120) text(p.x + p.w / 2, H - (p.y + p.h / 2) + 14, `${r(p.h)}`, 'r03-dim r03-dim-in');
      } else if (p.role === 'overlap') rect(p, 'r03-overlap');
      else if (p.role === 'shelf') rect(p, 'r03-shelf');
      else if (p.role === 'rod') rect(p, 'r03-rod', { rx: 10 });
      else if (p.role === 'drawer') rect(p, 'r03-drawer', { rx: 6 });
      else if (p.role === 'handle') rect(p, 'r03-handle', { rx: 4 });
      else if (p.role === 'divider') rect(p, 'r03-divider');
    }
    if (cabinet.front === 'closed') for (const p of prims.filter(q => q.role === 'door')) {
      rect(p, 'r03-door');
      const hx = p.hinge === 'left' ? p.x + 30 : p.x + p.w - 30;
      g.append(s('path', { d: `M${hx} ${p.y + p.h * .5 - 60} l${p.hinge === 'left' ? -24 : 24} 60 l${p.hinge === 'left' ? 24 : -24} 60`, class: 'r03-hinge' }));
    } else if (cabinet.front === 'open') for (const p of prims.filter(q => q.role === 'door')) rect({ x: p.hinge === 'left' ? p.x - 18 : p.x + p.w, y: p.y, w: 18, h: p.h }, 'r03-door-edge');
    // Dimensions: bay clear widths on top, overall sizes outside.
    // Bay label on two lines (name, clear width) so it stays legible on a phone and with many bays.
    for (const p of prims.filter(q => q.role === 'bay')) { text(p.x + p.w / 2, -100, `M${p.bay + 1}`, 'r03-dim r03-dim-bay' + (p.bay === selectedBay ? ' is-selected' : '')); text(p.x + p.w / 2, -16, `${r(p.w)}`, 'r03-dim r03-dim-sub'); }
    text(W / 2, H + 110, `${W} mm`, 'r03-dim r03-dim-total');
    const ht = text(-90, H / 2, `${H} mm`, 'r03-dim r03-dim-total'); ht.setAttribute('transform', `rotate(-90 ${-90} ${H / 2})`);
    return svg;
  }

  // savedAlready: the interior being edited is already the saved one (contract status 'ok'); a default or adapted
  // interior can be saved without edits so the user can confirm it.
  function mount(rootEl, { session, title = 'Armario', onChange = () => {}, onSave = null, onCancel = null, extra = null, savedAlready = false, elevationHost = null } = {}) {
    let current = session, message = null, destroyed = false;
    const ui = h('section', { class: 'r03-editor', 'aria-label': `Editor de interior: ${title}` });
    rootEl.replaceChildren(ui);
    const set = (next, msg) => { current = next; message = msg; render(); onChange(current); };
    const run = op => {
      const res = E.apply(current, op);
      if (!res.ok) { message = { kind: 'error', text: res.explanation.join(' ') }; current = res.session; render(); onChange(current); return false; }
      const label = OP_DONE[op.type] + (op.type === 'set-front' ? `: ${FRONT_LABEL[op.front].toLowerCase()}` : '');
      set(res.session, res.unchanged ? { kind: 'info', text: 'Sin cambios.' } : { kind: 'ok', text: label + '.' });
      return true;
    };
    const num = v => { const t = String(v).trim().replace(',', '.'); return t === '' ? NaN : Number(t); };
    const field = (label, value, { id, onCommit, min, max, step = 1, width = '7ch', describedby, unit = 'mm' } = {}) => {
      const input = h('input', { id, type: 'number', inputmode: 'decimal', value: r(value), min, max, step, style: `width:${width}`, 'aria-describedby': describedby });
      // Enter fires keydown AND change in Chromium: remember the last committed value so one edit is applied once.
      let last = r(value);
      const commit = () => { const v = num(input.value); if (v === last || (Number.isNaN(v) && Number.isNaN(last))) return; last = v; if (!onCommit(v)) { input.value = r(value); last = r(value); } };
      input.addEventListener('change', commit);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { input.value = r(value); e.stopPropagation(); } });
      return h('label', { class: 'r03-field' }, h('span', {}, label), input, unit ? h('span', { class: 'r03-unit', 'aria-hidden': 'true' }, unit) : null);
    };
    const button = (text, onclick, opts = {}) => h('button', { type: 'button', class: opts.class || 'r03-btn', onclick, disabled: opts.disabled, 'aria-pressed': opts.pressed, title: opts.title, 'aria-label': opts.label }, text);

    function render() {
      if (destroyed) return;
      const focusId = document.activeElement && ui.contains(document.activeElement) ? document.activeElement.id : null;
      const sum = E.summary(current), st = current.state, c = st.cabinet, bay = sum.bays[current.bay], ro = current.readOnly;
      const prov = E.result(current).provenance;
      const head = h('header', { class: 'r03-head' },
        h('h2', {}, title),
        h('p', { class: 'r03-size' }, `${st.outer.w} × ${st.outer.d} × ${c.height} mm · ${c.columns.length} módulos · ${c.doorCount} puertas`),
        h('p', { class: 'r03-prov' }, ...Object.entries(prov).map(([k, v]) => h('span', { class: 'r03-tag' + (v === 'edited' || v === 'object-height' ? ' is-known' : ' is-assumed') }, PROV_LABEL[k][v] || v))));
      const elev = h('figure', { class: 'r03-figure' }, elevationSVG(st.outer, c, { selectedBay: current.bay, onBay: i => run({ type: 'select-bay', bay: i }) }),
        h('figcaption', {}, 'Alzado frontal en mm. Toca un módulo para editarlo.'));
      // Doors
      const doors = h('fieldset', { class: 'r03-group' }, h('legend', {}, 'Puertas'),
        h('div', { class: 'r03-seg', role: 'group', 'aria-label': 'Estado de las puertas' }, ...K.FRONT_STATES.map(f => button(FRONT_LABEL[f], () => run({ type: 'set-front', front: f }), { pressed: String(c.front === f), class: 'r03-btn r03-seg-btn', disabled: ro }))),
        h('div', { class: 'r03-row' }, field('Nº de puertas', c.doorCount, { id: 'r03-doors', onCommit: v => run({ type: 'set-door-count', doorCount: v }), width: '5ch', unit: '', min: 1, max: 12 })));
      // Sizes
      const sizes = h('fieldset', { class: 'r03-group' }, h('legend', {}, 'Medidas exteriores'),
        h('div', { class: 'r03-row' },
          field('Ancho', st.outer.w, { id: 'r03-w', onCommit: v => run({ type: 'resize', w: v }) }),
          field('Fondo', st.outer.d, { id: 'r03-d', onCommit: v => run({ type: 'resize', d: v }) }),
          field('Alto', c.height, { id: 'r03-h', onCommit: v => run({ type: 'resize', height: v }) })));
      // Modules (roving tablist)
      const tabs = h('div', { class: 'r03-tabs', role: 'tablist', 'aria-label': 'Módulos' }, ...sum.bays.map(b => {
        const t = h('button', { type: 'button', role: 'tab', id: `r03-tab-${b.index}`, class: 'r03-tab', 'aria-selected': String(b.index === current.bay), tabindex: b.index === current.bay ? '0' : '-1', 'aria-controls': 'r03-bay-panel' }, `M${b.index + 1}`);
        t.addEventListener('click', () => run({ type: 'select-bay', bay: b.index }));
        t.addEventListener('keydown', e => {
          const n = sum.bays.length, k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          let to = null; if (k) to = (b.index + k + n) % n; else if (e.key === 'Home') to = 0; else if (e.key === 'End') to = n - 1;
          if (to !== null) { e.preventDefault(); run({ type: 'select-bay', bay: to }); ui.querySelector(`#r03-tab-${to}`)?.focus(); }
        });
        return t;
      }));
      const shelves = bay.shelves.map((y, i) => h('li', { class: 'r03-shelf-row' },
        field(`Balda ${i + 1}`, y, { id: `r03-shelf-${i}`, onCommit: v => run({ type: 'set-shelves', shelves: bay.shelves.map((q, j) => (j === i ? v : q)) }) }),
        button('Quitar', () => run({ type: 'remove-shelf', index: i }), { class: 'r03-btn r03-btn-quiet', label: `Quitar balda ${i + 1}`, disabled: ro })));
      const rodOn = bay.rod !== null;
      const rodToggle = h('input', { type: 'checkbox', id: 'r03-rod-on', checked: rodOn, disabled: ro });
      rodToggle.addEventListener('change', () => { if (!run({ type: 'set-rod', rod: rodToggle.checked ? Math.round(Math.max(bay.drawers * bay.drawerHeight + 150, K.cavity(st.outer, c).height - 300)) : null })) rodToggle.checked = rodOn; });
      const drawers = h('div', { class: 'r03-row' },
        button('−', () => run({ type: 'set-drawers', drawers: bay.drawers - 1 }), { class: 'r03-btn r03-step', label: 'Un cajón menos', disabled: ro || bay.drawers <= 0 }),
        h('output', { id: 'r03-drawers', 'aria-labelledby': 'r03-drawers-label', class: 'r03-count' }, String(bay.drawers)),
        button('+', () => run({ type: 'set-drawers', drawers: bay.drawers + 1 }), { class: 'r03-btn r03-step', label: 'Un cajón más', disabled: ro }),
        field('Alto cajón', bay.drawerHeight, { id: 'r03-drawer-h', onCommit: v => run({ type: 'set-drawers', drawerHeight: v }), width: '6ch' }));
      const panel = h('div', { class: 'r03-bay', role: 'tabpanel', id: 'r03-bay-panel', 'aria-labelledby': `r03-tab-${current.bay}` },
        h('div', { class: 'r03-row' },
          field('Anchura libre', bay.width, { id: 'r03-bay-w', onCommit: v => run({ type: 'set-bay-width', width: v }) }),
          button('Dividir módulo', () => run({ type: 'split' }), { disabled: ro }),
          button(current.bay === sum.bays.length - 1 ? 'Unir con el anterior' : 'Unir con el siguiente', () => run({ type: 'merge' }), { disabled: ro || sum.bays.length < 2 })),
        h('h4', {}, 'Baldas', h('span', { class: 'r03-hint' }, ' · altura de la cara inferior sobre la base interior')),
        shelves.length ? h('ul', { class: 'r03-shelves' }, shelves) : h('p', { class: 'r03-hint' }, 'Sin baldas.'),
        button('Añadir balda', () => run({ type: 'add-shelf' }), { disabled: ro }),
        h('h4', {}, 'Barra de colgar'),
        h('div', { class: 'r03-row' }, h('label', { class: 'r03-check' }, rodToggle, h('span', {}, 'Con barra')),
          rodOn ? field('Altura', bay.rod, { id: 'r03-rod', onCommit: v => run({ type: 'set-rod', rod: v }) }) : null),
        h('h4', { id: 'r03-drawers-label' }, 'Cajones'), drawers,
        sum.hingeDrawerConflicts.includes(current.bay + 1) ? h('p', { class: 'r03-warn' }, 'Aviso: una bisagra de puerta cae dentro de este módulo; al abrir el cajón puede rozar la puerta. Revísalo con el número de puertas.') : null);
      const modules = h('fieldset', { class: 'r03-group' }, h('legend', {}, `Módulos · editando M${current.bay + 1}`), tabs, panel);
      const msg = message ? h('p', { class: 'r03-msg is-' + message.kind, role: message.kind === 'error' ? 'alert' : 'status' }, message.text) : h('p', { class: 'r03-msg', role: 'status' });
      const actions = h('div', { class: 'r03-actions' }, msg,
        button('Deshacer', () => { const u = E.undo(current); if (u.ok) set(u.session, { kind: 'ok', text: OP_DONE.undo + '.' }); }, { disabled: !sum.canUndo, title: 'Ctrl+Z' }),
        button('Rehacer', () => { const u = E.redo(current); if (u.ok) set(u.session, { kind: 'ok', text: OP_DONE.redo + '.' }); }, { disabled: !sum.canRedo, title: 'Ctrl+Y' }),
        button('Restablecer', () => { const u = E.restore(current); set(u.session, u.unchanged ? { kind: 'info', text: 'Ya está en el estado inicial.' } : { kind: 'ok', text: OP_DONE.restore + '.' }); }, { disabled: !sum.dirty }),
        onCancel ? button('Cancelar', () => onCancel(current), { class: 'r03-btn r03-btn-quiet' }) : null,
        onSave ? button('Guardar interior', () => { const res = onSave(E.result(current), current); if (res && res.message) { message = res.message; render(); } }, { class: 'r03-btn r03-btn-primary', disabled: ro || (!sum.dirty && savedAlready) }) : null);
      if (elevationHost) elevationHost.replaceChildren(elev);
      ui.replaceChildren(...[head, elevationHost ? null : elev, h('div', { class: 'r03-controls' }, modules, doors, sizes), extra ? extra(current) : null, actions].filter(Boolean));
      if (focusId) { const f = ui.querySelector('#' + CSS.escape(focusId)); if (f) f.focus(); }
    }
    ui.addEventListener('keydown', e => {
      if (!(e.ctrlKey || e.metaKey) || e.target.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); const u = E.undo(current); if (u.ok) set(u.session, { kind: 'ok', text: 'Deshecho.' }); }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); const u = E.redo(current); if (u.ok) set(u.session, { kind: 'ok', text: 'Rehecho.' }); }
    });
    render();
    return { get session() { return current; }, setSession(next, msg = null, saved = savedAlready) { current = next; message = msg; savedAlready = saved; render(); }, apply: run, render, destroy() { destroyed = true; ui.remove(); } };
  }
  root.RubikCabinetEditorUI = { mount, elevationSVG, FRONT_LABEL };
})(globalThis);
