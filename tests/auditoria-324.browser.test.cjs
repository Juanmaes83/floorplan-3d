// Auditoría #324 (Codex, 87f4661b · docs/qa/auditoria-324-villa-linde): hallazgos V01–V09 sobre un edificio sintético de
// dos plantas (tests/fixtures/auditoria-324). Cada prueba exige el criterio de aceptación de su hallazgo; ninguna rebaja otra.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),FIX=path.join(__dirname,'fixtures','auditoria-324');let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary','.wasm':'application/wasm'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://l').pathname),f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
async function open(t,viewport={width:1440,height:900},file='edificio-dos-plantas.json'){
 const context=await browser.newContext({viewport,acceptDownloads:true});t.after(()=>context.close());const page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>{const u=r.request().url();return u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:')?r.continue():r.abort();});
 await page.goto(url+'#editor');await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.locator('#uploadIn').setInputFiles(path.join(FIX,file));await page.waitForFunction(()=>window.FloorPlanApp.levelContext?.levels===2);
 return {page,errors};}
async function priceAll(page,value){await page.getByRole('button',{name:'Presupuestar',exact:true}).click();await page.getByRole('button',{name:'Abrir presupuesto',exact:true}).click();
 const d=page.locator('#budgetDialog');for(const id of await d.locator('tr[data-item]').evaluateAll(r=>r.map(x=>x.dataset.item))){const f=d.locator(`tr[data-item="${id}"] [data-field="price"]`);await f.fill(value);await f.press('Tab');}
 await d.locator('#budgetVat').selectOption('21');return d;}
const read=async dl=>fs.readFile(await dl.path(),'utf8');

test('V01 · el presupuesto de una planta lo dice en Presupuestar, D4 (pantalla e impresión), CSV, JSON y al cambiar de planta',{timeout:240000},async t=>{
 const {page,errors}=await open(t,undefined,'edificio-nombre-neutro.json');const d=await priceAll(page,'100');
 const totals=await d.locator('#budgetTotals').innerText();assert.match(totals,/28\.125,67\s€/,'el importe no cambia');
 assert.match(await d.locator('#budgetScope').innerText(),/^Alcance: solo la planta «Planta baja» · 1 de 2 plantas del edificio «.+»\. Las demás plantas no están incluidas\.$/);
 const [csvDl]=await Promise.all([page.waitForEvent('download'),d.locator('#budgetCsv').click()]);const csv=await read(csvDl);
 assert.match(csvDl.suggestedFilename(),/-planta-baja\.csv$/);const [head,first]=csv.replace(/^﻿/,'').split('\r\n');
 assert.match(head,/;scope$/);assert.match(first,/;Alcance: solo la planta «Planta baja» · 1 de 2 plantas/);
 const [jsonDl]=await Promise.all([page.waitForEvent('download'),d.locator('#budgetJson').click()]);const json=JSON.parse(await read(jsonDl));
 assert.match(json.title,/Planta «Planta baja» \(1 de 2 plantas\)$/);assert.equal(json.subject.type,'project');assert.match(jsonDl.suggestedFilename(),/-planta-baja\.json$/);
 await d.locator('#budgetClose').click();
 // D4: cabecera y etiqueta del total, en pantalla y en la ventana de impresión.
 await page.getByRole('button',{name:'Entregar',exact:true}).click();await page.getByRole('button',{name:'Preparar dossier económico',exact:true}).click();
 const e=page.locator('#economicDossierDialog');await e.locator('#econVariantClient').click();const paper=e.locator('#economicDossierPaper');
 assert.match(await paper.locator('.econ-scope').innerText(),/Alcance: solo la planta «Planta baja» · 1 de 2 plantas/);
 assert.match(await paper.locator('.econ-gross dt').innerText(),/^Total con IVA · Planta «Planta baja»$/);
 await page.evaluate(()=>{const o=window.open;window.open=(...a)=>{const w=o.apply(window,a);if(w)w.print=()=>{};return w;};});
 const [out]=await Promise.all([page.context().waitForEvent('page'),e.locator('#econPrint').click()]);await out.locator('.econ-paper').waitFor();
 assert.match(await out.locator('.econ-paper').innerText(),/Alcance: solo la planta «Planta baja»[\s\S]*Total con IVA · Planta «Planta baja»\s+28\.125,67\s€/);await out.close();
 // Tras cambiar de planta, el alcance sigue a la planta activa.
 await page.keyboard.press('Escape');await page.locator('#economicDossierDialog').evaluate(x=>x.open&&x.close());
 await page.getByRole('button',{name:'Diseñar',exact:true}).click().catch(()=>{});await page.locator('#levelBar [data-level="lvl_fixture-upper"]').click();
 await page.waitForFunction(()=>window.FloorPlanBuildingUI.context.levelId==='lvl_fixture-upper');
 const d2=await priceAll(page,'50');assert.match(await d2.locator('#budgetScope').innerText(),/solo la planta «Planta primera» · 1 de 2 plantas/);
 assert.doesNotMatch(await d2.locator('#budgetTotals').innerText(),/28\.125,67/,'cada planta tiene su presupuesto');
 assert.deepEqual(errors,[]);});

test('V01 · con un proyecto de una sola planta nada cambia: sin línea de alcance ni columna extra en el CSV',{timeout:180000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});t.after(()=>context.close());const page=await context.newPage();
 await page.route('**/*',r=>{const u=r.request().url();return u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:')?r.continue():r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanBudgetUI);
 const d=await priceAll(page,'10');assert.equal(await d.locator('#budgetScope').count(),0);assert.equal(await page.evaluate(()=>window.FloorPlanBudgetScope()),null);
 const [csvDl]=await Promise.all([page.waitForEvent('download'),d.locator('#budgetCsv').click()]);assert.doesNotMatch((await read(csvDl)).split('\r\n')[0],/;scope$/);});
