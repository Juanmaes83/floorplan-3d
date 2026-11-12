'use strict';
/* GOV-07 · banco de pruebas de la vista 3D de la Evolución (Chromium + SwiftShader: CPU, NO es una GPU ni un móvil real).
   Pérdida y recuperación del contexto WebGL, sin respuesta del navegador, pérdidas repetidas (degradación controlada),
   sin WebGL, DPR 1/2/3 y DPR adaptativo, vertical/horizontal, uso prolongado con cerrar/reabrir, y cesión del tamaño a
   la grabación de vídeo. Lo que solo se puede comprobar en un dispositivo físico está en el protocolo de GOV-07. */
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./gov07/kit.cjs'),R=require('./gov07/resource-probe.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
const G=page=>page.evaluate(()=>{const g=window.__ft3dGlGuard;return g&&{state:g.state,ratio:g.pixelRatio,shadows:g.shadows,degraded:g.degraded,message:g.message,chip:g.chip,governor:g.governor,events:g.events};});
const canvasInfo=page=>page.evaluate(()=>{const c=document.getElementById('stage');return {w:c.width,h:c.height,cw:c.clientWidth,ch:c.clientHeight,ratio:window.__ft3dGlGuard?.pixelRatio};});
const still=page=>page.evaluate(()=>{const f=window.__ft3dFidelity;f.scene.setAuto(false);f.setPose({position:[14,11,14],target:[0,0,0],fov:45});});
const dateLabel=page=>page.evaluate(()=>window.__ft3dFidelity.last?.date??window.__ft3dFidelity.pos);

