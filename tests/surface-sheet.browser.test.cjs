const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const Core=require('../js/project-core.js'),Metrics=require('../js/surface-core.js');
const calibrated=require('../docs/contracts/examples/floorplan-project-v1.f1b.example.json');
let server,browser,url;
before(async()=>{
 const root=path.resolve(__dirname,'..');
 server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',file.endsWith('.css')?'text/css':/\.m?js$/.test(file)?'text/javascript':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));url='http://127.0.0.1:'+server.address().port+'/';
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
});
after(async()=>{await browser?.close();await new Promise(resolve=>server?.close(resolve));});
async function setup(t,width=1440,height=900){
 const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});
 t.after(()=>context.close());
 await context.addInitScript(()=>{window.print=()=>{window.__printCalls=(window.__printCalls||0)+1;};});
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanSurfaceSheet&&window.FloorPlanSurfaceMetrics);
 await page.locator('#welcomeExample').click();
 return {page,context,errors};
}
async function shot(page,name){if(!process.env.SURFACE_SHEET_ARTIFACTS)return;await fs.mkdir(process.env.SURFACE_SHEET_ARTIFACTS,{recursive:true});await page.locator('#surfaceSheetDialog').screenshot({path:path.join(process.env.SURFACE_SHEET_ARTIFACTS,name+'.png')});await page.locator('.surface-sheet-scroll').evaluate(node=>node.scrollTop=node.scrollHeight);await page.locator('#surfaceSheetDialog').screenshot({path:path.join(process.env.SURFACE_SHEET_ARTIFACTS,name+'-bottom.png')});await page.locator('.surface-sheet-scroll').evaluate(node=>node.scrollTop=0);}
const text=page=>page.locator('#surfaceSheetDocument').innerText();

for(const width of [1440,390])test('single-level area schedule is readable and printable at '+width+'px',{timeout:60000},async t=>{
 const {page,errors}=await setup(t,width,width===390?844:900);
 const p=Core.initial();p.schemaVersion='1.6.0';p.rooms[0].name='Suite principal con una descripción larga pero legible';p.rooms[0].family='bedroom';
 p.scale=calibrated.scale;p.sourceImages=calibrated.sourceImages;
 assert.doesNotThrow(()=>Core.validate(p));
 await page.evaluate(project=>FloorPlanApp.importProject(project),p);
 const expected=Metrics.home(p);
 await page.locator('#guideDetails').click();
 await page.locator('#guideDeliverSurfaceSheet').click();
 assert.equal(await page.locator('#surfaceSheetDialog').evaluate(d=>d.open),true);
 assert.equal(await page.locator('.surface-sheet-level').count(),1);
 const content=await text(page);
 assert.match(content,/FICHA DE SUPERFICIES|Ficha de superficies/);
 assert.match(content,/Medido \/ calibrado/);
 assert.match(content,new RegExp(expected.areaM2.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}).replace(',','\\,').replace('.','\\.')+' m²'));
 assert.match(content,/Suite principal con una descripción larga pero legible/);
 assert.match(content,/Sin especificar/);
 assert.match(content,/Excluida del cómputo/);
 assert.match(content,/Superficie construida/);
 assert.match(content,/No disponible/);
 assert.doesNotMatch(content,/主卧室|unspecified|measured|estimated/);
 assert.equal(await page.locator('.surface-sheet-finish-row').count()>0,true);
 assert.equal(await page.locator('#surfaceSheetDocument').evaluate(node=>node.scrollWidth<=node.clientWidth),true);
 assert.equal(await page.locator('.surface-sheet-project').evaluate(node=>node.scrollHeight<=node.clientHeight+1),true);
 await shot(page,width+'-single');
 const popupPromise=page.waitForEvent('popup');
 await page.locator('#surfaceSheetPrint').click();
 const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');
 assert.equal(await popup.locator('#surfaceSheetDocument').count(),1);
 assert.equal(await popup.locator('#stage').count(),0);
 assert.equal(await popup.locator('link[href*="surface-sheet.css"]').count(),1);
 await popup.waitForFunction(()=>window.__printCalls>0);
 const pdf=await popup.pdf({format:'A4',printBackground:true});
 assert.equal(pdf.subarray(0,4).toString(),'%PDF');
 if(process.env.SURFACE_SHEET_ARTIFACTS&&width===1440)await popup.screenshot({path:path.join(process.env.SURFACE_SHEET_ARTIFACTS,'print-full.png'),fullPage:true});
 await popup.close();
 await page.locator('#surfaceSheetClose').click();
 assert.equal(await page.locator('#surfaceSheetDialog').evaluate(d=>d.open),false);
 assert.deepEqual(errors,[]);
});

