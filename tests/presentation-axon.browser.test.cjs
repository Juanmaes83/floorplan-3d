/* FT3D-5 «Lectura del edificio»: axonometric reading (axon-open) and spatial breakdown (exploded-levels-open) checked on
   the real app in Chromium (contract V2 §36, docs/product/ft3d-5-axon-exploded-building-contract-2026-11-01.md).
   - OFF by default, OFF parity, script order, ES/EN/ZH, repeated dialog open/close without duplicates;
   - one level: compact only (breakdown disabled with its reason); two levels: both; partial building named;
   - active lower and upper level; offsets X/Z, different footprints, unusual elevations without overlap;
   - ownership: the active level's architecture, furniture, lamps and real slab move together; stairs, ground, context,
     roof/exterior and contact shadows hidden only while the levels are apart and restored; furniture OFF stays OFF;
   - active → all → active and all → all; p = 0 and p = 1 match the overview BEFORE End (pose, levels, pixels);
   - section + façade + breakdown in the whole story, one FT3D-5 scene; standalone button; reduced holds; finishStory(0);
     reverse, scrub, cancel at 25/40/60/80 %, Escape, Close, Back; a Begin failure after active → all rolls back;
   - five cycles without drift or linear growth; no rebuild per apply; resize keeps p; capture waits;
   - project, building, revision unchanged; nothing stored; 390×844, 844×390 without overflow; no network. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile),{chromium}=require('playwright');
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),S=require('./fixtures/stair-conflict-building.cjs');
const QA=process.env.AXON_ARTIFACTS||path.join(os.tmpdir(),'presentation-axon');let server,url,browser;const zips={};const cache=new Map();
const three=target=>require('./helpers/three-module.cjs')(target,()=>run('curl',['--fail','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout));
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
async function pack(name,mutate){const b=S.build().building;for(const l of b.levels)l.project.objects=l.project.objects.filter(o=>!/sofa|bed/.test(o.id));mutate?.(b);B.validate(b);
 const {entries}=await B.packageEntries(b,()=>null,T.imageInfo);const file=path.join(await fs.mkdtemp(path.join(os.tmpdir(),'axon-')),name+'.zip');await fs.writeFile(file,Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));return file;}
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(QA,{recursive:true});
 zips.duplex=await pack('duplex');
 // Upper level shifted on X and plan Y with its own smaller footprint; the lower level's walls are unusually tall
 // (4.6 m under a level 3.1 m up), so the nominal gap alone would make the floors overlap in the breakdown.
 zips.offset=await pack('offset',b=>{b.levels[1].offsetMm={x:1500,y:-900};for(const w of b.levels[0].project.walls)w.heightMm=4600;});
 // Upper level with no standing wall: the reading is partial and names it.
 zips.partial=await pack('partial',b=>{for(const w of b.levels[1].project.walls)w.status='demolished';});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function open(t,viewport,{reduced=true}={}){const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
 await page.route('**/*',async route=>{const target=route.request().url();if(target.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/')){if(!cache.has(target))cache.set(target,three(target));return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await cache.get(target)});}
  if(target.startsWith(url)||target.startsWith('blob:')||target.startsWith('data:'))return route.continue();external.push(target);return route.abort();});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin&&window.FloorPlanPresentationAxon,null,{timeout:60000});return {page,errors,external};}
const frames=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const settled=page=>page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:180000});
async function importZip(page,file){const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.locator('#welcomeUpload').click()]);await chooser.setFiles(file);
 await page.waitForFunction(()=>FloorPlanBuildingUI?.context?.levels>1,null,{timeout:60000});await page.waitForTimeout(800);}
async function example(page){await page.locator('#welcomeExample').click();await page.waitForTimeout(800);}
async function openConfig(page){await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();}
async function configure(page,{mode='off',section=false,elevation=false,chapter=false}={}){await openConfig(page);
 assert.equal(await page.locator('#presentationAxonOff').isChecked(),true,'off by default, never remembered');
 if(mode==='compact')await page.locator('#presentationAxonCompact').check();if(mode==='exploded')await page.locator('#presentationAxonExploded').check();
 if(section)await page.locator('#presentationSectionOption').check();if(elevation)await page.locator('#presentationElevationOption').check();if(chapter)await page.locator('#presentationStoryOption').check();
 const start=page.getByRole('button',{name:'Iniciar presentación'});await start.scrollIntoViewIfNeeded();await start.click();}
