/* Scaled sheet (result 4, docs/product/professional-client-experience-2026-10-21.md): the downloaded SVG, opened on
   its own outside Rubik (a blank page, no app code), measures 1:scale on paper: a room, the plan box and the scale
   bar are compared in millimetres with the project geometry. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME||undefined});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const PX_PER_MM=96/25.4;

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])test(`sheet at 1:100 measures true on paper when opened outside Rubik ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const narrow=viewport.width<=1100,context=await browser.newContext({viewport,isMobile:narrow,hasTouch:narrow,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 const press=async s=>{const l=page.locator(s).first();await l.waitFor({state:'visible',timeout:8000});await l.scrollIntoViewIfNeeded();if(narrow)await l.tap();else await l.click();};
 await page.goto(url);await press('#welcomeExample');await page.waitForTimeout(500);if(await page.locator('#guideClose').isVisible())await press('#guideClose');
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 const geo=await page.evaluate(()=>{const r=FloorPlanApp.geometry.rooms.find(x=>x.poly.length>=3),xs=r.poly.map(p=>p[0]),ys=r.poly.map(p=>p[1]);return {id:r.id,w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys),bounds:FloorPlanApp.geometry.bounds};});
 await press('details.menu summary');await press('#openSheet');await page.locator('#sheetDialog[open]').waitFor();
 assert.equal(await page.locator('#sheetScale').inputValue(),'0','unscaled by default, as before');
 // 1:50 does not fit this home on the sheet: refused, the previous choice stays and the person is told why.
 await page.locator('#sheetScale').selectOption('50');
 assert.equal(await page.locator('#sheetScale').inputValue(),'0');assert.match(await page.locator('#toast').textContent(),/no cabe en la hoja a 1:50/);
 await page.locator('#sheetScale').selectOption('100');assert.equal(await page.locator('#sheetScale').inputValue(),'100');
 const pending=page.waitForEvent('download');await press('#sheetDownload');const file=await pending,svg=await fs.readFile(await file.path(),'utf8');
 assert.match(svg,/width="420mm"/);assert.match(svg,/data-scale="1:100"/);assert.match(svg,/Escala 1:100/);assert.match(svg,/imprime al 100 %/);
 const out=path.join(os.tmpdir(),`sheet-1-100-${viewport.width}.svg`);await fs.writeFile(out,svg);
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'the sheet does not change the project');
 // Independent opening: a fresh page with only the file, at CSS 96 dpi (1 mm = 3.7795 px).
 const viewer=await context.newPage();await viewer.goto('file://'+out);
 const m=await viewer.evaluate(id=>{const svg=document.documentElement,room=svg.querySelector(`polygon[data-room="${id}"]`),r=room.getBoundingClientRect(),bar=[...svg.querySelectorAll('[data-scale-bar] rect')].map(e=>e.getBoundingClientRect()),root=svg.getBoundingClientRect();
  return {root:[root.width,root.height],room:[r.width,r.height],bar:bar[1].right-bar[0].left,metres:Number(svg.querySelector('[data-scale-bar]').getAttribute('data-scale-bar'))};},geo.id);
 assert.ok(Math.abs(m.root[0]/PX_PER_MM-420)<0.5,`sheet 420 mm wide (${(m.root[0]/PX_PER_MM).toFixed(2)})`);
 for(const [k,mm] of [[0,geo.w],[1,geo.h]])assert.ok(Math.abs(m.room[k]/PX_PER_MM-mm/100)<0.6,`room ${k?'depth':'width'} ${mm} mm → ${(mm/100).toFixed(2)} mm on paper, measured ${(m.room[k]/PX_PER_MM).toFixed(2)}`);
 assert.ok(Math.abs(m.bar/PX_PER_MM-m.metres*10)<0.6,`scale bar ${m.metres} m → ${m.metres*10} mm, measured ${(m.bar/PX_PER_MM).toFixed(2)}`);
 await viewer.screenshot({path:path.join(os.tmpdir(),`sheet-viewer-${viewport.width}.png`)});
 await page.locator('#sheetClose').click();await press('details.menu summary');await press('#openSheet');assert.equal(await page.locator('#sheetScale').inputValue(),'0','each sheet starts unscaled');
 assert.deepEqual(errors,[]);
});
