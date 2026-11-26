'use strict';
// OP-07 · S7 · Puerta de guardado del camino de escritura F0.2b: Core.saveGate entre la última revisión CONFIRMADA y la
// siguiente, con la intención de cada paso de edición (editIntent) compuesta desde esa revisión (composeIntent).
const test=require('node:test'),assert=require('node:assert/strict');
const Core=require('../js/project-core.js'),Walls=require('../js/wall-geometry-core.js'),F=require('./op07/fixtures.cjs');
const J=JSON.stringify,proj=(b,a)=>[{kind:'project',before:b===null?null:J(b),after:J(a)}];
const steps=list=>list.reduce((acc,[b,a,o])=>Core.composeIntent(acc,Core.editIntent(b,a,o)),{});
const gate=(b,a,intent,o={})=>Core.saveGate(proj(b,a),{intent,...o});
const curvedProject=()=>F.curved(F.base(),{withOpening:true});

test('S7 · un v1 nunca se rechaza por pérdida: borrar muros y huecos rectos sigue igual que hoy',()=>{
 const p=Core.initial(),q=Core.clone(p);q.walls.splice(0,1);q.openings=q.openings.filter(o=>q.walls.some(w=>w.id===o.wallId));
 assert.deepEqual(gate(p,q,{}),{ok:true,issues:[]},'sin intención');
 assert.equal(Core.saveGate(proj(p,q),{writerFeatures:[]}).ok,true,'un escritor sin rasgos nuevos guarda un v1');
});

test('S7 · una edición genérica que pierde la curva o la pendiente se rechaza; la operación explícita no',()=>{
 const {project:p,wall:w}=curvedProject(),q=Core.clone(p),qw=q.walls.find(x=>x.id===w.id);delete qw.curve;
 assert.deepEqual(gate(p,q,steps([[p,q]])).issues.map(i=>i.code),['curve-lost']);
 const r=Core.setWallCurve(p,w.id,null);assert.ok(r.ok);assert.equal(gate(p,r.project,steps([[p,r.project,{op:r.intent}]])).ok,true,'Enderezar');
 const s=F.sloped(F.base(),{heightEndMm:2300}),t=Core.clone(s.project);delete t.walls.find(x=>x.id===s.wall.id).heightEndMm;
 assert.deepEqual(gate(s.project,t,steps([[s.project,t]])).issues.map(i=>i.code),['slope-lost']);
 const lv=Core.setWallEndHeight(s.project,s.wall.id,null);assert.ok(lv.ok);assert.equal(gate(s.project,lv.project,steps([[s.project,lv.project,{op:lv.intent}]])).ok,true,'Nivelar');
});

test('S7 · intención compuesta por pasos: dividir y borrar una pieza, dividir dos veces, borrar el muro curvo',()=>{
 const {project:p,wall:w}=F.curved(F.base(),{withOpening:false}),L=Core.wallLength(w);
 const a=Core.splitWall(p,w.id,L/2,{newId:'wal_pieza2'}),b=Core.splitWall(a.project,'wal_pieza2',300,{newId:'wal_pieza3'});
 assert.equal(gate(p,b.project,steps([[p,a.project,{op:a.intent}],[a.project,b.project,{op:b.intent}]])).ok,true,'dos divisiones');
 const c=Core.clone(a.project);c.walls=c.walls.filter(x=>x.id!=='wal_pieza2');
 assert.equal(gate(p,c,steps([[p,a.project,{op:a.intent}],[a.project,c]])).ok,true,'dividir y borrar una pieza');
 const d=Core.clone(p);d.walls=d.walls.filter(x=>x.id!==w.id);assert.equal(gate(p,d,steps([[p,d]])).ok,true,'borrar el muro curvo es intencionado');
 // Sin intención, desaparecer la pieza que conserva el id original es perder el muro curvo: se nombra.
 const e=Core.clone(a.project);e.walls=e.walls.filter(x=>x.id!==w.id);assert.deepEqual(gate(p,e,{}).issues.map(i=>i.code),['wall-lost']);
});

