'use strict';
// OP-07 · S5 Edición (pura): curva, pendiente y división como operaciones atómicas con el mismo resultado que usa el
// editor ({ok, project, explanation}); nunca desaparece una abertura; la puerta de guardado acepta la intención.
const test=require('node:test'),assert=require('node:assert/strict');
const Core=require('../js/project-core.js'),Walls=require('../js/wall-geometry-core.js'),F=require('./op07/fixtures.cjs');
const L=w=>Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y);

test('S5 · curvar, inclinar y deshacer: el proyecto original no cambia y la versión sube a 2.0.0 solo si hace falta',()=>{
 const p=F.base();p.schemaVersion='1.12.0';const before=JSON.stringify(p),w=F.longest(p);
 const c=Core.setWallCurve(p,w.id,{x:(w.start.x+w.end.x)/2,y:(w.start.y+w.end.y)/2+900.4});assert.equal(c.ok,true);
 assert.equal(c.project.schemaVersion,'2.0.0');assert.deepEqual(c.project.walls.find(x=>x.id===w.id).curve.control.y%1,0,'punto redondeado a mm');
 assert.equal(JSON.stringify(p),before,'operación pura: el original intacto (deshacer = volver a él)');
 const s=Core.setWallEndHeight(c.project,w.id,2300);assert.equal(s.ok,true);
 const flat=Core.setWallCurve(s.project,w.id,null);assert.equal(flat.ok,true);assert.deepEqual(flat.intent,{straightened:[w.id]});
 assert.equal(Core.setWallEndHeight(flat.project,w.id,null).ok,true);
 // Rechazos atómicos y explicados.
 const tight=Core.setWallCurve(p,w.id,{x:w.start.x,y:w.start.y+200000});assert.equal(tight.ok,false);assert.match(tight.explanation[0],/curve/);
 assert.equal(Core.setWallEndHeight(p,w.id,20).ok,false);assert.equal(Core.setWallCurve(p,'wal_nope',{x:0,y:0}).code,'wall-not-found');
});

test('S5 · dividir: piezas unidas exactamente, aberturas reubicadas en su sitio y alturas conservadas',()=>{
 const {project,wall}=F.curved(F.base(),{heightEndMm:2400}),len=Core.wallLength(wall),cut=Math.round(len*.4);
 const r=Core.splitWall(project,wall.id,cut,{newId:'wal_op07-b'});assert.equal(r.ok,true,r.explanation?.join());
 const [a,b]=['first','second'].map((k,i)=>r.project.walls.find(x=>x.id===(i?'wal_op07-b':wall.id)));
 assert.deepEqual(a.end,b.start,'unidas exactamente');assert.ok(Number.isInteger(a.end.x)&&Number.isInteger(a.curve.control.x),'puntos enteros como guarda project-core');
 assert.equal(a.heightMm,wall.heightMm);assert.equal(b.heightEndMm,2400);assert.equal(a.heightEndMm,b.heightMm,'altura continua en el corte');
 assert.ok(Math.abs(Core.wallLength(a)+Core.wallLength(b)-len)<2,'longitud conservada (redondeo a mm)');
 assert.equal(r.project.openings.length,project.openings.length,'ninguna abertura desaparece');
 for(const o of project.openings.filter(x=>x.wallId===wall.id)){const n=r.project.openings.find(x=>x.id===o.id),host=r.project.walls.find(x=>x.id===n.wallId);
  const before=Walls.pathProfile(wall,Core.WALL_PATH).sample(o.offsetMm+o.widthMm/2).point,after=Walls.pathProfile(host,Core.WALL_PATH).sample(n.offsetMm+n.widthMm/2).point;
  assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<1.5,`${o.id} en su sitio (< 1,5 mm con redondeo)`);}
 assert.deepEqual(r.intent,{split:{[wall.id]:[wall.id,'wal_op07-b']}});
 assert.equal(Core.guardSave(project,r.project,{intent:r.intent}).ok,true);
});

test('S5 · dividir sobre una abertura se rechaza y la nombra; fuera del muro también se rechaza',()=>{
 const {project,wall}=F.curved(F.base()),o=project.openings.find(x=>x.id==='opn_op07-door');
 const r=Core.splitWall(project,wall.id,o.offsetMm+o.widthMm/2);assert.equal(r.ok,false);assert.equal(r.code,'opening-straddles-cut');assert.deepEqual(r.openings,[o.id]);
 assert.equal(Core.splitWall(project,wall.id,0).code,'cut-outside');assert.equal(Core.splitWall(project,wall.id,Core.wallLength(wall)+10).code,'cut-outside');
});

test('S5 · dividir un muro recto y a nivel no cambia el contrato (sigue en su versión, sin campos nuevos)',()=>{
 const p=F.base();p.schemaVersion='1.12.0';const w=F.longest(p),r=Core.splitWall(p,w.id,Math.round(L(w)/2),{newId:'wal_op07-c'});
 assert.equal(r.ok,true);assert.equal(r.project.schemaVersion,'1.12.0');assert.ok(r.project.walls.every(x=>!Core.shapedWall(x)));
 assert.equal(r.project.walls.length,p.walls.length+1);
});

test('S5 · una pérdida sin intención se detecta aunque la operación la hiciera otra parte del editor',()=>{
 const {project,wall}=F.curved(F.base());const bad=F.clone(project);delete bad.walls.find(x=>x.id===wall.id).curve;
 assert.ok(Core.guardSave(project,bad).issues.some(i=>i.code==='curve-lost'));
});
