'use strict';
// SCULPT OP-10 · C ↔ B: la escena abierta en Blender, devuelta al marco Y-up, debe ser la observada vértice a vértice.
// Uso: node roundtrip.cjs scene.json blender-geometry.json  → informe JSON (código 2 si hay diferencias)
const fs = require('node:fs');
function roundtrip(b, c, tolM = 1e-6) {
  const byName = new Map(c.meshes.map(m => [m.name, m])), issues = [];
  let maxDev = 0, vertices = 0, faces = 0;
  for (const m of b.meshes) {
    const n = byName.get(m.name);
    if (!n) { issues.push({ mesh: m.name, issue: 'missing in Blender' }); continue; }
    if (n.entity.id !== m.entity.id || n.entity.role !== m.entity.role) issues.push({ mesh: m.name, issue: 'entity changed', from: m.entity, to: n.entity });
    if ((n.level || null) !== (m.level || null)) issues.push({ mesh: m.name, issue: 'level changed' });
    if (n.vertices.length !== m.vertices.length || n.faces.length !== m.faces.length) { issues.push({ mesh: m.name, issue: 'count', b: [m.vertices.length, m.faces.length], c: [n.vertices.length, n.faces.length] }); continue; }
    for (let i = 0; i < m.vertices.length; i++) for (let a = 0; a < 3; a++) { const d = Math.abs(m.vertices[i][a] - n.vertices[i][a]); if (d > maxDev) maxDev = d; }
    for (let i = 0; i < m.faces.length; i++) if (m.faces[i].join() !== n.faces[i].join()) { issues.push({ mesh: m.name, issue: 'face order/winding changed', face: i }); break; }
    vertices += m.vertices.length; faces += m.faces.length;
  }
  for (const n of c.meshes) if (!b.meshes.some(m => m.name === n.name)) issues.push({ mesh: n.name, issue: 'extra in Blender' });
  if (maxDev > tolM) issues.push({ issue: 'vertex deviation above tolerance', maxDeviationM: maxDev });
  return { format: 'rubik-sota.op10-roundtrip', meshes: b.meshes.length, vertices, faces, maxVertexDeviationMm: Math.round(maxDev * 1e6) / 1e3, toleranceMm: tolM * 1000, issues, pass: !issues.length };
}
module.exports = { roundtrip };
if (require.main === module) {
  const [b, c] = process.argv.slice(2); const r = roundtrip(JSON.parse(fs.readFileSync(b, 'utf8')), JSON.parse(fs.readFileSync(c, 'utf8')));
  console.log(JSON.stringify(r, null, 1)); if (!r.pass) process.exitCode = 2;
}
