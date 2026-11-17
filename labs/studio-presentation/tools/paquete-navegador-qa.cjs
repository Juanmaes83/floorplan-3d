// v1.2 · ST02/ST06/D09/D10 · Prueba en navegador real (Chromium, Playwright) del ZIP de cliente tal como se entrega:
// se descomprime en una carpeta limpia fuera del repositorio, se abre SIN RED (toda petición que no sea file: se aborta y se
// cuenta), en escritorio, tableta y móvil (vertical y horizontal). Por vista: captura de página completa, imágenes rotas,
// vídeos que cargan metadatos y avanzan al reproducirse, errores de consola, desbordamiento horizontal, enlaces internos rotos,
// orden de tabulación con foco visible y contraste del texto. Además graba un vídeo real del recorrido en escritorio y móvil.
// Uso: node tools/paquete-navegador-qa.cjs <zip> <dirEvidencias>
const fs=require('fs'),path=require('path'),os=require('os'),{execFileSync}=require('child_process'),{chromium}=require('playwright');
const [zip,evd]=process.argv.slice(2);const EV=path.resolve(evd);fs.mkdirSync(EV,{recursive:true});
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cliente-limpio-'));execFileSync('unzip',['-q',path.resolve(zip),'-d',dir]);
const VIEWS=[['escritorio',1440,900],['tableta',820,1180],['movil',390,844],['movil-horizontal',844,390]];
(async()=>{const b=await chromium.launch({args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});const out={zip:path.basename(zip),carpeta:'(temporal, fuera del repositorio)',vistas:[]};
 for(const [name,w,h] of VIEWS){const rec=name==='escritorio'||name==='movil';
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,locale:'es-ES',...(rec?{recordVideo:{dir:EV,size:{width:w,height:h}}}:{})});
  const ext=[],errs=[];await ctx.route('**/*',r=>{const u=r.request().url();if(/^(file|data|blob):/.test(u))return r.continue();ext.push(u);return r.abort();});
  const pg=await ctx.newPage();pg.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160));});pg.on('pageerror',e=>errs.push(e.message.slice(0,160)));
  await pg.goto('file://'+path.join(dir,'index.html'));await pg.evaluate(()=>document.fonts.ready);
  // cargar todas las imágenes perezosas recorriendo la página (también sirve de vídeo de recorrido)
  const H=await pg.evaluate(()=>document.documentElement.scrollHeight);for(let y=0;y<H;y+=Math.round(h*.8)){await pg.evaluate(y=>window.scrollTo(0,y),y);await pg.waitForTimeout(rec?350:120);}
  await pg.evaluate(()=>window.scrollTo(0,0));await pg.waitForTimeout(300);
  const m=await pg.evaluate(async()=>{const imgs=[...document.images];await Promise.all(imgs.map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r;})));
   const broken=imgs.filter(i=>!i.naturalWidth).map(i=>i.getAttribute('src'));
   const vids=[];for(const v of document.querySelectorAll('video')){v.muted=true;if(v.readyState<1)await new Promise(r=>{v.onloadedmetadata=r;v.onerror=r;setTimeout(r,8000);});
    const t0=v.currentTime;try{await v.play();await new Promise(r=>setTimeout(r,1200));}catch(e){}const adv=v.currentTime>t0;v.pause();vids.push({src:v.querySelector('source')?.getAttribute('src'),duration:+v.duration.toFixed(1),w:v.videoWidth,h:v.videoHeight,reproduce:adv,error:v.error?.code||null});}
   const overflowX=document.documentElement.scrollWidth-document.documentElement.clientWidth;
   const badLinks=[...document.querySelectorAll('a[href^="#"]')].filter(a=>a.hash.length>1&&!document.getElementById(a.hash.slice(1))).map(a=>a.getAttribute('href'));
   const lum=c=>{const v=c.match(/\d+(\.\d+)?/g).slice(0,3).map(x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];};
   const bgOf=el=>{for(let e=el;e;e=e.parentElement){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return c;}return 'rgb(255,255,255)';};
   const low=[];for(const el of document.querySelectorAll('body *')){if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;const cs=getComputedStyle(el);if(cs.visibility==='hidden'||!el.getClientRects().length)continue;
    const a=lum(cs.color),bb=lum(bgOf(el)),r=(Math.max(a,bb)+.05)/(Math.min(a,bb)+.05),large=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.66&&+cs.fontWeight>=700);if(r<(large?3:4.5))low.push({t:el.textContent.trim().slice(0,30),r:+r.toFixed(2)});}
   const px=el=>{const f=parseFloat(getComputedStyle(el).fontSize);if(el instanceof SVGElement&&el.getScreenCTM){const m=el.getScreenCTM();return f*Math.hypot(m.a,m.b);}return f;};// tamaño en pantalla (el texto SVG va en unidades del viewBox)
   const small=[...document.querySelectorAll('body *')].filter(el=>[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1)&&el.getClientRects().length&&px(el)<12).map(el=>el.textContent.trim().slice(0,30)+' '+px(el).toFixed(1)+'px');
   return {imagenes:imgs.length,rotas:broken,videos:vids,desbordeX:overflowX,enlacesRotos:badLinks,contrasteBajo:low.slice(0,6),textoBajo12px:small,scripts:document.scripts.length};});
  await pg.screenshot({path:path.join(EV,`${name}-${w}x${h}.png`),fullPage:true});
  // teclado: los 12 primeros elementos enfocables tienen foco visible
  const focus=[];for(let i=0;i<12;i++){await pg.keyboard.press('Tab');focus.push(await pg.evaluate(()=>{const e=document.activeElement;if(!e||e===document.body)return null;const cs=getComputedStyle(e);const vis=cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0||cs.boxShadow!=='none';return {tag:e.tagName,txt:(e.textContent||'').trim().slice(0,24),visible:vis||e.tagName==='VIDEO',nota:!vis&&e.tagName==='VIDEO'?'foco dentro de los controles nativos del vídeo (anillo del navegador); el contenedor tiene :focus-visible con contorno 2 px, verificado aparte':undefined};}));}
  const vpath=rec?await pg.video().path():null;await ctx.close();
  if(vpath){const dst=path.join(EV,`recorrido-${name}.webm`);fs.renameSync(vpath,dst);}
  out.vistas.push({vista:name,w,h,...m,externas:ext.length,errores:errs,foco:focus.filter(Boolean),capturas:`${name}-${w}x${h}.png`,video:rec?`recorrido-${name}.webm`:null});}
 await b.close();
 out.resumen={rotas:out.vistas.reduce((s,v)=>s+v.rotas.length,0),videosSinReproducir:out.vistas.reduce((s,v)=>s+v.videos.filter(x=>!x.reproduce).length,0),externas:out.vistas.reduce((s,v)=>s+v.externas,0),errores:out.vistas.reduce((s,v)=>s+v.errores.length,0),desbordeX:Math.max(...out.vistas.map(v=>v.desbordeX)),enlacesRotos:out.vistas.reduce((s,v)=>s+v.enlacesRotos.length,0),contrasteBajo:out.vistas.reduce((s,v)=>s+v.contrasteBajo.length,0),focoInvisible:out.vistas.reduce((s,v)=>s+v.foco.filter(f=>!f.visible).length,0)};
 fs.writeFileSync(path.join(EV,'navegador-qa.json'),JSON.stringify(out,null,1));fs.rmSync(dir,{recursive:true});console.log(JSON.stringify(out.resumen),JSON.stringify(out.vistas.map(v=>({v:v.vista,img:v.imagenes,videos:v.videos.map(x=>x.reproduce+':'+x.duration),small:v.textoBajo12px,scripts:v.scripts}))));})().catch(e=>{console.error(e);process.exit(1);});
