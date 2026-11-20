'use strict';
// R02-A: una ruta de presentación solo puede salir de la caché si NO cambió ninguna
// entrada geométrica que consume FloorPlanPresentationRoute.plan. No toca producto ni datos.
const test = require('node:test');
const assert = require('node:assert/strict');
const I = require('../js/r02a-passage-indicative.js');

function fixture() {
  const rect = (x = 0) => ({ center: [x, 0], angle: 0, spanMm: 900, thickness: 120 });
  const p = { id: 'project-1', objects: [{ id: 'chair', type: 'chair', position: { x: 100, y: 200 }, size: { widthMm: 500, depthMm: 400 }, rotationDeg: 0 }] };
  const g = {
    envelope: { x: 0, y: 0, w: 4000, h: 3000 },
    rooms: [{ id: 'living', poly: [[0, 0], [2000, 0], [2000, 2000], [0, 2000]], counted: true, at: [1000, 1000] }],
    walls: [{ id: 'wall', status: 'existing', ...rect(2000) }],
    doors: [{ id: 'entry', entry: true, height: 2.1, rect: rect(0) }],
    windows: [rect(4000)],
    slides: [{ rect: rect(3000) }]
  };
  return { p, g };
}

test('R02-A: invalidate route cache for every presentation-route geometric dependency', () => {
  const mutations = [
    ['room target', g => { g.rooms[0].at = [1200, 950]; }],
    ['envelope origin', g => { g.envelope.x = -400; }],
    ['envelope size', g => { g.envelope.w = 4500; }],
    ['door span', g => { g.doors[0].rect.spanMm = 1300; }],
    ['door angle', g => { g.doors[0].rect.angle = Math.PI / 4; }],
    ['door thickness', g => { g.doors[0].rect.thickness = 240; }],
    ['window thickness', g => { g.windows[0].thickness = 200; }],
    ['window angle', g => { g.windows[0].angle = Math.PI / 3; }],
    ['slide span', g => { g.slides[0].rect.spanMm = 1500; }],
    ['slide thickness', g => { g.slides[0].rect.thickness = 180; }]
  ];
  for (const [name, change] of mutations) {
    const { p, g } = fixture();
    I.resetCache();
    let plans = 0;
    const plan = () => { plans++; return { kind: 'interior', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], clearanceMm: 220 }; };
    const before = I.signature(p, g, null);
    assert.equal(I.routesFor(p, g, plan, null).cached, false, name);
    assert.equal(I.routesFor(p, g, plan, null).cached, true, name);
    change(g);
    assert.notEqual(I.signature(p, g, null), before, name + ' must alter signature');
    assert.equal(I.routesFor(p, g, plan, null).cached, false, name + ' must re-plan');
    assert.equal(plans, 2, name + ' must plan exactly twice');
  }
});

test('R02-A: unrelated ceiling-only data changes keep the route cache hot', () => {
  I.resetCache();
  const { p, g } = fixture();
  let plans = 0;
  const plan = () => { plans++; return { kind: 'interior', points: [], clearanceMm: 220 }; };
  assert.equal(I.routesFor(p, g, plan, 'level-1').cached, false);
  p.extensions = { 'x-r02a-ceiling': { version: 1, items: [{ id: 'ceiling-test' }] } };
  assert.equal(I.routesFor(p, g, plan, 'level-1').cached, true);
  assert.equal(plans, 1);
});
