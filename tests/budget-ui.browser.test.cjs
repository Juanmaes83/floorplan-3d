// Phase C2: «Presupuesto». Items from quantities; the professional sets price, waste and VAT and reviews each price;
// the total stays incomplete while an item has no price; own prices go to the studio tariff and come back
// unreviewed in another project; budget kept per project; CSV/JSON downloads; the project never changes.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),SHOTS=process.env.QA_SHOTS||'';let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`Phase C2: operational budget ${viewport.width}x${viewport.height}`,{timeout:240000},async t=>{
 const context=await browser.newContext({viewport,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],external=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=r.request().url();if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanBudgetUI);
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),workspace=page.locator('#professionalWorkspace');
 await page.locator('#workArea-budget').click();
 assert.match(await workspace.innerText(),/Presupuesto[\s\S]{0,40}11 partidas desde las cantidades · 11 sin precio · 0 sin revisar/);assert.equal(await workspace.getByRole('button',{name:/Importar BC3/}).count(),0);
 await workspace.locator('[data-route="budget-edit"]').click();const d=page.locator('#budgetDialog');await d.waitFor();
 assert.match(await d.locator('#budgetWarnings').innerText(),/11 partidas sin precio: el total no está completo/);
 assert.equal(await d.locator('#budgetTotals').innerText().then(s=>/Base imponible\s*—/.test(s)),true,'no price → no total, never 0 €');
 const row=id=>d.locator(`tr[data-item="${id}"]`);
 // A price: subtotal = quantity × (1 + waste) × price; reviewed only when marked.
 assert.equal(await row('opening:door').locator('[data-field="review"]').isDisabled(),true);
 await row('opening:door').locator('[data-field="price"]').fill('250');await row('opening:door').locator('[data-field="price"]').press('Tab');
 await page.waitForFunction(()=>/1\.?500,00\s€/.test(document.querySelector('tr[data-item="opening:door"]').textContent));
 assert.match(await row('opening:door').innerText(),/Precio propio/);assert.match(await d.locator('#budgetWarnings').innerText(),/10 partidas sin precio[\s\S]*1 precio sin revisar/);
 await row('opening:door').locator('[data-field="review"]').check();await page.waitForFunction(()=>!/precios sin revisar/.test(document.querySelector('#budgetWarnings').textContent));
 await row('paint').locator('[data-field="price"]').fill('8');await row('paint').locator('[data-field="price"]').press('Tab');
 await row('paint').locator('[data-field="waste"]').fill('10');await row('paint').locator('[data-field="waste"]').press('Tab');
 const paint=await page.evaluate(()=>{const l=FloorPlanBudget.calculateBudget(FloorPlanBudgetUI.budget).lines.find(x=>x.id==='paint');return [l.quantity.value,l.budgetQuantity,l.subtotalNet];});
 assert.ok(Math.abs(paint[1]-paint[0]*1.1)<1e-6);assert.equal(paint[2],Math.round(paint[0]*1.1*8*100)/100);
 await d.locator('#budgetVat').selectOption('10');
 const totals=await page.evaluate(()=>FloorPlanBudget.calculateBudget(FloorPlanBudgetUI.budget).totals);assert.equal(totals.tax.amount,Math.round(totals.net.amount*10)/100);assert.equal(totals.net.complete,false);
 if(SHOTS){await fs.mkdir(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,`c2-${viewport.width}.png`)});}
 // Studio tariff.
 await d.locator('#budgetTariff').click();assert.match(await d.locator('#budgetStatus').innerText(),/2 precios guardados en tu tarifa/);
 const csvDl=page.waitForEvent('download');await d.locator('#budgetCsv').click();const csv=await fs.readFile(await (await csvDl).path(),'utf8');assert.ok(csv.startsWith('﻿'));assert.match(csv,/Puerta de paso/);
 const jsDl=page.waitForEvent('download');await d.locator('#budgetJson').click();const doc=JSON.parse(await fs.readFile(await (await jsDl).path(),'utf8'));assert.equal(doc.schema,'rubik-sota.floorplan-budget');assert.equal(doc.taxRatePercent,10);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#budgetDialog').open);
 assert.match(await workspace.innerText(),/11 partidas desde las cantidades · 9 sin precio · 1 sin revisar/,'the card follows the budget');
 // Reopen: kept. The project never changed.
 await workspace.locator('[data-route="budget-edit"]').click();assert.equal(await row('opening:door').locator('[data-field="review"]').isChecked(),true);assert.equal(await d.locator('#budgetVat').inputValue(),'10');
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before);
 // Another project gets the tariff prices, unreviewed.
 const other=await page.evaluate(()=>{const p=structuredClone(FloorPlanApp.project);p.id='prj_other';const r=FloorPlanBudgetDraft.draft(p,{tariff:JSON.parse(localStorage.getItem('rubik-tariff-v1')),labels:{title:'P',floor:'P',skirting:'R',paint:'Pintura',newWalls:'T',demolition:'D',door:'Puerta',slidingDoor:'C',window:'V',tariff:'Tarifa del estudio',chapters:{floors:'a',walls:'b',partitions:'c',carpentry:'d'}}});const door=r.budget.items.find(i=>i.id==='opening:door');return [door.unitPrice,door.review.status,door.priceSource.label];});
 assert.deepEqual(other,[250,'unreviewed','Tarifa del estudio']);
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),false);
});

