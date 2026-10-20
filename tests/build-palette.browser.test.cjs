// Creation palette of the left column («Construir» / «Amueblar»), end to end at 1440×900, 390×844 and 844×390. It
// only reuses existing actions: tools stay in step with the toolbar; a room example opens «Nueva estancia» with that
// name (unique) and no new data; the four contract opening kinds are added to the room of the selection; wall drawing
// shows a banner and «Terminar» leaves no mode taking taps; the stair goes to «Plantas…»; 3D asks for the 2D plan.
// Undo, reload, keyboard tabs, no horizontal scroll and no console errors.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.env.PALETTE_SHOTS||null;
let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});if(shots)await fs.mkdir(shots,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`creation palette ${viewport.width}x${viewport.height}`,{timeout:420000},async t=>{
 const mobile=viewport.width<1000,name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 // three.js from THREE_LOCAL_DIR when set (the CDN is unreachable here), so the 3D note is really exercised.
 await page.route('https://cdn.jsdelivr.net/**',async r=>{if(!process.env.THREE_LOCAL_DIR)return r.abort();try{await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await require('./helpers/three-module.cjs')(r.request().url(),()=>Promise.reject(Error('no cdn')))});}catch{await r.abort();}});
 await page.goto(url);await require('./editor-fixture.cjs')(page);
 const press=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();if(mobile)await l.tap();else await l.click();await page.waitForTimeout(200);};
 const openPalette=async tab=>{await page.evaluate(()=>drawer('lib',true));await page.waitForTimeout(400);if(tab)await press(tab==='build'?'#paletteTabBuild':'#paletteTabFurnish');};
 const tapWorld=async q=>{const s=await page.evaluate(p=>{const m=new DOMPoint(p.x,p.y).matrixTransform(document.querySelector('#plan').getScreenCTM());return {x:m.x,y:m.y};},q);if(mobile)await page.touchscreen.tap(s.x,s.y);else await page.mouse.click(s.x,s.y);await page.waitForTimeout(300);};
 const shot=async id=>{if(shots)await page.screenshot({path:path.join(shots,`${name}-${id}.png`)});};
 const state=()=>page.evaluate(()=>({tool:ui.tool,trace:FloorPlanTraceUI.mode(),picking:FloorPlanOpeningUI.picking(),rooms:FloorPlanApp.project.rooms.length,openings:FloorPlanApp.project.openings.length,walls:FloorPlanApp.project.walls.length,undo:undoStack.length,hScroll:document.documentElement.scrollWidth>innerWidth+1,libOpen:document.querySelector('aside.lib').classList.contains('open')}));

 // The example (with rooms) opens on «Amueblar»; a new blank project (no rooms) switches to «Construir».
 await openPalette();assert.equal(await page.evaluate(()=>FloorPlanBuildPalette.tab),'furnish','example with rooms: «Amueblar»');
 await page.evaluate(()=>drawer(null));await page.waitForTimeout(350);
 await press('#newProjectBtn');await page.fill('#newProjectName','Prueba de paleta');await press('#newProjectBlank');await page.locator('#roomDesignCancel').first().click();
 // Tabs follow ARIA and the arrow keys.
 assert.equal(await page.evaluate(()=>FloorPlanApp.project.rooms.length),0);await openPalette();
 assert.equal(await page.evaluate(()=>FloorPlanBuildPalette.tab),'build','no rooms: «Construir»');
 assert.equal(await page.locator('#paletteTabBuild').getAttribute('aria-selected'),'true');assert.equal(await page.locator('#paletteFurnish').isHidden(),true);
 await page.locator('#paletteTabBuild').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.id),'paletteTabFurnish');assert.equal(await page.locator('#furnitureSearch').isVisible(),true,'«Amueblar» is the existing library');
 await page.keyboard.press('ArrowLeft');assert.equal(await page.evaluate(()=>FloorPlanBuildPalette.tab),'build');
 // Only the four contract kinds are offered; no stair types, exterior or third level.
 assert.deepEqual(await page.locator('#paletteBuild .palette-grid[aria-label="Tipos de hueco"] .palette-action').allTextContents(),['Puerta abatible','Puerta corredera','Ventana','Hueco de paso']);
 assert.equal(await page.locator('aside.lib').getByText(/Exterior|Escalera en U|caracol|3F/).count(),0,'no unsupported capability is offered');
 await shot('01-build-empty');
 // The primary action keeps white-on-dark contrast ≥ 4.5:1 under hover (a generic `.btn:hover` used to repaint it beige).
 if(!mobile)await page.hover('#paletteNewRoom');
 const contrast=await page.evaluate(()=>{const [r,g,b]=getComputedStyle(document.querySelector('#paletteNewRoom')).backgroundColor.match(/\d+/g).map(Number).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;});return 1.05/(.2126*r+.7152*g+.0722*b+.05);});
 assert.ok(contrast>=4.5,`«Nueva estancia» contrast ${contrast.toFixed(2)}`);

 // Tools stay in step with the toolbar both ways.
 await press('#paletteTool-measure');assert.equal((await state()).tool,'measure');assert.equal(await page.locator('#tools [data-tool=measure]').evaluate(b=>b.classList.contains('on')),true);
 if(mobile)assert.equal((await state()).libOpen,false,'the drawer closes to show the plan');
 await page.evaluate(()=>setTool('select'));await openPalette();assert.equal(await page.locator('#paletteTool-select').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#paletteTool-measure').getAttribute('aria-pressed'),'false');

 // A room example only suggests the name (unique), through the existing dialog and history.
 await press('[data-room-name="Cocina"]');await page.locator('#roomDesignForm').waitFor();assert.equal(await page.locator('#roomDesignName').inputValue(),'Cocina');
 await page.fill('#roomDesignWidth','4000');await page.fill('#roomDesignDepth','3000');await press('#roomDesignReview');await page.locator('#roomDesignConfirm:not([disabled])').waitFor();await press('#roomDesignConfirm');await page.waitForTimeout(300);
 const s1=await state();assert.equal(s1.rooms,1);assert.equal(await page.evaluate(()=>FloorPlanApp.project.rooms[0].name),'Cocina');
 assert.deepEqual(Object.keys(await page.evaluate(()=>FloorPlanApp.project.rooms[0])).sort(),['countsTowardArea','floorMaterialId','id','labelAt','name','polygon','source'].sort(),'no room type stored');
 await openPalette();await press('#paletteMoreNames summary');await press('[data-room-name="Cocina"]');assert.equal(await page.locator('#roomDesignName').inputValue(),'Cocina 2','a repeated example gets a number');await page.locator('#roomDesignCancel').first().click();
 const room=await page.evaluate(()=>FloorPlanApp.project.rooms[0]),xs=room.polygon.map(p=>p.x),ys=room.polygon.map(p=>p.y),box={x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)};

 // Openings: without a room nothing starts and the palette says why; with the room selected, each kind is added.
 await page.evaluate(()=>{select(null);});await openPalette('build');await press('#paletteOpening-window');
 assert.equal((await state()).picking,false,'no hidden pick mode without a room');assert.match(await page.locator('#paletteOpeningContext').textContent(),/toca antes en el plano la estancia/);
 const walls=[{x:(box.x0+box.x1)/2,y:box.y1+120,kind:'door'},{x:box.x0+700,y:box.y0-120,kind:'sliding-door'},{x:box.x1-800,y:box.y0-120,kind:'window'},{x:box.x0-120,y:(box.y0+box.y1)/2,kind:'opening'}];
 await page.evaluate(id=>select({kind:'room',id}),room.id);
 for(const w of walls){
  await openPalette('build');assert.match(await page.locator('#paletteOpeningContext').textContent(),/Se añadirá a «Cocina»/);
  await press(`#paletteOpening-${w.kind}`);assert.equal((await state()).picking,true);
  const label=await page.evaluate(k=>FloorPlanOpenings.LABEL[k],w.kind);assert.equal(await page.locator('#openingPickTitle').textContent(),`Añadir ${label.toLowerCase()} a «Cocina»`);
  if(w.kind==='window')await shot('02-opening-pick');
  await tapWorld(w);await page.locator('#openingApply:not([disabled])').waitFor();await press('#openingApply');await page.waitForTimeout(300);
  const added=await page.evaluate(()=>FloorPlanApp.project.openings.at(-1));assert.equal(added.kind,w.kind);assert.equal('swing' in added,w.kind==='door','only a hinged door has a swing');
 }
 assert.equal((await state()).openings,4);
 // The selection is now the last opening: its room still receives the next one (no «← Estancia» first).
 await openPalette('build');assert.match(await page.locator('#paletteOpeningContext').textContent(),/«Cocina»/);
 await page.evaluate(()=>{undoStack.length&&$('#undo').click();});await page.waitForTimeout(200);assert.equal((await state()).openings,3,'undo removes the last one');
 await page.evaluate(()=>$('#redo').click());await page.waitForTimeout(200);assert.equal((await state()).openings,4);

 // Wall drawing: visible banner; «Terminar» leaves no mode, so the next tap selects as usual.
 await page.evaluate(()=>select(null));await openPalette('build');await press('#paletteWall');
 assert.equal((await state()).trace,'wall');assert.equal(await page.locator('#paletteWallBanner').isVisible(),true);await shot('03-wall');
 const before=(await state()).walls;await tapWorld({x:box.x1+1500,y:box.y0});await tapWorld({x:box.x1+1500,y:box.y1});assert.equal((await state()).walls,before+1,'wall added');
 await press('#paletteWallDone');assert.equal((await state()).trace,'navigate');assert.equal(await page.locator('#paletteWallBanner').isHidden(),true);
 await tapWorld({x:(box.x0+box.x1)/2,y:(box.y0+box.y1)/2});assert.equal(await page.evaluate(()=>ui.sel?.kind),'room','after «Terminar» a tap selects again');

 // Stair: one level → the note explains it needs two; the button opens «Plantas…».
 await openPalette('build');assert.match(await page.locator('#paletteStairNote').textContent(),/une dos plantas: añade la segunda/);
 await press('#paletteStair');assert.equal(await page.locator('#levelsDialog[open]').count(),1);await page.keyboard.press('Escape');await page.waitForTimeout(200);

 // 3D: the build groups give way to a note with a way back to the plan.
 const has3D=await page.evaluate(()=>!!window.View3D);if(process.env.THREE_LOCAL_DIR)assert.equal(has3D,true,'3D available with local three.js');
 if(has3D){await page.evaluate(()=>setView('3d'));await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'),null,{timeout:60000});await openPalette('build');assert.equal(await page.locator('#palette3dNote').isVisible(),true);assert.equal(await page.locator('#paletteBuild .palette-group').first().isHidden(),true);
  await press('#palettePlan2d');await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d'&&!document.body.classList.contains('busy'),null,{timeout:60000});}

 // Reload keeps the project; layout fits the screen; no console errors.
 const stored=await page.evaluate(()=>JSON.stringify([FloorPlanApp.project.rooms,FloorPlanApp.project.openings,FloorPlanApp.project.walls]));
 await page.reload();await require('./editor-fixture.cjs')(page).catch(()=>{});await page.waitForTimeout(500);
 assert.equal(await page.evaluate(()=>JSON.stringify([FloorPlanApp.project.rooms,FloorPlanApp.project.openings,FloorPlanApp.project.walls])),stored);
 await openPalette('build');const layout=await page.evaluate(()=>{const a=document.querySelector('aside.lib').getBoundingClientRect(),b=document.querySelector('#paletteNewRoom').getBoundingClientRect(),t=document.querySelector('#paletteTabBuild').getBoundingClientRect();return {hScroll:document.documentElement.scrollWidth>innerWidth+1,inside:b.left>=a.left-1&&b.right<=a.right+1,tabTop:t.top>=0&&t.bottom<=innerHeight};});
 assert.deepEqual(layout,{hScroll:false,inside:true,tabTop:true});await shot('04-after-reload');
 assert.deepEqual(errors,[]);
});
