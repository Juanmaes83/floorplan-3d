/* SCULPT-R03 · A3 3D geometry (pure). Every board, rail, drawer and door of a parametric cabinet as an axis-aligned box
 * in millimetres, in RUBIK's furniture frame: x along the width (centre 0), y up from the cabinet's base, z along the
 * depth with the FRONT at +d/2 (the same frame buildFurniture uses in index.html: plan y → z, rotation.y = −rotationDeg,
 * elevationMm = base height). Generalised from the donor's cabinet-model.js (MIT, see js/r03-cabinet-core.js header):
 * the same millimetre arithmetic, but as data, without three.js, so plan, elevation and 3D can be compared in tests.
 * Doors: a 'closed' leaf lies on the front; an 'open' leaf is turned 90° about its hinge (the donor's pivot at the
 * front face minus one board); 'hidden' draws none. Drawers are pulled out by their travel only when the doors are open.
 * No ceiling is derived here: verticalCheck only compares against a reference the caller states (H4). NOT loaded by index.html. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && typeof require === 'function';
  const K = node ? require('./r03-cabinet-core.js') : root.RubikCabinetCore;
  const DRAWER_TOP_CLEARANCE = 40; // donor: drawer box height = drawerHeight − 40 (K.drawerSize); never a measured slide

  function parts(outer, c) {
    const out = [], t = c.thickness, w = outer.w, d = outer.d;
    const bottom = c.plinth + t, innerH = c.height - c.plinth - 2 * t, depth = d - c.back - c.frontGap;
    const backZ = -d / 2 + c.back, midZ = backZ + depth / 2;
    // box: centre x/z, base y; sizes w (x) h (y) d (z)
    const B = (role, x, y, z, bw, bh, bd, extra) => out.push({ role, x, y, z, w: bw, h: bh, d: bd, ...(extra || {}) });
    B('plinth', 0, 0, -20, w - 2 * t, c.plinth, Math.max(20, d - 60));
    B('side', -w / 2 + t / 2, c.plinth, 0, t, c.height - c.plinth, d, { side: 'left' });
    B('side', w / 2 - t / 2, c.plinth, 0, t, c.height - c.plinth, d, { side: 'right' });
    B('base', 0, c.plinth, 0, w - 2 * t, t, d);
    B('top', 0, c.height - t, 0, w - 2 * t, t, d);
    B('back', 0, bottom, -d / 2 + c.back / 2, w - 2 * t, innerH, c.back);
    const open = c.front === 'open';
    for (const b of K.bays(outer, c)) {
      const cx = b.x + b.width / 2;
      if (b.index < c.columns.length - 1) B('divider', b.x + b.width + t / 2, bottom, midZ, t, innerH, depth, { bay: b.index });
      b.shelves.forEach((y, i) => B('shelf', cx, bottom + y, midZ, b.width, t, depth, { bay: b.index, shelf: i }));
      if (b.rod !== null) B('rod', cx, bottom + b.rod - 10, midZ, b.width - 20, 20, 20, { bay: b.index, radiusMm: 10 });
      const size = K.drawerSize(outer, c, b);
      for (let i = 0; i < b.drawers; i++) {
        const y = bottom + i * b.drawerHeight, h = b.drawerHeight - DRAWER_TOP_CLEARANCE, dw = size.outerWidth, dd = size.outerDepth;
        const z = backZ + dd / 2 + (open ? size.travel : 0), meta = { bay: b.index, drawer: i, pulledMm: open ? size.travel : 0 };
        B('drawer-box', cx, y, z, dw, h, dd, meta);
        B('drawer-front', cx, y + 3, z + dd / 2 + 9, b.width - 6, b.drawerHeight - 6, 18, meta);
        B('handle', cx, y + b.drawerHeight * 0.6, z + dd / 2 + 19, Math.min(160, b.width * 0.4), 8, 2, meta);
      }
    }
    if (c.front !== 'hidden') for (const f of K.fronts(outer, c)) {
      const hingeX = f.x + (f.right ? f.width : 0), hingeZ = d / 2 - 18, leaf = f.width - 5, sign = f.right ? -1 : 1;
      // The leaf in its own pivot frame (x from the hinge towards the free edge, z outwards), then turned when open.
      const door = { role: 'door', door: f.index, hinge: f.right ? 'right' : 'left', pivot: { x: hingeX, z: hingeZ, angleDeg: open ? sign * -90 : 0 },
        local: { x: sign * f.width / 2, y: bottom + 2, z: 9, w: leaf, h: innerH - 4, d: 18 } };
      const a = door.pivot.angleDeg * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
      // three.js rotation about +y: (x, z) → (x cos + z sin, −x sin + z cos)
      const rx = door.local.x * cos + door.local.z * sin, rz = -door.local.x * sin + door.local.z * cos;
      const wide = Math.abs(door.local.w * cos) + Math.abs(door.local.d * sin), deep = Math.abs(door.local.w * sin) + Math.abs(door.local.d * cos);
      out.push({ ...door, x: hingeX + rx, y: door.local.y, z: hingeZ + rz, w: wide, h: door.local.h, d: deep });
    }
    return out;
  }
  // Axis-aligned bounds of a part list (mm, cabinet frame).
  function bounds(list) {
    const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
    for (const p of list) {
      b.minX = Math.min(b.minX, p.x - p.w / 2); b.maxX = Math.max(b.maxX, p.x + p.w / 2);
      b.minY = Math.min(b.minY, p.y); b.maxY = Math.max(b.maxY, p.y + p.h);
      b.minZ = Math.min(b.minZ, p.z - p.d / 2); b.maxZ = Math.max(b.maxZ, p.z + p.d / 2);
    }
    return b;
  }
  /* The vertical reference, with R02-A's shape (labs CeilingLayoutEvidenceV1.vertical): {clearHeightMm, reference, source}.
     unknown without one; pending when it has no stated source or is measured from the structural floor; never a default. */
  function verticalCheck(object, cabinet, vertical) {
    const elevation = object.elevationMm === undefined ? 0 : object.elevationMm;
    const topMm = elevation + cabinet.height;
    if (vertical == null) return { status: 'unknown', topMm, message: `Sin referencia vertical confirmada: el armario llega a ${topMm} mm desde el suelo y no se comprueba contra el techo.` };
    const v = vertical, ok = Number.isInteger(v.clearHeightMm) && v.clearHeightMm > 0 && v.clearHeightMm <= 20000;
    if (!ok || (v.reference !== 'finished-floor' && v.reference !== 'level-floor')) return { status: 'invalid', topMm, message: 'La referencia vertical no es válida.' };
    if (typeof v.source !== 'string' || !v.source.trim()) return { status: 'pending', topMm, message: 'La referencia vertical no indica de dónde procede: no se usa para comprobar.' };
    if (v.reference !== 'finished-floor') return { status: 'pending', topMm, message: 'La altura está medida desde el forjado; falta el acabado del suelo para comparar.' };
    const marginMm = v.clearHeightMm - topMm;
    return { status: marginMm >= 0 ? 'fits' : 'does-not-fit', topMm, marginMm, message: marginMm >= 0 ? `Cabe: quedan ${marginMm} mm hasta la referencia (${v.source}).` : `No cabe: sobrepasa la referencia en ${-marginMm} mm (${v.source}).` };
  }
  // Plan footprint of the closed carcass, rotated like the RUBIK object (for plan ↔ 3D coherence checks).
  function footprint(object, outer) {
    return K.toPlan(object, [{ x: -outer.w / 2, y: -outer.d / 2 }, { x: outer.w / 2, y: -outer.d / 2 }, { x: outer.w / 2, y: outer.d / 2 }, { x: -outer.w / 2, y: outer.d / 2 }]);
  }
  const api = { DRAWER_TOP_CLEARANCE, parts, bounds, verticalCheck, footprint };
  if (node && module.exports) module.exports = api; else root.RubikCabinetGeometry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