test('S7 · deshacer y rehacer restauran un estado de la persona: nunca se bloquean',()=>{
 const p=F.base(),w=F.longest(p),cur=Core.setWallCurve(p,w.id,{x:(w.start.x+w.end.x)/2+300,y:(w.start.y+w.end.y)/2+900});assert.ok(cur.ok,cur.explanation);
 // Curvado ya confirmado; deshacer lo deja recto.
 assert.equal(gate(cur.project,p,steps([[cur.project,p,{restore:true}]])).ok,true,'deshacer el curvado');
 assert.equal(gate(cur.project,p,steps([[cur.project,p]])).ok,false,'la misma pérdida sin ser un deshacer se rechaza');
 const s=Core.splitWall(cur.project,w.id,1000,{newId:'wal_pieza2'});
 assert.equal(gate(s.project,cur.project,steps([[s.project,cur.project,{restore:true}]])).ok,true,'deshacer la división');
 assert.equal(gate(cur.project,s.project,steps([[cur.project,s.project,{restore:true}]])).ok,true,'rehacer la división');
});

test('S7 · escritor antiguo, vista degradada, ilegible y reglas del muro',()=>{
 const {project:p}=curvedProject();
 assert.deepEqual([...new Set(Core.saveGate(proj(p,p),{writerFeatures:[]}).issues.map(i=>i.code))],['writer-lacks-feature'],'un escritor que no conoce la curva no guarda un 2.0');
 assert.deepEqual(Core.saveGate([{kind:'project',before:J(p),after:'{'}]).issues.map(i=>i.code),['unreadable']);
 const bad=Core.clone(p),bw=bad.walls.find(Walls.isCurved);bw.curve.control={...bw.start};
 assert.ok(gate(p,bad,{}).issues.some(i=>i.code==='invalid-wall'),'una curva que se pliega');
 const deg=Core.clone(p);deg.walls=deg.walls.map(w=>Walls.isCurved(w)?Walls.legacyView(w).wall:w);
 // En memoria la marca de vista degradada lo impide; por JSON la marca se pierde y queda la pérdida de contenido.
 assert.throws(()=>Walls.assertSavable(deg),/degraded/);
 assert.deepEqual([...new Set(gate(p,JSON.parse(J(deg)),{}).issues.map(i=>i.code))],['curve-lost'],'la vista simplificada no se guarda por JSON');
});

test('S7 · biblioteca y edificios: cada proyecto contra su versión confirmada; quitar un proyecto entero no es perder un muro',()=>{
 const {project:p,wall:w}=curvedProject(),q=Core.clone(p);delete q.walls.find(x=>x.id===w.id).curve;
 const lib=(...ps)=>J({version:1,activeId:'x',entries:ps.map((pr,i)=>({id:'ent'+i,name:'E'+i,project:pr}))});
 const bld=pr=>J({version:1,activeId:'b',entries:[{id:'bld',name:'B',kind:'building',building:{levels:[{id:'lvl',project:pr}]}}]});
 assert.deepEqual(Core.saveGate([{kind:'library',before:lib(p),after:lib(q)}]).issues.map(i=>i.code),['curve-lost']);
 assert.deepEqual(Core.saveGate([{kind:'library',before:bld(p),after:bld(q)}]).issues.map(i=>i.code),['curve-lost'],'planta de un edificio');
 const other=Core.clone(Core.initial());other.id='prj_otro00000000000000000000000000';
 assert.equal(Core.saveGate([{kind:'library',before:lib(p,other),after:lib(other)}]).ok,true,'quitar el proyecto entero');
 assert.equal(Core.saveGate([{kind:'library',before:null,after:lib(p)}]).ok,true,'primera escritura (importación o proyecto nuevo)');
 assert.equal(Core.saveGate([{kind:'library',before:lib(q),after:lib(p)}],{restore:true}).ok,true,'recuperación de una versión');
});

test('S7 · la abertura al final de la trayectoria se guarda con la MISMA política que validate (WALL_PATH)',()=>{
 const p=F.lone({start:{x:0,y:0},end:{x:6000,y:0},control:{x:3000,y:-3000}}),w=p.walls[0],q=Core.clone(p);
 q.openings=[{id:'opn_endwin',wallId:w.id,kind:'window',offsetMm:Math.floor(Core.wallLength(w))-1201,widthMm:1200,heightMm:1000,sillHeightMm:900}];
 Core.validate(q);assert.equal(gate(p,q,steps([[p,q]])).ok,true);
});
