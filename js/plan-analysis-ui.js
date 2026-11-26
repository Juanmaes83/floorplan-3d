(function () {
  'use strict';
  const app = window.FloorPlanApp;
  const t = (es, en, zh) => ({ es, en, zh })[LANG] || es;
  const labels = () => ({
    'door-opening-width': t('Ancho de puerta', 'Door opening width', '门洞宽度'),
    'passage-opening-height': t('Altura de paso', 'Opening height', '通行高度'),
    'declared-room-height': t('Altura libre declarada', 'Declared clear height', '已声明净高'),
    'bedroom-area': t('Superficie de dormitorio', 'Bedroom area', '卧室面积'),
    'stair-width': t('Ancho de escalera', 'Stair width', '楼梯宽度'),
    'stair-headroom': t('Altura sobre escalera', 'Stair headroom', '楼梯净高')
  });
  function append(tag, parent, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    parent.append(node);
    return node;
  }
  const dialog = append('dialog', document.body, '', 'brand-dialog');
  dialog.id = 'planAnalysisDialog';
  dialog.setAttribute('aria-labelledby', 'planAnalysisTitle');
  let opener;
  dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));


  // Nombre reconocible de una puerta: tipo y estancias a ambos lados de su hueco (nunca el id interno).
  function openingName(src, id) {
    const proj = src.levels ? (src.levels.find(l => l.project?.openings?.some(o => o.id === id))?.project || app.project) : src;
    const o = proj.openings?.find(x => x.id === id), w = o && proj.walls?.find(x => x.id === o.wallId);
    const kind = o?.kind === 'sliding-door' ? t('Puerta corredera', 'Sliding door', '推拉门') : o?.kind === 'opening' ? t('Hueco de paso', 'Opening', '洞口') : t('Puerta', 'Door', '门');
    if (!o || !w) return kind;
    const L = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y) || 1, f = (o.offsetMm + o.widthMm / 2) / L, cx = w.start.x + (w.end.x - w.start.x) * f, cy = w.start.y + (w.end.y - w.start.y) * f;
    const nx = -(w.end.y - w.start.y) / L, ny = (w.end.x - w.start.x) / L, d = (w.thicknessMm || 120) / 2 + 150;
    const inside = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = Array.isArray(poly[i]) ? poly[i] : [poly[i].x, poly[i].y], [xj, yj] = Array.isArray(poly[j]) ? poly[j] : [poly[j].x, poly[j].y]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
    const roomAt = (x, y) => proj.rooms?.find(r => inside(r.polygon || r.poly || [], x, y));
    const sides = [roomAt(cx + nx * d, cy + ny * d), roomAt(cx - nx * d, cy - ny * d)].filter(Boolean).map(r => window.FloorPlanDisplayName(r.name, r.family));
    const uniq = [...new Set(sides)];
    return uniq.length === 2 ? t(`${kind} entre ${uniq[0]} y ${uniq[1]}`, `${kind} between ${uniq[0]} and ${uniq[1]}`, `${uniq[0]}与${uniq[1]}之间的${kind}`) : uniq.length === 1 ? t(`${kind} de ${uniq[0]}`, `${kind} of ${uniq[0]}`, `${uniq[0]}的${kind}`) : kind;
  }
  // «Ver en el plano»: cierra el análisis, abre Diseñar en 2D, selecciona el elemento y lo centra en pantalla.
  async function show(sel, pt) {
    dialog.close(); window.FloorPlanProfessionalUI?.close?.(); if (app.viewMode !== '2d' && typeof setView === 'function') await setView('2d');
    if (typeof select === 'function') select(sel);
    if (pt && typeof view === 'object' && typeof applyView === 'function') { const svgEl = document.querySelector('#plan'); view.x0 = pt.x - svgEl.clientWidth / 2 / view.s; view.y0 = pt.y - svgEl.clientHeight / 2 / view.s; applyView(); }
  }
  function locate(id) { const p = app.project, o = p.openings.find(x => x.id === id), w = o && p.walls.find(x => x.id === o.wallId);
    let pt = null; if (w) { const L = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y) || 1, f = (o.offsetMm + o.widthMm / 2) / L; pt = { x: w.start.x + (w.end.x - w.start.x) * f, y: w.start.y + (w.end.y - w.start.y) * f }; }
    show({ kind: 'opening', id }, pt); }
  function locateRoom(id) { const r = app.project.rooms.find(x => x.id === id), poly = (r?.polygon || []).map(q => Array.isArray(q) ? q : [q.x, q.y]);
    const pt = poly.length ? { x: poly.reduce((a, q) => a + q[0], 0) / poly.length, y: poly.reduce((a, q) => a + q[1], 0) / poly.length } : null; show({ kind: 'room', id }, pt); }

  function source() {
    const building = app.levelContext;
    return building ? { levels: building.levels, stairs: building.stairs, site: FloorPlanBuildingUI.site } : app.project;
  }

  function open(kind) {
    if (dialog.open) return;
    opener = document.activeElement;
    dialog.replaceChildren();
    const head = append('div', dialog, '', 'brand-head');
    const title = append('h2', head, kind === 'sun' ? t('Sol directo por estancia', 'Direct sun by room', '各房间直射阳光')
      : t('Comprobar el plano', 'Check the plan', '检查平面图'));
    title.id = 'planAnalysisTitle';
    const close = append('button', head, t('Cerrar', 'Close', '关闭'), 'btn');
    close.type = 'button';
    close.onclick = () => dialog.close();
    const form = append('form', dialog);
    const label = append('label', form, kind === 'sun' ? t('Fecha del estudio', 'Study date', '分析日期')
      : t('Retranqueo de referencia (m)', 'Reference setback (m)', '参考退界距离（米）'), 'brand-field');
    const input = append('input', label);
    input.id = 'planAnalysisInput';
    if (kind === 'sun') {
      input.type = 'date';
      input.required = true;
      const local = new Date();
      input.value = [local.getFullYear(), local.getMonth() + 1, local.getDate()].map(n => String(n).padStart(2, '0')).join('-');
    } else {
      input.type = 'number';
      input.step = 'any';
      input.min = '0';
    }
    const actions = append('div', form, '', 'brand-actions');
    append('button', actions, t('Calcular', 'Calculate', '计算'), 'btn primary').type = 'submit';
    const note = kind === 'sun'
      ? t('Estimación cada 15 minutos en el centro de las ventanas exteriores. Considera los muros modelados.',
        'Estimates at external window centres every 15 minutes. Includes modeled walls.', '每 15 分钟估算外窗中心的直射阳光，考虑已建模墙体。')
      : t('Comprobaciones orientativas. Introduce un retranqueo de referencia para comparar la huella con la parcela.',
        'Indicative checks. Enter a reference setback to compare the footprint with the parcel outline.', '检查仅供参考。输入参考退界距离以与地块边界比较。');
    append('p', dialog, note, 'brand-lead');
    const output = append('div', dialog);
    output.id = 'planAnalysisResults';
    output.setAttribute('aria-live', 'polite');

    function evaluate() {
      const s = source();
      const format = new Intl.NumberFormat(LANG === 'zh' ? 'zh-CN' : LANG, { maximumFractionDigits: 2 });
      const labelOf = (id, levelId) => {
        const level = s.levels?.find(l => l.id === levelId);
        const room = (level?.project || s).rooms?.find(r => r.id === id);
        return [level && window.FloorPlanDisplayName(level.name), room ? window.FloorPlanDisplayName(room.name, room.family) : id].filter(Boolean).join(' · ');
      };
      output.replaceChildren();
      if (kind === 'sun') {
        const result = FloorPlanSunDrone.directSun(s, input.value);
        if (result.status !== 'indicative') {
          const clock = ['non-standard-local-day', 'nonexistent-time', 'ambiguous-time'].includes(result.reason);
          append('p', output, clock ? t('Elige un día sin cambio de hora.', 'Choose a day without a clock change.', '请选择没有时钟调整的日期。')
            : t('Revisa la ubicación, la zona horaria y el norte en Orientación.', 'Check location, time zone and north in Orientation.', '请在朝向中检查位置、时区和北向。'));
          return;
        }
        const list = append('ul', output);
        for (const room of result.rooms) append('li', list, labelOf(room.roomId, room.levelId) + ' · ' +
          (room.directHours === null ? t('Sin ventana exterior identificada', 'No exterior window identified', '未识别到外窗') : format.format(room.directHours) + ' h'));
        return;
      }
      const result = FloorPlanValidation.inspectPlan(s, { setbackMm: input.valueAsNumber * 1000 });
      if (result.surfaces.areaM2 !== null) append('p', output,
        t('Superficie útil', 'Net area', '使用面积') + ' · ' + format.format(result.surfaces.areaM2) + ' m² · ' +
        (result.surfaces.status === 'estimated' ? t('estimada', 'estimated', '估算') : t('escala confirmada', 'confirmed scale', '比例已确认')));
      // §5.3 · Resultados separados: puertas, alturas libres y retranqueo; cada uno dice de dónde sale su valor.
      const names = labels(), groups = { door: [], height: [], other: [] };
      for (const row of result.findings) (/opening/.test(row.kind) ? groups.door : row.kind === 'declared-room-height' ? groups.height : groups.other).push(row);
      const section = (id, title) => { const sec = append('section', output, '', 'plan-check-group'); sec.dataset.group = id; append('h3', sec, title); return sec; };
      const mm = v => format.format(v) + ' mm';
      // Puertas: nombre reconocible (estancias a ambos lados) y «Ver en el plano».
      const doorsSec = section('doors', t('Puertas', 'Doors', '门'));
      const doors = groups.door.filter(r => r.status !== 'pass');
      if (!doors.length) append('p', doorsSec, groups.door.length ? t('Todas las puertas alcanzan la referencia orientativa.', 'All doors reach the indicative reference.', '所有门均达到参考值。') : t('No hay puertas que comprobar.', 'No doors to check.', '没有需要检查的门。'), 'brand-lead');
      const doorList = append('ul', doorsSec, '', 'plan-check-list');
      for (const row of doors) {
        const li = append('li', doorList); li.dataset.opening = row.id;
        append('b', li, openingName(s, row.id) + ' · ' + names[row.kind]);
        if (row.status === 'insufficient-data') append('span', li, ' · ' + t('Sin datos suficientes', 'Insufficient data', '数据不足'));
        else {
          const diff = row.reference - row.measured;
          append('span', li, ' · ' + t(`${mm(row.measured)} en el plano · referencia orientativa interna ${mm(row.reference)} · ${diff > 0 ? 'faltan ' + mm(diff) : 'cumple la referencia'}`,
            `${mm(row.measured)} on the plan · internal indicative reference ${mm(row.reference)} · ${diff > 0 ? mm(diff) + ' short' : 'meets the reference'}`, `平面图 ${mm(row.measured)} · 内部参考 ${mm(row.reference)}`));
        }
        const go = append('button', li, t('Ver en el plano', 'View on the plan', '在平面图中查看'), 'btn'); go.type = 'button'; go.dataset.locate = row.id; go.onclick = () => locate(row.id);
      }
      append('p', doorsSec, t('El ancho es el hueco dibujado en el plano. La referencia de 900 mm es una pauta interna de RUBIK para orientar el diseño: no es una validación normativa ni sustituye a la normativa aplicable.',
        'The width is the opening drawn on the plan. The 900 mm reference is an internal RUBIK guideline to orient the design: it is not a code compliance check.', '宽度为平面图中绘制的洞口。900 mm 为 RUBIK 内部参考，并非规范校核。'), 'brand-lead plan-check-origin');
      // Alturas libres: resumen agrupado, lista desplegable y dónde se declara.
      const hSec = section('heights', t('Alturas libres', 'Clear heights', '净高'));
      const missing = groups.height.filter(r => r.status === 'insufficient-data'), low = groups.height.filter(r => r.status === 'review');
      if (missing.length) {
        const det = append('details', hSec, '', 'plan-check-missing'); det.id = 'planCheckMissingHeights';
        append('summary', det, t(`Falta la altura libre en ${missing.length} ${missing.length === 1 ? 'espacio' : 'espacios'}`, `Clear height missing in ${missing.length} ${missing.length === 1 ? 'space' : 'spaces'}`, `${missing.length} 个空间缺少净高`));
        const ul = append('ul', det, '', 'plan-check-list');
        for (const row of missing) { const li = append('li', ul); append('span', li, labelOf(row.id, row.levelId) + ' '); const go = append('button', li, t('Ver estancia', 'View room', '查看房间'), 'btn'); go.type = 'button'; go.onclick = () => locateRoom(row.id); }
        append('p', det, t('Dónde se declara: la altura libre llega con los datos verticales del proyecto (referencias de techo importadas). RUBIK todavía no tiene un campo para escribirla a mano; «Ver estancia» abre la estancia en el plano.',
          'Where it is declared: clear height comes with the project vertical data (imported ceiling references). RUBIK has no manual field yet; «View room» opens the room on the plan.', '净高来自项目的竖向数据（导入的天花参考），RUBIK 暂无手动字段。'), 'brand-lead');
      }
      for (const row of low) append('p', hSec, labelOf(row.id, row.levelId) + ' · ' + mm(row.measured) + ' / ' + t('referencia', 'reference', '参考') + ' ' + mm(row.reference));
      if (!missing.length && !low.length) append('p', hSec, t('Alturas declaradas dentro de la referencia.', 'Declared heights within the reference.', '已声明净高符合参考。'), 'brand-lead');
      // Retranqueo: qué distancia se compara y qué falta primero.
      const sSec = section('setback', t('Retranqueo', 'Setback', '退界'));
      append('p', sSec, t('Se compara la distancia más corta entre el contorno exterior del edificio y el límite de la parcela con el retranqueo que indiques.', 'The shortest distance between the building outline and the parcel boundary is compared with the setback you enter.', '比较建筑外轮廓到地块边界的最短距离与你输入的退界。'), 'brand-lead');
      const site = s.site || window.FloorPlanBuildingUI?.site || app.project.site || {}, setback = result.setback;
      if (!site.parcel || !site.buildingPlacement) {
        append('p', sSec, !site.parcel ? t('Falta la parcela.', 'The parcel is missing.', '缺少地块。') : t('Falta colocar el edificio en la parcela.', 'The building is not placed on the parcel.', '建筑尚未定位。'));
        const go = append('button', sSec, t('Configurar emplazamiento', 'Configure site', '配置场地'), 'btn primary'); go.type = 'button'; go.id = 'planCheckSite'; go.onclick = () => { dialog.close(); window.FloorPlanTerritoryUI?.open(); };
      } else if (setback.reason === 'setback-reference') { append('p', sSec, t('Escribe arriba el retranqueo de referencia (m) y pulsa «Calcular».', 'Enter the reference setback (m) above and press «Calculate».', '在上方输入参考退界（米）并计算。')); input.focus(); }
      else append('p', sSec, setback.reason === 'outside-parcel' ? t('La huella modelada sale de la parcela.', 'The modeled footprint goes beyond the parcel.', '模型轮廓超出地块。')
        : setback.status === 'insufficient-data' ? t('Falta la huella del edificio.', 'The building footprint is missing.', '缺少建筑轮廓。')
        : format.format(setback.measuredMm / 1000) + ' m · ' + (setback.status === 'review' ? t('revisar retranqueo', 'review setback', '检查退界') : t('dentro de la referencia', 'within reference', '符合参考距离')));
      if (groups.other.length) { const oSec = section('other', t('Otras comprobaciones', 'Other checks', '其他检查')); const ul = append('ul', oSec, '', 'plan-check-list');
        for (const row of groups.other) append('li', ul, names[row.kind] + ' · ' + labelOf(row.id, row.levelId) + ' · ' + (row.status === 'insufficient-data' ? t('Sin datos suficientes', 'Insufficient data', '数据不足') : format.format(row.measured) + ' ' + row.unit + ' / ' + format.format(row.reference) + ' ' + row.unit)); }
    }
    form.onsubmit = event => { event.preventDefault(); evaluate(); };
    evaluate();
    dialog.showModal();
    input.focus();
  }
  window.FloorPlanPlanAnalysisUI = { open };
})();
