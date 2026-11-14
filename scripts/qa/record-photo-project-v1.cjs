'use strict';
/* De fotografía a proyecto V1 (MUE-01 + FOT-01) · grabación de los recorridos en el editor REAL (Playwright + Chromium,
   recordVideo). Solo se actúa con los controles visibles (formularios, archivos, clics, dedo por CDP, teclado, menús);
   las lecturas de estado son comprobaciones POSTERIORES. Fotos SINTÉTICAS dibujadas por Chromium (formas y colores, sin
   personas ni datos reales); la «ubicación» EXIF es inventada y se comprueba que no sobrevive. Ningún proveedor: FOT-01
   solo tiene el adaptador SIMULADO, rotulado. Salida (no se versiona; se publica como artefacto de CI):
     qa-results/photo-project-v1/video/mue01-escritorio-1440x900.webm      (+ .mp4 solo si ffmpeg lo crea)
     qa-results/photo-project-v1/video/mue01-fot01-movil-390x844.webm     (+ .mp4 solo si ffmpeg lo crea)
     qa-results/photo-project-v1/screens/*.png                             (MUE-01 2D/3D y cotas; FOT-01 original y simulación)
     qa-results/photo-project-v1/manifest.json                             (HEAD, pasos, resoluciones, resultados, errores, ffprobe)
   Uso: CHROME=… [THREE_LOCAL_DIR=vendor/three] node scripts/qa/record-photo-project-v1.cjs */
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const K=require('../../tests/photo-project/kit.cjs');
const OUT=path.resolve(__dirname,'../../qa-results/photo-project-v1'),VID=path.join(OUT,'video'),SCR=path.join(OUT,'screens');
const sh=(cmd,args)=>{try{return execFileSync(cmd,args,{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{return null;}};
const pause=(page,ms=700)=>page.waitForTimeout(ms);
const EXT='x-mue01-furniture-photo';
const selObj=page=>page.evaluate(()=>{const id=ui.sel?.id;const o=FloorPlanApp.project.objects.find(x=>x.id===id);return o&&structuredClone(o);});

function recorder(name){
  const steps=[],shots=[];
  return {steps,shots,
    check(step,ok,detail){steps.push({step,ok:!!ok,detail});if(!ok)throw Error(`${name}: ${step} — ${detail}`);},
    async shot(page,file,what){await page.screenshot({path:path.join(SCR,file)});shots.push({file:`screens/${file}`,what});}};
}
async function openContext(env,{viewport,mobile,video,scale=1}){
  const context=await env.browser.newContext({viewport,deviceScaleFactor:scale,acceptDownloads:true,...(mobile?{isMobile:true,hasTouch:true}:{}),...(video?{recordVideo:{dir:VID,size:viewport}}:{})});
  const page=await context.newPage(),w=K.watch(page,env.base);
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  const api=[];page.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url());});
  await page.goto(env.base);await require('../../tests/editor-fixture.cjs')(page);
  await page.waitForFunction(()=>!!window.RubikOwnFurniture&&!!window.RubikPhotoReform&&!!window.FloorPlanApp?.addOwnFurniture);
  return {context,page,w,api,video:video?page.video():null};
}
async function openOwn(page,mobile){
  if(mobile&&!(await page.locator('aside.lib.open').count())){await page.locator('#tgLib').tap();await page.locator('aside.lib.open').waitFor();await pause(page,500);}
  const tab=page.locator('#paletteTabFurnish');if(await tab.getAttribute('aria-selected')!=='true'){await (mobile?tab.tap():tab.click());await pause(page,500);}
  await page.locator('#ownFurnOpen').scrollIntoViewIfNeeded();await pause(page,400);
  await (mobile?page.locator('#ownFurnOpen').tap():page.locator('#ownFurnOpen').click());await page.locator('#ownFurnDialog[open]').waitFor();await pause(page);
}
async function fillOwn(page,{name,type,w,d,h,rot='0',photo}){
  await page.locator('#ownFurn-name').fill(name);await pause(page,300);await page.locator('#ownFurn-type').selectOption(type);await pause(page,300);
  await page.locator('#ownFurn-photo').setInputFiles(K.file(...photo));
  await page.waitForFunction(()=>!/Preparando/.test(document.querySelector('#ownFurnStatus').textContent));await pause(page,500);
  for(const [k,v] of [['widthMm',w],['depthMm',d],['heightMm',h],['rotationDeg',rot]]){await page.locator('#ownFurn-'+k).fill(v);await pause(page,250);}
}

