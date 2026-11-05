/* Hybrid V2 «Dibujo vivo» — C1, the graphite drawing layer, checked on the real app.
   - OFF by default and when off nothing of it exists (no drawing state, no render target, same project);
   - ON: the presentation's own views are drawn as graphite on paper (light paper, dark lines, no colour — D2), on the
     overview and on a room; the user's materials and project JSON never change; the state is released on close;
   - with the dynamic section: the cut is honoured by the drawing and nothing of the section is left after closing;
   - five enter/exit cycles with the drawing ON keep renderer geometries and textures constant;
   - without float render targets the presentation goes on with the usual view (fallback), without errors;
   - phone 390×844 (DPR 2): thicker step for the line, no horizontal overflow. */
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
async function open(t,viewport,{dpr=1}={}){const mobile=viewport.width<1000,context=await browser.newContext({viewport,deviceScaleFactor:dpr,isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});page.setDefaultTimeout(120000);
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();if(!cache.has(target))cache.set(target,three(target));await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await cache.get(target)});});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationLivingDrawingBegin&&window.FloorPlanLivingDrawingRenderer,null,{timeout:60000});
 await page.locator('#welcomeExample').click();await page.waitForTimeout(800);return {page,errors};}
const settled=page=>page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:240000});
const frames=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const project=page=>page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
const info=page=>page.evaluate(()=>View3D.presentationLivingDrawingInfo);
async function configure(page,{living=false,section=false}={}){await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 const option=page.locator('#presentationLivingDrawing');assert.equal(await option.count(),1,'the option exists');assert.equal(await option.isChecked(),false,'off by default, never remembered');
 if(living)await option.check();if(section)await page.locator('#presentationSectionOption').check();
 const start=page.getByRole('button',{name:'Iniciar presentación'});await start.scrollIntoViewIfNeeded();await start.click();}
async function close(page){await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden,null,{timeout:120000});
 await page.waitForFunction(()=>!document.body.classList.contains('presentation-exiting'),null,{timeout:60000});}
/* Pixel reading of the 3D canvas, in a region free of the presentation card and minimap: share of light paper, of dark
   ink and of coloured pixels (max−min channel > 28/255). */
async function ink(page,name,region){const canvas=page.locator('#view3d canvas');const png=await canvas.screenshot();await fs.writeFile(path.join(QA,name+'.png'),png);
 return page.evaluate(async([b64,r])=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);
  const x0=Math.round(img.width*r[0]),y0=Math.round(img.height*r[1]),w=Math.round(img.width*(r[2]-r[0])),h=Math.round(img.height*(r[3]-r[1]));const d=x.getImageData(x0,y0,w,h).data;let paper=0,dark=0,colour=0,n=0;
  for(let i=0;i<d.length;i+=4){const R=d[i],G=d[i+1],B=d[i+2],l=(.2126*R+.7152*G+.0722*B)/255;n++;if(l>.82)paper++;if(l<.45)dark++;if(Math.max(R,G,B)-Math.min(R,G,B)>28)colour++;}
  return {paper:paper/n,dark:dark/n,colour:colour/n,w:img.width,h:img.height};},[png.toString('base64'),region]);}

test('HV2-C1 OFF by default: no drawing state, the usual view, the same project',{skip,timeout:600000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});const before=await project(page);
 await configure(page);await settled(page);await frames(page);
 assert.equal((await info(page)).active,false,'nothing of the drawing exists when the option is off');
 const usual=await ink(page,'off-1440-overview',[.15,.25,.55,.95]);assert.ok(usual.colour>.02,`the usual view keeps its colours (${usual.colour})`);
 await close(page);assert.equal(await project(page),before);assert.equal((await info(page)).active,false);assert.deepEqual(errors,[]);
});

