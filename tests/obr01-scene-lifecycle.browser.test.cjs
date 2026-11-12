'use strict';
/* OBR-01 · ciclo de vida de la escena de la Evolución (auditoría de #207). Crear una escena registra un listener de
   prefers-reduced-motion, uno de resize de la ventana, un ResizeObserver del lienzo y los listeners de los controles
   de órbita; dispose() debe retirarlos todos. Crear → alternar la preferencia → dispose → recrear sobre el MISMO lienzo
   → cambiar la preferencia: un único listener efectivo y la escena destruida nunca se vuelve a tocar. */
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./obr01/browser-kit.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});

// Instrumentación instalada antes que cualquier script de la página: cuenta los registros ACTIVOS (añadidos y no retirados).
function instrument(){
  const RM='(prefers-reduced-motion: reduce)';const reg=window.__lifecycle={mm:new Set(),resize:new Set(),ro:new Set(),el:new Map()};
  const mqlAdd=MediaQueryList.prototype.addEventListener,mqlDel=MediaQueryList.prototype.removeEventListener;
  MediaQueryList.prototype.addEventListener=function(t,f,o){if(t==='change'&&this.media===RM)reg.mm.add(f);return mqlAdd.call(this,t,f,o);};
  MediaQueryList.prototype.removeEventListener=function(t,f,o){if(t==='change'&&this.media===RM)reg.mm.delete(f);return mqlDel.call(this,t,f,o);};
  const wAdd=window.addEventListener.bind(window),wDel=window.removeEventListener.bind(window);
  window.addEventListener=function(t,f,o){if(t==='resize')reg.resize.add(f);return wAdd(t,f,o);};
  window.removeEventListener=function(t,f,o){if(t==='resize')reg.resize.delete(f);return wDel(t,f,o);};
  const RO=window.ResizeObserver;window.ResizeObserver=class extends RO{observe(...a){reg.ro.add(this);return super.observe(...a);}disconnect(){reg.ro.delete(this);return super.disconnect();}};
  const eAdd=Element.prototype.addEventListener,eDel=Element.prototype.removeEventListener;
  Element.prototype.addEventListener=function(t,f,o){if(this.dataset?.lifecycle){const m=reg.el.get(this)||new Set();m.add(t+'|'+(f.name||'')+'|'+reg.el.size);reg.el.set(this,m);(this.__l||(this.__l=new Map())).set(f,t);}return eAdd.call(this,t,f,o);};
  Element.prototype.removeEventListener=function(t,f,o){if(this.dataset?.lifecycle&&this.__l?.has(f)){this.__l.delete(f);}return eDel.call(this,t,f,o);};
  window.__counts=()=>({mm:reg.mm.size,resize:reg.resize.size,ro:reg.ro.size,canvas:[...document.querySelectorAll('[data-lifecycle]')].reduce((n,c)=>n+(c.__l?.size||0),0)});
}

test('crear → alternar → dispose → recrear → cambiar: un único listener efectivo y la escena destruida no se toca',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env,{init:instrument});try{
    const base=await page.evaluate(()=>window.__counts());assert.ok(base.mm>=1,'la escena de la Evolución sigue la preferencia');assert.equal(base.canvas,0);
    // Escena B en un lienzo propio (mismo módulo que usa la Evolución).
    await page.evaluate(async()=>{const {createProjectScene}=await import(new URL('../evolucion/project-scene.js',location.href).href);
      const c=document.createElement('canvas');c.dataset.lifecycle='1';c.style.cssText='position:fixed;left:0;top:0;width:320px;height:200px';document.body.append(c);
      window.__make=()=>createProjectScene(c);window.__B=window.__make();window.__B.setAuto(true);});
    let n=await page.evaluate(()=>window.__counts());
    assert.deepEqual([n.mm,n.resize,n.ro],[base.mm+1,base.resize+1,base.ro+1],'crear registra 1 preferencia, 1 resize y 1 observador');assert.ok(n.canvas>0,'los controles escuchan su lienzo');
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>matchMedia('(prefers-reduced-motion: reduce)').matches&&window.__ft3dFidelity.scene.reducedMotion===true);
    assert.deepEqual(await page.evaluate(()=>[__B.reducedMotion,__B.autoRotating]),[true,false],'B sigue la preferencia en vivo');
    await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>window.__ft3dFidelity.scene.reducedMotion===false);
    assert.deepEqual(await page.evaluate(()=>[__B.reducedMotion,__B.autoRotating]),[false,true]);
    // dispose: todo lo registrado fuera de la escena se retira; dos veces no rompe nada.
    await page.evaluate(()=>{__B.dispose();__B.dispose();});
    n=await page.evaluate(()=>window.__counts());assert.deepEqual(n,base,'tras dispose quedan exactamente los registros de antes');
    assert.equal(await page.evaluate(()=>__B.disposed),true);
    // Recrear sobre el MISMO lienzo y cambiar la preferencia.
    await page.evaluate(()=>{window.__C=window.__make();window.__C.setAuto(true);});
    n=await page.evaluate(()=>window.__counts());assert.equal(n.mm,base.mm+1,'un único listener de preferencia para la escena viva');assert.equal(n.resize,base.resize+1);assert.equal(n.ro,base.ro+1);
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.__ft3dFidelity.scene.reducedMotion===true&&__C.reducedMotion===true);
    const r=await page.evaluate(()=>({B:[__B.reducedMotion,__B.autoRotating],C:[__C.reducedMotion,__C.autoRotating],app:window.__ft3dFidelity.scene.reducedMotion}));
    assert.deepEqual(r.B,[false,true],'la escena destruida nunca se actualiza');assert.deepEqual(r.C,[true,false],'la nueva sí');assert.equal(r.app,true,'la de la Evolución también');
    // La escena recreada sobre el mismo lienzo pinta (el contexto sigue vivo tras renderer.dispose()).
    const painted=await page.evaluate(()=>{__C.load(window.__ft3dFidelity.ctx.model.inventory);__C.setState(new Map(),0);__C.renderNow();
      const c=document.querySelector('[data-lifecycle]'),t=document.createElement('canvas');t.width=c.width;t.height=c.height;const g=t.getContext('2d');g.drawImage(c,0,0);
      const d=g.getImageData(0,0,t.width,t.height).data;let n=0;for(let i=0;i<d.length;i+=4*37)if(Math.abs(d[i]-0xe7)+Math.abs(d[i+1]-0xe6)+Math.abs(d[i+2]-0xe2)>30)n++;return n;});
    assert.ok(painted>0,'la escena recreada dibuja el proyecto');
    await page.evaluate(()=>__C.dispose());assert.deepEqual(await page.evaluate(()=>window.__counts()),base);
    // Ciclos repetidos: nada se acumula.
    for(let i=0;i<5;i++)await page.evaluate(()=>window.__make().dispose());
    assert.deepEqual(await page.evaluate(()=>window.__counts()),base,'5 ciclos crear/dispose sin acumular');
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});
