'use strict';
/* OBR-02 + OBR-03 · núcleo puro de la vista del plan (siguiente tarea, % del plan, coste planificado a la fecha),
   con las fixtures sintéticas de FT3D-8 y las autoridades reales (plan 0.2.0, budgetReport, adaptador). */
const test=require('node:test'),assert=require('node:assert/strict');
const FX=require('../labs/ft3d-8/fidelity-fixtures.js'),A=require('../js/construction-project-adapter.js'),S=require('../js/construction-schedule-core.js');
const P=require('../js/construction-plan-preview-core.js');
const clone=x=>JSON.parse(JSON.stringify(x));const DAY=86400000,ms=d=>Date.parse(d+'T00:00:00Z'),iso=x=>new Date(x).toISOString().slice(0,10);
async function load(id){const c=await FX.build(id),m=await A.evaluate(c);return {c,m,report:m.costs.status==='available'?m.costs.report:null,reason:m.costs.reason};}
const snap=(o,date,extra={})=>P.snapshot({schedule:o.c.schedule,date,costReport:o.report,costUnavailableReason:o.reason,...extra});

test('antes del plan: 0 % planificado, coste 0,00 € planificado (dato real, el plan no ha empezado) y siguiente = primera tarea',async()=>{
  const o=await load('A'),tl=S.bounds(S.canonical(o.c.schedule)),pre=iso(ms(tl.startDate)-DAY);
  const s=snap(o,pre);assert.equal(s.state,'available');assert.equal(s.progress.percent,0);assert.equal(s.progress.label,'planificado');
  assert.equal(s.cost.status,'available');assert.equal(s.cost.amount,0);assert.equal(s.cost.plannedTotal,19717.64);
  assert.equal(s.next.daysUntil,1);assert.equal(s.next.tasks[0].wbs,'01');assert.equal(s.executed.status,'not-recorded');
});
test('al final del plan: 100 %, coste = total planificado, sin siguiente tarea',async()=>{
  const o=await load('A'),tl=S.bounds(S.canonical(o.c.schedule)),after=iso(ms(tl.endDate)+DAY);
  const s=snap(o,after);assert.equal(s.progress.percent,100);assert.equal(s.cost.amount,19717.64);assert.equal(s.next.state,'none');assert.equal(s.next.reason,'plan-finished');
});
test('% del plan = días planificados transcurridos ponderados por duración; es monótono en el tiempo',async()=>{
  const o=await load('A'),canon=S.canonical(o.c.schedule),tl=S.bounds(canon);let prev=-1;
  for(let d=ms(tl.startDate)-DAY;d<=ms(tl.endDate)+DAY;d+=DAY){const s=snap(o,iso(d));assert.ok(s.progress.percent>=prev);prev=s.progress.percent;
    const st=S.stateAt(canon,iso(d)),dur=t=>(ms(t.endDate)-ms(t.startDate))/DAY+1;
    const want=Math.round(1000*st.tasks.reduce((a,t)=>a+t.visualProgress*dur(t),0)/canon.tasks.reduce((a,t)=>a+dur(t),0))/10;assert.equal(s.progress.percent,want);}
});
test('coste a la fecha = Σ importe asignado × avance planificado (céntimos), nunca por encima del total',async()=>{
  const o=await load('A'),canon=S.canonical(o.c.schedule),mid=canon.tasks[2].startDate,s=snap(o,mid),st=S.stateAt(canon,mid);
  const f=new Map(st.tasks.map(t=>[t.id,t.visualProgress]));
  const want=Math.round(o.report.byTask.reduce((a,r)=>a+r.lines.reduce((b,l)=>b+Math.round(l.allocatedNet*100)*(f.get(r.taskId)||0),0),0))/100;
  assert.equal(s.cost.amount,want);assert.ok(s.cost.amount<=s.cost.plannedTotal);assert.match(s.cost.assumption,/Reparto lineal/);
});
test('sin presupuesto vinculado o con el del edificio sin repartir: «No disponible» con su motivo, nunca 0',async()=>{
  const b=await load('B'),s=snap(b,b.c.schedule.tasks[1].startDate);
  assert.equal(s.cost.status,'unavailable');assert.equal(s.cost.amount,null);assert.match(s.cost.message,/edificio todavía no se reparten/);
  assert.ok(s.progress.percent>0,'el % del plan sí existe: es plan, no dinero');
  const a=await load('A'),n=P.snapshot({schedule:a.c.schedule,date:a.c.schedule.tasks[3].startDate,costReport:null});assert.equal(n.cost.amount,null);assert.match(n.cost.message,/No disponible/);
});
test('reparto de otro plan: no se usa',async()=>{const a=await load('A'),r=clone(a.report);r.scheduleId='sch_otro';
  assert.equal(P.snapshot({schedule:a.c.schedule,date:a.c.schedule.tasks[2].startDate,costReport:r}).cost.reason,'report-other-plan');});
