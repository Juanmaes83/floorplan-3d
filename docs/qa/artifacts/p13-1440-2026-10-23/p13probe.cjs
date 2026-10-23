// P13 phase probe: same setup as tests/presentation.browser.test.cjs (Chromium flags, viewport, fixture, three.js),
// measures where the time of «Guardar PNG» goes. Usage: node p13probe.cjs <repoDir> <label> <width> <height>
// Measurement only: it never changes the repository or the test.
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [repo,label,W,H]=process.argv.slice(2),viewport={width:+W||1440,height:+H||900};
const threeModule=require(path.join(repo,'tests/helpers/three-module.cjs'));
const out=path.join(__dirname,'out');
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const types={'.js':'text/javascript','.mjs':'text/javascript','.cjs':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
 const server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://x').pathname,file=path.resolve(repo,'.'+(p==='/'?'/index.html':p));res.setHeader('Content-Type',types[path.extname(file)]||(/\.m?js$/.test(file)?'text/javascript':'application/octet-stream'));res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const result={label,viewport,chromium:browser.version()},console_=[];const T0=Date.now(),mark=k=>result[k]=Date.now()-T0;
 try{
  const context=await browser.newContext({viewport,isMobile:viewport.width<1000,hasTouch:viewport.width<1000,acceptDownloads:true});
  await context.tracing.start({screenshots:true,snapshots:false});
  const page=await context.newPage();page.on('console',m=>console_.push(`${m.type()}: ${m.text()}`));page.on('pageerror',e=>console_.push('pageerror: '+e.message));
  await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async r=>r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await threeModule(r.request().url(),()=>Promise.reject(Error('no cdn')))}));
  await page.addInitScript(()=>{window.__long=[];try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__long.push({start:Math.round(e.startTime),ms:Math.round(e.duration)});}).observe({type:'longtask',buffered:true});}catch{}});
  await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D);await page.locator('#welcomeExample').click();mark('t_example');
  await page.locator('#guidePresent:visible, #presentationBtn:visible').click();await page.getByRole('button',{name:'Iniciar presentación'}).click();
  await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:120000});mark('t_presenting');
  // Render loop cost: mean and max interval between animation frames over 3 s, with no input.
  result.frames=await page.evaluate(()=>new Promise(res=>{const t=[];let s=performance.now();const f=n=>{t.push(n);if(n-s<3000)requestAnimationFrame(f);else{const d=t.slice(1).map((x,i)=>x-t[i]);res({count:d.length,meanMs:Math.round(d.reduce((a,b)=>a+b,0)/d.length),maxMs:Math.round(Math.max(...d))});}};requestAnimationFrame(f);}));
  const canvas=await page.evaluate(()=>{const c=document.querySelector('#stage canvas')||document.querySelector('canvas');return {w:c.width,h:c.height,dpr:devicePixelRatio,size:View3D.shotSize({size:'1280',aspect:'view'})};});result.canvas=canvas;
  // Phase A: the same shot the button makes, called directly (no input event), timed in the page.
  result.shotDirect=await page.evaluate(()=>{const t=performance.now();const s=View3D.shot({size:'1280',aspect:'view',download:false});const a=performance.now();const b64=s.dataUrl.length;return {totalMs:Math.round(a-t),dataUrlChars:b64,w:s.width,h:s.height};});
  // Phase B: the real click, as P13 does it, with a long measurement window (not a test timeout).
  await page.evaluate(()=>{window.__long=[];const b=document.querySelector('#presentationCapture');window.__clickAt=null;b.addEventListener('click',()=>{window.__clickAt=performance.now();},{capture:true});});
  const t1=Date.now();const pending=page.waitForEvent('download',{timeout:180000});
  let clickErr=null;const clickDone=page.locator('#presentationCapture').click({timeout:180000}).then(()=>Date.now()-t1,e=>{clickErr=e.message.split('\n')[0];return null;});
  const dl=await pending.then(d=>({ms:Date.now()-t1,name:d.suggestedFilename()}),e=>({error:e.message.split('\n')[0]}));
  result.click={clickReturnedMs:await clickDone,clickErr,download:dl};
  result.page=await page.evaluate(()=>({handlerStartToNow:window.__clickAt?Math.round(performance.now()-window.__clickAt):null,longTasks:window.__long.slice(-8)}));
  result.console=console_.slice(-10);
  await context.tracing.stop({path:path.join(out,`trace-${label}-${W}x${H}.zip`)});
 }catch(e){result.error=e.message.split('\n').slice(0,3).join(' | ');result.console=console_.slice(-10);}
 finally{await browser.close();server.close();result.totalMs=Date.now()-T0;console.log(JSON.stringify(result));}
})();
