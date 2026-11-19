'use strict';
/* A0 · Puerta de escritores (contrato F0.2c R1 §3, pruebas R1-T01–T04). Navegador REAL (Chromium): editor completo,
   IndexedDB, localStorage, BroadcastChannel, eventos `storage` y descargas reales. Se ejecuta en el origen normal
   (localStorage es la autoridad de las cinco claves) y en el origen aislado de F0.2b (autoridad IndexedDB). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises');
const K=require('./photo-project/kit.cjs');
const ORIGINS=[['normal','127.0.0.1'],['F0.2b activo','f0-2b.localhost']];
const LIB='rubik-sota-project-library-v1',PROJECT='rubik-sota-floorplan-project-v1';
let env;
test.before(async()=>{env=await K.start();});
test.after(async()=>{await env?.stop();});
const at=(host)=>({...env,base:env.base.replace('127.0.0.1',host)});
const authorityOn=page=>page.evaluate(()=>!!window.FloorPlanPersistenceEditor?.session);
// Lo guardado de verdad: localStorage (origen normal) o la autoridad IndexedDB (F0.2b), sin pasar por la puerta.
const stored=page=>page.evaluate(async([LIB,PROJECT])=>{
  if(window.FloorPlanPersistenceEditor?.session){const P=FloorPlanPersistence,db=await P.open();try{const {revision,docs}=await P.load(db);return {revision,lib:docs.get(LIB)??null,project:docs.get(PROJECT)??null};}finally{db.close();}}
  return {revision:null,lib:localStorage.getItem(LIB),project:localStorage.getItem(PROJECT)};},[LIB,PROJECT]);
const flush=page=>page.evaluate(async()=>{const s=window.FloorPlanPersistenceEditor?.session;if(!s)return null;const st=await s.flush();return {status:st.status,code:st.error?.code||null};});
// Un cambio real del editor, por su camino de confirmación (validación, deshacer, guardado).
const rename=(page,name)=>page.evaluate(n=>FloorPlanApp.applyExtension(p=>({ok:true,project:{...p,name:n}})),name);
const banner=page=>page.evaluate(()=>{const b=document.getElementById('a0Banner');return b?{state:b.dataset.state,text:b.innerText,role:b.getAttribute('role')}:null;});

for(const [label,host] of ORIGINS){
  test(`R1-T01 · ${label}: otra pestaña sube la versión de la base de imágenes; esta cierra su conexión, no bloquea y avisa`,{timeout:120000},async()=>{
    const {context,page,watch}=await K.editor(at(host));
    try{
      await page.evaluate(()=>FloorPlanImages.keys()); // conexión abierta en esta pestaña
      const other=await context.newPage();await other.goto(at(host).base+'tests/fixtures/manual-plan.png');
      const upgraded=await other.evaluate(()=>new Promise(res=>{const r=indexedDB.open('rubik-sota-images-v1',2);let blocked=false;
        r.onblocked=()=>{blocked=true;};r.onupgradeneeded=()=>{};r.onsuccess=()=>{r.result.close();res({ok:true,blocked});};r.onerror=()=>res({ok:false,blocked});
        setTimeout(()=>res({ok:false,blocked,timeout:true}),8000);}));
      assert.deepEqual(upgraded,{ok:true,blocked:false},'la subida de versión no queda bloqueada por esta pestaña');
      await page.waitForFunction(()=>document.getElementById('a0Banner')?.dataset.state==='outdated');
      const b=await banner(page);assert.equal(b.role,'alert');assert.match(b.text,/Estado de tus datos/);assert.match(b.text,/Qué hacer/);
      const put=await page.evaluate(()=>FloorPlanImages.put([['img_a0',new Blob([new Uint8Array([1])])]]).then(()=>'escrito',e=>e.code||e.message));
      assert.notEqual(put,'escrito','una pestaña desactualizada no escribe imágenes');
      assert.deepEqual(watch.errors,[]);
    }finally{await context.close();}
  });

  test(`R1-T02 · ${label}: con una época mayor ningún escritor confirma; los cambios siguen en la pestaña y se exportan`,{timeout:120000},async()=>{
    const {context,page,watch}=await K.editor(at(host));
    try{
      await rename(page,'A0 antes');await flush(page);
      const before=await stored(page);assert.match(before.project||before.lib||'',/A0 antes/);
      await page.evaluate(()=>FloorPlanImages.put([['img_a0_huerfana',new Blob([new Uint8Array([1])])]]));
      // Otra pestaña (con F0.2c) anuncia la época 2: llega por el evento storage y el BroadcastChannel.
      const other=await context.newPage();await other.goto(at(host).base+'tests/fixtures/manual-plan.png');
      await other.addScriptTag({path:require('node:path').join(K.ROOT,'js/schema-epoch.js')});
      await other.evaluate(()=>FloorPlanSchemaEpoch.announce(2));
      await page.waitForFunction(()=>document.getElementById('a0Banner')?.dataset.state==='outdated');
      await rename(page,'A0 después');
      const f=await flush(page);if(f)assert.equal(f.code,'schema-outdated');
      const after=await stored(page);
      assert.equal(after.project,before.project,'el proyecto guardado no cambia');assert.equal(after.lib,before.lib,'la biblioteca guardada no cambia');
      assert.equal(after.revision,before.revision,'ninguna revisión nueva');
      assert.equal(await page.evaluate(()=>FloorPlanApp.project.name),'A0 después','el cambio sigue en la pestaña');
      // Ni imágenes ni recogida.
      const put=await page.evaluate(()=>FloorPlanImages.put([['img_a0_nueva',new Blob([new Uint8Array([2])])]]).then(()=>'escrito',e=>e.code));
      assert.equal(put,'schema-outdated');
      await page.evaluate(()=>FloorPlanTraceUI.cleanup());
      assert.ok((await page.evaluate(()=>FloorPlanImages.keys())).includes('img_a0_huerfana'),'la recogida no borra nada');
      // Exportación de emergencia desde el aviso: contiene el cambio no guardado.
      const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('#a0Banner button',{hasText:'Exportar copia de emergencia'}).click()]);
      const body=await fs.readFile(await dl.path(),'utf8');assert.match(body,/A0 después/,'la copia incluye el cambio retenido');
      assert.deepEqual(watch.errors,[]);
    }finally{await context.close();}
  });

  test(`R1-T02b · ${label}: marcador ilegible → estado indeterminado, se falla cerrado`,{timeout:120000},async()=>{
    const {context,page,watch}=await K.editor(at(host));
    try{
      await rename(page,'A0 base');await flush(page);const before=await stored(page);
      await page.evaluate(k=>{localStorage.setItem(k,'{dañado');},'rubik-sota-schema-epoch-v1');
      await page.evaluate(()=>window.dispatchEvent(new StorageEvent('storage',{key:'rubik-sota-schema-epoch-v1'})));
      await page.waitForFunction(()=>document.getElementById('a0Banner')?.dataset.state==='indeterminate');
      await rename(page,'A0 indeterminado');await flush(page);
      const after=await stored(page);assert.equal(after.project,before.project);assert.equal(after.lib,before.lib);
      assert.deepEqual(watch.errors,[]);
    }finally{await context.close();}
  });

  test(`R1-T04 · ${label}: con la misma época nada cambia y se registra el escritor`,{timeout:120000},async()=>{
    const {context,page,watch}=await K.editor(at(host));
    try{
      await rename(page,'A0 igual');const f=await flush(page);if(f)assert.equal(f.status,'saved');
      const s=await stored(page);assert.match(s.project||s.lib||'',/A0 igual/);
      assert.equal(await banner(page),null,'sin aviso');
      const seen=await page.evaluate(async()=>{const S=window.FloorPlanPersistenceEditor?.session;
        if(S){const db=await FloorPlanPersistence.open();try{return await new Promise(r=>{const g=db.transaction('meta').objectStore('meta').get('writersSeen:1');g.onsuccess=()=>r(!!g.result?.at);});}finally{db.close();}}
        return !!JSON.parse(localStorage.getItem('rubik-sota-writers-seen-v1')||'{}')[1];});
      assert.equal(seen,true,'evidencia de convivencia registrada');
      assert.deepEqual(watch.errors,[]);
    }finally{await context.close();}
  });
}

// R1-T03 · la época de la autoridad se lee DENTRO de la transacción de confirmación: una conmutación concurrente queda
// antes (la confirmación se rechaza) o después (la confirmación entra con la época anterior), nunca mezclada.
test('R1-T03 · F0.2b activo: época de la autoridad leída en la misma transacción; sin escrituras mezcladas',{timeout:120000},async()=>{
  const {context,page,watch}=await K.editor(at('f0-2b.localhost'));
  try{
    assert.equal(await authorityOn(page),true);
    await rename(page,'T03 base');await flush(page);const base=await stored(page);
    // Solo la autoridad cambia de época (sin marcador en localStorage): únicamente la comprobación transaccional lo ve.
    for(const order of ['epoch-first','commit-first']){
      const r=await page.evaluate(async([order,LIB])=>{const S=FloorPlanPersistenceEditor.session,P=FloorPlanPersistence;
        const db=await P.open();
        const bump=()=>new Promise(res=>{const t=db.transaction('meta','readwrite');t.objectStore('meta').put({epoch:2},'schemaEpoch');t.oncomplete=res;});
        const reset=()=>new Promise(res=>{const t=db.transaction('meta','readwrite');t.objectStore('meta').delete('schemaEpoch');t.oncomplete=res;});
        FloorPlanApp.applyExtension(p=>({ok:true,project:{...p,name:'T03 '+order}}));
        FloorPlanSchemaEpoch._reset(); // cada orden empieza con la pestaña vigente
        let st;if(order==='epoch-first'){await bump();st=await S.flush();}else{const f=S.flush();await bump();st=await f;}
        const {revision,docs}=await P.load(db);await reset();db.close();
        return {status:st.status,code:st.error?.code||null,revision,lib:docs.get(LIB)};},[order,LIB]);
      if(order==='epoch-first'){assert.equal(r.code,'schema-outdated');assert.equal(r.lib,base.lib,'rechazada: nada escrito');assert.equal(r.revision,base.revision);}
      else assert.ok(r.code==='schema-outdated'?r.lib===base.lib:/T03 commit-first/.test(r.lib),'o entra entera antes de la conmutación, o no entra');
    }
    assert.deepEqual(watch.errors.filter(e=>!/schema/.test(e)),[]);
  }finally{await context.close();}
});

// ── Revisión ChatGPT de #273 · riesgo 1: la época se comprueba DESPUÉS de las esperas, dentro de la sección protegida ──
for(const [label,host] of ORIGINS){
  test(`A0 · ${label}: una escritura de bytes y una pasada de recogida que esperaban no escriben si la época cambió durante la espera`,{timeout:120000},async()=>{
    const {context,page,watch}=await K.editor(at(host));
    try{
      const r=await page.evaluate(async()=>{const I=FloorPlanImages,E=FloorPlanSchemaEpoch;
        await I.put([['img_a0_huerfana2',new Blob([new Uint8Array([1])])]]);
        // put: la llamada pasa la puerta síncrona de antes, pero la época cambia mientras espera la conexión.
        const p=I.put([['img_a0_tarde',new Blob([new Uint8Array([2])])]]).then(()=>'escrito',e=>e.code);E.announce(2);const put=await p;
        E._reset();localStorage.removeItem(E.KEY);
        // recogida: la época cambia mientras la pasada espera (locks.query retenido).
        const L=navigator.locks;let release;const gate=new Promise(r=>{release=r;});let queried=false;
        const locks={request:(...a)=>L.request(...a),query:async()=>{queried=true;await gate;return L.query();}};
        const run=I.collect({live:async()=>new Set(),storage:localStorage,locks});
        while(!queried)await new Promise(r=>setTimeout(r,20));
        E.announce(2);release();const gc=await run;
        const keys=await I.keys();E._reset();localStorage.removeItem(E.KEY);
        return {put,late:keys.includes('img_a0_tarde'),orphan:keys.includes('img_a0_huerfana2'),removed:gc.removed};});
      assert.equal(r.put,'schema-outdated','la escritura que esperaba se rechaza');assert.equal(r.late,false);
      assert.equal(r.orphan,true,'la pasada que esperaba no borra');assert.deepEqual(r.removed,[]);
      assert.deepEqual(watch.errors,[]);
    }finally{await context.close();}
  });
}

test('A0 · F0.2b activo: confirmación tras esperar el lock, espejo tras la barrera y conflictos leen la época dentro de su escritura',{timeout:120000},async()=>{
  const {context,page,watch}=await K.editor(at('f0-2b.localhost'));
  try{
    await rename(page,'A0 base espejo');await flush(page);
    const r=await page.evaluate(async([LIB,PROJECT])=>{const P=FloorPlanPersistence,E=FloorPlanSchemaEpoch,db=await P.open();
      const metaPut=(v,k)=>new Promise(res=>{const t=db.transaction('meta','readwrite');v===null?t.objectStore('meta').delete(k):t.objectStore('meta').put(v,k);t.oncomplete=res;});
      const {revision}=await P.load(db),base=(await P.load(db)).docs.get(LIB);
      // 1 · Confirmación: el lock tarda; mientras, SOLO la autoridad pasa a la época 2 (sin marcador de localStorage).
      const L=navigator.locks;let go;const gate=new Promise(r=>{go=r;});
      const slow={request:(n,f)=>L.request(n,async()=>{await gate;return f();}),query:()=>L.query()};
      const c=P.commit({db,locks:slow,storage:localStorage,baseRevision:revision,changes:{[LIB]:base.replace('A0 base espejo','A0 tarde')}}).then(()=>'escrito',e=>e.code);
      await metaPut({epoch:2},'schemaEpoch');go();const commit=await c;
      const after=(await P.load(db));await metaPut(null,'schemaEpoch');E._reset();
      // 2 · Conflictos: con la época 2 en la autoridad, ni siquiera se puede retirar un registro de conflicto.
      const before=(await P.conflicts(db)).length;
      const add=await new Promise(res=>{const t=db.transaction('conflicts','readwrite');const q=t.objectStore('conflicts').add({reason:'prueba-a0',docs:{},at:new Date().toISOString()});t.oncomplete=()=>res(q.result);});
      await metaPut({epoch:2},'schemaEpoch');
      const rm=await P.removeConflict(db,add).then(()=>'borrado',e=>e.code);
      const kept=(await P.conflicts(db)).some(x=>x.id===add);await metaPut(null,'schemaEpoch');E._reset();
      // 3 · Espejo: la época cambia justo después de escribir la barrera; ninguna otra clave de localStorage se toca.
      const {revision:rev2,docs}=await P.load(db);const snapshot=Object.fromEntries(P.KEYS.map(k=>[k,localStorage.getItem(k)]));
      const m=await P.commit({db,locks:L,storage:localStorage,baseRevision:rev2,changes:{[LIB]:docs.get(LIB).replace('A0 base espejo','A0 espejo')},
        hooks:{afterBarrier:async()=>{localStorage.setItem(E.KEY,JSON.stringify({epoch:2}));}}});
      const touched=P.KEYS.filter(k=>k!==LIB&&localStorage.getItem(k)!==snapshot[k]);
      localStorage.removeItem(E.KEY);E._reset();db.close();
      return {commit,rev:after.revision,same:after.docs.get(LIB)===base,rm,kept,mirror:m.mirror,touched};},[LIB,PROJECT]);
    assert.equal(r.commit,'schema-outdated','la confirmación que esperaba el lock se rechaza en su transacción');
    assert.equal(r.same,true,'el documento no cambia');
    assert.equal(r.rm,'schema-outdated');assert.equal(r.kept,true,'el conflicto se conserva');
    assert.equal(r.mirror.ok,false,'el espejo se detiene tras la barrera');assert.deepEqual(r.touched,[],'ninguna otra clave del espejo se escribe');
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

// ── Riesgo 2: la copia exportada solo autoriza recargar si nada cambió después ──────────────────────────────────────────
test('A0 · cambios después de exportar invalidan la autorización de recarga; sin cambios, recarga directa',{timeout:120000},async()=>{
  const {context,page,watch}=await K.editor(at('127.0.0.1'));
  try{
    await page.evaluate(()=>FloorPlanSchemaEpoch.announce(2));
    await page.waitForFunction(()=>document.getElementById('a0Banner')?.dataset.state==='outdated');
    await rename(page,'A0 exportado');
    const exportNow=()=>Promise.all([page.waitForEvent('download'),page.locator('#a0Banner button',{hasText:'Exportar copia de emergencia'}).click()]);
    await exportNow();
    await rename(page,'A0 posterior a la copia');
    const dialogs=[];page.on('dialog',d=>{dialogs.push(d.message());d.dismiss();});
    await page.locator('#a0Banner button',{hasText:'Recargar RUBIK'}).click();
    await page.waitForTimeout(500);
    assert.equal(dialogs.length,1,'pide confirmación');assert.match(dialogs[0],/después de exportar/);
    assert.equal(await page.evaluate(()=>FloorPlanApp.project.name),'A0 posterior a la copia','no recarga ni pierde el cambio');
    // Exportar de nuevo cubre el último cambio: recarga sin preguntar.
    await exportNow();
    await Promise.all([page.waitForEvent('load'),page.locator('#a0Banner button',{hasText:'Recargar RUBIK'}).click()]);
    assert.equal(dialogs.length,1,'sin una segunda confirmación');
    assert.deepEqual(watch.errors,[]);
  }finally{await page.evaluate(()=>localStorage.removeItem('rubik-sota-schema-epoch-v1')).catch(()=>{});await context.close();}
});
