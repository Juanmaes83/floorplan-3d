'use strict';
// OP-05 · P3/P4 JUNTOS (laboratorio). Editor y visor canónicos reales; modelo privado SINTÉTICO (pirámide magenta con
// textura JPEG) solo en memoria (C1 NO-GO). P3: el visor autorizado del laboratorio lo muestra sin cambiar el proyecto.
// P4: TODAS las salidas reales (imágenes, presentación, GLB de Blender, vídeo grabado, JSON exportado) llevan la
// representación genérica: marcador visual robusto a compresión (píxeles magenta) y geométrico (mallas del objeto en el
// GLB idénticas a las del genérico). Destinos y lectores desconocidos fallan cerrado.
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const K=require('./r02a/editor-kit.cjs');
let env,bytes,sha;
test.before(async()=>{env=await K.start();
 const {buildPrivateGLB}=await import(path.join(__dirname,'../labs/sculpt/op-05/fixtures/build-private-glb.mjs'));
 bytes=Buffer.from(buildPrivateGLB());sha=crypto.createHash('sha256').update(bytes).digest('hex');});
test.after(async()=>{await env?.stop();});
const RIGHTS={basis:'original',attribution:'RUBIK · laboratorio sintético OP-05',license:'CC0-1.0',evidenceSha256:'c'.repeat(64),scope:'project-private'};
const TITLE='Pirámide QA privada';

// En la página: magenta saturado (tolerante a JPEG/WebM) en una imagen, un blob o el canvas del visor.
const PAGE_HELPERS=()=>{window.__magenta=async src=>{const img=new Image();img.src=src;await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
  const x=c.getContext('2d');x.drawImage(img,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]>150&&d[i+2]>150&&d[i+1]<110)n++;return n;};};
async function open(){const {context,page,watch}=await K.editor(env);await page.evaluate(PAGE_HELPERS);
 await page.evaluate(()=>setView('3d'));await page.waitForFunction(()=>window.View3D?.contextAvailable&&FloorPlanApp.viewMode==='3d');
 await page.addScriptTag({type:'module',url:env.base+'labs/sculpt/op-05/private-view-lab.mjs'});await page.waitForFunction(()=>!!window.RubikPrivateView);
 const fid=await page.evaluate(()=>{const o=[...FloorPlanApp.project.objects].filter(o=>o.size?.widthMm&&o.size?.depthMm).sort((a,b)=>b.size.widthMm*b.size.depthMm-a.size.widthMm*a.size.depthMm)[0];return o.id;});
 return {context,page,watch,fid};}
const grant=(page,fid)=>page.evaluate(({fid,b,sha,rights,title})=>{const pv=RubikPrivateView,u=Uint8Array.from(atob(b),c=>c.charCodeAt(0)).buffer;
 const mid=pv.attach(FloorPlanApp.project,fid,{sha256:sha,byteLength:u.byteLength,title,rights});pv.grant(FloorPlanApp.project,fid,u);pv.enable();View3D.refreshAssets();return mid;},{fid,b:bytes.toString('base64'),sha,rights:RIGHTS,title:TITLE});
const ready=(page,fid)=>page.waitForFunction(id=>{const s=View3D.assetStatus(id);return s&&s.private&&s.state!=='loading';},fid,{timeout:60000}).then(()=>page.evaluate(id=>View3D.assetStatus(id),fid));
const screenMagenta=async page=>page.evaluate(async b=>__magenta('data:image/png;base64,'+b),(await page.screenshot()).toString('base64'));
const snapshot=page=>page.evaluate(()=>({project:JSON.stringify(FloorPlanApp.project),storage:Object.keys(localStorage).sort().map(k=>k+'='+localStorage.getItem(k)).join('\n')}));

test('P3 · el visor autorizado del laboratorio muestra el modelo privado (JPEG decodificado) sin cambiar el proyecto ni guardar nada',{timeout:180000},async()=>{
 const {context,page,watch,fid}=await open();
 try{const before=await snapshot(page),genericPixels=await screenMagenta(page);
  const mid=await grant(page,fid),st=await ready(page,fid);
  assert.equal(st.state,'ready',JSON.stringify(st));assert.equal(st.physicalScale,'not-certified');
  await page.evaluate(()=>View3D.invalidate());await page.waitForTimeout(300);
  const shown=await screenMagenta(page);assert.equal(genericPixels,0,'el genérico no tiene magenta');assert.ok(shown>150,`modelo privado visible (${shown} px)`);
  const after=await snapshot(page);assert.equal(after.project,before.project,'objeto canónico, identidad, cotas y presupuesto intactos');
  for(const secret of [mid,sha,TITLE,RIGHTS.attribution,'x-op05-private-model'])assert.ok(!after.storage.includes(secret),'nada de OP-05 persistido');
  // OP-02: en reposo no se dibujan fotogramas.
  const f0=await page.evaluate(()=>View3D.renderedFrames);await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>View3D.renderedFrames),f0,'reposo');
  assert.deepEqual(watch.external,[]);
 }finally{await context.close();}
});

