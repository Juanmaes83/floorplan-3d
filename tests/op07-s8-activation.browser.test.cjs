'use strict';
// OP-07 · S8 · Activación efectiva en el editor real, en el estado POR DEFECTO ('integrated'), con los dos escritores:
// F0.2b (IndexedDB) y localStorage (el de Production hoy). Ni entrada en la interfaz, ni operación, ni escritura que cree o
// confirme un 2.0; un 2.0 ya guardado se abre y se consulta (lectura compatible) sin poder confirmar cambios en él.
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./r02a/editor-kit.cjs'),{withState}=require('./op07/browser-state.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
const at=(host,state)=>{const e={...env,base:env.base.replace('127.0.0.1',host)};return state?withState(e,state):e;};
const longest=()=>{const p=FloorPlanApp.project;return [...p.walls].filter(w=>!p.openings.some(o=>o.wallId===w.id)).sort((a,b)=>Math.hypot(b.end.x-b.start.x,b.end.y-b.start.y)-Math.hypot(a.end.x-a.start.x,a.end.y-a.start.y))[0].id;};
const inject2=id=>FloorPlanApp.applyExtension(q=>{const p=JSON.parse(JSON.stringify(q)),w=p.walls.find(x=>x.id===id);w.curve={control:{x:Math.round((w.start.x+w.end.x)/2+300),y:Math.round((w.start.y+w.end.y)/2+800)}};p.schemaVersion='2.0.0';return {ok:true,project:p};});
const storedF02b=page=>page.evaluate(async()=>{const r=await FloorPlanPersistence.readConfirmed();return {revision:r.revision?.n??r.revision,lib:r.docs.get(FloorPlanLibrary.KEY)};});

for(const [label,host] of [['F0.2b (IndexedDB)','f0-2b.localhost'],['localStorage','127.0.0.1']]){
 test(`S8 · integrado, ${label}: sin entrada, operaciones rechazadas y ninguna escritura confirma un 2.0`,{timeout:150000},async()=>{
  const {context,page,watch}=await K.editor(at(host));
  try{
   assert.equal(await page.evaluate(()=>FloorPlanCore.op07State()),'integrated');
   const id=await page.evaluate(longest);
   await page.evaluate(id=>select({kind:'wall',id}),id);
   assert.equal(await page.locator('#wallShape').count(),0,'sin panel «Forma del muro»');
   assert.equal(await page.locator('[data-handle="curve"]').count(),0,'sin punto de curvatura');
   const r=await page.evaluate(id=>FloorPlanApp.applyExtension(q=>FloorPlanCore.setWallCurve(q,id,{x:0,y:0})),id);
   assert.equal(r.ok,false);assert.match(r.explanation.join(' '),/todavía no están activados/);
   const f02b=host==='f0-2b.localhost',before=f02b?await storedF02b(page):await page.evaluate(()=>localStorage.getItem(FloorPlanLibrary.KEY));
   // Un escritor genérico (importación, extensión) que mete un 2.0: no se confirma; el cambio queda en la pestaña.
   await page.evaluate(inject2,id);
   if(f02b){const f=await page.evaluate(async()=>{const s=await FloorPlanPersistenceEditor.session.flush();return s.error?.code;});assert.equal(f,'guard-refused');assert.deepEqual(await storedF02b(page),before,'autoridad intacta');}
   else assert.equal(await page.evaluate(()=>localStorage.getItem(FloorPlanLibrary.KEY)),before,'localStorage intacto');
   assert.equal(await page.evaluate(id=>!!FloorPlanApp.project.walls.find(w=>w.id===id).curve,id),true,'el trabajo pendiente sigue en la pestaña');
   await page.waitForFunction(()=>/todavía no están activados/.test(document.getElementById('toast')?.textContent||''));
   assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
 });
}

test('S8 · lectura compatible: un 2.0 confirmado cuando estaba activo se abre integrado, se ve curvo y no admite cambios confirmados',{timeout:180000},async()=>{
 const one=await K.editor(at('f0-2b.localhost','active'));let id;
 try{id=await one.page.evaluate(longest);const r=await one.page.evaluate(id=>FloorPlanApp.applyExtension(q=>FloorPlanCore.setWallCurve(q,id,{x:Math.round((q.walls.find(w=>w.id===id).start.x+q.walls.find(w=>w.id===id).end.x)/2+300),y:Math.round((q.walls.find(w=>w.id===id).start.y+q.walls.find(w=>w.id===id).end.y)/2+800)})),id);
  assert.ok(r.ok,r.explanation);assert.equal(await one.page.evaluate(async()=>(await FloorPlanPersistenceEditor.session.flush()).status),'saved');
  // Misma base de datos (mismo origen y contexto): se reabre la página en estado integrado.
  await one.context.addInitScript(()=>{globalThis.RUBIK_OP07_STATE='integrated';});await one.page.reload();
  await one.page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true'&&!!window.FloorPlanApp);
  assert.equal(await one.page.evaluate(()=>FloorPlanCore.op07State()),'integrated');
  assert.equal(await one.page.evaluate(id=>!!FloorPlanApp.project.walls.find(w=>w.id===id).curve,id),true,'se lee el 2.0');
  const before=await storedF02b(one.page);
  await one.page.evaluate(()=>FloorPlanApp.applyExtension(q=>({ok:true,project:{...q,name:'Cambio sin activar'}})));
  assert.equal(await one.page.evaluate(async()=>(await FloorPlanPersistenceEditor.session.flush()).error?.code),'guard-refused');
  assert.deepEqual(await storedF02b(one.page),before,'no se confirma un cambio en un 2.0 sin activación');
 }finally{await one.context.close();}
});

test('S8 · «activo» falla cerrado sin A0 o sin escritor protegido; con ambos se habilita en los dos escritores',{timeout:180000},async()=>{
 const cases=[['f0-2b.localhost',{a0:'none'},['a0'],false],['127.0.0.1',{a0:'none'},['a0'],false],['f0-2b.localhost',{},[],true],['127.0.0.1',{},[],true]];
 for(const [host,opts,blockers,active] of cases){
  const e={...env,base:env.base.replace('127.0.0.1',host)},{context,page}=await K.editor(withState(e,'active',opts));
  try{
   const s=await page.evaluate(()=>({state:FloorPlanCore.op07State(),blockers:FloorPlanCore.activationBlockers(),active:FloorPlanCore.wallFeaturesActive()}));
   assert.deepEqual(s,{state:'active',blockers,active},`${host} ${JSON.stringify(opts)}`);
   const id=await page.evaluate(longest);await page.evaluate(id=>select({kind:'wall',id}),id);
   assert.equal(await page.locator('#wallShape').count(),active?1:0,'«Forma del muro» solo si de verdad está activo');
  }finally{await context.close();}
 }
 // Demo aislada (almacén en memoria, sin puerta): nunca hay escritor protegido.
 const d=await K.editor(withState(env,'active'));
 try{await d.page.goto(env.base+'?demo=dibujo-vivo');await d.page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true'&&!!window.FloorPlanApp);
  assert.deepEqual(await d.page.evaluate(()=>FloorPlanCore.activationBlockers()),['protected-writer']);}finally{await d.context.close();}
});
