// «Buscar sitio libre» at 1440×900, 390×844 and 844×390 on an imported conflicting building that is not the corrected
// fixture: two pieces over the upper void proposed together (preview, cancel, F5 during the preview), applied in one
// undoable step, the 3D re-checked; the ground sofa in the narrow «Paso» has no free place; a failed save leaves
// nothing applied. Captures go to STAIR_SHOTS.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http'),{execFile}=require('node:child_process'),{chromium}=require('playwright');
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),S=require('./fixtures/stair-conflict-building.cjs');
const root=path.resolve(__dirname,'..'),shots=process.env.STAIR_SHOTS||path.join(root,'docs/qa/artifacts/multilevel/stair-relocation'),KEY='rubik-sota-project-library-v1';
let server,browser,url,tmp,original;const cache=new Map();
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':file.endsWith('.wasm')?'application/wasm':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(shots,{recursive:true});
 // The conflicting building plus a chest next to the bed, both over the upper void.
 original=S.build().building;const up=original.levels[1].project;
 up.objects.push({id:'obj_conflict-chest',type:'cabinet',name:'Baúl',position:{x:5240,y:2900},size:{widthMm:900,depthMm:450},rotationDeg:0,color:'#7a6a5a',roomId:up.rooms[0].id});B.validate(original);
 tmp=await fs.mkdtemp(path.join(os.tmpdir(),'stair-relocation-'));const {entries}=await B.packageEntries(original,()=>null,T.imageInfo);await fs.writeFile(path.join(tmp,'duplex.zip'),Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const curl=target=>new Promise((resolve,reject)=>execFile('curl',['--fail','--silent','--show-error','--max-time','30',target],{maxBuffer:20e6},(e,out)=>e?reject(e):resolve(out)));
const building=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)).entries.find(e=>e.kind==='building').building,KEY);
// The proposal panel must be fully reachable: title, list and «Aplicar/Cancelar» inside the panel, the panel inside the
// stage (between the top bar and the bottom bar), focus on the title, the list scrollable without moving the title or
// the buttons, and the conflict chip not covered. Regression check for the clipped title at 844×390.
async function panelReachable(page){
 const m=await page.evaluate(async()=>{const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right};};
  const p=document.querySelector('#relocationPanel'),body=document.querySelector('#relocationBody')||p,out={stage:r(document.querySelector('#stage')),panel:r(p),title:r(p.querySelector('h3')),apply:r(document.querySelector('#relocationApply')),cancel:r(document.querySelector('#relocationCancel')),chip:r(document.querySelector('#levelConflicts')),focus:document.activeElement.id,scrollable:body.scrollHeight>body.clientHeight+1,panelScroll:p.scrollTop};
  body.scrollTop=body.scrollHeight;await new Promise(f=>requestAnimationFrame(()=>requestAnimationFrame(f)));out.afterScroll={title:r(p.querySelector('h3')),cancel:r(document.querySelector('#relocationCancel')),bodyTop:body.scrollTop,panelScroll:p.scrollTop};body.scrollTop=0;return out;});
 const inside=(a,b,what)=>assert.ok(a&&a.top>=b.top-0.5&&a.bottom<=b.bottom+0.5&&a.left>=b.left-0.5&&a.right<=b.right+0.5,`${what} ${JSON.stringify(a)} inside ${JSON.stringify(b)}`);
 inside(m.panel,m.stage,'panel');inside(m.title,m.panel,'title');inside(m.cancel,m.panel,'cancel');if(m.apply)inside(m.apply,m.panel,'apply');
 assert.equal(m.focus,'relocationTitle','focus starts on the title');assert.equal(m.panelScroll,0,'the panel itself never scrolls');
 inside(m.afterScroll.title,m.panel,'title after scrolling the list');inside(m.afterScroll.cancel,m.panel,'cancel after scrolling the list');assert.equal(m.afterScroll.panelScroll,0);
 if(m.scrollable)assert.ok(m.afterScroll.bodyTop>0,'the list scrolls');
 if(m.chip&&m.chip.bottom>m.chip.top)assert.ok(!(m.chip.left<m.panel.right&&m.panel.left<m.chip.right&&m.chip.top<m.panel.bottom&&m.panel.top<m.chip.bottom),'conflict chip not covered');
 return m;
}

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`assisted relocation ${viewport.width}x${viewport.height}`,{timeout:900000},async t=>{
 const mobile=viewport.width<1000,name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push('pageerror: '+e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();let p=cache.get(target);if(!p){p=require('./helpers/three-module.cjs')(target,()=>curl(target));cache.set(target,p);}try{await route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await p});}catch{await route.abort();}});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanBuildingUI&&window.View3D);await require('./editor-fixture.cjs')(page);
 const tapOrClick=l=>mobile?l.tap():l.click();
 const closePanel=()=>page.evaluate(()=>{if(matchMedia('(max-width:1100px)').matches&&document.querySelector('aside.right')?.classList.contains('open'))document.querySelector('#tgPanel').click();});
 const shot=async step=>{await page.locator('#toast:not(.show)').waitFor({state:'attached',timeout:20000});await page.waitForTimeout(300);await page.screenshot({path:path.join(shots,`${name}-${step}.png`)});};
 const openList=async()=>{await tapOrClick(page.locator('#levelConflictsOpen'));await page.locator('#conflictsDialog[open]').waitFor();};
 const panel=page.locator('#relocationPanel');

 await page.locator('#uploadIn').setInputFiles(path.join(tmp,'duplex.zip'));await page.waitForFunction(()=>FloorPlanBuildingUI.context?.levels===2,null,{timeout:60000});
 const imported=await building(page);assert.equal(B.canonical(imported),B.canonical(original));
 assert.equal((await page.evaluate(()=>FloorPlanBuildingUI.status())).conflicts.length,3,'sofa, bed and chest');

 // 1. Preview for the two pieces of the upper level, computed together. Nothing is stored.
 await openList();await tapOrClick(page.locator('#conflictsList [data-action="propose-all"]'));
 await panel.waitFor();await closePanel();
 assert.equal(await page.locator('#gStairs .level-proposal').count(),2);assert.match(await panel.textContent(),/«Cama»: de \(4600, 1900\) a \(\d+, \d+\)/);assert.match(await panel.textContent(),/«Baúl»: de \(5240, 2900\) a/);
 assert.match(await panel.textContent(),/No comprobado: altura libre, paso o recorrido, normativa/);
 assert.equal(B.canonical(await building(page)),B.canonical(imported),'preview stores nothing');
 await panelReachable(page);
 const moves=await page.evaluate(()=>FloorPlanBuildingUI.proposal);
 const covered=await page.evaluate(()=>{const p=document.querySelector('#relocationPanel').getBoundingClientRect();return [...document.querySelectorAll('#gStairs .level-proposal-outline')].filter(e=>{const b=e.getBoundingClientRect();return b.top<p.bottom&&b.bottom>p.top&&b.left<p.right&&b.right>p.left;}).length;});
 assert.equal(covered,0,'the proposed footprints are not under the panel');
 await shot('01-upper-preview');
 // Cancel: nothing changes. Preview again, then F5: still nothing.
 await tapOrClick(page.locator('#relocationCancel'));await panel.waitFor({state:'hidden'});assert.equal(await page.locator('#gStairs .level-proposal').count(),0);
 assert.equal(B.canonical(await building(page)),B.canonical(imported),'cancel stores nothing');
 await openList();await tapOrClick(page.locator('#conflictsList [data-action="propose-all"]'));await panel.waitFor();
 await page.reload();await page.waitForFunction(()=>FloorPlanBuildingUI.context?.levels===2);assert.equal(B.canonical(await building(page)),B.canonical(imported),'F5 during a preview stores nothing');
 assert.equal(await panel.count()?await panel.isHidden():true,true);

 // 2. A failed save applies nothing.
 await openList();await tapOrClick(page.locator('#conflictsList [data-action="propose-all"]'));await panel.waitFor();
 const depth=await page.evaluate(()=>undoStack.length);
 await page.evaluate(()=>{window.__set=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('QuotaExceededError','QuotaExceededError');};});
 await tapOrClick(page.locator('#relocationApply'));
 await page.evaluate(()=>{Storage.prototype.setItem=window.__set;});
 await page.waitForFunction(()=>/No se ha podido guardar: no se ha aplicado nada/.test(document.querySelector('#toast').textContent));
 assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.objects.filter(o=>o.id==='obj_conflict-bed'||o.id==='obj_conflict-chest').map(o=>o.position)),[{x:4600,y:1900},{x:5240,y:2900}],'positions unchanged in memory');
 assert.equal(await page.evaluate(()=>undoStack.length),depth,'nothing in the history');assert.equal(B.canonical(await building(page)),B.canonical(imported));

 // 3. Apply: one step, both moved, no BW5 left on the level; undo and redo work as one step.
 await openList();await tapOrClick(page.locator('#conflictsList [data-action="propose-all"]'));await panel.waitFor();await tapOrClick(page.locator('#relocationApply'));
 await page.waitForFunction(()=>FloorPlanBuildingUI.status().conflicts.length===1);
 const applied=await page.evaluate(()=>FloorPlanApp.project.objects.filter(o=>['obj_conflict-bed','obj_conflict-chest'].includes(o.id)).map(o=>({id:o.id,position:o.position})));
 assert.deepEqual(applied.map(o=>o.position),moves.map(m=>m.to),'exactly the previewed positions');
 assert.equal(await page.evaluate(()=>undoStack.length),depth+1,'one undo step');
 await page.evaluate(()=>FloorPlanBuildingUI.context);await closePanel();await page.evaluate(()=>document.querySelector('#fit').click());await shot('02-upper-applied');
 await page.evaluate(()=>undo());assert.equal((await page.evaluate(()=>FloorPlanBuildingUI.status())).conflicts.length,3,'undo restores both');
 await page.evaluate(()=>redo());assert.equal((await page.evaluate(()=>FloorPlanBuildingUI.status())).conflicts.length,1,'redo applies both');
 // 3D: the moved pieces are built clear of the void.
 await page.evaluate(()=>setView('3d'));await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d');await page.waitForTimeout(1500);
 const plan=await page.evaluate(()=>View3D.levelInspect().furniturePlan),zone=B.stairZonesOf(original,original.levels[1])[0].polygon;
 for(const id of ['obj_conflict-bed','obj_conflict-chest']){const f=plan.find(x=>x.id===id),o=original.levels[1].project.objects.find(x=>x.id===id);assert.ok(!B.zoneConflict(T.footprint({...o,position:{x:f.x,y:f.y}}),zone),`${id} clear of the void in 3D`);}
 await page.evaluate(()=>{if(View3D.levelView!=='all')document.querySelector('#levelViewAll').click();});await page.waitForTimeout(900);await shot('03-all-3d-applied');
 await page.evaluate(()=>setView('2d'));await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d');

 // 4. The ground sofa: no free place in «Paso» → reported, nothing to apply, manual correction offered.
 await openList();await tapOrClick(page.locator('#conflictsList li[data-object="obj_conflict-sofa"] [data-action="propose"]'));await panel.waitFor();await closePanel();
 await panelReachable(page);
 assert.match(await panel.textContent(),/No se ha encontrado sitio libre para «Sofá» en «Paso»[^]*Corrígelo a mano/);assert.equal(await page.locator('#relocationApply').count(),0,'nothing to apply');assert.equal(await page.locator('#relocationCancel').textContent(),'Cerrar');
 await shot('04-lower-no-place');await tapOrClick(page.locator('#relocationCancel'));

 // 5. F5 after applying: the applied positions are stored; nothing else moved.
 await page.reload();await page.waitForFunction(()=>FloorPlanBuildingUI.context?.levels===2);
 const stored=await building(page);assert.deepEqual(stored.levels[1].project.objects.filter(o=>o.id!=='obj_conflict-desk').map(o=>o.position),moves.map(m=>m.to));
 assert.deepEqual(stored.levels[0].project.objects,original.levels[0].project.objects,'ground level untouched');assert.equal(B.buildingStatus(stored).conflicts.length,1);
 assert.deepEqual(errors,[]);
});

