'use strict';
// OP-05 · P4 · Residuales de la auditoría de ChatGPT sobre 4a47f3e8: OP05-A grabador real, OP05-B coherencia
// escena/fotograma, OP05-C revocación; y validación complementaria: presentación en vivo, ZIP de lotes real, salidas
// concurrentes comprobadas una a una. Mismo marcador que P3/P4 (pirámide magenta sintética con JPEG, solo en memoria).
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path'),fs=require('node:fs');
const K=require('./r02a/editor-kit.cjs');
let env,bytes,sha;
test.before(async()=>{env=await K.start();const {buildPrivateGLB}=await import(path.join(__dirname,'../labs/sculpt/op-05/fixtures/build-private-glb.mjs'));
 bytes=Buffer.from(buildPrivateGLB());sha=crypto.createHash('sha256').update(bytes).digest('hex');});
test.after(async()=>{await env?.stop();});
const RIGHTS={basis:'original',attribution:'RUBIK · laboratorio sintético OP-05',license:'CC0-1.0',evidenceSha256:'c'.repeat(64),scope:'project-private'},TITLE='Pirámide QA privada';
// Marcador: píxeles magenta saturados (tolerante a JPEG/vídeo). Y un «grifo» sobre TODO captureStream de un canvas 2D (el
// compositor real del grabador): lee los fotogramas exactos que recibe el MediaRecorder.
const INIT=()=>{const count=d=>{let n=0;for(let i=0;i<d.length;i+=4)if(d[i]>150&&d[i+2]>150&&d[i+1]<110)n++;return n;};window.__count=count;
 window.__b64=u=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.slice(f.result.indexOf(',')+1));f.readAsDataURL(new Blob([u]));});
 window.__magenta=async src=>{const img=new Image();img.src=src;await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);return count(x.getImageData(0,0,c.width,c.height).data);};
 window.__tap={frames:0,worst:0};const orig=HTMLCanvasElement.prototype.captureStream;
 HTMLCanvasElement.prototype.captureStream=function(...a){const st=orig.apply(this,a);if(this.closest?.('#view3d'))return st;const tr=st.getVideoTracks()[0];if(!tr||!window.MediaStreamTrackProcessor)return st;
  const reader=new MediaStreamTrackProcessor({track:tr.clone()}).readable.getReader(),c=new OffscreenCanvas(8,8);
  (async()=>{for(;;){const {value:f,done}=await reader.read();if(done)break;c.width=f.displayWidth;c.height=f.displayHeight;const x=c.getContext('2d');x.drawImage(f,0,0);f.close();
   window.__tap.frames++;window.__tap.worst=Math.max(window.__tap.worst,count(x.getImageData(0,0,c.width,c.height).data));}})().catch(()=>{});return st;};};
async function open(viewport={width:1440,height:900}){const {context,page,watch}=await K.editor(env,{viewport});await page.evaluate(INIT);
 await page.evaluate(()=>setView('3d'));await page.waitForFunction(()=>window.View3D?.contextAvailable&&FloorPlanApp.viewMode==='3d');
 await page.addScriptTag({type:'module',url:env.base+'labs/sculpt/op-05/private-view-lab.mjs'});await page.waitForFunction(()=>!!window.RubikPrivateView);
 const fid=await page.evaluate(()=>[...FloorPlanApp.project.objects].filter(o=>o.size?.widthMm&&o.size?.depthMm).sort((a,b)=>b.size.widthMm*b.size.depthMm-a.size.widthMm*a.size.depthMm)[0].id);
 return {context,page,watch,fid};}
const grant=(page,fid,{refresh=true}={})=>page.evaluate(({fid,b,sha,rights,title,refresh})=>{const pv=RubikPrivateView,u=Uint8Array.from(atob(b),c=>c.charCodeAt(0)).buffer;
 const mid=pv.attach(FloorPlanApp.project,fid,{sha256:sha,byteLength:u.byteLength,title,rights});pv.grant(FloorPlanApp.project,fid,u);pv.enable();if(refresh)View3D.refreshAssets();return mid;},{fid,b:bytes.toString('base64'),sha,rights:RIGHTS,title:TITLE,refresh});
