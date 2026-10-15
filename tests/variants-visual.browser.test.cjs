const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
let server,browser,url;
const output=path.resolve(__dirname,'../qa-results/serra-r7-m12');
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME,headless:true,args:['--no-sandbox']});await fs.mkdir(output,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const library=page=>page.evaluate(()=>localStorage.getItem('rubik-sota-project-library-v1'));

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:360,height:800}])test(`M12 common frame and isolated variant ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const context=await browser.newContext({viewport,hasTouch:viewport.width<500,isMobile:viewport.width<500});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],consoleErrors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error'&&!/ERR_FAILED|ERR_NAME_NOT_RESOLVED/.test(e.text()))consoleErrors.push(e.text());});
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);await require('./editor-fixture.cjs')(page);
 await page.locator('#projectsBtn').click();await page.locator('#projectVariant').click();await page.locator('#projectClose').click();
 const removed=await page.evaluate(()=>{const o=FloorPlanApp.project.objects.find(o=>o.type!=='rug');select({kind:'furn',id:o.id});return o.id;});
 await page.locator('[data-a="del"]').first().click();await page.waitForFunction(id=>!FloorPlanApp.project.objects.some(o=>o.id===id),removed);
 const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),state=await library(page);
 await page.locator('#projectsBtn').click();await page.locator('#projectCompare').click();
 const plans=page.locator('#variantsCards .variant-plan');assert.equal(await plans.count(),2);
 const boxes=await plans.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('viewBox')));assert.equal(boxes[0],boxes[1]);
 const objects=await plans.evaluateAll(nodes=>nodes.map(node=>node.querySelectorAll('.object').length));assert.equal(objects[0]-objects[1],1);
 const ids=await plans.evaluateAll(nodes=>nodes.map(node=>[...node.querySelectorAll('.room')].map(p=>p.dataset.entityId)));
 assert.deepEqual(ids[0],ids[1]);assert.ok(await plans.first().locator('.wall').count()>0);assert.ok(await plans.first().locator('.door').count()>0);
 const rects=await plans.evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().toJSON()));assert.ok(rects.every(r=>r.width>150&&r.right<=viewport.width+1&&r.left>=-1),JSON.stringify(rects));
 await page.screenshot({path:path.join(output,`${viewport.width}x${viewport.height}-comparison.png`)});
 if(viewport.width<1000){await plans.last().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`${viewport.width}x${viewport.height}-variant-visible.png`)});}
 assert.equal(await library(page),state);assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project);
 if(viewport.width===360){await page.setViewportSize({width:844,height:390});await page.screenshot({path:path.join(output,'360-to-844-comparison.png')});assert.deepEqual(await plans.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('viewBox'))),boxes);}
 await page.locator('#variantsClose').click();assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project);assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
});
