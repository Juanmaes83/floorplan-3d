'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../js/project-core.js');
const Quantities = require('../js/quantity-core.js');
const { exportLevel } = require('../js/dxf-export.js');
const { dxfToProject } = require('../js/plan-intake.js');
const DxfParser = require('../vendor/dxf-parser/dxf-parser.js');
const fixture = require('../docs/contracts/examples/floorplan-project-v1.example.json');
const parse = project => new DxfParser().parseSync(exportLevel(project));
const cadVertices = entity => entity.vertices.map(({x,y})=>[x,y||0]);
const entities = (dxf,layer,type) => dxf.entities.filter(e=>e.layer===layer&&e.type===type);

test('G-02 writes millimetres, canonical wall faces and door swing with inverted Y', () => {
  const project = structuredClone(fixture);
  project.walls[0].status = 'new';
  project.walls[1].status = 'demolished';
  const before = JSON.stringify(project);
  const geometry = Core.geometry(project);
  const dxf = parse(project);
  assert.equal(dxf.header.$INSUNITS,4);
  assert.equal(dxf.tables.layer.layers.RUBIK_WALL_FOOTPRINT.visible,false);
  for (const [status,layer] of [['existing','WALLS_EXISTING'],['new','WALLS_NEW'],['demolished','DEMOLITION']]) {
    const polys = entities(dxf,layer,'LWPOLYLINE');
    assert.ok(polys.length>0);
    assert.ok(polys.every(p=>p.shape));
    assert.deepEqual(polys.map(cadVertices),geometry.walls.filter(w=>w.status===status).map(w=>w.poly.map(([x,y])=>[x,-y||0])));
  }
  const arcs = entities(dxf,'DOORS','ARC');
  assert.equal(arcs.length,geometry.doors.length);
  assert.ok(arcs.length>0);
  arcs.forEach((arc,i)=>{
    const {h,len} = geometry.doors[i];
    assert.deepEqual([arc.center.x,arc.center.y,arc.radius],[h[0],-h[1],len]);
    assert.ok(Math.abs((arc.endAngle-arc.startAngle+2*Math.PI)%(2*Math.PI)-Math.PI/2)<1e-9);
  });
  assert.equal(JSON.stringify(project),before);
});

test('G-02 labels the declared scale and uses quantity-core for areas and the original dimensions', () => {
  const project = structuredClone(fixture);
  project.scale.confidence = 'estimated';
  project.rooms[1].countsTowardArea = false;
  project.rooms[0].name = 'Salón\nprincipal\u0007';
  const dxf = parse(project);
  const q = Quantities.level(project);
  const legend = entities(dxf,'LEGEND','TEXT').map(e=>e.text);
  assert.ok(legend.includes('Escala estimada'));
  assert.ok(legend.some(s=>s.endsWith(q.quantities.floor.areaM2.toFixed(2)+' m²')));
  assert.deepEqual(entities(dxf,'ROOMS','TEXT').map(e=>e.text),['Salón principal',project.rooms[1].name]);
  assert.deepEqual(entities(dxf,'SURFACES','TEXT').map(e=>e.text),q.rooms.map((r,i)=>r.floor.areaM2.toFixed(2)+' m²'+(i===1?' · No computa':'')));
  assert.ok(entities(dxf,'DIMENSIONS','TEXT').some(e=>e.text==='3760 mm'));
  assert.ok(entities(dxf,'DIMENSIONS','LINE').some(e=>JSON.stringify(cadVertices(e))==='[[3000,-120],[3000,-3880]]'));
});

test('G-02 reimports canonical wall axes, thicknesses and room polygons up to translation', () => {
  const project = structuredClone(fixture);
  project.walls[0].start.x -= 200; // an oblique wall
  const {project: imported,report} = dxfToProject(parse(project));
  assert.equal(imported.scale.confidence,'estimated');
  assert.equal(report.units,'mm');
  assert.equal(report.assumedUnits,false);
  assert.equal(imported.walls.length,project.walls.length);
  assert.equal(imported.rooms.length,project.rooms.length);
  assert.deepEqual(report.roomNames,project.rooms.map(r=>r.name));
  const origin = project.walls[0].start, reimportedOrigin = imported.walls[0].start;
  const relative = (p,o) => [p.x-o.x,p.y-o.y];
  for(const [i,wall] of project.walls.entries()) {
    const actual = imported.walls[i];
    assert.deepEqual(relative(actual.start,reimportedOrigin),relative(wall.start,origin));
    assert.deepEqual(relative(actual.end,reimportedOrigin),relative(wall.end,origin));
    assert.equal(actual.thicknessMm,wall.thicknessMm);
  }
  for(const [i,room] of project.rooms.entries()) {
    assert.deepEqual(imported.rooms[i].polygon.map(p=>relative(p,reimportedOrigin)),room.polygon.map(p=>relative(p,origin)));
  }
  assert.equal(Quantities.level(imported).quantities.floor.areaM2,Quantities.level(project).quantities.floor.areaM2);
});

test('G-02 handles an empty level and a room-only plan without inventing walls', () => {
  const level = {...structuredClone(fixture), walls: [], openings: []};
  assert.throws(()=>exportLevel({...level,rooms: [],objects: []}),/no tiene una planta/);
  const {project} = dxfToProject(parse(level));
  assert.equal(project.walls.length,0);
  assert.equal(project.rooms.length,level.rooms.length);
  const demolition = {...structuredClone(fixture),rooms: [],objects: []};
  for(const wall of demolition.walls)wall.status='demolished';
  assert.throws(()=>dxfToProject(parse(demolition)),/No se encontraron muros activos ni estancias/);
});
