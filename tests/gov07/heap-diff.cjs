'use strict';
/* GOV-07 · qué objetos JS crecen entre dos momentos del uso prolongado (diagnóstico, no es prueba de CI).
   Ciclos 1..A, instantánea del heap; ciclos A+1..B, otra instantánea; compara el número de objetos y bytes por
   constructor (solo nodos «object»/«closure»/«array»/«string» vivos tras GC). Uso: node heap-diff.cjs [A=10] [B=30] */
const K=require('./kit.cjs');
async function snapshot(cdp){
  const chunks=[];const h=c=>chunks.push(c.chunk);cdp.on('HeapProfiler.addHeapSnapshotChunk',h);
  await cdp.send('HeapProfiler.collectGarbage');await cdp.send('HeapProfiler.takeHeapSnapshot',{reportProgress:false,captureNumericValue:false});
  cdp.off('HeapProfiler.addHeapSnapshotChunk',h);const s=JSON.parse(chunks.join(''));
  const f=s.snapshot.meta.node_fields,N=f.length,ti=f.indexOf('type'),ni=f.indexOf('name'),si=f.indexOf('self_size'),types=s.snapshot.meta.node_types[0];
  const by=new Map();for(let i=0;i<s.nodes.length;i+=N){const t=types[s.nodes[i+ti]];if(!['object','closure','array','string','code','hidden','concatenated string','sliced string'].includes(t))continue;
    const k=t+' '+(t==='string'?'':s.strings[s.nodes[i+ni]]).slice(0,80);const e=by.get(k)||{n:0,b:0};e.n++;e.b+=s.nodes[i+si];by.set(k,e);}
  return by;
}
(async()=>{
  const A=Number(process.argv[2]||10),B=Number(process.argv[3]||30),env=await K.start(),{context,page}=await K.openEvolution(env);
  try{const cdp=await context.newCDPSession(page);await cdp.send('HeapProfiler.enable');
    const tab=n=>page.evaluate(n=>document.getElementById('tab-'+n)?.click(),n);
    const cycle=async i=>{await page.evaluate(async()=>{const f=window.__ft3dFidelity;await f.show(f.ctx.input,f.ctx.meta);});
      await tab('proyecto');await tab('evolucion');await page.evaluate(()=>window.__ft3dFidelity.play());await page.waitForTimeout(150);
      await tab('entrega');await page.evaluate(()=>window.__ft3dFidelity.pause());await tab('evolucion');
      await page.evaluate(i=>window.__ft3dFidelity.setPos(i%window.__ft3dFidelity.timeline.positions),i*7);await K.frames(page,4);};
    for(let i=0;i<=A;i++)await cycle(i);const s1=await snapshot(cdp);
    for(let i=A+1;i<=B;i++)await cycle(i);const s2=await snapshot(cdp);
    const rows=[];for(const [k,e] of s2){const o=s1.get(k)||{n:0,b:0};if(e.n!==o.n||e.b!==o.b)rows.push({k,dn:e.n-o.n,db:e.b-o.b,n:e.n});}
    rows.sort((x,y)=>y.db-x.db);const tot=rows.reduce((a,r)=>a+r.db,0);
    console.log(`ciclos ${A}→${B}: Δ ${(tot/1e6).toFixed(3)} MB en ${rows.length} grupos (por ciclo ${(tot/(B-A)/1e3).toFixed(1)} kB)`);
    for(const r of rows.slice(0,30))console.log(String(r.dn).padStart(7),String((r.db/1e3).toFixed(1)).padStart(9),'kB ',r.k,'(total',r.n+')');
  }finally{await context.close();await env.stop();}
})().catch(e=>{console.error(e);process.exit(1);});
