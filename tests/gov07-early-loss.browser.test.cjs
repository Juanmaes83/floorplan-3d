'use strict';
/* GOV-07 · integración con OBR-01 (#207) y dos hallazgos de revisión:
   1) Contrato: la escena «sin WebGL» debe ofrecer todo lo que ofrece la escena real (#207 añadió reducedMotion,
      autoRotating, disposed y un dispose() idempotente). Se compara automáticamente: si la escena real gana una
      propiedad, esta prueba avisa.
   2) Contexto perdido AL CREAR la escena (antes del primer fotograma): antes se trataba como «sin WebGL» (aviso falso),
      Three lanzaba una excepción al volver el contexto y la vista quedaba muerta hasta recargar. Ahora la vista se
      completa sola al recuperar el contexto, con el estado de la app. */
const test=require('node:test'),assert=require('node:assert/strict');const K=require('./gov07/kit.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});

// Pierde el contexto del visor en cuanto Three lo pide (antes de que pueda dibujar nada).
const LOSE_AT_CREATE=()=>{const g0=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){const gl=g0.call(this,t,...a);
  if(this.id==='stage'&&/webgl/.test(t)&&gl&&!window.__gov07LostAtCreate){window.__gov07LostAtCreate=gl.getExtension('WEBGL_lose_context');window.__gov07LostAtCreate.loseContext();}return gl;};};
async function openLostAtCreate(query=''){
  const context=await env.browser.newContext({viewport:{width:1440,height:900}});await context.addInitScript(LOSE_AT_CREATE);const page=await context.newPage();page.setDefaultTimeout(60000);
  const watch=K.watch(page,env.base);await page.goto(`${env.base}evolucion/index.html?lab=1&case=A${query?'&'+query:''}`);
  await page.waitForFunction(()=>window.__ft3dFidelity?.ctx&&document.body.classList.contains('ready'),null,{timeout:120000});await K.showEvolution(page);
  return {context,page,watch};
}

