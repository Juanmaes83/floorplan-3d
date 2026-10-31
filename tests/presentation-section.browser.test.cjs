/* FT3D-3 «Sección dinámica»: checked on the real app (contract §14, §15).
   - OFF by default and when off the presentation is unchanged (no control, same tools, same overview pose);
   - ON: checkpoints 0/.25/.35/.50/.65/.75/1 of section-open on the same model — p = 0 and p = 1 are the overview pose,
     a real vertical clipping plane on the building materials only (terrain/ground never), cut faces shown only from
     the frontal state on, minimap cut line and look; reverse scrub gives the same states; resize keeps the cut;
   - cancel («Volver a la vista general») and continue restore clipping, caps, lens, near/far, orbit and opt.cut;
   - whole story: plan-reveal → section-open → room-descent with no camera jump between the section end and the descent;
   - reduced motion: one explicit step to the open section, nothing skipped; autoplay + pause;
   - phone 390×844 and short landscape 844×390 without horizontal overflow; two-level building, one section per level;
   - unsupported plan: the option is disabled with a concrete reason; the project JSON never changes. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile),{chromium}=require('playwright');
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),S=require('./fixtures/stair-conflict-building.cjs');
const QA=process.env.SECTION_ARTIFACTS||path.join(os.tmpdir(),'presentation-section');let server,url,browser,zip;const cache=new Map();
const three=target=>require('./helpers/three-module.cjs')(target,()=>run('curl',['--fail','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout));
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(QA,{recursive:true});
 const b=S.build().building;for(const l of b.levels)l.project.objects=l.project.objects.filter(o=>!/sofa|bed/.test(o.id));
 const {entries}=await B.packageEntries(b,()=>null,T.imageInfo);zip=path.join(await fs.mkdtemp(path.join(os.tmpdir(),'section-')),'duplex.zip');await fs.writeFile(zip,Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function open(t,viewport,{reduced=true}={}){const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();if(!cache.has(target))cache.set(target,three(target));await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await cache.get(target)});});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin&&window.FloorPlanPresentationSection,null,{timeout:60000});return {page,errors};}
const frames=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const settled=page=>page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:180000});
async function configure(page,{section=false,chapter=false}={}){await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 const option=page.locator('#presentationSectionOption');assert.equal(await option.isChecked(),false,'off by default, never remembered');
 if(section)await option.check();if(chapter)await page.locator('#presentationStoryOption').check();await page.getByRole('button',{name:'Iniciar presentación'}).click();}
const snapshot=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),undo:undoStack.length,storage:Object.keys(localStorage).filter(k=>/section|ft3d|story/i.test(k))}));
const state=page=>page.evaluate(()=>({cam:View3D.cameraState,info:View3D.presentationStoryInfo,clip:View3D.presentationClipInfo,cut:View3D.presentationInspect()?.options.cut,story:FloorPlanPresentation.story,caption:document.querySelector('#presentationStoryCaption')?.textContent||''}));
async function scrub(page,value){await page.evaluate(v=>{const s=document.querySelector('#presentationStorySlider');s.value=String(v);s.dispatchEvent(new Event('input',{bubbles:true}));},value);await frames(page);return state(page);}
const samePose=(a,b,eps=1e-6)=>a.position.every((v,i)=>Math.abs(v-b.position[i])<=eps)&&Math.abs(a.fov-b.fov)<=1e-6;
const clean=c=>c.materialsWithPlanes===0&&!c.localClipping&&c.sectionGroups===0&&c.territoryClipped===0&&!c.groundClipped;
const shot=(page,name)=>page.screenshot({path:path.join(QA,name+'.png')});
const noOverflow=page=>page.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1);
async function exit(page,before,name){await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active);
 await page.waitForFunction(()=>!View3D.lifecycleMetrics.animating,null,{timeout:30000});const after=await snapshot(page),c=await page.evaluate(()=>View3D.presentationClipInfo);
 assert.equal(after.project,before.project,`${name}: project JSON identical`);assert.equal(after.undo,before.undo,`${name}: same undo history`);assert.deepEqual(after.storage,[],`${name}: nothing stored`);
 assert.ok(clean(c),`${name}: no clipping left after exit ${JSON.stringify(c)}`);assert.equal(await page.locator('#presentationSectionPlay').count(),0,`${name}: controls leave with the presentation`);}

test('OFF unchanged; ON: checkpoints, real plane on the building only, reverse, resize, cancel, continue (1440x900)',{timeout:900000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});await page.locator('#welcomeExample').click();await page.waitForTimeout(800);
 const editor=await snapshot(page);
 // §14.38 OFF: no section control and the same overview as the presentation of master.
 await configure(page);await settled(page);await page.waitForTimeout(300);const off=await state(page);
 assert.equal(await page.locator('#presentationSectionPlay').count(),0);assert.ok(clean(off.clip));assert.equal(off.info.active,false);
 await exit(page,editor,'off');
 // ON.
 await configure(page,{section:true});await settled(page);await page.waitForTimeout(300);
 const overview=await state(page);assert.ok(samePose(overview.cam,off.cam,1e-6),'the overview is the same with the option on');
 const sec=page.locator('#presentationSectionPlay');assert.equal(await sec.isVisible(),true);assert.equal(await sec.innerText(),'Ver sección dinámica');
 const support=await page.evaluate(()=>FloorPlanPresentation.section);assert.equal(support.levels[0].supported,true);
 await shot(page,'desktop-overview-before');await sec.click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='section-open');
 // Reduced motion: the story waits at its start (the overview, nothing cut).
 const forward={};
 for(const v of [0,25,35,50,65,75,100]){const s=await scrub(page,v);forward[v]=s;await shot(page,`desktop-p${String(v).padStart(3,'0')}`);}
 const d=forward[0].info.dynamicSection;assert.ok(d&&d.walls>0&&d.rooms.length>0&&d.pieces>0);
 assert.ok(samePose(forward[0].cam,overview.cam,1e-6),'p = 0 is the overview');assert.equal(forward[0].info.phase,'overview');assert.equal(d.capsVisible,false);
 assert.ok(Math.abs(d.offset-d.planeStart)<1e-9,'p = 0: the plane waits outside the envelope');
 assert.equal(forward[25].info.phase,'cut');assert.ok(forward[25].cam.fov<20);assert.equal(forward[25].info.dynamicSection.capsVisible,false);
 assert.equal(forward[35].info.phase,'front');assert.equal(forward[35].info.dynamicSection.capsVisible,true);assert.ok(forward[35].cam.fov<=8);
 assert.ok(Math.abs(forward[35].info.dynamicSection.offset-d.planeTarget)<1e-9,'frontal: the plane sits on its target');
 assert.match(forward[35].caption,/Sección visual · derivada del modelo · no es plano de ejecución/);
 assert.equal(forward[50].info.phase,'open');assert.ok(forward[50].cam.fov>forward[35].cam.fov);
 assert.ok(samePose(forward[100].cam,overview.cam,1e-6),'p = 1 is exactly the overview pose');assert.equal(forward[100].info.dynamicSection.capsVisible,true);
 for(const v of [0,35,100]){const c=forward[v].clip;assert.ok(c.materialsWithPlanes>0&&c.localClipping,'a real clipping plane');assert.equal(c.territoryClipped,0,'terrain/context never clipped');assert.equal(c.groundClipped,false,'ground never clipped');assert.equal(c.sectionGroups,1);}
 assert.equal(forward[50].cut,overview.cut,'opt.cut untouched by the section');
 // Minimap: cut line and look while the section is on.
 assert.equal(await page.locator('#presentationMinimap [data-section-line]').count(),1);assert.equal(await page.locator('#presentationMinimap .presentation-minimap-section-look').count(),1);
 // §14.26 reverse scrub: same states.
 for(const v of [100,75,65,50,35,25,0]){const s=await scrub(page,v);assert.ok(samePose(s.cam,forward[v].cam,1e-9),`reverse ${v}`);assert.equal(s.info.dynamicSection.capsVisible,forward[v].info.dynamicSection.capsVisible);}
 // §14.20 resize during the scene: same cut, same progress, framing recomputed.
 await scrub(page,50);await page.setViewportSize({width:1280,height:800});await page.waitForFunction(()=>FloorPlanPresentation.story&&!FloorPlanPresentation.story.busy&&View3D.presentationStoryInfo.active);await page.waitForTimeout(600);
 const resized=await state(page);assert.deepEqual(resized.info.dynamicSection.line,d.line,'same cut after resize');assert.ok(Math.abs(resized.story.p-.5)<.011);
 await page.setViewportSize({width:1440,height:900});await page.waitForFunction(()=>FloorPlanPresentation.story&&!FloorPlanPresentation.story.busy&&View3D.presentationStoryInfo.active);await page.waitForTimeout(600);
 // §14.28 cancel mid-way: back to the overview, nothing left.
 await scrub(page,50);await page.locator('#presentationStoryPlan').click();await settled(page);
 const cancelled=await state(page);assert.ok(clean(cancelled.clip),`cancel restores clipping ${JSON.stringify(cancelled.clip)}`);assert.ok(samePose(cancelled.cam,overview.cam,1e-4),'cancel returns to the overview');
 assert.equal(cancelled.cam.fov,overview.cam.fov);assert.equal(cancelled.cut,overview.cut);assert.equal(cancelled.info.orbitEnabled,true);
 // Reduced motion: one explicit step reaches the open section (held), the next one continues and restores.
 await sec.click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='section-open');await page.locator('#presentationStoryPlay').click();await page.waitForTimeout(300);
 const held=await state(page);assert.equal(held.info.dynamicSection.capsVisible,true,'reduced motion shows the open section');assert.ok(samePose(held.cam,overview.cam,1e-6));
 assert.equal(await page.locator('#presentationStoryPlay').innerText(),'Continuar presentación');await shot(page,'desktop-reduced-held');
 await page.locator('#presentationStoryPlay').click();await settled(page);const continued=await state(page);assert.ok(clean(continued.clip));assert.ok(samePose(continued.cam,overview.cam,1e-4),'continuing keeps the same view');
 // Next stop (the room) as before.
 await page.locator('#presentationNext').click();await settled(page);await page.waitForTimeout(300);await shot(page,'desktop-room-after');assert.ok(clean((await state(page)).clip));
 await exit(page,editor,'on');await shot(page,'desktop-after-exit');assert.deepEqual(errors,[]);
});

test('whole story: plan → section → room without a camera jump; restore on exit (1440x900, reduced motion)',{timeout:900000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});await page.locator('#welcomeExample').click();await page.waitForTimeout(800);const editor=await snapshot(page);
 await configure(page,{section:true,chapter:true});await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='plan-reveal',null,{timeout:180000});
 // Finish the chapter (reduced: one step), then the whole story.
 await page.locator('#presentationStoryPlay').click();await settled(page);await page.locator('#presentationStoryFull').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes===3);
 const kinds=await page.evaluate(()=>['plan-reveal','section-open','room-descent']);assert.equal((await state(page)).story.scenes,3,kinds.join());
 await page.locator('#presentationStoryNext').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='section-open'&&!FloorPlanPresentation.story.busy&&!FloorPlanPresentation.story.playing);await frames(page);
 const sectionEnd=await state(page);assert.equal(sectionEnd.info.dynamicSection.capsVisible,true,'reduced motion lands on the open section');await shot(page,'story-section-held');
 assert.match(await page.locator('#presentationStoryCounter').innerText(),/escena 2 de 3/);
 // Section p = 1 and the descent's p = 0 are the same pose; the section is gone in the descent.
 const P1=await page.evaluate(()=>{const s=FloorPlanPresentation.story;return s.P;});const atEnd=await scrub(page,Math.round(1000*await page.evaluate(()=>{const st=FloorPlanPresentationStory.sequence([6000,7000,3500]);return st.at(2,0)-1e-4;})));
 assert.equal(atEnd.story.kind,'section-open');assert.ok(P1>0);
 await page.locator('#presentationStoryNext').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='room-descent'&&!FloorPlanPresentation.story.busy&&!FloorPlanPresentation.story.playing);await frames(page);
 const descent=await state(page);assert.ok(clean(descent.clip),`the descent has no section ${JSON.stringify(descent.clip)}`);
 assert.ok(samePose(descent.cam,atEnd.cam,2e-3),'no camera jump from the sectioned overview to the descent');
 await scrub(page,1000);await page.waitForTimeout(300);await shot(page,'story-room');
 await exit(page,editor,'story');assert.deepEqual(errors,[]);
});

test('autoplay plays and pauses; finishing restores (1440x900, motion allowed)',{timeout:600000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900},{reduced:false});await page.locator('#welcomeExample').click();await page.waitForTimeout(800);const editor=await snapshot(page);
 await configure(page,{section:true});await settled(page);await page.locator('#presentationSectionPlay').click();
 await page.waitForFunction(()=>FloorPlanPresentation.story?.playing);await page.locator('#presentationStoryPlay').click();
 const paused=await state(page);assert.equal(paused.story.playing,false,'pause');assert.ok(paused.story.p<1);
 await page.locator('#presentationStoryPlay').click();await settled(page);const done=await state(page);assert.ok(clean(done.clip),'finishing restores');
 await exit(page,editor,'autoplay');assert.deepEqual(errors,[]);
});

for(const viewport of [{width:390,height:844},{width:844,height:390}])
test(`phone ${viewport.width}x${viewport.height}: framed, operable, no overflow`,{timeout:600000},async t=>{
 const {page,errors}=await open(t,viewport);await page.locator('#welcomeExample').click();await page.waitForTimeout(800);const editor=await snapshot(page);
 await configure(page,{section:true});await settled(page);const sec=page.locator('#presentationSectionPlay');await sec.scrollIntoViewIfNeeded();await sec.click();
 await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='section-open');
 for(const v of [35,75,100]){const s=await scrub(page,v);assert.ok(s.clip.materialsWithPlanes>0);assert.ok(await noOverflow(page),'no horizontal overflow');await shot(page,`phone-${viewport.width}x${viewport.height}-p${String(v).padStart(3,'0')}`);}
 assert.equal(await page.locator('#presentationStoryCaption').isVisible(),true);
 const play=page.locator('#presentationStoryPlay');await play.scrollIntoViewIfNeeded();assert.ok((await play.boundingBox()).height>=40,'touch target');
 await page.locator('#presentationStoryPlan').click();await settled(page);assert.ok(clean((await state(page)).clip));
 await exit(page,editor,'phone');assert.deepEqual(errors,[]);
});

test('two-level building: one section per level, same axis, restore on exit',{timeout:900000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});
 const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.locator('#welcomeUpload').click()]);await chooser.setFiles(zip);
 await page.waitForFunction(()=>FloorPlanBuildingUI?.context?.levels>1,null,{timeout:60000});await page.waitForTimeout(800);const editor=await snapshot(page);
 await configure(page,{section:true,chapter:true});await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='plan-reveal',null,{timeout:180000});
 const support=await page.evaluate(()=>FloorPlanPresentation.section);assert.equal(support.levels.length,2);
 const supported=support.levels.filter(l=>l.supported);assert.ok(supported.length>=1);assert.ok(support.axis,'one building axis');assert.ok(support.levels.every(l=>!l.supported||l.axis===support.axis));
 await page.locator('#presentationStoryPlay').click();await settled(page);await page.locator('#presentationStoryFull').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1);
 const seen=[];
 for(let i=0;i<12;i++){const s=await state(page);if(s.story.kind==='section-open'){const lvl=s.info.dynamicSection.levelId;if(!seen.includes(lvl)){seen.push(lvl);assert.equal(s.info.dynamicSection.capsVisible,true);await shot(page,`building-section-level-${seen.length}`);}}
  if(s.story.P>=1)break;await page.locator('#presentationStoryNext').click();await page.waitForFunction(()=>FloorPlanPresentation.story&&!FloorPlanPresentation.story.busy&&!FloorPlanPresentation.story.playing);await frames(page);}
 assert.equal(seen.length,supported.length,'a section for every supported level');
 await exit(page,editor,'building');assert.deepEqual(errors,[]);
});

test('unsupported plan: option disabled with a concrete reason; presentation unaffected',{timeout:600000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});await page.locator('#welcomeExample').click();await page.waitForTimeout(800);
 // Two rooms at the far ends of the plan: no candidate (50 %, 40 %, 60 %) crosses a room or two walls.
 await page.evaluate(()=>{const p=structuredClone(FloorPlanApp.project),w=p.walls[0],r=p.rooms[0];
  const wall=(id,x0,y0,x1,y1)=>({...structuredClone(w),id,start:{x:x0,y:y0},end:{x:x1,y:y1}});
  const box=(k,x0,y0,x1,y1)=>[wall(k+'a',x0,y0,x1,y0),wall(k+'b',x1,y0,x1,y1),wall(k+'c',x1,y1,x0,y1),wall(k+'d',x0,y1,x0,y0)];
  p.walls=[...box('wn',0,0,12000,1500),...box('ws',0,8500,12000,10000)];p.openings=[];p.objects=[];p.measurements=[];
  p.rooms=[{...structuredClone(r),id:'rom_n',polygon:[{x:0,y:0},{x:12000,y:0},{x:12000,y:1500},{x:0,y:1500}],labelAt:{x:6000,y:750}},{...structuredClone(r),id:'rom_s',polygon:[{x:0,y:8500},{x:12000,y:8500},{x:12000,y:10000},{x:0,y:10000}],labelAt:{x:6000,y:9250}}];
  FloorPlanApp.importProject(p);});
 await page.waitForTimeout(800);const editor=await snapshot(page);
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 assert.equal(await page.locator('#presentationSectionOption').isDisabled(),true);assert.match(await page.locator('#presentationSectionHint').innerText(),/No disponible: Ningún plano candidato/);
 await page.locator('#presentationSectionOptionBox').scrollIntoViewIfNeeded();await shot(page,'unsupported-option');
 await page.getByRole('button',{name:'Iniciar presentación'}).click();await settled(page);assert.equal(await page.locator('#presentationSectionPlay').count(),0);
 await exit(page,editor,'unsupported');assert.deepEqual(errors,[]);
});
