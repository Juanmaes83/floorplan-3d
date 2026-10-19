'use strict';

// Synthetic FloorPlanProjectV1 plans with known measures for check_route_2d. All values in mm.
// Rooms are drawn on wall faces (100 mm walls outside the room polygon) unless a case says otherwise.
const Core = require('../../../js/project-core.js');

const point = (x, y) => ({ x, y });
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

function plan({ rooms = [], walls = [], openings = [], objects = [], scale } = {}) {
  const project = Core.initial();
  const floor = project.materials.find(m => m.category === 'floor').id;
  project.rooms = rooms.map(([id, polygon]) => ({ id: `rom_${id}`, name: id, polygon: polygon.map(([x, y]) => point(x, y)),
    floorMaterialId: floor, countsTowardArea: true }));
  project.walls = walls.map(([id, x1, y1, x2, y2, extra = {}]) => ({ id: `wal_${id}`, start: point(x1, y1), end: point(x2, y2),
    thicknessMm: 100, heightMm: 2600, structure: 'partition', status: 'existing', ...extra }));
  project.openings = openings.map(([id, wallId, offsetMm, widthMm, kind = 'door', extra = {}]) => ({ id: `opn_${id}`, wallId: `wal_${wallId}`,
    kind, offsetMm, widthMm, heightMm: kind === 'window' ? 1200 : 2100, sillHeightMm: kind === 'window' ? 900 : 0, ...extra }));
  project.objects = objects.map(([id, x, y, w, d, rot = 0, type = 'table']) => ({ id: `obj_${id}`, type, name: id,
    position: point(x, y), size: { widthMm: w, depthMm: d }, rotationDeg: rot }));
  if (scale) project.scale = scale;
  Core.validate(project);
  return project;
}

// Four 100 mm walls whose inner faces are the rectangle edges.
const enclose = (id, x0, y0, x1, y1) => [
  [`${id}-s`, x0 - 100, y0 - 50, x1 + 100, y0 - 50], [`${id}-n`, x0 - 100, y1 + 50, x1 + 100, y1 + 50],
  [`${id}-w`, x0 - 50, y0, x0 - 50, y1], [`${id}-e`, x1 + 50, y0, x1 + 50, y1],
];

const open = (objects = [], extra = {}) => plan({ rooms: [['hall', rect(0, 0, 6000, 4000)]], walls: enclose('hall', 0, 0, 6000, 4000), objects, ...extra });

// Rooms west and east joined by an open-plan corridor room y 1100–1100+w (no walls: pure room boundaries).
const corridor = w => plan({ rooms: [['west', rect(0, 0, 3000, 3000)], ['corridor', rect(3000, 1100, 6000, 1100 + w)], ['east', rect(6000, 0, 9000, 3000)]] });

// Two rooms separated by a wall at x 4000–4100 with one opening at y 1600–1600+width.
function twoRooms(width, kind = 'door', extra = {}) {
  return plan({
    rooms: [['west', rect(0, 0, 4000, 4000)], ['east', rect(4100, 0, 8100, 4000)]],
    walls: [['middle', 4050, 0, 4050, 4000], ...enclose('west', 0, 0, 4000, 4000).filter(w => !w[0].endsWith('-e')),
      ...enclose('east', 4100, 0, 8100, 4000).filter(w => !w[0].endsWith('-w'))],
    openings: width ? [['middle', 'middle', 1600, width, kind, extra]] : [],
  });
}

// L-shaped corridor 900 mm wide: arm 1 along x (y 0–900), arm 2 along y (x 3100–4000).
const lTurn = (objects = []) => plan({ rooms: [['lshape', [[0, 0], [4000, 0], [4000, 4000], [3100, 4000], [3100, 900], [0, 900]]]], objects });

// Concave room: its straight chord between the two arms leaves the polygon.
const concave = () => plan({ rooms: [['concave', [[0, 0], [6000, 0], [6000, 6000], [4000, 6000], [4000, 2000], [0, 2000]]]] });

// 6000×6000 room with an internal partition from y 0 to yEnd at x 3000 (free end at yEnd).
const wallEnd = yEnd => plan({ rooms: [['room', rect(0, 0, 6000, 6000)]], walls: [...enclose('room', 0, 0, 6000, 6000), ['part', 3000, 0, 3000, yEnd]] });

// Straight corridor room 6000 long and `width` wide with walls on its long sides.
const strip = (width, objects = []) => plan({ rooms: [['strip', rect(0, 0, 6000, width)]], walls: enclose('strip', 0, 0, 6000, width), objects });

module.exports = { plan, rect, enclose, open, corridor, twoRooms, lTurn, concave, wallEnd, strip };
