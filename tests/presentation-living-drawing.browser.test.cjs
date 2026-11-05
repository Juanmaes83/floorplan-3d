/* Hybrid V2 «Dibujo vivo», checked on the real app (C1–C4).
   - OFF by default: nothing of it exists and the presentation is the usual one;
   - ON: the presentation opens with the «living-drawing» story scene: at p = 0 the home is graphite on paper (no colour);
     mid-story a room is partly real while the drawing is still on screen (coexistence); seek and reverse give the same
     frame; «Continuar presentación» ends the scene and the usual presentation goes on; project JSON and the client's
     materials never change; everything is released on close;
   - reduced motion: the story waits at its start and steps room by room;
   - with the dynamic section on as well: both scenes work one after the other and nothing is left after closing;
   - five open/close cycles keep renderer geometries and textures constant;
   - without the drawing module the presentation continues with the usual view (fallback), without errors;
   - phone 390×844 (DPR 2): drawing on, line step 2, no horizontal overflow. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile),{chromium}=require('playwright');
const QA=process.env.LIVING_ARTIFACTS||path.join(os.tmpdir(),'presentation-living-drawing');let server,url,browser;const cache=new Map();
const three=target=>require('./helpers/three-module.cjs')(target,()=>run('curl',['--fail','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout));
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('outside');
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(QA,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const skip=!process.env.THREE_LOCAL_DIR&&'THREE_LOCAL_DIR not set: the drawing needs 3D';
async function open(t,viewport,{dpr=1,reduced=true}={}){const mobile=viewport.width<1000,context=await browser.newContext({viewport,deviceScaleFactor:dpr,isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});page.setDefaultTimeout(180000);
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();if(!cache.has(target))cache.set(target,three(target));await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await cache.get(target)});});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationLivingDrawingBegin&&window.FloorPlanLivingDrawingRenderer&&window.FloorPlanLivingDrawing,null,{timeout:60000});
 await page.locator('#welcomeExample').click();await page.waitForTimeout(800);return {page,errors};}
const frames=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const project=page=>page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
const info=page=>page.evaluate(()=>View3D.presentationLivingDrawingInfo);
const story=page=>page.evaluate(()=>({story:FloorPlanPresentation.story,info:View3D.presentationStoryInfo}));
const ROOMS=/^(Salón|Comedor|Cocina|Dormitorio principal)\b/;
async function configure(page,{living=false,section=false,ambience=false}={}){await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 const option=page.locator('#presentationLivingDrawing');assert.equal(await option.count(),1,'the option exists');assert.equal(await option.isChecked(),false,'off by default, never remembered');
 const rows=page.locator('.presentation-room-row'),n=await rows.count();
 for(let i=0;i<n;i++){const row=rows.nth(i),text=(await row.textContent()).trim().replace(/^\d+\s*/,''),box=row.locator('input[type=checkbox]');if(!await box.count())continue;const on=ROOMS.test(text);if((await box.isChecked())!==on)await box.setChecked(on);}
 const amb=page.locator('#presentationLivingAmbience');if(await amb.count()){assert.equal(await amb.isChecked(),false,'ambience off by default');assert.equal(await amb.isDisabled(),true,'ambience only with the living drawing');}
 if(living)await option.check();if(ambience){assert.equal(await amb.isDisabled(),false);await amb.check();}if(section)await page.locator('#presentationSectionOption').check();
 const start=page.getByRole('button',{name:'Iniciar presentación'});await start.scrollIntoViewIfNeeded();await start.click();}
const livingOpen=page=>page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='living-drawing'&&View3D.presentationStoryInfo?.living&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:300000});
async function seek(page,P){await page.evaluate(v=>{const s=document.querySelector('#presentationStorySlider');s.value=String(Math.round(v*Number(s.max)));s.dispatchEvent(new Event('input',{bubbles:true}));},P);await frames(page);await frames(page);}
async function close(page){await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden,null,{timeout:120000});
 await page.waitForFunction(()=>!document.body.classList.contains('presentation-exiting'),null,{timeout:60000});}
/* Pixel reading of the 3D canvas in a region free of the card and minimap: light paper, dark ink, coloured pixels
   (chroma > 10: the example's own materials are pale — sage, linen, light oak — and graphite on paper is neutral). */
async function read(page,name,region){const png=await page.locator('#view3d canvas').screenshot();await fs.writeFile(path.join(QA,name+'.png'),png);
 return page.evaluate(async([b64,r])=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);
  const x0=Math.round(img.width*r[0]),y0=Math.round(img.height*r[1]),w=Math.round(img.width*(r[2]-r[0])),h=Math.round(img.height*(r[3]-r[1]));const d=x.getImageData(x0,y0,w,h).data;let paper=0,dark=0,colour=0,n=0;const sig=[];
  for(let i=0;i<d.length;i+=4){const R=d[i],G=d[i+1],B=d[i+2],l=(.2126*R+.7152*G+.0722*B)/255;n++;if(l>.82)paper++;if(l<.45)dark++;if(Math.max(R,G,B)-Math.min(R,G,B)>10)colour++;if(i%4096===0)sig.push(R,G,B);}
  return {paper:paper/n,dark:dark/n,colour:colour/n,sig};},[png.toString('base64'),region]);}
