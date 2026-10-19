// «Seleccionar y editar una puerta o ventana donde está»: select in 2D, preview, apply, history, persistence,
// geometry errors, legacy overlaps, add from a room, 3D leaf, «Plano propio» guard and a two-level building, at
// 1440x900, 390x844 and 844x390. Captures go to OPENING_SHOTS (default docs/qa/artifacts/contextual-openings).
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http'),{execFile}=require('node:child_process'),{chromium}=require('playwright');
const C=require('../js/project-core.js'),L=require('../js/room-layout.js'),T=require('../js/tracing-core.js'),O=require('../js/opening-edit.js');
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),S=require('./fixtures/stair-conflict-building.cjs');
const root=path.resolve(__dirname,'..'),shots=process.env.OPENING_SHOTS||path.join(root,'docs/qa/artifacts/contextual-openings'),KEY='rubik-sota-project-library-v1';
let server,browser,url,tmp,zipBytes;const cache=new Map();
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':file.endsWith('.jpg')?'image/jpeg':'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(shots,{recursive:true});
 tmp=await fs.mkdtemp(path.join(os.tmpdir(),'openings-'));const {entries}=await B.packageEntries(S.build().building,()=>null,T.imageInfo);zipBytes=Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer());await fs.writeFile(path.join(tmp,'duplex.zip'),zipBytes);
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const curl=target=>new Promise((resolve,reject)=>execFile('curl',['--fail','--silent','--show-error','--max-time','30',target],{maxBuffer:20e6},(e,out)=>e?reject(e):resolve(out)));

