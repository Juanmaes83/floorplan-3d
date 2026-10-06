const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
let server,browser,url;
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const state=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),saved:JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])))}));
for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`layout review is read-only and explicit about evidence ${viewport.width}x${viewport.height}`,{timeout:60000},async t=>{
 const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);await page.waitForFunction(()=>!!window.FloorPlanLayoutReview&&!!window.FloorPlanTraceUI);
 // Baseline after opening the panel: the drawer itself stores the existing UI pane preference.
 await page.locator('#traceBtn').click();await page.locator('#layoutReview').waitFor();
 const initial=await state(page);
 const status=page.locator('#layoutReviewStatus');
 assert.equal(await status.getAttribute('data-status'),'partial');
 assert.match(await status.textContent(),/Holgura: evidencia insuficiente · Puertas: comprobado · Indica una holgura mínima/);
 const door=page.locator('#layoutReviewFindings button[data-code="puerta"]');assert.equal(await door.count(),1);
 assert.match(await door.textContent(),/opn_door-3 \+ obj_template-016: La hoja de la puerta opn_door-3 \(785 mm\) alcanza «Mueble de baño» al abrir unos 6° de 90°/);
 assert.equal(await page.locator('#layoutReviewFindings button[data-code="holgura"]').count(),0);
 assert.match(await page.locator('#layoutReviewLimits summary').textContent(),/Exclusiones, omisiones y límites \(9\)/);
 assert.deepEqual(await state(page),initial);
 // A user threshold enables the clearance check without touching project or storage.
 await page.fill('#layoutReviewClearance','300');await page.locator('#layoutReviewClearance').press('Tab');
 await page.waitForFunction(()=>document.querySelector('#layoutReviewStatus').dataset.status==='checked');
 assert.ok(await page.locator('#layoutReviewFindings button[data-code="holgura"]').count()>0);
 assert.equal(await page.locator('#layoutReviewClearance').inputValue(),'300');
 assert.deepEqual(await state(page),initial);
 // Invalid thresholds are rejected and keep the previous value.
 await page.fill('#layoutReviewClearance','-5');await page.locator('#layoutReviewClearance').press('Tab');
 await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('mayor que 0'));
 assert.equal(await page.locator('#layoutReviewClearance').inputValue(),'300');
 // Locating a finding only selects/focuses; it does not edit.
 await page.locator('#layoutReviewFindings button[data-code="puerta"]').click();
 assert.deepEqual(await state(page),initial);
 await page.fill('#layoutReviewClearance','');await page.locator('#layoutReviewClearance').press('Tab');
 await page.waitForFunction(()=>document.querySelector('#layoutReviewStatus').dataset.status==='partial');
 await page.locator('#traceBtn').click();await page.locator('#layoutReview').scrollIntoViewIfNeeded();
 await fs.mkdir('docs/qa/artifacts/layout-review',{recursive:true});await page.screenshot({path:`docs/qa/artifacts/layout-review/${viewport.width}x${viewport.height}.png`});
 assert.deepEqual(await state(page),initial);assert.deepEqual(errors,[]);
});
