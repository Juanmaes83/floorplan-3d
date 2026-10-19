// «Seleccionar y editar una puerta o ventana donde está»: select in 2D, preview, apply, history, persistence,
// geometry errors, legacy overlaps, add from a room, 3D leaf, «Plano propio» guard and a two-level building, at
// 1440x900, 390x844 and 844x390. Captures go to OPENING_SHOTS (default docs/qa/artifacts/contextual-openings).
// Selecting an opening opens its properties directly; the panel has «Volver» at the top, groups and fixed actions.
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
 const panelShown=()=>page.evaluate(()=>{const a=document.querySelector('aside.right'),r=a.getBoundingClientRect();return !document.querySelector('.app').classList.contains('hide-panel')&&r.width>40&&r.left<innerWidth-4&&(!matchMedia('(max-width:1100px)').matches||a.classList.contains('open'));});
 const panelClose=async()=>{if(narrow&&await page.evaluate(()=>document.querySelector('aside.right').classList.contains('open'))){await press('#tgPanel');await page.waitForTimeout(450);}};
 const shot=async step=>{await page.locator('#toast:not(.show)').waitFor({state:'attached',timeout:20000}).catch(()=>{});await page.waitForTimeout(250);await page.screenshot({path:path.join(shots,`${name}-${step}.png`)});};
 // Every visible control of the panel can be scrolled into view and is not clipped horizontally.
 // Every group is opened for the check and restored afterwards, so collapsed content must be reachable too.
 const panelReachable=async()=>{const bad=await page.evaluate(()=>{const out=[],closed=[...document.querySelectorAll('#panel .opening-panel details:not([open])')];for(const d of closed)d.open=true;for(const e of document.querySelectorAll('#panel .opening-panel input,#panel .opening-panel select,#panel .opening-panel button')){if(!e.offsetParent||e.closest('[hidden]'))continue;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();if(r.width<1||r.left<-1||r.right>innerWidth+1||r.top<-1||r.bottom>innerHeight+1)out.push(e.id||e.name);}for(const d of closed)d.open=false;return out;});assert.deepEqual(bad,[],'panel controls reachable');};
 const p0=fixture();await page.evaluate(p=>FloorPlanApp.importProject(p),p0);await page.evaluate(()=>document.querySelector('#fit').click());await page.waitForTimeout(300);
 const start=await proj(page),door='opn_test-door';
 assert.deepEqual(start.openings.map(o=>[o.id,o.offsetMm]),p0.openings.map(o=>[o.id,o.offsetMm]),'old overlap imported unchanged');

 // 1. The legacy overlap is reported, not rewritten.
 if(narrow)await press('#tgPanel');await page.locator('#openingConflicts').waitFor();assert.match(await page.locator('#openingConflicts').textContent(),/Un par de huecos se solapa/);assert.doesNotMatch(await page.locator('#openingConflicts .actions').textContent(),/opn_/);assert.match(await page.locator('#openingConflicts [data-opening-fix]').first().textContent(),/^(Puerta abatible|Puerta corredera|Ventana|Hueco de paso) · \d+–\d+ mm$/);
 await shot('01-legacy-notice');
 // The notice names kind and span; choosing one highlights that opening and opens its editor at once.
 await press('#openingConflicts [data-opening-fix]:nth-child(2)');assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'opening',id:'opn_old-b'});assert.equal(await panelShown(),true,'legacy choice opens the editor');
 await page.locator('#openingLegacy').waitFor();assert.ok(await page.locator('#gSel .opening-overlay polygon[stroke="#b5653a"]').count(),'chosen opening highlighted');
 await press('#openingBack');assert.equal(await page.evaluate(()=>ui.sel?.kind==='room'||ui.sel===null),true,'«Volver» leaves the opening');
 await panelClose();
 // On desktop the person may have collapsed the panel: selecting an opening opens it again.
 if(!narrow){await press('#tgPanel');assert.equal(await panelShown(),false);}

 // 2. Tap the door with «Seleccionar»: selected and editable without «Plano propio».
 await tapPlan(openingAt(start,door));assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'opening',id:door});
 const hit=await page.locator(`[data-opening="${door}"]`).evaluate(e=>({w:e.getAttribute('stroke-width'),v:e.getAttribute('vector-effect')}));assert.deepEqual(hit,{w:'44',v:'non-scaling-stroke'});
 assert.equal(await panelShown(),true,'properties open directly, without «Propiedades»');
 assert.equal(await page.locator('#tracePanel').isHidden(),true,'selection does not enter «Plano propio»');
 // Head: «Volver» first and at the top; groups for the door: «Apertura» open, «Posición y medidas» closed.
 const head=await page.evaluate(()=>{const b=document.querySelector('#openingBack'),t=document.querySelector('#openingTitle'),p=document.querySelector('.opening-panel');return {first:p.querySelector('button')===b,above:b.getBoundingClientRect().bottom<=t.getBoundingClientRect().top+1,text:b.textContent};});
 assert.equal(head.first,true);assert.equal(head.above,true);assert.match(head.text,/^← (Estancia «|Vista general)/);
 assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('#openingForm details.panel-group')].map(d=>[d.dataset.group,d.open])),[['measures',false],['swing',true],['review',false]]);
 if(narrow){await press('#openingShowPlan');await shot('02a-selected-plan');assert.equal(await page.locator('#fab [data-a=prop]').count(),1,'«Propiedades» brings the panel back');assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'opening',id:door},'closing the panel keeps the selection');await panelOpen();}
 else{await press('#tgPanel');assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'opening',id:door},'hiding the panel keeps the selection');await press('#tgPanel');}
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
 // «Deshacer» and «Rehacer» are in the panel; each moves one step.
 if(narrow)await panelOpen();assert.match(await page.locator('#openingApplied').textContent(),/Cambio aplicado/);
 await press('#openingUndo');assert.deepEqual((await proj(page)).openings.find(o=>o.id===door).swing,{hinge:'start',side:'left'});
 await press('#openingRedo');assert.deepEqual((await proj(page)).openings.find(o=>o.id===door).swing,{hinge:'start',side:'right'});
 await page.evaluate(()=>undo());assert.deepEqual((await proj(page)).openings.find(o=>o.id===door).swing,{hinge:'start',side:'left'});
 await page.evaluate(()=>redo());assert.deepEqual((await proj(page)).openings.find(o=>o.id===door).swing,{hinge:'start',side:'right'});

 // 4. Geometric error: a width that does not fit is refused, explained, and nothing is stored.
 await panelClose();await tapPlan(openingAt(applied,door));assert.equal(await panelShown(),true);
 const beforeErr=JSON.stringify(await proj(page));
 await press('#openingGroup-measures summary');assert.equal(await page.locator('#openingGroup-measures').evaluate(d=>d.open),true);
 await page.locator('#opening-widthMm').fill('5000');assert.equal(await page.locator('#openingGroup-measures').evaluate(d=>d.open),true,'group stays open while editing');
 assert.equal(await page.locator('#openingUndo').isDisabled(),true,'history waits for the preview to be applied or discarded');assert.match(await page.locator('#openingError').textContent(),/no cabe/);
 assert.equal(await page.locator('#openingApply').isDisabled(),true);assert.equal(JSON.stringify(await proj(page)),beforeErr);
 assert.deepEqual(await page.evaluate(()=>{const e=document.querySelector('#openingError'),f=document.querySelector('#opening-widthMm');return [f.getAttribute('aria-invalid'),f.getAttribute('aria-describedby'),e.previousElementSibling?.contains(f)];}),['true','openingError',true],'the error is next to the width that caused it');
 await page.locator('#openingError').scrollIntoViewIfNeeded();await shot('05-geometry-error');await press('#openingDiscard');
 assert.equal(JSON.stringify(await proj(page)),beforeErr);

 // 5. Legacy overlap: a worse position is refused, a resolving one is accepted.
 await panelClose();await tapPlan(openingAt(applied,'opn_old-b'));assert.equal(await panelShown(),true);await page.locator('#openingLegacy').waitFor();assert.equal(await page.locator('#openingGroup-measures').evaluate(d=>d.open),true,'legacy conflict opens «Posición y medidas»');assert.match(await page.locator('#openingLegacy').textContent(),/Ventana · tramo \d+–\d+ mm/);assert.doesNotMatch(await page.locator('#openingLegacy').textContent(),/opn_old-/);
 const b0=applied.openings.find(o=>o.id==='opn_old-b'),a0=applied.openings.find(o=>o.id==='opn_old-a');
 await page.locator('#opening-offsetMm').fill(String(b0.offsetMm-100));assert.match(await page.locator('#openingError').textContent(),/Se solaparía \d+ mm con Ventana · tramo \d+–\d+ mm/);assert.doesNotMatch(await page.locator('#openingError').textContent(),/opn_old-/);
 await page.locator('#opening-offsetMm').fill(String(a0.offsetMm+a0.widthMm));assert.equal(await page.locator('#openingApply').isDisabled(),false);await press('#openingApply');
 const fixed=await proj(page);assert.deepEqual(O.conflicts(fixed),[]);
 assert.deepEqual(fixed.openings.filter(o=>o.id!=='opn_old-b'),applied.openings.filter(o=>o.id!=='opn_old-b'),'correcting one opening leaves the others untouched');

 // 6. Type changes: door → window drops the swing; back to door creates a valid one to review.
 await panelClose();await tapPlan(openingAt(applied,door));assert.equal(await panelShown(),true);
 // «Centrar en el muro» is in «Posición y medidas» and shows equal distances to both ends.
 await press('#openingGroup-measures summary');await press('#openingCentre');
 const cw=await page.evaluate(()=>[Number(document.querySelector('#opening-offsetMm').value),document.querySelector('#openingMargins').textContent]);const mm=cw[1].match(/(\d+) mm junto a A · (\d+) mm junto a B/);assert.ok(mm&&Math.abs(Number(mm[1])-Number(mm[2]))<=1,'centred: '+cw[1]);
 if(await page.locator('#openingDiscard').count())await press('#openingDiscard');assert.equal(await panelShown(),true);
 await page.selectOption('#opening-kind','window');assert.match(await page.locator('#openingPreview').textContent(),/Se elimina el sentido de apertura/);
 assert.deepEqual([await page.locator('#opening-heightMm').inputValue(),await page.locator('#opening-sillHeightMm').inputValue()],['1200','900'],'fields show the values of the new type');
 assert.equal(await page.locator('#openingGroup-measures').evaluate(d=>d.open),true,'group state kept after the type change rebuilds the form');await press('#openingApply');
 assert.equal((await proj(page)).openings.find(o=>o.id===door).swing,undefined);
 await page.selectOption('#opening-kind','door');await press('#openingApply');const back=(await proj(page)).openings.find(o=>o.id===door);
 assert.deepEqual([back.id,back.kind,back.swing,back.source.review],[door,'door',{hinge:'start',side:'left'},'unreviewed']);

 // 7. Add a window from the selected room: only its walls; a tap elsewhere adds nothing.
 const salon=applied.rooms.find(r=>r.name==='Salón');await panelClose();await tapPlan({x:1000,y:2000});assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'room',id:salon.id});
 await panelOpen();const count0=(await proj(page)).openings.length;
 await press('#roomAddWindow');await panelClose();assert.equal(await page.evaluate(()=>FloorPlanOpeningUI.picking()),true);assert.ok(await page.locator('#gSel .opening-pick').count()>=4);
 // The banner says what to do now and offers «Cancelar» (a phone has no Escape).
 await page.locator('#openingPick').waitFor();assert.match(await page.locator('#openingPickTitle').textContent(),/Añadir ventana a «Salón»/);assert.equal(await page.locator('#openingPickCancel').isVisible(),true);
 const bannerBox=await page.locator('#openingPick').boundingBox();assert.ok(bannerBox.y>=0&&bannerBox.y+bannerBox.height<=viewport.height&&bannerBox.x>=0&&bannerBox.x+bannerBox.width<=viewport.width,'banner inside the viewport');
 const before7=JSON.stringify(await proj(page));
 await tapPlan({x:7360,y:1500});assert.equal(JSON.stringify(await proj(page)),before7,'other room wall: nothing added');
 assert.match(await page.locator('#openingPickError').textContent(),/no está sobre un muro verde de «Salón»/);assert.equal(await page.evaluate(()=>FloorPlanOpeningUI.picking()),true,'the person can try again');
 await shot('06a-add-wrong-wall');
 // A tap on the Salón top wall over the existing window: the shared guard refuses it and says why.
 await tapPlan({x:2000,y:-120});assert.equal(JSON.stringify(await proj(page)),before7,'overlap: nothing added');assert.match(await page.locator('#openingPickError').textContent(),/Se solaparía \d+ mm con Ventana · tramo/);
 await press('#openingPickCancel');assert.equal(await page.evaluate(()=>FloorPlanOpeningUI.picking()),false);assert.equal(await page.locator('#openingPick').isHidden(),true);
 assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'room',id:salon.id},'«Cancelar» returns to the room');assert.equal(JSON.stringify(await proj(page)),before7);
 if(!mobile){await press('#roomAddWindow');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>FloorPlanOpeningUI.picking()),false,'Escape also cancels');}
 await panelOpen();await press('#roomAddWindow');await panelClose();await tapPlan({x:-120,y:1500});assert.equal(await panelShown(),true,'the proposal opens the panel');
 assert.match(await page.locator('#openingTitle').textContent(),/Nueva Ventana · vista previa/);await shot('06-add-window-preview');
 // Out of bounds while adjusting the proposal: explained next to the field, «Aplicar» disabled, nothing stored.
 const before8=JSON.stringify(await proj(page));await page.locator('#opening-widthMm').fill('9000');assert.match(await page.locator('#openingError').textContent(),/no cabe/);assert.equal(await page.locator('#openingApply').isDisabled(),true);assert.equal(JSON.stringify(await proj(page)),before8);
 await page.locator('#opening-widthMm').fill('800');assert.equal(await page.locator('#openingApply').isDisabled(),false);
 if(narrow){await press('#openingShowPlan');await press('#fab [data-a=apply]');}else await press('#openingApply');
 const added=await proj(page);assert.equal(added.openings.length,count0+1);const newId=await page.evaluate(()=>ui.sel.id);assert.equal(added.openings.find(o=>o.id===newId).kind,'window');
 assert.ok(O.roomWalls(added,salon.id).some(w=>w.id===added.openings.find(o=>o.id===newId).wallId),'the new window is on a wall of the chosen room');

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
 await page.evaluate(()=>document.querySelector('#fit').click());await page.waitForTimeout(200);await tapPlan(openingAt(added,door));assert.equal(await panelShown(),true);
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
 assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'opening',id:door});await page.waitForTimeout(350);
 assert.equal(await page.evaluate(()=>!document.querySelector('.app').classList.contains('hide-panel')&&(!matchMedia('(max-width:1100px)').matches||document.querySelector('aside.right').classList.contains('open'))),true,'properties open directly');
 assert.match(await page.locator('#opening-id, .opening-id').first().textContent(),/planta activa/);
 const other=(await page.locator('#openingSide input:not(:checked)').getAttribute('value'));await press(`#openingSide input[value=${other}]`);
 if(narrow){await press('#openingShowPlan');await page.screenshot({path:path.join(shots,`${name}-08-building-preview.png`)});await press('#fab [data-a=apply]');}
 else{await page.screenshot({path:path.join(shots,`${name}-08-building-preview.png`)});await press('#openingApply');}
 const b1=await building();
 assert.equal(b1.levels.find(l=>l.order===0).project.openings.find(o=>o.id===door).swing.side,other,'active level changed');
 assert.equal(JSON.stringify(b1.levels.find(l=>l.order===1)),upper0,'the other level is identical');
 // Adding a door from a room of the active level: the new opening belongs to that room and level only.
 const p1=await proj(page),wall=p1.rooms.flatMap(r=>O.roomWalls(p1,r.id).map(w=>({r,w,L:Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y)}))).filter(x=>!p1.openings.some(o=>o.wallId===x.w.id)&&x.L>=1500).sort((a,b)=>b.L-a.L)[0];
 assert.ok(wall,'a free wall to add a door');
 await page.evaluate(id=>{select({kind:'room',id});drawer('panel',true);},wall.r.id);await page.waitForTimeout(400);await press('#roomAddDoor');await page.waitForTimeout(450);
 const mid=await screen(page,{x:(wall.w.start.x+wall.w.end.x)/2,y:(wall.w.start.y+wall.w.end.y)/2});mobile?await page.touchscreen.tap(mid.x,mid.y):await page.mouse.click(mid.x,mid.y);await page.waitForTimeout(300);
 const newId=await page.evaluate(()=>ui.sel?.id);assert.match(await page.locator('#openingTitle').textContent(),/Nueva Puerta abatible/);
 if(narrow){await press('#openingShowPlan');await press('#fab [data-a=apply]');}else await press('#openingApply');
 const b2=await building(),active=b2.levels.find(l=>l.order===0).project,added=active.openings.find(o=>o.id===newId);
 assert.equal(added?.wallId,wall.w.id);assert.equal(O.sides(active,added)[added.swing.side].roomId,wall.r.id,'the door opens into the chosen room');
 assert.equal(JSON.stringify(b2.levels.find(l=>l.order===1)),upper0,'the other level is still identical');
 assert.deepEqual(errors,[]);
});

