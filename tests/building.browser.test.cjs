// First multi-level cut, end to end from the UI at 1440×900, 390×844 and 844×390: create a two-level building,
// add rooms on each level, align, add a straight stair, switch levels (pointer and keyboard), per-level
// undo/redo, 3D stacking, reload, JSON/ZIP export and re-import, a tampered ZIP, level export, a level from an
// image, single-level consumers and a single-level project left untouched.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{execFile}=require('node:child_process'),{chromium}=require('playwright');
const Core=require('../js/project-core.js'),B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js');
const root=path.resolve(__dirname,'..'),KEY='rubik-sota-project-library-v1',shots='docs/qa/artifacts/multilevel';
let server,browser,url;const cache=new Map();
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':file.endsWith('.wasm')?'application/wasm':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(shots,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const curl=target=>new Promise((resolve,reject)=>execFile('curl',['--fail','--silent','--show-error','--max-time','30',target],{maxBuffer:20e6},(e,out)=>e?reject(e):resolve(out)));
async function setup(context){
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push('pageerror: '+e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();let p=cache.get(target);if(!p){p=require('./helpers/three-module.cjs')(target,()=>curl(target));cache.set(target,p);}
  try{await route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await p});}catch{await route.abort();}});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanBuildingUI&&window.View3D);await require('./editor-fixture.cjs')(page);return {page,errors};
}
const digest=v=>require('node:crypto').createHash('sha256').update(typeof v==='string'?v:B.canonical(v)).digest('hex');
const lib=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const ctx=page=>page.evaluate(()=>FloorPlanBuildingUI.context);
const press=async(page,locator,mobile)=>{const l=page.locator(locator);await l.scrollIntoViewIfNeeded();if(mobile)await l.tap();else await l.click();};
async function download(page,trigger){const pending=page.waitForEvent('download');await trigger();const d=await pending,chunks=[];for await(const c of await d.createReadStream())chunks.push(c);return {name:d.suggestedFilename(),bytes:Buffer.concat(chunks)};}
async function addRoom(page,mobile,{name,width,depth,x,y,neighbor}){
 await press(page,'#newRoomBtn',mobile);await page.locator('#roomDesignForm').waitFor();
 await page.fill('#roomDesignName',name);await page.fill('#roomDesignWidth',String(width));await page.fill('#roomDesignDepth',String(depth));
 if(neighbor){await page.selectOption('#roomDesignPlacement',{label:neighbor});await page.fill(neighbor.startsWith('A la derecha')?'#roomDesignDepth':'#roomDesignWidth',String(neighbor.startsWith('A la derecha')?depth:width));}
 else{await page.fill('#roomDesignX',String(x));await page.fill('#roomDesignY',String(y));}
 await press(page,'#roomDesignReview',mobile);await page.locator('#roomDesignConfirm:not([disabled])').waitFor();await press(page,'#roomDesignConfirm',mobile);
 await page.waitForFunction(n=>FloorPlanApp.project.rooms.some(r=>r.name===n),name);
}
async function openLevels(page,mobile){await press(page,'#levelsBtn',mobile);await page.locator('#levelsDialog[open]').waitFor();}
async function closeLevels(page,mobile){await press(page,'#levelsClose',mobile);await page.locator('#levelsDialog:not([open])').waitFor({state:'attached'});}

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`multi-level first cut end to end ${viewport.width}x${viewport.height}`,{timeout:900000},async t=>{
 const mobile=viewport.width<1000,name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,acceptDownloads:true});t.after(()=>context.close());
 const {page,errors}=await setup(context),shot=async step=>{if(mobile&&!step.includes('levels')&&!step.includes('note')&&!step.includes('variants')&&!step.includes('export'))await page.evaluate(()=>{if(document.querySelector('aside.right')?.classList.contains('open'))document.querySelector('#tgPanel').click();});await page.waitForTimeout(300);await page.screenshot({path:`${shots}/${name}-${step}.png`});};

 // 1. A single-level project from the UI: blank plan with two rooms.
 await press(page,'#newProjectBtn',mobile);await page.fill('#newProjectName','Casa prueba');await press(page,'#newProjectBlank',mobile);
 await page.locator('#roomDesignForm').waitFor();await page.locator('#roomDesignCancel').first().click();
 await addRoom(page,mobile,{name:'Cocina',width:4000,depth:2400,x:400,y:400});
 await addRoom(page,mobile,{name:'Estar',width:3000,depth:2400,neighbor:'A la derecha de Cocina'});
 const single=await lib(page),singleId=single.activeId,singleBefore=JSON.stringify(single.entries.find(e=>e.id===singleId));
 assert.equal(await page.locator('#levelBar').isHidden(),true,'single-level project shows no level bar');

 // 2. Create a building with an empty second level; the single-level entry is untouched.
 await openLevels(page,mobile);await shot('01-levels-single');await press(page,'#levelCreateEmpty',mobile);
 await page.waitForFunction(()=>FloorPlanBuildingUI.context?.levels===2);await closeLevels(page,mobile);
 let data=await lib(page);assert.equal(digest(JSON.stringify(data.entries.find(e=>e.id===singleId))),digest(singleBefore),'1.x entry byte-identical');
 const entry=data.entries.find(e=>e.id===data.activeId);assert.equal(entry.kind,'building');assert.equal(entry.building.levels.length,2);
 assert.equal((await ctx(page)).levelName,'Planta primera');
 const levelButtons=page.locator('#levelBar [data-level]');assert.equal(await levelButtons.count(),2);
 assert.equal(await levelButtons.nth(1).getAttribute('aria-pressed'),'true');assert.equal(await levelButtons.nth(0).getAttribute('aria-pressed'),'false');
 assert.equal(await page.locator('#levelBar').getAttribute('aria-label'),'Planta activa');

 // 3. Upper level: a bedroom; then align it with an offset and add a straight stair.
 await addRoom(page,mobile,{name:'Dormitorio',width:4400,depth:2400,x:400,y:400});
 await openLevels(page,mobile);
 await page.fill('#levelOffsetX-1','2600');await press(page,'#levelApply-1',mobile);
 await page.waitForFunction(()=>FloorPlanApp.levelContext&&JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).entries.find(e=>e.kind==='building').building.levels[1].offsetMm.x===2600);
 assert.match(await page.locator('.level-alignment').first().textContent(),/2 de 4 muros tienen un muro debajo/);
 await page.fill('#stairX','4900');await page.fill('#stairY','2100');await page.fill('#stairRotation','0');await page.fill('#stairWidth','900');await page.fill('#stairRun','2400');await page.fill('#stairRisers','14');
 assert.match(await page.locator('#stairDerived').textContent(),/Desnivel 3100 mm · contrahuella 221 mm.*no se comprueban contra ninguna normativa/);
 await press(page,'#stairSave',mobile);await page.waitForFunction(()=>JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).entries.find(e=>e.kind==='building').building.stairs.length===1);
 assert.match(await page.locator('#levelAreas').textContent(),/«Planta baja» 16,80 m² · «Planta primera» 10,56 m² · total 27,36 m²/);
 const warnings=await page.locator('#levelWarnings li').evaluateAll(l=>l.map(x=>x.dataset.code));assert.deepEqual(warnings,['BW3','BW4']);
 await page.locator('#levelWarnings').scrollIntoViewIfNeeded();await shot('02-levels-building');await closeLevels(page,mobile);
 // Upper plan: the void outline of the stair and the dimmed lower level as reference.
 assert.equal(await page.locator('#gStairs .level-stair-to').count(),1);assert.match(await page.locator('#gStairs .level-stair-label').textContent(),/Hueco de escalera/);
 assert.ok(await page.locator('#gLevelGhost .level-ghost-wall').count()>=7,'lower level drawn as reference');
 await page.locator('#fit').click().catch(()=>{});await shot('03-upper-2d');

 // 4. Per-level history: each level keeps its own undo/redo; undoing on one never touches the other.
 const building=()=>lib(page).then(d=>d.entries.find(e=>e.kind==='building').building);
 const hash=p=>B.canonical(p);
 let b=await building();let lowerHash=hash(b.levels[0].project);const eq=(a,b2,m)=>assert.equal(digest(a),digest(b2),m);
 await addRoom(page,mobile,{name:'Baño',width:1800,depth:2400,neighbor:'A la derecha de Dormitorio'});
 b=await building();eq(hash(b.levels[0].project),lowerHash,'editing the upper level leaves the lower one byte-identical');
 let upperHash=hash(b.levels[1].project);
 await levelButtons.nth(0).focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>FloorPlanBuildingUI.context.order===0);
 assert.equal(await levelButtons.nth(0).getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('#undo').isDisabled(),true,'the ground level has no history of its own yet in this building');
 assert.equal(await page.locator('#gStairs .level-stair-from').count(),1);assert.equal(await page.locator('#gStairs .level-stair-tread').count(),13);
 assert.equal(await page.locator('#gLevelGhost *').count(),0,'no level below the ground floor');
 await shot('04-lower-2d');
 await addRoom(page,mobile,{name:'Aseo',width:4000,depth:1500,neighbor:'Debajo de Cocina'});
 b=await building();eq(hash(b.levels[1].project),upperHash,'editing the lower level leaves the upper one byte-identical');lowerHash=hash(b.levels[0].project);
 await press(page,'#undo',mobile);await page.waitForFunction(()=>!FloorPlanApp.project.rooms.some(r=>r.name==='Aseo'));
 b=await building();eq(hash(b.levels[1].project),upperHash,'undo on the lower level does not touch the upper one');
 assert.equal(await page.locator('#undo').isDisabled(),true,'lower history holds only its own edit');
 await press(page,'#redo',mobile);await page.waitForFunction(()=>FloorPlanApp.project.rooms.some(r=>r.name==='Aseo'));
 b=await building();eq(hash(b.levels[0].project),lowerHash);
 await levelButtons.nth(1).focus();await page.keyboard.press('Space');await page.waitForFunction(()=>FloorPlanBuildingUI.context.order===1);
 assert.equal(await page.locator('#undo').isDisabled(),false,'upper history restored after switching back');
 await press(page,'#undo',mobile);await page.waitForFunction(()=>!FloorPlanApp.project.rooms.some(r=>r.name==='Baño'));
 b=await building();eq(hash(b.levels[0].project),lowerHash,'undo on the upper level does not touch the lower one');
 await press(page,'#redo',mobile);await page.waitForFunction(()=>FloorPlanApp.project.rooms.some(r=>r.name==='Baño'));
 b=await building();eq(hash(b.levels[1].project),upperHash);

 // 5. 3D: stacked levels, slab opening equal to the stair footprint, stair of 14 steps reaching the upper floor.
 await press(page,'#viewSeg [data-view="3d"]',mobile);await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d');
 await page.waitForFunction(()=>View3D.levelInspect().levels.length===2,null,{timeout:120000});
 let info=await page.evaluate(()=>View3D.levelInspect());
 assert.equal(info.stairs.length,1);assert.equal(info.stairs[0].steps,14);assert.ok(Math.abs(info.stairs[0].y+3.1)<1e-9,'stair starts on the ground floor (3.1 m below the active upper level)');
 assert.ok(Math.abs(info.stairs[0].top)<1e-6,'stair top reaches the upper floor level');assert.equal(info.activeFloorHoles,1,'upper floor cut by the stair opening');
 assert.ok(Math.abs(info.groundY+3.115)<1e-9);assert.equal(info.levelGroups.length,1);assert.ok(Math.abs(info.levelGroups[0].y+3.1)<1e-9);
 await press(page,'#vIso',mobile);await page.waitForTimeout(2500);await shot('05-3d-upper');
 await levelButtons.nth(0).click();await page.waitForFunction(()=>FloorPlanBuildingUI.context.order===0);
 await page.waitForFunction(()=>View3D.levelInspect().levels.length===1);info=await page.evaluate(()=>View3D.levelInspect());
 assert.equal(info.view,'active');assert.equal(info.levelGroups.length,0,'upper level hidden when viewing up to the active level');assert.equal(info.activeCeilingHoles,1);
 await press(page,'#levelViewAll',mobile);await page.waitForFunction(()=>View3D.levelInspect().view==='all'&&View3D.levelInspect().levelGroups.length===1);
 info=await page.evaluate(()=>View3D.levelInspect());assert.ok(Math.abs(info.levelGroups[0].y-3.1)<1e-9);assert.equal(info.voids,2);
 await page.waitForTimeout(2500);await shot('06-3d-all');
 await press(page,'#viewSeg [data-view="2d"]',mobile);await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d');

 // 6. Reload: the building, its active level and both levels come back.
 const beforeReload=await building();await page.reload();await page.waitForFunction(()=>window.FloorPlanBuildingUI&&window.View3D);
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open))await page.locator('#welcomeActionInput').press('Escape');
 assert.equal(digest(await building()),digest(beforeReload),'reload restores the building byte-identical');assert.equal((await ctx(page))?.levels,2);

 // 7. Export: whole building JSON (menu) and ZIP; level export as a valid 1.x with a warning.
 await page.locator('details.menu summary').click();const json=await download(page,()=>page.locator('#exportJson').click());
 const exported=B.prepare(json.bytes.toString('utf8'));assert.equal(digest(exported),digest(beforeReload));
 await openLevels(page,mobile);const zip=await download(page,()=>press(page,'#buildingExportZip',mobile));
 const entries=await P.unzip(zip.bytes.buffer.slice(zip.bytes.byteOffset,zip.bytes.byteOffset+zip.bytes.length),{check:B.packagePath,required:'building.json',maxEntries:B.MAX_ENTRIES,jsonNames:['building.json','manifest.json']});
 const pkg=await B.readEntries(entries,T.imageInfo);assert.equal(pkg.building.id,beforeReload.id);
 const level=await download(page,()=>press(page,'#levelExport-1',mobile));const levelProject=JSON.parse(level.bytes.toString('utf8'));
 Core.validate(levelProject,{strict:true});assert.equal(digest(levelProject),digest(beforeReload.levels[1].project));
 assert.match(await page.locator('#levelsError').textContent(),/Se exporta sólo «Planta primera».*escalera/);await shot('07-level-export');await closeLevels(page,mobile);

 // 8. Re-import the building JSON (new entry, open one kept) and a tampered ZIP (rejected, nothing changes).
 const tmp=await fs.mkdtemp(path.join(require('node:os').tmpdir(),'bld-ui-'));await fs.writeFile(path.join(tmp,'edificio.json'),json.bytes);
 const count=(await lib(page)).entries.length;await page.locator('#fileIn').setInputFiles(path.join(tmp,'edificio.json'));
 await page.waitForFunction(n=>JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).entries.length===n+1,count);
 data=await lib(page);const imported=data.entries.find(e=>e.id===data.activeId);assert.equal(imported.kind,'building');assert.equal(digest(imported.building.levels),digest(beforeReload.levels));
 const tampered=new Map([...entries].map(([k,v])=>[k,new Uint8Array(v)]));const b2=JSON.parse(new TextDecoder().decode(tampered.get('building.json')));b2.stairs[0].toLevelId='lvl_missing';tampered.set('building.json',new TextEncoder().encode(JSON.stringify(b2)));
 await fs.writeFile(path.join(tmp,'manipulado.zip'),Buffer.from(await P.zip(tampered,{check:B.packagePath}).arrayBuffer()));
 const raw=await page.evaluate(k=>localStorage.getItem(k),KEY);await page.locator('#uploadIn').setInputFiles(path.join(tmp,'manipulado.zip'));
 await page.waitForFunction(()=>/missing level reference lvl_missing/.test(document.body.innerText),null,{timeout:30000});
 assert.equal(digest(await page.evaluate(k=>localStorage.getItem(k),KEY)),digest(raw),'tampered ZIP leaves the collection byte-identical');
 // The genuine ZIP imports with verified per-level images.
 await fs.writeFile(path.join(tmp,'edificio.zip'),zip.bytes);await page.locator('#uploadIn').setInputFiles(path.join(tmp,'edificio.zip'));
 await page.waitForFunction(n=>JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).entries.length===n+2,count);

 // 9. Single-level consumers name the active level: presentation, sheet and variant comparison.
 await press(page,'#presentationBtn',mobile);await page.locator('#presentationConfig[open]').waitFor();
 assert.match(await page.locator('#presentationLevelNote').textContent(),/Presentación de una planta: «Planta baja» del edificio .*Las demás plantas y la escalera no se incluyen/);
 await shot('08-presentation-note');await page.keyboard.press('Escape');await page.locator('#presentationConfig:not([open])').waitFor({state:'attached'});
 await page.locator('details.menu summary').click();await page.locator('#openSheet').click();await page.locator('#sheetDialog[open]').waitFor();
 assert.match(await page.locator('#sheetTitle').textContent(),/Lámina de la planta «Planta baja» · edificio/);await page.locator('#sheetClose').click();
 await press(page,'#projectsBtn',mobile);await page.locator('#projectsDialog[open]').waitFor();await press(page,'#projectVariant',mobile);
 await page.waitForFunction(()=>/Variante 1/.test(JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).entries.find(e=>e.id===JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).activeId).name));
 data=await lib(page);const variant=data.entries.find(e=>e.id===data.activeId);assert.equal(variant.kind,'building');assert.equal(variant.building.levels.length,2);assert.ok(variant.variantOf);
 await press(page,'#projectCompare',mobile);await page.locator('#variantsDialog[open]').waitFor();
 const titles=await page.locator('#variantsCards .variant-card h3').allTextContents();assert.equal(titles.length,2);assert.ok(titles.every(x=>/· Planta baja/.test(x)),titles.join(' | '));
 await shot('09-variants-building');await press(page,'#variantsClose',mobile);
 await press(page,'#projectsBtn',mobile);await page.selectOption('#projectList',singleId);await press(page,'#projectOpen',mobile);
 await page.waitForFunction(()=>!FloorPlanBuildingUI.context);assert.equal(await page.locator('#levelBar').isHidden(),true);
 data=await lib(page);assert.equal(digest(JSON.stringify(data.entries.find(e=>e.id===singleId))),digest(singleBefore),'1.x entry still byte-identical at the end');
 await press(page,'#viewSeg [data-view="3d"]',mobile);await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d');await page.waitForTimeout(1500);
 info=await page.evaluate(()=>View3D.levelInspect());assert.equal(info.children,0,'no building geometry for a single-level project');assert.ok(Math.abs(info.groundY+.015)<1e-9);
 await shot('10-single-level-3d');await press(page,'#viewSeg [data-view="2d"]',mobile);

 // 10. A level from an image through the existing upload flow (single project → new building).
 await openLevels(page,mobile);await page.locator('#levelImageIn').setInputFiles(path.join(root,'tests/fixtures/manual-plan.png'));
 await page.waitForFunction(()=>FloorPlanBuildingUI.context?.levels===2&&FloorPlanApp.project.sourceImages?.length===1,null,{timeout:60000});
 await page.waitForFunction(()=>/Plano cargado como nueva planta del edificio/.test(document.querySelector('#toast').textContent+' '+document.body.innerText),null,{timeout:30000});
 data=await lib(page);const fromImage=data.entries.find(e=>e.id===data.activeId);assert.equal(fromImage.building.levels[1].project.sourceImages[0].mediaType,'image/png');
 assert.equal(digest(JSON.stringify(data.entries.find(e=>e.id===singleId))),digest(singleBefore));await shot('11-level-from-image');
 // 11. A level from a PDF through the same flow (another building from the untouched 1.x project).
 await press(page,'#projectsBtn',mobile);await page.selectOption('#projectList',singleId);await press(page,'#projectOpen',mobile);await page.waitForFunction(()=>!FloorPlanBuildingUI.context);
 await openLevels(page,mobile);await page.locator('#levelImageIn').setInputFiles(path.join(root,'tests/fixtures/intake/plan-one-page.pdf'));
 await page.waitForFunction(()=>FloorPlanBuildingUI.context?.levels===2&&FloorPlanApp.project.sourceImages?.length===1,null,{timeout:120000});
 await page.waitForFunction(()=>/PDF página 1 de 1.*Plano cargado como nueva planta del edificio/.test(document.querySelector('#toast').textContent),null,{timeout:30000});
 data=await lib(page);assert.equal(data.entries.find(e=>e.id===data.activeId).building.levels[1].project.sourceImages[0].mediaType,'image/png');
 assert.equal(digest(JSON.stringify(data.entries.find(e=>e.id===singleId))),digest(singleBefore));await shot('12-level-from-pdf');
 await fs.rm(tmp,{recursive:true});
 assert.deepEqual(errors,[]);
});