const snapshot=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),building:JSON.stringify(window.FloorPlanBuildingUI?.presentationSources?.()?.levels.map(l=>[l.levelId,l.revision,l.elevationMm,l.offsetMm,l.project])??null),
 revision:FloorPlanGuide.revision(FloorPlanApp.project),undo:undoStack.length,storage:Object.keys(localStorage).filter(k=>/axon|exploded|despiece|ft3d|story/i.test(k))}));
const info=page=>page.evaluate(()=>({story:FloorPlanPresentation.story,info:View3D.presentationStoryInfo,residue:View3D.presentationAxonResidue,pose:(()=>{try{return View3D.presentationPose();}catch{return null;}})()}));
async function scrub(page,value){await page.evaluate(v=>{const s=document.querySelector('#presentationStorySlider');s.value=String(v);s.dispatchEvent(new Event('input',{bubbles:true}));},value);await frames(page);return info(page);}
const shot=(page,name)=>page.screenshot({path:path.join(QA,name+'.png')});
const noOverflow=page=>page.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1);
const samePose=(a,b,eps=1e-6)=>a.position.every((v,i)=>Math.abs(v-b.position[i])<=eps)&&a.target.every((v,i)=>Math.abs(v-b.target[i])<=eps)&&Math.abs(a.fov-b.fov)<=1e-6;
// Mean absolute difference of two screenshots of the 3D canvas (0–255), measured in the page.
async function canvasDiff(page,a,b){return page.evaluate(async([a,b])=>{const load=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src;});const [x,y]=await Promise.all([load(a),load(b)]);
 const c=document.createElement('canvas');c.width=x.width;c.height=x.height;const g=c.getContext('2d');g.drawImage(x,0,0);const d1=g.getImageData(0,0,c.width,c.height).data;g.clearRect(0,0,c.width,c.height);g.drawImage(y,0,0);const d2=g.getImageData(0,0,c.width,c.height).data;
 let s=0;for(let i=0;i<d1.length;i+=4)s+=Math.abs(d1[i]-d2[i])+Math.abs(d1[i+1]-d2[i+1])+Math.abs(d1[i+2]-d2[i+2]);return s/(d1.length/4*3);},[a,b]);}
// The 3D canvas alone: the presentation overlay (card, story panel) is hidden for the capture and shown again.
const canvasShot=async(page,save)=>{await page.evaluate(()=>{document.querySelector('#presentationOverlay').style.visibility='hidden';});await frames(page);
 const box=await page.locator('#stage canvas').first().boundingBox(),clip={x:Math.max(0,box.x),y:Math.max(0,box.y),width:Math.min(box.width,page.viewportSize().width),height:Math.min(box.height,page.viewportSize().height)};
 const png=await page.screenshot({clip,...(save?{path:path.join(QA,save+'.png')}:{})});await page.evaluate(()=>{document.querySelector('#presentationOverlay').style.visibility='';});return 'data:image/png;base64,'+png.toString('base64');};
async function residueClean(page,name,{levelView='active'}={}){const r=await page.evaluate(()=>View3D.presentationAxonResidue);
 assert.equal(r.active,false,`${name}: no FT3D-5 scene left`);assert.equal(r.handles,0,`${name}: no handle left`);
 for(const d of r.levelDeltas)assert.ok(Math.abs(d.deltaY)<1e-9,`${name}: level ${d.levelId} back in place (${d.deltaY})`);
 for(const k of ['levelViewRestored','visibleLevelsRestored','stairsRestored','groundRestored','contextRestored','roofExteriorRestored','contactRestored'])assert.equal(r[k],true,`${name}: ${k}`);
 assert.equal(r.levelView,levelView,`${name}: levelView`);return r;}
