'use strict';
/* UX-07 + ENT-04 · kit de navegador: servidor estático local del repositorio y Chromium. Abre el laboratorio aislado
   (labs/ux07-ent04/). Cualquier petición fuera del servidor local se registra (no debe haber ninguna). */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const ROOT=process.env.UX07_ROOT?path.resolve(process.env.UX07_ROOT):path.resolve(__dirname,'..','..');
async function start(){
  const server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://local').pathname;if(p.endsWith('/'))p+='index.html';
    const file=path.resolve(ROOT,'.'+decodeURIComponent(p));if(!file.startsWith(ROOT+path.sep))throw Error('path');
    res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
  const browser=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:['--no-sandbox']});
  return {base,browser,stop:async()=>{await browser.close();await new Promise(r=>server.close(r));}};
}
function watch(page,base){const w={errors:[],external:[]};
  page.on('pageerror',e=>w.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/^Failed to load resource/.test(m.text()))w.errors.push(m.text());});
  page.on('request',r=>{const u=r.url();if(!u.startsWith(base)&&!/^(data|blob|about):/.test(u))w.external.push(u);});return w;}
async function openLab(env,{viewport={width:1440,height:900},isMobile=false,hasTouch=false,deviceScaleFactor=1,storage=null}={}){
  const context=await env.browser.newContext({viewport,isMobile,hasTouch,deviceScaleFactor,acceptDownloads:true});const page=await context.newPage();
  page.setDefaultTimeout(30000);const w=watch(page,env.base);
  if(storage)await page.addInitScript(st=>{if(window.top!==window||sessionStorage.getItem('ux07-seeded'))return;localStorage.clear();for(const [k,v] of Object.entries(st))localStorage.setItem(k,v);sessionStorage.setItem('ux07-seeded','1');},storage);
  await page.goto(env.base+'labs/ux07-ent04/index.html');await page.waitForFunction(()=>!!window.__ux07);
  return {context,page,watch:w};
}
module.exports={ROOT,start,watch,openLab};
