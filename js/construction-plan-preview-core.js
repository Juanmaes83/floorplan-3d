/* OBR-02 + OBR-03 · Vista del PLAN en la Evolución 4D (FT3D-8). Núcleo puro: no crea un segundo plan, no guarda nada y
   no convierte el plan en avance real. Todo sale de dos autoridades existentes:
   - FloorPlanConstructionSchedule (contrato del plan, 0.2.0): validate/canonical para las tareas y stateAt para el avance
     PLANIFICADO de cada tarea en una fecha;
   - su budgetReport (reparto de las partidas C1–C4 por tarea, con lo desconocido como null).

   OBR-02 · Siguiente tarea planificada: la(s) que empiezan en la primera fecha posterior al día mostrado, con su WBS,
   fechas, dependencias declaradas (tipo y desfase) y los elementos del modelo que aparecerán (para el fantasma).
   OBR-03 · Anillo «% del plan» (planificado) y coste planificado a la fecha:
   - % = Σ(avance planificado × duración) / Σ duración, con el avance de stateAt; es PLAN, no obra ejecutada;
   - coste = Σ(importe asignado a cada tarea × su avance planificado): reparto lineal por duración (supuesto rotulado).
     Solo con un enlace C1–C4 verificable (presupuesto del mismo sujeto y asignaciones a partidas existentes). Sin eso,
     «No disponible», nunca cero. Si una tarea ya empezada tiene partidas sin importe, el coste es PARCIAL y se dice.
   - Ejecutado: siempre «sin registrar» (el contrato reserva executionRecords; RUBIK no registra avance real).

   Estados que el contrato no admite (tareas «canceladas», tareas sin fechas): el validador rechaza las tareas sin
   fechas; un campo de estado que no forma parte del contrato se descartaría en silencio y la tarea contaría como
   planificada. Aquí se detecta y NO se calcula nada (ni %, ni coste, ni siguiente tarea) para no contar trabajo cancelado. */
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const api=factory(node?require('./construction-schedule-core.js'):root.FloorPlanConstructionSchedule);
  if(node)module.exports=api;else root.FloorPlanPlanPreview=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(S){
  'use strict';
  if(!S||typeof S.stateAt!=='function')throw Error('FloorPlanPlanPreview requiere FloorPlanConstructionSchedule.');
  const SCHEMA='rubik-sota.plan-preview',VERSION='1.0.0',DAY=86400000;
  const ms=d=>Date.parse(d+'T00:00:00Z'),iso=x=>new Date(x).toISOString().slice(0,10);
  const r1=x=>Math.round(x*10)/10,cents=x=>Math.round(x*100);
  const STATUS_FIELDS=['status','state','cancelled','canceled','estado'];
  const APPEAR=['site','build','structure','envelope','services'];
  // Huella estable del plan tal y como llega (FNV-1a sobre el JSON canónico): cambia si cambia cualquier dato del plan.
  function planKey(canon){const t=JSON.stringify(canon);let h=0x811c9dc5;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return canon.id+':'+h.toString(16).padStart(8,'0');}
  const unavailable=(reason,message,extra={})=>({schema:SCHEMA,version:VERSION,state:'unavailable',reason,message,
    progress:null,cost:{status:'unavailable',reason,message,amount:null},next:null,executed:EXECUTED,...extra});
  // Motivos del adaptador existente (construction-project-adapter) en palabras: no se inventa ninguno.
  const COST_REASONS={missing:'no hay un presupuesto C1–C4 de este proyecto','budget-other-project':'el presupuesto es de otro proyecto','level-budget-not-building':'el presupuesto es de una planta, no del edificio',
    'building-budget-not-supported':'los presupuestos por edificio todavía no se reparten entre tareas','planning-unavailable':'no hay plan válido','report-failed':'el reparto del presupuesto entre tareas ha fallado',
    'schedule-invalid':'el plan no es válido','schedule-other-project':'el plan es de otro proyecto','no-budget-link':'no hay un presupuesto C1–C4 vinculado a este plan'};
  const EXECUTED=Object.freeze({status:'not-recorded',label:'Sin registrar: RUBIK no registra avance real de obra; todo lo de aquí es plan.'});

  /* Tareas con un estado ajeno al contrato (p. ej. cancelada) en el plan TAL Y COMO LLEGA. */
  function unsupportedStates(raw){
    const out=[];for(const t of Array.isArray(raw?.tasks)?raw.tasks:[])for(const f of STATUS_FIELDS)if(t&&Object.prototype.hasOwnProperty.call(t,f))out.push({taskId:t.id??null,field:f,value:t[f]});
    return out;
  }

  /* schedule: plan en bruto (como se cargó). date: día mostrado (YYYY-MM-DD). costReport: S.budgetReport(...) o null.
     costUnavailableReason: por qué no hay reparto (lo dice el adaptador existente), si costReport es null. */
  function snapshot({schedule,date,costReport=null,costUnavailableReason=null}){
    if(!schedule)return unavailable('no-plan','Sin plan de obra: no hay % del plan ni coste planificado.');
    const odd=unsupportedStates(schedule);
    if(odd.length)return unavailable('unsupported-task-state',`El plan marca ${odd.length} tarea(s) con un estado que el contrato no admite (${[...new Set(odd.map(o=>`${o.field}=${o.value}`))].join(', ')}): no se calcula nada para no contar trabajo cancelado como planificado. Corrige el plan quitando esas tareas o sus fechas.`,{unsupported:odd});
    let canon;try{canon=S.canonical(schedule);}catch(e){return unavailable('plan-rejected','El plan no es válido ('+String(e.message||e).replace(/^FloorPlanConstructionSchedule:\s*/,'')+'): no se calcula ni el % ni el coste.');}
    if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return unavailable('no-date','Sin fecha: no hay momento que medir.');
    if(!canon.tasks.length)return unavailable('empty-plan','El plan no tiene tareas.');
    const st=S.stateAt(canon,date),byId=new Map(canon.tasks.map(t=>[t.id,t])),frac=new Map(st.tasks.map(t=>[t.id,t.visualProgress]));
    const dur=t=>Math.round((ms(t.endDate)-ms(t.startDate))/DAY)+1;
    // OBR-03 · % del plan (planificado).
    let num=0,den=0,done=0,running=0,pending=0;
    for(const t of canon.tasks){const f=frac.get(t.id)||0,d=dur(t);num+=f*d;den+=d;if(f>=1)done++;else if(f>0)running++;else pending++;}
    const progress={percent:r1(100*num/den),basis:'Duración planificada de cada tarea (días de calendario)',label:'planificado',
      tasks:{total:canon.tasks.length,completedPlanned:done,inProgressPlanned:running,pendingPlanned:pending},evidence:st.evidence,dataStatus:st.dataStatus};
    // OBR-03 · coste planificado a la fecha.
    let cost;
    if(!costReport){const r=costUnavailableReason||'no-budget-link';cost={status:'unavailable',reason:r,amount:null,message:`No disponible: ${COST_REASONS[r]||'sin enlace verificable con el presupuesto ('+r+')'}.`};}
    else if(costReport.scheduleId!==canon.id)cost={status:'unavailable',reason:'report-other-plan',amount:null,message:'No disponible: el reparto del presupuesto es de otro plan.'};
    else{
      const rows=costReport.byTask.filter(r=>r.lines.length);
      if(!rows.length)cost={status:'unavailable',reason:'no-allocation',amount:null,message:'No disponible: ninguna tarea del plan tiene partidas del presupuesto asignadas.'};
      else{
        let known=0,total=0;const unknown=[];let totalKnown=true;
        for(const r of costReport.byTask){const f=frac.get(r.taskId)||0;
          for(const l of r.lines){if(l.allocatedNet===null){totalKnown=false;if(f>0)unknown.push({taskId:r.taskId,itemId:l.itemId});continue;}
            known+=cents(l.allocatedNet)*f;total+=cents(l.allocatedNet);}}
        const amount=Math.round(known)/100,plannedTotal=total/100;
        cost={status:unknown.length?'partial':'available',amount:unknown.length?null:amount,knownAmount:amount,unknownItems:unknown,
          plannedTotal:totalKnown?plannedTotal:null,plannedTotalKnown:plannedTotal,currency:'EUR',vat:'sin IVA',label:'Coste planificado a la fecha',
          assumption:'Reparto lineal del importe de cada tarea a lo largo de sus días planificados (supuesto de planificación, no gasto).',
          revisionCheck:costReport.projectRevision?.check??'unverifiable',
          message:unknown.length?`Parcial: ${unknown.length} partida(s) de tareas ya empezadas no tienen importe; se muestra solo lo conocido.`:null,
          unassignedBudgetItems:costReport.unassignedBudgetItemIds?.length||0};
      }
    }
    // OBR-02 · siguiente(s) tarea(s): primera fecha de inicio posterior al día mostrado.
    const day=ms(date),later=canon.tasks.filter(t=>ms(t.startDate)>day);let next;
    if(!later.length)next={state:'none',reason:canon.tasks.every(t=>ms(t.endDate)<day)?'plan-finished':'no-later-start',
      message:canon.tasks.every(t=>ms(t.endDate)<day)?'El plan ya está completado en esta fecha.':'Ninguna tarea empieza después de esta fecha; las que quedan ya están en curso.'};
    else{const first=Math.min(...later.map(t=>ms(t.startDate)));
      const tasks=later.filter(t=>ms(t.startDate)===first).sort((a,b)=>a.wbs.localeCompare(b.wbs,'es',{numeric:true})||a.id.localeCompare(b.id)).map(t=>({
        id:t.id,wbs:t.wbs,title:t.title,startDate:t.startDate,endDate:t.endDate,durationDays:dur(t),daysUntil:Math.round((ms(t.startDate)-day)/DAY),
        dependsOn:t.dependsOn.map(d=>{const p=byId.get(d.taskId);return {taskId:d.taskId,wbs:p?.wbs??null,title:p?.title??null,type:d.type,lagDays:d.lagDays,
          predecessorPlanned:(frac.get(d.taskId)||0)>=1?'completed':(frac.get(d.taskId)||0)>0?'in-progress':'pending'};}),
        elements:t.elements.map(e=>({elementId:e.elementId,role:e.role})),
        previewElementIds:[...new Set(t.elements.map(e=>e.elementId))],appearElementIds:[...new Set(t.elements.filter(e=>APPEAR.includes(e.role)).map(e=>e.elementId))]}));
      next={state:'planned',startDate:iso(first),daysUntil:Math.round((first-day)/DAY),tasks,label:'planificado'};}
    return {schema:SCHEMA,version:VERSION,state:'available',date,scheduleId:canon.id,planKey:planKey(canon),progress,cost,next,executed:EXECUTED,
      disclaimer:'Plan de obra: el anillo, el coste y la siguiente tarea son PLANIFICADOS, no avance real ni certificación.'};
  }
  return Object.freeze({SCHEMA,VERSION,snapshot,unsupportedStates,planKey,COST_REASONS});
});
