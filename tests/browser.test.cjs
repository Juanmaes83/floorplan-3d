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
    await page.waitForTimeout(100);assert.match(await page.locator('#toast').textContent(),/Import rejected|无法导入|Importación rechazada/);
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

// F1 completion tests: run with --test-name-pattern='F1 completion'.
test('F1 completion: local project UI, reload, isolation, confirmation and full import/export',async t=>{
 const {page,errors}=await pageFor(t);
 assert.equal(await page.locator('html').getAttribute('lang'),'es');assert.equal(await page.title(),'Rubik Sota Floor Plan Designer');
 assert.ok(!(await page.locator('#panel').textContent()).includes('¥'));
 await page.click('.item[data-key="0:0"]');await page.click('#projectsBtn');await page.fill('#projectName','<img src=x onerror=alert(1)>');await page.click('#projectRename');
 await page.fill('#projectName','Second');await page.click('#projectCreate');await page.click('#projectClose');assert.equal(await page.locator('#gFurn .furn').count(),46);
 await page.locator('#fileIn').setInputFiles({name:'example.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(example))});await page.waitForFunction(()=>FloorPlanApp.project.rooms.length===2);
 assert.deepEqual(JSON.parse((await readDownload(page,'#exportJson')).toString()),example);
 const snapshot=await page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),library:localStorage.getItem('rubik-sota-project-library-v1')}));
 const invalid=Core.clone(example);invalid.openings[0].wallId='wal_missing';
 await page.locator('#fileIn').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalid))});await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('rechazada'));
 assert.deepEqual(await page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),library:localStorage.getItem('rubik-sota-project-library-v1')})),snapshot);
 await page.reload();assert.equal(await page.locator('#gRooms polygon.room').count(),2);
 await page.click('#projectsBtn');await page.fill('#projectName','Copy');await page.click('#projectDuplicate');assert.equal(await page.locator('#projectList option').count(),3);
 const ids=await page.locator('#projectList option').evaluateAll(es=>es.map(e=>e.value));await page.selectOption('#projectList',ids[0]);await page.click('#projectOpen');assert.equal(await page.locator('#gFurn .furn').count(),47);
 await page.click('#projectsBtn');await page.selectOption('#projectList',ids[1]);page.once('dialog',d=>d.dismiss());await page.click('#projectDelete');assert.equal(await page.locator('#projectList option').count(),3);
 page.once('dialog',d=>d.accept());await page.click('#projectDelete');assert.equal(await page.locator('#projectList option').count(),2);await page.click('#projectClose');
 await page.reload();assert.equal(await page.locator('#gFurn .furn').count(),47);assert.equal(await page.locator('img').count(),0);assert.deepEqual(errors,[]);
});
const softwareModuleCache=new Map();
async function softwareModules(page,t){
 t.diagnostic('3D rendered by Chromium SwiftShader; official Three.js modules supplied via TLS-verified system curl. No physical mobile performance claim.');
 const cache=softwareModuleCache;await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async r=>{const target=r.request().url();if(!cache.has(target))cache.set(target,(await verifiedFetch('curl',['--fail','--silent','--show-error','--max-time','20',target],{maxBuffer:4*1024*1024})).stdout);await r.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:cache.get(target)});});
}
for(const viewport of [{width:390,height:844},{width:844,height:390}])test(`F1 completion: touch 2D/3D ${viewport.width}x${viewport.height}`,{timeout:90000},async t=>{
 const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});t.after(()=>context.close());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await softwareModules(page,t);await page.goto(url);await page.waitForFunction(()=>!!window.View3D);
 await page.locator('#tgLib').tap();await page.locator('.item[data-key="0:0"]').tap();assert.equal(await page.locator('#gFurn .furn').count(),47);
 await page.locator('#aRot').tap();assert.equal(await page.evaluate(()=>FloorPlanApp.project.objects.at(-1).rotationDeg),90);
 await page.screenshot({path:`/tmp/f1-mobile-${viewport.width}-2d.png`});
 await page.locator('[data-view="3d"]').tap();await page.waitForFunction(()=>document.querySelector('#stage').classList.contains('is3d')&&!document.body.classList.contains('busy'));
 assert.equal(await page.locator('aside.open').count(),0);
 const result=await page.evaluate(()=>{const canvas=document.querySelector('#view3d canvas'),r=canvas.getBoundingClientRect(),small=document.createElement('canvas');small.width=small.height=32;const c=small.getContext('2d');c.drawImage(canvas,0,0,32,32);return {ratio:r.height/innerHeight,width:r.width,overflow:document.documentElement.scrollWidth>innerWidth,colors:new Set(c.getImageData(0,0,32,32).data).size,same:View3D.renderedSource===FloorPlanApp.project};});
 t.diagnostic(JSON.stringify(result));assert.ok(result.ratio>=.6);assert.ok(result.width>300);assert.ok(result.colors>20);assert.equal(result.overflow,false);assert.equal(result.same,true);
 await page.screenshot({path:`/tmp/f1-mobile-${viewport.width}-3d.png`});
 const prior=await page.evaluate(()=>document.querySelector('#view3d canvas').toDataURL());
 const session=await context.newCDPSession(page),box=await page.locator('#view3d canvas').boundingBox(),x=box.x+box.width*.5,y=box.y+box.height*.3;
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=8;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*10,y}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(400);
 assert.notEqual(await page.evaluate(()=>document.querySelector('#view3d canvas').toDataURL()),prior);
 await page.screenshot({path:`/tmp/f1-mobile-${viewport.width}-orbit.png`});
 const rotated={width:viewport.height,height:viewport.width};await page.setViewportSize(rotated);await page.waitForTimeout(300);
 assert.ok(await page.evaluate(()=>document.querySelector('#view3d canvas').getBoundingClientRect().height/innerHeight>=.6));
 await page.setViewportSize(viewport);await page.waitForTimeout(300);
 await page.locator('#tgPanel').tap();assert.ok(await page.locator('#panel').isVisible());assert.ok(!(await page.locator('#panel').textContent()).includes('¥'));await page.locator('#tgPanel').tap();
 await page.locator('[data-view="2d"]').tap();await page.waitForFunction(()=>!document.querySelector('#stage').classList.contains('is3d')&&!document.body.classList.contains('busy'));assert.equal(await page.locator('#gFurn .furn').count(),47);assert.deepEqual(errors,[]);
});
test('F1 completion: no WebGL gives readable message and keeps 2D editable', {timeout:90000},async t=>{
 const context=await browser.newContext();t.after(()=>context.close());await context.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl'||type==='webgl2'||type==='experimental-webgl')return null;return get.call(this,type,...args);};});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await softwareModules(page,t);await page.goto(url);await page.waitForFunction(()=>!!window.View3D);await page.click('[data-view="3d"]');
 assert.match(await page.locator('#toast').textContent(),/Puedes seguir trabajando en 2D/);assert.equal(await page.evaluate(()=>document.body.classList.contains('busy')||document.body.classList.contains('m3d')),false);
 await page.click('.item[data-key="0:0"]');assert.equal(await page.locator('#gFurn .furn').count(),47);await page.click('#undo');assert.equal(await page.locator('#gFurn .furn').count(),46);assert.deepEqual(errors,[]);
});

