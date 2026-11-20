'use strict';
// K11 · QA de navegador de la DEMOSTRACIÓN de laboratorio sobre la copia aislada de la candidata (tools/k11-copia.cjs).
// Recorrido real: vistas reales con takeId → resultado SIMULADO → ficha → conservar (base aislada) → recargar → recuperar →
// comparar · recaptura · cambio de revisión real · bytes alterados y ausentes · móvil y ZH · sin red ni escritura en producto.
// Uso: node tools/k11-ui-qa.cjs <copia> [salida.json]
const http=require('http'),fs=require('fs'),path=require('path');const pw=require('playwright');
const [copia,salida]=process.argv.slice(2);if(!copia){console.error('Uso: node tools/k11-ui-qa.cjs <copia> [salida.json]');process.exit(1);}
const ROOT=path.resolve(copia),LAB=path.resolve(__dirname,'..'),OUT=salida||path.join(LAB,'evidence/k11/k11-ui-qa.json'),VIS=path.join(LAB,'evidence/k11/visual');fs.mkdirSync(VIS,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.woff':'font/woff','.glb':'model/gltf-binary','.wasm':'application/wasm'};
const srv=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(ROOT,p);if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return;}s.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);});
const casos=[],capturas=[];const ok=(c,m)=>{if(!c)throw new Error(m);};
async function caso(nav,id,titulo,fn){process.stderr.write(`[${nav}] ${id} …\n`);try{const d=await fn();casos.push({navegador:nav,id,titulo,resultado:'PASS',...(d!==undefined?{detalle:d}:{})});}catch(e){casos.push({navegador:nav,id,titulo,resultado:'FAIL',detalle:String(e&&e.message||e).slice(0,500)});}}
async function shot(pg,name){const f=path.join(VIS,name+'.png');await pg.screenshot({path:f});capturas.push(path.relative(LAB,f));}
async function abrir(browser,ctx,port,{lang='es'}={}){
 const pg=await ctx.newPage();const errores=[],externas=[];pg.on('pageerror',e=>errores.push(e.message));pg.on('console',m=>{if(m.type()==='error')errores.push('console: '+m.text().slice(0,200));});
 await pg.goto(`http://f0-2b.localhost:${port}/`);await pg.waitForFunction(()=>window.FloorPlanApp&&window.RubikK11Lab&&window.FloorPlanPersistenceEditor?.session,null,{timeout:60000});
 await listo(pg);return {pg,errores,externas};}
// Editor listo: sesión F0 y bienvenida modal cerrada con Escape (se espera a que aparezca; puede abrirse tarde).
async function listo(pg){await pg.waitForFunction(()=>window.RubikK11Lab&&window.FloorPlanPersistenceEditor?.session,null,{timeout:60000});
 await pg.waitForFunction(()=>document.getElementById('welcomeDialog')?.open,null,{timeout:6000}).catch(()=>{});
 for(let i=0;i<3&&await pg.evaluate(()=>!!document.getElementById('welcomeDialog')?.open);i++){await pg.keyboard.press('Escape');await pg.waitForTimeout(200);}}
