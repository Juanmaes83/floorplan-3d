// Presentation of a two-level building, end to end in Chromium at 1440×900, 390×844 and 844×390: rooms chosen per
// level, one presentation that changes level with its own overview, one ZIP batch whose manifest relates every view to
// its level and room, the editable building inside it, and the editor back on its level with the building unchanged.
// Also: equal room IDs and names on both levels, a building with a pending distribution (no presentation, no batch,
// no PNG by any path) and a single-level project whose plan and batch keep the format of `master`
// (PRESENTATION_BASE=<checkout of master> compares both live; without it the 1.x shape is checked alone).
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{execFile}=require('node:child_process'),{createHash}=require('node:crypto'),{chromium}=require('playwright');
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),Pres=require('../js/presentation-core.js');
const F=require('./fixtures/building-fixture.cjs'),Conflict=require('./fixtures/stair-conflict-building.cjs');
const root=path.resolve(__dirname,'..'),base=process.env.PRESENTATION_BASE&&path.resolve(process.env.PRESENTATION_BASE);
const KEY='rubik-sota-project-library-v1',shots=process.env.BUILDING_PRESENTATION_SHOTS||path.join(root,'docs/qa/artifacts/building-presentation');
const cache=new Map(),servers=[];let browser;
function serve(dir){return new Promise(resolve=>{const server=createServer(async(req,res)=>{try{const file=path.resolve(dir,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(dir+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':file.endsWith('.wasm')?'application/wasm':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});servers.push(server);server.listen(0,'127.0.0.1',()=>resolve(`http://127.0.0.1:${server.address().port}/`));});}
let url,baseUrl;
before(async()=>{url=await serve(root);if(base)baseUrl=await serve(base);browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(shots,{recursive:true});});
after(async()=>{await browser?.close();await Promise.all(servers.map(s=>new Promise(r=>s.close(r))));});
const curl=target=>new Promise((resolve,reject)=>execFile('curl',['--fail','--silent','--show-error','--max-time','30',target],{maxBuffer:20e6},(e,out)=>e?reject(e):resolve(out)));
async function setup(context,at=url){
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});
 page.on('requestfailed',r=>{if(!/cdn\.jsdelivr\.net/.test(r.url()))errors.push('requestfailed: '+r.url());});
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(at))errors.push(`HTTP ${r.status()}: ${r.url()}`);});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();let p=cache.get(target);if(!p){p=require('./helpers/three-module.cjs')(target,()=>curl(target));cache.set(target,p);}
  try{await route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await p});}catch{await route.abort();}});
 await page.goto(at);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D);await require('./editor-fixture.cjs')(page);return {page,errors};
}
const press=async(page,locator,mobile)=>{const l=typeof locator==='string'?page.locator(locator):locator;await l.scrollIntoViewIfNeeded();if(mobile)await l.tap();else await l.click();};
const digest=value=>createHash('sha256').update(typeof value==='string'?value:B.canonical(value)).digest('hex'),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function buildingZip(building,bytesFor=()=>null){const {entries}=await B.packageEntries(building,im=>bytesFor(im.id),T.imageInfo);return Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer());}
// Each import is a new library entry; wait for it to be the open entry with its two levels.
async function importBuilding(page,zip,name='edificio.zip'){const before=await page.evaluate(k=>JSON.parse(localStorage.getItem(k))?.activeId||null,KEY);
 await page.locator('#uploadIn').setInputFiles({name,mimeType:'application/zip',buffer:zip});
 await page.waitForFunction(([k,id])=>{const lib=JSON.parse(localStorage.getItem(k));return lib&&lib.activeId!==id&&lib.entries.find(e=>e.id===lib.activeId)?.kind==='building'&&FloorPlanBuildingUI.context?.levels===2;},[KEY,before],{timeout:60000});}
// The open entry as stored, the editor state and the active level: what the presentation must leave untouched.
const snapshot=page=>page.evaluate(k=>{const lib=JSON.parse(localStorage.getItem(k)),entry=lib.entries.find(e=>e.id===lib.activeId);
 return {entryId:lib.activeId,building:JSON.stringify(entry.building),activeLevelId:entry.activeLevelId,entries:lib.entries.length,undo:undoStack.length,redo:redoStack.length,view:FloorPlanApp.viewMode,level:FloorPlanBuildingUI.context?.levelId};},KEY);
