/* Hybrid V2 «Dibujo vivo» — frame-by-frame evidence of the story scene on the real app (Chromium; SwiftShader here, so
   frames are rendered one by one at fixed story times instead of in real time). Not product code.
   The presentation is configured as a person would (rooms in the dialog, «Dibujo vivo» on), the story opens by itself;
   it is paused and every frame seeks the story at t = i / fps with the story slider (the same path a person uses, so the
   card and captions follow), waits two animation frames and takes a screenshot of the page (card included).
   usage: node scripts/qa/render-living-drawing-story.cjs <root> <out> [stills|video] [fps=24] [WxH=1280x720] [rooms=Salón,Comedor,Cocina,Dormitorio principal] [dpr=1] [fromFrame] [toFrame] [ambience=0] */
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const [root,out,mode='stills',fpsArg='24',vp='1280x720',roomsArg='Salón,Comedor,Cocina,Dormitorio principal',dprArg='1',fromArg='0',toArg='1e9',ambArg='0']=process.argv.slice(2);
const [width,height]=vp.split('x').map(Number),fps=Number(fpsArg),dpr=Number(dprArg),want=roomsArg.split(',');
const three=require(path.join(root,'tests/helpers/three-module.cjs'));
(async()=>{
 const head=execFileSync('git',['-C',root,'rev-parse','HEAD']).toString().trim();
 const server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));res.setHeader('Content-Type',/\.m?js$/.test(f)?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':f.endsWith('.svg')?'image/svg+xml':f.endsWith('.png')?'image/png':f.endsWith('.jpg')?'image/jpeg':f.endsWith('.html')?'text/html':'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const mobile=width<1000,ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,isMobile:mobile,hasTouch:mobile});const p=await ctx.newPage();const errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await p.route('**/*',async r=>{const t=r.request().url();if(t.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/'))return r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(t,()=>{throw Error('no local three');})});
  if(t.startsWith(url)||t.startsWith('blob:')||t.startsWith('data:'))return r.continue();return r.abort();});
 p.setDefaultTimeout(300000);await p.goto(url);await p.locator('#welcomeExample').click();await p.waitForTimeout(800);
 await p.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await p.locator('#presentationConfig[open]').waitFor();
 const rows=p.locator('.presentation-room-row'),n=await rows.count();
 for(let i=0;i<n;i++){const row=rows.nth(i),text=(await row.textContent()).trim().replace(/^\d+\s*/,''),box=row.locator('input[type=checkbox]');if(!await box.count())continue;const on=want.some(w=>text.startsWith(w));if((await box.isChecked())!==on)await box.setChecked(on);}
 await p.locator('#presentationLivingDrawing').check();if(ambArg==='1')await p.locator('#presentationLivingAmbience').check();
 const s=p.getByRole('button',{name:'Iniciar presentación'});await s.scrollIntoViewIfNeeded();await s.click();
 await p.waitForFunction(()=>FloorPlanPresentation.story?.kind==='living-drawing'&&View3D.presentationStoryInfo?.living,null,{timeout:300000});
 // pause the player (a person moving the slider pauses it), then drive the same pure state frame by frame
 await p.evaluate(()=>{const sl=document.querySelector('#presentationStorySlider');sl.value='0';sl.dispatchEvent(new Event('input',{bubbles:true}));});
 const info=await p.evaluate(()=>View3D.presentationStoryInfo.living);const total=info.total;
 await fs.mkdir(out,{recursive:true});
 const times=mode==='stills'?[0,.25,.45,.6,.75,.9].map(f=>f*total).concat(info.ends.map(e=>e*total-.4)).sort((a,b)=>a-b):Array.from({length:Math.round(total*fps)+1},(_,i)=>i/fps);
 const manifest={head,chromium:browser.version(),viewport:{width,height,dpr},rooms:info.rooms,total,fps,frames:[]};
 for(let i=Number(fromArg);i<Math.min(times.length,Number(toArg));i++){const t=Math.min(total,times[i]),t0=Date.now();
  // the same slider a person drags (step 'any' so every frame lands on its exact time): the card and captions follow
  const st=await p.evaluate(P=>{const sl=document.querySelector('#presentationStorySlider');sl.step='any';sl.value=String(P*Number(sl.max));sl.dispatchEvent(new Event('input',{bubbles:true}));return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r({phase:View3D.presentationStoryInfo.phase,room:View3D.presentationStoryInfo.living.roomId,drawing:View3D.presentationLivingDrawingInfo}))));},t/total);
  const file=mode==='stills'?`still-${t.toFixed(2).padStart(6,'0')}.png`:`f${String(i).padStart(4,'0')}.png`;await p.screenshot({path:path.join(out,file)});
  manifest.frames.push({i,t:+t.toFixed(3),file,phase:st.phase,room:st.room,liveSeeds:st.drawing?.liveSeeds,ms:Date.now()-t0});
  if(mode==='stills'||i%24===0)console.log(file,t.toFixed(2),st.phase,st.room,Date.now()-t0,'ms');}
 manifest.errors=errors;await fs.writeFile(path.join(out,`manifest-${fromArg}.json`),JSON.stringify(manifest,null,1));
 console.log('errors',errors.slice(0,5));await browser.close();await new Promise(r=>server.close(r));
})().catch(e=>{console.error(e);process.exit(1);});
