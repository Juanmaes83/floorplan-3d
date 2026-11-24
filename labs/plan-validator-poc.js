(function (root) {
  'use strict';

  // SCULPT 1.1. Door, stair and bedroom references adapted from validate_layout.py
  // Juanmaes83/floorplan-to-3d-house@1ec97dc01f997dfd99ebf607ab4e7186f7a6c5d2 (MIT).
  const node = typeof module === 'object';
  const Core = node ? require('../js/project-core.js') : root.FloorPlanCore;
  const Surface = node ? require('../js/surface-core.js') : root.FloorPlanSurfaceMetrics;
  const Parcel = node ? require('../js/parcel-core.js') : root.FloorPlanParcelCore;
  const Territory = node ? require('../js/territory-integration-core.js') : root.FloorPlanTerritoryIntegration;
  const Ceiling = node ? require('../js/r02a-ceiling-contract.js') : root.RubikCeilingContract;
  const Tracing = node ? require('../js/tracing-core.js') : root.FloorPlanTracing;

  const edges = ring => ring.map((point, i) => [point, ring[(i + 1) % ring.length]]);
  function inside(point, ring) {
    let hit = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[j], b = ring[i];
      if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) {
        hit = !hit;
      }
    }
    return hit;
  }
  const contains = (point, polygon) => inside(point, polygon[0]) && polygon.slice(1).every(ring => !inside(point, ring));

  function segmentDistance(a, b, c, d) {
    const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) return 0;
    return Math.min(Tracing.segmentPoint(a, c, d).distance, Tracing.segmentPoint(b, c, d).distance,
      Tracing.segmentPoint(c, a, b).distance, Tracing.segmentPoint(d, a, b).distance);
  }

  function footprintSetback(project, site, referenceMm) {
    if (!Number.isFinite(referenceMm) || referenceMm < 0) return { status: 'insufficient-data', reason: 'setback-reference' };
    if (!site?.parcel || !site.buildingPlacement) return { status: 'insufficient-data', reason: 'parcel-placement' };
    const polygons = Parcel.toLocalGeometry(site.parcel).polygons.map(p => p.rings.map(r => r.map(([x, y]) => ({ x, y }))));
    const walls = project.walls.filter(w => w.status !== 'demolished').map(w => Core.wallRect(w).poly.map(([x, y]) => ({ x, y })));
    const roomFootprints = project.rooms.filter(r => !['balcony', 'terrace'].includes(Core.roomFamily(r))).map(r => r.polygon);
    const footprint = [...walls, ...roomFootprints];
    if (!footprint.length) return { status: 'insufficient-data', reason: 'footprint' };
    let measuredMm = Infinity;
    for (const part of footprint) {
      const ring = part.map(point => Territory.modelToParcel(site, point));
      const polygon = polygons.find(p => ring.every(point => contains(point, p)));
      if (!polygon) return { status: 'review', reason: 'outside-parcel', measuredMm: null, referenceMm };
      for (const [a, b] of edges(ring)) {
        for (const boundary of polygon) {
          for (const [c, d] of edges(boundary)) {
            measuredMm = Math.min(measuredMm, segmentDistance(a, b, c, d));
          }
        }
      }
      if (polygon.slice(1).some(hole => inside(hole[0], ring))) measuredMm = 0;
    }
    if (measuredMm < 0.001) return { status: 'review', reason: 'parcel-boundary-contact', measuredMm: 0, referenceMm };
    return { status: measuredMm < referenceMm ? 'review' : 'within-reference', measuredMm, referenceMm };
  }

  function inspectPlan(source, { setbackMm } = {}) {
    const building = Array.isArray(source.levels);
    const levels = building ? source.levels : [{ id: null, project: source }];
    const findings = [];
    function check(kind, id, levelId, value, reference, unit) {
      if (Number.isFinite(value) && value >= reference) return;
      findings.push({
        kind, id, levelId, reference, unit, measured: Number.isFinite(value) ? value : null,
        status: Number.isFinite(value) ? 'review' : 'insufficient-data'
      });
    }
    for (const { id, project } of levels) {
      const hasValidCeiling = Ceiling.validateExtension(project).ok;
      const activeWalls = new Set(project.walls.filter(wall => wall.status !== 'demolished').map(wall => wall.id));
      for (const opening of project.openings) {
        if (!activeWalls.has(opening.wallId)) continue;
        if (['door', 'sliding-door'].includes(opening.kind)) {
          check('door-opening-width', opening.id, id, opening.widthMm, opening.isEntrance ? 900 : 700, 'mm');
        }
        if (['door', 'sliding-door', 'opening'].includes(opening.kind)) {
          check('passage-opening-height', opening.id, id, opening.heightMm, 2100, 'mm');
        }
      }
      for (const room of project.rooms) {
        if (!['balcony', 'terrace'].includes(Core.roomFamily(room))) {
          const vertical = hasValidCeiling ? Ceiling.verticalFor(project, room.id) : null;
          check('declared-room-height', room.id, id, vertical?.clearHeightMm, 2100, 'mm');
        }
        if (Core.roomFamily(room) === 'bedroom' && room.countsTowardArea !== false) {
          check('bedroom-area', room.id, id, Surface.polygonAreaM2(room.polygon), 9, 'm²');
        }
      }
    }
    for (const stair of building ? source.stairs : []) {
      check('stair-width', stair.id, stair.fromLevelId, stair.widthMm, 900, 'mm');
      findings.push({ kind: 'stair-headroom', id: stair.id, levelId: stair.fromLevelId,
        status: 'insufficient-data', reason: 'requires-overhead-obstacle-profile' });
    }
    return { status: 'indicative', findings, surfaces: Surface.home(source),
      setback: footprintSetback(levels[0].project, source.site, setbackMm) };
  }

  const api = { inspectPlan };
  if (node) module.exports = api;
  else root.RubikLabPlanValidator = api;
})(globalThis);
