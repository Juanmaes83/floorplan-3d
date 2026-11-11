'use strict';

// Synthetic FloorPlanProjectV1 scenarios for MCP Etapa 2 (propose_layout). Fictitious geometry only; every project is
// validated with the canonical contract. Plan millimetres; positions are integers as the 1.x contract requires.
const Core = require('../../../js/project-core.js');

const point = (x, y) => ({ x, y });
const room = (id, polygon, floorMaterialId) => ({
  id: `rom_${id}`, name: id, polygon: polygon.map(([x, y]) => point(x, y)), floorMaterialId, countsTowardArea: true,
});
const wall = (id, x1, y1, x2, y2) => ({
  id: `wal_${id}`, start: point(x1, y1), end: point(x2, y2),
  thicknessMm: 100, heightMm: 2600, structure: 'partition', status: 'existing',
});
const object = (id, x, y, widthMm, depthMm, rotationDeg = 0, type = 'table') => ({
  id: `obj_${id}`, type, name: id, position: point(x, y), size: { widthMm, depthMm }, rotationDeg,
});

// One 4000 x 3000 room, walls just outside its outline, a door on the south wall that opens into the room.
// Door geometry (FloorPlanCore.geometry): hinge (900, 0), closed along +x, open along +y, radius 800 mm:
// the leaf sweeps the quarter circle x 900..1700, y 0..800 (the conservative square of FloorPlanPlacement).
function base({ swing = { hinge: 'start', side: 'right' }, scale } = {}) {
  const project = Core.initial();
  const floor = project.materials.find(m => m.category === 'floor').id;
  project.rooms = [room('living', [[0, 0], [4000, 0], [4000, 3000], [0, 3000]], floor)];
  project.walls = [
    wall('south', -100, -50, 4100, -50), wall('north', -100, 3050, 4100, 3050),
    wall('west', -50, 0, -50, 3000), wall('east', 4050, 0, 4050, 3000),
  ];
  project.openings = [{
    id: 'opn_door', wallId: 'wal_south', kind: 'door', offsetMm: 1000, widthMm: 800, heightMm: 2100, sillHeightMm: 0,
    ...(swing ? { swing } : {}),
  }];
  project.objects = [];
  if (scale) project.scale = scale;
  return project;
}

const SCENARIOS = {
  // Two tables overlapping 300 mm in plan.
  overlap: () => { const p = base(); p.objects = [object('alpha', 2000, 1500, 600, 600), object('beta', 2300, 1500, 600, 600)]; return p; },
  // A chair inside the leaf sweep of the door.
  'door-blocked': () => { const p = base(); p.objects = [object('chair', 1300, 300, 400, 400, 0, 'chair')]; return p; },
  // Furniture far from the door.
  'door-clear': () => { const p = base(); p.objects = [object('sofa', 3000, 2200, 1200, 600, 0, 'sofa')]; return p; },
  // Inside the conservative square but out of reach of the leaf (corner beyond the 800 mm radius).
  'door-square-only': () => { const p = base(); p.objects = [object('lamp', 1640, 740, 100, 100, 0, 'lamp')]; return p; },
  // Rotated table overlapping another one.
  rotated: () => { const p = base(); p.objects = [object('fixed', 2500, 1500, 800, 800), object('turned', 2900, 1500, 600, 400, 30)]; return p; },
  // Against (through) the east wall.
  'against-wall': () => { const p = base(); p.objects = [object('shelf', 3900, 1500, 400, 1000, 0, 'shelf')]; return p; },
  // Three pieces close together: the moved one must not land on the third.
  'two-close': () => { const p = base(); p.objects = [object('alpha', 2000, 1500, 600, 600), object('beta', 2400, 1500, 600, 600), object('gamma', 3000, 1500, 600, 600)]; return p; },
  // Nothing to fix.
  correct: () => { const p = base(); p.objects = [object('alpha', 2000, 1500, 600, 600), object('beta', 3200, 1500, 600, 600)]; return p; },
  // L-shaped room: a table at the inner corner sticks out of the room.
  concave: () => {
    const p = base({ swing: null });
    const floor = p.rooms[0].floorMaterialId;
    p.rooms = [room('ell', [[0, 0], [4000, 0], [4000, 1500], [1500, 1500], [1500, 3000], [0, 3000]], floor)];
    p.walls = [wall('south', -100, -50, 4100, -50), wall('west', -50, 0, -50, 3000)];
    p.openings = [];
    p.objects = [object('table', 1400, 1400, 600, 600)];
    return p;
  },
  // Two overlapping room outlines contain the centre of the piece.
  'ambiguous-room': () => {
    const p = base();
    p.rooms.push(room('alcove', [[1000, 1000], [3000, 1000], [3000, 2000], [1000, 2000]], p.rooms[0].floorMaterialId));
    p.objects = [object('alpha', 2000, 1500, 600, 600), object('beta', 2300, 1500, 600, 600)];
    return p;
  },
  // A piece outside every room.
  outside: () => { const p = base(); p.objects = [object('lost', 6000, 6000, 500, 500)]; return p; },
  // A piece bigger than its room: no position of the grid fits (grid exhausted, not a proof).
  'too-big': () => { const p = base(); p.objects = [object('huge', 2000, 1500, 3800, 3200), object('box', 2000, 1500, 400, 400)]; return p; },
  // The nearest grid candidate accepted by FloorPlanPlacement (1 mm tolerance) still overlaps 0.5 mm for layout-review.
  'models-disagree-after': () => { const p = base(); p.objects = [object('fixed', 2000, 1500, 600, 600), object('odd', 2100, 1500, 601, 600)]; return p; },
  // 0.5 mm overlap already at the start: FloorPlanPlacement sees no conflict, layout-review does.
  'models-disagree-before': () => { const p = base(); p.objects = [object('fixed', 2000, 1500, 600, 600), object('odd', 2600, 1500, 601, 600)]; return p; },
  // The nearest candidate (stepMm 600) solves the overlap but lands 0.5 mm into the door square, where the leaf reaches it.
  'introduces-issue': () => { const p = base(); p.objects = [object('blocker', 600, 1300, 600, 400), object('odd', 600, 1000, 601, 400)]; return p; },
  // The door has no swing: FloorPlanPlacement assumes one, layout-review skips it.
  'door-without-swing': () => { const p = base({ swing: null }); p.objects = [object('chair', 1300, 300, 400, 400, 0, 'chair'), object('alpha', 2000, 1500, 600, 600), object('beta', 2300, 1500, 600, 600)]; return p; },
  // A rug inside the door sweep (floor covering: not an obstacle for the review).
  'rug-in-door': () => { const p = base(); p.objects = [object('rug', 1300, 300, 400, 400, 0, 'rug')]; return p; },
  // Same overlap with an uncalibrated scale.
  'scale-pending': () => { const p = SCENARIOS.overlap(); p.scale = { confidence: 'pending', method: 'none' }; return p; },
  // roomId stored on the piece contradicts its geometry.
  'stored-room-conflict': () => {
    const p = SCENARIOS.overlap();
    p.rooms.push(room('other', [[5000, 0], [7000, 0], [7000, 2000], [5000, 2000]], p.rooms[0].floorMaterialId));
    p.objects[1].roomId = 'rom_other';
    return p;
  },
};

function scenario(name) {
  const make = SCENARIOS[name];
  if (!make) throw new Error(`Escenario desconocido: ${name}`);
  const project = make();
  Core.validate(project);
  return project;
}

module.exports = { scenario, names: Object.keys(SCENARIOS) };
