/* SCULPT-R01 · synthetic raster plans with known ground truth. Drawn here, from code: no real plan, no client data.
 * Every variant is the same three-room flat (one partition with a door, one with a door, one exterior window),
 * drawn in a different style. Coordinates in pixels; the construction scale is declared (10 mm/px) because the
 * fixture is defined that way, not inferred from anything (one variant declares 30 mm/px).
 */
(function (root) {
  'use strict';
  const W = 640, H = 480, MM_PER_PX = 10;
  const STYLES = Object.freeze({
    'black-walls': { wall: [25, 25, 25], t: 10 },
    'grey-walls': { wall: [140, 140, 140], t: 10 },
    'grey-walls-fills': { wall: [140, 140, 140], t: 10, fills: [[236, 226, 206], [205, 170, 120], [226, 231, 236]] },
    'dimension-lines': { wall: [25, 25, 25], t: 10, clutter: true },
    // Grey walls plus near-black text: the look of commercial plan screenshots (black labels, grey walls).
    'grey-walls-black-text': { wall: [150, 150, 150], t: 10, text: true },
    // Same layout drawn small: 4 px walls at a declared 30 mm/px (120 mm walls).
    'low-resolution': { wall: [25, 25, 25], t: 4, mmPerPx: 30 }
  });

  function geometry(t) {
    const x0 = 80, y0 = 60, x1 = 560, y1 = 420, px = 300, py = 240;
    // Walls as solid rectangles, split at the openings. Horizontal walls own the corners.
    const walls = [
      { rect: [x0, y0, 150, y0 + t], axis: 'h' }, { rect: [220, y0, x1, y0 + t], axis: 'h' }, // top, window gap 150–220
      { rect: [x0, y1 - t, x1, y1], axis: 'h' }, // bottom
      { rect: [x0, y0 + t, x0 + t, y1 - t], axis: 'v' }, { rect: [x1 - t, y0 + t, x1, y1 - t], axis: 'v' }, // left, right
      { rect: [px, y0 + t, px + t, 200], axis: 'v' }, { rect: [px, 250, px + t, y1 - t], axis: 'v' }, // partition, door 200–250
      { rect: [px + t, py, 400, py + t], axis: 'h' }, { rect: [445, py, x1 - t, py + t], axis: 'h' } // partition, door 400–445
    ];
    const openings = [
      { rect: [150, y0, 220, y0 + t], axis: 'h', kind: 'window' },
      { rect: [px, 200, px + t, 250], axis: 'v', kind: 'door' },
      { rect: [400, py, 445, py + t], axis: 'h', kind: 'door' }
    ];
    const rooms = [
      { id: 'left', rect: [x0 + t, y0 + t, px, y1 - t] },
      { id: 'right-top', rect: [px + t, y0 + t, x1 - t, py] },
      { id: 'right-bottom', rect: [px + t, py + t, x1 - t, y1 - t] }
    ];
    return { walls, openings, rooms };
  }

  function plan(name) {
    const s = STYLES[name];
    if (!s) throw new Error('unknown synthetic plan: ' + name);
    const data = new Uint8ClampedArray(W * H * 4).fill(255);
    const fill = (r, c) => {
      for (let y = Math.max(0, r[1]); y < Math.min(H, r[3]); y++) for (let x = Math.max(0, r[0]); x < Math.min(W, r[2]); x++) {
        const i = (y * W + x) * 4; data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
      }
    };
    const g = geometry(s.t);
    if (s.fills) g.rooms.forEach((r, i) => fill(r.rect, s.fills[i]));
    for (const w of g.walls) fill(w.rect, s.wall);
    // Window symbol: two thin lines across the gap (how plans usually draw it).
    const win = g.openings[0].rect;
    fill([win[0], win[1] + 2, win[2], win[1] + 3], [60, 60, 60]); fill([win[0], win[3] - 3, win[2], win[3] - 2], [60, 60, 60]);
    if (s.text) for (const [x, y] of [[150, 230], [380, 140], [380, 320]]) for (let k = 0; k < 6; k++) fill([x + k * 9, y, x + k * 9 + 6, y + 12], [10, 10, 10]);
    if (s.clutter) {
      const ink = [40, 40, 40];
      // Dimension lines outside the plan, with ticks, and number-like strokes.
      fill([80, 445, 560, 446], ink); for (const x of [80, 300, 560]) fill([x - 1, 438, x + 1, 452], ink);
      fill([590, 60, 591, 420], ink); for (const y of [60, 240, 420]) fill([583, y - 1, 597, y + 1], ink);
      for (let k = 0; k < 6; k++) fill([170 + k * 7, 452, 174 + k * 7, 462], ink);
      // Room text and a furniture outline (1–2 px strokes) inside rooms.
      for (let k = 0; k < 8; k++) fill([150 + k * 8, 230, 155 + k * 8, 241], ink);
      fill([360, 300, 480, 302], ink); fill([360, 360, 480, 362], ink); fill([360, 300, 362, 362], ink); fill([478, 300, 480, 362], ink);
    }
    return { name, image: { width: W, height: H, data }, mmPerPx: s.mmPerPx || MM_PER_PX, truth: g };
  }

  const api = { NAMES: Object.keys(STYLES), WIDTH: W, HEIGHT: H, MM_PER_PX, plan };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.RubikSyntheticPlans = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