test('long proposal list on a short landscape screen stays readable and reachable 844x390',{timeout:300000},async t=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanBuildingUI);await require('./editor-fixture.cjs')(page);
 const b=JSON.parse(JSON.stringify(original)),up=b.levels[1].project;
 for(let i=0;i<5;i++)up.objects.push({id:`obj_box-${i}`,type:'box',name:`Caja ${i+1}`,position:{x:5000+(i%2)*400,y:900+i*450},size:{widthMm:300,depthMm:300},rotationDeg:0,color:'#7a6a5a',roomId:up.rooms[0].id});
 B.validate(b);const {entries}=await B.packageEntries(b,()=>null,T.imageInfo),file=path.join(tmp,'long.zip');await fs.writeFile(file,Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));
 await page.locator('#uploadIn').setInputFiles(file);await page.waitForFunction(()=>FloorPlanBuildingUI.context?.levels===2,null,{timeout:60000});
 await page.locator('#levelConflictsOpen').tap();await page.locator('#conflictsDialog[open]').waitFor();await page.locator('#conflictsList [data-action="propose-all"]').tap();await page.locator('#relocationPanel').waitFor();
 await page.evaluate(()=>{if(document.querySelector('aside.right')?.classList.contains('open'))document.querySelector('#tgPanel').click();});await page.waitForTimeout(400);
 const m=await panelReachable(page);assert.equal(m.scrollable,true,'the long list has to scroll');
 assert.ok((await page.locator('#relocationBody li').count())>=6);await page.locator('#toast:not(.show)').waitFor({state:'attached',timeout:20000});await page.waitForTimeout(300);await page.screenshot({path:path.join(shots,'844x390-05-long-list.png')});
 assert.deepEqual(errors,[]);
});