test('estimated, unavailable and excluded room figures stay distinct from partial totals and finishes',async t=>{
 const {page,errors}=await setup(t);
 const expected=await page.evaluate(()=>{
  const p=FloorPlanCore.clone(FloorPlanApp.project);
  p.rooms[0].name='';p.rooms[0].family='unspecified';p.schemaVersion='1.6.0';
  FloorPlanApp.importProject(p);
  const original=FloorPlanSurfaceMetrics.home;
  FloorPlanSurfaceMetrics.home=source=>{
   const result=original(source),first=result.levels[0],missing=first.rooms[1];
   missing.areaM2=null;missing.status='unavailable';
   first.areaM2=first.areaM2-4.5;first.complete=false;first.missing=[missing.id];
   result.areaM2=first.areaM2;result.complete=false;result.missing=[missing.id];
   return result;
  };
  return {missing:p.rooms[1].name,partial:FloorPlanSurfaceMetrics.home(p).areaM2};
 });
 await page.evaluate(()=>FloorPlanSurfaceSheet.open());
 const content=await text(page);
 assert.match(content,/TOTAL PARCIAL DISPONIBLE/);
 assert.match(content,/Subtotal parcial/);
 assert.match(content,/Hay estancias computables sin superficie disponible/);
 assert.match(content,/Estimado/);
 assert.match(content,/Estancia/);
 assert.match(content,/Sin especificar/);
 assert.match(content,/Excluida del cómputo/);
 const unavailable=page.locator('.surface-sheet-table tr').filter({hasText:await page.evaluate(name=>nm(name),expected.missing)}).first();
 assert.match(await unavailable.innerText(),/No disponible/);
 assert.doesNotMatch(await unavailable.innerText(),/0,00 m²/);
 assert.match(content,new RegExp(expected.partial.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}).replace(',','\\,').replace('.','\\.')+' m²'));
 assert.match(content,/Parcial · faltan superficies/);
 assert.deepEqual(errors,[]);
});

test('two levels keep their order, own subtotals, exclusion and material grouping',async t=>{
 const {page,errors}=await setup(t,390,844);
 const expected=await page.evaluate(()=>{
  const ground=FloorPlanCore.clone(FloorPlanApp.project),upper=FloorPlanCore.clone(FloorPlanApp.project);
  ground.rooms[0].name='主卧室';ground.rooms[1].name='Cocina';ground.rooms[2].countsTowardArea=false;
  upper.rooms[0].name='Habitación de invitados';upper.rooms[0].family='bedroom';upper.schemaVersion='1.6.0';
  window.FloorPlanBuildingUI.presentationSources=()=>({building:{name:'Vivienda de dos plantas'},levels:[
   {levelId:'lvl_upper',name:'Planta primera',order:1,project:upper},
   {levelId:'lvl_ground',name:'Planta baja',order:0,project:ground}
  ]});
  const home=FloorPlanSurfaceMetrics.home({levels:[{id:'lvl_upper',name:'Planta primera',order:1,project:upper},{id:'lvl_ground',name:'Planta baja',order:0,project:ground}]});
  return {total:home.areaM2,subtotals:home.levels.map(l=>l.areaM2)};
 });
 await page.evaluate(()=>FloorPlanSurfaceSheet.open());
 const headings=await page.locator('.surface-sheet-level h2').allTextContents();
 assert.deepEqual(headings,['Planta baja','Planta primera']);
 const totals=await page.locator('.surface-sheet-subtotal strong').allTextContents();
 assert.deepEqual(totals,expected.subtotals.map(v=>v.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' m²'));
 assert.match(await text(page),/Dormitorio principal/);
 assert.match(await text(page),/Habitación de invitados/);
 assert.match(await text(page),/Excluida del cómputo/);
 assert.match(await text(page),new RegExp(expected.total.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}).replace(',','\\,').replace('.','\\.')+' m²'));
 assert.equal(await page.locator('#surfaceSheetDocument').evaluate(node=>node.scrollWidth<=node.clientWidth),true);
 await shot(page,'390-two-levels');
 assert.deepEqual(errors,[]);
});

test('configured professional logo and contact are carried into the independent sheet',async t=>{
 const {page,errors}=await setup(t);
 const logo=(await fs.readFile(path.join(__dirname,'fixtures/brand-logo.png'))).toString('base64');
 await page.evaluate(base64=>{
  const profile=FloorPlanBrand.saveProfile(FloorPlanBrandUI.store,{name:'Estudio Serra',person:'Ana Serra',email:'ana@example.com',logo:'data:image/png;base64,'+base64});
  FloorPlanBrand.setDelivery(FloorPlanBrandUI.store,FloorPlanApp.entryId,{profileId:profile.id,title:'Proyecto Serra'});
 },logo);
 await page.evaluate(()=>FloorPlanSurfaceSheet.open());
 assert.match(await text(page),/Estudio Serra/);
 assert.match(await text(page),/ana@example.com/);
 assert.equal(await page.locator('.surface-sheet-brand img').count(),1);
 await shot(page,'1440-brand');
 const popupPromise=page.waitForEvent('popup');await page.locator('#surfaceSheetPrint').click();const popup=await popupPromise;
 assert.equal(await popup.locator('.surface-sheet-brand img').count(),1);
 assert.match(await popup.locator('.surface-sheet-footer').innerText(),/Estudio Serra/);
 await popup.close();assert.deepEqual(errors,[]);
});

test('English and Chinese labels follow the existing language control while legacy names stay localized',async t=>{
 const {page,errors}=await setup(t);
 await page.locator('#langBtn').click();
 await page.evaluate(()=>FloorPlanSurfaceSheet.open());
 assert.match(await text(page),/Area schedule|TOTAL NET AREA/);
 assert.match(await text(page),/Main bedroom/);
 assert.doesNotMatch(await text(page),/主卧室|unspecified/);
 await page.locator('#surfaceSheetClose').click();
 await page.locator('#langBtn').click();
 await page.evaluate(()=>FloorPlanSurfaceSheet.open());
 assert.match(await text(page),/面积明细表/);
 assert.match(await text(page),/已测量|估算/);
 assert.deepEqual(errors,[]);
});
