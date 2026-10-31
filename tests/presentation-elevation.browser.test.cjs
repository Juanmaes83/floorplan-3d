/* FT3D-4 «Alzado / fachada narrativa»: checked on the real app in Chromium (contract §19).
   - OFF by default; with it off the presentation keeps exactly its tools and overview (no FT3D-4 node);
   - ON: candidates in a selector (automatic one marked, never «principal»), the default and an alternative; checkpoints
     of elevation-open — p = 0 and p = 1 are the overview pose, the frontal hold is perpendicular with the narrow lens and
     inside the free region, the perspective is oblique; reverse and repeated scrub give the same states;
   - whole story with the section on and off: plan-reveal → (section-open) → elevation-open → room-descent, no jump;
   - reduced motion: overview → frontal → exterior → overview in explicit steps; autoplay pause/resume;
   - «Volver a la vista general», Escape and the browser Back restore camera, lens, levelView, context, solar, focus;
     the project JSON never changes and nothing is stored;
   - north: cardinal labels; solar: off by default, a fixed snapshot applied and restored, unavailable never blocks;
   - context: hidden in the frontal phase, shown in the perspective, restored; absent context does not matter;
   - two-level building: both levels in their real place, one façade per story, levelView restored;
   - 390×844, 844×390, resize; unsupported model: disabled option with its reason; capture waits for the story. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile),{chromium}=require('playwright');
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),S=require('./fixtures/stair-conflict-building.cjs'),F=require('./fixtures/territorial-integration.cjs');
const QA=process.env.ELEVATION_ARTIFACTS||path.join(os.tmpdir(),'presentation-elevation');let server,url,browser,zip;const cache=new Map();
const three=target=>require('./helpers/three-module.cjs')(target,()=>run('curl',['--fail','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout));
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(QA,{recursive:true});
 const b=S.build().building;for(const l of b.levels)l.project.objects=l.project.objects.filter(o=>!/sofa|bed/.test(o.id));
 const {entries}=await B.packageEntries(b,()=>null,T.imageInfo);zip=path.join(await fs.mkdtemp(path.join(os.tmpdir(),'elevation-')),'duplex.zip');await fs.writeFile(zip,Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function open(t,viewport,{reduced=true}={}){const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
 await page.route('**/*',async route=>{const target=route.request().url();if(target.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/')){if(!cache.has(target))cache.set(target,three(target));return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await cache.get(target)});}
  if(target.startsWith(url)||target.startsWith('blob:')||target.startsWith('data:'))return route.continue();external.push(target);return route.abort();});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin&&window.FloorPlanPresentationElevation,null,{timeout:60000});return {page,errors,external};}
const frames=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const settled=page=>page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:180000});
async function configure(page,{elevation=false,section=false,chapter=false,facade=null,solar=false}={}){await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 const option=page.locator('#presentationElevationOption');assert.equal(await option.isChecked(),false,'off by default, never remembered');
 if(elevation){await option.check();if(facade)await page.locator('#presentationElevationFacade').selectOption(facade);if(solar)await page.locator('#presentationElevationSolar').check();}
 if(section)await page.locator('#presentationSectionOption').check();if(chapter)await page.locator('#presentationStoryOption').check();
 const start=page.getByRole('button',{name:'Iniciar presentación'});await start.scrollIntoViewIfNeeded();await start.click();}
const snapshot=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),undo:undoStack.length,storage:Object.keys(localStorage).filter(k=>/elevation|facade|fachada|ft3d|story|section/i.test(k))}));
const state=page=>page.evaluate(()=>({cam:(()=>{try{return View3D.presentationPose();}catch{const c=View3D.cameraState;return {...c,target:View3D.presentationInspect()?.target};}})(),info:View3D.presentationStoryInfo,residue:View3D.presentationElevationResidue,story:FloorPlanPresentation.story,caption:document.querySelector('#presentationStoryCaption')?.textContent||'',
 aspect:View3D.presentationInspect()?.aspect,card:(()=>{const s=document.querySelector('#stage').getBoundingClientRect(),c=document.querySelector('.presentation-card').getBoundingClientRect();return {l:(c.left-s.left)/s.width,r:(c.right-s.left)/s.width,t:(c.top-s.top)/s.height,b:(c.bottom-s.top)/s.height};})()}));
