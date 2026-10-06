const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const Core=require('../js/project-core.js');
let server,browser,url;
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
// Project, persisted storage and edit history: none of them may change because of the review, its threshold or its highlight.
const state=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),saved:JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))),undo:undoStack.length,redo:redoStack.length}));
// Screen-space check: the drawn element must cover exactly the evidence points mapped through the plan's own transform.
const aligned=(page,selector,which)=>page.evaluate(([selector,which])=>{const svg=document.querySelector('#gReview').ownerSVGElement,m=svg.getScreenCTM(),key=document.querySelector('#gReview').dataset.finding;
 const f=FloorPlanLayoutReview.review(FloorPlanApp.project,{clearanceMm:Number(document.querySelector('#layoutReviewClearance').value)||null}).findings.find(f=>f.code+':'+f.objects.join('+')===key),e=f.evidence;
 const P=which==='overlap'?e.polygon:which==='clearance'?[e.a,e.b]:e.leaf,s=P.map(v=>{const p=svg.createSVGPoint();p.x=v.x;p.y=v.y;return p.matrixTransform(m);});
 const r=document.querySelector(selector).getBoundingClientRect(),xs=s.map(p=>p.x),ys=s.map(p=>p.y);
 return Math.max(Math.abs(r.left-Math.min(...xs)),Math.abs(r.right-Math.max(...xs)),Math.abs(r.top-Math.min(...ys)),Math.abs(r.bottom-Math.max(...ys)));},[selector,which]);
