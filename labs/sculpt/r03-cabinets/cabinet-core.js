/* SCULPT-R03 · sculpted cabinet engine (lab only, not part of the RUBIK product).
 *
 * Derived from design.js of caikaidev/floorplan-3d @2495d8e0bf7d3846d2da827121c15e3e83d752bd (author kai cai, submitted
 * as wy51ai/floorplan-3d#11), which builds on wy51ai/floorplan-3d (MIT, Copyright (c) 2026 wuyi). Rights basis: MIT of the
 * upstream + GitHub Terms of Service D.6 for the contribution; see PROVENANCE.md and workshop/LICENSE-donor-MIT.txt.
 *
 * KEEP: the donor's millimetre model and arithmetic (cavity, bays, openings, drawer sizes, fronts, hinge/drawer conflicts,
 *       presets and validation limits) are reproduced exactly; tests/sculpt-r03-cabinets.test.cjs proves parity against the
 *       verbatim donor file on fixed and seeded random inputs.
 * Sculpted (each change answers an audited hypothesis, reproduced in the tests):
 *  - H1 pure: no function mutates its inputs; resize/setBayWidth/split/merge return {ok, cabinet} or {ok:false, issues}.
 *  - validation collects EVERY issue with a stable code (the donor throws on the first one; its first message is kept).
 *  - H2 door swing: the full 90° sector swept by each leaf and RUBIK's own convention (the square swept by the leaf,
 *       as FloorPlanPlacement does for room doors) are produced next to the donor's open-door slab.
 *  - H3 every default carries its provenance (`ASSUMED`): none of them is a measured board, hinge or slide.
 *  - H4 no ceiling height lives here: the caller must pass a verified vertical reference or the check stays unknown.
 *  - elevation primitives without DOM (generalised from cabinet-editor.js cabinetElevation).
 * Units: mm. Cabinet local frame: x along the width (centre 0), y along the depth with the FRONT at +d/2, plan rotation
 * clockwise with y down (same as FloorPlanTracing.footprint and the donor's localRect). Elevation: y up from the floor. */
