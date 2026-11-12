'use strict';
/* OBR-01 · recorrido visual sobre la Preview de revisión de Vercel (rama review/obr01-ft3d8-20261112), con datos
   SINTÉTICOS cargados por review-obr01/. No es una prueba de CI: necesita la URL de la Preview (enlace de acceso
   temporal). Uso: node tests/obr01/preview-walkthrough.cjs "<url de review-obr01/index.html?_vercel_share=…>" [carpeta] */
const path=require('node:path'),fs=require('node:fs/promises'),crypto=require('node:crypto'),{chromium}=require('playwright');
const START=process.argv[2];if(!START)throw Error('Falta la URL de la Preview');
const OUT=path.resolve(process.argv[3]||'docs/qa/obr01-ft3d8-2026-11-12/evidencias/preview');
const proxy=process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined;
(async()=>{await fs.mkdir(OUT,{recursive:true});const origin=new URL(START).origin,log=[],shots=[];
  const browser=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),proxy,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const shot=async(page,name,meta={})=>{const f=path.join(OUT,name+'.png');await page.screenshot({path:f});const b=await fs.readFile(f);shots.push({archivo:name+'.png',sha256:crypto.createHash('sha256').update(b).digest('hex'),...meta});};
  // Punto de pantalla donde el raycast real devuelve la clave (rejilla dentro de su caja en pantalla).
  const pointOf=(page,k)=>page.evaluate(k=>{const F=window.__ft3dFidelity,c=document.getElementById('stage').getBoundingClientRect(),b=F.scene.screenBounds(k,{exact:true});if(!b)return null;
    for(let i=0;i<=12;i++)for(let j=0;j<=12;j++){const nx=b.x0+(b.x1-b.x0)*i/12,ny=b.y0+(b.y1-b.y0)*j/12,x=c.left+(nx+1)/2*c.width,y=c.top+(1-ny)/2*c.height;if(x>c.left&&x<c.right&&y>c.top&&y<c.bottom&&F.scene.pick(x,y)===k)return {x,y};}return null;},k);
  const ready=page=>page.waitForFunction(()=>window.__ft3dFidelity?.ctx&&document.body.classList.contains('ready'),null,{timeout:120000});
  const showEvolution=async page=>{await page.evaluate(()=>[...document.querySelectorAll('button')].find(x=>/Ver evolución/.test(x.textContent))?.click());await page.waitForTimeout(800);};
  for(const [label,opts] of [['escritorio-1440x900',{viewport:{width:1440,height:900}}],['movil-390x844',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}]]){
    const context=await browser.newContext({...opts,ignoreHTTPSErrors:true});const page=await context.newPage();page.setDefaultTimeout(60000);
    const errors=[],external=new Set();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
    page.on('request',r=>{const u=r.url();if(!u.startsWith(origin)&&!/^(data|blob):/.test(u))external.add(new URL(u).host);});
    await page.goto(START);await shot(page,`0-pagina-revision-${label}`,{paso:'página de revisión con datos sintéticos'});
    // 1 · vivienda: clic (o toque) real sobre un muro de carga de T02.
    await Promise.all([page.waitForURL(/evolucion\/index\.html/),page.getByRole('button',{name:'Cargar y abrir la vivienda'}).click()]);await ready(page);await showEvolution(page);
    const key='project/wal_ref-w0';let picked=null;
    for(const [d,v,roof] of [['2027-05-13','top',false],['2027-05-13','iso',false],['2027-03-24','iso',true]]){
      await page.evaluate(async([d,v,roof])=>{const F=window.__ft3dFidelity;F.setDate(d);document.querySelector(`[data-view="${v}"]`).click();const rt=document.getElementById('roofToggle');if(rt.checked!==roof)rt.click();await new Promise(r=>setTimeout(r,700));},[d,v,roof]);
      const p=await pointOf(page,key);if(!p)continue;if(opts.hasTouch)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);await page.waitForTimeout(600);
      picked=await page.evaluate(()=>{const b=document.getElementById('pickInfo');b.scrollIntoView?.({block:'nearest'});return b.hidden?null:{key:b.dataset.key,text:b.innerText.slice(0,120)};});break;}
    log.push({paso:'EX-05.3 clic real en muro de carga',viewport:label,esperado:key,panel:picked?.key??null,ok:picked?.key===key});
    await shot(page,`1-muro-carga-T02-${label}`,{paso:'EX-05.3',panel:picked?.key??null});
    // 2 · movimiento reducido: AUTO quieto con la preferencia; gira sin ella.
    // Cierra la ficha del elemento (como haría una persona) y lleva los botones de cámara a la vista.
    await page.evaluate(()=>{document.querySelector('#pickInfo [data-pick-close]')?.click();document.querySelector('[data-view="auto"]')?.scrollIntoView({block:'center'});});await page.waitForTimeout(300);
    const auto=()=>page.evaluate(()=>document.querySelector('[data-view="auto"]').click());
    const pose=()=>page.evaluate(()=>JSON.stringify(window.__ft3dFidelity.pose.position.map(v=>v.toFixed(4))));
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.__ft3dFidelity.scene.reducedMotion===true);
    await auto();await page.waitForTimeout(400);const a0=await pose();await page.waitForTimeout(1500);const a1=await pose();
    await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>window.__ft3dFidelity.scene.reducedMotion===false);
    await auto();await page.waitForTimeout(400);const b0=await pose();await page.waitForTimeout(1500);const b1=await pose();
    log.push({paso:'EX-11-k.6 AUTO con «reducir movimiento»',viewport:label,quietoConPreferencia:a0===a1,giraSinPreferencia:b0!==b1,ok:a0===a1&&b0!==b1});
    // 3 · edificio con PNOA/MDT05 solo como metadatos (solo en escritorio).
    if(label.startsWith('escritorio')){
      await page.goto(START);await Promise.all([page.waitForURL(/evolucion\/index\.html/),page.getByRole('button',{name:'Cargar y abrir el edificio'}).click()]);await ready(page);
      await page.evaluate(()=>{[...document.querySelectorAll('button,[role=tab]')].find(x=>/^Proyecto$/.test(x.textContent.trim()))?.click();document.querySelectorAll('details').forEach(d=>d.open=true);});await page.waitForTimeout(600);
      const meta=await page.evaluate(()=>{const n=[...document.querySelectorAll('p')].find(p=>/Ortofoto\/terreno: solo metadatos/.test(p.textContent));n?.scrollIntoView({block:'center'});if(n)n.style.outline='3px solid #c33';return !!n;});
      log.push({paso:'EX-09.10 PNOA/MDT05 solo metadatos',viewport:label,ok:meta});await shot(page,`2-pnoa-mdt05-solo-metadatos-${label}`,{paso:'EX-09.10'});
    }
    log.push({paso:'errores de la página',viewport:label,errores:errors,ok:errors.length===0});
    log.push({paso:'hosts externos',viewport:label,hosts:[...external],nota:'vercel.live es la barra de comentarios que Vercel inyecta en las Preview; la app no pide nada externo'});
    await context.close();}
  await browser.close();
  const manifest={generado:new Date().toISOString(),preview:origin,rama:'review/obr01-ft3d8-20261112',datos:'sintéticos (review-obr01/obra.js)',navegador:'Chromium (Playwright, SwiftShader) en la nube, no un dispositivo físico',pasos:log,capturas:shots};
  await fs.writeFile(path.join(OUT,'manifest.json'),JSON.stringify(manifest,null,1));console.log(JSON.stringify(log,null,1));
})().catch(e=>{console.error(e);process.exit(1);});