async function scrub(page,value){await page.evaluate(v=>{const s=document.querySelector('#presentationStorySlider');s.value=String(v);s.dispatchEvent(new Event('input',{bubbles:true}));},value);await frames(page);return state(page);}
const samePose=(a,b,eps=1e-6)=>a.position.every((v,i)=>Math.abs(v-b.position[i])<=eps)&&a.target.every((v,i)=>Math.abs(v-b.target[i])<=eps)&&Math.abs(a.fov-b.fov)<=1e-6;
const shot=(page,name)=>page.screenshot({path:path.join(QA,name+'.png')});
const noOverflow=page=>page.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1);
// Screen position (0–1, y down) of world points for the camera of a state.
function project(cam,aspect,points){const f=cam.target.map((v,i)=>v-cam.position[i]),l=Math.hypot(...f),d=f.map(v=>v/l),r=[-d[2],0,d[0]].map(v=>v/Math.hypot(d[0],d[2])),u=[r[1]*d[2]-r[2]*d[1],r[2]*d[0]-r[0]*d[2],r[0]*d[1]-r[1]*d[0]],t=Math.tan(cam.fov*Math.PI/360);
 return points.map(p=>{const v=p.map((x,i)=>x-cam.position[i]),z=v[0]*d[0]+v[1]*d[1]+v[2]*d[2],sx=(v[0]*r[0]+v[1]*r[1]+v[2]*r[2])/z/t/aspect,sy=(v[0]*u[0]+v[1]*u[1]+v[2]*u[2])/z/t;return [(sx+1)/2,(1-sy)/2];});}
function facadeCorners(f){const t=[-f.normal[2],0,f.normal[0]],hw=f.width/2,hh=f.height/2;return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[f.center[0]+t[0]*a*hw,f.center[1]+b*hh,f.center[2]+t[2]*a*hw]);}
async function residueClean(page,name,before){const r=await page.evaluate(()=>({res:View3D.presentationElevationResidue,info:View3D.presentationStoryInfo,solar:View3D.solarInspect.result}));
 assert.equal(r.res.elevationActive,false,`${name}: no façade scene left`);assert.equal(r.res.extraScaled,0,`${name}: no level left scaled`);assert.equal(r.info.active,false);
 if(before){assert.equal(r.res.levelView,before.levelView,`${name}: levelView restored`);assert.equal(r.res.territoryVisible,before.territoryVisible,`${name}: context visibility restored`);assert.deepEqual(r.solar?.instant??null,before.solar?.instant??null,`${name}: solar restored`);}
 assert.equal(await page.locator('#presentationMinimap .presentation-minimap-facade').count(),0,`${name}: no façade mark left on the minimap`);return r;}
async function exit(page,before,name,how='close'){
 if(how==='escape'){await page.locator('#presentationOverlay').focus().catch(()=>{});await page.keyboard.press('Escape');}else if(how==='back')await page.goBack();else await page.locator('#presentationClose').click();
 await page.waitForFunction(()=>!FloorPlanPresentation.active);
 await page.waitForFunction(()=>!View3D.lifecycleMetrics.animating&&!document.querySelector('#stage')?.classList.contains('animating')&&!document.body.classList.contains('presentation-exiting'),null,{timeout:30000});await page.waitForTimeout(600);const after=await snapshot(page);
 assert.equal(after.project,before.project,`${name}: project JSON identical`);assert.equal(after.undo,before.undo,`${name}: same undo history`);assert.deepEqual(after.storage,[],`${name}: nothing stored`);
 assert.equal(await page.locator('#presentationElevationPlay').count(),0,`${name}: controls leave with the presentation`);
 const r=await page.evaluate(()=>View3D.presentationElevationResidue);assert.equal(r.elevationActive,false);assert.equal(r.extraScaled,0);}
async function example(page){await page.locator('#welcomeExample').click();await page.waitForTimeout(800);}
const OVERVIEW_TOOLS=(page,visible=false)=>page.evaluate(v=>[...document.querySelectorAll('#presentationTools button')].filter(b=>!v||!b.hidden).map(b=>b.id||b.textContent.trim()),visible);

