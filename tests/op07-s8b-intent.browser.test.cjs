'use strict';
// OP-07 v5 · Regresión permanente de la sonda de Codex `cierre-v4-d/op07-v4-intent.cjs` (3eee6937): editor real, biblioteca
// y autoridad IndexedDB de F0.2b, con y sin la clave histórica del proyecto, original y variante. En cada negativo: rechazo,
// revisión confirmada intacta y documentos persistidos byte a byte iguales. Positivos conservados.
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const K=require('./r02a/editor-kit.cjs'),C=require('../js/project-core.js'),{withState}=require('./op07/browser-state.cjs');
const A='rubik-sota-floorplan-project-v1',L='rubik-sota-project-library-v1';
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
function seed({historical,variant}){const original=C.initial(),v={...C.clone(original),id:'prj_c0de0000000000000000000000000000',name:'Variante sintética'};
 const entries=[{id:'e_original',name:'Original sintético',project:original}];if(variant)entries.push({id:'e_variant',name:v.name,variantOf:'e_original',project:v});
 return {historical:historical?JSON.stringify(original):null,library:JSON.stringify({version:1,activeId:variant?'e_variant':'e_original',entries})};}
const confirmed=page=>page.evaluate(async()=>{const {revision,docs}=await FloorPlanPersistence.readConfirmed();return {revision,docs:[...docs]};});
async function open(opts){const {historical,library}=seed(opts),base=env.base.replace('127.0.0.1','f0-2b.localhost');
 const cfg=withState({...env,base},'active',{a0:opts.a0||'stand-in'}),context=await cfg.browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await context.addInitScript(({a,l,historical,library})=>{if(localStorage.getItem('op07-fixture'))return;if(historical!==null)localStorage.setItem(a,historical);localStorage.setItem(l,library);localStorage.setItem('op07-fixture','1');},{a:A,l:L,historical,library});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true'&&!!window.FloorPlanApp);
 const wall=await page.evaluate(()=>[...FloorPlanApp.project.walls].filter(w=>!FloorPlanApp.project.openings.some(o=>o.wallId===w.id)).sort((a,b)=>Math.hypot(b.end.x-b.start.x,b.end.y-b.start.y)-Math.hypot(a.end.x-a.start.x,a.end.y-a.start.y))[0].id);
 return {context,page,errors,wall};}
// Pasos síncronos (el debounce no se cuela entre operaciones del mismo lote) y un único flush opcional.
const edit=(page,wall,steps,{flush=true,await_=true}={})=>page.evaluate(async({steps,flush,wall,await_})=>{
 const ops=steps.map(action=>FloorPlanApp.applyExtension(p=>{const w=p.walls.find(x=>x.id===wall),dx=w.end.x-w.start.x,dy=w.end.y-w.start.y;
  if(action==='straighten')return FloorPlanCore.setWallCurve(p,wall,null);
  if(action==='level')return FloorPlanCore.setWallEndHeight(p,wall,null);
  if(action==='slope')return FloorPlanCore.setWallEndHeight(p,wall,2300);
  if(action==='reslope')return FloorPlanCore.setWallEndHeight(p,wall,2450);
  if(action==='generic-loss'){delete w.curve;return {ok:true,project:p};}
  if(action==='generic-level'){delete w.heightEndMm;return {ok:true,project:p};}
  const k=(action==='curve'?160:230)/Math.hypot(dx,dy);return FloorPlanCore.setWallCurve(p,wall,{x:Math.round((w.start.x+w.end.x)/2-dy*k),y:Math.round((w.start.y+w.end.y)/2+dx*k)});}).ok);
 if(!flush)return {ops};const s=FloorPlanPersistenceEditor.session;
 if(!await_){window.__inflight=s.flush();return {ops};}
 const r=await s.flush();return {ops,status:r.status,code:r.error?.code??null};},{steps,flush,wall,await_});
async function negative(opts,setup,final,label){const {context,page,errors,wall}=await open(opts);
 try{for(const steps of setup){const r=await edit(page,wall,steps);assert.ok(r.ops.every(Boolean)&&r.status==='saved',`${label}: preparación ${steps} → ${JSON.stringify(r)}`);}
  const before=await confirmed(page),r=await edit(page,wall,final);
  assert.ok(r.ops.every(Boolean),`${label}: operaciones aceptadas en la pestaña`);assert.equal(r.code,'guard-refused',`${label}: rechazado`);
  const after=await confirmed(page);assert.equal(after.revision?.n??after.revision,before.revision?.n??before.revision,`${label}: revisión intacta`);
  assert.equal(JSON.stringify(after.docs),JSON.stringify(before.docs),`${label}: documentos persistidos byte a byte iguales`);assert.deepEqual(errors,[]);
 }finally{await context.close();}}

