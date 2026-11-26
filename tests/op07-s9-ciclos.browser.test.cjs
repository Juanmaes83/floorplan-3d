'use strict';
// OP-07 · S9 · Ciclos de edición sobre la composición con A0 (#310): en el origen normal (localStorage + A0) y con F0.2b
// (IndexedDB), para muro RECTO (dividir), CURVO e INCLINADO: cancelación sin efecto, doble guardado seguido y
// deshacer → rehacer → guardar → reabrir con el mismo resultado en memoria, en lo guardado y tras recargar.
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./r02a/editor-kit.cjs');
let env0;test.before(async()=>{env0=require('./op07/browser-state.cjs').withState(await K.start(),'active');});test.after(async()=>{await env0?.stop();});
const ORIGINS=[['normal','127.0.0.1'],['F0.2b','f0-2b.localhost']];
const flush=page=>page.evaluate(async()=>{const s=window.FloorPlanPersistenceEditor?.session;if(!s)return {status:'saved'};const r=await s.flush();return {status:r.status,code:r.error?.code||null,message:r.error?.message||''};});
const stored=page=>page.evaluate(async()=>{let raw;
 if(window.FloorPlanPersistenceEditor?.session){const r=await FloorPlanPersistence.readConfirmed();raw=r.docs.get(FloorPlanLibrary.KEY);}else raw=localStorage.getItem(FloorPlanLibrary.KEY);
 if(!raw)return null;const lib=JSON.parse(raw),e=lib?.entries?.find(x=>x.id===lib.activeId);return e?e.project:null;});
const shape=p=>p===null?'nada guardado':JSON.stringify(p.walls.map(w=>({id:w.id,start:w.start,end:w.end,curve:w.curve||null,heightMm:w.heightMm,heightEndMm:w.heightEndMm??null})).sort((a,b)=>a.id<b.id?-1:1));
const OPS={
 recto:(w,id)=>`FloorPlanCore.splitWall(q,'${w}',1200,{newId:'${id}'})`,
 curvo:(w)=>`FloorPlanCore.setWallCurve(q,'${w}',(()=>{const x=q.walls.find(v=>v.id==='${w}');return {x:(x.start.x+x.end.x)/2+200,y:(x.start.y+x.end.y)/2+600};})())`,
 inclinado:(w)=>`FloorPlanCore.setWallEndHeight(q,'${w}',2300)`};
for(const [label,host] of ORIGINS)test(`S9 · ${label}: recto, curvo e inclinado — cancelar, doble guardado, deshacer→rehacer→guardar→reabrir`,{timeout:300000},async()=>{
 const env={...env0,base:env0.base.replace('127.0.0.1',host)};const {context,page,watch}=await K.editor(env);
 try{
  assert.equal(await page.evaluate(()=>!!window.FloorPlanPersistenceEditor?.session),host!=='127.0.0.1','origen correcto');
  assert.equal(await page.evaluate(()=>!!window.FloorPlanSchemaEpoch),true,'A0 cargado');
  const wid=await page.evaluate(()=>{const p=FloorPlanApp.project;return [...p.walls].filter(w=>!p.openings.some(o=>o.wallId===w.id)).sort((a,b)=>Math.hypot(b.end.x-b.start.x,b.end.y-b.start.y)-Math.hypot(a.end.x-a.start.x,a.end.y-a.start.y))[0].id;});
  const mem=()=>page.evaluate(()=>FloorPlanApp.project);
  for(const [kind,op] of Object.entries(OPS)){
   const before=await mem(),savedBefore=await stored(page);
   // 1 · Cancelar: la operación se abandona (la herramienta devuelve ok:false) → nada cambia, ni en memoria ni guardado, ni en el deshacer.
   const undoLen=await page.evaluate(()=>undoStack.length);
   const c=await page.evaluate(()=>FloorPlanApp.applyExtension(()=>({ok:false,explanation:['Cancelado por la persona']})));
   assert.equal(c.ok,false);assert.equal(shape(await mem()),shape(before),kind+': cancelar no cambia la memoria');
   assert.equal(await page.evaluate(()=>undoStack.length),undoLen,kind+': cancelar no añade un paso');
   assert.equal((await flush(page)).status,'saved');assert.equal(shape(await stored(page)),shape(savedBefore),kind+': cancelar no cambia lo guardado');
   // 2 · Aplicar y DOBLE guardado seguido (dos flush concurrentes y una edición neutra entre medias).
   const r=await page.evaluate(src=>{return FloorPlanApp.applyExtension(q=>(0,eval)(`(q)=>${src}`)(q));},op(wid,'wal_s9_'+kind));
   assert.equal(r.ok,true,kind+': '+JSON.stringify(r));const applied=await mem();
   const [f1,f2]=await page.evaluate(async()=>{const s=window.FloorPlanPersistenceEditor?.session;if(!s)return [{status:'saved'},{status:'saved'}];const a=await Promise.all([s.flush(),s.flush()]);return a.map(x=>({status:x.status,code:x.error?.code||null}));});
   assert.equal(f1.status,'saved',kind+' f1 '+JSON.stringify(f1));assert.equal(f2.status,'saved',kind+' f2 '+JSON.stringify(f2));
   assert.equal(shape(await stored(page)),shape(applied),kind+': lo guardado = lo aplicado tras el doble guardado');
   // 3 · Deshacer → rehacer → guardar → reabrir.
   await page.evaluate(()=>undo());assert.equal(shape(await mem()),shape(before),kind+': deshacer');
   assert.equal((await flush(page)).status,'saved');assert.equal(shape(await stored(page)),shape(before),kind+': deshacer guardado');
   await page.evaluate(()=>redo());assert.equal(shape(await mem()),shape(applied),kind+': rehacer');
   const f=await flush(page);assert.equal(f.status,'saved',kind+': guardar tras rehacer '+JSON.stringify(f));
   assert.equal(shape(await stored(page)),shape(applied),kind+': rehacer guardado');
   await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true'&&!!window.FloorPlanApp);
   assert.equal(shape(await mem()),shape(applied),kind+': reabrir devuelve lo rehecho');
   const now=await mem();
   if(kind==='curvo')assert.ok(now.walls.find(w=>w.id===wid).curve,'la curva sobrevive');
   if(kind==='inclinado')assert.equal(now.walls.find(w=>w.id===wid).heightEndMm,2300,'la pendiente sobrevive');
   if(kind==='recto')assert.ok(now.walls.some(w=>w.id==='wal_s9_recto'),'la división sobrevive');
  }
  assert.deepEqual(watch.errors||[],[]);
 }finally{await context.close();}
});
