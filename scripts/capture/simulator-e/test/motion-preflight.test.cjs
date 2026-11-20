// E · preflight temporal: SAT, intervalos separados, continuidad entre muestras, cobertura incompleta, contactos
// permitidos con motivo, tolerancias justificadas y obstáculos alineados con el visor de RUBIK (huecos y alturas).
const { test } = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const P = require('../src/motion-preflight.cjs'), R = require('../src/rubik-obstacles.cjs');
const RUBIK = path.resolve(process.env.RUBIK_ROOT || path.join(__dirname, '../../../../floorplan-3d'));
const Core = require(path.join(RUBIK, 'js/project-core.js')), Reference = require(path.join(RUBIK, 'js/reference-project.js'));
const wall = { id: 'w', kind: 'wall', box: P.obb({ center: [0, 1, 0], half: [0.06, 1, 2] }) };
const sphere = (f, radius = 0.15) => ({ id: 'cam', at: t => ({ kind: 'sphere', center: f(t), radius }) });

test('SAT: solape, separación, contacto sin penetración y caso girado donde una AABB mentiría', () => {
  const a = P.obb({ center: [0, 0, 0], half: [1, 1, 1] });
  assert.equal(P.obbIntersects(a, P.obb({ center: [1.5, 0, 0], half: [1, 1, 1] })), true);
  assert.equal(P.obbIntersects(a, P.obb({ center: [2.5, 0, 0], half: [1, 1, 1] })), false);
  assert.equal(P.obbIntersects(a, P.obb({ center: [2, 0, 0], half: [1, 1, 1] })), false, 'touching is not a collision');
  assert.equal(P.obbIntersects(a, P.obb({ center: [2.2, 0, 2.2], half: [1, 1, 1], yaw: Math.PI / 4 })), false);
  assert.equal(P.obbIntersects(a, P.obb({ center: [2.2, 0, 2.2], half: [Math.SQRT2, 1, Math.SQRT2] })), true, 'its axis-aligned bound does overlap');
  assert.equal(P.pointObbDistance([0, 0, 0], a), 0); assert.ok(Math.abs(P.pointObbDistance([3, 0, 0], a) - 2) < 1e-12);
  assert.ok(P.obb({ center: [0, 0, 0], half: [1, 1, 1], inset: 0.001 }).half.every(h => Math.abs(h - 0.999) < 1e-12), 'absolute inset, not a percentage');
  assert.throws(() => P.obb({ center: [0, NaN, 0], half: [1, 1, 1] }), e => e.code === 'OBB');
});

test('tolerancias: el radio de cámara se deriva del plano cercano del visor (near 0,05 m, FOV 45°), no es arbitrario', () => {
  const r = P.cameraRadius({ fovDeg: 45, aspect: 1.6 }), t = Math.tan(Math.PI / 8);
  assert.ok(Math.abs(r - 0.05 * Math.sqrt(1 + t * t * (1 + 1.6 * 1.6))) < 1e-12); assert.ok(r > 0.06 && r < 0.065, String(r)); // ≈ 0,0635 m: el plano cercano entero cabe en 6,4 cm
  assert.ok(P.cameraRadius({ fovDeg: 45, aspect: 1.6, margin: 0.1 }) > r);
  assert.throws(() => P.cameraRadius({ fovDeg: 0 }), e => e.code === 'RADIUS');
  assert.equal(P.TOLERANCES.contactToleranceM, 0.001);
});

test('intervalos: dos contactos discontinuos de la misma pareja son DOS intervalos; contactos contiguos, uno', () => {
  // Atraviesa el muro en t≈1 y vuelve a atravesarlo en t≈3 (ida y vuelta).
  const r = P.sweep({ movers: [sphere(t => [t <= 2 ? -1 + t : 3 - t, 1, 0])], statics: [wall], to: 4, step: 0.1 });
  assert.equal(r.status, 'contact'); assert.equal(r.contacts.length, 2, JSON.stringify(r.contacts));
  assert.deepEqual(r.contacts.map(c => [c.from, c.to]), [[0.8, 1.2], [2.8, 3.2]]);
  assert.ok(r.contacts.every(c => c.samples === 5 && c.mover === 'cam' && c.obstacle === 'w' && c.obstacleKind === 'wall'));
});