// Phase C3: a BC3 supplied by the professional, read locally: choose the price column, use a reference price for an
// item (unreviewed, same unit only), keep another only as a reference, and export the budget as a BC3.
const fx=require('./fixtures/bc3/synthetic-tariff.cjs'),F=require('../js/fiebdc3-codec.js');
for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`Phase C3: BC3 reference prices and export ${viewport.width}x${viewport.height}`,{timeout:240000},async t=>{
 const context=await browser.newContext({viewport,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],requests=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET')requests.push(r.url());});
 await page.route('**/*',r=>{const u=r.request().url();if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();return r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanBudgetUI&&window.FloorPlanBc3Budget);
 await page.locator('#workArea-budget').click();await page.locator('#professionalWorkspace [data-route="budget-edit"]').click();const d=page.locator('#budgetDialog');await d.waitFor();
 assert.match(await d.locator('#budgetBc3').innerText(),/Precios de referencia \(BC3\)/);
 await d.locator('#budgetBc3 summary').click();assert.match(await d.locator('#budgetBc3').innerText(),/Rubik no la sube ni la guarda[\s\S]*Tú respondes de su licencia/);
 await d.locator('#budgetBc3File').setInputFiles({name:'tarifa-estudio.bc3',mimeType:'application/octet-stream',buffer:Buffer.from(fx.text,'latin1')});
 await d.locator('#budgetBc3Base').waitFor();assert.match(await d.locator('#budgetBc3Base').innerText(),/ESTUDIO DE PRUEBA · 4 partidas con precio · tarifa-estudio\.bc3/);
 await d.locator('#budgetBc3Column').selectOption('1');
 const row=id=>d.locator(`tr[data-item="${id}"]`);
 await row('opening:door').locator('[data-field="ref"]').click();await d.locator('#budgetRefQuery').fill('puerta');
 assert.match(await d.locator('#budgetRefResults').innerText(),/PUERTA-LISA\s+Puerta de paso lisa lacada · 225,00\s€\/ud/);
 await d.locator('#budgetRefResults button[data-code="PUERTA-LISA"]').first().click();
 await page.waitForFunction(()=>/Precio de referencia · BC3 ESTUDIO DE PRUEBA · Zona B PUERTA-LISA/.test(document.querySelector('tr[data-item="opening:door"]').textContent));
 assert.equal(await row('opening:door').locator('[data-field="price"]').inputValue(),'225');assert.equal(await row('opening:door').locator('[data-field="review"]').isChecked(),false,'a reference price is never reviewed by itself');
 await row('paint').locator('[data-field="ref"]').click();await d.locator('#budgetRefQuery').fill('pintura');assert.doesNotMatch(await d.locator('#budgetRefResults').innerText(),/PUERTA/,'only items in the same unit');
 await d.locator('#budgetRefResults li').first().getByRole('button',{name:'Sólo como referencia'}).click();
 await page.waitForFunction(()=>/Ref\. PINT-LISA: 8,40\s€\/m²/.test(document.querySelector('tr[data-item="paint"]').textContent));assert.equal(await row('paint').locator('[data-field="price"]').inputValue(),'');
 if(process.env.QA_SHOTS){await fs.mkdir(process.env.QA_SHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.QA_SHOTS,`c3-${viewport.width}.png`)});}
 const dl=page.waitForEvent('download');await d.locator('#budgetBc3Export').click();const file=await dl;assert.match(file.suggestedFilename(),/^rubik-sota-presupuesto-proyecto-de-ejemplo\.bc3$/);
 const model=F.parse(new Uint8Array(await fs.readFile(await file.path())));const door=model.concepts.find(c=>c.summary==='Puerta de paso');assert.deepEqual([door.unit,door.prices[0].value],['ud',225]);
 assert.match(await d.locator('#budgetStatus').innerText(),/BC3 generado/);
 assert.deepEqual(requests,[],'the BC3 is read locally: nothing is uploaded');assert.deepEqual(errors,[]);
});
