/* FT3D-5 visual evidence on the real app in Chromium (contract V2 §38): screenshots of the reading of the building and
   frame sequences of the scenes played forwards and REALLY backwards (the story is stepped from 1 to 0 on the same
   narrative — nothing is reversed afterwards). Writes a manifest (head SHA, Chromium, scenario, viewport, progress,
   output) next to the images. Nothing here is product code.
   usage: node scripts/qa/render-presentation-axon.cjs <root> <out> <scenario> [steps]
   scenario: shots | video:<compact|exploded>:<forward|reverse>:<WxH> */
const path=require('node:path'),fs=require('node:fs/promises'),os=require('node:os'),{createServer}=require('node:http'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const [root,out,scenario,stepsArg]=process.argv.slice(2),steps=Number(stepsArg)||120;
const B=require(path.join(root,'js/building-core.js')),P=require(path.join(root,'js/project-package.js')),T=require(path.join(root,'js/tracing-core.js')),S=require(path.join(root,'tests/fixtures/stair-conflict-building.cjs'));
const three=require(path.join(root,'tests/helpers/three-module.cjs'));
async function pack(name,mutate){const b=S.build().building;for(const l of b.levels)l.project.objects=l.project.objects.filter(o=>!/sofa|bed/.test(o.id));mutate?.(b);B.validate(b);
 const {entries}=await B.packageEntries(b,()=>null,T.imageInfo);const file=path.join(await fs.mkdtemp(path.join(os.tmpdir(),'axon-qa-')),name+'.zip');await fs.writeFile(file,Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));return file;}