test('F1 completion: collection adopts F1a migration and preserves both historical keys',async t=>{
 const legacy={furniture:[{id:'fold-001',type:'bed',name:'old',cx:1000,cy:1000,w:1500,d:2000,rot:0,color:'#c9d6df'}],rooms:{},demolished:['w29'],measures:[]};
 const {page,errors}=await pageFor(t,{},legacy);const initial=await page.evaluate(()=>({p:FloorPlanApp.project,legacy:localStorage.getItem('huxing-design-v1'),v1:localStorage.getItem('rubik-sota-floorplan-project-v1')}));
 await page.click('#projectsBtn');await page.fill('#projectName','Migrado');await page.click('#projectRename');await page.click('#projectClose');await page.reload();
 assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project),initial.p);
 assert.deepEqual(await page.evaluate(()=>({legacy:localStorage.getItem('huxing-design-v1'),v1:localStorage.getItem('rubik-sota-floorplan-project-v1')})),{legacy:initial.legacy,v1:initial.v1});assert.deepEqual(errors,[]);
});

async function traceTool(page,id){await page.locator('#traceBtn').click();await page.locator('#'+id).click();await page.waitForTimeout(350);}
async function imageTap(page,point){const screen=await page.evaluate(p=>{const image=FloorPlanApp.project.sourceImages[0],q=FloorPlanTracing.imageToWorld(image,p),svg=document.querySelector('#plan'),screen=new DOMPoint(q.x,q.y).matrixTransform(svg.getScreenCTM());return {x:screen.x,y:screen.y};},point);await page.touchscreen.tap(screen.x,screen.y);}
async function knownDistance(page,tool,a,b,value){await traceTool(page,tool);await imageTap(page,a);await imageTap(page,b);await page.locator('#traceKnown').fill(String(value));await page.locator('#traceDistanceSave').click();await page.waitForFunction(()=>!document.querySelector('#traceDistance').open);}
for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1440,height:900}])test(`F1b full workflow ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const context=await browser.newContext({viewport,isMobile:viewport.width<1100,hasTouch:true,acceptDownloads:true});t.after(()=>context.close());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await softwareModules(page,t);await page.goto(url);await page.waitForFunction(()=>!!window.View3D);
 const existing=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));await page.locator('#traceBtn').click();await page.locator('#traceNew').click();
 await page.locator('#traceImageFile').setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not an image')});await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('PNG'));assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),existing);
 await page.locator('#traceImageFile').setInputFiles(path.join(__dirname,'fixtures/manual-plan.png'));await page.waitForFunction(()=>FloorPlanApp.project.sourceImages?.length===1&&FloorPlanApp.project.walls.length===0);await page.waitForFunction(()=>document.querySelector('#gSource image'));
 assert.ok(!JSON.stringify(await page.evaluate(()=>FloorPlanApp.project)).includes('blob:'));assert.equal(await page.locator('#gSource image').count(),1);
 await knownDistance(page,'traceCalibrate',{x:50,y:50},{x:450,y:50},4000);
 await knownDistance(page,'traceVerify',{x:50,y:250},{x:450,y:250},4000);await page.locator('#traceConfirm').click();assert.equal(await page.evaluate(()=>FloorPlanApp.project.scale.confidence),'real');
 const corners=[{x:40,y:40},{x:440,y:40},{x:440,y:280},{x:40,y:280}];for(let i=0;i<4;i++){await traceTool(page,'traceWall');await imageTap(page,corners[i]);await imageTap(page,corners[(i+1)%4]);}
 assert.equal(await page.evaluate(()=>FloorPlanApp.project.walls.length),4);
 await traceTool(page,'traceDoor');await imageTap(page,{x:240,y:40});await traceTool(page,'traceWindow');await imageTap(page,{x:440,y:160});
 assert.equal(await page.evaluate(()=>FloorPlanApp.project.openings.length),2);
 await traceTool(page,'traceRoom');for(const corner of corners)await imageTap(page,corner);await page.locator('#traceBtn').click();await page.locator('#traceCloseRoom').click();assert.equal(await page.evaluate(()=>FloorPlanApp.project.rooms.length),1);
 await page.locator('#undo').click();assert.equal(await page.evaluate(()=>FloorPlanApp.project.rooms.length),0);await page.locator('#redo').click();assert.equal(await page.evaluate(()=>FloorPlanApp.project.rooms.length),1);
 assert.ok((await page.locator('#traceWarnings').textContent()).includes('W1'));
 assert.ok(await page.evaluate(()=>!!(document.querySelector('#gRooms').compareDocumentPosition(document.querySelector('#gSource'))&Node.DOCUMENT_POSITION_FOLLOWING)));
 const geometryBefore=await page.evaluate(()=>({walls:FloorPlanApp.project.walls,rooms:FloorPlanApp.project.rooms}));
 await knownDistance(page,'traceCalibrate',{x:50,y:50},{x:450,y:50},4000);assert.equal(await page.evaluate(()=>FloorPlanApp.project.scale.confidence),'estimated');assert.equal(await page.evaluate(()=>FloorPlanApp.project.scale.verification),undefined);
 await knownDistance(page,'traceVerify',{x:50,y:250},{x:450,y:250},4000);await page.locator('#traceConfirm').click();assert.deepEqual(await page.evaluate(()=>({walls:FloorPlanApp.project.walls,rooms:FloorPlanApp.project.rooms})),geometryBefore);
 await traceTool(page,'traceNavigate');if(viewport.width<1100)await page.locator('#tgLib').click();await page.locator('.item[data-key="0:0"]').click();
 const before=await page.evaluate(()=>FloorPlanApp.project.objects[0].position);await page.locator('#tgPanel').click();
 await page.evaluate(()=>document.querySelectorAll('aside').forEach(e=>e.classList.remove('open')));await page.waitForTimeout(350);
 const center=await page.evaluate(()=>{const f=FloorPlanApp.project.objects[0],svg=document.querySelector('#plan'),p=new DOMPoint(f.position.x,f.position.y).matrixTransform(svg.getScreenCTM());return {x:p.x,y:p.y};});
 await page.mouse.move(center.x,center.y);await page.mouse.down();await page.mouse.move(center.x+25,center.y+5,{steps:6});await page.mouse.up();assert.notDeepEqual(await page.evaluate(()=>FloorPlanApp.project.objects[0].position),before);
 await page.screenshot({path:`/tmp/f1b-${viewport.width}-2d.png`});
 await page.locator('[data-view="3d"]').click();await page.waitForFunction(()=>document.querySelector('#stage').classList.contains('is3d')&&!document.body.classList.contains('busy'));
 assert.ok(await page.evaluate(()=>View3D.renderedSource===FloorPlanApp.project&&View3D.renderedGeometry.source.walls.length===4));
 assert.ok(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');ctx.drawImage(document.querySelector('#view3d canvas'),0,0,64,64);return new Set(ctx.getImageData(0,0,64,64).data).size>20;}));
 const first3D=await page.evaluate(()=>document.querySelector('#view3d canvas').toDataURL());const canvasBox=await page.locator('#view3d canvas').boundingBox();await page.mouse.move(canvasBox.x+canvasBox.width*.5,canvasBox.y+canvasBox.height*.2);await page.mouse.down();await page.mouse.move(canvasBox.x+canvasBox.width*.5+80,canvasBox.y+canvasBox.height*.2+10,{steps:8});await page.mouse.up();await page.waitForTimeout(300);assert.notEqual(await page.evaluate(()=>document.querySelector('#view3d canvas').toDataURL()),first3D);
 await page.screenshot({path:`/tmp/f1b-${viewport.width}-3d-orbit.png`});
 if(viewport.width<1100)assert.ok(await page.evaluate(()=>document.querySelector('#view3d canvas').getBoundingClientRect().height/innerHeight>=.6));
 await page.locator('[data-view="2d"]').click();await page.waitForFunction(()=>!document.body.classList.contains('busy'));
 await page.locator('#traceBtn').click();const pending=page.waitForEvent('download');await page.locator('#traceExport').click();const dl=await pending,stream=await dl.createReadStream(),parts=[];for await(const c of stream)parts.push(c);const zip=Buffer.concat(parts);
 const original=await page.evaluate(()=>FloorPlanApp.project);
 const fresh=await browser.newContext({viewport,hasTouch:true});t.after(()=>fresh.close());const imported=await fresh.newPage();await imported.route('https://cdn.jsdelivr.net/**',r=>r.abort());await imported.goto(url);await imported.locator('#traceZipFile').setInputFiles({name:'project.zip',mimeType:'application/zip',buffer:zip});await imported.waitForFunction(()=>FloorPlanApp.project.sourceImages?.length===1&&FloorPlanApp.project.walls.length===4);await imported.waitForFunction(()=>document.querySelector('#gSource image'));
 const roundtrip=await imported.evaluate(()=>FloorPlanApp.project);assert.deepEqual(roundtrip.walls,original.walls);assert.deepEqual(roundtrip.rooms,original.rooms);assert.deepEqual(roundtrip.objects,original.objects);assert.deepEqual(roundtrip.scale,original.scale);assert.equal(roundtrip.sourceImages[0].sha256,original.sourceImages[0].sha256);
 const saved=await imported.evaluate(()=>localStorage.getItem('rubik-sota-project-library-v1'));await imported.locator('#traceZipFile').setInputFiles({name:'corrupt.zip',mimeType:'application/zip',buffer:Buffer.from('bad')});await imported.waitForFunction(()=>document.querySelector('#toast').textContent.includes('ZIP'));assert.equal(await imported.evaluate(()=>localStorage.getItem('rubik-sota-project-library-v1')),saved);
 await imported.reload();await imported.waitForFunction(()=>document.querySelector('#gSource image'));assert.equal(await imported.evaluate(()=>FloorPlanApp.project.objects.length),1);
 await imported.locator('#projectsBtn').click();imported.once('dialog',d=>d.accept());await imported.locator('#projectDelete').click();await imported.waitForFunction(async()=> (await FloorPlanImages.keys()).length===0);assert.equal(await imported.evaluate(()=>FloorPlanApp.project.sourceImages?.length||0),0);
 assert.deepEqual(errors,[]);
});
test('F1b storage/image editing and shared-reference deletion stay local and recoverable',async t=>{
 const {page,errors}=await pageFor(t);await page.locator('#traceBtn').click();await page.locator('#traceNew').click();
 const before=await page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),library:localStorage.getItem('rubik-sota-project-library-v1')}));
 await page.evaluate(()=>{window.savedSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='rubik-sota-project-library-v1')throw new DOMException('quota','QuotaExceededError');return savedSetItem.call(this,k,v);};});
 await page.locator('#traceImageFile').setInputFiles(path.join(__dirname,'fixtures/manual-plan.png'));await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('quota'));await page.waitForFunction(async()=> (await FloorPlanImages.keys()).length===0);
 assert.deepEqual(await page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),library:localStorage.getItem('rubik-sota-project-library-v1')})),before);
 await page.evaluate(()=>Storage.prototype.setItem=savedSetItem);
 await page.locator('#traceImageFile').setInputFiles(path.join(__dirname,'fixtures/manual-plan-exif6.jpg'));await page.waitForFunction(()=>FloorPlanApp.project.sourceImages?.length===1);await page.waitForFunction(()=>document.querySelector('#gSource image'));
 assert.equal(await page.evaluate(()=>FloorPlanApp.project.sourceImages[0].placement.rotationDeg),90);
 await page.locator('#traceOpacity').fill('.3');await page.locator('#traceOpacity').press('Tab');await page.locator('#traceImageX').fill('1000');await page.locator('#traceImageX').press('Tab');await page.locator('#traceVisible').uncheck();assert.equal(await page.locator('#gSource image').count(),0);
 await page.locator('#undo').click();await page.waitForFunction(()=>document.querySelector('#gSource image'));await page.reload();await page.waitForFunction(()=>document.querySelector('#gSource image'));assert.equal(await page.evaluate(()=>FloorPlanApp.project.sourceImages[0].placement.originMm.x),1000);assert.equal(await page.evaluate(()=>FloorPlanApp.project.sourceImages[0].opacity),.3);
 await page.locator('#projectsBtn').click();const originalEntry=await page.locator('#projectList').inputValue();await page.locator('#projectName').fill('Copy with image');await page.locator('#projectDuplicate').click();page.once('dialog',d=>d.accept());await page.locator('#projectDelete').click();await page.locator('#projectList').selectOption(originalEntry);await page.locator('#projectOpen').click();await page.waitForTimeout(100);assert.equal(await page.evaluate(async()=> (await FloorPlanImages.keys()).length),1);
 await page.locator('#traceBtn').click();page.once('dialog',d=>d.accept());await page.locator('#traceRemoveImage').click();await page.waitForFunction(async()=> (await FloorPlanImages.keys()).length===0);assert.equal(await page.evaluate(()=>FloorPlanApp.project.sourceImages.length),0);assert.deepEqual(errors,[]);
});
test('F1b rejects signature-valid but corrupt image payload without changing projects',async t=>{
 const {page,errors}=await pageFor(t);await page.locator('#traceBtn').click();await page.locator('#traceNew').click();const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));const bytes=await readFile(path.join(__dirname,'fixtures/manual-plan.png')),truncated=bytes.subarray(0,40);
 await page.locator('#traceImageFile').setInputFiles({name:'corrupt.png',mimeType:'image/png',buffer:truncated});await page.waitForFunction(()=>document.querySelector('#toast').textContent.length>0);assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before);assert.equal(await page.evaluate(async()=> (await FloorPlanImages.keys()).length),0);assert.deepEqual(errors,[]);
});
test('F1b geometry editor rejects invalid polygons atomically and preserves IDs through edits/history',async t=>{
 const {page,errors}=await pageFor(t);const sample=require('../docs/contracts/examples/floorplan-project-v1.f1b.example.json');await page.evaluate(p=>FloorPlanApp.importProject(p),sample);await page.locator('#traceBtn').click();
 const wall=sample.walls[2],room=sample.rooms[0];await page.locator('#traceWarnings button').filter({hasText:wall.id}).first().click();await page.locator('#traceEdit-start-x').fill('4300');await page.locator('#traceEditSave').click();
 assert.equal(await page.evaluate(id=>FloorPlanApp.project.walls.find(w=>w.id===id).start.x,wall.id),4300);await page.locator('#undo').click();assert.equal(await page.evaluate(id=>FloorPlanApp.project.walls.find(w=>w.id===id).start.x,wall.id),wall.start.x);await page.locator('#redo').click();assert.equal(await page.evaluate(id=>FloorPlanApp.project.walls.find(w=>w.id===id).start.x,wall.id),4300);
 await page.locator('#traceReviewed').click();assert.equal(await page.evaluate(id=>FloorPlanApp.project.walls.find(w=>w.id===id).source.review,wall.id),'confirmed');
 await page.locator('#traceWarnings button').filter({hasText:room.id}).first().click();const before=await page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),saved:localStorage.getItem('rubik-sota-project-library-v1')}));
 await page.locator('#traceEditPolygon').fill('0,0\n4000,4000\n0,4000\n4000,0');await page.locator('#traceEditSave').click();assert.deepEqual(await page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),saved:localStorage.getItem('rubik-sota-project-library-v1')})),before);assert.match(await page.locator('#toast').textContent(),/zero-area|self-intersection/);
 await page.locator('#traceWarnings button').filter({hasText:sample.walls[0].id}).first().click();page.once('dialog',d=>d.accept());await page.locator('#traceDeleteGeometry').click();assert.ok(await page.evaluate(id=>!FloorPlanApp.project.walls.some(w=>w.id===id)&&!FloorPlanApp.project.openings.some(o=>o.wallId===id),sample.walls[0].id));await page.locator('#undo').click();assert.equal(await page.evaluate(()=>FloorPlanApp.project.walls.length),4);assert.equal(await page.evaluate(()=>FloorPlanApp.project.openings.length),2);assert.deepEqual(errors,[]);
});

async function imageZip(page){const pending=page.waitForEvent('download');await page.locator('#traceExport').click();const stream=await (await pending).createReadStream(),parts=[];for await(const part of stream)parts.push(part);return Buffer.concat(parts);}
for(const viewport of [{width:360,height:800},{width:390,height:844},{width:844,height:390},{width:1440,height:900}])test(`image import clarity and complete WebP workflow ${viewport.width}x${viewport.height}`,async t=>{
 const {page,errors}=await pageFor(t,{viewport,hasTouch:true});const unexpected=[];page.on('request',r=>{if(!r.url().startsWith(url)&&!r.url().startsWith('blob:')&&!r.url().startsWith('https://cdn.jsdelivr.net/'))unexpected.push(r.url());});
 const original=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await page.locator('details.menu summary').tap();assert.equal(await page.locator('#importJson').textContent(),'Importar proyecto JSON');
 let pending=page.waitForEvent('filechooser');await page.locator('#importJson').tap();assert.equal(await (await pending).element().getAttribute('id'),'fileIn');
 await page.locator('details.menu summary').tap();pending=page.waitForEvent('filechooser');await page.locator('#importImage').tap();const chooser=await pending;assert.equal(await chooser.element().getAttribute('id'),'traceImageFile');
 const fixture=path.join(__dirname,'fixtures/manual-plan.webp'),bytes=await readFile(fixture);await chooser.setFiles({name:'sample.webp',mimeType:'',buffer:bytes});
 await page.waitForFunction(()=>FloorPlanApp.project.sourceImages?.[0]?.mediaType==='image/webp');await page.waitForFunction(()=>document.querySelector('#gSource image'));
 assert.equal(await page.evaluate(()=>FloorPlanApp.project.schemaVersion),'1.2.0');
 await knownDistance(page,'traceCalibrate',{x:50,y:50},{x:450,y:50},4000);await knownDistance(page,'traceVerify',{x:50,y:250},{x:450,y:250},4000);await page.locator('#traceConfirm').click();
 assert.equal(await page.evaluate(()=>FloorPlanApp.project.scale.confidence),'real');assert.equal(await page.evaluate(()=>FloorPlanApp.project.schemaVersion),'1.2.0');
 const project=await page.evaluate(()=>FloorPlanApp.project);assert.equal(await page.evaluate(value=>{const lib=JSON.parse(localStorage.getItem('rubik-sota-project-library-v1'));return JSON.stringify(lib).includes(value);},original),true);
 await page.reload();await page.waitForFunction(()=>document.querySelector('#gSource image'));assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project),project);
 await page.locator('#traceBtn').tap();const zip=await imageZip(page);
 const {page:fresh}=await pageFor(t,{viewport,hasTouch:true});await fresh.locator('#traceZipFile').setInputFiles({name:'project.zip',mimeType:'application/zip',buffer:zip});await fresh.waitForFunction(()=>FloorPlanApp.project.sourceImages?.[0]?.mediaType==='image/webp');await fresh.waitForFunction(()=>document.querySelector('#gSource image'));
 assert.deepEqual(await fresh.evaluate(()=>FloorPlanApp.project.scale),project.scale);
 const restored=await fresh.evaluate(async()=>{const im=FloorPlanApp.project.sourceImages[0];return Array.from(new Uint8Array(await (await FloorPlanImages.get(im.storage.ref)).arrayBuffer()));});assert.deepEqual(Buffer.from(restored),bytes);
 await fresh.reload();await fresh.waitForFunction(()=>document.querySelector('#gSource image'));assert.equal(await fresh.evaluate(()=>FloorPlanApp.project.scale.confidence),'real');
 await fresh.locator('details.menu summary').tap();assert.ok(await fresh.locator('#importImage').isVisible());await fresh.locator('#importImage').scrollIntoViewIfNeeded();
 assert.ok(await fresh.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const box=await fresh.locator('#importImage').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=viewport.width&&box.y>=0&&box.y+box.height<=viewport.height);
 await fresh.screenshot({path:`/tmp/image-import-${viewport.width}.png`});
 await fresh.locator('details.menu summary').tap();const beforeError=await fresh.evaluate(()=>JSON.stringify(FloorPlanApp.project));await fresh.locator('#traceImageFile').setInputFiles({name:'unsupported.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7')});await fresh.waitForFunction(()=>document.querySelector('#toast').textContent.includes('PDF no admitido'));await fresh.waitForTimeout(300);
 const message=await fresh.locator('#toast').boundingBox();assert.ok(message.x>=0&&message.x+message.width<=viewport.width&&message.y>=0&&message.y+message.height<=viewport.height);assert.ok(await fresh.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await fresh.evaluate(()=>JSON.stringify(FloorPlanApp.project)),beforeError);await fresh.screenshot({path:`/tmp/image-import-error-${viewport.width}.png`});
 assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);
});

test('image import accepts PNG, JPEG and lossy/alpha WebP with real decoding and ZIP restoration',async t=>{
 for(const name of ['manual-plan.png','manual-plan.jpg','manual-plan-lossy.webp','manual-plan-alpha.webp']){
  const {page,errors}=await pageFor(t,{hasTouch:true});await page.locator('details.menu summary').click();await page.locator('#importImage').click();await page.locator('#traceImageFile').setInputFiles(path.join(__dirname,'fixtures',name));await page.waitForFunction(()=>document.querySelector('#gSource image'));
  const im=await page.evaluate(()=>FloorPlanApp.project.sourceImages[0]);assert.equal(im.widthPx,480);assert.equal(im.heightPx,320);
  if(name.endsWith('.webp')){await knownDistance(page,'traceCalibrate',{x:50,y:50},{x:450,y:50},4000);await knownDistance(page,'traceVerify',{x:50,y:250},{x:450,y:250},4000);await page.locator('#traceConfirm').click();}
  const expectedScale=await page.evaluate(()=>FloorPlanApp.project.scale);
  const zip=await imageZip(page),{page:fresh}=await pageFor(t);await fresh.locator('#traceZipFile').setInputFiles({name:'project.zip',mimeType:'application/zip',buffer:zip});await fresh.waitForFunction(()=>document.querySelector('#gSource image'));
  assert.deepEqual(await fresh.evaluate(()=>FloorPlanApp.project.scale),expectedScale);await fresh.reload();await fresh.waitForFunction(()=>document.querySelector('#gSource image'));
  const original=await readFile(path.join(__dirname,'fixtures',name)),restored=await fresh.evaluate(async()=>Array.from(new Uint8Array(await (await FloorPlanImages.get(FloorPlanApp.project.sourceImages[0].storage.ref)).arrayBuffer())));assert.deepEqual(Buffer.from(restored),original);assert.deepEqual(errors,[]);
 }
});

test('image import failures preserve current project, collection and image keys atomically',async t=>{
 const {page,errors}=await pageFor(t);await page.locator('#traceBtn').click();await page.locator('#traceNew').click();await page.locator('#traceImageFile').setInputFiles(path.join(__dirname,'fixtures/manual-plan.webp'));await page.waitForFunction(()=>document.querySelector('#gSource image'));
 const snapshot=()=>page.evaluate(async()=>({project:JSON.stringify(FloorPlanApp.project),library:localStorage.getItem('rubik-sota-project-library-v1'),keys:await FloorPlanImages.keys()})),before=await snapshot();
 const png=await readFile(path.join(__dirname,'fixtures/manual-plan.png')),webp=await readFile(path.join(__dirname,'fixtures/manual-plan.webp')),large=Buffer.from(png);large.writeUInt32BE(8001,16);const corrupt=Buffer.from(webp);corrupt.fill(0,25);
 const cases=[{name:'fake.png',mimeType:'image/png',buffer:webp},{name:'fake.jpg',mimeType:'',buffer:png},{name:'truncated.webp',mimeType:'image/webp',buffer:webp.subarray(0,-1)},{name:'corrupt.webp',mimeType:'image/webp',buffer:corrupt},{name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(15*1024*1024+1)},{name:'huge.png',mimeType:'image/png',buffer:large},{name:'plan.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7')},{name:'plan.heic',mimeType:'',buffer:Buffer.alloc(30)}];
 for(const file of cases){await page.evaluate(()=>document.querySelector('#toast').textContent='');await page.locator('#traceImageFile').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#toast').textContent.length>0);assert.deepEqual(await snapshot(),before);}
 for(const failure of ['read','decode','store']){
  await page.evaluate(kind=>{document.querySelector('#toast').textContent='';if(kind==='read'){window.originalReader=File.prototype.arrayBuffer;File.prototype.arrayBuffer=async()=>{throw Error('read failure');};}if(kind==='decode'){window.originalDecoder=createImageBitmap;window.createImageBitmap=async()=>{throw Error('decode failure');};}if(kind==='store'){window.originalPut=FloorPlanImages.put;FloorPlanImages.put=async()=>{throw Error('No se pudo guardar la imagen.');};}},failure);
  await page.locator('#traceImageFile').setInputFiles({name:'valid.webp',mimeType:'image/webp',buffer:webp});await page.waitForFunction(()=>document.querySelector('#toast').textContent.length>0);assert.deepEqual(await snapshot(),before);
  await page.evaluate(kind=>{if(kind==='read')File.prototype.arrayBuffer=originalReader;if(kind==='decode')window.createImageBitmap=originalDecoder;if(kind==='store')FloorPlanImages.put=originalPut;},failure);
 }
 await page.locator('#fileIn').setInputFiles({name:'plan.png',mimeType:'image/png',buffer:png});assert.match(await page.locator('#toast').textContent(),/proyecto JSON/);assert.deepEqual(await snapshot(),before);
 const Package=require('../js/project-package.js'),badProject=JSON.parse(before.project),badZip=await Package.encode(badProject,async()=>new Blob([corrupt]));await page.evaluate(()=>document.querySelector('#toast').textContent='');await page.locator('#traceZipFile').setInputFiles({name:'corrupt-image.zip',mimeType:'application/zip',buffer:Buffer.from(await badZip.arrayBuffer())});await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('decodificar'));assert.deepEqual(await snapshot(),before);
 await page.locator('#traceZipFile').setInputFiles({name:'broken.zip',mimeType:'application/zip',buffer:Buffer.from('bad')});await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('ZIP'));assert.deepEqual(await snapshot(),before);assert.deepEqual(errors,[]);
});

test('image import labels and accessible help follow Spanish, English and Chinese',async t=>{
 const {page,errors}=await pageFor(t);
 for(const [language,jsonText,imageText,inputLabel]of [['es','Importar proyecto JSON','Cargar imagen de plano (PNG/JPG/WebP)','Imagen de plano PNG, JPG o WebP'],['en','Import project JSON','Load floor plan image (PNG/JPG/WebP)','Floor plan image PNG, JPG or WebP'],['zh','导入项目 JSON','加载平面图图片 (PNG/JPG/WebP)','平面图图片 PNG、JPG 或 WebP']]){
  assert.equal(await page.locator('html').getAttribute('lang'),language==='zh'?'zh-CN':language);
  await page.locator('details.menu summary').click();assert.equal(await page.locator('#importJson').textContent(),jsonText);assert.equal(await page.locator('#importImage').textContent(),imageText);assert.equal(await page.locator('#traceImageFile').getAttribute('aria-label'),inputLabel);
  assert.equal(await page.locator('#importImage').getAttribute('aria-describedby'),'importImageHelp');assert.match(await page.locator('#importImageHelp').textContent(),/15 MiB/);
  await page.locator('details.menu summary').click();await page.locator('#langBtn').click();
 }
 assert.deepEqual(errors,[]);
});

// F2: synthetic image only; strict request observation includes attempted/blocked traffic.
for(const viewport of [{width:360,height:800},{width:390,height:844},{width:844,height:390},{width:1440,height:900}])test(`F2 local wall assistance privacy/review ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const context=await browser.newContext({viewport,isMobile:viewport.width<1100,hasTouch:true,acceptDownloads:true,serviceWorkers:'block'});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],unexpected=[],requests=[];page.on('pageerror',e=>errors.push(e.message));
 const permitted=r=>{const u=new URL(r.url());return r.method()==='GET'&&!r.postDataBuffer()&&!u.search&&((u.origin===new URL(url).origin&&(/^\/js\/[a-z-]+\.js$/.test(u.pathname)||['/','/favicon.ico'].includes(u.pathname)))||(u.origin==='https://cdn.jsdelivr.net'&&u.pathname.startsWith('/npm/three@0.160.0/')));};
 page.on('request',r=>{if(r.url().startsWith('blob:'))return;requests.push({url:r.url(),method:r.method(),bodyBytes:r.postDataBuffer()?.length||0});if(!permitted(r))unexpected.push(r.url());});page.on('websocket',ws=>unexpected.push(ws.url()));
 await page.route('**/*',r=>permitted(r.request())?r.continue():r.abort());await softwareModules(page,t);await page.goto(url);await page.waitForFunction(()=>!!window.View3D);
 await page.locator('#traceBtn').click();await page.locator('#traceNew').click();await page.locator('#traceImageFile').setInputFiles(path.join(__dirname,'fixtures/manual-plan.png'));await page.waitForFunction(()=>FloorPlanApp.project.sourceImages?.length===1);await page.waitForFunction(()=>document.querySelector('#gSource image'));
 await knownDistance(page,'traceCalibrate',{x:50,y:50},{x:450,y:50},4000);await knownDistance(page,'traceVerify',{x:50,y:250},{x:450,y:250},4000);await page.locator('#traceConfirm').click();
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await page.locator('#assistAnalyze').click();await page.waitForFunction(()=>document.querySelectorAll('#assistCandidates button').length>=6);
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before);
 const count=await page.locator('#gAssist line').count();assert.ok(count>=2);
 assert.ok(await page.locator('#gAssist line').evaluateAll(lines=>lines.every(line=>line.getAttribute('stroke')==='#7c3aed'&&line.hasAttribute('stroke-dasharray'))));
 await page.locator('[id^="assistReject-"]').first().tap();assert.equal(await page.locator('#gAssist line').count(),count-1);assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before);
 await page.locator('[id^="assistCorrect-"]').first().click();await page.locator('#assist-startX').fill('123');await page.locator('#assistCorrectionCancel').click();assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before);
 assert.ok(await page.locator('[id^="assistAccept-"]').first().evaluate(b=>b.getBoundingClientRect().height>=44));
 const artifact=path.join(__dirname,`../docs/qa/artifacts/f2/${viewport.width}x${viewport.height}`);await page.screenshot({path:artifact+'-review.png'});
 // Keyboard activation on desktop, touch on mobile. Every acceptance is explicit.
 const accept=page.locator('[id^="assistAccept-"]').first();if(viewport.width===1440){await accept.focus();await accept.press('Enter');}else await accept.tap();
 const first=await page.evaluate(()=>FloorPlanApp.project.walls[0]);assert.deepEqual(first.source,{method:'suggested',review:'confirmed'});
 await page.locator('[id^="assistCorrect-"]').first().click();await page.locator('#assist-startX').fill('123');await page.locator('#assistCorrectionSave').click();await page.waitForFunction(()=>!document.querySelector('#assistCorrection').open);
 const second=await page.evaluate(()=>FloorPlanApp.project.walls[1]);assert.equal(second.start.x,123);assert.deepEqual(second.source,first.source);assert.notEqual(second.id,first.id);
 assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.scale),JSON.parse(before).scale);
 await page.locator('#assistCancel').click();assert.equal(await page.locator('#gAssist line').count(),0);assert.equal(await page.evaluate(()=>FloorPlanApp.project.walls.length),2);
 await page.locator('#undo').click();assert.equal(await page.evaluate(()=>FloorPlanApp.project.walls.length),1);await page.locator('#redo').click();assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.walls[1]),second);
 await page.reload();await page.waitForFunction(()=>document.querySelector('#gSource image'));assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.walls),[first,second]);assert.equal(await page.locator('#gAssist line').count(),0);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:artifact+'-2d.png'});
 await page.locator('[data-view="3d"]').click();await page.waitForFunction(()=>document.querySelector('#stage').classList.contains('is3d')&&!document.body.classList.contains('busy'));
 assert.ok(await page.evaluate(()=>View3D.renderedSource===FloorPlanApp.project&&View3D.renderedGeometry.source.walls.length===2));assert.ok(await page.evaluate(()=>document.querySelector('#view3d canvas').getBoundingClientRect().height/innerHeight>=.6));
 assert.ok(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d');ctx.drawImage(document.querySelector('#view3d canvas'),0,0,32,32);return new Set(ctx.getImageData(0,0,32,32).data).size>20;}));
 await page.screenshot({path:artifact+'-3d.png'});await page.locator('[data-view="2d"]').click();await page.waitForFunction(()=>!document.body.classList.contains('busy'));
 await page.locator('#traceBtn').click();const zip=await imageZip(page),Package=require('../js/project-package.js'),decoded=await Package.validateEntries(await Package.unzip(zip));assert.deepEqual(decoded.project.walls,[first,second]);
 assert.deepEqual(unexpected,[]);assert.ok(requests.length>0);assert.ok(requests.every(r=>r.method==='GET'&&r.bodyBytes===0));assert.deepEqual(errors,[]);
 t.diagnostic(JSON.stringify({viewport,requests:requests.length,unexpected:unexpected.length,wallIds:[first.id,second.id],candidateCount:count}));
});

