'use strict';
// E3 · QA de navegador del DELTA «Preparar entrega» sobre la copia aislada de master (tools/e3-copia.cjs).
// Origen de prueba F0.2b: http://f0-2b.localhost:<puerto> (único origen donde readConfirmed está activo en master).
// Proyecto: el de referencia del producto (sintético). Ediciones reales con FloorPlanApp.setSite (norte), nunca datos reales.
// Uso: node tools/e3-ui-qa.cjs <copiaDir> [salida.json]  · Navegadores: los que Playwright encuentre; el resto NOT_RUN con motivo.
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const pw=require('playwright');
const [copia,salida]=process.argv.slice(2);if(!copia){console.error('Uso: node tools/e3-ui-qa.cjs <copiaDir> [salida.json]');process.exit(1);}
const ROOT=path.resolve(copia),LAB=path.resolve(__dirname,'..'),OUT=salida||path.join(LAB,'evidence/e3/e3-ui-qa.json'),VIS=path.join(LAB,'evidence/e3/visual');
fs.mkdirSync(VIS,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.woff':'font/woff','.glb':'model/gltf-binary','.wasm':'application/wasm','.txt':'text/plain'};
const srv=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(ROOT,p);
 if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return;}s.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);});
const casos=[],capturas=[];
const rec=(navegador,id,titulo,resultado,detalle)=>casos.push({navegador,id,titulo,resultado,...(detalle!==undefined?{detalle}:{})});
const SOLO=process.env.E3_CASOS?process.env.E3_CASOS.split(','):null;// depuración: ejecutar solo esos casos (la evidencia se genera sin filtro)
async function caso(nav,id,titulo,fn){if(SOLO&&!SOLO.includes(id))return;process.stderr.write(`[${nav}] ${id} …\n`);try{const d=await fn();rec(nav,id,titulo,'PASS',d);}catch(e){rec(nav,id,titulo,'FAIL',String(e&&e.message||e).slice(0,500));}}
const ok=(c,m)=>{if(!c)throw new Error(m);};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');

async function abrir(browser,port,{host='f0-2b.localhost',viewport={width:1440,height:900},lang='es',reduced=false,touch=false,qa=true}={}){
 const ctx=await browser.newContext({viewport,deviceScaleFactor:2,hasTouch:touch,isMobile:touch&&browser.browserType().name()==='chromium',reducedMotion:reduced?'reduce':'no-preference'});
 await ctx.addInitScript(l=>{try{localStorage.setItem('rubik-sota-floorplan-lang',l);}catch{}},lang);
 // Bandera de laboratorio: expone el estado del controlador como window.__e3 (la propuesta productiva no la activa).
 if(qa)await ctx.addInitScript(()=>{window.RUBIK_E3_QA=true;});
 const pg=await ctx.newPage();const errores=[],externas=[];
 pg.on('pageerror',e=>errores.push(e.message));pg.on('console',m=>{if(m.type()==='error')errores.push('console: '+m.text().slice(0,200));});
 await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!==host||u.port!==String(port)){externas.push(u.href);return r.abort();}return r.continue();});
 await pg.goto(`http://${host}:${port}/`);await pg.waitForFunction(()=>window.FloorPlanApp&&window.RubikStudioE3UI&&document.getElementById('workArea-deliver'),null,{timeout:30000});
 if(host==='f0-2b.localhost')await pg.waitForFunction(()=>window.FloorPlanPersistenceEditor?.session,null,{timeout:30000});
 await cerrarBienvenida(pg);
 return {ctx,pg,errores,externas};
}
// La bienvenida del producto es modal: se cierra con Escape, como lo haría una persona.
async function cerrarBienvenida(pg){await pg.waitForFunction(()=>document.getElementById('welcomeDialog')?.open,null,{timeout:6000}).catch(()=>{});for(let i=0;i<3;i++){if(!(await pg.evaluate(()=>!!document.getElementById('welcomeDialog')?.open)))return;await pg.keyboard.press('Escape');await pg.waitForTimeout(200);}
 if(await pg.evaluate(()=>!!document.getElementById('welcomeDialog')?.open))throw new Error('La bienvenida no se cierra con Escape');}
