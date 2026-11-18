'use strict';
/* CAT-01 + FOT-01 visual · «Entregar → Estudio de imágenes» en el editor REAL con controles visibles: cocina SINTÉTICA
   dibujada por Chromium (ventana a la izquierda, hueco de horno a la derecha), zona dibujada con el ratón, conservar y
   cambiar, referencias de «Mis catálogos» (piloto sintético), coste bloqueado (STOP_GASTO) y simulación rotulada,
   3 opciones, comparación, revisión de fidelidad (ACEPTABLE / RECHAZADA por deriva o por huecos), ficha, cancelación y
   error. Teléfono 390×844 EN. Ninguna petición externa ni a /api/; el proyecto no cambia. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const K=require('./photo-project/kit.cjs'),V=require('../js/visual-reform-core.js'),{synthKitchen,loadPilot,openStudio,dragZone,sheetOf}=require('./cat-ia/kit.cjs');
const OUT=process.env.CAT_IA_SHOTS||null;
let env,kitchen;
const shot=async(page,name)=>{if(!OUT)return;fs.mkdirSync(OUT,{recursive:true});await page.screenshot({path:path.join(OUT,name+'.png')});};
test.before(async()=>{env=await K.start();kitchen=await synthKitchen(env.browser);});
test.after(async()=>{await env?.stop();});
const yes=async(page,name,v)=>page.locator(`#${name}-${v}`).check();

test('Estudio de imágenes escritorio: zona dibujada, referencias del catálogo, coste bloqueado, simulación, revisión ACEPTABLE/RECHAZADA, ficha, cancelar y error',{timeout:300000},async()=>{
 const {context,page}=await K.editor(env,{acceptDownloads:true});const w=K.watch(page,env.base),api=[];page.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url());});
 try{
  const before=await K.snapshot(page);await loadPilot(page,false);const afterCatalog=await K.snapshot(page);
  // Entregar keeps equal CTA hierarchy: the new entry is secondary, no card gets a primary action.
  await page.locator('#workArea-deliver').click();await page.locator('#visualStudioCard').waitFor();
  assert.equal(await page.locator('#professionalWorkspace .professional-card .primary').count(),0,'delivery cards have equal CTA hierarchy');
  await openStudio(page,false);assert.match(await page.locator('#vsTruth').innerText(),/un parecido no certifica el producto \(SKU\)/);
  await page.locator('#vsFile').setInputFiles(K.file('IMG_0001.jpg',K.withExif(kitchen),'image/jpeg'));await page.locator('#vsStage').waitFor();
  // Recipe, zone, intensity and options.
  await page.locator('#vsRecipe').selectOption('kitchen-catalog-faithful');await page.locator('#vsZone').selectOption('appliance');await page.locator('#vsIntensity-faithful').check();await page.locator('#vsAlternatives').selectOption('3');
  assert.deepEqual(await page.locator('#vsIntensity input').evaluateAll(n=>n.map(x=>x.value)),['faithful','balanced'],'the recipe limits the intensities');
  assert.match(await page.locator('#vsStatus').getAttribute('data-why'),/Marca al menos una zona/);assert.equal(await page.locator('#vsSimulate').isDisabled(),true);
  // Draw the zone over the oven slot with the mouse.
  await dragZone(page,[0.56,0.45],[0.76,0.71]);assert.equal(await page.locator('#vsMaskList li').count(),1);assert.match(await page.locator('#vsMaskList li').innerText(),/Zona 1: x 56 % · y 45 %/);
  // Keep / change: mandatory invariants locked and checked.
  assert.equal(await page.locator('#vsKeep input[disabled]:checked').count(),6);assert.equal(await page.locator('#vsKeep-furniture-layout').isChecked(),true);
  // Catalogue references: only the recipe's families, max 3.
  const skus=await page.locator('#vsRefList input').evaluateAll(n=>n.map(x=>x.dataset.sku).sort());assert.deepEqual(skus,['QA-ENC-BASALTO','QA-H60-INOX','QA-LUMEN-160-NG','QA-LUMEN-160-RB']);
  for(const s of ['QA-H60-INOX','QA-ENC-BASALTO','QA-LUMEN-160-RB'])await page.locator(`#vsRefList input[data-sku="${s}"]`).check();
  await page.locator('#vsRefList input[data-sku="QA-LUMEN-160-NG"]').click();assert.equal(await page.locator('#vsRefList input[data-sku="QA-LUMEN-160-NG"]').isChecked(),false);assert.match(await page.locator('#vsStatus').innerText(),/Máximo 3 referencias/);
  await page.locator('#vsRefList input[data-sku="QA-LUMEN-160-RB"]').uncheck();await page.locator('#vsRefList input[data-sku="QA-ENC-BASALTO"]').uncheck();
  // Cost: real generation blocked (STOP_GASTO); simulation «not applicable», never 0.
  assert.match(await page.locator('#vsCost').innerText(),/BLOQUEADA \(STOP_GASTO\)/);assert.match(await page.locator('#vsCostSim').innerText(),/3 opción\(es\); coste: no aplica/);assert.equal(await page.locator('#vsReal').isDisabled(),true);
  const req=await page.evaluate(()=>RubikVisualStudio.request);assert.equal(V.checkRequest(req).ok,true,'the screen builds the same closed request the server validates');
  assert.equal(req.references.length,1);assert.equal(req.references[0].family,'electrodomesticos');
  await page.locator('#vsStep1').scrollIntoViewIfNeeded();await shot(page,'vs-01-zona-referencia');
  // No consent → nothing runs.
  await page.locator('#vsSimulate').click();assert.match(await page.locator('#vsStatus').innerText(),/Falta el consentimiento/);
  await page.locator('#vsConsent').check();await page.locator('#vsScenario').selectOption('ok');await page.locator('#vsSimulate').click();
  await page.waitForFunction(()=>document.querySelector('#visualStudioDialog').dataset.run==='done');assert.equal(await page.locator('#vsAlts .vs-alt').count(),3);
  assert.match(await page.locator('#vsAuto').innerText(),/Cambios fuera de la zona: 0\.0 % \(tolerancia 1 %\)/);
  assert.equal(await page.locator('#vsVerdict').getAttribute('data-status'),'PENDIENTE');assert.equal(await page.locator('#vsAccept').isDisabled(),true);
  await yes(page,'vsOpenings','yes');await yes(page,'vsGeometry','yes');await page.locator('#vsMatch').selectOption('similar');
  assert.equal(await page.locator('#vsVerdict').getAttribute('data-status'),'ACEPTABLE');
  await page.locator('#vsStep7').scrollIntoViewIfNeeded();await shot(page,'vs-02-aceptable');
  await page.locator('#vsAccept').click();assert.match(await page.locator('#vsDecision').innerText(),/SIMULACIÓN: no se descarga ni se entrega/);assert.equal(await page.locator('#vsDownloadImage').isDisabled(),true);
  const ok=await sheetOf(page);assert.equal(ok.decision,'accepted');assert.equal(ok.deliverable,false);assert.match(ok.label,/SIMULACIÓN/);assert.equal(ok.result.costStatus,'not-applicable');assert.equal(ok.result.outputsBilled,0);
  assert.equal(ok.references[0].sku,'QA-H60-INOX');assert.equal(ok.references[0].catalogRevision,1);assert.equal(ok.recipe.recipeId,'kitchen-catalog-faithful');assert.equal(ok.recipe.hash,V.compile(req).hash);assert.equal(ok.skuCertified,false);assert.equal(ok.projectChanged,false);
  // Drift: the result erases the window outside the zone → RECHAZADA even if the human says yes.
  await page.locator('#vsAlternatives').selectOption('1');await page.locator('#vsScenario').selectOption('drift');await page.locator('#vsSimulate').click();await page.waitForFunction(()=>document.querySelector('#visualStudioDialog').dataset.run==='done');
  await yes(page,'vsOpenings','yes');await yes(page,'vsGeometry','yes');
  assert.equal(await page.locator('#vsVerdict').getAttribute('data-status'),'RECHAZADA');assert.match(await page.locator('#vsVerdict').innerText(),/cambios fuera de la zona/);assert.equal(await page.locator('#vsAccept').isDisabled(),true);
  await page.locator('#vsStep7').scrollIntoViewIfNeeded();await shot(page,'vs-03-rechazada-deriva');
  await page.locator('#vsReject').click();const rej=await sheetOf(page);assert.equal(rej.decision,'rejected');assert.deepEqual(rej.review.reasons,['changes-outside-zone']);
  // Openings altered (human): RECHAZADA.
  await page.locator('#vsScenario').selectOption('ok');await page.locator('#vsSimulate').click();await page.waitForFunction(()=>document.querySelector('#visualStudioDialog').dataset.run==='done');
  await yes(page,'vsOpenings','no');await yes(page,'vsGeometry','yes');assert.match(await page.locator('#vsVerdict').innerText(),/RECHAZADA · Se han borrado o alterado ventanas/);
  // Cancel mid-run and provider error leave nothing.
  await page.locator('#vsScenario').selectOption('slow');await page.locator('#vsSimulate').click();await page.locator('#vsCancel').click();
  await page.waitForFunction(()=>document.querySelector('#visualStudioDialog').dataset.run==='cancelled');assert.equal(await page.locator('#vsStep7').isHidden(),true);assert.match(await page.locator('#vsStatus').innerText(),/Cancelado/);
  await page.locator('#vsScenario').selectOption('error');await page.locator('#vsSimulate').click();await page.waitForFunction(()=>document.querySelector('#visualStudioDialog').dataset.run==='error');
  assert.match(await page.locator('#vsStatus').innerText(),/no se ha generado nada y no hay coste/);assert.equal(await page.locator('#vsAlts .vs-alt').count(),0);
  await shot(page,'vs-04-error');
  // Clearing the zone disables the simulation again.
  await page.locator('#vsMaskClear').click();assert.equal(await page.locator('#vsSimulate').isDisabled(),true);
  const after=await K.snapshot(page);assert.equal(after.project,afterCatalog.project);assert.equal(after.undo,before.undo);assert.equal(after.project,before.project);
  assert.equal(await K.hScroll(page),false);assert.deepEqual(api,[]);assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});

test('Estudio de imágenes teléfono 390×844 EN: táctil, atajo de zona, simulación, sin desbordes',{timeout:240000},async()=>{
 const {context,page}=await K.editor(env,{viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});const w=K.watch(page,env.base);
 try{await page.evaluate(()=>localStorage.setItem('rubik-sota-floorplan-lang','en'));await K.reopen(page);
  await loadPilot(page,true);await openStudio(page,true);assert.equal(await page.locator('#vsTitle').innerText(),'Image studio');
  await page.locator('#vsFile').setInputFiles(K.file('kitchen.jpg',kitchen,'image/jpeg'));await page.locator('#vsStage').waitFor();
  await page.locator('#vsZone').selectOption('appliance');const preset=page.locator('#vsPresetRight');await preset.scrollIntoViewIfNeeded();await preset.tap();
  assert.equal(await page.locator('#vsMaskList li').count(),1);
  const ref=page.locator('#vsRefList input[data-sku="QA-H60-INOX"]');await ref.scrollIntoViewIfNeeded();await ref.tap();await page.waitForFunction(()=>RubikVisualStudio.request.references.length===1);
  const c=page.locator('#vsConsent');await c.scrollIntoViewIfNeeded();await c.tap();const sim=page.locator('#vsSimulate');await sim.tap();
  await page.waitForFunction(()=>document.querySelector('#visualStudioDialog').dataset.run==='done');assert.match(await page.locator('#vsAuto').innerText(),/Changes outside the zone/);
  await page.locator('#vsCompare').scrollIntoViewIfNeeded();await shot(page,'vs-05-en-telefono');
  const o=await page.evaluate(()=>{const d=document.querySelector('#visualStudioDialog');return {dialog:d.scrollWidth>d.clientWidth+1,page:document.documentElement.scrollWidth>innerWidth+1};});assert.deepEqual(o,{dialog:false,page:false});
  const small=await page.locator('#visualStudioDialog button:visible, #visualStudioDialog select:visible').evaluateAll(b=>b.filter(x=>{const r=x.getBoundingClientRect();return r.height<44&&r.width>0;}).map(x=>x.id||x.textContent));assert.deepEqual(small,[]);
  assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});

test('Private image beta requires a tester code and quote confirmation before upload, then downloads an accepted labelled proposal',{timeout:120000},async()=>{
 const {context,page}=await K.editor(env,{acceptDownloads:true});
 const actions=[];
 const code='qa-private-preview-code-not-a-provider-secret';
 try{
  await page.route('**/api/photo-reform',async route=>{
   const req=route.request(),body=req.postDataJSON();
   assert.equal(req.headers()['x-rubik-photo-reform-token'],code);
   assert.equal(req.headers().authorization,undefined);
   actions.push(body.action);
   if(body.action==='status')return route.fulfill({json:{enabled:true,contract:'photo-reform/1'}});
   if(body.action==='quote'){
    assert.equal(body.image,undefined);
    return route.fulfill({json:{contract:'photo-reform/1',confirmationId:'qa-quote',provider:{id:'openai-images',name:'Preview QA'},estimate:{amount:.06,currency:'USD'}}});
   }
   assert.equal(body.confirmationId,'qa-quote');
   const [,mime,data]=/^data:(image\/\w+);base64,(.*)$/.exec(body.image);
   return route.fulfill({json:{version:1,provider:{id:'openai-images',name:'Preview QA'},cost:{amount:.04,currency:'USD'},
    alternatives:[{index:0,mediaType:mime,data}]}});
  });
  const unlock=async selector=>{
   const dlg=page.locator(selector),access=dlg.locator('[data-photo-beta-access]');
   await access.locator('summary').click();
   await access.locator('input[type=password]').fill(code);
   await access.getByRole('button',{name:'Verificar'}).click();
   await access.getByText('Acceso verificado.').waitFor();
  };
  const confirm=()=>page.once('dialog',d=>{assert.match(d.message(),/0\.0600 USD/);return d.accept();});
  await page.evaluate(()=>RubikPhotoReform.open());
  await page.locator('#photoReformFile').setInputFiles(K.file('source.jpg',kitchen,'image/jpeg'));
  await page.locator('#photoReformIntent').selectOption('light');
  await page.locator('#photoReformConsent').check();
  assert.equal(await page.locator('#photoReformReal').isDisabled(),true);
  await unlock('#photoReformDialog');confirm();
  await page.locator('#photoReformReal').click();
  await page.locator('#photoReformAccept').waitFor();
  assert.equal(await page.locator('#photoReformDownload').isDisabled(),true);
  await page.locator('#photoReformAccept').click();
  const [photo]=await Promise.all([page.waitForEvent('download'),page.locator('#photoReformDownload').click()]);
  assert.match(photo.suggestedFilename(),/propuesta-ilustrativa-1\.png$/);
  await page.locator('#photoReformClose').click();

  await openStudio(page,false);
  await page.locator('#vsFile').setInputFiles(K.file('source.jpg',kitchen,'image/jpeg'));
  await page.locator('#vsStage').waitFor();
  await dragZone(page,[0.56,0.45],[0.76,0.71]);
  await page.locator('#vsConsent').check();
  await unlock('#visualStudioDialog');confirm();
  await page.locator('#vsReal').click();
  await page.waitForFunction(()=>document.querySelector('#visualStudioDialog').dataset.run==='done');
  await yes(page,'vsOpenings','yes');await yes(page,'vsGeometry','yes');
  await page.locator('#vsAccept').click();
  assert.match(await page.locator('#vsCmpTag').textContent(),/PROPUESTA ILUSTRATIVA/);
  const [catalog]=await Promise.all([page.waitForEvent('download'),page.locator('#vsDownloadImage').click()]);
  assert.match(catalog.suggestedFilename(),/propuesta-1\.png$/);
  assert.deepEqual(actions,['status','quote','generate','status','quote','generate']);
 }finally{await context.close();}
});
