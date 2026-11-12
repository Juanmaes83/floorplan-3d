'use strict';
/* GOV-07 · diagnóstico del motor (CI, Firefox/WebKit): ¿qué hace caer o deja sin WebGL a este motor? No es una prueba
   (siempre sale con 0): imprime una línea por paso para separar causas. Pasos:
     1 webgl-minimo  página en blanco: ¿hay WebGL?, renderizador, un clear + readPixels
     2 evol-sin-gl   la Evolución con WebGL bloqueado antes de cargar (getContext('webgl*') → null)
     3 evol          la Evolución tal cual
   GOV07_ROOT=<árbol> repite los pasos sobre otro árbol (p. ej. la base del PR) para saber si el fallo es previo.
   GOV07_HEADFUL=1 lanza el motor con ventana (bajo xvfb-run en CI). */
const K=require('./kit.cjs');
const BLOCK_GL=`(()=>{for(const C of [self.HTMLCanvasElement,self.OffscreenCanvas].filter(Boolean)){const g=C.prototype.getContext;
  C.prototype.getContext=function(t,...a){return /webgl/i.test(String(t))?null:g.call(this,t,...a);};}})();`;
// GOV07_STEPS=3,7 ejecuta solo esos pasos (p. ej. con DEBUG=pw:browser para ver la salida del proceso del motor al caer).
const ONLY=process.env.GOV07_STEPS?new Set(process.env.GOV07_STEPS.split(',')):null;
async function step(env,name,url,{init=null,ready=null,block=null}={}){
  if(ONLY&&!ONLY.has(name.split(' ')[0]))return;
  const context=await env.browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();
  if(block)await context.route(u=>block.test(u.pathname),r=>r.abort());
  let crashed=false;page.on('crash',()=>{crashed=true;});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  if(init)await page.addInitScript(init);const t0=Date.now();let out;
  try{await page.goto(url,{timeout:60000});
    if(ready)await page.waitForFunction(ready,null,{timeout:60000});
    out=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=4;const gl=c.getContext('webgl2')||c.getContext('webgl');
      if(!gl)return {webgl:false};const ext=gl.getExtension('WEBGL_debug_renderer_info');
      gl.clearColor(1,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);const px=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
      return {webgl:true,version:gl.getParameter(gl.VERSION),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),
        loseExt:!!gl.getExtension('WEBGL_lose_context'),clearOk:px[0]===255&&px[3]===255,guard:window.__ft3dGlGuard?.state??null};});
    out.ok=true;
  }catch(e){out={ok:false,error:String(e.message).split('\n')[0]};}
  out.crashed=crashed;out.ms=Date.now()-t0;out.errors=errors.slice(0,5);
  console.log(`# probe ${K.BROWSER} ${process.env.GOV07_HEADFUL?'headful':'headless'} ${name}: ${JSON.stringify(out)}`);
  await context.close().catch(()=>{});
}
(async()=>{
  const env=await K.start();
  try{
    console.log(`# probe ${K.BROWSER} ${env.browser.version()} · árbol ${K.ROOT}`);
    const evol=`${env.base}evolucion/index.html?lab=1&case=A`,ready=()=>document.body.classList.contains('ready');
    await step(env,'1 webgl-minimo','about:blank');
    await step(env,'2 evol-sin-gl',evol,{init:BLOCK_GL,ready});
    await step(env,'3 evol',evol,{ready});
    // GOV07_BISECT=1: la Evolución cae también con WebGL bloqueado (WebKit en CI, rama y base): ¿qué parte de la página?
    // Se quita una cosa cada vez; «ok» señala a la culpable. Sin ella la página no llega a «ready» si es fidelity-app.
    if(process.env.GOV07_BISECT){
      const MEDIA=`(()=>{for(const k of ['MediaRecorder','VideoEncoder','VideoDecoder','AudioEncoder','ImageDecoder'])try{delete self[k];self[k]=undefined;}catch{}
        try{HTMLCanvasElement.prototype.captureStream=undefined;}catch{}})();`;
      const domReady=()=>document.readyState==='complete';
      await step(env,'4 sin-apis-de-video',evol,{init:MEDIA,ready});
      for(const m of ['delivery-ui','dossier-ui','ux-shell','fidelity-app'])await step(env,`5 sin-${m}`,evol,{block:new RegExp(`/evolucion/${m}\\.js$`),ready:domReady});
      for(const m of ['tour-recorder','construction-mp4-muxer','construction-delivery-core','construction-dossier-core','construction-record-core','brand-core'])
        await step(env,`6 sin-${m}`,evol,{block:new RegExp(`/js/${m}\\.js$`),ready:domReady});
      await step(env,'7 solo-estatico',evol,{block:/\.m?js$/,ready:domReady});
      // ¿Cae con cualquier página de este servidor? Una ruta inexistente (404 vacío) y el editor sin JavaScript.
      await step(env,'8 servidor-404',`${env.base}no-existe.html`,{ready:domReady});
      await step(env,'9 editor-solo-estatico',`${env.base}index.html`,{block:/\.m?js$/,ready:domReady});
    }
  }catch(e){console.log(`# probe ${K.BROWSER} error ${e.message}`);}
  finally{await env.stop().catch(()=>{});}
})();
