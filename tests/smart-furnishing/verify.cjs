'use strict';
/* Comprobador INDEPENDIENTE de posiciones finales (no usa furniture-placement ni el núcleo de amueblamiento).
   Muestrea cada huella nueva cada 20 mm (retranqueada 3 mm) y exige: dentro del polígono de su estancia; fuera de
   todo muro activo (rectángulo calculado aquí desde inicio, fin y grosor); fuera del cuarto de círculo que barre la
   hoja de cada puerta con apertura registrada; fuera de cualquier otro mueble que bloquea (alfombras y aparatos de
   pared no bloquean). Devuelve la lista de violaciones (vacía = correcto). */
const SAMPLE = 20, INSET = 3;
function corners(o) {
  const a = o.rotationDeg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), hw = o.size.widthMm / 2, hd = o.size.depthMm / 2;
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, y]) => ({ x: o.position.x + x * c - y * s, y: o.position.y + x * s + y * c }));
}
function samples(o) {
  const a = o.rotationDeg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), hw = o.size.widthMm / 2 - INSET, hd = o.size.depthMm / 2 - INSET, out = [];
  const nx = Math.max(1, Math.ceil(2 * hw / SAMPLE)), ny = Math.max(1, Math.ceil(2 * hd / SAMPLE));
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) { const x = -hw + 2 * hw * i / nx, y = -hd + 2 * hd * j / ny; out.push({ x: o.position.x + x * c - y * s, y: o.position.y + x * s + y * c }); }
  return out;
}
function inside(p, poly) { let r = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) r = !r; } return r; }
function wallPoly(w) {
  const L = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y), u = { x: (w.end.x - w.start.x) / L, y: (w.end.y - w.start.y) / L }, n = { x: -u.y, y: u.x }, t = w.thicknessMm / 2;
  return [{ x: w.start.x + n.x * t, y: w.start.y + n.y * t }, { x: w.end.x + n.x * t, y: w.end.y + n.y * t }, { x: w.end.x - n.x * t, y: w.end.y - n.y * t }, { x: w.start.x - n.x * t, y: w.start.y - n.y * t }];
}
const NON_BLOCKING = new Set(['rug', 'acwall']);
// doors: [{h:[x,y], c:[x,y], o:[x,y], len}] (geometría de puertas con apertura registrada, la misma que dibuja el editor).
function verify(project, newIds, doors = []) {
  const v = [], ids = new Set(newIds), objects = project.objects;
  const walls = project.walls.filter(w => w.status !== 'demolished').map(wallPoly);
  for (const id of newIds) {
    const o = objects.find(x => x.id === id); if (!o) { v.push(`${id}: no está en el proyecto`); continue; }
    if (![o.position.x, o.position.y, o.rotationDeg, o.size.widthMm, o.size.depthMm].every(Number.isInteger) || o.size.widthMm <= 0 || o.size.depthMm <= 0) { v.push(`${id}: datos no enteros o no positivos`); continue; }
    const room = project.rooms.find(r => r.id === o.roomId); if (!room) { v.push(`${id}: sin estancia`); continue; }
    const S = samples(o);
    if (S.some(p => !inside(p, room.polygon))) v.push(`${id} (${o.type}): sale de su estancia`);
    if (S.some(p => walls.some(W => inside(p, W)))) v.push(`${id} (${o.type}): atraviesa un muro`);
    if (!NON_BLOCKING.has(o.type)) {
      for (const d of doors) {
        const hit = S.some(p => { const dx = p.x - d.h[0], dy = p.y - d.h[1]; return Math.hypot(dx, dy) < d.len - 1 && dx * d.c[0] + dy * d.c[1] > 1 && dx * d.o[0] + dy * d.o[1] > 1; });
        if (hit) v.push(`${id} (${o.type}): invade el barrido de una puerta`);
      }
      for (const other of objects) {
        if (other.id === id || NON_BLOCKING.has(other.type)) continue;
        if (ids.has(other.id) && other.id < id) continue; // cada par de nuevos una sola vez
        const P = corners(other); if (S.some(p => inside(p, P))) v.push(`${id} (${o.type}) solapa ${other.id} (${other.type})`);
      }
    }
  }
  return v;
}
module.exports = { verify, corners, samples, inside, wallPoly };
