/* Real-time recording of the Presentation journey of the owner's incident video, for a BEFORE/AFTER comparison.
   Chromium + Playwright recordVideo of the real app (SwiftShader here: a CPU renderer, so the frame rate is low; the
   story is time-based, so it plays at its real speed). Same steps in both builds:
   configure (from the plan + section + visit + façade + axonometric view) → start → overview → «Ver la historia
   completa» → pause in the middle → resume → arrival → «Explorar desde aquí» → back → «Volver a editar».
   Mode «living» (Hybrid V2 «Dibujo vivo», optionally with its suggested ambience): the presentation opens with the
   graphite drawing coming to life → pause → «Volver al dibujo» → play to the end → «Ver dibujo vivo» again (repeat) →
   «Ver la historia completa» (section → visit) → «Explorar desde aquí» → back → «Volver a editar».
   Usage: node scripts/qa/record-presentation-ux.cjs <outDir> <label> [width] [height] [journey|living|living-ambience]
   Writes <outDir>/<label>-<w>x<h>.webm and a JSON log of the steps with their times. Read-only on the project. */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..','..'),three=require(path.join(root,'tests','helpers','three-module.cjs'));
const [outDir,label,W='1280',H='800',MODE='journey']=process.argv.slice(2);const LIVING=MODE.startsWith('living');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
(async()=>{
 await fs.mkdir(outDir,{recursive:true});
 const server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const size={width:+W,height:+H},tmp=path.join(outDir,`.rec-${label}`);
 const mobile=size.width<700,ctx=await browser.newContext({viewport:size,isMobile:mobile,hasTouch:mobile,recordVideo:{dir:tmp,size}});const page=await ctx.newPage(),errors=[],log=[];
 page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(600000);
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async r=>r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(r.request().url(),()=>{throw Error('no local three');})}));
 const t0=Date.now(),step=s=>{log.push({t:+((Date.now()-t0)/1000).toFixed(1),step:s});console.log(log.at(-1));};
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin,null,{timeout:120000});
 await page.locator('#welcomeExample').click();await page.waitForFunction(()=>FloorPlanApp.project.rooms.length>3);step('example');
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();step('dialog');
 await page.waitForTimeout(1500);
 // Scroll the dialog to its end and back, as a person reading it does.
 await page.evaluate(async()=>{const d=document.querySelector('#presentationConfig');for(let y=0;y<=d.scrollHeight;y+=60){d.scrollTop=y;await new Promise(r=>setTimeout(r,40));}await new Promise(r=>setTimeout(r,600));d.scrollTop=0;});step('dialog read');
 if(await page.locator('#presentationSuggestedScenes').count()){await page.locator('#presentationSuggestedScenes').click();step('suggested scenes');}
 else{await page.locator('#presentationStoryOption').check();await page.locator('#presentationSectionOption').check();await page.locator('#presentationVisitOption').check();
  if(await page.locator('#presentationElevationOption').isEnabled())await page.locator('#presentationElevationOption').check();
  if(await page.locator('#presentationAxonCompact').isEnabled())await page.locator('#presentationAxonCompact').check();step('options checked');}
 if(LIVING){const box=page.locator('#presentationLivingOptionBox');await box.scrollIntoViewIfNeeded();await page.locator('#presentationLivingDrawing').check();step('dibujo vivo on');
  if(MODE==='living-ambience'){await page.locator('#presentationLivingAmbience').check();step('ambience on');}await page.waitForTimeout(1500);}
 await page.waitForTimeout(1200);
 await page.locator('#presentationConfig .presentation-config-actions .btn').first().click();step('start');
 if(LIVING){
  const end=()=>page.waitForFunction(()=>{const s=FloorPlanPresentation.story;return !s||(s.P>=1&&!s.playing&&!s.busy);},null,{timeout:900000});
  await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='living-drawing',null,{timeout:300000});step('graphite drawing');
  await page.waitForFunction(()=>(FloorPlanPresentation.story?.P||0)>0.45,null,{timeout:900000});
  await page.evaluate(()=>document.querySelector('#presentationStoryPlay').click());step('pause (patches)');await page.waitForTimeout(3500);
  await page.locator('#presentationStoryPlan').click();step('back to the drawing');
  await page.waitForFunction(()=>{const s=FloorPlanPresentation.story;return s&&s.P===0&&!s.playing&&!s.busy;},null,{timeout:900000});await page.waitForTimeout(2000);
  await page.locator('#presentationStoryPlay').click();step('play');await end();step('living end');await page.waitForTimeout(3000);
  await page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:600000});step('overview');await page.waitForTimeout(1500);
  await page.locator('#presentationLivingPlay').click();step('repeat «Ver dibujo vivo»');await end();step('living end again');await page.waitForTimeout(2500);
 }
 await page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:600000});step('overview');
 await page.waitForTimeout(1500);
 await page.evaluate(()=>document.querySelector('#presentationStoryFull').click());step('whole story');
 await page.waitForFunction(()=>(FloorPlanPresentation.story?.P||0)>0.4,null,{timeout:900000});
 await page.evaluate(()=>document.querySelector('#presentationStoryPlay').click());step('pause');await page.waitForTimeout(3000);
 await page.evaluate(()=>document.querySelector('#presentationStoryPlay').click());step('resume');
 await page.waitForFunction(()=>{const s=FloorPlanPresentation.story;return !s||(s.P>=1&&!s.playing&&!s.busy);},null,{timeout:900000});step('arrival');
 await page.waitForTimeout(2500);
 if(await page.locator('#presentationVisitWalk').isVisible()){await page.locator('#presentationVisitWalk').click();await page.waitForFunction(()=>View3D.walking());step('explore from here');await page.waitForTimeout(2000);
  await page.locator('#presentationWalkBack').click();await page.waitForFunction(()=>!View3D.walking());step('back to the presentation');await page.waitForTimeout(2500);}
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active);step('return to editor');await page.waitForTimeout(1200);
 const video=page.video();await ctx.close();const file=path.join(outDir,`${label}-${W}x${H}.webm`);await video.saveAs(file);await fs.rm(tmp,{recursive:true,force:true});
 await fs.writeFile(path.join(outDir,`${label}-${W}x${H}.json`),JSON.stringify({label,sha:process.env.RECORD_SHA||null,viewport:size,steps:log,errors},null,1));
 await browser.close();server.close();console.log(file,errors.length?'ERRORS '+errors.join(' | '):'no page errors');
})().catch(e=>{console.error(e);process.exit(1);});