test('pérdida y recuperación: aviso claro, el plan sigue funcionando y la escena vuelve idéntica',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    await still(page);const mid=await page.evaluate(()=>Math.floor(window.__ft3dFidelity.timeline.positions/2));
    await page.evaluate(p=>window.__ft3dFidelity.setPos(p),mid);await K.frames(page,4);
    const before={drawn:await K.drawn(page),pieces:await page.evaluate(()=>window.__ft3dFidelity.visiblePieces)};assert.ok(before.drawn>0);
    assert.equal((await G(page)).message,null,'sin aviso antes de la pérdida');
    await K.loseContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='lost');
    const lost=await G(page);assert.equal(lost.message.state,'lost');assert.match(lost.message.text,/Vista 3D interrumpida.*plan, las fechas y la ficha siguen funcionando/s);
    assert.equal(await page.locator('.gl-guard[role=status]').isVisible(),true);
    assert.equal(await page.evaluate(()=>document.getElementById('stage').getAttribute('aria-describedby')),'glGuardMsg');
    // Con el contexto perdido, el plan funciona: se mueve el tiempo y vuelve al mismo momento.
    const d0=await dateLabel(page);await page.evaluate(()=>window.__ft3dFidelity.setPos(0));assert.notEqual(await dateLabel(page),d0);
    await page.evaluate(p=>window.__ft3dFidelity.setPos(p),mid);
    await K.restoreContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='ok');await K.frames(page,6);
    const after=await G(page);assert.equal(after.message,null,'el aviso se retira');assert.equal(after.degraded,false);assert.equal(after.shadows,true);
    assert.equal(await page.evaluate(()=>window.__ft3dFidelity.visiblePieces),before.pieces);
    assert.equal(await K.drawn(page),before.drawn,'misma imagen que antes de la pérdida');
    assert.deepEqual(after.events.map(e=>e.type),['lost','restored']);
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('sin respuesta del navegador: lo dice y ofrece recargar; el plan sigue usable y recargar recupera la vista',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env,{query:'glRestoreMs=1000'});try{
    await K.loseContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='failed',null,{timeout:10000});
    const g=await G(page);assert.equal(g.message.state,'failed');assert.match(g.message.text,/No se ha podido recuperar.*recargar no pierde nada/s);assert.equal(g.message.action,'Recargar la vista');
    const btn=page.getByRole('button',{name:'Recargar la vista'});const box=await btn.boundingBox();assert.ok(box.height>=44,'objetivo táctil ≥ 44 px');
    // El transporte sigue funcionando con la vista caída.
    const d0=await dateLabel(page);await page.locator('.transport button').nth(5).click();assert.notEqual(await dateLabel(page),d0);
    await btn.focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>window.__ft3dFidelity?.ctx&&document.body.classList.contains('ready')&&window.__ft3dGlGuard?.state==='ok',null,{timeout:120000});
    await K.showEvolution(page);await K.frames(page,4);assert.ok(await K.drawn(page)>0);assert.equal((await G(page)).message,null);
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('pérdidas repetidas: degradación controlada y dicha (DPR 1, sin sombras) y la escena se sigue dibujando',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env,{deviceScaleFactor:2});try{
    assert.equal((await G(page)).ratio,2);
    for(let i=0;i<2;i++){await K.loseContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='lost');await K.restoreContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='ok');}
    await K.frames(page,6);const g=await G(page);
    assert.equal(g.degraded,true);assert.equal(g.ratio,1);assert.equal(g.shadows,false);assert.equal(g.chip,'Calidad 3D reducida para mantener la vista estable');
    assert.equal(g.governor.pinned,true);const c=await canvasInfo(page);assert.equal(c.w,c.cw,'el lienzo usa 1 píxel por píxel CSS');
    assert.ok(await K.drawn(page)>0);assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('sin WebGL: la Evolución carga, lo dice y el plan, la ficha y la reproducción funcionan',{timeout:180000},async()=>{
  const {chromium}=require('playwright');const b=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:['--no-sandbox','--disable-webgl','--disable-3d-apis']});
  try{const page=await b.newPage({viewport:{width:1280,height:720}});const w=K.watch(page,env.base);
    await page.goto(env.base+'evolucion/index.html?lab=1&case=A');
    await page.waitForFunction(()=>window.__ft3dFidelity?.ctx&&document.body.classList.contains('ready'),null,{timeout:60000});await K.showEvolution(page);
    const g=await G(page);assert.equal(g.state,'unavailable');assert.match(g.message.text,/no puede mostrar la vista 3D.*plan de obra, las fechas, la ficha de cada trabajo y los importes siguen disponibles/s);
    const d0=await dateLabel(page);await page.evaluate(()=>window.__ft3dFidelity.play());await page.waitForTimeout(1500);await page.evaluate(()=>window.__ft3dFidelity.pause());
    assert.notEqual(await dateLabel(page),d0,'la reproducción avanza el plan');
    await page.evaluate(()=>window.__ft3dFidelity.selectTask(window.__ft3dFidelity.ctx.schedule.tasks[0].id));
    assert.equal(await page.evaluate(()=>window.__ft3dFidelity.selected),await page.evaluate(()=>window.__ft3dFidelity.ctx.schedule.tasks[0].id));
    // Los únicos errores son los avisos de Three al no poder crear el contexto (esperados); ninguno de la página.
    assert.deepEqual(w.errors.filter(e=>!/WebGL context could not be created|Error creating WebGL context/.test(e)),[]);
    assert.deepEqual(w.external,[]);
  }finally{await b.close();}
});