test('OFF parity; ON: selector, default, checkpoints, perpendicular 4° front in the free region, oblique perspective, reverse, scrub, cancel (1440x900)',{timeout:900000},async t=>{
 const {page,errors,external}=await open(t,{width:1440,height:900});await example(page);const editor=await snapshot(page);
 // §19.1 OFF: no FT3D-4 node, the same tools and overview.
 await configure(page);await settled(page);await page.waitForTimeout(300);const off=await state(page),offTools=await OVERVIEW_TOOLS(page),offVisible=await OVERVIEW_TOOLS(page,true);
 assert.equal(await page.locator('#presentationElevationPlay').count(),0);assert.equal(off.info.active,false);assert.ok(!offTools.includes('presentationElevationPlay'));
 const offResidue=off.residue;await exit(page,editor,'off');
 // ON.
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 const option=page.locator('#presentationElevationOption');assert.equal(await option.isChecked(),false);assert.equal(await page.locator('#presentationElevationDetails').isHidden(),true,'selector only while on');
 assert.equal(await option.getAttribute('aria-describedby'),'presentationElevationHint');assert.match(await page.locator('#presentationElevationHint').innerText(),/Fachada visual · derivada del modelo · no es alzado de ejecución/);
 await option.check();const opts=await page.$$eval('#presentationElevationFacade option',o=>o.map(x=>({v:x.value,t:x.textContent,s:x.selected})));
 assert.ok(opts.length>=2);assert.ok(opts.every(o=>/^Fachada [A-H]/.test(o.t)));assert.ok(!opts.some(o=>/principal/i.test(o.t)),'never «principal»');
 const auto=opts.find(o=>o.s);assert.match(auto.t,/selección automática/);assert.equal(opts.filter(o=>/selección automática/.test(o.t)).length,1);
 const desc=await page.evaluate(()=>FloorPlanPresentationElevation.derive({levels:[{project:FloorPlanApp.project}]}));assert.equal(auto.v,desc.defaultId,'deterministic default');
 assert.equal(await page.locator('#presentationElevationSolar').isDisabled(),true,'no north/location: solar unavailable');assert.match(await page.locator('#presentationElevationSolarHint').innerText(),/No disponible/);
 assert.equal(await page.locator('label:has(#presentationElevationFacade)').innerText().then(x=>/Fachada/.test(x)),true,'labelled selector');
 await page.locator('#presentationConfig').screenshot({path:path.join(QA,'config-on.png')});
 await page.getByRole('button',{name:'Iniciar presentación'}).click();await settled(page);await page.waitForTimeout(300);
 const overview=await state(page);assert.ok(samePose(overview.cam,off.cam,1e-6),'the overview is the same with the option on');
 const onTools=await OVERVIEW_TOOLS(page,true);assert.deepEqual(onTools.filter(x=>x!=='presentationElevationPlay'),await (async()=>offVisible)(),'only the façade button is added to the visible tools');
 const play=page.locator('#presentationElevationPlay');assert.equal(await play.isVisible(),true);assert.equal(await play.innerText(),'Ver fachada');
 assert.equal(await page.locator('#presentationCapture').isDisabled(),false,'capture ready on the overview');
 await shot(page,'desktop-auto-p000-before');await play.click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='elevation-open');
 assert.equal(await page.locator('#presentationCapture').isDisabled(),true,'§19.29 capture waits while the story runs');
 const forward={};
 for(const v of [0,25,35,50,72,86,100]){const s=await scrub(page,v);forward[v]=s;await shot(page,`desktop-p${String(v).padStart(3,'0')}`);}
 const el=forward[35].info.elevation;assert.equal(el.candidateId,desc.defaultId);assert.equal(el.label,desc.candidates.find(c=>c.id===desc.defaultId).label);
 assert.ok(samePose(forward[0].cam,overview.cam,1e-6),'p = 0 is the overview');assert.equal(forward[0].info.phase,'overview');
 assert.equal(forward[25].info.phase,'align');assert.ok(forward[25].cam.fov<20);
 for(const v of [35,50]){const s=forward[v],d=s.cam.target.map((x,i)=>x-s.cam.position[i]),l=Math.hypot(...d);
  assert.ok(Math.abs(d[1]/l)<1e-6,'frontal: horizontal camera, verticals vertical');assert.ok(Math.abs((d[0]*el.facade.normal[0]+d[2]*el.facade.normal[2])/l+1)<1e-6,'frontal: perpendicular to the façade');
  assert.ok(Math.abs(s.cam.fov-4)<1e-9,'frontal: narrow 4° lens');
  const pts=project(s.cam,s.aspect,facadeCorners(s.info.elevation.facade)),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  assert.ok(Math.min(...xs)>=0&&Math.min(...ys)>=0&&Math.max(...ys)<=1,'façade inside the screen');assert.ok(Math.max(...xs)<=s.card.l+1e-3,`façade left of the card ${Math.max(...xs)} ≤ ${s.card.l}`);}
 assert.equal(forward[35].info.phase,'front');assert.equal(forward[50].info.phase,'light');assert.ok(samePose(forward[35].cam,forward[50].cam,1e-9),'still through the hold');
 assert.equal(forward[35].info.contextVisible,false,'context hidden in the frontal phase');assert.equal(forward[72].info.contextVisible,true);
 assert.equal(forward[72].info.phase,'perspective');assert.equal(forward[86].info.phase,'exterior');
 {const s=forward[86],d=s.cam.position.map((x,i)=>x-s.cam.target[i]),l=Math.hypot(...d),n=el.facade.normal;assert.ok(d[1]/l>.1,'above the ground');assert.ok((d[0]*n[0]+d[2]*n[2])/l>.8,'from outside the façade');assert.ok(Math.abs((d[0]*-n[2]+d[2]*n[0])/l)>.2,'oblique: depth is seen');}
 assert.ok(samePose(forward[100].cam,overview.cam,1e-6),'p = 1 is exactly the overview pose');
 for(const v of [35,72])assert.match(forward[v].caption,/Fachada visual · derivada del modelo · no es alzado de ejecución/);
 assert.ok(!Object.values(forward).some(s=>/principal|certificad/i.test(s.caption)));
 // Minimap: the façade walls and the frontal look, its aria-label.
 await scrub(page,35);assert.ok(await page.locator('#presentationMinimap .presentation-minimap-facade').count()>0);assert.equal(await page.locator('#presentationMinimap .presentation-minimap-facade-look').count(),1);
 assert.equal(await page.locator('#presentationMinimap svg').getAttribute('aria-label'),'Plano de orientación con la fachada visual seleccionada');
 // Reverse and repeated scrub: the same states, no drift.
 for(const v of [100,86,72,50,35,25,0]){const s=await scrub(page,v);assert.ok(samePose(s.cam,forward[v].cam,1e-9),`reverse ${v}`);assert.equal(s.info.phase,forward[v].info.phase);}
 for(let i=0;i<3;i++)for(const v of [72,10,90,35]) await scrub(page,v);
 for(const v of [35,86]){const s=await scrub(page,v);assert.ok(samePose(s.cam,forward[v].cam,1e-9),`no drift at ${v}`);}
 // Cancel mid-way: back to the overview, nothing left.
 await scrub(page,60);await page.locator('#presentationStoryPlan').click();await settled(page);
 const cancelled=await state(page);assert.ok(samePose(cancelled.cam,overview.cam,1e-4),'cancel returns to the overview');assert.equal(cancelled.cam.fov,overview.cam.fov);
 await residueClean(page,'cancel',offResidue);assert.equal(cancelled.info.orbitEnabled,true);assert.equal(await page.locator('#presentationCapture').isDisabled(),false,'capture available again');
 assert.equal(await page.locator('#presentationMinimap svg').getAttribute('aria-label'),'Plano de orientación');
 // Continue to the room as before.
 await page.getByRole('button',{name:'Siguiente →',exact:true}).click();await settled(page);await page.waitForTimeout(300);await shot(page,'desktop-room-after');
 await exit(page,editor,'on');await shot(page,'desktop-after-exit');assert.deepEqual(errors,[]);assert.deepEqual(external,[],'no network for the narrative');
});