// ── Vídeo 1 · escritorio 1440×900: MUE-01 completo ────────────────────────────────────────────────────────────────
async function mueDesktop(env,jpg){
  const viewport={width:1440,height:900},R=recorder('mue01-escritorio');
  const {context,page,w,api,video}=await openContext(env,{viewport,video:true});
  let exported=null,objId=null;
  try{
    const r03r02=await page.evaluate(()=>JSON.stringify([FloorPlanApp.project.extensions?.['x-r03-cabinet']??null,FloorPlanApp.project.extensions?.['x-r02a-ceiling']??null]));
    await pause(page,1200);
    // 1 · Editor → Mobiliario → «Traer mi mueble».
    await openOwn(page,false);R.check('formulario «Traer mi mueble» abierto desde Mobiliario',await page.locator('#ownFurnDialog').isVisible(),'Editor → Mobiliario → Traer mi mueble');
    // 2 · Validación: medidas imposibles no crean nada.
    await page.locator('#ownFurn-widthMm').fill('20');await page.locator('#ownFurnCreate').click();await pause(page,900);
    R.check('medidas fuera de rango rechazadas',/entre 100 y 6000/.test(await page.locator('#ownFurn-widthMm-error').innerText()),await page.locator('#ownFurn-widthMm-error').innerText());
    // 3 · Datos reales del mueble con foto sintética (con EXIF y ubicación falsos).
    await fillOwn(page,{name:'Sofá de la abuela',type:'sofa',w:'2140',d:'920',h:'830',photo:['IMG_0042.jpg',jpg,'image/jpeg']});
    await R.shot(page,'mue01-escritorio-01-formulario.png','Formulario con foto sintética, categoría y medidas en mm');
    await page.locator('#ownFurnCreate').click();await page.locator('#ownFurnDialog').waitFor({state:'hidden'});await pause(page,1200);
    const o=await selObj(page);objId=o.id;
    R.check('volumen creado con las medidas exactas',JSON.stringify(o.size)===JSON.stringify({widthMm:2140,depthMm:920,heightMm:830}),JSON.stringify(o.size));
    const ext=await page.evaluate(e=>structuredClone(FloorPlanApp.project.extensions?.[e]??null),EXT);
    const item=ext?.items?.find(i=>i.objectId===o.id);
    const stored=item?.photo?Buffer.from(await K.storedBytes(page,item.photo.imageKey)||[]):Buffer.alloc(0);
    R.check('foto guardada en este navegador sin EXIF ni ubicación',stored.length>1000&&!stored.includes(Buffer.from('Exif'))&&!stored.includes(Buffer.from(K.FAKE_GPS)),`${stored.length} bytes JPEG recodificado; referencia ${item?.photo?.imageKey?.slice(0,14)}…`);
    R.check('el nombre del archivo no se guarda',!JSON.stringify(ext).includes('IMG_0042'),'solo clave por hash');
    await page.waitForFunction(()=>document.querySelector('#ownFurnPhotoState')?.dataset.state==='ok');await pause(page,800);
    await R.shot(page,'mue01-escritorio-02-creado-2d-antes.png','ANTES: mueble creado en el plano 2D, panel con la foto real y aviso honesto');
    // 4 · Mover en el plano con cotas UX-08.
    const g=page.locator(`#plan g.furn[data-fid="${o.id}"]`),b=await g.boundingBox();
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();
    for(let i=1;i<=12;i++){await page.mouse.move(b.x+b.width/2-i*6,b.y+b.height/2-i*3);await page.waitForTimeout(60);}
    const dims=await page.locator('#gSel .live-dims').count();
    await R.shot(page,'mue01-escritorio-03-cotas-ux08.png','Arrastre con las cotas en vivo de UX-08');
    await page.mouse.up();await pause(page,800);
    const moved=await selObj(page);
    R.check('mover con cotas UX-08',dims>0&&JSON.stringify(moved.position)!==JSON.stringify(o.position)&&JSON.stringify(moved.size)===JSON.stringify(o.size),`cotas=${dims} · ${JSON.stringify(o.position)} → ${JSON.stringify(moved.position)}`);
    await R.shot(page,'mue01-escritorio-04-despues-mover.png','DESPUÉS: mueble movido, mismas medidas');
    // 5 · Rotar, deshacer y rehacer.
    await page.locator('#aRot').click();await pause(page,800);const rot=(await selObj(page)).rotationDeg;
    await page.keyboard.press('Control+z');await pause(page,800);const undo=(await selObj(page)).rotationDeg;
    await page.keyboard.press('Control+Shift+z');await pause(page,800);const redo=(await selObj(page)).rotationDeg;
    R.check('rotar, deshacer y rehacer',rot===90&&undo===0&&redo===90,`${rot}° → deshacer ${undo}° → rehacer ${redo}°`);
    // 5b · Duplicar (Ctrl+D): la copia es otro «mi mueble» con la misma foto; deshacer la retira.
    await page.keyboard.press('Control+d');await page.waitForFunction(()=>document.querySelector('#ownFurnPhotoState')?.dataset.state==='ok');await pause(page,900);
    const copy=await selObj(page),ext2=await page.evaluate(e=>structuredClone(FloorPlanApp.project.extensions?.[e]??null),EXT);
    await R.shot(page,'mue01-escritorio-04b-duplicado.png','Duplicado: la copia conserva medidas y foto de referencia');
    R.check('duplicar conserva medidas y foto',copy.id!==o.id&&JSON.stringify(copy.size)===JSON.stringify(o.size)&&ext2.items.find(i=>i.objectId===copy.id)?.photo?.imageKey===ext2.items.find(i=>i.objectId===o.id)?.photo?.imageKey,`copia ${copy.id.slice(0,12)}… misma clave`);
    await page.keyboard.press('Control+z');await pause(page,800);
    R.check('deshacer el duplicado retira la copia y su referencia',!(await page.evaluate(([e,id])=>FloorPlanApp.project.objects.some(x=>x.id===id)||FloorPlanApp.project.extensions?.[e]?.items.some(i=>i.objectId===id),[EXT,copy.id])),'un paso');
    { const gb=await page.locator(`#plan g.furn[data-fid="${o.id}"]`).boundingBox();await page.mouse.click(gb.x+gb.width/2,gb.y+gb.height/2);await pause(page,500); }
    // 6 · 3D.
    await K.open3D(page);await pause(page,2000);
    const in3d=await page.evaluate(id=>View3D.levelInspect().furniturePlan.find(f=>f.id===id),o.id);
    await R.shot(page,'mue01-escritorio-05-3d.png','Volumen genérico en el 3D con su altura');
    R.check('volumen en el 3D',!!in3d,JSON.stringify(in3d));
    await page.locator('#viewSeg .btn[data-view="2d"]').click();await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d');await pause(page,1000);
    // 7 · Guardar y reabrir: medidas y foto.
    const sizeBefore=JSON.stringify((await selObj(page)).size);
    await K.reopen(page);await page.waitForFunction(id=>FloorPlanApp.project.objects.some(o=>o.id===id),o.id);await pause(page,1200);
    const gr=page.locator(`#plan g.furn[data-fid="${o.id}"]`),br=await gr.boundingBox();await page.mouse.click(br.x+br.width/2,br.y+br.height/2);
    await page.waitForFunction(()=>document.querySelector('#ownFurnPhotoState')?.dataset.state==='ok');await pause(page,1000);
    const sizeAfter=JSON.stringify((await selObj(page)).size);
    await R.shot(page,'mue01-escritorio-06-reabierto.png','Tras guardar y reabrir: medidas y foto siguen');
    R.check('guardar y reabrir conserva medidas y foto',sizeBefore===sizeAfter,`${sizeBefore} → ${sizeAfter} · foto: ${await page.locator('#ownFurnPhotoState').innerText()}`);
    // 8 · Exportar JSON: viaja la referencia, no la foto.
    await page.locator('details.menu summary').first().click();await pause(page,500);
    const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('#exportJson').click()]);exported=fs.readFileSync(await dl.path(),'utf8');
    const json=JSON.parse(exported);
    R.check('exportar: viaja la referencia, no la foto',json.extensions?.[EXT]?.items?.some(i=>i.objectId===o.id)&&!/data:image|IMG_0042|Exif/.test(exported),`${exported.length} bytes; sin bytes de imagen`);
    R.check('R03 y R02-A intactos',await page.evaluate(()=>JSON.stringify([FloorPlanApp.project.extensions?.['x-r03-cabinet']??null,FloorPlanApp.project.extensions?.['x-r02a-ceiling']??null]))===r03r02,'extensiones ajenas sin cambios');
    R.check('sin errores ni red externa ni /api/',!w.errors.length&&!w.external.length&&!api.length,JSON.stringify({errors:w.errors,external:w.external,api}));
    await pause(page,1200);
  }finally{await context.close();}
  const file=path.join(VID,`mue01-escritorio-${viewport.width}x${viewport.height}.webm`);fs.renameSync(await video.path(),file);
  // Otro navegador (sin grabación): importar el JSON y ver el aviso de foto ausente.
  if(exported){
    const {context:c2,page:p2,w:w2}=await openContext(env,{viewport});
    try{
      await p2.locator('#uploadIn').setInputFiles({name:'proyecto.json',mimeType:'application/json',buffer:Buffer.from(exported)});
      await p2.waitForFunction(id=>FloorPlanApp.project.objects.some(o=>o.id===id),objId,{timeout:60000});
      const g2=p2.locator(`#plan g.furn[data-fid="${objId}"]`),b2=await g2.boundingBox();await p2.mouse.click(b2.x+b2.width/2,b2.y+b2.height/2);
      await p2.waitForFunction(()=>document.querySelector('#ownFurnPhotoState')?.dataset.state==='missing');await pause(p2,600);
      const size=await p2.evaluate(id=>FloorPlanApp.project.objects.find(o=>o.id===id).size,objId);
      await R.shot(p2,'mue01-escritorio-07-importado-sin-foto.png','Importado en otro navegador: el volumen funciona; falta la foto (honesto)');
      R.check('importar en otro navegador: volumen sí, foto no (aviso)',JSON.stringify(size)===JSON.stringify({widthMm:2140,depthMm:920,heightMm:830})&&/Falta la foto en este navegador/.test(await p2.locator('#ownFurnPhotoState').innerText()),await p2.locator('#ownFurnPhotoState').innerText());
      R.check('sin errores en el otro navegador',!w2.errors.length,JSON.stringify(w2.errors));
    }finally{await c2.close();}
  }
  return {name:'mue01-escritorio',feature:'MUE-01',viewport,file:`video/${path.basename(file)}`,steps:R.steps,screens:R.shots};
}

