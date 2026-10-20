/* 3D setting comparison (premium UX cut B): the example home in each setting (studio, soft garden, city), by day and
   by night, at the same camera; frame time over 2 s per case; and the exported 3D PNG («Archivo → Exportar imagen»)
   with its top-left pixel, to check that the delivered image uses the same backdrop as the editor. Records the WebGL
   renderer string so software rendering (SwiftShader) is never mistaken for GPU evidence.
   Usage: node scripts/qa/ux/environment.cjs <checkout> <outdir> [1440x900 390x844] */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [rootArg,outArg,...vpArgs]=process.argv.slice(2),root=path.resolve(rootArg),out=path.resolve(outArg);
const VPS=(vpArgs.length?vpArgs:['1440x900','390x844']).map(s=>s.split('x').map(Number));
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary'};
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(file)]||'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}}).listen(0);
 const url=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({executablePath:process.env.CHROME||undefined});
 const report={commit:(await require('node:util').promisify(require('node:child_process').execFile)('git',['-C',root,'rev-parse','HEAD'])).stdout.trim(),browser:browser.version(),cases:[]};
 for(const [w,h] of VPS){
  const narrow=w<=1100,name=`${w}x${h}`,ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:narrow,hasTouch:narrow,acceptDownloads:true}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
  await page.route('https://cdn.jsdelivr.net/**',async r=>{try{await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await require(path.join(root,'tests/helpers/three-module.cjs'))(r.request().url(),()=>Promise.reject(Error('no cdn')))});}catch{await r.abort();}});
  await page.goto(url);await require(path.join(root,'tests/editor-fixture.cjs'))(page);
  await page.evaluate(()=>setView('3d'));await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'),null,{timeout:90000});await page.waitForTimeout(2000);
  report.renderer=report.renderer||await page.evaluate(()=>{const c=document.querySelector('#view3d canvas'),g=c?.getContext('webgl2')||c?.getContext('webgl');const d=g?.getExtension('WEBGL_debug_renderer_info');return d?g.getParameter(d.UNMASKED_RENDERER_WEBGL):'unknown';});
  for(const env of ['studio','garden','city'])for(const night of [false,true]){
   await page.evaluate(([env,night])=>{View3D.setEnvironment3D(env);const b=document.querySelector('header [data-t="night"]');if(b.classList.contains('on')!==night)b.click();},[env,night]);await page.waitForTimeout(1200);
   const id=`${env}-${night?'night':'day'}`;await page.screenshot({path:path.join(out,`${name}-${id}.png`)});
   const frame=await page.evaluate(()=>new Promise(res=>{let n=0;const t0=performance.now();const step=()=>{n++;if(performance.now()-t0<2000)requestAnimationFrame(step);else res({frames:n,msPerFrame:+((performance.now()-t0)/n).toFixed(1)});};requestAnimationFrame(step);}));
   let exported=null;
   if(!narrow||env==='garden'){const dl=page.waitForEvent('download',{timeout:30000});await page.evaluate(()=>{const d=document.querySelector('header details.menu');d.open=true;document.querySelector('#exportPng').click();});const file=path.join(out,`${name}-${id}-export.png`);await (await dl).saveAs(file);
    exported=await page.evaluate(async b64=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);const p=x.getImageData(2,2,1,1).data;return {width:img.width,height:img.height,topLeft:[p[0],p[1],p[2]]};},(await fs.readFile(file)).toString('base64'));}
   report.cases.push({viewport:name,env,night,environment:await page.evaluate(()=>View3D.environment3D),...frame,exported});
  }
  report.cases.push({viewport:name,id:'errors',errors});await ctx.close();
 }
 await fs.writeFile(path.join(out,'environment.json'),JSON.stringify(report,null,1));
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1);});