test('alternative façade, north cardinal, Escape restores focus and state (1440x900)',{timeout:900000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});await example(page);
 // North 30° (no location): cardinal names, no solar.
 await page.evaluate(()=>FloorPlanSolarUI.open());await page.locator('#solarNorthInput').fill('30');await page.locator('#solarSave').click();await page.locator('#solarClose').click();
 const editor=await snapshot(page);const desc=await page.evaluate(()=>FloorPlanPresentationElevation.derive({levels:[{project:FloorPlanApp.project}],northOffsetDeg:FloorPlanApp.project.site.northOffsetDeg}));
 assert.ok(desc.candidates.every(c=>c.cardinal));const alt=desc.candidates.find(c=>c.id!==desc.defaultId);
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();await page.locator('#presentationElevationOption').check();
 const labels=await page.$$eval('#presentationElevationFacade option',o=>o.map(x=>x.textContent));assert.ok(labels.every(x=>/^Fachada [A-H] · (norte|noreste|este|sureste|sur|suroeste|oeste|noroeste)/.test(x)),labels.join());
 await page.locator('#presentationElevationFacade').selectOption(alt.id);await page.locator('#presentationConfig').screenshot({path:path.join(QA,'config-north.png')});
 await page.getByRole('button',{name:'Iniciar presentación'}).click();await settled(page);
 const before=(await state(page)).residue,play=page.locator('#presentationElevationPlay');await play.focus();await play.click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='elevation-open');
 const s=await scrub(page,35);assert.equal(s.info.elevation.candidateId,alt.id,'the chosen alternative');assert.equal(s.info.elevation.cardinal,alt.cardinal);
 assert.match(s.caption,new RegExp(`${alt.label} · orientación derivada del proyecto`));await shot(page,'desktop-alternative-north-p035');
 const s2=await scrub(page,86);await shot(page,'desktop-alternative-north-p086');assert.ok(s2.info.elevation.normalPlan.every((v,i)=>v===alt.normalPlan[i]));
 // Escape mid-scene ends the presentation; focus returns to the editor entry, everything restored.
 await scrub(page,50);await exit(page,editor,'escape','escape');await residueClean(page,'escape',before);
 assert.ok(await page.evaluate(()=>document.activeElement&&document.activeElement!==document.body),'focus restored to a control');assert.deepEqual(errors,[]);
});

