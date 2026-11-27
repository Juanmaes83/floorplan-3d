const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const FX=path.join(__dirname,'fixtures/intake');
let server,browser,url;
before(async()=>{
 const root=path.resolve(__dirname,'..');
 server=createServer(async(req,res)=>{
  try{const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
   if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
   res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':'text/html');res.end(await readFile(file));
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
});
after(async()=>{await browser?.close();await new Promise(resolve=>server?.close(resolve));});
async function pageFor(t){
 const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true,locale:'es-ES'});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(process.env.BASE_URL||url);await require('./editor-fixture.cjs')(page);return {page,errors};
}
const state=page=>page.evaluate(()=>{const p=FloorPlanApp.project;return {id:p.id,name:p.name,walls:p.walls.length,openings:p.openings.length,images:(p.sourceImages||[]).map(i=>({mediaType:i.mediaType,w:i.widthPx,h:i.heightPx,sha:i.sha256}))};});
async function upload(page,file,wait){const before=(await state(page)).id;await page.locator('#uploadIn').setInputFiles(file);if(wait!==false)await page.waitForFunction(id=>FloorPlanApp.project.id!==id&&!document.body.classList.contains('uploading'),before,{timeout:30000});return state(page);}
const toastText=page=>page.locator('#toast').textContent();

for(const [width,height] of [[1440,900],[820,1180],[390,844],[844,390]]){
 test(`OP-04 UX keeps join and contextual undo reachable in the guide at ${width}×${height}`,async t=>{
  const context=await browser.newContext({viewport:{width,height},locale:'es-ES',hasTouch:width<=1100,isMobile:width<=1100,reducedMotion:'reduce'});
  t.after(()=>context.close());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto(url);
  const file=path.join(FX,'roomplan-capturedroom.json');
  const [first]=await Promise.all([page.waitForEvent('filechooser'),page.locator('#welcomeUpload').click()]);
  await first.setFiles(file);
  await page.waitForFunction(()=>!document.querySelector('#welcomeDialog').open&&FloorPlanApp.project.name==='roomplan-capturedroom'&&!document.body.classList.contains('uploading'));
  const model=()=>page.evaluate(()=>({entry:FloorPlanApp.entryId,project:FloorPlanApp.project,depth:[undoStack.length,redoStack.length]}));
  const hit=id=>page.locator('#'+id).evaluate(el=>{
   const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
   const {width,height,offsetLeft,offsetTop}=visualViewport;
   return r.height>=44&&x>offsetLeft&&x<offsetLeft+width&&y>offsetTop&&y<offsetTop+height&&el.contains(document.elementFromPoint(x,y));
  });
  const before=await model(),quick=page.locator('#roomPlanJoinQuick');
  assert.ok(await page.locator('body.guided').count());
  await openPerlaImport(page);
  assert.ok(await hit('roomPlanJoinQuick'),'join is in the visible toolbar before scrolling');
  const [scan]=await Promise.all([page.waitForEvent('filechooser'),quick.click()]);
  await scan.setFiles(file);
  const dialog=page.locator('#roomPlanJoinDialog[open]');
  await dialog.waitFor();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'roomPlanFixedDoor');
  assert.match(await dialog.locator('#roomPlanFixedDoor option').first().textContent(),/Estancia 1.*900 mm/);
  assert.deepEqual(await dialog.locator('svg text').allTextContents(),['A','B']);
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  await page.waitForFunction(()=>(document.activeElement.id==='roomPlanJoinQuick'||document.activeElement.parentElement?.id==='perlaImport'||document.activeElement.parentElement?.id==='perlaProjectMenu'/* §9: el menú que contiene «Unir escaneo» */)&&!document.body.classList.contains('uploading'));
  assert.deepEqual(await model(),before);

  await page.locator('#actionSearchBtn').click();
  const search=page.locator('#editorActionInput');
  await search.fill('unir escaneo');
  await search.press('ArrowDown');
  assert.ok(await search.getAttribute('aria-activedescendant'));
  const [found]=await Promise.all([page.waitForEvent('filechooser'),search.press('Enter')]);
  await found.setFiles(file);
  await dialog.waitFor();
  if(process.env.ROOMPLAN_UX_EVIDENCE)await page.screenshot({path:path.join(process.env.ROOMPLAN_UX_EVIDENCE,`dialog-${width}x${height}.png`)});
  await page.locator('#roomPlanJoinApply').click();
  const receipt=page.locator('#roomPlanJoinResult');
  await receipt.waitFor();
  const joined=await model();
  assert.deepEqual(joined.depth,[1,0]);assert.equal(joined.entry,before.entry);
  assert.equal(joined.project.rooms.length,2);assert.equal(joined.project.scale.confidence,'estimated');
  assert.equal(await page.locator('#gRooms [data-roomplan-added]').count(),1);
  assert.ok(await hit('roomPlanUndoJoin'),'undo action is visible and unobscured without auto-scroll');
  assert.ok(await receipt.evaluate(e=>e.getBoundingClientRect().bottom<=document.querySelector('#stage').getBoundingClientRect().top+1),'feedback is outside the stage');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'roomPlanUndoJoin');
  assert.match(await page.locator('#roomPlanJoinAnnouncement').textContent(),/Escaneo unido.*Deshacer unión disponible/);
  if(process.env.ROOMPLAN_UX_EVIDENCE)await page.screenshot({path:path.join(process.env.ROOMPLAN_UX_EVIDENCE,`joined-${width}x${height}.png`)});
  await page.keyboard.press('Enter');
  await receipt.waitFor({state:'hidden'});
  assert.deepEqual(await model(),{...before,depth:[0,1]});
  assert.match(await toastText(page),/Unión deshecha/);
  const redo=page.locator('#redo');
  if(!(await redo.isVisible()))await page.locator('#perlaMore > summary').click();
  await redo.click();
  assert.deepEqual(await model(),joined);
  assert.match(await toastText(page),/Unión rehecha/);
  await page.reload();
  await page.waitForFunction(()=>FloorPlanApp.project.walls.length===8);
  assert.deepEqual(await model(),{...joined,depth:[0,0]});
  assert.equal(await receipt.isVisible(),false);
  assert.deepEqual(errors,[]);
 });
}