const ready=(page,fid)=>page.waitForFunction(id=>{const s=View3D.assetStatus(id);return s&&s.private&&s.state!=='loading';},fid,{timeout:60000});
const screen=async page=>page.evaluate(async b=>__magenta('data:image/png;base64,'+b),(await page.screenshot()).toString('base64'));
const visible=async page=>{await page.evaluate(()=>View3D.invalidate());await page.waitForTimeout(350);return screen(page);};
async function present(page){await page.evaluate(()=>FloorPlanPresentation.open());await page.locator('.presentation-room-row').nth(1).locator('input').check();
 await page.getByRole('button',{name:'Iniciar presentación'}).click();await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:60000});}

function readZip(zip){const entries=new Map(),v=new DataView(zip.buffer,zip.byteOffset,zip.byteLength),end=zip.length-22,count=v.getUint16(end+10,true);let off=v.getUint32(end+16,true);
 for(let i=0;i<count;i++){const method=v.getUint16(off+10,true),size=v.getUint32(off+20,true),nl=v.getUint16(off+28,true),el=v.getUint16(off+30,true),cl=v.getUint16(off+32,true),lo=v.getUint32(off+42,true),name=zip.subarray(off+46,off+46+nl).toString();
  const lnl=v.getUint16(lo+26,true),lel=v.getUint16(lo+28,true),data=zip.subarray(lo+30+lnl+lel,lo+30+lnl+lel+size);entries.set(name,method===0?data:require('node:zlib').inflateRawSync(data));off+=46+nl+el+cl;}
 return entries;}
// Firma geométrica de un GLB: accesores (tipo, número, mínimos y máximos) de las mallas cuyo nodo lleva rubik_id = id.
function glbObject(glb,id){const b=Buffer.from(glb),len=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+len).toString());
 const meshes=new Set((j.nodes||[]).filter(n=>n.extras?.rubik_id===id&&n.mesh!=null).map(n=>n.mesh));
 return JSON.stringify([...meshes].sort().map(m=>j.meshes[m].primitives.map(p=>Object.entries(p.attributes).sort().map(([k,a])=>[k,j.accessors[a].type,j.accessors[a].count,j.accessors[a].min,j.accessors[a].max]))));}

test('OP05-A · grabador real (FloorPlanTourRecorder.record): cada fotograma del compositor es genérico; errores y cancelación restauran',{timeout:300000},async()=>{
 const {context,page,fid}=await open();
 try{await grant(page,fid);await ready(page,fid);assert.ok(await visible(page)>150,'control: privado visible en el visor de laboratorio');
  await present(page);
  const live=await visible(page);assert.equal(live,0,'presentación en vivo: sin el modelo privado');
  const r=await page.evaluate(async()=>{__tap.frames=0;__tap.worst=0;const out=await FloorPlanTourRecorder.record({width:480,height:270,fps:12,holdMs:250});
   await new Promise(r=>setTimeout(r,300));return {frames:out.frames,bytes:out.blob.size,tapFrames:__tap.frames,worst:__tap.worst};});
  assert.ok(r.bytes>0&&r.tapFrames>=3,JSON.stringify(r));assert.equal(r.worst,0,'ningún fotograma grabado con el modelo privado');
  // Cancelación a mitad de grabación: rechaza, y la presentación sigue sin el privado.
  const cancel=await page.evaluate(async()=>{const ac=new AbortController();setTimeout(()=>ac.abort(),150);try{await FloorPlanTourRecorder.record({signal:ac.signal,width:320,height:180,fps:10,holdMs:600});return 'grabó';}catch(e){return e.name||e.message;}});
  assert.match(cancel,/Abort|cancel/i);assert.equal(await visible(page),0,'tras cancelar, la presentación sigue genérica');
  // Restauración al salir de la presentación: vuelve el privado al visor autorizado.
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!FloorPlanPresentation.active,null,{timeout:30000});
  // Con carga, el primer render tras salir puede tardar: se sondea hasta 10 s con el mismo umbral.
  let back=0;for(let t=0;t<20&&back<=150;t++)back=await visible(page);
  assert.ok(back>150,'fuera de la presentación vuelve el privado al visor de laboratorio');
 }finally{await context.close();}
});

