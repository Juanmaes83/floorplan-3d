'use strict';
/* §5.3 · Segundo corte (revisión humana 26/11/2026): «Comprobar el plano» separa puertas, alturas libres y retranqueo; la
   puerta tiene nombre reconocible, cifras (plano / referencia interna / diferencia), origen del valor y «Ver en el plano»
   que la localiza; alturas sin datos agrupadas («Falta la altura libre en N espacios», N del proyecto) y desplegables;
   retranqueo explicado y, sin parcela o colocación, primero «Configurar emplazamiento». Exterior: «Fachadas detectadas» no
   cuenta como hecho; «Revisión completada» sí; ficha y resumen coinciden. Escritorio y móvil. Capturas P53_SHOTS. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const K=require('./ux07/kit.cjs'),{accion}=require('./helpers-perla-entregar.cjs');
const shots=process.env.P53_SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const CJK=/[㐀-鿿]/;
let env;test.before(async()=>{env=await K.start({authority:true});});test.after(async()=>{await env?.stop();});
async function boot(viewport){const ctx=await env.browser.newContext({viewport});const page=await ctx.newPage();const w=K.watch(page,env.base);
 await page.goto(env.base);await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false))await page.keyboard.press('Escape');return {ctx,page,w};}
const area=async(page,k)=>{await page.evaluate(k=>FloorPlanProfessionalUI.open(k),k);await page.waitForTimeout(900);};
const done=page=>page.locator('#professionalWorkspace .perla-sem-base').first().innerText().then(t=>+t.match(/^(\d+) de 4/)[1]);
const extTag=page=>page.evaluate(()=>[...document.querySelectorAll('#professionalWorkspace .professional-card')].find(c=>/^Exterior/.test(c.querySelector('h2,h3')?.textContent.trim()||''))?.querySelector('.perla-sem-tag')?.textContent);
for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`§5.3 corte 2 · Comprobar el plano y Exterior (${viewport.width}x${viewport.height})`,{timeout:300000},async()=>{
 const {ctx,page,w}=await boot(viewport);const tag=viewport.width;
 try{
  await area(page,'analyze');
  // Exterior: detectado ≠ revisado; ficha y resumen coinciden.
  const ext=page.locator('#professionalWorkspace .professional-card').filter({has:page.locator('h2,h3',{hasText:/^Exterior/})});
  assert.match(await ext.innerText(),/Revisión pendiente/);assert.match(await ext.innerText(),/Fachadas detectadas automáticamente: \d+ muros \(no cuenta como revisión\)/);
  assert.equal(await extTag(page),'Empezado, sin terminar','detectar fachadas no es «Hecho»');const n0=await done(page);
  await (await accion(page,'#professionalWorkspace [data-route="exterior-review"]')).click();await page.waitForTimeout(500);
  assert.equal(await extTag(page),'Hecho');assert.equal(await done(page),n0+1,'el resumen suma la revisión, no la detección');assert.match(await ext.innerText(),/Revisión completada/);
  await (await accion(page,'#professionalWorkspace [data-route="exterior-review"]')).click();await page.waitForTimeout(500);assert.equal(await done(page),n0);
  // Comprobar el plano.
  await (await accion(page,'#professionalWorkspace [data-route="plan-check"]')).click();await page.waitForSelector('#planAnalysisDialog[open]');
  const out=page.locator('#planAnalysisResults');
  for(const g of ['doors','heights','setback'])assert.equal(await out.locator(`[data-group="${g}"]`).count(),1,'grupo '+g);
  const doorTxt=await out.locator('[data-group="doors"]').innerText();
  assert.doesNotMatch(doorTxt,/opn_/,'sin id interno');assert.match(doorTxt,/Puerta (entre|de) /,'nombre reconocible');
  assert.match(doorTxt,/890 mm en el plano · referencia orientativa interna 900 mm · faltan 10 mm/);
  assert.match(doorTxt,/pauta interna de RUBIK[\s\S]*no es una validación normativa/);
  const expected=await page.evaluate(()=>FloorPlanValidation.inspectPlan(FloorPlanApp.project,{}).findings.filter(r=>r.kind==='declared-room-height'&&r.status==='insufficient-data').length);
  assert.ok(expected>0);assert.equal(await page.locator('#planCheckMissingHeights summary').innerText(),`Falta la altura libre en ${expected} espacios`);
  await page.locator('#planCheckMissingHeights summary').click();assert.equal(await page.locator('#planCheckMissingHeights li').count(),expected);
  assert.match(await out.locator('[data-group="setback"]').innerText(),/distancia más corta entre el contorno exterior del edificio y el límite de la parcela/);
  assert.equal(await page.locator('#planCheckSite').innerText(),'Configurar emplazamiento','sin parcela: primero el emplazamiento');
  assert.doesNotMatch(await out.innerText(),CJK);
  if(shots)await page.screenshot({path:`${shots}/c2-comprobar-plano-${tag}.png`,fullPage:false});
  // «Ver en el plano» localiza la puerta.
  const id=await out.locator('[data-locate]').first().getAttribute('data-locate');
  await out.locator('[data-locate]').first().click();await page.waitForFunction(id=>ui.sel?.kind==='opening'&&ui.sel.id===id&&!document.querySelector('#planAnalysisDialog').open,id);
  const vis=await page.evaluate(id=>{const p=FloorPlanApp.project,o=p.openings.find(x=>x.id===id),w=p.walls.find(x=>x.id===o.wallId),L=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),f=(o.offsetMm+o.widthMm/2)/L,s=document.querySelector('#plan'),m=s.getScreenCTM(),q=s.createSVGPoint();q.x=w.start.x+(w.end.x-w.start.x)*f;q.y=w.start.y+(w.end.y-w.start.y)*f;const r=q.matrixTransform(m),b=s.getBoundingClientRect();return r.x>=b.left&&r.x<=b.right&&r.y>=b.top&&r.y<=b.bottom;},id);
  assert.ok(vis,'la puerta queda a la vista en el plano');
  if(shots)await page.screenshot({path:`${shots}/c2-ver-en-plano-${tag}.png`});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1));assert.deepEqual(w.errors,[]);
 }finally{await ctx.close();}
});