test('F2 temporary proposals cancel safely, invalidate on reference change and preserve suggested origin during edits',async t=>{
 const {page,errors}=await pageFor(t,{hasTouch:true});await page.locator('#traceBtn').click();
 const initial=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));await page.locator('#assistAnalyze').click();await page.waitForFunction(()=>document.querySelector('#traceStatus').textContent.includes('Importa'));assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),initial);
 await page.locator('#traceNew').click();await page.locator('#traceImageFile').setInputFiles(path.join(__dirname,'fixtures/manual-plan.png'));await page.waitForFunction(()=>document.querySelector('#gSource image'));
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 // A missing local blob must leave analysis retryable, without disabling manual work.
 await page.evaluate(()=>{window.originalGet=FloorPlanImages.get;FloorPlanImages.get=async()=>null;});
 await page.locator('#assistAnalyze').click();await page.waitForFunction(()=>document.querySelector('#traceStatus').textContent.includes('Imagen local no disponible'));
 assert.equal(await page.locator('#assistAnalyze').isEnabled(),true);assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before);await page.evaluate(()=>FloorPlanImages.get=originalGet);
 await page.locator('#assistAnalyze').click();await page.waitForFunction(()=>document.querySelectorAll('#gAssist line').length>1);
 const Package=require('../js/project-package.js'),pendingZip=await Package.validateEntries(await Package.unzip(await imageZip(page)));assert.equal(pendingZip.project.walls.length,0);assert.ok(!JSON.stringify(pendingZip.project).includes('candidate_'));
 await page.locator('#assistCancel').click();assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before);assert.equal(await page.locator('#gAssist line').count(),0);
 // Cancel a genuinely in-flight IDB read; a late completion must not resurrect proposals.
 await page.evaluate(()=>{window.originalGet=FloorPlanImages.get;FloorPlanImages.get=async key=>{await new Promise(resolve=>window.releaseAssistRead=resolve);return originalGet(key);};});
 await page.locator('#assistAnalyze').click();await page.waitForFunction(()=>!!window.releaseAssistRead);await page.locator('#assistCancel').click();await page.evaluate(()=>{FloorPlanImages.get=originalGet;releaseAssistRead();});await page.waitForTimeout(150);assert.equal(await page.locator('#gAssist line').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before);
 await page.locator('#assistAnalyze').click();await page.waitForFunction(()=>document.querySelectorAll('#gAssist line').length>1);await page.locator('#traceImageX').fill('100');await page.locator('#traceImageX').press('Tab');assert.equal(await page.locator('#gAssist line').count(),0);
 await page.locator('#assistAnalyze').click();await page.waitForFunction(()=>document.querySelectorAll('#gAssist line').length>1);await page.locator('[id^="assistAccept-"]').first().click();const id=await page.evaluate(()=>FloorPlanApp.project.walls[0].id);
 await page.locator('#traceWarnings button').filter({hasText:id}).click();await page.locator('#traceEdit-start-x').fill('101');await page.locator('#traceEditSave').click();assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.walls[0].source),{method:'suggested',review:'unreviewed'});
 await page.locator('#traceReviewed').click();assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.walls[0].source),{method:'suggested',review:'confirmed'});assert.equal(await page.evaluate(()=>FloorPlanApp.project.walls[0].id),id);assert.match(await page.locator('#traceWarnings').textContent(),/Origen experimental sugerido/);
 // Manual tool stays accessible while assistance candidates exist.
 await traceTool(page,'traceWall');await imageTap(page,{x:50,y:120});await imageTap(page,{x:450,y:120});assert.equal(await page.evaluate(()=>FloorPlanApp.project.walls.length),2);assert.equal(await page.evaluate(()=>FloorPlanApp.project.walls[1].source.method),'manual');assert.deepEqual(errors,[]);
});