test('OP05-B · intervalo entre cambio de representación y render: ningún lector consume un fotograma antiguo con contenido privado',{timeout:180000},async()=>{
 const {context,page,fid}=await open();
 try{await grant(page,fid);await ready(page,fid);assert.ok(await visible(page)>150);
  const r=await page.evaluate(async()=>{const cv=document.querySelector('#view3d canvas'),out={};
   // Lectores con el privado autorizado y visible: fallan cerrado.
   for(const [k,fn] of Object.entries({toDataURL:()=>cv.toDataURL(),drawImage:()=>{const c=document.createElement('canvas');c.width=8;c.height=8;c.getContext('2d').drawImage(cv,0,0);},
     offscreenDrawImage:()=>new OffscreenCanvas(8,8).getContext('2d').drawImage(cv,0,0)}))try{fn();out[k]='leído';}catch(e){out[k]=/OP-05/.test(e.message)?'rechazado':e.message;}
   try{await createImageBitmap(cv);out.createImageBitmap='leído';}catch(e){out.createImageBitmap=/OP-05/.test(e.message)?'rechazado':e.message;}
   // Cambio de representación SIN render nuevo (desactivar) e inmediatamente leer: debe salir genérico.
   RubikPrivateView.disable();out.staleDataURL=await __magenta(cv.toDataURL());
   const c2=document.createElement('canvas');c2.width=cv.width;c2.height=cv.height;c2.getContext('2d').drawImage(cv,0,0);out.staleDrawImage=__count(c2.getContext('2d').getImageData(0,0,c2.width,c2.height).data);
   RubikPrivateView.enable();View3D.invalidate();await new Promise(r=>setTimeout(r,300));
   // Entrar en una salida autorizada (deliveryShot) justo tras un fotograma privado: su imagen es genérica.
   out.shot=await __magenta((await View3D.deliveryShot({width:800,height:500})).dataUrl);return out;});
  assert.deepEqual({toDataURL:r.toDataURL,drawImage:r.drawImage,offscreenDrawImage:r.offscreenDrawImage,createImageBitmap:r.createImageBitmap},{toDataURL:'rechazado',drawImage:'rechazado',offscreenDrawImage:'rechazado',createImageBitmap:'rechazado'});
  assert.equal(r.staleDataURL,0,'toDataURL tras desactivar, sin render intermedio: genérico');assert.equal(r.staleDrawImage,0,'drawImage tras desactivar, sin render intermedio: genérico');
  assert.equal(r.shot,0);
 }finally{await context.close();}
});

