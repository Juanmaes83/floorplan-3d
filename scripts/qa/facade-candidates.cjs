/* FT3D-4 façade candidates, side by side (QA evidence for a ranking decision; not product code).
   For each façade the model derives (the same descriptor the dialog lists), the real app plays the façade scene with
   reduced motion and stops on its two held states: the frontal façade and the exterior perspective. Nothing is invented:
   the façade, its walls and openings are the project's. Also prints each candidate's real opening data.
   Usage: node scripts/qa/facade-candidates.cjs <outDir> [width=1280] [height=800] */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..','..'),three=require(path.join(root,'tests','helpers','three-module.cjs'));
const [outDir,W='1280',H='800']=process.argv.slice(2);
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
(async()=>{
 await fs.mkdir(outDir,{recursive:true});
 const server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const report=[];
 for(let k=0;k<8;k++){
  const ctx=await browser.newContext({viewport:{width:+W,height:+H},reducedMotion:'reduce'});const page=await ctx.newPage();page.setDefaultTimeout(300000);
  await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async r=>r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(r.request().url(),()=>{throw Error('no local three');})}));
  await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin,null,{timeout:120000});
  await page.locator('#welcomeExample').click();await page.waitForFunction(()=>FloorPlanApp.project.rooms.length>3);
  await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
  await page.locator('#presentationElevationOption').check();
  const options=await page.locator('#presentationElevationFacade option').evaluateAll(list=>list.map(o=>({value:o.value,text:o.textContent})));
  const facades=options.filter(o=>/^facade-/.test(o.value));
  if(k>=facades.length){await ctx.close();break;}
  const f=facades[k];await page.locator('#presentationElevationFacade').selectOption(f.value);
  await page.locator('#presentationConfig .presentation-config-actions .btn').first().click();
  await page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:600000});
  await page.evaluate(()=>document.querySelector('#presentationElevationPlay').click());
  await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='elevation-open'&&!FloorPlanPresentation.story.busy);
  const shots=[];
  for(const hold of ['front','perspective']){
   await page.evaluate(()=>document.querySelector('#presentationStoryPlay').click());
   await page.waitForFunction(()=>{const s=FloorPlanPresentation.story;return s&&!s.playing&&!s.busy;});await page.waitForTimeout(600);
   const file=path.join(outDir,`${f.value}-${hold}-${W}x${H}.png`);await page.screenshot({path:file});shots.push(file);
  }
  const info=await page.evaluate(id=>{const E=window.FloorPlanPresentationElevation,app=FloorPlanApp,d=E.derive({levels:[{levelId:null,project:app.project,geometry:app.geometry}],northOffsetDeg:app.project.site?.northOffsetDeg});
   const c=d.candidates.find(x=>x.id===id),op=new Map(app.project.openings.map(o=>[o.id,o]));const os=c.openingRefs.map(r=>op.get(r.openingId)).filter(Boolean);
   const area=os.reduce((s,o)=>s+o.widthMm*o.heightMm,0)/1e6;return {id,label:c.label,defaultId:d.defaultId,lengthM:+(c.totalFacadeLengthMm/1000).toFixed(2),openings:os.length,kinds:os.map(o=>o.kind),openingAreaM2:+area.toFixed(2),openingRatio:+(area/(c.totalFacadeLengthMm*c.heightMm/1e6)).toFixed(3)};},f.value);
  report.push({...info,shots});console.log(JSON.stringify(info));
  await ctx.close();
 }
 await fs.writeFile(path.join(outDir,'facade-candidates.json'),JSON.stringify(report,null,1));
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1);});
