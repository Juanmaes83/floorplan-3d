// v1.3 · QA del CONSUMIDOR: lo que recibe el cliente, por modalidad (7) e idioma (es, en). Cada paquete se exporta con el
// exportador real, se verifica su ZIP exacto, se descomprime en una carpeta limpia y se abre SIN RED en Chromium en 5 vistas
// (1440×900, 820×1180, 390×844, 844×390, 320×640). Mide: imágenes rotas, vídeos que reproducen, desborde horizontal, errores,
// peticiones externas, contraste, texto < 12 px, landmarks, títulos, lang, alt, foco visible con teclado y, en inglés, restos de
// español fuera de los datos del proyecto. Además: rendimiento de carga p50/p95 (repeticiones) y prueba de postMessage con un
// emisor ajeno contra la vista previa de «Preparar entrega». Firefox y WebKit no están instalados en este entorno.
// Uso: node tools/consumidor-qa.cjs <dirTrabajo> <dirEvidencias>
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync,execFileSync}=require('child_process');const {chromium}=require('playwright');
const LAB=path.resolve(__dirname,'..');const [workArg,evArg,partesArg='paquetes,rendimiento,postmessage']=process.argv.slice(2);const PARTES=new Set(partesArg.split(','));const W=path.resolve(workArg),EV=path.resolve(evArg);
if(PARTES.has('paquetes'))fs.rmSync(W,{recursive:true,force:true});fs.mkdirSync(W,{recursive:true});fs.mkdirSync(EV,{recursive:true});
const REG=JSON.parse(fs.readFileSync(path.join(LAB,'out/v3/entrega/entrega.json'),'utf8'));
const ACK=JSON.parse(/const ACK=(\[[^\]]*\])/.exec(fs.readFileSync(path.join(__dirname,'exportar-qa.cjs'),'utf8'))[1].replace(/'/g,'"'));
const I18N_JS=fs.readFileSync(path.join(__dirname,'i18n.js'),'utf8').replace(/^\/\/.*$/mg,'').trim().replace(/^function I18N\(/,'function(');
const EN_DICT={exact:require('../i18n/en.exact.cjs'),rules:require('../i18n/en.rules.cjs'),spanishWords:require('../i18n/es-words.cjs')};
const I18N_DATA=JSON.parse(fs.readFileSync(path.join(LAB,'out/v3/i18n-datos.json'),'utf8'));
const VIEWS=[['1440x900',1440,900],['820x1180',820,1180],['390x844',390,844],['844x390',844,390],['320x640',320,640]];
const idiomas=REG.idiomas||['es'];const OUTF=path.join(EV,'consumidor-qa.json');const prevOut=fs.existsSync(OUTF)?JSON.parse(fs.readFileSync(OUTF,'utf8')):{};const save=()=>fs.writeFileSync(OUTF,JSON.stringify(out,null,1));const out={generated:new Date().toISOString(),navegadores:{chromium:'Playwright 1.63 (instalado)',firefox:'no instalado (prohibido instalar navegadores en este entorno): pendiente en dispositivos reales',webkit:'ídem'},paquetes:[],rendimiento:[],postMessage:null};
const pct=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(p/100*s.length))];};
(async()=>{const b=await chromium.launch({args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 if(!PARTES.has('paquetes'))out.paquetes=prevOut.paquetes||[];
 if(PARTES.has('paquetes'))for(const t of REG.tipos)for(const lang of idiomas){const id=`${t.tipo}-${lang}`,sel=path.join(W,id+'.json'),dst=path.join(W,id);
  fs.writeFileSync(sel,JSON.stringify({tipo:t.tipo,modo:'cliente',idioma:lang,reconocidos:ACK,base:{proyecto:REG.project.id,revision:REG.project.revision,snapshotSha256:REG.snapshot.sha256}}));
  const t0=Date.now();const ex=spawnSync('node',[path.join(__dirname,'exportar.cjs'),sel,dst],{encoding:'utf8',maxBuffer:1<<26});const exportMs=Date.now()-t0;
  const P={paquete:id,tipo:t.tipo,idioma:lang,exportado:ex.status===0,exportMs,vistas:[]};out.paquetes.push(P);
  if(ex.status!==0){P.error=(ex.stdout||ex.stderr).slice(-400);console.log(id,'EXPORT FAIL');continue;}
  const vr=spawnSync('node',[path.join(__dirname,'verificar-entrega.cjs'),'--zip',dst+'.zip','--digest',dst+'.digest.json'],{encoding:'utf8'});P.zipValido=vr.status===0&&/"valido": true/.test(vr.stdout);
  const clean=fs.mkdtempSync(path.join(os.tmpdir(),'consumidor-'));execFileSync('unzip',['-q',dst+'.zip','-d',clean]);const root=fs.readdirSync(clean).length===1&&fs.statSync(path.join(clean,fs.readdirSync(clean)[0])).isDirectory()?path.join(clean,fs.readdirSync(clean)[0]):clean;
  P.archivos=execFileSync('find',[root,'-type','f']).toString().trim().split('\n').length;P.leeme=fs.existsSync(path.join(root,lang==='en'?'README.txt':'LEEME.txt'));
  for(const [vn,w,h] of VIEWS){const shoot=t.tipo==='integral'||vn==='390x844',rec=t.tipo==='integral'&&(vn==='1440x900'||vn==='320x640');
   const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,locale:lang==='en'?'en-GB':'es-ES',isMobile:w<700,hasTouch:w<900,...(rec?{recordVideo:{dir:EV,size:{width:w,height:h}}}:{})});
   const ext=[],errs=[];await ctx.route('**/*',r=>{const u=r.request().url();if(/^(file|data|blob):/.test(u))return r.continue();ext.push(u);return r.abort();});
   const pg=await ctx.newPage();pg.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160));});pg.on('pageerror',e=>errs.push(e.message.slice(0,160)));
   await pg.goto('file://'+path.join(root,'index.html'));await pg.evaluate(()=>document.fonts.ready);
   const H=await pg.evaluate(()=>document.documentElement.scrollHeight);for(let y=0;y<H;y+=Math.round(h*.8)){await pg.evaluate(y=>window.scrollTo(0,y),y);await pg.waitForTimeout(rec?300:60);}await pg.evaluate(()=>window.scrollTo(0,0));
   const m=await pg.evaluate(async lang=>{const imgs=[...document.images];await Promise.all(imgs.map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r;})));
    const vids=[];for(const v of document.querySelectorAll('video')){v.muted=true;if(v.readyState<1)await new Promise(r=>{v.onloadedmetadata=r;v.onerror=r;setTimeout(r,8000);});const t0=v.currentTime;try{await v.play();await new Promise(r=>setTimeout(r,1000));}catch(e){}vids.push({reproduce:v.currentTime>t0,dur:Math.round(v.duration||0),label:v.getAttribute('aria-label')||null});v.pause();}
    const lum=c=>{const v=c.match(/\d+(\.\d+)?/g).slice(0,3).map(x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];};
    const bgOf=el=>{for(let e=el;e;e=e.parentElement){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return c;}return 'rgb(255,255,255)';};
    const low=[];for(const el of document.querySelectorAll('body *')){if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;const cs=getComputedStyle(el);if(cs.visibility==='hidden'||!el.getClientRects().length)continue;
     const a=lum(cs.color),bb=lum(bgOf(el)),r=(Math.max(a,bb)+.05)/(Math.min(a,bb)+.05),large=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.66&&+cs.fontWeight>=700);if(r<(large?3:4.5))low.push({t:el.textContent.trim().slice(0,30),r:+r.toFixed(2)});}
    const px=el=>{const f=parseFloat(getComputedStyle(el).fontSize);if(el instanceof SVGElement&&el.getScreenCTM){const m=el.getScreenCTM();return f*Math.hypot(m.a,m.b);}return f;};
    const small=[...document.querySelectorAll('body *')].filter(el=>!el.closest('.pan')&&[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1)&&el.getClientRects().length&&px(el)<12).map(el=>el.textContent.trim().slice(0,30)+' '+px(el).toFixed(1)+'px');
    const hs=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h=>+h.tagName[1]);const skips=hs.filter((l,i)=>i&&l>hs[i-1]+1).length;
    const land={header:document.querySelectorAll('header').length,nav:document.querySelectorAll('nav').length,main:document.querySelectorAll('main').length,footer:document.querySelectorAll('footer').length,h1:hs.filter(l=>l===1).length,saltosDeTitulo:skips};
    return {imagenes:imgs.length,rotas:imgs.filter(i=>!i.naturalWidth).length,sinAlt:imgs.filter(i=>!i.hasAttribute('alt')).length,videos:vids,desbordeX:document.documentElement.scrollWidth-document.documentElement.clientWidth,
     lang:document.documentElement.lang,langOk:document.documentElement.lang===lang,contrasteBajo:low.slice(0,5),contrasteBajoN:low.length,textoBajo12:small.slice(0,5),textoBajo12N:small.length,landmarks:land,scripts:document.scripts.length};},lang);
   if(lang==='en'){const r=await pg.evaluate(`(${I18N_JS})(${JSON.stringify(EN_DICT)},${JSON.stringify(I18N_DATA)},'check')`);m.restosEspanol=r.residual.length;m.restosMuestra=r.residual.slice(0,4);}
   const focus=[];for(let i=0;i<14;i++){await pg.keyboard.press('Tab');focus.push(await pg.evaluate(()=>{const e=document.activeElement;if(!e||e===document.body)return null;const cs=getComputedStyle(e);
    const vis=(cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0)||cs.boxShadow!=='none'||e.tagName==='VIDEO';const r=e.getBoundingClientRect();return {tag:e.tagName,visible:vis,enPantalla:r.bottom>0&&r.top<innerHeight};}));}
   m.foco={recorridos:focus.filter(Boolean).length,sinFocoVisible:focus.filter(f=>f&&!f.visible).length,fueraDePantalla:focus.filter(f=>f&&!f.enPantalla).length};
   if(shoot)await pg.screenshot({path:path.join(EV,`${id}-${vn}.jpg`),fullPage:true,type:'jpeg',quality:70});
   const vpath=rec?await pg.video().path():null;await ctx.close();if(vpath)fs.renameSync(vpath,path.join(EV,`recorrido-${id}-${vn}.webm`));
   P.vistas.push({vista:vn,...m,externas:ext.length,errores:errs});}
  fs.rmSync(clean,{recursive:true,force:true});
  const bad=P.vistas.filter(v=>v.rotas||v.videos.some(x=>!x.reproduce)||v.desbordeX>0||v.externas||v.errores.length||v.contrasteBajoN||v.textoBajo12N||!v.langOk||v.sinAlt||v.restosEspanol||v.landmarks.main!==1||v.landmarks.h1!==1||v.foco.sinFocoVisible);
  P.ok=P.exportado&&P.zipValido&&P.leeme&&!bad.length;console.log(id,'export',P.exportado,'zip',P.zipValido,'files',P.archivos,'ok',P.ok,bad.map(v=>v.vista+':'+JSON.stringify({r:v.rotas,ov:v.desbordeX,c:v.contrasteBajoN,s:v.textoBajo12N,es:v.restosEspanol,f:v.foco.sinFocoVisible,l:v.langOk,lm:v.landmarks})).join(' '));}
 save();if(!PARTES.has('rendimiento'))out.rendimiento=prevOut.rendimiento||[];
 // rendimiento: carga del índice integral por idioma y vista, 10 repeticiones (carga, fuentes listas, primera pintura)
 if(PARTES.has('rendimiento'))for(const lang of idiomas){const P=out.paquetes.find(p=>p.tipo==='integral'&&p.idioma===lang&&p.exportado);if(!P)continue;const clean=fs.mkdtempSync(path.join(os.tmpdir(),'rend-'));execFileSync('unzip',['-q',path.join(W,P.paquete+'.zip'),'-d',clean]);
  const root=fs.readdirSync(clean).length===1?path.join(clean,fs.readdirSync(clean)[0]):clean;
  for(const [vn,w,h] of VIEWS){const loads=[],fcp=[];for(let i=0;i<10;i++){const ctx=await b.newContext({viewport:{width:w,height:h}});const pg=await ctx.newPage();const t0=Date.now();await pg.goto('file://'+path.join(root,'index.html'));await pg.evaluate(()=>document.fonts.ready);loads.push(Date.now()-t0);
    fcp.push(await pg.evaluate(()=>{const e=performance.getEntriesByName('first-contentful-paint')[0];return e?Math.round(e.startTime):null;}));await ctx.close();}
   out.rendimiento.push({idioma:lang,vista:vn,repeticiones:10,cargaMs:{p50:pct(loads,50),p95:pct(loads,95)},primeraPinturaMs:{p50:pct(fcp.filter(x=>x!=null),50),p95:pct(fcp.filter(x=>x!=null),95)}});}
  fs.rmSync(clean,{recursive:true,force:true});}
 save();
 out.rendimientoExportacion={repeticiones:out.paquetes.length,p50:pct(out.paquetes.map(p=>p.exportMs),50),p95:pct(out.paquetes.map(p=>p.exportMs),95)};
 // postMessage: la vista previa obedece solo a la página que la contiene; un iframe hermano (emisor ajeno) se ignora
 if(!PARTES.has('postmessage'))out.postMessage=prevOut.postMessage||null;
 if(PARTES.has('postmessage')){const prev=path.join(LAB,'out/v3/profesional/vista-previa.html');const test=path.join(W,'postmessage.html');
  fs.writeFileSync(test,`<!doctype html><iframe id="v" src="file://${prev}" style="width:1200px;height:800px"></iframe><iframe id="ajeno" srcdoc="<script>window.atacar=()=>parent.frames[0].postMessage({rubikHide:['vivienda','presupuesto','estancias']},'*');<\/script>"></iframe>`);
  const ctx=await b.newContext();const pg=await ctx.newPage();await pg.goto('file://'+test);await pg.waitForTimeout(1500);const v=pg.frame({name:'v'});
  const vis=()=>v.evaluate(()=>[...document.querySelectorAll('section.ch')].filter(s=>!s.hidden).map(s=>s.id));const before=await vis();
  await pg.frame({name:'ajeno'}).evaluate(()=>window.atacar());await pg.waitForTimeout(500);const afterForeign=await vis();
  await pg.evaluate(()=>document.getElementById('v').contentWindow.postMessage({rubikHide:['vivienda']},'*'));await pg.waitForTimeout(500);const afterParent=await vis();await ctx.close();
  out.postMessage={antes:before.length,trasEmisorAjeno:afterForeign.length,ajenoIgnorado:afterForeign.length===before.length,trasPagina:afterParent.length,paginaObedecida:afterParent.length===before.length-1};
  console.log('postMessage',JSON.stringify(out.postMessage));}
 await b.close();
 out.resumen={paquetes:out.paquetes.length,correctos:out.paquetes.filter(p=>p.ok).length,vistas:out.paquetes.reduce((s,p)=>s+p.vistas.length,0),rendimiento:out.rendimiento.map(r=>`${r.idioma} ${r.vista}: carga p50 ${r.cargaMs.p50} ms, p95 ${r.cargaMs.p95} ms`),exportacion:out.rendimientoExportacion};
 fs.writeFileSync(path.join(EV,'consumidor-qa.json'),JSON.stringify(out,null,1));console.log(JSON.stringify(out.resumen,null,1));})().catch(e=>{console.error(e);process.exit(1);});