async function reviewPage(t,width,height){
 const context=await browser.newContext({viewport:{width,height},locale:'es-ES',isMobile:width<=1100,hasTouch:width<=1100,reducedMotion:'reduce'});
 t.after(()=>context.close());
 const page=await context.newPage();
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{
  const asset=route.request().url().split('/three@0.160.0/')[1];
  await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await readFile(path.join(__dirname,'../vendor/three',asset))});
 });
 await page.goto(url);
 await require('./editor-fixture.cjs')(page);
 return page;
}
async function openPerlaImport(page){
 // §9: las formas de importar o empezar viven en el menú de proyecto (#perlaProjectMenu); #perlaImport queda oculto.
 const menu=page.locator('#perlaProjectMenu');
 if(await menu.count()&&await menu.getAttribute('open')===null)await menu.locator(':scope > summary').click();
}
const joinFile=path.join(FX,'roomplan-capturedroom.json');
const joinSnapshot=page=>page.evaluate(()=>({
 entry:FloorPlanApp.entryId,view:FloorPlanApp.viewMode,project:FloorPlanApp.project,
 history:[undoStack.length,redoStack.length],stored:localStorage.getItem('rubik-sota-project-library-v1')
}));
async function openJoin(page){
 await openPerlaImport(page);
 const quick=page.locator('#roomPlanJoinQuick');
 const [chooser]=await Promise.all([page.waitForEvent('filechooser'),quick.click()]);
 await chooser.setFiles(joinFile);
 const dialog=page.locator('#roomPlanJoinDialog[open]');
 await dialog.waitFor();
 return dialog;
}
for(const [width,height,view] of [[1440,900,'3d'],[820,1180,'2d'],[390,844,'2d'],[844,390,'3d']]){
 test(`OP-04 diagnoses the reference home block in ${view} at ${width}×${height}`,async t=>{
  const page=await reviewPage(t,width,height);
  if(view==='3d'){
   await page.locator('#viewSeg [data-view="3d"]').click();
   await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&document.querySelector('#view3d canvas')?.width>0);
  }
  const before=await joinSnapshot(page),dialog=await openJoin(page),status=dialog.getByRole('status');
  await status.getByText('Ninguna pareja compatible').waitFor();
  const select=dialog.locator('#roomPlanFixedDoor'),selected=select.locator('option:checked');
  assert.equal(await select.locator('option:disabled').count(),7);
  assert.match(await selected.textContent(),/Puerta 6 · Salón · 890 mm · \(4700, 8755\)/);
  assert.match(await dialog.locator('#roomPlanMovingDoor option:checked').textContent(),/900 mm · \(2000, 1000\)/);
  assert.match(await status.textContent(),/vista previa marca el solapamiento.*planta actual no ha cambiado/i);
  assert.equal(await status.getAttribute('aria-atomic'),'true');
  const confirm=dialog.getByRole('button',{name:'Unión no disponible'});
  assert.equal(await confirm.isDisabled(),true);
  assert.equal(await confirm.getAttribute('aria-describedby'),'roomPlanJoinStatus');
  assert.equal(await dialog.getByRole('img',{name:/vista previa bloqueada/i}).isVisible(),true);
  for(const side of ['moving','fixed'])assert.ok(await dialog.locator(`svg polygon[data-conflict="${side}"]:visible`).count());
  assert.equal(await dialog.locator('#roomPlanConflictLegend').isVisible(),true);
  const access=dialog.locator('#assistantAccess');
  assert.equal(await access.evaluate(node=>getComputedStyle(node).position),'static');
  assert.match(await dialog.locator('#roomPlanJoinFloor').textContent(),/Vivienda de ejemplo/);
  if(process.env.ROOMPLAN_UX_EVIDENCE)await dialog.screenshot({path:path.join(process.env.ROOMPLAN_UX_EVIDENCE,`blocked-${width}x${height}.png`)});
  assert.equal(await dialog.getByRole('button',{name:'Importar como proyecto independiente'}).isEnabled(),true);
  await dialog.getByText('Cómo elegir las puertas').click();
  assert.match(await dialog.locator('#roomPlanRejectedDoors').textContent(),/Comunica varias estancias/);
  assert.deepEqual(await joinSnapshot(page),before);
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  assert.deepEqual(await joinSnapshot(page),before);
 });
}

