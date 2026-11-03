const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{createServer}=require('node:http');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile),{chromium}=require('playwright');
const fixture=require('./fixtures/vq01-material-ab-fixture.json');
let server,url,browser;const cache=new Map(),QA=process.env.VQ01_ARTIFACTS||'qa-results/vq01-cp1-a';
const hash=value=>crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');

before(async()=>{
 const root=path.resolve(__dirname,'..');
 server=createServer(async(req,res)=>{try{
  const pathname=req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname,file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep))throw Error('path');
  res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':'text/html');
  res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));url=`http://127.0.0.1:${server.address().port}/`;
 const launch={args:['--no-sandbox','--enable-unsafe-swiftshader']};if(process.env.CHROME)launch.executablePath=process.env.CHROME;
 browser=await chromium.launch(launch);await fs.mkdir(QA,{recursive:true});
});
after(async()=>{await browser?.close();await new Promise(resolve=>server?.close(resolve));});

async function newPage(){
 const {width,height,deviceScaleFactor}=fixture.viewport,context=await browser.newContext({viewport:{width,height},deviceScaleFactor});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(`pageerror:${e.message}`));page.on('console',m=>{if(m.type()==='error')errors.push(`console:${m.text()}`);});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();if(!cache.has(target))cache.set(target,require('./helpers/three-module.cjs')(target,()=>run('curl',['--fail','--silent','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout)));await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await cache.get(target)});});
 await page.goto(url);await page.waitForFunction(()=>window.View3D&&window.FloorPlanPresentation&&window.FloorPlanSurfaces&&FloorPlanSurfaces.entries.length===50,null,{timeout:15000});
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open))await page.locator('#welcomeActionInput').press('Escape');
 await page.evaluate(()=>document.querySelector('#guideDetails').click());await page.evaluate(()=>document.querySelector('#guideAllTools').click());await require('./layout-fixture.cjs')(page);
 return{context,page,errors};
}
async function materialProject(page){return page.evaluate(assignments=>{let p=structuredClone(FloorPlanApp.project);for(const a of assignments){const entry=FloorPlanSurfaces.get(a.surfaceId);if(!entry)throw Error(`missing surface ${a.surfaceId}`);const target=(a.kind==='floor'?p.rooms:p.walls)[a.targetIndex];if(!target)throw Error(`missing ${a.kind}[${a.targetIndex}]`);p=FloorPlanSurfaces.apply(p,entry,{kind:a.kind,id:target.id});}return p;},fixture.assignments);}
async function startPresentation(page,errors){
 await page.locator('#presentationBtn').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:30000});
 const ids=fixture.assignments.map(a=>a.surfaceId);
 try{await page.waitForFunction(({q,ids})=>{const picked=View3D.surfaceMetrics.filter(m=>ids.includes(m.id));return View3D.surfaceQuality===q&&picked.length===ids.length&&picked.every(m=>m.state==='ready'&&(m.detailState==='ready'||m.detailState==='off'));},{q:fixture.presentation.surfaceQuality,ids},{timeout:30000});}
 catch(error){const diagnostic=await page.evaluate(()=>({quality:View3D.surfaceQuality,metrics:View3D.surfaceMetrics,light:View3D.presentationLight,lifecycle:View3D.lifecycleMetrics,status:document.querySelector('.presentation-status')?.textContent,moving:document.querySelector('#presentationOverlay')?.dataset.moving}));await fs.writeFile(path.join(QA,'readiness-timeout.json'),JSON.stringify({diagnostic,errors},null,2)+'\n');throw error;}
 await require('./layout-fixture.cjs')(page);
}
async function snapshot(page){return page.evaluate(projectSha=>{
 const stage=document.querySelector('#stage'),canvas=document.querySelector('#view3d canvas'),sr=stage.getBoundingClientRect(),cr=canvas.getBoundingClientRect(),current=FloorPlanPresentation.current||null,inspect=View3D.presentationInspect();const ids=new Set(['surface-oak-wood-planks','surface-marble-01']);
 return{projectSha256:projectSha,viewport:{width:innerWidth,height:innerHeight,devicePixelRatio},stage:{width:sr.width,height:sr.height},canvas:{cssWidth:cr.width,cssHeight:cr.height,width:View3D.canvasState.width,height:View3D.canvasState.height,pixelRatio:View3D.canvasState.pixelRatio},presentation:{active:FloorPlanPresentation.active,current:current?{kind:current.kind||null,roomId:current.roomId||null,levelId:current.levelId??null}:null,status:document.querySelector('.presentation-status')?.textContent||'',moving:document.querySelector('#presentationOverlay')?.dataset.moving||null},camera:{position:inspect.position,quaternion:inspect.quaternion,target:inspect.target,fov:inspect.fov,aspect:inspect.aspect},viewOptions:inspect.options,light:View3D.presentationLight,environment3D:View3D.environment3D??null,surfaceQuality:View3D.surfaceQuality,surfaces:View3D.surfaceMetrics.filter(m=>ids.has(m.id)).map(m=>({id:m.id,state:m.state,detailState:m.detailState,bytes:m.bytes||0,gpuBytes:m.gpuBytes||0,map:m.map?{repeat:m.map.repeat,colorSpace:m.map.colorSpace}:null,normalMap:m.normalMap?{repeat:m.normalMap.repeat,colorSpace:m.normalMap.colorSpace}:null,roughnessMap:m.roughnessMap?{repeat:m.roughnessMap.repeat,colorSpace:m.roughnessMap.colorSpace}:null,error:m.error||null,detailError:m.detailError||null})).sort((a,b)=>a.id.localeCompare(b.id)),projectBindings:FloorPlanApp.project.materials.filter(m=>m.appearance?.preset?.startsWith('surface-')).map(m=>({id:m.id,category:m.category,preset:m.appearance.preset,repeatMm:m.appearance.repeatMm})).sort((a,b)=>a.preset.localeCompare(b.preset)),lifecycle:View3D.lifecycleMetrics};
 },fixture.projectSha256);}