const settled=page=>page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:90000});
const batchFile=name=>{if(name==='presentation.json'||name==='editable-building.zip'||name==='editable-project.zip'||/^views\/view-[0-9]{3}\.png$/.test(name))return name;throw Error('unexpected entry '+name);};
async function readBatch(zip){const files=await P.unzip(zip,{check:batchFile,required:'presentation.json',jsonNames:['presentation.json'],maxEntries:40});const manifest=JSON.parse(new TextDecoder().decode(files.get('presentation.json')));return {files,manifest,summary:Pres.readCaptures(manifest,[...files.keys()])};}
async function download(page,trigger,timeout=240000){const pending=page.waitForEvent('download',{timeout});pending.catch(()=>{});await trigger();const d=await pending,chunks=[];for await(const c of await d.createReadStream())chunks.push(c);return {name:d.suggestedFilename(),bytes:Buffer.concat(chunks)};}
async function inspectStop(page){return page.evaluate(()=>{const plan=FloorPlanPresentation.plan,on=document.querySelector('.presentation-stops button[aria-current="step"]'),r=e=>e?.getBoundingClientRect().toJSON();
 const card=document.querySelector('.presentation-card'),levelLine=document.querySelector('#presentationLevel');
 return {title:document.querySelector('.presentation-card h2').textContent,level:levelLine.textContent,levelHidden:levelLine.hidden,status:document.querySelector('.presentation-status').textContent,active:FloorPlanBuildingUI.context.levelId,
  active3d:View3D.levelInspect().levels.find(l=>l.active)?.id,current:on&&{text:on.textContent,level:on.dataset.level,label:on.getAttribute('aria-label')},
  headings:[...document.querySelectorAll('.presentation-stops-level')].map(e=>e.textContent),
  close:r(document.querySelector('#presentationClose')),title_:r(document.querySelector('.presentation-card h2')),card:r(card),levelBox:r(levelLine),currentBox:r(on),stopsBox:r(document.querySelector('.presentation-stops')),
  levelOnTop:(()=>{const b=levelLine.getBoundingClientRect(),hit=document.elementFromPoint(b.left+Math.min(20,b.width/2),b.top+b.height/2);return !!hit&&levelLine.contains(hit);})(),
  viewport:[innerWidth,innerHeight],hScroll:document.documentElement.scrollWidth>innerWidth+1,cardScroll:card.scrollTop,stops:plan.stops.length};});}