test('OP05-C · revocación: con modelo visible, durante una carga, desactivar/reactivar sin concesión; recursos liberados',{timeout:180000},async()=>{
 const {context,page,fid}=await open();
 try{await grant(page,fid);await ready(page,fid);assert.ok(await visible(page)>150);
  const after=await page.evaluate(async()=>{RubikPrivateView.revokeAll();const cv=document.querySelector('#view3d canvas');return {now:await __magenta(cv.toDataURL()),state:View3D.privateState()};});
  assert.equal(after.now,0,'revocar con el modelo visible: el siguiente lector ya ve el genérico');assert.equal(after.state.scenes,0,'escena privada retirada y liberada');
  assert.equal(await visible(page),0);
  // Revocar durante una carga pendiente.
  await grant(page,fid);await page.evaluate(()=>RubikPrivateView.revokeAll());await page.waitForTimeout(1500);
  assert.equal((await page.evaluate(()=>View3D.privateState())).scenes,0,'una carga en vuelo no entra tras revocar');assert.equal(await visible(page),0);
  // Desactivar, revocar y reactivar sin concesión vigente: nada privado.
  await grant(page,fid);await ready(page,fid);await page.evaluate(()=>{RubikPrivateView.disable();RubikPrivateView.revokeAll();RubikPrivateView.enable();});
  assert.equal(await visible(page),0,'reactivar sin concesión no muestra nada privado');assert.equal((await page.evaluate(()=>View3D.privateState())).scenes,0);
  // Cambio de generación con concesión de OTRO proyecto: nada.
  await page.evaluate(({b})=>{const u=Uint8Array.from(atob(b),c=>c.charCodeAt(0)).buffer;try{RubikPrivateView.grant({...FloorPlanApp.project,id:'prj_otro0000000000000000000000000000'},'x',u);}catch{}View3D.refreshAssets();},{b:bytes.toString('base64')});
  await page.waitForTimeout(800);assert.equal(await visible(page),0);
 }finally{await context.close();}
});

test('Complementaria · ZIP de presentación por lotes real y salidas concurrentes comprobadas una a una',{timeout:300000},async()=>{
 const {context,page,fid}=await open();
 try{// Referencias GENÉRICAS (sin concesión): documento de escena y ZIP real de Blender, por el mismo camino que la interfaz.
  const sceneRef=()=>page.evaluate(async id=>{const {doc}=await View3D.captureScene({stableFrames:3});return doc.meshes.filter(m=>m.entity?.id===id).map(m=>JSON.stringify(m.vertices)).sort().join('|');},fid);
  const blender=async()=>{await page.evaluate(async()=>{await RubikSceneExport.prepare();});assert.equal(await page.evaluate(()=>RubikSceneExport.state),'ready');
   return readZip(Buffer.from(await page.evaluate(async()=>__b64(await RubikSceneExport.bytes())),'base64'));};
  const genericScene=await sceneRef(),genericZip=await blender(),glbName=[...genericZip.keys()].find(n=>n.endsWith('.glb'));
  assert.ok(genericScene.length>0&&glbName,'referencias genéricas tomadas');const genericGlb=glbObject(genericZip.get(glbName),fid);assert.notEqual(genericGlb,'[]');
  const mid=await grant(page,fid);await ready(page,fid);assert.ok(await visible(page)>150);
  // Salidas concurrentes con el privado visible: tres imágenes, el documento de escena y la exportación real de Blender.
  const conc=await page.evaluate(async id=>{const ex=RubikSceneExport.prepare();
   const r=await Promise.all([View3D.deliveryShot({width:700,height:450}),View3D.deliveryShot({width:500,height:500}),View3D.captureScene({stableFrames:3}),View3D.deliveryShot({width:640,height:360})]);await ex;
   const doc=r[2].doc,{toGLB}=RubikSceneCapture,glb=toGLB(doc);
   return {pix:await Promise.all([0,1,3].map(i=>__magenta(r[i].dataUrl))),scene:doc.meshes.filter(m=>m.entity?.id===id).map(m=>JSON.stringify(m.vertices)).sort().join('|'),
    docText:JSON.stringify(doc),glb:await __b64(new Uint8Array(glb.buffer||glb)),state:RubikSceneExport.state,zip:await __b64(await RubikSceneExport.bytes())};},fid);
  assert.deepEqual(conc.pix,[0,0,0],'cada imagen concurrente es genérica');
  assert.equal(conc.scene,genericScene,'documento de escena: la geometría del objeto es la genérica, sin la pirámide privada');
  assert.equal(glbObject(Buffer.from(conc.glb,'base64'),fid),genericGlb,'GLB del documento: geometría genérica');
  assert.equal(conc.state,'ready');const zipC=readZip(Buffer.from(conc.zip,'base64'));assert.equal(glbObject(zipC.get([...zipC.keys()].find(n=>n.endsWith('.glb'))),fid),genericGlb,'ZIP de Blender real: geometría genérica');
  // Ni identificadores, ni huella, ni título, ni derechos, ni la extensión en el documento, su GLB ni ninguna entrada del ZIP.
  const secrets=[mid,sha,TITLE,RIGHTS.attribution,RIGHTS.evidenceSha256,'x-op05','pmd_','project-private','privateScene','op05-generic'];
  const texts={documento:conc.docText,glb:Buffer.from(conc.glb,'base64').toString('latin1'),...Object.fromEntries([...zipC].map(([n,d])=>['zip:'+n,Buffer.from(d).toString('latin1')]))};
  for(const [where,t] of Object.entries(texts))for(const x of secrets)assert.ok(!t.includes(x),`${where} no contiene «${x}»`);
  await present(page);const pending=page.waitForEvent('download');await page.locator('#presentationBatch').click();const file=await pending,zip=fs.readFileSync(await file.path());
  const entries=readZip(zip);
  const manifest=entries.get('presentation.json').toString(),all=[...entries.values()].map(b=>b.toString('latin1')).join('');
  for(const s of [mid,sha,TITLE,RIGHTS.attribution,'x-op05-private-model'])assert.ok(!all.includes(s),'ZIP (manifiesto, proyecto portable e imágenes) sin OP-05');
  const pngs=[...entries.keys()].filter(n=>/\.png$/.test(n));assert.ok(pngs.length>=2,pngs.join());
  for(const n of pngs)assert.equal(await page.evaluate(b=>__magenta('data:image/png;base64,'+b),entries.get(n).toString('base64')),0,`${n}: genérica`);
  assert.ok(JSON.parse(manifest).views.length>=2);
 }finally{await context.close();}
});

