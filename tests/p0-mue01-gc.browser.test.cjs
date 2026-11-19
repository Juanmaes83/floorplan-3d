'use strict';
/* P0 · H-1 · Las fotos de MUE-01 («Traer mi mueble») no deben perderse en la recogida de imágenes (FloorPlanImages.collect).
   Antes de la corrección, la recogida solo contaba como referencias las imágenes de plano (sourceImages): al quitar el
   trazado, la foto del mueble propio (clave mue01/<sha256> en el mismo almacén) se borraba aunque el proyecto la siguiera
   citando. Navegador REAL (Chromium): IndexedDB, localStorage, Web Locks y recargas reales; fotos sintéticas. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const K=require('./photo-project/kit.cjs');
const PLAN=path.join(__dirname,'fixtures/manual-plan.png');
let env,jpg;
test.before(async()=>{env=await K.start();jpg=await K.synthPhoto(env.browser,{label:'P0 MUE01'});});
test.after(async()=>{await env?.stop();});

const photoKeys=page=>page.evaluate(async()=>(await FloorPlanImages.keys()).filter(k=>k.startsWith('mue01/')));
const referenced=page=>page.evaluate(()=>{const r=RubikOwnFurnitureCore.read(FloorPlanApp.project);return [...r.items.values()].filter(Boolean).map(p=>p.imageKey);});
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
    await K.reopen(page);
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
    await K.reopen(page);assert.equal(await blobOk(page,key),true,'y tras recargar');
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

// Referencias fuera del proyecto en pantalla: biblioteca guardada, historial, autoridad de persistencia y sus conflictos,
// diario de recuperación, extensión de otra versión o dañada, y la foto en vuelo entre guardar los bytes y confirmar.
test('H-1 · biblioteca, historial, autoridad, conflictos, versión desconocida y foto en vuelo protegen la foto; lo huérfano se recoge',{timeout:180000},async()=>{
  const {context,page,watch}=await K.editor(env);
  try{
    await page.evaluate(()=>new Promise((res,rej)=>{const s=document.createElement('script');s.src='js/persistence-store.js';s.onload=res;s.onerror=rej;document.head.append(s);}));
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
      const lib=FloorPlanLibrary.load(localStorage,FloorPlanCore.initial());lib.importProject(lib.project(),withPhoto(FloorPlanCore.initial(),1),'P0 otro');
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

test('H-1 · sin poder leer la biblioteca guardada no se borra nada',{timeout:120000},async()=>{
  const {context,page}=await K.editor(env);
  try{
    const r=await page.evaluate(async()=>{const I=FloorPlanImages,key='mue01/'+'f'.repeat(64);await I.put([[key,new Blob([new Uint8Array([1])])]]);
      const KEY='rubik-sota-project-library-v1',saved=localStorage.getItem(KEY);localStorage.setItem(KEY,'{corrupto');
      await FloorPlanTraceUI.cleanup();const kept=(await I.keys()).includes(key);localStorage.setItem(KEY,saved);return kept;});
    assert.equal(r,true);
  }finally{await context.close();}
});
