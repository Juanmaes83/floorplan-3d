// Phase C1: «Cantidades del proyecto» in Presupuestar. Tables with status, totals from the engine, CSV download for
// a Spanish spreadsheet; read-only and without network.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),SHOTS=process.env.QA_SHOTS||'';let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`Phase C1: project quantities ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const context=await browser.newContext({viewport,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],external=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=r.request().url();if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanQuantityUI);
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),workspace=page.locator('#professionalWorkspace');
 await page.locator('#workArea-budget').click();
 const card=workspace.locator('[data-route="quantities"]').locator('xpath=ancestor::*[contains(@class,"professional-card")][1]');
 assert.match(await card.innerText(),/Cantidades del proyecto[\s\S]*87,18 m² útiles · 86,83 m de muro · 22 carpinterías/);
 await workspace.locator('[data-route="quantities"]').click();const dialog=page.locator('#quantityDialog');await dialog.waitFor();
 assert.match(await dialog.locator('#quantityNote').innerText(),/estimado: escala sin calibrar[\s\S]*«—» = no se puede calcular/);
 assert.match(await dialog.locator('#quantitySummary').innerText(),/87,18 m²[\s\S]*86,83 m[\s\S]*22 ud[\s\S]*46 ud/);
 assert.equal(await dialog.locator('#quantityRooms tbody tr').count(),13);assert.equal(await dialog.locator('#quantityFloors tbody tr').count(),6);
 assert.equal(await dialog.locator('#quantityOpenings tbody tr th').first().innerText(),'Puerta');
 assert.match(await dialog.locator('#quantityRooms tbody').innerText(),/Dormitorio principal\t12,37\t14,08\t31,36 ⚠\tParquet de roble\tEstimado|Dormitorio principal/);
 if(SHOTS){await fs.mkdir(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,`c1-${viewport.width}.png`)});}
 const download=page.waitForEvent('download');await dialog.locator('#quantityDownload').click();const d=await download;
 assert.equal(d.suggestedFilename(),'rubik-sota-cantidades-proyecto-de-ejemplo.csv');const text=await fs.readFile(await d.path(),'utf8');
 assert.ok(text.startsWith('﻿Apartado;Elemento;Cantidad;Unidad;Detalle;Estado'));assert.match(text,/\r\nPavimentos;[^;]+;34,27;m2;/);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#quantityDialog').open);
 assert.equal(await page.evaluate(()=>document.activeElement?.dataset.route),'quantities');
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before);assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),false,'no horizontal page scroll');
});