async function shot(page,mobile,name){if(mobile){await page.evaluate(()=>drawer(null));await page.waitForTimeout(400);}await fs.mkdir('docs/qa/artifacts/layout-review',{recursive:true});await page.screenshot({path:`docs/qa/artifacts/layout-review/${name}.png`});}
async function openPanel(page){await page.locator('#traceBtn').click();await page.locator('#layoutReview').waitFor();}
// Overlap fixture derived from the reference plan: one extra armchair placed on the existing sofa.
function withOverlap(){const p=Core.initial(),sofa=p.objects.find(o=>o.type==='sofa');p.id='prj_review-overlap';p.objects.push({id:'obj_review-armchair',type:'armchair',name:'单人沙发',position:{x:sofa.position.x+600,y:sofa.position.y},size:{widthMm:850,depthMm:850},rotationDeg:30});return p;}
for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`layout review states and exact 2D highlight stay read-only ${viewport.width}x${viewport.height}`,{timeout:90000},async t=>{
 const mobile=viewport.width<1000,name=`${viewport.width}x${viewport.height}`,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);await page.waitForFunction(()=>!!window.FloorPlanLayoutReview&&!!window.FloorPlanTraceUI);
 // Baseline after opening the panel: the drawer itself stores the existing UI pane preference.
 await openPanel(page);const initial=await state(page);
 const status=page.locator('#layoutReviewStatus');
 assert.equal(await status.getAttribute('data-status'),'partial');
 assert.match(await status.textContent(),/Holgura: evidencia insuficiente · Puertas: comprobado · Indica una holgura mínima/);
 assert.equal(await page.locator('#gReview > *').count(),0,'nothing highlighted until a finding is chosen');
 await page.locator('#layoutReview').scrollIntoViewIfNeeded();await shot(page,false,name);
 // Door finding: sector, blocked part, leaf at the contact angle and the reached footprint.
 const door=page.locator('#layoutReviewFindings button[data-code="puerta"]');assert.equal(await door.count(),1);
 assert.match(await door.textContent(),/opn_door-3 \+ obj_template-016: La hoja de la puerta opn_door-3 \(785 mm\) alcanza «Mueble de baño» al abrir unos 6° de 90°/);
 await door.click();await page.waitForFunction(()=>document.querySelector('#gReview').dataset.finding==='puerta:opn_door-3+obj_template-016');
 assert.equal(await page.locator('#layoutReviewFindings button[data-code="puerta"]').getAttribute('aria-pressed'),'true');
 for(const cls of ['review-door-sweep','review-door-blocked','review-door-leaf','review-footprint'])assert.equal(await page.locator(`#gReview .${cls}`).count(),1,cls);
 assert.equal(await page.locator('#gReview text').count(),0,'no text drawn over plan labels');assert.match(await page.locator('#layoutReviewActive').textContent(),/la hoja alcanza obj_template-016 a ≈6° de 90°/);assert.match(await page.locator('#gReview > title').textContent(),/≈6° de 90°/);
 assert.ok(await aligned(page,'#gReview .review-door-leaf','door')<3);
 await page.locator('#zoomIn').click();assert.ok(await aligned(page,'#gReview .review-door-leaf','door')<3,'aligned after zoom');
 assert.deepEqual(await state(page),initial);await shot(page,mobile,`${name}-door`);
 // A threshold enables clearance; choosing a clearance finding replaces the door highlight with the exact gap.
 await openPanel(page);await page.fill('#layoutReviewClearance','300');await page.locator('#layoutReviewClearance').press('Tab');
 await page.waitForFunction(()=>document.querySelector('#layoutReviewStatus').dataset.status==='checked');
 assert.equal(await page.locator('#gReview').getAttribute('data-finding'),'puerta:opn_door-3+obj_template-016','highlight survives an unrelated re-render');
 const gap=page.locator('#layoutReviewFindings button[data-code="holgura"]').first(),gapKey=await gap.getAttribute('data-key');
 await gap.click();await page.waitForFunction(k=>document.querySelector('#gReview').dataset.finding===k,gapKey);
 assert.equal(await page.locator('#gReview .review-gap').count(),1);assert.equal(await page.locator('#gReview .review-door-leaf').count(),0);
 assert.match(await page.locator('#layoutReviewActive').textContent(),/Holgura: \d+(\.\d)? mm < umbral 300 mm/);
 assert.ok(await aligned(page,'#gReview .review-gap','clearance')<3);
 assert.deepEqual(await state(page),initial);await shot(page,mobile,`${name}-clearance`);
 // Removing the threshold removes that finding, so its highlight disappears instead of lingering.
 await openPanel(page);await page.fill('#layoutReviewClearance','');await page.locator('#layoutReviewClearance').press('Tab');
 await page.waitForFunction(()=>document.querySelector('#layoutReviewStatus').dataset.status==='partial');
 assert.equal(await page.locator('#gReview > *').count(),0);assert.equal(await page.locator('#layoutReviewClearHighlight').count(),0);
 // Explicit removal, and exports never include the highlight.
 await page.locator('#layoutReviewFindings button[data-code="puerta"]').click();await page.waitForFunction(()=>document.querySelector('#gReview').childElementCount>0);
 await openPanel(page);await page.locator('#layoutReviewClearHighlight').click();assert.equal(await page.locator('#gReview > *').count(),0);
 await page.locator('#layoutReviewFindings button[data-code="puerta"]').click();await page.waitForFunction(()=>document.querySelector('#gReview').childElementCount>0);
 await page.evaluate(()=>{const s=XMLSerializer.prototype.serializeToString;window.__exported=[];XMLSerializer.prototype.serializeToString=function(n){const out=s.call(this,n);window.__exported.push(out);return out;};});
 const download=page.waitForEvent('download');await page.evaluate(()=>{document.querySelector('details.menu').open=true;document.querySelector('#exportPng').click();});await download;
 const exported=await page.evaluate(()=>window.__exported.join('\n'));assert.match(exported,/id="gReview"/);assert.doesNotMatch(exported,/review-(door|gap|overlap|footprint)/);
 assert.ok(await page.locator('#gReview > *').count()>0,'export leaves the on-screen highlight untouched');
 assert.deepEqual(await state(page),initial);
 // Changing project clears the highlight immediately; then an overlap shows the exact intersection.
 await page.evaluate(p=>FloorPlanApp.importProject(p),withOverlap());await page.waitForFunction(()=>FloorPlanApp.project.id==='prj_review-overlap');
 assert.equal(await page.locator('#gReview > *').count(),0,'project change clears the highlight');
 await openPanel(page);const overlap=page.locator('#layoutReviewFindings button[data-code="solape"]');assert.equal(await overlap.count(),1);
 const before=await state(page);await overlap.click();await page.waitForFunction(()=>document.querySelector('#gReview .review-overlap'));
 assert.equal(await page.locator('#gReview .review-footprint').count(),2);assert.match(await page.locator('#layoutReviewActive').textContent(),/Solape de huellas: \d+(\.\d)? mm de penetración \(obj_template-\d+ \+ obj_review-armchair\)/);
 assert.ok(await aligned(page,'#gReview .review-overlap','overlap')<3);
 assert.deepEqual(await state(page),before);await shot(page,mobile,`${name}-overlap`);
 // Closing the tools removes the highlight.
 await openPanel(page);await page.locator('#traceHidePanel').click();assert.equal(await page.locator('#gReview > *').count(),0);
 assert.deepEqual(await state(page),before);assert.deepEqual(errors,[]);
});
