/* Exterior V1: a read-only view of project walls, openings and declared rooms. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FloorPlanExterior = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function inside(poly, x, y) {
    let hit = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) hit = !hit;
    }
    return hit;
  }
  function derive(project) {
    const indoor = (project.rooms || []).filter(r => Array.isArray(r.polygon) && r.polygon.length >= 3 && !['terrace', 'balcony'].includes(r.family));
    const outdoor = (project.rooms || []).filter(r => ['terrace', 'balcony'].includes(r.family) && Array.isArray(r.polygon) && r.polygon.length >= 3);
    const occupied = (rooms, x, y) => rooms.some(r => inside(r.polygon, x, y));
    const walls = [], openings = [];
    for (const wall of project.walls || []) {
      if (wall.status === 'demolished') continue;
      const dx = wall.end.x - wall.start.x, dy = wall.end.y - wall.start.y, len = Math.hypot(dx, dy);
      if (!(len > 0)) { walls.push({wallId:wall.id,status:'unavailable',reason:'invalid-wall'}); continue; }
      const nx = -dy / len, ny = dx / len, distance = wall.thicknessMm / 2 + 50;
      const samples = [0.2, 0.5, 0.8].map(t => {
        const x = wall.start.x + dx * t, y = wall.start.y + dy * t;
        return [occupied(indoor, x + nx * distance, y + ny * distance), occupied(indoor, x - nx * distance, y - ny * distance)];
      });
      const both = samples.every(s => s[0] && s[1]);
      const one = samples.every(s => s[0] && !s[1]) || samples.every(s => !s[0] && s[1]);
      // A declared partition/low wall cannot be promoted to facade by an incomplete room drawing.
      const veto = wall.structure === 'partition' || wall.structure === 'low';
      const result = {wallId:wall.id,status:both||veto?'interior':one?'facade':'unavailable',reason:both||veto||one?null:'insufficient-room-geometry',materialId:wall.surfaceMaterialId || null};
      walls.push(result);
      if (one) for (const opening of project.openings || []) if (opening.wallId === wall.id) openings.push({openingId:opening.id,wallId:wall.id,kind:opening.kind});
    }
    return {walls,openings,exteriorRooms:outdoor.map(r=>({roomId:r.id,kind:r.family,materialId:r.floorMaterialId})),status:walls.some(w=>w.status==='unavailable')?'partial':'available'};
  }
  return {derive};
});
