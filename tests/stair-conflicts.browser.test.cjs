// BW5 end to end at 1440×900, 390×844 and 844×390, from a clean browser context, with a conflicting building that is
// NOT the corrected multi-level fixture (tests/fixtures/stair-conflict-building.cjs): import ZIP → detect in 2D →
// 3D keeps the state and builds the same geometry → «Revisar» lists both levels → isolate in 3D and locate in 2D →
// presentation outputs refused, backups allowed → new conflicts refused (add, duplicate, drag) → manual correction →
// state clear in 2D and 3D → F5 → stair form preview and cancel. Captures (2D/3D, both levels, «Ver todas») go to
// STAIR_SHOTS; a second test checks that a duplicate in a single-level project keeps its offset when free and never overlaps (finding 12).
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http'),{execFile}=require('node:child_process'),{chromium}=require('playwright');
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),S=require('./fixtures/stair-conflict-building.cjs');
const root=path.resolve(__dirname,'..'),shots=process.env.STAIR_SHOTS||path.join(root,'docs/qa/artifacts/multilevel/stair-conflicts'),KEY='rubik-sota-project-library-v1';
let server,browser,url,tmp,original,zipBytes;const cache=new Map();
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':file.endsWith('.wasm')?'application/wasm':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(shots,{recursive:true});
 tmp=await fs.mkdtemp(path.join(os.tmpdir(),'stair-conflicts-'));original=S.build().building;
 const {entries}=await B.packageEntries(original,()=>null,T.imageInfo);zipBytes=Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer());await fs.writeFile(path.join(tmp,'duplex.zip'),zipBytes);
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const curl=target=>new Promise((resolve,reject)=>execFile('curl',['--fail','--silent','--show-error','--max-time','30',target],{maxBuffer:20e6},(e,out)=>e?reject(e):resolve(out)));
async function open(context){
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push('pageerror: '+e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();let p=cache.get(target);if(!p){p=require('./helpers/three-module.cjs')(target,()=>curl(target));cache.set(target,p);}
  try{await route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await p});}catch{await route.abort();}});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanBuildingUI&&window.View3D);await require('./editor-fixture.cjs')(page);return {page,errors};
}
const building=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)).entries.find(e=>e.kind==='building').building,KEY);
const status=page=>page.evaluate(()=>FloorPlanBuildingUI.status());
// Plan point (active level, mm) → client pixels, from the live 2D view.
const screen=(page,p)=>page.evaluate(p=>{const r=svg.getBoundingClientRect();return {x:r.left+(p.x-view.x0)*view.s,y:r.top+(p.y-view.y0)*view.s};},p);
async function drag(page,from,to){const a=await screen(page,from),b=await screen(page,to);await page.mouse.move(a.x,a.y);await page.mouse.down();for(let i=1;i<=10;i++)await page.mouse.move(a.x+(b.x-a.x)*i/10,a.y+(b.y-a.y)*i/10);await page.mouse.up();}

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`BW5 furniture over a stair, import to correction ${viewport.width}x${viewport.height}`,{timeout:900000},async t=>{
 const mobile=viewport.width<1000,name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,acceptDownloads:true});t.after(()=>context.close());
 const {page,errors}=await open(context);
 const tapOrClick=l=>mobile?l.tap():l.click();
 const closePanel=()=>page.evaluate(()=>{if(matchMedia('(max-width:1100px)').matches&&document.querySelector('aside.right')?.classList.contains('open'))document.querySelector('#tgPanel').click();});
 const level=async i=>{if((await page.evaluate(()=>FloorPlanBuildingUI.context.order))!==i){await tapOrClick(page.locator('#levelBar [data-level]').nth(i));await page.waitForFunction(o=>FloorPlanBuildingUI.context.order===o,i);}await closePanel();};
 const fit=()=>page.evaluate(()=>document.querySelector('#fit').click());
 const to=async mode=>{await page.evaluate(m=>setView(m),mode);await page.waitForFunction(m=>FloorPlanApp.viewMode===m,mode);await page.waitForTimeout(mode==='3d'?1500:300);};
 const shot=async step=>{await page.locator('#toast:not(.show)').waitFor({state:'attached',timeout:20000});await page.waitForTimeout(300);await page.screenshot({path:path.join(shots,`${name}-${step}.png`)});};
 const chip=page.locator('#levelConflicts');
 const chipClear=async()=>{const r=await page.evaluate(()=>{const c=document.querySelector('#levelConflicts').getBoundingClientRect(),hit=[...document.querySelectorAll('#gDims text,#scalebar,#viewSeg,#levelBar,#fab.show,#gSel > *')].map(e=>e.getBoundingClientRect()).filter(b=>b.width&&b.left<c.right&&c.left<b.right&&b.top<c.bottom&&c.top<b.bottom);return {c:{l:c.left,r:c.right,b:c.bottom},hit:hit.length,vw:innerWidth,vh:innerHeight};});
  assert.ok(r.c.l>=0&&r.c.r<=r.vw+1&&r.c.b<=r.vh+1,'chip inside the viewport');assert.equal(r.hit,0,'chip covers no dimension, scale bar or view/level control');};

 // 1. Import the ZIP in a clean context: kept as received (canonical content, IDs, positions); state pending.
 await page.locator('#uploadIn').setInputFiles(path.join(tmp,'duplex.zip'));await page.waitForFunction(()=>FloorPlanBuildingUI.context?.levels===2,null,{timeout:60000});
 assert.equal(B.canonical(await building(page)),B.canonical(original),'imported building unchanged');
 await level(0);await fit();await chip.waitFor();
 assert.match(await chip.textContent(),/2 conflictos en 2 plantas: distribución pendiente/);await chipClear();
 assert.equal(await page.locator('#gStairs .level-conflict[data-object="obj_conflict-sofa"]').count(),1);await shot('01-lower-2d-pending');
 await level(1);await fit();assert.equal(await page.locator('#gStairs .level-conflict[data-object="obj_conflict-bed"]').count(),1);await shot('02-upper-2d-pending');

 // 2. 3D: the state stays visible, and the geometry built in 3D is the one BW5 evaluates.
 await level(0);await to('3d');await chip.waitFor();assert.match(await chip.textContent(),/2 conflictos en 2 plantas/);
 const inspect=await page.evaluate(()=>View3D.levelInspect()),zone=B.stairZonesOf(original,original.levels[0])[0].polygon;
 for(const c of inspect.stairPlan[0].corners)assert.ok(zone.some(q=>Math.hypot(c.x-q.x,c.y-q.y)<=1),`3D stair corner ${JSON.stringify(c)} on the BW5 footprint`);
 const sofa=original.levels[0].project.objects.find(o=>o.id==='obj_conflict-sofa'),built=inspect.furniturePlan.find(f=>f.id==='obj_conflict-sofa');
 assert.ok(Math.abs(built.x-sofa.position.x)<=1&&Math.abs(built.y-sofa.position.y)<=1&&built.rotationDeg===sofa.rotationDeg,'3D sofa where BW5 sees it');
 await shot('03-lower-3d-pending');
 await page.evaluate(()=>{if(View3D.levelView!=='all')document.querySelector('#levelViewAll').click();});await page.waitForFunction(()=>View3D.levelView==='all');await page.waitForTimeout(800);await shot('04-all-3d-pending');

 // 3. «Revisar»: one list for the whole building, navigable by keyboard; isolate the upper level in 3D.
 await tapOrClick(page.locator('#levelConflictsOpen'));const dialog=page.locator('#conflictsDialog[open]');await dialog.waitFor();
 assert.deepEqual(await page.locator('#conflictsList li p').allTextContents(),['Planta baja: «Sofá» sobre los peldaños 1 · 800 mm (escala pendiente: medida nominal)','Planta primera: «Cama» sobre el hueco de la escalera 1 · 660 mm (escala estimada: medida nominal)']);
 assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'locate','focus on the first action');
 await shot('05-review-list');
 await tapOrClick(page.locator('#conflictsList li[data-object="obj_conflict-bed"] [data-action="isolate"]'));
 await page.waitForFunction(()=>View3D.levelView==='active'&&FloorPlanBuildingUI.context.order===1);await page.waitForTimeout(900);await shot('06-upper-3d-isolated');

 // 4. Presentation outputs are refused while pending and lead to the list; backups are allowed and say the state.
 for(const [label,fn]of [['presentation',()=>FloorPlanPresentation.open()],['sheet',()=>FloorPlanSheet.open()],['image',()=>document.querySelector('#exportPng').click()]]){
  await page.evaluate(fn);await dialog.waitFor();assert.equal(await page.evaluate(()=>!!FloorPlanPresentation.active||!!FloorPlanSheet.active),false,`${label} not opened`);
  await page.locator('#conflictsClose').click();}
 const backup=page.waitForEvent('download');await page.evaluate(()=>FloorPlanBuildingUI.exportBuildingJson());const d=await backup,chunks=[];for await(const c of await d.createReadStream())chunks.push(c);
 const exported=JSON.parse(Buffer.concat(chunks));assert.deepEqual(exported.levels.map(l=>l.project.objects),original.levels.map(l=>l.project.objects),'backup keeps positions');assert.ok(!JSON.stringify(exported).includes('BW5'));
 await page.waitForFunction(()=>/Atención: 2 conflictos/.test(document.querySelector('#toast').textContent));

 // 5. «Localizar» from 3D: back to 2D, upper level, bed selected and framed.
 await tapOrClick(page.locator('#levelConflictsOpen'));await dialog.waitFor();await tapOrClick(page.locator('#conflictsList li[data-object="obj_conflict-bed"] [data-action="locate"]'));
 await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d'&&FloorPlanBuildingUI.context.order===1&&ui.sel?.id==='obj_conflict-bed');await closePanel();await page.waitForTimeout(400);await chipClear();await shot('07-upper-2d-located');

 // 6. New conflicts are refused. Dragging the clear desk onto the void: back to its last valid pose, nothing in undo.
 const undoBefore=await page.evaluate(()=>undoStack.length),desk=original.levels[1].project.objects.find(o=>o.id==='obj_conflict-desk').position;
 await fit();await drag(page,desk,{x:5240,y:2400});
 assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.objects.find(o=>o.id==='obj_conflict-desk').position),desk,'desk not moved onto the void');
 assert.equal(await page.evaluate(()=>undoStack.length),undoBefore,'refused change is not in the history');
 await page.waitForFunction(()=>/No se ha aplicado el cambio: «Escritorio» quedaría sobre el hueco/.test(document.querySelector('#toast').textContent));
 // Duplicating the bed: the copy goes to a demonstrated free place, never onto the void.
 await page.evaluate(()=>{select({kind:'furn',id:'obj_conflict-bed'});duplicateSel();});
 const copies=await page.evaluate(()=>FloorPlanApp.project.objects.filter(o=>o.name==='Cama'));
 if(copies.length===2)assert.equal((await status(page)).conflicts.filter(c=>c.objectName==='Cama').length,1,'the copy adds no conflict');
 else assert.ok(await page.locator('#placementDialog[open]').count(),'or nothing is added and the reason is shown');
 if(await page.locator('#placementDialog[open]').count())await page.locator('#placementClose').click();
 if(copies.length===2)await page.evaluate(()=>undo());
 // Adding in the narrow «Paso» of the ground level: no free place → not added, explained.
 await level(0);const count=await page.evaluate(()=>FloorPlanApp.project.objects.length),{pasoCenterX}=S.build();
 await page.evaluate(x=>addItem(['shelf','Banco',900,400,'#9a8f80',450],x,2200),pasoCenterX);
 await page.locator('#placementDialog[open]').waitFor();assert.match(await page.locator('#placementReason').textContent(),/No hay sitio libre para «Banco» en «Paso» sin pisar la escalera/);
 assert.equal(await page.evaluate(()=>FloorPlanApp.project.objects.length),count,'nothing added');await shot('08-no-free-place');await page.locator('#placementClose').click();

 // 7. Manual correction: the sofa to the «Salón», the bed out of the void. Each drop is re-evaluated.
 await fit();await drag(page,sofa.position,{x:2400,y:2700});
 await page.waitForFunction(()=>FloorPlanBuildingUI.status().conflicts.length===1);
 await level(1);await fit();const bed=original.levels[1].project.objects.find(o=>o.id==='obj_conflict-bed').position;await drag(page,bed,{x:3000,y:2300});
 await page.waitForFunction(()=>FloorPlanBuildingUI.status().state==='clear');
 assert.equal(await chip.isHidden(),true,'2D: no pending state');assert.equal(await page.locator('#gStairs .level-conflict').count(),0);await shot('09-upper-2d-clear');
 await to('3d');assert.equal(await chip.isHidden(),true,'3D: no pending state');
 const fixed=await page.evaluate(()=>View3D.levelInspect().furniturePlan.find(f=>f.id==='obj_conflict-bed'));assert.ok(!B.zoneConflict(T.footprint({position:{x:fixed.x,y:fixed.y},size:{widthMm:1600,depthMm:2000},rotationDeg:fixed.rotationDeg}),B.stairZonesOf(original,original.levels[1])[0].polygon),'3D bed clear of the void');
 await page.evaluate(()=>{if(View3D.levelView!=='all')document.querySelector('#levelViewAll').click();});await page.waitForFunction(()=>View3D.levelView==='all');await page.evaluate(()=>{select(null);});await page.waitForTimeout(900);await shot('10-all-3d-clear');assert.equal(await page.evaluate(()=>FloorPlanBuildingUI.gate('Presentar mi vivienda')),true,'outputs allowed again');
 await to('2d');

 // 8. F5: the corrected building is restored, still clear; nothing moved by itself.
 const saved=await building(page);await page.reload();await page.waitForFunction(()=>FloorPlanBuildingUI.context?.levels===2);
 assert.equal(B.canonical(await building(page)),B.canonical(saved));assert.equal((await status(page)).state,'clear');

 // 9. Stair form: lists the furniture that a new position would cover on BOTH levels; closing without saving changes nothing.
 await tapOrClick(page.locator('#levelsBtn'));await page.locator('#levelsDialog[open]').waitFor();const preview=page.locator('#stairConflictsPreview');
 await page.fill('#stairX','1600');await page.fill('#stairY','700');await page.fill('#stairRotation','0');
 assert.match(await preview.textContent(),/Quedarían sobre la escalera \(BW5\): «Mesa» en «Planta baja»[^;]*; «Escritorio» en «Planta primera»/);
 assert.match(await preview.textContent(),/la distribución quedará pendiente/);await preview.scrollIntoViewIfNeeded();await shot('11-stair-form-preview');
 await tapOrClick(page.locator('#levelsClose'));assert.equal(B.canonical(await building(page)),B.canonical(saved),'cancel keeps the data');
 assert.deepEqual(errors,[]);
});