test('measureMirrorPilot · el reflejo y la vista previa son genéricos aunque el privado esté delante del espejo',{timeout:300000},async()=>{
 const {context,page}=await open();
 try{const {vanity,near}=await page.evaluate(()=>{const os=FloorPlanApp.project.objects,v=os.find(o=>o.type==='vanity');
   const d=o=>Math.hypot(o.position.x-v.position.x,o.position.y-v.position.y);
   return {vanity:v.id,near:os.filter(o=>o.id!==v.id&&o.size?.widthMm&&o.size?.depthMm).sort((a,b)=>d(a)-d(b)).slice(0,8).map(o=>o.id)};});
  let used=null,result=null,inView=0;
  for(const fid of near){await page.evaluate(()=>RubikPrivateView.revokeAll());await grant(page,fid);await ready(page,fid);
   if((await page.evaluate(id=>View3D.assetStatus(id).state,fid))!=='ready')continue;
   await page.evaluate(id=>View3D.mirrorPilotView(id),vanity);await page.waitForTimeout(350);
   // Control positivo: el privado está en la vista de la cámara que usa la medición.
   inView=await screen(page);if(inView<=150)continue;
   const r=await page.evaluate(async id=>{const m=View3D.measureMirrorPilot(id);if(m.status!=='measured')return {status:m.status};
     return {status:m.status,reflection:await __magenta(m.reflection),preview:await __magenta(m.preview)};},vanity);
   if(r.status==='measured'){used=fid;result=r;break;}}
  assert.ok(used,`un objeto privado cercano visible delante del espejo y medible (${JSON.stringify({near,inView})})`);
  assert.equal(result.reflection,0,'reflejo (destino de render) genérico');assert.equal(result.preview,0,'vista previa genérica');
  // Tras la salida, el visor de laboratorio vuelve a mostrar el privado.
  let back=0;for(let t=0;t<20&&back<=150;t++)back=await visible(page);assert.ok(back>150,'el privado vuelve al visor de laboratorio');
 }finally{await context.close();}
});
