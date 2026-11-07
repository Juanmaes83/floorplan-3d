'use strict';
/* FT3D-8 E2 · INT-R1: ciclo de vida de View3D entre «Dibujo vivo» (Hybrid V2, master) y la
   Evolución de obra (FT3D-8). Con el 3D real de RUBIK cargado (three@0.160.0 desde THREE_LOCAL_DIR):
   1) presentación con Dibujo vivo → cerrar → abrir Evolución: View3D suspendido, sin errores;
   2) volver a RUBIK: View3D reanudado y el proyecto intacto;
   3) otra vez presentación con Dibujo vivo tras la Evolución: abre y cierra limpio (sin residuos de la Evolución). */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
let server,url,browser;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(new URL(req.url,'http://l').pathname.replace(/\/$/,'/index.html')));if(!file.startsWith(root+path.sep))throw 0;
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const skip=!process.env.THREE_LOCAL_DIR&&'THREE_LOCAL_DIR not set';
test('INT-R1 · Dibujo vivo ↔ Evolución de obra comparten View3D sin interferencias',{skip,timeout:900000},async t=>{
 const context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});page.setDefaultTimeout(180000);
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async r=>{const u=r.request().url();const body=await require('./helpers/three-module.cjs')(u,()=>Promise.reject(Error('no CDN')));await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body});});
 await page.route(/^https?:\/\/(?!127\.0\.0\.1|cdn\.jsdelivr\.net\/npm\/three@0\.160\.0)/,r=>r.abort());
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationLivingDrawingBegin&&window.FloorPlanConstructionUI,null,{timeout:60000});
 await page.locator('#welcomeExample').click();await page.waitForTimeout(800);
 const project=()=>page.evaluate(()=>JSON.stringify(FloorPlanApp.project));const before0=await project();
 const living=async()=>{await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
  await page.locator('#presentationLivingDrawing').check();const start=page.getByRole('button',{name:'Iniciar presentación'});await start.scrollIntoViewIfNeeded();await start.click();
  await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='living-drawing'&&View3D.presentationStoryInfo?.living,null,{timeout:300000});
  await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden,null,{timeout:120000});
  await page.waitForFunction(()=>!document.body.classList.contains('presentation-exiting'),null,{timeout:60000});};
 // 1) Dibujo vivo → cerrar
 await living();assert.equal(await page.evaluate(()=>!!View3D.presentationLivingDrawingInfo?.active),false,'el Dibujo vivo termina al cerrar');
 // 2) Evolución de obra desde Presupuestar
 await page.locator('#workArea-budget').click();await page.waitForFunction(()=>document.getElementById('professionalWorkspace')?.dataset.area==='budget');
 await page.evaluate(()=>FloorPlanConstructionUI.openEvolution());await page.waitForSelector('#evolutionOverlay:not([hidden])');
 await page.frameLocator('#evolutionFrame').locator('#stage').waitFor();await page.waitForTimeout(1500);
 assert.equal(await page.evaluate(()=>View3D.suspended),true,'View3D suspendido mientras la Evolución está abierta');
 await page.locator('#evolutionBack').click();await page.waitForSelector('#evolutionOverlay',{state:'hidden'});
 await page.locator('#professionalWorkspace button:has-text("Volver a Diseñar")').first().click().catch(()=>{});await page.waitForTimeout(800);
 assert.equal(await page.evaluate(()=>View3D.suspended),false,'View3D reanudado al volver a RUBIK');
 // 3) Otra vez Dibujo vivo después de la Evolución
 await living();
 assert.equal(await project(),before0,'el proyecto no cambia');
 assert.deepEqual(errors.filter(e=>!/favicon/.test(e)),[],'sin errores');
});
