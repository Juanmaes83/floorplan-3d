'use strict';
/* SCULPT Simulator · E · Obstáculos de RUBIK para el preflight, desde la geometría CANÓNICA (FloorPlanCore.geometry del
 * propio RUBIK, que se pasa como `Core`): no hay otro motor geométrico. Marco del visor: metros, Y arriba,
 * x = (planX − centro.x)/1000, z = (planY − centro.y)/1000, giro −angle (como View3D y export.cjs).
 *
 * Reglas alineadas con el visor de RUBIK (index.html, buildFurniture / muros) en floorplan-3d@02712b5:
 *  - Muros: partes macizas. Muros demolidos fuera.
 *  - Huecos (`kind` de la abertura):
 *      · window        → antepecho (0..sill) y dintel (head..altura) macizos; el VIDRIO (sill..head) es obstáculo
 *                        `glazing`: una cámara no atraviesa una ventana.
 *      · door          → dintel macizo; la hoja depende de `doors`: 'open' (por defecto, paso libre: el visor abre las
 *                        puertas en los recorridos) o 'closed' (obstáculo `door-leaf` en el vano); también por id.
 *      · sliding-door  → como door.
 *      · resto (vano)  → paso libre con antepecho/dintel si los hay.
 *  - Muebles: el visor coloca el grupo en y = elevationMm (o 0) y, si hay heightMm declarado (y no es un armario R03),
 *    reescala el modelo a ancho × alto × fondo con su base en esa cota. Sin heightMm, la altura es la del modelo nativo:
 *    se usa la altura de catálogo y se marca `heightSource` para que el informe no aparente precisión que no tiene.
 *    `acwall` sin heightMm: el modelo nativo se dibuja a 2,2–2,5 m. Alfombras fuera (cubren el suelo).
 * Tolerancia: `inset` absoluto (por defecto TOLERANCES.contactToleranceM = 1 mm), no un porcentaje.
 */
const { obb, TOLERANCES } = require('./motion-preflight.cjs');
const FLOOR_COVERING = new Set(['rug']), NATIVE = { acwall: { y0: 2.2, h: 0.3 } };
const err = (code, msg) => Object.assign(Error(msg), { code });