const inside=(box,[w,h])=>box&&box.left>=-1&&box.top>=-1&&box.right<=w+1&&box.bottom<=h+1;

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`two-level building: one presentation and one batch with both levels ${viewport.width}x${viewport.height}`,{timeout:900000},async t=>{
 const mobile=viewport.width<1000,size=`${viewport.width}x${viewport.height}`,metrics={viewport:size,steps:[]};
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,acceptDownloads:true});t.after(()=>context.close());
 const {page,errors}=await setup(context),fx=F.build();
 await importBuilding(page,await buildingZip(fx.building,fx.bytesFor));
 metrics.renderer=await page.evaluate(()=>{const g=document.createElement('canvas').getContext('webgl');const d=g?.getExtension('WEBGL_debug_renderer_info');return d?g.getParameter(d.UNMASKED_RENDERER_WEBGL):null;});
 const startLevel=(await snapshot(page)).level,original=await snapshot(page);
 const names=await page.evaluate(()=>FloorPlanBuildingUI.presentationSources().levels.map(l=>Object.fromEntries(l.project.rooms.map(r=>[r.name,r.id]))));

 // Configuration: one group per level, the first room of each level preselected; «Estar» is added.
 await press(page,'#presentationBtn',mobile);await page.locator('#presentationConfig[open]').waitFor();
 assert.match(await page.locator('#presentationLevelNote').textContent(),/^Presentación del edificio «Casa sintética de dos plantas»: las estancias elegidas de sus 2 plantas, en una sola presentación y un solo lote\. Cada planta empieza con su vista general; la escalera no se recorre\.$/);
 assert.deepEqual(await page.locator('.presentation-level-group legend').allTextContents(),['Planta baja','Planta primera']);
 assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.presentation-level-group')].map(g=>[...g.querySelectorAll('input')].map(i=>[i.parentElement.textContent,i.checked]))),[[['Cocina',true],['Estar',false]],[['Dormitorio',true]]]);
 await press(page,page.locator('.presentation-level-group').nth(0).locator('input').nth(1),mobile);
 await page.screenshot({path:path.join(shots,`${size}-01-config.png`)});
 const startButton=page.getByRole('button',{name:'Iniciar presentación'});await startButton.scrollIntoViewIfNeeded();assert.ok(inside(await startButton.boundingBox().then(b=>b&&{left:b.x,top:b.y,right:b.x+b.width,bottom:b.y+b.height}),[viewport.width,viewport.height]),'start button reachable');
 let t0=Date.now();await press(page,startButton,mobile);await settled(page);metrics.steps.push({step:'start',ms:Date.now()-t0});

 const plan=await page.evaluate(()=>FloorPlanPresentation.plan);
 const expected=[['lvl_fixture-ground','overview',null,'Vista general'],['lvl_fixture-ground','room',names[0].Cocina,'Cocina'],['lvl_fixture-ground','room',names[0].Estar,'Estar'],['lvl_fixture-upper','overview',null,'Vista general'],['lvl_fixture-upper','room',names[1].Dormitorio,'Dormitorio']];
 assert.deepEqual(plan.stops.map(s=>[s.levelId,s.kind,s.roomId,s.kind==='room'?s.label:'Vista general']),expected);
 for(let i=0;i<expected.length;i++){
  if(i>0){t0=Date.now();await press(page,page.locator('.presentation-stops button').nth(i),mobile);await settled(page);metrics.steps.push({step:`stop ${i+1}`,levelChange:expected[i][0]!==expected[i-1][0],ms:Date.now()-t0});}
  await page.waitForTimeout(250);
  const s=await inspectStop(page),[levelId,kind,,label]=expected[i],upper=levelId==='lvl_fixture-upper';
  assert.equal(s.title,label);assert.equal(s.status,`Vista ${i+1} de 5`);assert.equal(s.levelHidden,false);
  assert.equal(s.level,i===3?'Cambio de planta: «Planta primera» · planta 2 de 2':upper?'«Planta primera» · planta 2 de 2':'«Planta baja» · planta 1 de 2',`level line at stop ${i+1}`);
  assert.equal(s.active,levelId,'the active level is the level of the stop');assert.equal(s.active3d,levelId,'3D shows that level as active');
  assert.equal(s.current.level,levelId);assert.equal(s.current.label,`${label} · ${upper?'Planta primera':'Planta baja'}`);
  assert.deepEqual(s.headings,['Planta baja','Planta primera']);
  assert.ok(inside(s.close,s.viewport)&&inside(s.title_,s.viewport)&&inside(s.levelBox,s.viewport),`close, title and level visible at stop ${i+1}: ${JSON.stringify([s.close,s.title_,s.levelBox])}`);
  assert.equal(s.levelOnTop,true,`level line not covered at stop ${i+1}`);
  assert.ok(s.card.left>=-1&&s.card.right<=viewport.width+1,'card not cut horizontally');assert.equal(s.hScroll,false);
  assert.ok(s.currentBox.right>s.stopsBox.left&&s.currentBox.left<s.stopsBox.right,'current stop button scrolled into its row');
  await page.screenshot({path:path.join(shots,`${size}-0${i+2}-stop-${i+1}${kind==='overview'?'-overview':''}-${upper?'upper':'ground'}.png`)});
 }
 // One batch: five views of both levels and the editable building; the level of the last stop comes back.
 await page.waitForFunction(()=>!document.querySelector('#presentationBatch').disabled,null,{timeout:60000});
 t0=Date.now();const file=await download(page,()=>press(page,'#presentationBatch',mobile));metrics.steps.push({step:'batch',ms:Date.now()-t0,bytes:file.bytes.length});
 assert.equal(file.name,'presentacion-edificio.zip');
 const {files,manifest,summary}=await readBatch(file.bytes);
 assert.deepEqual(summary,{version:2,views:5,levels:['lvl_fixture-ground','lvl_fixture-upper'],byLevel:{'lvl_fixture-ground':3,'lvl_fixture-upper':2},portable:'editable-building.zip'});
 assert.deepEqual([...files.keys()].sort(),['editable-building.zip','presentation.json','views/view-001.png','views/view-002.png','views/view-003.png','views/view-004.png','views/view-005.png']);
 assert.equal(manifest.buildingId,'bld_fixture-house');assert.equal(manifest.entryId,original.entryId);
 assert.deepEqual(manifest.levels.map(l=>[l.levelId,l.name,l.order,l.projectId,l.elevationMm]),[['lvl_fixture-ground','Planta baja',0,'prj_fixture-ground',0],['lvl_fixture-upper','Planta primera',1,'prj_fixture-upper',3100]]);
 assert.deepEqual(manifest.views.map(v=>[v.levelId,v.kind,v.roomId,v.kind==='room'?v.label:'Vista general']),expected);
 assert.deepEqual(manifest.views.map(v=>v.levelName),['Planta baja','Planta baja','Planta baja','Planta primera','Planta primera']);
 for(const level of manifest.levels){assert.ok(Array.isArray(level.resources.models)&&Array.isArray(level.resources.surfaces),'resources per level');assert.equal(level.revision,plan.levels.find(l=>l.levelId===level.levelId).revision);}
 for(const view of manifest.views){const png=Buffer.from(files.get(view.filename));assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),view.width);assert.equal(png.readUInt32BE(20),view.height);
  assert.equal(sha(png),view.sha256);assert.ok(png.length>5000,`${view.filename} is a real image`);if(view.order===3||view.order===4)await fs.writeFile(path.join(shots,`${size}-batch-view-${view.order}.png`),png);}
 assert.equal(new Set(manifest.views.map(v=>v.sha256)).size,5,'five different images');
 const inner=Buffer.from(files.get('editable-building.zip'));assert.equal(manifest.portableBuilding.bytes,inner.length);assert.equal(manifest.portableBuilding.sha256,sha(inner));
 const reopened=await B.readEntries(await P.unzip(inner,{check:B.packagePath,required:'building.json',jsonNames:['building.json','manifest.json'],maxEntries:B.MAX_ENTRIES}),T.imageInfo);
 assert.equal(await B.sha256(B.canonical(reopened.building)),manifest.portableBuilding.buildingSha256);
 const stored=JSON.parse(original.building);
 for(const [i,level] of reopened.building.levels.entries())for(const key of ['rooms','walls','openings','objects'])assert.equal(digest(level.project[key]),digest(stored.levels[i].project[key]),`${key} of ${level.id} as in the stored building`);
 await page.waitForFunction(()=>!document.querySelector('#presentationOverlay').dataset.batch);
 const afterBatch=await inspectStop(page);assert.equal(afterBatch.active,'lvl_fixture-upper','the level of the current stop comes back after the batch');assert.equal(afterBatch.title,'Dormitorio');
 assert.match(await page.locator('#presentationBatchStatus').textContent(),/^5 vistas PNG \(Planta baja: 3 · Planta primera: 2\) y edificio editable descargados\.$/);
 await page.screenshot({path:path.join(shots,`${size}-07-after-batch.png`)});
 // The reopened building imports into the editor as a new entry with both levels.
 // Leaving: the editor is back on the level it started from, the stored building and entry are unchanged.
 await press(page,'#presentationClose',mobile);await page.waitForFunction(()=>!FloorPlanPresentation.active&&FloorPlanApp.viewMode==='2d',null,{timeout:60000});
 const final=await snapshot(page);assert.equal(final.level,startLevel);assert.deepEqual(final,original,'building, entry, active level, history and view unchanged');
 await importBuilding(page,inner,'editable-building.zip');const reimported=await snapshot(page);assert.equal(reimported.entries,original.entries+1);
 for(const [i,level] of JSON.parse(reimported.building).levels.entries())assert.equal(digest(level.project.rooms),digest(stored.levels[i].project.rooms),'the editable building reopens with the same rooms');
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(shots,`${size}-metrics.json`),JSON.stringify(metrics,null,1));
});

