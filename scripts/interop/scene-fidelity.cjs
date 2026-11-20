'use strict';
/* OP-10 candidata · Fidelidad geométrica A ↔ B (↔ C). Origen: labs/sculpt/op-10/src/compare.cjs (2.038 comprobaciones sin fallos).
 * Delta 1.0.0: identidad de huecos (C2) como contrato, mallas sin identificar = 0 y caras coincidentes visibles = 0 (C3).
 *   A = proyecto canónico (FloorPlanProjectV1, mm, plano X derecha / Y abajo)
 *   B = mallas observadas en el visor (scene.json, m, Y arriba)
 *   C = la misma escena abierta en Blender y devuelta al marco Y-up (mismo formato que B)
 * Cada comprobación mide en milímetros y se evalúa con una tolerancia NOMBRADA (ver TOL). La tolerancia es de
 * EXPORTACIÓN (float32, redondeo a 1 µm, triangulación), no de precisión arquitectónica del proyecto.
 * Uso: node scene-fidelity.cjs project.json scene.json [--tol perfil] → informe JSON por stdout
 */
const fs = require('node:fs'), path = require('node:path');
// OP-07 · muros curvos e inclinados (contrato 2.0): se miden con el núcleo único (js/wall-geometry-core.js) y la política
// de trayectoria del proyecto (Core.WALL_PATH); el suelo esperado es el anillo canónico (Core.roomRing). Los muros
// rectos sin pendiente y los proyectos v1 siguen exactamente el camino anterior.
const Core = require(path.join(__dirname, '../../js/project-core.js')), Walls = require(path.join(__dirname, '../../js/wall-geometry-core.js'));
const shaped = w => Walls.isCurved(w) || (Number.isFinite(w.heightEndMm) && w.heightEndMm !== w.heightMm);
// Marco de una trayectoria facetada (m, mundo): punto, tangente y normal en la distancia s; proyección de un vértice.
function pathFrame(w, origin) {
  const c = Walls.centreline(w, Core.WALL_PATH).map(p => ({ x: (p.x - origin.x) / 1000, z: (p.y - origin.y) / 1000 }));
  const segs = []; let acc = 0;
  for (let i = 0; i + 1 < c.length; i++) { const a = c[i], b = c[i + 1], L = Math.hypot(b.x - a.x, b.z - a.z), u = { x: (b.x - a.x) / L, z: (b.z - a.z) / L }; segs.push({ a, b, L, u, n: { x: -u.z, z: u.x }, s0: acc }); acc += L; }
  const at = s => { const g = segs.find(x => s <= x.s0 + x.L + 1e-12) || segs[segs.length - 1], t = s - g.s0; return { p: { x: g.a.x + g.u.x * t, z: g.a.z + g.u.z * t }, u: g.u, n: g.n }; };
  // Proyección de un vértice sobre la trayectoria: distancia a lo largo (s, prolongando los extremos) y desviación con signo.
  const project = v => { let best = null;
    segs.forEach((g, i) => { let t = (v[0] - g.a.x) * g.u.x + (v[2] - g.a.z) * g.u.z; if (i > 0) t = Math.max(0, t); if (i < segs.length - 1) t = Math.min(g.L, t);
      const q = { x: g.a.x + g.u.x * t, z: g.a.z + g.u.z * t }, d = Math.hypot(v[0] - q.x, v[2] - q.z); if (!best || d < best.d) best = { d, s: g.s0 + t, off: (v[0] - q.x) * g.n.x + (v[2] - q.z) * g.n.z }; });
    return best; };
  return { L: acc, at, project };
}

// Tolerancias propuestas (mm), justificadas en docs/03-fidelidad.md.
const TOL = Object.freeze({
  exact: 1.0,        // misma geometría reexpresada: float32 + redondeo 1e-6 m + matriz de mundo
  envelope: 2.0,     // envolventes de mallas procedimentales que deben caber en la caja declarada
  area: 0.005,       // área relativa de suelo (0,5 %), cubre triangulación de polígonos cóncavos
});

