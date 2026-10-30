/* FT3D validation video: drives the real app with Playwright + Chromium and records what a person sees.
   Usage: node scripts/qa/record-presentation-story.cjs <repo root> <output dir> <cut> <WxH>
   Cuts: 1a — «Empezar desde el plano»: 2D editor → plan → 3D overview by itself, «Volver al plano» and back to 3D.
   Needs three@0.160.0 from the CDN or THREE_LOCAL_DIR (tests/helpers/three-module.cjs). Prints the .webm path and the
   page errors seen (expected: none). The video is QA evidence, never committed. */
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [root,out,cut,size]=process.argv.slice(2),[W,H]=size.split('x').map(Number);
const three=require(path.join(root,'tests/helpers/three-module.cjs'));
(async()=>{
 const server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));res.setHeader('Content-Type',/\.m?js$/.test(f)?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':f.endsWith('.hdr')?'application/octet-stream':f.endsWith('.webp')?'image/webp':f.endsWith('.glb')?'model/gltf-binary':'text/html');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});const mobile=W<1000;
 const ctx=await browser.newContext({viewport:{width:W,height:H},isMobile:mobile,hasTouch:mobile,recordVideo:{dir:out,size:{width:W,height:H}}});const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async r=>r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(r.request().url(),()=>{throw Error('no local three');})}));
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin,null,{timeout:30000});
 await page.locator('#welcomeExample').click();await page.waitForTimeout(1500);
 const idle=()=>page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:180000});
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();await page.waitForTimeout(1200);
 await page.locator('#presentationStoryOption').check();await page.waitForTimeout(1200);await page.getByRole('button',{name:'Iniciar presentación'}).click();
 // 1a: plan → 3D by itself, then back to the plan and up again.
 await idle();await page.waitForTimeout(1500);
 if(cut==='1a'){await page.locator('#presentationStoryReplay').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.p===0&&!FloorPlanPresentation.story.playing,null,{timeout:120000});await page.waitForTimeout(1500);
  await page.locator('#presentationStoryPlay').click();await idle();await page.waitForTimeout(1500);}
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active);await page.waitForTimeout(2500);
 const video=page.video();await ctx.close();const file=await video.path();await browser.close();server.close();
 console.log(JSON.stringify({file,errors}));
})().catch(e=>{console.error(e);process.exit(1);});