// ── Vídeo 2 · teléfono 390×844: MUE-01 + FOT-01 ───────────────────────────────────────────────────────────────────
async function phone(env,jpg,room){
  const viewport={width:390,height:844},R=recorder('movil');
  const {context,page,w,api,video}=await openContext(env,{viewport,mobile:true,video:true});
  try{
    await pause(page,1200);
    await openOwn(page,true);
    const box=await page.locator('#ownFurnDialog').boundingBox();
    R.check('MUE-01: acceso desde «Crear y amueblar» → Mobiliario; el formulario cabe',box.x>=0&&box.x+box.width<=390,`dialog ${Math.round(box.width)} px`);
    await fillOwn(page,{name:'Butaca de lectura',type:'armchair',w:'800',d:'850',h:'1000',rot:'0',photo:['IMG_2001.jpg',jpg,'image/jpeg']});
    await page.locator('#ownFurnCreate').tap();await page.locator('#ownFurnDialog').waitFor({state:'hidden'});await pause(page,1200);
    const o=await selObj(page);
    R.check('MUE-01: creado con las medidas exactas',JSON.stringify(o.size)===JSON.stringify({widthMm:800,depthMm:850,heightMm:1000}),JSON.stringify(o.size));
    R.check('MUE-01: los cajones se cierran y el mueble queda a la vista',!(await page.locator('aside.lib.open, aside.right.open').count()),'plano visible');
    for(let i=0;i<8&&(await page.locator(`#plan g.furn[data-fid="${o.id}"]`).boundingBox()).width<70;i++){await page.locator('#zoomIn').tap();await pause(page,300);}
    await R.shot(page,'movil-01-mue01-creado.png','Teléfono: mueble propio creado y acercado con «＋»');
    const b=await page.locator(`#plan g.furn[data-fid="${o.id}"]`).boundingBox(),cdp=await context.newCDPSession(page);
    const cx=b.x+b.width/2,cy=b.y+b.height/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1}]});
    for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-i*5,y:cy-i*3,id:1}]});await page.waitForTimeout(50);}
    const dims=await page.locator('#gSel .live-dims').count();await R.shot(page,'movil-02-mue01-cotas.png','Teléfono: arrastre con el dedo y cotas UX-08');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(page,900);
    const moved=await selObj(page);
    R.check('MUE-01: colocar con el dedo y cotas UX-08',dims>0&&JSON.stringify(moved.position)!==JSON.stringify(o.position),`cotas=${dims}`);
    // Editar: la rotación desde el panel de propiedades.
    await page.locator('#tgPanel').tap();await page.locator('aside.right.open').waitFor();await pause(page,800);
    await page.waitForFunction(()=>document.querySelector('#ownFurnPhotoState')?.dataset.state==='ok');
    await page.locator('#ownFurnPhotoState').scrollIntoViewIfNeeded();await pause(page,800);
    await R.shot(page,'movil-03-mue01-panel.png','Teléfono: panel del mueble con su foto y avisos');
    await page.locator('#aRot').scrollIntoViewIfNeeded();await page.locator('#aRot').tap();await pause(page,800);
    R.check('MUE-01: editar (rotar) desde el panel',(await selObj(page)).rotationDeg===90,`${(await selObj(page)).rotationDeg}°`);
    await page.locator('#tgPanel').tap();await pause(page,800);
    // FOT-01 desde «Entregar» → «Imágenes».
    const before=await K.snapshot(page);
    await page.locator('#workArea-deliver').tap();await pause(page,900);await page.locator('#photoReformCard').scrollIntoViewIfNeeded();await pause(page,500);
    await page.locator('#photoReformCard').tap();await page.locator('#photoReformDialog[open]').waitFor();await pause(page);
    R.check('FOT-01: acceso «Reformar desde fotografía» desde Entregar → Imágenes',true,'diálogo abierto');
    await page.locator('#photoReformFile').setInputFiles(K.file('salon.jpg',room,'image/jpeg'));await page.locator('#photoReformOriginal:not([hidden])').waitFor();await pause(page,900);
    R.check('FOT-01: original mostrado sin metadatos',/sin metadatos/.test(await page.locator('#photoReformOriginal').innerText()),'original');
    await page.locator('#photoReformIntent').selectOption('walls');await pause(page,400);await page.locator('#photoReformFinish').selectOption('sage');await pause(page,400);
    await page.locator('#photoReformSends').scrollIntoViewIfNeeded();await pause(page,1000);
    await page.locator('#photoReformProvider').scrollIntoViewIfNeeded();await pause(page,1000);
    R.check('FOT-01: proveedor real bloqueado',await page.locator('#photoReformReal').isDisabled()&&/BLOQUEADO/.test(await page.locator('#photoReformProvider').innerText()),'BLOQUEADO');
    await page.locator('#photoReformSimulate').scrollIntoViewIfNeeded();await page.locator('#photoReformSimulate').tap();await pause(page,900);
    R.check('FOT-01: sin consentimiento no se procesa',/Falta tu consentimiento/.test(await page.locator('#photoReformStatus').innerText()),await page.locator('#photoReformStatus').innerText());
    await page.locator('#photoReformConsent').scrollIntoViewIfNeeded();await page.locator('#photoReformConsent').check();await pause(page,500);
    await page.locator('#photoReformSimulate').tap();await page.waitForFunction(()=>RubikPhotoReform.state?.status==='done',null,{timeout:30000});
    await page.locator('#photoReformCompare').scrollIntoViewIfNeeded();await pause(page,900);
    await page.locator('#photoReformSlider').fill('25');await pause(page,700);await page.locator('#photoReformSlider').fill('75');await pause(page,700);
    await R.shot(page,'movil-04-fot01-simulacion.png','Teléfono: comparación con la SIMULACIÓN rotulada');
    R.check('FOT-01: comparación con simulación rotulada',(await page.locator('#photoReformCmpTag').innerText())==='SIMULACIÓN · no generada por IA'&&await page.locator('#photoReformDownload').isDisabled(),'rótulo y sin descarga');
    await page.locator('#photoReformDiscard').scrollIntoViewIfNeeded();await page.locator('#photoReformDiscard').tap();await pause(page,600);
    await page.locator('#photoReformClose').scrollIntoViewIfNeeded();await page.locator('#photoReformClose').tap();await page.locator('#photoReformDialog').waitFor({state:'hidden'});await pause(page,900);
    R.check('FOT-01: el proyecto no cambia',JSON.stringify(await K.snapshot(page))===JSON.stringify(before),'proyecto, historial y biblioteca iguales');
    R.check('sin desplazamiento horizontal',!(await K.hScroll(page)),'390 px');
    R.check('sin errores ni red externa ni /api/',!w.errors.length&&!w.external.length&&!api.length,JSON.stringify({errors:w.errors,external:w.external,api}));
  }finally{await context.close();}
  const file=path.join(VID,`mue01-fot01-movil-${viewport.width}x${viewport.height}.webm`);fs.renameSync(await video.path(),file);
  return {name:'mue01-fot01-movil',feature:'MUE-01 + FOT-01',viewport,file:`video/${path.basename(file)}`,steps:R.steps,screens:R.shots};
}