function axisFrame(w, origin) { // marco del muro en el mundo (m)
  const a = { x: (w.start.x - origin.x) / 1000, z: (w.start.y - origin.y) / 1000 }, b = { x: (w.end.x - origin.x) / 1000, z: (w.end.y - origin.y) / 1000 };
  const L = Math.hypot(b.x - a.x, b.z - a.z), u = { x: (b.x - a.x) / L, z: (b.z - a.z) / L }, n = { x: -u.z, z: u.x };
  return { a, b, L, u, n };
}
const along = (f, v) => (v[0] - f.a.x) * f.u.x + (v[2] - f.a.z) * f.u.z;
const across = (f, v) => (v[0] - f.a.x) * f.n.x + (v[2] - f.a.z) * f.n.z;
const range = (vals) => vals.reduce((r, v) => [Math.min(r[0], v), Math.max(r[1], v)], [Infinity, -Infinity]);
const mm = v => Math.round(v * 1000 * 1000) / 1000; // m → mm con 3 decimales

function polygonArea(poly) { let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p.x * q.y - q.x * p.y; } return Math.abs(a) / 2; }
function triAreaXZ(m) { let a = 0; for (const [i, j, k] of m.faces) { const p = m.vertices[i], q = m.vertices[j], r = m.vertices[k]; a += Math.abs((q[0] - p[0]) * (r[2] - p[2]) - (r[0] - p[0]) * (q[2] - p[2])) / 2; } return a; }
function rayHits(meshes, o, d, maxT) { // Möller–Trumbore sobre todas las caras; devuelve el número de impactos en (0, maxT)
  let hits = 0;
  for (const m of meshes) for (const [i, j, k] of m.faces) {
    const v0 = m.vertices[i], v1 = m.vertices[j], v2 = m.vertices[k];
    const e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]], e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
    const p = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]], det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
    if (Math.abs(det) < 1e-12) continue; const inv = 1 / det, t0 = [o[0] - v0[0], o[1] - v0[1], o[2] - v0[2]];
    const u = (t0[0] * p[0] + t0[1] * p[1] + t0[2] * p[2]) * inv; if (u < 0 || u > 1) continue;
    const q = [t0[1] * e1[2] - t0[2] * e1[1], t0[2] * e1[0] - t0[0] * e1[2], t0[0] * e1[1] - t0[1] * e1[0]];
    const v = (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) * inv; if (v < 0 || u + v > 1) continue;
    const t = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) * inv; if (t > 1e-9 && t < maxT) hits++;
  }
  return hits;
}