for(const dsf of [1,2,3])test(`DPR ${dsf}: resolución interna = min(DPR, 2) y escena dibujada`,{timeout:120000},async()=>{
  const {context,page,watch}=await K.openEvolution(env,{deviceScaleFactor:dsf});try{
    const g=await G(page),c=await canvasInfo(page),want=Math.min(dsf,2);
    assert.equal(g.ratio,want);assert.deepEqual(g.governor.levels,dsf===1?[1]:[2,1.5,1]);
    assert.ok(Math.abs(c.w-Math.floor(c.cw*want))<=1);assert.ok(await K.drawn(page)>0);assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('DPR adaptativo: con un presupuesto que el equipo no alcanza baja por escalones hasta 1 y nunca por debajo',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env,{deviceScaleFactor:2,query:'glBudgetMs=1'});try{
    await page.waitForFunction(()=>window.__ft3dGlGuard.pixelRatio===1,null,{timeout:60000});
    const g=await G(page);assert.deepEqual(g.governor.history.map(h=>[h.from,h.to,h.reason]),[[2,1.5,'slow'],[1.5,1,'slow']]);
    await page.waitForTimeout(3000);assert.equal((await G(page)).ratio,1,'no baja de 1');
    const c=await canvasInfo(page);assert.ok(Math.abs(c.w-c.cw)<=1);assert.ok(await K.drawn(page)>0);assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('grabación: la guarda cede el tamaño y, al soltarlo, vuelve al nivel fijado (también degradado)',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env,{deviceScaleFactor:2});try{
    for(let i=0;i<2;i++){await K.loseContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='lost');await K.restoreContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='ok');}
    await page.evaluate(()=>{const s=window.__ft3dFidelity.scene;s.setRenderSize(1280,720);});await K.frames(page,10);
    let c=await canvasInfo(page);assert.deepEqual([c.w,c.h],[1280,720],'la grabación manda mientras dura');
    await page.evaluate(()=>window.__ft3dFidelity.scene.releaseRenderSize());await K.frames(page,6);
    c=await canvasInfo(page);assert.equal(c.ratio,1);assert.ok(Math.abs(c.w-c.cw)<=1,'vuelve a DPR 1 degradado, no al 2 por defecto');assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('vertical y horizontal (móvil, DPR 3): el lienzo sigue al giro, sin scroll horizontal, y el aviso cabe',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env,{viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});try{
    for(const vp of [{width:844,height:390},{width:390,height:844}]){
      await page.setViewportSize(vp);await page.waitForTimeout(400);await K.frames(page,4);
      const c=await canvasInfo(page);assert.ok(c.cw>0&&c.ch>0);assert.ok(Math.abs(c.w-Math.floor(c.cw*c.ratio))<=1&&Math.abs(c.h-Math.floor(c.ch*c.ratio))<=1,JSON.stringify(c));
      assert.ok(await page.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1),'sin scroll horizontal');assert.ok(await K.drawn(page)>0);
    }
    await K.loseContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='lost');
    const r=await page.locator('.gl-guard').boundingBox();assert.ok(r.x>=0&&r.x+r.width<=390,'el aviso cabe en 390 px');
    await K.restoreContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='ok');assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

/* Uso prolongado. Por qué NO se comparan los contadores de Three entre dos fechas (CI dio «geometrías 53→116»):
   renderer.info.memory.geometries cuenta las geometrías DIBUJADAS al menos una vez desde que se crearon (Three las sube a
   la GPU al primer dibujo). Depende de qué fechas del plan se han llegado a pintar en ese ciclo (53 en el día 0, 116 en el
   56, 119 al final si antes se pintó el resto, 67 al final si no, o tras recuperar el contexto), no de una fuga. Se mide
   lo que sí delata una fuga, en cada ciclo (perfil completo y antes/después: docs/qa/gov07-webgl-dispositivos-2026-11-12):
   - ninguna geometría subida a la GPU fuera de la escena (Three ≤ geometrías en escena) y ninguna viva fuera de ella;
   - las geometrías vivas son siempre las mismas (cada carga libera todas las de la anterior);
   - búferes y VAOs GL reales acotados por las geometrías de Three (la verdad de la GPU, contando llamadas GL);
   - un solo juego de escuchadores del Gantt (antes: +4 por reapertura, cada uno reteniendo el plan anterior) y los de
     window, constantes;
   - texturas iguales y programas acotados (variantes compiladas al aparecer); memoria JS con un tope grosero (el
     calentamiento de V8 la sube sin fuga: las instantáneas del heap entre los ciclos 20 y 50 bajan 0,44 MB). */
test('uso prolongado: 20 ciclos de reabrir, cambiar de pestaña, reproducir y cancelar sin fugas de GPU ni de memoria',{timeout:420000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    const cdp=await context.newCDPSession(page);await cdp.send('DOMDebugger.enable').catch(()=>{});const gc=()=>cdp.send('HeapProfiler.collectGarbage');
    await R.install(page);
    const tab=name=>page.evaluate(n=>document.getElementById('tab-'+n)?.click(),name);
    const cycle=async i=>{await page.evaluate(async()=>{const f=window.__ft3dFidelity;await f.show(f.ctx.input,f.ctx.meta);});
      await tab('proyecto');await tab('evolucion');await page.evaluate(()=>window.__ft3dFidelity.play());await page.waitForTimeout(150);
      await tab('entrega');await page.evaluate(()=>window.__ft3dFidelity.pause());await tab('evolucion');
      await page.evaluate(i=>window.__ft3dFidelity.setPos(i%window.__ft3dFidelity.timeline.positions),i*7);await K.frames(page,4);};
    const rows=[];
    for(let i=0;i<=20;i++){await cycle(i);const m=await R.measure(page,gc,'ciclo '+i);
      rows.push({i,m,gantt:await R.listeners(cdp,page,"document.getElementById('gantt')"),win:await R.listeners(cdp,page,'window')});}
    const one={pointerdown:1,keydown:1,pointermove:1,pointerup:1},b=rows[1];
    for(const {i,m,gantt,win} of rows){const at=`ciclo ${i} (día ${m.pos})`;
      assert.ok(m.three.geometries<=m.geometries.inScene,`${at}: ${m.three.geometries} geometrías en GPU y solo ${m.geometries.inScene} en escena`);
      assert.equal(m.geometries.aliveOffScene,0,`${at}: geometrías vivas fuera de la escena ${JSON.stringify(m.geometries.offSceneTypes)}`);
      assert.ok(m.gl.buffers<=4*m.three.geometries+16&&m.gl.vaos<=2*m.three.geometries+16,`${at}: GL ${JSON.stringify(m.gl)} para ${m.three.geometries} geometrías`);
      assert.deepEqual(gantt,one,`${at}: escuchadores del Gantt`);assert.equal(m.loads,i+1,`${at}: una carga por apertura`);
      if(i>=1){assert.equal(m.geometries.alive,b.m.geometries.alive,`${at}: geometrías vivas`);assert.deepEqual(win,b.win,`${at}: escuchadores de window`);
        assert.equal(m.three.textures,b.m.three.textures,`${at}: texturas`);}
    }
    // Programas: también se compilan al primer dibujo de cada variante (3 en el día 7, 9 tras recorrer el plan). Las fechas
    // de los ciclos se repiten cada 12 (i·7 mód. 84): desde el ciclo 12 ya no debe aparecer ninguno, y su número está acotado.
    const end=rows[20].m;
    assert.ok(end.three.programs<=rows[12].m.three.programs+2&&end.three.programs<=16,`programas ${rows[12].m.three.programs} (ciclo 12)→${end.three.programs}`);
    assert.ok(end.heapMB-b.m.heapMB<6,`memoria JS ${b.m.heapMB}→${end.heapMB} MB`);
    assert.equal((await G(page)).state,'ok');assert.ok(await K.drawn(page)>0);assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
    if(process.env.GOV07_METRICS)require('node:fs').writeFileSync(process.env.GOV07_METRICS,JSON.stringify(rows.map(r=>({cycle:r.i,day:r.m.pos,three:r.m.three,gl:r.m.gl,geometries:r.m.geometries,materials:r.m.materials,gantt:r.gantt,heapMB:r.m.heapMB})),null,1));
  }finally{await context.close();}
});