test('whole story: plan → section → façade → room and plan → façade → room, no camera jump; reduced steps (1440x900)',{timeout:900000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});await example(page);const editor=await snapshot(page);
 for(const section of [true,false]){
  await configure(page,{elevation:true,section,chapter:true});await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='plan-reveal',null,{timeout:180000});
  await page.locator('#presentationStoryPlay').click();await settled(page);const overviewPose=(await state(page)).cam;await page.locator('#presentationStoryFull').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1);
  const kinds=section?['plan-reveal','section-open','elevation-open','room-descent']:['plan-reveal','elevation-open','room-descent'];
  assert.equal((await state(page)).story.scenes,kinds.length,`${kinds.join(' → ')}`);
  // Step to the façade scene (reduced motion lands on its frontal hold), then its exterior hold, then on.
  for(let i=0;i<8;i++){const st=await state(page);if(st.story.kind==='elevation-open')break;await page.locator('#presentationStoryNext').click();await page.waitForFunction(()=>FloorPlanPresentation.story&&!FloorPlanPresentation.story.busy&&!FloorPlanPresentation.story.playing);await frames(page);}
  let st=await state(page);assert.equal(st.story.kind,'elevation-open');assert.equal(st.info.phase,'front','reduced motion: the frontal façade first');assert.match(await page.locator('#presentationStoryCounter').innerText(),new RegExp(`escena ${kinds.indexOf('elevation-open')+1} de ${kinds.length}`));
  if(section)await shot(page,'story-elevation-front');
  await page.locator('#presentationStoryPlay').click();await page.waitForFunction(()=>FloorPlanPresentation.story&&!FloorPlanPresentation.story.busy&&!FloorPlanPresentation.story.playing);await frames(page);
  st=await state(page);assert.equal(st.info.phase,'exterior','then the exterior perspective');
  // The façade's p = 1 and the descent's p = 0 are the same pose.
  const seq=await page.evaluate(k=>FloorPlanPresentationStory.sequence(k.map(x=>FloorPlanPresentationStory.SCENE_MS[x])).at(k.indexOf('room-descent'),0),kinds);
  const atEnd=await scrub(page,Math.floor(1000*seq)-1);assert.equal(atEnd.story.kind,'elevation-open');
  await page.locator('#presentationStoryNext').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='room-descent'&&!FloorPlanPresentation.story.busy&&!FloorPlanPresentation.story.playing);await frames(page);
  // The façade ends exactly on the overview (p = 1, checked in the first test) and the descent starts there; the last
  // slider step of the façade (p ≈ .997, still returning) is only a small move from it: no jump.
  const descent=await state(page);assert.ok(samePose(descent.cam,overviewPose,1e-4),'the descent starts on the overview the façade ends on');
  const gap=Math.hypot(...descent.cam.position.map((v,k)=>v-atEnd.cam.position[k]))/Math.hypot(...descent.cam.position.map((v,k)=>v-descent.cam.target[k]));
  assert.ok(gap<.03,`no camera jump from the façade to the descent (${gap.toFixed(4)})`);assert.ok(Math.abs(descent.cam.fov-atEnd.cam.fov)<1e-6);assert.equal(descent.residue.elevationActive,false);
  await scrub(page,1000);await page.waitForTimeout(300);if(section)await shot(page,'story-room');
  await exit(page,editor,`story section ${section}`);
 }
 assert.deepEqual(errors,[]);
});

