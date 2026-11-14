'use strict';
/* NAV3D V1 · grabación de los dos recorridos del corte 2a en el editor REAL (Playwright + Chromium, recordVideo).
   Solo se actúa con los controles visibles (clics, selección, teclado, dedo por CDP); las lecturas de estado son
   comprobaciones posteriores. Datos SINTÉTICOS (piso de ejemplo). Salida (no se versiona; se publica como artefacto de CI):
     qa-results/nav3d/video/nav3d-escritorio-1440x900.webm  (+ .mp4 si hay ffmpeg)
     qa-results/nav3d/video/nav3d-movil-390x844.webm        (+ .mp4 si hay ffmpeg)
     qa-results/nav3d/video/manifest.json                    (HEAD, pasos, comprobaciones, ffprobe)
   Uso: CHROME=… [THREE_LOCAL_DIR=vendor/three] node scripts/qa/record-nav3d-v1.cjs */
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const K=require('../../tests/nav3d/kit.cjs');
const OUT=path.resolve(__dirname,'../../qa-results/nav3d/video');
const sh=(cmd,args)=>{try{return execFileSync(cmd,args,{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{return null;}};
const pause=(page,ms=700)=>page.waitForTimeout(ms);

async function journey(env,{name,viewport,mobile}){
  const steps=[],check=(step,ok,detail)=>{steps.push({step,ok:!!ok,detail});if(!ok)throw Error(`${name}: ${step} — ${detail}`);};
  const context=await env.browser.newContext({viewport,...(mobile?{isMobile:true,hasTouch:true}:{}),recordVideo:{dir:OUT,size:viewport}});
  const page=await context.newPage(),video=page.video(),w=K.watch(page,env.base);
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  const press=async sel=>{const l=page.locator(sel).first();if(mobile)await l.tap();else await l.click();};
  try{
    await page.goto(env.base);await require('../../tests/editor-fixture.cjs')(page);
    const before=await K.snapshot(page);
    // 1 · Entrada al 3D y al panel de navegación.
    await press('#viewSeg .btn[data-view="3d"]');
    await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!View3D.lifecycleMetrics.animating&&!document.querySelector('#nav3d').hidden,null,{timeout:60000});await pause(page,1200);
    if(mobile){await press('#nav3dToggle');await pause(page);}
    check('panel de navegación visible',await page.locator('#nav3dBody').isVisible(),'Navegación abierta');
    // 2 · Estancia elegida en el selector (nombres del proyecto).
    const room=await page.locator('#nav3dRoom option',{hasText:'Salón'}).first().getAttribute('value');
    await page.locator('#nav3dRoom').selectOption(room);
    await page.waitForFunction(()=>/Encuadre de «Salón»/.test(document.querySelector('#nav3dStatus').textContent)&&!View3D.navState.busy,null,{timeout:60000});await pause(page,1500);
    check('encuadre de estancia',true,await page.locator('#nav3dStatus').innerText());
    // 3 · Maqueta blanca y vuelta a los acabados.
    await press('#nav3dWhite');await page.waitForFunction(()=>View3D.navState.white);await pause(page,1500);
    check('maqueta blanca',await page.locator('#nav3dWhite').getAttribute('aria-pressed')==='true',`${await page.evaluate(()=>View3D.navState.whiteMeshes)} mallas en blanco`);
    await press('#nav3dFinishes');await page.waitForFunction(()=>!View3D.navState.white);await pause(page,1000);
    check('acabados restaurados',true,'Acabados');
    // 4 · Puertas: cerrar todas y volver a abrir.
    await press('#nav3dDoors');await page.waitForFunction(()=>View3D.walkDoors.every(d=>!d.open));await pause(page,1500);
    check('cerrar todas las puertas',/0 de \d+ abiertas/.test(await page.locator('#nav3dDoorInfo').innerText()),await page.locator('#nav3dDoorInfo').innerText());
    await press('#nav3dDoors');await page.waitForFunction(()=>View3D.walkDoors.every(d=>d.open));await pause(page,1200);
    check('abrir todas las puertas',/(\d+) de \1 abiertas/.test(await page.locator('#nav3dDoorInfo').innerText()),await page.locator('#nav3dDoorInfo').innerText());
    // 5 · Paseo con minimapa: avanzar y ver cómo se mueve el marcador.
    await press('#nav3dMode-walk');await page.waitForFunction(()=>View3D.walking()&&!View3D.navState.busy);await pause(page,800);
    await press('#walkStart');
    await page.waitForFunction(()=>!document.querySelector('#nav3dMap').hidden&&RubikNav3D.marker.state==='ok',null,{timeout:60000});
    const p0=await page.evaluate(()=>View3D.walkPose());
    if(mobile){const j=await K.box(page,'#joy'),cx=j.left+j.width/2,cy=j.top+j.height/2,cdp=await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1}]});
      for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx,y:cy-i*9,id:1}]});
      await page.waitForFunction(p0=>{const p=View3D.walkPose();return Math.hypot(p.x-p0.x,p.y-p0.y)>600;},p0,{timeout:60000});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
    else{await page.keyboard.down('KeyW');await page.waitForFunction(p0=>{const p=View3D.walkPose();return Math.hypot(p.x-p0.x,p.y-p0.y)>600;},p0,{timeout:60000});await page.keyboard.up('KeyW');}
    await pause(page,1500);
    const m=await page.evaluate(()=>RubikNav3D.marker);
    check('minimapa sigue al paseo',m.state==='ok'&&!m.hidden,`${m.caption} · ${m.transform}`);
    // 6 · Retorno: salir del paseo y volver al plano 2D con el proyecto intacto.
    if(mobile)await press('#walkExit');else{await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.pointerLockElement);await press('#nav3dToggle');await press('#nav3dMode-interior');}
    await page.waitForFunction(()=>!View3D.walking()&&!View3D.navState.busy&&document.querySelector('#nav3dMap').hidden,null,{timeout:60000});await pause(page,1500);
    check('salida del paseo',true,'minimapa retirado');
    await press('#viewSeg .btn[data-view="2d"]');await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d');await pause(page,1500);
    check('proyecto intacto al volver al editor',JSON.stringify(await K.snapshot(page))===JSON.stringify(before),'proyecto, historial y biblioteca iguales');
    check('sin errores ni red externa',!w.errors.length&&!w.external.length,JSON.stringify({errors:w.errors,external:w.external}));
  }finally{await context.close();}
  const file=path.join(OUT,`nav3d-${name}-${viewport.width}x${viewport.height}.webm`);fs.renameSync(await video.path(),file);
  return {name,viewport,file:path.basename(file),steps};
}

