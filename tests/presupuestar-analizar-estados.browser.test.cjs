'use strict';
/* §5.3 corte 2 · Estados parcial y completado del plan de obra, coherentes entre ficha y resumen, e imágenes del proyecto
   en las fichas que lo necesitan. Recorrido de persona: Presupuestar → crear plan → añadir una tarea → guardar (parcial:
   «1 tarea … borrador», resumen «Borrador») → marcar como revisado → guardar (completado: «revisado (declarado)», resumen
   «Listo»). Miniaturas: plano en «Cantidades del proyecto» y esquema en «Exterior» (Analizar ya encabeza con el plano).
   Escritorio y móvil sin desplazamiento horizontal; sin chino visible. Capturas P53_SHOTS. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const K=require('./ux07/kit.cjs'),{accion}=require('./helpers-perla-entregar.cjs');
const shots=process.env.P53_SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const CJK=/[㐀-鿿]/;
let env;test.before(async()=>{env=await K.start({authority:true});});test.after(async()=>{await env?.stop();});
async function boot(viewport){const ctx=await env.browser.newContext({viewport});const page=await ctx.newPage();const w=K.watch(page,env.base);
 await page.goto(env.base);await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false))await page.keyboard.press('Escape');return {ctx,page,w};}
const area=async(page,k)=>{await page.evaluate(k=>FloorPlanProfessionalUI.open(k),k);await page.waitForTimeout(900);};
const planRow=page=>page.evaluate(()=>[...document.querySelectorAll('#professionalWorkspace .pres-listo li')].map(li=>li.innerText.replace(/\s+/g,' ').trim()).find(t=>/Plan de obra/.test(t))||'');
const planState=page=>page.evaluate(()=>document.querySelector('#constructionPlanCard .professional-state')?.textContent||'');
for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`§5.3 corte 2 · estados parcial y completado del plan; imágenes del proyecto (${viewport.width}x${viewport.height})`,{timeout:300000},async()=>{
 const {ctx,page,w}=await boot(viewport);const tag=viewport.width;
 try{
  await area(page,'budget');
  // Imagen del proyecto en la ficha de cantidades.
  const q=page.locator('#professionalWorkspace .professional-card[data-module="quantities"] .pres-thumb[data-thumb="plan"]');
  assert.equal(await q.count(),1,'plano en «Cantidades del proyecto»');assert.ok(await q.locator('svg polygon').count()>5,'el plano es el del proyecto');
  assert.equal(await q.locator('figcaption').innerText(),'Plano del que salen las cantidades');
  // Crear plan + una tarea → parcial.
  await (await accion(page,'#professionalWorkspace [data-route="construction-plan"]')).click();await page.locator('#planCreate').click();
  await page.locator('#planAddTask').click();await page.fill('#taskTitle','Demolición de tabique');await page.fill('#taskStart','2026-12-01');await page.fill('#taskEnd','2026-12-03');await page.locator('#taskSave').click();await page.waitForSelector('#taskForm',{state:'detached'});
  if(await page.locator('#planSave').isEnabled())await page.locator('#planSave').click();await page.waitForFunction(()=>document.getElementById('planSave')?.disabled===true);
  await page.locator('#planClose').click();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
  await page.waitForFunction(()=>/1 tarea/.test(document.querySelector('#constructionPlanCard .professional-state')?.textContent||''),null,{timeout:8000});
  assert.match(await planState(page),/^1 tarea( · .*)? · borrador$/,'parcial en la ficha');assert.match(await page.locator('#professionalWorkspace').innerText(),/1 tarea guardada · en borrador/);
  assert.equal(await page.locator('#constructionPlanCard [data-route="construction-plan"]').innerText(),'Abrir plan de obra');
  assert.match(await planRow(page),/^Borrador Plan de obra/,'parcial en el resumen: '+await planRow(page));
  if(shots)await page.screenshot({path:`${shots}/e1-parcial-${tag}.png`});
  // Marcar como revisado y guardar → completado.
  await page.locator('#constructionPlanCard [data-route="construction-plan"]').click();await page.waitForSelector('#planReview');
  await page.locator('#planReview').click();await page.fill('#planReviewer','Persona de prueba');await page.locator('#planReviewConfirm').click();
  if(await page.locator('#planSave').isEnabled())await page.locator('#planSave').click();await page.waitForFunction(()=>document.getElementById('planSave')?.disabled===true);
  await page.locator('#planClose').click();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
  await page.waitForFunction(()=>/revisado \(declarado\)/.test(document.querySelector('#constructionPlanCard .professional-state')?.textContent||''),null,{timeout:8000});
  assert.match(await planRow(page),/^Listo Plan de obra/,'completado en el resumen: '+await planRow(page));
  if(shots)await page.screenshot({path:`${shots}/e2-completado-${tag}.png`});
  // Analizar: plano en «Medidas y superficies» y esquema en «Exterior».
  await area(page,'analyze');
  assert.equal(await page.locator('#professionalWorkspace .pres-thumb[data-thumb="plan"]').count(),0,'sin repetir el plano que ya encabeza Analizar');assert.equal(await page.locator('#professionalWorkspace .pres-thumb[data-thumb="axo"]').count(),1);
  if(shots)await page.screenshot({path:`${shots}/e3-analizar-imagenes-${tag}.png`});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1));
  assert.doesNotMatch(await page.evaluate(()=>document.getElementById('professionalWorkspace').innerText),CJK);assert.deepEqual(w.errors,[]);
 }finally{await ctx.close();}
});
