'use strict';
/* CAT-04 · cross audit #237 (XR-01, XR-02) in the REAL editor (Chromium). No network, no /api/.
   XR-01: a PLACEABLE product sold per linear metre (the synthetic QA sideboard re-imported by the studio with its
     commercial unit «ml»; the QA worktop is a material and CAT-03 never places materials) is placed twice and gets a
     hand-typed price of 180 €/m in Presupuestar, reviewed. Then the catalogue disappears (and the page is reloaded),
     and later the sheet comes back priced per «ud». Presupuestar must never show or save 2 × 180 €: the price stays per
     m with its source, the quantity stays pending,
     and a unit change is announced and withdraws the review until the professional decides.
   XR-02: a visual sheet already linked from another studio, or by an older link without studio, is NOT re-attributed by
     «Vincular al proyecto»: the refusal is explained and Presupuestar keeps the original provenance. */
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./photo-project/kit.cjs'),{loadPilot}=require('./cat-ia/kit.cjs');
// Evidence (scripts/qa/record-cat04.cjs): video of each test and screenshots of the key states, same assertions.
const VID=process.env.CAT04_VIDEO||null,SHOTS=process.env.CAT04_SHOTS||null,rec=VID?{recordVideo:{dir:VID,size:{width:1440,height:900}}}:{};
const shot=async(page,name,sel)=>{if(!SHOTS)return;if(sel)await page.locator(sel).first().scrollIntoViewIfNeeded().catch(()=>{});await page.screenshot({path:require('node:path').join(SHOTS,name+'.png')});};
let env;
test.before(async()=>{env=await K.start();});
test.after(async()=>{await env?.stop();});
const ENC='cat:local:piloto-sintetico-qa:aparador-lumen:roble';
// The studio re-imports the QA collection with the sideboard sold per «unit» (ud, as shipped) or per linear metre (ml).
const saveSideboardUnit=(page,unit)=>page.evaluate(async unit=>{const C=RubikCatalogProduct,raw=await (await fetch('assets/cat-ia/fixtures/pilot-collection.json')).json();
 raw.products=raw.products.map(p=>p.productId==='aparador-lumen'&&p.variantId==='roble'?{...p,commercial:{...p.commercial,unit}}:p);
 const c=C.importCollection(C.createCatalog({catalogId:'piloto-sintetico-qa',studioId:'local'}),raw,{today:'2026-11-14'}).catalog;C.saveCatalog(localStorage,c);return c.products.find(p=>p.productId==='aparador-lumen'&&p.variantId==='roble').commercial.unit;},unit);
const toEditor=async page=>{await page.locator('#workArea-design').click().catch(()=>{});await page.locator('#professionalWorkspace').waitFor({state:'hidden'}).catch(()=>{});};
async function openBudget(page){await page.locator('#workArea-budget').click();const b=page.locator('[data-route="budget-edit"]');await b.waitFor();await b.scrollIntoViewIfNeeded();await b.click();await page.locator('#budgetDialog[open]').waitFor();}
const closeBudget=page=>page.evaluate(()=>document.querySelector('#budgetDialog').close());
const savedItem=(page,id)=>page.evaluate(id=>{const all=JSON.parse(localStorage.getItem('rubik-budget-v1')||'{}');return (all[FloorPlanApp.project.id]?.items||[]).find(i=>i.id===id)||null;},id);
const lineOf=(page,id)=>page.evaluate(id=>{const c=FloorPlanBudgetUI.current(),t=FloorPlanBudget.calculateBudget(c.budget);const l=t.lines.find(x=>x.id===id);return {unit:l.quantity.unit,value:l.quantity.value,price:l.unitPrice,src:l.priceSource?.label||null,review:l.review.status,subtotal:l.subtotalNet,complete:t.totals.net.complete};},id);
async function place(page,key){const tab=page.locator('#paletteTabFurnish');if(await tab.getAttribute('aria-selected')!=='true')await tab.click();
 await page.locator('#catalogPlaceOpen').click();await page.locator('#catalogDialog[open]').waitFor();
 await page.locator(`#catalogList .catalog-item[data-key="${key}"]`).click();await page.locator(`#catalogPreview[data-key="${key}"]`).waitFor();
 await page.waitForFunction(()=>!!document.querySelector('#catalogPlaceNote')?.dataset.state);await page.locator('#catalogPlace').click();await page.locator('#catalogDialog').waitFor({state:'hidden'});}
// The one oracle: price per metre kept with its source, quantity unknown, NO amount (never 360 €), budget incomplete.
function conserved(l,{review},msg){assert.deepEqual([l.unit,l.value,l.price,l.src,l.review],['m',null,180,'Precio propio',review],msg+': unit, unknown quantity, price, source, review');
 assert.equal(l.subtotal,null,msg+': no amount');assert.notEqual(l.subtotal,360,msg+': never 2 × 180');assert.equal(l.complete,false,msg+': budget incomplete');}

