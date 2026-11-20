/* SCULPT-R03 · el editor de interiores dentro de RUBIK (corte R2: interfaz; NO lo carga index.html de master).
 *
 * Abre un diálogo modal con el editor de #202 (RubikCabinetEditorUI) para el armario seleccionado y lo conecta con el
 * puente (RubikCabinetBridge). La app solo le da dos cosas: cómo leer el proyecto vigente y cómo guardar dentro de su
 * propio deshacer (mutate). Así la cirugía de index.html se queda en unas pocas líneas.
 *
 * Teclado: el diálogo es modal. Sus teclas no llegan a RUBIK (si no, Ctrl+Z desharía a la vez la edición del armario y
 * el proyecto entero). Escape o «Cerrar» cierran (si hay cambios sin guardar, primero lo piden otra vez;
 * «Cancelar» descarta a propósito). El foco vuelve al botón que
 * lo abrió. */
(function (root) {
  'use strict';
  const B = () => root.RubikCabinetBridge, UI = () => root.RubikCabinetEditorUI, E = () => root.RubikCabinetEditor;
  let current = null;
  const TYPE = { wardrobe: 'Armario ropero', tallcab: 'Columna', cabinet: 'Mueble bajo', shoecab: 'Zapatero' };

  /* open({objectId, getProject, commit, opener}) → {ok} | {ok:false, reason}
     commit(nextProjectFn): la app ejecuta nextProjectFn() dentro de su mutate() y devuelve {ok, project?, message?}. */
  function open({ objectId, getProject, commit, opener = document.activeElement, host = document.body } = {}) {
    close();
    const project = getProject(), o = B().open(project, objectId);
    if (!o.ok) return { ok: false, reason: o.issues?.[0]?.message || o.status };
    const object = project.objects.find(x => x.id === objectId);
    // Nombre VISIBLE por la fuente única de RUBIK (regla: sin chino en español o inglés).
    const shown = root.FloorPlanDisplayName ? root.FloorPlanDisplayName(object.name, object.type) : (object.name || objectId);
    // Sin redundancias («Armario ropero «Armario»»): si el nombre visible es solo el del tipo, no se repite entre comillas.
    const norm = v => String(v || '').trim().toLocaleLowerCase('es'), typeLabel = TYPE[object.type] || object.type;
    const generic = norm(shown) === norm(root.FloorPlanDisplayName?.typeName?.(object.type)) || norm(typeLabel).includes(norm(shown));
    const label = generic ? typeLabel : `${typeLabel} «${shown}»`;
    const dialog = document.createElement('div');
    dialog.className = 'r03-scope r03-rubik-dialog';
    dialog.setAttribute('role', 'dialog');dialog.setAttribute('aria-modal', 'true');dialog.setAttribute('aria-labelledby', 'r03RubikTitle');
    dialog.innerHTML = `<div class="r03-rubik-sheet"><div class="r03-rubik-head"><div class="r03-rubik-row"><h2 id="r03RubikTitle"></h2>
      <button type="button" class="r03-btn r03-btn-quiet r03-rubik-close" aria-label="Cerrar el editor de interior">Cerrar</button></div>
      <p class="r03-rubik-note">Interior paramétrico experimental: medidas supuestas, no de fabricante. No es un presupuesto ni sirve para fabricar.</p>
      <details class="r03-clear"><summary><span id="r03ClearTitle" class="r03-clear-title">Holguras · solo lectura</span> <span class="r03-clear-sum" role="status" aria-live="polite"></span></summary>
      <div class="r03-clear-groups"></div><p class="r03-clear-limits"></p></details></div>
      <div class="r03-rubik-body"></div></div>`;
    dialog.querySelector('#r03RubikTitle').textContent = `Interior · ${label} · ${object.size.widthMm} × ${object.size.depthMm} mm`;
    host.append(dialog);
    const body = dialog.querySelector('.r03-rubik-body'), sheet = dialog.querySelector('.r03-rubik-sheet');sheet.tabIndex = -1;
    /* R03 · holguras (solo lectura). Se recalcula con el BORRADOR del editor en cada cambio, con los motores existentes
       (RubikCabinetClearance → RubikCabinetCore + FloorPlanPlacement + FloorPlanLayoutReview). Agrupa por autoridad, no
       bloquea el guardado ni propone nada. Sin el módulo, la sección no aparece. */
    const clearBox = dialog.querySelector('.r03-clear');
    const showClearance = session => {
      const C = root.RubikCabinetClearance;
      if (!C || !session) { clearBox.hidden = true; return; }
      const t0 = performance.now(), project = getProject(), d = C.describe(project, C.analyzeDraft(project, objectId, session.state.outer, session.state.cabinet));
      clearBox.hidden = false; clearBox.dataset.summary = d.summary || d.status;
      // Resumen compacto (una línea): cuántos avisos de cada autoridad. El detalle queda en el desplegable, cerrado por defecto,
      // para dar prioridad al dibujo del armario.
      const count = lvl => d.groups.filter(g => g.level === lvl).length;
      const parts = [count('rubik') && `${count('rubik')} de RUBIK`, count('donor') && `${count('donor')} de la regla de origen`, count('experimental') && `${count('experimental')} orientativo${count('experimental') > 1 ? 's' : ''}`].filter(Boolean);
      clearBox.querySelector('.r03-clear-sum').textContent = d.status !== 'evaluated' ? d.text : parts.length ? `Avisos: ${parts.join(' · ')}. No impiden guardar.` : 'Sin choques al abrir.';
      clearBox.dataset.ms = (performance.now() - t0).toFixed(2);
      clearBox.querySelector('.r03-clear-limits').textContent = d.limits || '';
      const host = clearBox.querySelector('.r03-clear-groups'); host.replaceChildren();
      for (const g of d.groups) {
        const el = document.createElement('div'); el.className = `r03-clear-group is-${g.level}`; el.dataset.kind = g.kind;
        const h = document.createElement('p'); h.className = 'r03-clear-head';
        const t = document.createElement('strong'); t.textContent = g.title; const a = document.createElement('span'); a.className = 'r03-clear-auth'; a.textContent = g.authority;
        h.append(t, ' ', a); const ul = document.createElement('ul');
        for (const it of g.items) { const li = document.createElement('li'); li.textContent = it; ul.append(li); }
        el.append(h, ul); host.append(el);
      }
    };
    let savedAlready = o.status === 'ok';
    const editor = UI().mount(body, {
      session: o.session, title: label, savedAlready,
      onSave: (res, s) => {
        const r = commit(() => B().save(getProject(), s));
        if (!r?.ok) return { message: { kind: 'error', text: 'No se ha guardado. ' + (r?.message || '') } };
        // Se sigue editando lo que quedó guardado (el historial de la edición empieza de nuevo; el de RUBIK tiene el paso).
        const again = B().open(getProject(), objectId);savedAlready = true;
        editor.setSession(again.session, { kind: 'ok', text: 'Interior guardado en el proyecto. Se puede deshacer con «Deshacer» de RUBIK.' }, true);
        if (!dialog.contains(document.activeElement)) sheet.focus({ preventScroll: true });
        return null;
      },
      onCancel: () => close(),// «Cancelar» es descartar a propósito: cierra sin preguntar
      onChange: s => { delete dialog.dataset.confirmClose; showClearance(s); },// un cambio nuevo vuelve a exigir confirmación
    });
    showClearance(editor.session);
    if (o.notice) editor.setSession(o.session, o.notice, savedAlready);
    /* Cerrar con cambios sin guardar pide confirmación, igual con Escape que con el botón «Cerrar» (en el móvil no hay
       Escape: antes el botón cerraba y los tiraba sin avisar). La segunda petición seguida cierra. */
    const requestClose = how => {
      if (E().dirty(editor.session) && dialog.dataset.confirmClose !== '1') { dialog.dataset.confirmClose = '1';
        editor.setSession(editor.session, { kind: 'error', text: `Hay cambios sin guardar. ${how === 'key' ? 'Pulsa Escape' : 'Pulsa «Cerrar»'} otra vez para cerrar sin guardarlos.` }, savedAlready);
        return false; }
      close();return true;
    };
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault();e.stopPropagation();requestClose('key');return; }
      if (e.key !== 'Tab') delete dialog.dataset.confirmClose;
      // Modal: RUBIK no recibe estas teclas (Ctrl+Z, Supr, flechas…). Dentro del diálogo siguen hasta el editor (su
      // Ctrl+Z/Ctrl+Y deshace la edición del armario) y se paran en el propio diálogo, antes de llegar a RUBIK; fuera
      // (foco perdido) se paran aquí. Antes se paraban todas aquí y el Ctrl+Z del editor no funcionaba.
      if (!dialog.contains(e.target)) e.stopPropagation();
    };
    dialog.addEventListener('keydown', e => e.stopPropagation());
    // Escucha en el documento, en captura, mientras está abierto: aunque el foco se pierda (p. ej. al redibujarse tras
    // guardar), ninguna tecla llega a RUBIK y Escape sigue cerrando. Y el foco vuelve al diálogo si se escapa de él.
    document.addEventListener('keydown', onKey, true);
    const keepFocus = e => { if (!dialog.contains(e.target)) sheet.focus({ preventScroll: true }); };
    document.addEventListener('focusin', keepFocus, true);
    dialog.querySelector('.r03-rubik-close').addEventListener('click', () => requestClose('button'));
    current = { dialog, editor, opener, objectId, off: () => { document.removeEventListener('keydown', onKey, true);document.removeEventListener('focusin', keepFocus, true); } };
    (body.querySelector('button,input,[tabindex]') || dialog.querySelector('.r03-rubik-close')).focus({ preventScroll: true });
    return { ok: true, status: o.status, readOnly: o.readOnly };
  }
  function close() {
    if (!current) return false;
    const { dialog, editor, opener, off } = current;current = null;off();
    editor.destroy();dialog.remove();
    // Tras guardar, RUBIK redibuja su panel y el botón que abrió el diálogo ya no existe: se busca el nuevo, por su id.
    const back = opener?.isConnected ? opener : (opener?.id ? document.getElementById(opener.id) : null);
    back?.focus({ preventScroll: true });
    return true;
  }
  root.RubikCabinetRubikUI = Object.freeze({ open, close, get current() { return current ? { objectId: current.objectId, session: current.editor.session } : null; } });
})(typeof globalThis !== 'undefined' ? globalThis : this);