for(const viewport of [{width:360,height:800},{width:390,height:844},{width:844,height:390},{width:1440,height:900}])test(`F2 raw export private snapshot ${viewport.width}x${viewport.height}`,async t=>{
 const {page,errors}=await pageFor(t,{viewport,isMobile:viewport.width<1100,hasTouch:true});const unexpected=[],downloads=[];
 page.on('request',r=>{if(r.url().startsWith('blob:'))return;const u=new URL(r.url());if(r.method()!=='GET'||r.postDataBuffer()||u.search||!(u.origin===new URL(url).origin||u.origin==='https://cdn.jsdelivr.net'))unexpected.push(r.url());});page.on('websocket',s=>unexpected.push(s.url()));page.on('download',d=>downloads.push(d));
 await page.locator('#traceBtn').click();await page.locator('#traceNew').click();await page.locator('#traceImageFile').setInputFiles(path.join(__dirname,'fixtures/manual-plan.png'));await page.waitForFunction(()=>document.querySelector('#gSource image'));
 await page.locator('#assistAnalyze').click();await page.waitForFunction(()=>document.querySelectorAll('#gAssist line').length>1);assert.equal(await page.locator('#assistRawExport').isEnabled(),false);assert.match(await page.locator('#rawExportUnavailable').textContent(),/Calibra/);
 await knownDistance(page,'traceCalibrate',{x:50,y:50},{x:450,y:50},4000);
 // World placement is demonstrably rotated/displaced; raw export must remain image-aligned.
 await page.locator('#traceImageX').fill('1000');await page.locator('#traceImageX').press('Tab');await page.locator('#traceImageRotation').fill('30');await page.locator('#traceImageRotation').press('Tab');
 const bitmapRaw=await page.evaluate(async()=>{const im=FloorPlanApp.project.sourceImages[0],blob=await FloorPlanImages.get(im.storage.ref),bitmap=await createImageBitmap(blob),canvas=document.createElement('canvas');canvas.width=im.widthPx;canvas.height=im.heightPx;const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);bitmap.close();return FloorPlanWallAssist.detect(ctx.getImageData(0,0,canvas.width,canvas.height));});
 await page.locator('#assistAnalyze').click();await page.waitForFunction(()=>document.querySelector('#assistRawExport')&&!document.querySelector('#assistRawExport').disabled);
 const before=await page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),stored:JSON.stringify({...localStorage})}));
 await page.evaluate(()=>{window.rawStorageWrites=0;window.rawImageWrites=0;window.rawUrls=[];window.rawRevoked=[];const set=Storage.prototype.setItem;Storage.prototype.setItem=function(...args){rawStorageWrites++;return set.apply(this,args);};const put=FloorPlanImages.put;FloorPlanImages.put=(...args)=>{rawImageWrites++;return put(...args);};const create=URL.createObjectURL,revoke=URL.revokeObjectURL;URL.createObjectURL=b=>{const value=create(b);rawUrls.push(value);return value;};URL.revokeObjectURL=u=>{rawRevoked.push(u);return revoke(u);};});
 if(viewport.width===1440){await page.locator('#assistRawExport').focus();await page.locator('#assistRawExport').press('Enter');}else await page.locator('#assistRawExport').tap();
 await page.locator('#rawExportSave').click();assert.equal(await page.locator('#rawExportDialog form').evaluate(f=>f.checkValidity()),false);assert.equal(downloads.length,0);
 await page.locator('#rawExportCancel').click();assert.equal(downloads.length,0);assert.equal(await page.locator('#assistRawExport').isEnabled(),true);
 await page.locator('#assistRawExport').click();await page.fill('#raw-dataset_id','eval_001');await page.fill('#raw-case_id','case_001');await page.selectOption('#raw-type','digital');await page.selectOption('#raw-data_kind','synthetic');
 const screenshot=path.join(__dirname,`../docs/qa/artifacts/f2-raw-export/${viewport.width}x${viewport.height}.png`);await page.screenshot({path:screenshot});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok(await page.locator('#rawExportSave').evaluate(b=>b.getBoundingClientRect().height>=44));
 const pending=page.waitForEvent('download');if(viewport.width===1440){await page.locator('#rawExportSave').focus();await page.locator('#rawExportSave').press('Enter');}else await page.locator('#rawExportSave').tap();const downloaded=await pending,stream=await downloaded.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);const raw=JSON.parse(Buffer.concat(chunks));
 assert.equal(downloaded.suggestedFilename(),'sugerencias-crudas-evaluacion.json');assert.equal(raw.evaluation_record.coordinate_frame,'image-aligned-mm');assert.equal(raw.evaluation_record.units,'mm');const actualScale=JSON.parse(before.project).scale.calibration.mmPerPixel;assert.equal(raw.scale_applied.mm_per_pixel,actualScale);assert.ok(Math.abs(actualScale-10)<.00001);assert.equal(raw.evaluation_record.cases[0].references,null);
 const expected=bitmapRaw.map((c,n)=>({id:`seg_${String(n).padStart(3,'0')}`,start:{x:Math.round(c.start.x*actualScale),y:Math.round(c.start.y*actualScale)},end:{x:Math.round(c.end.x*actualScale),y:Math.round(c.end.y*actualScale)}}));assert.deepEqual(raw.evaluation_record.cases[0].predictions,expected);
 const actualWorld=await page.locator('#gAssist line').first().evaluate(l=>({x:Number(l.getAttribute('x1')),y:Number(l.getAttribute('y1'))}));assert.notDeepEqual(actualWorld,expected[0].start);
 const serialized=JSON.stringify(raw),projectId=JSON.parse(before.project).id;assert.ok(!serialized.includes(projectId));for(const forbidden of ['blob:','originalFileName','sourceImages','storage','EXIF','originMm','rotationDeg','img_','prj_'])assert.ok(!serialized.includes(forbidden),forbidden);
 assert.deepEqual(await page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),stored:JSON.stringify({...localStorage})})),before);await page.waitForTimeout(1100);assert.deepEqual(await page.evaluate(()=>({storage:rawStorageWrites,images:rawImageWrites,urls:rawUrls.every(u=>rawRevoked.includes(u))})),{storage:0,images:0,urls:true});
 // Actual browser download -> local converter -> existing evaluator, no reference fabrication.
 const {mkdtemp,writeFile,rm}=require('node:fs/promises'),os=require('node:os'),directory=await mkdtemp(path.join(os.tmpdir(),'raw-export-'));t.after(()=>rm(directory,{recursive:true,force:true}));const file=path.join(directory,'private.json');await writeFile(file,serialized);
 const converted=(await verifiedFetch('python3',[path.join(__dirname,'../scripts/f2-raw-export-to-evaluation.py'),file])).stdout;await writeFile(file,converted);const report=JSON.parse((await verifiedFetch('python3',[path.join(__dirname,'../scripts/f2-wall-evaluation.py'),file,'--tolerance-mm','5'])).stdout);assert.equal(report.cases[0].metrics,null);assert.deepEqual(report.cases[0].failures,['reference_missing']);assert.equal(report.f2_validated,false);
 await page.locator('[id^="assistReject-"]').first().click();assert.equal(await page.locator('#assistRawExport').isEnabled(),false);assert.deepEqual(await page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),stored:JSON.stringify({...localStorage})})),before);
 await page.locator('[id^="assistCorrect-"]').first().click();await page.fill('#assist-startX','123');await page.locator('#assistCorrectionSave').click();assert.equal(await page.locator('#assistRawExport').isEnabled(),false);assert.equal(await page.evaluate(()=>FloorPlanApp.project.walls[0].start.x),123);
 assert.deepEqual(raw.evaluation_record.cases[0].predictions,expected);assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);
});

