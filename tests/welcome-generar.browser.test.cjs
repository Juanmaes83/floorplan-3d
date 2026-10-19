// «Generar» (welcome → result): the three ways to start come first and are read before the search; the page says what
// the person will get and its limits; focus lands on the title, not on a field (a phone would open its keyboard over
// the choices). Each path reaches its result: a blank project with its first room, the example, and the upload chooser
// with a clear refusal for an invalid file. On phones and short screens the guide starts compact («Ver más»).
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.env.UX_SHOTS||path.join(root,'docs/qa/artifacts/editor-ux/after');
let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});await fs.mkdir(shots,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`«Generar»: hierarchy, focus and the three paths ${viewport.width}x${viewport.height}`,{timeout:240000},async t=>{
 const mobile=viewport.width<1000,name=`${viewport.width}x${viewport.height}`,compactExpected=viewport.width<=600||viewport.height<=500;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);await page.locator('#welcomeDialog[open]').waitFor();await page.waitForTimeout(300);
 const press=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();mobile?await l.tap():await l.click();await page.waitForTimeout(250);};
 // Hierarchy and focus.
 const w=await page.evaluate(()=>{const entries=document.querySelector('.welcome-entries'),search=document.querySelector('.welcome-search'),first=entries.querySelector('.welcome-entry'),r=first.getBoundingClientRect();
  return {active:document.activeElement?.id,tag:document.activeElement?.tagName,order:!!(entries.compareDocumentPosition(search)&Node.DOCUMENT_POSITION_FOLLOWING),entries:[...entries.querySelectorAll('.welcome-entry strong')].map(e=>e.textContent),
   firstTop:Math.round(r.top),result:document.querySelector('.welcome-result')?.textContent,descriptions:[...entries.querySelectorAll('.welcome-entry span:last-child')].map(e=>e.textContent),hScroll:document.documentElement.scrollWidth>innerWidth+1};});
 assert.deepEqual([w.active,w.tag],['welcomeDialogTitle','H1'],'focus on the title, not on a field');
 assert.equal(w.order,true,'the three entries come before the search');assert.deepEqual(w.entries,['Subir un plano','Crear desde cero','Probar el ejemplo']);
 assert.match(w.result,/plano 2D editable y su vista 3D.*orientativas/);assert.match(w.descriptions[0],/calibran con una medida conocida/);assert.match(w.descriptions[2],/crea una copia/);
 assert.ok(w.firstTop<viewport.height,'the first entry is visible without scrolling');assert.equal(w.hScroll,false);
 await page.screenshot({path:path.join(shots,`${name}-g01-welcome.png`)});
 // «Subir un plano»: opens the chooser; an invalid file is refused with a message and nothing changes.
 const before0=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 const chooser=page.waitForEvent('filechooser');await press('#welcomeUpload');const fc=await chooser;
 await fc.setFiles({name:'no-es-un-plano.png',mimeType:'image/png',buffer:Buffer.from('invalid')});await page.waitForTimeout(800);
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before0,'invalid upload changes nothing');
 assert.match(await page.evaluate(()=>[document.querySelector('#toast')?.textContent,document.querySelector('#traceStatus')?.textContent,document.querySelector('#welcomeDialog')?.textContent].join(' ')),/imagen|archivo|formato|PNG|leer/i,'the refusal is explained');
 // «Crear desde cero»: first-room dialog → a project with one room, in the editor.
 if(!(await page.locator('#welcomeDialog[open]').count()))await press('#welcomeBtn');
 await press('#welcomeBlank');await page.locator('#roomDesignDialog[open]').waitFor();await page.locator('#roomDesignName').fill('Salón');
 await press('#roomDesignReview');await press('#roomDesignConfirm');await page.waitForTimeout(300);
 assert.equal(await page.evaluate(()=>FloorPlanApp.project.rooms.length),1);assert.equal(await page.locator('#welcomeDialog[open]').count(),0,'the result is the editor');
 // Compact guide by default on phones and short screens; «Ver más» shows the stages.
 const compact=()=>page.evaluate(()=>document.querySelector('#guideBar').classList.contains('guide-compact'));
 assert.equal(await compact(),compactExpected);await page.screenshot({path:path.join(shots,`${name}-g02-blank-result.png`)});
 await press('#guideCompact');assert.equal(await compact(),!compactExpected);assert.equal(await page.locator('#guideCompact').getAttribute('aria-expanded'),String(compactExpected));await press('#guideCompact');
 // «Probar el ejemplo»: the example opens and keeps its stored name; the page shows it translated.
 await press('#welcomeBtn');await press('#welcomeExample');await page.waitForTimeout(400);
 assert.equal(await page.locator('.guide-project').textContent(),'Proyecto de ejemplo');assert.ok(await page.evaluate(()=>FloorPlanApp.project.rooms.length>5));
 await page.screenshot({path:path.join(shots,`${name}-g03-example-result.png`)});
 assert.deepEqual(errors,[]);
});