(async()=>{
 const head=execFileSync('git',['-C',root,'rev-parse','HEAD']).toString().trim(),manifest=[];
 const server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));res.setHeader('Content-Type',/\.m?js$/.test(f)?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':f.endsWith('.svg')?'image/svg+xml':f.endsWith('.png')?'image/png':f.endsWith('.webp')?'image/webp':f.endsWith('.glb')?'model/gltf-binary':f.endsWith('.hdr')?'application/octet-stream':'text/html');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});const chromiumInfo={version:browser.version(),executable:process.env.CHROME||chromium.executablePath()};
 const zips={duplex:await pack('duplex'),offset:await pack('offset',b=>{b.levels[1].offsetMm={x:1500,y:-900};for(const w of b.levels[0].project.walls)w.heightMm=4600;})};
 await fs.mkdir(out,{recursive:true});const errors=[],external=[];
 async function page(viewport,reduced){const mobile=viewport.width<1000,ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',async r=>{const t=r.request().url();if(t.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/'))return r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(t,()=>{throw Error('no local three');})});
   if(t.startsWith(url)||t.startsWith('blob:')||t.startsWith('data:'))return r.continue();external.push(t);return r.abort();});
  await p.goto(url);await p.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin&&window.FloorPlanPresentationAxon,null,{timeout:60000});p.setDefaultTimeout(120000);return {p,ctx};}
 const frames=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const settled=p=>p.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:180000});
 async function setup(p,{zip,mode,upper=false}){
  if(zip){const [c]=await Promise.all([p.waitForEvent('filechooser'),p.locator('#welcomeUpload').click()]);await c.setFiles(zip);await p.waitForFunction(()=>FloorPlanBuildingUI?.context?.levels>1,null,{timeout:60000});}
  else await p.locator('#welcomeExample').click();
  await p.waitForTimeout(1000);await p.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await p.locator('#presentationConfig[open]').waitFor();
  await p.locator(mode==='exploded'?'#presentationAxonExploded':'#presentationAxonCompact').check();const s=p.getByRole('button',{name:'Iniciar presentación'});await s.scrollIntoViewIfNeeded();await s.click();await settled(p);
  if(upper){const i=await p.evaluate(()=>FloorPlanPresentation.plan.stops.findIndex(s=>s.kind==='overview'&&s.levelId===FloorPlanPresentation.plan.levels.at(-1).levelId));await p.locator('.presentation-stops button').nth(i).click();await settled(p);}
  await p.evaluate(()=>document.querySelector('#presentationAxonPlay').click());await p.waitForFunction(()=>/axon|exploded/.test(FloorPlanPresentation.story?.kind||''),null,{timeout:180000});
  await p.evaluate(()=>{const s=document.querySelector('#presentationStorySlider');s.value='0';s.dispatchEvent(new Event('input',{bubbles:true}));});await frames(p);}
 const at=async(p,v)=>{await p.evaluate(v=>{const s=document.querySelector('#presentationStorySlider');s.value=String(v);s.dispatchEvent(new Event('input',{bubbles:true}));},v);await frames(p);};
 const record=async(p,file,extra)=>{await p.screenshot({path:file});const st=await p.evaluate(()=>({kind:FloorPlanPresentation.story?.kind??null,p:FloorPlanPresentation.story?.local??null,phase:View3D.presentationStoryInfo.phase??null}));
  manifest.push({headSha:head,chromium:chromiumInfo,...extra,viewport:p.viewportSize(),progress:st,output:file});};
 if(scenario==='shots'){
  const plan=[
   {name:'one-level-p0',zip:null,mode:'compact',size:[1440,900],at:[0]},{name:'one-level-axon-hold',zip:null,mode:'compact',size:[1440,900],at:[50]},{name:'one-level-p1',zip:null,mode:'compact',size:[1440,900],at:[100]},
   {name:'two-level-compact',zip:'duplex',mode:'compact',size:[1440,900],at:[50]},
   {name:'exploded-separation-mid',zip:'duplex',mode:'exploded',size:[1440,900],at:[38]},{name:'exploded-hold',zip:'duplex',mode:'exploded',size:[1440,900],at:[64]},{name:'exploded-recompose',zip:'duplex',mode:'exploded',size:[1440,900],at:[82]},
   {name:'active-upper-hold',zip:'offset',mode:'exploded',upper:true,size:[1440,900],at:[64]},{name:'offset-xz-footprints-tall-hold',zip:'offset',mode:'exploded',size:[1440,900],at:[64]},
   {name:'reduced-compact-hold',zip:'duplex',mode:'exploded',size:[1440,900],at:[22],reduced:true},{name:'reduced-exploded-hold',zip:'duplex',mode:'exploded',size:[1440,900],at:[64],reduced:true},
   {name:'phone-390x844-hold',zip:'duplex',mode:'exploded',size:[390,844],at:[64]},{name:'phone-844x390-hold',zip:'duplex',mode:'exploded',size:[844,390],at:[64]}];
  for(const s of plan){const {p,ctx}=await page({width:s.size[0],height:s.size[1]},!!s.reduced);await setup(p,{zip:s.zip&&zips[s.zip],mode:s.mode,upper:s.upper});
   for(const v of s.at){await at(p,v);await record(p,path.join(out,s.name+'.png'),{scenario:s.name});}await ctx.close();}
 }else{
  const [,mode,dir,size]=scenario.split(':'),[W,H]=size.split('x').map(Number),{p,ctx}=await page({width:W,height:H},false);
  await setup(p,{zip:zips.duplex,mode});const fdir=path.join(out,'frames');await fs.mkdir(fdir,{recursive:true});let n=0;
  const seq=dir==='reverse'?[...Array(steps+1).keys()].reverse():[...Array(steps+1).keys()];
  for(const i of seq){await at(p,Math.round(100*i/steps));const f=path.join(fdir,String(n++).padStart(5,'0')+'.png');await p.screenshot({path:f});}
  manifest.push({headSha:head,chromium:chromiumInfo,scenario,viewport:{width:W,height:H},progress:{from:dir==='reverse'?1:0,to:dir==='reverse'?0:1,steps},output:fdir,frames:n});
  await p.locator('#presentationStoryPlan').click().catch(()=>{});await ctx.close();
 }
 await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({headSha:head,chromium:chromiumInfo,errors,external,entries:manifest},null,1));
 await browser.close();server.close();console.log(JSON.stringify({headSha:head,chromium:chromiumInfo,entries:manifest.length,errors,external}));
})().catch(e=>{console.error(e);process.exit(1);});
