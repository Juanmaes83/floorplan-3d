'use strict';
// OP-07 · S7 · Guardado protegido en el camino REAL de F0.2b (IndexedDB, revisión confirmada), editor completo:
// una escritura que perdería la curva no se confirma (nada cambia en la autoridad, el cambio sigue en la pestaña y se
// explica); curvar, dividir, deshacer y rehacer sí; reabrir devuelve el 2.0 confirmado y la copia de emergencia lo lleva.
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./r02a/editor-kit.cjs');
let env;test.before(async()=>{env=require('./op07/browser-state.cjs').withState(await K.start(),'active');env={...env,base:env.base.replace('127.0.0.1','f0-2b.localhost')};});test.after(async()=>{await env?.stop();});
const flush=page=>page.evaluate(async()=>{const s=await FloorPlanPersistenceEditor.session.flush();return {status:s.status,code:s.error?.code||null,message:s.error?.message||'',revision:s.revision};});
// El editor guarda en la biblioteca (clave de F0.2b): el proyecto activo de la última revisión confirmada.
const stored=page=>page.evaluate(async()=>{const r=await FloorPlanPersistence.readConfirmed(),lib=JSON.parse(r.docs.get(FloorPlanLibrary.KEY)),e=lib.entries.find(x=>x.id===lib.activeId);
 return {revision:r.revision?.n??r.revision,project:e.kind==='building'?null:e.project};});
const curvedIds=p=>p.walls.filter(w=>w.curve).map(w=>w.id).sort();

test('S7 · F0.2b: la pérdida no pedida no se confirma; curvar, dividir, deshacer, rehacer, reabrir y exportar sí',{timeout:180000},async()=>{
 const {context,page,watch}=await K.editor(env);
 try{
  assert.ok(await page.evaluate(()=>!!FloorPlanPersistenceEditor.session),'F0.2b activo');
  // 1. Curvar con la operación del editor (lleva su intención) → confirmado como 2.0.
  const wid=await page.evaluate(()=>{const p=FloorPlanApp.project,w=[...p.walls].filter(w=>!p.openings.some(o=>o.wallId===w.id)).sort((a,b)=>Math.hypot(b.end.x-b.start.x,b.end.y-b.start.y)-Math.hypot(a.end.x-a.start.x,a.end.y-a.start.y))[0];
   const r=FloorPlanApp.applyExtension(q=>FloorPlanCore.setWallCurve(q,w.id,{x:(w.start.x+w.end.x)/2+250,y:(w.start.y+w.end.y)/2+700}));if(!r.ok)throw Error(r.explanation);return w.id;});
  let f=await flush(page);assert.equal(f.status,'saved');let s=await stored(page);
  assert.equal(s.project.schemaVersion.split('.')[0],'2');assert.deepEqual(curvedIds(s.project),[wid]);const rev1=s.revision;
  // 2. Un escritor genérico que reconstruye el muro sin `curve` (sin intención): no se confirma.
  await page.evaluate(id=>FloorPlanApp.applyExtension(q=>{const p=JSON.parse(JSON.stringify(q)),w=p.walls.find(x=>x.id===id);delete w.curve;return {ok:true,project:p};}),wid);
  f=await flush(page);assert.equal(f.code,'guard-refused');assert.match(f.message,/curva/);assert.match(f.message,/Lo guardado no ha cambiado/);
  s=await stored(page);assert.equal(s.revision,rev1,'ninguna revisión nueva');assert.deepEqual(curvedIds(s.project),[wid],'la autoridad conserva la curva');
  assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.walls.filter(w=>w.curve).length),0,'el cambio sigue en la pestaña (nada se descarta)');
  assert.equal(await page.locator('#persistenceStatus').getAttribute('data-state'),'error','el estado lo dice');
  await page.waitForFunction(()=>/No se ha guardado/.test(document.getElementById('toast')?.textContent||''));
  // 3. Deshacer restaura el estado de la persona → se confirma.
  await page.evaluate(()=>undo());f=await flush(page);assert.equal(f.status,'saved',f.message);s=await stored(page);
  assert.ok(s.revision>rev1);assert.deepEqual(curvedIds(s.project),[wid]);
  // 4. Dividir, deshacer y rehacer: cada paso confirmado, sin rechazos.
  const len=await page.evaluate(id=>FloorPlanCore.wallLength(FloorPlanApp.project.walls.find(w=>w.id===id)),wid);
  await page.evaluate(([id,l])=>{const r=FloorPlanApp.applyExtension(q=>FloorPlanCore.splitWall(q,id,Math.round(l/2),{newId:'wal_s7pieza2'}));if(!r.ok)throw Error(r.explanation);},[wid,len]);
  f=await flush(page);assert.equal(f.status,'saved',f.message);assert.deepEqual(curvedIds((await stored(page)).project),[wid,'wal_s7pieza2'].sort());
  await page.evaluate(()=>undo());f=await flush(page);assert.equal(f.status,'saved',f.message);assert.deepEqual(curvedIds((await stored(page)).project),[wid]);
  await page.evaluate(()=>redo());f=await flush(page);assert.equal(f.status,'saved',f.message);const final=(await stored(page)).project;
  assert.deepEqual(curvedIds(final),[wid,'wal_s7pieza2'].sort());
  // 5. Copia de emergencia (exportación) con la curva; reabrir devuelve el 2.0 confirmado.
  const exported=await page.evaluate(async()=>JSON.parse(await (await FloorPlanPersistenceEditor.session.emergencyExport()).text()).docs[FloorPlanLibrary.KEY]);
  const lib=JSON.parse(exported);assert.deepEqual(curvedIds(lib.entries.find(x=>x.id===lib.activeId).project),curvedIds(final));
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true'&&!!window.FloorPlanApp);
  const reopened=await page.evaluate(()=>FloorPlanApp.project);assert.equal(reopened.schemaVersion,final.schemaVersion);assert.deepEqual(curvedIds(reopened),curvedIds(final));
  assert.deepEqual(watch.external,[]);
 }finally{await context.close();}
});