/** Compara un proyecto canónico con una lista de mallas observadas (formato scene.json). */
function compare(project, scene, { origin, elevationM = 0, voids = [], coincident = null } = {}) {
  origin = origin || (scene.frame && scene.frame.originPlanMm);
  if (!origin) throw Error('Frame origin (plan mm) required');
  const by = new Map(); for (const m of scene.meshes) { const key = m.entity.role + ':' + m.entity.id; if (!by.has(key)) by.set(key, []); by.get(key).push(m); }
  const checks = [], add = (kind, id, metric, expected, observed, tol, extra = {}) => {
    const dev = observed === null || expected === null ? null : Math.abs(observed - expected);
    const cls = extra.class || 'contract';
    checks.push({ kind, id, metric, class: cls, expected, observed, deviation: dev === null ? null : Math.round(dev * 1000) / 1000, tolerance: tol, pass: dev !== null && dev <= tol, ...extra });
  };
  const defaultH = project.defaults && project.defaults.wallHeightMm;
  const heightOf = w => w.heightMm || defaultH;

  for (const w of project.walls) {
    const meshes = by.get('wall:' + w.id) || [];
    if (w.status === 'demolished') { add('wall', w.id, 'demolished-has-no-solid', 0, meshes.length, 0); continue; }
    if (!meshes.length) { add('wall', w.id, 'present', 1, 0, 0); continue; }
    if (shaped(w)) { // OP-07: grosor, trayectoria y altura por extremos contra el núcleo, faceta a faceta
      const P = pathFrame(w, origin), pts = meshes.flatMap(m => m.vertices).map(v => ({ v, q: P.project(v) }));
      const h0 = Walls.startHeight(w) / 1000, h1 = Walls.endHeight(w) / 1000, top = s => h0 + (h1 - h0) * Math.min(1, Math.max(0, s / P.L));
      const [o0, o1] = range(pts.map(x => x.q.off)), [s0, s1] = range(pts.map(x => x.q.s)), [y0, y1] = range(pts.map(x => x.v[1]));
      add('wall', w.id, 'thickness-mm', w.thicknessMm, mm(o1 - o0), TOL.exact, { note: 'OP-07: signed offset from the faceted centreline' });
      add('wall', w.id, 'axis-centred-mm', 0, mm((o0 + o1) / 2), TOL.exact);
      add('wall', w.id, 'path-length-mm', mm(P.L), mm(s1 - s0), w.thicknessMm + TOL.exact, { note: 'OP-07: along the faceted path (Core.WALL_PATH); may exceed it by up to the wall thickness (joints)' });
      add('wall', w.id, 'height-max-mm', Math.max(Walls.startHeight(w), Walls.endHeight(w)), mm(y1 - elevationM), TOL.exact);
      add('wall', w.id, 'top-follows-slope-mm', 0, mm(Math.max(0, ...pts.map(x => x.v[1] - elevationM - top(x.q.s)))), TOL.exact, { note: 'no vertex above the sloped top line' });
      for (const [end, s, h] of [['start', 0, h0], ['end', P.L, h1]]) { const near = pts.filter(x => Math.abs(x.q.s - s) <= 0.002);
        add('wall', w.id, `height-${end}-mm`, mm(h), near.length ? mm(Math.max(...near.map(x => x.v[1])) - elevationM) : null, TOL.exact); }
      add('wall', w.id, 'base-mm', 0, mm(y0 - elevationM), TOL.exact);
      continue;
    }
    const f = axisFrame(w, origin), verts = meshes.flatMap(m => m.vertices);
    const [s0, s1] = range(verts.map(v => along(f, v))), [n0, n1] = range(verts.map(v => across(f, v))), [y0, y1] = range(verts.map(v => v[1]));
    // El visor prolonga cada muro media anchura en sus extremos para cerrar las esquinas: se mide el exceso declarado.
    add('wall', w.id, 'thickness-mm', w.thicknessMm, mm(n1 - n0), TOL.exact);
    add('wall', w.id, 'axis-centred-mm', 0, mm((n0 + n1) / 2), TOL.exact);
    add('wall', w.id, 'height-mm', heightOf(w), mm(y1 - elevationM) , TOL.exact);
    // Base esperada: 0, salvo que huecos a ras de suelo cubran TODA la longitud (muro-dintel): entonces empieza sobre ellos.
    const floorOps = project.openings.filter(o => o.wallId === w.id && !o.sillHeightMm).sort((a, b) => a.offsetMm - b.offsetMm);
    let reach = 0; for (const o of floorOps) if (o.offsetMm <= reach + 0.5) reach = Math.max(reach, o.offsetMm + o.widthMm);
    const lintel = floorOps.length && reach >= f.L * 1000 - 0.001; // cobertura completa a 1 µm: una franja menor sigue dibujándose
    add('wall', w.id, 'base-mm', lintel ? Math.min(...floorOps.map(o => o.heightMm)) : 0, mm(y0 - elevationM), TOL.exact, lintel ? { note: 'lintel wall: floor-level openings cover its whole length' } : {});
    add('wall', w.id, 'length-mm', mm(f.L), mm(s1 - s0), w.thicknessMm + TOL.exact, { note: 'observed length may exceed the axis by up to the wall thickness (corner closure)' });
    add('wall', w.id, 'start-overhang-mm', 0, mm(Math.max(0, -s0)), w.thicknessMm / 2 + TOL.exact);
  }
  for (const r of project.rooms) {
    const meshes = (by.get('room:' + r.id) || []).concat(by.get('room-slab:' + r.id) || []), ring = Core.roomRing(project, r).points; // OP-07: anillo canónico
    // Huella del suelo = caras horizontales a la cota más alta de la estancia (un plano o la tapa de una plataforma, p. ej. poyete).
    const top = meshes.length ? Math.max(...meshes.flatMap(m => m.vertices.map(v => v[1]))) : null;
    const floor = meshes.map(m => ({ ...m, faces: m.faces.filter(f => f.every(i => Math.abs(m.vertices[i][1] - top) < 1e-6)) })).filter(m => m.faces.length);
    if (!floor.length) { add('room', r.id, 'floor-present', 1, 0, 0); continue; }
    if (top - elevationM > 0.002) add('room', r.id, 'raised-floor-mm', 0, mm(top - elevationM), Infinity, { class: 'visual', note: 'the viewer draws this room as a raised platform; not a project elevation' });
    // Huecos de forjado (escaleras) contenidos en la estancia: el suelo observado debe faltar exactamente ahí.
    const inside = v => v.polygon.every(q => { let c = false; for (let i = 0, j = r.polygon.length - 1; i < r.polygon.length; j = i++) { const a = r.polygon[i], b = r.polygon[j]; if ((a.y > q.y) !== (b.y > q.y) && q.x < (b.x - a.x) * (q.y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; });
    const roomVoids = voids.filter(inside), voidArea = roomVoids.reduce((s, v) => s + polygonArea(v.polygon), 0);
    const area = floor.reduce((s, m) => s + triAreaXZ(m), 0) * 1e6, expected = polygonArea(ring) - voidArea;
    add('room', r.id, 'floor-area-relative', 0, Math.round(Math.abs(area - expected) / expected * 1e6) / 1e6, TOL.area, { expectedMm2: Math.round(expected), observedMm2: Math.round(area), ...(roomVoids.length ? { slabVoids: roomVoids.map(v => v.id), voidAreaMm2: Math.round(voidArea) } : {}) });
    const xs = ring.map(p => (p.x - origin.x) / 1000), zs = ring.map(p => (p.y - origin.y) / 1000), verts = floor.flatMap(m => m.faces.flat().map(i => m.vertices[i]));
    const [ox0, ox1] = range(verts.map(v => v[0])), [oz0, oz1] = range(verts.map(v => v[2]));
    add('room', r.id, 'bounds-minX-mm', mm(Math.min(...xs)), mm(ox0), TOL.exact); add('room', r.id, 'bounds-maxX-mm', mm(Math.max(...xs)), mm(ox1), TOL.exact);
    add('room', r.id, 'bounds-minZ-mm', mm(Math.min(...zs)), mm(oz0), TOL.exact); add('room', r.id, 'bounds-maxZ-mm', mm(Math.max(...zs)), mm(oz1), TOL.exact);
  }
  const unlinked = scene.meshes.filter(m => m.entity.role === 'unlinked'), associated = new Map();
  for (const o of project.openings) {
    const w = project.walls.find(x => x.id === o.wallId); if (!w) continue;
    const f = axisFrame(w, origin), s = (o.offsetMm + o.widthMm / 2) / 1000, cy = elevationM + (o.sillHeightMm + o.heightMm / 2) / 1000;
    // OP-07: en un muro curvo el centro del hueco está sobre la trayectoria y el rayo sigue la normal de SU faceta.
    const PF = Walls.isCurved(w) ? pathFrame(w, origin) : null, F = PF ? PF.at(s) : null;
    const al = v => PF ? PF.project(v).s : along(f, v), ac = v => PF ? PF.project(v).off : across(f, v);
    const c = F ? [F.p.x, cy, F.p.z] : [f.a.x + f.u.x * s, cy, f.a.z + f.u.z * s], d = F ? [F.n.x, 0, F.n.z] : [f.n.x, 0, f.n.z], start = [c[0] - d[0] * 0.5, c[1], c[2] - d[2] * 0.5];
    const hits = rayHits(by.get('wall:' + w.id) || [], start, d, 1.0);
    add('opening', o.id, 'void-through-wall', 0, hits, 0, { kind: o.kind, note: 'ray through the opening centre, perpendicular to the wall, must not hit its wall' });
    if (w.status !== 'demolished' && ['window', 'door', 'sliding-door'].includes(o.kind)) { // C2: identidad canónica, no inferida
      const own = (by.get('opening:' + o.id) || []).concat(by.get('opening-leaf:' + o.id) || []);
      add('opening', o.id, 'identified-meshes', 1, own.length ? 1 : 0, 0, { kind: o.kind, meshes: own.length });
      const outside = own.filter(m => { const ctr = [0, 1, 2].map(a => (m.bounds.min[a] + m.bounds.max[a]) / 2), t = al(ctr), qd = ac(ctr);
        const reach = o.kind === 'door' ? o.widthMm / 1000 + 0.05 : 0.05; // la hoja abierta gira fuera del muro hasta su anchura
        return !(t >= o.offsetMm / 1000 - 0.05 - (o.kind === 'door' ? o.widthMm / 1000 : 0) && t <= (o.offsetMm + o.widthMm) / 1000 + 0.05 + (o.kind === 'door' ? o.widthMm / 1000 : 0) && Math.abs(qd) <= w.thicknessMm / 2000 + reach && ctr[1] >= elevationM - 0.05 && ctr[1] <= elevationM + (o.sillHeightMm + o.heightMm) / 1000 + 0.05); });
      if (own.length) add('opening', o.id, 'identified-meshes-inside-opening', 0, outside.length, 0, { outside: outside.slice(0, 3).map(m => m.name) });
    }
    // Asociación espacial declarada: mallas sin ID cuyo centro cae dentro del volumen del hueco (± espesor + 5 cm).
    for (const m of unlinked) {
      const ctr = [0, 1, 2].map(a => (m.bounds.min[a] + m.bounds.max[a]) / 2), t = al(ctr), q = ac(ctr);
      const inside = t >= o.offsetMm / 1000 - 0.05 && t <= (o.offsetMm + o.widthMm) / 1000 + 0.05 && Math.abs(q) <= w.thicknessMm / 2000 + 0.05 &&
        ctr[1] >= elevationM + o.sillHeightMm / 1000 - 0.05 && ctr[1] <= elevationM + (o.sillHeightMm + o.heightMm) / 1000 + 0.05;
      if (inside && !associated.has(m.name)) associated.set(m.name, { opening: o.id, method: 'inferred-spatial', material: m.material.kind });
    }
  }
  for (const ob of project.objects) {
    const meshes = by.get('object:' + ob.id) || [];
    if (!meshes.length) { add('object', ob.id, 'present', 1, 0, 0); continue; }
    const a = -(ob.rotationDeg || 0) * Math.PI / 180, cx = (ob.position.x - origin.x) / 1000, cz = (ob.position.y - origin.y) / 1000;
    // Ejes locales del objeto en el mundo: giro horario del plano → giro de -rotationDeg alrededor de Y.
    const ux = { x: Math.cos(a), z: -Math.sin(a) }, uz = { x: Math.sin(a), z: Math.cos(a) }, verts = meshes.flatMap(m => m.vertices);
    const lx = range(verts.map(v => (v[0] - cx) * ux.x + (v[2] - cz) * ux.z)), lz = range(verts.map(v => (v[0] - cx) * uz.x + (v[2] - cz) * uz.z)), ly = range(verts.map(v => v[1]));
    const W = ob.size.widthMm, D = ob.size.depthMm, elev = (ob.elevationMm || 0);
    add('object', ob.id, 'within-width-envelope-mm', 0, Math.max(0, mm(lx[1] - lx[0]) - W), TOL.envelope, { class: 'visual', observedWidthMm: mm(lx[1] - lx[0]), declaredWidthMm: W });
    add('object', ob.id, 'within-depth-envelope-mm', 0, Math.max(0, mm(lz[1] - lz[0]) - D), TOL.envelope, { class: 'visual', observedDepthMm: mm(lz[1] - lz[0]), declaredDepthMm: D });
    add('object', ob.id, 'centre-offset-x-mm', 0, Math.abs(mm((lx[0] + lx[1]) / 2)), W / 2, { note: 'procedural detail may be off-centre inside its box; bounded by half the declared size' });
    add('object', ob.id, 'centre-offset-z-mm', 0, Math.abs(mm((lz[0] + lz[1]) / 2)), D / 2);
    add('object', ob.id, 'base-elevation-mm', elev, mm(ly[0] - elevationM), Math.max(TOL.envelope, 5), { class: 'visual', note: 'the viewer places some types by rule (counter-top, wall-hung, bay seat); the project carries no elevation for them' });
    if (ob.size.heightMm) add('object', ob.id, 'within-height-envelope-mm', 0, Math.max(0, mm(ly[1] - ly[0]) - ob.size.heightMm), TOL.envelope, { class: 'visual', observedHeightMm: mm(ly[1] - ly[0]) });
  }
  // R02-A · elementos de techo: centro en planta y cota superior = altura libre de referencia − descuelgue.
  const r02 = project.extensions && project.extensions['x-r02a-ceiling'];
  if (r02) {
    const clear = ((r02.verticalReferences || []).find(v => v.scope === 'project') || {}).clearHeightMm;
    for (const it of r02.items || []) {
      const ms = by.get('ceiling-element:' + it.id) || [];
      if (!ms.length) { add('ceiling-element', it.id, 'present', 1, 0, 0); continue; }
      const vs = ms.flatMap(m => m.vertices), [x0, x1] = range(vs.map(v => v[0])), [z0, z1] = range(vs.map(v => v[2])), [, y1] = range(vs.map(v => v[1]));
      add('ceiling-element', it.id, 'centre-x-mm', mm((it.position.x - origin.x) / 1000), mm((x0 + x1) / 2), TOL.exact);
      add('ceiling-element', it.id, 'centre-z-mm', mm((it.position.y - origin.y) / 1000), mm((z0 + z1) / 2), TOL.exact);
      if (clear) add('ceiling-element', it.id, 'top-mm', clear - (it.dropMm || 0), mm(y1 - elevationM), TOL.exact);
    }
  }
  // C2/C3 · escena entera: ninguna malla sin identidad y ninguna cara coincidente visible (si se pasa el detector)
  add('scene', 'all', 'unlinked-meshes', 0, unlinked.length, 0, { note: 'every mesh carries a canonical id (C2)' });
  if (coincident) add('scene', 'all', 'visible-coincident-faces', 0, coincident.defects.length, 0, { note: 'same-facing coplanar faces with different materials on visible surfaces (C3)', first: coincident.defects.slice(0, 3) });
  const failed = checks.filter(c => !c.pass && c.class === 'contract'), visual = checks.filter(c => !c.pass && c.class === 'visual');
  const unlinkedSummary = { total: unlinked.length, associatedToOpenings: associated.size, stillUnlinked: unlinked.filter(m => !associated.has(m.name)).map(m => ({ name: m.name, material: m.material.kind, color: m.material.color, bounds: m.bounds })) };
  return { format: 'rubik-sota.scene-fidelity', version: '1.0.0', tolerancesMm: TOL, origin, checks: checks.length, contractChecks: checks.filter(c => c.class === 'contract').length, failed: failed.length, failures: failed, visualDifferences: visual.length, visualByType: visualByType(visual, project), byKind: summarise(checks), associations: [...associated.entries()].map(([mesh, v]) => ({ mesh, ...v })), unlinked: unlinkedSummary };
}
function visualByType(visual, project) {
  const types = new Map(project.objects.map(o => [o.id, o.type])), out = {};
  for (const c of visual) { const k = (c.kind === 'object' ? types.get(c.id) : c.kind) + ' · ' + c.metric; const e = out[k] || (out[k] = { n: 0, maxMm: 0 }); e.n++; e.maxMm = Math.max(e.maxMm, c.deviation); }
  return out;
}
function summarise(checks) {
  const out = {}; for (const c of checks) { const k = c.class + ' · ' + c.kind + '/' + c.metric; const s = out[k] || (out[k] = { n: 0, pass: 0, maxDeviation: 0 }); s.n++; if (c.pass) s.pass++; if (c.deviation !== null) s.maxDeviation = Math.max(s.maxDeviation, c.deviation); }
  return out;
}
module.exports = { compare, TOL, rayHits, polygonArea };
if (require.main === module) {
  const [p, s] = process.argv.slice(2); if (!p || !s) { console.error('Uso: node scene-fidelity.cjs project.json scene.json'); process.exit(1); }
  const scene = JSON.parse(fs.readFileSync(s, 'utf8')), coincident = scene.meshes[0] && scene.meshes[0].material ? require('../../js/scene-capture-core.js').coincidentFaces(scene) : null;
  const r = compare(JSON.parse(fs.readFileSync(p, 'utf8')), scene, { coincident });
  console.log(JSON.stringify(r, null, 1)); if (r.failed) process.exitCode = 2;
}

/** Edificio apilado: cada planta se compara en su propio marco (desplazamiento en planta y cota relativa a la activa). */
function compareBuilding(building, scene, { activeLevelId } = {}) {
  const active = building.levels.find(l => l.id === activeLevelId) || building.levels[0];
  const Core = require('../../js/project-core.js'), origin = scene.frame.originPlanMm, levels = [];
  for (const l of building.levels) {
    const off = l.offsetMm || { x: 0, y: 0 }, aoff = active.offsetMm || { x: 0, y: 0 };
    // El visor fija el origen en el centro de la planta activa; otra planta se desplaza por la diferencia de offsets.
    const o = { x: origin.x - (off.x - aoff.x), y: origin.y - (off.y - aoff.y) }, elevationM = ((l.elevationMm || 0) - (active.elevationMm || 0)) / 1000;
    const present = scene.meshes.some(m => l.project.walls.some(w => m.entity.id === w.id));
    // Huecos de escalera en el forjado de la planta de llegada, en coordenadas de esa planta.
    const voids = (building.stairs || []).filter(st => st.toLevelId === l.id).map(st => {
      const from = building.levels.find(x => x.id === st.fromLevelId), fo = from.offsetMm || { x: 0, y: 0 }, a = (st.rotationDeg || 0) * Math.PI / 180;
      const u = { x: Math.cos(a), y: Math.sin(a) }, n = { x: -u.y, y: u.x }, s0 = { x: st.startMm.x + fo.x - off.x, y: st.startMm.y + fo.y - off.y }, hw = st.widthMm / 2;
      const P = (t, k) => ({ x: s0.x + u.x * t + n.x * k, y: s0.y + u.y * t + n.y * k });
      return { id: st.id, polygon: [P(0, -hw), P(st.runLengthMm, -hw), P(st.runLengthMm, hw), P(0, hw)] };
    });
    levels.push({ level: l.id, elevationM, offsetMm: off, present, voids: voids.map(v => v.id), report: present ? compare(l.project, scene, { origin: o, elevationM, voids }) : null });
  }
  const stairs = (building.stairs || []).map(st => {
    const steps = scene.meshes.filter(m => m.entity.role === 'stair' && m.entity.id === st.id), top = steps.length ? Math.max(...steps.flatMap(m => m.vertices.map(v => v[1]))) : null;
    const to = building.levels.find(l => l.id === st.toLevelId), from = building.levels.find(l => l.id === st.fromLevelId);
    const rise = ((to.elevationMm || 0) - (from.elevationMm || 0)) / 1000, base = ((from.elevationMm || 0) - (active.elevationMm || 0)) / 1000;
    return { id: st.id, risers: st.risers, meshes: steps.length, observedTopM: top, expectedTopM: base + rise, topDeviationMm: top === null ? null : Math.round(Math.abs(top - (base + rise)) * 1e6) / 1000 };
  });
  return { format: 'rubik-sota.scene-fidelity-building', levels: levels.map(l => ({ level: l.level, elevationM: l.elevationM, offsetMm: l.offsetMm, present: l.present, contractChecks: l.report && l.report.contractChecks, failed: l.report && l.report.failed, failures: l.report && l.report.failures.slice(0, 10), visualDifferences: l.report && l.report.visualDifferences })), stairs };
}
module.exports.compareBuilding = compareBuilding;
