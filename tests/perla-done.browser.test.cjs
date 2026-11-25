// UX-312 PERLA · U11 «botón hecho» (js/perla-done.js): tras guardar, el botón dice lo hecho y cambia de color; vuelve a su
// forma de acción cuando el proyecto cambia. El nombre accesible contiene lo visible y la acción original.
// Recorridos reales con gestos visibles en 1440x900 (ratón) y 390x844 (táctil):
//  1. Entregar → «Presupuesto» (abre Presupuestar): la cabecera ofrece «← Volver a Entregar» y vuelve a Entregar.
//  2. Analizar → «Calibrar» (abre el editor): «← Volver a Analizar» aparece en el editor y vuelve a Analizar.
//  3. Atrás del navegador desde un área vuelve a la pantalla anterior (el editor), no al inicio ni fuera de la app.
//  4. Con un diálogo abierto en un área, Atrás cierra el diálogo y la persona sigue en su área.
'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
before(async()=>{server=createServer((req,res)=>{try{const u=decodeURIComponent(new URL(req.url,'http://l').pathname),file=path.resolve(root,'.'+(u==='/'?'/index.html':u));if(!file.startsWith(root+path.sep))throw 0;const body=fs.readFileSync(file);res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(body);}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME||undefined});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

for(const [viewport,touch] of [[{width:1440,height:900},false],[{width:390,height:844},true]])
test(`U11 botón hecho ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPerlaDone);await page.locator('#welcomeExample').click();await page.waitForTimeout(700);
 const st=()=>page.evaluate(()=>{const e=document.querySelector('#exportJsonQuick');return {text:e.textContent.trim(),name:e.getAttribute('aria-label'),done:e.dataset.perlaDone||'',bg:getComputedStyle(e).backgroundColor};});
 const b0=await st();assert.equal(b0.text,'Guardar proyecto JSON');assert.equal(b0.done,'');
 const btn=page.getByRole('button',{name:'Guardar proyecto JSON'});
 const [dl]=await Promise.all([page.waitForEvent('download'),touch?btn.tap():btn.click()]);assert.ok(dl.suggestedFilename().endsWith('.json'));
 await page.waitForFunction(()=>document.querySelector('#exportJsonQuick').dataset.perlaDone==='1');
 const b1=await st();
 assert.equal(b1.text,'✓ Proyecto JSON guardado','pasa a la acción completada');
 assert.equal(b1.name,'Proyecto JSON guardado. Guardar proyecto JSON de nuevo','nombre accesible = lo visible + la acción');
 assert.notEqual(b1.bg,b0.bg,'cambia de color');
 assert.equal(await page.getByRole('button',{name:'Guardar proyecto JSON'}).count(),1,'se sigue encontrando por su acción');
 // Un cambio real del proyecto: el archivo ya no lo refleja y el botón vuelve a su forma de acción.
 const n0=await page.evaluate(()=>FloorPlanApp.project.objects.length);
 const box=await page.locator('g.furn').first().boundingBox();touch?await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2):await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
 await page.waitForTimeout(400);const del=page.locator('#fab button',{hasText:'Eliminar'}).first();touch?await del.tap():await del.click();
 await page.waitForFunction(n=>FloorPlanApp.project.objects.length===n-1,n0);
 await page.waitForFunction(()=>!document.querySelector('#exportJsonQuick').dataset.perlaDone,null,{timeout:5000});
 assert.equal((await st()).text,'Guardar proyecto JSON','tras un cambio vuelve a «Guardar proyecto JSON»');
 assert.deepEqual(errors,[]);
});
