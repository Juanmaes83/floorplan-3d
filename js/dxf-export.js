/* G-02. CAD output uses RUBIK's project and quantity contracts.
   OpenPlan3D CAD layer conventions and symbol adapter, MIT, see vendor/g02-dxf. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const Core = node ? require('./project-core.js') : root.FloorPlanCore;
  const Quantities = node ? require('./quantity-core.js') : root.FloorPlanQuantities;
  const Surface = node ? require('./surface-core.js') : root.FloorPlanSurfaceMetrics;
  const { Drawing, cadText, canvasSymbolDxf } = node
    ? require('../vendor/g02-dxf/dxf-tools.js')
    : RubikDxfTools;

  const layers = {
    WALLS_EXISTING: [7, 'CONTINUOUS'],
    WALLS_NEW: [3, 'CONTINUOUS'],
    DEMOLITION: [1, 'DASHED'],
    RUBIK_WALL_FOOTPRINT: [-7, 'CONTINUOUS'],
    DOORS: [30, 'CONTINUOUS'],
    DOORS_HIDDEN: [30, 'DASHED'],
    WINDOWS: [5, 'CONTINUOUS'],
    ROOMS: [4, 'CONTINUOUS'],
    SURFACES: [4, 'CONTINUOUS'],
    DIMENSIONS: [8, 'CONTINUOUS'],
    LEGEND: [7, 'CONTINUOUS'],
  };
  const wallLayer = { existing: 'WALLS_EXISTING', new: 'WALLS_NEW', demolished: 'DEMOLITION' };
  const labels = {
    es: ['Escala confirmada en el proyecto', 'Escala estimada', 'Muros existentes / nuevos / a demoler', 'Planta', 'Superficie útil', 'Superficie parcial', 'Superficie no computable', 'No computa'],
    en: ['Scale confirmed in project', 'Estimated scale', 'Existing / new / demolition walls', 'Level', 'Usable area', 'Partial area', 'Area unavailable', 'Excluded'],
    zh: ['项目已确认比例', '估算比例', '现有墙 / 新建墙 / 拆除墙', '楼层', '使用面积', '部分面积', '面积不可用', '不计入'],
  };
  const toCad = ([x, y]) => [x, -y];
  const deg = ([x, y]) => (Math.atan2(-y, x) * 180 / Math.PI + 360) % 360;

  function segment(ctx, [x1, y1], [x2, y2]) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }

  function drawOpening(drawing, opening, layer, offsetRatio) {
    const [x, y] = opening.center;
    const u = [Math.cos(opening.angle), Math.sin(opening.angle)];
    const half = opening.spanMm / 2;
    const offset = opening.thickness * offsetRatio;
    drawing.setActiveLayer(layer);
    canvasSymbolDxf(drawing, ctx => {
      ctx.beginPath();
      for (const d of offset ? [-offset, offset] : [0]) {
        const center = [x - u[1] * d, y + u[0] * d];
        segment(ctx, [center[0] - u[0] * half, center[1] - u[1] * half],
          [center[0] + u[0] * half, center[1] + u[1] * half]);
      }
      ctx.stroke();
    });
  }

  function drawDoor(drawing, { h, c, o, len }) {
    drawing.setActiveLayer('DOORS');
    const angles = [deg(c), deg(o)];
    if ((angles[1] - angles[0] + 360) % 360 > 180) angles.reverse();
    drawing.drawArc(h[0], -h[1], len, ...angles);
    canvasSymbolDxf(drawing, ctx => {
      ctx.beginPath();
      segment(ctx, h, [h[0] + o[0] * len, h[1] + o[1] * len]);
      ctx.stroke();
    });
  }

  function text(drawing, [x, y], size, value, rotation = 0) {
    drawing.drawText(x, -y, size, rotation, cadText(String(value)), 'center', 'middle');
  }

  function drawDimension(drawing, ctx, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length < 1) return;
    const nx = -dy / length, ny = dx / length;
    const tick = p => segment(ctx, [p.x - nx * 48, p.y - ny * 48], [p.x + nx * 48, p.y + ny * 48]);
    segment(ctx, [a.x, a.y], [b.x, b.y]);
    tick(a);
    tick(b);
    let angle = Math.atan2(-dy, dx) * 180 / Math.PI;
    if (angle > 90) angle -= 180;
    if (angle < -90) angle += 180;
    text(drawing, [(a.x + b.x) / 2 + nx * 90, (a.y + b.y) / 2 + ny * 90], 100, `${Math.round(length)} mm`, angle);
  }

  function exportLevel(project, { levelName, language = 'es' } = {}) {
    Core.validate(project);
    if (!project.walls.length && !project.rooms.length) throw new Error('El proyecto no tiene una planta que exportar.');
    const drawing = new Drawing();
    drawing.setUnits('Millimeters');
    for (const [name, [color, pattern]] of Object.entries(layers)) drawing.addLayer(name, color, pattern);
    const geometry = Core.geometry({ ...project, sourceImages: [] });
    const quantities = Quantities.level(project);
    const t = labels[language] || labels.es;

    for (const wall of geometry.walls) {
      drawing.setActiveLayer(wallLayer[wall.status] || 'WALLS_EXISTING');
      drawing.drawPolyline(wall.poly.map(toCad), true);
    }
    // A CAD layer switched off by default. RUBIK can read the uninterrupted footprints
    // without mistaking visible jambs and gaps for independent walls.
    drawing.setActiveLayer('RUBIK_WALL_FOOTPRINT');
    for (const wall of project.walls) {
      if (wall.status !== 'demolished') drawing.drawPolyline(Core.wallRect(wall).poly.map(toCad), true);
    }
    for (const door of geometry.doors) drawDoor(drawing, door);
    for (const window of geometry.windows) drawOpening(drawing, window, 'WINDOWS', 0.25);
    for (const slide of geometry.slides) drawOpening(drawing, slide.rect, 'DOORS', 0.2);
    for (const opening of geometry.voids) drawOpening(drawing, opening, 'DOORS_HIDDEN', 0);

    const roomQuantities = new Map(quantities.rooms.map(room => [room.id, room.floor]));
    for (const room of geometry.rooms) {
      drawing.setActiveLayer('ROOMS');
      drawing.drawPolyline(room.poly.map(toCad), true);
      const label = room.at || room.poly.reduce(([x, y], [px, py]) => [
        x + px / room.poly.length, y + py / room.poly.length,
      ], [0, 0]);
      text(drawing, label, 130, room.name);
      drawing.setActiveLayer('SURFACES');
      const area = roomQuantities.get(room.id).areaM2;
      if (area !== null) text(drawing, [label[0], label[1] + 155], 90, `${area.toFixed(2)} m²${room.counted === false ? ' · ' + t[7] : ''}`);
    }

    drawing.setActiveLayer('DIMENSIONS');
    canvasSymbolDxf(drawing, ctx => {
      ctx.beginPath();
      for (const measurement of project.measurements || []) drawDimension(drawing, ctx, measurement.a, measurement.b);
      const { x, y, w, h } = geometry.envelope;
      drawDimension(drawing, ctx, { x, y: y - 300 }, { x: x + w, y: y - 300 });
      drawDimension(drawing, ctx, { x: x - 300, y }, { x: x - 300, y: y + h });
      ctx.stroke();
    });

    drawing.setActiveLayer('LEGEND');
    const { x, y, w, h } = geometry.envelope;
    const floor = quantities.quantities.floor;
    const legend = [
      `${project.name || 'RUBIK'}${levelName ? ' · ' + t[3] + ' ' + levelName : ''} · mm`,
      t[Surface.statusOfScale(project) === 'measured' ? 0 : 1],
      t[2],
      floor.areaM2 === null ? t[6] : `${t[floor.complete ? 4 : 5]} · ${floor.areaM2.toFixed(2)} m²`,
    ];
    legend.forEach((line, index) => text(drawing, [x + w / 2, y + h + 350 + index * 170], 112, line));
    return drawing.toDxfString();
  }

  const api = { exportLevel };
  if (node) module.exports = api;
  else root.FloorPlanDxfExport = api;
})(globalThis);
