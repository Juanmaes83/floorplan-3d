/* M08 · «Desplazar muro» en el panel del muro (Diseñar › plano 2D › tocar un muro).
 * Elige el lado (por el nombre visible de la estancia de cada lado) y los milímetros, «Ver efecto» calcula la operación pura
 * (RubikWallMove.plan) SIN tocar el proyecto, y «Aplicar» la entrega a la mutación única del editor (un paso de deshacer,
 * validación, guarda de escaleras y guardado). Si la operación no es segura se explica y no se ofrece aplicar. */
(function (root) {
  'use strict';
  const M = () => root.RubikWallMove;
  const lang = () => { try { return typeof LANG !== 'undefined' ? LANG : 'es'; } catch { return 'es'; } };
  const tx = (es, en, zh) => lang() === 'en' ? en : lang() === 'zh' ? zh : es;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const proj = () => { try { return typeof project !== 'undefined' ? project : root.FloorPlanApp?.project; } catch { return root.FloorPlanApp?.project; } };
  // Nombre visible de una estancia: el embudo del editor (nunca chino en ES/EN).
  const roomName = id => { const p = proj(), r = p?.rooms?.find(x => x.id === id); if (!r) return null; try { if (typeof roomDisplay === 'function') return roomDisplay(r); } catch {} try { return root.FloorPlanDisplayName ? root.FloorPlanDisplayName(r.name, 'room') : r.name; } catch { return r.name; } };
  const sideLabel = (s, i) => s?.roomId ? tx(`Hacia «${roomName(s.roomId)}»`, `Towards «${roomName(s.roomId)}»`, `朝向“${roomName(s.roomId)}”`) : tx(`Lado ${i}`, `Side ${i}`, `第 ${i} 侧`);
  const m2 = v => (Math.round(v * 100) / 100).toLocaleString(lang() === 'en' ? 'en-GB' : lang() === 'zh' ? 'zh-CN' : 'es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let state = { wallId: null, sign: 1, mm: 100, result: null };

  function style() {
    if (typeof document === 'undefined' || document.getElementById('wallMoveStyle')) return;
    const st = document.createElement('style'); st.id = 'wallMoveStyle';
    st.textContent = '.wall-move-sides{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.wall-move-sides .btn{min-height:40px}.wall-move-mm{display:block;margin:6px 0}.wall-move-mm input{width:100%;min-height:40px;font-size:16px;padding:6px 8px}.wall-move .actions{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.wall-move .actions .btn{min-height:40px}.wall-move .actions .btn:disabled{background:var(--surface-sunken);color:var(--ink-muted);border-color:var(--line);cursor:not-allowed}.wall-move-list{margin:6px 0;padding-left:18px}.wall-move-error{color:var(--danger,#a3261b);font-weight:600;margin:6px 0}.wall-move-warn{color:var(--warn,#8a5a00);font-weight:600;margin:6px 0}';
    document.head.append(st);
  }
  function markup(w) {
    if (!M() || !w || w.status === 'demolished') return '';
    style();
    if (state.wallId !== w.id) state = { wallId: w.id, sign: 1, mm: 100, result: null };
    const s = M().sides(proj(), w.id) || {};
    const opt = (sign, label) => `<button type="button" class="btn chip${state.sign === sign ? ' on' : ''}" data-wm-side="${sign}" aria-pressed="${state.sign === sign}">${esc(label)}</button>`;
    return `<details class="panel-group wall-move" data-group="wall-move" id="wallMove"${state.result ? ' open' : ''}><summary>${esc(tx('Desplazar muro', 'Move wall', '移动墙体'))}</summary>
      <p class="muted">${esc(tx('Mueve el tabique con su tramo completo. Los muros que lo tocan, el contorno de las estancias, los huecos y los muebles apoyados se ajustan; si algo no es seguro, no se cambia nada.', 'Moves the partition with its whole stretch. Touching walls, room outlines, openings and furniture resting on it are adjusted; if anything is unsafe, nothing changes.', '整段移动隔墙。相接的墙、房间轮廓、门窗洞口和靠墙家具随之调整；若有不安全之处则不做任何更改。'))}</p>
      <div class="wall-move-sides" role="group" aria-label="${esc(tx('Dirección', 'Direction', '方向'))}">${opt(1, sideLabel(s.plus, 1))}${opt(-1, sideLabel(s.minus, 2))}</div>
      <label class="wall-move-mm">${esc(tx('Distancia (mm)', 'Distance (mm)', '距离（毫米）'))} <input id="wallMoveMm" type="number" inputmode="numeric" min="1" max="${M().LIMITS.MAX_OFFSET_MM}" step="1" value="${state.mm}"></label>
      <div class="actions"><button type="button" class="btn" id="wallMovePreview">${esc(tx('Ver efecto', 'Preview effect', '预览效果'))}</button><button type="button" class="btn primary" id="wallMoveApply"${state.result?.ok ? '' : ' disabled'}>${esc(tx('Aplicar', 'Apply', '应用'))}</button></div>
      <div id="wallMoveResult" role="status" aria-live="polite">${state.result ? summary(state.result) : ''}</div></details>`;
  }

  function summary(res) {
    if (!res.ok) return `<p class="wall-move-error" role="alert">${esc(M().explain(res.code, lang()))}</p>`;
    const r = res.report, li = t => `<li>${esc(t)}</li>`, adj = r.walls.filter(w => w.role === 'adjusted');
    const rows = [
      li(tx(`Tramo de ${r.run.length} pieza(s) desplazado ${Math.abs(r.offsetMm)} mm.`, `Stretch of ${r.run.length} piece(s) moved ${Math.abs(r.offsetMm)} mm.`, `${r.run.length} 段墙体移动 ${Math.abs(r.offsetMm)} 毫米。`)),
      ...r.rooms.map(x => li(`${roomName(x.id)}: ${m2(x.areaBeforeM2)} → ${m2(x.areaAfterM2)} m²`)),
      adj.length ? li(tx(`${adj.length} muro(s) que lo tocan se alargan o acortan.`, `${adj.length} touching wall(s) get longer or shorter.`, `${adj.length} 面相接墙体随之加长或缩短。`)) : '',
      r.openings.length ? li(tx(`${r.openings.length} hueco(s) conservan su posición a lo largo de su muro y lo acompañan si se desplaza.`, `${r.openings.length} opening(s) keep their position along their wall and follow it if it moves.`, `${r.openings.length} 个洞口保持沿墙的位置，墙体移动时随之移动。`)) : '',
      r.objects.moved.length ? li(tx(`${r.objects.moved.length} mueble(s) apoyado(s) lo acompañan.`, `${r.objects.moved.length} piece(s) of furniture resting on it move with it.`, `${r.objects.moved.length} 件靠墙家具随之移动。`)) : '',
    ].join('');
    const warn = r.objects.crossed.length ? `<p class="wall-move-warn">${esc(tx(`Atención: ${r.objects.crossed.length} mueble(s) quedarían atravesados por el muro; revísalos después.`, `Note: ${r.objects.crossed.length} piece(s) of furniture would be cut by the wall; review them afterwards.`, `注意：${r.objects.crossed.length} 件家具将被墙穿过，请事后检查。`))}</p>` : '';
    return `<ul class="wall-move-list">${rows}</ul>${warn}<p class="muted">${esc(tx('Se puede deshacer en un paso.', 'Can be undone in one step.', '可一步撤销。'))}</p>`;
  }

  function bind(wallId, { apply }) {
    const box = document.getElementById('wallMove'); if (!box) return;
    const input = box.querySelector('#wallMoveMm'), out = box.querySelector('#wallMoveResult'), applyBtn = box.querySelector('#wallMoveApply');
    const reset = () => { state.result = null; out.textContent = ''; applyBtn.disabled = true; };
    box.querySelectorAll('[data-wm-side]').forEach(b => b.onclick = () => { state.sign = +b.dataset.wmSide; box.querySelectorAll('[data-wm-side]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); }); reset(); });
    input.oninput = () => { state.mm = Number(input.value); reset(); };
    const compute = () => { state.mm = Number(input.value); state.result = M().plan(proj(), wallId, Number.isInteger(state.mm) ? state.sign * state.mm : NaN); out.innerHTML = summary(state.result); applyBtn.disabled = !state.result.ok; return state.result; };
    box.querySelector('#wallMovePreview').onclick = compute;
    input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); compute(); } };
    applyBtn.onclick = () => {
      const res = compute(); if (!res.ok) return;   // se recalcula sobre el proyecto vigente: nunca se aplica una vista previa caducada
      const mm = Math.abs(res.report.offsetMm); state.result = null;
      if (!apply(res.next)) {
        const updated = document.getElementById('wallMove');
        if (updated) {
          updated.open = true;
          updated.querySelector('#wallMoveApply').disabled = true;
          const alert = document.createElement('p');
          alert.className = 'wall-move-error';
          alert.setAttribute('role', 'alert');
          alert.textContent = tx('No se aplicó el desplazamiento. El plano sigue intacto. Revisa el aviso del editor y vuelve a calcular el efecto.', 'The move was not applied. The plan is unchanged. Check the editor notice and preview the effect again.', '未应用移动。平面图未改变。请查看编辑器提示，然后重新预览效果。');
          updated.querySelector('#wallMoveResult').replaceChildren(alert);
          updated.querySelector('#wallMovePreview').focus({ preventScroll: true });
        }
        return;
      }
      root.dispatchEvent?.(new CustomEvent('rubik-wall-moved', { detail: res.report }));
      try { if (typeof toast === 'function') toast(tx(`Muro desplazado ${mm} mm. Deshacer: Ctrl+Z.`, `Wall moved ${mm} mm. Undo: Ctrl+Z.`, `墙体已移动 ${mm} 毫米。撤销：Ctrl+Z。`)); } catch {}
    };
  }

  for (const event of ['floorplan-project-switched', 'floorplan-level-switched']) {
    root.addEventListener?.(event, () => { state = { wallId: null, sign: 1, mm: 100, result: null }; });
  }

  root.RubikWallMoveUI = Object.freeze({ markup, bind, get state() { return { ...state }; } });
})(typeof window !== 'undefined' ? window : globalThis);