test('v5 · escenarios exactos de Codex (curva): confirmaciones separadas y lote de variante, con y sin clave histórica',{timeout:300000},async()=>{
 await negative({historical:true},[['curve'],['straighten'],['recurve']],['generic-loss'],'confirmaciones-con-ambas-claves');
 await negative({historical:false},[['curve'],['straighten'],['recurve']],['generic-loss'],'confirmaciones-solo-biblioteca');
 await negative({historical:true,variant:true},[['curve']],['straighten','recurve','generic-loss'],'lote-variante-con-ambas-claves');
 await negative({historical:false,variant:true},[['curve']],['straighten','recurve','generic-loss'],'lote-variante-sin-clave-historica');
});

test('v5 · equivalentes de inclinación: nivelar → volver a inclinar → nivelación genérica',{timeout:300000},async()=>{
 await negative({historical:true},[['slope'],['level'],['reslope']],['generic-level'],'pendiente-confirmaciones-ambas-claves');
 await negative({historical:true,variant:true},[['slope']],['level','reslope','generic-level'],'pendiente-lote-variante');
});

test('v5 · confirmación concurrente: pasos hechos mientras un guardado está en vuelo siguen pendientes y se revocan bien',{timeout:180000},async()=>{
 const {context,page,errors,wall}=await open({historical:true});
 try{assert.equal((await edit(page,wall,['curve'])).status,'saved');
  await edit(page,wall,['straighten'],{await_:false});                       // guardado del enderezado en vuelo…
  await edit(page,wall,['recurve'],{flush:false});                            // …y, mientras tanto, se vuelve a curvar
  // El guardado en vuelo se confirma sin error y deja PENDIENTE el paso hecho mientras tanto (no lo consume).
  const inflight=await page.evaluate(async()=>{const r=await window.__inflight;return {status:r.status,code:r.error?.code??null,pending:r.pending};});
  assert.deepEqual([inflight.status,inflight.code,inflight.pending>0],['pending',null,true],JSON.stringify(inflight));
  assert.equal((await edit(page,wall,[])).status,'saved','el paso de volver a curvar se confirma después');
  const before=await confirmed(page),r=await edit(page,wall,['generic-loss']);
  assert.equal(r.code,'guard-refused','la pérdida posterior no se apoya en el enderezado ya consumido');
  assert.equal(JSON.stringify((await confirmed(page)).docs),JSON.stringify(before.docs));
  // Positivo concurrente: curvar en vuelo y enderezar explícitamente mientras tanto → se confirma.
  await edit(page,wall,['curve'],{flush:false});await edit(page,wall,[],{await_:false});await edit(page,wall,['straighten'],{flush:false});
  const r2=await page.evaluate(async()=>{const r=await window.__inflight;return r.error?.code??null;});assert.equal(r2,null);assert.equal((await edit(page,wall,[])).status,'saved','el enderezado hecho en vuelo se confirma');
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
});

test('v5 · positivos y control: enderezar, nivelar y la variante se confirman; sin A0 no se crea nada',{timeout:180000},async()=>{
 for(const [opts,steps] of [[{historical:true},[['curve'],['straighten']]],[{historical:true,variant:true},[['slope'],['level']]],[{historical:false},[['curve'],['straighten','recurve']]]]){
  const {context,page,errors,wall}=await open(opts);
  try{for(const s of steps){const r=await edit(page,wall,s);assert.equal(r.status,'saved',`${JSON.stringify(opts)} ${s}`);}assert.deepEqual(errors,[]);}finally{await context.close();}}
 const {context,page,wall}=await open({historical:true,a0:'none'});
 try{const before=await confirmed(page),r=await edit(page,wall,['curve']);assert.equal(r.ops[0],false,'sin A0: activation-pending');
  assert.equal(JSON.stringify((await confirmed(page)).docs),JSON.stringify(before.docs));}finally{await context.close();}
});