test('P3 · hash o longitud incorrectos, otro proyecto o sin concesión → genérico con razón; la huella no concede acceso',{timeout:180000},async()=>{
 const {context,page,fid}=await open();
 try{const r=await page.evaluate(({fid,b,sha,rights,title})=>{const pv=RubikPrivateView,u=Uint8Array.from(atob(b),c=>c.charCodeAt(0)).buffer,p=FloorPlanApp.project,out={};
   pv.attach(p,fid,{sha256:sha,byteLength:u.byteLength,title,rights});
   try{pv.grant(p,fid,u.slice(1));}catch(e){out.len=e.message;}
   out.ungranted=pv.resolve(p,fid).reason;
   const other={...p,id:'prj_otro0000000000000000000000000000'};out.foreign=pv.resolve(other,fid).reason;
   const bad=new Uint8Array(u.slice(0));bad[bad.length-1]^=0xff;pv.grant(p,fid,bad.buffer);pv.enable();View3D.refreshAssets();return out;},{fid,b:bytes.toString('base64'),sha,rights:RIGHTS,title:TITLE});
  assert.match(r.len,/longitud/);assert.equal(r.ungranted,'not-granted-for-this-project');assert.equal(r.foreign,'no-private-model');
  const st=await ready(page,fid);assert.equal(st.state,'generic');assert.match(st.reason,/huella/i,'bytes alterados → genérico');
  assert.equal(await screenMagenta(page),0);
 }finally{await context.close();}
});

test('P3 · cancelación y cambio de generación: una carga tardía nunca entra en la escena; movimiento y rotación siguen al objeto',{timeout:180000},async()=>{
 const {context,page,fid}=await open();
 try{await grant(page,fid);await page.evaluate(()=>{View3D.refreshAssets();View3D.refreshAssets();});   // dos reconstrucciones seguidas
  await ready(page,fid);await page.waitForTimeout(200);
  const count=await page.evaluate(()=>{let n=0;View3D.scene?.traverse?.(o=>{if(o.name==='op05-generic')n++;});return n;});
  assert.ok(count<=1,'como mucho un grupo genérico por objeto: ninguna carga tardía duplicada');
  const before=await screenMagenta(page);
  await page.evaluate(id=>FloorPlanApp.applyExtension(p=>{const o=p.objects.find(x=>x.id===id);o.position={x:o.position.x+300,y:o.position.y};o.rotationDeg=((o.rotationDeg||0)+90)%360;return {ok:true,project:p};}),fid);
  await page.evaluate(()=>View3D.refreshAssets());await ready(page,fid);await page.evaluate(()=>View3D.invalidate());await page.waitForTimeout(300);
  assert.ok(before>150&&await screenMagenta(page)>150,'mover y rotar conserva la representación privada en el visor');
  await page.evaluate(()=>RubikPrivateView.disable());await page.evaluate(()=>View3D.invalidate());await page.waitForTimeout(300);
  assert.equal(await screenMagenta(page),0,'desactivar el modo privado vuelve al genérico');
 }finally{await context.close();}
});

