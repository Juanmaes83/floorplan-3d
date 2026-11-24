(function (root) {
  'use strict';
  const node = typeof module === 'object';
  const Solar = node ? require('../js/solar-core.js') : root.FloorPlanSolar;
  const Openings = node ? require('../js/opening-edit.js') : root.FloorPlanOpenings;
  const Core = node ? require('../js/project-core.js') : root.FloorPlanCore;
  const Motion = node ? require('../js/motion-quality-core.js') : root.RubikMotionQuality;

  const levelsOf = source => source.levels || [{ id: null, project: source, offsetMm: { x: 0, y: 0 }, elevationMm: 0 }];
  const cross = (a, b) => a.x * b.y - a.y * b.x;
  const STEP_MINUTES = 15;

  function wallSegments(level) {
    return level.project.walls.filter(w => w.status !== 'demolished').map(w => {
      const v = { x: w.end.x - w.start.x, y: w.end.y - w.start.y };
      const length = Math.hypot(v.x, v.y);
      return { wall: w, v, length, levelId: level.id, elevation: level.elevationMm,
        a: { x: w.start.x + level.offsetMm.x, y: w.start.y + level.offsetMm.y } };
    });
  }

  function exteriorWindows(level, segments) {
    const walls = new Map(segments.map(s => [s.wall.id, s]));
    return level.project.openings.filter(o => o.kind === 'window' && walls.has(o.wallId)).flatMap(o => {
      const s = walls.get(o.wallId);
      const { left, right } = Openings.sides(level.project, o);
      const exterior = side => side.reason === 'no-room';
      const roomId = exterior(left) ? right.roomId : exterior(right) ? left.roomId : null;
      if (!roomId) return [];
      const facing = exterior(left) ? 1 : -1;
      const offset = (o.offsetMm + o.widthMm / 2) / s.length;
      return [{ id: o.id, roomId, host: s, widthMm: o.widthMm, heightMm: o.heightMm,
        center: { x: s.a.x + s.v.x * offset, y: s.a.y + s.v.y * offset },
        height: level.elevationMm + o.sillHeightMm + o.heightMm / 2,
        normal: { x: facing * s.v.y / s.length, y: -facing * s.v.x / s.length } }];
    });
  }

  function receivesBeam(window, direction, segments) {
    const normalComponent = window.normal.x * direction.x + window.normal.y * direction.y;
    if (normalComponent <= 1e-6) return false;
    // Reject rays that hit the window reveal before clearing the face of the wall.
    const displacement = window.host.wall.thicknessMm / (2 * normalComponent);
    const tangent = (window.host.v.x * direction.x + window.host.v.y * direction.y) / window.host.length;
    if (Math.abs(displacement * tangent) >= window.widthMm / 2 || displacement * direction.up >= window.heightMm / 2) return false;
    return !segments.some(s => {
      if (s === window.host) return false;
      const denominator = cross(direction, s.v);
      if (Math.abs(denominator) < 1e-6) return false;
      const delta = { x: s.a.x - window.center.x, y: s.a.y - window.center.y };
      const distance = cross(delta, s.v) / denominator;
      const fraction = cross(delta, direction) / denominator;
      if (distance <= 0.01 || fraction < 0 || fraction > 1) return false;
      const height = window.height + distance * direction.up;
      return height >= s.elevation && height <= s.elevation + s.wall.heightMm;
    });
  }

  function directSun(source, localDate) {
    const site = source.site;
    const settings = { ...site?.location, northOffsetDeg: site?.northOffsetDeg, localDate };
    const first = Solar.localInstant(localDate, '00:00', settings.timeZone);
    if (first.status !== 'available') return first;
    const nextDate = new Date(Date.parse(localDate) + 86400000).toISOString().slice(0, 10);
    const end = Solar.localInstant(nextDate, '00:00', settings.timeZone);
    if (end.status !== 'available' || Date.parse(end.instant) - Date.parse(first.instant) !== 86400000) {
      return { status: 'unavailable', reason: 'non-standard-local-day' };
    }
    const sun = [];
    for (let minute = 7; minute < 1440; minute += STEP_MINUTES) {
      const localTime = [Math.floor(minute / 60), minute % 60].map(n => String(n).padStart(2, '0')).join(':');
      const result = Solar.position({ ...settings, localTime });
      if (result.status !== 'available-orientative') return result;
      if (result.aboveHorizon) sun.push({ x: result.sceneDirection.x, y: result.sceneDirection.z, up: result.sceneDirection.y });
    }
    const levels = levelsOf(source);
    const segments = levels.map(wallSegments);
    const walls = segments.flat();
    const rooms = levels.flatMap((level, i) => {
      const windows = exteriorWindows(level, segments[i]);
      return level.project.rooms.map(room => {
        const apertures = windows.filter(w => w.roomId === room.id);
        return { levelId: level.id, roomId: room.id, windowIds: apertures.map(w => w.id),
          directHours: apertures.length ? sun.filter(d => apertures.some(w => receivesBeam(w, d, walls))).length / 4 : null };
      });
    });
    return { status: 'indicative', localDate, stepMinutes: STEP_MINUTES, rooms };
  }

  function droneFlight(source, aspect = 16 / 9) {
    if (!Number.isFinite(aspect) || aspect <= 0) throw new RangeError('Invalid aspect ratio');
    const points = levelsOf(source).flatMap(level => level.project.walls.filter(w => w.status !== 'demolished')
      .flatMap(w => Core.wallRect(w).poly.flatMap(([x, y]) => [0, w.heightMm].map(h =>
        [(x + level.offsetMm.x) / 1000, (level.elevationMm + h) / 1000, (y + level.offsetMm.y) / 1000]))));
    if (!points.length) return { status: 'unavailable', reason: 'no-walls' };
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (const point of points) point.forEach((value, i) => {
      min[i] = Math.min(min[i], value);
      max[i] = Math.max(max[i], value);
    });
    const target = max.map((value, i) => (value + min[i]) / 2);
    const halfDiagonal = Math.hypot(...max.map((value, i) => value - min[i])) / 2;
    const fov = 42;
    const halfFov = Math.min(fov * Math.PI / 360, Math.atan(Math.tan(fov * Math.PI / 360) * aspect));
    const radius = Math.max(4, halfDiagonal / Math.sin(halfFov * 0.8));
    const duration = 54;
    const pose = time => {
      const u = Math.min(1, Math.max(0, time / duration));
      const progress = u * u * (3 - 2 * u);
      const angle = -Math.PI / 4 + progress * 1.5 * Math.PI;
      const r = radius * (1.14 - 0.14 * progress);
      const y = max[1] + Math.max(2, halfDiagonal * (1.15 - 0.55 * progress));
      return { t: u * duration, position: [target[0] + r * Math.cos(angle), y, target[2] + r * Math.sin(angle)], target: [...target], fov };
    };
    const samples = Array.from({ length: 1621 }, (_, i) => pose(i / 30));
    return { status: 'preview', duration, pose, metrics: Motion.analyze(samples) };
  }

  const api = { directSun, droneFlight };
  if (node) module.exports = api;
  else root.RubikLabSunDrone = api;
})(globalThis);
