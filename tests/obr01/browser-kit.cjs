'use strict';
/* OBR-01 · kit de navegador común: servidor estático local del repositorio, Chromium (SwiftShader) y la Evolución real
   abierta con la obra sintética de obra-fixture.cjs. Cualquier petición fuera del servidor local se registra (no debe haber). */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const FX=require('./obra-fixture.cjs');
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary','.wasm':'application/wasm','.hdr':'application/octet-stream'};
// OBR01_ROOT permite ejecutar las MISMAS pruebas sobre otro árbol (p. ej. master) para el antes/después.
const ROOT=process.env.OBR01_ROOT?path.resolve(process.env.OBR01_ROOT):path.resolve(__dirname,'..','..');
const ARGS=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
async function start(){
  const server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://local').pathname;if(p.endsWith('/'))p+='index.html';
    const file=path.resolve(ROOT,'.'+decodeURIComponent(p));if(!file.startsWith(ROOT+path.sep))throw Error('path');
    res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
  const browser=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:ARGS});
  return {base,browser,stop:async()=>{await browser.close();await new Promise(r=>server.close(r));}};
}
function watch(page,base){const w={errors:[],external:[]};
  page.on('pageerror',e=>w.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/^Failed to load resource/.test(m.text()))w.errors.push(m.text());});
  page.on('request',r=>{const u=r.url();if(!u.startsWith(base)&&!/^(data|blob):/.test(u))w.external.push(u);});return w;}
/* Abre la Evolución con la obra sintética, en la pestaña «Evolución». */
async function openEvolution(env,{viewport={width:1440,height:900},reducedMotion='no-preference',fixture={},isMobile=false,hasTouch=false,deviceScaleFactor=1,init=null}={}){
  const o=await FX.build(fixture);
  const context=await env.browser.newContext({viewport,reducedMotion,isMobile,hasTouch,deviceScaleFactor});const page=await context.newPage();
  page.setDefaultTimeout(60000);const w=watch(page,env.base);
  // init: script opcional que se instala ANTES que los de la página (p. ej. instrumentar listeners).
  if(init)await page.addInitScript(init);
  await page.addInitScript(st=>{if(window.top!==window||sessionStorage.getItem('obr01-seeded'))return;localStorage.clear();for(const [k,v] of Object.entries(st))localStorage.setItem(k,v);sessionStorage.setItem('obr01-seeded','1');},o.storage);
  const t0=Date.now();await page.goto(env.base+o.url);
  await page.waitForFunction(()=>window.__ft3dFidelity?.ctx&&document.body.classList.contains('ready'),null,{timeout:180000});
  const loadMs=Date.now()-t0;
  await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Ver evolución/.test(x.textContent));b?.click();});
  await page.waitForFunction(()=>{const c=document.getElementById('stage');return c&&c.getBoundingClientRect().width>0;});
  return {context,page,watch:w,fixture:o,loadMs};
}
module.exports={ROOT,start,openEvolution,watch,FX};
