'use strict';
/* Integración OBR-02/03 · recorrido visual sobre la Preview de revisión de Vercel (rama
   review/obr02-obr03-integration-20261112), con datos SINTÉTICOS cargados por review-obr02/. No es prueba de CI.
   Uso: node tests/obr02/preview-walkthrough.cjs "<url de review-obr02/index.html?_vercel_share=…>" [carpeta] */
const path=require('node:path'),fs=require('node:fs/promises'),crypto=require('node:crypto'),{chromium}=require('playwright');
const START=process.argv[2];if(!START)throw Error('Falta la URL de la Preview');
const OUT=path.resolve(process.argv[3]||'docs/integration/evidencias-obr02-obr03-2026-11-12');
const proxy=process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined;
(async()=>{await fs.mkdir(OUT,{recursive:true});const origin=new URL(START).origin,log=[],shots=[];
  const browser=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),proxy,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const shot=async(page,name,meta={})=>{const f=path.join(OUT,name+'.png');await page.screenshot({path:f});const b=await fs.readFile(f);shots.push({archivo:name+'.png',sha256:crypto.createHash('sha256').update(b).digest('hex'),...meta});};
  const ready=page=>page.waitForFunction(()=>window.__ft3dFidelity?.ctx&&document.body.classList.contains('ready'),null,{timeout:120000});
  const open=async(page,label)=>{await page.goto(START);await Promise.all([page.waitForURL(/evolucion\/index\.html/),page.getByRole('button',{name:label}).click()]);await ready(page);
    await page.evaluate(()=>[...document.querySelectorAll('button')].find(x=>/Ver evolución/.test(x.textContent))?.click());await page.waitForTimeout(600);};
  const at=(page,d,v,roofHidden)=>page.evaluate(async([d,v,roof])=>{const F=window.__ft3dFidelity;F.scene.setAuto(false);F.setDate(d);document.querySelector(`[data-view="${v}"]`).click();
    const rt=document.getElementById('roofToggle');if(rt&&rt.checked===roof)rt.click();document.querySelector('.plan-preview .pp-next-d').open=true;await new Promise(r=>setTimeout(r,800));},[d,v,roofHidden]);
  const panel=page=>page.evaluate(()=>{const s=window.__ft3dPlanPreview.snapshot;return {pct:s.progress?.percent??null,cost:s.cost.status,amount:s.cost.amount,total:s.cost.plannedTotal??null,next:s.next?.tasks?.map(t=>t.wbs)||null,ghost:window.__ft3dFidelity.scene.preview.shown,
    text:document.querySelector('.plan-preview').innerText.replace(/\s+/g,' ').slice(0,300)};});
  for(const [label,opts] of [['escritorio-1440x900',{viewport:{width:1440,height:900}}],['movil-390x844',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}]]){
    const context=await browser.newContext({...opts,ignoreHTTPSErrors:true});const page=await context.newPage();page.setDefaultTimeout(60000);
    const errors=[],external=new Set();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
    page.on('request',r=>{const u=r.url();if(!u.startsWith(origin)&&!/^(data|blob):/.test(u))external.add(new URL(u).host);});
    await page.goto(START);await shot(page,`0-pagina-revision-${label}`);
    // 1 · con presupuesto: anillo, coste planificado, siguiente tarea en fantasma.
    await open(page,'Cargar y abrir con presupuesto');await at(page,'2027-04-14','iso',false);let p=await panel(page);
    log.push({paso:'con presupuesto · % plan, coste planificado y fantasma de la siguiente tarea',viewport:label,...p,ok:p.cost==='available'&&p.amount>0&&p.ghost>0&&/planificado/.test(p.text)&&/Ejecutado: sin registrar/.test(p.text)});
    await shot(page,`1-con-presupuesto-siguiente-en-fantasma-${label}`,{pct:p.pct,coste:p.amount});
    // 2 · OBR-01 con el fantasma encendido: clic/toque real en un muro de carga → su ficha.
    await at(page,'2027-04-14','top',true);const key='project/wal_ref-w0';
    const pt=await page.evaluate(k=>{const F=window.__ft3dFidelity,c=document.getElementById('stage').getBoundingClientRect(),b=F.scene.screenBounds(k,{exact:true});if(!b)return null;
      for(let i=0;i<=12;i++)for(let j=0;j<=12;j++){const nx=b.x0+(b.x1-b.x0)*i/12,ny=b.y0+(b.y1-b.y0)*j/12,x=c.left+(nx+1)/2*c.width,y=c.top+(1-ny)/2*c.height;if(x>c.left&&x<c.right&&y>c.top&&y<c.bottom&&F.scene.pick(x,y)===k)return {x,y};}return null;},key);
    const ghostOn=(await panel(page)).ghost;
    if(pt){if(opts.hasTouch)await page.touchscreen.tap(pt.x,pt.y);else await page.mouse.click(pt.x,pt.y);await page.waitForTimeout(500);}
    const sel=await page.evaluate(()=>{const b=document.getElementById('pickInfo');return b.hidden?null:b.dataset.key;});
    log.push({paso:'OBR-01 · clic real en muro de carga con el fantasma encendido',viewport:label,fantasma:ghostOn,panel:sel,ok:ghostOn>0&&sel===key});
    await shot(page,`2-muro-carga-con-fantasma-${label}`,{panel:sel});
    // 3 · sin presupuesto: «No disponible», nunca 0.
    await open(page,'Cargar y abrir sin presupuesto');await at(page,'2027-04-14','iso',false);p=await panel(page);
    log.push({paso:'sin presupuesto · coste «No disponible»',viewport:label,...p,ok:p.cost==='unavailable'&&p.amount===null&&/No disponible/.test(p.text)&&!/0,00\s*€/.test(p.text)});
    await shot(page,`3-sin-presupuesto-no-disponible-${label}`);
    log.push({paso:'errores de la página',viewport:label,errores:errors,ok:errors.length===0});
    log.push({paso:'hosts externos',viewport:label,hosts:[...external]});
    await context.close();}
  await browser.close();
  await fs.writeFile(path.join(OUT,'manifest.json'),JSON.stringify({generado:new Date().toISOString(),preview:origin,rama:'review/obr02-obr03-integration-20261112',datos:'sintéticos; precios FICTICIOS',navegador:'Chromium (Playwright, SwiftShader) en la nube, no un dispositivo físico',pasos:log,capturas:shots},null,1));
  console.log(JSON.stringify(log.map(({text,...x})=>x),null,1));
})().catch(e=>{console.error(e);process.exit(1);});
