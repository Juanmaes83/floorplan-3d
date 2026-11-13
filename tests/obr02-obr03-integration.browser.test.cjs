'use strict';
/* Integración OBR-02/03 (#210) sobre master con OBR-01 (#207). Pruebas COMBINADAS pedidas por la auditoría de #210,
   en la Evolución real con la obra sintética del examen FT3D-8 (biblioteca local, ?source=library):
   1) con el fantasma de la siguiente tarea encendido, un clic real en un muro sólido selecciona el muro (EX-05.3);
   2) una tarea sin elementos asociados no pinta ningún fantasma ni inventa construcción;
   3) abrir el mismo proyecto sin plan después de uno con plan (mismos IDs) no deja fantasma anterior;
   4) setPreview([]) restaura exactamente la imagen, la inspección, las piezas visibles y la selección;
   5) grabar y cancelar retira el fantasma y lo repone una sola vez, sin intervalos pendientes;
   6) dispose() libera la vista previa y deja los registros como estaban; recrear sobre el mismo lienzo funciona. */
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./obr01/browser-kit.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
const MID='2027-04-14',BEFORE_HITO='2027-05-11';
const at=(page,date,view='top',roofHidden=true)=>page.evaluate(async([d,v,roof])=>{const F=window.__ft3dFidelity;F.scene.setAuto(false);F.setDate(d);document.querySelector(`[data-view="${v}"]`).click();
  const rt=document.getElementById('roofToggle');if(rt&&rt.checked===roof)rt.click();await new Promise(r=>setTimeout(r,700));},[date,view,roofHidden]);
const preview=page=>page.evaluate(()=>({...window.__ft3dFidelity.scene.preview,ui:window.__ft3dPlanPreview.ghostKeys.length,watching:window.__ft3dPlanPreview.watching}));
// Huella de lo que se ve: render explícito + muestreo de píxeles del lienzo.
const look=page=>page.evaluate(()=>{const F=window.__ft3dFidelity;F.scene.renderNow();const c=document.getElementById('stage'),t=document.createElement('canvas');t.width=c.width;t.height=c.height;const g=t.getContext('2d');g.drawImage(c,0,0);
  const d=g.getImageData(0,0,t.width,t.height).data;let h=0;for(let i=0;i<d.length;i+=4*13)h=(h*31+d[i]+d[i+1]*3+d[i+2]*7)>>>0;
  const r=c.getBoundingClientRect(),picks=[];for(let i=1;i<20;i++)for(let j=1;j<14;j++)picks.push(F.scene.pick(r.left+r.width*i/20,r.top+r.height*j/14));
  return {hash:h,visible:F.visiblePieces,inspect:JSON.stringify(F.inspect()),picks:picks.join('|')};});

