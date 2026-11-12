'use strict';
/* OBR-02 + OBR-03 · panel «Plan a la fecha» y fantasma de la siguiente tarea en la Evolución real (FT3D-8), con las
   fixtures sintéticas de laboratorio (?lab=1). Planificado ≠ ejecutado ≠ desconocido; «No disponible» nunca es 0. */
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./obr02/kit.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
const openNext=page=>page.evaluate(()=>{const d=document.querySelector('.plan-preview .pp-next-d');if(d)d.open=true;});
const PP=page=>page.evaluate(()=>{const s=window.__ft3dPlanPreview,b=document.querySelector('.plan-preview');return {snap:s.snapshot,ghost:s.ghostKeys,shown:s.shown,
  scene:window.__ft3dFidelity.scene.preview,text:b.innerText,ring:b.querySelector('.pp-ringtxt').textContent,hidden:b.hidden};});
const setDate=(page,d)=>page.evaluate(d=>{const f=window.__ft3dFidelity;f.scene.setAuto(false);f.setDate(d);},d);
const task=(page,i)=>page.evaluate(i=>window.__ft3dFidelity.ctx.schedule.tasks[i],i);

test('A: anillo planificado, coste planificado a la fecha y siguiente tarea con fantasma de sus elementos',{timeout:120000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    const t2=await task(page,2);await setDate(page,t2.startDate);await K.frames(page,3);await openNext(page);const r=await PP(page);
    assert.equal(r.hidden,false);assert.equal(r.snap.state,'available');assert.equal(r.ring,new Intl.NumberFormat('es-ES',{maximumFractionDigits:1}).format(r.snap.progress.percent)+'%');
    assert.match(r.text,/% del plan transcurrido · planificado/);assert.match(r.text,/Coste planificado a la fecha: [\d.,]+\s€ sin IVA de 19\.717,64\s€ planificados/);
    assert.match(r.text,/Ejecutado: sin registrar/);assert.ok(!/ejecutad[oa]\s*:\s*\d/i.test(r.text),'nunca un ejecutado con cifra');
    const n=r.snap.next.tasks[0];assert.match(r.text,new RegExp(`SIGUIENTE TAREA · PLANIFICADA[\\s\\S]*${n.wbs} `,'i'));assert.match(r.text,/Depende de:/);
    assert.deepEqual(r.ghost,n.previewElementIds);assert.deepEqual(r.scene.keys,n.previewElementIds);assert.ok(r.scene.shown>0,'fantasma en escena');
    // Quitar el fantasma deja la escena como estaba.
    const before=await page.evaluate(()=>window.__ft3dFidelity.visiblePieces);
    await page.locator('.pp-ghost').uncheck();const off=await PP(page);assert.deepEqual(off.scene.keys,[]);assert.equal(off.scene.shown,0);
    assert.equal(await page.evaluate(()=>window.__ft3dFidelity.visiblePieces),before);
    await page.locator('.pp-ghost').check();assert.ok((await PP(page)).scene.shown>0);
    // «Ver en el plan» selecciona la tarea en el plan existente.
    await page.locator('.plan-preview [data-task]').first().click();assert.equal(await page.evaluate(()=>window.__ft3dFidelity.selected),n.id);
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('A: reproducción — el anillo y el coste solo crecen; al final 100 % y sin siguiente tarea',{timeout:120000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    let prev={p:-1,c:-1};
    for(let i=0;i<7;i++){const t=await task(page,i);await setDate(page,t.endDate);const r=await PP(page);
      assert.ok(r.snap.progress.percent>=prev.p);assert.ok(r.snap.cost.amount>=prev.c);prev={p:r.snap.progress.percent,c:r.snap.cost.amount};}
    await page.evaluate(()=>window.__ft3dFidelity.end());await openNext(page);const r=await PP(page);
    assert.equal(r.snap.progress.percent,100);assert.equal(r.snap.cost.amount,19717.64);assert.equal(r.snap.next.state,'none');assert.deepEqual(r.scene.keys,[]);
    assert.match(r.text,/El plan ya está completado/);assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('B (edificio sin reparto) y D (sin plan): «No disponible» con su motivo, nunca 0 €',{timeout:120000},async()=>{
  for(const [id,re] of [['B',/edificio todavía no se reparten/],['D',/Sin plan de obra/]]){
    const {context,page,watch}=await K.openEvolution(env,{caseId:id});try{
      const r=await PP(page);assert.equal(r.snap.cost.amount,null);assert.match(r.text,/No disponible/);assert.match(r.text,re);
      assert.ok(!/0,00\s*€/.test(r.text),'nunca 0 €');assert.match(r.text,/Ejecutado: sin registrar/);
      if(id==='D'){assert.equal(r.ring,'—');assert.equal(r.snap.progress,null);}else assert.ok(r.snap.progress.percent>=0);
      assert.deepEqual(watch.errors,[]);
    }finally{await context.close();}
  }
});

test('el plan cambia (importado en el laboratorio): se recalcula con la nueva huella y la siguiente tarea se mueve',{timeout:120000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    const t0=await task(page,0);await setDate(page,t0.startDate);const a=await PP(page);
    const sched=await page.evaluate(()=>JSON.parse(JSON.stringify(window.__ft3dFidelity.ctx.schedule)));const DAY=86400000,ms=d=>Date.parse(d+'T00:00:00Z'),iso=x=>new Date(x).toISOString().slice(0,10);
    for(const t of sched.tasks)if(t.wbs>='02'){t.startDate=iso(ms(t.startDate)+7*DAY);t.endDate=iso(ms(t.endDate)+7*DAY);}
    await page.evaluate(t=>window.__ft3dFidelity.loadPart('schedule',t),JSON.stringify(sched));await setDate(page,t0.startDate);await openNext(page);const b=await PP(page);
    assert.notEqual(b.snap.planKey,a.snap.planKey);assert.equal(b.snap.next.daysUntil,a.snap.next.daysUntil+7);assert.match(b.text,new RegExp(`en ${b.snap.next.daysUntil} días`));
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('tarea «cancelada» en un plan importado: se rechaza con un mensaje claro y la Evolución no cambia',{timeout:120000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    const before=await PP(page);const sched=await page.evaluate(()=>JSON.parse(JSON.stringify(window.__ft3dFidelity.ctx.schedule)));sched.tasks[3].status='cancelled';
    const err=await page.evaluate(t=>window.__ft3dFidelity.loadPart('schedule',t).then(()=>null,e=>e.message),JSON.stringify(sched));
    assert.match(err,/status=cancelled.*no existe en el plan de obra de RUBIK.*Quita esas tareas/s);
    const after=await PP(page);assert.equal(after.snap.planKey,before.snap.planKey,'el plan mostrado sigue siendo el anterior');
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('modo captura (lo que se graba para el cliente): sin panel y sin fantasma',{timeout:120000},async()=>{
  const {context,page,watch}=await K.openEvolution(env,{query:'capture=1280x720'});try{
    const t2=await task(page,2);await setDate(page,t2.startDate);const r=await PP(page);
    assert.equal(await page.locator('.plan-preview').isVisible(),false);assert.deepEqual(r.scene.keys,[]);assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('grabación del vídeo para el cliente: sin fantasma mientras graba; al cancelar vuelve',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    const t2=await task(page,2);await setDate(page,t2.startDate);assert.ok((await PP(page)).scene.keys.length>0);
    await page.evaluate(()=>{window.__ft3dUI.reveal('#deliverPanel');document.querySelectorAll('#deliverPanel details:not(#publishBox)').forEach(d=>d.open=true);});
    await page.locator('#videoGo').click();await page.waitForFunction(()=>window.__ft3dDelivery.state.recording&&window.__ft3dDelivery.state.recording.progress>0,null,{timeout:120000});
    assert.deepEqual((await PP(page)).scene.keys,[],'ningún cuadro del vídeo lleva el fantasma');
    await page.evaluate(()=>window.__ft3dDelivery.state.recording.controller.abort());await page.waitForFunction(()=>!window.__ft3dDelivery.state.recording,null,{timeout:120000});
    await page.waitForFunction(()=>window.__ft3dFidelity.scene.preview.keys.length>0,null,{timeout:10000});
    assert.deepEqual(watch.errors.filter(e=>!/abort/i.test(e)),[]);
  }finally{await context.close();}
});

test('el panel deja pasar los clics a la escena: solo sus controles los reciben',{timeout:120000},async()=>{
  for(const vp of [{width:1440,height:900},{width:390,height:844}]){
    const {context,page,watch}=await K.openEvolution(env,{viewport:vp,isMobile:vp.width<720,hasTouch:vp.width<720});try{
      const t2=await task(page,2);await setDate(page,t2.startDate);
      const r=await page.evaluate(()=>{const p=document.querySelector('.plan-preview'),out={through:0,controls:0,points:0};const b=p.getBoundingClientRect();
        for(let i=1;i<10;i++)for(let j=1;j<10;j++){const x=b.left+b.width*i/10,y=b.top+b.height*j/10,e=document.elementFromPoint(x,y);out.points++;
          if(e&&e.closest('summary,button,label,input'))out.controls++;else if(e&&!p.contains(e))out.through++;}return out;});
      assert.equal(r.through+r.controls,r.points,`fuera de los controles, el clic llega a lo que hay debajo (${JSON.stringify(r)})`);
      assert.ok(r.through>r.controls,'la mayor parte del panel deja pasar los clics');
      assert.deepEqual(watch.errors,[]);
    }finally{await context.close();}
  }
});

for(const vp of [{width:390,height:844},{width:844,height:390}])test(`móvil ${vp.width}×${vp.height}: anillo y cifras visibles, siguiente tarea plegada y se abre con un toque`,{timeout:120000},async()=>{
  const {context,page,watch}=await K.openEvolution(env,{viewport:vp,isMobile:true,hasTouch:true,deviceScaleFactor:2});try{
    const t2=await task(page,2);await setDate(page,t2.startDate);
    const d=page.locator('.plan-preview .pp-next-d');assert.equal(await d.evaluate(e=>e.open),false);assert.equal(await page.locator('.plan-preview .pp-ring').isVisible(),true);
    const sum=page.locator('.plan-preview summary');const box=await sum.boundingBox();assert.ok(box.height>=36);
    await sum.tap();assert.equal(await d.evaluate(e=>e.open),true);assert.equal(await page.locator('.plan-preview .pp-next').isVisible(),true);
    const pb=await page.locator('.plan-preview').boundingBox();assert.ok(pb.x>=0&&pb.x+pb.width<=vp.width+1,'cabe en pantalla');
    assert.ok(await page.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1));assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});
