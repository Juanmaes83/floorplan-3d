'use strict';
// §10 · FOT-01 desde Entregar → Imágenes: dos casos con ejemplo PROPIO del 3D de RUBIK que abren el flujo real con la intención
// equivalente. Inmobiliaria → «Más luz y orden» (dice que no retira muebles); interiorismo y reformas → «Cambiar el suelo · Roble
// claro». El aviso de simulación se conserva.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const K=require('./ux07/kit.cjs'),{abrirFicha}=require('./helpers-perla-entregar.cjs');
let env;test.before(async()=>{env=await K.start({authority:true});});test.after(async()=>{await env?.stop();});
const REC=process.env.FOT_REC,SHOTS=process.env.FOT_SHOTS;
for(const vp of [{width:1440,height:900,tag:'escritorio'},{width:390,height:844,tag:'movil'}])
test('FOT-01 · casos inmobiliaria e interiorismo · '+vp.tag,{timeout:180000},async()=>{
 const ctx=await env.browser.newContext({viewport:{width:vp.width,height:vp.height},...(REC?{recordVideo:{dir:REC,size:{width:vp.width,height:vp.height}}}:{})});const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const pause=(ms=1000)=>REC?page.waitForTimeout(ms):null;
 await page.goto(env.base);await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false))await page.keyboard.press('Escape');
 // Camino real: Entregar → ficha «Imágenes» (la tarjeta compacta abre su ficha con los dos casos).
 await page.locator('#workArea-deliver').click();await pause();
 const code=await page.locator('#professionalWorkspace .professional-card[data-module="images"]').getAttribute('data-entrega-code');
 await abrirFicha(page,code);const show=page.locator('#professionalWorkspace .mesa .panel.perla-panel-open .photo-reform-showcase');await show.waitFor();await pause(1200);
 for(const c of ['inmobiliaria','interiorismo']){const sec=show.locator(`[data-case="${c}"]`);await sec.scrollIntoViewIfNeeded();
  const imgs=sec.locator('img');assert.equal(await imgs.count(),2);await page.waitForFunction(s=>[...document.querySelectorAll(s+' img')].every(i=>i.complete&&i.naturalWidth>0),`#professionalWorkspace .perla-panel-open .photo-reform-showcase [data-case="${c}"]`);
  const t=await sec.innerText();assert.match(t,/Original ·/);assert.match(t,/Alternativa ilustrativa ·/);assert.match(t,/Ejemplo hecho con el 3D de RUBIK, no con una foto procesada/);assert.match(t,/SIMULACIÓN rotulada/);
  if(SHOTS)await page.screenshot({path:path.join(SHOTS,`fot01-${c}-${vp.tag}.png`)});await pause(2000);}
 const re=await show.locator('[data-case="inmobiliaria"]').innerText();assert.match(re,/«Más luz y orden»/);assert.match(re,/no retira muebles/);
 // Inmobiliaria → flujo real con «Más luz y orden».
 await show.locator('[data-case-go="inmobiliaria"]').click();await page.waitForSelector('#photoReformDialog[open]');
 assert.equal(await page.locator('#photoReformIntent').inputValue(),'light');assert.equal(await page.locator('#photoReformDialog').getAttribute('data-case'),'inmobiliaria');await pause(2000);
 if(SHOTS)await page.screenshot({path:path.join(SHOTS,`fot01-flujo-inmobiliaria-${vp.tag}.png`)});
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#photoReformDialog').open);
 // Interiorismo → «Cambiar el suelo · Roble claro».
 if(!await show.isVisible()){await abrirFicha(page,code);await show.waitFor();}await show.locator('[data-case-go="interiorismo"]').scrollIntoViewIfNeeded();await show.locator('[data-case-go="interiorismo"]').click();await page.waitForSelector('#photoReformDialog[open]');
 assert.equal(await page.locator('#photoReformIntent').inputValue(),'floor');assert.equal(await page.locator('#photoReformFinish, #photoReformDialog select:not(#photoReformIntent)').first().inputValue(),'light-oak');await pause(2000);
 if(SHOTS)await page.screenshot({path:path.join(SHOTS,`fot01-flujo-interiorismo-${vp.tag}.png`)});
 assert.ok(!/[㐀-鿿]/.test(await page.locator('body').innerText()),'sin chino visible');assert.deepEqual(errors,[]);
 const v=REC&&page.video();await ctx.close();if(v)fs.renameSync(await v.path(),path.join(REC,`fot01-casos-${vp.tag}.webm`));});
