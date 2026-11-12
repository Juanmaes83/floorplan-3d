/* SCULPT-R02-A · synthetic scenarios built by code (no real plan, no client data). Projects follow FloorPlanProjectV1
 * shapes (walls as centre lines + thickness, rooms as polygons, objects with position/size/rotationDeg) and are built
 * from scratch with fixed ids, so every run is identical. Ceiling heights are DECLARED here because each scenario is
 * defined that way; they are not measurements and not defaults for real projects. */
(function (root) {
  'use strict';
  const T = 120; // wall thickness of the synthetic plans (mm)
  const wall = (id, x0, y0, x1, y1, extra = {}) => ({ id, start: { x: x0, y: y0 }, end: { x: x1, y: y1 }, thicknessMm: T, heightMm: 2600, structure: 'partition', status: 'existing', ...extra });
  const room = (id, name, pts) => ({ id, name, polygon: pts.map(([x, y]) => ({ x, y })), floorMaterialId: 'mat_wood', countsTowardArea: true });
  // A rectangle of walls whose INNER faces are at x0..x1, y0..y1 (centre lines offset by half the thickness).
  function box(prefix, x0, y0, x1, y1) {
    const h = T / 2;
    return [wall(prefix + '-n', x0 - T, y0 - h, x1 + T, y0 - h), wall(prefix + '-s', x0 - T, y1 + h, x1 + T, y1 + h),
      wall(prefix + '-w', x0 - h, y0, x0 - h, y1), wall(prefix + '-e', x1 + h, y0, x1 + h, y1)];
  }
  const project = (name, walls, rooms, objects = []) => ({
    schema: 'rubik-sota.floorplan-project', schemaVersion: '1.6.0', id: 'prj_sculpt-r02a-' + name, name: 'SCULPT-R02-A · ' + name,
    createdAt: '2026-11-10T00:00:00.000Z', updatedAt: '2026-11-10T00:00:00.000Z', units: 'mm',
    coordinateSystem: { origin: 'plan-top-left', xAxis: 'right', yAxis: 'down', rotation: 'degrees-clockwise' },
    scale: { confidence: 'real', method: 'declared-dimensions' }, defaults: { wallHeightMm: 2600, wallThicknessMm: T },
    walls, openings: [], rooms, materials: [{ id: 'mat_wood', name: 'Madera', category: 'floor', color: '#c8a27a' }], objects, measurements: [], sourceImages: []
  });
  const declared = (clearHeightMm, source = 'synthetic scenario definition') => ({ clearHeightMm, reference: 'finished-floor', source });
  const rect = (id, x0, y0, x1, y1, name = 'Dormitorio') => room(id, name, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);

  const S = {};
  S['rect-ceiling-light'] = { title: 'Habitación rectangular con plafón centrado', project: project('rect', box('w', 0, 0, 4000, 3000), [rect('rom_a', 0, 0, 4000, 3000)]),
    ceiling: declared(2600), requests: [{ id: 'light-1', type: 'ceilinglight', position: { x: 2000, y: 1500 }, dropMm: 0 }] };
  S['pendant-over-bed'] = { title: 'Luminaria suspendida con descenso explícito sobre una cama', project: project('pendant', box('w', 0, 0, 4000, 3000), [rect('rom_a', 0, 0, 4000, 3000)],
      [{ id: 'obj_bed', type: 'bed', name: 'Cama', position: { x: 2000, y: 1800 }, size: { widthMm: 1600, depthMm: 2000, heightMm: 500 }, rotationDeg: 0 }]),
    ceiling: declared(2600), requests: [{ id: 'pendant-1', type: 'pendant', position: { x: 2000, y: 1500 }, dropMm: 0 }] };
  S['curtain-track'] = { title: 'Riel de cortina con longitud de caída', project: project('curtain', box('w', 0, 0, 4000, 3000), [rect('rom_a', 0, 0, 4000, 3000)]),
    ceiling: declared(2600), requests: [{ id: 'track-1', type: 'curtaintrack', position: { x: 2000, y: 50 }, size: { widthMm: 3000, depthMm: 100, heightMm: 80 }, dropMm: 0, curtainLengthMm: 2400 }] };
  S['wall-ac'] = { title: 'Aire acondicionado mural alto con altura referenciada', project: project('ac', box('w', 0, 0, 4000, 3000), [rect('rom_a', 0, 0, 4000, 3000)]),
    ceiling: declared(2600), requests: [{ id: 'ac-1', type: 'acwall', position: { x: 2000, y: 125 }, dropMm: 200 }] };
  S['too-small-room'] = { title: 'Habitación pequeña donde el equipo no cabe', project: project('small', box('w', 0, 0, 1000, 800), [rect('rom_a', 0, 0, 1000, 800, 'Aseo')]),
    ceiling: declared(2500), requests: [{ id: 'track-1', type: 'curtaintrack', position: { x: 500, y: 400 }, dropMm: 0, curtainLengthMm: 2000 }] };
  S['rotated-near-wall'] = { title: 'Equipo girado cerca de una pared', project: project('rotated', box('w', 0, 0, 4000, 3000), [rect('rom_a', 0, 0, 4000, 3000)]),
    ceiling: declared(2600), requests: [{ id: 'heater-1', type: 'bathheater', position: { x: 200, y: 1500 }, rotationDeg: 45, dropMm: 0 }] };
  S['l-shaped-room'] = { title: 'Habitación con geometría irregular (en L)',
    project: project('l', [...box('w', 0, 0, 5000, 2000), wall('w-l', 2440, 2000, 2440, 4000)], [room('rom_l', 'Salón en L', [[0, 0], [5000, 0], [5000, 2000], [2500, 2000], [2500, 4000], [0, 4000]])]),
    ceiling: declared(2700), requests: [{ id: 'light-in', type: 'ceilinglight', position: { x: 1200, y: 3000 }, dropMm: 0 }, { id: 'light-out', type: 'ceilinglight', position: { x: 4000, y: 3200 }, dropMm: 0 }] };
  S['two-interfering'] = { title: 'Dos equipos con posibles interferencias', project: project('two', box('w', 0, 0, 4000, 3000), [rect('rom_a', 0, 0, 4000, 3000)]),
    ceiling: declared(2600), requests: [{ id: 'pendant-1', type: 'pendant', position: { x: 2000, y: 1500 }, dropMm: 0 }, { id: 'light-1', type: 'ceilinglight', position: { x: 2200, y: 1500 }, dropMm: 0 },
      { id: 'pendant-2', type: 'pendant', position: { x: 3000, y: 1500 }, dropMm: 0, size: { widthMm: 500, depthMm: 500, heightMm: 300 } }, { id: 'heater-1', type: 'bathheater', position: { x: 3000, y: 1500 }, dropMm: 1200 }] };
  // Two levels: the ground floor height is DERIVED from the level above (elevation − slab − own elevation);
  // the top floor has no level above, so its ceiling stays unknown unless declared.
  const lv0 = project('lv0', box('w', 0, 0, 4000, 3000), [rect('rom_g', 0, 0, 4000, 3000, 'Planta baja')]);
  const lv1 = project('lv1', box('w', 0, 0, 4000, 3000), [rect('rom_u', 0, 0, 4000, 3000, 'Planta alta')]);
  S['two-levels'] = { title: 'Dos plantas con alturas diferentes',
    building: { schema: 'rubik-sota.floorplan-building', levels: [{ id: 'lvl_g', name: 'Planta baja', order: 0, elevationMm: 0, slabThicknessMm: 0, offsetMm: { x: 0, y: 0 }, project: lv0 },
      { id: 'lvl_u', name: 'Planta alta', order: 1, elevationMm: 3000, slabThicknessMm: 250, offsetMm: { x: 0, y: 0 }, project: lv1 }], stairs: [] },
    requests: [{ id: 'light-1', type: 'ceilinglight', position: { x: 2000, y: 1500 }, dropMm: 0 }] };
  S['unknown-ceiling'] = { title: 'Dato de altura desconocido', project: project('unknown', box('w', 0, 0, 4000, 3000), [rect('rom_a', 0, 0, 4000, 3000)]),
    ceiling: null, requests: [{ id: 'light-1', type: 'ceilinglight', position: { x: 2000, y: 1500 }, dropMm: 0 }] };
  S['floor-layer'] = { title: 'Capa de suelo con mobiliario existente', project: project('floor', box('w', 0, 0, 4000, 3000), [rect('rom_a', 0, 0, 4000, 3000)], [
      { id: 'obj_wardrobe', type: 'wardrobe', name: 'Armario', position: { x: 800, y: 400 }, size: { widthMm: 1200, depthMm: 600, heightMm: 2200 }, rotationDeg: 0 },
      { id: 'obj_table', type: 'table', name: 'Mesa', position: { x: 2600, y: 1800 }, size: { widthMm: 1200, depthMm: 800 }, rotationDeg: 0 }]),
    ceiling: declared(2600), requests: [{ id: 'pendant-w', type: 'pendant', position: { x: 800, y: 400 }, dropMm: 0 }, { id: 'pendant-t', type: 'pendant', position: { x: 2600, y: 1800 }, dropMm: 0 },
      { id: 'light-free', type: 'ceilinglight', position: { x: 2000, y: 600 }, dropMm: 0 }] };
  S['diagonal-wall'] = { title: 'Muro en diagonal (límite de la recolocación del donante)',
    project: project('diag', [...box('w', 0, 0, 4000, 3000), wall('w-diag', 2500, 0, 4000, 1500)], [rect('rom_a', 0, 0, 4000, 3000)]),
    ceiling: declared(2600), requests: [{ id: 'light-1', type: 'ceilinglight', position: { x: 3250, y: 750 }, dropMm: 0 }] };

  const api = { WALL_THICKNESS_MM: T, NAMES: Object.keys(S), scenario: n => { if (!S[n]) throw new Error('unknown scenario ' + n); return JSON.parse(JSON.stringify(S[n])); }, project, wall, room, box, rect, declared };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikR02Scenarios = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