function obstacles(project, { Core, heights = {}, inset = TOLERANCES.contactToleranceM, doors = 'open', cabinetTypes = null } = {}) {
  if (!Core || typeof Core.geometry !== 'function') throw err('CORE', 'obstacles: pass RUBIK FloorPlanCore as `Core`');
  if (!(inset >= 0)) throw err('INSET', 'inset must be ≥ 0 metres');
  const doorState = id => (typeof doors === 'object' && doors ? (doors[id] || 'open') : doors);
  if (typeof doors === 'string' && !['open', 'closed'].includes(doors)) throw err('DOORS', "doors must be 'open', 'closed' or {openingId: state}");
  const g = Core.geometry(project), cx = g.center.x, cy = g.center.y, out = [], def = (project.defaults && project.defaults.wallHeightMm || 2800) / 1000;
  const box = (id, kind, r, y0, y1, extra = {}) => {
    if (y1 - y0 <= 1e-6) return;
    out.push({ id, kind, box: obb({ center: [(r.center[0] - cx) / 1000, (y0 + y1) / 2, (r.center[1] - cy) / 1000], half: [r.spanMm / 2000, (y1 - y0) / 2, r.thickness / 2000], yaw: -r.angle, inset }), ...extra });
  };
  g.walls.forEach((w, i) => { if (w.status !== 'demolished') box(`wall:${w.id}#${i}`, 'wall', w, 0, w.height || def, { entity: w.id }); });
  const passages = [];
  for (const r of g.windows) {
    box(`wall:${r.id}@sill:${r.openingId}`, 'wall', r, 0, r.sill, { entity: r.id });
    box(`glazing:${r.openingId}`, 'glazing', r, r.sill, r.head, { entity: r.openingId });
    box(`wall:${r.id}@head:${r.openingId}`, 'wall', r, r.head, r.height || def, { entity: r.id });
  }
  const leaves = [...g.doors.map(d => ({ r: d.rect, kind: 'door' })), ...g.slides.map(d => ({ r: d.rect, kind: 'sliding-door' })), ...g.voids.map(r => ({ r, kind: 'void' }))];
  for (const { r, kind } of leaves) {
    if (r.sill > 0) box(`wall:${r.id}@sill:${r.openingId}`, 'wall', r, 0, r.sill, { entity: r.id });
    box(`wall:${r.id}@head:${r.openingId}`, 'wall', r, r.head, r.height || def, { entity: r.id });
    const state = kind === 'void' ? 'void' : doorState(r.openingId);
    if (state === 'closed') box(`door-leaf:${r.openingId}`, 'door-leaf', r, r.sill || 0, r.head, { entity: r.openingId });
    passages.push({ openingId: r.openingId, kind, state, sillM: r.sill || 0, headM: r.head });
  }
  const isCabinet = o => (cabinetTypes ? cabinetTypes.has(o.type) : false);
  for (const o of project.objects || []) {
    if (FLOOR_COVERING.has(o.type) || !o.size) continue;
    const base = (o.elevationMm || 0) / 1000; let y0 = base, h, heightSource;
    if (o.size.heightMm && !isCabinet(o)) { h = o.size.heightMm / 1000; heightSource = 'declared'; }
    else if (NATIVE[o.type]) { y0 = base + NATIVE[o.type].y0; h = NATIVE[o.type].h; heightSource = 'viewer-native'; }
    else if (heights[o.type]) { h = heights[o.type] / 1000; heightSource = 'catalog'; }
    else { h = 0.8; heightSource = 'viewer-default-box'; }
    out.push({ id: 'object:' + o.id, kind: 'object', entity: o.id, type: o.type, heightSource,
      box: obb({ center: [(o.position.x - cx) / 1000, y0 + h / 2, (o.position.y - cy) / 1000], half: [o.size.widthMm / 2000, h / 2, o.size.depthMm / 2000], yaw: -(o.rotationDeg || 0) * Math.PI / 180, inset }) });
  }
  return { frame: { originPlanMm: g.center, units: 'metres', axes: 'three-y-up' }, obstacles: out, passages,
    assumptions: { doors: typeof doors === 'string' ? doors : 'per-opening', insetM: inset, wallHeightDefaultM: def, levelScope: 'active level only' } };
}

/** Trayectoria de cámara (fotogramas de una secuencia de D: {t, camera:[x,y,z]}) → móvil esfera.
 *  radius: por defecto el del plano cercano del visor (cameraRadius con FOV 45° y el aspecto de la captura).
 *  Un fotograma sin pose deja un hueco: el barrido lo informará como INCOMPLETO. */
function cameraMover(frames, { radius, id = 'camera' } = {}) {
  if (!Array.isArray(frames) || !frames.length) throw err('FRAMES', 'cameraMover: frames are required');
  if (!(radius > 0)) throw err('RADIUS', 'cameraMover: radius (m) is required; use cameraRadius()');
  const at = new Map(frames.map(f => [f.t, Array.isArray(f.camera) ? f.camera : null]));
  return { mover: { id, at: t => (at.get(t) ? { kind: 'sphere', center: at.get(t), radius } : null) }, times: frames.map(f => f.t) };
}

/** Por debajo del suelo de la planta activa (y < 0) dentro de la envolvente: siempre un defecto de encuadre. */
function belowFloor(frames, project, { Core }) {
  const g = Core.geometry(project), cx = g.center.x, cy = g.center.y, e = g.envelope;
  return frames.filter(f => f.camera && f.camera[1] < 0 && f.camera[0] * 1000 + cx >= e.x && f.camera[0] * 1000 + cx <= e.x + e.w && f.camera[2] * 1000 + cy >= e.y && f.camera[2] * 1000 + cy <= e.y + e.h).map(f => ({ t: f.t, camera: f.camera }));
}

module.exports = { obstacles, cameraMover, belowFloor, NATIVE };
