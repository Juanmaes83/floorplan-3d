// BW5 in the editor at 1440×900, 390×844 and 844×390, with a building that is not the multi-level fixture
// (tests/fixtures/stair-conflict-building.cjs): JSON and ZIP import keep bytes and positions and show the warning;
// 2D highlight (dashed outline, hatch, «!» mark, accessible name); «Plantas…» list; the stair form lists the furniture
// before saving; layout review reports the same conflict; add/duplicate look for a free place and, when there is
// none, place the item and warn; dragging warns and never moves the item by itself. Captures go to STAIR_SHOTS.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),S=require('./fixtures/stair-conflict-building.cjs');
const root=path.resolve(__dirname,'..'),shots=process.env.STAIR_SHOTS||path.join(root,'docs/qa/artifacts/multilevel/stair-conflicts'),KEY='rubik-sota-project-library-v1';
let server,browser,url,tmp,original,pasoCenterX;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':file.endsWith('.wasm')?'application/wasm':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(shots,{recursive:true});
 tmp=await fs.mkdtemp(path.join(os.tmpdir(),'stair-conflicts-'));const built=S.build(),{building}=built;original=building;pasoCenterX=built.pasoCenterX;
 await fs.writeFile(path.join(tmp,'duplex.json'),JSON.stringify(building,null,2));
 const {entries}=await B.packageEntries(building,()=>null,T.imageInfo);await fs.writeFile(path.join(tmp,'duplex.zip'),Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const stored=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)).entries.filter(e=>e.kind==='building').map(e=>e.building),KEY);
