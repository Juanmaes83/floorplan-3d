/* FT3D-1a «Empezar desde el plano»: an optional chapter of the presentation, off by default. Checked on the real app:
   - FT3D off: the presentation is the one that existed (no chapter controls, same tools, same overview pose);
   - FT3D on: checkpoints p = 0, .25, .5, .75, 1 (walls rise, lens opens), p = 1 equals the overview pose of the
     presentation without the chapter, 0→1, 1→0 and 0→1→0 give the same states, and the presentation continues;
   - reduced motion: plan ⇄ 3D without intermediate frames; phone viewport; a two-level building;
   - exit: same project, same undo history, nothing persisted, lens/near/far/orbit and walls restored. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile),{chromium}=require('playwright');
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),S=require('./fixtures/stair-conflict-building.cjs');
const QA=process.env.STORY_ARTIFACTS||path.join(os.tmpdir(),'presentation-story');let server,url,browser,zip;const cache=new Map();
const three=target=>require('./helpers/three-module.cjs')(target,()=>run('curl',['--fail','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout));
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',file.endsWith('.hdr')?'application/octet-stream':/\.m?js$/.test(file)?'text/javascript':file.endsWith('.webp')?'image/webp':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.glb')?'model/gltf-binary':'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(QA,{recursive:true});
 const b=S.build().building;for(const l of b.levels)l.project.objects=l.project.objects.filter(o=>!/sofa|bed/.test(o.id));
 const {entries}=await B.packageEntries(b,()=>null,T.imageInfo);zip=path.join(await fs.mkdtemp(path.join(os.tmpdir(),'story-')),'duplex.zip');await fs.writeFile(zip,Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function open(t,viewport,options={}){const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,reducedMotion:options.reduced?'reduce':'no-preference',...(process.env.STORY_VIDEO?{recordVideo:{dir:process.env.STORY_VIDEO,size:viewport}}:{})});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();if(!cache.has(target))cache.set(target,three(target));await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await cache.get(target)});});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin,null,{timeout:30000});return {page,errors};}
const settledOverview=page=>page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:180000});
async function configure(page,chapter){await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 const option=page.locator('#presentationStoryOption');assert.equal(await option.isChecked(),false,'the chapter is off by default and never remembered');
 if(chapter)await option.check();await page.getByRole('button',{name:'Iniciar presentación'}).click();}
const snapshot=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),undo:undoStack.length,redo:redoStack.length,storage:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])),
 materials:JSON.stringify(FloorPlanApp.project.materials)}));
const pose=page=>page.evaluate(()=>({...View3D.cameraState,story:View3D.presentationStoryInfo}));
const near=(a,b,eps)=>a.position.every((v,i)=>Math.abs(v-b.position[i])<=eps)&&a.quaternion.every((v,i)=>Math.abs(v-b.quaternion[i])<=eps)&&Math.abs(a.fov-b.fov)<=1e-6;
const tools=page=>page.$$eval('#presentationTools button',list=>list.map(b=>b.id));
async function scrub(page,value){await page.evaluate(v=>{const s=document.querySelector('#presentationStorySlider');s.value=String(v);s.dispatchEvent(new Event('input',{bubbles:true}));},value);
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));return pose(page);}
async function exitAndCheck(page,before,name,baseline=null){
 // baseline: what the same presentation without the chapter left (3D view state and the storage keys it wrote).
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active);
 // The editor's own 3D → plan exit animation (walls flatten, then return to full height) ends before measuring.
 await page.waitForFunction(()=>!View3D.lifecycleMetrics.animating&&!document.querySelector('#stage')?.classList.contains('animating'),null,{timeout:30000});await page.waitForTimeout(400);
 const after=await snapshot(page),info=await page.evaluate(()=>({...View3D.presentationStoryInfo,furniture:View3D.levelInspect().furniturePlan.length,walls:View3D.wallMeshes?.length??0}));
 assert.equal(after.project,before.project,`${name}: same project`);assert.equal(after.undo,before.undo,`${name}: same undo history`);assert.equal(after.redo,before.redo);
 assert.equal(after.materials,before.materials,`${name}: materials intact`);
 const changed=Object.keys({...before.storage,...after.storage}).filter(k=>before.storage[k]!==after.storage[k]);
 // The presentation already saves its room selection (and the journey/editor state around it); with the chapter, only
 // keys the presentation without it also wrote may change.
 if(baseline)assert.ok(changed.every(k=>k.startsWith('rubik-sota-presentation-v1:')||baseline.changed.includes(k)),`${name}: only what the presentation already saved (${changed} vs ${baseline.changed})`);
 assert.ok(!Object.keys(after.storage).some(k=>/story|ft3d|plano/i.test(k)),`${name}: no chapter preference stored`);
 assert.equal(info.active,false);assert.equal(info.wallScale,1,`${name}: walls at full height`);
 // Lens, near/far, orbit limits and input as after the same presentation without the chapter.
 // Furniture and walls counted in the scene: nothing duplicated.
 if(baseline)assert.deepEqual(info,baseline.info,`${name}: 3D view restored as without the chapter`);
 assert.equal(await page.locator('#presentationStory,#presentationStoryReplay').count(),0,`${name}: chapter controls leave with the presentation`);return {info,changed};}

test('FT3D off: the presentation is unchanged; FT3D on: checkpoints, p = 1 = overview, reversible, clean exit (1440x900)',{timeout:600000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});await page.locator('#welcomeExample').click();await page.waitForTimeout(800);
 const editor=await snapshot(page);
 // ── NO REGRESSION: chapter not activated ──
 await configure(page,false);await settledOverview(page);await page.waitForTimeout(300);
 const offTools=await tools(page),overview=await pose(page);
 assert.equal(await page.locator('#presentationStory,#presentationStoryReplay').count(),0,'no chapter controls when it is off');
 assert.equal(await page.evaluate(()=>FloorPlanPresentation.storyEnabled),false);assert.equal(overview.story.active,false);assert.equal(overview.story.wallScale,1);
 assert.ok(!offTools.includes('presentationStoryReplay'));
 await page.screenshot({path:path.join(QA,'1440x900-off-overview.png')});
 const afterOff=await exitAndCheck(page,editor,'off');
 // ── FT3D on ──
 await configure(page,true);
 await page.waitForFunction(()=>FloorPlanPresentation.story&&document.querySelector('#presentationStory')&&!document.querySelector('#presentationStory').hidden,null,{timeout:180000});
 assert.equal(await page.locator('#presentationCapture').isDisabled(),true,'no capture of a half-built narrative');
 // p = 0 continues the 2D view the presentation was started from (same centre and framed height, north up).
 assert.equal(await page.evaluate(()=>View3D.presentationStoryInfo.info.fromEditorView),true,'starts from the 2D editor view');
 const states={};
 for(const v of [0,25,50,75,100]){states[v]=await scrub(page,v);await page.screenshot({path:path.join(QA,`1440x900-p${String(v).padStart(3,'0')}.png`)});}
 assert.ok(states[0].story.wallScale<.02,'p=0 walls flattened');assert.ok(states[0].fov<=8,'p=0 narrow lens');assert.equal(states[0].story.phase,'plan');
 for(const [a,b] of [[0,25],[25,50],[50,75],[75,100]]){assert.ok(states[b].story.wallScale>=states[a].story.wallScale);assert.ok(states[b].fov>=states[a].fov-1e-9);}
 assert.equal(states[75].story.wallScale,1);
 assert.ok(near(states[100],overview,1e-4),`p=1 is the overview pose without the chapter\n${JSON.stringify(states[100])}\n${JSON.stringify(overview)}`);
 assert.equal(states[100].story.near,afterOff.info.near);assert.equal(states[100].story.far,afterOff.info.far);
 // 1 → 0 and 0 → 1 → 0: the same states.
 for(const v of [50,0,75,25,100,0])assert.ok(near(await scrub(page,v),states[v],1e-6),`p=${v/100} reproduces`);
 // Play to 3D: the narrative ends on the overview and the presentation continues from it.
 await page.locator('#presentationStoryPlay').click();await settledOverview(page);await page.waitForTimeout(300);
 const continued=await pose(page);assert.ok(near(continued,overview,1e-4),'continues from the overview without a jump');
 assert.equal(continued.story.active,false);assert.equal(continued.story.fov,overview.fov);
 assert.deepEqual(await tools(page),[...offTools,'presentationStoryReplay','presentationStoryEnter','presentationStoryFull'],'only the chapter tools are added, after the existing tools');
 assert.equal(await page.locator('.presentation-card h2').textContent(),'Vista general');
 await page.waitForFunction(()=>!document.querySelector('#presentationCapture').disabled,null,{timeout:60000});
 // Replay: back to the plan (1 → 0), then 3D again.
 await page.locator('#presentationStoryReplay').click();
 await page.waitForFunction(()=>FloorPlanPresentation.story&&FloorPlanPresentation.story.p===0&&!FloorPlanPresentation.story.playing,null,{timeout:60000});
 assert.ok(near(await pose(page),states[0],1e-6),'back to the same plan');
 await page.locator('#presentationStoryPlay').click();await settledOverview(page);assert.ok(near(await pose(page),overview,1e-4));
 // Moving to a room closes nothing that existed: the replay hides there.
 await page.locator('.presentation-stops button').nth(1).click();
 await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&FloorPlanPresentation.current?.kind==='room',null,{timeout:120000});
 assert.equal(await page.locator('#presentationStoryReplay').isHidden(),true);
 await exitAndCheck(page,editor,'on',afterOff);
 assert.deepEqual(errors,[]);
});

test('reduced motion: plan ⇄ 3D directly, no intermediate frames (1440x900)',{timeout:300000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900},{reduced:true});await page.locator('#welcomeExample').click();await page.waitForTimeout(800);
 const editor=await snapshot(page);
 await configure(page,false);await settledOverview(page);const reducedOff=await exitAndCheck(page,editor,'reduced off');
 await configure(page,true);await page.waitForFunction(()=>FloorPlanPresentation.story,null,{timeout:180000});await page.waitForTimeout(1200);
 assert.equal((await page.evaluate(()=>FloorPlanPresentation.story)).p,0,'waits on the plan: nothing moves by itself');
 const seen=[];await page.exposeFunction('seenP',p=>seen.push(p));
 await page.evaluate(()=>{const loop=()=>{const s=FloorPlanPresentation.story;if(s)window.seenP(s.p);if(FloorPlanPresentation.active)requestAnimationFrame(loop);};loop();});
 await page.locator('#presentationStoryPlay').click();await settledOverview(page);
 assert.ok(seen.every(p=>p===0||p===1),`only plan and 3D (${[...new Set(seen)]})`);
 await page.locator('#presentationStoryReplay').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.p===0,null,{timeout:30000});
 await exitAndCheck(page,editor,'reduced',reducedOff);assert.deepEqual(errors,[]);
});

test('phone 390x844: the chapter fits the screen and ends on the overview',{timeout:400000},async t=>{
 const {page,errors}=await open(t,{width:390,height:844});await page.locator('#welcomeExample').click();await page.waitForTimeout(800);
 const editor=await snapshot(page);
 await configure(page,false);await settledOverview(page);await page.waitForTimeout(300);const overview=await pose(page);
 assert.equal(await page.locator('#presentationStory').count(),0);const phoneOff=await exitAndCheck(page,editor,'phone off');
 await configure(page,true);await page.waitForFunction(()=>FloorPlanPresentation.story,null,{timeout:180000});
 const at0=await scrub(page,0);await page.screenshot({path:path.join(QA,'390x844-p000.png')});await scrub(page,50);await page.screenshot({path:path.join(QA,'390x844-p050.png')});
 assert.ok(at0.story.wallScale<.02);
 const layout=await page.evaluate(()=>{const r=document.querySelector('#presentationStory').getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,
  targets:[...document.querySelectorAll('#presentationStory button,#presentationStory input')].filter(e=>!e.hidden).map(e=>e.getBoundingClientRect().height)};});
 assert.ok(layout.left>=0&&layout.right<=layout.width+1&&layout.scroll<=layout.width,JSON.stringify(layout));assert.ok(layout.targets.every(h=>h>=40),`touch targets ${layout.targets}`);
 assert.ok(near(await scrub(page,100),overview,1e-4),'phone p=1 = overview');
 await page.locator('#presentationStoryPlay').click();await settledOverview(page);assert.ok(near(await pose(page),overview,1e-4));
 await exitAndCheck(page,editor,'phone on',phoneOff);assert.deepEqual(errors,[]);
});

test('two-level building: the chapter opens each level overview from its plan; editor level and project kept',{timeout:500000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});
 const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.locator('#welcomeUpload').click()]);await chooser.setFiles(zip);
 await page.waitForFunction(()=>window.FloorPlanBuildingUI?.context?.levels===2,null,{timeout:60000});await page.waitForTimeout(500);
 const editor=await snapshot(page),level=await page.evaluate(()=>FloorPlanBuildingUI.context.levelId);
 await configure(page,false);await settledOverview(page);await page.waitForTimeout(300);const groundOff=await pose(page);
 assert.equal(await page.locator('#presentationStory,#presentationStoryReplay').count(),0);const duplexOff=await exitAndCheck(page,editor,'duplex off');
 await configure(page,true);await page.waitForFunction(()=>FloorPlanPresentation.story,null,{timeout:180000});
 const p0=await scrub(page,0);assert.ok(p0.story.wallScale<.02);await page.screenshot({path:path.join(QA,'1440x900-duplex-p000.png')});
 await scrub(page,50);await page.screenshot({path:path.join(QA,'1440x900-duplex-p050.png')});
 await page.locator('#presentationStoryPlay').click();await settledOverview(page);assert.ok(near(await pose(page),groundOff,1e-4),'ground level ends on its overview');
 // Upper level overview: back to its plan and up again.
 await page.evaluate(()=>{const i=FloorPlanPresentation.plan.stops.findIndex((s,k)=>k>0&&s.kind==='overview');document.querySelectorAll('.presentation-stops button')[i].click();});
 await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&FloorPlanBuildingUI.context?.order===1&&FloorPlanPresentation.current?.kind==='overview',null,{timeout:120000});await page.waitForTimeout(300);
 const upper=await pose(page);
 await page.locator('#presentationStoryReplay').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.p===0&&!FloorPlanPresentation.story.playing,null,{timeout:60000});
 await page.screenshot({path:path.join(QA,'1440x900-duplex-upper-p000.png')});
 await page.locator('#presentationStoryPlay').click();await settledOverview(page);assert.ok(near(await pose(page),upper,1e-4),'upper level ends on its overview');
 await exitAndCheck(page,editor,'duplex',duplexOff);assert.equal(await page.evaluate(()=>FloorPlanBuildingUI.context.levelId),level);assert.deepEqual(errors,[]);
});

// ── FT3D-1b «Entrar en la estancia» ──
const settledRoom=page=>page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&FloorPlanPresentation.current?.kind==='room'&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:180000});
// Mean absolute difference (0–255) between two PNG screenshots of the same size, over the 3D stage only.
async function pixelDiff(page,a,b,skip=[]){return page.evaluate(async([a,b,skip])=>{const load=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src;});const [x,y]=await Promise.all([load(a),load(b)]);
 const c=document.createElement('canvas');c.width=x.width;c.height=x.height;const g=c.getContext('2d');g.drawImage(x,0,0);const d1=g.getImageData(0,0,c.width,c.height).data;g.clearRect(0,0,c.width,c.height);g.drawImage(y,0,0);const d2=g.getImageData(0,0,c.width,c.height).data;
 let n=0,m=0;const sx=c.width/innerWidth;for(let i=0;i<d1.length;i+=4){const px=(i/4)%c.width/sx,py=Math.floor(i/4/c.width)/sx;if(skip.some(r=>px>=r.x&&px<=r.x+r.width&&py>=r.y&&py<=r.y+r.height))continue;m++;n+=Math.abs(d1[i]-d2[i])+Math.abs(d1[i+1]-d2[i+1])+Math.abs(d1[i+2]-d2[i+2]);}return n/(m*3);},['data:image/png;base64,'+a.toString('base64'),'data:image/png;base64,'+b.toString('base64'),skip]);}
// Clicks «Entrar en …» and holds the descent at p = 0 as soon as it exists (it would otherwise play by itself).
async function enterAndHold(page){await page.evaluate(async()=>{document.querySelector('#presentationStoryEnter').click();
 for(let i=0;i<2000&&FloorPlanPresentation.story?.kind!=='room-descent';i++)await new Promise(r=>setTimeout(r,0));
 const s=document.querySelector('#presentationStorySlider');s.value='0';s.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal((await page.evaluate(()=>FloorPlanPresentation.story))?.kind,'room-descent');}
const stageShot=page=>page.screenshot({animations:'disabled',caret:'hide'});

test('room descent: overview → first room continuously, p = 1 = room stop, reversible, back to the overview, clean exit (1440x900)',{timeout:700000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});await page.locator('#welcomeExample').click();await page.waitForTimeout(800);
 const editor=await snapshot(page);
 // Without the chapter: the existing «Siguiente →» to the first room gives the reference pose and section.
 await configure(page,false);await settledOverview(page);await page.locator('.presentation-stops button').nth(1).click();await settledRoom(page);await page.waitForTimeout(300);
 const roomOff=await pose(page),frameOff=await page.evaluate(()=>View3D.presentationFrameInfo);
 assert.equal(await page.locator('#presentationStoryEnter').count(),0,'no chapter tool without the chapter');
 const off=await exitAndCheck(page,editor,'descent off');
 // The chapter plays to the overview by itself and hands over to the presentation.
 await configure(page,true);await page.waitForFunction(()=>FloorPlanPresentation.story,null,{timeout:180000});await settledOverview(page);await page.waitForTimeout(300);
 const overview=await pose(page),enter=page.locator('#presentationStoryEnter');
 assert.equal(await enter.isVisible(),true);assert.match(await enter.textContent(),/^Entrar en /);
 await enterAndHold(page);
 const states={};
 for(const v of [0,25,50,75,100]){states[v]=await scrub(page,v);await page.screenshot({path:path.join(QA,`1440x900-descent-p${String(v).padStart(3,'0')}.png`)});}
 assert.ok(near(states[0],overview,1e-4),'p=0 is the overview the descent started from');
 assert.ok(near(states[100],roomOff,1e-4),`p=1 is the room stop of the presentation\n${JSON.stringify(states[100])}\n${JSON.stringify(roomOff)}`);
 const sectionScale=frameOff.section?frameOff.wallTop/2.8:1,height=st=>st.story.section?sectionScale:st.story.wallScale;
 for(const [a,b] of [[0,25],[25,50],[50,75],[75,100]]){assert.ok(states[b].position[1]<=states[a].position[1]+1e-6,'descends');assert.ok(height(states[b])<=height(states[a])+1e-9,'walls go down');}
 // At p = 1 the room's own wall section is on, as the stop shows it.
 assert.equal(states[100].story.section,!!frameOff.section);if(frameOff.section)assert.equal(states[100].story.cut,frameOff.wallTop);assert.equal(states[100].story.wallScale,1);
 assert.equal(states[0].story.section,false);
 for(const v of [50,0,100,25,75])assert.ok(near(await scrub(page,v),states[v],1e-6),`p=${v/100} reproduces`);
 // Continue at p = 1: the real section replaces the lowered walls; the image barely changes.
 await scrub(page,100);await page.waitForTimeout(200);const before=await stageShot(page);
 await page.locator('#presentationStoryPlay').click();await settledRoom(page);await page.waitForTimeout(300);const after=await stageShot(page);
 const room=await pose(page);assert.ok(near(room,roomOff,1e-4),'continues from the room view without a jump');
 await fs.writeFile(path.join(QA,'1440x900-descent-swap-before.png'),before);await fs.writeFile(path.join(QA,'1440x900-descent-swap-after.png'),after);
 // Only the scene: the card (overview → room) and the minimap change by design.
 const ui=await page.evaluate(()=>['.presentation-card','#presentationMinimap','#territoryLayers'].map(q=>document.querySelector(q)?.getBoundingClientRect()).filter(Boolean).map(r=>({x:r.left-8,y:r.top-8,width:r.width+16,height:r.height+16})));
 const diff=await pixelDiff(page,before,after,ui);await fs.writeFile(path.join(QA,'1440x900-descent-swap.json'),JSON.stringify({meanAbsDiff:diff}));
 assert.ok(diff<8,`walls swap to the real section with a small change (${diff.toFixed(2)})`);
 assert.deepEqual(await page.evaluate(()=>({section:View3D.presentationFrameInfo.section,wallTop:View3D.presentationFrameInfo.wallTop})),{section:frameOff.section,wallTop:frameOff.wallTop});
 assert.equal(await page.locator('#presentationStoryEnter').isHidden(),true,'only on overviews');
 // Back: enter again from the overview and return with «Volver a la vista general».
 await page.locator('.presentation-stops button').nth(0).click();await settledOverview(page);
 await enterAndHold(page);
 await scrub(page,60);await page.locator('#presentationStoryPlan').click();await settledOverview(page);
 assert.equal(await page.evaluate(()=>FloorPlanPresentation.current.kind),'overview');assert.ok(near(await pose(page),overview,1e-4),'back on the overview');
 await exitAndCheck(page,editor,'descent on',off);assert.deepEqual(errors,[]);
});

test('room descent with reduced motion on a two-level building: direct, each level enters its own first room',{timeout:500000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900},{reduced:true});
 const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.locator('#welcomeUpload').click()]);await chooser.setFiles(zip);
 await page.waitForFunction(()=>window.FloorPlanBuildingUI?.context?.levels===2,null,{timeout:60000});await page.waitForTimeout(500);
 const editor=await snapshot(page),level=await page.evaluate(()=>FloorPlanBuildingUI.context.levelId);
 await configure(page,false);await settledOverview(page);const off=await exitAndCheck(page,editor,'duplex descent off');
 await configure(page,true);await page.waitForFunction(()=>FloorPlanPresentation.story,null,{timeout:180000});
 await page.locator('#presentationStoryPlay').click();await settledOverview(page);
 const seen=[];await page.exposeFunction('seenDescent',p=>seen.push(p));
 await page.evaluate(()=>{const loop=()=>{const s=FloorPlanPresentation.story;if(s?.kind==='room-descent')window.seenDescent(s.p);if(FloorPlanPresentation.active)requestAnimationFrame(loop);};loop();});
 for(const order of [0,1]){
  if(order===1){await page.evaluate(()=>{const i=FloorPlanPresentation.plan.stops.findIndex((s,k)=>k>0&&s.kind==='overview');document.querySelectorAll('.presentation-stops button')[i].click();});
   await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&FloorPlanBuildingUI.context?.order===1&&FloorPlanPresentation.current?.kind==='overview',null,{timeout:120000});}
  const want=await page.evaluate(()=>{const p=FloorPlanPresentation.plan,i=p.stops.indexOf(FloorPlanPresentation.current);return p.stops[i+1]?.roomId;});
  await page.locator('#presentationStoryEnter').click();await settledRoom(page);
  assert.equal(await page.evaluate(()=>FloorPlanPresentation.current.roomId),want);assert.equal(await page.evaluate(()=>FloorPlanBuildingUI.context.order),order);
  await page.screenshot({path:path.join(QA,`1440x900-duplex-level${order}-entered.png`)});
 }
 assert.ok(seen.every(p=>p===0||p===1),`reduced motion: only overview and room (${[...new Set(seen)]})`);
 await exitAndCheck(page,editor,'duplex descent',off);assert.equal(await page.evaluate(()=>FloorPlanBuildingUI.context.levelId),level);assert.deepEqual(errors,[]);
});

// ── FT3D-2 «Ver la historia completa»: one player, scenes from the presentation plan ──
async function holdFull(page){await page.evaluate(async()=>{document.querySelector('#presentationStoryFull').click();
 for(let i=0;i<4000&&!(FloorPlanPresentation.story?.scenes>1&&FloorPlanPresentation.story.scene>=0&&!FloorPlanPresentation.story.busy);i++)await new Promise(r=>setTimeout(r,0));
 const s=document.querySelector('#presentationStorySlider');s.value='0';s.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1&&!FloorPlanPresentation.story.busy&&FloorPlanPresentation.story.P===0,null,{timeout:60000});}
// Global progress through the slider (0–1000); waits for a scene change (a level change takes a while) to settle.
async function scrubP(page,P){await page.evaluate(v=>{const s=document.querySelector('#presentationStorySlider');s.value=String(Math.round(v*1000));s.dispatchEvent(new Event('input',{bubbles:true}));},P);
 await page.waitForFunction(v=>{const s=FloorPlanPresentation.story;return s&&!s.busy&&Math.abs(s.P-Math.round(v*1000)/1000)<1e-9;},P,{timeout:120000});
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));return page.evaluate(()=>({...View3D.cameraState,story:View3D.presentationStoryInfo,player:FloorPlanPresentation.story,level:window.FloorPlanBuildingUI?.context?.order??null,caption:document.querySelector('#presentationStoryCaption').textContent,counter:document.querySelector('#presentationStoryCounter').textContent}));}

test('whole story: plan → overview → first room as one progress; scenes match the single chapters; reversible; ends on the room stop (1440x900)',{timeout:900000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});await page.locator('#welcomeExample').click();await page.waitForTimeout(800);
 const editor=await snapshot(page);
 // References without the chapter: the overview and the first room stop.
 await configure(page,false);await settledOverview(page);await page.waitForTimeout(300);const overview=await pose(page);
 assert.equal(await page.locator('#presentationStoryFull').count(),0,'no story tool without the chapter');
 await page.locator('.presentation-stops button').nth(1).click();await settledRoom(page);await page.waitForTimeout(300);const room=await pose(page);
 const off=await exitAndCheck(page,editor,'story off');
 await configure(page,true);await page.waitForFunction(()=>FloorPlanPresentation.story,null,{timeout:180000});await settledOverview(page);await page.waitForTimeout(300);
 const full=page.locator('#presentationStoryFull');assert.equal(await full.isVisible(),true);assert.equal(await full.textContent(),'Ver la historia completa');
 assert.deepEqual(await tools(page),[...(await tools(page)).filter(id=>!/^presentationStory/.test(id)),'presentationStoryReplay','presentationStoryEnter','presentationStoryFull'],'story tools only after the existing ones');
 await holdFull(page);
 const info=await page.evaluate(()=>FloorPlanPresentation.story);assert.equal(info.scenes,2);
 const starts=await page.evaluate(()=>{const S=FloorPlanPresentationStory.sequence([FloorPlanPresentationStory.SCENE_MS['plan-reveal'],FloorPlanPresentationStory.SCENE_MS['room-descent']]);return S.starts;});
 const b=Math.round(starts[1]*1000)/1000,states={};
 for(const P of [0,.25,b-.01,b,.8,1]){states[P]=await scrubP(page,P);await page.screenshot({path:path.join(QA,`1440x900-story-P${String(Math.round(P*1000)).padStart(4,'0')}.png`)});}
 assert.equal(states[0].story.kind,'plan-reveal');assert.ok(states[0].story.wallScale<.02,'P=0 is the plan');assert.match(states[0].counter,/escena 1 de 2/);
 assert.equal(states[b].story.kind,'room-descent');assert.match(states[b].counter,/escena 2 de 2/);
 // The boundary is seamless: end of the plan reveal (the overview) = start of the descent, both = the overview stop.
 assert.ok(near(states[b],overview,1e-4),'scene boundary = overview pose');// Continuity: one step (1/1000 of P per slider unit, here 10) before the boundary the camera is already within a few % of
 // the overview distance and lens of it.
 const gap=Math.hypot(...[0,1,2].map(k=>states[b-.01].position[k]-overview.position[k])),fovGap=Math.abs(states[b-.01].fov-overview.fov);
 const reach=await page.evaluate(()=>View3D.presentationStoryInfo.info.travel);
 assert.ok(gap<.05*reach&&fovGap<3,`just before the boundary: ${gap.toFixed(3)} m of ${reach.toFixed(1)} m, fov ${fovGap.toFixed(2)}°`);
 assert.ok(near(states[1],room,1e-4),'P=1 = first room stop');
 // Reversible across the boundary.
 for(const P of [.8,.25,0,1,b,.25])assert.ok(near(await scrubP(page,P),states[P],1e-6),`P=${P} reproduces`);
 // Previous / next scene.
 await scrubP(page,.8);await page.locator('#presentationStoryPlan').click();await page.waitForFunction(v=>FloorPlanPresentation.story&&!FloorPlanPresentation.story.playing&&Math.abs(FloorPlanPresentation.story.P-v)<1e-6,starts[1],{timeout:60000});
 await page.locator('#presentationStoryPlan').click();await page.waitForFunction(()=>FloorPlanPresentation.story&&!FloorPlanPresentation.story.playing&&FloorPlanPresentation.story.P===0,null,{timeout:60000});
 await page.locator('#presentationStoryNext').click();await page.waitForFunction(v=>FloorPlanPresentation.story&&!FloorPlanPresentation.story.playing&&Math.abs(FloorPlanPresentation.story.P-v)<1e-6,starts[1],{timeout:60000});
 assert.equal(await page.locator('#presentationCapture').isDisabled(),true,'no capture during the story');
 // At the end the presentation continues on the room stop.
 await scrubP(page,1);await page.locator('#presentationStoryPlay').click();await settledRoom(page);await page.waitForTimeout(300);
 assert.ok(near(await pose(page),room,1e-4),'continues on the room stop without a jump');
 assert.equal(await page.locator('#presentationStory').isHidden(),true);
 await exitAndCheck(page,editor,'story on',off);assert.deepEqual(errors,[]);
});

test('whole story on a two-level building with reduced motion: 4 scenes, level changes, last room of the upper level',{timeout:700000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900},{reduced:true});
 const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.locator('#welcomeUpload').click()]);await chooser.setFiles(zip);
 await page.waitForFunction(()=>window.FloorPlanBuildingUI?.context?.levels===2,null,{timeout:60000});await page.waitForTimeout(500);
 const editor=await snapshot(page),level=await page.evaluate(()=>FloorPlanBuildingUI.context.levelId);
 await configure(page,false);await settledOverview(page);const off=await exitAndCheck(page,editor,'duplex story off');
 await configure(page,true);await page.waitForFunction(()=>FloorPlanPresentation.story,null,{timeout:180000});
 await page.locator('#presentationStoryPlay').click();await settledOverview(page);
 await holdFull(page);assert.equal((await page.evaluate(()=>FloorPlanPresentation.story)).scenes,4);
 const starts=await page.evaluate(()=>FloorPlanPresentationStory.sequence(['plan-reveal','room-descent','plan-reveal','room-descent'].map(k=>FloorPlanPresentationStory.SCENE_MS[k])).starts);
 const s2=await scrubP(page,Math.ceil(starts[2]*1000)/1000+.001);assert.equal(s2.level,1,'scene 3 is on the upper level');assert.equal(s2.story.kind,'plan-reveal');assert.match(s2.counter,/escena 3 de 4/);
 await page.screenshot({path:path.join(QA,'1440x900-story-duplex-scene3.png')});
 const s0=await scrubP(page,0);assert.equal(s0.level,0,'back on the ground level');
 // Reduced motion: «Reproducir historia» goes straight to the end and the presentation continues on the upper room.
 const want=await page.evaluate(()=>{const s=FloorPlanPresentation.plan.stops,o=s.map(x=>x.kind).lastIndexOf('overview');return s[o+1]?.roomId;});
 await page.locator('#presentationStoryPlay').click();await settledRoom(page);
 assert.equal(await page.evaluate(()=>FloorPlanBuildingUI.context.order),1);assert.equal(await page.evaluate(()=>FloorPlanPresentation.current.roomId),want);
 await exitAndCheck(page,editor,'duplex story',off);assert.equal(await page.evaluate(()=>FloorPlanBuildingUI.context.levelId),level);assert.deepEqual(errors,[]);
});
