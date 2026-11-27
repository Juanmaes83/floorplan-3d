'use strict';
// §8 D3 · Dossier del proyecto con cliente, contacto de Mi estudio y ayuda local. La salida (#dossierDocument y la copia que
// se imprime) solo lleva lo marcado «mostrar»; las notas internas y los campos no marcados nunca salen.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const K=require('./ux07/kit.cjs'),{accion}=require('./helpers-perla-entregar.cjs');
let env;test.before(async()=>{env=await K.start({authority:true});});test.after(async()=>{await env?.stop();});
const SHOTS=process.env.DC_SHOTS;
for(const vp of [{width:1440,height:900,tag:'escritorio'},{width:390,height:844,tag:'movil'}])
test('D3 dossier cliente '+vp.tag,{timeout:180000},async()=>{const REC=process.env.DC_REC;const ctx=await env.browser.newContext({viewport:{width:vp.width,height:vp.height},...(REC?{recordVideo:{dir:REC,size:{width:vp.width,height:vp.height}}}:{})});const page=await ctx.newPage();const pause=(ms=900)=>REC?page.waitForTimeout(ms):null;
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(env.base);await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false))await page.keyboard.press('Escape');
 await page.locator('#workArea-deliver').click();const b=await accion(page,'#professionalWorkspace [data-route="dossier"]');await b.scrollIntoViewIfNeeded();await b.click();
 await page.waitForSelector('#dossierDialog[open]');await page.selectOption('#dossierStyle','client');await pause(1400);
 // Tres pasos: Cliente y contacto → Nota de presentación → Revisar el dossier (una acción principal por vista).
 assert.deepEqual(await page.locator('#dossierDialog .dc-steps button').allInnerTexts(),['1 · Cliente y contacto','2 · Nota de presentación','3 · Revisar el dossier']);
 assert.equal(await page.locator('#dossierDialog').getAttribute('data-dc-step'),'client');
 assert.equal(await page.locator('#dossierPrint').isVisible(),false,'imprimir solo al revisar');assert.equal(await page.locator('#dossierDocument').isVisible(),false,'la preparación no empuja la portada');
 assert.match(await page.locator('#dossierClose').innerText(),/Volver a Entregar/);await pause(1400);
 const file=path.join(require('node:os').tmpdir(),'ficha-cliente-qa.json');fs.writeFileSync(file,JSON.stringify({nombre:'Lucía Prueba',tratamiento:'Sra.',preferencias:'más luz natural en el salón',requisitos:'presupuesto cerrado',dni:'NO-DEBE-SALIR'}));
 await page.locator('#dcClientFile').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#dc-name')?.value==='Lucía Prueba');
 const doc=()=>page.locator('#dossierDocument').evaluate(d=>d.innerText||d.textContent);
 assert.ok(!(await doc()).includes('Lucía'),'sin «mostrar», el nombre no sale');
 await page.locator('[data-dc-flag="show:name"]').check();await page.locator('[data-dc-flag="use:name"]').check();await page.locator('[data-dc-flag="use:preferences"]').check();await pause(1400);
 if(SHOTS)await page.screenshot({path:path.join(SHOTS,`d3-paso1-cliente-${vp.tag}.png`)});
 await page.locator('#dcNext').click();assert.equal(await page.locator('#dossierDialog').getAttribute('data-dc-step'),'note');await pause(1200);
 await page.locator('#dc-internal').fill('Margen interno 22 % · NOTA-INTERNA');
 await page.locator('#dcAssist').click();await page.waitForSelector('#dcDraft:not([hidden])');await pause(1400);
 const draft=await page.locator('#dcDraftText').inputValue();assert.match(draft,/Sra\. Lucía Prueba/);assert.match(draft,/más luz natural/);assert.ok(!/presupuesto cerrado|NOTA-INTERNA/.test(draft),'la ayuda solo lee lo marcado «usar»');
 if(SHOTS)await page.screenshot({path:path.join(SHOTS,`d3-borrador-${vp.tag}.png`)});
 await page.locator('#dcDiscard').click();assert.equal(await page.locator('#dc-note').inputValue(),'','descartar no inserta');
 await page.locator('#dcAssist').click();await page.locator('#dcDraftText').fill(draft+' Le proponemos visitar la obra la próxima semana.');
 for(const id of ['#dcDraftText','#dcAccept','#dcDiscard'])assert.equal(await page.locator(id).isVisible(),true,'editar, aceptar y descartar visibles');
 await page.locator('#dcAccept').click();await pause(1400);if(SHOTS)await page.screenshot({path:path.join(SHOTS,`d3-paso2-nota-${vp.tag}.png`)});
 await page.locator('#dcNext').click();assert.equal(await page.locator('#dossierDialog').getAttribute('data-dc-step'),'review');await page.waitForSelector('#dossierDocument',{state:'visible'});
 assert.equal(await page.locator('#dossierPrint').isVisible(),true,'al revisar, imprimir es la acción principal');await pause(1400);
 assert.match(await doc(),/Estancias en el cómputo\s*11 · 2 no suman superficie/i,'11 computadas + 2 miradores, explicado');
 const text=await doc();
 assert.match(text,/Preparado para\s*Sra\. Lucía Prueba/i);assert.match(text,/visitar la obra/);
 for(const no of ['NOTA-INTERNA','Margen interno','presupuesto cerrado','NO-DEBE-SALIR','Lo que nos pidió','Requisito'])assert.ok(!text.includes(no),'no sale: '+no);
 for(const no of ['Prepáralas en Entregar','Configura el norte','Sin ubicación o norte'])assert.ok(!text.includes(no),'la salida Cliente no lleva instrucciones de trabajo: '+no);
 assert.match(await page.evaluate(()=>{const a=document.createElement('article');FloorPlanDossier.compose(a,'technical');return a.textContent;}),/Configura el norte|Sin ubicación o norte|Prepáralas/,'la salida Técnica las conserva');
 assert.equal(await page.locator('#dossierDocument #dossierClient, #dossierDocument textarea').count(),0,'el panel no forma parte del documento');
 assert.match(await page.locator('#dcMissing').innerText(),/(falta|Todas las secciones)/);
 assert.ok(!/[㐀-鿿]/.test(await page.locator('#dossierDialog').innerText()),'sin chino visible');
 await page.locator('#dossierDocument .dossier-for').scrollIntoViewIfNeeded();await pause(2500);if(SHOTS){await page.screenshot({path:path.join(SHOTS,`d3-portada-${vp.tag}.png`)});}
 // Imprimir: la ventana de impresión lleva la MISMA copia del documento; se comprueba qué campos salen y cuáles no.
 await page.evaluate(()=>{window.__printCalls=0;const o=window.open;window.open=(...a)=>{const w=o.apply(window,a);if(w)w.print=()=>{window.__printCalls++;};return w;};});
 const [win]=await Promise.all([ctx.waitForEvent('page'),page.locator('#dossierPrint').click()]);await win.waitForSelector('#dossierDocument .dossier-for');
 const printed=await win.locator('#dossierDocument').innerText();assert.match(printed,/Preparado para\s*Sra\. Lucía Prueba/i);assert.match(printed,/visitar la obra/);
 for(const no of ['NOTA-INTERNA','Margen interno','presupuesto cerrado','NO-DEBE-SALIR','Lo que nos pidió','Requisito'])assert.ok(!printed.includes(no),'no se imprime: '+no);
 await win.locator('#dossierDocument .dossier-for').scrollIntoViewIfNeeded();await pause(2500);if(SHOTS)await win.screenshot({path:path.join(SHOTS,`d3-impresion-${vp.tag}.png`)});await win.close();
 // Persistencia por proyecto: al reabrir, la ficha sigue.
 await page.locator('#dossierClose').click();await page.waitForFunction(()=>!document.querySelector('#dossierDialog').open);assert.equal(await page.locator('#professionalWorkspace').isVisible(),true,'vuelve a Entregar');
 await b.click();await page.waitForSelector('#dossierDialog[open]');assert.equal(await page.locator('#dc-name').inputValue(),'Lucía Prueba');
 assert.deepEqual(errors,[]);const v=REC&&page.video();await ctx.close();if(v)fs.renameSync(await v.path(),path.join(REC,`d3-dossier-cliente-${vp.tag}.webm`));});

