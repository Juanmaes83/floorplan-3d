const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');
const path=require('node:path');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const verifiedFetch=promisify(execFile);
const {chromium}=require('playwright');
const Core=require('../js/project-core.js');
const example=require('../docs/contracts/examples/floorplan-project-v1.example.json');
let server,browser,url;
before(async()=>{
  const root=path.resolve(__dirname,'..');
  server=createServer(async(req,res)=>{
    try{const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
      if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
      res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':'text/html');res.end(await readFile(file));
    }catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));url=`http://127.0.0.1:${server.address().port}/`;
  browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
});
after(async()=>{await browser?.close();await new Promise(resolve=>server?.close(resolve));});
async function pageFor(t,options={},legacy){
  const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true,...options});t.after(()=>context.close());
  if(legacy)await context.addInitScript(value=>localStorage.setItem('huxing-design-v1',JSON.stringify(value)),legacy);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);return {page,errors,context};
}
async function readDownload(page,selector){
  await page.locator('details.menu summary').click();const pending=page.waitForEvent('download');await page.click(selector);
  const dl=await pending,stream=await dl.createReadStream(),chunks=[];for await(const c of stream)chunks.push(c);return Buffer.concat(chunks);
}
test('2D reference drawing and actual edit/duplicate/history/persistence remain functional',async t=>{
  const {page,errors}=await pageFor(t);
  assert.equal(await page.locator('#gRooms polygon.room').count(),13);assert.equal(await page.locator('#gFurn .furn').count(),46);
  await page.screenshot({path:'/tmp/floorplan-f1a-2d.png'});
  await page.click('.item[data-key="0:0"]');await page.fill('#fW','1900');await page.locator('#fW').press('Tab');await page.click('#aRot');
  const edited=await page.evaluate(()=>{const p=FloorPlanApp.project;return p.objects.at(-1);});
  assert.equal(edited.size.widthMm,1900);assert.equal(edited.rotationDeg,90);
  await page.click('#aDup');assert.equal(await page.locator('#gFurn .furn').count(),48);
  await page.click('#undo');assert.equal(await page.locator('#gFurn .furn').count(),47);
  await page.click('#redo');assert.equal(await page.locator('#gFurn .furn').count(),48);
  await page.reload();assert.equal(await page.locator('#gFurn .furn').count(),48);assert.deepEqual(errors,[]);
});
test('actual file import and export preserve full F0 contract including optional data',async t=>{
  const {page,errors}=await pageFor(t);const candidate=Core.clone(example);candidate.extensions={'x-test':{preserve:'yes'}};candidate.materials[0].appearance.color='#aa2244';
  await page.locator('#fileIn').setInputFiles({name:'example.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(candidate))});
  await page.waitForFunction(()=>FloorPlanApp.project.rooms.length===2);
  assert.equal(await page.locator('#gRooms polygon.room').count(),2);assert.equal(await page.locator('#gFurn .furn').count(),3);
  assert.equal(await page.evaluate(()=>document.getElementById('m-mat_oak').querySelector('rect').getAttribute('fill')),'#ae2a54');
  const exported=JSON.parse((await readDownload(page,'#exportJson')).toString());assert.deepEqual(exported,candidate);
  assert.ok(await page.evaluate(()=>FloorPlanApp.geometry.source===FloorPlanApp.project&&FloorPlanApp.source2D===FloorPlanApp.project));
  const png=await readDownload(page,'#exportPng');assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),3200);
  assert.deepEqual(errors,[]);
});
test('room finishes, measurements/history and wall demolition update the canonical project',async t=>{
  const {page,errors}=await pageFor(t);
  await page.locator('#panel tr[data-room="rom_master"]').click();await page.fill('#rName','My room');await page.locator('#rName').press('Tab');
  await page.locator('#panel [data-mat="mat_carpet"]').click();
  assert.deepEqual(await page.evaluate(()=>{const r=FloorPlanApp.project.rooms.find(r=>r.id==='rom_master');return {name:r.name,material:r.floorMaterialId};}),{name:'My room',material:'mat_carpet'});
  await page.click('[data-tool="measure"]');const box=await page.locator('#plan').boundingBox();
  await page.mouse.click(box.x+box.width*.4,box.y+box.height*.4);await page.mouse.click(box.x+box.width*.6,box.y+box.height*.4);
  assert.equal(await page.evaluate(()=>FloorPlanApp.project.measurements.length),1);
  await page.click('#undo');assert.equal(await page.evaluate(()=>FloorPlanApp.project.measurements.length),0);
  await page.click('#redo');assert.equal(await page.evaluate(()=>FloorPlanApp.project.measurements.length),1);
  await page.click('[data-tool="demolish"]');const wall=page.locator('[data-wall="wal_ref-w29"]');
  await wall.dispatchEvent('pointerdown',{button:0,pointerId:1,clientX:500,clientY:500});
  assert.equal(await page.evaluate(()=>FloorPlanApp.project.walls.find(w=>w.id==='wal_ref-w29').status),'demolished');
  await wall.dispatchEvent('pointerdown',{button:0,pointerId:1,clientX:500,clientY:500});
  assert.equal(await page.evaluate(()=>FloorPlanApp.project.walls.find(w=>w.id==='wal_ref-w29').status),'existing');assert.deepEqual(errors,[]);
});
test('opening and exporting a project does not add absent optional fields',async t=>{
  const {page,errors}=await pageFor(t),candidate=Core.clone(example);
  candidate.scale={confidence:'estimated',method:'template'};
  delete candidate.measurements;delete candidate.sourceImages;delete candidate.app;
  await page.locator('#fileIn').setInputFiles({name:'minimal.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(candidate))});
  await page.waitForFunction(()=>FloorPlanApp.project.rooms.length===2);
  assert.deepEqual(JSON.parse((await readDownload(page,'#exportJson')).toString()),candidate);assert.deepEqual(errors,[]);
});
test('file handler rejects invalid inputs atomically with visible element-specific errors',async t=>{
  const {page,errors}=await pageFor(t);await page.click('.item[data-key="0:0"]');
  const before=await page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),saved:localStorage.getItem('rubik-sota-floorplan-project-v1'),html:document.querySelector('#plan').outerHTML}));
  const mutations=[()=>'{',p=>{p.schemaVersion='2.0.0';return p;},p=>{p.objects.push({...p.objects[0]});return p;},p=>{p.openings[0].wallId='wal_missing';return p;},p=>{p.objects[0].size.widthMm=-1;return p;},p=>{p.objects[0].id='obj_bad" onmouseover="window.auditExecuted=1';return p;}];
  for(const [i,change]of mutations.entries()){
    const value=change(Core.clone(example)),buffer=Buffer.from(typeof value==='string'?value:JSON.stringify(value));
    await page.locator('#fileIn').setInputFiles({name:`invalid-${i}.json`,mimeType:'application/json',buffer});
    await page.waitForTimeout(100);assert.match(await page.locator('#toast').textContent(),/Import rejected|无法导入/);
    const after=await page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),saved:localStorage.getItem('rubik-sota-floorplan-project-v1'),html:document.querySelector('#plan').outerHTML}));assert.deepEqual(after,before);
  }assert.deepEqual(errors,[]);
});
test('hostile names and material names stay text; ID/color payloads cannot create events',async t=>{
  const {page,errors}=await pageFor(t);const p=Core.clone(example),payload='"><img src=x onerror="window.auditExecuted=1">';
  p.objects[0].name=payload;p.rooms[0].name=payload;p.materials[0].name=payload;p.extensions={'x-test':{html:payload}};
  await page.locator('#fileIn').setInputFiles({name:'text.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});
  await page.waitForFunction(()=>FloorPlanApp.project.rooms.length===2);
  await page.locator('#gFurn [data-fid="obj_bed-01"]').dispatchEvent('pointerdown',{button:0,pointerId:1,clientX:400,clientY:400});
  assert.equal(await page.locator('#fName').inputValue(),payload);
  const state=await page.evaluate(()=>({executed:window.auditExecuted||0,images:document.querySelectorAll('img').length,events:document.querySelectorAll('[onerror],[onload],[onmouseover]').length}));assert.deepEqual(state,{executed:0,images:0,events:0});
  assert.deepEqual(JSON.parse((await readDownload(page,'#exportJson')).toString()),p);assert.deepEqual(errors,[]);
});
test('browser legacy migration is repeatable and keeps the original key',async t=>{
  const legacy={furniture:[{id:'fold-001',type:'bed',name:'old',cx:1000,cy:1000,w:1500,d:2000,rot:0,color:'#c9d6df'}],rooms:{},demolished:['w29'],measures:[]};
  const {page,errors}=await pageFor(t,{},legacy);const first=await page.evaluate(()=>({p:FloorPlanApp.project,old:localStorage.getItem('huxing-design-v1')}));
  assert.equal(first.p.objects[0].id,'obj_fold-001');assert.equal(first.p.walls.find(w=>w.id==='wal_ref-w29').status,'demolished');
  await page.reload();assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project),first.p);assert.equal(first.old,JSON.stringify(legacy));assert.deepEqual(errors,[]);
});
test('mobile touch placement and responsive 2D are usable in emulation',async t=>{
  const {page,errors}=await pageFor(t,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.locator('#tgLib').tap();await page.locator('.item[data-key="0:0"]').tap();assert.equal(await page.locator('#gFurn .furn').count(),47);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
});
test('3D renders the same project, follows imported geometry and returns to 2D', {timeout:90000}, async t=>{
  const context=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>context.close());const page=await context.newPage(),errors=[],failures=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure().errorText}));
  await page.goto(url);try{await page.waitForFunction(()=>!!window.View3D,null,{timeout:5000});}catch{
    const cdn=failures.filter(r=>r.url.startsWith('https://cdn.jsdelivr.net/'));
    if(cdn.length && cdn.every(r=>r.error==='net::ERR_CERT_AUTHORITY_INVALID')){
      // The system curl trusts the platform CA. Keep TLS verification enabled; never use -k.
      // This is a test transport only, not an application/CDN/network configuration change.
      t.diagnostic('Chromium direct CDN TLS rejected the platform CA. Testing rendering with modules fetched by system curl with TLS verification enabled.');
      let transportError;const cache=new Map();
      await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{
        try{const target=route.request().url();let body=cache.get(target);
          if(!body){body=(await verifiedFetch('curl',['--fail','--silent','--show-error','--max-time','20',target],{maxBuffer:4*1024*1024})).stdout;cache.set(target,body);}
          await route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body});
        }catch(e){transportError=e.message;await route.abort();}
      });
      failures.length=0;errors.length=0;await page.reload();
      try{await page.waitForFunction(()=>!!window.View3D,null,{timeout:30000});}catch{
        if(transportError){t.skip(`3D blocked: verified HTTPS transport failed: ${transportError}`);return;}throw Error(`3D module unavailable: ${errors}`);
      }
    }else if(cdn.length){t.skip(`3D blocked by CDN access: ${JSON.stringify(cdn)}`);return;}else throw Error(`3D module unavailable: ${errors}`);
  }
  await page.click('[data-view="3d"]');await page.waitForFunction(()=>document.querySelector('#stage').classList.contains('is3d')&&!document.body.classList.contains('busy'),null,{timeout:15000});
  const initial=await page.evaluate(()=>{const canvas=document.querySelector('#view3d canvas'),small=document.createElement('canvas');small.width=small.height=64;const ctx=small.getContext('2d');ctx.drawImage(canvas,0,0,64,64);return {same:View3D.renderedSource===FloorPlanApp.project&&FloorPlanApp.source2D===View3D.renderedSource,rooms:View3D.renderedGeometry.rooms.length,colors:new Set(ctx.getImageData(0,0,64,64).data).size};});
  assert.equal(initial.same,true);assert.equal(initial.rooms,13);assert.ok(initial.colors>20);
  await page.screenshot({path:'/tmp/floorplan-f1a-3d.png'});
  await page.evaluate(p=>FloorPlanApp.importProject(p),example);await page.waitForTimeout(200);
  assert.deepEqual(await page.evaluate(()=>({same:View3D.renderedSource===FloorPlanApp.project,rooms:View3D.renderedGeometry.rooms.length,wall:View3D.renderedGeometry.source.walls[0].id})),{same:true,rooms:2,wall:example.walls[0].id});
  const north=await page.evaluate(()=>View3D.wallMeshes.find(w=>w.id==='wal_ext-north'));
  assert.equal(north.dimensions.width,6);assert.equal(north.dimensions.height,2.6);assert.equal(north.dimensions.depth,.24);
  const diagonal=Core.clone(example);diagonal.walls[1].end.x=7000;
  await page.evaluate(p=>FloorPlanApp.importProject(p),diagonal);
  const east=await page.evaluate(()=>View3D.wallMeshes.find(w=>w.id==='wal_ext-east'));
  assert.ok(Math.abs(east.dimensions.width-Math.hypot(1,4))<1e-8);assert.ok(Math.abs(east.angle+Math.atan2(4,1))<1e-8);
  await page.click('[data-view="2d"]');await page.waitForFunction(()=>!document.querySelector('#stage').classList.contains('is3d')&&!document.body.classList.contains('busy'));assert.equal(await page.locator('#gRooms polygon.room').count(),2);assert.deepEqual(errors,[]);
});