// Ruta real de guardado: «Crear mi copia» del ejemplo (guide-ui copyExample → library.add → sesión F0). Espera la revisión con proyecto.
async function crearCopia(pg){await pg.evaluate(()=>document.getElementById('guideCopyExample').click());
 await confirmadoIgual(pg);}
// Espera (sondeando con evaluate, que sí espera promesas) a que la revisión confirmada contenga EXACTAMENTE el proyecto abierto.
async function confirmadoIgual(pg,ms=20000){const t0=Date.now();while(Date.now()-t0<ms){
 const ok=await pg.evaluate(async()=>{try{const E=RubikStudioE3;const A=E.analizar(await E.leerConfirmado(FloorPlanPersistence),{Core:FloorPlanCore});return A.ok&&!E.cambiosSinGuardar(A,FloorPlanApp.project);}catch{return false;}});
 if(ok)return true;await pg.waitForTimeout(300);}throw new Error('El proyecto no llegó a confirmarse en '+ms+' ms');}
const confirmado=pg=>pg.evaluate(async()=>{const r=await FloorPlanPersistence.readConfirmed();return {revision:r.revision,huella:[...r.docs].map(([k,v])=>k+':'+v.length+':'+v.slice(0,0)).join('|'),docs:Object.fromEntries([...r.docs].map(([k,v])=>[k,v]))};});
const ls=pg=>pg.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k);}return o;});
const guardado=pg=>confirmadoIgual(pg);
async function entregar(pg){await pg.click('#workArea-deliver');await pg.waitForSelector('#e3Card',{timeout:15000});}
async function dialogo(pg){await pg.click('#e3Open');await pg.waitForSelector('#e3Dialog[open]');await pg.waitForFunction(()=>window.__e3?.lectura,null,{timeout:15000});await pg.waitForTimeout(150);}
async function elegir(pg,key){await pg.click(`label[data-receta="${key}"]`);await pg.waitForTimeout(80);}
async function shot(pg,name,nav){if(nav!=='chromium')return;const f=path.join(VIS,name+'.png');await pg.screenshot({path:f});capturas.push({archivo:path.relative(LAB,f),bytes:fs.statSync(f).size});}

