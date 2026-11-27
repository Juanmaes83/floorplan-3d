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
 await page.locator('#dossierClient > summary').click();await pause(1400);
 const file=path.join(require('node:os').tmpdir(),'ficha-cliente-qa.json');fs.writeFileSync(file,JSON.stringify({nombre:'Lucía Prueba',tratamiento:'Sra.',preferencias:'más luz natural en el salón',requisitos:'presupuesto cerrado',dni:'NO-DEBE-SALIR'}));
 await page.locator('#dcClientFile').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#dc-name')?.value==='Lucía Prueba');
 const doc=()=>page.locator('#dossierDocument').innerText();
 assert.ok(!(await doc()).includes('Lucía'),'sin «mostrar», el nombre no sale');
 await page.locator('[data-dc-flag="show:name"]').check();await page.locator('[data-dc-flag="use:name"]').check();await page.locator('[data-dc-flag="use:preferences"]').check();await pause(1400);
 await page.locator('#dc-internal').fill('Margen interno 22 % · NOTA-INTERNA');
 await page.locator('#dcAssist').click();await page.waitForSelector('#dcDraft:not([hidden])');await pause(1400);
 const draft=await page.locator('#dcDraftText').inputValue();assert.match(draft,/Sra\. Lucía Prueba/);assert.match(draft,/más luz natural/);assert.ok(!/presupuesto cerrado|NOTA-INTERNA/.test(draft),'la ayuda solo lee lo marcado «usar»');
 if(SHOTS)await page.screenshot({path:path.join(SHOTS,`d3-borrador-${vp.tag}.png`)});
 await page.locator('#dcDiscard').click();assert.equal(await page.locator('#dc-note').inputValue(),'','descartar no inserta');
 await page.locator('#dcAssist').click();await page.locator('#dcDraftText').fill(draft+' Le proponemos visitar la obra la próxima semana.');await page.locator('#dcAccept').click();await pause(1400);
 const text=await doc();
 assert.match(text,/Preparado para\s*Sra\. Lucía Prueba/i);assert.match(text,/visitar la obra/);
 for(const no of ['NOTA-INTERNA','Margen interno','presupuesto cerrado','NO-DEBE-SALIR','Lo que nos pidió','Requisito'])assert.ok(!text.includes(no),'no sale: '+no);
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
 await page.locator('#dossierClose').click();await b.click();await page.waitForSelector('#dossierDialog[open]');assert.equal(await page.locator('#dc-name').inputValue(),'Lucía Prueba');
 assert.deepEqual(errors,[]);const v=REC&&page.video();await ctx.close();if(v)fs.renameSync(await v.path(),path.join(REC,`d3-dossier-cliente-${vp.tag}.webm`));});