// Finding 12 (23-10-2026) changed the single-level rule: a copy is no longer put on top of other furniture. It keeps
// the +200 mm offset when that place is free and otherwise goes to the nearest free place; no stair search is involved.
test('single-level project: a duplicate keeps the 200 mm offset when free and never overlaps (no stair search)',{timeout:300000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>context.close());const {page,errors}=await open(context);
 const dup=pick=>page.evaluate(pick=>{const p=FloorPlanApp.project,f=pick==='first'?state.furniture[0]:[...state.furniture].filter(x=>x.type!=='rug').sort((a,b)=>a.w*a.d-b.w*b.d)[0];
  select({kind:'furn',id:f.id});const before={cx:f.cx,cy:f.cy,n:state.furniture.length},o=p.objects.find(x=>x.id===f.id);
  const offsetFree=FloorPlanPlacement.problems(p,{...o,id:'obj_probe',position:{x:o.position.x+200,y:o.position.y+200}}).length===0;duplicateSel();
  const d=document.querySelector('#placementDialog'),refused=!!d?.open,reason=d?.querySelector('#placementReason')?.textContent||'';if(refused)d.close();
  const n=state.furniture.at(-1),copy=refused?null:FloorPlanApp.project.objects.find(x=>x.id===n.id);
  return {before,after:{cx:n.cx,cy:n.cy,n:state.furniture.length},refused,reason,offsetFree,overlaps:copy?FloorPlanPlacement.problems(FloorPlanApp.project,copy).filter(q=>q.kind==='furniture').length:0,
   building:!!FloorPlanBuildingUI.context,zones:FloorPlanBuildingUI.stairZoneList().length};},pick);
 // The example's first item is a double bed in a furnished bedroom: no free place, so it is refused and explained.
 const bed=await dup('first');assert.equal(bed.building,false);assert.equal(bed.zones,0);
 if(bed.refused){assert.equal(bed.after.n,bed.before.n,'nothing added');assert.match(bed.reason,/No hay sitio libre para «Cama doble/);}
 else{assert.equal(bed.after.n,bed.before.n+1);assert.equal(bed.overlaps,0);}
 // A small item has room: it is added, never on top of anything, at +200 mm when that place is free.
 const small=await dup('small');assert.equal(small.refused,false,small.reason);assert.equal(small.after.n,small.before.n+1);assert.equal(small.overlaps,0,'the copy does not overlap other furniture');
 if(small.offsetFree)assert.deepEqual([small.after.cx,small.after.cy],[small.before.cx+200,small.before.cy+200],'free offset: kept exactly');
 assert.deepEqual(errors,[]);
});