async function confirmadoIgual(pg){const t0=Date.now();while(Date.now()-t0<30000){if(await pg.evaluate(async()=>{try{const E=RubikStudioE3;const A=E.analizar(await E.leerConfirmado(FloorPlanPersistence),{Core:FloorPlanCore,Budget:FloorPlanBudget});return A.ok&&!E.cambiosSinGuardar(A,FloorPlanApp.project);}catch{return false;}}))return;await pg.waitForTimeout(300);}throw new Error('sin confirmar');}
async function toma(pg){const a=await pg.evaluate(()=>FloorPlanProjectViews.takeId);await pg.evaluate(()=>{FloorPlanProjectViews.prepare();});await pg.waitForFunction(a=>FloorPlanProjectViews.status()==='ready'&&FloorPlanProjectViews.takeId&&FloorPlanProjectViews.takeId!==a,a,{timeout:90000});return pg.evaluate(()=>FloorPlanProjectViews.takeId);}
// Espera a que termine la lectura que inicia ESTA apertura (contador de lecturas completadas), no un estado anterior.
async function k11(pg){const n=await pg.evaluate(()=>__k11.lecturas);await pg.evaluate(()=>RubikK11Lab.abrir());await pg.waitForSelector('#k11Dialog[open]');await pg.waitForFunction(n=>__k11.lecturas>n&&!__k11.ocupado,n,{timeout:60000});}
async function generar(pg,estilo){await pg.selectOption('#k11Estilo',estilo);await pg.click('#k11Generar');await pg.waitForFunction(()=>!__k11.ocupado&&(__k11.ficha||__k11.aviso),null,{timeout:30000});}
async function conservar(pg){await pg.click('#k11Conservar');await pg.waitForFunction(()=>!__k11.ocupado,null,{timeout:30000});}
const lista=pg=>pg.evaluate(()=>__k11.lista.map(f=>({id:f.ficha.id,estilo:f.ficha.estilo.style,toma:f.ficha.toma.takeId,integridad:f.verificacion.integridad,vigencia:f.verificacion.vigencia,favorito:f.favorito})));

