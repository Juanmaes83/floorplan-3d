'use strict';
/* §5.2 · BC3: hacer visible el paso de comparar a aplicar, con la interfaz normal (Presupuestar → Precios de referencia).
   BC3 SINTÉTICO (tests/fixtures/bc3/rubik-qa-sintetico.cjs, reconstrucción declarada del archivo de la prueba humana):
   «Otro BC3» → Zona B → buscar ROBLE en m² → Ver precio → comparar → revisar procedencia → aplicar y confirmar.
   Comprueba: mensaje de carga (catálogo leído, referencias disponibles, columna pendiente) distinto de los precios aplicados;
   pasos visibles; cada referencia y su acción se leen completas SIN desplazamiento horizontal; partida destino, fuente,
   columna, unidad y precio antes de confirmar; confirmación visible; tras recargar, el presupuesto conserva precio, importe,
   fuente, «sin revisar» e historial; cancelar no cambia nada; una referencia de unidad incompatible no se aplica; el
   Asistente no tapa encabezados, celdas ni controles («Revisado»). Escritorio y móvil. Capturas: BC3_SHOTS=<dir>. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const K=require('./ux07/kit.cjs'),{accion}=require('./helpers-perla-entregar.cjs'),BC3=require('./fixtures/bc3/rubik-qa-sintetico.cjs');
const shots=process.env.BC3_SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
let env;test.before(async()=>{env=await K.start({authority:true});});test.after(async()=>{await env?.stop();});
const D='#pricesDialog ';
async function boot(viewport){
 const ctx=await env.browser.newContext({viewport});const page=await ctx.newPage();const w=K.watch(page,env.base);
 await page.goto(env.base);await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false)){await page.keyboard.press('Escape');}
 return {ctx,page,w};}
async function prices(page){await page.evaluate(()=>FloorPlanProfessionalUI.open('budget'));const r=await accion(page,'[data-route="reference-prices"]');await r.click();await page.waitForSelector('#pricesDialog[open]');}
const oak=page=>page.locator(D+'#pricesItems [data-item]').filter({hasText:/Parqué de roble/}).first();
async function loadAndSearch(page,{q='ROBLE',sameUnit=true}={}){
 await oak(page).click();
 await page.setInputFiles('#pricesBc3',{name:'rubik-qa-sintetico.bc3',mimeType:'application/octet-stream',buffer:Buffer.from(BC3.text,'latin1')});
 await page.waitForFunction(()=>/Catálogo leído/.test(document.getElementById('pricesStatus').textContent));
 const msg=await page.locator('#pricesStatus').innerText();
 assert.match(msg,/^Catálogo leído: «BC3 · RUBIK QA» · 3 referencias disponibles para buscar\. Todavía no se ha aplicado ningún precio al proyecto\.$/,'la carga cuenta referencias del catálogo, no precios aplicados');
 assert.match(await page.locator(D+'[data-needs-column]').innerText(),/Falta elegir la columna/);
 await page.locator(D+'#pricesSources [data-col]').selectOption({label:'Zona B'});assert.equal(await page.locator(D+'[data-needs-column]').count(),0,'elegida la columna, el aviso desaparece');
 await page.fill('#pricesQuery',q);if(!sameUnit)await page.locator('#pricesSameUnit').uncheck();await page.locator('#pricesSearch button[type=submit]').click();
 await page.waitForSelector(D+'[data-quote="ROBLE"]');}
const noHScroll=page=>page.evaluate(()=>{const d=document.querySelector('#pricesDialog');const all=[d,...d.querySelectorAll('*')].filter(e=>getComputedStyle(e).overflowX!=='visible');return all.filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.id||e.className);});
const fullyVisible=(page,sel)=>page.locator(sel).evaluate(b=>{const r=b.getBoundingClientRect(),d=b.closest('dialog').getBoundingClientRect();return r.width>0&&r.left>=d.left&&r.right<=d.right&&b.scrollWidth<=b.clientWidth+1;});

test('§5.2 · escritorio: buscar → comparar → procedencia → aplicar y confirmar; recargar conserva precio, importe, fuente, sin revisar e historial',{timeout:300000},async()=>{
 const {ctx,page,w}=await boot({width:1440,height:900});
 try{
  await prices(page);await loadAndSearch(page);
  assert.equal(await page.locator(D+'#pricesSteps li[aria-current="step"]').innerText(),'Buscar');
  await page.locator(D+'[data-quote="ROBLE"]').click();await page.waitForSelector(D+'#pricesOptions');
  assert.equal(await page.locator(D+'#pricesSteps li[aria-current="step"]').innerText(),'Comparar');
  await page.waitForFunction(()=>/42,75/.test(document.querySelector('#pricesOptions')?.textContent||''));const card=await page.locator(D+'#pricesOptions li').first().textContent();assert.match(card,/BC3 RUBIK QA · Zona B[\s\S]*ROBLE[\s\S]*42,75\s€ \/ m²/);
  assert.deepEqual(await noHScroll(page),[],'nada exige desplazamiento horizontal');assert.ok(await fullyVisible(page,D+'#pricesOptions [data-detail="0"]'),'la acción se lee completa');
  assert.equal(await page.locator(D+'#pricesOptions [data-detail="0"]').innerText(),'Revisar procedencia y decidir');
  if(shots)await page.locator('#pricesDialog').screenshot({path:shots+'/1-comparar-escritorio.png'});
  // Cancelar: nada cambia.
  const b0=await page.evaluate(()=>JSON.stringify(FloorPlanReferencePricesUI.state.budget));
  await page.locator(D+'[data-detail="0"]').click();assert.equal(await page.locator(D+'#pricesSteps li[aria-current="step"]').innerText(),'Revisar procedencia');
  await page.locator('#pricesAsPrice').click();await page.waitForSelector('#pricesPreview');await page.locator('#pricesPreview button',{hasText:'Cancelar'}).click();
  assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanReferencePricesUI.state.budget)),b0,'cancelar no cambia el presupuesto');
  // Aplicar: destino, fuente, columna, unidad y precio a la vista antes de confirmar.
  await page.locator('#pricesAsPrice').click();await page.waitForSelector('#pricesTarget');assert.equal(await page.locator(D+'#pricesSteps li[aria-current="step"]').innerText(),'Aplicar y confirmar');
  const tgt=await page.locator('#pricesTarget').textContent();for(const re of [/Partida destinoPavimento Parqué de roble/,/Cantidad de la partida\d+,\d{1,2} m²/,/FuenteBC3[ ·]+RUBIK QA/,/ColumnaZona B/,/Unidadm²/,/Precio42,75\s€ sin IVA/])assert.match(tgt,re,tgt);
  if(shots)await page.locator('#pricesDialog').screenshot({path:shots+'/2-antes-de-confirmar.png'});
  await page.locator('#pricesConfirm').click();await page.waitForSelector('#pricesSaved');
  const saved=await page.locator('#pricesSaved').innerText();assert.match(saved,/^Precio aplicado y guardado\s*· «Pavimento Parqué de roble»: 42,75\s€ \/ m² · importe [\d.]+,\d\d\s€ sin IVA · BC3 RUBIK QA · Zona B\. Queda «sin revisar»/);
  const net=Number(saved.match(/importe ([\d.]+,\d\d)\s€/)[1].replace(/\./g,'').replace(',','.'));
  const qty=await page.evaluate(()=>{const it=FloorPlanReferencePricesUI.state.budget.items.find(i=>/Parqué de roble/.test(i.description));return {q:it.quantity.value,waste:it.wastePercent??it.waste?.percent??0};});
  assert.ok(Math.abs(net-Math.round(qty.q*(1+qty.waste/100)*42.75*100)/100)<0.02,`importe = cantidad × (1+merma) × precio (${JSON.stringify(qty)} → ${net})`);
  if(shots)await page.locator('#pricesDialog').screenshot({path:shots+'/3-guardado.png'});
  // Recargar y abrir el MISMO presupuesto.
  await page.evaluate(async()=>{await FloorPlanApp.persistence.requireSaved();});await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
  if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false)){await page.keyboard.press('Escape');}
  await page.evaluate(()=>FloorPlanBudgetUI.open());await page.waitForSelector('#budgetDialog[open]');
  const row=await page.evaluate(()=>{const it=FloorPlanBudgetUI.current().budget.items.find(i=>/Parqué de roble/.test(i.description));return {p:it.unitPrice,src:it.priceSource?.type,code:it.priceReference?.code,rev:it.review.status};});
  assert.deepEqual([row.p,row.src,row.code,row.rev],[42.75,'provider-reference','ROBLE','unreviewed'],'precio, fuente y «sin revisar» tras recargar');
  // El Asistente no tapa encabezados, celdas ni «Revisado».
  const tapado=await page.evaluate(()=>{const a=document.querySelector('#budgetDialog #assistantAccess, #budgetDialog .assistant-access, #assistantFab');if(!a||!a.getClientRects().length)return [];const r=a.getBoundingClientRect();
   return [...document.querySelectorAll('#budgetDialog th, #budgetDialog td, #budgetDialog input, #budgetDialog button')].filter(e=>e!==a&&!a.contains(e)&&e.getClientRects().length).filter(e=>{const q=e.getBoundingClientRect();return q.right>r.left+1&&q.left<r.right-1&&q.bottom>r.top+1&&q.top<r.bottom-1;}).map(e=>e.dataset.label||e.textContent.trim().slice(0,20)||e.tagName);});

  assert.deepEqual(tapado,[],'el Asistente no tapa nada del presupuesto');
  if(shots)await page.locator('#budgetDialog').screenshot({path:shots+'/4-presupuesto-tras-recargar.png'});
  await page.keyboard.press('Escape');await prices(page);
  await page.waitForSelector(D+'#pricesHistory li',{state:'attached'});if(!await page.locator(D+'#pricesHistory').evaluate(d=>d.open))await page.locator(D+'#pricesHistory summary').click();const hist=await page.locator(D+'#pricesHistory').textContent();assert.match(hist,/Precio aplicado · Pavimento Parqué de roble · .* → 42,75\s€/,'historial');
  assert.deepEqual(w.errors,[]);assert.deepEqual(w.external,[]);
 }finally{await ctx.close();}
});

test('§5.2 · unidad incompatible no se aplica; móvil 390×844 sin desplazamiento horizontal y acciones completas',{timeout:300000},async()=>{
 const {ctx,page,w}=await boot({width:390,height:844});
 try{
  await prices(page);await loadAndSearch(page,{q:'roble',sameUnit:false});
  await page.locator(D+'[data-quote="ROBLE-UD"]').click();await page.waitForSelector(D+'#pricesOptions');
  const i=await page.evaluate(()=>FloorPlanReferencePricesUI.state.quotes.findIndex(q=>q.code==='ROBLE-UD'));
  if(await page.locator(D+`[data-detail="${i}"]`).count()){await page.locator(D+`[data-detail="${i}"]`).click();await page.locator('#pricesAsPrice').click();await page.waitForSelector('#pricesPreview');
   assert.match(await page.locator('#pricesPreview').innerText(),/No se puede aplicar[\s\S]*Tu presupuesto no ha cambiado/,'unidad incompatible: bloqueado y explicado');}
  else assert.match(await page.locator(D+'#pricesOptions').innerText(),/unidad/i,'la referencia de otra unidad no ofrece aplicar');
  await page.locator(D+'[data-quote="ROBLE"]').click();
  assert.deepEqual(await noHScroll(page),[],'móvil: nada exige desplazamiento horizontal');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1));
  for(const b of await page.locator(D+'#pricesOptions [data-detail]').all())assert.ok(await b.evaluate(x=>{const r=x.getBoundingClientRect(),d=x.closest('dialog').getBoundingClientRect();return r.left>=d.left&&r.right<=d.right;}),'acción completa en móvil');
  if(shots)await page.locator('#pricesDialog').screenshot({path:shots+'/5-movil-comparar.png'});
  assert.deepEqual(w.errors,[]);
 }finally{await ctx.close();}
});
