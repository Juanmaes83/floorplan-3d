/* Hybrid V2 «Dibujo vivo» C1 — visual evidence on the real app in Chromium. Not product code.
   For each viewport: the example home, «Presentar mi vivienda» with Salón, Comedor, Cocina and Dormitorio principal,
   «Dibujo vivo» ON (and OFF for comparison), one screenshot per stop (the product's own UI and camera), plus the drawing
   layer's info (precision, buffer size, AUX materials). Writes manifest.json (head SHA, Chromium, viewport, stop, mode).
   usage: node scripts/qa/render-presentation-living-drawing.cjs <root> <out> [modes=on,off] [viewports=1440x900,390x844,844x390] */
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const [root,out,modesArg='on,off',vpArg='1440x900,390x844,844x390']=process.argv.slice(2);
const three=require(path.join(root,'tests/helpers/three-module.cjs'));
const ROOMS=/^(Salón|Comedor|Cocina|Dormitorio principal)\b/;
(async()=>{
 const head=execFileSync('git',['-C',root,'rev-parse','HEAD']).toString().trim(),dirty=execFileSync('git',['-C',root,'status','--porcelain','--','js','index.html']).toString().trim().length>0;
 const server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));res.setHeader('Content-Type',/\.m?js$/.test(f)?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':f.endsWith('.svg')?'image/svg+xml':f.endsWith('.png')?'image/png':f.endsWith('.jpg')?'image/jpeg':f.endsWith('.webp')?'image/webp':f.endsWith('.glb')?'model/gltf-binary':f.endsWith('.hdr')?'application/octet-stream':'text/html');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 await fs.mkdir(out,{recursive:true});const manifest={head,dirty,chromium:browser.version(),entries:[]};
 for(const vp of vpArg.split(',')){const [width,height]=vp.split('x').map(Number);
  for(const mode of modesArg.split(',')){
   const mobile=width<1000,ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});const p=await ctx.newPage();const errors=[];
   p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
   await p.route('**/*',async r=>{const t=r.request().url();if(t.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/'))return r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(t,()=>{throw Error('no local three');})});
    if(t.startsWith(url)||t.startsWith('blob:')||t.startsWith('data:'))return r.continue();return r.abort();});
   p.setDefaultTimeout(240000);await p.goto(url);await p.locator('#welcomeExample').click();await p.waitForTimeout(800);
   await p.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await p.locator('#presentationConfig[open]').waitFor();
   const rows=p.locator('.presentation-room-row');const n=await rows.count();
   for(let i=0;i<n;i++){const row=rows.nth(i),text=(await row.textContent()).trim(),box=row.locator('input[type=checkbox]');if(await box.count()===0)continue;const want=ROOMS.test(text.replace(/^\d+\s*/,''));if((await box.isChecked())!==want)await box.setChecked(want);}
   if(mode==='on')await p.locator('#presentationLivingDrawing').check();
   const s=p.getByRole('button',{name:'Iniciar presentación'});await s.scrollIntoViewIfNeeded();await s.click();
   const settled=()=>p.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:240000});
   await settled();await p.waitForTimeout(1500);
   const stops=await p.evaluate(()=>FloorPlanPresentation.plan.stops.map(s=>({kind:s.kind,roomId:s.roomId||null,name:s.name||s.title||null})));
   for(let i=0;i<stops.length;i++){
    if(i>0){await p.locator('.presentation-stops button').nth(i).click();await p.waitForFunction(i=>document.querySelector('.presentation-status').textContent.includes('Vista '+(i+1))&&document.querySelector('#presentationOverlay').dataset.moving==='false',i,{timeout:240000});await p.waitForTimeout(1500);}
    const label=(stops[i].roomId||'overview').replace(/^rom_/,''),file=`${vp}-${mode}-${String(i).padStart(2,'0')}-${label}.png`;
    await p.screenshot({path:path.join(out,file)});
    const infoNow=await p.evaluate(()=>View3D.presentationLivingDrawingInfo);
    manifest.entries.push({viewport:vp,mode,stop:i,kind:stops[i].kind,roomId:stops[i].roomId,file,drawing:infoNow});
    console.log(file,JSON.stringify(infoNow));
   }
   await p.locator('#presentationClose').click();await p.waitForFunction(()=>!FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').hidden,null,{timeout:120000});
   manifest.entries.push({viewport:vp,mode,closed:true,drawingAfterClose:await p.evaluate(()=>View3D.presentationLivingDrawingInfo),errors});
   await ctx.close();
  }}
 await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,1));
 await browser.close();await new Promise(r=>server.close(r));
})().catch(e=>{console.error(e);process.exit(1);});
