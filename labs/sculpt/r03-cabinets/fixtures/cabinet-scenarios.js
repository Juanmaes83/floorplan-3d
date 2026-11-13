/* SCULPT-R03 · synthetic scenarios written for RUBIK (no real plan, no client data, nothing taken from the donor's
 * fixtures). Projects follow FloorPlanProjectV1 (walls as centre lines + thickness, rooms as polygons, objects with
 * position = footprint centre, size, rotationDeg clockwise with y down) and have fixed ids, so every run is identical.
 * Clear heights are DECLARED by each scenario: they are definitions of the scenario, not measurements nor defaults. */
(function (root) {
  'use strict';
  const T = 120;
  const wall = (id, x0, y0, x1, y1) => ({ id, start: { x: x0, y: y0 }, end: { x: x1, y: y1 }, thicknessMm: T, heightMm: 2600, structure: 'partition', status: 'existing' });
  // Walls whose INNER faces are x0..x1, y0..y1.
  function box(p, x0, y0, x1, y1) {
    const h = T / 2;
    return [wall(p + '-n', x0 - T, y0 - h, x1 + T, y0 - h), wall(p + '-s', x0 - T, y1 + h, x1 + T, y1 + h), wall(p + '-w', x0 - h, y0, x0 - h, y1), wall(p + '-e', x1 + h, y0, x1 + h, y1)];
  }
  const room = (id, name, x0, y0, x1, y1) => ({ id, name, polygon: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => ({ x, y })), floorMaterialId: 'mat_wood', countsTowardArea: true });
  const project = (name, W, D, objects, roomName = 'Dormitorio') => ({
    schema: 'rubik-sota.floorplan-project', schemaVersion: '1.6.0', id: 'prj_sculpt-r03-' + name, name: 'SCULPT-R03 · ' + name,
    createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z', units: 'mm',
    coordinateSystem: { origin: 'plan-top-left', xAxis: 'right', yAxis: 'down', rotation: 'degrees-clockwise' },
    scale: { confidence: 'estimated', method: 'template', note: 'Escenario sintético de laboratorio: medidas definidas por código, no medidas reales.' }, defaults: { wallHeightMm: 2600, wallThicknessMm: T },
    walls: box('wal_' + name, 0, 0, W, D), openings: [], rooms: [room('rom_' + name, roomName, 0, 0, W, D)],
    materials: [{ id: 'mat_wood', name: 'Madera', category: 'floor', appearance: { color: '#c8a27a', preset: 'wood' } }], objects, measurements: [], sourceImages: []
  });
  const obj = (id, type, name, x, y, w, d, rot = 0, h) => ({ id, type, name, position: { x, y }, size: { widthMm: w, depthMm: d, ...(h ? { heightMm: h } : {}) }, rotationDeg: rot });
  const declared = (clearHeightMm, source = 'definición del escenario sintético') => ({ status: 'declared', clearHeightMm, reference: 'finished-floor', source });
  // Wardrobe 2000 × 600 against the north wall, front facing the room (+y).
  const northWardrobe = (h = 2200) => obj('obj_wardrobe', 'wardrobe', 'Armario', 1100, 300, 2000, 600, 0, h);
  const S = {};
  S['bedroom-default'] = { title: 'Armario de 2 m con la distribución por defecto del donante', project: project('bedroom', 4000, 3500, [northWardrobe()]), objectId: 'obj_wardrobe', vertical: declared(2500) };
  S['low-ceiling'] = { title: 'Techo de 2150 mm: el armario de 2200 no cabe (el donante usaría 2400 de calibración)', project: project('low', 4000, 3500, [northWardrobe()]), objectId: 'obj_wardrobe', vertical: declared(2150) };
  S['nightstand-in-swing'] = { title: 'Mesilla dentro del barrido de la primera puerta, fuera del obstáculo del donante',
    project: project('swing', 4000, 3500, [northWardrobe(), obj('obj_nightstand', 'nightstand', 'Mesilla', 380, 820, 300, 200, 0, 500)]), objectId: 'obj_wardrobe', vertical: declared(2500) };
  S['rotated-east-wall'] = { title: 'Armario girado 90° contra la pared este', project: project('rotated', 4000, 3500, [obj('obj_wardrobe', 'wardrobe', 'Armario', 3700, 1500, 2000, 600, 90, 2200)]), objectId: 'obj_wardrobe', vertical: declared(2500) };
  S['narrow-corridor'] = { title: 'Zapatero en un pasillo de 800 mm: las puertas tocan la pared opuesta',
    project: project('corridor', 800, 3000, [obj('obj_shoecab', 'shoecab', 'Zapatero', 175, 1500, 1000, 350, 270, 1000)], 'Pasillo'), objectId: 'obj_shoecab', vertical: declared(2500) };
  S['invalid-shelves'] = { title: 'Distribución declarada con dos baldas solapadas y una barra en conflicto', project: project('invalid', 4000, 3500, [northWardrobe()]), objectId: 'obj_wardrobe', vertical: declared(2500),
    cabinet: { height: 2200, thickness: 18, back: 9, frontGap: 20, plinth: 80, locked: true, front: 'closed', doorCount: 4,
      columns: [{ width: 1946, kind: 'shelves', shelves: [1000, 1010], rod: 1005, drawers: 0, drawerHeight: 180 }] } };
  S['drawers-across-hinge'] = { title: 'Cajones en una partición atravesada por una bisagra exterior', project: project('hinge', 4000, 3500, [northWardrobe()]), objectId: 'obj_wardrobe', vertical: declared(2500),
    cabinet: { height: 2200, thickness: 18, back: 9, frontGap: 20, plinth: 80, locked: true, front: 'open', doorCount: 4, columns: [
      { width: 642.6666666666666, kind: 'long', shelves: [1702], rod: 1622, drawers: 0, drawerHeight: 180 },
      { width: 642.6666666666666, kind: 'short', shelves: [1702], rod: 1622, drawers: 2, drawerHeight: 180 },
      { width: 642.6666666666666, kind: 'short', shelves: [1702], rod: 1622, drawers: 0, drawerHeight: 180 }] } };
  S['shallow-wardrobe'] = { title: 'Armario de 450 mm de fondo: sin barra, solo baldas', project: project('shallow', 4000, 3500, [obj('obj_wardrobe', 'wardrobe', 'Armario', 1100, 225, 2000, 450, 0, 2200)]), objectId: 'obj_wardrobe', vertical: declared(2500) };
  S['unknown-ceiling'] = { title: 'Sin referencia vertical: la altura libre queda sin evaluar', project: project('unknown', 4000, 3500, [northWardrobe()]), objectId: 'obj_wardrobe', vertical: null };
  S['height-mismatch'] = { title: 'Objeto declarado de 2400 mm frente a un armario por defecto de 2200', project: project('mismatch', 4000, 3500, [northWardrobe(2400)]), objectId: 'obj_wardrobe', vertical: declared(2600) };
  S['tallcab-kitchen'] = { title: 'Columna alta de 600 × 600 (tipo del donante que RUBIK no tiene)', project: project('tallcab', 3000, 2500, [obj('obj_tallcab', 'tallcab', 'Columna', 2600, 300, 600, 600, 0)], 'Cocina'), objectId: 'obj_tallcab', vertical: declared(2500) };
  S['derived-vertical'] = { title: 'Referencia vertical derivada (misma forma que R02-A): 2750 mm desde el suelo de planta', project: project('derived', 4000, 3500, [northWardrobe()]), objectId: 'obj_wardrobe',
    vertical: { status: 'derived', clearHeightMm: 2750, reference: 'level-floor', source: 'FloorPlanBuildingV1: planta superior 3000 − forjado 250 − esta planta 0 (forma de R02-A, sin recalcular aquí)' } };
  S['not-a-cabinet'] = { title: 'Objeto que no es un armario', project: project('bed', 4000, 3500, [obj('obj_bed', 'bed', 'Cama', 2000, 1750, 1600, 2000, 0, 500)]), objectId: 'obj_bed', vertical: declared(2500) };
  // Closure cut (11/11/2026): combinations for the height candidate of previewDiff (the tests rebuild them independently
  // from the base scenarios and check they are identical).
  const variant = (base, title, patch) => { const v = structuredClone(S[base]); v.title = title; patch(v); return v; };
  S['mismatch-low-ceiling'] = variant('height-mismatch', 'Objeto de 2400 mm, armario de 2200 y techo de 2150: altura bloqueada', v => { v.vertical = declared(2150, 'escenario de prueba'); });
  S['mismatch-unknown-ceiling'] = variant('height-mismatch', 'Objeto de 2400 mm sin referencia vertical: altura pendiente', v => { v.vertical = null; });
  S['mismatch-in-swing'] = variant('nightstand-in-swing', 'Altura distinta y mesilla en el barrido: candidatura revisable con incidencia independiente', v => { v.project.objects[0].size.heightMm = 2400; });
  S['mismatch-invalid-interior'] = variant('invalid-shelves', 'Interior no válido y altura distinta: candidatura bloqueada', v => { v.project.objects[0].size.heightMm = 2400; });
  const api = { SCENARIOS: S, ids: Object.keys(S) };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikR03Scenarios = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
