'use strict';
/* OBR-02/03 · procedencia en la Evolución real (auditoría del propietario 13/11/2026, #211). Fixtures SINTÉTICAS (?lab=1):
   el panel dice de dónde sale cada dato; el fantasma son SOLO los vínculos comprobados en el modelo; un plan no
   concordante (otra revisión, vínculo roto) se avisa y no inventa geometría; cambiar de proyecto no arrastra fantasmas;
   seleccionar una tarea resalta solo sus elementos reales. Chromium + SwiftShader, no un dispositivo físico. */
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./obr02/kit.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
const DATE='2027-10-20';
const at=(page,date)=>page.evaluate(async d=>{const F=window.__ft3dFidelity;F.scene.setAuto(false);F.setDate(d);await new Promise(r=>setTimeout(r,500));},date);
const state=page=>page.evaluate(()=>{const P=window.__ft3dPlanPreview,F=window.__ft3dFidelity;return {prov:P.provenance,preview:F.scene.preview,
  bounds:Object.fromEntries((P.provenance?.next||[]).map(x=>[x.elementId,!!F.scene.screenBounds(x.elementId,{exact:true})]))};});
const openSources=page=>page.evaluate(()=>{const d=document.querySelector('.plan-preview .pp-src-d');d.open=true;return d.querySelector('.pp-src').innerText;});

test('caso A: fuentes con revisión y origen declarado; el fantasma son exactamente los vínculos comprobados',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    await at(page,DATE);const s=await state(page);
    assert.ok(s.prov.next.length>0&&s.prov.next.every(x=>x.status==='ok'));
    assert.deepEqual([...s.preview.keys].sort(),[...s.prov.ghostKeys].sort(),'fantasma = vínculos ok');
    // Los elementos de la siguiente tarea aún no están construidos en esa fecha (screenBounds solo mide lo visible): se
    // comprueba que cada vínculo comprobado produce exactamente un fantasma en la escena.
    assert.equal(s.preview.shown,s.prov.ghostKeys.length,'un fantasma por vínculo comprobado');
    const txt=await openSources(page);
    assert.match(txt,/DATOS SINTÉTICOS de prueba/);assert.match(txt,/origen: FIXTURE de prueba/);
    assert.match(txt,/huella SHA-256 [0-9a-f]{12}/);assert.match(txt,/hecho sobre esta revisión del proyecto/);
    assert.match(txt,/no verificable \(C1–C4 no guarda la revisión\)/);assert.match(txt,/Tareas sin elementos del modelo/);
    assert.match(txt,/no obra ejecutada ni certificada/);assert.match(txt,/no es gasto real/);
    assert.match(await page.locator('.plan-preview .pp-pct').innerText(),/del calendario del plan · planificado/);
    assert.match(await page.locator('.plan-preview .pp-cost').innerText(),/supuesto: reparto lineal por días; no es gasto/);
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('fin del plan: 100 % del calendario, dicho como plan y no como obra terminada',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    await at(page,'2028-06-01');const t=await page.locator('.plan-preview .pp-pct').innerText();
    assert.match(t,/100 % del calendario del plan · planificado/);assert.match(t,/Fin del plan: no es obra terminada ni certificada/);
    assert.match(await page.locator('.plan-preview .pp-exec').innerText(),/Ejecutado: sin registrar/);
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('adversarial: plan sobre otra revisión y con un vínculo inexistente → avisado, listado y SIN fantasma inventado',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    await at(page,DATE);
    await page.evaluate(async d=>{const F=window.__ft3dFidelity,c=JSON.parse(JSON.stringify(F.ctx.input));const id=window.__ft3dPlanPreview.snapshot.next.tasks[0].id,t=c.schedule.tasks.find(x=>x.id===id);
      t.elements=[...(t.elements||[]),{elementId:'project/wal_no-existe',role:'structure'}];delete t.elementIds;c.schedule.projectRef.revision='0'.repeat(64);
      await F.show(c,{...F.ctx.meta});F.scene.setAuto(false);F.setDate(d);await new Promise(r=>setTimeout(r,500));},DATE);
    const s=await state(page);
    assert.equal(s.prov.next.find(x=>x.elementId==='project/wal_no-existe').status,'broken');
    assert.ok(!s.preview.keys.includes('project/wal_no-existe'),'el vínculo roto no va al fantasma');
    assert.equal(s.preview.shown,s.prov.ghostKeys.length,'solo los vínculos comprobados producen fantasma');
    assert.deepEqual([...s.preview.keys].sort(),[...s.prov.ghostKeys].sort());
    await page.evaluate(()=>{document.querySelector('.plan-preview .pp-next-d').open=true;});
    assert.match(await page.locator('.plan-preview .pp-next').innerText(),/el identificador no existe en el proyecto: no se dibuja \(project\/wal_no-existe\)/);
    const txt=await openSources(page);
    assert.match(txt,/hecho sobre OTRA revisión del proyecto/);assert.match(txt,/apuntan a elementos que no existen en el proyecto/);
    assert.match(txt,/Nivel de la presentación\s*Vista interna exploratoria/);
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('cambiar de proyecto (A → C): ningún fantasma ni procedencia del anterior',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    await at(page,DATE);const a=await state(page);assert.ok(a.preview.keys.length>0);
    await page.evaluate(async()=>{await window.__ft3dFidelity.loadCase('C');});await at(page,'2027-02-06');
    const c=await state(page),inv=await page.evaluate(()=>window.__ft3dFidelity.ctx.model.inventory.elements.map(e=>e.key));
    assert.ok(c.preview.keys.length>0,'C tiene su propio fantasma');assert.ok(c.preview.keys.every(k=>inv.includes(k)),'todas las claves son de C');
    assert.ok(!c.preview.keys.some(k=>a.preview.keys.includes(k)),'ninguna clave de A');
    assert.match((await openSources(page)),/C · Reforma de piso existente/);
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('seleccionar una tarea resalta solo elementos reales vinculados; una tarea sin elementos no resalta nada',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    const r=await page.evaluate(()=>{const F=window.__ft3dFidelity,out={};for(const t of F.ctx.canon.tasks){const x=F.selectTask(t.id);out[t.id]={els:t.elements.length,hl:x.highlighted};}F.clearSelection();return out;});
    assert.equal(r.cimentacion.els,0);assert.equal(r.cimentacion.hl,0,'sin elementos: nada resaltado');
    for(const [id,v] of Object.entries(r))if(v.els&&id!=='cubierta')assert.ok(v.hl>0,id+' resalta sus elementos');
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('móvil 390×844: «Fuentes y vínculos» se abre con un toque y no desborda la pantalla',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env,{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});try{
    await at(page,DATE);const sum=page.locator('.plan-preview .pp-src-d summary');await sum.scrollIntoViewIfNeeded();
    const hit=await sum.evaluate(el=>{const r=el.getBoundingClientRect(),t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {h:r.height,ok:t===el||el.contains(t)};});
    assert.ok(hit.ok,'la cabecera recibe el toque');assert.ok(hit.h>=36);
    await sum.tap();assert.equal(await page.evaluate(()=>document.querySelector('.plan-preview .pp-src-d').open),true);
    assert.equal(await page.evaluate(W=>document.documentElement.scrollWidth<=W+1&&document.querySelector('.plan-preview').getBoundingClientRect().right<=W+1,390),true,'sin desbordar el ancho real');
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});