test('autoplay pauses and resumes; the browser Back restores (1440x900, motion allowed)',{timeout:600000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900},{reduced:false});await example(page);const editor=await snapshot(page);
 await configure(page,{elevation:true});await settled(page);const before=(await state(page)).residue;await page.locator('#presentationElevationPlay').click();
 await page.evaluate(()=>new Promise(r=>{const tick=()=>{if(FloorPlanPresentation.story?.playing&&FloorPlanPresentation.story.p>0){document.querySelector('#presentationStoryPlay').click();r();}else requestAnimationFrame(tick);};tick();}));
 const paused=await state(page);assert.equal(paused.story.playing,false,'pause');assert.ok(paused.story.p>0&&paused.story.p<1);
 await page.locator('#presentationStoryPlay').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.playing);
 await page.evaluate(()=>new Promise(r=>{const tick=()=>{if(FloorPlanPresentation.story?.playing&&FloorPlanPresentation.story.p>.3){document.querySelector('#presentationStoryPlay').click();r();}else if(!FloorPlanPresentation.story)r();else requestAnimationFrame(tick);};tick();}));
 const resumed=await state(page);assert.ok(!resumed.story||resumed.story.p>paused.story.p,'resumed from where it paused');
 await exit(page,editor,'back','back');await residueClean(page,'back',before);assert.deepEqual(errors,[]);
});

test('solar: off by default, fixed snapshot when chosen and restored; unavailable never blocks (1440x900)',{timeout:900000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});await example(page);
 await page.evaluate(()=>FloorPlanSolarUI.open());await page.locator('#solarNorthInput').fill('37');await page.locator('#solarLatitude').fill('40.4168');await page.locator('#solarLongitude').fill('-3.7038');await page.locator('#solarTimeZone').fill('Europe/Madrid');
 await page.locator('#solarDate').fill('2026-06-21');await page.locator('#solarTime').fill('11:00');await page.locator('#solarSave').click();await page.locator('#solarClose').click();
 const editor=await snapshot(page);assert.equal(await page.evaluate(()=>FloorPlanSolarUI.result.status),'available-orientative');
 // Solar OFF: the scene never touches the light.
 await configure(page,{elevation:true});await settled(page);const before=(await state(page)).residue;assert.equal(before.solar,null);
 await page.locator('#presentationElevationPlay').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='elevation-open');
 const off=await scrub(page,50);assert.equal(off.info.solar,false);assert.equal(off.residue.solar,null,'solar off: no solar applied');assert.doesNotMatch(off.caption,/Solar orientativo/);
 await page.locator('#presentationStoryPlan').click();await settled(page);await exit(page,editor,'solar off');
 // Solar ON: one snapshot, applied in the lighting phase only, the same at every visit, restored after.
 await configure(page,{elevation:true,solar:true});await settled(page);await page.locator('#presentationElevationPlay').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='elevation-open');
 const a=await scrub(page,50);assert.equal(a.info.elevation.solarOn,true);assert.ok(a.residue.solar?.instant);await shot(page,'desktop-solar-on-p050');
 assert.match(a.caption,/Solar orientativo 2026-06-21 11:00 · no es estudio de soleamiento, certificación ni verificación normativa\./);
 const sun1=await page.evaluate(()=>View3D.solarInspect.direction);await scrub(page,30);assert.equal((await state(page)).residue.solar,null,'not before the lighting phase');
 // Changing the time in Solar after the start does not change the snapshot.
 await page.evaluate(()=>{document.querySelector('#solarTime').value='18:00';document.querySelector('#solarTime').dispatchEvent(new Event('input'));});
 const b=await scrub(page,72);assert.equal(b.residue.solar.instant,a.residue.solar.instant,'fixed snapshot');assert.deepEqual(await page.evaluate(()=>View3D.solarInspect.direction),sun1,'same sun direction');await shot(page,'desktop-solar-on-p072');
 const c=await scrub(page,95);assert.equal(c.residue.solar,null,'back to presentation lighting while returning');
 await page.locator('#presentationStoryPlan').click();await settled(page);await residueClean(page,'solar on',before);await exit(page,editor,'solar on');
 // Solar becomes unavailable before the start: the façade goes on without it.
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();await page.locator('#presentationElevationOption').check();await page.locator('#presentationElevationSolar').check();
 await page.evaluate(()=>Object.defineProperty(FloorPlanSolarUI,'result',{configurable:true,get:()=>({status:'unavailable',reason:'north'})}));
 await page.getByRole('button',{name:'Iniciar presentación'}).click();await settled(page);await page.locator('#presentationElevationPlay').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='elevation-open');
 const u=await scrub(page,50);assert.equal(u.info.phase,'light');assert.equal(u.info.elevation.solarChosen,false);assert.equal(u.residue.solar,null);await shot(page,'desktop-solar-unavailable-p050');
 await exit(page,editor,'solar unavailable');assert.deepEqual(errors,[]);
});