function near(actual,expected,label,epsilon=1e-10){assert.equal(actual.length,expected.length,label);for(let i=0;i<actual.length;i++)assert.ok(Math.abs(actual[i]-expected[i])<=epsilon,`${label}[${i}] ${actual[i]} != ${expected[i]}`);}
function assertExpected(s){
 assert.equal(s.projectSha256,fixture.projectSha256);assert.deepEqual(s.viewport,{width:fixture.viewport.width,height:fixture.viewport.height,devicePixelRatio:fixture.viewport.deviceScaleFactor});assert.deepEqual(s.stage,fixture.stage);assert.deepEqual(s.canvas,fixture.canvas);assert.deepEqual(s.presentation,{active:true,current:fixture.presentation.current,status:fixture.presentation.status,moving:fixture.presentation.moving});
 near(s.camera.position,fixture.camera.position,'camera.position');near(s.camera.quaternion,fixture.camera.quaternion,'camera.quaternion');near(s.camera.target,fixture.camera.target,'camera.target');assert.equal(s.camera.fov,fixture.camera.fov);assert.equal(s.camera.aspect,fixture.camera.aspect);
 assert.deepEqual(s.viewOptions,fixture.viewOptions);assert.deepEqual(s.light,fixture.light);assert.equal(s.environment3D,fixture.environment3D);assert.equal(s.surfaceQuality,fixture.presentation.surfaceQuality);assert.deepEqual(s.surfaces,fixture.surfaces);assert.deepEqual(s.projectBindings,fixture.projectBindings);assert.deepEqual(s.lifecycle,fixture.lifecycle);
}
async function reproduce(label){
 const {context,page,errors}=await newPage();try{const p=await materialProject(page),projectJson=JSON.stringify(p);assert.equal(hash(projectJson),fixture.projectSha256,`${label}: Project fixture drift`);await page.evaluate(project=>FloorPlanApp.importProject(project),p);assert.equal(hash(JSON.stringify(await page.evaluate(()=>FloorPlanApp.project))),fixture.projectSha256,`${label}: import changed Project identity`);await startPresentation(page,errors);const s=await snapshot(page);assertExpected(s);assert.deepEqual(errors,[],`${label}: browser errors`);await fs.writeFile(path.join(QA,`${label}-runtime.json`),JSON.stringify(s,null,2)+'\n');await page.screenshot({path:path.join(QA,`${label}-1440x900.png`)});return s;}finally{await context.close();}}

test('VQ-01 CP1-A reproduces canonical A twice without drift',{timeout:180000},async()=>{
 const a1=await reproduce('a1'),a2=await reproduce('a2'),c1={...a1,camera:null},c2={...a2,camera:null};assert.deepEqual(c2,c1,'fresh A runs differ outside camera');near(a2.camera.position,a1.camera.position,'A1/A2 camera.position');near(a2.camera.quaternion,a1.camera.quaternion,'A1/A2 camera.quaternion');near(a2.camera.target,a1.camera.target,'A1/A2 camera.target');assert.equal(a2.camera.fov,a1.camera.fov);assert.equal(a2.camera.aspect,a1.camera.aspect);
 await fs.writeFile(path.join(QA,'cp1-a-result.json'),JSON.stringify({result:'PASS',baselineSha:fixture.baselineSha,projectSha256:fixture.projectSha256,runs:2,fixtureStatus:fixture.status},null,2)+'\n');
});
