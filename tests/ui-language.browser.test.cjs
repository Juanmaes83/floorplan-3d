// Spanish interface without internal text (19-10-2026). On the example project, the visible text of the overview, every
// room panel and its dimensions dialog (including its refusal), the wall finish list, every opening panel, the plan
// labels and «Plano propio» (tools, warnings and an edit) must not show internal IDs, English keys or untranslated example
// names. A name typed by the person is user content: it is shown exactly as typed, never translated.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

const RULES=[[/[㐀-鿿]/,'texto chino sin traducir'],[/\b(opn|wal|rom|obj|prj|img|lvl|mat|msr)_[A-Za-z0-9-]{3,}/,'ID interno'],[/\b(left|right|top|bottom|start|end|undefined|null|NaN|offset|sliding-door|unreviewed|IDs)\b/,'clave interna en inglés']];
// Visible text of the page: elements, plan labels, form values and options, titles and accessible names.
const visible=page=>page.evaluate(()=>{const out=[],seen=new Set(),add=t=>{t=t.trim();if(t&&!seen.has(t)){seen.add(t);out.push(t);}};
 const walk=n=>{for(const c of n.childNodes){if(c.nodeType===3){const e=c.parentElement;if(e&&e.getClientRects().length&&!e.closest('script,style,[hidden],[aria-hidden=true]'))add(c.textContent);}else if(c.nodeType===1&&getComputedStyle(c).display!=='none'&&getComputedStyle(c).visibility!=='hidden')walk(c);}};walk(document.body);
 for(const e of document.querySelectorAll('input,select,textarea'))if(e.getClientRects().length&&!['number','radio','checkbox','hidden','file','range','color'].includes(e.type)){if(e.tagName==='SELECT')for(const o of e.options)add(o.textContent);else add(e.value);}
 for(const e of document.querySelectorAll('[title],[aria-label]'))if(e.getClientRects().length)add(e.getAttribute('aria-label')||e.getAttribute('title'));return out;});
async function audit(page,where,allowed=[]){const bad=[];for(const line of await visible(page)){const text=allowed.reduce((t,a)=>t.split(a).join(''),line);for(const [re,why] of RULES)if(re.test(text))bad.push(`${where}: ${why}: «${line.slice(0,120)}»`);}return bad;}

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`Spanish UI shows no internal text on the example ${viewport.width}x${viewport.height}`,{timeout:420000},async t=>{
 const mobile=viewport.width<1000;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);await require('./editor-fixture.cjs')(page);
 const bad=[],panel=async sel=>{await page.evaluate(sel=>{window.select(sel);drawer('panel',true);},sel);await page.waitForTimeout(250);};
 const ids=await page.evaluate(()=>({rooms:FloorPlanApp.project.rooms.map(r=>r.id),openings:FloorPlanApp.project.openings.map(o=>o.id),name:FloorPlanApp.project.name}));
 assert.equal(ids.name,'三室两厅两卫','the example keeps its stored name; only the display is translated');
 const stored=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await panel(null);bad.push(...await audit(page,'vista general'));
 for(const id of ids.rooms){await panel({kind:'room',id});bad.push(...await audit(page,'estancia '+id));}
 // Dimensions dialog of every rectangular room, including the refusal shown for the example's split walls.
 for(const id of ids.rooms){await panel({kind:'room',id});if(!(await page.locator('#roomDimensions').count()))continue;await page.evaluate(()=>document.querySelector('#roomDimensions').click());await page.waitForTimeout(150);
  if(await page.locator('#roomDesignForm').count()){await page.locator('#roomDesignValue').fill('2500');const fixed=page.locator('#roomDesignFixed');if(await fixed.count())await fixed.selectOption({index:1});await page.evaluate(()=>document.querySelector('#roomDesignForm').requestSubmit());await page.waitForTimeout(150);}
  bad.push(...await audit(page,'dimensiones '+id));await page.keyboard.press('Escape');await page.waitForTimeout(100);}
 await panel({kind:'room',id:'rom_child'});await page.evaluate(()=>document.querySelector('#surfaceWall').click());await page.locator('#surfaceWallTarget').waitFor();
 const walls=await page.locator('#surfaceWallTarget option').allTextContents();assert.ok(walls.length>10&&walls.every(t=>/^Pared /.test(t)),'walls are described in words');
 assert.equal(await page.locator('#surfaceWallTarget optgroup').first().getAttribute('label'),'Paredes de «Dormitorio juvenil»','the room’s walls first');
 bad.push(...await audit(page,'acabado de pared'));await page.keyboard.press('Escape');
 for(const id of ids.openings){await page.evaluate(id=>openOpening(id),id);await page.waitForTimeout(150);bad.push(...await audit(page,'hueco '+id));}
 // «Plano propio»: tools, warnings and an edit view.
 await panel(null);await page.evaluate(()=>document.querySelector('#traceBtn').click());await page.waitForTimeout(300);bad.push(...await audit(page,'plano propio'));
 assert.ok(await page.locator('#traceWarnings button[data-target]').count()>0,'warnings keep their target for locating');
 await page.evaluate(()=>[...document.querySelectorAll('#traceWarnings button')].find(b=>b.dataset.target.startsWith('wal_')).click());await page.waitForTimeout(200);bad.push(...await audit(page,'editar muro'));
 await page.evaluate(()=>document.querySelector('#traceEditBack').click());await page.evaluate(()=>document.querySelector('#traceHidePanel').click());
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),stored,'walking through panels and dialogs changes nothing in the example');
 // A name typed by the person stays as typed, and only that name is exempt.
 await panel(null);await page.evaluate(()=>document.querySelector('#newRoomBtn').click());await page.locator('#roomDesignName').fill('我的书房');await page.locator('#roomDesignWidth').fill('2500');await page.locator('#roomDesignDepth').fill('2500');
 await page.evaluate(()=>document.querySelector('#roomDesignReview').click());await page.evaluate(()=>document.querySelector('#roomDesignConfirm').click());await page.waitForTimeout(250);
 const own=await page.evaluate(()=>FloorPlanApp.project.rooms.find(r=>r.name==='我的书房')?.id);assert.ok(own,'room created with the typed name');await panel({kind:'room',id:own});
 assert.equal(await page.locator('#panelTitle').textContent(),'我的书房','user content is not translated');bad.push(...await audit(page,'estancia propia',['我的书房']));
 assert.deepEqual(bad,[]);assert.deepEqual(errors,[]);
});