test('exterior context: hidden in the frontal phase, shown in the perspective, restored (1440x900)',{timeout:600000},async t=>{
 const {page,errors,external}=await open(t,{width:1440,height:900});await example(page);
 const fixture=F.build();
 await page.evaluate(({building,grid})=>{const level=FloorPlanBuilding.exportLevel(building,building.levels[0].id).project;level.site.buildingPlacement={horizontal:{modelAnchorMm:{x:2000,y:1200},parcelLocalAnchorMm:{x:4200,y:9100},source:{type:'user-entered'}},vertical:{modelZeroElevationM:100,verticalReference:'orthometric',source:{type:'user-entered'}}};level.schemaVersion='1.12.0';
  FloorPlanApp.importProject(level);FloorPlanTerritorySession.sync(FloorPlanApp.entryId,FloorPlanApp.project.site);FloorPlanTerritorySession.set('terrain',FloorPlanApp.project.site.terrain,{grid});},fixture);
 await page.waitForTimeout(800);const editor=await snapshot(page);
 await configure(page,{elevation:true});await settled(page);await page.waitForFunction(()=>View3D.territoryInfo?.children.some(c=>c.visible));
 const before=(await state(page)).residue;assert.equal(before.territoryVisible,true);
 await page.locator('#presentationElevationPlay').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='elevation-open');
 const a=await scrub(page,35);assert.equal(a.info.elevation.context,true,'context available');assert.equal(a.residue.territoryVisible,false,'not over the frontal façade');await shot(page,'desktop-context-p035');
 const b=await scrub(page,86);assert.equal(b.residue.territoryVisible,true,'context in the exterior perspective');await shot(page,'desktop-context-p086');
 await scrub(page,40);await page.locator('#presentationStoryPlan').click();await settled(page);await residueClean(page,'context',before);
 await exit(page,editor,'context');assert.deepEqual(errors,[]);assert.deepEqual(external,[],'no download to complete the story');
});

test('two-level building: both levels in place, one façade per story, levelView restored (1440x900)',{timeout:900000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});
 const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.locator('#welcomeUpload').click()]);await chooser.setFiles(zip);
 await page.waitForFunction(()=>FloorPlanBuildingUI?.context?.levels>1,null,{timeout:60000});await page.waitForTimeout(800);const editor=await snapshot(page);
 const sources=await page.evaluate(()=>FloorPlanBuildingUI.presentationSources().levels.map(l=>({levelId:l.levelId,elevationMm:l.elevationMm})));
 await configure(page,{elevation:true,chapter:true});await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='plan-reveal',null,{timeout:180000});
 await page.locator('#presentationStoryPlay').click();await settled(page);const before=(await state(page)).residue;
 await page.locator('#presentationStoryFull').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1);
 const kinds=(await state(page)).story.kinds;assert.equal(kinds.filter(k=>k==='elevation-open').length,1,`the façade is read once for the whole building: ${kinds.join(' → ')}`);
 assert.equal(kinds.indexOf('elevation-open'),1,'right after the first plan-reveal');assert.ok(kinds.lastIndexOf('plan-reveal')>1,'the upper level keeps its own scenes');
 const at=(i,p)=>page.evaluate(([k,i,p])=>FloorPlanPresentationStory.sequence(k.map(x=>FloorPlanPresentationStory.SCENE_MS[x])).at(i,p),[kinds,i,p]);
 const i=kinds.indexOf('elevation-open');
 const start=await scrub(page,Math.ceil(1000*await at(i,0))+1);assert.equal(start.story.kind,'elevation-open');assert.ok(start.info.elevation.levelScale<.05,'p ≈ 0: the overview as before');
 for(const [p,name] of [[.38,'building-facade-front'],[.86,'building-facade-exterior']]){
  await scrub(page,Math.round(1000*await at(i,p)));
  const v=await page.evaluate(()=>({el:View3D.presentationStoryInfo.elevation,levels:View3D.levelInspect().levels}));
  assert.equal(v.el.levelView,'all','whole building shown during the façade');assert.ok(v.el.extraLevels>=1&&v.el.extraVisible>=1,'the upper level is visible');assert.equal(v.el.levelScale,1);
  const A=v.levels.find(l=>l.active),U=v.levels.find(l=>!l.active),a=sources.find(x=>x.levelId===A.id),u=sources.find(x=>x.levelId===U.id);
  assert.ok(Math.abs(U.y-(u.elevationMm-a.elevationMm)/1000)<1e-9,'no exploded: the real vertical offset');await shot(page,name);}
 // The descent after the façade: the level view is back and nothing is scaled.
 await scrub(page,Math.round(1000*await at(i+1,0))+2);const d=await state(page);assert.equal(d.story.kind,kinds[i+1]);assert.equal(d.residue.levelView,before.levelView);assert.equal(d.residue.extraScaled,0);
 await exit(page,editor,'building');await residueClean(page,'building',before);assert.deepEqual(errors,[]);
});