// Tap priority and keyboard on the example: zoomed out, the 44 px opening target overlaps room names and furniture.
// A tap on a room name or on furniture keeps selecting them; a tap on the wall itself selects the opening.
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`tap priority and keyboard on the example ${viewport.width}x${viewport.height}`,{timeout:300000},async t=>{
 const mobile=viewport.width<1000,narrow=viewport.width<=1100;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const {page,errors}=await open(context);
 const tap=async(x,y)=>{mobile?await page.touchscreen.tap(x,y):await page.mouse.click(x,y);await page.waitForTimeout(200);};
 await page.evaluate(()=>{drawer(null);});await page.waitForTimeout(450);
 // Zoom out so 44 px cover about 1.6 m of plan, centred on the dwelling.
 await page.evaluate(()=>{const r=document.querySelector('#plan').getBoundingClientRect(),g=FloorPlanApp.geometry.bounds;view.s=22/800;view.x0=g.x+g.w/2-r.width/2/view.s;view.y0=g.y+g.h/2-r.height/2/view.s;applyView();});await page.waitForTimeout(250);
 const cases=await page.evaluate(()=>{const screen=q=>{const m=new DOMPoint(q.x,q.y).matrixTransform(document.querySelector('#plan').getScreenCTM());return {x:m.x,y:m.y};};
  const openingUnder=q=>document.elementsFromPoint(q.x,q.y).find(e=>e.matches?.('[data-opening]'));
  const label=labelBoxes.map(b=>({b,s:screen({x:(b.x0+b.x1)/2,y:(b.y0+b.y1)/2})})).find(c=>openingUnder(c.s));
  const furn=state.furniture.map(f=>({f,s:screen({x:f.cx,y:f.cy})})).find(c=>{const o=openingUnder(c.s);if(!o||!document.elementsFromPoint(c.s.x,c.s.y).some(e=>e.closest?.('[data-fid]')))return false;const op=FloorPlanApp.project.openings.find(x=>x.id===o.dataset.opening),w=FloorPlanApp.project.walls.find(x=>x.id===op.wallId);return FloorPlanTracing.segmentPoint({x:c.f.cx,y:c.f.cy},w.start,w.end).distance>w.thicknessMm/2+8/view.s;});
  const o=FloorPlanApp.project.openings.find(x=>x.id==='opn_door-0'),w=FloorPlanApp.project.walls.find(x=>x.id===o.wallId),L=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),tt=(o.offsetMm+o.widthMm/2)/L;
  return {label:label&&{room:label.b.room,...label.s},furn:furn&&{id:furn.f.id,...furn.s},door:screen({x:w.start.x+(w.end.x-w.start.x)*tt,y:w.start.y+(w.end.y-w.start.y)*tt})};});
 assert.ok(cases.label,'a room name lies inside an opening target at this zoom');assert.ok(cases.furn,'a piece of furniture lies inside an opening target at this zoom');
 await tap(cases.label.x,cases.label.y);assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'room',id:cases.label.room},'room name wins');
 await page.evaluate(()=>{select(null);drawer(null);});await page.waitForTimeout(450);
 await tap(cases.furn.x,cases.furn.y);assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'furn',id:cases.furn.id},'furniture wins');
 await page.evaluate(()=>{select(null);drawer(null);});await page.waitForTimeout(450);
 await tap(cases.door.x,cases.door.y);assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'opening',id:'opn_door-0'},'the wall itself selects the opening');
 // Overlapping targets: tapping the centre of an opening selects that opening, not whichever target was drawn last.
 const stacked=await page.evaluate(()=>FloorPlanApp.project.openings.map(o=>{const w=FloorPlanApp.project.walls.find(x=>x.id===o.wallId),L=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),t=(o.offsetMm+o.widthMm/2)/L,m=new DOMPoint(w.start.x+(w.end.x-w.start.x)*t,w.start.y+(w.end.y-w.start.y)*t).matrixTransform(document.querySelector('#plan').getScreenCTM());
  return {id:o.id,x:m.x,y:m.y,n:document.elementsFromPoint(m.x,m.y).filter(e=>e.matches?.('[data-opening]')).length};}).filter(c=>c.n>1&&c.x>0&&c.y>0&&c.x<innerWidth&&c.y<innerHeight));
 assert.ok(stacked.length>0,'some opening targets overlap at this zoom');
 for(const c of stacked.slice(0,4)){await page.evaluate(()=>{select(null);drawer(null);});await page.waitForTimeout(450);await tap(c.x,c.y);assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'opening',id:c.id},`nearest of ${c.n} overlapping targets`);}
 // Keyboard: from the room list an opening opens with focus on its title; «Volver» is the previous stop.
 if(!mobile){
  const room=await page.evaluate(()=>FloorPlanApp.project.rooms.find(r=>r.id==='rom_child').id);await page.evaluate(id=>{select({kind:'room',id});drawer('panel',true);},room);await page.waitForTimeout(350);
  await page.locator('#roomOpenings [data-room-opening]').first().focus();await page.keyboard.press('Enter');await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>ui.sel?.kind),'opening');assert.equal(await page.evaluate(()=>document.activeElement.id),'openingTitle');
  await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'openingBack');
  await page.keyboard.press('Enter');assert.deepEqual(await page.evaluate(()=>ui.sel?.kind),'room');
 }
 assert.deepEqual(errors,[]);
});
