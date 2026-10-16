'use strict';

const Core = require('../../../js/project-core.js');

const point = (x, y) => ({ x, y });
const room = (id, polygon, floorMaterialId) => ({
  id: `rom_${id}`, name: id, polygon: polygon.map(([x, y]) => point(x, y)),
  floorMaterialId, countsTowardArea: true,
});
const wall = (id, x1, y1, x2, y2, structure = 'partition') => ({
  id: `wal_${id}`, start: point(x1, y1), end: point(x2, y2),
  thicknessMm: 100, heightMm: 2600, structure, status: 'existing',
});
const opening = (id, wallId, offsetMm, widthMm, kind = 'door') => ({
  id: `opn_${id}`, wallId: `wal_${wallId}`, kind, offsetMm, widthMm,
  heightMm: kind === 'window' ? 1200 : 2100,
  sillHeightMm: kind === 'window' ? 900 : 0,
});
const object = (id, x, y, widthMm, depthMm, rotationDeg = 0, roomId) => ({
  id: `obj_${id}`, type: 'table', name: id,
  position: point(x, y), size: { widthMm, depthMm }, rotationDeg,
  ...(roomId ? { roomId: `rom_${roomId}` } : {}),
});

function spatialProject() {
  const project = Core.initial();
  const floor = project.materials.find(material => material.category === 'floor').id;
  project.rooms = [
    room('rect', [[0, 0], [4000, 0], [4000, 4000], [0, 4000]], floor),
    room('next', [[4100, 0], [8100, 0], [8100, 4000], [4100, 4000]], floor),
    room('concave', [[0, 5000], [4000, 5000], [4000, 6000], [1500, 6000], [1500, 9000], [0, 9000]], floor),
    room('rotated', [[12000, 0], [14000, 2000], [12000, 4000], [10000, 2000]], floor),
  ];
  project.walls = [
    wall('shared', 4050, 0, 4050, 4000),
    wall('exterior', -50, 0, -50, 4000, 'exterior'),
    wall('long', 0, 4050, 8100, 4050, 'exterior'),
    wall('outside', 17000, 0, 17000, 4000),
  ];
  project.openings = [
    opening('shared-door', 'shared', 1200, 800),
    opening('exterior-window', 'exterior', 1000, 800, 'window'),
    opening('long-only-rect', 'long', 1000, 700),
    opening('outside', 'outside', 1000, 700),
  ];
  project.objects = [
    object('rect', 1000, 1000, 600, 500, 0, 'rect'),
    object('next', 5000, 1000, 500, 500),
    object('cross', 4050, 2000, 500, 400, 45),
    object('rotated', 12000, 2000, 800, 300, 45),
    object('concave-inside', 500, 7000, 500, 500),
    object('concave-cross', 1200, 6000, 1600, 1000),
    object('concave-notch', 2500, 7000, 500, 500),
    object('boundary', 4050, 3200, 100, 400),
    object('outside', 18000, 18000, 500, 500),
    object('wrong-stored-room', 2500, 1000, 500, 500, 0, 'next'),
  ];
  Core.validate(project);
  return project;
}

module.exports = { spatialProject };