test('reabrir no duplica callbacks: tras 3 reaperturas un clic en el Gantt selecciona una sola vez',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    for(let i=0;i<3;i++)await page.evaluate(async()=>{const f=window.__ft3dFidelity;await f.show(f.ctx.input,f.ctx.meta);});
    await page.evaluate(()=>{window.__gov07Tasks=[];window.addEventListener('ft3d8-task',e=>window.__gov07Tasks.push(e.detail.taskId));});
    const lab=page.locator('#gantt .row .lab').first();await lab.scrollIntoViewIfNeeded();await lab.click();
    const t=await page.evaluate(()=>window.__gov07Tasks);assert.equal(t.length,1,`selecciones por un clic: ${t.length}`);
    assert.equal(await page.evaluate(()=>window.__ft3dFidelity.selected),t[0]);assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('cambio de proyecto durante una reconstrucción: se muestra la última selección pedida, nunca una anterior que termine después',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    const r=await page.evaluate(async()=>{const f=window.__ft3dFidelity,F=window.FT3D8FidelityFixtures,a=await F.build('A'),b=await F.build('B');
      const modelA=await window.FloorPlanConstructionProject.evaluate(a);
      // B se pide primero y su evaluación termina después; A se pide la última (ya evaluada).
      const pB=f.show(b,{caseId:'B',origin:'B',kind:'fixture'}),pA=f.show(a,{caseId:'A',origin:'A',kind:'fixture'},modelA);const [ra,rb]=await Promise.all([pA,pB]);
      return {shown:document.body.dataset.case,subject:f.model.subject.id,objects:f.scene.objectCount,rb};});
    assert.equal(r.shown,'A');assert.equal(r.subject,'prj_fx-house-a');assert.equal(r.objects,18);assert.equal(r.rb.superseded,true);
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('contexto perdido durante la reproducción: el plan sigue avanzando y al volver sigue reproduciendo',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    await page.evaluate(()=>{const f=window.__ft3dFidelity;f.setPos(0);f.play();});await page.waitForTimeout(300);const p0=await page.evaluate(()=>window.__ft3dFidelity.pos);
    await K.loseContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='lost');await page.waitForTimeout(600);
    assert.ok(await page.evaluate(()=>window.__ft3dFidelity.pos)>p0,'el plan avanza sin vista 3D');
    await K.restoreContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='ok');await K.frames(page,6);
    assert.equal(await page.evaluate(()=>window.__ft3dFidelity.playing),true);await page.evaluate(()=>window.__ft3dFidelity.pause());
    assert.ok(await K.drawn(page)>0);assert.deepEqual((await G(page)).events.map(e=>e.type),['lost','restored']);assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('cambio de proyecto con el contexto perdido: al volver se dibuja el proyecto nuevo, no el anterior',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    await K.loseContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='lost');
    await page.evaluate(()=>window.__ft3dFidelity.loadCase('B'));await K.restoreContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='ok');
    await page.evaluate(()=>window.__ft3dFidelity.end());await K.frames(page,6);
    const keys=await page.evaluate(()=>Object.keys(window.__ft3dFidelity.inspect()));assert.ok(keys.length>0&&keys.every(k=>!/fx-house-a/.test(k)),'solo elementos de B');
    assert.equal(await page.evaluate(()=>window.__ft3dFidelity.scene.objectCount),26);assert.ok(await K.drawn(page)>0);assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('restauración tardía: si el contexto vuelve después de «no se ha podido recuperar», el aviso y el botón se retiran',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env,{query:'glRestoreMs=1000'});try{
    await K.loseContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='failed',null,{timeout:10000});
    await K.restoreContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='ok',null,{timeout:10000});await K.frames(page,6);
    const g=await G(page);assert.equal(g.message,null);assert.deepEqual(g.events.map(e=>e.type),['lost','failed','restored']);
    assert.equal(await page.locator('.gl-guard button').isVisible(),false);assert.ok(await K.drawn(page)>0);assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('pérdidas múltiples y salir con la recuperación pendiente: una sola degradación, recursos acotados, la vista vuelve',{timeout:240000},async()=>{
  const {context,page,watch}=await K.openEvolution(env,{deviceScaleFactor:2});try{
    const cdp=await context.newCDPSession(page);const gc=()=>cdp.send('HeapProfiler.collectGarbage');await R.install(page);
    for(let i=0;i<5;i++){await K.loseContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='lost');
      if(i===2)await page.evaluate(()=>document.getElementById('tab-entrega')?.click());
      await K.restoreContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='ok');
      if(i===2)await page.evaluate(()=>document.getElementById('tab-evolucion')?.click());await K.frames(page,6);
      // Al recuperar el contexto Three crea UNA geometría interna (el triángulo de pantalla de WebGLShadowMap); la del
      // contexto anterior se libera: siempre una, nunca una por pérdida.
      const m=await R.measure(page,gc,'pérdida '+(i+1));assert.ok(m.three.geometries<=m.geometries.inScene,JSON.stringify(m.three));
      assert.ok(m.geometries.aliveOffScene<=1&&m.geometries.offSceneTypes.every(([t])=>t==='BufferGeometry'),JSON.stringify(m.geometries));assert.ok(m.geometries.alive<=1,`geometrías vivas ${m.geometries.alive} tras ${i+1} pérdidas`);}
    const g=await G(page);assert.equal(g.degraded,true);assert.equal(g.events.filter(e=>e.type==='degraded').length,1,'se degrada una sola vez');
    assert.equal(g.ratio,1);assert.equal(g.shadows,false);assert.ok(await K.drawn(page)>0);assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});
