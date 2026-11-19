// Generates golden outputs of the donor's own functions for the RUBIK OP-07 lab (not part of the donor).
import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { wallPathProfile, wallProfileSpans, openingOnWall, buildWallSegments, roomCeilingHeight, wallPathSpans } from '$lib/utils/wallProfiles';
import { wallPlanBounds, wallPlanDimension } from '$lib/utils/wallPlanGeometry';
import { splitWallGeometry } from '$lib/utils/splitWallGeometry';
import { interiorRoomArea } from '$lib/utils/interiorArea';
import { detectRooms, getRoomPolygon } from '$lib/utils/roomDetection';

const W = (id: string, s: [number, number], e: [number, number], extra: any = {}) => ({ id, start: { x: s[0], y: s[1] }, end: { x: e[0], y: e[1] }, thickness: 15, height: 250, color: '#fff', ...extra });
const walls = [
  W('straight', [0, 0], [500, 0]),
  W('curved', [0, 0], [400, 0], { curvePoint: { x: 200, y: 150 } }),
  W('sloped', [0, 0], [600, 0], { startHeight: 250, endHeight: 120 }),
  W('curvedSloped', [100, 50], [500, 300], { curvePoint: { x: 450, y: -80 }, startHeight: 300, endHeight: 200, thickness: 20 }),
];
const doors = (wallId: string, position: number) => [{ id: 'd', wallId, position, width: 90, height: 210, type: 'single', swingDirection: 'left', flipSide: false }];
const windows = (wallId: string, position: number) => [{ id: 'w', wallId, position, width: 120, height: 100, sillHeight: 90, type: 'standard' }];

it('writes OP-07 golden outputs', () => {
  const out: any = { donor: '771c9e1ad30bd1c3cc7584d6eca74deb2e14943d', units: 'cm', walls: [] };
  for (const w of walls as any[]) {
    const path = wallPathProfile(w);
    const spans = wallProfileSpans(w, doors(w.id, 0.3) as any, windows(w.id, 0.7) as any);
    out.walls.push({
      wall: w,
      length: path.length,
      samples: [0, 0.25, 0.5, 0.75, 1].map(f => path.sample(path.length * f)),
      distanceAt: [0.3, 0.7].map(p => path.distanceAt(p)),
      bounds: wallPlanBounds(w),
      dimension: wallPlanDimension(w),
      split: splitWallGeometry(w, 0.4),
      facets: wallPathSpans(w).length,
      profile: spans.map(s => ({ from: s.from, length: s.length, startHeight: s.startHeight, endHeight: s.endHeight, segments: s.segments })),
    });
  }
  out.openingOnWall = [
    openingOnWall(600, 250, 120, 0.9, 120, 90, 100),
    openingOnWall(600, 250, 120, 0.1, 90, 0, 210),
    openingOnWall(600, 250, 120, 0.99, 120, 0, 210),
  ];
  out.straightSegments = buildWallSegments(500, 250, 250, doors('s', 0.3) as any, windows('s', 0.7) as any);
  // A closed square room of 4 straight walls and one with a curved side.
  const sq = [W('a', [0, 0], [400, 0]), W('b', [400, 0], [400, 300]), W('c', [400, 300], [0, 300]), W('d', [0, 300], [0, 0])];
  const curvedRoom = [W('a', [0, 0], [400, 0], { curvePoint: { x: 200, y: -120 } }), W('b', [400, 0], [400, 300]), W('c', [400, 300], [0, 300]), W('d', [0, 300], [0, 0])];
  for (const [name, set] of [['square', sq], ['curvedSide', curvedRoom]] as const) {
    const rooms = detectRooms(set as any);
    const poly = rooms.length ? getRoomPolygon(rooms[0], set as any) : [];
    out[name] = { rooms: rooms.length, polygonPoints: poly.length, area: rooms[0]?.area ?? null, interiorArea: poly.length ? interiorRoomArea(poly, [], set as any) : null, ceiling: roomCeilingHeight(set.map(w => w.id), set as any) };
  }
  writeFileSync(process.env.OP07_GOLDEN || 'op07-golden.json', JSON.stringify(out, null, 1));
});