test('contrato: la escena «sin WebGL» ofrece todo lo de la escena real (mismos nombres y tipos); dispose idempotente; preferencia de movimiento en vivo',{timeout:120000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    const r=await page.evaluate(async()=>{
      const {createProjectScene}=await import(new URL('../evolucion/project-scene.js',location.href).href);const g=await import(new URL('../evolucion/gl-guard.js',location.href).href);
      const c=document.createElement('canvas');c.style.cssText='position:fixed;left:0;top:0;width:200px;height:120px';document.body.append(c);
      const real=createProjectScene(c),nul=g.createUnavailableScene(document.createElement('canvas'),'prueba');
      const kind=(o,k)=>{const d=Object.getOwnPropertyDescriptor(o,k);return d.get||d.set?'accessor':typeof d.value==='function'?'function':'value';};
      const missing=[],mismatch=[];for(const k of Object.getOwnPropertyNames(real)){if(!(k in nul)){missing.push(k);continue;}
        const a=kind(real,k),b=kind(nul,k);if(a!==b&&!(a==='value'&&b==='value'))mismatch.push(`${k}: ${a}≠${b}`);}
      const before=nul.disposed;nul.dispose();nul.dispose();real.dispose();
      return {missing,mismatch,before,after:nul.disposed,auto:nul.autoRotating,rm:nul.reducedMotion,check:()=>0};});
    assert.deepEqual(r.missing,[],'la escena nula tiene todas las propiedades de la real');
    assert.deepEqual(r.mismatch,[],'y del mismo tipo (función, propiedad calculada o valor)');
    assert.deepEqual([r.before,r.after,r.auto,r.rm],[false,true,false,false]);
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.evaluate(async()=>{const g=await import(new URL('../evolucion/gl-guard.js',location.href).href);return g.createUnavailableScene(document.createElement('canvas')).reducedMotion;}),true,'sigue la preferencia del sistema');
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('contexto perdido al crear la escena: «Vista 3D interrumpida» (no «sin WebGL»), sin excepciones; al volver, la casa aparece encuadrada y la app sigue',{timeout:180000},async()=>{
  const {context,page,watch}=await openLostAtCreate();try{
    const waiting=await page.evaluate(()=>({state:window.__ft3dGlGuard.state,msg:window.__ft3dGlGuard.message,pending:window.__ft3dFidelity.scene?.pending}));
    assert.equal(waiting.state,'lost','espera la recuperación, no se da por «sin WebGL»');assert.match(waiting.msg.text,/Vista 3D interrumpida/);
    assert.doesNotMatch(await page.locator('.gl-guard').innerText(),/no puede mostrar la vista 3D/);
    // Mientras tanto la app funciona: el plan avanza.
    await page.evaluate(()=>window.__ft3dFidelity.setPos(Math.floor(window.__ft3dFidelity.timeline.positions*.6)));
    const date=await page.evaluate(()=>window.__ft3dFidelity.last.date);
    await page.evaluate(()=>window.__gov07LostAtCreate.restoreContext());
    await page.waitForFunction(()=>window.__ft3dGlGuard.state==='ok',null,{timeout:20000});await K.frames(page,8);
    assert.ok(await K.drawn(page)>0,'la casa se dibuja');
    assert.equal(await page.locator('.gl-guard:visible').count(),0,'el aviso se retira');
    const after=await page.evaluate(()=>{const f=window.__ft3dFidelity,s=f.scene;return {pending:s.pending,date:f.last.date,pieces:s.visiblePieces,
      bounds:s.screenBounds('project/'),objects:s.objectCount};});
    assert.equal(after.pending,false);assert.equal(after.date,date,'el momento del plan se conserva');
    assert.ok(after.objects>0&&after.pieces>0,'el proyecto cargado antes de la recuperación está en la escena real');
    assert.ok(after.bounds&&after.bounds.x0>-1.05&&after.bounds.x1<1.05&&after.bounds.y0>-1.05&&after.bounds.y1<1.05,`encuadrada en la vista: ${JSON.stringify(after.bounds)}`);
    // Lo mismo que en una carga normal: una pérdida posterior se avisa y se recupera.
    await K.loseContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='lost');
    await K.restoreContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='ok');await K.frames(page,6);assert.ok(await K.drawn(page)>0);
    // Reabrir y seleccionar: un clic, una selección.
    for(let i=0;i<2;i++)await page.evaluate(async()=>{const f=window.__ft3dFidelity;await f.show(f.ctx.input,f.ctx.meta);});
    await page.evaluate(()=>{window.__gov07Tasks=[];window.addEventListener('ft3d8-task',e=>window.__gov07Tasks.push(e.detail.taskId));});
    const lab=page.locator('#gantt .row .lab').first();await lab.scrollIntoViewIfNeeded();await lab.click();
    assert.equal((await page.evaluate(()=>window.__gov07Tasks)).length,1);
    assert.deepEqual(watch.errors,[],'ninguna excepción (antes: «Cannot read properties of undefined (reading \'autoReset\')»)');assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('contexto perdido al crear y que no vuelve: «Recargar la vista» tras el plazo; si vuelve tarde, la vista se completa igualmente',{timeout:180000},async()=>{
  let reloads=0;const {context,page,watch}=await openLostAtCreate('glRestoreMs=600');try{
    await page.waitForFunction(()=>window.__ft3dGlGuard.state==='failed',null,{timeout:10000});
    const m=await page.evaluate(()=>window.__ft3dGlGuard.message);assert.equal(m.action,'Recargar la vista');assert.match(m.text,/No se ha podido recuperar/);
    await page.exposeFunction('__gov07Reload',()=>{reloads++;});
    await page.evaluate(()=>window.__gov07LostAtCreate.restoreContext());
    await page.waitForFunction(()=>window.__ft3dGlGuard.state==='ok',null,{timeout:20000});await K.frames(page,6);
    assert.ok(await K.drawn(page)>0,'restauración tardía: la casa aparece y el botón se retira');assert.equal(await page.locator('.gl-guard:visible').count(),0);
    assert.equal(reloads,0);assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('escena diferida: lo que otro módulo asigna a la escena antes de recuperarse (p. ej. envolver renderNow, como hace #211) sigue valiendo después, sin recursión',{timeout:180000},async()=>{
  const {context,page,watch}=await openLostAtCreate();try{
    await page.evaluate(()=>{const sc=window.__ft3dFidelity.scene;window.__gov07Wraps=0;const rn=sc.renderNow;sc.renderNow=(...a)=>{window.__gov07Wraps++;return rn(...a);};});
    await page.evaluate(()=>window.__gov07LostAtCreate.restoreContext());await page.waitForFunction(()=>window.__ft3dGlGuard.state==='ok',null,{timeout:20000});
    const r=await page.evaluate(()=>{const sc=window.__ft3dFidelity.scene;const before=window.__gov07Wraps;sc.renderNow();return {calls:window.__gov07Wraps-before,pending:sc.pending,
      preview:typeof sc.setPreview==='function'?sc.setPreview([]):'n/a'};});
    assert.equal(r.calls,1,'el envoltorio se llama una vez y llega a la escena real');assert.equal(r.pending,false);
    await K.frames(page,4);assert.ok(await K.drawn(page)>0);assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('hueco entre la pérdida y su evento: un cuadro que compila materiales en ese instante no deja programas rotos (Three r160: getProgramInfoLog null)',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    // La pérdida es inmediata y su evento llega en otra tarea. En la MISMA tarea se obliga a recompilar todos los
    // materiales (en r160 el tono forma parte del programa) y se dibuja un cuadro: es lo que pasa cuando un material
    // nuevo aparece justo al perderse la GPU (con #211, la vista previa del plan al reproducir).
    await page.evaluate(()=>{const s=window.__ft3dFidelity.scene,r=s.renderer;window.__gov07Ext=r.getContext().getExtension('WEBGL_lose_context');
      window.__gov07Ext.loseContext();r.toneMapping=(r.toneMapping+1)%5;s.renderNow();});
    await page.waitForFunction(()=>window.__ft3dGlGuard.state==='lost');
    await K.restoreContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='ok');await K.frames(page,8);
    assert.ok(await K.drawn(page)>0,'la casa vuelve');
    assert.deepEqual(watch.errors,[],"sin «Cannot read properties of null (reading 'trim')»");
  }finally{await context.close();}
});
