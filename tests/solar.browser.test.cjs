const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const B=require('../js/building-core.js'),Core=require('../js/project-core.js');
const OUT=process.env.SOLAR_ARTIFACTS||'output/playwright/point-6';let server,browser,url;
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.hdr')?'application/octet-stream':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port+'/';browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(OUT,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
async function setup(t,viewport){const context=await browser.newContext({viewport,isMobile:viewport.width<1000,hasTouch:viewport.width<1000,acceptDownloads:true});t.after(()=>context.close());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('request',request=>{if(!request.url().startsWith(url)&&!request.url().startsWith('blob:')&&!request.url().startsWith('data:'))errors.push('External request: '+request.url());});
 await page.route('**/*',route=>route.request().url().startsWith(url)?route.continue():route.abort());
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanSolarUI&&window.View3D);await require('./editor-fixture.cjs')(page);return {page,errors};}
async function configure(page){await page.locator(await page.locator('#solarNorth').isVisible()?'#solarNorth':'#solarOpen3d').click();for(const [id,v]of Object.entries({solarNorthInput:'25',solarLatitude:'40.4168',solarLongitude:'-3.7038',solarTimeZone:'Europe/Madrid',solarDate:'2026-06-21',solarTime:'09:00'}))await page.locator('#'+id).fill(v);}
const inspect=page=>page.evaluate(()=>View3D.solarInspect);
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])test('solar configuration, 3D direction, restoration and responsive '+viewport.width+'x'+viewport.height,{timeout:180000},async t=>{
 const {page,errors}=await setup(t,viewport),name=viewport.width+'x'+viewport.height;
 const legacy=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));assert.match(await page.locator('#solarNorth').innerText(),/sin configurar/);
 await page.locator('#solarNorth').click();await page.locator('#solarActivate').click();assert.match(await page.locator('#solarError').innerText(),/latitud|norte/i);await page.locator('#solarClose').click();
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),legacy);
 // A rejected activation does not mutate legacy; explicit valid settings preserve its geometry.
 const geometryBefore=JSON.parse(legacy).rooms;
 if(viewport.width===1440){await page.locator('[data-view="3d"]').click();await page.waitForFunction(()=>!View3D.lifecycleMetrics.animating&&View3D.presentationInspect());await page.locator('[data-t="night"]').click();}
 await configure(page);
 await page.screenshot({path:path.join(OUT,name+'-configuration.png')});
 assert.equal(await page.locator('#solarDialog').evaluate(n=>n.scrollWidth<=n.clientWidth+1),true);
 await page.locator('#solarActivate').click();await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!View3D.lifecycleMetrics.animating&&View3D.solarInspect.result);
 const morning=await inspect(page);assert.ok(morning.result.aboveHorizon);assert.ok(morning.direction[0]>0);assert.ok(morning.lampIntensities.every(v=>v===0));assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.rooms),geometryBefore);
 await page.screenshot({path:path.join(OUT,name+'-morning.png')});
 const prior=await page.evaluate(()=>{View3D.setSolar(null);const light=View3D.presentationLight;View3D.setSolar(FloorPlanSolarUI.result);return light;});
 await page.locator('#solarEdit').click();await page.locator('#solarTime').fill('19:00');const afternoon=await inspect(page);assert.ok(afternoon.direction[0]<0);assert.notDeepEqual(afternoon.direction,morning.direction);
 await page.locator('#solarDate').fill('2026-12-21');assert.notEqual((await inspect(page)).result.altitudeDeg,afternoon.result.altitudeDeg);
 await page.locator('#solarNorthInput').fill('115');await page.locator('#solarSave').click();const rotated=await inspect(page);assert.equal(rotated.result.projectAzimuthDeg,(rotated.result.azimuthDeg+115)%360);
 await page.locator('#solarTime').fill('02:00');assert.equal((await inspect(page)).intensity,0);await page.locator('#solarDate').fill('2026-06-21');await page.locator('#solarTime').fill('14:00');await page.locator('#solarClose').click();
 await page.screenshot({path:path.join(OUT,name+'-solar.png')});
 const capture=await page.evaluate(()=>View3D.shot({download:false}).dataUrl);assert.ok(capture.length>10000);
 await page.locator('#solarPresentation').click();assert.equal((await inspect(page)).result,null);assert.deepEqual(await page.evaluate(()=>View3D.presentationLight),prior);assert.equal((await inspect(page)).lights,morning.lights);
 // UI persistence survives reload and standalone JSON import.
 const saved=await page.evaluate(()=>structuredClone(FloorPlanApp.project));assert.equal(saved.site.northOffsetDeg,115);
 await page.reload();await page.waitForFunction(()=>window.FloorPlanSolarUI&&window.View3D);assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.site),saved.site);
 await page.locator('#fileIn').setInputFiles({name:'solar-project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await page.waitForFunction(()=>FloorPlanApp.project.site?.northOffsetDeg===115);assert.equal(await page.evaluate(()=>FloorPlanSolarUI.mode),'presentation');
 await page.evaluate(()=>FloorPlanSolarUI.open());await page.locator('#solarNorthInput').fill('');await page.locator('#solarSave').click();assert.equal(await page.evaluate(()=>FloorPlanApp.project.site.northOffsetDeg),undefined);assert.equal(await page.evaluate(()=>FloorPlanSolarUI.result.reason),'north');await page.locator('#solarClose').click();
 assert.deepEqual(errors,[]);
});

