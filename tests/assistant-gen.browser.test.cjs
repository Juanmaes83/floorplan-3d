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
  if(body.action==='status')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(typeof status==='function'?status(req.headers()):status)});
  const next=queue.shift();const out=typeof next==='function'?await next(body):next||{type:'error',code:'internal',message:'queue empty'};
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

test('la envoltura de Preview explica el piloto cerrado y la pausa de almacenamiento',async()=>{
 const {context,page}=await kit.editor(env);
 let result={status:200,json:{enabled:false,reason:'beta_disabled'}};
 try{
  await page.route('**/api/assistant',route=>route.fulfill(result));
  await open(page);
  await page.click('#assistantModeGen');
  await page.waitForFunction(()=>document.querySelector('#assistantGenBar').dataset.reason==='beta_disabled');
  assert.match(await page.textContent('#assistantGenStatus'),/Puedes seguir con Consulta guiada/);
  assert.equal(await page.locator('#assistantModeGuided').getAttribute('aria-checked'),'true');
  result={status:503,json:{error:'beta-store-disabled'}};
  await page.click('#assistantModeGen');
  await page.waitForFunction(()=>document.querySelector('#assistantGenBar').dataset.reason==='beta-store-disabled');
  assert.match(await page.textContent('#assistantGenStatus'),/está pausada/);
  assert.equal(await page.locator('#assistantModeGen').getAttribute('aria-checked'),'false');
  assert.match((await ask(page,'¿Cuántas estancias hay?')).text,/estancias/);
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

// AISLAMIENTO entre ámbitos (revisión del propietario en #238): conversación, resultados de herramientas, propuestas,
// rutas y consentimiento pertenecen a un estudio + proyecto. Se comprueba sobre los cuerpos REALES que salen hacia
// /api/assistant: ninguna pregunta, herramienta, dato ni respuesta de A llega en B; tampoco tras cerrar y reabrir el
// panel; una respuesta de A que llega con B abierto se descarta; y lo mismo al cambiar de estudio.
test('aislamiento: proyecto A → B → C y estudio → estudio: nada de A viaja a B, se exige consentimiento de nuevo, la respuesta en curso se descarta; la consulta guiada sigue igual',{timeout:240000},async()=>{
 const {context,page,watch}=await kit.editor(env);
 try{
  const A_Q='ZORRO-A pregunta sobre el salón',A_ANS='ZORRO-A respuesta',S_Q='ZORRO-S1 pregunta de estudio';
  const idA=await page.evaluate(()=>FloorPlanApp.project.id);
  const mat=await page.evaluate(()=>{const p=FloorPlanApp.project,r=p.rooms.find(x=>x.id==='rom_living');return p.materials.find(m=>m.id!==r.floorMaterialId&&m.category==='floor').id;});
  let release;const held=new Promise(r=>release=r);
  const seen=await fakeGateway(page,{queue:[
   {type:'tool_calls',calls:[{id:'callA1',name:'get_project_summary',arguments:'{}'}]},{type:'message',text:`${A_ANS}: el proyecto tiene estancias.`},
   {type:'tool_calls',calls:[{id:'callA2',name:'propose_floor_material',arguments:JSON.stringify({roomId:'rom_living',materialId:mat})},{id:'callA3',name:'offer_route',arguments:JSON.stringify({route:'budget-edit',reason:'Abrir Presupuestar'})}]},{type:'message',text:'Propuesta preparada.'},
   {type:'tool_calls',calls:[{id:'callB1',name:'list_rooms',arguments:'{}'}]},{type:'message',text:'Respuesta en B.'},{type:'message',text:'Otra respuesta en B tras reabrir.'},
   async()=>{await held;return {type:'message',text:'ZORRO-TARDÍA respuesta que llega tarde'};},
   {type:'message',text:'Respuesta en C.'},{type:'message',text:'Respuesta de estudio 1.'},{type:'message',text:'Respuesta de estudio 2.'}]});
  const steps=()=>seen.filter(s=>s.body.action==='step');
  const consentBoth=async()=>{await page.check('#assistantConsentQuestion');await page.check('#assistantConsentData');};
  const variant=async()=>{const before=await page.evaluate(()=>FloorPlanApp.project.id);await page.evaluate(()=>document.querySelector('#projectsBtn').click());await page.locator('#projectsDialog[open]').waitFor();
   await page.evaluate(()=>document.querySelector('#projectVariant').click());await page.waitForFunction(b=>FloorPlanApp.project.id!==b,before);await page.evaluate(()=>document.querySelector('#projectsDialog')?.close());return page.evaluate(()=>FloorPlanApp.project.id);};
  // ── A: conversation with tool data, a pending proposal and a route.
  await open(page);await page.click('#assistantModeGen');await page.waitForFunction(()=>RubikAssistantGenUI.active());await consentBoth();
  let m=await ask(page,A_Q);assert.match(m.text,/ZORRO-A respuesta/);
  await ask(page,'Cambia el suelo del salón');await page.locator('#assistantProposal[data-state="proposed"]').waitFor();await page.locator('#assistantGenRoutes').waitFor();
  const nA=steps().length;assert.ok(JSON.stringify(steps().map(s=>s.body)).includes('ZORRO-A'),'sanity: A content did travel in A');
  // ── Switch to B (real switchProject via «Crear variante»).
  const idB=await variant();assert.notEqual(idB,idA);
  assert.equal(await page.locator('#assistantProposal').isHidden(),true,'pending proposal of A invalidated');assert.equal(await page.locator('#assistantGenRoutes').count(),0,'routes of A removed');
  assert.deepEqual(await page.evaluate(()=>[document.querySelector('#assistantConsentQuestion').checked,document.querySelector('#assistantConsentData').checked,RubikAssistantGenUI.state.history.length,RubikAssistantGenUI.state.resets>=1,RubikAssistantUI.state.proposal]),[false,false,0,true,null]);
  assert.equal((await page.evaluate(()=>RubikAssistantUI.state.log.map(x=>x.text).join('\n'))).includes('ZORRO-A'),false,'the log shown in B is B’s');
  // Asking in B without re-consenting sends nothing.
  m=await ask(page,'¿Cuántas estancias tiene?');assert.match(m.text,/marca los dos consentimientos/);assert.equal(steps().length,nA,'no request without consent in the new scope');
  await consentBoth();m=await ask(page,'¿Cuántas estancias tiene?');assert.match(m.text,/Respuesta en B/);
  // Close and reopen the panel: still nothing from A.
  await page.click('#assistantClose');await open(page);m=await ask(page,'¿Y la cocina?');assert.match(m.text,/tras reabrir/);
  const bodiesB=steps().slice(nA).map(s=>JSON.stringify(s.body));assert.equal(bodiesB.length,3);
  for(const b of bodiesB){for(const leak of ['ZORRO-A','callA1','callA2','callA3','Propuesta preparada'])assert.equal(b.includes(leak),false,'leak of '+leak+' into B');}
  assert.equal(JSON.parse(bodiesB[0]).messages[0].content,'¿Cuántas estancias tiene?','B starts a fresh conversation');
  // ── In-flight: a B turn is waiting for the provider; the project changes to C; the late answer is discarded.
  const nBefore=steps().length;await page.fill('#assistantInput','Pregunta lenta en B');await page.click('#assistantSend');await page.waitForFunction(n=>RubikAssistantUI.state.pending,nBefore);
  const idC=await variant();assert.notEqual(idC,idB);release();await page.waitForFunction(()=>!RubikAssistantUI.state.pending);
  assert.equal((await page.evaluate(()=>RubikAssistantUI.state.log.map(x=>x.text).join('\n'))).includes('ZORRO-TARDÍA'),false,'late answer of B not shown in C');
  assert.equal(await page.evaluate(()=>RubikAssistantGenUI.state.history.length),0);assert.equal(steps().length,nBefore+1,'no further step after the switch');
  await consentBoth();m=await ask(page,'Hola desde C');assert.match(m.text,/Respuesta en C/);assert.equal(JSON.parse(JSON.stringify(steps().at(-1).body)).messages.length,1,'C starts clean');
  // ── Studio change (same project): scope changes too.
  await consentBoth().catch(()=>{});m=await ask(page,S_Q);assert.match(m.text,/estudio 1/);const nS=steps().length;
  await page.evaluate(()=>{const s=document.querySelector('#catalogStudio');const o=document.createElement('option');o.value='brd-estudio-b';o.textContent='Estudio B';s.append(o);s.value='brd-estudio-b';s.dispatchEvent(new Event('change'));});
  assert.equal(await page.evaluate(()=>RubikCatalogUI.studioId),'brd-estudio-b');
  m=await ask(page,'¿Y ahora?');assert.match(m.text,/marca los dos consentimientos/,'new studio: consent again');assert.equal(steps().length,nS);
  await consentBoth();m=await ask(page,'¿Y ahora?');assert.match(m.text,/estudio 2/);assert.equal(JSON.stringify(steps().at(-1).body).includes('ZORRO-S1'),false,'nothing from the previous studio');
  // Guided mode unchanged.
  await page.click('#assistantModeGuided');m=await ask(page,'¿Cuántas estancias hay?');assert.match(m.text,/estancias/);
  assert.deepEqual(watch.external,[]);assert.deepEqual(watch.errors,[]);
 }finally{await context.close();}
});

test('privacidad: la pregunta libre se envía sin correos, teléfonos ni enlaces reconocibles; el aviso no promete más de lo que se cumple (ES/EN/ZH)',async()=>{
 const {context,page,watch}=await kit.editor(env);
 try{
  const seen=await fakeGateway(page,{queue:[{type:'message',text:'De acuerdo.'}]});
  await open(page);await page.click('#assistantModeGen');await page.waitForFunction(()=>RubikAssistantGenUI.active());await page.check('#assistantConsentQuestion');await page.check('#assistantConsentData');
  const warn=await page.textContent('#assistantGenPrivacy');assert.match(warn,/no puede detectar nombres, direcciones/);assert.match(warn,/solo proyectos sintéticos/);assert.doesNotMatch(await page.textContent('#assistantGenConsent'),/Nunca fotos ni datos de contacto/);
  const m=await ask(page,'Mi cliente Ana (ana.perez@correo.es, +34 612 345 678, https://ejemplo.es/ficha) quiere un salón de 85 m²');
  const sent=JSON.stringify(seen.filter(s=>s.body.action==='step').map(s=>s.body.messages));
  for(const x of ['ana.perez@correo.es','612 345 678','https://ejemplo.es'])assert.equal(sent.includes(x),false,'redacted: '+x);
  assert.ok(sent.includes('85 m²'),'measures are kept');assert.ok(sent.includes('Ana'),'names are NOT detected (documented limit)');
  assert.match(m.text,/Se ocultaron en tu pregunta antes de enviarla: .*email/);
  for(const [lang,re] of [['en',/cannot detect names, addresses/],['zh',/无法识别姓名、地址/]]){await page.evaluate(l=>{try{setLang(l);}catch{}},lang);await page.click('#assistantClose');await open(page);
   assert.match(await page.textContent('#assistantGenPrivacy'),re);}
  assert.deepEqual(watch.external,[]);assert.deepEqual(watch.errors,[]);
 }finally{await context.close();}
});

test('code-gated mode, private in-memory chat and a stale tool turn on the same project',async()=>{
 const {context,page,watch}=await kit.editor(env);
 let release,requested;
 const held=new Promise(resolve=>{release=resolve;});
 const entered=new Promise(resolve=>{requested=resolve;});
 const code='qa-only-synthetic-password';
 const fingerprint='M05_PRIVATE_QUESTION';
 try{
  const seen=await fakeGateway(page,{status:headers=>headers['x-rubik-assistant-code']===code
   ?{enabled:true,reason:'ok',model:'test-double',priceDate:'2026-11-15',capUsd:1,spentUsd:0}
   :{enabled:true,reason:'code-required',requiresCode:true},
   queue:[{type:'message',text:'M05_PRIVATE_ANSWER'},async()=>{requested();await held;return call('get_project_summary');}]});
  await open(page);
  await page.locator('#assistantModeGuided').focus();await page.keyboard.press('ArrowRight');
  await page.locator('#assistantGenCodeForm').waitFor();
  assert.equal(await page.locator('#assistantModeGuided').getAttribute('aria-checked'),'true');
  await page.fill('#assistantGenCode',code);await page.locator('#assistantGenCode').press('Enter');
  await page.waitForFunction(()=>RubikAssistantGenUI.active());
  assert.equal(seen.filter(x=>x.body.action==='status').at(-1).headers['x-rubik-assistant-code'],code);
  assert.equal(await page.locator('#assistantModeGuided').getAttribute('tabindex'),'-1');
  await page.check('#assistantConsentQuestion');await page.check('#assistantConsentData');
  assert.match((await ask(page,fingerprint)).text,/M05_PRIVATE_ANSWER/);
  await page.click('#assistantClose');await open(page);
  assert.match(await page.textContent('#assistantLog'),/M05_PRIVATE_ANSWER/,'visible within its current session');
  assert.doesNotMatch(await page.evaluate(()=>JSON.stringify({...localStorage})),/M05_PRIVATE_/);
  assert.doesNotMatch(JSON.stringify(await page.evaluate(()=>RubikAssistantUI.trace)),/M05_PRIVATE_/);
  await page.fill('#assistantInput','Revisa la vivienda otra vez');await page.click('#assistantSend');
  await page.waitForFunction(()=>RubikAssistantUI.state.pending);
  await entered;
  await page.evaluate(()=>FloorPlanApp.applyAssistant(p=>{p.name='Cambio de revisión';return {ok:true,project:p};}));
  release();
  await page.waitForFunction(()=>!RubikAssistantUI.state.pending);
  assert.match(await page.textContent('#assistantLog'),/cambió el proyecto o el consentimiento/);
  assert.equal(seen.filter(x=>x.body.action==='step').length,2,'no tool result sent after the edit');
  assert.equal(await page.evaluate(()=>RubikAssistantGenUI.state.history.length),0);
  assert.equal(await page.evaluate(()=>FloorPlanApp.project.name),'Cambio de revisión');
  assert.deepEqual(watch.external,[]);assert.deepEqual(watch.errors,[]);
 }finally{release();await context.close();}
});

test('volver a consulta guiada detiene un turno generativo antes del siguiente paso',async()=>{
 const {context,page}=await kit.editor(env);
 let release,requested;
 const held=new Promise(resolve=>{release=resolve;});
 const entered=new Promise(resolve=>{requested=resolve;});
 try{
  const seen=await fakeGateway(page,{queue:[async()=>{requested();await held;return call('get_project_summary');}]});
  await open(page);await page.click('#assistantModeGen');await page.waitForFunction(()=>RubikAssistantGenUI.active());
  await page.check('#assistantConsentQuestion');await page.check('#assistantConsentData');
  await page.fill('#assistantInput','Revisa la vivienda');await page.click('#assistantSend');await entered;
  await page.click('#assistantModeGuided');release();
  await page.waitForFunction(()=>!RubikAssistantUI.state.pending);
  assert.equal(seen.filter(x=>x.body.action==='step').length,1,'no project tool results were sent');
  assert.match(await page.textContent('#assistantLog'),/Consulta detenida. El proyecto sigue intacto/);
  assert.match((await ask(page,'¿Cuántas estancias hay?')).text,/estancias/);
 }finally{release();await context.close();}
});
