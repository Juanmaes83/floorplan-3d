// Journey orientation (docs/product/journey-orientation-2026-10-21.md): the guide's next action follows the real state
// of the project, its button does the task where it happens, and the phone keeps the selection bar and the plan usable.
// Every test performs visible gestures (clicks; taps on phones) and fails on master e796e3d for the defect it names.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{createServer}=require('node:http'),{chromium}=require('playwright');
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),S=require('./fixtures/stair-conflict-building.cjs');
let server,browser,url,duplex;
const root=path.resolve(__dirname,'..'),shots=process.env.JOURNEY_SHOTS||path.join(root,'docs/qa/artifacts/journey/tests');
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(new URL(req.url,'http://l').pathname==='/'?'/index.html':decodeURIComponent(new URL(req.url,'http://l').pathname)));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||undefined});await fs.mkdir(shots,{recursive:true});
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'journey-test-'));const {entries}=await B.packageEntries(S.build().building,()=>null,T.imageInfo);duplex=path.join(tmp,'duplex.zip');await fs.writeFile(duplex,Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const VIEWPORTS=[{width:1440,height:900},{width:390,height:844},{width:844,height:390}];
async function open(t,viewport,{three=false}={}){
 const narrow=viewport.width<=1100,context=await browser.newContext({viewport,isMobile:narrow,hasTouch:narrow,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED/.test(m.text()))errors.push(m.text());});
 await page.route('https://cdn.jsdelivr.net/**',async r=>{if(!three||!process.env.THREE_LOCAL_DIR)return r.abort();try{await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await require('./helpers/three-module.cjs')(r.request().url(),()=>Promise.reject(Error('no cdn')))});}catch{await r.abort();}});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanGuideUI&&window.FloorPlanBuildPalette);
 const name=`${viewport.width}x${viewport.height}`;
 const press=async(sel,{timeout}={})=>{timeout??=await page.evaluate(()=>FloorPlanApp.viewMode==='3d'||!!window.FloorPlanPresentation?.active)?120000:8000;const l=page.locator(sel).first();await l.waitFor({state:'visible',timeout});await l.scrollIntoViewIfNeeded({timeout});if(narrow)await l.tap({timeout});else await l.click({timeout});await page.waitForTimeout(300);};
 const guide=()=>page.evaluate(()=>{const b=document.querySelector('#guideBar'),t=s=>b.querySelector(s)?.textContent.trim()||'',v=e=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';return {title:t('.guide-current h2'),text:t('.guide-current p'),primary:v(document.querySelector('#guidePrimary'))?document.querySelector('#guidePrimary').textContent.trim():null,secondary:v(document.querySelector('#guideSecondary'))?document.querySelector('#guideSecondary').textContent.trim():null};});
 const project=()=>page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 const closeDrawers=async()=>{for(const [a,toggle] of [['aside.lib','#tgLib'],['aside.right','#tgPanel']])if(await page.evaluate(s=>matchMedia('(max-width:1100px)').matches&&document.querySelector(s).classList.contains('open'),a))await press(toggle);await page.waitForTimeout(400);};
 const firstRoom=async(n='Salón')=>{await press('#welcomeBlank');await page.locator('#roomDesignName').fill(n);await press('#roomDesignReview');await press('#roomDesignConfirm');await page.waitForTimeout(400);await closeDrawers();};
 const upload=async(button,file)=>{const fc=page.waitForEvent('filechooser');await press(button);await (await fc).setFiles(file);};
 const filled=()=>page.evaluate(()=>{const i=document.createElement('i');i.style.color='var(--action)';document.body.append(i);const c=getComputedStyle(i).color;i.remove();return [...document.querySelectorAll('button')].filter(b=>b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden'&&getComputedStyle(b).backgroundColor===c&&!b.closest('dialog:not([open]),[hidden]')).map(b=>b.id||b.textContent.trim());});
 const shot=n=>page.screenshot({path:path.join(shots,`${name}-${n}.png`)});
 return {page,errors,narrow,name,press,guide,project,closeDrawers,firstRoom,upload,filled,shot};
}

for(const viewport of VIEWPORTS)test(`T1/T9/T10 after the first room: doors and windows next, the button opens «Construir», nothing changes by itself ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const c=await open(t,viewport),{page,press,guide}=c;await c.firstRoom();
 let g=await guide();
 assert.doesNotMatch(g.title,/Objetivo completado/,'one room is not the end of the job');
 assert.equal(g.title,'Añade puertas y ventanas');assert.equal(g.primary,'Añadir puertas y ventanas');assert.equal(g.secondary,'Otra estancia');
 assert.equal((await page.evaluate(()=>FloorPlanGuideUI.progress().finished)),true,'the goal earned stays complete');
 assert.match(await page.locator('.guide-goal-done').textContent(),/Objetivo «Crear una distribución» completado/);
 assert.deepEqual(await c.filled(),['guidePrimary'],'a single dominant action');
 await c.shot('t1-next-openings');
 const before=await c.project();await press('#guidePrimary');
 assert.equal(await page.evaluate(()=>FloorPlanBuildPalette.tab),'build');
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'paletteOpening-door','the focus lands on the first opening type');
 assert.equal(await c.project(),before,'a suggestion opens a tool; it changes nothing');
 await c.shot('t1-openings-palette');
 // «Ahora no» puts it off for this project; «Tareas y ayuda» brings it back.
 await c.closeDrawers();await press('#guideLater');g=await guide();assert.equal(g.title,'Amuebla las estancias');assert.equal(g.primary,'Amueblar');
 await press('#guideDetails');await press('#guideRestoreSuggestions');await press('#guideDialogClose');assert.equal((await guide()).title,'Añade puertas y ventanas');
 assert.equal(await c.project(),before);assert.deepEqual(c.errors,[]);
});

for(const viewport of VIEWPORTS)test(`T3 an uploaded image: «Empezar a ajustar» starts calibrating instead of opening the task list ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const c=await open(t,viewport),{page,press,guide}=c;await c.upload('#welcomeUpload',path.join(root,'tests/fixtures/manual-plan.png'));
 await page.waitForFunction(()=>project.sourceImages?.length&&project.sourceImages.every(i=>FloorPlanTraceUI.imageReady(i.id)),null,{timeout:30000});await c.closeDrawers();
 const g=await guide();assert.equal(g.title,'Ajusta y comprueba la escala');assert.equal(g.primary,'Empezar a ajustar','the requirement itself, not «Resolver requisito»');
 await press('#guidePrimary');assert.equal(await page.locator('#guideDialog').evaluate(d=>d.open),false,'no detour through «Tu recorrido»');
 assert.match(await page.locator('#traceStatus').textContent(),/Calibrar: toca dos puntos/);await c.shot('t3-calibrating');assert.deepEqual(c.errors,[]);
});

test('T4 back to the first task and reload: a done task says so and its button goes on with what is left',{timeout:120000},async t=>{
 const c=await open(t,{width:1440,height:900}),{page,press,guide}=c;await press('#welcomeExample');await press('#guideCopyExample');
 for(let i=0;i<5&&await page.evaluate(()=>FloorPlanGuideUI.state().current)!=='start';i++)await press('#guidePrevious');
 const check=async()=>{const g=await guide();assert.equal(g.title,'Ya hecho: Prepara tu proyecto');assert.equal(g.primary,'Seguir con: Revisa la distribución en 3D');assert.notEqual(g.primary,'Volver al inicio');assert.equal(await page.locator('#guidePrevious').isDisabled(),true,'the first task does not leave the editor');};
 await check();await c.shot('t4-done-task');await page.reload();await page.waitForFunction(()=>window.FloorPlanGuideUI);assert.equal(await page.locator('#welcomeDialog').evaluate(d=>d.open),false);await check();
 assert.equal(await page.evaluate(()=>FloorPlanGuideUI.progress().percent),75,'the progress earned is kept');assert.deepEqual(c.errors,[]);
});

for(const viewport of [VIEWPORTS[0],VIEWPORTS[1]])test(`T5/T8 a duplex with conflicts: «Ver conflictos» first; the level switch is in the guided header ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const c=await open(t,viewport),{page,press,guide}=c;await c.upload('#welcomeUpload',duplex);await page.waitForFunction(()=>window.FloorPlanBuildingUI?.context?.levels===2,null,{timeout:60000});await page.waitForTimeout(600);await c.closeDrawers();
 const g=await guide();assert.equal(g.title,'Resuelve los conflictos del edificio');assert.equal(g.primary,'Ver conflictos');assert.match(g.text,/2 conflictos en 2 plantas.*no se puede presentar/);
 assert.equal(await page.locator('#levelBar').isVisible(),true,'a building shows its levels in the guided header');
 await c.shot('t5-conflicts');await press('#guidePrimary');assert.equal(await page.locator('#conflictsDialog').evaluate(d=>d.open),true);assert.deepEqual(c.errors,[]);
});

for(const viewport of [VIEWPORTS[1],VIEWPORTS[2]])test(`T7 phone: a message sits above the selection bar, and the palette cancels a door being placed ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const c=await open(t,viewport),{page,press}=c;await c.firstRoom();
 const box=sel=>page.locator(sel).first().boundingBox();
 // Furniture: the message «Añadido…» appears; it must not cover the selection bar; every button of the bar is on screen.
 await press('#tgLib');await press('#paletteTabFurnish');await page.locator('#furnitureSearch').fill('sofá');await page.waitForTimeout(400);await press('#searchResults .item');
 await page.waitForFunction(()=>document.querySelector('#toast').classList.contains('show')&&document.querySelector('#fab').classList.contains('show'));await page.waitForTimeout(350);
 const [toast,fab]=[await box('#toast'),await box('#fab')];assert.ok(toast.y+toast.height<=fab.y+1,`the message (bottom ${Math.round(toast.y+toast.height)}) sits above the selection bar (top ${Math.round(fab.y)})`);
 await c.shot('t7-message-above-bar');
 const buttons=await page.evaluate(()=>[...document.querySelectorAll('#fab.show button')].map(b=>{const r=b.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {label:b.textContent.trim(),inside:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,hit:!!h&&(h===b||b.contains(h))};}));
 await page.waitForFunction(()=>!document.querySelector('#toast').classList.contains('show'),null,{timeout:10000});
 const after=await page.evaluate(()=>[...document.querySelectorAll('#fab.show button')].map(b=>{const r=b.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {label:b.textContent.trim(),inside:r.left>=0&&r.right<=innerWidth,hit:!!h&&(h===b||b.contains(h))};}));
 // M1: every button of the selection bar is on screen and reachable by touch, without scrolling the bar.
 assert.deepEqual(after.filter(b=>!b.inside||!b.hit).map(b=>b.label),[],'selection bar buttons on screen and not covered');
 assert.ok(buttons.some(b=>/Eliminar/.test(b.label)),'«Eliminar» is part of the bar');
 assert.deepEqual(await page.locator('#fab.show button').evaluateAll(n=>n.map(b=>b.getAttribute('aria-label')||b.textContent.trim())),['Girar a la izquierda','Girar','Duplicar','Eliminar','Propiedades','Listo'],'the six actions keep their names');
 // A door being placed is cancelled when the palette opens, and the person is told.
 // Tap the room in a corner clear of the sofa, so the room becomes the context of the door.
 const corner=await page.evaluate(()=>{const r=FloorPlanApp.project.rooms[0],xs=r.polygon.map(p=>p.x),ys=r.polygon.map(p=>p.y),s=new DOMPoint(Math.min(...xs)+450,Math.min(...ys)+450).matrixTransform(document.querySelector('#plan').getScreenCTM());return {x:s.x,y:s.y};});
 await page.touchscreen.tap(corner.x,corner.y);await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>FloorPlanApp.selection?.kind||ui.sel?.kind),'room');await c.closeDrawers();
 await press('#tgLib');await press('#paletteTabBuild');
 if(!(await page.evaluate(()=>FloorPlanBuildPalette.contextRoom())))assert.fail('the room must be the context');
 await press('#paletteOpening-door');assert.equal(await page.evaluate(()=>FloorPlanOpeningUI.picking()),true);
 await press('#tgLib');assert.equal(await page.evaluate(()=>FloorPlanOpeningUI.picking()),false,'no hidden placing mode behind the palette');
 assert.match(await page.locator('#toast').textContent(),/Se canceló la colocación de la puerta o ventana: no se añadió nada/);
 assert.equal(await page.evaluate(()=>FloorPlanApp.project.openings.length),0);await c.shot('t7-palette-cancels-pick');assert.deepEqual(c.errors,[]);
});

