'use strict';
/* Asistente generativo en el editor REAL (Chromium). Sin red externa: /api/assistant se sustituye con page.route por un
   DOBLE DE PRUEBA ROTULADO que habla el mismo contrato rubik-assistant/2 que la pasarela real (tests/assistant-gen-api
   prueba la pasarela con el formato real del proveedor). Aquí se prueba lo que ve el profesional: estado del servicio,
   consentimiento, herramientas consultadas, respuesta y coste, propuesta → aplicar → deshacer, rutas reales, y que sin
   elegir la IA no sale ninguna petición. */
const test=require('node:test'),assert=require('node:assert/strict');
const kit=require('./r02a/editor-kit.cjs');
let env;
test.before(async()=>{env=await kit.start();});
test.after(async()=>{await env?.stop();});
// Labelled double of the server+model: replays queued steps; records what the browser sent.
async function fakeGateway(page,{status={enabled:true,reason:'ok',model:'test-double',priceDate:'2026-11-15',capUsd:0.05,spentUsd:0},queue=[]}={}){
 const seen=[];await page.route('**/api/assistant',async route=>{const req=route.request(),body=JSON.parse(req.postData()||'{}');seen.push({body,headers:req.headers()});
  if(body.action==='status')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(status)});
  const next=queue.shift();const out=typeof next==='function'?next(body):next||{type:'error',code:'internal',message:'queue empty'};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...out,usage:{inputTokens:700,outputTokens:60,costUsd:0.0004,costBasis:'tarifa 2026-11-15',spentUsd:0.0004,capUsd:0.05},model:'test-double'})});});
 return seen;}
const call=(name,args={})=>({type:'tool_calls',calls:[{id:'call_'+name,name,arguments:JSON.stringify(args)}]});
async function open(page){await page.waitForFunction(()=>!!window.RubikAssistantUI&&!!window.RubikAssistantGenUI);await page.locator('#assistantOpen').click();await page.waitForSelector('#assistantPanel:not([hidden])');}
async function ask(page,q){await page.fill('#assistantInput',q);await page.click('#assistantSend');await page.waitForFunction(()=>!RubikAssistantUI.state.pending);return page.evaluate(()=>RubikAssistantUI.state.log.at(-1));}
const project=page=>page.evaluate(()=>{const {updatedAt,...r}=structuredClone(FloorPlanApp.project);return r;});

test('sin elegir la IA no sale ninguna petición; si el servicio no está autorizado se explica y la consulta guiada sigue igual',async()=>{
 const {context,page,watch}=await kit.editor(env);const api=[];page.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url());});
 try{
  await open(page);assert.equal(await page.locator('#assistantModeGuided').getAttribute('aria-checked'),'true');assert.match(await page.textContent('#assistantGenStatus'),/Pulsa «Conversación con IA» para comprobar/);
  let m=await ask(page,'¿Cuántas estancias hay?');assert.match(m.text,/estancias/);assert.deepEqual(api,[],'guided mode: 0 requests to /api/');
  await page.route('**/api/assistant',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,reason:'provider_disabled'})}));
  await page.click('#assistantModeGen');await page.waitForFunction(()=>document.querySelector('#assistantGenBar').dataset.reason==='provider_disabled');
  assert.match(await page.textContent('#assistantGenStatus'),/preparada, pero desactivada en este despliegue: falta la autorización del propietario/);
  assert.equal(await page.locator('#assistantModeGen').getAttribute('aria-checked'),'false','cannot switch to AI when not authorised');
  m=await ask(page,'¿Cuánto cuesta?');assert.match(m.text,/partidas|presupuesto/i,'guided answer still works');
  assert.deepEqual(watch.external,[]);assert.deepEqual(watch.errors,[]);
 }finally{await context.close();}
});