// Calibration in the interface: a coherent second dimension can be confirmed; a contradictory one is refused with its
// numbers and how to fix it, and neither the ratio nor the geometry change. Taps follow the rendered image, as a person sees it.
test('calibration messages say what does not match and how to fix it',{timeout:240000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);await require('./editor-fixture.cjs')(page);
 const png=Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1000;c.height=800;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,1000,800);g.strokeRect(100,100,500,500);return c.toDataURL('image/png').split(',')[1];}),'base64');
 await page.evaluate(()=>document.querySelector('#traceBtn').click());const chooser=page.waitForEvent('filechooser');await page.evaluate(()=>document.querySelector('#traceNew').click());await (await chooser).setFiles({name:'plano.png',mimeType:'image/png',buffer:png});
 await page.waitForFunction(()=>document.querySelector('image[href^="blob:"]'));await page.waitForTimeout(300);
 const at=(x,y)=>page.evaluate(([x,y])=>{const m=new DOMPoint(x,y).matrixTransform(document.querySelector('image[href^="blob:"]').getScreenCTM());return {x:m.x,y:m.y};},[x,y]);
 const measure=async(tool,a,b,mm)=>{await page.evaluate(id=>document.getElementById(id).click(),tool);for(const q of [a,b]){const s=await at(...q);await page.mouse.click(s.x,s.y);}await page.locator('#traceKnown').fill(String(mm));await page.locator('#traceDistanceSave').click();await page.waitForTimeout(200);};
 const status=()=>page.locator('#traceStatus').textContent(),state=()=>page.evaluate(()=>({ratio:FloorPlanApp.project.scale.calibration?.mmPerPixel,walls:JSON.stringify(FloorPlanApp.project.walls),confidence:FloorPlanApp.project.scale.confidence}));
 await page.evaluate(()=>document.getElementById('traceConfirm').click());assert.match(await status(),/Calibra primero/);
 await measure('traceCalibrate',[100,100],[600,100],2500);await page.evaluate(()=>document.getElementById('traceConfirm').click());assert.match(await status(),/Falta la segunda cota/);
 await measure('traceVerify',[100,200],[100,600],2000);assert.match(await status(),/^Segunda cota: 2000 mm frente a 2000 mm indicados \(error [−+]?0,\d %; margen ±2 %\)\. Concuerda/);
 const ok=await state();await page.evaluate(()=>document.getElementById('traceConfirm').click());assert.equal((await state()).confidence,'real');
 await measure('traceVerify',[100,200],[100,600],3000);assert.match(await status(),/No concuerda: la escala no se confirma/);
 await page.evaluate(()=>document.getElementById('traceConfirm').click());const msg=await status();
 assert.match(msg,/^La segunda cota no concuerda: con la calibración actual mide 2000 mm y has indicado 3000 mm \(error −33,3 %; margen ±2 %\)\. La escala no se confirma\..*recalibra/);
 const bad=await state();assert.equal(bad.ratio,ok.ratio,'ratio unchanged');assert.equal(bad.walls,ok.walls,'geometry unchanged');assert.equal(bad.confidence,'estimated','the earlier confirmation is withdrawn');
 assert.match(await page.locator('#traceScaleSummary').textContent(),/no concuerda; repítela o recalibra/);
 assert.deepEqual(errors,[]);
});
