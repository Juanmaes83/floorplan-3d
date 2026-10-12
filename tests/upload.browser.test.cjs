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
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);return {page,errors};
}
const state=page=>page.evaluate(()=>{const p=FloorPlanApp.project;return {id:p.id,name:p.name,walls:p.walls.length,openings:p.openings.length,images:(p.sourceImages||[]).map(i=>({mediaType:i.mediaType,w:i.widthPx,h:i.heightPx,sha:i.sha256}))};});
async function upload(page,file,wait){const before=(await state(page)).id;await page.locator('#uploadIn').setInputFiles(file);if(wait!==false)await page.waitForFunction(id=>FloorPlanApp.project.id!==id&&!document.body.classList.contains('uploading'),before,{timeout:30000});return state(page);}
const toastText=page=>page.locator('#toast').textContent();

test('a single visible "Subir plano" control replaces the separate JSON and image imports',async t=>{
 const {page,errors}=await pageFor(t);
 assert.equal((await page.locator('#uploadPlan').textContent()).trim(),'Subir plano');assert.ok(await page.locator('#uploadPlan').isVisible());
 assert.equal(await page.locator('#importJson').count(),0);assert.equal(await page.locator('#importImage').count(),0);
 await page.locator('details.menu summary').click();assert.doesNotMatch(await page.locator('.menu-pop').innerText(),/Importar|Cargar imagen/);
 assert.match(await page.locator('#uploadPlanHelp').textContent(),/PDF.*HEIC.*DXF/);
 const accept=await page.locator('#uploadIn').getAttribute('accept');for(const ext of ['.pdf','.heic','.tif','.dxf','.json','.zip'])assert.ok(accept.includes(ext),ext);
 await page.locator('#langBtn').click();assert.equal((await page.locator('#uploadPlan').textContent()).trim(),'Upload plan');
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
test('drag and drop uploads the first file and plans with a background image export as ZIP',{timeout:60000},async t=>{
 const {page,errors}=await pageFor(t),before=await state(page);
 const pdf=[...fs.readFileSync(path.join(FX,'plan-one-page.pdf'))];
 const overlay=await page.evaluate(bytes=>{const dt=new DataTransfer();dt.items.add(new File([new Uint8Array(bytes)],'plano.pdf',{type:'application/pdf'}));document.dispatchEvent(new DragEvent('dragenter',{dataTransfer:dt,bubbles:true}));const shown=document.querySelector('#dropOverlay').classList.contains('show');document.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true}));return shown;},pdf);
 assert.ok(overlay);await page.waitForFunction(id=>FloorPlanApp.project.id!==id&&!document.body.classList.contains('uploading'),before.id,{timeout:30000});
 assert.equal(await page.locator('#dropOverlay').evaluate(n=>n.classList.contains('show')),false);assert.equal((await state(page)).images.length,1);
 await page.locator('details.menu summary').click();const pending=page.waitForEvent('download');await page.locator('#exportJson').click();const dl=await pending;
 assert.equal(dl.suggestedFilename(),'proyecto-plano.zip');assert.match(await toastText(page),/exportado como ZIP/);
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