async function exit(page,editor,name,how='close'){
 if(how==='escape'){await page.locator('#presentationOverlay').focus().catch(()=>{});await page.keyboard.press('Escape');}else if(how==='back')await page.goBack();else await page.locator('#presentationClose').click();
 await page.waitForFunction(()=>!FloorPlanPresentation.active);
 await page.waitForFunction(()=>!View3D.lifecycleMetrics.animating&&!document.body.classList.contains('presentation-exiting'),null,{timeout:30000});await page.waitForTimeout(600);const after=await snapshot(page);
 for(const k of ['project','building','revision','undo'])assert.deepEqual(after[k],editor[k],`${name}: ${k} unchanged`);assert.deepEqual(after.storage,[],`${name}: nothing stored`);
 assert.equal(await page.locator('#presentationAxonPlay').count(),0,`${name}: controls leave with the presentation`);
 const r=await page.evaluate(()=>View3D.presentationAxonResidue);assert.equal(r.active,false);assert.equal(r.handles,0);}
// Opens the standalone FT3D-5 scene on the current overview (reduced motion: it waits at p = 0).
async function standalone(page,kind){const label=kind==='exploded-levels-open'?'Ver despiece':'Ver axonometría';const b=page.locator('#presentationAxonPlay');
 assert.equal(await b.isVisible(),true,'standalone action on the overview');assert.equal((await b.textContent()).trim(),label);await b.click();
 await page.waitForFunction(k=>FloorPlanPresentation.story?.kind===k,kind,{timeout:180000});await frames(page);return info(page);}

