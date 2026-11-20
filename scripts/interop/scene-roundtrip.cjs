'use strict';
/* OP-10 · C ↔ B: la escena abierta en Blender (importador glTF nativo), devuelta al marco Y arriba, debe ser la observada.
 * Independiente del orden: el importador puede reordenar vértices. Por malla: mismo nº de vértices y caras, misma identidad,
 * y cada triángulo de B tiene su pareja en C con el mismo sentido de giro; se mide la desviación máxima por vértice.
 * Tolerancia: 1 µm (0,001 mm), la del laboratorio. Uso: node scene-roundtrip.cjs scene.json blender-geometry.json */
const fs = require('node:fs');
function roundtrip(b, c, tolM = 1e-6) {
  const byName = new Map(c.meshes.map(m => [m.name, m])), issues = [];
  let maxDev = 0, vertices = 0, faces = 0;
  // Emparejamiento por vecino más cercano en una rejilla de 0,1 mm (celdas contiguas incluidas: un valor en el borde de una
  // celda puede caer en la de al lado por float32). Cada vértice de B se asigna al de C más cercano; las caras se comparan
  // por la POSICIÓN del vértice de C emparejado (vértices duplicados en una esquina son equivalentes), con el mismo giro.
  const CELL = 1e-4, cell = v => v.map(x => Math.floor(x / CELL)), rot = f => { const r = f.indexOf([...f].sort()[0]); return [f[r], f[(r + 1) % 3], f[(r + 2) % 3]].join('|'); };
  for (const m of b.meshes) {
    const n = byName.get(m.name);
    if (!n) { issues.push({ mesh: m.name, issue: 'missing in Blender' }); continue; }
    if ((n.entity.id || null) !== (m.entity.id || null) || n.entity.role !== m.entity.role) issues.push({ mesh: m.name, issue: 'entity changed', from: m.entity, to: n.entity });
    if ((n.level || null) !== (m.level || null)) issues.push({ mesh: m.name, issue: 'level changed' });
    if (n.vertices.length !== m.vertices.length || n.faces.length !== m.faces.length) { issues.push({ mesh: m.name, issue: 'count', b: [m.vertices.length, m.faces.length], c: [n.vertices.length, n.faces.length] }); continue; }
    const grid = new Map(); n.vertices.forEach((v, i) => { const k = cell(v).join(','); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
    const map = new Array(m.vertices.length); let lost = 0;
    m.vertices.forEach((v, i) => { const [x, y, z] = cell(v); let best = Infinity, at = -1;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) for (const j of grid.get([x + dx, y + dy, z + dz].join(',')) || []) {
        const w = n.vertices[j], d = Math.max(Math.abs(v[0] - w[0]), Math.abs(v[1] - w[1]), Math.abs(v[2] - w[2])); if (d < best) { best = d; at = j; } }
      if (at < 0) lost++; else { map[i] = n.vertices[at].join(','); if (best > maxDev) maxDev = best; } });
    if (lost) { issues.push({ mesh: m.name, issue: 'vertices without a counterpart', lost }); continue; }
    const pool = new Map(); n.faces.forEach(f => { const k = rot(f.map(j => n.vertices[j].join(','))); pool.set(k, (pool.get(k) || 0) + 1); });
    let unmatched = 0; for (const f of m.faces) { const k = rot(f.map(i => map[i])), left = pool.get(k); if (left) pool.set(k, left - 1); else unmatched++; }
    if (unmatched) issues.push({ mesh: m.name, issue: 'triangles without a counterpart (geometry or winding changed)', unmatched });
    vertices += m.vertices.length; faces += m.faces.length;
  }
  const names = new Set(b.meshes.map(m => m.name)); for (const n of c.meshes) if (!names.has(n.name)) issues.push({ mesh: n.name, issue: 'extra in Blender' });
  if (maxDev > tolM + 1e-12) issues.push // ≤ 1 µm inclusivo; 1e-12 m solo absorbe la representación binaria de 1e-6
   ({ issue: 'vertex deviation above tolerance', maxDeviationM: maxDev });
  return { format: 'rubik-sota.scene-roundtrip', meshes: b.meshes.length, vertices, faces, maxVertexDeviationMm: Math.round(maxDev * 1e6) / 1e3, toleranceMm: tolM * 1000, issues: issues.slice(0, 50), issueCount: issues.length, pass: !issues.length };
}
module.exports = { roundtrip };
if (require.main === module) {
  const [b, c] = process.argv.slice(2); const r = roundtrip(JSON.parse(fs.readFileSync(b, 'utf8')), JSON.parse(fs.readFileSync(c, 'utf8')));
  console.log(JSON.stringify(r, null, 1)); if (!r.pass) process.exitCode = 2;
}