test('equal room IDs and names on both levels: distinct stops, buttons, views and files',{timeout:600000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});t.after(()=>context.close());
 const {page,errors}=await setup(context),fx=F.build(),ground=fx.building.levels[0].project,upper=fx.building.levels[1].project,shared=ground.rooms[0].id;
 for(const o of upper.objects)if(o.roomId===upper.rooms[0].id)o.roomId=shared;upper.rooms[0].id=shared;upper.rooms[0].name=ground.rooms[0].name;B.validate(fx.building);
 await importBuilding(page,await buildingZip(fx.building,fx.bytesFor));
 await page.locator('#presentationBtn').click();await page.locator('#presentationConfig[open]').waitFor();
 assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.presentation-level-group input:checked')].map(i=>[i.dataset.level,i.value,i.parentElement.textContent])),[['lvl_fixture-ground',shared,'Cocina'],['lvl_fixture-upper',shared,'Cocina']]);
 await page.getByRole('button',{name:'Iniciar presentación'}).click();await settled(page);
 assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.presentation-stops button')].map(b=>b.getAttribute('aria-label'))),['Vista general · Planta baja','Cocina · Planta baja','Vista general · Planta primera','Cocina · Planta primera']);
 await page.locator('.presentation-stops button').nth(3).click();await settled(page);assert.equal((await inspectStop(page)).active,'lvl_fixture-upper');
 await page.waitForFunction(()=>!document.querySelector('#presentationBatch').disabled,null,{timeout:60000});
 const {manifest,summary}=await readBatch((await download(page,()=>page.locator('#presentationBatch').click({timeout:120000}))).bytes);
 const rooms=manifest.views.filter(v=>v.kind==='room');
 assert.deepEqual(rooms.map(v=>[v.levelId,v.roomId,v.label,v.filename]),[['lvl_fixture-ground',shared,'Cocina','views/view-002.png'],['lvl_fixture-upper',shared,'Cocina','views/view-004.png']]);
 assert.notEqual(rooms[0].sha256,rooms[1].sha256,'two different images');assert.deepEqual(summary.byLevel,{'lvl_fixture-ground':2,'lvl_fixture-upper':2});
 assert.deepEqual(errors,[]);
});

