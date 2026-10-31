// C4: «Dossier económico» in Entregar. Same report as Presupuestar (buildReport); professional and client variants;
// no budget → says so; null VAT is not 0 % and the gross total is not final; print window; CSV/JSON/BC3 through the
// existing authorities; A4 economic page and the B1 client file inherit it; nothing is saved, the project never changes.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),SHOTS=process.env.QA_SHOTS||'';let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
const shot=async(page,name,loc)=>{if(!SHOTS)return;await fs.mkdir(SHOTS,{recursive:true});await (loc||page).screenshot({path:path.join(SHOTS,name+'.png')});};
for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`C4: economic dossier ${viewport.width}x${viewport.height}`,{timeout:300000},async t=>{
 const w=viewport.width,context=await browser.newContext({viewport,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=r.request().url();if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:')||u.startsWith('about:'))return r.continue();return r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanEconomicDossierUI&&window.FloorPlanBudgetUI);
 const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),ws=page.locator('#professionalWorkspace'),d=page.locator('#economicDossierDialog'),paper=d.locator('#economicDossierPaper');
 // 1. No budget prepared yet: the card says so, the dossier says so, nothing is saved by looking.
 await page.locator('#workArea-deliver').click();const card=ws.locator('[data-module="economic-dossier"]');await card.waitFor();
 assert.equal(await card.getAttribute('data-state'),'none');assert.match(await card.innerText(),/Sin presupuesto preparado/);
 assert.ok(await ws.locator('[data-module="dossier"]').count(),'the A4 dossier card coexists');
 await card.locator('[data-route="economic-dossier"]').click();await d.waitFor();assert.match(await paper.innerText(),/No se ha preparado presupuesto/);assert.equal(await d.locator('#econPrint').isDisabled(),true);
 assert.equal(await page.evaluate(()=>localStorage.getItem('rubik-budget-v1')),null,'C4 never saves');await page.keyboard.press('Escape');
 // A4 without budget: no «no disponible todavía» line; it says no budget was prepared.
 await page.evaluate(()=>FloorPlanDossier.open('technical'));let a4=await page.locator('#dossierDialog').innerText();
 assert.doesNotMatch(a4,/no disponible todavía/);assert.match(a4,/No se ha preparado presupuesto para este proyecto/);await page.keyboard.press('Escape');
 // 2. «Revisar presupuesto» goes to Presupuestar; prepare an incomplete budget with VAT undefined.
 await page.locator('#workArea-deliver').click();await ws.locator('[data-route="economic-review"]').click();await page.waitForFunction(()=>document.querySelector('[data-route="budget-edit"]'));
 await ws.locator('[data-route="budget-edit"]').click();const bd=page.locator('#budgetDialog');await bd.waitFor();
 const price=async(id,v)=>{const f=bd.locator(`tr[data-item="${id}"] [data-field="price"]`);await f.fill(String(v));await f.press('Tab');};
 await price('opening:door',250);await price('paint',8);await bd.locator('tr[data-item="opening:door"] [data-field="review"]').check();
 await bd.locator('#budgetVat').selectOption('');await page.keyboard.press('Escape');
 const saved=await page.evaluate(()=>localStorage.getItem('rubik-budget-v1'));
 await page.locator('#workArea-deliver').click();await card.waitFor();assert.equal(await card.getAttribute('data-state'),'incomplete');assert.match(await card.innerText(),/total no definitivo/);
 await card.scrollIntoViewIfNeeded();await shot(page,`c4-card-${w}`,card);
 await card.locator('[data-route="economic-dossier"]').click();await d.waitFor();
 const pro=await paper.innerText();
 const canon=await page.evaluate(()=>FloorPlanBudgetPresentation.buildReport(FloorPlanBudgetUI.current().budget));
 assert.match(pro,/IVA no definido\/incompleto/);assert.match(pro,/No definitivo/);assert.doesNotMatch(pro,/IVA 0 %/);
 assert.match(pro,/partida\(s\) sin precio/);assert.match(pro,/Propio/);assert.match(pro,/Sin precio/);assert.match(pro,/Revisado/);assert.match(pro,/Pendiente de revisar/);
 assert.match(await paper.textContent(),/Merma/);assert.match(pro,/Trazabilidad y fuentes/i);assert.match(pro,new RegExp(canon.budgetId));
 const net=canon.totals.net.amount.toLocaleString('es-ES',{style:'currency',currency:'EUR'});assert.ok(pro.includes(net),'net copied from the canonical report');
 await shot(page,`c4-professional-incomplete-${w}`);
 await d.locator('#econVariantClient').click();const cli=await paper.innerText();
 assert.match(cli,/Cliente/i);assert.ok(cli.includes(net),'same figures');assert.doesNotMatch(cli,/Trazabilidad|Merma/i);assert.ok(!cli.includes(canon.budgetId),'no internal id');assert.match(cli,/no es un presupuesto certificado/i);
 await shot(page,`c4-client-incomplete-${w}`);
 // 3. Complete: VAT 21 % and every item priced → final gross total.
 await page.keyboard.press('Escape');await page.evaluate(()=>FloorPlanProfessionalUI.open('budget'));await ws.locator('[data-route="budget-edit"]').click();await bd.waitFor();
 const ids=await page.evaluate(()=>FloorPlanBudgetUI.budget.items.map(i=>i.id));for(const id of ids)if(await bd.locator(`tr[data-item="${id}"] [data-field="price"]`).inputValue()==='')await price(id,10);
 await bd.locator('#budgetVat').selectOption('21');await page.keyboard.press('Escape');
 await page.evaluate(()=>FloorPlanProfessionalUI.open('deliver'));await card.waitFor();assert.equal(await card.getAttribute('data-state'),'complete');assert.match(await card.innerText(),/total con IVA/);
 await card.locator('[data-route="economic-dossier"]').click();await d.waitFor();await d.locator('#econVariantProfessional').click();
 const full=await page.evaluate(()=>FloorPlanBudgetPresentation.buildReport(FloorPlanBudgetUI.current().budget).totals);assert.equal(full.gross.complete,true);
 const txt=await paper.innerText();assert.match(txt,/IVA 21 %/);assert.ok(txt.includes(full.gross.amount.toLocaleString('es-ES',{style:'currency',currency:'EUR'})));assert.doesNotMatch(txt,/No definitivo/);
 await shot(page,`c4-professional-complete-${w}`);await d.locator('#econVariantClient').click();await shot(page,`c4-client-complete-${w}`);
 // 4. Exports through the existing authorities.
 const dl=async id=>{const p=page.waitForEvent('download');await d.locator(id).click();const x=await p;return {name:x.suggestedFilename(),body:await fs.readFile(await x.path())};};
 const csv=await dl('#econCsv');assert.match(csv.name,/\.csv$/);assert.equal(csv.body.toString('utf8'),await page.evaluate(()=>FloorPlanBudgetPresentation.toCsv(FloorPlanBudgetUI.current().budget,{delimiter:';',bom:true})));
 const js=await dl('#econJson');assert.equal(js.body.toString('utf8'),await page.evaluate(()=>FloorPlanBudgetPresentation.serializeReport(FloorPlanBudgetUI.current().budget)));
 const bc3=await dl('#econBc3');assert.match(bc3.name,/\.bc3$/);assert.ok(bc3.body.length>100);
 // 5. Print / Save PDF: own window with the same document.
 const popup=page.waitForEvent('popup');await page.evaluate(()=>{window.__printed=0;});await d.locator('#econPrint').click();const win=await popup;await win.waitForLoadState();
 await win.waitForSelector('.econ-paper');assert.equal(await win.evaluate(()=>getComputedStyle(document.querySelector('.econ-paper')).backgroundColor),'rgb(255, 253, 248)','print window styled offline');assert.match(await win.locator('.econ-paper').innerText(),/IVA 21 %/);await win.close();
 // §14.28 blocked print window: said, not thrown.
 await page.evaluate(()=>{window.__open=window.open;window.open=()=>null;});await d.locator('#econPrint').click();assert.match(await d.locator('.econ-status').innerText(),/bloqueó la ventana/);await page.evaluate(()=>{window.open=window.__open;});
 assert.match(pro,/Documento generado el/);assert.doesNotMatch(cli,/Pendiente de revisar/,'review state is professional detail');
 await d.locator('#econClose').click();
 // 6. A4 (technical → professional, client → client variant) and B1 through compose.
 await page.evaluate(()=>FloorPlanDossier.open('technical'));const eco=page.locator('#dossierDialog .dossier-economic');await eco.waitFor();
 assert.match(await eco.innerText(),/Total con IVA/);a4=await page.locator('#dossierDialog').innerText();assert.doesNotMatch(a4,/no disponible todavía/);assert.match(a4,/Presupuesto: preparado por el profesional/);
 await eco.scrollIntoViewIfNeeded();await shot(page,`c4-a4-technical-${w}`,eco);await page.keyboard.press('Escape');
 const b1=await page.evaluate(()=>{const p=document.createElement('div');const bag=FloorPlanDossier.compose(p,'client');bag.forEach(u=>URL.revokeObjectURL(u));const e=p.querySelector('.dossier-economic');return e?e.textContent:null;});
 assert.ok(b1&&/Total con IVA/.test(b1)&&!/bud_|Trazabilidad/.test(b1),'B1 inherits the client economic page');
 // Nothing saved by C4, project unchanged, no errors.
 assert.equal(await page.evaluate(()=>localStorage.getItem('rubik-budget-v1'))!==saved,true,'only Presupuestar changed the budget');
 const after=await page.evaluate(()=>localStorage.getItem('rubik-budget-v1'));await page.evaluate(()=>{FloorPlanEconomicDossierUI.open('client');FloorPlanEconomicDossierUI.close();});assert.equal(await page.evaluate(()=>localStorage.getItem('rubik-budget-v1')),after);
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project);assert.deepEqual(errors,[]);
});
