'use strict';
/* OBR-01 · capturas de evidencia (no es una prueba): escritorio 1440×900 y móvil 390×844 (toque real) del panel de un
   muro de carga de T02 seleccionado con el puntero, y del expediente con PNOA/MDT05 «solo metadatos». Obra sintética.
   Uso: node tests/obr01/capture-evidence.cjs <carpeta> */
const path=require('node:path'),fs=require('node:fs/promises'),crypto=require('node:crypto');
const K=require('./browser-kit.cjs'),TERR=require('../fixtures/territorial-integration.cjs');
const OUT=path.resolve(process.argv[2]||'docs/qa/obr01-ft3d8-2026-11-12/evidencias');
(async()=>{const env=await K.start(),manifest=[];await fs.mkdir(OUT,{recursive:true});
 const shot=async(page,name,meta)=>{const f=path.join(OUT,name+'.png');await page.screenshot({path:f});const b=await fs.readFile(f);manifest.push({archivo:name+'.png',sha256:crypto.createHash('sha256').update(b).digest('hex'),bytes:b.length,...meta});};
 for(const [label,opts] of [['escritorio-1440x900',{viewport:{width:1440,height:900}}],['movil-390x844',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}]]){
  const s=await K.openEvolution(env,opts),key='project/wal_ref-w0';
  for(const lk of [['2027-05-13','top',false],['2027-05-13','iso',false],['2027-03-24','iso',true]]){
   const p=await s.page.evaluate(async([k,[d,v,roof]])=>{const F=window.__ft3dFidelity;F.setDate(d);document.querySelector(`[data-view="${v}"]`).click();const rt=document.getElementById('roofToggle');if(rt.checked!==roof)rt.click();await new Promise(r=>setTimeout(r,600));
     const c=document.getElementById('stage').getBoundingClientRect(),b=F.scene.screenBounds(k,{exact:true});if(!b)return null;F.scene.highlight([]);
     for(let i=0;i<=12;i++)for(let j=0;j<=12;j++){const nx=b.x0+(b.x1-b.x0)*i/12,ny=b.y0+(b.y1-b.y0)*j/12,x=c.left+(nx+1)/2*c.width,y=c.top+(1-ny)/2*c.height;if(x>c.left&&x<c.right&&y>c.top&&y<c.bottom&&F.scene.pick(x,y)===k)return {x,y};}return null;},[key,lk]);
   if(!p)continue;if(opts.hasTouch)await s.page.touchscreen.tap(p.x,p.y);else await s.page.mouse.click(p.x,p.y);await s.page.waitForTimeout(500);
   const key2=await s.page.evaluate(()=>{const b=document.getElementById('pickInfo');b.scrollIntoView?.({block:'nearest'});return b.hidden?null:b.dataset.key;});
   await shot(s.page,`ex05-3-muro-carga-T02-${label}`,{escenario:'EX-05.3',vista:lk.join('/'),panel:key2,puntero:opts.hasTouch?'toque':'ratón'});break;}
  await s.context.close();}
 const T=TERR.build(),s=await K.openEvolution(env,{fixture:{building:T.building,tasks:[{id:'T01',wbs:'01',titulo:'Muros',inicio:'2027-03-01',fin:'2027-03-20',deps:[],elementos:{tipo:'wall',rol:'build',n:6}}]}});
 await s.page.evaluate(()=>{[...document.querySelectorAll('button')].find(x=>/^Proyecto$/.test(x.textContent.trim()))?.click();document.querySelectorAll('details').forEach(d=>d.open=true);});
 await s.page.waitForTimeout(500);await s.page.evaluate(()=>{const n=[...document.querySelectorAll('p')].find(p=>/Ortofoto\/terreno: solo metadatos/.test(p.textContent));n?.scrollIntoView({block:'center'});n&&(n.style.outline='3px solid #c33');});
 await shot(s.page,'ex09-10-pnoa-mdt05-solo-metadatos-escritorio-1440x900',{escenario:'EX-09.10',peticionesExternas:s.watch.external.length});await s.context.close();
 await fs.writeFile(path.join(OUT,'manifest.json'),JSON.stringify({generado:new Date().toISOString(),navegador:'Chromium (Playwright, SwiftShader)',datos:'obra sintética del examen FT3D-8; fixture territorial sintética',evidencias:manifest},null,1));
 await env.stop();console.log(JSON.stringify(manifest,null,1));})();