const sameFrame=(a,b)=>a.sig.reduce((n,v,i)=>n+(Math.abs(v-b.sig[i])>6?1:0),0)/a.sig.length;

test('HV2 OFF by default: no drawing state, the usual presentation, the same project',{skip,timeout:600000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});const before=await project(page);
 await configure(page);await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:240000});await frames(page);
 assert.equal((await info(page)).active,false,'nothing of the drawing exists when the option is off');assert.equal(await page.locator('#presentationLivingPlay').count(),0,'no living control');
 const usual=await read(page,'off-1440-overview',[.15,.25,.55,.95]);assert.ok(usual.colour>.02,`the usual view keeps its colours (${usual.colour})`);
 await close(page);assert.equal(await project(page),before);assert.deepEqual(errors,[]);
});

test('HV2 ON: drawing → stains with drawing still on screen → exact reverse → the usual presentation; project intact',{skip,timeout:1500000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});const before=await project(page),materials=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project.materials));
 await configure(page,{living:true});await livingOpen(page);
 const s0=await story(page);assert.equal(s0.info.living.rooms[0],'rom_living','opens on the living room');assert.ok(s0.info.living.rooms.length>=4);
 const d0=await info(page);assert.equal(d0.active,true);assert.equal(d0.restored,true);assert.ok(d0.landing.seeds>=8,`seeds prepared ${JSON.stringify(d0.landing)}`);
 const drawn=await read(page,'on-1440-p000',[.05,.2,.55,.95]);assert.ok(drawn.paper>.4&&drawn.dark>.004&&drawn.colour<.012,`graphite on paper at p = 0 ${JSON.stringify({...drawn,sig:0})}`);
 // a moment inside the first room, after its first stains and before it is complete
 const r0=s0.info.living,first=(4.5+2.4)/r0.total;await seek(page,first);
 const mid=await read(page,'on-1440-first-room',[.2,.15,.75,.95]),st=await story(page);
 assert.equal(st.info.living.roomId,'rom_living');assert.equal((await page.evaluate(()=>View3D.presentationAmbienceInfo)).active,false,'no ambience unless chosen');assert.ok(mid.colour>.03,`realism has landed (${mid.colour})`);assert.ok(mid.dark>.003,`drawing still on screen (${mid.dark})`);
 await seek(page,.92);const late=await story(page);assert.equal(late.info.living.roomId,r0.rooms[r0.rooms.length-1]);
 await seek(page,first);const again=await read(page,'on-1440-first-room-again',[.2,.15,.75,.95]);assert.ok(sameFrame(mid,again)<.02,`reverse gives the same frame (${sameFrame(mid,again)})`);
 await seek(page,1);await page.locator('#presentationStoryPlay').click();
 await page.waitForFunction(()=>!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:240000});await frames(page);
 assert.equal((await info(page)).active,false,'the scene released the drawing layer');assert.equal((await story(page)).info.active,false,'the scene ended');
 assert.equal(await page.locator('#presentationLivingPlay').isVisible(),true,'it can be replayed from the overview');
 await close(page);assert.equal(await project(page),before,'project JSON identical');assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project.materials)),materials,'client materials untouched');
 assert.deepEqual(errors,[]);
});

test('HV2 reduced motion: the story waits at its start and steps room by room',{skip,timeout:1200000},async t=>{
 const {page,errors}=await open(t,{width:1280,height:800},{reduced:true});
 await configure(page,{living:true});await livingOpen(page);
 assert.equal((await story(page)).story.p,0,'waits at its start');
 const ends=(await story(page)).info.living.ends;
 await page.locator('#presentationStoryPlay').click();await page.waitForFunction(e=>Math.abs((FloorPlanPresentation.story?.p??0)-e)<.002,ends[0],{timeout:120000});
 assert.equal((await story(page)).info.living.roomIndex,0,'one step: the first room, complete');
 await page.locator('#presentationStoryPlay').click();await page.waitForFunction(e=>Math.abs((FloorPlanPresentation.story?.p??0)-e)<.002,ends[1],{timeout:120000});
 assert.equal((await story(page)).info.living.roomIndex,1,'next step: the next room');
 await close(page);assert.equal((await info(page)).active,false);assert.deepEqual(errors,[]);
});

test('HV2 with the dynamic section: living drawing first, then the section; nothing left after closing',{skip,timeout:1500000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});const before=await project(page);
 await configure(page,{living:true,section:true});await livingOpen(page);
 await seek(page,1);await page.locator('#presentationStoryPlay').click();await page.waitForFunction(()=>!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:240000});
 await page.locator('#presentationSectionPlay').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='section-open');
 await page.evaluate(()=>{const s=document.querySelector('#presentationStorySlider');s.value='65';s.dispatchEvent(new Event('input',{bubbles:true}));});await frames(page);
 assert.ok((await page.evaluate(()=>View3D.presentationClipInfo)).materialsWithPlanes>0,'the section clips the model');assert.equal((await info(page)).active,false,'the section is the usual render');
 await close(page);const c=await page.evaluate(()=>View3D.presentationClipInfo);
 assert.equal(c.materialsWithPlanes,0);assert.equal(c.localClipping,false);assert.equal(await project(page),before);assert.deepEqual(errors,[]);
});

