'use strict';
/* OBR-01 · QA-22 — volumen. El examen M2/S4 midió hasta ~1200 elementos. Aquí se mide hasta el LÍMITE DEL CONTRATO
   FloorPlanProjectV1 (2000 muros): la vivienda del examen repetida 28 veces = 2941 elementos, con un plan DISPERSO
   (selectores del examen: 3 elementos por tarea) y uno DENSO (todos los elementos de cada tipo). Chromium con
   SwiftShader (CPU, sin GPU): los tiempos son de ESTE equipo y no representan hardware de cliente; los presupuestos son
   holgados (detectan bloqueos y regresiones de orden de magnitud, no rendimiento fino). Métricas -> OBR01_METRICS.
   La medida en GPU y dispositivos reales es humana (protocolo GOV-07). Obra sintética; ningún dato real. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const K=require('./obr01/browser-kit.cjs');
const COPIES=Number(process.env.OBR01_QA22_COPIES||28),BUDGET={openMs:90000,setPosMs:1500,pickMs:250};
let env;const metrics=[];
before(async()=>{env=await K.start();});
after(async()=>{await env?.stop();if(process.env.OBR01_METRICS)await fs.writeFile(process.env.OBR01_METRICS,JSON.stringify({copies:COPIES,metrics},null,1));});
async function measure(label,tasks){
  const project=K.FX.Q.viviendaGrande(COPIES);
  assert.ok(project.walls.length<=2000,'dentro del límite del contrato');
  const s=await K.openEvolution(env,{fixture:{project,...(tasks?{tasks}:{})}});
  try{const T02=K.FX.elementsOf(s.fixture.schedule,'T02');
    const m=await s.page.evaluate(async T02=>{const F=window.__ft3dFidelity,c=document.getElementById('stage').getBoundingClientRect(),raf=()=>new Promise(r=>requestAnimationFrame(r));
      document.querySelector('[data-view="iso"]').click();await raf();
      let a=performance.now();for(let i=0;i<20;i++)F.setPos(i*0.37);const setPosMs=(performance.now()-a)/20;
      const dts=[];let t=performance.now();for(let i=0;i<30;i++){await raf();const n=performance.now();dts.push(n-t);t=n;}dts.sort((x,y)=>x-y);
      F.setDate('2027-05-13');document.querySelector('[data-view="top"]').click();await new Promise(r=>setTimeout(r,400));
      const k=T02.at(-1),b=F.scene.screenBounds(k,{exact:true});let reach=null,pickMs=0,np=0;
      if(b)outer:for(let i=0;i<=12;i++)for(let j=0;j<=12;j++){const nx=b.x0+(b.x1-b.x0)*i/12,ny=b.y0+(b.y1-b.y0)*j/12,x=c.left+(nx+1)/2*c.width,y=c.top+(1-ny)/2*c.height;
        if(!(x>c.left&&x<c.right&&y>c.top&&y<c.bottom))continue;const q=performance.now(),p=F.scene.pick(x,y);pickMs+=performance.now()-q;np++;if(p===k){reach={x,y};break outer;}}
      return {objects:F.scene.objectCount,scheduled:F.ctx.model.visualElements.filter(v=>v.tasks.length).length,setPosMs:+setPosMs.toFixed(1),
        frameMedianMs:+dts[15].toFixed(1),frameP90Ms:+dts[27].toFixed(1),pickMs:+(pickMs/Math.max(1,np)).toFixed(2),lastT02:k,reach,
        heapMB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):null};},T02);
    if(m.reach){await s.page.mouse.click(m.reach.x,m.reach.y);await s.page.waitForTimeout(300);}
    const panel=await s.page.evaluate(()=>{const b=document.getElementById('pickInfo');return b.hidden?null:b.dataset.key;});
    const row={plan:label,elements:s.fixture.inventory.elements.length,walls:project.walls.length,openMs:s.loadMs,...m,clickPanel:panel};metrics.push(row);
    assert.ok(s.loadMs<BUDGET.openMs,`abre en <${BUDGET.openMs} ms (${s.loadMs})`);
    assert.ok(m.setPosMs<BUDGET.setPosMs,`cambiar el momento <${BUDGET.setPosMs} ms (${m.setPosMs})`);
    assert.ok(m.pickMs<BUDGET.pickMs,`raycast <${BUDGET.pickMs} ms (${m.pickMs})`);
    assert.equal(panel,m.lastT02,'el muro de carga de la copia más lejana se selecciona con un clic real');
    assert.deepEqual(s.watch.errors,[]);assert.deepEqual(s.watch.external,[]);
    return row;}
  finally{await s.context.close();}
}
test(`QA-22 · ×${COPIES} (límite del contrato) con el plan del examen (disperso): abre, se mueve en el tiempo y se selecciona`,{timeout:900000},async()=>{
  const r=await measure('disperso');assert.ok(r.elements>2500,`volumen real (${r.elements} elementos)`);});
test(`QA-22 · ×${COPIES} con plan DENSO (todo el modelo crece y se tiñe): abre, se mueve en el tiempo y se selecciona`,{timeout:900000},async()=>{
  const r=await measure('denso',K.FX.tareasDensas());assert.ok(r.scheduled>2000,`casi todo con tarea (${r.scheduled})`);});