// ── Capturas FOT-01 escritorio (sin vídeo): original, consentimiento/bloqueo, simulación, error ──────────────────
async function fotDesktop(env,room){
  const viewport={width:1440,height:900},R=recorder('fot01-escritorio');
  const {context,page,w,api}=await openContext(env,{viewport,scale:2});
  try{
    const before=await K.snapshot(page);
    await page.locator('details.menu summary').first().click();await page.locator('#photoReformMenu').click();await page.locator('#photoReformDialog[open]').waitFor();
    R.check('acceso desde Archivo → «Reformar desde fotografía» (distinto de «Desde una imagen»)',/«Desde una imagen»/.test(await page.locator('.photo-reform-truth').innerText()),'aviso de diferencia');
    await page.locator('#photoReformFile').setInputFiles(K.file('IMG_9876.jpg',room,'image/jpeg'));await page.locator('#photoReformOriginal:not([hidden])').waitFor();
    await page.locator('#photoReformIntent').selectOption('floor');await page.locator('#photoReformFinish').selectOption('walnut');await page.locator('#photoReformAlternatives').selectOption('3');
    await page.locator('#photoReformOriginal').scrollIntoViewIfNeeded();await pause(page,300);
    await R.shot(page,'fot01-escritorio-01-original.png','Original (foto sintética) validada, sin metadatos');
    const sends=await page.locator('#photoReformSends').innerText();
    R.check('qué se enviaría: solo imagen recomprimida e intención cerrada',/sin metadatos EXIF ni ubicación/.test(sends)&&!/IMG_9876/.test(sends),sends.replace(/\s+/g,' ').slice(0,160));
    await page.locator('#photoReformSimulate').click();await page.locator('#photoReformProvider').scrollIntoViewIfNeeded();await pause(page,300);
    await R.shot(page,'fot01-escritorio-02-consentimiento-y-proveedor-bloqueado.png','Proveedor real BLOQUEADO y aviso de falta de consentimiento');
    R.check('proveedor bloqueado y consentimiento exigido',await page.locator('#photoReformReal').isDisabled()&&/Falta tu consentimiento/.test(await page.locator('#photoReformStatus').innerText()),'bloqueado');
    await page.locator('#photoReformConsent').check();await page.locator('#photoReformSimulate').click();
    await page.waitForFunction(()=>RubikPhotoReform.state?.status==='done',null,{timeout:30000});
    await page.locator('#photoReformSlider').fill('50');await page.locator('#photoReformCompare').scrollIntoViewIfNeeded();await pause(page,300);
    await R.shot(page,'fot01-escritorio-03-simulacion-rotulada.png','Resultado SIMULADO rotulado, comparación antes/después, sin coste ni descarga');
    R.check('3 alternativas simuladas rotuladas, sin coste y sin descarga',(await page.locator('.photo-reform-alt[data-status="done"]').count())===3&&(await page.locator('#photoReformCmpTag').innerText())==='SIMULACIÓN · no generada por IA'&&/no aplica/.test(await page.locator('#photoReformResultNote').innerText())&&await page.locator('#photoReformDownload').isDisabled(),'rótulo, coste no aplica, descarga desactivada');
    await page.locator('#photoReformScenario').selectOption('error');await page.locator('#photoReformSimulate').click();
    await page.waitForFunction(()=>RubikPhotoReform.state?.status==='error',null,{timeout:30000});await page.locator('#photoReformStatus').scrollIntoViewIfNeeded();await pause(page,300);
    await R.shot(page,'fot01-escritorio-04-error.png','Error del proveedor (simulado): sin imagen y sin coste');
    R.check('error del proveedor simulado',/no hay coste/.test(await page.locator('#photoReformStatus').innerText()),await page.locator('#photoReformStatus').innerText());
    await page.locator('#photoReformScenario').selectOption('slow');await page.locator('#photoReformSimulate').click();await page.locator('#photoReformCancel:not([hidden])').click();
    await page.waitForFunction(()=>RubikPhotoReform.state?.status==='cancelled',null,{timeout:30000});
    R.check('cancelación',true,await page.locator('#photoReformStatus').innerText());
    // Trazabilidad: registro de la sesión (sin imágenes) y su descarga.
    await page.locator('#photoReformTrace summary').click();await page.locator('#photoReformTraceList').scrollIntoViewIfNeeded();await pause(page,300);
    await R.shot(page,'fot01-escritorio-05-registro-sesion.png','Registro de la sesión: eventos con campos cerrados, sin imagen ni nombre de archivo');
    const [tdl]=await Promise.all([page.waitForEvent('download'),page.locator('#photoReformTraceDownload').click()]);
    fs.mkdirSync(path.join(OUT,'trace'),{recursive:true});const tfile=path.join(OUT,'trace','fot01-registro-sesion.json');fs.copyFileSync(await tdl.path(),tfile);
    const ttext=fs.readFileSync(tfile,'utf8'),tdoc=JSON.parse(ttext);
    R.check('registro descargable sin nombre de archivo ni imagen',tdoc.contract==='rubik-photo-reform-trace/1'&&tdoc.entries.length>=8&&!/IMG_9876|data:image|base64|Exif/i.test(ttext),`${tdoc.entries.length} eventos · trace/fot01-registro-sesion.json`);
    R.check('integración del proveedor preparada y SIN ACTIVAR',/SIN ACTIVAR/.test(await page.locator('#photoReformReady').innerText())&&await page.locator('#photoReformReal').isDisabled(),'contrato v1; botón real desactivado');
    await page.locator('#photoReformDiscard').click();await page.locator('#photoReformClose').click();await page.locator('#photoReformDialog').waitFor({state:'hidden'});
    R.check('el proyecto no cambia y no hay llamadas a /api/',JSON.stringify(await K.snapshot(page))===JSON.stringify(before)&&!api.length,`api=${api.length}`);
    R.check('sin errores ni red externa',!w.errors.length&&!w.external.length,JSON.stringify({errors:w.errors,external:w.external}));
  }finally{await context.close();}
  return {name:'fot01-escritorio',feature:'FOT-01',viewport,file:null,steps:R.steps,screens:R.shots};
}

