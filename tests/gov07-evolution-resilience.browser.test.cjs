'use strict';
/* GOV-07 · banco de pruebas de la vista 3D de la Evolución (Chromium + SwiftShader: CPU, NO es una GPU ni un móvil real).
   Pérdida y recuperación del contexto WebGL, sin respuesta del navegador, pérdidas repetidas (degradación controlada),
   sin WebGL, DPR 1/2/3 y DPR adaptativo, vertical/horizontal, uso prolongado con cerrar/reabrir, y cesión del tamaño a
   la grabación de vídeo. Lo que solo se puede comprobar en un dispositivo físico está en el protocolo de GOV-07. */
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./gov07/kit.cjs');
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

test('uso prolongado: 20 ciclos de reabrir, cambiar de pestaña, reproducir y cancelar sin fugas de GPU ni de memoria',{timeout:300000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    const cdp=await context.newCDPSession(page);
    const M=async()=>{await cdp.send('HeapProfiler.collectGarbage');return page.evaluate(()=>{const r=window.__ft3dFidelity.scene.renderer;return {...r.info.memory,programs:r.info.programs.length,heapMB:performance.memory.usedJSHeapSize/1e6};});};
    const tab=name=>page.evaluate(n=>document.getElementById('tab-'+n)?.click(),name);
    // Primer ciclo completo para que existan todos los programas y cachés; desde ahí no debe crecer.
    const cycle=async i=>{await page.evaluate(async()=>{const f=window.__ft3dFidelity;await f.show(f.ctx.input,f.ctx.meta);});
      await tab('proyecto');await tab('evolucion');await page.evaluate(()=>window.__ft3dFidelity.play());await page.waitForTimeout(150);
      await tab('entrega');await page.evaluate(()=>window.__ft3dFidelity.pause());await tab('evolucion');
      await page.evaluate(i=>window.__ft3dFidelity.setPos(i%window.__ft3dFidelity.timeline.positions),i*7);};
    await cycle(0);const base=await M();
    for(let i=1;i<=20;i++)await cycle(i);const end=await M();
    assert.ok(end.geometries<=base.geometries+12,`geometrías ${base.geometries}→${end.geometries}`);
    assert.equal(end.textures,base.textures);assert.ok(end.programs<=base.programs+4,`programas ${base.programs}→${end.programs}`);
    assert.ok(end.heapMB-base.heapMB<15,`memoria JS ${base.heapMB.toFixed(1)}→${end.heapMB.toFixed(1)} MB`);
    assert.equal((await G(page)).state,'ok');assert.ok(await K.drawn(page)>0);assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
    if(process.env.GOV07_METRICS)require('node:fs').writeFileSync(process.env.GOV07_METRICS,JSON.stringify({base,end},null,1));
  }finally{await context.close();}
});