test('XR-01 · precio manual por metro en el editor: catálogo perdido, recarga y cambio de unidad nunca dan 2 × 180 € (ES/EN)',{timeout:300000},async()=>{
 const {context,page}=await K.editor(env,rec);const w=K.watch(page,env.base),api=[];page.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url());});
 try{
  await loadPilot(page,false);assert.equal(await saveSideboardUnit(page,'ml'),'ml','fixture: sideboard sold per linear metre');
  await toEditor(page);await place(page,'aparador-lumen@roble');await place(page,'aparador-lumen@roble');
  await openBudget(page);const tr=page.locator(`#budgetDialog tr[data-item="${ENC}"]`);await tr.waitFor();
  assert.match(await tr.locator('.cat04-row').textContent(),/Pendiente de medición: la ficha tiene precio por ml/);
  // The professional types 180 in the price cell and ticks «Revisado» (real UI controls).
  const price=tr.locator('[data-field="price"]');await price.fill('180');await price.dispatchEvent('change');
  await page.waitForFunction(id=>document.querySelector(`#budgetDialog tr[data-item="${id}"] [data-field="review"]`)?.disabled===false,ENC);
  await tr.locator('[data-field="review"]').check();
  conserved(await lineOf(page,ENC),{review:'reviewed'},'fixture with sheet');await closeBudget(page);
  // 1) The catalogue disappears (deleted / other browser / damaged data).
  await page.evaluate(()=>localStorage.removeItem(RubikCatalogProduct.STORAGE_PREFIX+'local'));
  await openBudget(page);await tr.waitFor();
  conserved(await lineOf(page,ENC),{review:'reviewed'},'catalogue removed');
  assert.match(await tr.locator('.cat04-row').textContent(),/Ficha no disponible: se conserva la unidad ml/);
  assert.equal(await tr.locator('[data-field="price"]').inputValue(),'180');assert.doesNotMatch(await tr.textContent(),/360/,'no 360 € anywhere in the row');
  await shot(page,'xr01-1-catalogo-perdido-precio-por-metro-sin-importe',`#budgetDialog tr[data-item="${ENC}"]`);
  const s1=await savedItem(page,ENC);assert.deepEqual([s1.quantity.unit,s1.quantity.value,s1.unitPrice,s1.review.status],['m',null,180,'reviewed'],'saved document');
  await closeBudget(page);
  // 2) Reload the page (reopen RUBIK): same document, same figures.
  await page.reload();await page.locator('#welcomeDialog[open], #professionalWorkspace').first().waitFor().catch(()=>{});await page.evaluate(()=>{const d=document.querySelector('#welcomeDialog');if(d?.open)d.close();});
  await openBudget(page);await tr.waitFor();conserved(await lineOf(page,ENC),{review:'reviewed'},'after reload');await closeBudget(page);
  // 3) The sheet comes back priced per «ud»: no conversion, warning, review withdrawn.
  assert.equal(await saveSideboardUnit(page,'ud'),'ud');
  await openBudget(page);await tr.waitFor();
  conserved(await lineOf(page,ENC),{review:'unreviewed'},'sheet now per ud');
  assert.match(await page.locator('#budgetUnitConflict').innerText(),/cambiado de unidad: no se convierte ningún precio/);
  assert.match(await tr.locator('.cat04-row').textContent(),/Unidad cambiada \(m → unit\)/);
  await shot(page,'xr01-2-cambio-de-unidad-aviso','#budgetUnitConflict');await shot(page,'xr01-3-cambio-de-unidad-partida',`#budgetDialog tr[data-item="${ENC}"]`);
  await closeBudget(page);await page.evaluate(()=>{try{setLang('en');}catch{}});await openBudget(page);
  assert.match(await page.locator('#budgetUnitConflict').innerText(),/changed unit: no price is converted/);
  // 4) Explicit decision: the professional removes the per-metre price → the new unit enters, without any price.
  await page.locator(`#budgetDialog tr[data-item="${ENC}"] [data-field="price"]`).fill('');await page.locator(`#budgetDialog tr[data-item="${ENC}"] [data-field="price"]`).dispatchEvent('change');
  await closeBudget(page);await openBudget(page);
  const l=await lineOf(page,ENC);assert.deepEqual([l.unit,l.value,l.price,l.subtotal],['unit',2,null,null],'after the explicit decision: 2 ud, no price, no amount');
  assert.equal(await page.locator('#budgetUnitConflict').count(),0);
  assert.deepEqual(api,[]);assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});

