'use strict';
/* GOV-07 · kit de navegador: servidor estático local del repositorio y Chromium (SwiftShader: CPU, sin GPU real).
   Abre la Evolución real con las fixtures sintéticas de laboratorio (?lab=1&case=A..D). Cualquier petición fuera del
   servidor local se registra. GOV07_ROOT ejecuta las MISMAS pruebas sobre otro árbol (antes/después). */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),playwright=require('playwright');
// GOV07_BROWSER=firefox|webkit ejecuta las pruebas entre navegadores (en CI; aquí no hay esos motores). Por defecto, Chromium.
const BROWSER=process.env.GOV07_BROWSER||'chromium';
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary','.wasm':'application/wasm','.hdr':'application/octet-stream'};
const ROOT=process.env.GOV07_ROOT?path.resolve(process.env.GOV07_ROOT):path.resolve(__dirname,'..','..');
const ARGS=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
async function start(){
  const server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://local').pathname;if(p.endsWith('/'))p+='index.html';
    const file=path.resolve(ROOT,'.'+decodeURIComponent(p));if(!file.startsWith(ROOT+path.sep))throw Error('path');
    res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
  // GOV07_HEADFUL=1: motor con ventana (en CI, bajo xvfb-run). Firefox sin ventana no da WebGL en el runner (ni forzando
  // webgl.force-enabled); con ventana da WebGL 2 por software (llvmpipe). Medido con tests/gov07/engine-probe.cjs.
  const browser=BROWSER==='chromium'?await playwright.chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:ARGS}):await playwright[BROWSER].launch({headless:!process.env.GOV07_HEADFUL});
  return {base,browser,stop:async()=>{await browser.close();await new Promise(r=>server.close(r));}};
}
function watch(page,base){const w={errors:[],external:[]};
  page.on('pageerror',e=>w.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/^Failed to load resource/.test(m.text()))w.errors.push(m.text());});
  page.on('request',r=>{const u=r.url();if(!u.startsWith(base)&&!/^(data|blob):/.test(u))w.external.push(u);});return w;}
const NO_VIDEO_APIS=`(()=>{for(const k of ['MediaRecorder','VideoEncoder','VideoDecoder','AudioEncoder','ImageDecoder'])try{delete self[k];self[k]=undefined;}catch{}
  try{HTMLCanvasElement.prototype.captureStream=undefined;}catch{}})();`;
async function openEvolution(env,{viewport={width:1440,height:900},deviceScaleFactor=1,isMobile=false,hasTouch=false,query='',caseId='A'}={}){
  const context=await env.browser.newContext({viewport,deviceScaleFactor,isMobile,hasTouch});
  // GOV07_NO_VIDEO_APIS=1 (solo el WebKit de CI): al cargar, la Evolución pregunta a WebCodecs qué formato de vídeo puede
  // grabar (delivery-ui.js, encoderConfig) y el GStreamer del WebKit de Playwright en Linux aborta el proceso de la página
  // («gst_register_core_elements: code should not be reached»), también en master. Sin esas API la página carga y se
  // prueba lo de GOV-07 (vista 3D, pérdida y recuperación). La caída original sigue a la vista en engine-probe.cjs.
  if(process.env.GOV07_NO_VIDEO_APIS)await context.addInitScript(NO_VIDEO_APIS);
  const page=await context.newPage();
  page.setDefaultTimeout(60000);const w=watch(page,env.base);
  await page.goto(`${env.base}evolucion/index.html?lab=1&case=${caseId}${query?'&'+query:''}`);
  await page.waitForFunction(()=>window.__ft3dFidelity?.ctx&&document.body.classList.contains('ready'),null,{timeout:120000});
  await showEvolution(page);
  return {context,page,watch:w};
}
async function showEvolution(page){
  await page.evaluate(()=>{const b=[...document.querySelectorAll('button,[role=tab]')].find(x=>/Ver evolución/.test(x.textContent))||document.getElementById('tab-evolucion');b?.click();});
  await page.waitForFunction(()=>{const c=document.getElementById('stage');return c&&c.getBoundingClientRect().width>0;});
}
/* Píxeles del lienzo distintos del fondo (0xe7e6e2), por muestreo: > 0 = la escena está dibujada. */
const drawn=page=>page.evaluate(()=>{const c=document.getElementById('stage');if(!c.width||!c.height)return 0;const t=document.createElement('canvas');t.width=c.width;t.height=c.height;const g=t.getContext('2d');g.drawImage(c,0,0);
  const d=g.getImageData(0,0,t.width,t.height).data;let n=0;for(let i=0;i<d.length;i+=4*97){if(Math.abs(d[i]-0xe7)+Math.abs(d[i+1]-0xe6)+Math.abs(d[i+2]-0xe2)>30)n++;}return n;});
const loseContext=page=>page.evaluate(()=>{const c=document.getElementById('stage');const gl=c.getContext('webgl2')||c.getContext('webgl');window.__gov07Ext=gl.getExtension('WEBGL_lose_context');window.__gov07Ext.loseContext();});
const restoreContext=page=>page.evaluate(()=>window.__gov07Ext.restoreContext());
const frames=(page,n=2)=>page.evaluate(n=>new Promise(r=>{let k=0;const f=()=>++k>=n?r():requestAnimationFrame(f);requestAnimationFrame(f);}),n);
module.exports={ROOT,BROWSER,NO_VIDEO_APIS,start,openEvolution,showEvolution,watch,drawn,loseContext,restoreContext,frames};
