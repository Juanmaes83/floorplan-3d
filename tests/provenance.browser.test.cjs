/* «Del plano a la vivienda» in «Presentar mi vivienda» (result 2): the summary is read from the project, one block per
   level in a two-level building, and opening it changes nothing. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{createServer}=require('node:http'),{chromium}=require('playwright');
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),Prov=require('../js/provenance-core.js'),F=require('./fixtures/building-fixture.cjs');
const root=path.resolve(__dirname,'..'),KEY='rubik-sota-library-v1';let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',file.endsWith('.js')||file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME||undefined});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function setup(t,viewport){const narrow=viewport.width<=1100,context=await browser.newContext({viewport,isMobile:narrow,hasTouch:narrow});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.FloorPlanProvenance);
 const press=async s=>{const l=page.locator(s).first();await l.waitFor({state:'visible',timeout:8000});await l.scrollIntoViewIfNeeded();if(narrow)await l.tap();else await l.click();};
 return {page,errors,press,narrow};}

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])test(`one level: the presentation says what came from the plan and what was added ${viewport.width}x${viewport.height}`,{timeout:90000},async t=>{
 const {page,errors,press}=await setup(t,viewport);await press('#welcomeExample');await page.waitForTimeout(400);
 const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 const expected=Prov.lines(Prov.summarize(JSON.parse(before)));
 await press('#guidePresent');await page.locator('#presentationConfig[open]').waitFor();
 const box=page.locator('#presentationProvenance');assert.equal(await box.evaluate(d=>d.open),false,'collapsed: one line');
 assert.match(await box.locator('summary').textContent(),/^Del plano a la vivienda · /);
 await press('#presentationProvenance summary');
 assert.deepEqual(await box.locator('li').allTextContents(),expected);
 assert.match(await box.locator('.presentation-provenance-note').textContent(),/Las medidas son orientativas/);
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'nothing changes');
 assert.equal(await page.evaluate(()=>document.querySelector('#presentationConfig').scrollWidth<=document.querySelector('#presentationConfig').clientWidth+1),true);
 await page.screenshot({path:path.join(os.tmpdir(),`provenance-${viewport.width}.png`)});assert.deepEqual(errors,[]);
});

test('two levels: one block per level, each from its own project',{timeout:120000},async t=>{
 const {page,errors,press}=await setup(t,{width:1440,height:900});const fx=F.build();
 const {entries}=await B.packageEntries(fx.building,im=>fx.bytesFor(im.id),T.imageInfo),zip=Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer());
 if(await page.locator('#welcomeDialog[open]').count())await press('#welcomeBlank').catch(()=>{});
 await page.keyboard.press('Escape').catch(()=>{});
 await page.locator('#uploadIn').setInputFiles({name:'edificio.zip',mimeType:'application/zip',buffer:zip});
 await page.waitForFunction(()=>window.FloorPlanBuildingUI?.context?.levels===2,null,{timeout:60000});
 const levels=await page.evaluate(()=>FloorPlanBuildingUI.presentationSources().levels.sort((a,b)=>a.order-b.order).map(l=>({name:l.name,project:l.project})));
 const before=await page.evaluate(k=>localStorage.getItem(k),KEY);
 await page.evaluate(()=>FloorPlanPresentation.open());await page.locator('#presentationConfig[open]').waitFor();
 await press('#presentationProvenance summary');
 assert.match(await page.locator('#presentationProvenance summary').textContent(),/2 plantas/);
 assert.deepEqual(await page.locator('#presentationProvenance h3').allTextContents(),levels.map(l=>l.name));
 const lists=await page.locator('#presentationProvenance ul').evaluateAll(u=>u.map(x=>[...x.children].map(li=>li.textContent)));
 assert.deepEqual(lists,levels.map(l=>Prov.lines(Prov.summarize(l.project))));
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),KEY),before,'the building does not change');
 await page.screenshot({path:path.join(os.tmpdir(),'provenance-duplex.png')});assert.deepEqual(errors,[]);
});
