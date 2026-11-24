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
      const setback = result.setback;
      append('p', output, setback.reason === 'setback-reference' ? t('Añade la distancia de referencia.', 'Enter a reference distance.', '输入参考距离。')
        : setback.reason === 'outside-parcel' ? t('La huella modelada sale de la parcela.', 'The modeled footprint goes beyond the parcel.', '模型轮廓超出地块。')
        : setback.status === 'insufficient-data' ? t('Retranqueo pendiente de parcela, colocación o huella.', 'Setback needs parcel, placement or footprint data.', '退界检查需要地块、定位或轮廓。')
        : format.format(setback.measuredMm / 1000) + ' m · ' + (setback.status === 'review' ? t('revisar retranqueo', 'review setback', '检查退界') : t('dentro de la referencia', 'within reference', '符合参考距离')));
      const list = append('ul', output), names = labels();
      for (const row of result.findings) append('li', list, names[row.kind] + ' · ' + labelOf(row.id, row.levelId) + ' · ' +
        (row.status === 'insufficient-data' ? t('Sin datos suficientes', 'Insufficient data', '数据不足')
          : format.format(row.measured) + ' ' + row.unit + ' / ' + format.format(row.reference) + ' ' + row.unit));
    }
    form.onsubmit = event => { event.preventDefault(); evaluate(); };
    evaluate();
    dialog.showModal();
    input.focus();
  }
  window.FloorPlanPlanAnalysisUI = { open };
})();