test('1 · fantasma encendido y clic real en un muro sólido de T02: se selecciona el muro',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    await at(page,MID);const p=await preview(page);assert.ok(p.shown>0,'hay fantasma de la siguiente tarea');
    const key='project/wal_ref-w0';
    const pt=await page.evaluate(k=>{const F=window.__ft3dFidelity,c=document.getElementById('stage').getBoundingClientRect(),b=F.scene.screenBounds(k,{exact:true});if(!b)return null;
      for(let i=0;i<=12;i++)for(let j=0;j<=12;j++){const nx=b.x0+(b.x1-b.x0)*i/12,ny=b.y0+(b.y1-b.y0)*j/12,x=c.left+(nx+1)/2*c.width,y=c.top+(1-ny)/2*c.height;
        if(x>c.left&&x<c.right&&y>c.top&&y<c.bottom&&F.scene.pick(x,y)===k)return {x,y,hits:F.scene.hitsAt(x,y)};}return null;},key);
    assert.ok(pt,'el muro es alcanzable con el fantasma encendido');
    await page.mouse.click(pt.x,pt.y);await page.waitForTimeout(400);
    assert.equal(await page.evaluate(()=>{const b=document.getElementById('pickInfo');return b.hidden?null:b.dataset.key;}),key);
    assert.equal(pt.hits[0].kind,'solid','el sólido gana a cualquier fantasma en el mismo rayo');
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('2 · la siguiente tarea no tiene elementos (hito): ningún fantasma, y se dice',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    await at(page,BEFORE_HITO,'iso',false);const p=await preview(page);
    assert.deepEqual([p.keys.length,p.shown,p.ui],[0,0,0]);
    await page.evaluate(()=>{document.querySelector('.plan-preview .pp-next-d').open=true;});
    assert.match(await page.locator('.plan-preview').innerText(),/Sin elementos del modelo vinculados/);
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('3 · el mismo proyecto sin plan después de uno con plan (mismos IDs): el fantasma anterior desaparece',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    await at(page,MID);const before=await preview(page);assert.ok(before.shown>0);
    await page.evaluate(async()=>{const F=window.__ft3dFidelity;await F.show({...F.ctx.input,schedule:null},{...F.ctx.meta});});await page.waitForTimeout(300);
    const after=await preview(page);assert.deepEqual([after.keys.length,after.shown,after.ui],[0,0,0]);
    assert.ok(await page.evaluate(k=>window.__ft3dFidelity.scene.objectCount>0&&!!window.__ft3dFidelity.scene.screenBounds(k,{exact:true}),before.keys[0]),'los mismos IDs siguen en escena, sin fantasma');
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('4 · setPreview([]) restaura exactamente imagen, inspección, piezas visibles y selección',{timeout:180000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    await at(page,MID);await page.locator('.plan-preview .pp-next-d summary').click();await page.locator('.pp-ghost').uncheck();
    const A=await look(page);assert.equal((await preview(page)).shown,0);
    await page.locator('.pp-ghost').check();const B=await look(page);assert.ok((await preview(page)).shown>0);assert.notEqual(B.hash,A.hash,'el fantasma se ve');
    await page.locator('.pp-ghost').uncheck();const C=await look(page);
    assert.deepEqual(C,A,'quitar el fantasma deja la escena exactamente como estaba');
    // Directamente sobre la API de la escena, varias veces.
    const keys=await page.evaluate(()=>window.__ft3dPlanPreview.snapshot.next.tasks.flatMap(t=>t.previewElementIds));assert.ok(keys.length>0);
    for(let i=0;i<3;i++)await page.evaluate(k=>{const s=window.__ft3dFidelity.scene;s.setPreview(k);s.setPreview([]);},keys);
    assert.deepEqual(await look(page),A);assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('5 · grabar y cancelar: sin fantasma mientras graba; vuelve una sola vez y sin intervalos pendientes',{timeout:240000},async()=>{
  const {context,page,watch}=await K.openEvolution(env);try{
    await at(page,MID,'iso',false);assert.ok((await preview(page)).shown>0);
    await page.evaluate(()=>{const s=window.__ft3dFidelity.scene,o=s.setPreview;window.__setPreviewCalls=[];s.setPreview=k=>{window.__setPreviewCalls.push(k.length);return o(k);};
      window.__ft3dUI?.reveal('#deliverPanel');document.querySelectorAll('#deliverPanel details:not(#publishBox)').forEach(d=>d.open=true);});
    await page.locator('#videoGo').click();await page.waitForFunction(()=>window.__ft3dDelivery.state.recording?.progress>0,null,{timeout:120000});
    const during=await preview(page);assert.deepEqual([during.keys.length,during.shown],[0,0]);assert.equal(during.watching,true);
    await page.evaluate(()=>window.__ft3dDelivery.state.recording.controller.abort());await page.waitForFunction(()=>!window.__ft3dDelivery.state.recording,null,{timeout:120000});
    await page.waitForFunction(()=>window.__ft3dFidelity.scene.preview.shown>0&&!window.__ft3dPlanPreview.watching,null,{timeout:10000});
    await page.waitForTimeout(1200);const calls=await page.evaluate(()=>window.__setPreviewCalls);
    assert.equal(calls.filter(n=>n>0).length,1,`el fantasma se repone una sola vez (${JSON.stringify(calls)})`);
    assert.equal((await preview(page)).watching,false,'sin intervalos pendientes');
    assert.deepEqual(watch.errors.filter(e=>!/abort/i.test(e)),[]);
  }finally{await context.close();}
});

test('6 · dispose libera la vista previa y deja los registros como estaban; recrear sobre el mismo lienzo funciona',{timeout:180000},async()=>{
  const init=()=>{const RM='(prefers-reduced-motion: reduce)',reg=window.__reg={mm:new Set(),resize:new Set(),ro:new Set()};
    const a=MediaQueryList.prototype.addEventListener,r=MediaQueryList.prototype.removeEventListener;
    MediaQueryList.prototype.addEventListener=function(t,f,o){if(t==='change'&&this.media===RM)reg.mm.add(f);return a.call(this,t,f,o);};
    MediaQueryList.prototype.removeEventListener=function(t,f,o){if(t==='change'&&this.media===RM)reg.mm.delete(f);return r.call(this,t,f,o);};
    const wa=window.addEventListener.bind(window),wr=window.removeEventListener.bind(window);
    window.addEventListener=(t,f,o)=>{if(t==='resize')reg.resize.add(f);return wa(t,f,o);};window.removeEventListener=(t,f,o)=>{if(t==='resize')reg.resize.delete(f);return wr(t,f,o);};
    const RO=window.ResizeObserver;window.ResizeObserver=class extends RO{observe(...x){reg.ro.add(this);return super.observe(...x);}disconnect(){reg.ro.delete(this);return super.disconnect();}};
    window.__counts=()=>({mm:reg.mm.size,resize:reg.resize.size,ro:reg.ro.size});};
  const {context,page,watch}=await K.openEvolution(env,{init});try{
    await at(page,MID);const base=await page.evaluate(()=>window.__counts());
    const r=await page.evaluate(async()=>{const {createProjectScene}=await import(new URL('../evolucion/project-scene.js',location.href).href);const F=window.__ft3dFidelity;
      const c=document.createElement('canvas');c.style.cssText='position:fixed;left:0;top:0;width:320px;height:200px';document.body.append(c);
      const keys=F.scene.preview.keys,B=createProjectScene(c);B.load(F.ctx.model.inventory);B.setState(new Map(),0);const shownB=B.setPreview(keys);
      // load() de otro proyecto (o del mismo, con IDs repetidos) no arrastra la vista previa anterior.
      B.load(F.ctx.model.inventory);B.setState(new Map(),0);const afterLoad={...B.preview};B.setPreview(keys);
      B.dispose();const afterB={...B.preview};
      const C=createProjectScene(c);C.load(F.ctx.model.inventory);C.setState(new Map(),0);const shownC=C.setPreview(keys);C.dispose();
      return {shownB,afterLoad,afterB,shownC};});
    assert.ok(r.shownB>0&&r.shownC>0,'la vista previa funciona antes y después de recrear');
    assert.deepEqual([r.afterLoad.keys.length,r.afterLoad.shown],[0,0],'load() vacía la vista previa del proyecto anterior');
    assert.deepEqual([r.afterB.keys.length,r.afterB.shown],[0,0],'dispose vacía la vista previa');
    assert.deepEqual(await page.evaluate(()=>window.__counts()),base,'registros idénticos a la base');
    assert.ok((await preview(page)).shown>0,'la escena de la Evolución no se ve afectada');
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});
