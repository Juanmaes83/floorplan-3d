'use strict';
/* CAT-04 en el editor REAL (Chromium, controles visibles): «Mis catálogos» → colocar → «Presupuestar» (mismo documento
   y cálculo) → precio de ficha solo como referencia y aplicado con vista previa y confirmación → duplicar, deshacer,
   rehacer, reabrir, ficha nueva, borrar → Asistente con las MISMAS cifras → Entregar · dossier económico → exportar.
   En paralelo: Estudio de imágenes → simulación revisada → «Vincular al proyecto» → reconocida en Presupuestar sin
   importe → consultada por el Asistente. Móvil 390×844 EN y apaisado 844×390 ZH. Ninguna petición externa ni a /api/. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const K=require('./photo-project/kit.cjs'),{synthKitchen,loadPilot,openStudio,dragZone}=require('./cat-ia/kit.cjs');
const VID=process.env.CAT04_VIDEO||null,rec=size=>VID?{recordVideo:{dir:VID,size}}:{};
const OUT=process.env.CAT04_SHOTS||null,RB='cat:local:piloto-sintetico-qa:aparador-lumen:roble',H60='cat:local:piloto-sintetico-qa:horno-h60:inox';
const PILOT=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/cat-ia/fixtures/pilot-collection.json'),'utf8'));
let env;
test.before(async()=>{env=await K.start();});
test.after(async()=>{await env?.stop();});
const shot=async(page,name)=>{if(!OUT)return;fs.mkdirSync(OUT,{recursive:true});await page.screenshot({path:path.join(OUT,name+'.png')});};
const go=(l,touch)=>touch?l.tap():l.click();
async function openFromPalette(page,touch=false){
 if(touch&&!(await page.locator('aside.lib.open').count())){await page.locator('#tgLib').tap();await page.locator('aside.lib.open').waitFor();}
 const tab=page.locator('#paletteTabFurnish');if(await tab.getAttribute('aria-selected')!=='true')await go(tab,touch);
 const b=page.locator('#catalogPlaceOpen');await b.scrollIntoViewIfNeeded();await go(b,touch);await page.locator('#catalogDialog[open]').waitFor();}
async function place(page,key,touch=false){const it=page.locator(`#catalogList .catalog-item[data-key="${key}"]`);await it.scrollIntoViewIfNeeded();await go(it,touch);await page.locator(`#catalogPreview[data-key="${key}"]`).waitFor();
 await page.waitForFunction(()=>!!document.querySelector('#catalogPlaceNote')?.dataset.state);const before=new Set(await page.evaluate(()=>FloorPlanApp.project.objects.map(o=>o.id)));
 const b=page.locator('#catalogPlace');await b.scrollIntoViewIfNeeded();await go(b,touch);await page.locator('#catalogDialog').waitFor({state:'hidden'});
 return (await page.evaluate(()=>FloorPlanApp.project.objects.map(o=>o.id))).find(x=>!before.has(x));}
// The click is computed on the DRAWN plan: wait until the plan has been redrawn (two frames) so that a previous delete or
// re-render cannot leave a stale position (CI flake on #238: the click landed on the room under a just-removed object).
async function selectFurn(page,id){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const pt=await page.evaluate(id=>{const g=document.querySelector(`#plan g.furn[data-fid="${id}"]`),r=g.getBoundingClientRect();
 for(let i=1;i<20;i++)for(let j=1;j<20;j++){const x=r.left+r.width*i/20,y=r.top+r.height*j/20,e=document.elementFromPoint(x,y);if(e?.closest('g.furn')?.dataset.fid===id)return {x,y};}return null;},id);
 if(!pt)throw Error('object not reachable '+id);await page.mouse.click(pt.x,pt.y);await page.waitForFunction(id=>ui.sel?.kind==='furn'&&ui.sel.id===id,id);}
async function openBudget(page,touch=false){await go(page.locator('#workArea-budget'),touch);const b=page.locator('[data-route="budget-edit"]');await b.waitFor();await b.scrollIntoViewIfNeeded();await go(b,touch);await page.locator('#budgetDialog[open]').waitFor();}
const closeBudget=page=>page.evaluate(()=>document.querySelector('#budgetDialog').close());
const toEditor=async page=>{await page.locator('#workArea-design').click().catch(()=>{});await page.locator('#professionalWorkspace').waitFor({state:'hidden'}).catch(()=>{});};
// The figures of the document Presupuestar keeps (the one authority) for one item.
const truth=(page,id)=>page.evaluate(id=>{const cur=FloorPlanBudgetUI.current(),c=FloorPlanBudget.calculateBudget(cur.budget),it=cur.budget.items.find(i=>i.id===id)||null,l=c.lines.find(x=>x.id===id)||null;
 return {saved:cur.saved,item:it&&{qty:it.quantity.value,unit:it.quantity.unit,price:it.unitPrice,review:it.review.status,src:it.priceSource?.type||null,refCode:it.priceReference?.code||null,refEdition:it.priceReference?.source?.edition||null},subtotal:l?.subtotalNet??null,
  net:c.totals.net.amount,netComplete:c.totals.net.complete,unpriced:c.totals.unpricedItemIds.length,catalogItems:cur.budget.items.filter(i=>i.id.startsWith('cat:')).map(i=>i.id)};},id);
const rowState=(page,id)=>page.locator(`#budgetDialog tr[data-item="${id}"] .cat04-row`).getAttribute('data-state');
async function ask(page,q){await page.waitForFunction(()=>!!window.RubikAssistantUI);if(!(await page.locator('#assistantPanel:not([hidden])').count()))await page.locator('#assistantOpen').click();
 await page.waitForSelector('#assistantPanel:not([hidden])');await page.fill('#assistantInput',q);await page.click('#assistantSend');await page.waitForFunction(()=>!RubikAssistantUI.state.pending);
 return page.evaluate(()=>RubikAssistantUI.state.log.at(-1)?.text||'');}

test('CAT-04 escritorio: catálogo → Presupuestar → precio con confirmación → duplicar/deshacer/rehacer/reabrir → ficha nueva → Asistente y dossier con las mismas cifras → borrar → exportar',{timeout:600000},async()=>{
 const {context,page}=await K.editor(env,{acceptDownloads:true,...rec({width:1440,height:900})});const w=K.watch(page,env.base),api=[];page.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url());});
 try{
  // 1–3. Catalogue (synthetic QA fixtures) and placement from «Producto de mi estudio».
  await loadPilot(page,false);await toEditor(page);await openFromPalette(page);const o1=await place(page,'aparador-lumen@roble');
  await openFromPalette(page);const oven=await place(page,'horno-h60@inox');assert.ok(o1&&oven);
  // 4–7. Presupuestar: the item is in the document, with SKU, count, unit and source; NO automatic price.
  await openBudget(page);const tr=page.locator(`#budgetDialog tr[data-item="${RB}"]`);await tr.waitFor();
  assert.match(await page.locator('#budgetDialog table[data-chapter="catalog"] caption').innerText(),/Productos de mi estudio/i);
  assert.match(await tr.innerText(),/Aparador Lumen 160 roble · QA-LUMEN-160-RB · ficha sintética QA/);assert.match(await tr.innerText(),/1 objeto\(s\) en el proyecto/);
  let T=await truth(page,RB);assert.deepEqual(T.item,{qty:1,unit:'unit',price:null,review:'unreviewed',src:null,refCode:null,refEdition:null},'no automatic price');assert.equal(T.subtotal,null);
  assert.equal(await tr.locator('[data-field="price"]').inputValue(),'');assert.equal(await rowState(page,RB),'sheet-price-available');
  assert.match(await tr.locator('.cat04-sheet').innerText(),/Ficha: 690,00\s€\/ud · Tarifa sintética QA \(no es un precio de mercado\) · verificado 2026-11-14 · rev 1 · ficha v1 · synthetic-fixture/);
  assert.equal(await rowState(page,H60),'unknown-price');assert.equal((await truth(page,H60)).item.price,null,'unknown price is not 0');
  await tr.scrollIntoViewIfNeeded();await shot(page,'cat04-01-presupuesto-sin-precio');
  // 7–8. Reference → provenance → preview → CANCEL (nothing changes) → preview → CONFIRM.
  await tr.locator('.cat04-price').click();const pd=page.locator('#pricesDialog');await pd.waitFor();
  const prov=await page.locator('#pricesProvenance').innerText();assert.match(prov,/Código\s+QA-LUMEN-160-RB/);assert.match(prov,/Edición\s+rev 1 · ficha v1/);assert.match(prov,/Precio\s+690,00\s€ sin IVA/);assert.match(prov,/Atribución\s+Piloto sintético QA · synthetic-fixture/);
  const rev0=await page.evaluate(()=>FloorPlanCostCatalog.revisionTag(FloorPlanBudgetUI.current().budget));
  await page.click('#pricesAsPrice');await page.locator('#pricesPreview').waitFor();assert.match(await page.locator('#pricesPreview').innerText(),/Ahora\s*desconocido.*Después\s*690,00\s€/is);
  await page.locator('#pricesPreview button',{hasText:'Cancelar'}).click();assert.equal(await page.evaluate(()=>FloorPlanCostCatalog.revisionTag(FloorPlanBudgetUI.current().budget)),rev0,'cancel changes nothing');
  await page.click('#pricesAsPrice');await shot(page,'cat04-02-vista-previa');await page.click('#pricesConfirm');await page.waitForFunction(()=>/Cambio aplicado/.test(document.querySelector('#pricesStatus')?.textContent||''));
  await page.evaluate(()=>document.querySelector('#pricesDialog').close());await page.waitForFunction(id=>document.querySelector(`#budgetDialog tr[data-item="${id}"] [data-field="price"]`)?.value==='690',RB);
  // 9. Subtotal = FloorPlanBudget.calculateBudget on the saved document.
  T=await truth(page,RB);assert.deepEqual(T.item,{qty:1,unit:'unit',price:690,review:'unreviewed',src:'provider-reference',refCode:'QA-LUMEN-160-RB',refEdition:'rev 1 · ficha v1'});assert.equal(T.subtotal,690);assert.equal(T.saved,true);
  assert.equal(await rowState(page,RB),'applied-unreviewed');await tr.locator('[data-field="review"]').check();assert.equal((await truth(page,RB)).item.review,'reviewed');assert.equal(await rowState(page,RB),'reviewed');
  await tr.scrollIntoViewIfNeeded();await shot(page,'cat04-03-precio-aplicado');await closeBudget(page);
  // 10. Duplicate → 2 units, one item, review invalidated (the quantity changed), price kept.
  await toEditor(page);await selectFurn(page,o1);const n0=await page.evaluate(()=>FloorPlanApp.project.objects.length);await page.keyboard.press('Control+d');await page.waitForFunction(n=>FloorPlanApp.project.objects.length===n+1,n0);
  await openBudget(page);T=await truth(page,RB);assert.deepEqual([T.item.qty,T.item.price,T.item.review,T.subtotal],[2,690,'unreviewed',1380]);assert.equal(T.catalogItems.filter(x=>x===RB).length,1);
  assert.match(await page.locator('#budgetInvalidated').innerText(),/ha cambiado desde tu revisión/);await closeBudget(page);
  // 11. Undo → 1 unit; redo → 2 units (budget follows the project state).
  await toEditor(page);await page.locator('#undo').click();await page.waitForFunction(n=>FloorPlanApp.project.objects.length===n,n0);assert.equal((await truth(page,RB)).item.qty,1);
  await page.locator('#redo').click();await page.waitForFunction(n=>FloorPlanApp.project.objects.length===n+1,n0);assert.deepEqual([(await truth(page,RB)).item.qty,(await truth(page,RB)).subtotal],[2,1380]);
  // 12. Save and reopen: price, reference, source, revision and SKU relation are kept.
  await openBudget(page);await closeBudget(page);await K.reopen(page);await openBudget(page);T=await truth(page,RB);
  assert.deepEqual([T.item.qty,T.item.price,T.item.src,T.item.refCode,T.item.refEdition,T.subtotal],[2,690,'provider-reference','QA-LUMEN-160-RB','rev 1 · ficha v1',1380]);await closeBudget(page);
  // 13. New sheet revision (710 €) imported in «Mis catálogos»: detected, the applied price is NOT replaced.
  await page.locator('#workArea-studio').click();await page.locator('#catalogOpen').click();await page.locator('#catalogDialog[open]').waitFor();
  const edit=JSON.parse(JSON.stringify(PILOT.products[0]));edit.commercial.netUnitPrice=710;
  await page.locator('#catalogImportFile').setInputFiles({name:'v2.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({schema:PILOT.schema,catalogId:PILOT.catalogId,products:[edit]}))});
  await page.waitForFunction(()=>/Revisión 2/.test(document.querySelector('#catalogRevision')?.textContent||''));await page.locator('#catalogClose').click();
  await openBudget(page);assert.equal(await rowState(page,RB),'stale');T=await truth(page,RB);assert.equal(T.item.price,690,'never overwritten');
  assert.match(await tr.locator('.cat04-sheet').innerText(),/710,00\s€\/ud .*rev 2 · ficha v2/);assert.match(await tr.locator('.cat04-stale').innerText(),/690,00\s€ · rev 1 · ficha v1/);assert.match(await tr.innerText(),/La ficha cambió después de colocar el producto/);
  await tr.scrollIntoViewIfNeeded();await shot(page,'cat04-04-ficha-cambiada');await closeBudget(page);
  // 15. Assistant: «¿Cuánto cuesta este producto?» → same document, same calculation.
  await toEditor(page);await selectFurn(page,o1);const answer=await ask(page,'¿Cuánto cuesta este producto?');T=await truth(page,RB);
  assert.match(answer,/precio activo en el presupuesto 690 EUR/);assert.match(answer,new RegExp(`importe de la partida ${T.subtotal.toLocaleString('es-ES')} EUR sin IVA`));assert.match(answer,/la ficha ha cambiado y tu precio no se ha sustituido/);
  assert.match(answer,new RegExp(`${T.unpriced} partidas sin precio`));
  const unp=await ask(page,'¿Qué partidas siguen sin precio?');assert.match(unp,/Horno integrable H60 inox · QA-H60-INOX · ficha sintética QA \(la ficha no tiene precio\)/);
  const placedAns=await ask(page,'¿Qué SKU he colocado en este proyecto?');assert.match(placedAns,/QA-LUMEN-160-RB · Aparador Lumen 160 roble: 2 unidades/);
  await page.click('#assistantClose');await shot(page,'cat04-05-asistente');
  // 16. Entregar → economic dossier: the same figures and states as Presupuestar.
  await page.locator('#workArea-deliver').click();const card=page.locator('[data-module="economic-dossier"]');await card.waitFor();await card.locator('[data-route="economic-dossier"]').click();
  const paper=page.locator('#economicDossierPaper');await paper.waitFor();const dossier=await paper.innerText();
  assert.match(dossier,/Aparador Lumen 160 roble · QA-LUMEN-160-RB/);assert.match(dossier,/1\.?380,00\s€/);assert.match(dossier,/Productos de mi estudio/i);
  const net=(await truth(page,RB)).net;assert.match(dossier,new RegExp('Base imponible\\s+'+net.toFixed(2).replace('.',',').replace(/^(\\d)(\\d{3}),/,'$1\\.?$2,')+'\\s€ · parcial'),'same net as Presupuestar (partial)');
  await shot(page,'cat04-06-dossier');await page.keyboard.press('Escape');
  // 14. Remove both linked objects: the priced item stays with 0 units (undo-safe), no active orphan; «Retirar partida».
  await toEditor(page);const ids=await page.evaluate(()=>Object.entries(FloorPlanApp.project.extensions['x-cat03-catalog-link'].links).filter(([,l])=>l.sku==='QA-LUMEN-160-RB').map(([id])=>id).filter(id=>FloorPlanApp.project.objects.some(o=>o.id===id)));
  for(const id of ids){await selectFurn(page,id);await page.keyboard.press('Delete');await page.waitForFunction(id=>!FloorPlanApp.project.objects.some(o=>o.id===id)&&!document.querySelector(`#plan g.furn[data-fid="${id}"]`),id);}
  await openBudget(page);T=await truth(page,RB);assert.deepEqual([T.item.qty,T.item.price,T.subtotal],[0,690,0]);assert.match(await tr.innerText(),/Sin objetos colocados \(0 ud\)/);assert.match(await page.locator('#cat04Orphans').innerText(),/2 vínculo\(s\) de objetos ya borrados: no se cuentan/);
  await tr.locator('.cat04-retire').click();await page.waitForFunction(id=>!document.querySelector(`#budgetDialog tr[data-item="${id}"]`),RB);assert.equal((await truth(page,RB)).item,null);
  // 17. Export: the project carries the links; the budget is a separate document (rubik-budget-v1 / JSON download).
  const [bjDl]=await Promise.all([page.waitForEvent('download'),page.locator('#budgetJson').click()]);const bj=JSON.parse(fs.readFileSync(await bjDl.path(),'utf8'));assert.ok(bj.items.some(i=>i.id===H60),'catalogue items travel in the budget document');
  await closeBudget(page);await toEditor(page);await page.locator('details.menu summary').first().click();const [ex]=await Promise.all([page.waitForEvent('download'),page.locator('#exportJson').click()]);const proj=JSON.parse(fs.readFileSync(await ex.path(),'utf8'));
  assert.ok(Object.values(proj.extensions['x-cat03-catalog-link'].links).some(l=>l.sku==='QA-H60-INOX'));assert.equal(JSON.stringify(proj).includes('unitPrice'),false,'prices are not in the project file');
  assert.deepEqual(api,[]);assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});

test('CAT-04 Estudio de imágenes → referencia visual vinculada → reconocida en Presupuestar sin importe → consultada por el Asistente → persiste al reabrir',{timeout:400000},async()=>{
 const {context,page}=await K.editor(env,{acceptDownloads:true,...rec({width:1440,height:900})});const w=K.watch(page,env.base),api=[];page.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url());});
 try{
  const kitchen=await synthKitchen(env.browser);await loadPilot(page,false);await openStudio(page,false);
  await page.locator('#vsFile').setInputFiles(K.file('IMG_0001.jpg',K.withExif(kitchen),'image/jpeg'));await page.locator('#vsStage').waitFor();
  await page.locator('#vsZone').selectOption('appliance').catch(()=>{});await dragZone(page,[0.56,0.45],[0.76,0.71]);
  await page.locator('#vsRefList input[data-sku="QA-H60-INOX"]').check();await page.locator('#vsAlternatives').selectOption('1').catch(()=>{});
  await page.locator('#vsConsent').check();await page.locator('#vsScenario').selectOption('ok');await page.locator('#vsSimulate').click();await page.waitForFunction(()=>document.querySelector('#visualStudioDialog').dataset.run==='done');
  assert.equal(await page.locator('#vsLinkProject').isDisabled(),true,'nothing to link before a decision');
  for(const n of ['vsOpenings','vsGeometry'])await page.locator(`#${n}-yes`).check();await page.locator('#vsMatch').selectOption('similar');await page.locator('#vsAccept').click();
  const before=await page.evaluate(()=>FloorPlanBudgetUI.current().budget.items.map(i=>i.id));
  await page.locator('#vsLinkProject').click();assert.equal(await page.locator('#vsLinkNote').getAttribute('data-state'),'linked');await shot(page,'cat04-07-vincular');
  const ext=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project.extensions['x-cat04-visual-refs']));assert.doesNotMatch(ext,/data:|base64|exif|IMG_0001/i,'no pixels, EXIF or file name');
  await page.locator('#vsClose').click();
  await openBudget(page);const li=page.locator('#cat04VisualList li[data-status="verified"]');await li.waitFor();
  assert.equal(await li.getAttribute('data-kind'),'simulated');assert.equal(await li.getAttribute('data-decision'),'accepted');assert.match(await li.innerText(),/SIMULACIÓN · aceptada en la revisión · verificada/);
  assert.match(await li.locator('.cat04-vref').innerText(),/QA-H60-INOX · .*NO colocado: no se presupuesta/);
  assert.deepEqual(await page.evaluate(()=>FloorPlanBudgetUI.current().budget.items.map(i=>i.id)),before,'a visual reference creates no budget item');
  await page.locator('#cat04Visual').scrollIntoViewIfNeeded();await shot(page,'cat04-08-referencias-en-presupuesto');
  // «Abrir el Estudio de imágenes» from Presupuestar and back.
  await page.click('#cat04OpenStudio');await page.locator('#visualStudioDialog[open]').waitFor();await page.locator('#vsClose').click();await page.locator('#budgetDialog[open]').waitFor();await closeBudget(page);
  await toEditor(page);const a=await ask(page,'¿Tengo referencias del Estudio de imágenes vinculadas al proyecto?');assert.match(a,/Hay 1 referencia visual vinculada: simulación aceptada \(verificada\) · QA-H60-INOX no colocado: no se presupuesta/);
  const k=await ask(page,'¿Este resultado visual es una simulación o una imagen real?');assert.match(k,/SIMULACIÓN local rotulada: no son imágenes generadas por IA ni imágenes reales/);assert.doesNotMatch(k,/€|EUR/);
  await page.click('#assistantClose');
  // Undo of the link (one commit step) and redo; reopen keeps it.
  await page.locator('#undo').click();await page.waitForFunction(()=>!Object.keys(FloorPlanApp.project.extensions?.['x-cat04-visual-refs']?.refs||{}).length);
  await page.locator('#redo').click();await page.waitForFunction(()=>Object.keys(FloorPlanApp.project.extensions?.['x-cat04-visual-refs']?.refs||{}).length===1);
  await K.reopen(page);await openBudget(page);await page.locator('#cat04VisualList li[data-status="verified"]').waitFor();
  await page.locator('#cat04VisualList [data-unlink]').click();await page.waitForFunction(()=>!document.querySelector('#cat04VisualList li[data-hash]'));
  assert.deepEqual(api,[]);assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});

for(const [vp,lang,label] of [[{width:390,height:844},'en','móvil 390×844 EN'],[{width:844,height:390},'zh','apaisado 844×390 ZH']]){
 test(`CAT-04 ${label}: colocar con toques, partida en Presupuestar, sin desbordes, objetivos táctiles y Asistente en su idioma`,{timeout:300000},async()=>{
  const {context,page}=await K.editor(env,{viewport:vp,isMobile:true,hasTouch:true,...rec(vp)});const w=K.watch(page,env.base);
  try{
   await page.evaluate(l=>{try{setLang(l);}catch{window.LANG=l;}},lang);await page.waitForFunction(l=>typeof LANG==='undefined'||LANG===l,lang).catch(()=>{});
   await loadPilot(page,true);try{await page.locator('#workArea-design').tap();}catch{}await page.locator('#professionalWorkspace').waitFor({state:'hidden'}).catch(()=>{});
   await openFromPalette(page,true);await place(page,'aparador-lumen@roble',true);
   await openBudget(page,true);const tr=page.locator(`#budgetDialog tr[data-item="${RB}"]`);await tr.waitFor();
   const txt=await tr.innerText();assert.match(txt,lang==='en'?/Product from my studio · QA-LUMEN-160-RB · 1 object\(s\) in the project · Sheet price available as a reference \(not applied\)/:/我的工作室产品 · QA-LUMEN-160-RB · 项目中 1 个对象 · 资料价格可作参考（未应用）/);
   const over=await page.evaluate(()=>{const d=document.querySelector('#budgetDialog');return {dialog:d.scrollWidth>d.clientWidth+1,page:document.documentElement.scrollWidth>innerWidth+1};});assert.deepEqual(over,{dialog:false,page:false});
   const btn=tr.locator('.cat04-price');await btn.scrollIntoViewIfNeeded();const box=await btn.boundingBox();assert.ok(box.height>=44&&box.width>=44,`touch target ${JSON.stringify(box)}`);
   await page.locator('#cat04Visual').scrollIntoViewIfNeeded();const ob=await page.locator('#cat04OpenStudio').boundingBox();assert.ok(ob.height>=44,'open studio touch target');
   await shot(page,`cat04-09-${lang}`);await closeBudget(page);
   await page.waitForFunction(()=>!!window.RubikAssistantUI);await page.locator('#assistantOpen').tap();await page.waitForSelector('#assistantPanel:not([hidden])');
   await page.fill('#assistantInput',lang==='en'?'Which SKUs have I placed in this project?':'这个项目里放置了哪些SKU？');await page.locator('#assistantSend').tap();await page.waitForFunction(()=>!RubikAssistantUI.state.pending);
   const a=await page.evaluate(()=>RubikAssistantUI.state.log.at(-1).text);assert.match(a,lang==='en'?/QA-LUMEN-160-RB · Aparador Lumen 160 roble: 1 unit/:/QA-LUMEN-160-RB · Aparador Lumen 160 roble：1 件/);
   assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
  }finally{await context.close();}
 });
}