test('F2 raw export invalidates pending download on reference, scale, image, project and review changes',async t=>{
 const {page,errors}=await pageFor(t,{hasTouch:true});await page.locator('#traceBtn').click();await page.locator('#traceNew').click();await page.locator('#traceImageFile').setInputFiles(path.join(__dirname,'fixtures/manual-plan.png'));await page.waitForFunction(()=>document.querySelector('#gSource image'));await knownDistance(page,'traceCalibrate',{x:50,y:50},{x:450,y:50},4000);
 async function prepare(){await page.locator('#traceBtn').click();await page.locator('#assistAnalyze').click();await page.waitForFunction(()=>document.querySelector('#assistRawExport')&&!document.querySelector('#assistRawExport').disabled);await page.locator('#assistRawExport').click();}
 async function stale(){assert.equal(await page.locator('#rawExportDialog').evaluate(d=>d.open),false);assert.equal(await page.locator('#gAssist line').count(),0);}
 await prepare();await page.evaluate(()=>{const p=FloorPlanCore.clone(FloorPlanApp.project);p.sourceImages[0].placement.originMm.x=500;FloorPlanApp.importProject(p);});await stale();
 await prepare();await page.evaluate(()=>{const p=FloorPlanCore.clone(FloorPlanApp.project);FloorPlanTracing.calibrate(p,p.sourceImages[0].id,{x:50,y:50},{x:450,y:50},8000);FloorPlanApp.importProject(p);});await stale();
 await prepare();await page.evaluate(()=>{const p=FloorPlanCore.clone(FloorPlanApp.project);p.sourceImages[0].id='img_different';p.scale={confidence:'pending',method:'none'};FloorPlanApp.importProject(p);});await stale();
 await page.locator('#traceBtn').click();await knownDistance(page,'traceCalibrate',{x:50,y:50},{x:450,y:50},4000);await prepare();await page.evaluate(()=>FloorPlanApp.importProject(FloorPlanTracing.blank()));await stale();
 assert.deepEqual(errors,[]);
});
