// Public demo «Ver cómo evoluciona una obra» (evolucion/?demo=obra) as Production serves it: labs/ is NOT published
// (.vercelignore), so this server answers 404 for /labs/. The demo builds the example house and an example plan in
// memory (js/construction-demo-core.js): it never reads or changes the visitor's projects, and nothing leaves the site.
// Also: the old lab URL (?lab=1) without its fixtures shows a clear message instead of a JavaScript exception.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),SHOTS=process.env.EVOLUTION_DEMO_SHOTS||null;
let server,browser,url;const labRequests=[];
const TYPES={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.wasm':'application/wasm'};
before(async()=>{
 server=createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://local').pathname);
  if(p.startsWith('/labs/')){labRequests.push(p);res.statusCode=404;return res.end('not published');}
  let file=path.resolve(root,'.'+p);if(!file.startsWith(root))throw Error('path');if(p.endsWith('/'))file=path.join(file,'index.html');
  res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
const shot=async(page,name)=>{if(SHOTS){await fs.mkdir(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,name+'.png')});}};
async function open(viewport){
 const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 page.on('request',r=>{const u=r.url();if(!u.startsWith(url)&&!/^(data|blob):/.test(u))external.push(u);});
 return {context,page,errors,external,mobile};
}
const ready=page=>page.waitForFunction(()=>document.body.classList.contains('ready')&&/^demo/.test(document.body.dataset.state||''),null,{timeout:90000});
const fid=(page,fn,arg)=>page.evaluate(fn,arg);

test('Home → «Ver demo de evolución 4D» → the example house builds itself; play, pause, back, weeks, tasks; visitor data untouched',{timeout:240000},async t=>{
 const {context,page,errors,external}=await open({width:1440,height:900});t.after(()=>context.close());
 await page.goto(url);await page.locator('#welcomeDemo-evolucion-obra').waitFor();
 const card=await page.locator('[data-demo="evolucion-obra"]').innerText();assert.match(card,/Descubre cómo evoluciona una obra/);assert.match(card,/Datos de ejemplo/);
 const storageBefore=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))));
 await page.locator('#welcomeInAction').scrollIntoViewIfNeeded();await shot(page,'01-home-card');
 await page.locator('#welcomeDemo-evolucion-obra').click();await page.waitForURL(/evolucion\/\?demo=obra$/);await ready(page);
 assert.equal(await page.evaluate(()=>document.body.dataset.state),'demo');
 const m=await fid(page,()=>({name:document.getElementById('heroProject').textContent,planning:window.__ft3dFidelity.model.planning,costs:window.__ft3dFidelity.model.costs,
  positions:window.__ft3dFidelity.timeline.positions,tasks:window.__ft3dFidelity.ctx.schedule.tasks.length,rows:document.querySelectorAll('#gantt [data-task]').length,
  visible:['#stage','#gantt','.transport','#cardHeadline'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return r.width>0&&r.height>0;}),
  hidden:['#panel-proyecto','#panel-entrega','.tabs','#fidelityMode','#origin'].map(s=>getComputedStyle(document.querySelector(s)).display),
  tag:document.querySelector('.demo-tag').textContent,intro:document.getElementById('introTitle').textContent}));
 assert.equal(m.name,'Vivienda de ejemplo de RUBIK');assert.equal(m.planning,'available');assert.notEqual(m.costs,'available','the demo shows no amounts');
 assert.equal(m.tasks,10);assert.ok(m.rows>=10);assert.ok(m.positions>100);assert.deepEqual(m.visible,[true,true,true,true]);
 assert.deepEqual(m.hidden,['none','none','none','none','none'],'no lab tools, professional tabs or delivery in the demo');assert.match(m.tag,/datos de ejemplo/i);
 assert.equal(m.intro,'Antes del comienzo de la obra','a new build, not a reform');
 const present=()=>fid(page,()=>window.__ft3dFidelity.last?.presentElements?.length??0);
 assert.equal(await present(),0,'nothing stands before the plan starts');await shot(page,'02-demo-start');
 // Play, then pause: time advances and stops.
 await page.locator('#play').click();await page.waitForFunction(()=>window.__ft3dFidelity.pos>20,null,{timeout:30000});
 await page.locator('#play').click();const paused=await fid(page,()=>window.__ft3dFidelity.pos);await page.waitForTimeout(600);
 assert.equal(await fid(page,()=>window.__ft3dFidelity.playing),false);assert.equal(await fid(page,()=>window.__ft3dFidelity.pos),paused);
 // Back one day and one week.
 const p0=Math.floor(paused);await page.locator('#back').click();assert.equal(await fid(page,()=>Math.floor(window.__ft3dFidelity.pos)),p0-1);
 await page.locator('#wback').click();assert.equal(await fid(page,()=>Math.floor(window.__ft3dFidelity.pos)),p0-8);
 // Pick a week: the house is part built (structure), and at the end of the plan every modelled element stands.
 const weeks=await page.locator('#weekSel option').count();assert.ok(weeks>15);
 await page.locator('#weekSel').selectOption({index:5});await page.waitForTimeout(400);const mid=await present();assert.ok(mid>10,'structure standing in week 5: '+mid);
 await shot(page,'03-demo-week5');
 await page.locator('#end').click();await page.waitForTimeout(500);const fin=await present();assert.ok(fin>mid,'the house is complete at the end');
 assert.equal(await fid(page,()=>window.__ft3dFidelity.last?.presentElements?.some(id=>id.startsWith('illustrative/'))),false,'site resources removed at the end');
 await shot(page,'04-demo-end');
 // The closing card: watch again, how to do it with my project, back to start, explore.
 await page.locator('#demoEnd').waitFor();for(const id of ['#demoReplay','#demoHowTo','#demoHome','#demoExplore'])assert.equal(await page.locator(id).isVisible(),true,id);
 await page.locator('#demoHowTo').click();assert.match(await page.locator('#demoEnd').innerText(),/Plan de obra/);await shot(page,'04b-demo-howto');
 await page.locator('#demoEnd button',{hasText:'Volver'}).last().click();await page.locator('#demoExplore').click();assert.equal(await page.locator('#demoEnd').isVisible(),false);
 // Inspect a task from the plan: its moment and its elements.
 await page.locator('#gantt [data-task="carpinteria"] .bar').first().click();await page.waitForTimeout(200);await page.waitForTimeout(400);
 assert.equal(await fid(page,()=>window.__ft3dFidelity.selected),'carpinteria');assert.match(await page.locator('#cardTasks').innerText(),/Puertas y ventanas/i);
 await shot(page,'05-demo-task');
 // Help and the way back to RUBIK.
 await page.locator('#demoHelpOpen').click();assert.equal(await page.locator('#demoHelp').evaluate(d=>d.open),true);
 assert.match(await page.locator('#demoHelp').innerText(),/Reproducir o pausar/);await page.locator('#demoHelp button').click();
 assert.equal(await page.locator('.demo-bar a[href="../"]').count(),1);
 // Nothing of the visitor changed, nothing external, no lab file requested.
 const storageAfter=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))));
 assert.equal(storageAfter,storageBefore,'the demo does not read into or write the visitor library');
 assert.deepEqual(external,[]);assert.deepEqual(labRequests.filter(p=>!p.includes('fixtures')),[]);assert.deepEqual(errors,[]);
});