test('continuidad: una cámara rápida que salta el muro ENTRE muestras se detecta (el donante no lo veía)', () => {
  // Paso 1 s, de x=−3 a x=+3: ninguna muestra cae dentro del muro, pero el segmento lo cruza.
  const fast = sphere(t => [-3 + 6 * t, 1, 0]), r = P.sweep({ movers: [fast], statics: [wall], times: [0, 1] });
  assert.equal(r.status, 'contact'); assert.equal(r.contacts[0].betweenSamples, true);
  const donorLike = P.sweep({ movers: [{ ...fast, continuous: false }], statics: [wall], times: [0, 1] });
  assert.equal(donorLike.status, 'clear', 'point sampling alone misses it: that is the limitation being fixed');
  // Cajas móviles: subdivisión adaptativa cuando el desplazamiento entre muestras supera maxStepM.
  const cart = { id: 'cart', at: t => ({ kind: 'obb', center: [-3 + 6 * t, 1, 0], half: [0.2, 0.2, 0.2] }) };
  assert.equal(P.sweep({ movers: [cart], statics: [wall], times: [0, 1] }).status, 'contact');
});

test('cobertura: si faltan poses el resultado es INCOMPLETO, nunca favorable', () => {
  const holes = { id: 'cam', at: t => (t === 0.5 ? null : { kind: 'sphere', center: [5, 1, 5], radius: 0.1 }) };
  const r = P.sweep({ movers: [holes], statics: [wall], times: [0, 0.5, 1] });
  assert.equal(r.status, 'incomplete'); assert.equal(r.ok, false); assert.deepEqual(r.coverage.missing, [{ mover: 'cam', t: 0.5 }]);
  const nan = { id: 'cam', at: () => ({ kind: 'sphere', center: [NaN, 1, 0], radius: 0.1 }) };
  assert.equal(P.sweep({ movers: [nan], statics: [wall], times: [0] }).status, 'incomplete');
  // Una caja móvil sin pose intermedia y gran desplazamiento: hueco declarado.
  const jump = { id: 'cart', at: t => (t === 0 || t === 1 ? { kind: 'obb', center: [10 + 6 * t, 1, 0], half: [0.2, 0.2, 0.2] } : null) };
  const g = P.sweep({ movers: [jump], statics: [wall], times: [0, 1] });
  assert.equal(g.status, 'incomplete'); assert.equal(g.coverage.gaps[0].reason, 'pose not available between samples');
  assert.throws(() => P.sweep({ movers: [jump], statics: [wall], times: [1, 0] }), e => e.code === 'INPUT');
  assert.throws(() => P.sweep({ movers: [], statics: [wall], times: [0] }), e => e.code === 'INPUT');
});

test('contactos permitidos: exigen motivo y quedan REGISTRADOS con él, no ocultos', () => {
  const m = sphere(t => [-1 + t, 1, 0]);
  assert.throws(() => P.sweep({ movers: [m], statics: [wall], to: 2, allow: [{ mover: 'cam', obstacle: 'w' }] }), e => e.code === 'ALLOW');
  const r = P.sweep({ movers: [m], statics: [wall], to: 2, step: 0.1, allow: [{ id: 'aerial', mover: 'cam', obstacle: 'w', reason: 'vista aérea: el corte de muros del visor los oculta' }] });
  assert.equal(r.status, 'clear'); assert.equal(r.contacts.length, 0);
  assert.equal(r.allowedContacts.length, 1); assert.equal(r.allowedContacts[0].reason, 'vista aérea: el corte de muros del visor los oculta'); assert.equal(r.allowedContacts[0].allowId, 'aerial');
});

