/* Section → Spatial Visit: the REAL end of an autoplayed whole story and the hand-over to «Recorrer» (human QA, PR #172,
   recording 2026-11-06 10:13:13). The user turns on «Empezar desde el plano», «Incluir sección dinámica» and
   «Sección → visita espacial», then «Ver la historia completa», and lets it play (no slider, no reduced motion):
   - the story plays plan → section → validated visit and STAYS at the arrival: eye level inside the room, no jump to the
     elevated room view, the story panel kept, «Explorar desde aquí» and «Volver a la sección» shown;
   - pausing during the visit and resuming with the play button also stays at the arrival;
   - «Explorar desde aquí» enters «Recorrer» at that very pose; the user walks; «Volver a la presentación» returns;
   - a second whole story reaches the arrival again, and «Volver a la sección» (from «Recorrer») lands on the section;
   - two cycles leave no clipping, materials, camera or renderer residue; the project never changes.
   Regressions with autoplay: a whole story WITHOUT the visit still ends as before (story closed, on its last stop);
   «Ver sección dinámica» alone still ends as before (story closed, on the overview); reduced motion still steps and
   «Continuar presentación» at the arrival still hands over to the room stop. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),three=require('./helpers/three-module.cjs');let server,url,browser;
const QA=process.env.HANDOVER_ARTIFACTS||path.join(os.tmpdir(),'presentation-visit-handover');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
before(async()=>{server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(QA,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function open(t,{reduced=false,viewport={width:1280,height:800}}={}){const ctx=await browser.newContext({viewport,reducedMotion:reduced?'reduce':'no-preference'});t.after(()=>ctx.close());
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(180000);
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async r=>r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(r.request().url(),()=>{throw Error('no local three');})}));
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin,null,{timeout:120000});
 await page.locator('#welcomeExample').click();await page.waitForFunction(()=>FloorPlanApp.project.rooms.length>3);return {page,errors};}
const settled=page=>page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:300000});
// The dialog as the user set it in the recording: from the plan + dynamic section (+ the spatial visit when asked).
async function start(page,{visit=true,section=true,reduced=false}={}){
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 await page.locator('#presentationStoryOption').check();if(section)await page.locator('#presentationSectionOption').check();if(visit)await page.locator('#presentationVisitOption').check();
 await page.locator('#presentationConfig .presentation-config-actions .btn').first().click();
 // With reduced motion «Empezar desde el plano» waits on the plan: step it to the overview as a person would (without
 // reduced motion it plays by itself and hands over to the overview).
 if(reduced){await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='plan-reveal'&&!FloorPlanPresentation.story.busy,null,{timeout:300000});
  for(let i=0;i<6&&await page.evaluate(()=>!!FloorPlanPresentation.story);i++){await page.locator('#presentationStoryPlay').click();await page.waitForTimeout(500);}}
 await settled(page);}
const state=page=>page.evaluate(()=>{const s=FloorPlanPresentation.story,i=View3D.presentationStoryInfo,c=View3D.cameraState;
 const vis=id=>{const e=document.querySelector(id);return !!e&&!e.hidden&&e.offsetParent!==null;};
 return {story:s?{kind:s.kind,P:s.P,playing:s.playing,kinds:s.kinds}:null,phase:i?.phase??null,current:FloorPlanPresentation.current?.kind??null,
  pos:c.position.map(v=>+v.toFixed(4)),quat:c.quaternion.map(v=>+v.toFixed(4)),walking:View3D.walking(),
  walkBtn:vis('#presentationVisitWalk')?document.querySelector('#presentationVisitWalk').textContent:null,sectionBtn:vis('#presentationVisitSection')?document.querySelector('#presentationVisitSection').textContent:null,
  panel:vis('#presentationStory'),clip:View3D.presentationClipInfo,memory:View3D.rendererMemory};});
// «Ver la historia completa», then wait for the autoplay to end (or for the story to close: the reported defect).
async function playWholeStory(page,{pauseInVisit=false}={}){
 await page.evaluate(()=>document.querySelector('#presentationStoryFull').click());
 await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1,null,{timeout:120000});
 if(pauseInVisit){
  // the pause is pressed inside the page the moment the visit walks (a slow software renderer must not let it end first)
  await page.evaluate(async()=>{for(let i=0;i<30000;i++){const s=FloorPlanPresentation.story;if(s?.kind==='room-visit'&&s.playing&&View3D.presentationStoryInfo?.phase==='walk'){document.querySelector('#presentationStoryPlay').click();return;}await new Promise(r=>setTimeout(r,20));}throw Error('the visit never walked');});
  await page.waitForFunction(()=>!FloorPlanPresentation.story?.playing);
  const paused=await state(page);assert.equal(paused.story?.kind,'room-visit','paused inside the visit');assert.ok(paused.story.P<1);
  await page.locator('#presentationStoryPlay').click();}   // resume with the play button: its own path to the end
 await page.waitForFunction(()=>{const s=FloorPlanPresentation.story;return !s||(s.P>=1&&!s.playing&&!s.busy);},null,{timeout:900000});
 await page.waitForTimeout(400);return state(page);}
function arrived(s,label){
 assert.ok(s.story,`${label}: the story is still open at the arrival (it used to close and jump to the room view)`);
 assert.equal(s.story.kind,'room-visit',label);assert.equal(s.story.P,1,label);assert.equal(s.story.playing,false,label);
 assert.equal(s.phase,'room',`${label}: arrival state of the visit`);assert.ok(Math.abs(s.pos[1]-1.6)<1e-3,`${label}: eye level (${s.pos[1]})`);
 assert.equal(s.panel,true,`${label}: story controls kept`);assert.equal(s.walkBtn,'Explorar desde aquí',label);assert.equal(s.sectionBtn,'Volver a la sección',label);}

test('whole story autoplay ends INSIDE the room at eye level, stays there and hands over to Recorrer; back to the presentation and to the section; two cycles clean',{timeout:3600000},async t=>{
 const {page,errors}=await open(t);const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));await start(page);
 // Cycle 1: autoplay to the end (as in the recording).
 let s=await playWholeStory(page);await page.screenshot({path:path.join(QA,'1-arrival.png')});arrived(s,'cycle 1');
 assert.ok(s.story.kinds.includes('section-open')&&s.story.kinds.at(-1)==='room-visit',`plan → section → visit: ${s.story.kinds}`);
 await page.waitForTimeout(3000);const still=await state(page);
 assert.deepEqual(still.pos,s.pos,'no later jump: same position 3 s after the arrival');assert.deepEqual(still.quat,s.quat,'same orientation');assert.ok(still.story,'still open');
 // «Explorar desde aquí»: «Recorrer» at the same pose (position and orientation).
 await page.locator('#presentationVisitWalk').click();await page.waitForFunction(()=>View3D.walking());
 const w=await state(page);assert.deepEqual(w.pos,s.pos,'Recorrer starts at the arrival position');assert.deepEqual(w.quat,s.quat,'and orientation');
 assert.equal(await page.locator('#presentationWalkBar').isVisible(),true);await page.screenshot({path:path.join(QA,'2-recorrer.png')});
 // The user walks normally: «Empezar el recorrido» takes the pointer (as on any desktop «Recorrer»), then W.
 await page.locator('#walkStart').click();await page.waitForFunction(()=>!!document.pointerLockElement,null,{timeout:10000});
 await page.keyboard.down('KeyW');await page.waitForTimeout(900);await page.keyboard.up('KeyW');await page.waitForTimeout(200);
 const moved=await state(page);assert.ok(Math.hypot(moved.pos[0]-w.pos[0],moved.pos[2]-w.pos[2])>.05,'walking moves the viewer');assert.ok(Math.abs(moved.pos[1]-1.6)<1e-3,'at eye level');
 // Back to the presentation: the pointer is released first (what Esc does in the browser), then the bar's button.
 await page.evaluate(()=>document.exitPointerLock());await page.waitForFunction(()=>!document.pointerLockElement);
 await page.locator('#presentationWalkBack').click();await page.waitForFunction(()=>!View3D.walking());await settled(page);
 const back=await state(page);assert.equal(back.current,'room','back in the presentation, on the room stop');assert.equal(back.walking,false);
 await page.screenshot({path:path.join(QA,'3-back-to-presentation.png')});
 // Cycle 2 from the overview: pause during the visit, resume with the play button (its own end path), arrival again.
 await page.locator('.presentation-stops button').nth(0).click();await settled(page);const mem1=(await state(page)).memory;
 s=await playWholeStory(page,{pauseInVisit:true});arrived(s,'cycle 2 (paused and resumed)');
 await page.locator('#presentationVisitWalk').click();await page.waitForFunction(()=>View3D.walking());
 // «Volver a la sección» from «Recorrer»: the section, held at its start.
 await page.locator('#presentationWalkSection').click();
 await page.waitForFunction(()=>!View3D.walking()&&FloorPlanPresentation.story?.kind==='section-open'&&!FloorPlanPresentation.story.busy,null,{timeout:300000});
 assert.equal(await page.evaluate(()=>FloorPlanPresentation.story.local),0,'held at the section start');await page.screenshot({path:path.join(QA,'4-back-to-section.png')});
 // Back on the overview stop: no clipping and the presentation's own wall height. (The section scene keeps its
 // geometries until the next scene — identical on staging 339d24b, see docs — so memory is compared after one more
 // cycle by the same path as cycle 1.)
 await page.locator('.presentation-stops button').nth(0).click();await settled(page);
 const ov=await state(page);assert.equal(ov.clip.materialsWithPlanes??0,0,'no clipping after the section');assert.equal(ov.clip.localClipping,false);
 assert.equal(await page.evaluate(()=>View3D.presentationInspect().options.cut),2.8,'wall height of the overview restored');
 await page.evaluate(()=>document.querySelector('#presentationStoryFull').click());await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1&&!FloorPlanPresentation.story.busy,null,{timeout:120000});
 await page.evaluate(()=>{const s=document.querySelector('#presentationStorySlider');s.value=s.max;s.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>FloorPlanPresentation.story?.P>=1&&!FloorPlanPresentation.story.busy,null,{timeout:300000});
 await page.locator('#presentationVisitWalk').click();await page.waitForFunction(()=>View3D.walking());await page.locator('#presentationWalkBack').click();await page.waitForFunction(()=>!View3D.walking());await settled(page);
 await page.locator('.presentation-stops button').nth(0).click();await settled(page);const mem3=(await state(page)).memory;
 assert.ok(Math.abs(mem3.geometries-mem1.geometries)<=4&&Math.abs(mem3.textures-mem1.textures)<=2,`no growth over the cycles ${JSON.stringify([mem1,mem3])}`);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active);await page.waitForTimeout(800);
 const end=await state(page);assert.equal(end.clip.materialsWithPlanes??0,0,'no clipping left');assert.equal(end.clip.localClipping,false);assert.equal(end.walking,false);
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project,'project JSON unchanged');assert.deepEqual(errors,[]);
});

test('regression: a whole story WITHOUT the visit, and «Ver sección dinámica» alone, still end as before (autoplay)',{timeout:1800000},async t=>{
 const {page,errors}=await open(t);await start(page,{visit:false});
 const s=await playWholeStory(page);assert.equal(s.story,null,'the story closes at its end, as before');assert.equal(s.current,'room','on its last stop (the room of the descent)');
 assert.equal(s.walkBtn,null);await page.locator('.presentation-stops button').nth(0).click();await settled(page);
 await page.evaluate(()=>document.querySelector('#presentationSectionPlay').click());
 await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='section-open',null,{timeout:120000});
 await page.waitForFunction(()=>!FloorPlanPresentation.story,null,{timeout:600000});await settled(page);
 const after=await state(page);assert.equal(after.current,'overview','the section alone ends on the overview, as before');assert.equal(after.clip.materialsWithPlanes??0,0);
 assert.deepEqual(errors,[]);
});

test('regression: reduced motion still waits, steps to the arrival, and «Continuar presentación» hands over to the room stop',{timeout:1800000},async t=>{
 const {page,errors}=await open(t,{reduced:true});await start(page,{reduced:true});
 await page.evaluate(()=>document.querySelector('#presentationStoryFull').click());await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1&&!FloorPlanPresentation.story.busy,null,{timeout:120000});
 assert.equal((await state(page)).story.P,0,'waits at its start');
 for(let i=0;i<12;i++){const s=await state(page);if(s.story?.kind==='room-visit'&&s.story.P>=1)break;await page.locator('#presentationStoryPlay').click();await page.waitForFunction(()=>!FloorPlanPresentation.story?.busy&&!FloorPlanPresentation.story?.playing,null,{timeout:300000});}
 arrived(await state(page),'reduced motion');
 await page.locator('#presentationStoryPlay').click();await page.waitForFunction(()=>!FloorPlanPresentation.story,null,{timeout:120000});await settled(page);
 assert.equal((await state(page)).current,'room','explicit «Continuar presentación» goes on to the room stop');assert.deepEqual(errors,[]);
});
