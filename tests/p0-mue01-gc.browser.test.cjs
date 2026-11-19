'use strict';
/* P0 · H-1 · Las fotos de MUE-01 («Traer mi mueble») no deben perderse en la recogida de imágenes (FloorPlanImages.collect).
   Antes de la corrección, la recogida solo contaba como referencias las imágenes de plano (sourceImages): al quitar el
   trazado, la foto del mueble propio (clave mue01/<sha256> en el mismo almacén) se borraba aunque el proyecto la siguiera
   citando. Navegador REAL (Chromium): IndexedDB, localStorage, Web Locks y recargas reales; fotos sintéticas. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const K=require('./photo-project/kit.cjs');
const PLAN=path.join(__dirname,'fixtures/manual-plan.png');
let env,jpg;
// P0_HOST=f0-2b.localhost ejecuta la suite en el origen donde F0.2b activa su autoridad de persistencia (si está integrada).
test.before(async()=>{env=await K.start();if(process.env.P0_HOST)env.base=env.base.replace('127.0.0.1',process.env.P0_HOST);jpg=await K.synthPhoto(env.browser,{label:'P0 MUE01'});});
test.after(async()=>{await env?.stop();});

const photoKeys=page=>page.evaluate(async()=>(await FloorPlanImages.keys()).filter(k=>k.startsWith('mue01/')));
const referenced=page=>page.evaluate(()=>{const r=RubikOwnFurnitureCore.read(FloorPlanApp.project);return [...r.items.values()].filter(Boolean).map(p=>p.imageKey);});
// Con F0.2b activo el guardado es asíncrono: antes de recargar se confirma lo pendiente (sin efecto en el origen normal).
const flush=page=>page.evaluate(async()=>{await window.FloorPlanPersistenceEditor?.session?.flush?.();});
const reopen=async page=>{await flush(page);await K.reopen(page);};
const blobOk=(page,key)=>page.evaluate(async k=>{const b=await FloorPlanImages.get(k);return b instanceof Blob&&b.size>0;},key);

// Navegación real: Editor → Amueblar → «Traer mi mueble», con foto.
async function addOwnFurniture(page,name){
  const tab=page.locator('#paletteTabFurnish');if(await tab.getAttribute('aria-selected')!=='true')await tab.click();
  await page.locator('#ownFurnOpen').click();await page.locator('#ownFurn-name').fill(name);
  await page.locator('#ownFurn-type').selectOption('chair');
  await page.locator('#ownFurn-photo').setInputFiles({name:'p0-sintetica.jpg',mimeType:'image/jpeg',buffer:jpg});
  await page.waitForFunction(()=>!/Preparando/.test(document.querySelector('#ownFurnStatus').textContent));
  for(const [id,val] of [['#ownFurn-widthMm','450'],['#ownFurn-depthMm','450'],['#ownFurn-heightMm','800']])await page.locator(id).fill(val);
  await page.locator('#ownFurnCreate').click();await page.locator('#ownFurnDialog').waitFor({state:'hidden',timeout:30000});
  const keys=await referenced(page);assert.equal(keys.length,1,'el proyecto cita una foto');
  assert.equal(await blobOk(page,keys[0]),true,'la foto está guardada');return keys[0];
}
// Trazado real: añadir una imagen de plano y quitarla con «Eliminar imagen» (dispara la recogida).
async function addTrace(page){
  const n=await page.evaluate(()=>FloorPlanApp.project.sourceImages?.length||0);
  await page.locator('#traceImageFile').setInputFiles(PLAN);
  await page.waitForFunction(n=>(FloorPlanApp.project.sourceImages?.length||0)>n,n);
}
async function removeTrace(page){
  await page.locator('#traceBtn').click();page.once('dialog',d=>d.accept());await page.locator('#traceRemoveImage').click();
  await page.waitForFunction(()=>!(FloorPlanApp.project.sourceImages?.length));
  // La recogida es asíncrona (bajo el Web Lock): se espera a que el almacén deje de tener la imagen de plano.
  await page.waitForFunction(async()=>!(await FloorPlanImages.keys()).some(k=>!k.startsWith('mue01/')),null,{timeout:15000}).catch(()=>{});
  await page.waitForTimeout(300);
}

test('H-1 · navegación real: quitar el trazado no borra la foto de MUE-01; sobrevive a la recarga',{timeout:180000},async()=>{
  const {context,page,watch}=await K.editor(env);
  try{
    const key=await addOwnFurniture(page,'Silla P0 navegación');
    await addTrace(page);
    // El trazado puede abrir otro proyecto: la foto sigue citada por el proyecto del mueble, guardado en la biblioteca.
    await removeTrace(page);
    assert.equal(await blobOk(page,key),true,'la foto sigue en el almacén tras quitar el trazado');
    await reopen(page);
    assert.deepEqual(await photoKeys(page),[key],'tras recargar, la foto persiste');
    assert.equal(await blobOk(page,key),true);
    // La imagen de plano, ya sin referencia, sí se ha recogido (sin regresión de la recogida).
    assert.deepEqual((await page.evaluate(()=>FloorPlanImages.keys())).filter(k=>!k.startsWith('mue01/')),[]);
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('H-1 · escenario Codex: quitar el trazado con otra pestaña abierta, cerrarla y recoger',{timeout:180000},async()=>{
  const {context,page,watch}=await K.editor(env);
  try{
    const key=await addOwnFurniture(page,'Silla P0 dos pestañas');
    await addTrace(page);
    const second=await context.newPage();await second.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await second.goto(env.base);await second.waitForFunction(()=>!!window.FloorPlanTraceUI);
    await removeTrace(page);
    assert.equal(await blobOk(page,key),true,'con otra pestaña abierta solo se marca');
    await second.close();
    // Sin otra pestaña: la recogida ya puede barrer. Se ejecuta explícitamente.
    await page.waitForFunction(async()=>(await navigator.locks.query()).held.filter(l=>l.name.startsWith(FloorPlanImages.TAB_LOCK)).length===1);
    await page.evaluate(()=>FloorPlanTraceUI.cleanup());
    assert.equal(await blobOk(page,key),true,'tras cerrar la segunda pestaña y recoger, la foto sigue');
    await reopen(page);assert.equal(await blobOk(page,key),true,'y tras recargar');
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

// Referencias fuera del proyecto en pantalla: biblioteca guardada, historial, autoridad de persistencia y sus conflictos,
// diario de recuperación, extensión de otra versión o dañada, y la foto en vuelo entre guardar los bytes y confirmar.
test('H-1 · biblioteca, historial, autoridad, conflictos, versión desconocida y foto en vuelo protegen la foto; lo huérfano se recoge',{timeout:180000},async()=>{
  const {context,page,watch}=await K.editor(env);
  try{
    await page.evaluate(()=>window.FloorPlanPersistence||new Promise((res,rej)=>{const s=document.createElement('script');s.src='js/persistence-store.js';s.onload=res;s.onerror=rej;document.head.append(s);}));
    const r=await page.evaluate(async()=>{
      const I=FloorPlanImages,P=FloorPlanPersistence,C=RubikOwnFurnitureCore;
      const hex=n=>n.toString(16).padStart(64,'0'),k=n=>'mue01/'+hex(n);
      const photo=n=>({imageKey:k(n),sha256:hex(n),mediaType:'image/jpeg',widthPx:10,heightPx:10,bytes:3,addedAt:'2026-11-19T00:00:00.000Z'});
      const withPhoto=(p,n,version=1)=>{const q=structuredClone(p);q.objects=[...(q.objects||[]),{id:'obj_p0_'+n,type:'chair',name:'p0',position:{x:0,y:0},rotationDeg:0,size:{widthMm:400,depthMm:400,heightMm:800}}];
        q.extensions={...(q.extensions||{}),'x-mue01-furniture-photo':{version,items:[{objectId:'obj_p0_'+n,photo:photo(n)}]}};return q;};
      const blob=()=>new Blob([new Uint8Array([1,2,3])],{type:'image/jpeg'});
      await I.put([1,2,3,4,5,6,7,8,9].map(n=>[k(n),blob()]).concat([['img_p0_orphan',blob()]]));
      const base=FloorPlanApp.project;
      // 1 · otro proyecto de la biblioteca guardada
      const R=window.FloorPlanPersistenceEditor,st=R?.session?R.storage:localStorage; // la autoridad vigente en este origen
      const lib=FloorPlanLibrary.load(st,FloorPlanCore.initial());lib.importProject(lib.project(),withPhoto(FloorPlanCore.initial(),1),'P0 otro');
      await R?.session?.flush?.();
      // 2 · historial (deshacer) del proyecto en pantalla: la foto se quitó pero se puede deshacer
      undoStack.push(JSON.stringify(withPhoto(base,2)));
      // 3 · extensión de una versión futura (no legible por C.read): estado indeterminado → se protege
      const fut=withPhoto(base,3,99);if(C.read(fut).status!=="future")throw Error("fixture");
      redoStack.push(JSON.stringify(fut));
      // 4 · autoridad de persistencia (docs) y 5 · sus conflictos
      const db=await P.open();await new Promise((res,rej)=>{const tx=db.transaction(['docs','conflicts'],'readwrite');
        tx.objectStore('docs').put(JSON.stringify(withPhoto(base,4)),'p0-doc');tx.objectStore('conflicts').add({docs:{x:JSON.stringify(withPhoto(base,5))}});tx.oncomplete=res;tx.onerror=rej;});db.close();
      // 6 · diario de recuperación de una restauración en curso
      localStorage.setItem('rubik-expediente-journal-v1:p0',JSON.stringify({images:[k(6)]}));
      // 7 · foto en vuelo: bytes guardados, proyecto aún sin confirmar
      const release=I.pin?.(k(7));
      // 8 · extensión dañada (versión correcta, forma inválida): indeterminado → se protege
      const bad=withPhoto(base,8);bad.extensions['x-mue01-furniture-photo'].items[0].extra=1;
      localStorage.setItem('rubik-sota-p0-revision',JSON.stringify({revision:bad}));
      // 9 · nadie la cita: debe recogerse, igual que la imagen de plano huérfana
      await FloorPlanTraceUI.cleanup();
      const after=new Set(await I.keys());release?.();
      await FloorPlanTraceUI.cleanup();const final=new Set(await I.keys());
      return {kept:[1,2,3,4,5,6,7,8].filter(n=>after.has(k(n))),orphan:after.has(k(9)),plan:after.has('img_p0_orphan'),pinnedAfterRelease:final.has(k(7))};
    });
    assert.deepEqual(r.kept,[1,2,3,4,5,6,7,8],'toda foto citada en algún estado vivo se conserva');
    assert.equal(r.orphan,false,'la foto huérfana se recoge');assert.equal(r.plan,false,'la imagen de plano huérfana se recoge');
    assert.equal(r.pinnedAfterRelease,false,'liberada y sin referencia, la foto en vuelo se recoge');
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('H-1 · sin poder leer el estado guardado no se borra nada',{timeout:120000},async()=>{
  const {context,page}=await K.editor(env);
  try{
    // Origen normal: la biblioteca guardada (localStorage) ilegible. Con F0.2b activo: la autoridad (IndexedDB) ilegible.
    const r=await page.evaluate(async()=>{const I=FloorPlanImages,key='mue01/'+'f'.repeat(64);await I.put([[key,new Blob([new Uint8Array([1])])]]);
      if(window.FloorPlanPersistenceEditor?.session){const P=FloorPlanPersistence,open=P.open;P.open=()=>Promise.reject(Error('autoridad ilegible'));
        try{await FloorPlanTraceUI.cleanup();}finally{P.open=open;}return (await I.keys()).includes(key);}
      const KEY='rubik-sota-project-library-v1',saved=localStorage.getItem(KEY);localStorage.setItem(KEY,'{corrupto');
      await FloorPlanTraceUI.cleanup();const kept=(await I.keys()).includes(key);localStorage.setItem(KEY,saved);return kept;});
    assert.equal(r,true);
  }finally{await context.close();}
});

// Auditoría cruzada en #270: la recogida lee las referencias y, antes de borrar, espera (aquí, en locks.query()). En ese
// intervalo la MISMA pestaña reutiliza una clave mue01/… ya guardada y sin referencia, guarda los bytes y confirma el
// proyecto. Sin exclusión, la pasada borraba después esa clave citada. La pausa se controla de forma determinista.
test('H-1 · cruce: reutilizar una foto huérfana mientras una recogida está en curso no la pierde',{timeout:180000},async()=>{
  const {context,page,watch}=await K.editor(env);
  try{
    const key=await addOwnFurniture(page,'Silla P0 cruce A');
    // La foto queda huérfana: se quita de A y se vacía el historial (nada en la pestaña la cita).
    await page.evaluate(()=>{const C=RubikOwnFurnitureCore,id=[...C.read(FloorPlanApp.project).items.keys()][0];
      const r=FloorPlanApp.applyOwnFurniture(p=>({ok:true,project:C.detach(p,id)}));if(!r?.ok)throw Error('detach');undoStack.length=0;redoStack.length=0;});
    assert.deepEqual(await referenced(page),[]);assert.equal(await blobOk(page,key),true);
    await page.evaluate(()=>{const L=navigator.locks;window.gate=new Promise(r=>{window.releaseGate=r;});window.queried=false;
      const locks={request:(...a)=>L.request(...a),query:async()=>{window.queried=true;await window.gate;return L.query();}};
      window.gcRun=FloorPlanImages.collect({live:async()=>new Set(),storage:localStorage,locks});});
    await page.waitForFunction(()=>window.queried);
    // Mientras la pasada espera: «Traer mi mueble» con la MISMA foto (misma clave mue01/<sha256>).
    const tab=page.locator('#paletteTabFurnish');if(await tab.getAttribute('aria-selected')!=='true')await tab.click();
    await page.locator('#ownFurnOpen').click();await page.locator('#ownFurn-name').fill('Silla P0 cruce B');
    await page.locator('#ownFurn-type').selectOption('chair');
    await page.locator('#ownFurn-photo').setInputFiles({name:'p0-sintetica.jpg',mimeType:'image/jpeg',buffer:jpg});
    await page.waitForFunction(()=>!/Preparando/.test(document.querySelector('#ownFurnStatus').textContent));
    for(const [id,val] of [['#ownFurn-widthMm','450'],['#ownFurn-depthMm','450'],['#ownFurn-heightMm','800']])await page.locator(id).fill(val);
    await page.locator('#ownFurnCreate').click();
    await page.waitForTimeout(1500); // sin exclusión, la confirmación ocurre aquí, antes de que la pasada continúe
    await page.evaluate(()=>{window.releaseGate();return window.gcRun;});
    await page.locator('#ownFurnDialog').waitFor({state:'hidden',timeout:30000});
    const keys=await referenced(page);assert.deepEqual(keys,[key],'B cita la misma clave');
    assert.equal(await blobOk(page,key),true,'la foto citada sigue en el almacén');
    await reopen(page);assert.deepEqual(await referenced(page),[key]);assert.equal(await blobOk(page,key),true,'y tras recargar');
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

// Auditoría cruzada en #270 (delta de1e419e): la creación espera el lock de la recogida; cancelar en ese intervalo o durante
// el guardado no debe fallar ni escribir nada en el proyecto, y un lock rechazado deja el formulario reutilizable.
test('H-1 · cancelar mientras espera el lock, durante el guardado o con el lock rechazado: sin errores ni cambios',{timeout:180000},async()=>{
  const {context,page,watch}=await K.editor(env);
  try{
    const fill=async label=>{const tab=page.locator('#paletteTabFurnish');if(await tab.getAttribute('aria-selected')!=='true')await tab.click();
      await page.locator('#ownFurnOpen').click();await page.locator('#ownFurn-name').fill(label);await page.locator('#ownFurn-type').selectOption('chair');
      await page.locator('#ownFurn-photo').setInputFiles({name:'p0-sintetica.jpg',mimeType:'image/jpeg',buffer:jpg});
      await page.waitForFunction(()=>!/Preparando/.test(document.querySelector('#ownFurnStatus').textContent));
      for(const [id,val] of [['#ownFurn-widthMm','450'],['#ownFurn-depthMm','450'],['#ownFurn-heightMm','800']])await page.locator(id).fill(val);};
    const objects=()=>page.evaluate(()=>FloorPlanApp.project.objects.length);
    const before=await objects();
    // 1 · Cancelar mientras la creación está en cola tras el lock de la recogida.
    await fill('Silla P0 cancelar en cola');
    await page.evaluate(()=>{window.gcHeld=new Promise(r=>{navigator.locks.request(FloorPlanImages.GC_LOCK,()=>new Promise(done=>{window.releaseGc=done;r();}));});return window.gcHeld;});
    await page.locator('#ownFurnCreate').click();
    await page.waitForFunction(async()=>(await navigator.locks.query()).pending.some(l=>l.name===FloorPlanImages.GC_LOCK));
    await page.locator('#ownFurnCancel').click();
    await page.evaluate(()=>window.releaseGc());
    await page.waitForFunction(async()=>!(await navigator.locks.query()).held.some(l=>l.name===FloorPlanImages.GC_LOCK));
    await page.waitForTimeout(300);
    assert.deepEqual(watch.errors,[],'cancelar en cola no produce errores');
    assert.equal(await objects(),before,'cancelar en cola no añade el mueble');
    // 2 · Cancelar mientras se guardan los bytes (dentro del lock).
    await fill('Silla P0 cancelar guardando');
    await page.evaluate(()=>{const I=FloorPlanImages,put=I.put;window.putGate=new Promise(r=>{window.releasePut=r;});window.putSeen=false;
      I.put=async e=>{window.putSeen=true;await window.putGate;I.put=put;return put(e);};});
    await page.locator('#ownFurnCreate').click();
    await page.waitForFunction(()=>window.putSeen);
    await page.locator('#ownFurnCancel').click();
    await page.evaluate(()=>window.releasePut());
    await page.waitForFunction(async()=>!(await navigator.locks.query()).held.some(l=>l.name===FloorPlanImages.GC_LOCK));
    await page.waitForTimeout(300);
    assert.deepEqual(watch.errors,[],'cancelar durante el guardado no produce errores');
    assert.equal(await objects(),before,'cancelar durante el guardado no añade el mueble');
    // 3 · Lock rechazado: mensaje, formulario reutilizable y, al reintentar, el mueble se crea.
    await fill('Silla P0 lock rechazado');
    await page.evaluate(()=>{const I=FloorPlanImages,g=I.guard;I.guard=()=>{I.guard=g;return Promise.reject(Error('lock'));};});
    await page.locator('#ownFurnCreate').click();
    await page.waitForFunction(()=>/ocupado/.test(document.querySelector('#ownFurnStatus').textContent));
    assert.equal(await page.locator('#ownFurnCreate').isDisabled(),false,'el botón vuelve a estar disponible');
    assert.equal(await objects(),before);
    await page.locator('#ownFurnCreate').click();await page.locator('#ownFurnDialog').waitFor({state:'hidden',timeout:30000});
    assert.equal(await objects(),before+1,'el reintento crea el mueble');
    assert.equal((await referenced(page)).length,1);
    assert.deepEqual(watch.errors,[],'sin errores de página (p. ej. «Cannot read properties of null»)');
  }finally{await context.close();}
});
