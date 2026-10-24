/* Finding 12 (23-10-2026): furniture added or duplicated in a one-level home was stacked on other furniture while the
   toast said «Añadido». Now adding and duplicating go to the nearest free place in the room; when the room has none
   the item is still added and the toast says it overlaps (never silent, never refused on one level). Overlaps that
   already exist — imported, or made by a manual drag — are shown, never moved. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const C=require('../js/project-core.js'),L=require('../js/room-layout.js');
const ARTIFACTS=process.env.OVERLAP_ARTIFACTS||path.join(os.tmpdir(),'furniture-overlaps');let server,url,browser,legacyFile;
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.webp')?'image/webp':file.endsWith('.png')?'image/png':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});await fs.mkdir(ARTIFACTS,{recursive:true});
 // An older-style project with two beds on top of each other, as it could arrive by import.
 let p=L.blank('Proyecto con solape');p=L.create(p,{name:'Dormitorio',width:3600,depth:3400,x:0,y:0}).project;
 const bed=(id,x,y,rot)=>{const {cx,cy,w,d,rot:_r,...o}={...C.object('bed','Cama',x,y,1600,2000,rot,'#8a7f73'),id};return o;};
 p.objects.push(bed('obj_bed-a',1000,1200,0),bed('obj_bed-b',1500,1500,90));C.validate(p);
 legacyFile=path.join(os.tmpdir(),'overlap-legacy.json');await fs.writeFile(legacyFile,JSON.stringify(p));});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function setup(t,viewport){const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);await page.waitForFunction(()=>window.FloorPlanApp&&document.querySelector('#welcomeDialog').open);
 const press=async s=>{const l=page.locator(s).first();await l.scrollIntoViewIfNeeded();mobile?await l.tap():await l.click();};
 const library=async()=>{if(mobile){if(!await page.locator('aside.lib').evaluate(e=>e.classList.contains('open')))await press('#tgLib');}else if(await page.locator('.app').evaluate(a=>a.classList.contains('hide-lib')))await press('#tgLib');await page.waitForTimeout(300);
  if(await page.locator('#paletteTabFurnish').count())await press('#paletteTabFurnish');};
 return {page,errors,press,library,mobile};}
// Overlaps by the layout review's rule (the same rule the app uses), computed in the page.
const overlaps=page=>page.evaluate(()=>FloorPlanLayoutReview.review(FloorPlanApp.project).findings.filter(f=>f.code==='solape').map(f=>f.objects));
for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`adding beds to a small room never stacks them silently ${viewport.width}x${viewport.height}`,{timeout:240000},async t=>{
 const {page,errors,press,library,mobile}=await setup(t,viewport),name=`${viewport.width}x${viewport.height}`;
 // 6000×4000: the first bed goes to the centre, two more fit beside it (moved there and said so); once the room is
 // full each new bed is added where asked and the toast and the chip say it overlaps.
 await press('#welcomeBlank');await page.fill('#roomDesignName','Dormitorio');await page.fill('#roomDesignWidth','6000');await press('#roomDesignReview');await press('#roomDesignConfirm');await page.waitForFunction(()=>FloorPlanApp.project.rooms.length===1);
 const log=[];
 for(let i=0;i<6;i++){
  await library();await page.fill('#furnitureSearch','cama doble 1,8');const before=await page.evaluate(()=>FloorPlanApp.project.objects.length);
  await press('#searchResults .item');await page.waitForTimeout(400);
  if(viewport.width<1000)await page.waitForTimeout(200);
  const r=await page.evaluate(()=>({count:FloorPlanApp.project.objects.length,toast:document.querySelector('#toast').classList.contains('show')?document.querySelector('#toast').textContent:'',refused:!!document.querySelector('#placementDialog')?.open,reason:document.querySelector('#placementReason')?.textContent||''}));
  log.push(r);
  assert.equal(r.refused,false,`${name} one level: never refused`);assert.equal(r.count,before+1);assert.match(r.toast,/Añadido «Cama doble 1,8 m»/);
  const last=await page.evaluate(()=>FloorPlanApp.project.objects.at(-1).id),stacked=(await overlaps(page)).some(pair=>pair.includes(last));r.stacked=stacked;
  if(stacked){assert.match(r.toast,/no había sitio libre en «Dormitorio»: se solapa con otros muebles\. Muévelo a su sitio\./,`${name} add ${i+1}: an overlap is said`);
   assert.equal(await page.locator('#furnitureOverlaps').isVisible(),true,`${name} add ${i+1}: chip shown`);}
  else assert.doesNotMatch(r.toast,/se solapa/);
 }
 assert.ok(log.some(r=>!r.stacked&&/sitio libre más cercano/.test(r.toast)),`${name} a bed moved to a free place says so ${JSON.stringify(log)}`);
 assert.ok(log.some(r=>r.stacked),`${name} the room fills up and the next bed says it overlaps ${JSON.stringify(log)}`);
 assert.equal(log.slice(0,3).every(r=>!r.stacked),true,`${name} the first three beds fit without overlap ${JSON.stringify(log)}`);
 await page.screenshot({path:path.join(ARTIFACTS,`${name}-beds.png`)});
 assert.deepEqual(errors,[],name);
});
test('duplicating rotated furniture goes to a free place or says it overlaps, never silently 1440x900',{timeout:240000},async t=>{
 const {page,errors,press,library}=await setup(t,{width:1440,height:900});
 await press('#welcomeBlank');await page.fill('#roomDesignName','Salón');await page.fill('#roomDesignWidth','5000').catch(()=>{});await press('#roomDesignReview');await press('#roomDesignConfirm');await page.waitForFunction(()=>FloorPlanApp.project.rooms.length===1);
 await library();await page.fill('#furnitureSearch','sofá de 3');await press('#searchResults .item');await page.waitForTimeout(300);
 await page.keyboard.press('r').catch(()=>{});await page.evaluate(()=>{if(typeof rotateSel==='function')rotateSel(90);});
 for(let i=0;i<4;i++){const before=await page.evaluate(()=>FloorPlanApp.project.objects.length);await page.evaluate(()=>duplicateSel());await page.waitForTimeout(300);
  const r=await page.evaluate(()=>({refused:!!document.querySelector('#placementDialog')?.open,n:FloorPlanApp.project.objects.length,id:FloorPlanApp.project.objects.at(-1).id,toast:document.querySelector('#toast').textContent}));
  assert.equal(r.refused,false);assert.equal(r.n,before+1);
  if((await overlaps(page)).some(pair=>pair.includes(r.id)))assert.match(r.toast,/se solapa con otros muebles/,`duplicate ${i+1}: an overlap is said`);
  else assert.doesNotMatch(r.toast,/se solapa/,`duplicate ${i+1}`);}
 assert.deepEqual(errors,[]);
});
for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`an imported overlap is shown and never moved ${viewport.width}x${viewport.height}`,{timeout:240000},async t=>{
 const {page,errors,press}=await setup(t,viewport),name=`${viewport.width}x${viewport.height}`;
 const [chooser]=await Promise.all([page.waitForEvent('filechooser'),press('#welcomeUpload')]);await chooser.setFiles(legacyFile);
 await page.waitForFunction(()=>FloorPlanApp.project.objects.length===2,null,{timeout:30000});await page.waitForTimeout(500);
 const pos=()=>page.evaluate(()=>FloorPlanApp.project.objects.map(o=>[o.id,o.position.x,o.position.y,o.rotationDeg]));const start=await pos();
 // On a phone the import opens the «Plano propio» drawer over the plan; the person closes it to see the plan.
 if(viewport.width<1000&&await page.locator('aside.right').evaluate(e=>e.classList.contains('open'))){await press('#tgPanel');await page.waitForTimeout(400);}
 const chip=page.locator('#furnitureOverlaps');assert.equal(await chip.isVisible(),true,`${name} chip shown`);assert.match(await chip.textContent(),/«Cama» y «Cama» se solapan/);
 const box=await chip.evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;});assert.ok(box,'chip on screen');
 await page.screenshot({path:path.join(ARTIFACTS,`${name}-imported-overlap-before-press.png`)});
 await press('#furnitureOverlapsNext');assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'furn',id:'obj_bed-a'});
 await press('#furnitureOverlapsNext');assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'furn',id:'obj_bed-b'});
 assert.deepEqual(await pos(),start,'nothing moved');
 await page.screenshot({path:path.join(ARTIFACTS,`${name}-imported-overlap.png`)});
 assert.deepEqual(errors,[],name);
});
test('the example shows no overlap warning (a hob set into a worktop is by design)',{timeout:120000},async t=>{
 const {page,errors,press}=await setup(t,{width:1440,height:900});await press('#welcomeExample');await page.waitForTimeout(600);
 assert.equal(await page.locator('#furnitureOverlaps').isVisible(),false);assert.deepEqual(await overlaps(page),[]);assert.deepEqual(errors,[]);
});
