// R10 QA harness: static server for the repo + Playwright page. three@0.160.0 comes from THREE_LOCAL_DIR (an
// unpacked `npm pack three@0.160.0`) when set, otherwise from the CDN. Requires `playwright` on NODE_PATH.
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(process.env.REPO||path.join(__dirname,'..','..','..'));
const THREE=process.env.THREE_LOCAL_DIR||null;
const types={'.hdr':'application/octet-stream','.js':'text/javascript','.mjs':'text/javascript','.webp':'image/webp','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.ktx2':'application/octet-stream','.html':'text/html','.css':'text/css','.svg':'image/svg+xml'};
async function start({headless=true}={}){
 const server=createServer(async(req,res)=>{try{const file=path.resolve(ROOT,'.'+(req.url==='/'?'/index.html':decodeURIComponent(new URL(req.url,'http://l').pathname)));if(!file.startsWith(ROOT+path.sep))throw Error('path');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 return {url,browser,close:async()=>{await browser.close();await new Promise(r=>server.close(r));}};
}
async function page(env,viewport,{video,reducedMotion}={}){
 const context=await env.browser.newContext({viewport,isMobile:viewport.width<1000,hasTouch:viewport.width<1000,reducedMotion,...(video?{recordVideo:{dir:video,size:viewport}}:{})});
 const p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 if(THREE)await p.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async route=>{const rel=new URL(route.request().url()).pathname.replace('/npm/three@0.160.0/','');await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await fs.readFile(path.join(THREE,rel))});});
 await p.goto(env.url);
 await p.waitForFunction(()=>window.View3D?.presentationRoute&&window.FloorPlanPresentation&&window.FloorPlanSurfaces?.entries.length===50,null,{timeout:30000});
 if(await p.locator('#welcomeDialog').evaluate(d=>d.open))await p.locator('#welcomeActionInput').press('Escape');
 await p.evaluate(()=>document.querySelector('#guideDetails').click());await p.evaluate(()=>document.querySelector('#guideAllTools').click());
 await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 return {page:p,context,errors};
}
// Start a presentation with exactly the given room names (in order).
async function present(p,names){
 await p.locator('#presentationBtn').click();
 await p.evaluate(names=>{const map=new Map(FloorPlanApp.geometry.rooms.map(r=>[r.id,r.name]));
  document.querySelectorAll('#presentationConfig input[type=checkbox]').forEach(i=>{const want=names.includes(map.get(i.value))||names.includes(i.parentElement.textContent.trim());if(i.checked!==want){i.checked=want;i.dispatchEvent(new Event('change'));}});},names);
 await p.getByRole('button',{name:'Iniciar presentación'}).click();
 await p.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:30000});
}
async function goStop(p,label){
 await p.locator('.presentation-stops button',{hasText:label}).first().click();
 await p.waitForFunction(l=>document.querySelector('#presentationOverlay').dataset.moving==='false'&&document.querySelector('.presentation-card h2').textContent.includes(l),label,{timeout:30000});
 await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
}
module.exports={start,page,present,goStop};
