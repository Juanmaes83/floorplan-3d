// Before the GPU regression: prints the WebGL renderer the browser tests will get and the 3D frame time of the
// example project. If the renderer contains "SwiftShader", the run is software rendering and not representative.
// Usage (repo root): CHROME=<path to chrome or chromium> node scripts/qa/presentation/gpu-check.cjs
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..','..','..'),types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
(async()=>{
 const server=http.createServer((q,r)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(q.url,'http://l').pathname.replace(/^\/$/,'/index.html')));if(!p.startsWith(root+path.sep))throw Error();r.setHeader('Content-Type',types[path.extname(p)]||'text/html');r.end(fs.readFileSync(p));}catch{r.writeHead(404);r.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 // Same launch arguments as the browser suites, so the result describes what they will see.
 const browser=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{const page=await browser.newPage({viewport:{width:1440,height:900}});
  // Optional local three@0.160.0 copy, as the suites use with THREE_LOCAL_DIR when the CDN is unreachable.
  if(process.env.THREE_LOCAL_DIR)await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async x=>{const rel=new URL(x.request().url()).pathname.replace('/npm/three@0.160.0/','');await x.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(path.join(process.env.THREE_LOCAL_DIR,rel))});});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>window.View3D&&window.FloorPlanApp,null,{timeout:90000});
  if(await page.locator('#welcomeExample').isVisible().catch(()=>false))await page.locator('#welcomeExample').click();
  await page.evaluate(()=>setView('3d'));await page.waitForTimeout(3000);
  const r=await page.evaluate(async()=>{const c=document.createElement('canvas').getContext('webgl'),d=c&&c.getExtension('WEBGL_debug_renderer_info'),renderer=d?c.getParameter(d.UNMASKED_RENDERER_WEBGL):'unknown';
   const s=[];let p=performance.now();for(let i=0;i<30;i++){await new Promise(requestAnimationFrame);const n=performance.now();s.push(n-p);p=n;}s.sort((a,b)=>a-b);return {renderer,medianFrameMs:+s[15].toFixed(1)};});
  const software=/swiftshader|llvmpipe|software/i.test(r.renderer);
  console.log(JSON.stringify({...r,browser:browser.version(),representative:!software&&r.medianFrameMs<50},null,1));
  if(software)console.log('Software renderer: this run would repeat the container limitation; fix the GPU setup first.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