test('T8 guided header: «Rehacer» next to «Deshacer»; the presentation entry is present but not a second dominant action',{timeout:120000},async t=>{
 const c=await open(t,{width:1440,height:900}),{page,press}=c;await c.firstRoom();
 assert.equal(await page.evaluate(()=>document.body.classList.contains('guided')),true);
 assert.equal(await page.locator('#redo').isVisible(),true);assert.equal(await page.locator('#presentationBtn').isVisible(),true);
 assert.deepEqual(await c.filled(),['guidePrimary']);
 await press('#undo');assert.equal(await page.evaluate(()=>FloorPlanApp.project.rooms.length),0);await press('#redo');assert.equal(await page.evaluate(()=>FloorPlanApp.project.rooms.length),1);assert.deepEqual(c.errors,[]);
});

for(const viewport of [VIEWPORTS[0],VIEWPORTS[1]])test(`T2/T6 example: «Construir» first; in 3D no 3D offer and no early «Objetivo completado»; presenting counts as reviewing ${viewport.width}x${viewport.height}`,{timeout:900000},async t=>{
 if(!process.env.THREE_LOCAL_DIR)return t.skip('THREE_LOCAL_DIR is required for 3D');
 const c=await open(t,viewport,{three:true}),{page,press,guide}=c;await press('#welcomeExample');
 await press('#tgLib');assert.equal(await page.evaluate(()=>FloorPlanBuildPalette.tab),'build','the furnished example does not decide the person wants to furnish');await c.closeDrawers();
 let g=await guide();assert.equal(g.primary,'Abrir 3D');
 // Opening 3D keeps SwiftShader busy: the press that starts it gets the long 3D timeout.
 await press('#guidePrimary',{timeout:180000});await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'),null,{timeout:180000});await page.waitForTimeout(800);
 g=await guide();assert.doesNotMatch(g.title,/Objetivo completado/);assert.notEqual(g.primary,'Abrir 3D');assert.notEqual(g.primary,'Ver en 3D');assert.equal(g.primary,'Crear mi copia');
 assert.equal(await page.locator('#modes3d').isVisible(),true,'«Vista aérea / Recorrer» visible in the guided header in 3D');await c.shot('t2-example-3d');
 // Own copy, back to 2D; presenting it reviews this version and marks it as presented.
 await press('#guidePrimary',{timeout:180000});await page.waitForFunction(()=>FloorPlanGuideUI.state().kind==='own');
 if(await page.evaluate(()=>FloorPlanApp.viewMode==='3d')){await press('#viewSeg [data-view="2d"]');await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d',null,{timeout:180000});}
 await press('button:visible:has-text("Presentar mi vivienda")');await page.locator('#presentationConfig[open]').waitFor();await press('#presentationConfig .presentation-config-actions .btn');
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay')?.dataset.moving==='false',null,{timeout:300000});
 await press('#presentationClose');await page.waitForFunction(()=>!FloorPlanPresentation.active&&!document.body.classList.contains('presentation-exiting'),null,{timeout:300000});await page.waitForTimeout(800);
 g=await guide();assert.notEqual(g.primary,'Abrir 3D','a presented home is not asked to be opened in 3D');assert.notEqual(g.primary,'Ver en 3D');
 // Recorded apart from the guide entry, which a presentation restores exactly.
 const ev=await page.evaluate(()=>{const all=JSON.parse(localStorage.getItem('rubik-sota-journey-v1')||'{}'),r=FloorPlanGuide.revision(FloorPlanApp.project);return Object.values(all).some(e=>e.presented===r);});assert.equal(ev,true,'this version is recorded as presented');
 await c.shot('t6-after-presenting');assert.deepEqual(c.errors,[]);
});

test('T11 phone guide (M4): one row of controls, every control on screen, more plan visible; desktop header keeps one line and one presentation entry',{timeout:180000},async t=>{
 const c=await open(t,{width:390,height:844}),{page}=c;await c.firstRoom();
 const g=await page.evaluate(()=>{const b=document.querySelector('#guideBar').getBoundingClientRect(),ids=['guidePrevious','guideGoalChange','guideDetails','guideCompact','guideClose'];return {h:b.height,ctl:ids.map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,top:Math.round(r.top),inside:r.left>=0&&r.right<=innerWidth&&r.width>0,name:document.getElementById(id).textContent.trim()};})};});
 assert.ok(g.h<=170,`guide height ${Math.round(g.h)} px ≤ 170 (master: 217)`);
 assert.deepEqual(g.ctl.filter(x=>!x.inside).map(x=>x.id),[]);assert.equal(new Set(g.ctl.map(x=>x.top)).size,1,'one row of controls');
 assert.equal(g.ctl[0].name,'← Paso anterior','the previous-step button keeps its name');await c.shot('t11-phone-guide');
 const d=await open(t,{width:1440,height:900});await d.press('#welcomeExample');await d.page.waitForTimeout(500);
 assert.ok(await d.page.evaluate(()=>document.querySelector('header').getBoundingClientRect().height)<=80,'guided header stays on one line');
 assert.equal(await d.page.locator('button:visible',{hasText:'Presentar mi vivienda'}).count(),1,'one presentation entry at a time');
 assert.deepEqual([...c.errors,...d.errors],[]);
});

