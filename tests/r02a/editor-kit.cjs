'use strict';
/* R02-A · utilidades de navegador para el editor real (servidor estático local, Chromium de Playwright). */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..','..');
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.wasm':'application/wasm'};
async function start(){
  const server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://local').pathname;if(p.endsWith('/'))p+='index.html';
    const file=path.resolve(ROOT,'.'+decodeURIComponent(p));if(!file.startsWith(ROOT+path.sep))throw Error('path');
    res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  return {base:`http://127.0.0.1:${server.address().port}/`,browser,async stop(){await browser.close();await new Promise(r=>server.close(r));}};
}
function watch(page,base){const w={errors:[],external:[]};page.on('pageerror',e=>w.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))w.errors.push(m.text());});
  page.on('request',r=>{const u=r.url();if(!u.startsWith(base)&&!/^(data|blob):/.test(u))w.external.push(u);});return w;}
async function editor(env,opts={}){
  const context=await env.browser.newContext({viewport:{width:1440,height:900},...opts}),page=await context.newPage(),w=watch(page,env.base);
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto(env.base);await require('../editor-fixture.cjs')(page);await page.waitForFunction(()=>!!window.RubikCeilingEditor&&!!window.FloorPlanApp?.applyCeiling);
  return {context,page,watch:w};
}
// Selecciona una estancia tocando un punto de su polígono que no tape ningún mueble ni muro.
async function selectRoom(page,roomId,{touch=false}={}){
  const pt=await page.evaluate(id=>{const poly=document.querySelector(`#gRooms polygon[data-room="${id}"]`),r=poly.getBoundingClientRect();
    // El punto libre MÁS CENTRADO: con el dedo, un punto en una esquina selecciona la puerta o el muro de al lado.
    const cx=r.left+r.width/2,cy=r.top+r.height/2;let best=null;
    for(let i=1;i<20;i++)for(let j=1;j<20;j++){const x=r.left+r.width*i/20,y=r.top+r.height*j/20,e=document.elementFromPoint(x,y);if(e===poly){const d=Math.hypot(x-cx,y-cy);if(!best||d<best.d)best={x,y,d};}}return best;},roomId);
  if(!pt)throw Error('estancia no alcanzable '+roomId);
  if(touch)await page.touchscreen.tap(pt.x,pt.y);else await page.mouse.click(pt.x,pt.y);
  await page.waitForSelector(`section.r02a-ceiling[data-room-id="${roomId}"]`,{state:'attached'});
}
async function openSection(page){
  const open=await page.evaluate(()=>document.querySelector('section.r02a-ceiling details').open);
  if(!open){const s=page.locator('section.r02a-ceiling summary');await s.scrollIntoViewIfNeeded();await s.click();}
}
// Reabrir el editor (misma biblioteca local): la guía ya se cerró antes, así que solo se entra si vuelve a aparecer.
async function reopen(page){
  await page.reload();await page.waitForFunction(()=>!!window.RubikCeilingEditor&&!!window.FloorPlanApp?.applyCeiling);
  if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false))await page.locator('#welcomeActionInput').press('Escape');
  if(await page.locator('#guideDetails').isVisible().catch(()=>false))await require('../editor-fixture.cjs')(page);
}
const ext=page=>page.evaluate(()=>structuredClone(window.FloorPlanApp.project.extensions?.['x-r02a-ceiling']??null));
module.exports={start,editor,selectRoom,openSection,reopen,ext,ROOT};
