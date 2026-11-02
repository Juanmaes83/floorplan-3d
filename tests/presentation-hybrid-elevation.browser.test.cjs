/* Hybrid Registered Elevation V1 on the real app in Chromium:
   - option off by default; with it off the façade scene has no hybrid state and no presentation material;
   - on: the real façade candidate's walls/opening pieces are the targets (identity), nothing else and no glass gets a
     presentation material; technical → registered reveal → material (exact original material references back) →
     exterior → overview; seek/reverse give the same runtime state; the existing capture records the hybrid state;
   - five lifecycles begin → seek → reverse → seek → end: presentation clones created = disposed each time, renderer
     programs/geometries/textures do not grow, borrowed textures are never disposed;
   - a map that arrives late on a source material is mirrored into its clone and is not disposed by the hybrid;
   - fail closed: a candidate whose walls are not in the scene plays the normal façade (no hybrid state);
   - reduced motion: technical, material and exterior holds; 390×844 and 844×390 usable; project JSON never changes. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile),{chromium}=require('playwright');
const QA=process.env.HYBRID_ARTIFACTS||path.join(os.tmpdir(),'presentation-hybrid-elevation');let server,url,browser;const cache=new Map();
const three=target=>require('./helpers/three-module.cjs')(target,()=>run('curl',['--fail','--show-error','--max-time','30',target],{maxBuffer:4*1024*1024}).then(r=>r.stdout));
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(QA,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function open(t,viewport,{reduced=true}={}){const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
 await page.route('**/*',async route=>{const target=route.request().url();if(target.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/')){if(!cache.has(target))cache.set(target,three(target));return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await cache.get(target)});}
  if(target.startsWith(url)||target.startsWith('blob:')||target.startsWith('data:'))return route.continue();external.push(target);return route.abort();});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin&&window.FloorPlanElevationHybrid,null,{timeout:60000});
 await page.locator('#welcomeExample').click();await page.waitForTimeout(800);return {page,errors,external};}
const frames=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const settled=page=>page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:180000});
async function configure(page,{hybrid=true}={}){await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 await page.locator('#presentationElevationOption').check();const h=page.locator('#presentationElevationHybrid');assert.equal(await h.isChecked(),false,'hybrid off by default');
 assert.match(await page.locator('#presentationElevationHybrid + span').textContent(),/Elevación híbrida/);if(hybrid)await h.check();
 const start=page.getByRole('button',{name:'Iniciar presentación'});await start.scrollIntoViewIfNeeded();await start.click();await settled(page);}
const snapshot=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),storage:Object.keys(localStorage).filter(k=>/hybrid|elevation|facade|fachada/i.test(k))}));
const inspect=page=>page.evaluate(()=>View3D.presentationHybridInspect());
const info=page=>page.evaluate(()=>{const i=View3D.presentationStoryInfo;return {p:i?.p,phase:i?.phase,hybrid:i?.elevation?.hybrid??null,caption:document.querySelector('#presentationStoryCaption')?.textContent||''};});
async function play(page){await page.evaluate(()=>document.querySelector('#presentationElevationPlay').click());await page.waitForFunction(()=>View3D.presentationStoryInfo?.kind==='elevation-open',null,{timeout:60000});await page.waitForFunction(()=>!FloorPlanPresentation.story?.playing,null,{timeout:60000});}
async function scrub(page,v){await page.evaluate(v=>{const s=document.querySelector('#presentationStorySlider');s.value=String(v);s.dispatchEvent(new Event('input',{bubbles:true}));},v);await frames(page);}
const nonTargets=(bindings,records)=>{const t=new Set(records.map(r=>r.mesh));return Object.fromEntries(Object.entries(bindings).filter(([k])=>!t.has(k)));};
async function shotPx(page){return page.evaluate(async()=>{const c=document.querySelector('#stage canvas');const b=await new Promise(r=>c.toBlob(r));return b.size;});}