test('pending distribution: no presentation, and no batch or PNG through any path',{timeout:600000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});t.after(()=>context.close());
 const {page,errors}=await setup(context),downloads=[];page.on('download',d=>downloads.push(d.suggestedFilename()));
 await importBuilding(page,await buildingZip(Conflict.build().building));
 assert.equal(await page.evaluate(()=>FloorPlanBuildingUI.status().state),'pending');
 await page.locator('#presentationBtn').click();await page.waitForTimeout(500);
 assert.equal(await page.locator('#presentationConfig[open]').count(),0,'configuration not opened');assert.equal(await page.evaluate(()=>FloorPlanPresentation.active),false);
 assert.match(await page.locator('#toast').textContent(),/^Presentar mi vivienda: la distribución está pendiente \(.+\)\. Corrígelo antes de presentarla como propuesta\.$/);
 // The gate shows what is missing (the conflicts dialog); closing it returns to the editor.
 assert.equal(await page.locator('#conflictsDialog[open]').count(),1,'the pending conflicts are listed');
 await page.keyboard.press('Escape');await page.locator('#conflictsDialog:not([open])').waitFor({state:'attached'});
 // A clear building whose state turns pending while presenting (simulated): batch and PNG refuse, with the reason.
 const fx=F.build();await importBuilding(page,await buildingZip(fx.building,fx.bytesFor));
 await page.locator('#presentationBtn').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();await settled(page);
 await page.waitForFunction(()=>!document.querySelector('#presentationBatch').disabled,null,{timeout:60000});
 await page.evaluate(()=>{window.__status=FloorPlanBuildingUI.status;FloorPlanBuildingUI.status=()=>({state:'pending',headline:'1 mueble sobre la escalera',conflicts:[{}],unevaluated:[]});});
 await page.locator('#presentationBatch').click();await page.waitForTimeout(1500);
 assert.match(await page.locator('#presentationBatchStatus').textContent(),/^No se exporta: la distribución está pendiente \(1 mueble sobre la escalera\)\. Corrígelo en el editor\.$/);
 assert.equal(await page.evaluate(()=>document.querySelector('#presentationOverlay').dataset.batch),undefined,'no batch started');
 await page.locator('#presentationCapture').click();await page.waitForTimeout(1500);
 assert.deepEqual(downloads,[],'nothing downloaded');
 await page.evaluate(()=>{FloorPlanBuildingUI.status=window.__status;});await page.locator('#presentationClose').click();
 await page.waitForFunction(()=>!FloorPlanPresentation.active,null,{timeout:60000});
 assert.deepEqual(errors,[]);
});