const objectsOf=(b,i)=>b.levels[i].project.objects;

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`BW5 furniture over a stair ${viewport.width}x${viewport.height}`,{timeout:300000},async t=>{
 const mobile=viewport.width<1000,name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push('pageerror: '+e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});
 await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanBuildingUI);await require('./editor-fixture.cjs')(page);
 const tapOrClick=l=>mobile?l.tap():l.click();
 const closePanel=()=>page.evaluate(()=>{if(matchMedia('(max-width:1100px)').matches&&document.querySelector('aside.right')?.classList.contains('open'))document.querySelector('#tgPanel').click();});
 const level=async i=>{await tapOrClick(page.locator('#levelBar [data-level]').nth(i));await page.waitForFunction(o=>FloorPlanBuildingUI.context.order===o,i);await closePanel();await page.evaluate(()=>document.querySelector('#fit').click());};
 const shot=async step=>{await page.locator('#toast:not(.show)').waitFor({state:'attached',timeout:15000});await page.waitForTimeout(300);await page.screenshot({path:path.join(shots,`${name}-${step}.png`)});};

 // 1. JSON import of a building with two conflicts: opened as it is, positions and bytes preserved, BW5 shown.
 await page.locator('#fileIn').setInputFiles(path.join(tmp,'duplex.json'));await page.waitForFunction(()=>FloorPlanBuildingUI.context?.levels===2,null,{timeout:60000});
 let [b]=await stored(page);assert.equal(B.canonical(b),B.canonical(original),'imported JSON stored unchanged');
 await level(1);
 const note=page.locator('#levelConflicts');await note.waitFor();assert.match(await note.textContent(),/Aviso BW5 · «Armario» de «Alta» pisa el hueco de la escalera 1/);
 const mark=page.locator('#gStairs .level-conflict[data-object="obj_conflict-wardrobe"]');assert.equal(await mark.count(),1);
 assert.match(await mark.getAttribute('aria-label'),/pisa el hueco/);assert.equal(await mark.locator('.level-conflict-mark-text').textContent(),'!');
 assert.notEqual(await mark.locator('.level-conflict-outline').evaluate(e=>getComputedStyle(e).strokeDasharray),'none','dashed outline: not colour alone');
 assert.match(await mark.locator('.level-conflict-area').evaluate(e=>getComputedStyle(e).fill),/levelConflictHatch/);
 assert.equal(await page.locator('#gStairs .level-conflict[data-object="obj_conflict-desk"]').count(),0,'the clear desk is not marked');
 const rect=await page.evaluate(()=>{const r=e=>{const b=document.querySelector(e).getBoundingClientRect();return {l:b.left,t:b.top,r:b.right,b:b.bottom};};return {note:r('#levelConflicts'),bar:r('#levelBar'),vw:innerWidth,vh:innerHeight};});
 assert.ok(rect.note.r<=rect.vw+1&&rect.note.l>=0&&rect.note.b<=rect.vh,'warning note fits the viewport');
 await shot('01-upper-conflict');
 await level(0);assert.match(await note.textContent(),/«Zapatero» de «Baja» pisa la huella de la escalera 1/);assert.equal(await page.locator('#gStairs .level-conflict').count(),1);await shot('02-lower-conflict');

 // 2. «Plantas…»: both BW5 listed; the stair form lists the furniture before saving and updates while editing.
 await tapOrClick(page.locator('#levelsBtn'));await page.locator('#levelsDialog[open]').waitFor();
 assert.equal(await page.locator('#levelWarnings li[data-code="BW5"]').count(),2);
 const preview=page.locator('#stairConflictsPreview');await preview.scrollIntoViewIfNeeded();
 assert.match(await preview.textContent(),/Quedarían sobre la escalera \(BW5\): «Zapatero» en «Baja» \(350 mm\); «Armario» en «Alta» \(600 mm\)/);
 await shot('03-levels-dialog');
 await page.fill('#stairX','3300');assert.equal(await preview.textContent(),'Ningún mueble queda sobre la huella ni sobre el hueco.');
 await page.fill('#stairX',String(original.stairs[0].startMm.x));assert.equal(await preview.getAttribute('data-count'),'2');
 await tapOrClick(page.locator('#levelsClose'));[b]=await stored(page);assert.equal(B.canonical(b),B.canonical(original),'editing the form without saving changes nothing');

 // 3. Layout review: the same conflict, from the same computation.
 await level(1);await tapOrClick(page.locator('#traceBtn'));await page.locator('#layoutReview').waitFor();
 const finding=page.locator('#layoutReviewFindings button[data-code="escalera"]');assert.equal(await finding.count(),1);
 assert.match(await finding.textContent(),/Mueble sobre escalera \(BW5\) · obj_conflict-wardrobe \+ str_conflict-1: «Armario» de «Alta» pisa el hueco/);
 await finding.scrollIntoViewIfNeeded();await shot('04-layout-review');
 await page.evaluate(()=>{const d=document.querySelector('#traceDialog,#tracePanel');d?.close?.();});await page.keyboard.press('Escape');await closePanel();

 // 4. Adding where there is room nearby: the new item is placed clear of the void, no new warning.
 const conflictsOf=()=>page.evaluate(()=>FloorPlanBuildingUI.conflicts().map(c=>c.objectId));
 const add=(name,x,y,w,d)=>page.evaluate(([name,x,y,w,d])=>{addItem(['shelf',name,w,d,'#9a8f80',900],x,y);return FloorPlanApp.project.objects.at(-1).id;},[name,x,y,w,d]);
 const zone=B.stairZonesOf(original,original.levels[1])[0].polygon,zx=zone.map(p=>p.x),zy=zone.map(p=>p.y),mid={x:(Math.min(...zx)+Math.max(...zx))/2,y:(Math.min(...zy)+Math.max(...zy))/2};
 await add('Estantería',Math.round(mid.x-600),Math.round(mid.y),600,300);
 assert.deepEqual(await conflictsOf(),['obj_conflict-wardrobe'],'the shelf was moved to a free place');
 // 5. Duplicating the wardrobe: the copy also looks for a free place first.
 await page.evaluate(()=>{select({kind:'furn',id:'obj_conflict-wardrobe'});duplicateSel();});
 assert.deepEqual(await conflictsOf(),['obj_conflict-wardrobe'],'the duplicate landed clear of the void');
 // 6. No free place: the narrow «Paso» is filled by the stair, so the item stays where it was asked and BW5 appears.
 await level(0);const paso=pasoCenterX;
 const bench=await add('Banco',Math.round(paso),2200,900,400);
 assert.deepEqual((await conflictsOf()).sort(),[bench,'obj_conflict-shoes'].sort(),'placed anyway and warned');
 const placed=await page.evaluate(id=>FloorPlanApp.project.objects.find(o=>o.id===id).position,bench);assert.deepEqual(placed,{x:Math.round(paso/10)*10,y:2200},'kept at the requested point');
 assert.match(await page.locator('#levelConflicts').textContent(),/2 muebles pisan una escalera/);await shot('05-no-free-place');

 // 7. Dragging the clear desk of the upper level onto the void: warned, and left exactly where it was dropped.
 await level(1);const desk=page.locator('#gFurn [data-fid="obj_conflict-desk"]');
 const from=await desk.boundingBox(),to=await page.locator('#gStairs .level-stair-to .level-stair-outline').boundingBox();
 const start={x:from.x+from.width/2,y:from.y+from.height/2},end={x:to.x+to.width/2,y:to.y+to.height*0.75};
 await page.mouse.move(start.x,start.y);await page.mouse.down();for(let i=1;i<=8;i++)await page.mouse.move(start.x+(end.x-start.x)*i/8,start.y+(end.y-start.y)*i/8);await page.mouse.up();
 await page.waitForFunction(()=>FloorPlanBuildingUI.conflicts().some(c=>c.objectId==='obj_conflict-desk'),null,{timeout:10000});
 const dropped=await page.evaluate(()=>FloorPlanApp.project.objects.find(o=>o.id==='obj_conflict-desk').position);
 assert.ok(B.zoneConflict(T.footprint({position:dropped,size:{widthMm:1200,depthMm:700},rotationDeg:0}),zone),'the desk stays on the void: not moved back automatically');
 assert.match(await page.locator('#levelConflicts').textContent(),/muebles pisan una escalera/);await shot('06-drag-warning');

 // 8. ZIP import of the same building: a new entry, bytes and positions preserved, BW5 shown again.
 const known=(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).entries.map(e=>e.id),KEY));await page.locator('#uploadIn').setInputFiles(path.join(tmp,'duplex.zip'));
 await page.waitForFunction(n=>JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).entries.length===n+1,known.length,{timeout:60000});
 const imported=(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).entries,KEY)).find(e=>!known.includes(e.id)).building;assert.deepEqual(objectsOf(imported,0),objectsOf(original,0));assert.deepEqual(objectsOf(imported,1),objectsOf(original,1));
 assert.equal(B.warnings(imported).filter(w=>w.code==='BW5').length,2);await page.locator('#levelConflicts:not([hidden])').waitFor();
 assert.deepEqual(errors,[]);
});
