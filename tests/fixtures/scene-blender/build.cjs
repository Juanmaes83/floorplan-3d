'use strict';
// OP-10 (origen: labs/sculpt/op-10/fixtures/build.cjs, sin cambios de contenido) · fixtures SINTÉTICOS (no son planos reales). Deterministas: IDs y fechas fijos, sin imágenes.
// Uso: node tests/fixtures/scene-blender/build.cjs DESTINO-NUEVO
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const Core = require(path.join(root, 'js/project-core.js')), L = require(path.join(root, 'js/room-layout.js'));
const Reference = require(path.join(root, 'js/reference-project.js')), B = require(path.join(root, 'js/building-core.js'));
const { rotated } = require(path.join(root, 'scripts/offline-pilot/irregular-fixture.cjs'));
const STAMP = '2026-11-19T00:00:00.000Z';
const stamp = p => { p.createdAt = p.updatedAt = STAMP; return p; };

function f1Rectangular() { // 1 · vivienda rectangular: una estancia 5,0 × 4,0 m, una puerta y una ventana
  let p = L.blank('OP-10 F1 rectangular (sintético)'); p.id = 'prj_op10-f1-rect';
  p = L.create(p, { name: 'Estancia', width: 5000, depth: 4000, x: 0, y: 0 }).project;
  // room-layout coloca los muros en su eje (±120 mm) y genera IDs aleatorios: se fijan para que el fixture sea determinista.
  const side = w => w.start.x === w.end.x ? (w.start.x < 0 ? 'w' : 'e') : (w.start.y < 0 ? 'n' : 's');
  for (const w of p.walls) w.id = 'wal_op10-f1-' + side(w);
  p.rooms[0].id = 'rom_op10-f1'; for (const o of p.objects) o.roomId = 'rom_op10-f1';
  const south = p.walls.find(w => w.id === 'wal_op10-f1-s'), east = p.walls.find(w => w.id === 'wal_op10-f1-e');
  p.openings.push({ id: 'opn_op10-f1-door', kind: 'door', wallId: south.id, offsetMm: 600, widthMm: 900, heightMm: 2100, sillHeightMm: 0 });
  p.openings.push({ id: 'opn_op10-f1-window', kind: 'window', wallId: east.id, offsetMm: 1400, widthMm: 1200, heightMm: 1200, sillHeightMm: 900 });
  Core.validate(p, { strict: true }); return stamp(p);
}
function f2Rotated() { // 2 · asimétrica con muros girados: el ejemplo girado 30° (ningún muro alineado con los ejes)
  const p = rotated(30, Core.clone(Reference)).project; p.id = 'prj_op10-f2-rot30'; Core.validate(p); return stamp(p);
}
function f3Openings() { // 3 · puertas, ventanas y huecos: muro diagonal, huecos solapados y un recurso no autorizado
  const p = Core.clone(require(path.join(root, 'tests/fixtures/blender-asymmetric.synthetic.json'))); p.id = 'prj_op10-f3-openings'; Core.validate(p); return stamp(p);
}
function f5Furniture() { // 5 · mobiliario procedimental (ejemplo, 46 objetos) + un recurso de catálogo autorizado (MIT)
  const p = Core.clone(Reference); p.id = 'prj_op10-f5-furniture';
  const bench = require(path.join(root, 'tests/fixtures/blender-asymmetric.synthetic.json')).objects.find(o => o.id === 'obj_catalog-bench');
  const living = p.rooms.find(r => /客厅|living/i.test(r.name + r.id)) || p.rooms[0];
  const xs = living.polygon.map(v => v.x), ys = living.polygon.map(v => v.y);
  p.objects.push({ ...Core.clone(bench), id: 'obj_op10-catalog-bench', roomId: living.id, rotationDeg: 0, elevationMm: 0,
    position: { x: Math.round((Math.min(...xs) + Math.max(...xs)) / 2), y: Math.round(Math.min(...ys) + 700) } });
  Core.validate(p); return stamp(p);
}
function f4Building() { // 4 · edificio de dos plantas con escalera (fixture del repositorio, sin imágenes de referencia)
  const { building } = require(path.join(root, 'tests/fixtures/building-fixture.cjs')).build();
  const b = Core.clone(building); b.id = 'bld_op10-f4-building';
  // Sin imágenes de referencia, la escala no puede citar su calibración: se declara estimada (honesto para un sintético).
  for (const l of b.levels) { delete l.project.sourceImages; l.project.scale = { confidence: 'estimated', method: 'template' }; l.project.createdAt = l.project.updatedAt = STAMP; }
  B.validate(b); return stableIds(b);
}
// IDs aleatorios de room-layout → IDs estables por orden de aparición (todas las referencias cruzadas se reescriben a la vez).
function stableIds(doc) {
  const map = new Map(), json = JSON.stringify(doc).replace(/\b(wal|rom)_[0-9a-f]{32}\b/g, id => { if (!map.has(id)) map.set(id, `${id.slice(0, 3)}_op10-${String(map.size + 1).padStart(3, '0')}`); return map.get(id); });
  const out = JSON.parse(json); if (out.levels) B.validate(out); else Core.validate(out); return out;
}

