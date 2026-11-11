'use strict';
// Extra synthetic scenarios for the empirical validation of MCP Etapa 2 (not part of the runtime). They reuse the
// #196 fixtures and add only the geometric situations those do not cover.
const Core = require('../../../js/project-core.js');
const { scenario } = require('../fixtures/proposal-projects.cjs');

const EXTRA = {
  // D1, the case that matters: a door WITHOUT swing on the north wall. FloorPlanCore.geometry assumes hinge start /
  // side left, which for this wall direction opens INTO the room, so FloorPlanPlacement sees a door square that the
  // JSON never declared; layout-review skips the door.
  'swingless-inward': () => {
    const p = scenario('correct');
    p.openings.push({ id: 'opn_north', wallId: 'wal_north', kind: 'door', offsetMm: 2500, widthMm: 800, heightMm: 2100, sillHeightMm: 0 });
    p.objects.push({ id: 'obj_stool', type: 'chair', name: 'stool', position: { x: 2700, y: 2800 }, size: { widthMm: 300, depthMm: 300 }, rotationDeg: 0 });
    return p;
  },
};

function validationScenario(name) {
  const project = EXTRA[name] ? EXTRA[name]() : scenario(name);
  Core.validate(project);
  return project;
}
module.exports = { validationScenario, extraNames: Object.keys(EXTRA) };