for(const viewport of [{width:390,height:844},{width:844,height:390}])
test(`phone ${viewport.width}x${viewport.height}: framed, readable, operable, no overflow; resize keeps the scene`,{timeout:600000},async t=>{
 const {page,errors}=await open(t,viewport);await example(page);const editor=await snapshot(page);
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 const option=page.locator('#presentationElevationOption');await option.scrollIntoViewIfNeeded();await option.check();const pick=page.locator('#presentationElevationFacade');await pick.scrollIntoViewIfNeeded();
 assert.ok((await pick.boundingBox()).width<=viewport.width,'selector fits');await page.screenshot({path:path.join(QA,`phone-${viewport.width}x${viewport.height}-config.png`)});
 const start=page.getByRole('button',{name:'Iniciar presentación'});await start.scrollIntoViewIfNeeded();await start.click();await settled(page);
 const play=page.locator('#presentationElevationPlay');await play.scrollIntoViewIfNeeded();await play.click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='elevation-open');
 for(const v of [35,72,86]){const s=await scrub(page,v);assert.ok(await noOverflow(page),'no horizontal overflow');await shot(page,`phone-${viewport.width}x${viewport.height}-p${String(v).padStart(3,'0')}`);
  if(v===35){const pts=project(s.cam,s.aspect,facadeCorners(s.info.elevation.facade)),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),c=s.card;
   assert.ok(Math.min(...xs)>=-.01&&Math.max(...xs)<=1.01&&Math.min(...ys)>=-.01&&Math.max(...ys)<=1.01,'façade on screen');
   const overlap=Math.max(0,Math.min(Math.max(...xs),c.r)-Math.max(Math.min(...xs),c.l))*Math.max(0,Math.min(Math.max(...ys),c.b)-Math.max(Math.min(...ys),c.t));assert.ok(overlap<1e-3,`façade not under the card (${overlap})`);}}
 assert.equal(await page.locator('#presentationStoryCaption').isVisible(),true);
 const b=page.locator('#presentationStoryPlay');await b.scrollIntoViewIfNeeded();assert.ok((await b.boundingBox()).height>=40,'touch target');
 // Resize during the scene: same candidate, same progress.
 await scrub(page,50);const flip={width:viewport.height,height:viewport.width};await page.setViewportSize(flip);await page.waitForFunction(()=>FloorPlanPresentation.story&&!FloorPlanPresentation.story.busy&&View3D.presentationStoryInfo.active);await page.waitForTimeout(600);
 const r=await state(page);assert.ok(Math.abs(r.story.p-.5)<.011);assert.equal(r.info.phase,'light');await shot(page,`phone-${viewport.width}x${viewport.height}-resized`);
 await page.setViewportSize(viewport);await page.waitForFunction(()=>FloorPlanPresentation.story&&!FloorPlanPresentation.story.busy&&View3D.presentationStoryInfo.active);await page.waitForTimeout(400);
 await page.locator('#presentationStoryPlan').click();await settled(page);await exit(page,editor,'phone');assert.deepEqual(errors,[]);
});

test('unsupported model: option disabled with a concrete reason; presentation unaffected',{timeout:600000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});await example(page);
 // Every wall declared a partition: the Exterior authority recognises no façade, the rooms still make a presentation.
 await page.evaluate(()=>{const p=structuredClone(FloorPlanApp.project);for(const w of p.walls)w.structure='partition';FloorPlanApp.importProject(p);});
 await page.waitForTimeout(800);const editor=await snapshot(page);
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 assert.equal(await page.locator('#presentationElevationOption').count(),1);
 {assert.equal(await page.locator('#presentationElevationOption').isDisabled(),true);assert.match(await page.locator('#presentationElevationHint').innerText(),/No disponible: Ningún muro está clasificado como fachada/);
  assert.equal(await page.locator('#presentationElevationOption').getAttribute('aria-describedby'),'presentationElevationHint');
  await page.locator('#presentationElevationOptionBox').scrollIntoViewIfNeeded();await shot(page,'unsupported-option');
  await page.getByRole('button',{name:'Iniciar presentación'}).click();await settled(page);assert.equal(await page.locator('#presentationElevationPlay').count(),0);await exit(page,editor,'unsupported');}
 assert.deepEqual(errors,[]);
});
