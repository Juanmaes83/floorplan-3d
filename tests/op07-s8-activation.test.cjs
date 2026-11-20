'use strict';
// OP-07 · S8 · Activación efectiva (no documental). Integrar ≠ activar: en el estado por defecto ('integrated') se LEE
// un 2.0 (lectura compatible) pero ninguna operación lo crea y ningún escritor confirma un proyecto 2.x modificado.
// Además: intenciones aisladas por proyecto (variantes y plantas comparten IDs de muro).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const F=require('./op07/fixtures.cjs'),Core=require('../js/project-core.js'),Q=require('../js/quantity-core.js'),DXF=require('../js/dxf-export.js');
const J=JSON.stringify;
function as(state,fn){const was=globalThis.RUBIK_OP07_STATE;globalThis.RUBIK_OP07_STATE=state;try{return fn();}finally{globalThis.RUBIK_OP07_STATE=was;}}
const lib=(...ps)=>J({version:1,activeId:'ent0',entries:ps.map((p,i)=>({id:'ent'+i,name:'E'+i,project:p}))});

test('S8 · el producto sale INTEGRADO, no activo: la constante de publicación es «integrated»',()=>{
 const src=fs.readFileSync(path.join(__dirname,'../js/project-core.js'),'utf8');
 assert.match(src,/const OP07_RELEASE = 'integrated';/,'activar exige un cambio de código autorizado');
 assert.equal(as(undefined,()=>Core.op07State()),'integrated');
});

test('S8 · un host desplegado no se puede activar desde la página (solo un origen de pruebas)',()=>{
 const had=Object.getOwnPropertyDescriptor(globalThis,'location');
 for(const hostname of ['floorplan-3d.vercel.app','rubik.example.com','f0-2b.localhost.evil.com']){
  Object.defineProperty(globalThis,'location',{value:{hostname},configurable:true});
  try{assert.equal(as('active',()=>Core.wallFeaturesActive()),false,hostname);}finally{if(had)Object.defineProperty(globalThis,'location',had);else delete globalThis.location;}}
 Object.defineProperty(globalThis,'location',{value:{hostname:'f0-2b.localhost'},configurable:true});
 try{assert.equal(as('active',()=>Core.wallFeaturesActive()),true,'origen de pruebas');}finally{if(had)Object.defineProperty(globalThis,'location',had);else delete globalThis.location;}
});

test('S8 · integrado: curvar, inclinar, dividir y elevar a 2.x se rechazan sin tocar el documento',()=>{
 as('integrated',()=>{
  const p=F.base(),snap=J(p),w=F.longest(p);
  for(const r of [Core.setWallCurve(p,w.id,{x:w.start.x+100,y:w.start.y+900}),Core.setWallEndHeight(p,w.id,2300),Core.splitWall(p,w.id,500)]){
   assert.equal(r.ok,false);assert.equal(r.code,'activation-pending');assert.match(r.explanation[0],/todavía no están activados/);}
  assert.equal(J(p),snap);
  const v1=Core.clone(Core.initial());assert.throws(()=>Core.raiseVersion(v1,'2.0.0'),/activation-pending/);assert.match(v1.schemaVersion,/^1\./);
  assert.equal(Core.raiseVersion(v1,'1.12.0').schemaVersion,'1.12.0','las elevaciones 1.x siguen igual');
 });
});

test('S8 · lectura compatible: un 2.0 se valida, se mide y se exporta aunque no esté activo',async()=>{
 const {project}=F.curved(F.base());
 await as('integrated',async()=>{Core.validate(project);assert.ok(Q.level(project));assert.ok(Core.geometry(project).walls.length);
  const dxf=await DXF.exportLevel(project);assert.match(dxf,/AC1021/);});
});

test('S8 · integrado: ningún escritor confirma un 2.x nuevo o modificado; un v1 y un 2.0 sin cambios sí pasan',()=>{
 const {project:p2}=F.curved(F.base()),v1=Core.clone(Core.initial()),v1b=Core.clone(v1);v1b.name='Cambio v1';p2.id='prj_curvo000000000000000000000000';  // una ID por proyecto (contrato de la biblioteca)
 as('integrated',()=>{
  assert.deepEqual(Core.saveGate([{kind:'library',before:lib(v1),after:lib(v1,p2)}]).issues.map(i=>i.code),['activation-pending'],'importar o crear un 2.0');
  const p2b=Core.clone(p2);p2b.name='Editado';
  assert.ok(Core.saveGate([{kind:'library',before:lib(p2),after:lib(p2b)}]).issues.some(i=>i.code==='activation-pending'),'editar un 2.0 existente');
  assert.deepEqual(Core.saveGate([{kind:'library',before:lib(v1,p2),after:lib(v1b,p2)}]),{ok:true,issues:[]},'editar el v1 de una colección con un 2.0 intacto');
  assert.deepEqual(Core.saveGate([{kind:'project',before:J(v1),after:J(v1b)}]),{ok:true,issues:[]});
 });
 as('active',()=>assert.equal(Core.saveGate([{kind:'library',before:lib(v1),after:lib(v1,p2)}]).ok,true,'activo: sí'));
});

test('S8 · intenciones aisladas por proyecto: la misma ID de muro en dos variantes no se legitima de una a otra',()=>{
 const {project:a,wall:w}=F.curved(F.base(),{withOpening:false}),b=Core.clone(a);b.id='prj_variante00000000000000000000000';
 const a2=Core.clone(a),b2=Core.clone(b);a2.walls=a2.walls.filter(x=>x.id!==w.id);b2.walls=b2.walls.filter(x=>x.id!==w.id);
 const intents={[a.id]:Core.editIntent(a,a2)};  // la persona borró el muro curvo SOLO en la variante A
 const r=Core.saveGate([{kind:'library',before:lib(a,b),after:lib(a2,b2)}],{intents});
 assert.deepEqual(r.issues.map(i=>[i.code,i.projectId]),[['wall-lost',b.id]],'la variante B pierde el muro sin intención propia');
 assert.equal(Core.saveGate([{kind:'library',before:lib(a,b),after:lib(a2,b)}],{intents}).ok,true);
});

test('S8 · pasos consecutivos antes del guardado, en dos proyectos intercalados, y borrado indirecto de huecos',()=>{
 const {project:a,wall:w}=F.curved(F.base(),{withOpening:true}),b=Core.clone(a);b.id='prj_variante00000000000000000000001';
 const s1=Core.splitWall(a,w.id,600,{newId:'wal_pieza0002'}),b1=Core.setWallCurve(b,w.id,null);
 const a3=Core.clone(s1.project);a3.walls=a3.walls.filter(x=>x.id!=='wal_pieza0002');a3.openings=a3.openings.filter(o=>a3.walls.some(x=>x.id===o.wallId));
 const intents={[a.id]:Core.composeIntent(Core.editIntent(a,s1.project,{op:s1.intent}),Core.editIntent(s1.project,a3)),[b.id]:Core.editIntent(b,b1.project,{op:b1.intent})};
 assert.deepEqual(Core.saveGate([{kind:'library',before:lib(a,b),after:lib(a3,b1.project)}],{intents}),{ok:true,issues:[]},'dividir y borrar una pieza (con sus huecos) en A; enderezar en B');
 // Sin la intención de B, enderezar en B es una pérdida de curva.
 assert.deepEqual(Core.saveGate([{kind:'library',before:lib(a,b),after:lib(a3,b1.project)}],{intents:{[a.id]:intents[a.id]}}).issues.map(i=>i.code),['curve-lost']);
});
