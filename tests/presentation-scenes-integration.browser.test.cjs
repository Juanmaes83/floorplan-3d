/* Integration QA: Hybrid V2 «Dibujo vivo» + corrected Section → Spatial Visit, twice in ONE presentation.
   This test runs WITHOUT Hybrid V1 and checks graphite → living room → full Section story → interior handover;
   after each scene: no living drawing, ambience, clipping or material residue; identical material signatures,
   renderer and lens state, stable memory across two rounds, and unchanged project JSON. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile),{chromium}=require('playwright');
const QA=process.env.INTEGRATION_ARTIFACTS||path.join(os.tmpdir(),'presentation-scenes-integration');let server,url,browser;const cache=new Map();
const three=target=>require('./helpers/three-module.cjs')(target,()=>run('curl',['--fail','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout));
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('outside');
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(QA,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
const skip=!process.env.THREE_LOCAL_DIR&&'THREE_LOCAL_DIR not set: the scenes need 3D';
const frames=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const settled=page=>page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:300000});
async function slide(page,P){await page.evaluate(v=>{const s=document.querySelector('#presentationStorySlider');s.step='any';s.value=String(v*Number(s.max));s.dispatchEvent(new Event('input',{bubbles:true}));},P);
 await page.waitForFunction(()=>!FloorPlanPresentation.story?.busy,null,{timeout:300000});await frames(page);}
// A scene button plays its scene to the end and hands back to the presentation (product behaviour); the evidence pauses
// it the moment it exists (inside the page, so a loaded machine cannot let it run to the end first).
async function openPaused(page,selector,kind){await page.evaluate(async([sel,k])=>{document.querySelector(sel).click();
  for(let i=0;i<6000;i++){const st=FloorPlanPresentation.story;if(st&&(k==='full'?st.scenes>1:st.kind===k)){const s=document.querySelector('#presentationStorySlider');s.dispatchEvent(new Event('input',{bubbles:true}));return;}await new Promise(r=>setTimeout(r,20));}
  throw Error('scene did not open: '+k);},[selector,kind]);await page.waitForFunction(()=>!FloorPlanPresentation.story?.busy,null,{timeout:300000});}
async function finish(page){await slide(page,1);await page.locator('#presentationStoryPlay').click();await settled(page);await frames(page);}
// Back to the first overview stop (the state every scene is compared at): never measured at a room stop.
async function toOverview(page){
 if(await page.evaluate(()=>FloorPlanPresentation.current?.kind!=='overview')){
  const buttons=page.locator('#presentationOverlay button:visible',{hasText:/^\s*Vista general\s*$/});assert.ok(await buttons.count()>0,'an overview stop button');await buttons.last().click();
  await page.waitForFunction(()=>FloorPlanPresentation.current?.kind==='overview',null,{timeout:300000});await settled(page);}
 assert.equal(await page.evaluate(()=>FloorPlanPresentation.current?.kind),'overview','measured at the overview');await frames(page);}
async function read(page,name,region){const png=await page.locator('#view3d canvas').screenshot();await fs.writeFile(path.join(QA,name+'.png'),png);
 return page.evaluate(async([b64,r])=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);
  const x0=Math.round(img.width*r[0]),y0=Math.round(img.height*r[1]),w=Math.round(img.width*(r[2]-r[0])),h=Math.round(img.height*(r[3]-r[1]));const d=x.getImageData(x0,y0,w,h).data;let paper=0,colour=0,n=0;
  for(let i=0;i<d.length;i+=4){const R=d[i],G=d[i+1],B=d[i+2],l=(.2126*R+.7152*G+.0722*B)/255;n++;if(l>.82)paper++;if(Math.max(R,G,B)-Math.min(R,G,B)>10)colour++;}return {paper:paper/n,colour:colour/n};},[png.toString('base64'),region]);}
// Everything a scene could leave behind, read at the overview between scenes.
const residue=page=>page.evaluate(()=>{const x=View3D.presentationHybridInspect?.()||{swapped:false,contourNodes:0},c=View3D.presentationClipInfo;
 return {drawing:View3D.presentationLivingDrawingInfo.active,ambience:View3D.presentationAmbienceInfo.active,clipMaterials:c.materialsWithPlanes,localClipping:c.localClipping,
  hybridSwapped:x.swapped,contourNodes:x.contourNodes,hybridMaterials:View3D.presentationElevationResidue?.hybridMaterials||0,
  // Section rebuilds the scene graph when it returns to full height (new mesh and material ids), so the evidence is the
  // multiset of material signatures in use: any presentation material left behind, or any original lost, changes it.
  bindings:View3D.presentationMaterialSignature,renderer:View3D.presentationRendererState,memory:View3D.rendererMemory};});
function clean(r,label){assert.equal(r.drawing,false,label+': drawing layer released');assert.equal(r.ambience,false,label+': ambience removed');assert.equal(r.clipMaterials,0,label+': no clipping plane left');
 assert.equal(r.localClipping,false,label+': local clipping off');assert.equal(r.hybridSwapped,false,label+': no hybrid material');assert.equal(r.contourNodes,0,label+': no contour node');assert.equal(r.hybridMaterials,0,label+': no hybrid clone');
 assert.equal(r.renderer.renderTarget,null,label+': renders to the screen');assert.equal(r.renderer.overrideMaterial,false,label+': no override material');assert.equal(r.renderer.clippingPlanes,0,label+': no global clipping');}

test('HV2 + corrected Section visit, twice: no residue of materials, camera or renderer',{skip,timeout:3600000},async t=>{
 // Reduced motion: each scene waits at its start, so one can inspect exact final handover and restoration.
 const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});page.setDefaultTimeout(300000);
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const target=route.request().url();if(!cache.has(target))cache.set(target,three(target));await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await cache.get(target)});});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin,null,{timeout:90000});
 if(!await page.evaluate(()=>!!(View3D.presentationVisitPlan&&View3D.presentationLivingDrawingBegin))){t.skip('Section visit or Hybrid V2 not in this build: integration only');return;}
 await page.locator('#welcomeExample').click();await page.waitForFunction(()=>FloorPlanApp.project.rooms.length>3);await page.waitForTimeout(800);
 const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 for(const id of ['#presentationLivingDrawing','#presentationLivingAmbience','#presentationSectionOption','#presentationVisitOption'])await page.locator(id).check();
 const start=page.getByRole('button',{name:'Iniciar presentación'});await start.scrollIntoViewIfNeeded();await start.click();
 await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='living-drawing'&&!FloorPlanPresentation.story.busy,null,{timeout:300000});
 const log=[];let first=null,rounds=[];
 for(let round=1;round<=2;round++){
  // 1. living drawing (it opened the presentation in round 1; replayed from the overview in round 2)
  if(round===2)await openPaused(page,'#presentationLivingPlay','living-drawing');
  await slide(page,0);const drawn=await read(page,`r${round}-living-p000`,[.2,.15,.75,.95]);
  assert.ok(drawn.paper>.4&&drawn.colour<.012,`round ${round}: a clean graphite drawing, no clip or hybrid residue ${JSON.stringify(drawn)}`);
  const total=await page.evaluate(()=>View3D.presentationStoryInfo.living.total);await slide(page,(4.5+3.5)/total);
  const alive=await read(page,`r${round}-living-first-room`,[.2,.15,.75,.95]);assert.ok(alive.colour>.03,`round ${round}: the first room comes to life ${JSON.stringify(alive)}`);
  assert.equal((await page.evaluate(()=>View3D.presentationAmbienceInfo)).active,true,'ambience shows during the scene');
  await finish(page);await toOverview(page);const r1=await residue(page);clean(r1,`round ${round} after the living drawing`);
  if(!first)first=r1;
  assert.deepEqual(r1.bindings,first.bindings,`round ${round}: every mesh has its own material after the living drawing`);
  // 2. the whole story: section → validated room visit
  await openPaused(page,'#presentationStoryFull','full');
  const kinds=await page.evaluate(()=>FloorPlanPresentation.story.kinds);assert.ok(kinds.includes('section-open')&&kinds.includes('room-visit'),'section and visit chained '+kinds);
  const at=k=>page.evaluate(k=>{const ks=FloorPlanPresentation.story.kinds,seq=FloorPlanPresentationStory.sequence(ks.map(x=>FloorPlanPresentationStory.SCENE_MS[x]));return seq.at(ks.indexOf(k),.6);},k);
  await slide(page,await at('section-open'));assert.ok((await page.evaluate(()=>View3D.presentationClipInfo)).materialsWithPlanes>0,'the section clips the model');assert.equal((await page.evaluate(()=>View3D.presentationLivingDrawingInfo)).active,false,'the section is the usual render');
  await slide(page,await at('room-visit'));await slide(page,1);const visit=await page.evaluate(()=>View3D.presentationVisitInfo);assert.ok(visit?.roomId,'the visit reaches its room');
  assert.equal(await page.locator('#presentationVisitWalk').isVisible(),true,'handover: Explore from here is visible');
  assert.equal(await page.locator('#presentationVisitSection').isVisible(),true,'handover: Back to section is visible');
  await page.waitForTimeout(800);assert.equal(await page.evaluate(()=>FloorPlanPresentation.story?.kind),'room-visit','handover stays in the room');
  await page.locator('#presentationStoryPlay').click();await settled(page);await toOverview(page);
  const r2=await residue(page);clean(r2,`round ${round} after section + visit`);assert.deepEqual(r2.bindings,first.bindings,`round ${round}: materials intact after section + visit`);
  assert.deepEqual(r2.renderer,first.renderer,`round ${round}: renderer and camera lens as after the living drawing`);
  rounds.push(r2.memory);log.push({round,kinds,after:[r1,r2].map(r=>({...r,bindings:{meshes:r.bindings.meshes,kinds:Object.keys(r.bindings.materials).length}}))});
 }
 await fs.writeFile(path.join(QA,'integration.json'),JSON.stringify(log,null,1));
 assert.deepEqual(rounds[1],rounds[0],`second round leaves renderer memory as the first ${JSON.stringify(rounds)}`);
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden,null,{timeout:120000});
 const c=await page.evaluate(()=>View3D.presentationClipInfo);assert.equal(c.materialsWithPlanes,0);assert.equal(c.localClipping,false);
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project,'project JSON identical');assert.deepEqual(errors,[]);
});