srv.listen(0,async()=>{
 const port=srv.address().port,nav='chromium',browser=await pw.chromium.launch();
 const ctx=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2});const ext=[];
 await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='f0-2b.localhost'){ext.push(u.href);return r.abort();}return r.continue();});
 let {pg,errores}=await abrir(browser,ctx,port);
 await pg.evaluate(()=>document.getElementById('guideCopyExample').click());await confirmadoIgual(pg);
 const lsAntes=await pg.evaluate(()=>Object.keys(localStorage).sort());
 const take1=await toma(pg);let ids={};
 await caso(nav,'K11-UI-01','Vista real con takeId → resultado SIMULADO → ficha: original PNG y bytes enviados JPEG distintos (K11-A real), íntegro y vigente',async()=>{
  await k11(pg);await generar(pg,'natural');const d=await pg.evaluate(()=>{const f=__k11.ficha;return {clase:f.clase,toma:f.toma.takeId,orig:f.recursos.original.mediaType,env:f.recursos.enviada.mediaType,derivada:f.recursos.enviada.derivadaDe===f.recursos.original.sha256,distintos:f.recursos.original.sha256!==f.recursos.enviada.sha256,noAcreditado:f.noAcreditado,integridad:__k11.verif.integridad,vigencia:__k11.verif.vigencia,id:f.id}});
  ok(d.clase==='simulado-laboratorio'&&d.toma===take1&&d.orig==='image/png'&&d.env==='image/jpeg'&&d.derivada&&d.distintos&&d.integridad==='integro'&&d.vigencia==='vigente',JSON.stringify(d));ids.a=d.id;await shot(pg,'k11-ficha');return d;});
 await caso(nav,'K11-UI-02','Misma toma y mismo estilo → se reutiliza su resultado (caché por takeId); dos variantes conservadas, favorito y comparación',async()=>{
  await generar(pg,'natural');const c=await pg.evaluate(()=>({desdeCache:__k11.desdeCache,id:__k11.ficha.id}));ok(c.desdeCache&&c.id===ids.a,JSON.stringify(c));
  await conservar(pg);await generar(pg,'scandinavian');ids.b=await pg.evaluate(()=>__k11.ficha.id);await conservar(pg);
  await pg.evaluate(()=>document.querySelector('#k11Lista li .btn').click());await pg.waitForFunction(()=>!__k11.ocupado&&__k11.lista.some(f=>f.favorito));
  await pg.click('#k11Comparar');const cmp=await pg.evaluate(()=>document.getElementById('k11Cmp').textContent);const l=await lista(pg);
  ok(l.length===2&&l.every(f=>f.integridad==='integro'&&f.vigencia==='vigente')&&/Misma toma: sí/.test(cmp),JSON.stringify({l,cmp}));await shot(pg,'k11-variantes-comparacion');return {l,cmp};});
 await caso(nav,'K11-UI-03','Recuperación tras recargar la página: las dos fichas, íntegras y vigentes, con su favorito',async()=>{
  await pg.reload();await listo(pg);
  await pg.evaluate(()=>{FloorPlanProjectViews.prepare();});await pg.waitForFunction(()=>FloorPlanProjectViews.status()==='ready',null,{timeout:90000});
  await k11(pg);const l=await lista(pg);ok(l.length===2&&l.every(f=>f.integridad==='integro')&&l.some(f=>f.favorito),JSON.stringify({l,aviso:await pg.evaluate(()=>__k11.aviso),pid:await pg.evaluate(()=>FloorPlanApp.project.id),antes:ids,claves:await pg.evaluate(()=>new Promise(res=>{const r=indexedDB.open(RubikK11Lab.DB);r.onsuccess=()=>{const q=r.result.transaction('proyectos').objectStore('proyectos').getAllKeys();q.onsuccess=()=>res(q.result);};})),confirmado:await pg.evaluate(async()=>{const E=RubikStudioE3;const A=E.analizar(await E.leerConfirmado(FloorPlanPersistence),{Core:FloorPlanCore,Budget:FloorPlanBudget});return A.ok?A.project.id:A.motivo;})}));
  // Tras recargar, las vistas se han vuelto a capturar: las fichas son de una toma anterior (íntegras), no la actual.
  ok(l.every(f=>f.vigencia==='toma-anterior'),JSON.stringify(l));await shot(pg,'k11-recuperacion-tras-recargar');return l;});
 await caso(nav,'K11-UI-04','Recaptura: un resultado nuevo NO se recupera de la caché de la toma anterior (otro id, takeId nuevo)',async()=>{
  const t2=await pg.evaluate(()=>FloorPlanProjectViews.takeId);ok(t2!==take1,'misma toma');await generar(pg,'natural');
  const d=await pg.evaluate(()=>({id:__k11.ficha.id,toma:__k11.ficha.toma.takeId,cache:__k11.desdeCache}));ok(d.id!==ids.a&&d.toma===t2&&!d.cache,JSON.stringify(d));return d;});
 await caso(nav,'K11-UI-05','Cambio real de revisión (norte confirmado): las fichas siguen íntegras y pasan a «desactualizado»; no se reasignan',async()=>{
  await pg.keyboard.press('Escape');await pg.evaluate(()=>FloorPlanApp.setSite({...(FloorPlanApp.project.site||{}),northOffsetDeg:30}));await confirmadoIgual(pg);
  await k11(pg);const l=await lista(pg);ok(l.length===2&&l.every(f=>f.integridad==='integro'&&f.vigencia==='desactualizado'),JSON.stringify(l));
  const rev=await pg.evaluate(()=>__k11.lista.map(f=>f.ficha.sujeto.revision));await shot(pg,'k11-desactualizado');return {l,revisionesCongeladas:rev};});
 await caso(nav,'K11-UI-06','Bytes alterados → «inválido»; bytes ausentes → «incompleto» (base aislada del laboratorio)',async()=>{
  const refs=await pg.evaluate(()=>__k11.lista.map(f=>f.ficha.recursos.resultado.storage.ref));
  await pg.evaluate(async([a,b])=>{const d=await new Promise((res,rej)=>{const r=indexedDB.open(RubikK11Lab.DB);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
   await new Promise((res,rej)=>{const t=d.transaction('bytes','readwrite'),s=t.objectStore('bytes');const g=s.get(a);g.onsuccess=()=>{const u=new Uint8Array(g.result);u[30]^=255;s.put(u.buffer,a);s.delete(b);};t.oncomplete=res;t.onerror=()=>rej(t.error);});d.close();},refs);
  {const n=await pg.evaluate(()=>__k11.lecturas);await pg.click('#k11Recuperar');await pg.waitForFunction(n=>__k11.lecturas>n&&!__k11.ocupado,n);}const l=await lista(pg);
  ok(l.find(f=>f.integridad==='invalido')&&l.find(f=>f.integridad==='incompleto'),JSON.stringify(l));await shot(pg,'k11-alterado-ausente');return l;});
 await caso(nav,'K11-UI-07','Sin red externa, sin errores y sin escritura en el producto: ni localStorage nuevo, ni claves «k11:» en FloorPlanImages, ni la extensión en la autoridad F0',async()=>{
  const d=await pg.evaluate(async()=>{const r=await FloorPlanPersistence.readConfirmed();const txt=[...r.docs.values()].join('');
   const imgKeys=await (window.FloorPlanImages?.keys?.()||Promise.resolve([])).catch(()=>[]);return {ls:Object.keys(localStorage).sort(),ext:txt.includes('x-k11-visual-results'),k11Imgs:(imgKeys||[]).filter(k=>String(k).startsWith('k11:')).length};});
  const nuevas=d.ls.filter(k=>!lsAntes.includes(k));ok(!d.ext&&d.k11Imgs===0&&!nuevas.some(k=>/k11/i.test(k)),JSON.stringify({...d,nuevas}));ok(!ext.length,ext.slice(0,3).join(' '));ok(!errores.length,errores.join(' | '));
  return {nuevasClavesLocalStorage:nuevas,extEnF0:d.ext,clavesK11EnImagenes:d.k11Imgs,externas:ext.length};});
 await caso(nav,'K11-UI-08','Teclado: Escape cierra el diálogo; foco dentro del diálogo',async()=>{await pg.focus('#k11Generar');await pg.keyboard.press('Escape');ok(!(await pg.evaluate(()=>document.getElementById('k11Dialog').open)),'sigue abierto');});
 await ctx.close();
 // Móvil (emulación) y ZH
 const m=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});await m.addInitScript(()=>{try{localStorage.setItem('rubik-sota-floorplan-lang','zh');}catch{}});
 await m.route('**/*',r=>{const u=new URL(r.request().url());return u.hostname!=='f0-2b.localhost'?r.abort():r.continue();});
 ({pg,errores}=await abrir(browser,m,port));
 await caso(nav,'K11-UI-09','390×844 táctil (emulación) y ZH: ficha legible, sin desbordamiento, «Cerrar» visible, textos en chino',async()=>{
  await pg.evaluate(()=>document.getElementById('guideCopyExample').click());await confirmadoIgual(pg);await toma(pg);await k11(pg);await generar(pg,'warm');
  const d=await pg.evaluate(()=>{const dl=document.getElementById('k11Dialog'),b=dl.querySelector('.k11-body'),x=document.getElementById('k11Cerrar').getBoundingClientRect();
   return {titulo:document.getElementById('k11Title').firstChild.textContent,overflow:b.scrollWidth>b.clientWidth+1,cerrar:x.right<=innerWidth&&x.bottom<=innerHeight,rect:[x.left,x.top,x.right,x.bottom,innerWidth,innerHeight],integridad:__k11.verif?.integridad};});
  ok(d.titulo==='可追溯视觉结果'&&!d.overflow&&d.cerrar&&d.integridad==='integro',JSON.stringify(d));await shot(pg,'k11-movil-zh');ok(!errores.length,errores.join('|'));return d;});
 await m.close();await browser.close();srv.close();
 const cuenta=r=>casos.filter(c=>c.resultado===r).length;
 const o={schema:'rubik-lab-k11-ui-qa/1',fecha:new Date().toISOString(),copia:'candidata Codex 64f8837 + k11 de laboratorio (aislada)',navegador:{chromium:'RUN',firefox:'NOT_RUN (no instalado)',webkit:'NOT_RUN (no instalado)'},
  entorno:{node:process.version,playwright:require('playwright/package.json').version,emulacion:'móvil emulado; no es un dispositivo físico'},resumen:{PASS:cuenta('PASS'),FAIL:cuenta('FAIL')},casos,capturas};
 fs.writeFileSync(OUT,JSON.stringify(o,null,1)+'\n');console.log(JSON.stringify(o.resumen));for(const c of casos)if(c.resultado==='FAIL')console.log(c.id,c.detalle);process.exit(cuenta('FAIL')?2:0);
});