test('OP-04 finds a compatible alternative, retains the scan on replacement error and only writes on confirmation',async t=>{
 const page=await reviewPage(t,390,844);
 const roomPlan=JSON.parse(fs.readFileSync(joinFile,'utf8')),otherDoor=structuredClone(roomPlan.doors[0]);
 otherDoor.identifier='d2';otherDoor.transform[14]=3;roomPlan.doors.push(otherDoor);
 await upload(page,{name:'dos-puertas.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(roomPlan))});
 let dialog=await openJoin(page);
 await dialog.getByRole('button',{name:'Unir a esta planta'}).click();
 await dialog.waitFor({state:'hidden'});
 const blockedBefore=await joinSnapshot(page);
 dialog=await openJoin(page);
 const suggestion=dialog.getByRole('button',{name:'Ver pareja compatible'}),confirm=()=>dialog.locator('#roomPlanJoinApply');
 await suggestion.waitFor();
 assert.equal(await confirm().isDisabled(),true);
 const [replacement]=await Promise.all([page.waitForEvent('filechooser'),dialog.getByRole('button',{name:'Elegir otro escaneo'}).click()]);
 await replacement.setFiles({name:'dañado.json',mimeType:'application/json',buffer:Buffer.from('{"incompleto":')});
 await dialog.getByRole('status').getByText('El archivo nuevo no se pudo abrir').waitFor();
 assert.match(await dialog.locator('#roomPlanJoinFile').textContent(),/roomplan-capturedroom.json/);
 assert.deepEqual(await joinSnapshot(page),blockedBefore);
 await suggestion.click();
 assert.equal(await confirm().isEnabled(),true);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'roomPlanJoinApply');
 assert.equal(await dialog.locator('svg [data-conflict]').count(),0);
 const doors=dialog.locator('#roomPlanFixedDoor'),first=await doors.locator('option').first().getAttribute('value');
 await doors.selectOption(first);
 assert.equal(await confirm().isDisabled(),true);
 assert.deepEqual(await joinSnapshot(page),blockedBefore);
 await suggestion.click();await confirm().click();await dialog.waitFor({state:'hidden'});
 const after=await joinSnapshot(page);
 assert.equal(after.entry,blockedBefore.entry);
 assert.deepEqual(after.project.walls.slice(0,blockedBefore.project.walls.length),blockedBefore.project.walls);
 assert.equal(after.project.rooms.length,3);
 assert.equal(after.history[0],blockedBefore.history[0]+1);
});

test('OP-04 shows a safe recovery when the scan has no eligible doors',async t=>{
 const page=await reviewPage(t,390,844),before=await joinSnapshot(page);
 const scan=JSON.parse(fs.readFileSync(joinFile,'utf8'));scan.doors=[];
 await page.locator('#roomPlanJoinIn').setInputFiles({name:'sin-puertas.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(scan))});
 const dialog=page.locator('#roomPlanJoinDialog[open]');
 await dialog.getByRole('status').getByText('No hay puertas elegibles').waitFor();
 assert.equal(await dialog.locator('#roomPlanMovingDoor').isDisabled(),true);
 assert.equal(await dialog.locator('#roomPlanJoinApply').isDisabled(),true);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'roomPlanReplace');
 assert.equal(await dialog.locator('#roomPlanJoinPreview').isVisible(),false);
 assert.deepEqual(await joinSnapshot(page),before);
 const [replacement]=await Promise.all([page.waitForEvent('filechooser'),dialog.getByRole('button',{name:'Elegir otro escaneo'}).click()]);
 await replacement.setFiles(joinFile);
 await dialog.getByRole('status').getByText('Ninguna pareja compatible').waitFor();
 assert.equal(await dialog.locator('#roomPlanJoinPreview').isVisible(),true);
 await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
 await dialog.waitFor({state:'hidden'});
 assert.deepEqual(await joinSnapshot(page),before);
});

test('OP-04 imports a blocked scan as a separate project only after explicit choice',async t=>{
 const page=await reviewPage(t,1440,900),before=await joinSnapshot(page),dialog=await openJoin(page);
 await dialog.getByRole('status').getByText('Ninguna pareja compatible').waitFor();
 assert.deepEqual(await joinSnapshot(page),before);
 await dialog.getByRole('button',{name:'Importar como proyecto independiente'}).click();
 await dialog.waitFor({state:'hidden'});
 const after=await joinSnapshot(page);
 assert.notEqual(after.entry,before.entry);
 assert.equal(after.project.rooms.length,1);
 const original=await page.evaluate(id=>library.all().find(entry=>entry.id===id).project,before.entry);
 assert.deepEqual(original,before.project);
});

test('OP-04 UX keeps the mobile properties dock reachable when opening all tools',async t=>{
 for(const [width,height] of [[390,844],[820,1180],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},locale:'es-ES',hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  try{
   const page=await context.newPage();
   await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
   await page.goto(url);
   await page.locator('#welcomeActionInput').press('Escape');
   const tasks=page.locator('#perlaTasks');if(await tasks.count()&&await tasks.getAttribute('aria-expanded')==='false')await tasks.click();
   await page.locator('#guideDetails').click();
   await page.locator('#guideAllTools').click();
   const panel=page.locator('#tgPanel');
   const visible=await panel.evaluate(button=>{
    const {width,height,offsetLeft,offsetTop}=visualViewport;
    const r=button.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
    return innerWidth===width&&x>offsetLeft&&x<offsetLeft+width&&y>offsetTop&&y<offsetTop+height
      &&button.contains(document.elementFromPoint(x,y));
   });
   assert.ok(visible,'Properties must remain tappable without scrolling at '+width+'×'+height);
   await panel.tap();
   assert.equal(await page.locator('aside.right.open').count(),0);
  }finally{await context.close();}
 }
});

test('OP-04 UX dismisses the original undo action after an edit or project switch',async t=>{
 const {page,errors}=await pageFor(t),file=path.join(FX,'roomplan-capturedroom.json');
 const model=()=>page.evaluate(()=>({entry:FloorPlanApp.entryId,project:FloorPlanApp.project,depth:[undoStack.length,redoStack.length]}));
 const join=async()=>{
  await page.locator('#roomPlanJoinIn').setInputFiles(file);
  await page.locator('#roomPlanJoinDialog[open] #roomPlanJoinApply').click();
  await page.locator('#roomPlanUndoJoin').waitFor();
 };
 const stale=()=>page.evaluate(()=>document.getElementById('roomPlanUndoJoin').click());
 await upload(page,file);await join();
 await page.evaluate(()=>FloorPlanApp.applyCeiling(project=>{
  project.rooms[0].name='Estancia revisada';
  return {ok:true,project};
 }));
 const edited=await model();
 assert.equal(edited.project.rooms[0].name,'Estancia revisada');assert.deepEqual(edited.depth,[2,0]);
 assert.equal(await page.locator('#roomPlanUndoJoin').isVisible(),false);
 await stale();assert.deepEqual(await model(),edited);
 await page.locator('#undo').click();
 assert.equal(await page.locator('#roomPlanUndoJoin').isVisible(),false,'undoing the later edit does not revive the old action');
 await upload(page,file);await join();
 await upload(page,file);
 const imported=await model();
 assert.deepEqual(imported.depth,[0,0]);assert.equal(imported.project.rooms.length,1);
 assert.equal(await page.locator('#roomPlanUndoJoin').isVisible(),false);
 await stale();assert.deepEqual(await model(),imported);
 assert.deepEqual(errors,[]);
});

test('OP-04 previews a RoomPlan door join without writing, commits once and reopens on the same entry',async t=>{
 const {page,errors}=await pageFor(t),file=path.join(FX,'roomplan-capturedroom.json');
 await upload(page,file);
 const snapshot=()=>page.evaluate(()=>({entry:FloorPlanApp.entryId,project:FloorPlanApp.project}));
 const before=await snapshot();
 await page.locator('details.menu summary').click();
 await openPerlaImport(page);const chooser=page.waitForEvent('filechooser');await (await require('./helpers-perla-editor.cjs').mostrar(page,'#joinRoomPlan')).click();await (await chooser).setFiles(file);
 const dialog=page.locator('#roomPlanJoinDialog[open]');await dialog.waitFor();
 const preview=dialog.locator('#roomPlanJoinPreview');
 assert.ok(await preview.isVisible(),'aligned scan preview is visible');
 assert.equal(await preview.locator('circle').count(),2);
 assert.equal(await preview.locator('circle:visible').count(),2);
 assert.ok(await preview.locator('line[stroke="#b24c25"]').count()>0,'the aligned scan is drawn in orange');
 if(process.env.ROOMPLAN_JOIN_SCREENSHOT)await dialog.screenshot({path:process.env.ROOMPLAN_JOIN_SCREENSHOT});
 assert.deepEqual(await snapshot(),before);
 await dialog.getByRole('button',{name:'Cancelar'}).click();
 await page.waitForFunction(()=>!document.body.classList.contains('uploading'));
 assert.deepEqual(await snapshot(),before);
 await page.locator('#roomPlanJoinIn').setInputFiles(file);await dialog.waitFor();
 await dialog.locator('#roomPlanJoinApply').click();
 await page.waitForFunction(count=>FloorPlanApp.project.walls.length===count,before.project.walls.length*2);
 const joined=await snapshot();assert.equal(joined.entry,before.entry);
 assert.equal(joined.project.rooms.length,before.project.rooms.length*2);assert.equal(joined.project.scale.confidence,'estimated');
 await page.locator('#undo').click();assert.deepEqual(await snapshot(),before);
 await page.locator('#redo').click();assert.deepEqual(await snapshot(),joined);
 await page.reload();await page.waitForFunction(count=>FloorPlanApp.project.walls.length===count,joined.project.walls.length);
 assert.deepEqual(await snapshot(),joined);assert.deepEqual(errors,[]);
});

test('a single visible "Subir plano" control shares the picker with File, retaining explicit JSON access',async t=>{
 const {page,errors}=await pageFor(t);
 // §9 · menú de proyecto: UNA entrada visible para subir («Subir plano o proyecto…», #pmUpload) que acciona el mismo selector que
 // #uploadPlanBtn/#importImage (conservan id y manejador, ocultos); «Importar proyecto JSON» sigue accesible en ese menú.
 assert.equal(await page.locator('#uploadPlanBtn').count(),1);assert.equal(await page.locator('#importJson').count(),1);assert.equal(await page.locator('#importImage').count(),1);
 await page.locator('#perlaProjectMenu > summary').click();
 assert.match(await page.locator('#pmUpload').innerText(),/Subir plano o proyecto/);assert.ok(await page.locator('#pmUpload').isVisible());
 assert.equal(await page.locator('#perlaProjectMenu').evaluate(m=>[...m.querySelectorAll('button')].filter(b=>b.getClientRects().length&&/Subir plano/.test(b.textContent)).length),1,'una sola entrada visible para subir');
 assert.match(await page.locator('#perlaProjectMenu').innerText(),/Importar proyecto JSON/);
 const picker=page.waitForEvent('filechooser');await page.locator('#pmUpload').click();assert.equal(await (await picker).element().getAttribute('id'),'uploadIn');
 assert.match(await page.locator('#uploadPlanHelp').textContent(),/PDF.*HEIC.*DXF/);
 const accept=await page.locator('#uploadIn').getAttribute('accept');for(const ext of ['.pdf','.heic','.tif','.dxf','.json','.zip'])assert.ok(accept.includes(ext),ext);
 await page.locator('#langBtn').click();assert.equal((await page.locator('#uploadPlanBtn').textContent()).trim(),'Upload a floor plan');
 assert.deepEqual(errors,[]);
});
test('raster, scan and document formats become a new calibratable project',{timeout:180000},async t=>{
 const {page,errors}=await pageFor(t);
 const original=fs.readFileSync(path.join(__dirname,'fixtures/manual-plan.png')),png=await upload(page,{name:'plano-sin-extension',mimeType:'',buffer:original});
 assert.equal(png.images[0].mediaType,'image/png');assert.equal(png.images[0].sha,crypto.createHash('sha256').update(original).digest('hex'),'native PNG keeps its original bytes');
 for(const [file,w,h]of [['plan.heic',480,320],['plan.tif',480,320],['plan.bmp',480,320],['plan.gif',480,320],['plan-mirrored.jpg',480,320],['plan-exif.png',480,320],['plan.svg',4000,2667],['scan-9000px.png',8000,533]]){
  const s=await upload(page,path.join(FX,file));assert.equal(s.images.length,1,file);assert.deepEqual([s.images[0].w,s.images[0].h],[w,h],file);assert.ok(['image/png','image/jpeg'].includes(s.images[0].mediaType),file);
  assert.match(await toastText(page),/Calibra con una cota conocida/,file);
 }
 const pdf=await upload(page,path.join(FX,'plan-one-page.pdf'));assert.deepEqual([pdf.images[0].w,pdf.images[0].h],[2000,1333]);assert.match(await toastText(page),/PDF página 1 de 1 a 300 ppp/);
 const header=await page.locator('#subtitle').textContent();assert.match(header,/^Superficie útil aprox\. 0(\.00)? m² · Unidades: mm$/);assert.equal(await page.locator('.plan-meta').isVisible(),false);
 assert.deepEqual(errors,[]);
});
test('multi-page PDF asks for the page and cancelling keeps the current project',{timeout:60000},async t=>{
 const {page,errors}=await pageFor(t),before=await state(page);
 await page.locator('#uploadIn').setInputFiles(path.join(FX,'plan-two-pages.pdf'));await page.waitForSelector('#uploadPdfPage[open]');
 assert.match(await page.locator('#uploadPdfInfo').textContent(),/2 páginas/);await page.locator('#uploadPdfPage button[value="cancel"]').click();
 await page.waitForFunction(()=>!document.body.classList.contains('uploading'));assert.deepEqual(await state(page),before);assert.match(await toastText(page),/cancelada/);
 await page.locator('#uploadIn').setInputFiles(path.join(FX,'plan-two-pages.pdf'));await page.waitForSelector('#uploadPdfPage[open]');await page.fill('#uploadPdfNumber','2');await page.locator('#uploadPdfOk').click();
 await page.waitForFunction(id=>FloorPlanApp.project.id!==id&&!document.body.classList.contains('uploading'),before.id);const s=await state(page);assert.deepEqual([s.images[0].w,s.images[0].h],[1333,2000]);
 assert.deepEqual(errors,[]);
});
test('DXF and RoomPlan produce measured walls; JSON projects still import; DWG and empty IFC get clear messages',{timeout:60000},async t=>{
 const {page,errors}=await pageFor(t);
 const dxf=await upload(page,{name:'cad.bin',mimeType:'',buffer:fs.readFileSync(path.join(FX,'vivienda-mm.dxf'))});assert.equal(dxf.walls,5);assert.equal(dxf.images.length,0);assert.match(await toastText(page),/DXF importado en mm: 5 muros \(5 con grosor medido\)/);
 const scan=await upload(page,path.join(FX,'roomplan-capturedroom.json'));assert.equal(scan.walls,4);assert.equal(scan.openings,2);assert.match(await toastText(page),/RoomPlan importado/);
 const example=require('../docs/contracts/examples/floorplan-project-v1.example.json'),json=await upload(page,{name:'proyecto.txt',mimeType:'text/plain',buffer:Buffer.from(JSON.stringify(example))});assert.equal(json.id,example.id);
 for(const [file,message]of [['plan.dwg',/DWG \(AutoCAD 2018 o posterior\).*Guardar como › DXF/],['plan.ifc',/no contiene muros/]]){
  const before=await state(page);await page.locator('#uploadIn').setInputFiles(path.join(FX,file));await page.waitForFunction(()=>!document.body.classList.contains('uploading'));
  assert.match(await toastText(page),message,file);assert.deepEqual(await state(page),before,file);
 }
 await page.locator('#uploadIn').setInputFiles({name:'roto.json',mimeType:'application/json',buffer:Buffer.from('{"walls": [')});await page.waitForFunction(()=>!document.body.classList.contains('uploading'));assert.match(await toastText(page),/JSON no es válido/);
 assert.deepEqual(errors,[]);
});
test('drag and drop uploads the first file and keeps explicit JSON and ZIP exports',{timeout:60000},async t=>{
 const {page,errors}=await pageFor(t),before=await state(page);
 const pdf=[...fs.readFileSync(path.join(FX,'plan-one-page.pdf'))];
 const overlay=await page.evaluate(bytes=>{const dt=new DataTransfer();dt.items.add(new File([new Uint8Array(bytes)],'plano.pdf',{type:'application/pdf'}));document.dispatchEvent(new DragEvent('dragenter',{dataTransfer:dt,bubbles:true}));const shown=document.querySelector('#dropOverlay').classList.contains('show');document.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true}));return shown;},pdf);
 assert.ok(overlay);await page.waitForFunction(id=>FloorPlanApp.project.id!==id&&!document.body.classList.contains('uploading'),before.id,{timeout:30000});
 assert.equal(await page.locator('#dropOverlay').evaluate(n=>n.classList.contains('show')),false);assert.equal((await state(page)).images.length,1);
 await page.locator('details.menu summary').click();const pending=page.waitForEvent('download');await page.locator('#exportJson').click();const dl=await pending;assert.match(dl.suggestedFilename(),/\.json$/);
 const zipPending=page.waitForEvent('download');await page.evaluate(()=>FloorPlanTraceUI.exportZip());const zip=await zipPending;assert.equal(zip.suggestedFilename(),'proyecto-plano.zip');
 assert.deepEqual(errors,[]);
});

