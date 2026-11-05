/* HV2 prototype harness — NOT product code. Serves RUBIK master (read-only checkout) and injects, in memory only,
   one read hook before `window.View3D = {` so the prototype can reach the existing scene/camera/renderer.
   Nothing in the RUBIK checkout is modified. */
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http');
const {chromium}=require('playwright');
const root=process.env.RUBIK_ROOT||'/home/user/fp-ssv-base';
const three=require(path.join(root,'tests/helpers/three-module.cjs'));
const HOOK='window.__hv2=()=>({THREE,scene,camera,renderer,furnG,archUp,archFloor,levelsG,roofG,exteriorG,ground,lampG,labelG,revealG,contactG,sun,hemi,OX,OY,H,wx,wz,glassMat,wallMat,capMat,frameMat});\n';
async function start(){
 const server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://l').pathname;
   if(u.startsWith('/__poc/')){const f=path.resolve(__dirname,'.'+u.slice(6));res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':'application/octet-stream');return res.end(await fs.readFile(f));}
   const f=path.resolve(root,'.'+(u==='/'?'/index.html':u));let body=await fs.readFile(f);
   if(u==='/'||u==='/index.html'){const s=body.toString();const i=s.indexOf('window.View3D = {');if(i<0)throw Error('hook point missing');body=s.slice(0,i)+HOOK+s.slice(i);}
   res.setHeader('Content-Type',/\.m?js$/.test(f)?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':f.endsWith('.svg')?'image/svg+xml':f.endsWith('.png')?'image/png':f.endsWith('.webp')?'image/webp':f.endsWith('.jpg')?'image/jpeg':f.endsWith('.glb')?'model/gltf-binary':f.endsWith('.hdr')?'application/octet-stream':'text/html');res.end(body);}catch(e){res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 return {url,browser,close:async()=>{await browser.close();await new Promise(r=>server.close(r));}};
}
async function openExample(browser,url,{width=1280,height=720}={}){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text());});
 await p.route('**/*',async r=>{const t=r.request().url();if(t.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/'))return r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(t,()=>{throw Error('no local three');})});
  if(t.startsWith(url)||t.startsWith('blob:')||t.startsWith('data:'))return r.continue();return r.abort();});
 p.setDefaultTimeout(240000);await p.goto(url);await p.locator('#welcomeExample').click();await p.waitForTimeout(800);
 await p.locator('[data-view="3d"]').click();
 await p.waitForFunction(()=>window.View3D?.cameraState&&!View3D.lifecycleMetrics.animating&&!View3D.lifecycleMetrics.flying&&window.__hv2,null,{timeout:240000});
 await p.waitForTimeout(1500);return {ctx,p,errors};
}
module.exports={start,openExample};
