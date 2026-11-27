'use strict';
/* CAT-03 en el editor REAL con controles visibles: «Amueblar → Producto de mi estudio» → Mis catálogos → «Colocar en el
   proyecto». Aparador roble con su GLB sintético validado (cargado en 3D por el mismo cargador con SHA-256 y medidas),
   variante nogal como volumen genérico rotulado, horno validado sin precio, encimera (material) no colocable; panel del
   objeto; partidas solo con precio de ficha; deshacer/rehacer; duplicar conserva el SKU; guardar y reabrir; exportar e
   importar; planta girada 30°. Ninguna petición externa ni a /api/. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const K=require('./photo-project/kit.cjs'),{loadPilot,rotatedProject}=require('./cat-ia/kit.cjs'),Core=require('../js/project-core.js');
const OUT=process.env.CAT_IA_SHOTS||null,EXT='x-cat03-catalog-link';
let env;
test.before(async()=>{env=await K.start();});
test.after(async()=>{await env?.stop();});
const shot=async(page,name)=>{if(!OUT)return;fs.mkdirSync(OUT,{recursive:true});await page.screenshot({path:path.join(OUT,name+'.png')});};
const links=page=>page.evaluate(e=>{const l=FloorPlanApp.project.extensions?.[e]?.links||{},ids=new Set(FloorPlanApp.project.objects.map(o=>o.id));return Object.fromEntries(Object.entries(l).filter(([id])=>ids.has(id)));},EXT);
const obj=(page,id)=>page.evaluate(id=>structuredClone(FloorPlanApp.project.objects.find(o=>o.id===id)||null),id);
async function openFromPalette(page,touch=false){const go=l=>touch?l.tap():l.click();
 if(touch&&!(await page.locator('aside.lib.open').count())){await page.locator('#tgLib').tap();await page.locator('aside.lib.open').waitFor();}
 const tab=page.locator('#paletteTabFurnish');if(await tab.getAttribute('aria-selected')!=='true')await go(tab);
 const b=page.locator('#catalogPlaceOpen');await b.scrollIntoViewIfNeeded();await go(b);await page.locator('#catalogDialog[open]').waitFor();}
// Click a point of the object that is not covered by another object (several products may share the centre).
async function selectFurn(page,id){const pt=await page.evaluate(id=>{const g=document.querySelector(`#plan g.furn[data-fid="${id}"]`),r=g.getBoundingClientRect();
 for(let i=1;i<20;i++)for(let j=1;j<20;j++){const x=r.left+r.width*i/20,y=r.top+r.height*j/20,e=document.elementFromPoint(x,y);if(e?.closest('g.furn')?.dataset.fid===id)return {x,y};}return null;},id);
 if(!pt)throw Error('object not reachable '+id);await page.mouse.click(pt.x,pt.y);await page.waitForFunction(id=>ui.sel?.kind==='furn'&&ui.sel.id===id,id);}
async function place(page,key,{expect}={}){
 await page.locator(`#catalogList .catalog-item[data-key="${key}"]`).click();await page.locator(`#catalogPreview[data-key="${key}"]`).waitFor();
 await page.waitForFunction(()=>!!document.querySelector('#catalogPlaceNote')?.dataset.state);
 const state=await page.locator('#catalogPlaceNote').getAttribute('data-state');if(expect)assert.equal(state,expect,key);
 if(await page.locator('#catalogPlace').isDisabled())return {state,id:null};
 const before=new Set(await page.evaluate(()=>FloorPlanApp.project.objects.map(o=>o.id)));
 await page.locator('#catalogPlace').click();await page.locator('#catalogDialog').waitFor({state:'hidden'});
 const id=(await page.evaluate(()=>FloorPlanApp.project.objects.map(o=>o.id))).find(x=>!before.has(x));return {state,id};
}

test('CAT-03 escritorio: modelo validado / volumen genérico / no colocable, panel, partidas, deshacer, duplicar, 3D, reabrir, exportar e importar',{timeout:420000},async()=>{
 const {context,page}=await K.editor(env,{acceptDownloads:true});const w=K.watch(page,env.base),api=[];page.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url());});
 try{
  await loadPilot(page,false);await page.locator('#workArea-design').click().catch(()=>{});
  await page.locator('#professionalWorkspace').waitFor({state:'hidden'}).catch(()=>{});
  const undo0=await page.evaluate(()=>undoStack.length);
  await openFromPalette(page);
  // Material: not placeable.
  assert.equal((await place(page,'encimera-basalto@-',{expect:'material-not-placeable'})).id,null);assert.match(await page.locator('#catalogPlaceNote').innerText(),/es un material/);
  // Oak sideboard with the validated GLB.
  const r1=await place(page,'aparador-lumen@roble',{expect:'validated-model'});assert.ok(r1.id);
  const o1=await obj(page,r1.id);assert.deepEqual(o1.size,{widthMm:1600,depthMm:450,heightMm:780});assert.equal(o1.assetRef.assetId,'cat-ia-aparador-lumen');assert.equal(o1.assetRef.catalog,'rubik-sota-local');
  let L=await links(page);assert.equal(L[r1.id].sku,'QA-LUMEN-160-RB');assert.equal(L[r1.id].representation,'validated-model');assert.equal(L[r1.id].catalogRevision,1);
  assert.equal(await page.evaluate(()=>undoStack.length),undo0+1,'one undo step');
  await page.locator('#catLinkNote').waitFor();assert.equal(await page.locator('#catLinkNote').getAttribute('data-representation'),'validated-model');assert.match(await page.locator('#catLinkNote').innerText(),/QA-LUMEN-160-RB · rev\. 1 · modelo 3D validado/);
  await shot(page,'cat03-01-aparador-validado');
  // Walnut variant: labelled generic volume.
  await openFromPalette(page);const r2=await place(page,'aparador-lumen@nogal',{expect:'generic-volume'});const o2=await obj(page,r2.id);
  assert.equal(o2.assetRef,undefined);assert.match(o2.name,/volumen genérico$/);assert.deepEqual(o2.size,{widthMm:1600,depthMm:450,heightMm:780});
  await page.locator('#catLinkNote').waitFor();assert.match(await page.locator('#catLinkNote').innerText(),/volumen genérico \(sin modelo 3D en la ficha\)/);
  // Oven: validated model, unknown price.
  await openFromPalette(page);const r3=await place(page,'horno-h60@inox',{expect:'validated-model'});assert.equal((await obj(page,r3.id)).assetRef.assetId,'cat-ia-horno-h60');
  // Line items: since CAT-04 they are Presupuestar's own figures (FloorPlanBudget.calculateBudget). The sheet price is
  // only a REFERENCE until it is applied there with confirmation — the former parallel total (1435 €, sheet prices
  // counted without confirmation) no longer exists by design (docs/cat-ia/06-cat04-diseno.md §2.5).
  await openFromPalette(page);const row=s=>page.locator(`#catalogBudgetTable tr[data-sku="${s}"]`);
  assert.equal(await row('QA-H60-INOX').getAttribute('data-status'),'unknown-price');assert.equal(await row('QA-LUMEN-160-RB').getAttribute('data-status'),'sheet-price-available');
  assert.match(await row('QA-LUMEN-160-RB').innerText(),/1 × .*ficha 690\.00 €\/ud .*en Presupuestar: sin importe/);
  assert.match(await page.locator('#catalogBudgetTotal').innerText(),/Capítulo «Productos de mi estudio» en Presupuestar: — sin IVA · incompleto: 3 partida\(s\) sin precio aplicado/);
  await page.locator('#catalogBudgetBox').scrollIntoViewIfNeeded();await shot(page,'cat03-02-partidas');
  const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('#catalogBudgetJson').click()]);const bj=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));
  assert.equal(bj.schema,'rubik-catalog-budget-lines/2');assert.equal(bj.lines.length,3);assert.ok(bj.lines.every(l=>l.activeUnitPrice===null&&l.subtotalNet===null),'no automatic price');
  assert.equal(bj.lines.find(l=>l.sku==='QA-LUMEN-160-RB').sheetPrice.unitPrice,690);assert.match(bj.basis,/nunca desde imágenes/);
  await page.locator('#catalogClose').click();
  // Undo / redo of the oven placement.
  await page.locator('#undo').click();await page.waitForFunction(id=>!FloorPlanApp.project.objects.some(o=>o.id===id),r3.id);assert.equal((await links(page))[r3.id],undefined);
  await page.locator('#redo').click();await page.waitForFunction(id=>FloorPlanApp.project.objects.some(o=>o.id===id),r3.id);assert.equal((await links(page))[r3.id].sku,'QA-H60-INOX');
  // Duplicate the oak sideboard: the copy keeps the SKU link and the model.
  await selectFurn(page,r1.id);const count=await page.evaluate(()=>FloorPlanApp.project.objects.length);await page.keyboard.press('Control+d');
  await page.waitForFunction(n=>FloorPlanApp.project.objects.length===n+1,count);
  L=await links(page);const dup=Object.keys(L).find(id=>![r1.id,r2.id,r3.id].includes(id));assert.ok(dup,'duplicate linked');assert.equal(L[dup].sku,'QA-LUMEN-160-RB');assert.equal((await obj(page,dup)).assetRef.assetId,'cat-ia-aparador-lumen');
  // 3D: the validated GLB loads through the production loader (SHA-256, permission and ±20 mm measures).
  await K.open3D(page);await page.waitForFunction(id=>View3D.assetStatus(id)?.state==='ready'||View3D.assetStatus(id)?.state==='error',r1.id,{timeout:60000});
  const st=await page.evaluate(id=>structuredClone(View3D.assetStatus(id)),r1.id);assert.equal(st.state,'ready',JSON.stringify(st));
  await shot(page,'cat03-03-3d');
  await page.locator('#viewSeg .btn[data-view="2d"]').click();
  // Save and reopen.
  await K.reopen(page);L=await links(page);assert.equal(Object.keys(L).length,4);assert.equal(L[r2.id].representation,'generic-volume');
  // Export and import in another browser context.
  await page.locator('#perlaProjectMenu > summary').click();const [ex]=await Promise.all([page.waitForEvent('download'),page.locator('#pmDownloadJson').click()]);const exported=fs.readFileSync(await ex.path(),'utf8');
  assert.equal(Object.keys(JSON.parse(exported).extensions[EXT].links).length,4);
  const other=await env.browser.newContext({viewport:{width:1440,height:900}}),p2=await other.newPage();await p2.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p2.goto(env.base);await require('./editor-fixture.cjs')(p2);
  await p2.locator('#uploadIn').setInputFiles({name:'proyecto.json',mimeType:'application/json',buffer:Buffer.from(exported)});await p2.waitForFunction(id=>FloorPlanApp.project.objects.some(o=>o.id===id),r1.id,{timeout:60000});
  assert.equal(Object.keys(await links(p2)).length,4,'the link travels with the project');await other.close();
  assert.deepEqual(api,[]);assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});

test('CAT-03 planta girada 30° y teléfono 390×844: colocación válida, solape explicado por el editor (aviso, no bloqueo), sin desbordes',{timeout:300000},async()=>{
 const rotated=rotatedProject(30,210,-90);
 const {context,page}=await K.editor(env,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});const w=K.watch(page,env.base);
 try{
  await page.locator('#uploadIn').setInputFiles({name:'girada.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(rotated))});
  await page.waitForFunction(x=>FloorPlanApp.project.walls[0].start.x===x,rotated.walls[0].start.x,{timeout:60000});
  await loadPilot(page,true);try{await page.locator('#workArea-design').tap();}catch{}
  await openFromPalette(page,true);
  const key='aparador-lumen@roble';const item=page.locator(`#catalogList .catalog-item[data-key="${key}"]`);await item.scrollIntoViewIfNeeded();await item.tap();await page.locator(`#catalogPreview[data-key="${key}"]`).waitFor();
  await page.waitForFunction(()=>document.querySelector('#catalogPlaceNote')?.dataset.state==='validated-model');
  const o=await page.evaluate(()=>{const d=document.querySelector('#catalogDialog');return {dialog:d.scrollWidth>d.clientWidth+1,page:document.documentElement.scrollWidth>innerWidth+1};});assert.deepEqual(o,{dialog:false,page:false});
  const before=new Set(await page.evaluate(()=>FloorPlanApp.project.objects.map(o=>o.id)));
  const btn=page.locator('#catalogPlace');await btn.scrollIntoViewIfNeeded();await btn.tap();await page.locator('#catalogDialog').waitFor({state:'hidden'});
  const id=(await page.evaluate(()=>FloorPlanApp.project.objects.map(o=>o.id))).find(x=>!before.has(x));assert.ok(id,'placed in the rotated plan');
  const project=await page.evaluate(()=>structuredClone(FloorPlanApp.project));assert.doesNotThrow(()=>Core.validate(project),'the project stays valid');
  // The editor's ordinary placement: if the product overlaps other furniture, the existing warning names it (a warning,
  // not a block, as for MUE-01); nothing is hidden or silently moved.
  const overlap=await page.evaluate(()=>{const c=document.querySelector('#furnitureOverlaps');return c&&!c.hidden?c.textContent:'';});
  if(overlap)assert.match(overlap,/Aparador Lumen 160 roble|muebles se solapan/);
  assert.equal(project.extensions[EXT].links[id].sku,'QA-LUMEN-160-RB');assert.deepEqual(project.objects.find(x=>x.id===id).size,{widthMm:1600,depthMm:450,heightMm:780});
  await shot(page,'cat03-04-girada-telefono');
  assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});