for(const viewport of [{width:390,height:844},{width:844,height:390}])test(`direct link in a clean browser, phone ${viewport.width}x${viewport.height}: loads, plays and fits`,{timeout:180000},async t=>{
 const {context,page,errors,external}=await open(viewport);t.after(()=>context.close());
 await page.goto(url+'evolucion/?demo=obra');await ready(page);
 assert.equal(await page.evaluate(()=>localStorage.length),0,'a clean browser stays clean');
 const fit=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,canvas:document.getElementById('stage').getBoundingClientRect().height,
  play:(()=>{const r=document.getElementById('play').getBoundingClientRect();return r.width>=32&&r.height>=32;})()}));
 assert.equal(fit.overflow,false);assert.ok(fit.canvas>120);assert.equal(fit.play,true);
 await page.locator('#play').tap();await page.waitForFunction(()=>window.__ft3dFidelity.pos>10,null,{timeout:30000});await page.locator('#play').tap();
 await page.locator('#weekSel').selectOption({index:8});await page.waitForTimeout(300);
 assert.ok(await page.evaluate(()=>window.__ft3dFidelity.last.presentElements.length)>10);
 await shot(page,`06-demo-${viewport.width}x${viewport.height}`);
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
});

test('old lab URL without its fixtures (?lab=1&dossier=K): a clear message and a link to the demo, never an exception',{timeout:120000},async t=>{
 const {context,page,errors}=await open({width:1440,height:900});t.after(()=>context.close());
 await page.goto(url+'evolucion/?lab=1&dossier=K&tab=evolucion');
 await page.waitForFunction(()=>document.body.dataset.state==='lab-unavailable',null,{timeout:60000});
 const n=page.locator('#pageNotice');assert.equal(await n.isVisible(),true);assert.match(await n.innerText(),/no se publican/);
 assert.equal(await n.locator('a').getAttribute('href'),'./?demo=obra');await shot(page,'07-lab-unavailable');
 assert.deepEqual(errors,[]);
});
