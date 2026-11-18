'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../js/project-core.js');
const Quantities = require('../js/quantity-core.js');
const { exportLevel } = require('../js/dxf-export.js');
const { dxfFromText, dxfToProject } = require('../js/plan-intake.js');
const DxfParser = require('../vendor/dxf-parser/dxf-parser.js');
const fixture = require('../docs/contracts/examples/floorplan-project-v1.example.json');
const { editVisibleWalls } = require('./fixtures/g02-dxf-edits.cjs');
const parse = source => new DxfParser().parseSync(source);
const importDxf = source => dxfFromText(source,{parse});
const cadVertices = entity => entity.vertices.map(({x,y})=>[x,y||0]);
const entities = (dxf,layer,type) => dxf.entities.filter(e=>e.layer===layer&&e.type===type);

test('G-02 writes millimetres, canonical wall faces and door swing with inverted Y', async () => {
  const project = structuredClone(fixture);
  project.walls[0].status = 'new';
  project.walls[1].status = 'demolished';
  const before = JSON.stringify(project);
  const geometry = Core.geometry(project);
  const dxf = parse(await exportLevel(project));
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

test('G-02 labels the declared scale and uses quantity-core for areas and the original dimensions', async () => {
  const project = structuredClone(fixture);
  project.scale.confidence = 'estimated';
  project.rooms[1].countsTowardArea = false;
  project.rooms[0].name = 'Salón\nprincipal\u0007';
  const dxf = parse(await exportLevel(project));
  const q = Quantities.level(project);
  const legend = entities(dxf,'LEGEND','TEXT').map(e=>e.text);
  assert.ok(legend.includes('Escala estimada'));
  assert.ok(legend.some(s=>s.endsWith(q.quantities.floor.areaM2.toFixed(2)+' m²')));
  assert.deepEqual(entities(dxf,'ROOMS','TEXT').map(e=>e.text),['Salón principal',project.rooms[1].name]);
  assert.deepEqual(entities(dxf,'SURFACES','TEXT').map(e=>e.text),q.rooms.map((r,i)=>r.floor.areaM2.toFixed(2)+' m²'+(i===1?' · No computa':'')));
  assert.ok(entities(dxf,'DIMENSIONS','TEXT').some(e=>e.text==='3760 mm'));
  assert.ok(entities(dxf,'DIMENSIONS','LINE').some(e=>JSON.stringify(cadVertices(e))==='[[3000,-120],[3000,-3880]]'));
});

test('G-02 reimports canonical wall axes, thicknesses and room polygons up to translation', async () => {
  const project = structuredClone(fixture);
  project.walls[0].start.x -= 200; // an oblique wall
  const original = await exportLevel(project);
  const {project: imported,report} = await importDxf(original.replace(/\n/g,'\r\n'));
  assert.equal(report.editedRubik,false);
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

test('G-02 handles an empty level and a room-only plan without inventing walls', async () => {
  const level = {...structuredClone(fixture), walls: [], openings: []};
  await assert.rejects(exportLevel({...level,rooms: [],objects: []}),/no tiene una planta/);
  const {project} = await importDxf(await exportLevel(level));
  assert.equal(project.walls.length,0);
  assert.equal(project.rooms.length,level.rooms.length);
  const demolition = {...structuredClone(fixture),rooms: [],objects: []};
  for(const wall of demolition.walls)wall.status='demolished';
  await assert.rejects(importDxf(await exportLevel(demolition)),/No se encontraron muros activos ni estancias/);
});

test('G-02 never takes old footprints from a changed file, an unsealed file or a parsed object', async () => {
  const original = await exportLevel(fixture);
  const edited = editVisibleWalls(original);
  assert.notEqual(edited,original);
  assert.deepEqual(entities(parse(edited),'RUBIK_WALL_FOOTPRINT','LWPOLYLINE'),
    entities(parse(original),'RUBIK_WALL_FOOTPRINT','LWPOLYLINE'),'external edit leaves the old footprints intact');
  const width = project => {
    const xs=project.walls.flatMap(w=>[w.start.x,w.end.x]);
    return Math.max(...xs)-Math.min(...xs);
  };
  const baseline=width((await importDxf(original)).project);
  for(const result of [
    await importDxf(edited),
    await importDxf(edited.replace(/\n999\nRUBIK-G02-SHA256 [^\n]+/,'')),
    dxfToProject(parse(edited)),
  ]){
    assert.equal(result.report.editedRubik,true);
    assert.ok(width(result.project)>baseline*1.8,'use changed visible walls, not their original footprints');
  }
});

test('G-02 cannot resurrect old walls when all visible wall entities have been removed', async () => {
  const original = await exportLevel(fixture);
  const edited = editVisibleWalls(original,{remove:true});
  assert.notEqual(edited,original);
  await assert.rejects(importDxf(edited),/modificado o sin verificación y no tiene muros visibles/);
  const hidden = parse(original);
  hidden.tables.layer.layers.WALLS_EXISTING.visible=false;
  assert.throws(()=>dxfToProject(hidden),/modificado o sin verificación y no tiene muros visibles/);
});