test('RUBIK: puertas, dinteles, vidrio de ventana y muros desde FloorPlanCore.geometry', () => {
  const p = Core.clone(Reference), g = Core.geometry(p), radius = P.cameraRadius({ aspect: 1.6 });
  const cross = (w, s, y) => { const u = [w.end.x - w.start.x, w.end.y - w.start.y], L = Math.hypot(...u), m = [w.start.x + u[0] / L * s, w.start.y + u[1] / L * s], n = [-u[1] / L, u[0] / L];
    return { id: 'cam', at: t => { const k = -800 + 1600 * t; return { kind: 'sphere', center: [(m[0] + n[0] * k - g.center.x) / 1000, y, (m[1] + n[1] * k - g.center.y) / 1000], radius }; } }; };
  const run = (mv, opts) => P.sweep({ movers: [mv], statics: R.obstacles(p, { Core, ...opts }).obstacles, to: 1, step: 0.05 });
  const door = p.openings.find(o => o.kind === 'door'), dw = p.walls.find(x => x.id === door.wallId), mid = door.offsetMm + door.widthMm / 2;
  assert.equal(run(cross(dw, mid, 1.2)).status, 'clear', 'through an open door at 1.2 m');
  const closed = run(cross(dw, mid, 1.2), { doors: 'closed' });
  assert.equal(closed.status, 'contact'); assert.ok(closed.contacts.some(c => c.obstacleKind === 'door-leaf'));
  assert.equal(run(cross(dw, mid, 1.2), { doors: { [door.id]: 'closed' } }).status, 'contact', 'per-door state');
  const lintel = run(cross(dw, mid, (door.heightMm + 300) / 1000));
  assert.ok(lintel.contacts.some(c => c.obstacle.includes('@head:' + door.id)), JSON.stringify(lintel.contacts));
  const win = p.openings.find(o => o.kind === 'window'), ww = p.walls.find(x => x.id === win.wallId);
  const glass = run(cross(ww, win.offsetMm + win.widthMm / 2, (win.sillHeightMm + win.heightMm / 2) / 1000));
  assert.equal(glass.status, 'contact'); assert.ok(glass.contacts.some(c => c.obstacleKind === 'glazing'), 'a camera does not fly through a window');
  const { passages, assumptions } = R.obstacles(p, { Core });
  assert.ok(passages.some(x => x.kind === 'door' && x.state === 'open')); assert.equal(assumptions.doors, 'open');
  assert.throws(() => R.obstacles(p, { Core, doors: 'ajar' }), e => e.code === 'DOORS');
});

test('RUBIK: alturas y elevaciones con las reglas del visor (heightMm declarado reescala desde la elevación)', () => {
  const p = Core.clone(Reference), heights = { sofa: 850 };
  p.objects = [
    { id: 'obj_a', type: 'sofa', name: 'a', position: { x: 1000, y: 1000 }, rotationDeg: 0, size: { widthMm: 2000, depthMm: 900, heightMm: 800 } },
    { id: 'obj_b', type: 'sofa', name: 'b', position: { x: 1000, y: 1000 }, rotationDeg: 0, size: { widthMm: 2000, depthMm: 900 } },
    { id: 'obj_c', type: 'acwall', name: 'c', position: { x: 1000, y: 1000 }, rotationDeg: 0, size: { widthMm: 900, depthMm: 250 } },
    { id: 'obj_d', type: 'acwall', name: 'd', position: { x: 1000, y: 1000 }, rotationDeg: 0, elevationMm: 1500, size: { widthMm: 900, depthMm: 250, heightMm: 300 } },
    { id: 'obj_e', type: 'rug', name: 'e', position: { x: 1000, y: 1000 }, rotationDeg: 0, size: { widthMm: 2000, depthMm: 900 } },
  ];
  const objs = Object.fromEntries(R.obstacles(p, { Core, heights }).obstacles.filter(o => o.kind === 'object').map(o => [o.entity, o]));
  const span = o => [+(o.box.center[1] - o.box.half[1]).toFixed(4), +(o.box.center[1] + o.box.half[1]).toFixed(4)];
  assert.deepEqual(span(objs.obj_a), [0.001, 0.799]); assert.equal(objs.obj_a.heightSource, 'declared');
  assert.deepEqual(span(objs.obj_b), [0.001, 0.849]); assert.equal(objs.obj_b.heightSource, 'catalog');
  assert.deepEqual(span(objs.obj_c), [2.201, 2.499]); assert.equal(objs.obj_c.heightSource, 'viewer-native');
  assert.deepEqual(span(objs.obj_d), [1.501, 1.799], 'declared height starts at the declared elevation, as the viewer rescales it');
  assert.equal(objs.obj_e, undefined, 'rugs cover the floor');
});