// Single-level project (the example): the plan and the batch keep the 1.x format. With PRESENTATION_BASE the same
// flow runs on that checkout and both summaries must be equal.
async function singleLevel(at,tag){
 const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
 try{
  const {page,errors}=await setup(context,at);
  await page.locator('#presentationBtn').click();await page.locator('#presentationConfig[open]').waitFor();
  const note=await page.locator('#presentationLevelNote').count(),groups=await page.locator('.presentation-level-group').count();
  await page.locator('.presentation-room-row').nth(1).locator('input').check();await page.getByRole('button',{name:'Iniciar presentación'}).click();await settled(page);
  const plan=await page.evaluate(()=>FloorPlanPresentation.plan);
  await page.waitForFunction(()=>!document.querySelector('#presentationBatch').disabled,null,{timeout:60000});
  // Software rendering keeps the main thread busy (≈2.5 s per evaluate on master and here): a longer click wait.
  const file=await download(page,()=>page.locator('#presentationBatch').click({timeout:120000})),files=await P.unzip(file.bytes,{check:batchFile,required:'presentation.json',jsonNames:['presentation.json'],maxEntries:40});
  const manifest=JSON.parse(new TextDecoder().decode(files.get('presentation.json')));
  await page.screenshot({path:path.join(shots,`single-level-${tag}.png`)});
  const round=v=>JSON.parse(JSON.stringify(v,(_,x)=>typeof x==='number'?Math.round(x*1e6)/1e6:x));
  return {errors,note,groups,name:file.name,files:[...files.keys()].sort(),plan:round({...plan,entryId:undefined}),
   manifest:{keys:Object.keys(manifest),version:manifest.version,format:manifest.format,views:manifest.views.map(({order,kind,roomId,label,filename,width,height,...rest})=>({order,kind,roomId,label,filename,width,height,keys:Object.keys(rest).sort()})),portable:Object.keys(manifest.portableProject).sort()},manifestRaw:manifest,files_:files};
 }finally{await context.close();}
}
test('single-level project: same plan and batch format as before',{timeout:600000},async()=>{
 const mine=await singleLevel(url,'branch');
 assert.deepEqual(mine.errors,[]);assert.equal(mine.note,0,'no building note');assert.equal(mine.groups,0,'no level groups');
 assert.equal(mine.name,'presentacion-estancias.zip');assert.deepEqual(mine.files,['editable-project.zip','presentation.json','views/view-001.png','views/view-002.png','views/view-003.png']);
 assert.equal(mine.plan.version,1);assert.equal(mine.plan.scope,undefined);assert.ok(mine.plan.stops.every(s=>!('levelId' in s)));
 assert.deepEqual(mine.manifest.keys,['format','version','viewRepresentation','projectId','entryId','revision','center','resources','views','portableProject']);
 assert.equal(Pres.readCaptures(mine.manifestRaw,[...mine.files_.keys()]).version,1);
 if(baseUrl){const theirs=await singleLevel(baseUrl,'base');assert.deepEqual(theirs.errors,[]);
  for(const key of ['note','groups','name','files','plan','manifest'])assert.deepEqual(mine[key],theirs[key],`${key} equal to PRESENTATION_BASE`);}
});