async function suite(browser,nav,port){
 // ---------- escritorio: flujo completo, estados y conservación
 let s=await abrir(browser,port);let {pg}=s;
 await caso(nav,'UI-01','Entregar muestra «Preparar entrega» en Documentación sin retirar E2.1, la visita 3D ni otras tarjetas',async()=>{
  await entregar(pg);const d=await pg.evaluate(()=>({e3:!!document.querySelector('[data-group="documentation"] #e3Card'),compare:!!document.querySelector('[data-compare-state]'),visita:!!document.getElementById('delivery3dCard'),grupos:[...document.querySelectorAll('.professional-delivery-group')].map(g=>g.dataset.group)}));
  ok(d.e3&&d.compare&&d.visita,JSON.stringify(d));return d;});
 await caso(nav,'UI-02a','Proyecto de ejemplo sin guardar: «sin revisión del proyecto», con causa y siguiente paso; nada preparable',async()=>{
  await dialogo(pg);const d=await pg.evaluate(()=>({lectura:__e3.lectura.estado,rev:__e3.lectura.revision,motivo:__e3.analisis?.motivo,code:document.querySelector('#e3Dialog .e3-read [data-code]')?.dataset.code,preparables:document.querySelectorAll('#e3Dialog [data-estado^="preparable"]').length}));
  ok(d.motivo==='c1-sin-revision'&&d.code==='c1-sin-revision'&&d.preparables===0,JSON.stringify(d));await shot(pg,'e3-escritorio-sin-revision',nav);
  await pg.keyboard.press('Escape');await pg.waitForFunction(()=>!document.getElementById('e3Dialog')?.open);return d;});
 await crearCopia(pg);
 const antesLS=await ls(pg),antesC=await confirmado(pg);
 await caso(nav,'UI-02','El diálogo lee la revisión confirmada, lista las 21 recetas con su nivel y no inventa revisión',async()=>{
  await dialogo(pg);const d=await pg.evaluate(()=>({estado:__e3.lectura.estado,rev:__e3.lectura.revision,items:document.querySelectorAll('#e3Dialog label[data-receta]').length,modal:document.getElementById('e3Dialog').matches(':modal'),cambios:__e3.cambios}));
  ok(d.estado==='confirmado'&&d.rev>=1&&d.items===21&&d.modal&&d.cambios===false,JSON.stringify(d));await shot(pg,'e3-escritorio-lista',nav);return d;});
 await caso(nav,'UI-03','Receta L bloqueada (RP07 sin vistas preparadas): explica causa, siguiente paso, alternativa y datos',async()=>{
  await elegir(pg,'RP07');const d=await pg.evaluate(()=>{const n=document.querySelector('#e3Dialog .e3-detail [data-code="receta-bloqueada"]');return {aviso:!!n,dd:n?n.querySelectorAll('dd').length:0,boton:!!document.getElementById('e3Prepare'),falta:[...document.querySelectorAll('#e3Dialog .e3-detail h4')].map(h=>h.textContent)};});
  ok(d.aviso&&d.dd===3&&!d.boton,JSON.stringify(d));await shot(pg,'e3-escritorio-bloqueada',nav);return d;});
 await caso(nav,'UI-04','Recetas C y F: elegibilidad o indisponibilidad sin botón de preparación ni emisión',async()=>{
  const out={};for(const k of ['RP13','RP14','RP16','RP21']){await elegir(pg,k);out[k]=await pg.evaluate(()=>({boton:!!document.getElementById('e3Prepare'),aviso:document.querySelector('#e3Dialog .e3-detail [data-code]')?.dataset.code}));ok(!out[k].boton&&/receta-[cf]/.test(out[k].aviso),k+JSON.stringify(out[k]));}
  return out;});
 await caso(nav,'UI-05','Receta parcial (RP10): se prepara con lo confirmado, nombra lo incompleto y verifica «verificado»',async()=>{
  await elegir(pg,'RP10');await pg.click('#e3Prepare');await pg.waitForSelector('#e3Estado',{timeout:15000});
  const d=await pg.evaluate(()=>({estado:document.getElementById('e3Estado').dataset.estado,res:__e3.candidato.composicion.resolucion.estado,incompleta:__e3.candidato.composicion.resolucion.incompleta,rev:__e3.candidato.congelado.revision,paquete:__e3.candidato.paquete}));
  ok(d.estado==='verificado'&&d.res==='preparable-parcial'&&d.incompleta.includes('revisionAnterior')&&d.paquete===null,JSON.stringify(d));
  await pg.evaluate(()=>document.getElementById('e3Preview').scrollIntoView());await shot(pg,'e3-escritorio-verificado',nav);return d;});
 await caso(nav,'UI-06','Conservación: abrir, preparar y verificar no cambia localStorage ni la revisión confirmada',async()=>{
  const l=await ls(pg),c=await confirmado(pg);ok(sha(JSON.stringify(l))===sha(JSON.stringify(antesLS)),'localStorage cambió');ok(c.revision===antesC.revision&&sha(JSON.stringify(c.docs))===sha(JSON.stringify(antesC.docs)),'autoridad cambió');return {revision:c.revision};});
 await caso(nav,'UI-07','Cambios sin guardar (edición real del norte, antes de confirmarse) bloquean la preparación',async()=>{
  const d=await pg.evaluate(async()=>{FloorPlanApp.setSite({...(FloorPlanApp.project.site||{}),northOffsetDeg:30});const E=RubikStudioE3;const l=await E.leerConfirmado(FloorPlanPersistence);return E.cambiosSinGuardar(E.analizar(l,{Core:FloorPlanCore}),FloorPlanApp.project);});
  ok(d===true,'no detectó cambios sin guardar');return {cambiosSinGuardar:d};});
 await caso(nav,'UI-08','Al confirmarse el cambio, el candidato pasa a «verificado-desactualizado» y el norte queda acreditado',async()=>{
  await guardado(pg);await pg.click('#e3Dialog .e3-preview ~ * , #e3Preview .e3-actions .btn').catch(()=>{});await pg.evaluate(()=>[...document.querySelectorAll('#e3Preview .e3-actions .btn')][0]?.click());
  await pg.waitForFunction(()=>__e3.verificacion&&__e3.verificacion.estado!=='verificado',null,{timeout:15000});
  const d=await pg.evaluate(()=>({estado:__e3.verificacion.estado,motivo:__e3.verificacion.motivo,norte:__e3.fuentes.norte}));
  ok(d.estado==='verificado-desactualizado'&&d.motivo==='desactualizado-trabajo'&&d.norte.estado==='disponible',JSON.stringify(d));await shot(pg,'e3-escritorio-desactualizado',nav);return d;});
 await caso(nav,'UI-09','Otra pestaña confirma una revisión nueva: la primera lo detecta al verificar (sin escribir)',async()=>{
  const p2=await s.ctx.newPage();await p2.goto(pg.url());await p2.waitForFunction(()=>window.FloorPlanPersistenceEditor?.session,null,{timeout:30000});
  const r0=await pg.evaluate(()=>__e3.lectura.revision);
  await p2.evaluate(()=>FloorPlanApp.setSite({...(FloorPlanApp.project.site||{}),northOffsetDeg:45}));await guardado(p2);await p2.waitForTimeout(400);
  await pg.evaluate(()=>[...document.querySelectorAll('#e3Dialog .e3-head .btn')][0].click());await pg.waitForFunction(r=>__e3.lectura&&__e3.lectura.revision>r,r0,{timeout:15000});
  const d=await pg.evaluate(()=>({rev:__e3.lectura.revision,cambios:__e3.cambios,estado:__e3.verificacion?.estado}));await p2.close();
  ok(d.rev>r0&&d.cambios===true&&d.estado==='verificado-desactualizado',JSON.stringify(d));return {antes:r0,...d};});
 await caso(nav,'UI-10','Teclado: Escape cierra el diálogo y el foco vuelve a «Preparar entrega»; flechas recorren las recetas',async()=>{
  await pg.keyboard.press('Escape');await pg.waitForFunction(()=>!document.getElementById('e3Dialog')?.open);
  const f=await pg.evaluate(()=>document.activeElement?.id);ok(f==='e3Open','foco en '+f);
  await pg.keyboard.press('Enter');await pg.waitForSelector('#e3Dialog[open]');await pg.waitForFunction(()=>__e3.lectura);
  await pg.focus('#e3Dialog label[data-receta="RP01"] input');await pg.keyboard.press('ArrowDown');const k=await pg.evaluate(()=>document.activeElement?.value);ok(k==='RP02','flecha a '+k);
  let dentro=true;for(let i=0;i<25;i++){await pg.keyboard.press('Tab');if(!(await pg.evaluate(()=>{const a=document.activeElement;return !a||a===document.body||!!a.closest('#e3Dialog');})))dentro=false;}ok(dentro,'el foco llegó a un elemento de la página fuera del diálogo (inert roto)');return {retorno:f,flecha:k,focoAtrapado:dentro};});
 await caso(nav,'UI-11','Contraste AA del texto del diálogo (≥4,5:1)',async()=>{
  const r=await pg.evaluate(()=>{const lum=c=>{const m=c.match(/[\d.]+/g).map(Number);const f=v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4;};return 0.2126*f(m[0])+0.7152*f(m[1])+0.0722*f(m[2]);};
   const bg=n=>{for(let x=n;x;x=x.parentElement){const c=getComputedStyle(x).backgroundColor;if(c&&!/rgba\(.*,\s*0\)$/.test(c)&&c!=='transparent')return c;}return 'rgb(255,255,255)';};
   const out=[];for(const n of document.querySelectorAll('#e3Dialog *')){if(!n.childNodes.length||![...n.childNodes].some(c=>c.nodeType===3&&c.textContent.trim()))continue;if(n.closest('[hidden]'))continue;
    const a=lum(getComputedStyle(n).color),b=lum(bg(n));const ratio=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);out.push({t:n.textContent.trim().slice(0,30),ratio:+ratio.toFixed(2)});}
   return {n:out.length,min:Math.min(...out.map(o=>o.ratio)),peores:out.sort((x,y)=>x.ratio-y.ratio).slice(0,3)};});
  ok(r.min>=4.5,JSON.stringify(r.peores));return r;});
 await caso(nav,'UI-12','Sin errores de página ni peticiones externas en el flujo de escritorio',async()=>{ok(!s.errores.length,s.errores.join(' | '));ok(!s.externas.length,s.externas.slice(0,3).join(' '));return {errores:0,externas:0};});
 await s.ctx.close();

 // ---------- tableta y móvil (emulación; no son dispositivos físicos)
 for(const [id,vp,touch] of [['UI-13',{width:820,height:1180},true],['UI-14',{width:390,height:844},true],['UI-13b',{width:1180,height:820},true],['UI-14b',{width:844,height:390},true]]){
  s=await abrir(browser,port,{viewport:vp,touch});pg=s.pg;await crearCopia(pg);
  await caso(nav,id,`${vp.width}×${vp.height}${touch?' táctil (emulación)':''}: sin desbordamiento horizontal y objetivos táctiles ≥44 px`,async()=>{
   await entregar(pg);await pg.evaluate(()=>document.getElementById('e3Card').scrollIntoView());await shot(pg,`e3-${vp.width}-tarjeta`,nav);
   await dialogo(pg);await elegir(pg,'RP09');await pg.click('#e3Prepare');await pg.waitForSelector('#e3Estado',{timeout:15000});
   const d=await pg.evaluate(()=>{const dlg=document.getElementById('e3Dialog');const r=dlg.getBoundingClientRect();const small=[...dlg.querySelectorAll('button,select,label.e3-item')].filter(b=>b.offsetParent).filter(b=>{const r=b.getBoundingClientRect();return r.height<44||r.width<44;}).map(b=>b.tagName+'#'+(b.id||b.className)).slice(0,5);
    const x=document.getElementById('e3Close').getBoundingClientRect();return {cerrarVisible:x.right<=innerWidth&&x.left>=0&&x.bottom<=innerHeight,ancho:r.width,vw:innerWidth,overflow:document.getElementById('e3Dialog').scrollWidth>dlg.clientWidth+1||dlg.querySelector('.e3-body').scrollWidth>dlg.querySelector('.e3-body').clientWidth+1,pequenos:small,estado:document.getElementById('e3Estado').dataset.estado};});
   await shot(pg,`e3-${vp.width}-dialogo`,nav);await pg.evaluate(()=>document.getElementById('e3Preview').scrollIntoView());await shot(pg,`e3-${vp.width}-vista-previa`,nav);
   ok(d.cerrarVisible&&d.ancho<=d.vw&&!d.overflow&&d.pequenos.length===0&&d.estado==='verificado',JSON.stringify(d));ok(!s.errores.length&&!s.externas.length,s.errores.concat(s.externas).join(' | '));return d;});
  await s.ctx.close();
 }
 // ---------- movimiento reducido, idiomas
 s=await abrir(browser,port,{reduced:true,lang:'en'});pg=s.pg;await crearCopia(pg);
 await caso(nav,'UI-15','EN + prefers-reduced-motion: textos en inglés y sin transiciones en el diálogo',async()=>{
  await entregar(pg);await dialogo(pg);const d=await pg.evaluate(()=>({titulo:document.getElementById('e3Title').textContent,rp:document.querySelector('label[data-receta="RP05"] .e3-name').textContent,trans:getComputedStyle(document.getElementById('e3Dialog')).transitionDuration}));
  ok(d.titulo==='Prepare delivery'&&/Initial cost estimate/.test(d.rp)&&/^0s/.test(d.trans),JSON.stringify(d));await shot(pg,'e3-en-reducido',nav);return d;});
 await s.ctx.close();
 s=await abrir(browser,port,{lang:'zh'});pg=s.pg;await crearCopia(pg);
 await caso(nav,'UI-16','ZH: interfaz nueva en chino; nombres de receta (catálogo ES/EN) rotulados lang="en", sin respaldo silencioso',async()=>{
  await entregar(pg);await dialogo(pg);await elegir(pg,'RP07');const d=await pg.evaluate(()=>({titulo:document.getElementById('e3Title').textContent,nombreLang:document.querySelector('label[data-receta="RP07"] .e3-name').lang,aviso:document.querySelector('#e3Dialog [data-code="receta-bloqueada"] b')?.textContent}));
  ok(d.titulo==='准备交付'&&d.nombreLang==='en'&&/配方/.test(d.aviso||''),JSON.stringify(d));await shot(pg,'e3-zh',nav);ok(!s.errores.length,s.errores.join('|'));return d;});
 await s.ctx.close();
 // ---------- fuera del origen de prueba: F0.2b no está activa → aviso, sin lectura
 // ---------- cierre técnico: selección, operación en vuelo (determinista) y diagnóstico retirado
 s=await abrir(browser,port);pg=s.pg;await crearCopia(pg);
 await caso(nav,'UI-18','Cambiar de receta retira al instante la vista previa del candidato anterior',async()=>{
  await entregar(pg);await dialogo(pg);await elegir(pg,'RP10');await pg.click('#e3Prepare');await pg.waitForSelector('#e3Estado[data-estado="verificado"]',{timeout:15000});
  await elegir(pg,'RP09');const d=await pg.evaluate(()=>({oculta:document.getElementById('e3Preview').hidden,hijos:document.getElementById('e3Preview').childElementCount,cand:!!__e3.candidato,sel:__e3.sel}));
  ok(d.oculta&&d.hijos===0&&!d.cand&&d.sel==='RP09',JSON.stringify(d));return d;});
 await caso(nav,'UI-19','Preparación en vuelo (lectura retenida, sin temporizadores): cambiar de receta la descarta; no aparece, no queda «ocupado» ni roba el foco',async()=>{
  await pg.evaluate(()=>{const P=FloorPlanPersistence,orig=P.readConfirmed.bind(P);window.__retenidas=[];
   P.readConfirmed=()=>new Promise((res,rej)=>window.__retenidas.push(()=>orig().then(res,rej)));window.__soltar=()=>{const a=window.__retenidas.splice(0);a.forEach(f=>f());return a.length;};});
  await elegir(pg,'RP10');await pg.click('#e3Prepare');await pg.waitForFunction(()=>__e3.ocupado&&window.__retenidas.length>0);
  await elegir(pg,'RP09');const foco0=await pg.evaluate(()=>document.activeElement?.value||document.activeElement?.id);
  for(let i=0;i<6;i++){await pg.evaluate(()=>window.__soltar());await pg.waitForTimeout(50);}
  const d=await pg.evaluate(()=>({cand:!!__e3.candidato,ocupado:__e3.ocupado,sel:__e3.sel,aviso:__e3.aviso,preview:document.getElementById('e3Preview').hidden,cancelar:!!document.getElementById('e3Cancel'),foco:document.activeElement?.value||document.activeElement?.id}));
  await pg.evaluate(()=>{window.__soltar();});
  ok(!d.cand&&!d.ocupado&&d.sel==='RP09'&&!d.aviso&&d.preview&&!d.cancelar&&d.foco===foco0,JSON.stringify(d));return d;});
 await s.ctx.close();
 // ---------- residual E3-D: tomas reales con la autoridad del editor (FloorPlanProjectViews.prepare, takenAt = Date)
 s=await abrir(browser,port);pg=s.pg;await crearCopia(pg);
 await caso(nav,'UI-21','Adaptador REAL del editor de extremo a extremo: repetir la captura de vistas caduca RP07 (usa vistas) y no RP10; toma con identidad ISO',async()=>{
  const toma=async()=>{const antes=await pg.evaluate(()=>FloorPlanProjectViews.takenAt?.getTime?.()??null);
   await pg.evaluate(()=>{FloorPlanProjectViews.prepare();});// API real del editor (la misma que «Imágenes → Preparar vistas»)
   await pg.waitForFunction(a=>FloorPlanProjectViews.status()==='ready'&&FloorPlanProjectViews.takenAt?.getTime()!==a,antes,{timeout:90000});
   return pg.evaluate(()=>{const v=RubikStudioE3.vistasDesde(FloorPlanProjectViews);return {raw:Object.prototype.toString.call(FloorPlanProjectViews.takenAt),takenAt:v.id?.takenAt,n:v.n,estado:v.estado};});};
  const reverificar=async()=>{await pg.evaluate(()=>document.getElementById('e3Reverify').click());
   await pg.waitForFunction(()=>__e3.verificacion&&!__e3.verificando&&!__e3.leyendo,null,{timeout:30000});return pg.evaluate(()=>({estado:__e3.verificacion.estado,motivo:__e3.verificacion.motivo,cambiadas:__e3.verificacion.cambiadas||null}));};
  const t1=await toma();ok(t1.estado==='ready'&&t1.raw==='[object Date]'&&/Z$/.test(t1.takenAt||'')&&t1.n>0,JSON.stringify(t1));
  await entregar(pg);await dialogo(pg);
  await elegir(pg,'RP07');await pg.click('#e3Prepare');await pg.waitForSelector('#e3Estado[data-estado="verificado"]',{timeout:30000});
  const vig=await pg.evaluate(()=>Object.keys(__e3.candidato.congelado.vigencia).join());ok(vig==='vistas3d',vig);
  const t2=await toma();ok(t2.takenAt!==t1.takenAt,'misma toma');
  const v7=await reverificar();ok(v7.estado==='verificado-desactualizado'&&v7.motivo==='desactualizado-fuente'&&v7.cambiadas?.join()==='vistas3d',JSON.stringify(v7));
  await shot(pg,'e3-toma-repetida-rp07',nav);
  await elegir(pg,'RP10');await pg.click('#e3Prepare');await pg.waitForSelector('#e3Estado[data-estado="verificado"]',{timeout:30000});
  const t3=await toma();ok(t3.takenAt!==t2.takenAt,'misma toma 3');
  const v10=await reverificar();ok(v10.estado==='verificado',JSON.stringify(v10));
  ok(!s.errores.length&&!s.externas.length,s.errores.concat(s.externas).join(' | '));
  return {toma1:t1.takenAt,toma2:t2.takenAt,toma3:t3.takenAt,vistas:t1.n,RP07:v7,RP10:v10};});
 await s.ctx.close();
 s=await abrir(browser,port,{qa:false});pg=s.pg;
 await caso(nav,'UI-20','Sin la bandera de laboratorio no existe ninguna interfaz de diagnóstico (window.__e3)',async()=>{
  await entregar(pg);await pg.click('#e3Open');await pg.waitForSelector('#e3Dialog[open]');const d=await pg.evaluate(()=>({diag:'__e3' in window,api:Object.keys(window.RubikStudioE3UI||{})}));
  ok(!d.diag&&d.api.join()==='card,open',JSON.stringify(d));return d;});
 await s.ctx.close();
 s=await abrir(browser,port,{host:'127.0.0.1'});pg=s.pg;
 await caso(nav,'UI-17','Fuera del origen de prueba: aviso «c1-origen» y ninguna receta preparable',async()=>{
  await entregar(pg);await dialogo(pg);const d=await pg.evaluate(()=>({motivo:__e3.lectura.motivo,code:document.querySelector('#e3Dialog .e3-read [data-code]')?.dataset.code,preparables:document.querySelectorAll('#e3Dialog [data-estado^="preparable"]').length}));
  ok(d.motivo==='c1-origen'&&d.code==='c1-origen'&&d.preparables===0,JSON.stringify(d));await shot(pg,'e3-origen-no-prueba',nav);return d;});
 await s.ctx.close();
}

