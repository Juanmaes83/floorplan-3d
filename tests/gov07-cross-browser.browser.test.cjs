'use strict';
/* GOV-07 · humo entre navegadores (GOV07_BROWSER=chromium|firefox|webkit). Lo que debe cumplirse en CUALQUIER motor:
   - con WebGL: la Evolución dibuja la casa; si el motor permite simular la pérdida (WEBGL_lose_context), se avisa y la
     escena vuelve; reabrir no duplica los escuchadores del Gantt;
   - sin WebGL en ese motor: la Evolución lo dice y el plan, la ficha y la reproducción funcionan.
   Un motor de CI (sin GPU) no es un dispositivo: no sustituye a la matriz física del protocolo. */
const test=require('node:test'),assert=require('node:assert/strict');const K=require('./gov07/kit.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
test(`${K.BROWSER}: la Evolución carga y la vista 3D se dibuja, se recupera o explica que no puede`,{timeout:240000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    const info=await page.evaluate(()=>({ua:navigator.userAgent,state:window.__ft3dGlGuard?.state,webgl:!!document.createElement('canvas').getContext('webgl')}));
    console.log(`# ${K.BROWSER}: ${info.ua} · WebGL ${info.webgl} · guarda ${info.state}${process.env.GOV07_NO_VIDEO_APIS?' · API de vídeo retiradas (GStreamer de este WebKit aborta la página: ver engine-probe)':''}`);
    // GOV07_EXPECT=webgl|unavailable: la variante de CI dice qué camino debe recorrer (sin esto, una variante «con WebGL»
    // que se quedara sin él pasaría en silencio por el camino «sin WebGL»).
    if(process.env.GOV07_EXPECT)assert.equal(info.state,process.env.GOV07_EXPECT==='webgl'?'ok':'unavailable',`camino esperado: ${process.env.GOV07_EXPECT}`);
    const d0=await page.evaluate(()=>window.__ft3dFidelity.last?.date);await page.evaluate(()=>window.__ft3dFidelity.end());
    assert.notEqual(await page.evaluate(()=>window.__ft3dFidelity.last?.date),d0,'el plan se mueve');
    if(info.state==='unavailable'){
      assert.match(await page.locator('.gl-guard').innerText(),/no puede mostrar la vista 3D/);
    }else{
      assert.equal(info.state,'ok');await K.frames(page,6);assert.ok(await K.drawn(page)>0,'casa dibujada');
      const canLose=await page.evaluate(()=>{const c=document.getElementById('stage'),gl=c.getContext('webgl2')||c.getContext('webgl');return !!gl?.getExtension('WEBGL_lose_context');});
      if(canLose){await K.loseContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='lost');
        assert.match(await page.locator('.gl-guard').innerText(),/Vista 3D interrumpida/);
        await K.restoreContext(page);await page.waitForFunction(()=>window.__ft3dGlGuard.state==='ok',null,{timeout:30000});await K.frames(page,6);assert.ok(await K.drawn(page)>0,'la casa vuelve');}
      else console.log(`# ${K.BROWSER}: sin WEBGL_lose_context, la pérdida queda para el protocolo físico`);
    }
    for(let i=0;i<3;i++)await page.evaluate(async()=>{const f=window.__ft3dFidelity;await f.show(f.ctx.input,f.ctx.meta);});
    await page.evaluate(()=>{window.__gov07Tasks=[];window.addEventListener('ft3d8-task',e=>window.__gov07Tasks.push(e.detail.taskId));});
    const lab=page.locator('#gantt .row .lab').first();await lab.scrollIntoViewIfNeeded();await lab.click();
    assert.equal((await page.evaluate(()=>window.__gov07Tasks)).length,1,'un clic, una selección');
    assert.deepEqual(watch.errors.filter(e=>!/WebGL context could not be created|Error creating WebGL context/.test(e)),[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});