test('off by default and off = existing façade: no hybrid state, no presentation material',async t=>{
 const {page,errors,external}=await open(t,{width:1440,height:900});await configure(page,{hybrid:false});await play(page);
 for(const v of [35,48,56,86]){await scrub(page,v);const i=await info(page);assert.equal(i.hybrid.requested,false);assert.equal(i.hybrid.supported,false);assert.doesNotMatch(i.caption,/híbrida/);assert.equal((await inspect(page)).hybridMeshes,0);}
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});
test('on: real façade targets, registered reveal, exact original materials back, capture, reverse, clean exit (1440×900)',async t=>{
 const {page,errors,external}=await open(t,{width:1440,height:900});const before=await snapshot(page);await configure(page);
 const pre=(await inspect(page)).bindings;await play(page);
 await scrub(page,35);let i=await info(page),x=await inspect(page);
 assert.equal(i.phase,'front');assert.equal(i.hybrid.supported,true);assert.ok(i.hybrid.walls>0,'façade walls mapped');assert.equal(i.hybrid.state.technicalMix,1);assert.equal(i.hybrid.state.materialReveal,0);
 assert.match(i.caption,/Lectura técnica/);assert.match(i.caption,/Elevación híbrida/);
 assert.equal(x.swapped,true);assert.equal(x.foreign,0,'only targets carry presentation materials');assert.equal(x.glassHybrid,0,'glass keeps its own material');assert.equal(x.glassTouched,false);
 for(const r of x.records){assert.deepEqual(r.current,r.hybrid);assert.equal(r.original.join(','),pre[r.mesh],'original = material before the scene');}
 assert.deepEqual(nonTargets(x.bindings,x.records),nonTargets(pre,x.records),'every other mesh keeps its material');
 const ids=new Set(x.records.filter(r=>r.wallId).map(r=>r.wallId));const cand=await page.evaluate(()=>View3D.presentationStoryInfo.elevation);assert.ok(cand.walls>=ids.size);
 const techShot=await page.evaluate(()=>View3D.shot({size:'view'}));assert.ok(techShot,'capture works in the hybrid state');
 await scrub(page,48);i=await info(page);assert.ok(i.hybrid.state.materialReveal>.2&&i.hybrid.state.materialReveal<.8);assert.match(i.caption,/se materializa/);const mid=JSON.stringify(i.hybrid.state);
 await scrub(page,56);i=await info(page);x=await inspect(page);assert.equal(i.hybrid.state.materialReveal,1);assert.equal(x.swapped,false);
 for(const r of x.records)assert.deepEqual(r.current,r.original,'full material = the real Rubik materials (same references)');
 const matShot=await page.evaluate(()=>View3D.shot({size:'view'}));assert.notEqual(JSON.stringify(techShot).length===0,true);assert.ok(matShot);
 await scrub(page,86);i=await info(page);assert.equal(i.phase,'exterior');assert.equal((await inspect(page)).swapped,false);
 await scrub(page,100);assert.equal((await inspect(page)).swapped,false);
 for(const v of [56,48]){await scrub(page,v);}i=await info(page);assert.equal(JSON.stringify(i.hybrid.state),mid,'reverse gives the same state');assert.equal((await inspect(page)).swapped,true);
 await scrub(page,0);x=await inspect(page);assert.equal(x.swapped,false);assert.deepEqual(x.bindings,pre,'p = 0: every mesh has its exact material');
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active);await page.waitForTimeout(600);
 const last=await page.evaluate(()=>View3D.presentationHybridLast);assert.equal(last.created,last.disposed,'every presentation clone disposed');assert.equal(last.targets,0);
 assert.equal((await page.evaluate(()=>View3D.presentationElevationResidue)).hybridMaterials,0);
 const after=await snapshot(page);assert.equal(after.project,before.project,'project JSON identical');assert.deepEqual(after.storage,[]);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await page.screenshot({path:path.join(QA,'restored-1440x900.png')});
});
test('five lifecycles begin → seek → reverse → seek → end: no growth, clones disposed, borrowed maps intact; late map mirrored',async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});await configure(page);const metrics=[];
 for(let c=0;c<5;c++){await play(page);for(const v of [35,50,20,45,56,30])await scrub(page,v);
  if(c===2){// a SurfaceRenderer-like late map on a source material: the clone mirrors it, the hybrid never disposes it
   const r=await page.evaluate(()=>{const h=View3D.presentationHybridInspect();return h.records[0]?.original[0];});assert.ok(r);
   const ok=await page.evaluate(src=>View3D.__hybridTestLateMap(src),r);
   assert.equal(ok.mirrored,true,'late map mirrored into the clone');assert.equal(ok.disposedByHybrid,false,'borrowed map never disposed by the hybrid');assert.equal(ok.restored,true);
  }
  await page.evaluate(()=>document.querySelector('#presentationStoryPlan').click());await page.waitForFunction(()=>!FloorPlanPresentation.story&&!View3D.presentationStoryInfo?.active,null,{timeout:60000});await frames(page);
  metrics.push(await page.evaluate(()=>({last:View3D.presentationHybridLast,i:View3D.presentationHybridInspect(),mem:View3D.rendererMemory,programs:View3D.rendererPrograms})));
 }
 for(const m of metrics){assert.equal(m.last.created,m.last.disposed);assert.equal(m.i.hybridMeshes,0);}
 const P=metrics.map(m=>m.programs),G=metrics.map(m=>m.mem.geometries),T=metrics.map(m=>m.mem.textures);
 assert.ok(P.at(-1)<=P[1],`programs bounded ${P}`);assert.ok(G.at(-1)<=G[1],`geometries bounded ${G}`);assert.ok(T.at(-1)<=T[1],`textures bounded ${T}`);
 await fs.writeFile(path.join(QA,'five-cycles.json'),JSON.stringify(metrics.map(m=>({created:m.last.created,disposed:m.last.disposed,programs:m.programs,mem:m.mem})),null,1));
 assert.deepEqual(errors,[]);
});
test('fail closed: a façade whose walls are not in the scene plays the normal elevation; a real one is supported',async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});await configure(page,{hybrid:false});
 const r=await page.evaluate(()=>{const E=FloorPlanPresentationElevation,d=E.derive({levels:[{levelId:null,project:FloorPlanApp.project,geometry:FloorPlanApp.geometry}]}),c=d.candidates.find(x=>x.id===d.defaultId),stop=FloorPlanPresentation.plan.stops[0];
  const run=cand=>{View3D.presentationStoryBegin(stop,{elevation:{candidate:cand,envelope:d.envelope,hybrid:true}},'elevation-open');const s=View3D.presentationStoryApply(.35),i=View3D.presentationStoryInfo.elevation.hybrid,x=View3D.presentationHybridInspect();View3D.presentationStoryEnd({keepPose:false});return {hasState:'hybrid' in s,i,swapped:x.swapped,meshes:View3D.presentationHybridInspect().hybridMeshes};};
  return {bad:run({...c,wallRefs:[{levelId:'missing',wallId:'missing'}],openingRefs:[]}),good:run(c)};});
 assert.equal(r.bad.i.supported,false);assert.equal(r.bad.i.reason,'no-targets');assert.equal(r.bad.hasState,false,'normal elevation narrative');assert.equal(r.bad.swapped,false);
 assert.equal(r.good.i.supported,true);assert.equal(r.good.hasState,true);assert.equal(r.good.swapped,true);assert.equal(r.good.meshes,0,'ended cleanly');
 assert.deepEqual(errors,[]);
});
test('reduced motion: technical, frontal material and exterior holds',async t=>{
 const {page,errors}=await open(t,{width:1440,height:900},{reduced:true});await configure(page);
 await page.evaluate(()=>document.querySelector('#presentationElevationPlay').click());await page.waitForFunction(()=>View3D.presentationStoryInfo?.kind==='elevation-open');
 const seen=[];for(let k=0;k<4;k++){await page.waitForFunction(()=>!FloorPlanPresentation.story?.playing,null,{timeout:60000});await frames(page);const i=await info(page);seen.push({p:+i.p.toFixed(3),phase:i.phase,tech:i.hybrid.state?.technicalMix,reveal:i.hybrid.state?.materialReveal});
  await page.locator('#presentationStoryPlay').click();}
 const S=await page.evaluate(()=>FloorPlanPresentationStory.ELEVATION_OPEN);
 assert.deepEqual(seen.map(s=>s.p),[0,S.reducedFront,S.reducedMaterial,S.reducedPersp],'overview → technical → material → exterior');
 assert.equal(seen[0].tech,0);assert.equal(seen[1].tech,1);assert.equal(seen[1].reveal,0);assert.equal(seen[2].reveal,1);assert.equal(seen[2].phase,'light');assert.equal(seen[3].phase,'exterior');
 assert.deepEqual(errors,[]);
});
for(const [w,h] of [[390,844],[844,390]])test(`phone ${w}×${h}: technical, mid reveal, material, restored; controls usable, no overflow`,async t=>{
 const {page,errors}=await open(t,{width:w,height:h});await configure(page);await play(page);
 for(const [n,v] of [['technical',35],['mid',48],['material',56],['restored',100]]){await scrub(page,v);const i=await info(page);assert.equal(i.hybrid.supported,true);
  await page.screenshot({path:path.join(QA,`${w}x${h}-${n}.png`)});}
 assert.ok(await page.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
 assert.ok(await page.locator('#presentationStoryPlay').isVisible());assert.ok(await page.locator('#presentationStorySlider').isVisible());
 assert.deepEqual(errors,[]);
});