test('DXF, IFC and RoomPlan produce doors, windows and named rooms on their walls',{timeout:120000},async t=>{
 const {page,errors}=await pageFor(t);
 const dxf=await upload(page,path.join(FX,'vivienda-dos-estancias.dxf'));assert.equal(dxf.walls,5);assert.equal(dxf.openings,3);assert.match(await toastText(page),/5 muros \(5 con grosor medido\), 2 puertas, 1 ventana y 2 estancias/);
 assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.rooms.map(r=>r.name)),['SALÓN','DORMITORIO']);
 const ifc=await upload(page,path.join(FX,'vivienda.ifc'));assert.equal(ifc.walls,5);assert.equal(ifc.openings,3);assert.match(await toastText(page),/IFC importado: 5 muros, 2 puertas, 1 ventana y 2 estancias \(de los espacios IfcSpace\)/);
 assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.openings.filter(o=>o.kind==='window').map(o=>[o.widthMm,o.sillHeightMm])),[[1200,900]]);
 const scan=await upload(page,path.join(FX,'roomplan-real-structure.json'));assert.equal(scan.walls,5);assert.equal(scan.openings,3);
 assert.deepEqual((await page.evaluate(()=>FloorPlanApp.project.rooms.map(r=>r.name))).sort(),['Dormitorio','Salón']);
 assert.deepEqual(errors,[]);
});
test('vector PDF offers measured walls at the detected scale or a calibratable image',{timeout:120000},async t=>{
 const {page,errors}=await pageFor(t);let before=(await state(page)).id;
 await page.locator('#uploadIn').setInputFiles(path.join(FX,'plano-vectorial-1-50.pdf'));await page.waitForSelector('#uploadPdfMode[open]');
 assert.equal(await page.inputValue('#uploadPdfScale'),'50');assert.match(await page.locator('#uploadPdfModeInfo').textContent(),/1:50 detectada/);
 const button=await page.locator('#uploadPdfVector').evaluate(b=>{const c=getComputedStyle(b);return [c.color,c.backgroundColor];});assert.notEqual(button[0],button[1],'primary button text is visible');
 await page.click('#uploadPdfVector');await page.waitForFunction(id=>FloorPlanApp.project.id!==id&&!document.body.classList.contains('uploading'),before);
 const vector=await state(page);assert.equal(vector.walls,5);assert.equal(vector.openings,3);assert.equal(vector.images.length,0);assert.match(await toastText(page),/escala 1:50\): 5 muros, 2 puertas, 1 ventana y 2 estancias/);
 before=vector.id;await page.locator('#uploadIn').setInputFiles(path.join(FX,'plano-doble-linea-1-100.pdf'));await page.waitForSelector('#uploadPdfMode[open]');
 assert.match(await page.locator('#uploadPdfModeInfo').textContent(),/no indicada/);await page.click('#uploadPdfRaster');
 await page.waitForFunction(id=>FloorPlanApp.project.id!==id&&!document.body.classList.contains('uploading'),before);const raster=await state(page);assert.equal(raster.images.length,1);assert.equal(raster.walls,0);
 assert.deepEqual(errors,[]);
});
test('raster plan detection needs calibration, then proposes walls, gaps and rooms that can be undone',{timeout:120000},async t=>{
 const {page,errors}=await pageFor(t);await upload(page,path.join(FX,'plano-raster-20mm-px.png'));
 await page.click('#detectPlan');await page.waitForFunction(()=>/Calibra la escala/.test(document.querySelector('#toast').textContent));assert.equal((await state(page)).walls,0);
 await page.evaluate(()=>{const im=FloorPlanApp.project.sourceImages[0],q=structuredClone(FloorPlanApp.project);FloorPlanTracing.calibrate(q,im.id,{x:40,y:40},{x:400,y:40},7200);FloorPlanTracing.verify(q,{x:40,y:190},{x:400,y:190},7200);FloorPlanTracing.confirm(q);FloorPlanApp.importProject(q);});
 await page.click('#detectPlan');await page.waitForFunction(()=>FloorPlanApp.project.walls.length>0);
 const p=await page.evaluate(()=>FloorPlanApp.project);assert.equal(p.walls.length,5);assert.equal(p.openings.length,3);assert.equal(p.rooms.length,2);
 assert.deepEqual(p.walls.map(w=>w.thicknessMm).sort(),[100,200,200,200,200]);assert.ok([...p.walls,...p.openings,...p.rooms].every(x=>x.source.method==='suggested'&&x.source.review==='unreviewed'));
 assert.match(await toastText(page),/5 muros, 3 huecos y 2 estancias/);
 await page.click('#detectPlan');await page.waitForFunction(()=>/ya tiene muros/.test(document.querySelector('#toast').textContent));
 await page.click('#undo');await page.waitForFunction(()=>FloorPlanApp.project.walls.length===0);
 assert.deepEqual(errors,[]);
});