function probe(file){
  const json=sh('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height:format=duration,size','-of','json',file]);
  if(!json)return {ffprobe:false};
  const d=JSON.parse(json),s=d.streams?.[0]||{};return {ffprobe:true,codec:s.codec_name,width:s.width,height:s.height,durationS:+(+d.format?.duration||0).toFixed(2),bytes:+d.format?.size||fs.statSync(file).size};
}

(async()=>{
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
  const env=await K.start();const runs=[];
  try{
    runs.push(await journey(env,{name:'escritorio',viewport:{width:1440,height:900}}));
    runs.push(await journey(env,{name:'movil',viewport:{width:390,height:844},mobile:true}));
  }finally{await env.stop();}
  for(const r of runs){
    const webm=path.join(OUT,r.file);r.webm=probe(webm);
    if(!r.webm.ffprobe){r.webm={ffprobe:false,bytes:fs.statSync(webm).size};continue;}
    if(!(r.webm.durationS>0&&r.webm.width===r.viewport.width&&r.webm.height===r.viewport.height))throw Error(`vídeo no válido ${r.file}: ${JSON.stringify(r.webm)}`);
    // Decodificación completa: el vídeo se puede reproducir de principio a fin.
    r.playable=sh('ffmpeg',['-v','error','-i',webm,'-f','null','-'])!==null;
    const mp4=webm.replace(/\.webm$/,'.mp4');
    if(sh('ffmpeg',['-y','-v','error','-i',webm,'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',mp4])!==null&&fs.existsSync(mp4))r.mp4={file:path.basename(mp4),...probe(mp4)};
  }
  const manifest={purpose:'NAV3D V1 · recorridos del corte 2a en el editor real',head:sh('git',['rev-parse','HEAD']),createdAt:new Date().toISOString(),
    data:'piso de ejemplo sintético; sin fotos ni datos de clientes',runs};
  fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(manifest,null,2));
  console.log(JSON.stringify(manifest,null,2));
})().catch(e=>{console.error(e);process.exit(1);});