test('XR-02 · «Vincular al proyecto» no reatribuye una ficha ya vinculada desde otro estudio ni un vínculo antiguo; se explica cómo hacerlo (ES/EN)',{timeout:300000},async()=>{
 const {context,page}=await K.editor(env,rec);const w=K.watch(page,env.base);
 try{
  await loadPilot(page,false);await toEditor(page);
  const r=await page.evaluate(()=>{const V=RubikVisualReform,VR=RubikVisualReferences;
   const req={version:1,mode:'catalog',recipeId:'kitchen-catalog-faithful',recipeVersion:'1.0.0',zone:'appliance',intensity:'faithful',alternatives:1,preserve:['furniture-layout'],mask:[[0.55,0.4,0.2,0.3]],references:[{family:'electrodomesticos',kind:'appliance',sha256:'a'.repeat(64)}]};
   const ref={catalogId:'piloto-sintetico-qa',catalogRevision:1,productId:'horno-h60',variantId:'inox',sku:'QA-H60-INOX',displayName:'Horno integrable H60 inox',family:'electrodomesticos',imageSha256:'a'.repeat(64),license:{scope:['reference-image'],proofRef:'LICENSE.txt'}};
   const ok=V.review({ratios:{inside:.4,outside:0},intensity:'faithful',human:{openingsIntact:true,geometryIntact:true}});
   const mk=sha=>V.resultSheet({source:{kind:'photo',sha256:sha,width:1200,height:900},request:req,references:[ref],result:{kind:'simulated'},review:ok,decision:'accepted',at:'2026-11-15T09:00:00Z'});
   const sB=mk('b'.repeat(64)),sL=mk('c'.repeat(64)),sN=mk('d'.repeat(64));
   FloorPlanApp.applyExtension(p=>{VR.link(p,sB,{studioId:'brd-estudio-b',at:'2026-11-15T08:00:00Z'});VR.link(p,sL,{at:'2026-11-14T08:00:00Z'});return {ok:true,project:p};});
   const before=JSON.stringify(FloorPlanApp.project.extensions[VR.EXT]),undo=undoStack.length;
   // The UI action of «Vincular al proyecto» (studio «local»).
   const a=RubikCat04.linkVisual(sB),b=RubikCat04.linkVisual(sL),n=RubikCat04.linkVisual(sN),again=RubikCat04.linkVisual(sN);
   const ext=FloorPlanApp.project.extensions[VR.EXT].refs;
   return {a,b,n,again,unchanged:JSON.stringify({version:1,refs:{[sB.hash]:ext[sB.hash],[sL.hash]:ext[sL.hash]}})===JSON.stringify({version:1,refs:JSON.parse(before).refs}),
    studios:[ext[sB.hash].studioId,'studioId' in ext[sL.hash],ext[sN.hash].studioId],undoSteps:undoStack.length-undo,hashes:[sB.hash,sL.hash]};});
  assert.deepEqual([r.a.ok,r.a.code],[false,'studio-conflict']);assert.match(r.a.reason,/ya está vinculada desde el estudio «brd-estudio-b»/);assert.match(r.a.reason,/quita antes ese vínculo/);
  assert.deepEqual([r.b.ok,r.b.code],[false,'studio-conflict']);assert.match(r.b.reason,/sin estudio \(vínculo anterior\)/);
  assert.equal(r.n.ok,true,'a new sheet links normally');assert.equal(r.again.ok,true,'same studio again: idempotent, accepted');
  assert.equal(r.unchanged,true,'the existing links are byte-for-byte unchanged');assert.deepEqual(r.studios,['brd-estudio-b',false,'local']);
  assert.equal(r.undoSteps,1,'only the new link made an editor step (refusals and the idempotent relink made none)');
  await openBudget(page);await page.locator('#cat04VisualList').waitFor();
  const cs=await page.evaluate(h=>h.map(x=>document.querySelector(`#cat04VisualList li[data-hash="${x}"] .cat04-vref`)?.dataset.catalogStatus),r.hashes);
  assert.deepEqual(cs,['other-studio','studio-unknown'],'Presupuestar keeps the original provenance');
  await shot(page,'xr02-referencias-visuales-procedencia-conservada','#cat04VisualList');
  await closeBudget(page);await page.evaluate(()=>{try{setLang('en');}catch{}});
  const en=await page.evaluate(()=>{const s=JSON.parse(JSON.stringify(Object.values(FloorPlanApp.project.extensions['x-cat04-visual-refs'].refs)[0].sheet));return RubikCat04.linkVisual(s).reason;});
  assert.match(en,/already linked from studio «brd-estudio-b»/);
  assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});
