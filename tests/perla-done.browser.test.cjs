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
 // §9: la descarga vive en Proyecto ▾. Proyecto propio (copia del ejemplo) para que el paso «Guarda tu proyecto» pueda estar hecho.
 {const m=page.locator('#perlaProjectMenu > summary');touch?await m.tap():await m.click();const c=page.locator('#pmCopy');touch?await c.tap():await c.click();}
 await page.waitForFunction(()=>document.querySelector('#guideBar')?.dataset.projectKind==='own'&&document.querySelector('#perlaSaved')?.dataset.state==='saved',null,{timeout:15000});
 const saveTask=()=>page.evaluate(()=>FloorPlanGuideUI.progress().tasks.find(t=>t.id==='save')?.status||null);
 const local=()=>page.evaluate(()=>{const e=document.querySelector('#perlaSaved');return `${e.dataset.state}|${e.textContent.trim()}|${e.title}`;});
 const task0=await saveTask(),local0=await local();
 const st=()=>page.evaluate(()=>{const e=document.querySelector('#pmDownloadJson');return {text:e.querySelector('b').textContent.trim(),name:e.getAttribute('aria-label'),done:e.dataset.perlaDone||'',bg:getComputedStyle(e).backgroundColor};});
 const open=async()=>{const s=page.locator('#perlaProjectMenu > summary');touch?await s.tap():await s.click();await page.waitForSelector('#pmDownloadJson:visible');};
 await open();const b0=await st();assert.equal(b0.text,'Descargar proyecto JSON');assert.equal(b0.done,'');
 const btn=page.getByRole('menuitem',{name:/^Descargar proyecto JSON/});
 const expected=await page.evaluate(()=>structuredClone(FloorPlanApp.project));
 const [dl]=await Promise.all([page.waitForEvent('download'),touch?btn.tap():btn.click()]);assert.ok(dl.suggestedFilename().endsWith('.json'));
 assert.deepEqual(JSON.parse(fs.readFileSync(await dl.path(),'utf8')),expected,'el archivo descargado es el proyecto');
 await page.waitForFunction(()=>/Proyecto JSON descargado/.test(document.querySelector('#toast').textContent)&&document.querySelector('#toast').classList.contains('show'));
 await page.waitForFunction(()=>document.querySelector('#pmDownloadJson').dataset.perlaDone==='1');
 await open();const b1=await st();
 assert.equal(b1.text,'✓ Proyecto JSON descargado','pasa a la acción completada');
 assert.equal(b1.name,'✓ Proyecto JSON descargado. Descargar proyecto JSON de nuevo','nombre accesible = lo visible + la acción');
 assert.notEqual(b1.bg,b0.bg,'cambia de color');
 assert.equal(await saveTask(),task0,'el paso «Guarda tu proyecto» conserva su estado');assert.equal(task0,'completed','y es «Hecho»');
 assert.equal(await local(),local0,'«Guardado local» sigue indicando el guardado en el navegador');assert.match(local0,/^saved\|✓ Guardado\|.*solo en este navegador/);
 await page.keyboard.press('Escape');
 // Un cambio real del proyecto: el archivo ya no lo refleja y el botón vuelve a su forma de acción.
 const n0=await page.evaluate(()=>FloorPlanApp.project.objects.length);
 const box=await page.locator('g.furn').first().boundingBox();touch?await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2):await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
 await page.waitForTimeout(400);const del=page.locator('#fab button',{hasText:'Eliminar'}).first();touch?await del.tap():await del.click();
 await page.waitForFunction(n=>FloorPlanApp.project.objects.length===n-1,n0);
 await page.waitForFunction(()=>!document.querySelector('#pmDownloadJson').dataset.perlaDone,null,{timeout:5000});
 await open();assert.equal((await st()).text,'Descargar proyecto JSON','tras un cambio vuelve a «Descargar proyecto JSON»');
 assert.deepEqual(errors,[]);
});
