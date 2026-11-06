/* Presentation UX probe (Gate B measurements). Runs the real app in Chromium and measures, every animation frame of a
   whole story, the presentation card, its header, the essential story controls and the buttons visible in the card.
   Usage: node scripts/qa/presentation-ux-probe.cjs <out.json> [width] [height] [reduced=0|1] [screenshotsDir]
   Read-only: it never edits the project or the app; it only clicks what a person clicks. */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..','..'),three=require(path.join(root,'tests','helpers','three-module.cjs'));
const [out,W='1280',H='800',R='0',shots]=process.argv.slice(2);
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
(async()=>{
 const server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const reduced=R==='1',ctx=await browser.newContext({viewport:{width:+W,height:+H},reducedMotion:reduced?'reduce':'no-preference'});
 const page=await ctx.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 page.on('request',r=>{const u=r.url();if(!u.startsWith(url)&&!u.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/')&&!u.startsWith('data:')&&!u.startsWith('blob:'))requests.push(u);});
 page.setDefaultTimeout(300000);
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async r=>r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(r.request().url(),()=>{throw Error('no local three');})}));
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin,null,{timeout:120000});
 await page.locator('#welcomeExample').click();await page.waitForFunction(()=>FloorPlanApp.project.rooms.length>3);
 const shot=async name=>{if(shots){await fs.mkdir(shots,{recursive:true});await page.screenshot({path:path.join(shots,`${W}x${H}${reduced?'-rm':''}-${name}.png`)});}};
 // ── Configuration dialog: how much a person has to read and scroll before «Iniciar presentación».
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 const configOf=()=>page.evaluate(()=>{const d=document.querySelector('#presentationConfig'),r=d.getBoundingClientRect(),vis=e=>!!e&&e.getClientRects().length>0&&!e.closest('[hidden]');
  const start=[...d.querySelectorAll('.presentation-config-actions .btn')].find(b=>/Iniciar|Start/.test(b.textContent)),sr=start?.getBoundingClientRect();
  return {height:Math.round(r.height),scrollHeight:d.scrollHeight,clientHeight:d.clientHeight,scrollRatio:+(d.scrollHeight/d.clientHeight).toFixed(2),
   inputs:[...d.querySelectorAll('input,select,textarea')].filter(vis).length,controls:[...d.querySelectorAll('input,select,textarea,button')].filter(vis).length,
   words:(d.innerText||'').split(/\s+/).filter(Boolean).length,startVisibleWithoutScroll:!!sr&&sr.top>=r.top&&sr.bottom<=r.bottom};});
 const config0=await configOf();await shot('0-config');
 await page.locator('#presentationStoryOption').check();await page.locator('#presentationSectionOption').check();await page.locator('#presentationVisitOption').check();
 if(await page.locator('#presentationElevationOption').isEnabled())await page.locator('#presentationElevationOption').check();
 if(await page.locator('#presentationAxonCompact').isEnabled())await page.locator('#presentationAxonCompact').check();
 const config1=await configOf();
 await page.locator('#presentationConfig .presentation-config-actions .btn').first().click();
 // From the plan: without reduced motion it plays by itself; with reduced motion a person steps it.
 if(reduced){await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='plan-reveal'&&!FloorPlanPresentation.story.busy,null,{timeout:300000});
  for(let i=0;i<6&&await page.evaluate(()=>!!FloorPlanPresentation.story);i++){await page.locator('#presentationStoryPlay').click();await page.waitForTimeout(500);}}
 const settled=()=>page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:600000});
 await settled();await shot('1-overview');
 // ── In-page sampler: every frame, the geometry of the card and the controls, and what is visible.
 await page.evaluate(()=>{const S=window.__uxProbe={samples:[],on:true};const q=s=>document.querySelector(s);
  const rect=e=>{if(!e||!e.getClientRects().length||e.closest('[hidden]'))return null;const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)];};
  const tick=()=>{if(!S.on)return;const card=q('#presentationOverlay .presentation-card'),s=FloorPlanPresentation.story;
   const vis=[...card.querySelectorAll('button')].filter(b=>b.getClientRects().length&&!b.closest('[hidden]')).map(b=>b.id||b.textContent.trim().slice(0,24));
   S.samples.push({t:Math.round(performance.now()),story:s?{kind:s.kind,i:s.index??null,P:+(s.P||0).toFixed(4),playing:!!s.playing}:null,
    card:rect(card),head:rect(card.querySelector('.presentation-card-top')),play:rect(q('#presentationStoryPlay')),slider:rect(q('#presentationStorySlider')),caption:rect(q('#presentationStoryCaption')),
    scroll:card.scrollHeight>card.clientHeight+1,scrollTop:card.scrollTop,docScroll:[scrollX,scrollY],buttons:vis});
   requestAnimationFrame(tick);};requestAnimationFrame(tick);});
 const memory0=await page.evaluate(()=>({...View3D.rendererMemory}));
 await page.evaluate(()=>document.querySelector('#presentationStoryFull').click());
 await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1,null,{timeout:120000});
 // Pause once in the middle of the story (a person reads), resume, then let it reach its end.
 const marks=[];
 if(!reduced){await page.waitForFunction(()=>(FloorPlanPresentation.story?.P||0)>0.35,null,{timeout:900000});
  await page.evaluate(()=>document.querySelector('#presentationStoryPlay').click());marks.push(['pause',await page.evaluate(()=>performance.now())]);
  await page.waitForTimeout(1500);await shot('2-paused');
  await page.evaluate(()=>document.querySelector('#presentationStoryPlay').click());marks.push(['resume',await page.evaluate(()=>performance.now())]);
  await page.waitForFunction(()=>{const s=FloorPlanPresentation.story;return !s||(s.P>=1&&!s.playing&&!s.busy);},null,{timeout:900000});}
 else{for(let i=0;i<40&&await page.evaluate(()=>{const s=FloorPlanPresentation.story;return !!s&&!(s.P>=1&&!s.playing);});i++){
  await page.waitForFunction(()=>{const s=FloorPlanPresentation.story;return !s||(!s.playing&&!s.busy);});await page.evaluate(()=>document.querySelector('#presentationStoryPlay').click());await page.waitForTimeout(400);}
  await page.waitForFunction(()=>{const s=FloorPlanPresentation.story;return !s||(s.P>=1&&!s.playing&&!s.busy);},null,{timeout:900000});}
 await page.waitForTimeout(600);await shot('3-arrival');
 const samples=await page.evaluate(()=>{window.__uxProbe.on=false;return window.__uxProbe.samples;});
 const memory1=await page.evaluate(()=>({...View3D.rendererMemory}));
 // ── Metrics. The story's span is from its first frame open to the last.
 const inStory=samples.filter(s=>s.story);const range=(xs,f)=>{const v=xs.map(f).filter(x=>x!=null);return v.length?[Math.min(...v),Math.max(...v)]:null;};
 const span=(xs,f)=>{const r=range(xs,f);return r?r[1]-r[0]:null;};
 const metric=xs=>({frames:xs.length,cardTop:range(xs,s=>s.card?.[1]),cardHeight:range(xs,s=>s.card?.[3]),cardLeft:range(xs,s=>s.card?.[0]),
  headTopSpan:span(xs,s=>s.head?.[1]),playTopSpan:span(xs,s=>s.play?.[1]),playLeftSpan:span(xs,s=>s.play?.[0]),sliderTopSpan:span(xs,s=>s.slider?.[1]),cardHeightSpan:span(xs,s=>s.card?.[3]),cardTopSpan:span(xs,s=>s.card?.[1]),
  buttonSets:new Set(xs.map(s=>s.buttons.join('|'))).size,maxButtons:Math.max(0,...xs.map(s=>s.buttons.length)),scrolledFrames:xs.filter(s=>s.scroll).length,docScrolled:xs.filter(s=>s.docScroll[0]||s.docScroll[1]).length});
 const playing=inStory.filter(s=>s.story.playing),notPlaying=inStory.filter(s=>!s.story.playing);
 const result={sha:process.env.PROBE_SHA||null,viewport:[+W,+H],reduced,config:{initial:config0,chosen:config1},
  story:metric(inStory),playing:metric(playing),paused:metric(notPlaying),
  buttonsPlaying:[...new Set(playing.flatMap(s=>s.buttons))],buttonsAtArrival:inStory.at(-1)?.buttons||[],
  marks,memory:{before:memory0,after:memory1},errors,externalRequests:requests,samples:inStory.length>4000?inStory.filter((_,i)=>i%Math.ceil(inStory.length/4000)===0):inStory};
 await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,JSON.stringify(result,null,1));
 const {samples:_,...summary}=result;console.log(JSON.stringify(summary,(k,v)=>k==='samples'?undefined:v));
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1);});
