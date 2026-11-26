'use strict';
/* §5.2 · Correcciones de la revisión humana de la Preview (26/11/2026), con el BC3 sintético en Zona B:
   1) «Ver precio» lleva a la referencia y deja «Revisar procedencia» enfocada y a la vista; «Confirmar» y «Cancelar» juntos
      y visibles; cancelar conserva partida, búsqueda y referencia.
   2) El filtro por unidad informa de lo que oculta y ofrece «Mostrar otras unidades»; ROBLE-UD explica por qué no se
      aplica a una partida en m²; presupuesto e historial intactos.
   3) La confirmación muestra superficie medida, merma, cantidad presupuestada, precio e importe de la partida (cálculo
      del presupuesto) y explica la precisión; el importe confirmado = el de la partida guardada; distinto del importe
      conocido de todo el presupuesto.
   4) Recorrido real: cancelar → ROBLE-UD bloqueado → aplicar ROBLE → «Revisar en el presupuesto» → recargar. Capturas BC3_SHOTS. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const K=require('./ux07/kit.cjs'),{accion}=require('./helpers-perla-entregar.cjs'),BC3=require('./fixtures/bc3/rubik-qa-sintetico.cjs');
const shots=process.env.BC3_SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
let env;test.before(async()=>{env=await K.start({authority:true});});test.after(async()=>{await env?.stop();});
const D='#pricesDialog ';
async function boot(viewport){const ctx=await env.browser.newContext({viewport});const page=await ctx.newPage();const w=K.watch(page,env.base);
 await page.goto(env.base);await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false))await page.keyboard.press('Escape');return {ctx,page,w};}
async function prices(page){await page.evaluate(()=>FloorPlanProfessionalUI.open('budget'));const r=await accion(page,'[data-route="reference-prices"]');await r.click();await page.waitForSelector('#pricesDialog[open]');}
const budgetJSON=page=>page.evaluate(()=>JSON.stringify(FloorPlanReferencePricesUI.state.budget));
const histCount=page=>page.locator(D+'#pricesHistory li').count();
const inView=(page,sel)=>page.locator(sel).evaluate(e=>{const r=e.getBoundingClientRect(),b=e.closest('.cx-body')?.getBoundingClientRect()||{top:0,bottom:innerHeight};return r.height>0&&r.top>=b.top-1&&r.bottom<=b.bottom+1&&r.bottom<=innerHeight;});
async function search(page){
 await page.locator(D+'#pricesItems [data-item]').filter({hasText:/Parqué de roble/}).first().click();
 await page.setInputFiles('#pricesBc3',{name:'rubik-qa-sintetico.bc3',mimeType:'application/octet-stream',buffer:Buffer.from(BC3.text,'latin1')});
 await page.waitForFunction(()=>/Catálogo leído/.test(document.getElementById('pricesStatus').textContent));
 await page.locator(D+'#pricesSources [data-col]').selectOption({label:'Zona B'});
 await page.fill('#pricesQuery','ROBLE');await page.locator('#pricesSearch button[type=submit]').click();await page.waitForSelector(D+'[data-quote="ROBLE"]');}
for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`§5.2 · revisión humana: avanzar sin buscar, filtro que avisa, desglose del importe, cancelar conserva (${viewport.width}x${viewport.height})`,{timeout:300000},async()=>{
 const {ctx,page,w}=await boot(viewport);const tag=viewport.width;
 try{
  await prices(page);await search(page);const b0=await budgetJSON(page),h0=await histCount(page);
  // 2 · El filtro avisa de lo que oculta.
  assert.match(await page.locator('#pricesHiddenUnits').innerText(),/^1 coincidencia oculta por estar en otra unidad que la partida\./);
  assert.equal(await page.locator(D+'[data-quote="ROBLE-UD"]').count(),0,'el filtro sigue activo');
  // 1 · «Ver precio» → la referencia, con «Revisar procedencia» enfocada y a la vista.
  await page.locator(D+'[data-quote="ROBLE"]').click();await page.waitForSelector(D+'#pricesOptions [data-detail]');await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset?.detail),'0','«Revisar procedencia» enfocada');assert.ok(await inView(page,D+'#pricesOptions [data-detail="0"]'),'y a la vista');
  if(shots)await page.screenshot({path:`${shots}/r1-ver-precio-${tag}.png`});
  await page.locator(D+'[data-detail="0"]').click();await page.locator('#pricesAsPrice').click();await page.waitForSelector('#pricesBreakdown');await page.waitForTimeout(250);
  // 3 · Desglose: 32,56 m² · 5 % · 34,19 m² · 42,75 € · 1.461,66 €; precisión explicada; distinto del total del presupuesto.
  const bd=await page.locator('#pricesBreakdown').innerText();
  for(const re of [/Superficie medida\s*32,56 m²/,/Merma\s*5 %/,/Cantidad presupuestada\s*34,19 m²/,/Precio unitario\s*42,75\s€ \/ m² sin IVA/,/Importe de la partida\s*1\.461,66\s€ sin IVA/,/redondea solo el importe final al céntimo/])assert.match(bd,re,bd);
  assert.match(await page.locator('#pricesPreview').innerText(),/Importe conocido de todo el presupuesto después: .*no es el importe de esta partida/);
  assert.ok(await inView(page,'#pricesConfirm')&&await inView(page,'#pricesCancel'),'«Confirmar» y «Cancelar» juntos y a la vista');
  const sub=+await page.locator('#pricesBreakdown').getAttribute('data-subtotal');
  if(shots)await page.screenshot({path:`${shots}/r2-desglose-${tag}.png`});
  // 1 · Cancelar conserva partida, búsqueda y referencia; nada cambia.
  await page.locator('#pricesCancel').click();await page.waitForTimeout(250);
  assert.equal(await budgetJSON(page),b0,'cancelar: presupuesto intacto');assert.equal(await page.inputValue('#pricesQuery'),'ROBLE','búsqueda conservada');
  assert.match(await page.locator(D+'#pricesItems [aria-current], '+D+'#pricesItems [aria-pressed="true"], '+D+'#pricesItems .on').first().innerText().catch(()=>''),/Parqué de roble|/);
  assert.equal(await page.evaluate(()=>FloorPlanReferencePricesUI.state.quotes.map(q=>q.code).join()),'ROBLE','referencia conservada');assert.equal(await page.locator(D+'#pricesOptions li[aria-current]').count(),1);
  assert.match(await page.locator('#pricesStatus').innerText(),/Cancelado: el presupuesto no ha cambiado/);
  // 2 · Mostrar otras unidades → ROBLE-UD explica por qué no se aplica; presupuesto e historial intactos.
  await page.locator('#pricesShowUnits').click();await page.waitForSelector(D+'[data-quote="ROBLE-UD"]');assert.equal(await page.locator('#pricesSameUnit').isChecked(),false);
  await page.locator(D+'[data-quote="ROBLE-UD"]').click();await page.waitForSelector(D+'[data-unit-block]');
  assert.match(await page.locator(D+'[data-unit-block]').innerText(),/^No se puede aplicar a esta partida: la referencia se mide en ud y la partida en m²\. RUBIK no convierte unidades; el presupuesto y el historial no cambian\.$/);
  assert.equal(await budgetJSON(page),b0);assert.equal(await histCount(page),h0,'historial intacto');
  if(shots)await page.screenshot({path:`${shots}/r3-roble-ud-${tag}.png`});
  if(viewport.width<900){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1));assert.deepEqual(w.errors,[]);return;}
  // 4 · Aplicar ROBLE: el importe guardado = el confirmado; «Revisar en el presupuesto»; recargar.
  const iR=await page.evaluate(()=>FloorPlanReferencePricesUI.state.quotes.findIndex(q=>q.code==='ROBLE'));
  await page.locator(D+`[data-detail="${iR}"]`).click();await page.locator('#pricesAsPrice').click();await page.waitForSelector('#pricesConfirm');await page.locator('#pricesConfirm').click();await page.waitForSelector('#pricesSaved');
  const saved=await page.evaluate(()=>{const b=FloorPlanReferencePricesUI.state.budget,it=b.items.find(i=>/Parqué de roble/.test(i.description));return FloorPlanBudget.calculateItem(it,b.taxRatePercent).subtotalNet;});
  assert.equal(saved,sub,'importe confirmado = importe de la partida guardada');assert.match(await page.locator('#pricesSaved').innerText(),/importe 1\.461,66\s€ sin IVA/);
  await page.locator('#pricesSaved button',{hasText:'Revisar en el presupuesto'}).click();await page.waitForSelector('#budgetDialog[open]');
  if(shots)await page.screenshot({path:`${shots}/r4-revisar-presupuesto-${tag}.png`});
  await page.evaluate(async()=>{await FloorPlanApp.persistence.requireSaved();});await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
  if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false))await page.keyboard.press('Escape');
  const row=await page.evaluate(()=>{FloorPlanBudgetUI.open();const it=FloorPlanBudgetUI.current().budget.items.find(i=>/Parqué de roble/.test(i.description));return [it.unitPrice,it.priceSource?.type,it.priceReference?.code,it.review.status];});
  assert.deepEqual(row,[42.75,'provider-reference','ROBLE','unreviewed']);await page.keyboard.press('Escape');
  await prices(page);await page.waitForSelector(D+'#pricesHistory li',{state:'attached'});assert.match(await page.locator(D+'#pricesHistory').textContent(),/Precio aplicado · Pavimento Parqué de roble · .* → 42,75/);
  assert.deepEqual(w.errors,[]);assert.deepEqual(w.external,[]);
 }finally{await ctx.close();}
});
