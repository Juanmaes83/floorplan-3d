// Declared wall type in «Editar muro» (Modificar paredes), the existing wall editor. A new wall starts unspecified
// with no recorded origin; the professional declares load-bearing, partition and back to unspecified; the origin can be
// set to pending review; everything survives a reload. The note says it is not a structural verification. Geometry
// editing of the same wall still works. Desktop and phone.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`declared wall type and origin in «Editar muro» ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/cdn\.jsdelivr\.net|unpkg\.com/,r=>r.abort());
 await page.goto(url);await page.locator('#welcomeBlank').click();await page.locator('#roomDesignName').fill('Salón');await page.locator('#roomDesignReview').click();await page.locator('#roomDesignConfirm').click();await page.waitForTimeout(300);
 const wall=()=>page.evaluate(()=>{const p=FloorPlanApp.project;const w=p.walls[0];return {id:w.id,structure:w.structure,source:w.structureSource??null,version:p.schemaVersion,thickness:w.thicknessMm};});
 const first=await wall();assert.equal(first.structure,'unknown');assert.equal(first.source,null,'no origin is invented for a new wall');
 // Open the existing wall editor: «Modificar paredes» from the search, then the wall on the plan.
 const openEditor=async()=>{await page.locator('#actionSearchBtn').click();await page.locator('#editorActionInput').fill('modificar pared');await page.locator('#editorActionResults [role=option]',{hasText:'Modificar paredes'}).first().click();await page.waitForTimeout(300);
  if(mobile&&await page.locator('aside.open').count())await page.evaluate(()=>closeDrawers?.());
  const b=await page.locator(`[data-wall="${first.id}"]`).boundingBox();await page.mouse.click(b.x+b.width/2,b.y+b.height/2);await page.waitForTimeout(300);
  await page.locator('#traceEdit-structure').waitFor();};
 await openEditor();
 const shown=await page.evaluate(()=>({type:document.querySelector('#traceEdit-structure').value,origin:document.querySelector('#traceEdit-structureSource').selectedOptions[0].textContent,options:[...document.querySelector('#traceEdit-structure').options].map(o=>o.textContent),note:document.querySelector('#traceWallStructureNote').textContent}));
 assert.equal(shown.type,'unknown');assert.equal(shown.origin,'No registrada');assert.deepEqual(shown.options,['Sin especificar','Tabique','Muro portante','Otro']);
 assert.match(shown.note,/No es una verificación ni un cálculo estructural/);
 // Load-bearing, partition, back to unspecified: each one a professional's declaration, saved at once.
 for(const value of ['load-bearing','partition','unknown']){await page.locator('#traceEdit-structure').selectOption(value);await page.waitForTimeout(200);
  const w=await wall();assert.equal(w.structure,value);assert.equal(w.source,'professional');assert.equal(w.version,'1.5.0');}
 // Changing only the origin keeps the declared type.
 await page.locator('#traceEdit-structure').selectOption('load-bearing');await page.locator('#traceEdit-structureSource').selectOption('pending-review');await page.waitForTimeout(200);
 assert.deepEqual({...(await wall())},{...first,structure:'load-bearing',source:'pending-review',version:'1.5.0'});
 // Reload: the declaration and its origin are still there, and shown in the editor.
 await page.reload();await page.waitForTimeout(800);if(await page.locator('#guideClose').isVisible())await page.locator('#guideClose').click();
 const kept=await wall();assert.equal(kept.structure,'load-bearing');assert.equal(kept.source,'pending-review');
 await openEditor();assert.equal(await page.locator('#traceEdit-structure').inputValue(),'load-bearing');assert.equal(await page.locator('#traceEdit-structureSource').inputValue(),'pending-review');
 // Geometry editing of the same wall still works and does not touch the declaration.
 await page.locator('#traceEdit-thicknessMm').fill(String(first.thickness+20));await page.locator('#traceEditSave').click();await page.waitForTimeout(300);
 const edited=await wall();assert.equal(edited.thickness,first.thickness+20);assert.equal(edited.structure,'load-bearing');assert.equal(edited.source,'pending-review');
 assert.deepEqual(errors,[]);
});
