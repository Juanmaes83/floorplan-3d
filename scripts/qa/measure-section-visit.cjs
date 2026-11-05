/* Section → Spatial Visit V1 — comparable measurement on the reference home (not a pass/fail test).
   Same session, same scene: entry time of the visit scene vs the existing room descent, rAF frame intervals while each
   plays, renderer memory before/after. SwiftShader (CPU) numbers are relative only — never a phone or a GPU figure.
   Usage: node scripts/qa/measure-section-visit.cjs <repo root> [WxH] */
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [root,size='1280x800']=process.argv.slice(2),[W,H]=size.split('x').map(Number),three=require(path.join(root,'tests/helpers/three-module.cjs'));
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
(async()=>{
 const server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const page=await (await browser.newContext({viewport:{width:W,height:H}})).newPage();
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async r=>r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(r.request().url(),()=>{throw Error('no local three');})}));
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin,null,{timeout:90000});
 await page.locator('#welcomeExample').click();await page.waitForFunction(()=>FloorPlanApp.project.rooms.length>3);
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 await page.locator('#presentationSectionOption').check();await page.locator('#presentationVisitOption').check();
 await page.locator('#presentationConfig .presentation-config-actions .btn').first().click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:180000});
 const out=await page.evaluate(async()=>{
  const frames=ms=>new Promise(r=>{const t=[];let last=performance.now();const end=last+ms;const f=n=>{t.push(n-last);last=n;if(n<end)requestAnimationFrame(f);else r(t);};requestAnimationFrame(f);});
  const stat=t=>{const s=[...t].sort((a,b)=>a-b);return {frames:t.length,p50:+s[Math.floor(s.length*.5)].toFixed(1),p95:+s[Math.floor(s.length*.95)].toFixed(1)};};
  const P=FloorPlanPresentation.plan,ov=P.stops.findIndex(s=>s.kind==='overview'),room=P.stops.findIndex(s=>s.kind==='room');const res={};
  const mem0=View3D.rendererMemory;
  // The real flow: the story's availability check (fullStory) computes the plan when the panel is drawn.
  {const t=performance.now();View3D.presentationVisitPlan(P.stops[room].roomId);res.availabilityMs=+(performance.now()-t).toFixed(1);}
  for(const kind of ['room-descent','room-visit']){
   const t0=performance.now();const info=View3D.presentationStoryBegin(P.stops[room],{fromStop:P.stops[ov]},kind);const begin=performance.now()-t0;
   // Play the scene by p over its own play time while sampling frames.
   const ms=Math.min(8000,info.playMs||4000),start=performance.now();let raf=0;const play=()=>{const p=Math.min(1,(performance.now()-start)/ms);View3D.presentationStoryApply(p);if(p<1)raf=requestAnimationFrame(play);};raf=requestAnimationFrame(play);
   const f=await frames(ms);cancelAnimationFrame(raf);View3D.presentationStoryEnd({keepPose:true});
   res[kind]={beginMs:+begin.toFixed(1),playMs:info.playMs,...stat(f)};}
  res.memoryBefore=mem0;res.memoryAfter=View3D.rendererMemory;res.gpu=(()=>{const g=document.createElement('canvas').getContext('webgl');const d=g&&g.getExtension('WEBGL_debug_renderer_info');return d?g.getParameter(d.UNMASKED_RENDERER_WEBGL):'unknown';})();return res;});
 console.log(JSON.stringify({viewport:size,...out},null,1));await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1);});