test('partidas sin importe en tareas empezadas: coste PARCIAL (importe conocido) y se dice cuáles',async()=>{
  const a=await load('A'),r=clone(a.report);const row=r.byTask.find(x=>x.lines.length);row.lines[0].allocatedNet=null;
  const t=S.canonical(a.c.schedule).tasks.find(x=>x.id===row.taskId),s=P.snapshot({schedule:a.c.schedule,date:t.endDate,costReport:r});
  assert.equal(s.cost.status,'partial');assert.equal(s.cost.amount,null);assert.ok(s.cost.knownAmount>=0);assert.equal(s.cost.plannedTotal,null);
  assert.deepEqual(s.cost.unknownItems.map(u=>u.taskId),[row.taskId]);
});
test('sin asignaciones de partidas a tareas: «No disponible»',async()=>{const a=await load('A'),r=clone(a.report);r.byTask.forEach(x=>{x.lines=[];});
  assert.equal(P.snapshot({schedule:a.c.schedule,date:a.c.schedule.tasks[1].startDate,costReport:r}).cost.reason,'no-allocation');});
test('OBR-02: siguiente tarea con WBS, fechas, dependencias declaradas (tipo, desfase y estado planificado del predecesor) y elementos',async()=>{
  const o=await load('A'),canon=S.canonical(o.c.schedule),t1=canon.tasks[0];const s=snap(o,t1.startDate);
  const n=s.next.tasks[0],t=canon.tasks.find(x=>x.id===n.id);assert.equal(n.startDate,t.startDate);assert.equal(n.daysUntil,(ms(t.startDate)-ms(t1.startDate))/DAY);
  assert.deepEqual(n.dependsOn.map(d=>[d.taskId,d.type,d.lagDays]),t.dependsOn.map(d=>[d.taskId,d.type,d.lagDays]));
  assert.equal(n.dependsOn[0].predecessorPlanned,'in-progress');assert.deepEqual(n.previewElementIds,[...new Set(t.elements.map(e=>e.elementId))]);
});
test('OBR-02: tareas que empiezan el mismo día salen juntas, ordenadas por WBS; una tarea en curso no es «siguiente»',async()=>{
  const o=await load('A'),s0=clone(o.c.schedule),t=s0.tasks;const last=t[t.length-1];
  const twin={...clone(last),id:last.id+'-gemela',wbs:'99',title:'Gemela',dependsOn:[],elementIds:[],budgetItemIds:[]};delete twin.elements;delete twin.budgetAllocations;s0.tasks.push(twin);
  const day=iso(ms(last.startDate)-DAY),s=P.snapshot({schedule:s0,date:day});assert.deepEqual(s.next.tasks.map(x=>x.wbs),[last.wbs,'99']);
  const during=P.snapshot({schedule:s0,date:last.startDate});assert.ok(!during.next.tasks||!during.next.tasks.some(x=>x.id===last.id));
});
test('tarea «cancelada» (estado ajeno al contrato): no se calcula nada, y se explica',async()=>{
  const o=await load('A'),s0=clone(o.c.schedule);s0.tasks[2].status='cancelled';
  assert.equal(S.canonical(s0).tasks.length,o.c.schedule.tasks.length,'el contrato la aceptaría en silencio como planificada');
  const s=P.snapshot({schedule:s0,date:s0.tasks[0].startDate,costReport:o.report});
  assert.equal(s.state,'unavailable');assert.equal(s.reason,'unsupported-task-state');assert.equal(s.progress,null);assert.equal(s.cost.amount,null);assert.equal(s.next,null);
  assert.match(s.message,/status=cancelled/);
});
test('tarea sin fechas o plan inválido: el validador lo rechaza y no hay % ni coste (nunca 0)',async()=>{
  const o=await load('A'),s0=clone(o.c.schedule);delete s0.tasks[1].endDate;
  const s=P.snapshot({schedule:s0,date:o.c.schedule.tasks[0].startDate,costReport:o.report});assert.equal(s.state,'unavailable');assert.equal(s.reason,'plan-rejected');assert.equal(s.progress,null);
  assert.equal(P.snapshot({schedule:null,date:'2027-01-01'}).reason,'no-plan');
  assert.equal(P.snapshot({schedule:o.c.schedule,date:'mañana'}).reason,'no-date');
});
test('actualización reproducible: mismas entradas → mismo resultado; si cambia el plan, cambia la huella y la siguiente tarea',async()=>{
  const o=await load('A'),d=o.c.schedule.tasks[0].startDate;assert.deepEqual(snap(o,d),snap(o,d));
  const s0=clone(o.c.schedule);const t=s0.tasks.find(x=>x.wbs==='02');const shift=7;
  // Se retrasa la tarea 02 y todo lo que depende de ella, manteniendo el plan válido.
  for(const x of s0.tasks)if(x.wbs>='02'){x.startDate=iso(ms(x.startDate)+shift*DAY);x.endDate=iso(ms(x.endDate)+shift*DAY);}
  const a=P.snapshot({schedule:o.c.schedule,date:d}),b=P.snapshot({schedule:s0,date:d});
  assert.notEqual(a.planKey,b.planKey);assert.equal(b.next.daysUntil,a.next.daysUntil+shift);assert.equal(b.progress.percent,a.progress.percent,'el primer día solo avanza la 01, que no se ha movido');
  const later=iso(ms(t.startDate)-shift*DAY+2*DAY);assert.ok(P.snapshot({schedule:s0,date:later}).progress.percent<P.snapshot({schedule:o.c.schedule,date:later}).progress.percent,'con la 02 retrasada, menos plan transcurrido');
});
test('ningún resultado llama «ejecutado» a lo planificado',async()=>{const o=await load('A');const s=snap(o,o.c.schedule.tasks[2].startDate);
  const txt=JSON.stringify(s);assert.ok(!/"executed":\{"status":"(recorded|done)/.test(txt));assert.match(s.disclaimer,/PLANIFICADOS, no avance real/);});