test('P4 · imágenes, presentación, GLB de Blender, vídeo grabado y JSON: genéricos y sin nada de OP-05; lectores desconocidos fallan cerrado',{timeout:240000},async()=>{
 const {context,page,fid}=await open();
 try{// Referencia genérica del GLB, sin modelo privado.
  const objMeshes=async()=>page.evaluate(async id=>{const {doc}=await View3D.captureScene({stableFrames:4});const bin=RubikSceneCapture.toGLB(doc);
   const mine=doc.meshes.filter(m=>m.entity?.id===id).map(m=>JSON.stringify(m.vertices));return {mine:mine.sort().join('|'),bytes:bin.byteLength||bin.length};},fid);
  const genericGLB=await objMeshes();
  const mid=await grant(page,fid);await ready(page,fid);await page.evaluate(()=>View3D.invalidate());await page.waitForTimeout(300);
  assert.ok(await screenMagenta(page)>150,'privado visible en el visor de laboratorio');
  // Imágenes y presentación (APIs reales): genéricas.
  // deliveryShot (vistas, presentación y entrega): la imagen real que devuelve.
  const dshot=await page.evaluate(async()=>(await View3D.deliveryShot({width:1200,height:800})).dataUrl);
  assert.equal(typeof dshot,'string','deliveryShot devuelve una imagen');assert.equal(await page.evaluate(s=>__magenta(s),dshot),0,'deliveryShot: sin píxeles del modelo privado');
  // shot (vistas 3D y presentación): el archivo REAL descargado.
  const [img]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>View3D.shot())]);
  const imgB64=require('node:fs').readFileSync(await img.path()).toString('base64'),mime=/\.jpe?g$/i.test(img.suggestedFilename())?'image/jpeg':'image/png';
  assert.equal(await page.evaluate(([b,m])=>__magenta('data:'+m+';base64,'+b),[imgB64,mime]),0,`shot (${img.suggestedFilename()}): sin píxeles del modelo privado`);
  // presentationCapture captura el ESTADO de la cámara (no una imagen); también corre bajo la guarda.
  assert.ok(await page.evaluate(()=>!!View3D.presentationCapture()));
  // GLB de Blender (captureScene → toGLB): las mallas del objeto son las del genérico.
  assert.equal((await objMeshes()).mine,genericGLB.mine,'GLB: geometría del objeto idéntica al genérico');
  // Concurrencia y cancelación: dos salidas a la vez y una cancelada; después el visor vuelve a mostrar el privado.
  await page.evaluate(async()=>{const ac=new AbortController();ac.abort();await Promise.allSettled([View3D.captureScene({stableFrames:3}),View3D.deliveryShot({width:600,height:400}),View3D.captureScene({signal:ac.signal})]);});
  await page.evaluate(()=>View3D.invalidate());await page.waitForTimeout(300);assert.ok(await screenMagenta(page)>150,'tras salidas concurrentes y canceladas vuelve el privado al visor');
  // Lector desconocido de píxeles con el privado visible → error (falla cerrado).
  assert.match(await page.evaluate(()=>{try{document.querySelector('#view3d canvas').toDataURL();return 'leído';}catch(e){return e.message;}}),/OP-05/);
  // Vídeo: mientras la grabación vive, todos los fotogramas son genéricos.
  const video=await page.evaluate(async()=>{const cv=document.querySelector('#view3d canvas'),st=cv.captureStream(15),track=st.getVideoTracks()[0];
   // Los fotogramas EXACTOS que recibe la grabación: la misma pista alimenta al MediaRecorder y al lector de fotogramas.
   const rec=new MediaRecorder(st,{mimeType:'video/webm'}),parts=[];rec.ondataavailable=e=>parts.push(e.data);rec.start(100);
   const reader=new MediaStreamTrackProcessor({track:track.clone()}).readable.getReader(),c=new OffscreenCanvas(8,8);let worst=0,frames=0;
   const t0=performance.now();const pump=(async()=>{while(frames<4&&performance.now()-t0<8000){const {value:f,done}=await reader.read();if(done)break;
     c.width=f.displayWidth;c.height=f.displayHeight;const x=c.getContext('2d');x.drawImage(f,0,0);f.close();
     const d=x.getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]>150&&d[i+2]>150&&d[i+1]<110)n++;worst=Math.max(worst,n);frames++;}})();
   // El render bajo demanda agrupa invalidaciones y la pista solo emite al pintarse el canvas: se fuerzan renders hasta
   // leer al menos 4 fotogramas REALES de la pista (o agotar 8 s; entonces la prueba falla, nunca se da por buena).
   while(frames<4&&performance.now()-t0<8000){View3D.invalidate();await new Promise(r=>setTimeout(r,80));}
   reader.cancel().catch(()=>{});await pump;rec.stop();await new Promise(r=>rec.onstop=r);st.getTracks().forEach(t=>t.stop());
   return {worst,frames,bytes:parts.reduce((s,p)=>s+p.size,0)};});
  assert.ok(video.frames>=4&&video.bytes>0,JSON.stringify(video));assert.equal(video.worst,0,'vídeo: ningún fotograma grabado con el modelo privado');
  // Control positivo del mismo marcador: cerrada la grabación (pistas detenidas) el visor vuelve a mostrar el privado.
  await page.evaluate(()=>View3D.invalidate());await page.waitForTimeout(300);assert.ok(await screenMagenta(page)>150,'tras la grabación vuelve el privado al visor');
  // JSON exportado real (descarga) y almacenamiento: nada de OP-05.
  const [dl]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>exportProjectJson())]);
  const text=require('node:fs').readFileSync(await dl.path(),'utf8');
  for(const secret of [mid,sha,TITLE,RIGHTS.attribution,RIGHTS.evidenceSha256,'x-op05-private-model'])assert.ok(!text.includes(secret),'JSON exportado sin OP-05');
  const {storage}=await snapshot(page);for(const secret of [mid,sha,TITLE])assert.ok(!storage.includes(secret),'nada persistido');
 }finally{await context.close();}
});
