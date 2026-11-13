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
    assert.match(await page.locator('.plan-preview .pp-src-d > summary').innerText(),/Plan ≠ obra · coste ≠ gasto/,'se ve sin desplegar nada');
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('fin del plan: 100 % del calendario, dicho como plan y no como obra terminada',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    await at(page,'2028-06-01');const t=await page.locator('.plan-preview .pp-pct').innerText();
    assert.match(t,/100 % del calendario del plan: fin del plan, no obra terminada/);
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
    assert.deepEqual(s.prov.ghostKeys,[],'plan de otra revisión: ni siquiera los vínculos que existen se dibujan');
    await page.evaluate(()=>{document.querySelector('.plan-preview .pp-next-d').open=true;});
    assert.match(await page.locator('.plan-preview .pp-next').innerText(),/el identificador no existe en el proyecto: no se dibuja \(project\/wal_no-existe\)/);
    const txt=await openSources(page);
    assert.match(txt,/hecho sobre OTRA revisión del proyecto/);assert.match(txt,/apuntan a elementos que no existen en el proyecto/);
    assert.match(txt,/Nivel de la presentación\s*Vista interna exploratoria · plan de otra revisión · no validado sobre la actual/);
    assert.equal(await page.locator('.plan-preview .pp-ghost').isDisabled(),true);
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('cierre del adversarial: plan de OTRA revisión que cita elementos que SÍ existen → sin fantasma, y el panel dice por qué',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    await at(page,DATE);const base=await state(page);
    assert.ok(base.prov.ghostKeys.length>0&&base.preview.shown===base.prov.ghostKeys.length,'control: misma revisión → hay fantasma');
    const ids=base.prov.next.map(x=>x.elementId);
    // Solo cambia la revisión declarada por el plan: los identificadores son los mismos y existen en el proyecto.
    await page.evaluate(async d=>{const F=window.__ft3dFidelity,c=JSON.parse(JSON.stringify(F.ctx.input));c.schedule.projectRef.revision='f'.repeat(64);
      await F.show(c,{...F.ctx.meta});F.scene.setAuto(false);F.setDate(d);await new Promise(r=>setTimeout(r,500));},DATE);
    const s=await state(page);
    assert.deepEqual(s.prov.next.map(x=>x.elementId),ids,'los mismos vínculos');
    assert.ok(s.prov.next.every(x=>x.status==='ok'&&x.ghost===false&&x.withheld==='plan-other-revision'));
    assert.deepEqual(s.prov.ghostKeys,[]);assert.deepEqual(s.preview.keys,[]);assert.equal(s.preview.shown,0,'ningún fantasma en la escena');
    assert.deepEqual(await page.evaluate(()=>({k:window.__ft3dPlanPreview.ghostKeys,n:window.__ft3dPlanPreview.shown})),{k:[],n:0},'el panel tampoco aplica fantasma (aunque la casilla «Ver en fantasma» siga marcada)');
    await page.evaluate(()=>{document.querySelector('.plan-preview .pp-next-d').open=true;});
    const next=await page.locator('.plan-preview .pp-next').innerText();
    assert.match(next,/Sin fantasma: el plan es de otra revisión del proyecto/);
    assert.match(next,/existe en el proyecto, pero el plan es de otra revisión: no se dibuja hasta reconciliar las fuentes/);
    const txt=await openSources(page);
    assert.match(txt,/hecho sobre OTRA revisión del proyecto/);assert.match(txt,/No se dibuja ningún fantasma de este plan hasta reconciliar las fuentes/);
    // El nivel es el que calcula el adaptador FT3D-8 (no se toca aquí): un plan válido de otra revisión se queda en
    // «orientativa», bloqueado por revisión no vigente; nunca sube a «plan con revisión declarada». Con un vínculo roto
    // (prueba anterior) baja a «Vista interna exploratoria».
    const lvl=await page.evaluate(()=>{const m=window.__ft3dFidelity.ctx.model;return {level:m.delivery.level,blockers:m.delivery.blockers};});
    assert.equal(lvl.level,'orientative');assert.ok(lvl.blockers.includes('schedule-revision-not-current')||lvl.blockers.includes('project-revision-not-current'),JSON.stringify(lvl.blockers));
    assert.match(txt,/Nivel de la presentación\s*Presentación orientativa \(plan sin revisión declarada o incompleto\) · plan de otra revisión · no validado sobre la actual/);
    // La casilla del fantasma no da a entender que hay algo dibujado: deshabilitada y con el motivo a la vista.
    const tg=await page.evaluate(()=>{const i=document.querySelector('.plan-preview .pp-ghost'),w=document.getElementById(i.getAttribute('aria-describedby')||'');
      return {disabled:i.disabled,checked:i.checked,why:w?.textContent||null,whyVisible:!!w&&w.getBoundingClientRect().height>0};});
    assert.equal(tg.disabled,true);assert.equal(tg.checked,false);assert.ok(tg.whyVisible);
    assert.match(tg.why,/No disponible: el plan es de otra revisión del proyecto; no se dibuja nada hasta reconciliar las fuentes/);
    // Al volver a un plan concordante, la preferencia de la persona se conserva y el fantasma vuelve.
    await page.evaluate(async d=>{const F=window.__ft3dFidelity,c=JSON.parse(JSON.stringify(F.ctx.input));c.schedule.projectRef.revision=F.ctx.model.fingerprints.project;
      await F.show(c,{...F.ctx.meta});F.scene.setAuto(false);F.setDate(d);await new Promise(r=>setTimeout(r,500));},DATE);
    const back=await page.evaluate(()=>{const i=document.querySelector('.plan-preview .pp-ghost');return {disabled:i.disabled,checked:i.checked,shown:window.__ft3dFidelity.scene.preview.shown};});
    assert.deepEqual({disabled:back.disabled,checked:back.checked},{disabled:false,checked:true});assert.ok(back.shown>0,'con la revisión concordante vuelve el fantasma');
    // Nada inventado: ni avance ejecutado ni vínculos documentales.
    assert.equal(await page.evaluate(()=>window.__ft3dPlanPreview.snapshot.executed.status),'not-recorded');
    assert.match(txt,/RUBIK no registra avance real de obra; todo lo de aquí es plan/);
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
    assert.ok(hit.ok,'la cabecera recibe el toque');assert.ok(hit.h>=24,'objetivo táctil ≥ 24 px (WCAG 2.5.8)');
    await sum.tap();assert.equal(await page.evaluate(()=>document.querySelector('.plan-preview .pp-src-d').open),true);
    assert.equal(await page.evaluate(W=>document.documentElement.scrollWidth<=W+1&&document.querySelector('.plan-preview').getBoundingClientRect().right<=W+1,390),true,'sin desbordar el ancho real');
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

/* Regresión hallada en el recorrido de la Preview (13/11): en el móvil, con «Siguiente tarea» desplegada, el panel tapaba
   casi todo el escenario y uno de sus botones recibía el toque destinado al muro de carga (OBR-01 · EX-05.3). */
test('móvil 390×844: con la siguiente tarea desplegada, el panel no pasa del 45 % del escenario y el toque en el muro lo selecciona',{timeout:240000},async()=>{
  const O=require('./obr01/browser-kit.cjs'),env1=await O.start();
  try{const {context,page,watch}=await O.openEvolution(env1,{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});try{
    const r=await page.evaluate(async()=>{const F=window.__ft3dFidelity;F.scene.setAuto(false);F.setDate('2027-04-14');document.querySelector('[data-view="top"]').click();
      const rt=document.getElementById('roofToggle');if(rt&&rt.checked)rt.click();document.querySelector('.plan-preview .pp-next-d').open=true;await new Promise(r=>setTimeout(r,800));
      const st=document.getElementById('stage').getBoundingClientRect(),pn=document.querySelector('.plan-preview').getBoundingClientRect();
      const k='project/wal_ref-w0',b=F.scene.screenBounds(k,{exact:true});let pt=null;
      if(b)outer:for(let i=0;i<=12;i++)for(let j=0;j<=12;j++){const nx=b.x0+(b.x1-b.x0)*i/12,ny=b.y0+(b.y1-b.y0)*j/12,x=st.left+(nx+1)/2*st.width,y=st.top+(1-ny)/2*st.height;
        if(x>st.left&&x<st.right&&y>st.top&&y<st.bottom&&F.scene.pick(x,y)===k){pt={x,y};break outer;}}
      return {ratio:pn.height/st.height,pt};});
    assert.ok(r.ratio<=0.46,`el panel ocupa ${(r.ratio*100).toFixed(0)} % del escenario`);assert.ok(r.pt,'el muro es alcanzable');
    await page.touchscreen.tap(r.pt.x,r.pt.y);await page.waitForTimeout(500);
    assert.equal(await page.evaluate(()=>{const b=document.getElementById('pickInfo');return b.hidden?null:b.dataset.key;}),'project/wal_ref-w0');
    // La ficha que se acaba de abrir queda ENCIMA del panel del plan: su título y «Cerrar» se ven y se pueden tocar
    // (antes el panel desplegado tapaba el título de la ficha en móvil; evidencia 2-muro-carga-con-fantasma-movil).
    // El panel lleva pointer-events:none (deja pasar los clics al escenario), así que elementFromPoint lo atraviesa aunque
    // esté pintado encima: para medir el ORDEN DE PINTADO se vuelve «tocable» solo durante la comprobación.
    const top=await page.evaluate(()=>{const pick=document.getElementById('pickInfo'),probe=document.createElement('style');
      probe.textContent='.plan-preview,.plan-preview *{pointer-events:auto!important}';document.head.append(probe);
      const hit=el=>{const r=el.getBoundingClientRect(),e=document.elementFromPoint(r.left+Math.min(r.width/2,40),r.top+r.height/2);return !!e&&pick.contains(e);};
      const h=pick.querySelector('h4'),close=[...pick.querySelectorAll('button')].find(b=>/Cerrar/.test(b.textContent));
      const out={title:h?.textContent||null,titleOnTop:!!h&&hit(h),closeOnTop:!!close&&hit(close)};probe.remove();return out;});
    assert.ok(top.titleOnTop,`el título de la ficha («${top.title}») no queda tapado por el panel del plan`);assert.ok(top.closeOnTop,'«Cerrar» de la ficha se puede tocar');
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}}finally{await env1.stop();}
});