function probe(file){
  const json=sh('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height:format=duration,size','-of','json',file]);
  if(!json)return {ffprobe:false,bytes:fs.statSync(file).size};
  const d=JSON.parse(json),s=d.streams?.[0]||{};return {ffprobe:true,codec:s.codec_name,width:s.width,height:s.height,durationS:+(+d.format?.duration||0).toFixed(2),bytes:+d.format?.size||fs.statSync(file).size};
}

(async()=>{
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(VID,{recursive:true});fs.mkdirSync(SCR,{recursive:true});
  const env=await K.start();const runs=[],errors=[];
  try{
    const sofa=K.withExif(await K.synthPhoto(env.browser,{label:'SOFA'})),chair=K.withExif(await K.synthPhoto(env.browser,{label:'BUTACA'}));
    const room=K.withExif(await K.synthPhoto(env.browser,{w:1600,h:1200,label:'SALON'}));
    for(const [label,fn] of [['mue01-escritorio',()=>mueDesktop(env,sofa)],['movil',()=>phone(env,chair,room)],['fot01-escritorio',()=>fotDesktop(env,room)]]){
      try{runs.push(await fn());}catch(e){errors.push({run:label,error:String(e.message||e)});}
    }
  }finally{await env.stop();}
  for(const r of runs.filter(r=>r.file)){
    const webm=path.join(OUT,r.file);r.webm=probe(webm);
    if(!r.webm.ffprobe){r.mp4=null;r.note='ffprobe/ffmpeg no disponibles: se conserva solo el WebM; no se ha creado MP4.';continue;}
    if(!(r.webm.durationS>0&&r.webm.width===r.viewport.width&&r.webm.height===r.viewport.height))errors.push({run:r.name,error:`vídeo no válido: ${JSON.stringify(r.webm)}`});
    r.playable=sh('ffmpeg',['-v','error','-i',webm,'-f','null','-'])!==null;
    const mp4=webm.replace(/\.webm$/,'.mp4');
    r.mp4=sh('ffmpeg',['-y','-v','error','-i',webm,'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',mp4])!==null&&fs.existsSync(mp4)?{file:`video/${path.basename(mp4)}`,...probe(mp4)}:null;
    if(!r.mp4)r.note='MP4 no creado (ffmpeg falló o sin libx264): se conserva el WebM.';
  }
  const manifest={purpose:'De fotografía a proyecto V1 · MUE-01 + FOT-01 en el editor real',head:sh('git',['rev-parse','HEAD']),createdAt:new Date().toISOString(),
    data:'fotos SINTÉTICAS dibujadas por Chromium (sin personas ni datos reales); EXIF/ubicación inventados para comprobar su eliminación; piso de ejemplo sintético',
    provider:'FOT-01: ningún proveedor real; solo el adaptador SIMULADO, rotulado «SIMULACIÓN · no generada por IA»; sin coste; ninguna llamada a /api/',
    status:{'MUE-01':errors.some(e=>/mue01|movil/.test(e.run))?'FALLO':'OK','FOT-01':'PARCIAL (sin proveedor real; simulación rotulada)'},
    ok:!errors.length,errors,runs};
  fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(manifest,null,2));
  console.log(JSON.stringify(manifest,null,2));
  if(errors.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1);});