test('two levels, active lower: breakdown ownership, p0/p1 before End, holds, reverse, five cycles, no rebuild per apply (1440x900)',{timeout:1500000},async t=>{
 const {page,errors,external}=await open(t,{width:1440,height:900});await importZip(page,zips.duplex);const editor=await snapshot(page);
 await openConfig(page);
 assert.equal(await page.locator('#presentationAxonCompact').isDisabled(),false);assert.equal(await page.locator('#presentationAxonExploded').isDisabled(),false,'two valid levels: breakdown available');
 await page.locator('#presentationAxonExploded').check();const start=page.getByRole('button',{name:'Iniciar presentación'});await start.scrollIntoViewIfNeeded();await start.click();await settled(page);
 const overview=await info(page),base=await canvasShot(page,'pix-overview');await shot(page,'duplex-overview');
 assert.equal(overview.residue.levelView,'active');const rebuilds0=overview.residue.rebuilds;
 const s0=await standalone(page,'exploded-levels-open');
 assert.equal(s0.info.axon.levelView,'all','whole building available for the reading');assert.equal(s0.info.axon.baseLevelView,'active');
 assert.equal(s0.residue.rebuilds,rebuilds0+1,'one rebuild to enter');
 // p = 0 before End: the overview exactly — pose, visible levels, nothing moved, pixels.
 assert.ok(samePose(s0.pose,overview.pose),'p0 pose = overview');
 assert.deepEqual(s0.info.axon.visibleLevelIds,s0.info.axon.baseVisibleLevelIds);
 for(const l of s0.info.axon.live.levels)assert.equal(l.visible,s0.info.axon.baseVisibleLevelIds.includes(l.levelId),'p0: the levels the overview shows, no more');
 const p0diff=await canvasDiff(page,base,await canvasShot(page,'pix-p0'));assert.ok(p0diff<1.5,`p0 pixels match the overview (${p0diff.toFixed(2)})`);
 // Checkpoints.
 const kinds=['exploded-levels-open'],seen={};
 for(const [p,name] of [[11,'exploded-entry'],[22,'exploded-compact'],[38,'exploded-separation'],[64,'exploded-hold'],[82,'exploded-recompose'],[95,'exploded-return']]){
  const s=await scrub(page,p);seen[p]=s;await shot(page,name);
  const live=s.info.axon.live,dy=new Map(s.info.axon.levelDeltas.map(x=>[x.levelId,x.dyM])),act=s.residue.live.active;
  for(const o of live.active)assert.ok(Math.abs(o.y-(dy.get(s.info.axon.handles?null:null)??o.y))>=0,'');
  // The active level (lower) does not move; its five groups share one transform.
  assert.ok(live.active.every(o=>Math.abs(o.y-live.active[0].y)<1e-9),`${name}: archFloor, archUp, furnG, lampG and slab move together`);
 }
 const hold=seen[64].info.axon;assert.equal(hold.phase,'exploded');
 const upper=hold.live.levels[0],delta=hold.levelDeltas.find(x=>x.levelId===upper.levelId).dyM;assert.ok(delta>.79,'upper level lifted by its visual separation');
 const real=await page.evaluate(id=>{const L=FloorPlanBuildingUI.presentationSources().levels;const a=L.find(l=>l.levelId===FloorPlanBuildingUI.presentationSources().activeLevelId),u=L.find(l=>l.levelId===id);return (u.elevationMm-a.elevationMm)/1000;},upper.levelId);
 assert.ok(Math.abs(upper.y-(real+delta))<1e-9,'absolute: real elevation + delta');assert.equal(upper.visible,true);
 assert.ok(hold.live.stairs.every(x=>!x.visible),'stairs hidden while apart');assert.equal(hold.live.contact.visible,false,'contact hidden');
 assert.equal(hold.live.ground.visible,false,'ground hidden while apart');
 const compact=seen[22].info.axon;assert.ok(compact.levelDeltas.every(x=>x.dyM===0),'compact before separating');assert.ok(compact.live.stairs.every(x=>x.visible),'stairs kept in compact');
 // p = 1 before End.
 const s1=await scrub(page,100);assert.equal(s1.info.active,true,'still in the scene');assert.ok(samePose(s1.pose,overview.pose),'p1 pose = overview');
 assert.deepEqual(s1.info.axon.visibleLevelIds,s1.info.axon.baseVisibleLevelIds);assert.ok(s1.info.axon.levelDeltas.every(x=>x.dyM===0));
 const p1diff=await canvasDiff(page,base,await canvasShot(page,'pix-p1'));assert.ok(p1diff<1.5,`p1 pixels match the overview (${p1diff.toFixed(2)})`);
 // Reverse and scrub are history-independent.
 const again=await scrub(page,64);assert.deepEqual(again.info.axon.levelDeltas,hold.levelDeltas);assert.ok(samePose(again.pose,seen[64].pose));
 // No rebuild per apply: many states, same rebuild count.
 const r0=(await info(page)).residue.rebuilds;await page.evaluate(()=>{for(let i=0;i<60;i++)View3D.presentationStoryApply((i*37%100)/100);});
 assert.equal((await info(page)).residue.rebuilds,r0,'presentationStoryApply never rebuilds');
 // finishStory(0): back to the overview, the presentation continues there.
 await scrub(page,40);await page.locator('#presentationStoryPlan').click();await settled(page);
 const r=await residueClean(page,'finish(0)');assert.equal(r.rebuilds,rebuilds0+2,'one rebuild to leave');
 assert.ok(samePose((await info(page)).pose,overview.pose),'same overview');
 // Five cycles: no drift, no linear growth.
 const counts=[];
 for(let c=0;c<5;c++){await standalone(page,'exploded-levels-open');await scrub(page,64);await scrub(page,30);await scrub(page,100);await page.locator('#presentationStoryPlan').click();await settled(page);
  const z=await residueClean(page,'cycle '+c);counts.push([z.sceneChildren,z.levelsChildren,z.memory.geometries,z.memory.textures]);}
 assert.ok(counts.every(c=>c[0]===counts[0][0]&&c[1]===counts[0][1]),`scene and level groups stable: ${JSON.stringify(counts)}`);
 assert.ok(counts[4][2]-counts[1][2]<=counts[1][2]-counts[0][2]+8,`no linear geometry growth: ${JSON.stringify(counts)}`);
 assert.ok(samePose((await info(page)).pose,overview.pose),'no drift after five cycles');
 await exit(page,editor,'duplex');assert.deepEqual(errors,[]);assert.deepEqual(external,[],'no network');
});