srv.listen(0,async()=>{
 const port=srv.address().port;const entornos=[];
 for(const nav of (process.env.E3_NAV?process.env.E3_NAV.split(','):['chromium','firefox','webkit'])){
  let browser;try{browser=await pw[nav].launch();}catch(e){entornos.push({navegador:nav,estado:'NOT_RUN',motivo:String(e.message).split('\n')[0].slice(0,200)});rec(nav,'*','Suite completa','NOT_RUN','Navegador no instalado en el contenedor; no se descarga (política del entorno).');continue;}
  entornos.push({navegador:nav,version:browser.version(),estado:'RUN'});
  try{await suite(browser,nav,port);}finally{await browser.close();}
 }
 srv.close();
 const cuenta=r=>casos.filter(c=>c.resultado===r).length;
 const o={schema:'rubik-lab-e3-ui-qa/1',fecha:new Date().toISOString(),copia:'master 130ba24 + e3/rubik-130ba24-e3.patch (aislada)',origen:'http://f0-2b.localhost (y 127.0.0.1 para UI-17)',
  entorno:{node:process.version,playwright:require('playwright/package.json').version,so:process.platform,emulacion:'viewport + táctil emulado; no son dispositivos físicos ni Safari real'},entornos,
  resumen:{PASS:cuenta('PASS'),FAIL:cuenta('FAIL'),SKIP:cuenta('SKIP'),NOT_RUN:cuenta('NOT_RUN')},casos,capturas};
 fs.writeFileSync(OUT,JSON.stringify(o,null,1)+'\n');console.log(JSON.stringify(o.resumen),JSON.stringify(entornos));for(const c of casos)if(c.resultado==='FAIL')console.log(c.navegador,c.id,c.detalle);
 process.exit(cuenta('FAIL')?2:0);
});
