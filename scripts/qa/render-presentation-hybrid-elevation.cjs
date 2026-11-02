/* Hybrid Registered Elevation V1 — visual evidence on the real app in Chromium. Screenshots at Story checkpoints of
   elevation-open with «Elevación híbrida» on (and, for comparison, off), on the one-level example and on the two-level
   building fixture, at 1440×900, 390×844 and 844×390. Writes manifest.json (head SHA, Chromium, scenario, viewport,
   p, phase, hybrid state, output). Nothing here is product code.
   usage: node scripts/qa/render-presentation-hybrid-elevation.cjs <root> <out> [shots|video:<WxH>:<forward|reverse>] [steps] */
const path=require('node:path'),fs=require('node:fs/promises'),os=require('node:os'),{createServer}=require('node:http'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const [root,out,scenario='shots',stepsArg]=process.argv.slice(2),steps=Number(stepsArg)||96;
const B=require(path.join(root,'js/building-core.js')),P=require(path.join(root,'js/project-package.js')),T=require(path.join(root,'js/tracing-core.js')),S=require(path.join(root,'tests/fixtures/stair-conflict-building.cjs'));
const three=require(path.join(root,'tests/helpers/three-module.cjs'));
(async()=>{
 const head=execFileSync('git',['-C',root,'rev-parse','HEAD']).toString().trim(),dirty=execFileSync('git',['-C',root,'status','--porcelain','--','js','index.html']).toString().trim().length>0,manifest=[];
 const server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));res.setHeader('Content-Type',/\.m?js$/.test(f)?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':f.endsWith('.svg')?'image/svg+xml':f.endsWith('.png')?'image/png':f.endsWith('.webp')?'image/webp':f.endsWith('.glb')?'model/gltf-binary':f.endsWith('.hdr')?'application/octet-stream':'text/html');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});const chromiumInfo={version:browser.version(),executable:process.env.CHROME||chromium.executablePath()};
 const b=S.build().building;for(const l of b.levels)l.project.objects=l.project.objects.filter(o=>!/sofa|bed/.test(o.id));B.validate(b);
 const {entries}=await B.packageEntries(b,()=>null,T.imageInfo);const duplex=path.join(await fs.mkdtemp(path.join(os.tmpdir(),'hybrid-qa-')),'duplex.zip');await fs.writeFile(duplex,Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));
 await fs.mkdir(out,{recursive:true});const errors=[],external=[];
 async function page(viewport,{reduced=true,video=null,dpr=1}={}){const mobile=viewport.width<1000,ctx=await browser.newContext({viewport,deviceScaleFactor:dpr,isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference',...(video?{recordVideo:{dir:video,size:viewport}}:{})});const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',async r=>{const t=r.request().url();if(t.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/'))return r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(t,()=>{throw Error('no local three');})});
   if(t.startsWith(url)||t.startsWith('blob:')||t.startsWith('data:'))return r.continue();external.push(t);return r.abort();});
  await p.goto(url);await p.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin&&window.FloorPlanPresentationElevation,null,{timeout:60000});p.setDefaultTimeout(120000);return {p,ctx};}
 const frames=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const settled=p=>p.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:180000});
 async function setup(p,{zip,hybrid=true,quality=null}){
  const oak=zip==='qa-oak';if(oak){await p.locator('#welcomeExample').click();await p.waitForTimeout(800);
   // QA-only fixture variant (never stored): the example with surface-oak-wood-planks (baseColor+normal+roughness) on the
   // default façade's walls, applied through the product's own FloorPlanSurfaces.apply — a PBR control for base/enhanced.
   await p.waitForFunction(()=>window.FloorPlanSurfaces?.entries?.length>0,null,{timeout:60000});
   await p.evaluate(()=>{const E=FloorPlanPresentationElevation,d=E.derive({levels:[{levelId:null,project,geometry}]}),c=d.candidates.find(x=>x.id===d.defaultId),entry=FloorPlanSurfaces.get('surface-oak-wood-planks');
    for(const r of c.wallRefs)project=FloorPlanSurfaces.apply(project,entry,{kind:'wall',id:r.wallId});refreshProject();renderAll();window.View3D?.refreshSurfaces();});zip=null;}
  if(quality)await p.evaluate(q=>View3D.setSurfaceQuality(q),quality).catch(()=>{});
  if(zip){const [c]=await Promise.all([p.waitForEvent('filechooser'),p.locator('#welcomeUpload').click()]);await c.setFiles(zip);await p.waitForFunction(()=>FloorPlanBuildingUI?.context?.levels>1,null,{timeout:60000});}
  else if(!oak)await p.locator('#welcomeExample').click();
  await p.waitForTimeout(1000);await p.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await p.locator('#presentationConfig[open]').waitFor();
  await p.locator('#presentationElevationOption').check();if(hybrid)await p.locator('#presentationElevationHybrid').check();
  const s=p.getByRole('button',{name:'Iniciar presentación'});await s.scrollIntoViewIfNeeded();await s.click();await settled(p);
  await p.evaluate(()=>document.querySelector('#presentationElevationPlay').click());await p.waitForFunction(()=>FloorPlanPresentation.story?.kind==='elevation-open'||View3D.presentationStoryInfo?.kind==='elevation-open',null,{timeout:180000});
  await at(p,0);}
 const at=async(p,v)=>{await p.evaluate(v=>{const s=document.querySelector('#presentationStorySlider');s.value=String(v);s.dispatchEvent(new Event('input',{bubbles:true}));},v);await frames(p);await frames(p);};
 const read=p=>p.evaluate(()=>{const i=View3D.presentationStoryInfo,e=i?.elevation;return {surfaceQuality:View3D.surfaceQuality,light:(({preset,environment,exposure,sunIntensity})=>({preset,environment,exposure,sunIntensity}))(View3D.presentationLight),p:i?.p??null,phase:i?.phase??null,facade:e?.candidateId??null,solar:e?.solarOn??null,hybrid:e?.hybrid??null,materials:View3D.surfaceMetrics.map(m=>({id:m.id,state:m.state,detail:m.detailState})),pendingAssets:View3D.lifecycleMetrics.pendingAssets,dpr:devicePixelRatio,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};});
 const record=async(p,file,extra)=>{await p.screenshot({path:file});manifest.push({headSha:head,dirtyWorktree:dirty,chromium:chromiumInfo,...extra,viewport:p.viewportSize(),state:await read(p),output:file});};
 if(scenario==='lines'){
  // Ink contour legibility vs effective DPR (native 1-device-pixel lines): technical and M02-equivalent states.
  for(const [W,H,dprs] of [[1440,900,[1,2]],[390,844,[2,3]],[844,390,[2,3]]])for(const dpr of dprs){const {p,ctx}=await page({width:W,height:H},{dpr});await setup(p,{zip:null});
   for(const [n,v] of [['technical',35],['m02',45]]){await at(p,v);await record(p,path.join(out,`lines-${W}x${H}-dpr${dpr}-${n}.png`),{scenario:'lines',dpr,shot:n,slider:v});}await ctx.close();}
 }else if(scenario==='m03'){
  // M03-equivalent (material complete, frontal) and M02-equivalent: same fixture/façade/camera/light/viewport/SHA,
  // surfaceQuality base vs enhanced; the example as is and the QA oak-façade variant (PBR control).
  for(const fx of ['example','qa-oak'])for(const q of ['base','enhanced']){const {p,ctx}=await page({width:1440,height:900});await setup(p,{zip:fx==='qa-oak'?'qa-oak':null,quality:q});
   const ready=async()=>{await p.waitForFunction(()=>View3D.surfaceMetrics.every(m=>m.state!=='loading'&&!['loading','waiting'].includes(m.detailState)),null,{timeout:60000}).catch(()=>{});await p.waitForTimeout(400);};
   for(const [n,v] of [['m02',45],['m03',56]]){await at(p,v);await ready();await at(p,v);await record(p,path.join(out,`${n}-${fx}-${q}.png`),{scenario:'m03',fixture:fx==='qa-oak'?'qa-fixture: example + surface-oak-wood-planks on default façade (not stored)':'example',surfaceQuality:q,shot:n,slider:v});}
   await ctx.close();}
 }else if(scenario==='off'){
  // Hybrid OFF on the same fixture/states: comparable pixel-for-pixel with the baseline (0f9c6ea) run of this script.
  const {p,ctx}=await page({width:1440,height:900});await setup(p,{zip:null,hybrid:false});
  for(const [n,v] of [['00-overview',0],['02-frontal',35],['04-frontal-light',48],['06-frontal-light',56],['08-exterior',86],['10-restored',100]]){await at(p,v);await p.waitForTimeout(300);await record(p,path.join(out,`off-1440x900-${n}.png`),{scenario:'off',shot:n,slider:v});}await ctx.close();
 }else if(scenario.startsWith('real:')){
  // Real playback (normal motion): forward to the end of the scene, then «Volver a la vista general» plays it back.
  const [,size]=scenario.split(':'),[W,H]=size.split('x').map(Number),vdir=path.join(out,`real-${size}`);await fs.mkdir(vdir,{recursive:true});
  const {p,ctx}=await page({width:W,height:H},{reduced:false,video:vdir});await setup(p,{zip:null});
  await p.waitForFunction(()=>!FloorPlanPresentation.story?.playing,null,{timeout:180000});await at(p,0);await p.waitForTimeout(500);
  const t0=Date.now();await p.evaluate(()=>document.querySelector('#presentationStoryPlay').click());await p.waitForFunction(()=>(View3D.presentationStoryInfo?.p??0)>=.999||!FloorPlanPresentation.story,null,{timeout:180000});const forwardMs=Date.now()-t0;
  await at(p,52);await p.waitForTimeout(400);const t1=Date.now();await p.evaluate(()=>document.querySelector('#presentationStoryPlan').click());await p.waitForFunction(()=>!FloorPlanPresentation.story,null,{timeout:180000});const reverseMs=Date.now()-t1;await p.waitForTimeout(800);
  const video=p.video();await ctx.close();const file=await video.path();
  manifest.push({headSha:head,dirtyWorktree:dirty,chromium:chromiumInfo,scenario,viewport:{width:W,height:H},forwardMs,reverseMs,output:file});
 }else if(scenario==='shots'){
  const desk=[['00-overview',0],['01-align',14],['02-frontal-technical',35],['03-reveal-25',45],['04-reveal-50',48],['05-reveal-75',51],['06-full-material',56],['07-perspective',70],['08-exterior',86],['09-return',95],['10-restored-overview',100],['11-reverse-mid-sweep',48],['12-reverse-technical',35],['13-reverse-overview',0]];
  const small=[['02-frontal-technical',35],['03-reveal-25',45],['04-reveal-50',48],['06-full-material',56],['10-restored-overview',100]];
  const plan=[{name:'example-1440x900',zip:null,size:[1440,900],at:desk},{name:'example-off-1440x900',zip:null,size:[1440,900],hybrid:false,at:[['02-frontal',35],['06-frontal-light',56]]},
   {name:'duplex-1440x900',zip:duplex,size:[1440,900],at:desk},{name:'example-390x844',zip:null,size:[390,844],at:small},{name:'example-844x390',zip:null,size:[844,390],at:small}];
  const only=process.env.HYBRID_ONLY?new RegExp(process.env.HYBRID_ONLY):null;
  for(const s of plan.filter(x=>!only||only.test(x.name))){const {p,ctx}=await page({width:s.size[0],height:s.size[1]});await setup(p,{zip:s.zip,hybrid:s.hybrid!==false});
   for(const [n,v] of s.at){await at(p,v);await record(p,path.join(out,`${s.name}-${n}.png`),{scenario:s.name,shot:n,slider:v});}await ctx.close();}
 }else{
  const [,size,dir]=scenario.split(':'),[W,H]=size.split('x').map(Number),{p,ctx}=await page({width:W,height:H});await setup(p,{zip:null});
  const fdir=path.join(out,`frames-${size}-${dir}`);await fs.mkdir(fdir,{recursive:true});let n=0;
  const seq=dir==='reverse'?[...Array(steps+1).keys()].reverse():[...Array(steps+1).keys()];
  for(const i of seq){await at(p,Math.round(100*i/steps));await p.screenshot({path:path.join(fdir,String(n++).padStart(5,'0')+'.png')});}
  manifest.push({headSha:head,dirtyWorktree:dirty,chromium:chromiumInfo,scenario,viewport:{width:W,height:H},progress:{from:dir==='reverse'?1:0,to:dir==='reverse'?0:1,steps},output:fdir,frames:n});await ctx.close();
 }
 await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({headSha:head,dirtyWorktree:dirty,chromium:chromiumInfo,errors,external,entries:manifest},null,1));
 await browser.close();server.close();console.log(JSON.stringify({headSha:head,dirty,entries:manifest.length,errors,external}));
})().catch(e=>{console.error(e);process.exit(1);});