test('D3 · «Preparar imágenes» desde el aviso: vuelve al dossier, a «Revisar», con lo escrito y las vistas reales',{timeout:300000},async()=>{
 const ctx=await env.browser.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(env.base);await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false))await page.keyboard.press('Escape');
 await page.locator('#workArea-deliver').click();const b=await accion(page,'#professionalWorkspace [data-route="dossier"]');await b.scrollIntoViewIfNeeded();await b.click();
 await page.waitForSelector('#dossierDialog[open]');await page.selectOption('#dossierStyle','client');
 await page.locator('#dossierDialog [data-dc-step="note"]').click();await page.locator('#dc-note').fill('Nota escrita antes de preparar las imágenes.');
 await page.locator('#dossierDialog [data-dc-step="review"]').click();assert.match(await page.locator('#dcMissing').innerText(),/vistas 3D preparadas/);
 await page.locator('#dcPrepareViews').click();
 await page.waitForFunction(()=>document.querySelector('#dossierDialog').open&&document.querySelector('#dossierDialog').dataset.dcStep==='review',null,{timeout:240000});
 assert.equal(await page.locator('#dc-note').inputValue(),'Nota escrita antes de preparar las imágenes.','lo escrito se conserva');
 assert.ok(await page.locator('#dossierDocument .dossier-gallery img').count()>=1,'el dossier ya lleva las vistas reales');
 assert.equal(await page.locator('#dcPrepareViews').count(),0,'el aviso ya no pide las imágenes');assert.deepEqual(errors,[]);await ctx.close();});
