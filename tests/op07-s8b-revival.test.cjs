'use strict';
// OP-07 v5 · Regresión (Codex, cierre-v4-d @ 3eee6937): reintroducir una forma revoca el permiso anterior de perderla,
// también dentro del MISMO lote. Curva y su equivalente de inclinación; positivos conservados.
const test=require('node:test'),assert=require('node:assert/strict');
const F=require('./op07/fixtures.cjs'),C=require('../js/project-core.js'),J=JSON.stringify;
const lot=steps=>steps.reduce((acc,[b,a,o])=>C.composeIntent(acc,C.editIntent(b,a,o)),{});
const gate=(b,a,intent)=>C.saveGate([{kind:'project',before:J(b),after:J(a)}],{intent});

test('v5 · enderezar → volver a curvar → pérdida genérica en un lote: rechazado (curve-lost)',()=>{
 const {project:p0,wall:w}=F.curved(F.base(),{withOpening:false}),s=C.setWallCurve(p0,w.id,null);
 const mid=s.project.walls.find(x=>x.id===w.id),c=C.setWallCurve(s.project,w.id,{x:Math.round((mid.start.x+mid.end.x)/2+150),y:Math.round((mid.start.y+mid.end.y)/2+500)});assert.ok(c.ok,c.explanation);
 const lost=C.clone(c.project);delete lost.walls.find(x=>x.id===w.id).curve;
 const intent=lot([[p0,s.project,{op:s.intent}],[s.project,c.project,{op:c.intent}],[c.project,lost]]);
 assert.deepEqual(gate(p0,lost,intent).issues.map(i=>i.code),['curve-lost']);
 assert.equal(gate(p0,s.project,lot([[p0,s.project,{op:s.intent}]])).ok,true,'positivo: enderezar explícitamente sigue confirmándose');
});

test('v5 · equivalente de inclinación: nivelar → volver a inclinar → pérdida genérica en un lote: rechazado (slope-lost)',()=>{
 const {project:p0,wall:w}=F.sloped(F.base(),{heightEndMm:2300}),l=C.setWallEndHeight(p0,w.id,null),r=C.setWallEndHeight(l.project,w.id,2400);assert.ok(l.ok&&r.ok);
 const lost=C.clone(r.project);delete lost.walls.find(x=>x.id===w.id).heightEndMm;
 assert.deepEqual(gate(p0,lost,lot([[p0,l.project,{op:l.intent}],[l.project,r.project,{op:r.intent}],[r.project,lost]])).issues.map(i=>i.code),['slope-lost']);
 assert.equal(gate(p0,l.project,lot([[p0,l.project,{op:l.intent}]])).ok,true,'positivo: nivelar explícitamente');
});

test('v5 · volver a curvar con una edición genérica (no solo con la operación) también revoca',()=>{
 const {project:p0,wall:w}=F.curved(F.base(),{withOpening:false}),s=C.setWallCurve(p0,w.id,null),again=C.clone(s.project);
 again.walls.find(x=>x.id===w.id).curve=C.clone(p0.walls.find(x=>x.id===w.id).curve);
 const lost=C.clone(again);delete lost.walls.find(x=>x.id===w.id).curve;
 assert.deepEqual(gate(p0,lost,lot([[p0,s.project,{op:s.intent}],[s.project,again],[again,lost]])).issues.map(i=>i.code),['curve-lost']);
});

test('v5 · un muro con forma que reaparece revoca su permiso de borrado; positivos de división y deshacer intactos',()=>{
 const {project:p0,wall:w}=F.curved(F.base(),{withOpening:false}),gone=C.clone(p0);gone.walls=gone.walls.filter(x=>x.id!==w.id);
 // Un borrado dentro de un paso del editor es intención (S7). Lo que se prueba: borrar y volver a añadir en el editor, y que un
 // escritor FUERA de los pasos guarde el documento sin el muro: el permiso del primer borrado ya no vale.
 const back=C.clone(p0);
 assert.deepEqual(gate(p0,gone,lot([[p0,gone],[gone,back]])).issues.map(i=>i.code),['wall-lost'],'borrar, volver a añadir y perder fuera de los pasos');
 assert.equal(gate(p0,gone,lot([[p0,gone]])).ok,true,'positivo: borrado explícito');
 const sp=C.splitWall(p0,w.id,600,{newId:'wal_pieza0002'});assert.equal(gate(p0,sp.project,lot([[p0,sp.project,{op:sp.intent}]])).ok,true,'positivo: dividir');
 const st=C.setWallCurve(p0,w.id,null);assert.equal(gate(st.project,p0,lot([[st.project,p0,{restore:true}]])).ok,true,'positivo: deshacer un enderezado confirmado');
});
