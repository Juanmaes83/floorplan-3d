'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const Core = require('../js/project-core.js');
const Parcel = require('../js/parcel-core.js');
const Motion = require('../js/motion-quality-core.js');
const { inspectPlan } = require('../js/plan-validation-core.js');
const { directSun, droneFlight } = require('../js/plan-sun-drone-core.js');

const point = (x, y) => ({ x, y });
const rectangle = (x0, y0, x1, y1) => [point(x0, y0), point(x1, y0), point(x1, y1), point(x0, y1)];
const wall = (id, start, end) => ({ id, start, end, thicknessMm: 200, heightMm: 3000 });
const project = {
  walls: [wall('active', point(0, 0), point(4000, 0)), { id: 'old', status: 'demolished' }],
  openings: [
    { id: 'main', wallId: 'active', kind: 'door', isEntrance: true, widthMm: 899, heightMm: 2000 },
    { id: 'sliding', wallId: 'active', kind: 'sliding-door', widthMm: 700, heightMm: 2100 },
    { id: 'old-door', wallId: 'old', kind: 'door', widthMm: 600, heightMm: 1600 },
    { id: 'window', wallId: 'active', kind: 'window', widthMm: 500 }
  ],
  rooms: [{ id: 'bedroom', name: 'Dormitorio', family: 'bedroom', polygon: rectangle(0, 100, 2800, 3100) },
    { id: 'balcony', family: 'balcony', countsTowardArea: false, polygon: rectangle(0, 0, 1000, 1000) }]
};

function site(rings, northOffsetDeg = 0) {
  return { northOffsetDeg, location: { latitude: 40.4, longitude: -3.7, timeZone: 'Europe/Madrid' },
    parcel: Parcel.normalizeParcel({ reference: 'EXAMPLE0000001', sourceCrs: 'EPSG:25830',
      sourceGeometry: { type: 'MultiPolygon', polygons: [{ rings }] } }),
    buildingPlacement: {
      horizontal: { modelAnchorMm: point(0, 0), parcelLocalAnchorMm: point(0, 0), source: { type: 'user-entered' } }
    } };
}
const outer = [[499990, 4399990], [500010, 4399990], [500010, 4400010], [499990, 4400010]];

test('checks openings and net surfaces, and reads absent heights as unknown', () => {
  const before = structuredClone(project);
  const result = inspectPlan(project);
  assert.deepEqual(result.findings.map(({ kind, measured, status }) => [kind, measured, status]), [
    ['door-opening-width', 899, 'review'],
    ['passage-opening-height', 2000, 'review'],
    ['declared-room-height', null, 'insufficient-data'],
    ['bedroom-area', 8.4, 'review']
  ]);
  assert.equal(result.surfaces.areaM2, 8.4);
  assert.equal(result.surfaces.status, 'estimated');
  assert.deepEqual(project, before);
});

test('retains floor identities and distinguishes stair width from unmeasured headroom', () => {
  const result = inspectPlan({
    levels: [{ id: 'ground', project }, { id: 'upper', project: { walls: [], openings: [], rooms: [] } }],
    stairs: [{ id: 'stair', fromLevelId: 'ground', widthMm: 899 }]
  });
  assert.ok(result.findings.every(row => row.levelId === 'ground'));
  assert.equal(result.findings.find(row => row.kind === 'stair-width').status, 'review');
  assert.equal(result.findings.find(row => row.kind === 'stair-headroom').status, 'insufficient-data');
});

test('uses declared R02-A room heights and never treats a higher wall as clearance', () => {
  const withHeight = { ...project, extensions: { 'x-r02a-ceiling': {
    version: 1, items: [], verticalReferences: [{ scope: 'room', roomId: 'bedroom',
      clearHeightMm: 2050, reference: 'finished-floor', source: 'user-declared' }]
  } } };
  const result = inspectPlan(withHeight).findings.find(row => row.kind === 'declared-room-height');
  assert.equal(result.measured, 2050);
  assert.equal(result.status, 'review');
});

test('uses parcel placement, rotation, homologous units and the closest boundary', () => {
  const source = { ...project, site: site([outer], 37) };
  const report = inspectPlan(source, { setbackMm: 4900 }).setback;
  assert.equal(report.status, 'within-reference');
  const expected = 10000 - (2800 * Math.cos(37 * Math.PI / 180) + 3100 * Math.sin(37 * Math.PI / 180));
  assert.ok(Math.abs(report.measuredMm - expected) < 0.001);
  assert.equal(inspectPlan(source, { setbackMm: 8000 }).setback.status, 'review');
  delete source.site.buildingPlacement;
  assert.equal(inspectPlan(source, { setbackMm: 3000 }).setback.status, 'insufficient-data');
});

test('a parcel hole inside the footprint cannot be reported clear', () => {
  const hole = [[500001, 4399998], [500002, 4399998], [500002, 4399999], [500001, 4399999]];
  const report = inspectPlan({ ...project, site: site([outer, hole]) }, { setbackMm: 0 }).setback;
  assert.equal(report.status, 'review');
  assert.equal(report.measuredMm, 0);
});

test('sun responds to north and a modeled blocking wall, without filling missing values', () => {
  const sunny = { ...project, site: site([outer], 180), openings: [
    { id: 'sun', kind: 'window', wallId: 'active', offsetMm: 800, widthMm: 1200, heightMm: 1000, sillHeightMm: 900 }
  ] };
  const before = structuredClone(sunny);
  const hours = source => directSun(source, '2026-12-21').rooms[0].directHours;
  assert.ok(hours(sunny) > 2);
  assert.equal(hours({ ...sunny, site: site([outer], 0) }), 0);
  const blocker = { ...wall('screen', point(-20000, -1500), point(20000, -1500)), heightMm: 10000 };
  assert.equal(hours({ ...sunny, walls: [...sunny.walls, blocker] }), 0);
  assert.equal(hours({ ...sunny, openings: [] }), null);
  assert.equal(directSun({ ...sunny, site: undefined }, '2026-12-21').status, 'unavailable');
  assert.equal(directSun(sunny, '2026-03-29').reason, 'non-standard-local-day');
  assert.deepEqual(sunny, before);
});

test('drone stays above the modeled envelope and meets RUBIK motion limits', () => {
  const source = Core.initial();
  const portrait = droneFlight(source, 0.8);
  const desktop = droneFlight(source);
  assert.ok(Motion.check(portrait.metrics).pass);
  assert.ok(Motion.check(desktop.metrics).pass);
  const maxY = Math.max(...source.walls.map(w => w.heightMm)) / 1000;
  for (const time of [0, 13, 27, 41, portrait.duration]) assert.ok(portrait.pose(time).position[1] > maxY);
  assert.notDeepEqual(portrait.pose(0).position, portrait.pose(portrait.duration).position);
  assert.equal(droneFlight({ walls: [] }).reason, 'no-walls');
});
