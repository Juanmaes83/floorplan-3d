const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const Core=require('../js/project-core.js'),Building=require('../js/building-core.js');
const root=path.resolve(__dirname,'..');let server,browser,url;
before(async()=>{
  server=createServer(async(req,res)=>{try{if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
  browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function importJson(page,value,name){
  await page.locator('#uploadIn').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(value))});
  await page.waitForFunction(([id,isBuilding])=>isBuilding?FloorPlanBuildingUI.context?.levels===2:FloorPlanApp.project.id===id,[value.id,!!value.levels],{timeout:30000});
}
const info=page=>page.evaluate(()=>({roof:View3D.roofInfo,exterior:View3D.exteriorVolumeInfo,camera:View3D.cameraState}));
test('Exterior remains reversible across Walk, Presentation, captures and two offset levels',{timeout:180000},async t=>{
  const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});t.after(()=>context.close());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text()+' @ '+m.location().url);});
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(url))errors.push(`HTTP ${r.status()} ${r.url()}`);});
  await page.goto(url);await page.waitForFunction(()=>window.FloorPlanApp&&window.View3D);
  await require('./editor-fixture.cjs')(page);
  const one=JSON.parse(await fs.readFile(path.join(root,'docs/contracts/examples/floorplan-project-v1.example.json'),'utf8'));
  await importJson(page,one,'one.json');
  await page.locator('[data-group="roof-parapet"] summary').click();
  await page.locator('#roofParapetEnabled').check();await page.locator('#roofParapetHeight').fill('875');await page.locator('#roofParapetSave').click();
  assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.roofParapet),{enabled:true,heightMm:875});
  assert.equal(await page.evaluate(()=>FloorPlanApp.project.schemaVersion),'1.8.0');
  await page.locator('#viewSeg [data-view="3d"]').click();
  await page.waitForFunction(()=>View3D.exteriorVolumeInfo.status==='available'&&View3D.cameraState);
  let state=await info(page);assert.equal(state.exterior.visible,false);assert.equal(state.exterior.volumes.length,1);assert.equal(state.exterior.parapets.length,4);
  await page.locator('#roofToggle').click();await page.waitForFunction(()=>View3D.exteriorVolumeInfo.visible);
  state=await info(page);assert.equal(state.roof.visible,true);assert.ok(state.camera.position.every(Number.isFinite));
  if(process.env.EXTERIOR_VOLUMES_SHOTS){await fs.mkdir(process.env.EXTERIOR_VOLUMES_SHOTS,{recursive:true});await page.waitForFunction(()=>!View3D.lifecycleMetrics.flying&&!View3D.lifecycleMetrics.animating);await page.screenshot({path:path.join(process.env.EXTERIOR_VOLUMES_SHOTS,'point-8b-b-one.png')});}
  assert.ok((await page.evaluate(()=>View3D.shot({download:false}).dataUrl)).startsWith('data:image/png;base64,'));
  assert.ok((await page.evaluate(()=>View3D.deliveryShot({width:640,height:360}).dataUrl)).startsWith('data:image/png;base64,'));
  await page.waitForFunction(()=>!View3D.lifecycleMetrics.animating);
  await page.locator('#modes3d [data-mode="walk"]').click();await page.waitForFunction(()=>View3D.walking()&&!View3D.exteriorVolumeInfo.visible);
  await page.locator('#modes3d [data-mode="orbit"]').click();await page.waitForFunction(()=>View3D.exteriorVolumeInfo.visible);
  await page.locator('#presentationBtn').click();await page.locator('#presentationConfig[open]').waitFor();
  await page.getByRole('button',{name:'Iniciar presentación'}).click();
  await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:90000});
  assert.equal((await info(page)).exterior.visible,false);
  await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&FloorPlanApp.viewMode==='3d',null,{timeout:60000});
  await page.waitForFunction(()=>View3D.exteriorVolumeInfo.visible);
  await page.locator('#roofToggle').click();assert.equal((await info(page)).exterior.visible,false);
  const two=JSON.parse(await fs.readFile(path.join(root,'docs/contracts/examples/floorplan-building-v1.example.json'),'utf8'));
  two.levels[0].project=Core.setRoofParapet(two.levels[0].project,{enabled:true,heightMm:600});
  two.levels[1].project=Core.setRoofParapet(two.levels[1].project,{enabled:true,heightMm:700});
  Building.validate(two);await importJson(page,two,'two.json');
  await page.locator('#viewSeg [data-view="3d"]').click();await page.locator('#levelViewAll').click();
  await page.waitForFunction(()=>View3D.exteriorVolumeInfo.status==='available'&&View3D.exteriorVolumeInfo.volumes.length===2);
  state=await info(page);assert.equal(state.exterior.visible,false);assert.equal(state.exterior.volumes[1].zBottomMm,two.levels[1].elevationMm);
  await page.locator('#roofToggle').click();await page.waitForFunction(()=>View3D.exteriorVolumeInfo.visible);
  state=await info(page);assert.ok(state.exterior.parapets.some(p=>p.levelId===two.levels[0].id));
  assert.ok(state.exterior.parapets.some(p=>p.levelId===two.levels[1].id));assert.ok(state.camera.position.every(Number.isFinite));
  if(process.env.EXTERIOR_VOLUMES_SHOTS){await page.waitForFunction(()=>!View3D.lifecycleMetrics.flying&&!View3D.lifecycleMetrics.animating);await page.screenshot({path:path.join(process.env.EXTERIOR_VOLUMES_SHOTS,'point-8b-b-two.png')});}
  assert.deepEqual(errors,[]);
});