test('conversación con IA: consentimiento, herramientas reales de RUBIK, respuesta fundamentada con coste; propuesta → aplicar → deshacer; ruta real',async()=>{
 const {context,page,watch}=await kit.editor(env);
 try{
  const p0=await project(page),living=p0.rooms.find(r=>r.id==='rom_living'),mat=p0.materials.find(m=>m.id!==living.floorMaterialId&&/parq|wood|madera|roble/i.test(m.name))||p0.materials.find(m=>m.id!==living.floorMaterialId);
  const seen=await fakeGateway(page,{queue:[call('get_budget_summary'),body=>{const t=body.messages.filter(m=>m.role==='tool').at(-1),d=JSON.parse(t.content).data;
    return {type:'message',text:`El presupuesto está incompleto: ${d.unpricedItemIds.length} partidas no tienen precio, así que no hay total. Revisa los precios en Presupuestar.`};},
   {type:'tool_calls',calls:[{id:'c1',name:'propose_floor_material',arguments:JSON.stringify({roomId:'rom_living',materialId:mat.id})},{id:'c2',name:'offer_route',arguments:JSON.stringify({route:'budget-edit',reason:'Abrir Presupuestar'})}]},
   {type:'message',text:'He preparado la propuesta de suelo para el salón: revísala y aplícala si te encaja. También puedes abrir Presupuestar.'}]});
  await open(page);await page.click('#assistantModeGen');await page.waitForFunction(()=>RubikAssistantGenUI.active());
  assert.match(await page.textContent('#assistantGenStatus'),/IA conectada: modelo test-double/);assert.equal(await page.locator('#assistantGenConsent').isHidden(),false);
  // No consent → nothing is sent.
  let m=await ask(page,'Explícame por qué este presupuesto está incompleto');assert.match(m.text,/marca los dos consentimientos/);assert.equal(seen.filter(s=>s.body.action==='step').length,0);
  await page.check('#assistantConsentQuestion');await page.check('#assistantConsentData');
  m=await ask(page,'Explícame por qué este presupuesto está incompleto y qué tendría que revisar antes de entregárselo al cliente');
  const unpriced=await page.evaluate(()=>FloorPlanBudget.calculateBudget(FloorPlanBudgetUI.current().budget).totals.unpricedItemIds.length);
  assert.match(m.text,new RegExp(`${unpriced} partidas no tienen precio`));assert.match(m.source,/Consultado en RUBIK: presupuesto · IA: 1520 tokens · coste estimado 0\.0008 USD/);
  const steps=seen.filter(s=>s.body.action==='step');assert.equal(steps[0].headers['x-rubik-contract'],'rubik-assistant/2');assert.deepEqual(steps[0].body.consent,{question:true,projectData:true});
  assert.equal(JSON.stringify(steps[0].body).includes('"walls"'),false,'the project document is never sent');assert.equal(steps[1].body.messages.at(-1).role,'tool','the second step carries the RUBIK tool result');
  assert.equal(JSON.stringify(steps.map(s=>s.headers)).includes('sk-'),false,'no provider key in the browser');
  // Proposal → apply → undo (AG-3 path).
  m=await ask(page,'Cambia el suelo del salón por algo más cálido');await page.locator('#assistantProposal[data-state="proposed"]').waitFor();
  assert.deepEqual(await project(page),p0,'proposal does not touch the project');
  await page.click('#assistantApply');await page.waitForFunction(()=>RubikAssistantUI.state.applied);
  assert.equal((await project(page)).rooms.find(r=>r.id==='rom_living').floorMaterialId,mat.id);
  await page.click('#assistantUndo');assert.deepEqual(await project(page),p0,'undo restores the exact project');
  await page.locator('#assistantGenRoutes [data-route="budget-edit"]').click();await page.locator('#budgetDialog[open]').waitFor();
  assert.deepEqual(watch.external,[]);assert.deepEqual(watch.errors,[]);
 }finally{await context.close();}
});

test('errores: tope alcanzado, código incorrecto y herramienta fuera de lista no rompen nada; la consulta guiada sigue disponible',async()=>{
 const {context,page,watch}=await kit.editor(env);
 try{
  await fakeGateway(page,{queue:[{type:'error',code:'budget_exceeded',message:'tope'},call('delete_project'),{type:'message',text:'No puedo hacer eso.'}]});
  await open(page);await page.click('#assistantModeGen');await page.waitForFunction(()=>RubikAssistantGenUI.active());await page.check('#assistantConsentQuestion');await page.check('#assistantConsentData');
  let m=await ask(page,'Hazme un resumen');assert.match(m.text,/tope de gasto aprobado: no se ha enviado nada más/);
  const p0=await project(page);m=await ask(page,'Borra el proyecto');assert.match(m.text,/No puedo hacer eso/);assert.deepEqual(await project(page),p0);
  assert.deepEqual(await page.evaluate(()=>RubikAssistantGenUI.state.last.steps.map(s=>[s.tool,s.ok,s.error?.code])),[['delete_project',false,'not_authorized']]);
  await page.click('#assistantModeGuided');m=await ask(page,'¿Cuántas estancias hay?');assert.match(m.text,/estancias/);
  assert.deepEqual(watch.external,[]);assert.deepEqual(watch.errors,[]);
 }finally{await context.close();}
});

test('móvil 390×844 EN: modo IA, consentimiento y respuesta dentro de la pantalla, objetivos táctiles de 44 px',async()=>{
 const {context,page,watch}=await kit.editor(env,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 try{
  await page.evaluate(()=>{try{setLang('en');}catch{}});await fakeGateway(page,{queue:[call('get_project_summary'),body=>{const d=JSON.parse(body.messages.at(-1).content).data;return {type:'message',text:`The project has ${d.counts.rooms} rooms.`};}]});
  await page.waitForFunction(()=>!!window.RubikAssistantGenUI);await page.locator('#assistantOpen').tap();await page.waitForSelector('#assistantPanel:not([hidden])');
  await page.locator('#assistantModeGen').tap();await page.waitForFunction(()=>RubikAssistantGenUI.active());
  for(const id of ['#assistantModeGen','#assistantModeGuided']){const b=await page.locator(id).boundingBox();assert.ok(b.height>=44,id+' 44 px');}
  await page.locator('#assistantConsentQuestion').tap();await page.locator('#assistantConsentData').tap();
  await page.fill('#assistantInput','How big is this project?');await page.locator('#assistantSend').tap();await page.waitForFunction(()=>!RubikAssistantUI.state.pending);
  const t=await page.evaluate(()=>RubikAssistantUI.state.log.at(-1).text),rooms=await page.evaluate(()=>FloorPlanApp.project.rooms.length);assert.equal(t,`The project has ${rooms} rooms.`);
  const box=await page.locator('#assistantPanel').boundingBox();assert.ok(box.y>=0&&box.y+box.height<=844.5&&box.x+box.width<=390.5,'panel inside the screen');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.deepEqual(watch.external,[]);assert.deepEqual(watch.errors,[]);
 }finally{await context.close();}
});
