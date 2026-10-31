/* FT3D frame-by-frame validation video. The narratives are deterministic in p, so each step of the slider is a real
   state of the real app; capturing every step after it is rendered shows the motion as a normal GPU plays it, also on
   machines where software rendering gives one frame per second (CI, cloud sessions).
   Usage: node scripts/qa/render-presentation-story-frames.cjs <repo root> <output dir> <WxH> [steps=100] [parts=1a,1b]
   Parts: 1a (plan → overview), 1b (overview → first room), 2 (the whole story, stepping its global progress),
   3 (FT3D-3: «Incluir sección dinámica» on — the story from the overview through the section to the first room, then exit),
   3r (FT3D-3: the section alone, stepped from 1 back to 0),
   4 (FT3D-4: «Incluir alzado/fachada narrativa» on — the story from the overview through the façade to the first room,
   then exit), 4r (FT3D-4: the façade alone, stepped from 1 back to 0).
   Writes <output dir>/frames/NNNNN.png and prints them as JSON; assemble with
   ffmpeg -framerate 24 -i <output dir>/frames/%05d.png -c:v libx264 -pix_fmt yuv420p video.mp4
   Needs three@0.160.0 from the CDN or THREE_LOCAL_DIR (tests/helpers/three-module.cjs). Evidence only, never committed. */
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [root,out,size,stepsArg,partsArg]=process.argv.slice(2),[W,H]=size.split('x').map(Number),steps=Number(stepsArg)||100,parts=(partsArg||'1a,1b').split(',');
const three=require(path.join(root,'tests/helpers/three-module.cjs'));
(async()=>{
 const server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));res.setHeader('Content-Type',/\.m?js$/.test(f)?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':f.endsWith('.hdr')?'application/octet-stream':f.endsWith('.webp')?'image/webp':f.endsWith('.glb')?'model/gltf-binary':'text/html');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});const mobile=W<1000;
 const page=await (await browser.newContext({viewport:{width:W,height:H},isMobile:mobile,hasTouch:mobile})).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async r=>r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(r.request().url(),()=>{throw Error('no local three');})}));
 const dir=path.join(out,'frames');await fs.mkdir(dir,{recursive:true});let n=0;const frames=[];
 const rendered=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const shot=async(repeat=1)=>{await rendered();const buf=await page.screenshot();for(let i=0;i<repeat;i++){const f=path.join(dir,String(n++).padStart(5,'0')+'.png');await fs.writeFile(f,buf);frames.push(f);}};
 const idle=()=>page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:180000});
 // Holds a narrative at p as soon as it exists (it would otherwise play by itself), then steps it.
 const hold=kind=>page.evaluate(async kind=>{for(let i=0;i<5000&&FloorPlanPresentation.story?.kind!==kind;i++)await new Promise(r=>setTimeout(r,0));
  const s=document.querySelector('#presentationStorySlider');s.value='0';s.dispatchEvent(new Event('input',{bubbles:true}));},kind);
 // Steps the slider over its whole range (0–100 for one scene, 0–1000 for a story); waits for scene changes to settle.
 const step=async()=>{for(let i=0;i<=steps;i++){await page.evaluate(k=>{const s=document.querySelector('#presentationStorySlider');s.value=String(Math.round(k*Number(s.max)));s.dispatchEvent(new Event('input',{bubbles:true}));},i/steps);
  await page.waitForFunction(()=>!FloorPlanPresentation.story?.busy,null,{timeout:120000});await shot();}};
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin,null,{timeout:30000});
 await page.locator('#welcomeExample').click();await page.waitForTimeout(1500);await shot(24);
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 await page.locator('#presentationStoryOption').check();if(parts.some(p=>p.startsWith('3')))await page.locator('#presentationSectionOption').check();if(parts.some(p=>p.startsWith('4')))await page.locator('#presentationElevationOption').check();await shot(24);await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await hold('plan-reveal');await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:180000});
 if(parts.includes('1a')){await shot(18);await step();await shot(18);}
 await page.locator('#presentationStoryPlay').click();await idle();await shot(24);
 if(parts.includes('1b')&&await page.locator('#presentationStoryEnter').count()){
  await page.evaluate(()=>document.querySelector('#presentationStoryEnter').click());await hold('room-descent');await shot(12);await step();await shot(12);
  await page.locator('#presentationStoryPlay').click();await page.waitForFunction(()=>FloorPlanPresentation.current?.kind==='room'&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:120000});await shot(36);}
 if(parts.includes('2')){if(!await page.locator('#presentationStoryFull').isVisible()){await page.locator('.presentation-stops button').nth(0).click();await idle();}
  await page.evaluate(()=>document.querySelector('#presentationStoryFull').click());
  await page.evaluate(async()=>{for(let i=0;i<5000&&!(FloorPlanPresentation.story?.scenes>1&&FloorPlanPresentation.story.scene>=0&&!FloorPlanPresentation.story.busy);i++)await new Promise(r=>setTimeout(r,0));const s=document.querySelector('#presentationStorySlider');s.value='0';s.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.waitForFunction(()=>FloorPlanPresentation.story?.P===0&&!FloorPlanPresentation.story.busy,null,{timeout:120000});await shot(12);await step();await shot(12);
  await page.locator('#presentationStoryPlay').click();await page.waitForFunction(()=>FloorPlanPresentation.current?.kind==='room'&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:120000});await shot(36);}
 // FT3D-3: from the overview (start of the section scene) to the first room, stepping the story's global progress.
 if(parts.includes('3')){if(!await page.locator('#presentationStoryFull').isVisible()){await page.locator('.presentation-stops button').nth(0).click();await idle();}
  await page.evaluate(()=>document.querySelector('#presentationStoryFull').click());
  await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1&&!FloorPlanPresentation.story.busy,null,{timeout:120000});
  const range=await page.evaluate(()=>{const kinds=['plan-reveal','section-open','room-descent'],seq=FloorPlanPresentationStory.sequence(kinds.map(k=>FloorPlanPresentationStory.SCENE_MS[k]));return [seq.at(1,0),1];});
  for(let i=0;i<=steps;i++){const P=range[0]+(range[1]-range[0])*i/steps;await page.evaluate(v=>{const s=document.querySelector('#presentationStorySlider');s.value=String(Math.round(v*1000));s.dispatchEvent(new Event('input',{bubbles:true}));},P);
   await page.waitForFunction(()=>!FloorPlanPresentation.story?.busy,null,{timeout:120000});await shot(i===0?18:1);}
  await shot(18);await page.locator('#presentationStoryPlay').click();await page.waitForFunction(()=>FloorPlanPresentation.current?.kind==='room'&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:120000});await shot(30);
  await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&!View3D.lifecycleMetrics.animating,null,{timeout:60000});await page.waitForTimeout(800);await shot(36);
  console.error(JSON.stringify({afterExit:await page.evaluate(()=>View3D.presentationClipInfo)}));}
 if(parts.includes('3r')){if(!await page.evaluate(()=>FloorPlanPresentation.active)){await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();await page.locator('#presentationSectionOption').check();await page.getByRole('button',{name:'Iniciar presentación'}).click();await hold('plan-reveal');await page.locator('#presentationStoryPlay').click();await idle();}
  await page.evaluate(()=>document.querySelector('#presentationSectionPlay').click());await hold('section-open');
  for(let i=steps;i>=0;i--){await page.evaluate(k=>{const s=document.querySelector('#presentationStorySlider');s.value=String(Math.round(k*Number(s.max)));s.dispatchEvent(new Event('input',{bubbles:true}));},i/steps);await shot(i===steps?18:1);}
  await shot(18);}
 // FT3D-4: from the overview (start of the façade scene) to the first room, stepping the story's global progress.
 if(parts.includes('4')){if(!await page.locator('#presentationStoryFull').isVisible()){await page.locator('.presentation-stops button').nth(0).click();await idle();}
  await page.evaluate(()=>document.querySelector('#presentationStoryFull').click());
  await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1&&!FloorPlanPresentation.story.busy,null,{timeout:120000});
  const range=await page.evaluate(()=>{const kinds=FloorPlanPresentation.story.kinds,seq=FloorPlanPresentationStory.sequence(kinds.map(k=>FloorPlanPresentationStory.SCENE_MS[k]));return [seq.at(kinds.indexOf('elevation-open'),0),1];});
  for(let i=0;i<=steps;i++){const P=range[0]+(range[1]-range[0])*i/steps;await page.evaluate(v=>{const s=document.querySelector('#presentationStorySlider');s.value=String(Math.round(v*1000));s.dispatchEvent(new Event('input',{bubbles:true}));},P);
   await page.waitForFunction(()=>!FloorPlanPresentation.story?.busy,null,{timeout:120000});await shot(i===0?18:1);}
  await shot(18);await page.locator('#presentationStoryPlay').click();await page.waitForFunction(()=>FloorPlanPresentation.current?.kind==='room'&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:120000});await shot(30);
  await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&!View3D.lifecycleMetrics.animating,null,{timeout:60000});await page.waitForTimeout(800);await shot(36);
  console.error(JSON.stringify({afterExit:await page.evaluate(()=>View3D.presentationElevationResidue)}));}
 if(parts.includes('4r')){if(!await page.evaluate(()=>FloorPlanPresentation.active)){await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();await page.locator('#presentationElevationOption').check();await page.getByRole('button',{name:'Iniciar presentación'}).click();await hold('plan-reveal');await page.locator('#presentationStoryPlay').click();await idle();}
  await page.evaluate(()=>document.querySelector('#presentationElevationPlay').click());await hold('elevation-open');
  for(let i=steps;i>=0;i--){await page.evaluate(k=>{const s=document.querySelector('#presentationStorySlider');s.value=String(Math.round(k*Number(s.max)));s.dispatchEvent(new Event('input',{bubbles:true}));},i/steps);await shot(i===steps?18:1);}
  await shot(18);}
 await browser.close();server.close();console.log(JSON.stringify({frames:frames.length,dir,errors}));
})().catch(e=>{console.error(e);process.exit(1);});
