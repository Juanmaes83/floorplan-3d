'use strict';
// OP-07 · S8 · Sondas de Codex (docs/integration/op07-a0-2026-11-20 @ 2d0cc645) convertidas en NEGATIVOS: la misma
// construcción, con el resultado seguro exigido. En la v3 «mixed», «stale» y «defaultCoreCanCreate» pasaban.
const test=require('node:test'),assert=require('node:assert/strict');
const F=require('./op07/fixtures.cjs'),C=require('../js/project-core.js'),J=JSON.stringify;
function as(state,fn){const was=globalThis.RUBIK_OP07_STATE;globalThis.RUBIK_OP07_STATE=state;try{return fn();}finally{globalThis.RUBIK_OP07_STATE=was;}}
const library=(a,b)=>J({version:1,activeId:'a',entries:[{id:'a',name:'A',project:a},{id:'b',name:'B',project:b}]});
function probe(){ // construcción idéntica a s7-intentions.cjs
 const {project:a,wall}=F.curved(F.base(),{withOpening:true}),b=C.clone(a);b.id='prj_other_house';const victim=b.walls.find(w=>w.id===wall.id);
 const explicit=C.setWallCurve(a,wall.id,null);assert.equal(explicit.ok,true);
 const first=C.editIntent(a,explicit.project,{op:explicit.intent});
 const bAfter=C.clone(b);delete bAfter.walls.find(w=>w.id===victim.id).curve;
 const second=C.editIntent(b,bAfter);
 return {a,b,wall,explicit,first,bAfter,second,input:[{kind:'library',before:library(a,b),after:library(explicit.project,bAfter)}]};}

test('Sonda «isolated»: validar B por separado rechaza curve-lost (igual que en v3)',()=>{
 const {b,bAfter,second}=probe();assert.deepEqual(C.saveGate([{kind:'project',before:J(b),after:J(bAfter)}],{intent:second}).issues.map(i=>i.code),['curve-lost']);});

test('Sonda «mixed»: el enderezado explícito de A ya NO legitima la pérdida en B (misma ID de muro)',()=>{
 const {first,second,input,b}=probe();
 assert.throws(()=>C.composeIntent(first,second),/different projects/,'no se pueden componer intenciones de proyectos distintos');
 const r=C.saveGate(input,{intents:{[first.projectId]:first,[second.projectId]:second}});
 assert.deepEqual(r.issues.map(i=>[i.code,i.projectId]),[['curve-lost',b.id]]);
 assert.equal(C.saveGate(input,{intent:first}).ok,false,'una intención plana solo vale para su proyecto');
 assert.equal(C.saveGate(input,{intent:{straightened:[probe().wall.id]}}).ok,false,'sin projectId no autoriza nada');});

test('Sonda «stale»: enderezar, deshacer y perder la curva genéricamente → rechazado (el deshacer revoca el permiso)',()=>{
 const {a,explicit,first,wall}=probe(),sameUndo=C.composeIntent(first,C.editIntent(explicit.project,a,{restore:true}));
 const lost=C.clone(a);delete lost.walls.find(w=>w.id===wall.id).curve;
 assert.deepEqual(C.saveGate([{kind:'project',before:J(a),after:J(lost)}],{intent:sameUndo}).issues.map(i=>i.code),['curve-lost']);
 // Rehacer el enderezado vuelve a llevar su propio diff (restauración explícita) y sí se confirma.
 const redo=C.composeIntent(sameUndo,C.editIntent(a,explicit.project,{restore:true}));
 assert.equal(C.saveGate([{kind:'project',before:J(a),after:J(explicit.project)}],{intent:redo}).ok,true);});

test('Sonda «restored»: la restauración explícita lleva su diff con las mismas barreras (escritor y activación)',()=>{
 const {input}=probe();assert.equal(C.saveGate(input,{restore:true}).ok,true);
 assert.ok(C.saveGate(input,{restore:true,writerFeatures:[]}).issues.some(i=>i.code==='writer-lacks-feature'),'un escritor antiguo falla cerrado');
 assert.ok(as('integrated',()=>C.saveGate(input,{restore:true})).issues.some(i=>i.code==='activation-pending'),'sin activación no se restaura un 2.0 modificado');});

test('Sonda «defaultCoreCanCreate»: con el núcleo por defecto, inclinar un muro v1 NO crea un 2.0',()=>{
 as(undefined,()=>{const v1=C.initial(),r=C.setWallEndHeight(v1,F.longest(v1).id,2300);assert.equal(r.ok,false);assert.equal(r.code,'activation-pending');assert.match(v1.schemaVersion,/^1\./);});});

test('Plantas de un edificio con IDs de muro repetidos: la intención de una planta no vale para otra',()=>{
 const {project:l0,wall}=F.curved(F.base(),{withOpening:false}),l1=C.clone(l0);l0.id='prj_planta0000000000000000000000000';l1.id='prj_planta1111111111111111111111111';
 const bld=(x,y)=>J({version:1,activeId:'b',entries:[{id:'b',name:'B',kind:'building',building:{levels:[{id:'lvl0',project:x},{id:'lvl1',project:y}]}}]});
 const s0=C.setWallCurve(l0,wall.id,null),l1b=C.clone(l1);delete l1b.walls.find(w=>w.id===wall.id).curve;
 const r=C.saveGate([{kind:'library',before:bld(l0,l1),after:bld(s0.project,l1b)}],{intents:{[l0.id]:C.editIntent(l0,s0.project,{op:s0.intent})}});
 assert.deepEqual(r.issues.map(i=>[i.code,i.projectId]),[['curve-lost',l1.id]]);});

test('Lote de pasos antes de guardar: dividir, deshacer la división y borrar la pieza original → rechazado',()=>{
 const {project:a,wall}=F.curved(F.base(),{withOpening:false}),s=C.splitWall(a,wall.id,600,{newId:'wal_pieza0002'});
 let acc=C.editIntent(a,s.project,{op:s.intent});acc=C.composeIntent(acc,C.editIntent(s.project,a,{restore:true}));   // deshacer la división
 const gone=C.clone(a);gone.walls=gone.walls.filter(w=>w.id!==wall.id);   // un escritor genérico quita el muro curvo
 assert.deepEqual(C.saveGate([{kind:'project',before:J(a),after:J(gone)}],{intent:acc}).issues.map(i=>i.code),['wall-lost'],'la división deshecha ya no explica nada');
 const del=C.composeIntent(acc,C.editIntent(a,gone));assert.equal(C.saveGate([{kind:'project',before:J(a),after:J(gone)}],{intent:del}).ok,true,'un borrado explícito posterior sí');});
