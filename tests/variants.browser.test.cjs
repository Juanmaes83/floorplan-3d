const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const Core=require('../js/project-core.js'),Library=require('../js/project-library.js');
let server,browser,url;
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const shots='docs/qa/artifacts/variants';
async function setup(context){const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);await page.waitForFunction(()=>!!window.FloorPlanVariants&&!!window.FloorPlanApp);return {page,errors};}
const lib=page=>page.evaluate(k=>localStorage.getItem(k),Library.KEY);
const projectJSON=page=>page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
async function removeFurniture(page,mobile){const id=await page.evaluate(()=>{const o=FloorPlanApp.project.objects.find(o=>o.type!=='rug');select({kind:'furn',id:o.id});return o.id;});const del=page.locator('[data-a="del"]').first();if(mobile)await del.tap();else await del.click();await page.waitForFunction(id=>!FloorPlanApp.project.objects.some(o=>o.id===id),id);return id;}
async function openProjects(page){await page.locator('#projectsBtn').click();await page.locator('#projectsDialog').waitFor();}
async function compare(page){await openProjects(page);await page.locator('#projectCompare').click();await page.locator('#variantsDialog').waitFor();}
const card=(page,i)=>page.locator('#variantsCards .variant-card').nth(i);
const metric=(page,i,key)=>card(page,i).locator(`dd[data-metric="${key}"]`).textContent();

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`variants: create, edit, compare, reload, reopen original and delete with confirmation ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const mobile=viewport.width<1000,name=`${viewport.width}x${viewport.height}`,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,acceptDownloads:true});t.after(()=>context.close());
 const {page,errors}=await setup(context);await fs.mkdir(shots,{recursive:true});
 // A visible edit on the original before creating the variant: the copy must start from what the person sees.
 await removeFurniture(page,mobile);const original=await projectJSON(page),originalId=await page.evaluate(()=>JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).activeId);
 await page.screenshot({path:`${shots}/${name}-1-original.png`});
 await openProjects(page);await page.locator('#projectVariant').click();
 await page.waitForFunction(id=>JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).activeId!==id,originalId);
 const created=JSON.parse(await lib(page)),variant=created.entries.find(e=>e.id===created.activeId);
 assert.equal(variant.name,'Proyecto inicial · Variante 1');assert.equal(variant.variantOf,originalId);
 assert.equal(variant.project.objects.length,JSON.parse(original).objects.length,'variant starts from the visible state');
 assert.equal(JSON.stringify(created.entries.find(e=>e.id===originalId).project),original,'original stored exactly as seen');
 assert.match(await page.locator('#projectList option:checked').textContent(),/Variante 1 — variante de «Proyecto inicial»/);
 assert.match(await page.locator('#toast').textContent(),/Variante creada y abierta: «Proyecto inicial · Variante 1»\. El original no cambia\./);
 await page.locator('#projectVariants').scrollIntoViewIfNeeded();await page.screenshot({path:`${shots}/${name}-2-variant-created.png`});await page.locator('#projectClose').click();
 // Editing the variant leaves the original untouched.
 await removeFurniture(page,mobile);await page.screenshot({path:`${shots}/${name}-3-variant-edited.png`});
 const afterEdit=JSON.parse(await lib(page));assert.equal(JSON.stringify(afterEdit.entries.find(e=>e.id===originalId).project),original);
 // Exported JSON of the variant is a normal, valid project without the local link.
 await page.locator('details.menu summary').click();const pending=page.waitForEvent('download');await page.locator('#exportJson').click();const dl=await pending;
 const chunks=[];for await(const c of await dl.createReadStream())chunks.push(c);const exported=JSON.parse(Buffer.concat(chunks).toString());
 Core.validate(exported);assert.equal(JSON.stringify(exported).includes('variantOf'),false);assert.equal(exported.objects.length,JSON.parse(original).objects.length-1);
 // Comparison with real metrics and Phase A evidence states.
 await compare(page);assert.equal(await page.locator('#variantsCards .variant-card').count(),2);
 assert.equal(await card(page,0).locator('.role').textContent(),'Original');assert.equal(await card(page,1).locator('.role').textContent(),'Variante');
 assert.equal(await card(page,1).getAttribute('data-active'),'true');
 const n0=JSON.parse(original).objects.length;assert.equal(await metric(page,0,'objects'),String(n0));assert.equal(await metric(page,1,'objects'),String(n0-1));
 const area=await page.evaluate(()=>FloorPlanVariants.netAreaM2(FloorPlanApp.project).toFixed(2)),header=await page.locator('#subtitle').textContent();
 assert.ok(header.includes(area.replace('.',header.includes(',')?',':'.')),`header shows the same net area ${area}: ${header}`);assert.equal(await metric(page,1,'area'),`${area} m²`);
 assert.equal(await metric(page,0,'holgura'),'evidencia insuficiente · sin umbral indicado');assert.match(await metric(page,0,'status'),/^parcial$/);
 assert.match(await metric(page,0,'puerta'),/^comprobado · \d+ aviso\(s\)$/);
 await page.fill('#variantsClearance','300');await page.locator('#variantsClearance').press('Tab');await page.waitForFunction(()=>document.querySelector('#variantsCards dd[data-metric="holgura"]').textContent.startsWith('comprobado'));
 assert.match(await metric(page,0,'holgura'),/^comprobado · \d+ aviso\(s\)$/);assert.match(await metric(page,1,'holgura'),/^comprobado · \d+ aviso\(s\)$/);
 const noMutation=await lib(page);await page.screenshot({path:`${shots}/${name}-4-comparison.png`});
 assert.equal(await lib(page),noMutation,'comparing does not write');
 // Reload: variants and local links persist.
 await page.reload();await page.waitForFunction(()=>!!window.FloorPlanVariants);await compare(page);assert.equal(await page.locator('#variantsCards .variant-card').count(),2);
 // Reopen the original from the comparison: exactly as it was.
 await card(page,0).locator('[data-action="open"]').click();await page.waitForFunction(id=>JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).activeId===id,originalId);
 assert.equal(await projectJSON(page),original);
 // Delete the variant with an explicit confirmation naming both projects.
 await compare(page);let message;page.once('dialog',d=>{message=d.message();d.accept();});
 await card(page,1).locator('[data-action="remove"]').click();await page.waitForFunction(()=>document.querySelectorAll('#variantsCards .variant-card').length===1);
 assert.equal(message,'¿Eliminar la variante «Proyecto inicial · Variante 1»? Se borra solo esta copia local; el original «Proyecto inicial» no cambia. No se puede deshacer.');
 await page.screenshot({path:`${shots}/${name}-5-after-delete.png`});
 const finalLib=JSON.parse(await lib(page));assert.equal(finalLib.entries.length,1);assert.equal(finalLib.activeId,originalId);assert.equal(JSON.stringify(finalLib.entries[0].project),original);
 assert.equal(await projectJSON(page),original);assert.deepEqual(errors,[]);
});

test('variant creation fails cleanly when real browser storage is full',{timeout:120000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>context.close());const {page,errors}=await setup(context);
 await removeFurniture(page,false);const beforeLib=await lib(page),beforeProject=await projectJSON(page);
 // Fill this origin's real localStorage quota with throwaway keys, leaving less room than one more project copy.
 const filled=await page.evaluate(()=>{let i=0,size=1<<20,total=0;while(size>=256){try{localStorage.setItem('__fill_'+i,'x'.repeat(size));total+=size;i++;}catch{size>>=1;}}return {keys:i,chars:total};});
 assert.ok(filled.chars>1e6,'quota actually reached');
 await openProjects(page);await page.locator('#projectVariant').click();
 await page.waitForFunction(()=>document.querySelector('#projectError').textContent.length>0);
 assert.match(await page.locator('#projectError').textContent(),/^No hay espacio local suficiente para crear la variante\. No se ha cambiado nada/);
 assert.equal(await lib(page),beforeLib,'collection bytes unchanged');assert.equal(await projectJSON(page),beforeProject,'same project open');
 await page.evaluate(()=>{for(const k of Object.keys(localStorage))if(k.startsWith('__fill_'))localStorage.removeItem(k);});
 await page.locator('#projectVariant').click();await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).entries.length===2,Library.KEY);
 t.diagnostic(`quota filled with ${filled.chars} chars in ${filled.keys} keys; library ${beforeLib.length} chars before the attempt`);
 assert.deepEqual(errors,[]);
});

test('a project with a local raster image: the variant shares the stored image, nothing is duplicated, deleting keeps it',{timeout:120000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>context.close());const {page,errors}=await setup(context);
 await page.locator('#traceBtn').click();await page.locator('#traceNew').click();await page.locator('#traceImageFile').setInputFiles(path.join(__dirname,'fixtures/manual-plan.png'));
 await page.waitForFunction(()=>FloorPlanApp.project.sourceImages?.length===1);
 const keys=()=>page.evaluate(async()=>(await FloorPlanImages.keys()).sort());
 const imagesBefore=await keys(),libBefore=(await lib(page)).length,originalId=await page.evaluate(()=>JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).activeId),refs=await page.evaluate(()=>FloorPlanApp.project.sourceImages.map(i=>i.storage.ref));
 const projectChars=(await projectJSON(page)).length;
 await openProjects(page);await page.locator('#projectVariant').click();await page.waitForFunction(id=>JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).activeId!==id,originalId);
 const libAfter=(await lib(page)).length;assert.deepEqual(await keys(),imagesBefore,'no image blob copied');
 assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.sourceImages.map(i=>i.storage.ref)),refs,'variant references the same stored image');
 t.diagnostic(`image project ${projectChars} chars; collection ${libBefore} → ${libAfter} chars (+${libAfter-libBefore}); IndexedDB images ${imagesBefore.length} → ${(await keys()).length}`);
 assert.ok(libAfter-libBefore<projectChars*1.2,'growth ≈ one project JSON, no image bytes');
 await page.locator('#projectClose').click();await compare(page);page.once('dialog',d=>d.accept());await card(page,1).locator('[data-action="remove"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('#variantsCards .variant-card').length===1);await page.waitForTimeout(300);
 assert.deepEqual(await keys(),imagesBefore,'image kept: the original still references it');
 assert.deepEqual(errors,[]);
});