// Every guided-header control stays on screen at 1440x900, also in 3D, where «Vista aérea / Recorrer» joins the header.
// Before, «Propiedades», «Proyectos» and the language were left past the right edge (header 158 px too wide).
test('T12 guided header keeps every control on screen in 2D, 3D and with two levels 1440x900',{timeout:300000},async t=>{
 if(!process.env.THREE_LOCAL_DIR)return t.skip('THREE_LOCAL_DIR is required for 3D');
 const c=await open(t,{width:1440,height:900},{three:true}),{page,press}=c;await press('#welcomeExample');await page.waitForTimeout(500);
 const off=()=>page.evaluate(()=>{const h=document.querySelector('header');return {overflow:h.scrollWidth-h.clientWidth,height:Math.round(h.getBoundingClientRect().height),off:[...h.querySelectorAll('button,input,select')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.left<-1;}).map(e=>e.id||e.textContent.trim())};});
 const flat=await off();assert.deepEqual(flat.off,[]);assert.ok(flat.height<=80,`2D header on one line (${flat.height} px)`);
 await press('#viewSeg [data-view="3d"]',{timeout:180000});await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'),null,{timeout:180000});await page.waitForTimeout(800);
 const three=await off();assert.deepEqual(three.off,[],`3D ${JSON.stringify(three)}`);assert.ok(three.overflow<=0,`3D header overflow ${three.overflow}`);
 assert.equal(await page.locator('#modes3d').isVisible(),true);await c.shot('t12-header-3d');
 // A building in 2D: the level switch joins the header.
 const d=await open(t,{width:1440,height:900});await d.upload('#welcomeUpload',duplex);await d.page.waitForFunction(()=>window.FloorPlanBuildingUI?.context?.levels===2,null,{timeout:60000});await d.page.waitForTimeout(500);
 assert.equal(await d.page.locator('#levelBar').isVisible(),true);
 const lv=await d.page.evaluate(()=>{const h=document.querySelector('header');return {overflow:h.scrollWidth-h.clientWidth,off:[...h.querySelectorAll('button,input,select')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.left<-1;}).map(e=>e.id||e.textContent.trim())};});
 assert.deepEqual(lv.off,[],`levels ${JSON.stringify(lv)}`);assert.ok(lv.overflow<=0,`levels header overflow ${lv.overflow}`);
 assert.deepEqual([...c.errors,...d.errors],[]);
});

// A duplex with conflicts: the card asks to resolve them and the highlighted stage is «Distribuir», where the layout is
// fixed, not «Revisar y guardar».
test('T13 building conflicts highlight «Distribuir» 1440x900',{timeout:180000},async t=>{
 const c=await open(t,{width:1440,height:900}),{page,guide}=c;await c.upload('#welcomeUpload',duplex);
 await page.waitForFunction(()=>window.FloorPlanBuildingUI?.context?.levels===2,null,{timeout:60000});await page.waitForTimeout(500);
 const g=await guide();assert.equal(g.primary,'Ver conflictos');
 assert.equal(await page.evaluate(()=>document.querySelector('#guideBar [aria-current="step"] .step-label')?.textContent),'Distribuir');
 assert.deepEqual(c.errors,[]);
});