(function (root) {
  'use strict';
  const TYPES = Object.freeze(['wardrobe', 'tallcab', 'cabinet', 'shoecab']);
  const KINDS = Object.freeze(['long', 'short', 'shelves', 'drawers']);
  const FRONT_STATES = Object.freeze(['closed', 'hidden', 'open']);
  const LIMITS = Object.freeze({ bays: [1, 8], height: [400, 4000], thickness: [12, 30], back: [5, 25], frontGap: [18, 80], plinth: [0, 250],
    doors: [1, 12], bayMinWidth: 150, cavityMinHeight: 250, cavityMinDepth: 180, drawers: [0, 6], drawerHeight: [80, 400], shelvesMax: 12,
    boardGapMm: 60, drawerHeadroomMm: 80, rodAboveDrawersMm: 100, rodBelowTopMm: 50, rodShelfGapMm: 30, widthToleranceMm: 0.1, hingeMarginMm: 30 });
  const DONOR = 'donor default @2495d8e (not measured)';
  // H3: the donor's defaults, named. Nothing here is a manufacturer value or a site measurement.
  const ASSUMED = Object.freeze({
    heightByTypeMm: Object.freeze({ value: { tallcab: 2395, wardrobe: 2200, shoecab: 1000, cabinet: 850 }, source: DONOR }),
    boardThicknessMm: Object.freeze({ value: 18, source: DONOR }),
    backPanelMm: Object.freeze({ value: 9, source: DONOR }),
    frontAllowanceMm: Object.freeze({ value: 20, source: DONOR + '; doors and hardware allowance' }),
    plinthMm: Object.freeze({ value: 80, source: DONOR }),
    bayTargetWidthMm: Object.freeze({ value: 600, source: DONOR + '; number of bays = floor(width / 600), 1..6' }),
    doorTargetWidthMm: Object.freeze({ value: { shoecab: 450, other: 500 }, source: DONOR + '; number of doors = round(width / target), 1..12' }),
    drawerAllowancesMm: Object.freeze({ value: { slidePerSide: 13, side: 12, front: 18, back: 9, bottom: 12, topClearance: 40, rearMargin: 20 }, source: DONOR + '; the donor UI itself says to confirm hardware before ordering' }),
    drawerTravel: Object.freeze({ value: { maxMm: 450, ratioOfDepth: 0.8 }, source: DONOR }),
    doorLeafRevealMm: Object.freeze({ value: 5, source: DONOR + '; leaf width = door width − 5' }),
    doorOpeningDeg: Object.freeze({ value: 90, source: DONOR + '; the real hinge angle (often 95–165°) is unknown' })
  });
  // structuredClone, not JSON: JSON would turn NaN into null and let an invalid value pass validation.
  const clone = v => structuredClone(v);
  const num = Number.isFinite;

  function cavity(o, c) {
    return { width: o.w - (c.columns.length + 1) * c.thickness, height: c.height - c.plinth - 2 * c.thickness, depth: o.d - c.back - c.frontGap, bottom: c.plinth + c.thickness };
  }
  function presetColumn(kind, width, height) {
    const c = { width, kind, shelves: [], rod: null, drawers: 0, drawerHeight: 180 };
    if (kind === 'long' || kind === 'short') {
      c.shelves = [Math.round(height - 320)];
      c.rod = Math.round(height - 400);
      if (kind === 'short') { c.drawers = 2; c.drawerHeight = 180; }
    } else if (kind === 'drawers') {
      c.drawers = Math.min(4, Math.floor((height - 200) / 200)); c.drawerHeight = 200;
      c.shelves = [Math.round(Math.max(c.drawers * 200 + 40, height * .75))];
    } else {
      c.kind = 'shelves';
      const n = Math.max(1, Math.min(5, Math.floor(height / 350)));
      c.shelves = Array.from({ length: n }, (_, i) => Math.round(height * (i + 1) / (n + 1)));
    }
    return c;
  }
  function fronts(o, c) {
    const inner = cavity(o, c), width = (o.w - 2 * c.thickness) / c.doorCount;
    return Array.from({ length: c.doorCount }, (_, i) => ({ index: i, x: -o.w / 2 + c.thickness + width * i, width, right: i % 2 === 1, bottom: inner.bottom, height: inner.height }));
  }
  function bays(o, c) {
    const inner = cavity(o, c); let x = -o.w / 2 + c.thickness;
    return c.columns.map((col, index) => { const bay = { ...clone(col), index, x, height: inner.height, depth: inner.depth, bottom: inner.bottom }; x += col.width + c.thickness; return bay; });
  }
  function drawerDoorConflicts(o, c) {
    const hinges = fronts(o, c).map(d => d.x + (d.right ? d.width : 0));
    return bays(o, c).filter(b => b.drawers && hinges.some(x => x > b.x + LIMITS.hingeMarginMm && x < b.x + b.width - LIMITS.hingeMarginMm)).map(b => b.index + 1);
  }
  function defaultCabinet(type, o) {
    const H = ASSUMED.heightByTypeMm.value, height = type === 'tallcab' ? H.tallcab : type === 'wardrobe' ? H.wardrobe : type === 'shoecab' ? H.shoecab : H.cabinet;
    const n = Math.max(1, Math.min(6, Math.floor(o.w / ASSUMED.bayTargetWidthMm.value)));
    const doorTarget = type === 'shoecab' ? ASSUMED.doorTargetWidthMm.value.shoecab : ASSUMED.doorTargetWidthMm.value.other;
    const c = { height, thickness: ASSUMED.boardThicknessMm.value, back: ASSUMED.backPanelMm.value, frontGap: ASSUMED.frontAllowanceMm.value, plinth: ASSUMED.plinthMm.value,
      locked: true, front: 'closed', doorCount: Math.max(1, Math.min(12, Math.round(o.w / doorTarget))), columns: Array(n).fill(null) };
    const inner = cavity(o, c);
    c.columns = Array.from({ length: n }, (_, i) => presetColumn(height > 1800 && o.d >= 500 ? (i === 0 ? 'long' : 'short') : 'shelves', inner.width / n, inner.height));
    // As in the donor: default layouts keep drawer travel clear of the exterior hinges.
    for (const bay of drawerDoorConflicts(o, c)) { c.columns[bay - 1].drawers = 0; c.columns[bay - 1].kind = 'long'; }
    return c;
  }
  // Every issue, in the donor's order; issues[0].message is the message the donor would throw.
  function validate(o, c) {
    const out = [], add = (code, message, bay) => out.push(bay == null ? { code, message } : { code, message, bay });
    if (!o || !num(o.w) || !num(o.d) || o.w <= 0 || o.d <= 0) { add('outer', 'Medidas exteriores no válidas / Invalid outer dimensions'); return out; }
    if (!c || !Array.isArray(c.columns) || c.columns.length < LIMITS.bays[0] || c.columns.length > LIMITS.bays[1]) { add('bays-count', '柜体需要 1–8 个分区 / Use 1–8 bays'); return out; }
    if (c.columns.some(col => !col || typeof col !== 'object')) { add('bay-shape', 'Cada partición debe ser un objeto / Every bay must be an object'); return out; }
    let dims = true;
    for (const k of ['height', 'thickness', 'back', 'frontGap', 'plinth']) if (!num(c[k]) || c[k] < LIMITS[k][0] || c[k] > LIMITS[k][1]) dims = false;
    if (!dims) add('dimensions', '柜体尺寸超出范围 / Invalid cabinet dimensions');
    if (!FRONT_STATES.includes(c.front) || typeof c.locked !== 'boolean') add('state', '柜体状态无效 / Invalid cabinet state');
    if (!Number.isInteger(c.doorCount) || c.doorCount < LIMITS.doors[0] || c.doorCount > LIMITS.doors[1]) add('door-count', '柜门数量须为 1–12 / Use 1–12 doors');
    const inner = cavity(o, c), innerKnown = [inner.width, inner.height, inner.depth].every(num);
    if (!innerKnown || inner.height < LIMITS.cavityMinHeight || inner.depth < LIMITS.cavityMinDepth || inner.width < LIMITS.bayMinWidth * c.columns.length) add('cavity', '柜体净尺寸不足 / Cabinet cavity is too small');
    if (Math.abs(c.columns.reduce((s, col) => s + col.width, 0) - inner.width) > LIMITS.widthToleranceMm) add('bay-widths-sum', '分区宽度之和必须等于可用净宽 / Bay widths must fill the cabinet');
    c.columns.forEach((col, i) => {
      if (!num(col.width) || col.width < LIMITS.bayMinWidth || !KINDS.includes(col.kind)) add('bay-width', '分区净宽至少 150 mm / Minimum bay width: 150 mm', i);
      const drawersOk = Number.isInteger(col.drawers) && col.drawers >= LIMITS.drawers[0] && col.drawers <= LIMITS.drawers[1] && num(col.drawerHeight) && col.drawerHeight >= LIMITS.drawerHeight[0] && col.drawerHeight <= LIMITS.drawerHeight[1];
      if (!drawersOk) add('drawers', '抽屉尺寸无效 / Invalid drawer dimensions', i);
      else if (col.drawers * col.drawerHeight > inner.height - LIMITS.drawerHeadroomMm) add('drawers-height', '抽屉超出分区净高 / Drawers exceed bay height', i);
      const stack = drawersOk ? col.drawers * col.drawerHeight : 0;
      if (!Array.isArray(col.shelves) || col.shelves.length > LIMITS.shelvesMax) { add('shelves-count', '每区最多 12 块层板 / Maximum 12 shelves per bay', i); return; }
      let bottom = stack;
      for (const y of col.shelves) {
        if (!num(y) || y < bottom + LIMITS.boardGapMm || y + c.thickness > inner.height - LIMITS.boardGapMm) { add('shelf-gap', '层板之间及抽屉上方需留至少 60 mm / Leave 60 mm clear between boards and drawers', i); break; }
        bottom = y + c.thickness;
      }
      if (col.rod !== null && (!num(col.rod) || col.rod < stack + LIMITS.rodAboveDrawersMm || col.rod > inner.height - LIMITS.rodBelowTopMm || col.shelves.some(y => col.rod >= y - LIMITS.rodShelfGapMm && col.rod <= y + c.thickness + LIMITS.rodShelfGapMm)))
        add('rod', '挂衣杆与层板或抽屉冲突 / Hanging rail conflicts with a shelf or drawer', i);
    });
    return out;
  }
  const result = (o, c) => { const issues = validate(o, c); return issues.length ? { ok: false, issues } : { ok: true, outer: { w: o.w, d: o.d }, cabinet: c }; };
  // Donor resizeCabinet semantics (bay widths follow the new clear width; shelves and rails follow the clear height),
  // computed on a copy: the inputs are never touched, and a refused change leaves nothing half-applied.
  function resize(o, c, changes = {}) {
    const oldHeight = cavity(o, c).height, outer = { w: changes.w ?? o.w, d: changes.d ?? o.d }, next = clone(c);
    for (const k of ['height', 'thickness', 'back', 'frontGap', 'plinth', 'doorCount']) if (changes[k] !== undefined) next[k] = changes[k];
    const inner = cavity(outer, next), total = next.columns.reduce((s, col) => s + col.width, 0);
    for (const col of next.columns) {
      col.width *= inner.width / total;
      if (oldHeight && oldHeight !== inner.height) {
        const scale = inner.height / oldHeight;
        col.shelves = col.shelves.map(y => Math.round(y * scale));
        if (col.rod !== null) col.rod = Math.round(col.rod * scale);
      }
    }
    return result(outer, next);
  }
  function setBayWidth(o, c, index, width) {
    if (!Number.isInteger(index) || index < 0 || index >= c.columns.length) return { ok: false, issues: [{ code: 'bay-index', message: 'Partición inexistente / No such bay' }] };
    const next = clone(c), available = cavity(o, next).width, rest = available - next.columns[index].width;
    if (next.columns.length === 1) {
      if (Math.abs(width - available) > LIMITS.widthToleranceMm) return { ok: false, issues: [{ code: 'single-bay', message: '单分区使用全部净宽 / A single bay uses all available width', bay: 0 }] };
    } else next.columns.forEach((col, i) => { col.width = i === index ? width : col.width * (available - width) / rest; });
    return result(o, next);
  }
  // From the donor editor (cabinet-editor.js): split halves a bay minus one board; merge adds the neighbour and the board.
  function splitBay(o, c, index) {
    if (!Number.isInteger(index) || index < 0 || index >= c.columns.length) return { ok: false, issues: [{ code: 'bay-index', message: 'Partición inexistente / No such bay' }] };
    const next = clone(c), old = next.columns[index], w = (old.width - next.thickness) / 2;
    next.columns.splice(index, 1, { ...clone(old), width: w }, { ...clone(old), width: w });
    return result(o, next);
  }
  function mergeBay(o, c, index) {
    if (c.columns.length < 2 || !Number.isInteger(index) || index < 0 || index >= c.columns.length) return { ok: false, issues: [{ code: 'bay-index', message: 'No hay partición contigua / No adjacent bay' }] };
    const next = clone(c), i = index === next.columns.length - 1 ? index - 1 : index, first = next.columns[i];
    first.width += next.columns[i + 1].width + next.thickness; next.columns.splice(i + 1, 1);
    return result(o, next);
  }
  function setBay(o, c, index, patch) {
    if (!Number.isInteger(index) || index < 0 || index >= c.columns.length) return { ok: false, issues: [{ code: 'bay-index', message: 'Partición inexistente / No such bay' }] };
    const next = clone(c); Object.assign(next.columns[index], clone(patch)); return result(o, next);
  }
  function openings(o, c, col) {
    const inner = cavity(o, c), out = []; let base = col.drawers * col.drawerHeight;
    for (const y of col.shelves) { out.push({ bottom: base, height: y - base }); base = y + c.thickness; }
    out.push({ bottom: base, height: inner.height - base }); return out;
  }
  // Donor arithmetic kept literally (H3: assumed hardware): 13 mm slide per side, 12 mm sides, 18/9 mm front/back,
  // 12 mm bottom, 40 mm above the box, 20 mm rear margin; travel = min(450, 0.8 × usable depth).
  function drawerSize(o, c, col) {
    const depth = cavity(o, c).depth;
    return { width: col.width - 26 - 24, depth: depth - 20 - 27, height: col.drawerHeight - 40 - 12, outerWidth: col.width - 26, outerDepth: depth - 20, travel: Math.min(450, (depth - 20) * .8) };
  }
  // ---- Plan geometry in the cabinet frame (front at +d/2) ----
  const rect = (cx, cy, w, d) => [{ x: cx - w / 2, y: cy - d / 2 }, { x: cx + w / 2, y: cy - d / 2 }, { x: cx + w / 2, y: cy + d / 2 }, { x: cx - w / 2, y: cy + d / 2 }];
  function area(P) { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a.x * b.y - b.x * a.y; } return Math.abs(s) / 2; }
  // H2. The leaf (width − reveal, thickness = board) turns 90° about its hinge, which sits at the front face minus one
  // board (as in the donor's 3D pivot). Its farthest corner draws an arc of radius hypot(leaf, board).
  function swing(o, c, segments = 24) {
    const t = c.thickness, leafReveal = ASSUMED.doorLeafRevealMm.value;
    return fronts(o, c).map(door => {
      const hx = door.x + (door.right ? door.width : 0), hy = o.d / 2 - t, s = door.right ? -1 : 1, leaf = door.width - leafReveal, R = Math.hypot(leaf, t);
      const sector = [{ x: hx, y: hy }];
      for (let k = 0; k <= segments; k++) { const a = (Math.PI / 2) * k / segments; sector.push({ x: hx + s * R * Math.cos(a), y: hy + R * Math.sin(a) }); }
      const square = [{ x: hx, y: hy }, { x: hx + s * R, y: hy }, { x: hx + s * R, y: hy + R }, { x: hx, y: hy + R }];
      // The donor's own obstacle for an open door (design.js furnitureObstacles): an 18 mm slab at 90°.
      const donorSlab = rect(door.x + (door.right ? door.width + 9 : -9), o.d / 2 - 18 + door.width / 2, 18, door.width - 5);
      return { index: door.index, hinge: door.right ? 'right' : 'left', hingeLocal: { x: hx, y: hy }, leafMm: leaf, radiusMm: R, sector, square, donorSlab,
        areaMm2: { sector: area(sector), square: area(square), donorSlab: area(donorSlab) } };
    });
  }
  function drawerReach(o, c) {
    return bays(o, c).filter(b => b.drawers).map(b => {
      const size = drawerSize(o, c, b), extension = size.travel - c.frontGap - 20, cx = b.x + b.width / 2;
      return { bay: b.index, extensionMm: Math.max(0, extension), body: extension > 0 ? rect(cx, o.d / 2 + extension / 2, size.outerWidth, extension) : null, front: rect(cx, o.d / 2 + extension + 9, b.width - 6, 18) };
    });
  }
  // Plan transform used by FloorPlanTracing.footprint and the donor's localRect (clockwise, y down).
  function toPlan(object, P) {
    const a = object.rotationDeg * Math.PI / 180, cx = object.position.x, cy = object.position.y;
    return P.map(p => ({ x: cx + p.x * Math.cos(a) - p.y * Math.sin(a), y: cy + p.x * Math.sin(a) + p.y * Math.cos(a) }));
  }
  // ---- Front elevation primitives (generalised from the donor's cabinetElevation; mm, y up from the floor) ----
  function elevation(o, c) {
    const t = c.thickness, out = [], R = (role, x, y, w, h, extra) => out.push({ role, x, y, w, h, ...(extra || {}) });
    R('carcass', 0, 0, o.w, c.height); R('cavity', t, c.plinth + t, o.w - 2 * t, c.height - c.plinth - 2 * t);
    for (const b of bays(o, c)) {
      const x = b.x + o.w / 2;
      R('bay', x, b.bottom, b.width, b.height, { bay: b.index, label: Math.round(b.width) });
      // An invalid layout can make boards overlap: the overlap is drawn as such (positive height), never as a negative opening.
      for (const op of openings(o, c, b)) if (op.height >= 0) R('opening', x, b.bottom + op.bottom, b.width, op.height, { bay: b.index, label: Math.round(op.height) }); else R('overlap', x, b.bottom + op.bottom + op.height, b.width, -op.height, { bay: b.index, label: Math.round(op.height) });
      for (const y of b.shelves) R('shelf', x, b.bottom + y, b.width, t, { bay: b.index });
      if (b.rod !== null) R('rod', x + 10, b.bottom + b.rod - 10, b.width - 20, 20, { bay: b.index });
      for (let j = 0; j < b.drawers; j++) { R('drawer', x + 3, b.bottom + j * b.drawerHeight + 3, b.width - 6, b.drawerHeight - 6, { bay: b.index }); R('handle', x + b.width * .35, b.bottom + (j + .5) * b.drawerHeight, b.width * .3, 8, { bay: b.index }); }
      if (b.index < c.columns.length - 1) R('divider', x + b.width, c.plinth, t, c.height - c.plinth);
    }
    for (const d of fronts(o, c)) R('door', d.x + o.w / 2, d.bottom, d.width, d.height, { door: d.index, hinge: d.right ? 'right' : 'left' });
    return out;
  }
  const api = { TYPES, KINDS, FRONT_STATES, LIMITS, ASSUMED, isCabinetType: t => TYPES.includes(t), cavity, presetColumn, defaultCabinet, validate, resize, setBayWidth, splitBay, mergeBay, setBay,
    bays, openings, drawerSize, fronts, drawerDoorConflicts, swing, drawerReach, toPlan, elevation, area };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikCabinetCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