test('HV2 D3 ambience: opt-in, labelled, floors only during the scene, removed after it; project never touched',{skip,timeout:1500000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});const before=await project(page);
 await configure(page,{living:true,ambience:true});await livingOpen(page);
 const a=await page.evaluate(()=>View3D.presentationAmbienceInfo);
 assert.equal(a.active,true);assert.match(a.label,/no forma parte del proyecto/);assert.ok(a.applied.some(x=>x.roomId==='rom_living'&&x.suggested==='surface-oak-wood-planks'),JSON.stringify(a));
 assert.ok(a.skipped.every(x=>x.reason==='walls-not-applied'),'walls are never changed: '+JSON.stringify(a.skipped));
 await page.waitForFunction(()=>View3D.presentationAmbienceInfo.applied.every(x=>x.state!=='loading'),null,{timeout:60000});
 assert.ok((await page.evaluate(()=>View3D.presentationAmbienceInfo)).applied.every(x=>x.state==='ready'),'verified catalogue textures');
 const total=(await story(page)).info.living.total;await seek(page,(4.5+3.5)/total);
 const v=await read(page,'ambience-1440-first-room',[.2,.15,.75,.95]);assert.ok(v.colour>.06,`the suggested oak floor reads (${v.colour})`);
 assert.match(await page.locator('#presentationStoryCaption').textContent(),/Ambientación sugerida · no forma parte del proyecto/);
 assert.equal(await project(page),before,'nothing written to the project while it shows');
 await seek(page,1);await page.locator('#presentationStoryPlay').click();
 await page.waitForFunction(()=>!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:240000});
 assert.equal((await page.evaluate(()=>View3D.presentationAmbienceInfo)).active,false,'removed with the scene');
 await close(page);assert.equal(await project(page),before,'project JSON identical');assert.deepEqual(errors,[]);
});

test('HV2 five open/close cycles with the living drawing keep geometries and textures constant',{skip,timeout:2400000},async t=>{
 const {page,errors}=await open(t,{width:1280,height:800});const memory=[];
 for(let i=0;i<5;i++){await configure(page,{living:true});await livingOpen(page);await seek(page,.3);assert.equal((await info(page)).active,true,`cycle ${i+1}: drawing on`);
  await close(page);assert.equal((await info(page)).active,false,`cycle ${i+1}: released`);memory.push(await page.evaluate(()=>View3D.rendererMemory));}
 await fs.writeFile(path.join(QA,'cycles.json'),JSON.stringify(memory,null,1));
 for(let i=1;i<5;i++)assert.deepEqual(memory[i],memory[0],`cycle ${i+1} memory equals cycle 1 ${JSON.stringify(memory)}`);
 assert.deepEqual(errors,[]);
});

test('HV2 fallback: without the drawing layer the presentation goes on with the usual view',{skip,timeout:600000},async t=>{
 const {page,errors}=await open(t,{width:1280,height:800});
 // a browser without float render targets: the layer refuses to begin (the same path as the real check)
 await page.evaluate(()=>{const R=window.FloorPlanLivingDrawingRenderer,create=R.create;R.create=(...a)=>{const ld=create(...a);return {...ld,begin:()=>({active:false,reason:'float-render-target'})};};});
 await configure(page,{living:true});
 await page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:240000});
 assert.equal((await info(page)).active,false);const view=await read(page,'fallback-1280',[.15,.25,.55,.95]);assert.ok(view.colour>.02,'the usual coloured view goes on');
 await close(page);assert.deepEqual(errors.filter(e=>!/Dibujo vivo no disponible/.test(e)),[]);
});

test('HV2 phone 390×844 (DPR 2): the story draws, line step 2, no horizontal overflow',{skip,timeout:1200000},async t=>{
 const {page,errors}=await open(t,{width:390,height:844},{dpr:2});
 await configure(page,{living:true});await livingOpen(page);
 const i=await info(page);assert.equal(i.active,true);assert.equal(i.lineStep,2,'one CSS pixel of line at DPR 2');
 const v=await read(page,'on-390-p000',[.05,.05,.95,.45]);assert.ok(v.dark>.003&&v.colour<.01,`phone drawing ${JSON.stringify({...v,sig:0})}`);
 const total=(await story(page)).info.living.total;await seek(page,(4.5+2.6)/total);const m=await read(page,'on-390-first-room',[.05,.05,.95,.45]);assert.ok(m.colour>.02,`phone: realism lands (${m.colour})`);
 assert.equal(await page.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1),true);
 await close(page);assert.equal((await info(page)).active,false);assert.deepEqual(errors,[]);
});