test('shared building north/location, level switch, building JSON and presentation light isolation',{timeout:240000},async t=>{
 const {page,errors}=await setup(t,{width:1440,height:900}),p=Core.initial();p.sourceImages=[];let building=B.create(p,{name:'Casa solar'});const upper=Core.initial();upper.id=Core.id('prj');upper.sourceImages=[];building=B.addLevel(building,upper);
 await page.locator('#fileIn').setInputFiles({name:'solar-building.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(building))});await page.waitForFunction(()=>FloorPlanApp.levelContext?.levels===2);
 await configure(page);await page.locator('#solarActivate').click();await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!View3D.lifecycleMetrics.animating&&View3D.solarInspect.result);
 const first=await inspect(page);const next=await page.evaluate(()=>FloorPlanBuildingUI.presentationSources().levels[1].levelId);await page.evaluate(id=>FloorPlanBuildingUI.selectLevel(id),next);await page.waitForFunction(()=>!View3D.lifecycleMetrics.flying);assert.deepEqual((await inspect(page)).result,first.result);
 const exported=await page.evaluate(()=>{const e=JSON.parse(localStorage.getItem('rubik-sota-project-library-v1'));return e.entries.find(x=>x.id===e.activeId).building;});assert.equal(exported.schemaVersion,'1.1.0');assert.equal(exported.site.northOffsetDeg,25);assert.equal(exported.levels[1].project.site,undefined);
 await page.locator('#fileIn').setInputFiles({name:'again.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await page.waitForFunction(()=>FloorPlanBuildingUI.site?.northOffsetDeg===25);
 await page.locator('#solarOpen3d').click();await page.locator('#solarActivate').click();await page.waitForFunction(()=>View3D.solarInspect.result&&!View3D.lifecycleMetrics.animating);
 const solar=await inspect(page);await page.locator('#presentationBtn').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 assert.equal((await inspect(page)).result,null);await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&View3D.solarInspect.result);assert.deepEqual((await inspect(page)).result,solar.result);
 await page.screenshot({path:path.join(OUT,'building-solar-restored.png')});assert.deepEqual(errors,[]);
});

test('solar labels, privacy and status are localized in English and Chinese',{timeout:60000},async t=>{
 const {page,errors}=await setup(t,{width:390,height:844});
 await page.locator('#langBtn').click();await page.locator('#solarNorth').click();assert.match(await page.locator('#solarDialog').innerText(),/Orientation and solar/);assert.match(await page.locator('#solarDialog').innerText(),/Editable JSON\/ZIP/);assert.doesNotMatch(await page.locator('#solarDialog').innerText(),/not-configured|user-entered/);
 await page.locator('#solarClose').click();await page.locator('#langBtn').click();await page.locator('#solarNorth').click();assert.match(await page.locator('#solarDialog').innerText(),/朝向与日照/);assert.match(await page.locator('#solarDialog').innerText(),/不构成/);await page.locator('#solarClose').press('Escape');assert.equal(await page.locator('#solarDialog').evaluate(d=>d.open),false);assert.deepEqual(errors,[]);
});
