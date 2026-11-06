/* Hybrid V2 C1 — cost of the drawing layer, measured on the real app (SwiftShader: comparative only, not a GPU).
   OFF: the presentation's overview at rest; ON: the «Dibujo vivo» scene paused at p = 0.3 (stains landing); 10 animation frames each (ON paused at p = 0.3 inside the scene); reports the median and p95 frame interval,
   renderer memory before/after and the drawing info. Not product code.
   usage: node scripts/qa/measure-living-drawing.cjs <root> [viewport=1280x800] */
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http');
const {chromium}=require('playwright');
const [root,vp='1280x800']=process.argv.slice(2);const [width,height]=vp.split('x').map(Number);
const three=require(path.join(root,'tests/helpers/three-module.cjs'));
(async()=>{
 const server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));res.setHeader('Content-Type',/\.m?js$/.test(f)?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':f.endsWith('.svg')?'image/svg+xml':f.endsWith('.png')?'image/png':f.endsWith('.jpg')?'image/jpeg':'application/octet-stream');if(f.endsWith('.html'))res.setHeader('Content-Type','text/html');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});const out={viewport:vp,chromium:browser.version(),runs:[]};
 for(const mode of ['off','on','off','on']){
  const ctx=await browser.newContext({viewport:{width,height}});const p=await ctx.newPage();
  await p.route('**/*',async r=>{const t=r.request().url();if(t.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/'))return r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(t,()=>{throw Error('no local three');})});if(t.startsWith(url)||t.startsWith('blob:')||t.startsWith('data:'))return r.continue();return r.abort();});
  p.setDefaultTimeout(240000);await p.goto(url);await p.locator('#welcomeExample').click();await p.waitForTimeout(800);
  await p.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await p.locator('#presentationConfig[open]').waitFor();
  if(mode==='on')await p.locator('#presentationLivingDrawing').check();
  const s=p.getByRole('button',{name:'Iniciar presentación'});await s.scrollIntoViewIfNeeded();await s.click();
  // OFF: the overview at rest. ON: while the living drawing scene plays (stains landing, camera moving): its real cost.
  // paused at p = 0.3 (stains landing in the first room, drawing on screen) so both modes measure a steady frame
  if(mode==='on'){await p.waitForFunction(()=>FloorPlanPresentation.story?.kind==='living-drawing',null,{timeout:240000});
   await p.evaluate(()=>{const s=document.querySelector('#presentationStorySlider');s.step='any';s.value=String(.3*Number(s.max));s.dispatchEvent(new Event('input',{bubbles:true}));});
   await p.waitForFunction(()=>!FloorPlanPresentation.story?.busy&&!FloorPlanPresentation.story?.playing,null,{timeout:240000});await p.waitForTimeout(1500);}
  else{await p.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:240000});await p.waitForTimeout(1500);}
  const r=await p.evaluate(()=>new Promise(res=>{const ts=[];const mem0=View3D.rendererMemory;const f=t=>{ts.push(t);if(ts.length<11)requestAnimationFrame(f);else{const d=ts.slice(1).map((v,i)=>v-ts[i]).sort((a,b)=>a-b);res({median:d[Math.floor(d.length/2)],p95:d[Math.floor(d.length*.95)],mem0,mem1:View3D.rendererMemory,drawing:View3D.presentationLivingDrawingInfo,frames:d.length});}};requestAnimationFrame(f);}));
  out.runs.push({mode,...r});console.log(mode,JSON.stringify(r));await ctx.close();
 }
 console.log(JSON.stringify(out));await browser.close();await new Promise(r=>server.close(r));
})().catch(e=>{console.error(e);process.exit(1);});