test('HV2-C1 ON: overview and a room as graphite on paper (no colour), project intact, released on close',{skip,timeout:900000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});const before=await project(page),materialsBefore=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project.materials));
 await configure(page,{living:true});await settled(page);await frames(page);
 const on=await info(page);assert.equal(on.active,true);assert.ok(['float','half'].includes(on.precision));assert.equal(on.restored,true,'the user materials are back after every frame');
 assert.equal(on.width,1440);assert.ok(on.auxMaterials>0);
 const overview=await ink(page,'on-1440-overview',[.15,.25,.55,.95]);
 assert.ok(overview.paper>.45,`mostly paper (${overview.paper})`);assert.ok(overview.dark>.004,`graphite lines present (${overview.dark})`);assert.ok(overview.colour<.01,`no colour in the drawing (${overview.colour})`);
 await page.locator('.presentation-stops button').nth(1).click();await page.waitForFunction(()=>document.querySelector('.presentation-status').textContent.includes('Vista 2')&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:240000});await frames(page);
 const room=await ink(page,'on-1440-room',[.05,.2,.55,.95]),roomInfo=await info(page);
 assert.ok(room.paper>.35&&room.dark>.004&&room.colour<.01,`room drawn in graphite ${JSON.stringify(room)}`);assert.ok(roomInfo.frames>on.frames,'the drawing renders every frame');
 await close(page);
 assert.equal((await info(page)).active,false,'released with the presentation');
 assert.equal(await project(page),before,'project JSON identical');assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project.materials)),materialsBefore,'client materials untouched');
 assert.deepEqual(errors,[]);
});

test('HV2-C1 ON with the dynamic section: the cut is drawn and nothing is left after closing',{skip,timeout:900000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});const before=await project(page);
 await configure(page,{living:true,section:true});await settled(page);
 await page.locator('#presentationSectionPlay').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='section-open');
 await page.evaluate(()=>{const s=document.querySelector('#presentationStorySlider');s.value='65';s.dispatchEvent(new Event('input',{bubbles:true}));});await frames(page);await frames(page);
 const clip=await page.evaluate(()=>View3D.presentationClipInfo);assert.ok(clip.materialsWithPlanes>0,'the section clips the model');
 const cut=await ink(page,'on-1440-section',[.1,.2,.6,.95]);assert.equal((await info(page)).active,true);assert.ok(cut.dark>.004&&cut.colour<.01,`section drawn in graphite ${JSON.stringify(cut)}`);
 await close(page);const c=await page.evaluate(()=>View3D.presentationClipInfo);
 assert.equal(c.materialsWithPlanes,0);assert.equal(c.localClipping,false);assert.equal(await project(page),before);assert.equal((await info(page)).active,false);assert.deepEqual(errors,[]);
});

test('HV2-C1 five enter/exit cycles with the drawing ON keep geometries and textures constant',{skip,timeout:1500000},async t=>{
 const {page,errors}=await open(t,{width:1280,height:800});const memory=[];
 for(let i=0;i<5;i++){await configure(page,{living:true});await settled(page);await frames(page);assert.equal((await info(page)).active,true,`cycle ${i+1}: drawing on`);
  await close(page);assert.equal((await info(page)).active,false,`cycle ${i+1}: released`);memory.push(await page.evaluate(()=>typeof View3D.rendererMemory==='function'?View3D.rendererMemory():View3D.rendererMemory));}
 await fs.writeFile(path.join(QA,'cycles.json'),JSON.stringify(memory,null,1));
 for(let i=1;i<5;i++)assert.deepEqual(memory[i],memory[0],`cycle ${i+1} memory equals cycle 1 ${JSON.stringify(memory)}`);
 assert.deepEqual(errors,[]);
});

test('HV2-C1 without float render targets the presentation keeps the usual view (fallback)',{skip,timeout:600000},async t=>{
 const {page,errors}=await open(t,{width:1280,height:800});
 await configure(page);await settled(page);
 const r=await page.evaluate(()=>View3D.presentationLivingDrawingBegin({forceUnsupported:true}));
 assert.equal(r.active,false);assert.equal(r.reason,'float-render-target');assert.equal((await info(page)).active,false);
 const view=await ink(page,'fallback-1280',[.15,.25,.55,.95]);assert.ok(view.colour>.02,'the usual coloured view goes on');
 await close(page);assert.deepEqual(errors,[]);
});

test('HV2-C1 phone 390×844 (DPR 2): drawing on, thicker line step, no horizontal overflow',{skip,timeout:900000},async t=>{
 const {page,errors}=await open(t,{width:390,height:844},{dpr:2});
 await configure(page,{living:true});await settled(page);await frames(page);
 const i=await info(page);assert.equal(i.active,true);assert.equal(i.lineStep,2,'one CSS pixel of line at DPR 2');
 const v=await ink(page,'on-390-overview',[.05,.05,.95,.45]);assert.ok(v.dark>.004&&v.colour<.01,`phone drawing ${JSON.stringify(v)}`);
 assert.equal(await page.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1),true);
 await close(page);assert.equal((await info(page)).active,false);assert.deepEqual(errors,[]);
});