function f6R02R03() { // 6 · R02-A (elemento de techo) + R03 (interior de armario) con sus APIs reales, sobre el ejemplo
  const B2 = require(path.join(root, 'js/r02a-ceiling-bridge.js')), B3 = require(path.join(root, 'js/r03-cabinet-bridge.js'));
  let p = Core.clone(Reference); p.id = 'prj_op10-f6-r02r03';
  const s3 = B3.open(p, 'obj_template-004'); if (!s3.session) throw Error('R03: no session for the wardrobe');
  const r3 = B3.save(p, s3.session); if (!r3.ok) throw Error('R03: ' + (r3.explanation || []).join(' ')); p = r3.project;
  const ref = B2.setReference(p, { scope: 'project', clearHeightMm: 2600, reference: 'finished-floor', source: 'medición sintética de prueba' });
  if (!ref.ok) throw Error('R02-A reference: ' + JSON.stringify(ref.issues || ref.explanation)); p = ref.project;
  const lamp = B2.confirm(p, { id: 'cei_op10-1', type: 'pendant', position: { x: 8300, y: 2300 }, size: { widthMm: 400, depthMm: 400, heightMm: 600 }, dropMm: 0 }, { confirmedAt: STAMP });
  if (!lamp.ok) throw Error('R02-A lamp: ' + JSON.stringify(lamp.issues || lamp.explanation)); p = lamp.project;
  for (const e of (p.extensions['x-r03-cabinet'] || {}).entries || []) if (e.updatedAt) e.updatedAt = STAMP; // R03 sella con la hora real
  Core.validate(p); return stamp(p);
}
function f7Curved() { // 7 · OP-07: muro curvo (con puerta) dividido en dos piezas + muro inclinado (con ventana), con las operaciones del núcleo
  let p = f1Rectangular(); p.id = 'prj_op10-f7-curved'; p.name = 'OP-10 F7 curvo e inclinado (sintético)';
  const s = p.walls.find(w => w.id === 'wal_op10-f1-s'), e = p.walls.find(w => w.id === 'wal_op10-f1-e');
  const mx = (s.start.x + s.end.x) / 2, my = (s.start.y + s.end.y) / 2;
  const curve = Core.setWallCurve(p, s.id, { x: Math.round(mx), y: Math.round(my + 1400) }); if (!curve.ok) throw Error('f7 curve: ' + curve.explanation); p = curve.project;
  const split = Core.splitWall(p, s.id, 2600, { newId: 'wal_op10-f7-s2' }); if (!split.ok) throw Error('f7 split: ' + split.explanation); p = split.project;
  const slope = Core.setWallEndHeight(p, e.id, 2300); if (!slope.ok) throw Error('f7 slope: ' + slope.explanation); p = slope.project;
  Core.validate(p); return stamp(p);
}
function build(dest) {
  if (fs.existsSync(dest)) throw Error('Refusing overwrite: ' + dest);
  fs.mkdirSync(dest, { recursive: true });
  const out = { 'f1-rect.json': f1Rectangular(), 'f2-rot30.json': f2Rotated(), 'f3-openings.json': f3Openings(), 'f4-building.json': f4Building(), 'f5-furniture.json': f5Furniture(), 'f6-r02r03.json': f6R02R03(), 'f7-curved.json': f7Curved() };
  for (const [name, doc] of Object.entries(out)) fs.writeFileSync(path.join(dest, name), JSON.stringify(doc, null, 1) + '\n', { flag: 'wx' });
  return Object.keys(out);
}
module.exports = { build, f1Rectangular, f2Rotated, f3Openings, f4Building, f5Furniture, f6R02R03, f7Curved };
if (require.main === module) { const dest = process.argv[2]; if (!dest) { console.error('Uso: node build.cjs DESTINO-NUEVO'); process.exit(1); } console.log(build(path.resolve(dest)).join('\n')); }
