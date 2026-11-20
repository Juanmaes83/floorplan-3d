/* SCULPT-R03 · A2 editor UI. A mountable DOM component over RubikCabinetEditor (session) and RubikCabinetCore
 * (elevation primitives). It holds no rule: every change is an editor operation; a refusal shows the explanation and
 * the inputs go back to the current values. Keyboard: modules are a roving tablist (←/→/Home/End), Ctrl+Z / Ctrl+Y /
 * Ctrl+Shift+Z undo and redo inside the editor, Escape inside an input restores its value. Touch targets ≥ 44 px.
 * NOT loaded by index.html: the lab page mounts it; the product connection is a proposal for the integration surgery. */
(function (root) {
  'use strict';
  const K = root.RubikCabinetCore, E = root.RubikCabinetEditor;
  const NS = 'http://www.w3.org/2000/svg';
  // Textos visibles en los idiomas de RUBIK (convención de los módulos: tx local que lee el LANG global; sin LANG, español).
  const tx = (es, en, zh) => ({ es, en, zh })[typeof LANG === 'string' ? LANG : 'es'] || es;
  const FRONT = () => ({ closed: tx('Cerradas', 'Closed', '关闭'), open: tx('Abiertas', 'Open', '打开'), hidden: tx('Ocultas (ver interior)', 'Hidden (see interior)', '隐藏（查看内部）') });
  // FRONT_LABEL se exporta con la misma forma; cada lectura devuelve el idioma visible.
  const FRONT_LABEL = Object.freeze({ get closed() { return FRONT().closed; }, get open() { return FRONT().open; }, get hidden() { return FRONT().hidden; } });
  const PROV_LABEL = () => ({ height: { 'object-height': tx('altura del objeto', 'object height', '物体高度'), 'assumed-type-default': tx('altura supuesta por tipo', 'height assumed by type', '按类型假定的高度'), edited: tx('altura editada', 'edited height', '已编辑高度') },
    boards: { assumed: tx('tableros supuestos (18 mm)', 'assumed boards (18 mm)', '假定板厚（18 mm）'), edited: tx('tableros editados', 'edited boards', '已编辑板材') },
    layout: { default: tx('distribución por defecto', 'default layout', '默认布局'), edited: tx('distribución editada', 'edited layout', '已编辑布局') } });
  const OP_DONE = () => ({ split: tx('Módulo dividido', 'Bay split', '已拆分格'), merge: tx('Módulos unidos', 'Bays joined', '已合并格'), 'add-shelf': tx('Balda añadida', 'Shelf added', '已添加层板'),
    'remove-shelf': tx('Balda quitada', 'Shelf removed', '已移除层板'), 'set-shelves': tx('Baldas actualizadas', 'Shelves updated', '层板已更新'), 'set-rod': tx('Barra actualizada', 'Rail updated', '挂衣杆已更新'),
    'set-drawers': tx('Cajones actualizados', 'Drawers updated', '抽屉已更新'), 'set-front': tx('Puertas', 'Doors', '柜门'), resize: tx('Medidas aplicadas', 'Sizes applied', '尺寸已应用'),
    'set-bay-width': tx('Anchura del módulo aplicada', 'Bay width applied', '格宽已应用'), 'set-door-count': tx('Número de puertas aplicado', 'Number of doors applied', '柜门数量已应用'),
    undo: tx('Deshecho', 'Undone', '已撤销'), redo: tx('Rehecho', 'Redone', '已重做'), restore: tx('Restablecido el estado inicial', 'Initial state restored', '已恢复初始状态') });
  const BAY = i => tx(`M${i}`, `B${i}`, `${i}格`);
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
  function elevationSVG(outer, cabinet, { selectedBay = null, onBay = null, title = tx('Alzado frontal', 'Front elevation', '正立面') } = {}) {
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
    for (const p of prims.filter(q => q.role === 'bay')) { text(p.x + p.w / 2, -100, BAY(p.bay + 1), 'r03-dim r03-dim-bay' + (p.bay === selectedBay ? ' is-selected' : '')); text(p.x + p.w / 2, -16, `${r(p.w)}`, 'r03-dim r03-dim-sub'); }
    text(W / 2, H + 110, `${W} mm`, 'r03-dim r03-dim-total');
    const ht = text(-90, H / 2, `${H} mm`, 'r03-dim r03-dim-total'); ht.setAttribute('transform', `rotate(-90 ${-90} ${H / 2})`);
    return svg;
  }

  // savedAlready: the interior being edited is already the saved one (contract status 'ok'); a default or adapted
  // interior can be saved without edits so the user can confirm it.
  function mount(rootEl, { session, title = tx('Armario', 'Cabinet', '柜体'), onChange = () => {}, onSave = null, onCancel = null, extra = null, savedAlready = false, elevationHost = null } = {}) {
    let current = session, message = null, destroyed = false;
    const ui = h('section', { class: 'r03-editor', 'aria-label': tx(`Editor de interior: ${title}`, `Interior editor: ${title}`, `内部编辑器：${title}`) });
    rootEl.replaceChildren(ui);
    const set = (next, msg) => { current = next; message = msg; render(); onChange(current); };
    const run = op => {
      const res = E.apply(current, op);
      if (!res.ok) { message = { kind: 'error', text: res.explanation.join(' ') }; current = res.session; render(); onChange(current); return false; }
      const label = OP_DONE()[op.type] + (op.type === 'set-front' ? `: ${FRONT_LABEL[op.front].toLowerCase()}` : '');
      set(res.session, res.unchanged ? { kind: 'info', text: tx('Sin cambios.', 'No changes.', '没有更改。') } : { kind: 'ok', text: label + '.' });
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
        h('p', { class: 'r03-size' }, tx(`${st.outer.w} × ${st.outer.d} × ${c.height} mm · ${c.columns.length} módulos · ${c.doorCount} puertas`, `${st.outer.w} × ${st.outer.d} × ${c.height} mm · ${c.columns.length} bays · ${c.doorCount} doors`, `${st.outer.w} × ${st.outer.d} × ${c.height} mm · ${c.columns.length} 格 · ${c.doorCount} 扇门`)),
        h('p', { class: 'r03-prov' }, ...Object.entries(prov).map(([k, v]) => h('span', { class: 'r03-tag' + (v === 'edited' || v === 'object-height' ? ' is-known' : ' is-assumed') }, PROV_LABEL()[k][v] || v))));
      const elev = h('figure', { class: 'r03-figure' }, elevationSVG(st.outer, c, { selectedBay: current.bay, onBay: i => run({ type: 'select-bay', bay: i }) }),
        h('figcaption', {}, tx('Alzado frontal en mm. Toca un módulo para editarlo.', 'Front elevation in mm. Tap a bay to edit it.', '正立面（mm）。点按某一格进行编辑。')));
      // Doors
      const doors = h('fieldset', { class: 'r03-group' }, h('legend', {}, tx('Puertas', 'Doors', '柜门')),
        h('div', { class: 'r03-seg', role: 'group', 'aria-label': tx('Estado de las puertas', 'Door state', '柜门状态') }, ...K.FRONT_STATES.map(f => button(FRONT_LABEL[f], () => run({ type: 'set-front', front: f }), { pressed: String(c.front === f), class: 'r03-btn r03-seg-btn', disabled: ro }))),
        h('div', { class: 'r03-row' }, field(tx('Nº de puertas', 'No. of doors', '柜门数量'), c.doorCount, { id: 'r03-doors', onCommit: v => run({ type: 'set-door-count', doorCount: v }), width: '5ch', unit: '', min: 1, max: 12 })));
      // Sizes
      const sizes = h('fieldset', { class: 'r03-group' }, h('legend', {}, tx('Medidas exteriores', 'Outer sizes', '外部尺寸')),
        h('div', { class: 'r03-row' },
          field(tx('Ancho', 'Width', '宽'), st.outer.w, { id: 'r03-w', onCommit: v => run({ type: 'resize', w: v }) }),
          field(tx('Fondo', 'Depth', '深'), st.outer.d, { id: 'r03-d', onCommit: v => run({ type: 'resize', d: v }) }),
          field(tx('Alto', 'Height', '高'), c.height, { id: 'r03-h', onCommit: v => run({ type: 'resize', height: v }) })));
      // Modules (roving tablist)
      const tabs = h('div', { class: 'r03-tabs', role: 'tablist', 'aria-label': tx('Módulos', 'Bays', '格') }, ...sum.bays.map(b => {
        const t = h('button', { type: 'button', role: 'tab', id: `r03-tab-${b.index}`, class: 'r03-tab', 'aria-selected': String(b.index === current.bay), tabindex: b.index === current.bay ? '0' : '-1', 'aria-controls': 'r03-bay-panel' }, BAY(b.index + 1));
        t.addEventListener('click', () => run({ type: 'select-bay', bay: b.index }));
        t.addEventListener('keydown', e => {
          const n = sum.bays.length, k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          let to = null; if (k) to = (b.index + k + n) % n; else if (e.key === 'Home') to = 0; else if (e.key === 'End') to = n - 1;
          if (to !== null) { e.preventDefault(); run({ type: 'select-bay', bay: to }); ui.querySelector(`#r03-tab-${to}`)?.focus(); }
        });
        return t;
      }));
      const shelves = bay.shelves.map((y, i) => h('li', { class: 'r03-shelf-row' },
        field(tx(`Balda ${i + 1}`, `Shelf ${i + 1}`, `层板 ${i + 1}`), y, { id: `r03-shelf-${i}`, onCommit: v => run({ type: 'set-shelves', shelves: bay.shelves.map((q, j) => (j === i ? v : q)) }) }),
        button(tx('Quitar', 'Remove', '移除'), () => run({ type: 'remove-shelf', index: i }), { class: 'r03-btn r03-btn-quiet', label: tx(`Quitar balda ${i + 1}`, `Remove shelf ${i + 1}`, `移除层板 ${i + 1}`), disabled: ro })));
      const rodOn = bay.rod !== null;
      const rodToggle = h('input', { type: 'checkbox', id: 'r03-rod-on', checked: rodOn, disabled: ro });
      rodToggle.addEventListener('change', () => { if (!run({ type: 'set-rod', rod: rodToggle.checked ? Math.round(Math.max(bay.drawers * bay.drawerHeight + 150, K.cavity(st.outer, c).height - 300)) : null })) rodToggle.checked = rodOn; });
      const drawers = h('div', { class: 'r03-row' },
        button('−', () => run({ type: 'set-drawers', drawers: bay.drawers - 1 }), { class: 'r03-btn r03-step', label: tx('Un cajón menos', 'One drawer fewer', '减少一个抽屉'), disabled: ro || bay.drawers <= 0 }),
        h('output', { id: 'r03-drawers', 'aria-labelledby': 'r03-drawers-label', class: 'r03-count' }, String(bay.drawers)),
        button('+', () => run({ type: 'set-drawers', drawers: bay.drawers + 1 }), { class: 'r03-btn r03-step', label: tx('Un cajón más', 'One drawer more', '增加一个抽屉'), disabled: ro }),
        field(tx('Alto cajón', 'Drawer height', '抽屉高度'), bay.drawerHeight, { id: 'r03-drawer-h', onCommit: v => run({ type: 'set-drawers', drawerHeight: v }), width: '6ch' }));
      const panel = h('div', { class: 'r03-bay', role: 'tabpanel', id: 'r03-bay-panel', 'aria-labelledby': `r03-tab-${current.bay}` },
        h('div', { class: 'r03-row' },
          field(tx('Anchura libre', 'Clear width', '净宽'), bay.width, { id: 'r03-bay-w', onCommit: v => run({ type: 'set-bay-width', width: v }) }),
          button(tx('Dividir módulo', 'Split bay', '拆分格'), () => run({ type: 'split' }), { disabled: ro }),
          button(current.bay === sum.bays.length - 1 ? tx('Unir con el anterior', 'Join with previous', '与前一格合并') : tx('Unir con el siguiente', 'Join with next', '与后一格合并'), () => run({ type: 'merge' }), { disabled: ro || sum.bays.length < 2 })),
        h('h4', {}, tx('Baldas', 'Shelves', '层板'), h('span', { class: 'r03-hint' }, tx(' · altura de la cara inferior sobre la base interior', ' · height of the underside above the inner base', ' · 下表面距内底的高度'))),
        shelves.length ? h('ul', { class: 'r03-shelves' }, shelves) : h('p', { class: 'r03-hint' }, tx('Sin baldas.', 'No shelves.', '没有层板。')),
        button(tx('Añadir balda', 'Add shelf', '添加层板'), () => run({ type: 'add-shelf' }), { disabled: ro }),
        h('h4', {}, tx('Barra de colgar', 'Hanging rail', '挂衣杆')),
        h('div', { class: 'r03-row' }, h('label', { class: 'r03-check' }, rodToggle, h('span', {}, tx('Con barra', 'With rail', '有挂衣杆'))),
          rodOn ? field(tx('Altura', 'Height', '高度'), bay.rod, { id: 'r03-rod', onCommit: v => run({ type: 'set-rod', rod: v }) }) : null),
        h('h4', { id: 'r03-drawers-label' }, tx('Cajones', 'Drawers', '抽屉')), drawers,
        sum.hingeDrawerConflicts.includes(current.bay + 1) ? h('p', { class: 'r03-warn' }, tx('Aviso: una bisagra de puerta cae dentro de este módulo; al abrir el cajón puede rozar la puerta. Revísalo con el número de puertas.', 'Note: a door hinge falls inside this bay; opening the drawer may rub the door. Check it with the number of doors.', '提示：有柜门铰链位于此格内，拉开抽屉可能碰到柜门。请结合柜门数量检查。')) : null);
      const modules = h('fieldset', { class: 'r03-group' }, h('legend', {}, tx(`Módulos · editando ${BAY(current.bay + 1)}`, `Bays · editing ${BAY(current.bay + 1)}`, `格 · 正在编辑${BAY(current.bay + 1)}`)), tabs, panel);
      const msg = message ? h('p', { class: 'r03-msg is-' + message.kind, role: message.kind === 'error' ? 'alert' : 'status' }, message.text) : h('p', { class: 'r03-msg', role: 'status' });
      const actions = h('div', { class: 'r03-actions' }, msg,
        button(tx('Deshacer', 'Undo', '撤销'), () => { const u = E.undo(current); if (u.ok) set(u.session, { kind: 'ok', text: OP_DONE().undo + '.' }); }, { disabled: !sum.canUndo, title: 'Ctrl+Z' }),
        button(tx('Rehacer', 'Redo', '重做'), () => { const u = E.redo(current); if (u.ok) set(u.session, { kind: 'ok', text: OP_DONE().redo + '.' }); }, { disabled: !sum.canRedo, title: 'Ctrl+Y' }),
        button(tx('Restablecer', 'Reset', '恢复'), () => { const u = E.restore(current); set(u.session, u.unchanged ? { kind: 'info', text: tx('Ya está en el estado inicial.', 'Already in the initial state.', '已处于初始状态。') } : { kind: 'ok', text: OP_DONE().restore + '.' }); }, { disabled: !sum.dirty }),
        onCancel ? button(tx('Cancelar', 'Cancel', '取消'), () => onCancel(current), { class: 'r03-btn r03-btn-quiet' }) : null,
        onSave ? button(tx('Guardar interior', 'Save interior', '保存内部'), () => { const res = onSave(E.result(current), current); if (res && res.message) { message = res.message; render(); } }, { class: 'r03-btn r03-btn-primary', disabled: ro || (!sum.dirty && savedAlready) }) : null);
      if (elevationHost) elevationHost.replaceChildren(elev);
      ui.replaceChildren(...[head, elevationHost ? null : elev, h('div', { class: 'r03-controls' }, modules, doors, sizes), extra ? extra(current) : null, actions].filter(Boolean));
      if (focusId) { const f = ui.querySelector('#' + CSS.escape(focusId)); if (f) f.focus(); }
    }
    ui.addEventListener('keydown', e => {
      if (!(e.ctrlKey || e.metaKey) || e.target.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); const u = E.undo(current); if (u.ok) set(u.session, { kind: 'ok', text: OP_DONE().undo + '.' }); }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); const u = E.redo(current); if (u.ok) set(u.session, { kind: 'ok', text: OP_DONE().redo + '.' }); }
    });
    render();
    return { get session() { return current; }, setSession(next, msg = null, saved = savedAlready) { current = next; message = msg; savedAlready = saved; render(); }, apply: run, render, destroy() { destroyed = true; ui.remove(); } };
  }
  root.RubikCabinetEditorUI = { mount, elevationSVG, FRONT_LABEL };
})(globalThis);
