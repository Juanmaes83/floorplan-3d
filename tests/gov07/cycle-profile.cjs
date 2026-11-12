'use strict';
/* GOV-07 · perfil de recursos por ciclo del «uso prolongado» (diagnóstico reproducible, no es una prueba de CI).
   Repite EXACTAMENTE el ciclo de tests/gov07-evolution-resilience.browser.test.cjs (show → Proyecto → Evolución →
   reproducir → Entrega → pausa → Evolución → setPos(i*7)) y mide en cada ciclo, con la sonda resource-probe.cjs:
     at  = en la posición en la que termina el ciclo (lo que medía la prueba original: base en el ciclo 0, final en el 20)
     end = al final del plan, tras pintar (mismo momento en todos los ciclos)
   Uso: node tests/gov07/cycle-profile.cjs [ciclos=20] [salida.json]   (GOV07_ROOT=<árbol> para medir otro árbol)
   Opcional: GOV07_SWITCH=1 alterna los casos A y B (cambio de proyecto) en cada ciclo. */
const K=require('./kit.cjs'),R=require('./resource-probe.cjs'),fs=require('node:fs');
(async()=>{
  const N=Number(process.argv[2]||20),out=process.argv[3]||null,env=await K.start();
  const {context,page,watch}=await K.openEvolution(env);
  try{
    const cdp=await context.newCDPSession(page);await cdp.send('DOMDebugger.enable').catch(()=>{});
    const gc=()=>cdp.send('HeapProfiler.collectGarbage');
    await R.install(page);
    const tab=name=>page.evaluate(n=>document.getElementById('tab-'+n)?.click(),name);
    const cycle=async i=>{
      if(process.env.GOV07_SWITCH)await page.evaluate(i=>window.__ft3dFidelity.loadCase(i%2?'B':'A'),i);
      else await page.evaluate(async()=>{const f=window.__ft3dFidelity;await f.show(f.ctx.input,f.ctx.meta);});
      await tab('proyecto');await tab('evolucion');await page.evaluate(()=>window.__ft3dFidelity.play());await page.waitForTimeout(150);
      await tab('entrega');await page.evaluate(()=>window.__ft3dFidelity.pause());await tab('evolucion');
      await page.evaluate(i=>window.__ft3dFidelity.setPos(i%window.__ft3dFidelity.timeline.positions),i*7);};
    const rows=[];
    for(let i=0;i<=N;i++){
      await cycle(i);await K.frames(page,4);
      const at=await R.measure(page,gc,'at');
      const lis={gantt:await R.listeners(cdp,page,"document.getElementById('gantt')"),window:await R.listeners(cdp,page,'window')};
      await page.evaluate(()=>window.__ft3dFidelity.end());await K.frames(page,4);
      const end=await R.measure(page,gc,'end');
      rows.push({cycle:i,at,end,listeners:lis});
      process.stderr.write(`ciclo ${String(i).padStart(2)} · pos ${String(at.pos).padStart(6)} · three.geo at/end ${at.three.geometries}/${end.three.geometries} · gl.buffers ${end.gl.buffers} · geo vivas fuera de escena ${end.geometries.aliveOffScene} · mat vivos fuera ${end.materials.aliveOffScene} (creados ${end.materials.created}, liberados ${end.materials.disposed}) · gantt pointerdown ${lis.gantt?.pointerdown||0} · heap ${end.heapMB} MB\n`);
    }
    const res={root:K.ROOT,cycles:N,switchProjects:!!process.env.GOV07_SWITCH,errors:watch.errors,rows};
    if(out)fs.writeFileSync(out,JSON.stringify(res,null,1));
  }finally{await context.close();await env.stop();}
})().catch(e=>{console.error(e);process.exit(1);});