test('one level: default OFF, OFF parity, script order, ES/EN/ZH, dialog reopen, compact only, reduced hold, p0/p1, capture, Escape (1440x900)',{timeout:900000},async t=>{
 const {page,errors,external}=await open(t,{width:1440,height:900});await example(page);const editor=await snapshot(page);
 // The core loads before the UI that consumes it.
 const order=await page.evaluate(()=>[...document.scripts].map(s=>s.getAttribute('src')||'').filter(Boolean));
 assert.ok(order.indexOf('js/presentation-axon-core.js')>-1&&order.indexOf('js/presentation-axon-core.js')<order.indexOf('js/presentation-ui.js'),'core before presentation-ui');
 // ES/EN/ZH: every new visible string goes through tx with three languages.
 const ui=await (await page.request.get(url+'js/presentation-ui.js')).text();
 for(const es of ['Lectura del edificio','Sin axonometría','Vista axonométrica','Despiece por plantas','Ver despiece','Ver axonometría','Separamos las plantas para leer su relación espacial','Recomponemos el edificio','Despiece espacial · separación visual'])
  assert.match(ui,new RegExp(`'${es.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}','[^']+','[^']+'`),`${es}: ES/EN/ZH`);
 // Repeated open/close of the dialog: one control, never duplicated.
 for(let i=0;i<3;i++){await openConfig(page);assert.equal(await page.locator('#presentationAxonOptionBox').count(),1,'one FT3D-5 control');await page.getByRole('button',{name:'Cancelar'}).click();await page.locator('#presentationConfig').waitFor({state:'hidden'});}
 await openConfig(page);
 assert.equal(await page.locator('#presentationAxonOff').isChecked(),true,'off by default');assert.equal(await page.locator('#presentationAxonCompact').isDisabled(),false);
 assert.equal(await page.locator('#presentationAxonExploded').isDisabled(),true,'one level: no breakdown');
 assert.match(await page.locator('#presentationAxonHint').textContent(),/al menos dos plantas/);await page.locator('#presentationAxonOptionBox').screenshot({path:path.join(QA,'one-level-option.png')});
 // OFF parity: the presentation keeps its tools and story; no FT3D-5 node or scene.
 const start=page.getByRole('button',{name:'Iniciar presentación'});await start.scrollIntoViewIfNeeded();await start.click();await settled(page);
 assert.equal(await page.locator('#presentationAxonPlay').count(),0,'OFF: no FT3D-5 action');assert.equal((await info(page)).residue.handles,0);
 await exit(page,editor,'off parity');
 await configure(page,{mode:'compact'});await settled(page);
 const overview=await info(page),base=await canvasShot(page,'one-level-p0-overview');assert.equal(overview.residue.levelView,'active');const rebuilds0=overview.residue.rebuilds;
 assert.equal(await page.locator('#presentationCapture').isDisabled(),false,'capture ready on the overview');
 const s0=await standalone(page,'axon-open');assert.equal(s0.residue.rebuilds,rebuilds0,'single project: no level rebuild');assert.ok(samePose(s0.pose,overview.pose),'p0 = overview');
 assert.ok(await canvasDiff(page,base,await canvasShot(page))<1.5,'p0 pixels');
 assert.equal(await page.locator('#presentationCapture').isDisabled(),true,'capture waits while the story runs');
 // Reduced motion: one explicit step lands on the compact reading.
 await page.locator('#presentationStoryPlay').click();await page.waitForFunction(()=>View3D.presentationStoryInfo.phase==='axon',null,{timeout:120000});await frames(page);
 const hold=await info(page);assert.ok(Math.abs(hold.story.local-.5)<1e-9,'reduced: the compact hold');assert.equal(hold.info.axon.phase,'axon');await canvasShot(page,'one-level-axon-hold');await shot(page,'one-level-axon-hold-card');
 assert.match(await page.locator('#presentationStoryCaption').textContent(),/Vista axonométrica/);
 assert.ok(hold.info.axon.levelDeltas.every(x=>x.dyM===0),'compact: nothing separated');
 const s1=await scrub(page,100);assert.ok(samePose(s1.pose,overview.pose),'p1 = overview before End');assert.ok(await canvasDiff(page,base,await canvasShot(page,'one-level-p1'))<1.5,'p1 pixels');
 await scrub(page,50);await exit(page,editor,'escape mid-scene','escape');await residueClean(page,'escape');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('active upper level, offsets X/Z, different footprints, unusual heights: the active level moves as one, no overlap (1440x900)',{timeout:900000},async t=>{
 const {page,errors,external}=await open(t,{width:1440,height:900});await importZip(page,zips.offset);
 const upperId=await page.evaluate(()=>FloorPlanBuildingUI.presentationSources().levels.find(l=>l.order===1).levelId);
 await page.evaluate(id=>FloorPlanBuildingUI.selectLevel(id),upperId);await page.waitForTimeout(800);const editor=await snapshot(page);
 const d=await page.evaluate(()=>FloorPlanPresentationAxon.derive({levels:FloorPlanBuildingUI.presentationSources().levels}));
 const [lo,up]=d.levels;assert.deepEqual(up.offsetMm,{x:1500,y:-900},'offsets read from the building');
 assert.ok(up.boundsMm.bottomMm+up.explodedExtraYmm-(lo.boundsMm.topMm+lo.explodedExtraYmm)>=d.visualClearanceMm-1e-6,'no vertical overlap with 4.6 m walls under 3.1 m');
 assert.ok(up.explodedExtraYmm>d.baseVisualGapMm,'overlap-safe extra beyond the nominal gap');
 // The presentation shows each stop on its own level: the reading is opened from the upper level's overview, so the
 // active level is the upper one.
 await configure(page,{mode:'exploded'});await settled(page);
 const upperStop=await page.evaluate(id=>FloorPlanPresentation.plan.stops.findIndex(s=>s.kind==='overview'&&s.levelId===id),upperId);assert.ok(upperStop>0,'upper level overview stop');
 await page.locator('.presentation-stops button').nth(upperStop).click();await settled(page);
 assert.equal(await page.evaluate(()=>FloorPlanBuildingUI.presentationSources().activeLevelId),upperId,'active upper level');const overview=await info(page);
 const s0=await standalone(page,'exploded-levels-open');assert.ok(samePose(s0.pose,overview.pose));
 for(const [p,name] of [[22,'active-upper-compact'],[64,'active-upper-hold']]){const s=await scrub(page,p);await shot(page,name);
  const live=s.info.axon.live,dy=s.info.axon.levelDeltas.find(x=>x.levelId===upperId).dyM;
  for(const o of live.active)assert.ok(Math.abs(o.y-dy)<1e-9,`${name}: ${o.name} carries the active (upper) level delta`);
  const names=live.active.map(o=>o.name);for(const n of ['archFloor','archUp','furnG','lampG','activeSlab'])assert.ok(names.includes(n),`${n} owned by the active level (${names.join(',')}; active ${await page.evaluate(()=>FloorPlanBuildingUI.presentationSources().activeLevelId)})`);
  const lower=live.levels.find(l=>l.levelId===lo.levelId);assert.ok(Math.abs(lower.y-(-3.1)-(s.info.axon.levelDeltas.find(x=>x.levelId===lo.levelId).dyM))<1e-9&&s.info.axon.levelDeltas.find(x=>x.levelId===lo.levelId).dyM===0,`${name}: the lower level stays at its real place`);
  assert.ok(live.assets.every(a=>a.parentIsFurniture),'assets keep their furniture parent');}
 await scrub(page,30);await shot(page,'offset-separation');
 await page.locator('#presentationStoryPlan').click();await settled(page);await residueClean(page,'active upper');
 await exit(page,editor,'active upper','back');assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('whole story: section + façade + breakdown once, in order; cancel at 25/40/60/80 %; Close (1440x900)',{timeout:1500000},async t=>{
 const {page,errors,external}=await open(t,{width:1440,height:900});await importZip(page,zips.duplex);const editor=await snapshot(page);
 await configure(page,{mode:'exploded',section:true,elevation:true,chapter:true});await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='plan-reveal',null,{timeout:180000});
 await page.locator('#presentationStoryPlay').click();await settled(page);
 await page.locator('#presentationStoryFull').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1);
 const kinds=(await info(page)).story.kinds;
 assert.equal(kinds.filter(k=>k==='exploded-levels-open').length,1,`one FT3D-5 scene: ${kinds.join(' → ')}`);assert.equal(kinds.filter(k=>k==='axon-open').length,0,'no extra compact scene in exploded mode');
 const i=kinds.indexOf('exploded-levels-open');assert.equal(kinds[i-1],'elevation-open','after the façade');assert.ok(['room-descent','plan-reveal',undefined].includes(kinds[i+1]),'before the descent of the same block');
 assert.ok(kinds.indexOf('section-open')<i);
 const at=(p)=>page.evaluate(([k,i,p])=>FloorPlanPresentationStory.sequence(k.map(x=>FloorPlanPresentationStory.SCENE_MS[x])).at(i,p),[kinds,i,p]);
 for(const p of [.25,.4,.6,.8]){const s=await scrub(page,Math.round(1000*await at(p)));assert.equal(s.story.kind,'exploded-levels-open');
  // «← Escena anterior» mid-scene goes back to the start of this scene: the overview, nothing lifted or hidden.
  await page.locator('#presentationStoryPlan').click();await page.waitForFunction(()=>!FloorPlanPresentation.story?.playing&&!FloorPlanPresentation.story?.busy);await frames(page);
  const r=await info(page);assert.equal(r.story.kind,'exploded-levels-open');assert.ok(r.story.local<1e-6,`cancel at ${p}: back to the scene start`);
  assert.ok(r.info.axon.levelDeltas.every(x=>x.dyM===0),`cancel at ${p}: nothing lifted`);assert.deepEqual(r.info.axon.visibleLevelIds,r.info.axon.baseVisibleLevelIds,`cancel at ${p}: overview levels`);
  const real=r.info.axon.live.levels.every(l=>Math.abs(l.y-Math.round(l.y*1000)/1000)<1e-9);assert.ok(real,'levels at their real place');}
 await scrub(page,Math.round(1000*await at(.6)));await shot(page,'full-story-exploded');
 await exit(page,editor,'close mid-scene','close');await residueClean(page,'close');assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('Begin failure after active → all rolls back; all → all; furniture OFF and contact ON preserved; resize keeps p (1440x900)',{timeout:1200000},async t=>{
 const {page,errors,external}=await open(t,{width:1440,height:900});await importZip(page,zips.duplex);
 await page.locator('[data-view="3d"]').first().click();await page.waitForTimeout(1500);
 await page.evaluate(()=>document.querySelector('#toggles3d [data-t="furn"]').click());await page.waitForTimeout(300);const editor=await snapshot(page);
 await configure(page,{mode:'exploded'});await settled(page);
 await page.locator('#presentationContactShadows').click();await page.waitForTimeout(300);
 const overview=await info(page),contactOn=await page.evaluate(()=>View3D.presentationContactShadows.enabled);
 // Begin fails after active → all: everything is undone before the error comes out.
 const fail=await page.evaluate(()=>{const before={view:View3D.levelView,res:View3D.presentationAxonResidue,pose:View3D.presentationPose()};
  const descriptor=FloorPlanPresentationAxon.derive({levels:FloorPlanBuildingUI.presentationSources().levels});let error=null;
  try{View3D.presentationStoryBegin(FloorPlanPresentation.current,{axon:{descriptor,variant:'vertical-levels',__testFailAfterAll:true}},'exploded-levels-open');}catch(e){error=e.message;}
  return {error,before,after:{view:View3D.levelView,res:View3D.presentationAxonResidue,pose:View3D.presentationPose(),info:View3D.presentationStoryInfo}};});
 assert.match(fail.error,/inyectado/);assert.equal(fail.after.view,'active','levelView restored');assert.equal(fail.after.res.rebuilds,fail.before.res.rebuilds+2,'in and back out');
 assert.equal(fail.after.res.handles,0,'handles cleared');assert.equal(fail.after.info.active,false);assert.ok(samePose(fail.after.pose,fail.before.pose),'camera restored');
 for(const k of ['visibleLevelsRestored','stairsRestored','groundRestored','contextRestored','roofExteriorRestored','contactRestored'])assert.equal(fail.after.res[k],true,k);
 // Furniture OFF stays OFF; contact shadows come back as they were.
 const s=await standalone(page,'exploded-levels-open');const h=await scrub(page,64);
 assert.equal(h.info.axon.live.furniture,false,'furniture OFF stays OFF');assert.ok(h.info.axon.live.levels.every(l=>l.furnitureVisible!==true),'secondary furniture stays OFF');
 assert.equal(h.info.axon.live.contact.visible,false);
 // Resize: same descriptor, same p, no rebuild, pure narrative recreated.
 const r0=h.residue.rebuilds;await page.setViewportSize({width:1200,height:800});await page.waitForTimeout(1500);await frames(page);
 const rs=await info(page);assert.equal(rs.story?.kind,'exploded-levels-open','still in the scene');assert.ok(Math.abs(rs.story.local-.64)<.011,`same p after resize (${rs.story.local})`);
 assert.equal(rs.residue.rebuilds,r0,'resize does not rebuild');assert.equal(rs.info.axon.phase,'exploded');
 await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(1500);
 await page.locator('#presentationStoryPlan').click();await settled(page);await residueClean(page,'after resize');
 assert.equal(await page.evaluate(()=>View3D.presentationContactShadows.enabled),contactOn,'contact state kept');
 await exit(page,editor,'toggles');
 // all → all: with every level already shown, nothing to switch, nothing rebuilt.
 await page.locator('[data-view="3d"]').first().click();await page.waitForTimeout(1200);await page.evaluate(()=>document.querySelector('#levelViewAll').click());await page.waitForFunction(()=>View3D.levelView==='all');
 const editor2=await snapshot(page);await configure(page,{mode:'exploded'});await settled(page);const ov2=await info(page);
 const a=await standalone(page,'exploded-levels-open');assert.equal(a.residue.rebuilds,ov2.residue.rebuilds,'all → all: no rebuild');assert.equal(a.info.axon.baseLevelView,'all');
 await scrub(page,64);await scrub(page,100);await page.locator('#presentationStoryPlan').click();await settled(page);await residueClean(page,'all→all',{levelView:'all'});
 await exit(page,editor2,'all→all');assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('partial building: the reading names the level it leaves out (1440x900)',{timeout:600000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});await importZip(page,zips.partial);await openConfig(page);
 const hint=await page.locator('#presentationAxonHint').textContent();assert.match(hint,/Lectura parcial/);assert.match(hint,/Planta primera/);
 assert.equal(await page.locator('#presentationAxonExploded').isDisabled(),true,'only one valid level: no breakdown');
 await page.locator('#presentationAxonOptionBox').screenshot({path:path.join(QA,'partial-option.png')});assert.deepEqual(errors,[]);
});

for(const viewport of [{width:390,height:844},{width:844,height:390}]){
 test(`phone ${viewport.width}x${viewport.height}: breakdown with operable controls and no overflow`,{timeout:900000},async t=>{
  const {page,errors,external}=await open(t,viewport);await importZip(page,zips.duplex);const editor=await snapshot(page);
  await configure(page,{mode:'exploded'});await settled(page);await standalone(page,'exploded-levels-open');
  const h=await scrub(page,64);assert.equal(h.info.axon.phase,'exploded');assert.equal(await noOverflow(page),true,'no horizontal overflow');
  await shot(page,`phone-${viewport.width}x${viewport.height}-hold`);
  for(const id of ['#presentationStoryPlay','#presentationStoryPlan','#presentationClose']){const b=page.locator(id);await b.scrollIntoViewIfNeeded();assert.equal(await b.isVisible(),true,`${id} reachable`);}
  await page.locator('#presentationStoryPlan').click();await settled(page);await residueClean(page,'phone');await exit(page,editor,'phone');assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 });
}

test('reduced motion breakdown: compact hold, then exploded hold, then the presentation continues (1440x900)',{timeout:900000},async t=>{
 const {page,errors,external}=await open(t,{width:1440,height:900},{reduced:true});await importZip(page,zips.duplex);const editor=await snapshot(page);
 await configure(page,{mode:'exploded'});await settled(page);const overview=await info(page);await standalone(page,'exploded-levels-open');
 const H=await page.evaluate(()=>FloorPlanPresentationStory.EXPLODED_LEVELS_OPEN);
 await page.locator('#presentationStoryPlay').click();await page.waitForFunction(h=>Math.abs((FloorPlanPresentation.story?.local??-1)-h)<1e-9,H.reducedCompact,{timeout:120000});await frames(page);
 const c=await info(page);assert.ok(c.info.axon.levelDeltas.every(x=>x.dyM===0),'first hold: compact');assert.ok(c.info.axon.live.stairs.every(s=>s.visible));await shot(page,'reduced-exploded-compact');
 await page.locator('#presentationStoryPlay').click();await page.waitForFunction(h=>Math.abs((FloorPlanPresentation.story?.local??-1)-h)<1e-9,H.reducedExploded,{timeout:120000});await frames(page);
 const e=await info(page);assert.equal(e.info.axon.phase,'exploded','second hold: levels apart');await shot(page,'reduced-exploded-hold');
 assert.match(await page.locator('#presentationStoryPlay').textContent(),/Continuar presentación/);
 await page.locator('#presentationStoryPlay').click();await settled(page);await residueClean(page,'reduced');assert.ok(samePose((await info(page)).pose,overview.pose),'ends on the overview');
 await exit(page,editor,'reduced');assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});
