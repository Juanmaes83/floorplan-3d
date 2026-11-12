'use strict';
/* OBR-01 · EX-11-k.6 — movimiento reducido aplicado en la animación 3D, medido CUADRO A CUADRO (pose real de la cámara en
   cada requestAnimationFrame). Defecto reproducido en master eae8cf6: con prefers-reduced-motion: reduce la vista AUTO
   seguía girando (90 de 90 cuadros distintos). Obra sintética del examen; ningún dato real.
   Antes/después: OBR01_ROOT=<árbol master> node --test tests/obr01-ex11-reduced-motion.browser.test.cjs (falla). */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const K=require('./obr01/browser-kit.cjs');
let env;
before(async()=>{env=await K.start();});
after(async()=>{await env?.stop();});
// Poses de cámara en N cuadros consecutivos (posición + objetivo, 4 decimales).
const frames=(page,n)=>page.evaluate(async n=>{const F=window.__ft3dFidelity,out=[];for(let i=0;i<n;i++){await new Promise(r=>requestAnimationFrame(r));
  const p=F.scene.pose;out.push([...p.position,...p.target].map(v=>v.toFixed(4)).join(','));}return out;},n);
const view=(page,v)=>page.evaluate(v=>document.querySelector(`[data-view="${v}"]`).click(),v);

test('EX-11-k.6 · con movimiento reducido, AUTO no gira: 90 cuadros con la misma pose de cámara',{timeout:300000},async()=>{
  const s=await K.openEvolution(env,{reducedMotion:'reduce'});
  try{assert.equal(await s.page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
    await view(s.page,'auto');const f=await frames(s.page,90);
    assert.equal(new Set(f).size,1,`la cámara no se mueve sola (${new Set(f).size} poses distintas en 90 cuadros)`);
    assert.equal(await s.page.evaluate(()=>window.__ft3dFidelity.scene.autoRotating),false);
    assert.deepEqual(s.watch.errors,[]);}
  finally{await s.context.close();}
});

test('EX-11-k.6 · con movimiento reducido, sin inercia: al soltar el arrastre la cámara se para en el mismo cuadro',{timeout:300000},async()=>{
  const s=await K.openEvolution(env,{reducedMotion:'reduce'});
  try{await view(s.page,'iso');const c=await s.page.locator('#stage').boundingBox(),x=c.x+c.width*.6,y=c.y+c.height*.55;
    await s.page.mouse.move(x,y);await s.page.mouse.down();for(let i=1;i<=8;i++)await s.page.mouse.move(x+i*25,y+i*4);await s.page.mouse.up();
    const f=await frames(s.page,45);
    assert.equal(new Set(f).size,1,`tras soltar no hay deriva por inercia (${new Set(f).size} poses distintas en 45 cuadros)`);
    // El arrastre del usuario sí ha movido la cámara (acción propia): no se bloquea la interacción.
    assert.equal(await s.page.evaluate(()=>window.__ft3dFidelity.scene.userMoved),true);}
  finally{await s.context.close();}
});

test('control de sensibilidad · sin la preferencia, AUTO sí gira (la medida detecta movimiento) y la preferencia aplicada en vivo lo detiene',{timeout:300000},async()=>{
  const s=await K.openEvolution(env,{reducedMotion:'no-preference'});
  try{await view(s.page,'auto');const f=await frames(s.page,60);
    assert.ok(new Set(f).size>30,`sin preferencia la órbita AUTO se mueve (${new Set(f).size} poses)`);
    await s.page.emulateMedia({reducedMotion:'reduce'});await frames(s.page,3);
    const g=await frames(s.page,60);
    assert.equal(new Set(g).size,1,`al activar la preferencia en vivo la órbita se detiene (${new Set(g).size} poses)`);}
  finally{await s.context.close();}
});

test('EX-11-k.6 · la reproducción iniciada por el usuario sigue funcionando con movimiento reducido (avanza el día)',{timeout:300000},async()=>{
  const s=await K.openEvolution(env,{reducedMotion:'reduce'});
  try{await s.page.evaluate(()=>window.__ft3dFidelity.setPos(0));const d0=await s.page.evaluate(()=>window.__ft3dFidelity.last?.date);
    await s.page.locator('#play').click();await s.page.waitForTimeout(1500);await s.page.locator('#play').click();
    const d1=await s.page.evaluate(()=>window.__ft3dFidelity.last?.date);
    assert.ok(d1&&d0&&d1>d0,`la fecha avanza al reproducir (${d0} → ${d1})`);assert.deepEqual(s.watch.errors,[]);assert.deepEqual(s.watch.external,[]);}
  finally{await s.context.close();}
});