// Salón x 0–4000 and Cocina x 4240–7240 (y 0–3000); the shared wall at x 4120 is drawn top → bottom. A door on it,
// a window on the Salón top wall and, as in an old file, two windows that overlap on the Cocina east wall.
function fixture(){
 let p=L.blank('Huecos contextuales');p=L.create(p,{name:'Salón',width:4000,depth:3000}).project;p=L.create(p,{name:'Cocina',width:3000,depth:3000,neighborId:p.rooms[0].id,side:'right'}).project;
 const at=x=>p.walls.find(w=>w.start.x===x&&w.end.x===x),top=p.walls.find(w=>w.start.y===-120&&w.end.y===-120&&w.end.x===4120);
 const door=T.opening(p,at(4120).id,{x:4120,y:1500},'door');door.id='opn_test-door';
 const win=T.opening(p,top.id,{x:2000,y:-120},'window',1200);win.id='opn_test-window';
 const a=T.opening(p,at(7360).id,{x:7360,y:900},'window',800);a.id='opn_old-a';const b=T.opening(p,at(7360).id,{x:7360,y:2200},'window',800);b.id='opn_old-b';b.offsetMm=a.offsetMm+600;
 C.validate(p);return p;
}
async function open(context){
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push('pageerror: '+e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();let p=cache.get(target);if(!p){p=require('./helpers/three-module.cjs')(target,()=>curl(target));cache.set(target,p);}
  try{await route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await p});}catch{await route.abort();}});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanOpeningUI&&window.View3D);await require('./editor-fixture.cjs')(page);return {page,errors};
}
const screen=(page,p)=>page.evaluate(p=>{const m=new DOMPoint(p.x,p.y).matrixTransform(document.querySelector('#plan').getScreenCTM());return {x:m.x,y:m.y};},p);
const proj=page=>page.evaluate(()=>structuredClone(FloorPlanApp.project));
const openingAt=(p,id)=>{const o=p.openings.find(x=>x.id===id),w=p.walls.find(x=>x.id===o.wallId),L=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),t=(o.offsetMm+o.widthMm/2)/L;return {x:w.start.x+(w.end.x-w.start.x)*t,y:w.start.y+(w.end.y-w.start.y)*t};};
const inPoly=(poly,q)=>{let y=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>q.y)!==(b.y>q.y)&&q.x<(b.x-a.x)*(q.y-a.y)/(b.y-a.y)+a.x)y=!y;}return y;};

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`contextual door and window editing ${viewport.width}x${viewport.height}`,{timeout:600000},async t=>{
 const mobile=viewport.width<1000,narrow=viewport.width<=1100,name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,acceptDownloads:true});t.after(()=>context.close());
 const {page,errors}=await open(context);
 const press=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();mobile?await l.tap():await l.click();await page.waitForTimeout(120);};
 const tapPlan=async q=>{const s=await screen(page,q);mobile?await page.touchscreen.tap(s.x,s.y):await page.mouse.click(s.x,s.y);await page.waitForTimeout(150);};
 const panelOpen=async()=>{if(narrow&&!(await page.evaluate(()=>document.querySelector('aside.right').classList.contains('open'))))await press('#fab [data-a=prop]');await page.waitForTimeout(250);};
 const panelClose=async()=>{if(narrow&&await page.evaluate(()=>document.querySelector('aside.right').classList.contains('open'))){await press('#tgPanel');await page.waitForTimeout(450);}};
 const shot=async step=>{await page.locator('#toast:not(.show)').waitFor({state:'attached',timeout:20000}).catch(()=>{});await page.waitForTimeout(250);await page.screenshot({path:path.join(shots,`${name}-${step}.png`)});};
 // Every visible control of the panel can be scrolled into view and is not clipped horizontally.
 const panelReachable=async()=>{const bad=await page.evaluate(()=>{const out=[];for(const e of document.querySelectorAll('#panel .opening-panel input,#panel .opening-panel select,#panel .opening-panel button')){if(!e.offsetParent)continue;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();if(r.width<1||r.left<-1||r.right>innerWidth+1||r.top<-1||r.bottom>innerHeight+1)out.push(e.id||e.name);}return out;});assert.deepEqual(bad,[],'panel controls reachable');};
 const p0=fixture();await page.evaluate(p=>FloorPlanApp.importProject(p),p0);await page.evaluate(()=>document.querySelector('#fit').click());await page.waitForTimeout(300);
 const start=await proj(page),door='opn_test-door';
 assert.deepEqual(start.openings.map(o=>[o.id,o.offsetMm]),p0.openings.map(o=>[o.id,o.offsetMm]),'old overlap imported unchanged');

 // 1. The legacy overlap is reported, not rewritten.
 if(narrow)await press('#tgPanel');await page.locator('#openingConflicts').waitFor();assert.match(await page.locator('#openingConflicts').textContent(),/Un par de huecos se solapa/);assert.doesNotMatch(await page.locator('#openingConflicts .actions').textContent(),/opn_/);assert.match(await page.locator('#openingConflicts [data-opening-fix]').first().textContent(),/^(Puerta abatible|Puerta corredera|Ventana|Hueco de paso) · \d+–\d+ mm$/);
 await shot('01-legacy-notice');await panelClose();

 // 2. Tap the door with «Seleccionar»: selected and editable without «Plano propio».
 await tapPlan(openingAt(start,door));assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'opening',id:door});
 const hit=await page.locator(`[data-opening="${door}"]`).evaluate(e=>({w:e.getAttribute('stroke-width'),v:e.getAttribute('vector-effect')}));assert.deepEqual(hit,{w:'44',v:'non-scaling-stroke'});
 if(narrow)await shot('02a-selected-plan');await panelOpen();
 assert.equal(await page.locator('#openingTitle').textContent(),'Puerta abatible');assert.match(await page.locator('#panel .opening-id').textContent(),/Muro seleccionado/);assert.doesNotMatch(await page.locator('#panel .opening-id').textContent(),/opn_|wall_/);
 const labels=await page.locator('#openingSide label').allTextContents();assert.deepEqual(labels,['Hacia «Cocina»','Hacia «Salón»']);
 await panelReachable();await shot('02-selected-panel');

 // 3. Choose «Hacia «Salón»»: preview only, nothing stored until «Aplicar».
 const bytes=JSON.stringify(start),undo0=await page.evaluate(()=>undoStack.length);
 await press('#openingSide input[value=right]');assert.match(await page.locator('#openingPreview').textContent(),/Sentido de apertura cambiado/);
 assert.equal(JSON.stringify(await proj(page)),bytes,'preview does not touch the project');assert.ok(await page.locator('#gSel .opening-overlay path[stroke="#2f7d4f"]').count(),'green leaf preview drawn');
 if(narrow){await press('#openingShowPlan');assert.equal(await page.locator('#fab [data-a=apply]').count(),1);await shot('03-preview-plan');await press('#fab [data-a=apply]');}
 else{await shot('03-preview-plan');await press('#openingApply');}
 const applied=await proj(page),d1=applied.openings.find(o=>o.id===door);
 assert.deepEqual(d1.swing,{hinge:'start',side:'right'});assert.equal(d1.source.review,'unreviewed');assert.equal(await page.locator('#openingSide label').count()>0||narrow,true);
 assert.equal(await page.evaluate(()=>undoStack.length),undo0+1,'one history step');
 const leaf=await page.evaluate(id=>{const d=FloorPlanApp.geometry.doors.find(x=>x.id===id);return {x:d.h[0]+d.o[0]*300,y:d.h[1]+d.o[1]*300,o:d.o};},door);
 assert.ok(inPoly(applied.rooms.find(r=>r.name==='Salón').polygon,leaf),'2D leaf geometry opens into Salón');
 await shot('04-applied');
 await page.evaluate(()=>undo());assert.deepEqual((await proj(page)).openings.find(o=>o.id===door).swing,{hinge:'start',side:'left'});
 await page.evaluate(()=>redo());assert.deepEqual((await proj(page)).openings.find(o=>o.id===door).swing,{hinge:'start',side:'right'});

 // 4. Geometric error: a width that does not fit is refused, explained, and nothing is stored.
 await panelClose();await tapPlan(openingAt(applied,door));await panelOpen();
 const beforeErr=JSON.stringify(await proj(page));
 await page.locator('#opening-widthMm').fill('5000');assert.match(await page.locator('#openingError').textContent(),/no cabe/);
 assert.equal(await page.locator('#openingApply').isDisabled(),true);assert.equal(JSON.stringify(await proj(page)),beforeErr);
 await page.locator('#openingError').scrollIntoViewIfNeeded();await shot('05-geometry-error');await press('#openingDiscard');
 assert.equal(JSON.stringify(await proj(page)),beforeErr);

 // 5. Legacy overlap: a worse position is refused, a resolving one is accepted.
 await panelClose();await tapPlan(openingAt(applied,'opn_old-b'));await panelOpen();await page.locator('#openingLegacy').waitFor();assert.match(await page.locator('#openingLegacy').textContent(),/Ventana · tramo \d+–\d+ mm/);assert.doesNotMatch(await page.locator('#openingLegacy').textContent(),/opn_old-/);
 const b0=applied.openings.find(o=>o.id==='opn_old-b'),a0=applied.openings.find(o=>o.id==='opn_old-a');
 await page.locator('#opening-offsetMm').fill(String(b0.offsetMm-100));assert.match(await page.locator('#openingError').textContent(),/Se solaparía \d+ mm con Ventana · tramo \d+–\d+ mm/);assert.doesNotMatch(await page.locator('#openingError').textContent(),/opn_old-/);
 await page.locator('#opening-offsetMm').fill(String(a0.offsetMm+a0.widthMm));assert.equal(await page.locator('#openingApply').isDisabled(),false);await press('#openingApply');
 assert.deepEqual(O.conflicts(await proj(page)),[]);

 // 6. Type changes: door → window drops the swing; back to door creates a valid one to review.
 await panelClose();await tapPlan(openingAt(applied,door));await panelOpen();
 await page.selectOption('#opening-kind','window');assert.match(await page.locator('#openingPreview').textContent(),/Se elimina el sentido de apertura/);
 assert.deepEqual([await page.locator('#opening-heightMm').inputValue(),await page.locator('#opening-sillHeightMm').inputValue()],['1200','900'],'fields show the values of the new type');await press('#openingApply');
 assert.equal((await proj(page)).openings.find(o=>o.id===door).swing,undefined);
 await page.selectOption('#opening-kind','door');await press('#openingApply');const back=(await proj(page)).openings.find(o=>o.id===door);
 assert.deepEqual([back.id,back.kind,back.swing,back.source.review],[door,'door',{hinge:'start',side:'left'},'unreviewed']);

 // 7. Add a window from the selected room: only its walls; a tap elsewhere adds nothing.
 const salon=applied.rooms.find(r=>r.name==='Salón');await panelClose();await tapPlan({x:1000,y:2000});assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'room',id:salon.id});
 await panelOpen();const count0=(await proj(page)).openings.length;
 await press('#roomAddWindow');await panelClose();assert.equal(await page.evaluate(()=>FloorPlanOpeningUI.picking()),true);assert.ok(await page.locator('#gSel .opening-pick').count()>=4);
 await tapPlan({x:7360,y:1500});assert.equal((await proj(page)).openings.length,count0,'other room wall: nothing added');
 await tapPlan({x:1000,y:2000});await panelOpen();await press('#roomAddWindow');await panelClose();await tapPlan({x:-120,y:1500});await panelOpen();
 assert.match(await page.locator('#openingTitle').textContent(),/Nueva Ventana · vista previa/);await shot('06-add-window-preview');
 if(narrow){await press('#openingShowPlan');await press('#fab [data-a=apply]');}else await press('#openingApply');
 const added=await proj(page);assert.equal(added.openings.length,count0+1);const newId=await page.evaluate(()=>ui.sel.id);assert.equal(added.openings.find(o=>o.id===newId).kind,'window');

 // 8. Reload, JSON and ZIP keep IDs, types, positions and swing.
 await page.reload();await page.waitForFunction(()=>window.FloorPlanOpeningUI&&window.View3D&&window.FloorPlanApp?.project);
 const reloaded=await proj(page);assert.deepEqual(reloaded.openings,added.openings);
 const zip=await page.evaluate(async()=>Array.from(new Uint8Array(await (await FloorPlanPackage.encode(FloorPlanApp.project,k=>FloorPlanImages.get(k))).arrayBuffer())));
 await page.locator('#traceZipFile').setInputFiles({name:'huecos.zip',mimeType:'application/zip',buffer:Buffer.from(zip)});await page.waitForFunction(()=>document.querySelector('#traceStatus').textContent.includes('ZIP importado'));
 assert.deepEqual((await proj(page)).openings,added.openings,'ZIP round trip');

 // 9. 3D: the built leaf opens to the stored side.
 await panelClose();await page.evaluate(()=>setView('3d'));await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'));await page.waitForTimeout(900);
 const leaf3d=await page.evaluate(id=>View3D.doorLeaves.find(d=>d.id===id),door),g=await page.evaluate(id=>FloorPlanApp.geometry.doors.find(d=>d.id===id).o,door);
 assert.ok(Math.abs(leaf3d.open-Math.atan2(-g[1],g[0]))<1e-9,'3D leaf open angle follows the swing');await shot('07-3d');
 await page.evaluate(()=>setView('2d'));await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d'&&!document.body.classList.contains('busy'));

 // 10. Storage failure: nothing published, history unchanged.
 await page.evaluate(()=>document.querySelector('#fit').click());await page.waitForTimeout(200);await tapPlan(openingAt(added,door));await panelOpen();
 const keep=JSON.stringify(await proj(page)),u=await page.evaluate(()=>undoStack.length);
 await press('#openingSide input[value=right]');await page.evaluate(()=>{window.__set=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('cuota QA');};});
 await page.evaluate(()=>{try{FloorPlanOpeningUI.applyDraft();}catch(e){window.__err=e.message;}});
 assert.equal(await page.evaluate(()=>window.__err),'cuota QA');assert.equal(JSON.stringify(await proj(page)),keep);assert.equal(await page.evaluate(()=>undoStack.length),u);
 await page.evaluate(()=>{Storage.prototype.setItem=window.__set;FloorPlanOpeningUI.discard();});

 // 11. «Plano propio»: the same guard refuses an overlapping door; closing the tools leaves no hidden mode.
 await panelClose();if(narrow)await page.evaluate(()=>document.querySelector('#traceBtn').scrollIntoView());await press('#traceBtn');await press('#traceDoor');
 const n0=(await proj(page)).openings.length;await tapPlan(openingAt(added,door));assert.equal((await proj(page)).openings.length,n0,'overlapping door refused in «Plano propio»');
 assert.match(await page.locator('#toast').textContent(),/Se solaparía/);
 if(narrow&&!(await page.evaluate(()=>document.querySelector('aside.right').classList.contains('open')))){await press('#tgPanel');await page.waitForTimeout(450);}
 await press('#traceHidePanel');await panelClose();await tapPlan({x:1000,y:2000});
 assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'room',id:salon.id},'after closing the tools the next tap selects');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page scroll');
 assert.deepEqual(errors,[]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`two-level building: editing a door changes only the active level ${viewport.width}x${viewport.height}`,{timeout:300000},async t=>{
 const mobile=viewport.width<1000,narrow=viewport.width<=1100,name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const {page,errors}=await open(context);
 const press=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();mobile?await l.tap():await l.click();await page.waitForTimeout(120);};
 await page.locator('#uploadIn').setInputFiles(path.join(tmp,'duplex.zip'));await page.waitForFunction(()=>FloorPlanBuildingUI.context?.levels===2,null,{timeout:60000});
 if((await page.evaluate(()=>FloorPlanBuildingUI.context.order))!==0){await press('#levelBar [data-level]');await page.waitForFunction(()=>FloorPlanBuildingUI.context.order===0);}
 await page.evaluate(()=>{if(matchMedia('(max-width:1100px)').matches)for(const a of document.querySelectorAll('aside.right,aside.lib'))a.classList.remove('open');document.querySelector('#fit').click();});await page.waitForTimeout(300);
 const building=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)).entries.find(e=>e.kind==='building').building,KEY);
 const b0=await building(),upper0=JSON.stringify(b0.levels.find(l=>l.order===1)),door='opn_conflict-door';
 const p=await proj(page),q=openingAt(p,door),s=await screen(page,q);mobile?await page.touchscreen.tap(s.x,s.y):await page.mouse.click(s.x,s.y);await page.waitForTimeout(200);
 assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'opening',id:door});if(narrow)await press('#fab [data-a=prop]');
 assert.match(await page.locator('#opening-id, .opening-id').first().textContent(),/planta activa/);
 const other=(await page.locator('#openingSide input:not(:checked)').getAttribute('value'));await press(`#openingSide input[value=${other}]`);
 if(narrow){await press('#openingShowPlan');await page.screenshot({path:path.join(shots,`${name}-08-building-preview.png`)});await press('#fab [data-a=apply]');}
 else{await page.screenshot({path:path.join(shots,`${name}-08-building-preview.png`)});await press('#openingApply');}
 const b1=await building();
 assert.equal(b1.levels.find(l=>l.order===0).project.openings.find(o=>o.id===door).swing.side,other,'active level changed');
 assert.equal(JSON.stringify(b1.levels.find(l=>l.order===1)),upper0,'the other level is identical');
 assert.deepEqual(errors,[]);
});
