// Phase C1: quantity schedules present FloorPlanQuantities (7A) without measuring again: totals match the engine,
// unavailable figures stay null, walls are split by lifecycle, openings by kind and size, and the CSV is written for
// a Spanish spreadsheet (BOM, «;», decimal comma).
const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../js/quantity-schedule-core.js'),Q=require('../js/quantity-core.js'),project=require('../js/reference-project.js');
const L={section:'Apartado',item:'Elemento',quantity:'Cantidad',unit:'Unidad',detail:'Detalle',status:'Estado',rooms:'Estancias',floors:'Pavimentos',walls:'Muros',openings:'Carpinterías',furniture:'Mobiliario',perimeter:'perímetro',wallNet:'paredes netas',excluded:'fuera del cómputo',segments:'tramos',faceNet:'cara neta',statusText:s=>({measured:'Medido',estimated:'Estimado',unavailable:'No disponible'})[s]||'',wallStatus:s=>s,kind:k=>k};
test('totals and tables come from the quantity engine',()=>{
 const s=S.build(project),h=Q.home(project).quantities;
 assert.equal(s.totals.floorM2,S.round(h.floor.areaM2));assert.equal(s.totals.walls.lengthM,S.round(h.walls.wallLength.value));assert.equal(s.totals.openings,project.openings.length);
 assert.equal(s.rooms.length,project.rooms.length);assert.ok(Math.abs(s.floors.reduce((n,f)=>n+f.areaM2,0)-s.rooms.reduce((n,r)=>n+r.floorM2,0))<0.05,'finishes cover every room, also those outside the usable area');
 assert.equal(s.openings.reduce((n,o)=>n+o.count,0),project.openings.length);assert.equal(s.furniture.reduce((n,f)=>n+f.count,0),project.objects.length);
 assert.deepEqual(s.walls.map(w=>w.lifecycle),['existing']);
});
test('new and demolished walls are separated; unavailable stays null',()=>{
 const p=structuredClone(project);p.walls[0].status='demolished';p.walls[1].status='new';
 const s=S.build(p);assert.deepEqual(s.walls.map(w=>w.lifecycle),['existing','new','demolished']);
 const broken=structuredClone(project);broken.rooms[0].polygon=[{x:0,y:0},{x:1,y:1}];const r=S.build(broken).rooms.find(x=>x.id===broken.rooms[0].id);assert.equal(r.floorM2,null);assert.equal(r.status,'unavailable');
});
test('CSV for a Spanish spreadsheet',()=>{
 const text=S.csv(S.build(project),L);assert.ok(text.startsWith('﻿Apartado;Elemento;Cantidad;Unidad;Detalle;Estado\r\n'));
 assert.match(text,/\r\nEstancias;主卧室;12,37;m2;perímetro 14,08 m · paredes netas 31,36 m2 · 橡木地板;Estimado\r\n/);
 assert.match(text,/\r\nCarpinterías;door 89×210 cm;2;ud;;\r\n/);
});
