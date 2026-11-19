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
